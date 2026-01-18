"use client";

interface DemoFlowProps {
  step: 1 | 2 | 3 | 4;
  isTracking: boolean;
  hasScreenShare: boolean;
  hasSaved: boolean;
}

export default function DemoFlow({ step, isTracking, hasScreenShare, hasSaved }: DemoFlowProps) {
  const steps = [
    { num: 1, label: "Start tracking", completed: isTracking },
    { num: 2, label: "Share your tab", completed: hasScreenShare },
    { num: 3, label: "Save session", completed: hasSaved },
    { num: 4, label: "Ask AI", completed: false },
  ];

  const containerStyle: React.CSSProperties = {
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "32px",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "16px",
    fontWeight: 600,
    color: "#111827",
    marginBottom: "20px",
    marginTop: 0,
  };

  const stepsContainerStyle: React.CSSProperties = {
    display: "flex",
    gap: "16px",
    alignItems: "center",
    flexWrap: "wrap",
  };

  const stepStyle = (stepNum: number, completed: boolean, isCurrent: boolean): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 16px",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: isCurrent ? 600 : 400,
      transition: "all 0.2s",
    };

    if (completed) {
      return {
        ...baseStyle,
        backgroundColor: "#10b981",
        color: "#ffffff",
      };
    } else if (isCurrent) {
      return {
        ...baseStyle,
        backgroundColor: "#111827",
        color: "#ffffff",
      };
    } else {
      return {
        ...baseStyle,
        backgroundColor: "#ffffff",
        color: "#6b7280",
        border: "1px solid #e5e7eb",
      };
    }
  };

  const connectorStyle: React.CSSProperties = {
    width: "24px",
    height: "2px",
    backgroundColor: "#e5e7eb",
    flexShrink: 0,
  };

  return (
    <div style={containerStyle}>
      <h3 style={titleStyle}>Demo Flow</h3>
      <div style={stepsContainerStyle}>
        {steps.map((s, idx) => (
          <div key={s.num} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={stepStyle(s.num, s.completed, step === s.num)}>
              <span>{s.num}.</span>
              <span>{s.label}</span>
              {s.completed && <span style={{ fontSize: "12px" }}>✓</span>}
            </div>
            {idx < steps.length - 1 && <div style={connectorStyle} />}
          </div>
        ))}
      </div>
    </div>
  );
}
