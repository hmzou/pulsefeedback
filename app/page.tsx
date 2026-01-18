"use client";

import Link from "next/link";
import { design } from "./lib/design/styles";

export default function LandingPage() {
  const heroStyle: React.CSSProperties = {
    background: design.gradients.subtle,
    padding: `${design.spacing.xxxl} ${design.spacing.xl}`,
    textAlign: "center",
    maxWidth: "900px",
    margin: "0 auto",
  };

  const headingStyle: React.CSSProperties = {
    ...design.typography.h1,
    color: design.colors.text,
    marginBottom: design.spacing.lg,
    background: design.gradients.primary,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  };

  const subtitleStyle: React.CSSProperties = {
    ...design.typography.bodyLarge,
    color: design.colors.textSecondary,
    marginBottom: design.spacing.xxl,
    maxWidth: "700px",
    margin: `0 auto ${design.spacing.xxl} auto`,
    lineHeight: 1.7,
  };

  const ctaContainerStyle: React.CSSProperties = {
    display: "flex",
    gap: design.spacing.md,
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: design.spacing.xxxl,
  };

  const buttonPrimaryStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: "16px 32px",
    backgroundColor: design.colors.primary,
    color: "#ffffff",
    borderRadius: design.radius.md,
    textDecoration: "none",
    fontWeight: 600,
    fontSize: "16px",
    cursor: "pointer",
    transition: design.animation.normal,
    border: "none",
    boxShadow: design.shadow.md,
  };

  const buttonSecondaryStyle: React.CSSProperties = {
    ...buttonPrimaryStyle,
    backgroundColor: "#ffffff",
    color: design.colors.primary,
    border: `1px solid ${design.colors.border}`,
    boxShadow: design.shadow.sm,
  };

  const sectionStyle: React.CSSProperties = {
    padding: `${design.spacing.xxxl} ${design.spacing.xl}`,
    maxWidth: "1200px",
    margin: "0 auto",
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: design.colors.surface,
    border: `1px solid ${design.colors.border}`,
    borderRadius: design.radius.lg,
    padding: design.spacing.xl,
    boxShadow: design.shadow.sm,
    marginBottom: design.spacing.xl,
  };

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: design.spacing.xl,
    marginTop: design.spacing.xl,
  };

  return (
    <main style={{ backgroundColor: design.colors.background }}>
      {/* Hero Section */}
      <section style={heroStyle}>
        <h1 style={headingStyle}>GetInsight</h1>
        <p style={subtitleStyle}>
          Replace surveys with invisible feedback. Capture real reactions during tasks using webcam
          signals — attention, engagement, micro-expressions, and more. Zero form-filling required.
        </p>

        <div style={ctaContainerStyle}>
          <Link
            href="/activity"
            style={buttonPrimaryStyle}
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
            Start Demo →
          </Link>
          <Link
            href="/report"
            style={buttonSecondaryStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = design.colors.surface;
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ffffff";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            View Report
          </Link>
          <Link
            href="/ask"
            style={buttonSecondaryStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = design.colors.surface;
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ffffff";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Ask AI
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section style={sectionStyle}>
        <h2 style={{ ...design.typography.h2, textAlign: "center", marginBottom: design.spacing.xl, color: design.colors.text }}>
          How It Works
        </h2>
        <div style={gridStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: "32px", marginBottom: design.spacing.md }}>🎯</div>
            <h3 style={{ ...design.typography.h4, marginBottom: design.spacing.sm, color: design.colors.text }}>
              Task replaces Survey
            </h3>
            <p style={{ ...design.typography.body, color: design.colors.textSecondary, margin: 0 }}>
              Watch a short clip or interact with content — that&apos;s the stimulus. No forms, no questions.
            </p>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: "32px", marginBottom: design.spacing.md }}>📊</div>
            <h3 style={{ ...design.typography.h4, marginBottom: design.spacing.sm, color: design.colors.text }}>
              Continuous Sensing
            </h3>
            <p style={{ ...design.typography.body, color: design.colors.textSecondary, margin: 0 }}>
              While you watch, we record signals from your webcam: face presence, gaze direction, expressions, and engagement.
            </p>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: "32px", marginBottom: design.spacing.md }}>✨</div>
            <h3 style={{ ...design.typography.h4, marginBottom: design.spacing.sm, color: design.colors.text }}>
              Automatic Report
            </h3>
            <p style={{ ...design.typography.body, color: design.colors.textSecondary, margin: 0 }}>
              Signals are converted into satisfaction scores, tone, and insights — like SurveyMonkey, but automatic.
            </p>
          </div>
        </div>
      </section>

      {/* Why It Matters */}
      <section style={{ ...sectionStyle, backgroundColor: design.colors.surface }}>
        <h2 style={{ ...design.typography.h2, textAlign: "center", marginBottom: design.spacing.xl, color: design.colors.text }}>
          Why It Matters
        </h2>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={cardStyle}>
            <ul style={{ margin: 0, paddingLeft: "24px", color: design.colors.textSecondary }}>
              <li style={{ marginBottom: design.spacing.md, ...design.typography.body }}>
                <strong style={{ color: design.colors.text }}>Surveys feel like work.</strong> GetInsight turns feedback into
                something that happens while you&apos;re already watching or doing something — zero friction.
              </li>
              <li style={{ marginBottom: 0, ...design.typography.body }}>
                <strong style={{ color: design.colors.text }}>Real reactions over self-reporting.</strong> Capture genuine
                engagement, confusion, and emotion without asking leading questions.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Privacy & Ethics */}
      <section style={sectionStyle}>
        <div style={{ ...cardStyle, maxWidth: "700px", margin: "0 auto", textAlign: "center" }}>
          <h3 style={{ ...design.typography.h3, marginBottom: design.spacing.md, color: design.colors.text }}>
            Privacy & Ethics
          </h3>
          <p style={{ ...design.typography.body, color: design.colors.textSecondary, margin: 0 }}>
            All processing happens locally in your browser. No video is uploaded, no data is stored on our servers, and you
            control what gets saved. We believe feedback should be invisible, but never invasive.
          </p>
        </div>
      </section>
    </main>
  );
}
