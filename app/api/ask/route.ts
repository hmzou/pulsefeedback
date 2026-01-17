import { NextRequest, NextResponse } from "next/server";
import type { SessionPayload } from "@/app/lib/storage/sessionStore";

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

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY environment variable not set" },
        { status: 500 }
      );
    }

    // Prepare session summary for the model
    const sessionSummary = {
      mode: session.mode || "task",
      startedAt: session.startedAt,
      totalPoints: session.points?.length || 0,
      totalSnapshots: session.snapshots?.length || 0,
      events: session.events,
      samplePoints: session.points?.slice(0, 10), // First 10 points as sample
      snapshotIds: session.snapshots?.map((s) => ({ imageId: s.imageId, t: s.t })) || [],
    };

    const userContent = `Session Data:
${JSON.stringify(sessionSummary, null, 2)}

User Question: ${user_question}

Please analyze this Inshight session data and answer the user's question. Provide insights about engagement patterns, emotional states, confusion moments, and any notable behaviors.`;

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Using cost-effective model
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: userContent,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenAI API error:", errorData);
      return NextResponse.json(
        {
          error: `OpenAI API error: ${errorData.error?.message || response.statusText}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || "No response from AI.";

    return NextResponse.json({ result });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
