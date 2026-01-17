import type { SessionPayload, RawMetricPoint } from "../storage/sessionStore";

export type ComputedMetricPoint = RawMetricPoint & {
  engagement: number; // 0..1
  // emotion already in RawMetricPoint, but keeping for compatibility
};

export type Report = {
  scores: {
    satisfaction: number; // 1..5
    ease: number; // 1..5
    clarity: number; // 1..5
  };
  tone: "Positive" | "Mixed" | "Negative";
  insights: string[];
  moments: {
    stress: Array<{ t: number; hr: number; br: number }>;
    engagementLow: Array<{ t: number; eng: number }>;
  };
  microQuestion: string | null;
  confidence: number; // 0..1
};

/**
 * Compute engagement score from raw signals.
 * - If offScreen or eyesClosed => low engagement
 * - If gaze is center during task => higher engagement
 */
export function computeEngagement(
  point: RawMetricPoint,
  isTaskActive: boolean
): number {
  let engagement = 0.55;
  if (!point.facePresent || point.offScreen) engagement = 0.1;
  else if (point.eyesClosed) engagement = 0.2;
  else {
    // Enhanced gaze boost for 9-zone detection
    let gazeBoost = 0;
    if (point.gaze === "center" || point.gaze === "upper-center") {
      gazeBoost = 0.2; // Best engagement - looking at center
    } else if (point.gaze === "upper-left" || point.gaze === "upper-right") {
      gazeBoost = 0.15; // Good engagement - looking at upper areas
    } else if (point.gaze === "left" || point.gaze === "right") {
      gazeBoost = 0.05; // Moderate - looking side to side
    } else if (point.gaze === "lower-left" || point.gaze === "lower-right" || point.gaze === "lower-center") {
      gazeBoost = -0.05; // Lower engagement - looking down
    } else if (point.gaze === "unknown") {
      gazeBoost = -0.05; // Unknown gaze - lower engagement
    }
    
    const taskWindowBoost = isTaskActive ? 0.1 : 0;
    engagement = Math.max(0, Math.min(1, engagement + gazeBoost + taskWindowBoost));
  }
  return Number(engagement.toFixed(2));
}

/**
 * Get emotion from point (already computed with enhanced detection).
 * Falls back to simple smile-based detection if not set.
 */
export function computeEmotion(point: RawMetricPoint): RawMetricPoint["emotion"] {
  if (point.emotion) {
    return point.emotion;
  }
  // Fallback to simple detection
  return point.smile > 2.2 ? "positive" : point.smile < 1.8 ? "negative" : "neutral";
}

/**
 * Convert raw session data to computed metrics with engagement/emotion.
 */
export function computeMetrics(
  session: SessionPayload
): ComputedMetricPoint[] {
  const taskStart = session.events.find((e) => e.type === "task_start")?.t ?? null;
  const taskEnd = session.events.find((e) => e.type === "task_end")?.t ?? null;

  return session.points.map((point) => {
    const isTaskActive =
      taskStart !== null &&
      taskEnd !== null &&
      point.t >= taskStart &&
      point.t <= taskEnd;

    return {
      ...point,
      engagement: computeEngagement(point, isTaskActive),
      // emotion already computed in session, use as-is
    };
  });
}

/**
 * Generate a SurveyMonkey-style report from session data.
 */
