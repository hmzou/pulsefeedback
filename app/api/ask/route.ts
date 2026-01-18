import { NextRequest, NextResponse } from "next/server";
import type { SessionPayload } from "@/app/lib/storage/sessionStore";

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
    const geminiKey = process.env.GEMINI_API_KEY;
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

    // Prepare enhanced session data with full points and snapshots
    const sessionSummary = {
      mode: session.mode || "task",
      startedAt: session.startedAt,
      task: session.task,
      totalPoints: session.points?.length || 0,
      totalSnapshots: session.snapshots?.length || 0,
      events: session.events,
      // Include all points for better analysis (not just sample)
      points: session.points || [],
      // Include snapshot metadata (full data URLs for Gemini vision)
      snapshots: session.snapshots?.map((s) => ({
        imageId: s.imageId,
        t: s.t,
        label: s.label,
        hasImage: !!s.dataUrl, // Indicate if image data is available
      })) || [],
    };

    const userContent = `Session Data:
${JSON.stringify(sessionSummary, null, 2)}

User Question: ${user_question}

Please analyze this Inshight session data and answer the user's question. Provide insights about engagement patterns, emotional states, confusion moments, and any notable behaviors.

IMPORTANT: If snapshots are available, analyze what content was on screen during confusion/engagement moments to explain why the user felt that way.`;

    // Use Gemini if available, otherwise OpenAI
    if (geminiKey) {
      // Gemini supports vision, so we'll include snapshot images
      const parts: any[] = [{ text: `${SYSTEM_PROMPT}\n\n${userContent}` }];
      
      // Add snapshot images to Gemini request (first 5 to stay within token limits)
      if (session.snapshots && session.snapshots.length > 0) {
        for (const snapshot of session.snapshots.slice(0, 5)) {
          if (snapshot.dataUrl) {
            // Convert data URL to base64
            const base64Data = snapshot.dataUrl.split(',')[1];
            parts.push({
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Data,
              },
            });
            parts.push({
              text: `Snapshot at ${snapshot.t}s (${snapshot.imageId}): This image was captured when the user showed confusion or low engagement. Analyze what content was visible and how it relates to their emotional state.`,
            });
          }
        }
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
            },
          }),
        }
      );

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
      const result = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from AI.";
      
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
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
