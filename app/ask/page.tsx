"use client";

import { useEffect, useState } from "react";
import { loadSession, type SessionPayload } from "../lib/storage/sessionStore";
import { design } from "../lib/design/styles";

const SUGGESTION_QUESTIONS = [
  "What patterns do you see in my engagement?",
  "When did I seem most confused?",
  "What was I looking at during confusion moments?",
  "How did my emotions change over time?",
  "What moments had the highest engagement?",
  "Can you explain why I felt that way?",
];

export default function AskPage() {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);

  useEffect(() => {
    setSession(loadSession());
  }, []);

  const handleAsk = async () => {
    if (!session || !question.trim()) {
      alert("Please load a session and enter a question.");
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_question: question,
          session: session,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      setResponse(data.result || "No response received.");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get AI response.";
      setError(errorMessage);
      console.error("Ask API error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuestion(suggestion);
  };

  return (
    <main
      style={{
        padding: `${design.spacing.xl} ${design.spacing.xl}`,
        maxWidth: 900,
        margin: "0 auto",
        color: design.colors.text,
        backgroundColor: design.colors.background,
        fontFamily: design.typography.fontFamily,
      }}
    >
      <div style={{ marginBottom: design.spacing.xl }}>
        <h2 style={{ ...design.typography.h2, marginBottom: design.spacing.sm, color: design.colors.text, marginTop: 0 }}>
          Ask AI Analyst
        </h2>
        <p style={{ ...design.typography.body, color: design.colors.textSecondary, margin: 0 }}>
          Ask questions about your session data. The AI analyzes your engagement, emotions, and behavior patterns, including screen snapshots during confusion moments.
        </p>
      </div>

      {!session ? (
        <div
          style={{
            border: `1px solid ${design.colors.border}`,
            borderRadius: design.radius.lg,
            padding: design.spacing.xl,
            marginTop: design.spacing.lg,
            backgroundColor: design.colors.surface,
            boxShadow: design.shadow.sm,
          }}
        >
          <p style={{ margin: 0, marginBottom: design.spacing.sm, color: design.colors.text, fontWeight: 600 }}>
            No saved session found.
          </p>
          <p style={{ margin: 0, color: design.colors.textSecondary, ...design.typography.small }}>
            Go to <a href="/activity" style={{ color: design.colors.primary, textDecoration: "none" }}>/activity</a> or{" "}
            <a href="/session" style={{ color: design.colors.primary, textDecoration: "none" }}>/session</a>, run a session, then click "Save for Report".
          </p>
        </div>
      ) : (
        <>
          {/* Session Info Card */}
          <div
            style={{
              marginTop: design.spacing.lg,
              border: `1px solid ${design.colors.border}`,
              borderRadius: design.radius.lg,
              padding: design.spacing.lg,
              backgroundColor: design.colors.surface,
              boxShadow: design.shadow.sm,
            }}
          >
            <h3 style={{ ...design.typography.h4, marginTop: 0, marginBottom: design.spacing.md, color: design.colors.text }}>
              📊 Session Info
            </h3>
            <div style={{ display: "flex", gap: design.spacing.lg, flexWrap: "wrap", ...design.typography.small }}>
              <span>
                <strong style={{ color: design.colors.text }}>Mode:</strong>{" "}
                <span style={{ color: design.colors.textSecondary }}>{session.mode || "task"}</span>
              </span>
              <span>•</span>
              <span>
                <strong style={{ color: design.colors.text }}>Data Points:</strong>{" "}
                <span style={{ color: design.colors.textSecondary }}>{session.points?.length || 0}</span>
              </span>
              <span>•</span>
              <span>
                <strong style={{ color: design.colors.text }}>Snapshots:</strong>{" "}
                <span style={{ color: design.colors.textSecondary }}>{session.snapshots?.length || 0}</span>
              </span>
            </div>
          </div>

          {/* Question Input */}
          <div style={{ marginTop: design.spacing.xl }}>
            <label
              style={{
                display: "block",
                marginBottom: design.spacing.md,
                fontWeight: 600,
                ...design.typography.body,
                color: design.colors.text,
              }}
            >
              Your Question
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., What patterns do you see in my engagement? When did I seem most confused?"
              style={{
                width: "100%",
                minHeight: "140px",
                padding: design.spacing.lg,
                borderRadius: design.radius.md,
                border: `1px solid ${design.colors.border}`,
                fontFamily: design.typography.fontFamily,
                ...design.typography.body,
                color: design.colors.text,
                backgroundColor: design.colors.background,
                resize: "vertical",
                transition: design.animation.normal,
                boxShadow: design.shadow.sm,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = design.colors.primary;
                e.currentTarget.style.outline = "none";
                e.currentTarget.style.boxShadow = design.shadow.md;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = design.colors.border;
                e.currentTarget.style.boxShadow = design.shadow.sm;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleAsk();
                }
              }}
            />

            {/* Suggestion Chips */}
            <div style={{ marginTop: design.spacing.md, marginBottom: design.spacing.lg }}>
              <div
                style={{
                  ...design.typography.caption,
                  color: design.colors.textSecondary,
                  marginBottom: design.spacing.sm,
                  fontWeight: 500,
                }}
              >
                Try asking:
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: design.spacing.sm,
                }}
              >
                {SUGGESTION_QUESTIONS.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    style={{
                      padding: `${design.spacing.sm} ${design.spacing.md}`,
                      cursor: "pointer",
                      border: `1px solid ${design.colors.border}`,
                      borderRadius: design.radius.md,
                      background: design.colors.background,
                      color: design.colors.textSecondary,
                      ...design.typography.small,
                      fontWeight: 400,
                      transition: design.animation.normal,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = design.colors.surface;
                      e.currentTarget.style.borderColor = design.colors.primary;
                      e.currentTarget.style.color = design.colors.text;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = design.colors.background;
                      e.currentTarget.style.borderColor = design.colors.border;
                      e.currentTarget.style.color = design.colors.textSecondary;
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleAsk}
              disabled={loading || !question.trim()}
              style={{
                padding: "14px 32px",
                cursor: loading || !question.trim() ? "not-allowed" : "pointer",
                backgroundColor: loading || !question.trim() ? design.colors.borderLight : design.colors.primary,
                color: loading || !question.trim() ? design.colors.textTertiary : "#ffffff",
                border: "none",
                borderRadius: design.radius.md,
                fontWeight: 600,
                fontSize: "15px",
                transition: design.animation.normal,
                boxShadow: loading || !question.trim() ? "none" : design.shadow.md,
                opacity: loading || !question.trim() ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!loading && question.trim()) {
                  e.currentTarget.style.backgroundColor = design.colors.primaryHover;
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = design.shadow.lg;
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && question.trim()) {
                  e.currentTarget.style.backgroundColor = design.colors.primary;
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = design.shadow.md;
                }
              }}
            >
              {loading ? "⏳ Analyzing..." : "🤖 Ask AI"}
            </button>
          </div>

          {/* Error State */}
          {error && (
            <div
              style={{
                marginTop: design.spacing.xl,
                padding: design.spacing.lg,
                borderRadius: design.radius.md,
                backgroundColor: design.colors.errorBackground,
                border: `1px solid ${design.colors.errorBorder}`,
                color: design.colors.errorText,
              }}
            >
              <strong style={{ display: "block", marginBottom: design.spacing.sm, ...design.typography.body }}>
                ⚠️ Error:
              </strong>
              <p style={{ margin: 0, ...design.typography.small }}>{error}</p>
              {(error.includes("OPENAI_API_KEY") ||
                error.includes("GEMINI_API_KEY") ||
                error.includes("API key") ||
                error.includes("No AI API key")) && (
                <div style={{ marginTop: design.spacing.md }}>
                  <p style={{ marginBottom: design.spacing.sm, ...design.typography.caption, color: "#7f1d1d", fontWeight: 600 }}>
                    Missing API Key Configuration
                  </p>
                  <ul style={{ margin: 0, paddingLeft: "20px", ...design.typography.caption, color: "#7f1d1d" }}>
                    <li>
                      <strong>Local development:</strong> Create a <code>.env.local</code> file with <code>GEMINI_API_KEY</code> or{" "}
                      <code>OPENAI_API_KEY</code> and restart the dev server.
                    </li>
                    <li>
                      <strong>Vercel:</strong> Add environment variables in the Vercel dashboard (Settings → Environment Variables).
                    </li>
                    <li>See <code>.env.example</code> for the format.</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div
              style={{
                marginTop: design.spacing.xl,
                padding: design.spacing.xl,
                borderRadius: design.radius.lg,
                backgroundColor: design.colors.surface,
                border: `1px solid ${design.colors.border}`,
                textAlign: "center",
              }}
            >
              <div style={{ ...design.typography.body, color: design.colors.textSecondary }}>
                <div style={{ fontSize: "32px", marginBottom: design.spacing.md }}>✨</div>
                Analyzing your session data...
              </div>
            </div>
          )}

          {/* AI Response */}
          {response && !loading && (
            <div style={{ marginTop: design.spacing.xl }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: design.spacing.lg,
                }}
              >
                <h3 style={{ ...design.typography.h3, margin: 0, color: design.colors.text }}>💡 AI Analysis</h3>
                <button
                  onClick={() => setShowJson(!showJson)}
                  style={{
                    padding: `${design.spacing.sm} ${design.spacing.md}`,
                    ...design.typography.small,
                    cursor: "pointer",
                    border: `1px solid ${design.colors.border}`,
                    borderRadius: design.radius.sm,
                    background: design.colors.surface,
                    color: design.colors.textSecondary,
                    fontWeight: 500,
                    transition: design.animation.normal,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = design.colors.borderLight;
                    e.currentTarget.style.color = design.colors.text;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = design.colors.surface;
                    e.currentTarget.style.color = design.colors.textSecondary;
                  }}
                >
                  {showJson ? "Hide JSON" : "Show JSON"}
                </button>
              </div>

              {!showJson ? (
                <div
                  style={{
                    border: `1px solid ${design.colors.border}`,
                    borderRadius: design.radius.lg,
                    padding: design.spacing.xl,
                    whiteSpace: "pre-wrap",
                    backgroundColor: design.colors.background,
                    color: design.colors.textSecondary,
                    ...design.typography.body,
                    lineHeight: 1.8,
                    boxShadow: design.shadow.md,
                  }}
                >
                  {response}
                </div>
              ) : (
                <details
                  style={{
                    border: `1px solid ${design.colors.border}`,
                    borderRadius: design.radius.lg,
                    padding: design.spacing.lg,
                    backgroundColor: design.colors.surface,
                    boxShadow: design.shadow.sm,
                  }}
                >
                  <summary
                    style={{
                      cursor: "pointer",
                      fontWeight: 600,
                      marginBottom: design.spacing.md,
                      color: design.colors.text,
                      ...design.typography.body,
                    }}
                  >
                    JSON Response
                  </summary>
                  <pre
                    style={{
                      marginTop: design.spacing.lg,
                      padding: design.spacing.lg,
                      backgroundColor: design.colors.background,
                      borderRadius: design.radius.md,
                      overflow: "auto",
                      ...design.typography.caption,
                      border: `1px solid ${design.colors.border}`,
                      color: design.colors.textSecondary,
                    }}
                  >
                    {JSON.stringify({ response }, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
