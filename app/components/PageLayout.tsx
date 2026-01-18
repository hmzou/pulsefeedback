"use client";

import Navbar from "./Navbar";

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div
        style={{
          minHeight: "calc(100vh - 73px)",
          backgroundColor: "#ffffff",
        }}
      >
        {children}
      </div>
      <footer
        style={{
          borderTop: "1px solid #e5e7eb",
          padding: "48px 32px",
          textAlign: "center",
          color: "#6b7280",
          fontSize: "14px",
          backgroundColor: "#f9fafb",
        }}
      >
        <p style={{ margin: 0, marginBottom: "8px" }}>
          <strong style={{ color: "#111827" }}>GetInsight</strong> — Invisible feedback, instant insights.
        </p>
        <p style={{ margin: 0, fontSize: "12px" }}>
          Privacy-first • No data stored on servers • All processing happens locally
        </p>
      </footer>
    </>
  );
}
