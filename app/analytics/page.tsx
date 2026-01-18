"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { loadSession, type SessionPayload, type RawMetricPoint } from "../lib/storage/sessionStore";
import { computeEngagement, type ComputedMetricPoint } from "../lib/analytics/report";
import { design } from "../lib/design/styles";

// Simple SVG Line Chart Component
function LineChart({
  data,
  width = 800,
  height = 300,
  label = "Value",
  color = design.colors.primary,
}: {
  data: Array<{ x: number; y: number }>;
  width?: number;
  height?: number;
  label?: string;
  color?: string;
}) {
  if (data.length === 0) return null;

  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const xMin = Math.min(...data.map((d) => d.x));
  const xMax = Math.max(...data.map((d) => d.x));
  const yMin = 0;
  const yMax = Math.max(1, ...data.map((d) => d.y)) * 1.1; // Add 10% padding

  const scaleX = (x: number) => padding + ((x - xMin) / (xMax - xMin || 1)) * chartWidth;
  const scaleY = (y: number) => padding + chartHeight - (y / yMax) * chartHeight;

  const points = data.map((d) => `${scaleX(d.x)},${scaleY(d.y)}`).join(" ");

  // Generate grid lines
  const gridLinesY = Array.from({ length: 5 }, (_, i) => {
    const y = (yMax / 5) * i;
    return { y: scaleY(y), label: y.toFixed(2) };
  });

  const gridLinesX = Array.from({ length: 6 }, (_, i) => {
    const x = xMin + ((xMax - xMin) / 5) * i;
    return { x: scaleX(x), label: x.toFixed(1) };
  });

  return (
    <svg width={width} height={height} style={{ display: "block", margin: "0 auto" }}>
      {/* Grid lines */}
      {gridLinesY.map((line, i) => (
        <g key={`y-${i}`}>
          <line
            x1={padding}
            y1={line.y}
            x2={width - padding}
            y2={line.y}
            stroke={design.colors.border}
            strokeWidth={1}
            strokeDasharray="2,2"
          />
          <text
            x={padding - 10}
            y={line.y + 5}
            fill={design.colors.textSecondary}
            fontSize="12"
            textAnchor="end"
          >
            {line.label}
          </text>
        </g>
      ))}
      {gridLinesX.map((line, i) => (
        <g key={`x-${i}`}>
          <line
            x1={line.x}
            y1={padding}
            x2={line.x}
            y2={height - padding}
            stroke={design.colors.border}
            strokeWidth={1}
            strokeDasharray="2,2"
          />
          <text
            x={line.x}
            y={height - padding + 20}
            fill={design.colors.textSecondary}
            fontSize="12"
            textAnchor="middle"
          >
            {line.label}s
          </text>
        </g>
      ))}

      {/* Axes */}
      <line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        stroke={design.colors.text}
        strokeWidth={2}
      />
      <line
        x1={padding}
        y1={padding}
        x2={padding}
        y2={height - padding}
        stroke={design.colors.text}
        strokeWidth={2}
      />

      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Data points */}
      {data.map((d, i) => (
        <circle
          key={i}
          cx={scaleX(d.x)}
          cy={scaleY(d.y)}
          r={3}
          fill={color}
          stroke="#ffffff"
          strokeWidth={2}
        />
      ))}

      {/* Labels */}
      <text
        x={width / 2}
        y={height - 10}
        fill={design.colors.textSecondary}
        fontSize="14"
        fontWeight={600}
        textAnchor="middle"
      >
        Time (seconds)
      </text>
      <text
        x={15}
        y={height / 2}
        fill={design.colors.textSecondary}
        fontSize="14"
        fontWeight={600}
        textAnchor="middle"
        transform={`rotate(-90, 15, ${height / 2})`}
      >
        {label}
      </text>
    </svg>
  );
}