export function generateReport(session: SessionPayload): Report | null {
  const points = session.points;
  // Allow report generation with at least 1 point (even if minimal data)
  if (!points || points.length < 1) return null;

  // First compute metrics with engagement/emotion
  const computedPoints = computeMetrics(session);

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

  const avgEng = avg(computedPoints.map((p) => p.engagement));
  const avgHr = computedPoints[0].hr
    ? avg(computedPoints.map((p) => p.hr!).filter(Boolean))
    : 75;
  const avgBr = computedPoints[0].br
    ? avg(computedPoints.map((p) => p.br!).filter(Boolean))
    : 15;

  const maxHr = computedPoints[0].hr
    ? Math.max(...computedPoints.map((p) => p.hr!).filter(Boolean))
    : 80;

  const minEng = Math.min(...computedPoints.map((p) => p.engagement));

  // Simple stress proxy: higher HR + higher BR
  const stressIndex = clamp((avgHr - 70) / 25 + (avgBr - 14) / 10, 0, 1);

  // Scores (1..5)
  const satisfaction = clamp(Math.round(1 + 4 * avgEng), 1, 5);
  const ease = clamp(Math.round(5 - 4 * stressIndex), 1, 5);
  const clarity = clamp(Math.round(2 + 3 * (1 - (1 - avgEng) * 0.9)), 1, 5);

  // Tone (enhanced with new emotion types)
  const positives = computedPoints.filter((p) => p.emotion === "positive").length;
  const negatives = computedPoints.filter((p) => 
    p.emotion === "negative" || p.emotion === "frustration"
  ).length;
  const concentration = computedPoints.filter((p) => p.emotion === "concentration").length;
  const confusion = computedPoints.filter((p) => p.emotion === "confusion").length;
  const frustration = computedPoints.filter((p) => p.emotion === "frustration").length;
  
  let tone: "Positive" | "Mixed" | "Negative" = "Mixed";
  if (positives > negatives * 1.2 && positives > confusion && positives > concentration) {
    tone = "Positive";
  } else if (negatives > positives * 1.2 || frustration > positives) {
    tone = "Negative";
  } else if (confusion > positives && confusion > negatives) {
    tone = "Mixed"; // Confusion indicates mixed/interested
  }

  // Moments: top 2 stress spikes + top 1 engagement drop (simple)
  const stressScore = (p: ComputedMetricPoint) => {
    const hr = p.hr ?? 75;
    const br = p.br ?? 15;
    return (hr - 70) * 0.6 + (br - 14) * 1.2;
  };
  const topStress = [...computedPoints]
    .map((p) => ({ t: p.t, v: stressScore(p), hr: p.hr ?? 75, br: p.br ?? 15 }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 2)
    .map(({ t, hr, br }) => ({ t, hr, br }));

  const lowEng = [...computedPoints]
    .map((p) => ({ t: p.t, eng: p.engagement }))
    .sort((a, b) => a.eng - b.eng)
    .slice(0, 1);

  const insights: string[] = [];
  insights.push(`Average engagement was ${(avgEng * 100).toFixed(0)}%.`);
  if (stressIndex > 0.55)
    insights.push(`Signs of stress were elevated (HR/BR higher than baseline).`);
  if (minEng < 0.45)
    insights.push(
      `Engagement dropped at least once (possible confusion/boredom moment).`
    );
  if (computedPoints[0].hr) {
    insights.push(`Peak heart rate reached ${maxHr} bpm during the session.`);
  }

  // Micro-question suggestion (based on confidence/ambiguity)
  const askMicro = stressIndex > 0.65 || minEng < 0.4;
  const microQuestion = askMicro ? "Was any part of the task confusing?" : null;

  // Confidence: higher when engagement is consistent and tone is clear
  const engagementVariance =
    avgEng > 0
      ? avg(computedPoints.map((p) => Math.abs(p.engagement - avgEng) ** 2))
      : 1;
  const totalEmotions = positives + negatives + concentration + confusion;
  const toneClarity =
    totalEmotions > 0 ? Math.abs(positives - negatives) / totalEmotions : 0;
  const confidence = clamp(1 - engagementVariance * 2 + toneClarity * 0.3, 0, 1);

  return {
    scores: { satisfaction, ease, clarity },
    tone,
    insights: insights.slice(0, 3),
    moments: {
      stress: topStress,
      engagementLow: lowEng,
    },
    microQuestion,
    confidence: Number(confidence.toFixed(2)),
  };
}
