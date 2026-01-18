"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import { startFaceTracking, FaceSignals } from "../lib/vision/faceTracker";
import {
  saveSession,
  type RawMetricPoint,
  type SessionEvent,
  type SessionPayload,
  type Snapshot,
} from "../lib/storage/sessionStore";
import { computeEngagement, computeEmotion } from "../lib/analytics/report";
import { isConfusionCandidate } from "../lib/analytics/confusion";
import { design } from "../lib/design/styles";
import DemoFlow from "../components/DemoFlow";
import MetricCard from "../components/MetricCard";

export default function ActivityPage() {
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [startMs, setStartMs] = useState<number | null>(null);

  const [points, setPoints] = useState<RawMetricPoint[]>([]);
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [liveFace, setLiveFace] = useState<FaceSignals | null>(null);
  const [hasSaved, setHasSaved] = useState(false);

  // Track emotion history for duration-based detection
  const emotionHistoryRef = useRef<Array<{ t: number; emotion: string; smile: number }>>([]);
  
  // Track eyes closed duration for confusion detection
  const eyesClosedStartRef = useRef<number | null>(null);
  const lastSnapshotTimeRef = useRef<number>(0); // Cooldown for snapshots

  const nowT = () => (startMs === null ? 0 : (Date.now() - startMs) / 1000);

  // Webcam stream
  const webcamStreamRef = useRef<MediaStream | null>(null);
  // Screen share stream
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Webcam setup
  useEffect(() => {
    if (!isRunning || startMs === null) return;

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (webcamVideoRef.current) {
          webcamVideoRef.current.srcObject = stream;
          webcamStreamRef.current = stream;
        }
      })
      .catch((err) => {
        console.error("Webcam error:", err);
        alert("Failed to access webcam. Please grant camera permissions.");
      });

    return () => {
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach((t) => t.stop());
        webcamStreamRef.current = null;
      }
    };
  }, [isRunning, startMs]);

  // Screen share setup
  useEffect(() => {
    if (!isRunning || startMs === null) return;

    navigator.mediaDevices
      .getDisplayMedia({ video: true, audio: false })
      .then((stream) => {
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
          screenStreamRef.current = stream;

          // Handle user stopping screen share from browser UI
          stream.getVideoTracks()[0].addEventListener("ended", () => {
            stopActivity();
          });
        }
      })
      .catch((err) => {
        console.error("Screen share error:", err);
        if (err.name !== "NotAllowedError") {
          alert("Failed to access screen share. Please grant screen sharing permissions.");
        }
        // If screen share denied, stop the whole activity
        stopActivity();
      });

    return () => {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
    };
  }, [isRunning, startMs]);

  // Start face tracking
  useEffect(() => {
    if (!isRunning || startMs === null) return;
    const v = webcamVideoRef.current;
    if (!v) return;

    let stopTracker: null | (() => void) = null;

    const start = () => {
      if (v.videoWidth > 0 && v.videoHeight > 0 && v.readyState >= 2) {
        stopTracker = startFaceTracking({
          videoEl: v,
          getT: nowT,
          onUpdate: (s) => setLiveFace(s),
        });
      }
    };

    if (v.readyState >= 2 && v.videoWidth > 0 && v.videoHeight > 0) {
      start();
    } else {
      const onLoadedMetadata = () => {
        if (v.videoWidth > 0 && v.videoHeight > 0) {
          start();
        }
      };
      v.addEventListener("loadedmetadata", onLoadedMetadata);
      return () => {
        v.removeEventListener("loadedmetadata", onLoadedMetadata);
        if (stopTracker) stopTracker();
        setLiveFace(null);
      };
    }

    return () => {
      if (stopTracker) stopTracker();
      v.onloadeddata = null;
      setLiveFace(null);
    };
  }, [isRunning, startMs]);

  const pushEvent = (e: SessionEvent) => setEvents((prev) => [...prev, e]);

  const startActivity = () => {
    setPoints([]);
    setEvents([]);
    setSnapshots([]);
    setLiveFace(null);
    lastSnapshotTimeRef.current = 0;
    eyesClosedStartRef.current = null;
    emotionHistoryRef.current = [];

    setStartMs(Date.now());
    setIsRunning(true);

    pushEvent({ t: 0, type: "activity_start", note: "Activity tracking started" });
  };

  const stopActivity = () => {
    setIsRunning(false);
    pushEvent({ t: Number(nowT().toFixed(1)), type: "activity_end", note: "Activity tracking stopped" });
    
    // Cleanup streams
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach((t) => t.stop());
      webcamStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    
    setStartMs(null);
  };

  // Capture screen snapshot
  const captureSnapshot = (t: number): void => {
    const screenEl = screenVideoRef.current;
    if (!screenEl || screenEl.videoWidth === 0) return;

    // Cooldown: max 1 snapshot per 3 seconds
    if (t - lastSnapshotTimeRef.current < 3) return;
    
    // Max 25 snapshots per run
    if (snapshots.length >= 25) return;

    try {
      const canvas = document.createElement("canvas");
      canvas.width = screenEl.videoWidth;
      canvas.height = screenEl.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(screenEl, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8); // JPEG at 80% quality

      const imageId = `snap_${Math.floor(t)}_${snapshots.length + 1}`;
      const snapshot: Snapshot = {
        imageId,
        t: Number(t.toFixed(1)),
        kind: "screen",
        dataUrl,
        label: "confusion_candidate",
      };

      setSnapshots((prev) => [...prev, snapshot]);
      lastSnapshotTimeRef.current = t;
    } catch (err) {
      console.error("Snapshot capture error:", err);
    }
  };

  // 1Hz sampler: collect points and detect confusion
  useEffect(() => {
    if (!isRunning || startMs === null) return;

    const genPoint = (t: number): RawMetricPoint => {
      // Fake HR/BR for now (will be replaced with Presage later)
      const hr = 75 + Math.round(10 * Math.sin(t / 2));
      const br = 15 + Math.round(2 * Math.sin(t / 3));

      const facePresent = !!liveFace?.facePresent;
      const offScreen = !!liveFace?.offScreen;
      const eyesClosed = !!liveFace?.eyesClosed;
      const gaze = (liveFace?.gaze ?? "unknown") as RawMetricPoint["gaze"];
      const smile = liveFace?.smile ?? 0;
      const eyebrowRaised = liveFace?.eyebrowRaised ?? false;

      // Track eyes closed duration
      if (eyesClosed) {
        if (eyesClosedStartRef.current === null) {
          eyesClosedStartRef.current = t;
        }
      } else {
        eyesClosedStartRef.current = null;
      }
      const eyesClosedDuration = eyesClosedStartRef.current ? t - eyesClosedStartRef.current : 0;

      // Enhanced emotion detection with duration tracking
      let emotion: RawMetricPoint["emotion"] = liveFace?.emotion ?? "neutral";
      emotionHistoryRef.current.push({ t, emotion, smile });
      emotionHistoryRef.current = emotionHistoryRef.current.filter((e) => t - e.t < 10);

      if (emotion === "concentration") {
        const concentrationDuration = emotionHistoryRef.current.filter(
          (e) => e.emotion === "concentration" || (e.smile < 1.8 && e.emotion !== "positive")
        ).length;
        if (concentrationDuration >= 5) {
          emotion = "frustration";
        }
      }

      const point: RawMetricPoint = {
        t: Number(t.toFixed(1)),
        hr,
        br,
        facePresent,
        offScreen,
        eyesClosed,
        gaze,
        smile: Number(smile.toFixed(2)),
        emotion,
        eyebrowRaised,
      };

      // Check for confusion candidate (eyesClosedDuration already computed above)
      const isConfusion = isConfusionCandidate(point, true, eyesClosedDuration);
      if (isConfusion) {
        captureSnapshot(t);
      }

      return point;
    };

    const id = window.setInterval(() => {
      const t = nowT();
      const point = genPoint(t);
      setPoints((prev) => [...prev, point]);
    }, 1000);

    return () => window.clearInterval(id);
  }, [isRunning, startMs, liveFace]);

  // Compute latest for UI display
  const latest = useMemo(() => {
    if (liveFace) {
      const rawPoint: RawMetricPoint = {
        t: liveFace.t,
        facePresent: liveFace.facePresent,
        offScreen: liveFace.offScreen,
        eyesClosed: liveFace.eyesClosed,
        gaze: liveFace.gaze,
        smile: liveFace.smile,
        emotion: liveFace.emotion,
        eyebrowRaised: liveFace.eyebrowRaised,
        hr: undefined,
        br: undefined,
      };
      return {
        ...rawPoint,
        engagement: computeEngagement(rawPoint, true),
      };
    }
    const point = points[points.length - 1];
    if (!point) return null;
    return {
      ...point,
      engagement: computeEngagement(point, true),
    };
  }, [liveFace, points]);

  const buildPayload = (): SessionPayload => ({
    startedAt: new Date().toISOString(),
    mode: "activity",
    events,
    points,
    snapshots: snapshots.slice(0, 25), // Cap at 25
    notes: "Activity tracking with screen share. Face tracking via MediaPipe. HR/BR still fake (Presage can replace).",
  });

  const saveToLocal = () => {
    if (points.length === 0) {
      alert("No data to save. Start tracking first.");
      return;
    }
    const payload = buildPayload();
    saveSession(payload);
    setHasSaved(true);
    alert("Activity session saved! You can now view it in /report or ask AI in /ask");
  };

  const saveAndMark = () => {
    saveToLocal();
  };

  // Determine demo flow step
  const demoStep: 1 | 2 | 3 | 4 = useMemo(() => {
    if (hasSaved) return 4;
    if (screenStreamRef.current?.active && points.length > 0) return 3;
    if (screenStreamRef.current?.active) return 2;
    if (isRunning) return 2;
    return 1;
  }, [isRunning, hasSaved, points.length]);

  const hasScreenShare = !!screenStreamRef.current?.active;

  return (
    <main
      style={{
        padding: `${design.spacing.xl} ${design.spacing.xl}`,
        maxWidth: 1200,
        margin: "0 auto",
        color: design.colors.text,
        backgroundColor: design.colors.background,
        fontFamily: design.typography.fontFamily,
      }}
    >
      <div style={{ marginBottom: design.spacing.xl }}>
        <h2 style={{ ...design.typography.h2, marginBottom: design.spacing.sm, color: design.colors.text, marginTop: 0 }}>
          Activity Tracking
        </h2>
        <p style={{ ...design.typography.body, color: design.colors.textSecondary, margin: 0 }}>
          Track your engagement during any activity. Share your screen (YouTube, Zoom, lectures) and we&apos;ll capture real-time feedback.
        </p>
      </div>

      <DemoFlow
        step={demoStep}
        isTracking={isRunning}
        hasScreenShare={hasScreenShare}
        hasSaved={points.length > 0 && !isRunning}
      />

      <div
        style={{
          display: "flex",
          gap: design.spacing.md,
          flexWrap: "wrap",
          marginBottom: design.spacing.xl,
          alignItems: "center",
        }}
      >
        {!isRunning ? (
          <button
            onClick={startActivity}
            style={{
              padding: "14px 28px",
              cursor: "pointer",
              backgroundColor: design.colors.primary,
              color: "#ffffff",
              border: "none",
              borderRadius: design.radius.md,
              fontWeight: 600,
              fontSize: "15px",
              transition: design.animation.normal,
              boxShadow: design.shadow.md,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = design.colors.primaryHover;
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = design.shadow.lg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = design.colors.primary;
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = design.shadow.md;
            }}
          >
            Start Activity Tracking
          </button>
        ) : (
          <button
            onClick={stopActivity}
            style={{
              padding: "14px 28px",
              cursor: "pointer",
              backgroundColor: design.colors.error,
              color: "#ffffff",
              border: "none",
              borderRadius: design.radius.md,
              fontWeight: 600,
              fontSize: "15px",
              transition: design.animation.normal,
              boxShadow: design.shadow.md,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#dc2626";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = design.colors.error;
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Stop Tracking
          </button>
        )}

        <button
          onClick={saveAndMark}
          disabled={points.length === 0 || isRunning}
          style={{
            padding: "14px 28px",
            cursor: points.length === 0 || isRunning ? "not-allowed" : "pointer",
            backgroundColor: points.length === 0 || isRunning ? design.colors.borderLight : "#ffffff",
            color: points.length === 0 || isRunning ? design.colors.textTertiary : design.colors.text,
            border: `1px solid ${design.colors.border}`,
            borderRadius: design.radius.md,
            fontWeight: 600,
            fontSize: "15px",
            transition: design.animation.normal,
            opacity: points.length === 0 || isRunning ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (points.length > 0 && !isRunning) {
              e.currentTarget.style.backgroundColor = design.colors.surface;
              e.currentTarget.style.transform = "translateY(-2px)";
            }
          }}
          onMouseLeave={(e) => {
            if (points.length > 0 && !isRunning) {
              e.currentTarget.style.backgroundColor = "#ffffff";
              e.currentTarget.style.transform = "translateY(0)";
            }
          }}
        >
          Save for Report
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: design.spacing.xl,
          marginBottom: design.spacing.xl,
        }}
      >
        {/* Left: Webcam */}
        <div
          style={{
            border: `1px solid ${design.colors.border}`,
            borderRadius: design.radius.lg,
            padding: design.spacing.lg,
            backgroundColor: design.colors.surface,
            boxShadow: design.shadow.sm,
            transition: design.animation.normal,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = design.shadow.md;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = design.shadow.sm;
          }}
        >
          <div
            style={{
              ...design.typography.caption,
              color: design.colors.textSecondary,
              marginBottom: design.spacing.md,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            📷 Webcam Preview
          </div>
          <video
            ref={webcamVideoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: "100%",
              borderRadius: design.radius.md,
              border: `1px solid ${design.colors.border}`,
              backgroundColor: "#000",
              aspectRatio: "4/3",
              objectFit: "cover",
            }}
          />
        </div>

        {/* Right: Screen Share */}
        <div
          style={{
            border: `1px solid ${design.colors.border}`,
            borderRadius: design.radius.lg,
            padding: design.spacing.lg,
            backgroundColor: design.colors.surface,
            boxShadow: design.shadow.sm,
            transition: design.animation.normal,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = design.shadow.md;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = design.shadow.sm;
          }}
        >
          <div
            style={{
              ...design.typography.caption,
              color: design.colors.textSecondary,
              marginBottom: design.spacing.md,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            🖥️ Screen Share Preview
          </div>
          <video
            ref={screenVideoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: "100%",
              borderRadius: design.radius.md,
              border: `1px solid ${design.colors.border}`,
              backgroundColor: "#000",
              aspectRatio: "16/9",
              objectFit: "contain",
            }}
          />
          {!hasScreenShare && isRunning && (
            <div
              style={{
                marginTop: design.spacing.md,
                padding: design.spacing.md,
                backgroundColor: design.colors.warning + "15",
                border: `1px solid ${design.colors.warning}40`,
                borderRadius: design.radius.sm,
                fontSize: "13px",
                color: design.colors.textSecondary,
                textAlign: "center",
              }}
            >
              Waiting for screen share permission...
            </div>
          )}
        </div>
      </div>

      {/* Live Metrics */}
      <div
        style={{
          border: `1px solid ${design.colors.border}`,
          borderRadius: design.radius.lg,
          padding: design.spacing.xl,
          backgroundColor: design.colors.background,
          boxShadow: design.shadow.md,
        }}
      >
        <h3 style={{ ...design.typography.h3, marginTop: 0, marginBottom: design.spacing.lg, color: design.colors.text }}>
          Live Metrics
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: design.spacing.md,
            marginBottom: design.spacing.lg,
          }}
        >
          <MetricCard
            label="Engagement"
            value={latest ? latest.engagement.toFixed(2) : "—"}
            tooltip="Overall engagement score (0-1). Higher means more focused attention."
            highlight={isRunning}
          />
          <MetricCard
            label="Emotion"
            value={latest ? latest.emotion : "—"}
            tooltip="Detected emotional state: positive, neutral, negative, concentration, frustration, confusion."
          />
          <MetricCard
            label="Gaze"
            value={latest ? latest.gaze : "—"}
            tooltip="Where you're looking: upper/center/lower + left/center/right zones."
          />
          <MetricCard
            label="Face Present"
            value={latest ? (latest.facePresent ? "Yes" : "No") : "—"}
            tooltip="Whether a face is detected in the webcam."
          />
          <MetricCard
            label="Off-screen"
            value={latest ? (latest.offScreen ? "Yes" : "No") : "—"}
            tooltip="Whether your gaze is off the screen (looking away)."
          />
          <MetricCard
            label="Eyes Closed"
            value={latest ? (latest.eyesClosed ? "Yes" : "No") : "—"}
            tooltip="Whether your eyes are currently closed (blink or tired)."
          />
          <MetricCard
            label="Smile"
            value={latest ? latest.smile.toFixed(2) : "—"}
            tooltip="Smile intensity (0-3). Higher means more positive expression."
          />
          <MetricCard
            label="Snapshots"
            value={`${snapshots.length}/25`}
            tooltip="Number of confusion moments captured (max 25)."
          />
        </div>

        <div
          style={{
            padding: design.spacing.md,
            backgroundColor: design.colors.surface,
            borderRadius: design.radius.md,
            ...design.typography.small,
            color: design.colors.textSecondary,
            border: `1px solid ${design.colors.border}`,
            display: "flex",
            gap: design.spacing.md,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span>
            <strong style={{ color: design.colors.text }}>Status:</strong>{" "}
            <span
              style={{
                color: isRunning ? design.colors.success : design.colors.textSecondary,
                fontWeight: 600,
              }}
            >
              {isRunning ? "● Tracking" : "○ Idle"}
            </span>
          </span>
          <span>•</span>
          <span>
            <strong style={{ color: design.colors.text }}>Samples:</strong> {points.length}
          </span>
          <span>•</span>
          <span>
            <strong style={{ color: design.colors.text }}>Confusion snapshots:</strong> {snapshots.length}
          </span>
        </div>
      </div>
    </main>
  );
}
