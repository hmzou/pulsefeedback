"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { startFaceTracking, FaceSignals } from "../lib/vision/faceTracker";
import {
  saveSession,
  type RawMetricPoint,
  type SessionEvent,
  type SessionPayload,
} from "../lib/storage/sessionStore";
import { computeEngagement, computeEmotion } from "../lib/analytics/report";

export default function SessionPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const taskVideoRef = useRef<HTMLVideoElement>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [startMs, setStartMs] = useState<number | null>(null);

  const [points, setPoints] = useState<RawMetricPoint[]>([]);
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [taskState, setTaskState] = useState<"idle" | "playing" | "done">("idle");
  const [showTaskOverlay, setShowTaskOverlay] = useState(false);

  // Live raw signals from camera (updated many times per second)
  const [liveFace, setLiveFace] = useState<FaceSignals | null>(null);

  // Track emotion history for duration-based detection
  const emotionHistoryRef = useRef<Array<{ t: number; emotion: string; smile: number }>>([]);

  const TASK_SECONDS = 8;

  const nowT = () => (startMs === null ? 0 : (Date.now() - startMs) / 1000);

  // Webcam start/stop
  useEffect(() => {
    if (!isRunning) return;

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch((err) => console.error("Camera error:", err));

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((t) => t.stop());
      }
    };
  }, [isRunning]);

  // Start face tracking AFTER webcam video element is receiving frames
  useEffect(() => {
    if (!isRunning || startMs === null) return;
    const v = videoRef.current;
    if (!v) return;

    let stopTracker: null | (() => void) = null;
    let retryCount = 0;

    const start = () => {
      // Ensure video has actual dimensions before starting tracker
      if (v.videoWidth > 0 && v.videoHeight > 0 && v.readyState >= 2) {
        stopTracker = startFaceTracking({
          videoEl: v,
          getT: nowT,
          onUpdate: (s) => setLiveFace(s),
        });
      } else if (retryCount < 20) {
        // Retry after a short delay if video isn't ready
        retryCount++;
        setTimeout(start, 200);
      }
    };

    // Start tracking once video is ready
    if (v.readyState >= 2 && v.videoWidth > 0 && v.videoHeight > 0) {
      start();
    } else {
      // Wait for video metadata
      const onLoadedMetadata = () => {
        if (v.videoWidth > 0 && v.videoHeight > 0) {
          start();
        }
      };
      v.addEventListener("loadedmetadata", onLoadedMetadata);
      start(); // Also try immediately in case it's ready

      return () => {
        v.removeEventListener("loadedmetadata", onLoadedMetadata);
        if (stopTracker) stopTracker();
        v.onloadeddata = null;
        setLiveFace(null);
      };
    }

    return () => {
      if (stopTracker) stopTracker();
      v.onloadeddata = null;
      setLiveFace(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, startMs]);

  const pushEvent = (e: SessionEvent) => setEvents((prev) => [...prev, e]);

  const startSession = () => {
    setPoints([]);
    setEvents([]);
    setTaskState("idle");
    setLiveFace(null);

    setStartMs(Date.now());
    setIsRunning(true);

    // Auto-start task after a short delay
    window.setTimeout(() => {
      startTask();
    }, 800);
  };

  const stopSession = () => {
    setIsRunning(false);
    setStartMs(null);
    setTaskState("idle");

    const tv = taskVideoRef.current;
    if (tv) tv.pause();
  };

  const startTask = async () => {
    if (!isRunning || startMs === null) return;
    if (taskState === "playing") return;

    setTaskState("playing");
    setShowTaskOverlay(true); // Show overlay when task starts
    pushEvent({ t: Number(nowT().toFixed(1)), type: "task_start", note: "Video task started" });

    // Hide overlay after 5 seconds
    setTimeout(() => {
      setShowTaskOverlay(false);
    }, 5000);

    const tv = taskVideoRef.current;
    if (tv) {
      try {
        tv.currentTime = 0;
        await tv.play();
        
        // Track video end naturally (don't auto-stop)
        tv.onended = () => {
          if (isRunning && startMs !== null) {
            pushEvent({ t: Number(nowT().toFixed(1)), type: "task_end", note: "Video task ended" });
            setTaskState("done");
            setShowTaskOverlay(false);
          }
        };
      } catch {
        // autoplay might be blocked
      }
    }
  };

  const endTask = () => {
    if (!isRunning || startMs === null) return;

    const tv = taskVideoRef.current;
    if (tv) {
      tv.pause();
      tv.onended = null; // Remove listener
    }

    pushEvent({ t: Number(nowT().toFixed(1)), type: "task_end", note: "Video task ended" });
    setTaskState("done");
  };

  // 1Hz sampler: every second we store ONE consolidated point (RAW signals only)
  useEffect(() => {
    if (!isRunning || startMs === null) return;

    const genPoint = (t: number): RawMetricPoint => {
      // still fake HR/BR for now (optional)
      const taskBoost = taskState === "playing" ? 1 : 0;
      const hr = 75 + Math.round(10 * Math.sin(t / 2)) + taskBoost * 4;
      const br = 15 + Math.round(2 * Math.sin(t / 3)) + taskBoost * 1;

      const facePresent = !!liveFace?.facePresent;
      const offScreen = !!liveFace?.offScreen;
      const eyesClosed = !!liveFace?.eyesClosed;
      const gaze = (liveFace?.gaze ?? "unknown") as RawMetricPoint["gaze"];
      const smile = liveFace?.smile ?? 0;
      const eyebrowRaised = liveFace?.eyebrowRaised ?? false;

      // Get video time if task is playing
      const tv = taskVideoRef.current;
      const videoTime = tv && taskState === "playing" && !tv.paused ? tv.currentTime : undefined;

      // Enhanced emotion detection with duration tracking
      let emotion: RawMetricPoint["emotion"] = liveFace?.emotion ?? "neutral";
      
      // Track emotion history for duration-based detection
      emotionHistoryRef.current.push({ t, emotion, smile });
      // Keep only last 10 seconds of history
      emotionHistoryRef.current = emotionHistoryRef.current.filter((e) => t - e.t < 10);

      // If current emotion is concentration (from frown), check duration
      if (emotion === "concentration") {
        const concentrationDuration = emotionHistoryRef.current.filter(
          (e) => e.emotion === "concentration" || (e.smile < 1.8 && e.emotion !== "positive")
        ).length;
        // If concentration/frown for more than 5 seconds, it's frustration
        if (concentrationDuration >= 5) {
          emotion = "frustration";
        }
      }

      // Store raw signals including enhanced emotion
      return {
        t: Number(t.toFixed(1)),
        videoTime: videoTime ? Number(videoTime.toFixed(2)) : undefined,
        hr,
        br,
        facePresent,
        offScreen,
        eyesClosed,
        gaze,
        smile: Number(smile.toFixed(2)),
        emotion,
        eyebrowRaised,
      };
    };

    const id = window.setInterval(() => {
      const t = nowT();
      setPoints((prev) => [...prev, genPoint(t)]);
    }, 1000);

    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, startMs, taskState, liveFace]);

  // Compute engagement/emotion on-the-fly for UI display (not stored)
  // Use liveFace for real-time display, fall back to latest point if liveFace is null
  const latest = useMemo(() => {
    // Prefer liveFace for real-time updates
    if (liveFace) {
      const rawPoint: RawMetricPoint = {
        t: liveFace.t,
        facePresent: liveFace.facePresent,
        offScreen: liveFace.offScreen,
        eyesClosed: liveFace.eyesClosed,
        gaze: liveFace.gaze,
        smile: liveFace.smile,
        emotion: liveFace.emotion, // Use enhanced emotion from face tracker
        eyebrowRaised: liveFace.eyebrowRaised,
        hr: undefined, // HR/BR not available from liveFace
        br: undefined,
      };
      const isTaskActive = taskState === "playing";
      return {
        ...rawPoint,
        engagement: computeEngagement(rawPoint, isTaskActive),
        // emotion already in rawPoint from liveFace
      };
    }
    
    // Fall back to latest stored point
    const point = points[points.length - 1];
    if (!point) return null;
    const isTaskActive = taskState === "playing";
    return {
      ...point,
      engagement: computeEngagement(point, isTaskActive),
      emotion: computeEmotion(point),
    };
  }, [liveFace, points, taskState]);

  const buildPayload = (): SessionPayload => ({
    startedAt: new Date().toISOString(),
    task: { seconds: TASK_SECONDS, source: "/videos/task.mp4" },
    events,
    points,
    notes:
      "Eye tracking + facial signals are real (MediaPipe). HR/BR still fake. Presage can replace these later.",
  });

  const downloadJSON = () => {
    // Download whole session (all camera data while active)
    const payload = buildPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `session-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveToLocal = () => {
    // Only save if task was started (complete session with task data)
    const hasTask = events.some((e) => e.type === "task_start");
    if (!hasTask) {
      alert("Please start the task first before saving for report.");
      return;
    }
    
    const payload = buildPayload();
    saveSession(payload);
    alert("Saved for report! You can now view it in /report");
  };

  return (
    <main style={{ padding: 32, fontFamily: "system-ui", maxWidth: 1100, color: "#000", backgroundColor: "#ffffff" }}>
      <h2 style={{ color: "#000" }}>Session</h2>
      <p style={{ color: "#000" }}>Start → {TASK_SECONDS}s video task → eye tracking + facial signals logged each second.</p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {!isRunning ? (
          <button onClick={startSession} style={{ padding: "10px 16px", cursor: "pointer" }}>
            Start Session
          </button>
        ) : (
          <button onClick={stopSession} style={{ padding: "10px 16px", cursor: "pointer" }}>
            Stop Session
          </button>
        )}

        <button
          onClick={startTask}
          disabled={!isRunning || taskState === "playing"}
          style={{
            padding: "10px 16px",
            cursor: !isRunning || taskState === "playing" ? "not-allowed" : "pointer",
          }}
        >
          Play Task
        </button>

        <button
          onClick={downloadJSON}
          disabled={points.length === 0}
          style={{
            padding: "10px 16px",
            cursor: points.length === 0 ? "not-allowed" : "pointer",
          }}
          title="Download entire session (all camera data while active)"
        >
          Download Session
        </button>

        <button
          onClick={saveToLocal}
          disabled={points.length === 0 || !events.some((e) => e.type === "task_start")}
          style={{
            padding: "10px 16px",
            cursor: points.length === 0 || !events.some((e) => e.type === "task_start") ? "not-allowed" : "pointer",
          }}
          title="Save complete session with task for report generation"
        >
          Save for Report
        </button>

        <a href="/report" style={{ alignSelf: "center" }}>
          View Report →
        </a>

        <a href="/" style={{ alignSelf: "center" }}>
          ← Back
        </a>
      </div>

      <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "420px 1fr", gap: 16 }}>
        {/* Left: webcam + task */}
        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Webcam</div>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: "100%", borderRadius: 12, border: "1px solid #ccc" }}
          />

          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
            Task Video ({taskState})
          </div>

          <div style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <video
              ref={taskVideoRef}
              src="/videos/task.mp4"
              controls
              preload="auto"
              style={{ 
                width: "100%", 
                maxWidth: "600px",
                borderRadius: 12, 
                border: "1px solid #eee",
                margin: "0 auto",
                display: "block"
              }}
            />
            {showTaskOverlay && taskState === "playing" && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 12,
                  background: "rgba(0,0,0,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 18,
                  textAlign: "center",
                  padding: 12,
                  pointerEvents: "none",
                }}
              >
                Task running… just watch 🙂
              </div>
            )}
          </div>

          <div style={{ marginTop: 10, fontSize: 14, opacity: 0.8 }}>
            Status: <b>{isRunning ? "Recording" : "Idle"}</b> • Samples: <b>{points.length}</b>
          </div>
        </div>

        {/* Right: live metrics */}
        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Live Metrics</h3>

          {isRunning && !liveFace && (
            <div style={{ padding: 8, background: "#fff3cd", borderRadius: 8, marginBottom: 12, fontSize: 12 }}>
              ⚠ Face tracker initializing... Make sure your face is visible in the camera.
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Card label="Face present" value={latest ? (latest.facePresent ? "Yes" : "No") : "—"} />
            <Card label="Gaze" value={latest ? latest.gaze : "—"} />
            <Card label="Eyes closed" value={latest ? (latest.eyesClosed ? "Yes" : "No") : "—"} />
            <Card label="Off-screen" value={latest ? (latest.offScreen ? "Yes" : "No") : "—"} />
            <Card label="Smile" value={latest ? `${latest.smile}` : "—"} />
            <Card
              label="Engagement"
              value={latest ? `${latest.engagement}` : "—"}
            />
            <Card label="Emotion" value={latest ? latest.emotion : "—"} />
          </div>

          <h4 style={{ marginTop: 16 }}>Events</h4>
          <ul style={{ marginTop: 8 }}>
            {events.length === 0 ? (
              <li style={{ opacity: 0.7 }}>No events yet</li>
            ) : (
              events.map((e, idx) => (
                <li key={idx}>
                  <b>{e.type}</b> @ {e.t}s {e.note ? `— ${e.note}` : ""}
                </li>
              ))
            )}
          </ul>

          <h4 style={{ marginTop: 16 }}>Recent points</h4>
          <pre
            style={{
              background: "#fafafa",
              border: "1px solid #eee",
              padding: 12,
              borderRadius: 12,
              maxHeight: 240,
              overflow: "auto",
              fontSize: 12,
            }}
          >
            {JSON.stringify(points.slice(-8), null, 2)}
          </pre>
        </div>
      </div>
    </main>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
      <div style={{ fontSize: 12, opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{value}</div>
    </div>
  );
}