// Bar Chart Component
function BarChart({
  data,
  width = 600,
  height = 300,
  label = "Value",
  color = design.colors.primary,
}: {
  data: Array<{ label: string; value: number }>;
  width?: number;
  height?: number;
  label?: string;
  color?: string;
}) {
  if (data.length === 0) return null;

  const padding = 60;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const barWidth = chartWidth / data.length / 2;
  const maxValue = Math.max(...data.map((d) => d.value));

  const scaleY = (value: number) => (value / maxValue) * chartHeight;

  return (
    <svg width={width} height={height} style={{ display: "block", margin: "0 auto" }}>
      {/* Axes */}
      <line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        stroke={design.colors.text}
        strokeWidth={2}
      />
      <line
        x1={padding}
        y1={padding}
        x2={padding}
        y2={height - padding}
        stroke={design.colors.text}
        strokeWidth={2}
      />

      {/* Bars */}
      {data.map((d, i) => {
        const x = padding + (i * chartWidth) / data.length + barWidth / 2;
        const barHeight = scaleY(d.value);
        const y = height - padding - barHeight;

        return (
          <g key={i}>
            <rect
              x={x - barWidth / 2}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={color}
              opacity={0.7}
              rx={4}
            />
            <text
              x={x}
              y={y - 5}
              fill={design.colors.text}
              fontSize="12"
              fontWeight={600}
              textAnchor="middle"
            >
              {d.value.toFixed(2)}
            </text>
            <text
              x={x}
              y={height - padding + 20}
              fill={design.colors.textSecondary}
              fontSize="11"
              textAnchor="middle"
              transform={`rotate(-45, ${x}, ${height - padding + 20})`}
            >
              {d.label}
            </text>
          </g>
        );
      })}

      {/* Y-axis labels */}
      {Array.from({ length: 5 }, (_, i) => {
        const value = (maxValue / 4) * i;
        const y = height - padding - scaleY(value);
        return (
          <g key={i}>
            <text
              x={padding - 10}
              y={y + 5}
              fill={design.colors.textSecondary}
              fontSize="12"
              textAnchor="end"
            >
              {value.toFixed(2)}
            </text>
          </g>
        );
      })}

      {/* Labels */}
      <text
        x={width / 2}
        y={height - 10}
        fill={design.colors.textSecondary}
        fontSize="14"
        fontWeight={600}
        textAnchor="middle"
      >
        Gaze Direction
      </text>
      <text
        x={15}
        y={height / 2}
        fill={design.colors.textSecondary}
        fontSize="14"
        fontWeight={600}
        textAnchor="middle"
        transform={`rotate(-90, 15, ${height / 2})`}
      >
        {label}
      </text>
    </svg>
  );
}

