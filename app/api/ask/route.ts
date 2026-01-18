import { NextRequest, NextResponse } from "next/server";
import type { SessionPayload } from "@/app/lib/storage/sessionStore";

export const runtime = "nodejs";

// GET ping (to confirm route exists on Vercel)
export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/ask", message: "ping" });
}

const SYSTEM_PROMPT = `You are Inshight Analyst, an AI assistant that analyzes user behavior data from Inshight sessions.

Your role:
- Analyze engagement, emotion, gaze, and other biometric signals
- Identify patterns, trends, and insights
- Provide actionable feedback in human-readable format
- Answer questions about specific moments or overall session patterns
- When screen snapshots are provided, analyze WHAT the user was looking at during confusion/engagement moments to explain WHY they felt that way

Input data format:
- points: array of timestamped signals (t, engagement, emotion, gaze, offScreen, eyesClosed, smile, etc.)
- events: array of session events (task_start, task_end, activity_start, etc.)
- snapshots: optional array of screen snapshots taken during confusion moments (these show what content was on screen)

IMPORTANT: When analyzing snapshots:
- Describe what content/UI was visible on screen
- Connect the visual context to the user's emotional state
- Explain why seeing that specific content might have caused confusion, frustration, or engagement
- Reference specific timestamps: "At 12.3s, you were looking at [describe content], which likely caused the confusion because..."

Output format:
Provide your analysis as:
1. A human-readable summary (2-3 paragraphs)
2. Key insights bullet points
3. Direct answer to the user's question
4. If snapshots exist, explain what was on screen during key moments

Be specific about timestamps when referring to moments. Always reference snapshot content when explaining emotional reactions.`;

export async function POST(req: NextRequest) {
  try {
    const { user_question, session } = (await req.json()) as {
      user_question: string;
      session: SessionPayload;
    };

    if (!user_question || !session) {
      return NextResponse.json(
        { error: "Missing user_question or session" },
        { status: 400 }
      );
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json(
        {
          error: "OPENAI_API_KEY not set on server.",
          fix: "Vercel → Project → Settings → Environment Variables → add OPENAI_API_KEY then redeploy",
        },
        { status: 500 }
      );
    }

    const sessionSummary = {
      mode: session.mode || "activity",
      startedAt: session.startedAt,
      task: session.task,
      events: session.events || [],
      points: (session.points || []).slice(-300),
      snapshots: (session.snapshots || []).map((s) => ({
        imageId: s.imageId,
        t: s.t,
        label: s.label,
        hasImage: !!s.dataUrl,
      })),
    };

    const userContent = `Session Data:\n${JSON.stringify(
      sessionSummary,
      null,
      2
    )}\n\nUser Question: ${user_question}`;

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        temperature: 0.7,
        max_tokens: 1200,
      }),
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "OpenAI error" },
        { status: r.status }
      );
    }

    const result = data?.choices?.[0]?.message?.content || "No response.";
    return NextResponse.json({ result, provider: "openai" });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
