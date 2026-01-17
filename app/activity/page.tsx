"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { startFaceTracking, FaceSignals } from "../lib/vision/faceTracker";
import {
  saveSession,
  type RawMetricPoint,
  type SessionEvent,
  type SessionPayload,
  type Snapshot,
} from "../lib/storage/sessionStore";
import { computeEngagement, computeEmotion } from "../lib/analytics/report";
import { isConfusionCandidate } from "../lib/analytics/confusion";

export default function ActivityPage() {
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [startMs, setStartMs] = useState<number | null>(null);

  const [points, setPoints] = useState<RawMetricPoint[]>([]);
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [liveFace, setLiveFace] = useState<FaceSignals | null>(null);

  // Track emotion history for duration-based detection
  const emotionHistoryRef = useRef<Array<{ t: number; emotion: string; smile: number }>>([]);
  
  // Track eyes closed duration for confusion detection
  const eyesClosedStartRef = useRef<number | null>(null);
  const lastSnapshotTimeRef = useRef<number>(0); // Cooldown for snapshots

  const nowT = () => (startMs === null ? 0 : (Date.now() - startMs) / 1000);

  // Webcam stream
  const webcamStreamRef = useRef<MediaStream | null>(null);
  // Screen share stream
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Webcam setup
  useEffect(() => {
    if (!isRunning || startMs === null) return;

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (webcamVideoRef.current) {
          webcamVideoRef.current.srcObject = stream;
          webcamStreamRef.current = stream;
        }
      })
      .catch((err) => {
        console.error("Webcam error:", err);
        alert("Failed to access webcam. Please grant camera permissions.");
      });

    return () => {
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach((t) => t.stop());
        webcamStreamRef.current = null;
      }
    };
  }, [isRunning, startMs]);

  // Screen share setup
  useEffect(() => {
    if (!isRunning || startMs === null) return;

    navigator.mediaDevices
      .getDisplayMedia({ video: true, audio: false })
      .then((stream) => {
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
          screenStreamRef.current = stream;

          // Handle user stopping screen share from browser UI
          stream.getVideoTracks()[0].addEventListener("ended", () => {
            stopActivity();
          });
        }
      })
      .catch((err) => {
        console.error("Screen share error:", err);
        if (err.name !== "NotAllowedError") {
          alert("Failed to access screen share. Please grant screen sharing permissions.");
        }
        // If screen share denied, stop the whole activity
        stopActivity();
      });

    return () => {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
    };
  }, [isRunning, startMs]);

  // Start face tracking
  useEffect(() => {
    if (!isRunning || startMs === null) return;
    const v = webcamVideoRef.current;
    if (!v) return;

    let stopTracker: null | (() => void) = null;

    const start = () => {
      if (v.videoWidth > 0 && v.videoHeight > 0 && v.readyState >= 2) {
        stopTracker = startFaceTracking({
          videoEl: v,
          getT: nowT,
          onUpdate: (s) => setLiveFace(s),
        });
      }
    };

    if (v.readyState >= 2 && v.videoWidth > 0 && v.videoHeight > 0) {
      start();
    } else {
      const onLoadedMetadata = () => {
        if (v.videoWidth > 0 && v.videoHeight > 0) {
          start();
        }
      };
      v.addEventListener("loadedmetadata", onLoadedMetadata);
      return () => {
        v.removeEventListener("loadedmetadata", onLoadedMetadata);
        if (stopTracker) stopTracker();
        setLiveFace(null);
      };
    }

    return () => {
      if (stopTracker) stopTracker();
      v.onloadeddata = null;
      setLiveFace(null);
    };
  }, [isRunning, startMs]);

  const pushEvent = (e: SessionEvent) => setEvents((prev) => [...prev, e]);

  const startActivity = () => {
    setPoints([]);
    setEvents([]);
    setSnapshots([]);
    setLiveFace(null);
    lastSnapshotTimeRef.current = 0;
    eyesClosedStartRef.current = null;
    emotionHistoryRef.current = [];

    setStartMs(Date.now());
    setIsRunning(true);

    pushEvent({ t: 0, type: "activity_start", note: "Activity tracking started" });
  };

  const stopActivity = () => {
    setIsRunning(false);
    pushEvent({ t: Number(nowT().toFixed(1)), type: "activity_end", note: "Activity tracking stopped" });
    
    // Cleanup streams
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach((t) => t.stop());
      webcamStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    
    setStartMs(null);
  };

  // Capture screen snapshot
  const captureSnapshot = (t: number): void => {
    const screenEl = screenVideoRef.current;
    if (!screenEl || screenEl.videoWidth === 0) return;

    // Cooldown: max 1 snapshot per 3 seconds
    if (t - lastSnapshotTimeRef.current < 3) return;
    
    // Max 25 snapshots per run
    if (snapshots.length >= 25) return;

    try {
      const canvas = document.createElement("canvas");
      canvas.width = screenEl.videoWidth;
      canvas.height = screenEl.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(screenEl, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8); // JPEG at 80% quality

      const imageId = `snap_${Math.floor(t)}_${snapshots.length + 1}`;
      const snapshot: Snapshot = {
        imageId,
        t: Number(t.toFixed(1)),
        kind: "screen",
        dataUrl,
        label: "confusion_candidate",
      };

      setSnapshots((prev) => [...prev, snapshot]);
      lastSnapshotTimeRef.current = t;
    } catch (err) {
      console.error("Snapshot capture error:", err);
    }
  };

  // 1Hz sampler: collect points and detect confusion
  useEffect(() => {
    if (!isRunning || startMs === null) return;

    const genPoint = (t: number): RawMetricPoint => {
      // Fake HR/BR for now (will be replaced with Presage later)
      const hr = 75 + Math.round(10 * Math.sin(t / 2));
      const br = 15 + Math.round(2 * Math.sin(t / 3));

      const facePresent = !!liveFace?.facePresent;
      const offScreen = !!liveFace?.offScreen;
      const eyesClosed = !!liveFace?.eyesClosed;
      const gaze = (liveFace?.gaze ?? "unknown") as RawMetricPoint["gaze"];
      const smile = liveFace?.smile ?? 0;
      const eyebrowRaised = liveFace?.eyebrowRaised ?? false;

      // Track eyes closed duration
      if (eyesClosed) {
        if (eyesClosedStartRef.current === null) {
          eyesClosedStartRef.current = t;
        }
      } else {
        eyesClosedStartRef.current = null;
      }
      const eyesClosedDuration = eyesClosedStartRef.current ? t - eyesClosedStartRef.current : 0;

      // Enhanced emotion detection with duration tracking
      let emotion: RawMetricPoint["emotion"] = liveFace?.emotion ?? "neutral";
      emotionHistoryRef.current.push({ t, emotion, smile });
      emotionHistoryRef.current = emotionHistoryRef.current.filter((e) => t - e.t < 10);

      if (emotion === "concentration") {
        const concentrationDuration = emotionHistoryRef.current.filter(
          (e) => e.emotion === "concentration" || (e.smile < 1.8 && e.emotion !== "positive")
        ).length;
        if (concentrationDuration >= 5) {
          emotion = "frustration";
        }
      }

      const point: RawMetricPoint = {
        t: Number(t.toFixed(1)),
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

      // Check for confusion candidate (eyesClosedDuration already computed above)
      const isConfusion = isConfusionCandidate(point, true, eyesClosedDuration);
      if (isConfusion) {
        captureSnapshot(t);
      }

      return point;
    };

    const id = window.setInterval(() => {
      const t = nowT();
      const point = genPoint(t);
      setPoints((prev) => [...prev, point]);
    }, 1000);

    return () => window.clearInterval(id);
  }, [isRunning, startMs, liveFace]);

  // Compute latest for UI display
  const latest = useMemo(() => {
    if (liveFace) {
      const rawPoint: RawMetricPoint = {
        t: liveFace.t,
        facePresent: liveFace.facePresent,
        offScreen: liveFace.offScreen,
        eyesClosed: liveFace.eyesClosed,
        gaze: liveFace.gaze,
        smile: liveFace.smile,
        emotion: liveFace.emotion,
        eyebrowRaised: liveFace.eyebrowRaised,
        hr: undefined,
        br: undefined,
      };
      return {
        ...rawPoint,
        engagement: computeEngagement(rawPoint, true),
      };
    }
    const point = points[points.length - 1];
    if (!point) return null;
    return {
      ...point,
      engagement: computeEngagement(point, true),
    };
  }, [liveFace, points]);

  const buildPayload = (): SessionPayload => ({
    startedAt: new Date().toISOString(),
    mode: "activity",
    events,
    points,
    snapshots: snapshots.slice(0, 25), // Cap at 25
    notes: "Activity tracking with screen share. Face tracking via MediaPipe. HR/BR still fake (Presage can replace).",
  });

  const saveToLocal = () => {
    if (points.length === 0) {
      alert("No data to save. Start tracking first.");
      return;
    }
    const payload = buildPayload();
    saveSession(payload);
    alert("Activity session saved! You can now view it in /report or ask AI in /ask");
  };

  return (
    <main style={{ padding: 32, fontFamily: "system-ui", maxWidth: 1200, color: "#000", backgroundColor: "#ffffff" }}>
      <h2 style={{ color: "#000" }}>Activity Tracking</h2>
      <p style={{ color: "#000" }}>Track your engagement during any activity (YouTube, lectures, Zoom, etc.)</p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
        {!isRunning ? (
          <button onClick={startActivity} style={{ padding: "10px 16px", cursor: "pointer" }}>
            Start Activity Tracking
          </button>
        ) : (
          <button onClick={stopActivity} style={{ padding: "10px 16px", cursor: "pointer" }}>
            Stop
          </button>
        )}

        <button
          onClick={saveToLocal}
          disabled={points.length === 0}
          style={{
            padding: "10px 16px",
            cursor: points.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          Save for Report
        </button>

        <a href="/report" style={{ alignSelf: "center" }}>
          Go to Report →
        </a>

        <a href="/ask" style={{ alignSelf: "center" }}>
          Ask AI →
        </a>

        <a href="/" style={{ alignSelf: "center" }}>
          ← Back
        </a>
      </div>

      <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Left: Webcam */}
        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Webcam Preview</div>
          <video
            ref={webcamVideoRef}
            autoPlay
            playsInline
            muted
            style={{ width: "100%", borderRadius: 12, border: "1px solid #ccc" }}
          />
        </div>

        {/* Right: Screen Share */}
        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Screen Share Preview</div>
          <video
            ref={screenVideoRef}
            autoPlay
            playsInline
            muted
            style={{ width: "100%", borderRadius: 12, border: "1px solid #ccc" }}
          />
        </div>
      </div>

      {/* Live Metrics */}
      <div style={{ marginTop: 24, border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
        <h3 style={{ marginTop: 0 }}>Live Metrics</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
          <Card label="Face present" value={latest ? (latest.facePresent ? "Yes" : "No") : "—"} />
          <Card label="Engagement" value={latest ? `${latest.engagement}` : "—"} />
          <Card label="Emotion" value={latest ? latest.emotion : "—"} />
          <Card label="Gaze" value={latest ? latest.gaze : "—"} />
          <Card label="Off-screen" value={latest ? (latest.offScreen ? "Yes" : "No") : "—"} />
          <Card label="Eyes closed" value={latest ? (latest.eyesClosed ? "Yes" : "No") : "—"} />
          <Card label="Smile" value={latest ? `${latest.smile}` : "—"} />
          <Card label="Snapshots" value={`${snapshots.length}/25`} />
        </div>

        <div style={{ marginTop: 16, fontSize: 14, opacity: 0.8 }}>
          Status: <b>{isRunning ? "Tracking" : "Idle"}</b> • Samples: <b>{points.length}</b> • 
          Confusion snapshots: <b>{snapshots.length}</b>
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
