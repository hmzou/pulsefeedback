"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const navStyle: React.CSSProperties = {
    position: "sticky",
    top: 0,
    zIndex: 100,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid #e5e7eb",
    padding: "16px 0",
    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.05)",
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };

  const logoStyle: React.CSSProperties = {
    fontSize: "20px",
    fontWeight: 700,
    color: "#111827",
    textDecoration: "none",
    letterSpacing: "-0.02em",
  };

  const navLinksStyle: React.CSSProperties = {
    display: "flex",
    gap: "32px",
    alignItems: "center",
  };

  const linkStyle = (isActive: boolean): React.CSSProperties => ({
    color: isActive ? "#111827" : "#6b7280",
    textDecoration: "none",
    fontSize: "15px",
    fontWeight: isActive ? 600 : 400,
    transition: "color 0.2s",
    position: "relative",
    paddingBottom: "4px",
  });

  return (
    <nav style={navStyle}>
      <div style={containerStyle}>
        <Link href="/" style={logoStyle}>
          GetInsight
        </Link>
        <div style={navLinksStyle}>
          <Link
            href="/"
            style={linkStyle(pathname === "/")}
            onMouseEnter={(e) => {
              if (pathname !== "/") e.currentTarget.style.color = "#111827";
            }}
            onMouseLeave={(e) => {
              if (pathname !== "/") e.currentTarget.style.color = "#6b7280";
            }}
          >
            Home
          </Link>
          <Link
            href="/activity"
            style={linkStyle(pathname === "/activity")}
            onMouseEnter={(e) => {
              if (pathname !== "/activity") e.currentTarget.style.color = "#111827";
            }}
            onMouseLeave={(e) => {
              if (pathname !== "/activity") e.currentTarget.style.color = "#6b7280";
            }}
          >
            Activity
          </Link>
          <Link
            href="/report"
            style={linkStyle(pathname === "/report")}
            onMouseEnter={(e) => {
              if (pathname !== "/report") e.currentTarget.style.color = "#111827";
            }}
            onMouseLeave={(e) => {
              if (pathname !== "/report") e.currentTarget.style.color = "#6b7280";
            }}
          >
            Report
          </Link>
          <Link
            href="/ask"
            style={linkStyle(pathname === "/ask")}
            onMouseEnter={(e) => {
              if (pathname !== "/ask") e.currentTarget.style.color = "#111827";
            }}
            onMouseLeave={(e) => {
              if (pathname !== "/ask") e.currentTarget.style.color = "#6b7280";
            }}
          >
            Ask AI
          </Link>
          <Link
            href="/analytics"
            style={linkStyle(pathname === "/analytics")}
            onMouseEnter={(e) => {
              if (pathname !== "/analytics") e.currentTarget.style.color = "#111827";
            }}
            onMouseLeave={(e) => {
              if (pathname !== "/analytics") e.currentTarget.style.color = "#6b7280";
            }}
          >
            Analytics
          </Link>
        </div>
      </div>
    </nav>
  );
}
