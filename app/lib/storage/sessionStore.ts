export type SessionEvent = {
  t: number;
  type: "task_start" | "task_end" | "activity_start" | "activity_end" | "spike";
  note?: string;
};

export type GazeDirection =
  | "upper-left"
  | "upper-center"
  | "upper-right"
  | "left"
  | "center"
  | "right"
  | "lower-left"
  | "lower-center"
  | "lower-right"
  | "unknown";

export type EmotionState =
  | "positive"
  | "neutral"
  | "negative"
  | "concentration"
  | "frustration"
  | "confusion";

export type RawMetricPoint = {
  t: number; // seconds since session start
  videoTime?: number; // video playback time in seconds (if task is playing)
  hr?: number;
  br?: number;
  facePresent: boolean;
  offScreen: boolean;
  eyesClosed: boolean;
  gaze: GazeDirection;
  smile: number;
  emotion: EmotionState; // enhanced emotion detection
  eyebrowRaised?: boolean; // for confusion detection
};

export type Snapshot = {
  imageId: string; // e.g., "snap_192_4"
  t: number; // timestamp when captured
  kind: "screen" | "webcam";
  dataUrl: string; // base64 image string
  label?: string; // optional label like "confusion_candidate"
};

export type SessionPayload = {
  startedAt: string;
  mode?: "task" | "activity"; // session mode
  task?: { seconds: number; source: string };
  events: SessionEvent[];
  points: RawMetricPoint[];
  snapshots?: Snapshot[]; // screen snapshots for activity mode
  notes?: string;
};

const STORAGE_KEY = "pulsefeedback:lastSession";

export function saveSession(payload: SessionPayload): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function loadSession(): SessionPayload | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionPayload;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}
