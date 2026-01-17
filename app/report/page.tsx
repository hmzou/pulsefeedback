"use client";

import { useEffect, useMemo, useState } from "react";
import { loadSession, clearSession, type SessionPayload } from "../lib/storage/sessionStore";
import { generateReport, type Report } from "../lib/analytics/report";

export default function ReportPage() {
  const [session, setSession] = useState<SessionPayload | null>(null);

  useEffect(() => {
    setSession(loadSession());
  }, []);

  const report = useMemo<Report | null>(() => {
    if (!session) return null;
    return generateReport(session);
  }, [session]);

  const clear = () => {
    clearSession();
    setSession(null);
  };

  const downloadReport = () => {
    if (!session) return;
    
    const reportData = {
      session: session,
      report: report,
      generatedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pulsefeedback-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main style={{ padding: 32, fontFamily: "system-ui", maxWidth: 1000, color: "#000", backgroundColor: "#ffffff" }}>
      <h2 style={{ color: "#000" }}>Auto Feedback Report</h2>
      <p style={{ opacity: 0.8, color: "#000" }}>
        This is a SurveyMonkey-style report generated from session signals.
      </p>

      {!session ? (
        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
          <p><b>No saved session found.</b></p>
          <p>Go to <a href="/session">/session</a>, run a session, then click “Save for Report”.</p>
        </div>
      ) : !report ? (
        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
          <p><b>Session loaded</b> but not enough data to generate a report.</p>
          <p>Make sure you started the task and recorded some data. Try running a session again.</p>
          <p style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
            Session has {session.points.length} data points.
          </p>
        </div>
      ) : (
        <>
          {/* Score cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 14 }}>
            <Card label="Satisfaction" value={`${report.scores.satisfaction}/5`} />
            <Card label="Ease" value={`${report.scores.ease}/5`} />
            <Card label="Clarity" value={`${report.scores.clarity}/5`} />
          </div>

          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
              <h3 style={{ marginTop: 0 }}>Tone</h3>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{report.tone}</div>

              {report.microQuestion && (
                <div style={{ marginTop: 14, padding: 12, borderRadius: 12, border: "1px solid #eee" }}>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>Micro-question (only if uncertain)</div>
                  <div style={{ marginTop: 6, fontWeight: 700 }}>{report.microQuestion}</div>
                  <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
                    <button style={{ padding: "8px 12px", cursor: "pointer" }}>Yes</button>
                    <button style={{ padding: "8px 12px", cursor: "pointer" }}>No</button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
              <h3 style={{ marginTop: 0 }}>Insights</h3>
              <ul>
                {report.insights.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{ marginTop: 14, border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Moments that mattered</h3>
            <ul style={{ marginTop: 8 }}>
              {report.moments.stress.map((m, i) => (
                <li key={`s-${i}`}>
                  Stress spike around <b>{m.t.toFixed(1)}s</b> (HR {m.hr}, BR {m.br})
                </li>
              ))}
              {report.moments.engagementLow.map((m, i) => (
                <li key={`e-${i}`}>
                  Lowest engagement around <b>{m.t.toFixed(1)}s</b> (engagement {m.eng})
                </li>
              ))}
            </ul>
          </div>

          <details style={{ marginTop: 14 }}>
            <summary style={{ cursor: "pointer" }}>Raw saved session</summary>
            <pre style={{ background: "#fafafa", border: "1px solid #eee", padding: 12, borderRadius: 12, overflow: "auto" }}>
              {JSON.stringify(session, null, 2)}
            </pre>
          </details>
        </>
      )}

      <div style={{ marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <a href="/session">← Back to Session</a>
        <button
          onClick={downloadReport}
          disabled={!session || !report}
          style={{
            padding: "8px 12px",
            cursor: !session || !report ? "not-allowed" : "pointer",
          }}
        >
          Download Report
        </button>
        <button onClick={clear} style={{ padding: "8px 12px", cursor: "pointer" }}>
          Clear saved session
        </button>
      </div>
    </main>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 12, opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6 }}>{value}</div>
    </div>
  );
}
