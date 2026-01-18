"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadSession, clearSession, type SessionPayload } from "../lib/storage/sessionStore";
import { generateReport, type Report } from "../lib/analytics/report";
import { design } from "../lib/design/styles";

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
          📊 Feedback Report
        </h2>
        <p style={{ ...design.typography.body, color: design.colors.textSecondary, margin: 0 }}>
          SurveyMonkey-style insights generated automatically from your session signals. No forms required.
        </p>
      </div>

      {!session ? (
        <div
          style={{
            border: `1px solid ${design.colors.border}`,
            borderRadius: design.radius.lg,
            padding: design.spacing.xl,
            backgroundColor: design.colors.surface,
            boxShadow: design.shadow.sm,
          }}
        >
          <p style={{ margin: 0, marginBottom: design.spacing.sm, color: design.colors.text, fontWeight: 600 }}>
            No saved session found.
          </p>
          <p style={{ margin: 0, color: design.colors.textSecondary, ...design.typography.small }}>
            Go to <Link href="/activity" style={{ color: design.colors.primary, textDecoration: "none" }}>/activity</Link> or{" "}
            <Link href="/session" style={{ color: design.colors.primary, textDecoration: "none" }}>/session</Link>, run a session, then click "Save for Report".
          </p>
        </div>
      ) : !report ? (
        <div
          style={{
            border: `1px solid ${design.colors.border}`,
            borderRadius: design.radius.lg,
            padding: design.spacing.xl,
            backgroundColor: design.colors.surface,
            boxShadow: design.shadow.sm,
          }}
        >
          <p style={{ margin: 0, marginBottom: design.spacing.sm, color: design.colors.text, fontWeight: 600 }}>
            Session loaded but not enough data to generate a report.
          </p>
          <p style={{ margin: 0, marginBottom: design.spacing.md, color: design.colors.textSecondary, ...design.typography.small }}>
            Make sure you started the task and recorded some data. Try running a session again.
          </p>
          <p style={{ margin: 0, ...design.typography.caption, color: design.colors.textTertiary }}>
            Session has {session.points.length} data points.
          </p>
        </div>
      ) : (
        <>
          {/* Score cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: design.spacing.lg,
              marginTop: design.spacing.lg,
            }}
          >
            <ScoreCard label="Satisfaction" value={`${report.scores.satisfaction}/5`} highlight={report.scores.satisfaction >= 4} />
            <ScoreCard label="Ease" value={`${report.scores.ease}/5`} highlight={report.scores.ease >= 4} />
            <ScoreCard label="Clarity" value={`${report.scores.clarity}/5`} highlight={report.scores.clarity >= 4} />
          </div>

          {/* Summary Cards */}
          <div
            style={{
              marginTop: design.spacing.xl,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: design.spacing.lg,
            }}
          >
            <div
              style={{
                border: `1px solid ${design.colors.border}`,
                borderRadius: design.radius.lg,
                padding: design.spacing.xl,
                backgroundColor: design.colors.background,
                boxShadow: design.shadow.md,
                transition: design.animation.normal,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = design.shadow.lg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = design.shadow.md;
              }}
            >
              <h3 style={{ ...design.typography.h4, marginTop: 0, marginBottom: design.spacing.lg, color: design.colors.text }}>
                🎯 Tone
              </h3>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: 700,
                  color: report.tone === "Positive" ? design.colors.success : report.tone === "Negative" ? design.colors.error : design.colors.warning,
                  marginBottom: report.microQuestion ? design.spacing.xl : 0,
                }}
              >
                {report.tone}
              </div>

              {report.microQuestion && (
                <div
                  style={{
                    marginTop: "20px",
                    padding: "16px",
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                    backgroundColor: "#f9fafb",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      marginBottom: "8px",
                      fontWeight: 500,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Micro-question (only if uncertain)
                  </div>
                  <div style={{ marginBottom: "12px", fontWeight: 600, color: "#111827", fontSize: "15px" }}>
                    {report.microQuestion}
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      style={{
                        padding: "10px 20px",
                        cursor: "pointer",
                        backgroundColor: "#f3f4f6",
                        color: "#111827",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontWeight: 500,
                        fontSize: "14px",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#e5e7eb";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#f3f4f6";
                      }}
                    >
                      Yes
                    </button>
                    <button
                      style={{
                        padding: "10px 20px",
                        cursor: "pointer",
                        backgroundColor: "#f3f4f6",
                        color: "#111827",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontWeight: 500,
                        fontSize: "14px",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#e5e7eb";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#f3f4f6";
                      }}
                    >
                      No
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                border: `1px solid ${design.colors.border}`,
                borderRadius: design.radius.lg,
                padding: design.spacing.xl,
                backgroundColor: design.colors.background,
                boxShadow: design.shadow.md,
                transition: design.animation.normal,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = design.shadow.lg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = design.shadow.md;
              }}
            >
              <h3 style={{ ...design.typography.h4, marginTop: 0, marginBottom: design.spacing.lg, color: design.colors.text }}>
                💡 Insights
              </h3>
              <ul style={{ margin: 0, paddingLeft: "24px", color: design.colors.textSecondary, ...design.typography.body, lineHeight: 1.8 }}>
                {report.insights.map((x, i) => (
                  <li key={i} style={{ marginBottom: design.spacing.sm }}>
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Timeline */}
          <div
            style={{
              marginTop: design.spacing.xl,
              border: `1px solid ${design.colors.border}`,
              borderRadius: design.radius.lg,
              padding: design.spacing.xl,
              backgroundColor: design.colors.background,
              boxShadow: design.shadow.md,
            }}
          >
            <h3 style={{ ...design.typography.h3, marginTop: 0, marginBottom: design.spacing.lg, color: design.colors.text }}>
              ⏱️ Key Moments Timeline
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: design.spacing.md }}>
              {report.moments.stress.length === 0 && report.moments.engagementLow.length === 0 ? (
                <p style={{ ...design.typography.body, color: design.colors.textSecondary, margin: 0 }}>
                  No significant moments detected.
                </p>
              ) : (
                <>
                  {report.moments.stress.map((m, i) => (
                    <div
                      key={`s-${i}`}
                      style={{
                        padding: design.spacing.md,
                        backgroundColor: design.colors.surface,
                        borderRadius: design.radius.md,
                        border: `1px solid ${design.colors.error}40`,
                        display: "flex",
                        alignItems: "center",
                        gap: design.spacing.md,
                      }}
                    >
                      <div style={{ fontSize: "24px" }}>📈</div>
                      <div style={{ flex: 1 }}>
                        <strong style={{ color: design.colors.text }}>Stress spike</strong> at{" "}
                        <strong style={{ color: design.colors.error }}>{m.t.toFixed(1)}s</strong>
                        <div style={{ ...design.typography.small, color: design.colors.textSecondary, marginTop: design.spacing.xs }}>
                          HR: {m.hr} • BR: {m.br}
                        </div>
                      </div>
                    </div>
                  ))}
                  {report.moments.engagementLow.map((m, i) => (
                    <div
                      key={`e-${i}`}
                      style={{
                        padding: design.spacing.md,
                        backgroundColor: design.colors.surface,
                        borderRadius: design.radius.md,
                        border: `1px solid ${design.colors.warning}40`,
                        display: "flex",
                        alignItems: "center",
                        gap: design.spacing.md,
                      }}
                    >
                      <div style={{ fontSize: "24px" }}>📉</div>
                      <div style={{ flex: 1 }}>
                        <strong style={{ color: design.colors.text }}>Low engagement</strong> at{" "}
                        <strong style={{ color: design.colors.warning }}>{m.t.toFixed(1)}s</strong>
                        <div style={{ ...design.typography.small, color: design.colors.textSecondary, marginTop: design.spacing.xs }}>
                          Engagement: {m.eng.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Snapshot Gallery */}
          {session.snapshots && session.snapshots.length > 0 && (
            <div
              style={{
                marginTop: design.spacing.xl,
                border: `1px solid ${design.colors.border}`,
                borderRadius: design.radius.lg,
                padding: design.spacing.xl,
                backgroundColor: design.colors.background,
                boxShadow: design.shadow.md,
              }}
            >
              <h3 style={{ ...design.typography.h3, marginTop: 0, marginBottom: design.spacing.lg, color: design.colors.text }}>
                📸 Confusion Moments (Screen Snapshots)
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: design.spacing.md,
                }}
              >
                {session.snapshots.slice(0, 12).map((snapshot, idx) => (
                  <div
                    key={snapshot.imageId}
                    style={{
                      border: `1px solid ${design.colors.border}`,
                      borderRadius: design.radius.md,
                      overflow: "hidden",
                      backgroundColor: design.colors.surface,
                      transition: design.animation.normal,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = design.shadow.lg;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <img
                      src={snapshot.dataUrl}
                      alt={`Snapshot at ${snapshot.t}s`}
                      style={{
                        width: "100%",
                        aspectRatio: "16/9",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                    <div style={{ padding: design.spacing.sm }}>
                      <div style={{ ...design.typography.caption, color: design.colors.textSecondary, fontWeight: 500 }}>
                        {snapshot.t.toFixed(1)}s
                      </div>
                      {snapshot.label && (
                        <div style={{ ...design.typography.caption, color: design.colors.textTertiary }}>
                          {snapshot.label}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {session.snapshots.length > 12 && (
                <p style={{ marginTop: design.spacing.md, marginBottom: 0, ...design.typography.small, color: design.colors.textSecondary }}>
                  Showing 12 of {session.snapshots.length} snapshots. Download report for all images.
                </p>
              )}
            </div>
          )}

          <details
            style={{
              marginTop: design.spacing.xl,
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
                color: design.colors.text,
                ...design.typography.body,
                marginBottom: design.spacing.md,
              }}
            >
              Raw session data (JSON)
            </summary>
            <pre
              style={{
                background: design.colors.background,
                border: `1px solid ${design.colors.border}`,
                padding: design.spacing.lg,
                borderRadius: design.radius.md,
                overflow: "auto",
                ...design.typography.caption,
                color: design.colors.textSecondary,
                marginTop: design.spacing.md,
              }}
            >
              {JSON.stringify(session, null, 2)}
            </pre>
          </details>
        </>
      )}

      {session && report && (
        <div
          style={{
            marginTop: design.spacing.xxxl,
            display: "flex",
            gap: design.spacing.md,
            flexWrap: "wrap",
            paddingTop: design.spacing.lg,
            borderTop: `1px solid ${design.colors.border}`,
            alignItems: "center",
          }}
        >
          <Link
            href="/ask"
            style={{
              padding: "14px 24px",
              color: design.colors.textSecondary,
              textDecoration: "none",
              ...design.typography.body,
              fontWeight: 500,
              transition: design.animation.normal,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = design.colors.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = design.colors.textSecondary;
            }}
          >
            ← Ask AI
          </Link>
          <button
            onClick={downloadReport}
            disabled={!session || !report}
            style={{
              padding: "14px 28px",
              cursor: !session || !report ? "not-allowed" : "pointer",
              backgroundColor: !session || !report ? design.colors.borderLight : design.colors.primary,
              color: !session || !report ? design.colors.textTertiary : "#ffffff",
              border: "none",
              borderRadius: design.radius.md,
              fontWeight: 600,
              fontSize: "15px",
              transition: design.animation.normal,
              boxShadow: !session || !report ? "none" : design.shadow.md,
              opacity: !session || !report ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (session && report) {
                e.currentTarget.style.backgroundColor = design.colors.primaryHover;
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = design.shadow.lg;
              }
            }}
            onMouseLeave={(e) => {
              if (session && report) {
                e.currentTarget.style.backgroundColor = design.colors.primary;
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = design.shadow.md;
              }
            }}
          >
            📥 Download Report
          </button>
          <button
            onClick={clear}
            style={{
              padding: "14px 24px",
              cursor: "pointer",
              backgroundColor: design.colors.background,
              color: design.colors.textSecondary,
              border: `1px solid ${design.colors.border}`,
              borderRadius: design.radius.md,
              fontWeight: 500,
              fontSize: "15px",
              transition: design.animation.normal,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = design.colors.errorBackground;
              e.currentTarget.style.color = design.colors.errorText;
              e.currentTarget.style.borderColor = design.colors.errorBorder;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = design.colors.background;
              e.currentTarget.style.color = design.colors.textSecondary;
              e.currentTarget.style.borderColor = design.colors.border;
            }}
          >
            Clear Session
          </button>
        </div>
      )}
    </main>
  );
}

function ScoreCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      style={{
        border: `1px solid ${design.colors.border}`,
        borderRadius: design.radius.lg,
        padding: design.spacing.xl,
        backgroundColor: highlight ? design.colors.surface : design.colors.background,
        boxShadow: design.shadow.sm,
        transition: design.animation.normal,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = design.shadow.md;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = design.shadow.sm;
      }}
    >
      <div
        style={{
          ...design.typography.caption,
          color: design.colors.textSecondary,
          marginBottom: design.spacing.sm,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "36px",
          fontWeight: 700,
          color: highlight ? design.colors.success : design.colors.text,
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
    </div>
  );
}
