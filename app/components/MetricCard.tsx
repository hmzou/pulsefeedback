"use client";

interface MetricCardProps {
  label: string;
  value: string | number;
  tooltip?: string;
  highlight?: boolean;
}

export default function MetricCard({ label, value, tooltip, highlight }: MetricCardProps) {
  const cardStyle: React.CSSProperties = {
    backgroundColor: highlight ? "#f9fafb" : "#ffffff",
    border: `1px solid ${highlight ? "#e5e7eb" : "#e5e7eb"}`,
    borderRadius: "12px",
    padding: "16px",
    minWidth: "140px",
    position: "relative",
    transition: "all 0.2s",
    cursor: tooltip ? "help" : "default",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "#6b7280",
    marginBottom: "8px",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  const valueStyle: React.CSSProperties = {
    fontSize: "24px",
    fontWeight: 700,
    color: "#111827",
    lineHeight: 1.2,
  };

  return (
    <div
      style={cardStyle}
      title={tooltip}
      onMouseEnter={(e) => {
        if (tooltip) e.currentTarget.style.boxShadow = "0 4px 6px -1px rgb(0 0 0 / 0.1)";
      }}
      onMouseLeave={(e) => {
        if (tooltip) e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>{value}</div>
      {tooltip && (
        <div
          style={{
            position: "absolute",
            top: "4px",
            right: "8px",
            fontSize: "10px",
            color: "#9ca3af",
          }}
        >
          ℹ
        </div>
      )}
    </div>
  );
}