export default function AnalyticsPage() {
  const [session, setSession] = useState<SessionPayload | null>(null);

  useEffect(() => {
    setSession(loadSession());
  }, []);

  // Compute engagement for all points
  const computedPoints = useMemo<ComputedMetricPoint[]>(() => {
    if (!session || !session.points.length) return [];

    return session.points.map((point) => ({
      ...point,
      engagement: computeEngagement(point, session.mode === "task"),
    }));
  }, [session]);

  // Engagement vs Time data
  const engagementTimeData = useMemo(() => {
    return computedPoints.map((p) => ({ x: p.t, y: p.engagement }));
  }, [computedPoints]);

  // Engagement vs Gaze data
  const engagementGazeData = useMemo(() => {
    const gazeMap = new Map<string, { count: number; totalEngagement: number }>();

    computedPoints.forEach((p) => {
      const gaze = p.gaze || "unknown";
      const existing = gazeMap.get(gaze) || { count: 0, totalEngagement: 0 };
      gazeMap.set(gaze, {
        count: existing.count + 1,
        totalEngagement: existing.totalEngagement + p.engagement,
      });
    });

    return Array.from(gazeMap.entries())
      .map(([label, data]) => ({
        label: label.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        value: data.totalEngagement / data.count, // Average engagement per gaze direction
      }))
      .sort((a, b) => b.value - a.value);
  }, [computedPoints]);

  // Emotion over time
  const emotionTimeData = useMemo(() => {
    const emotionValues: Record<string, number> = {
      positive: 1,
      neutral: 0.5,
      negative: -0.5,
      concentration: 0.3,
      frustration: -0.3,
      confusion: -0.2,
    };

    return computedPoints.map((p) => ({
      x: p.t,
      y: emotionValues[p.emotion] || 0,
    }));
  }, [computedPoints]);

  // Smile over time
  const smileTimeData = useMemo(() => {
    return computedPoints.map((p) => ({ x: p.t, y: p.smile / 3 })); // Normalize to 0-1
  }, [computedPoints]);

  if (!session) {
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
            📊 Analytics & Charts
          </h2>
          <p style={{ ...design.typography.body, color: design.colors.textSecondary, margin: 0 }}>
            Visualize your session data with interactive charts and graphs.
          </p>
        </div>

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
      </main>
    );
  }

  if (computedPoints.length === 0) {
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
            📊 Analytics & Charts
          </h2>
          <p style={{ ...design.typography.body, color: design.colors.textSecondary, margin: 0 }}>
            Visualize your session data with interactive charts and graphs.
          </p>
        </div>

        <div
          style={{
            border: `1px solid ${design.colors.border}`,
            borderRadius: design.radius.lg,
            padding: design.spacing.xl,
            backgroundColor: design.colors.surface,
            boxShadow: design.shadow.sm,
          }}
        >
          <p style={{ margin: 0, color: design.colors.textSecondary, ...design.typography.body }}>
            Session loaded but no data points available for visualization.
          </p>
        </div>
      </main>
    );
  }

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
          📊 Analytics & Charts
        </h2>
        <p style={{ ...design.typography.body, color: design.colors.textSecondary, margin: 0 }}>
          Visualize your session data with interactive charts and graphs. Based on {computedPoints.length} data points from{" "}
          {session.mode || "task"} mode.
        </p>
      </div>

      {/* Engagement vs Time */}
      <div
        style={{
          border: `1px solid ${design.colors.border}`,
          borderRadius: design.radius.lg,
          padding: design.spacing.xl,
          backgroundColor: design.colors.background,
          boxShadow: design.shadow.md,
          marginBottom: design.spacing.xl,
        }}
      >
        <h3 style={{ ...design.typography.h3, marginTop: 0, marginBottom: design.spacing.lg, color: design.colors.text }}>
          📈 Engagement vs Time
        </h3>
        <p style={{ ...design.typography.small, color: design.colors.textSecondary, marginBottom: design.spacing.lg }}>
          Shows how your engagement level changed over time during the session. Higher values indicate more focused attention.
        </p>
        <LineChart data={engagementTimeData} label="Engagement" color={design.colors.success} />
      </div>

      {/* Engagement vs Gaze Direction */}
      <div
        style={{
          border: `1px solid ${design.colors.border}`,
          borderRadius: design.radius.lg,
          padding: design.spacing.xl,
          backgroundColor: design.colors.background,
          boxShadow: design.shadow.md,
          marginBottom: design.spacing.xl,
        }}
      >
        <h3 style={{ ...design.typography.h3, marginTop: 0, marginBottom: design.spacing.lg, color: design.colors.text }}>
          👁️ Average Engagement by Gaze Direction
        </h3>
        <p style={{ ...design.typography.small, color: design.colors.textSecondary, marginBottom: design.spacing.lg }}>
          Shows average engagement for each gaze direction. Center/upper-center typically indicates higher engagement.
        </p>
        <BarChart data={engagementGazeData} label="Avg Engagement" color={design.colors.accent} />
      </div>

      {/* Emotion over Time */}
      <div
        style={{
          border: `1px solid ${design.colors.border}`,
          borderRadius: design.radius.lg,
          padding: design.spacing.xl,
          backgroundColor: design.colors.background,
          boxShadow: design.shadow.md,
          marginBottom: design.spacing.xl,
        }}
      >
        <h3 style={{ ...design.typography.h3, marginTop: 0, marginBottom: design.spacing.lg, color: design.colors.text }}>
          😊 Emotion Over Time
        </h3>
        <p style={{ ...design.typography.small, color: design.colors.textSecondary, marginBottom: design.spacing.lg }}>
          Shows emotional state changes over time. Positive values = positive emotions, negative = frustration/confusion.
        </p>
        <LineChart
          data={emotionTimeData}
          label="Emotion"
          color={emotionTimeData.some((d) => d.y < 0) ? design.colors.warning : design.colors.success}
        />
      </div>

      {/* Smile Over Time */}
      <div
        style={{
          border: `1px solid ${design.colors.border}`,
          borderRadius: design.radius.lg,
          padding: design.spacing.xl,
          backgroundColor: design.colors.background,
          boxShadow: design.shadow.md,
        }}
      >
        <h3 style={{ ...design.typography.h3, marginTop: 0, marginBottom: design.spacing.lg, color: design.colors.text }}>
          😃 Smile Intensity Over Time
        </h3>
        <p style={{ ...design.typography.small, color: design.colors.textSecondary, marginBottom: design.spacing.lg }}>
          Shows smile intensity (normalized 0-1) over time. Higher values indicate more positive expressions.
        </p>
        <LineChart data={smileTimeData} label="Smile Intensity" color={design.colors.warning} />
      </div>

      {/* Summary Stats */}
      <div
        style={{
          marginTop: design.spacing.xl,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: design.spacing.md,
        }}
      >
        <div
          style={{
            border: `1px solid ${design.colors.border}`,
            borderRadius: design.radius.md,
            padding: design.spacing.lg,
            backgroundColor: design.colors.surface,
            textAlign: "center",
          }}
        >
          <div style={{ ...design.typography.caption, color: design.colors.textSecondary, marginBottom: design.spacing.xs }}>
            Avg Engagement
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: design.colors.text }}>
            {computedPoints.length > 0
              ? (computedPoints.reduce((sum, p) => sum + p.engagement, 0) / computedPoints.length).toFixed(2)
              : "—"}
          </div>
        </div>
        <div
          style={{
            border: `1px solid ${design.colors.border}`,
            borderRadius: design.radius.md,
            padding: design.spacing.lg,
            backgroundColor: design.colors.surface,
            textAlign: "center",
          }}
        >
          <div style={{ ...design.typography.caption, color: design.colors.textSecondary, marginBottom: design.spacing.xs }}>
            Peak Engagement
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: design.colors.success }}>
            {computedPoints.length > 0 ? Math.max(...computedPoints.map((p) => p.engagement)).toFixed(2) : "—"}
          </div>
        </div>
        <div
          style={{
            border: `1px solid ${design.colors.border}`,
            borderRadius: design.radius.md,
            padding: design.spacing.lg,
            backgroundColor: design.colors.surface,
            textAlign: "center",
          }}
        >
          <div style={{ ...design.typography.caption, color: design.colors.textSecondary, marginBottom: design.spacing.xs }}>
            Session Duration
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: design.colors.text }}>
            {computedPoints.length > 0
              ? `${Math.max(...computedPoints.map((p) => p.t)).toFixed(1)}s`
              : "—"}
          </div>
        </div>
        <div
          style={{
            border: `1px solid ${design.colors.border}`,
            borderRadius: design.radius.md,
            padding: design.spacing.lg,
            backgroundColor: design.colors.surface,
            textAlign: "center",
          }}
        >
          <div style={{ ...design.typography.caption, color: design.colors.textSecondary, marginBottom: design.spacing.xs }}>
            Data Points
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: design.colors.text }}>{computedPoints.length}</div>
        </div>
      </div>
    </main>
  );
}
