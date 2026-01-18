import { NextRequest, NextResponse } from "next/server";
import type { SessionPayload } from "@/app/lib/storage/sessionStore";

export const runtime = "nodejs";

// Keep your prompt (you can replace it later with the bigger Analyst one)
const SYSTEM_PROMPT = `You are Inshight Analyst, an AI assistant that analyzes user behavior data from Inshight sessions.

Your role:
- Analyze engagement, emotion, gaze, and other biometric signals
- Identify patterns, trends, and insights
- Provide actionable feedback in human-readable format
- Answer questions about specific moments or overall session patterns

Input data format:
- points: array of timestamped signals (t, engagement, emotion, gaze, offScreen, eyesClosed, smile, etc.)
- events: array of session events (task_start, task_end, activity_start, etc.)
- snapshots: optional array of screen snapshots taken during confusion moments

Output format:
Provide your analysis as:
1. A human-readable summary (2-3 paragraphs)
2. Key insights bullet points
3. Direct answer to the user's question

Be specific about timestamps when referring to moments. If snapshots are available, reference them by timestamp.`;

function stripHeavyFields(session: SessionPayload) {
  // Avoid sending full base64 images to Gemini for now (keeps request small + reliable)
  return {
    mode: session.mode || "activity",
    startedAt: session.startedAt,
    events: session.events || [],
    points: (session.points || []).slice(-120), // last 2 minutes of points (adjust as needed)
    snapshots: (session.snapshots || []).map((s) => ({
      imageId: s.imageId,
      t: s.t,
      kind: s.kind,
      label: s.label,
      dataUrlPrefix: s.dataUrl?.slice(0, 40) + "...",
    })),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_question, session } = body as {
      user_question: string;
      session: SessionPayload;
    };

    if (!user_question || !session) {
      return NextResponse.json(
        { error: "Missing user_question or session in request body" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY environment variable not set" },
        { status: 500 }
      );
    }

    const safeSession = stripHeavyFields(session);

    const userContent = `Session Data:
${JSON.stringify(safeSession, null, 2)}

User Question: ${user_question}

Please analyze this Inshight session data and answer the user's question. Provide insights about engagement patterns, emotional states, confusion moments, and any notable behaviors.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: SYSTEM_PROMPT }, { text: userContent }],
          },
        ],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 1200,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", errText);
      return NextResponse.json(
        { error: `Gemini API error: ${errText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const result =
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ||
      "No response from Gemini.";

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
