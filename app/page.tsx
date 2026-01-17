"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <main
      style={{
        padding: 48,
        fontFamily: "system-ui",
        maxWidth: 900,
        margin: "0 auto",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        backgroundColor: "#ffffff",
        color: "#000000",
      }}
    >
      <h1 style={{ fontSize: 48, fontWeight: 800, marginBottom: 16, color: "#000" }}>
        Inshight
      </h1>
      <p style={{ fontSize: 20, opacity: 0.8, marginBottom: 24, lineHeight: 1.6, color: "#000" }}>
        Replace "taking a survey" with invisible feedback collected during a short task.
        Instead of asking "Did you like this?", we capture real reactions: attention,
        engagement, micro-expressions, and more.
      </p>

      <div style={{ marginTop: 32, marginBottom: 24, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link
          href="/session"
          style={{
            display: "inline-block",
            padding: "16px 32px",
            backgroundColor: "#000",
            color: "#fff",
            borderRadius: 12,
            textDecoration: "none",
            fontWeight: 600,
            fontSize: 18,
            cursor: "pointer",
          }}
        >
          Start Session →
        </Link>
        <Link
          href="/activity"
          style={{
            display: "inline-block",
            padding: "16px 32px",
            backgroundColor: "#000",
            color: "#fff",
            borderRadius: 12,
            textDecoration: "none",
            fontWeight: 600,
            fontSize: 18,
            cursor: "pointer",
          }}
        >
          Activity Tracking →
        </Link>
        <Link
          href="/ask"
          style={{
            display: "inline-block",
            padding: "16px 32px",
            backgroundColor: "#000",
            color: "#fff",
            borderRadius: 12,
            textDecoration: "none",
            fontWeight: 600,
            fontSize: 18,
            cursor: "pointer",
          }}
        >
          Ask AI →
        </Link>
      </div>

      <div
        style={{
          marginTop: 48,
          padding: 24,
          border: "1px solid #eee",
          borderRadius: 12,
          backgroundColor: "#fafafa",
        }}
      >
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, color: "#000" }}>
          How it works
        </h2>
        <ol style={{ paddingLeft: 20, lineHeight: 1.8, color: "#000" }}>
          <li>
            <strong>Task replaces Survey:</strong> Watch a short clip (ad/product/video) —
            that&apos;s the stimulus.
          </li>
          <li>
            <strong>Continuous sensing:</strong> While watching, we record signals from your
            webcam (face presence, gaze direction, expressions).
          </li>
          <li>
            <strong>Automatic report:</strong> Signals are converted into satisfaction scores,
            tone, and insights — like SurveyMonkey, but automatic.
          </li>
          <li>
            <strong>Ask only when needed:</strong> If signals are ambiguous, we show one
            micro-question. Otherwise, you&apos;re done — zero form-filling.
          </li>
        </ol>
      </div>

      <div style={{ marginTop: 32, opacity: 0.6, fontSize: 14, color: "#000" }}>
        <Link href="/session" style={{ color: "#000", textDecoration: "underline" }}>
          Start Session
        </Link>{" "}
        •{" "}
        <Link href="/activity" style={{ color: "#000", textDecoration: "underline" }}>
          Activity Tracking
        </Link>{" "}
        •{" "}
        <Link href="/ask" style={{ color: "#000", textDecoration: "underline" }}>
          Ask AI
        </Link>{" "}
        •{" "}
        <Link href="/report" style={{ color: "#000", textDecoration: "underline" }}>
          View Report
        </Link>
      </div>
    </main>
  );
}
