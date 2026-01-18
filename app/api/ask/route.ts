import { NextRequest, NextResponse } from "next/server";
import type { SessionPayload } from "@/app/lib/storage/sessionStore";

export const runtime = "nodejs";

// GET handler for route existence ping (deployment troubleshooting)
export async function GET() {
  try {
    return NextResponse.json({
      ok: true,
      route: "/api/ask",
      message: "GET ping works",
      buildTime: new Date().toISOString(),
    });
  } catch (error) {
    // Should never happen, but ensure it never throws
    return NextResponse.json({
      ok: false,
      route: "/api/ask",
      message: "GET handler exists but encountered an error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
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

    // Check for Gemini first, fallback to OpenAI
    // ⚠️ SECURITY WARNING: Hardcoded API keys should NOT be committed to Git!
    // TODO: Remove this hardcoded key and use environment variables only.
    // For production, use: process.env.GEMINI_API_KEY
    const geminiKey = process.env.GEMINI_API_KEY || "vck_4Zn1Dzo14gu1HlrVxxb4Zh9wees351uTVIz7vF38XwuMjeCWQr20kLAA";
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!geminiKey && !openaiKey) {
      return NextResponse.json(
        {
          error: "No AI API key found. Please set GEMINI_API_KEY or OPENAI_API_KEY in your environment variables.",
          hint: "For local development, create a .env.local file. For Vercel, add environment variables in the dashboard.",
        },
        { status: 500 }
      );
    }

    const safeSession = stripHeavyFields(session);

    const userContent = `Session Data:
${JSON.stringify(safeSession, null, 2)}

User Question: ${user_question}

Please analyze this Inshight session data and answer the user's question. Provide insights about engagement patterns, emotional states, confusion moments, and any notable behaviors.

IMPORTANT: If snapshots are available, analyze what content was on screen during confusion/engagement moments to explain why the user felt that way.`;

    // Use Gemini if available, otherwise OpenAI
    if (geminiKey) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;

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
        const errorData = await response.json().catch(() => ({}));
        console.error("Gemini API error:", errorData);
        // Fallback to OpenAI if Gemini fails
        if (openaiKey) {
          return callOpenAI(openaiKey, userContent);
        }
        return NextResponse.json(
          {
            error: `Gemini API error: ${errorData.error?.message || response.statusText}`,
          },
          { status: response.status }
        );
      }

      const data = await response.json();
      const result =
        data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ||
        "No response from Gemini.";

      return NextResponse.json({ result });
    } else {
      // Fallback to OpenAI
      return callOpenAI(openaiKey!, userContent);
    }

    async function callOpenAI(apiKey: string, content: string): Promise<NextResponse> {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content },
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
    }
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
