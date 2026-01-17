"use client";

import { useEffect, useState } from "react";
import { loadSession, type SessionPayload } from "../lib/storage/sessionStore";

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

  return (
    <main style={{ padding: 32, fontFamily: "system-ui", maxWidth: 1000, color: "#000", backgroundColor: "#ffffff" }}>
      <h2 style={{ color: "#000" }}>Ask AI Analyst</h2>
      <p style={{ opacity: 0.8, color: "#000" }}>
        Ask questions about your session data. The AI will analyze your engagement, emotions, and behavior patterns.
      </p>

      {!session ? (
        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16, marginTop: 16 }}>
          <p><b>No saved session found.</b></p>
          <p>Go to <a href="/session">/session</a> or <a href="/activity">/activity</a>, run a session, then click "Save for Report".</p>
        </div>
      ) : (
        <>
          <div style={{ marginTop: 24, border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Session Info</h3>
            <p>
              Mode: <b>{session.mode || "task"}</b> • Points: <b>{session.points?.length || 0}</b> • 
              Snapshots: <b>{session.snapshots?.length || 0}</b>
            </p>
          </div>

          <div style={{ marginTop: 24 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
              Your Question
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., What patterns do you see in my engagement? When did I seem most confused?"
              style={{
                width: "100%",
                minHeight: "100px",
                padding: 12,
                borderRadius: 8,
                border: "1px solid #ddd",
                fontFamily: "inherit",
                fontSize: 14,
              }}
            />
            <button
              onClick={handleAsk}
              disabled={loading || !question.trim()}
              style={{
                marginTop: 12,
                padding: "12px 24px",
                cursor: loading || !question.trim() ? "not-allowed" : "pointer",
                backgroundColor: loading || !question.trim() ? "#ccc" : "#000",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontWeight: 600,
              }}
            >
              {loading ? "Asking AI..." : "Ask"}
            </button>
          </div>

          {error && (
            <div
              style={{
                marginTop: 24,
                padding: 16,
                borderRadius: 12,
                backgroundColor: "#fee",
                border: "1px solid #fcc",
                color: "#c00",
              }}
            >
              <strong>Error:</strong> {error}
              {error.includes("OPENAI_API_KEY") && (
                <p style={{ marginTop: 8, fontSize: 14 }}>
                  Please set OPENAI_API_KEY in your .env.local file and restart the dev server.
                </p>
              )}
            </div>
          )}

          {response && (
            <div style={{ marginTop: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ margin: 0 }}>AI Response</h3>
                <button
                  onClick={() => setShowJson(!showJson)}
                  style={{
                    padding: "6px 12px",
                    fontSize: 12,
                    cursor: "pointer",
                    border: "1px solid #ddd",
                    borderRadius: 6,
                    background: "#fafafa",
                  }}
                >
                  {showJson ? "Hide JSON" : "Show JSON"}
                </button>
              </div>

              {!showJson ? (
                <div
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: 12,
                    padding: 16,
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.6,
                    backgroundColor: "#fafafa",
                  }}
                >
                  {response}
                </div>
              ) : (
                <details style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
                  <summary style={{ cursor: "pointer", fontWeight: 600, marginBottom: 12 }}>
                    JSON Response
                  </summary>
                  <pre
                    style={{
                      marginTop: 12,
                      padding: 12,
                      backgroundColor: "#fafafa",
                      borderRadius: 8,
                      overflow: "auto",
                      fontSize: 12,
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

      <div style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <a href="/report">← View Report</a>
        <a href="/session">Session</a>
        <a href="/activity">Activity</a>
      </div>
    </main>
  );
}
