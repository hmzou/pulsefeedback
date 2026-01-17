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

export type FaceSignals = {
  t: number; // seconds since session start
  facePresent: boolean;
  offScreen: boolean;
  eyesClosed: boolean;
  gaze: GazeDirection;
  smile: number;
  emotion: EmotionState;
  eyebrowRaised: boolean;
};

type StartArgs = {
  videoEl: HTMLVideoElement;
  getT: () => number; // seconds since session start
  onUpdate: (s: FaceSignals) => void;
};

export function startFaceTracking({ videoEl, getT, onUpdate }: StartArgs) {
  let rafId: number | null = null;
  let stopped = false;

  let lastFaceSeenAt = performance.now();
  let faceLandmarker: any = null;

  const dist = (a: any, b: any) => Math.hypot(a.x - b.x, a.y - b.y);

  const irisCenter = (lm: any[], idxs: number[]) => {
    const pts = idxs.map((i) => lm[i]).filter(Boolean);
    if (pts.length === 0) return null;
    const x = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const y = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    return { x, y };
  };

  const computeSignals = (lm: any[] | null): Omit<FaceSignals, "t"> => {
    if (!lm || !Array.isArray(lm) || lm.length < 478) {
      // Need at least 478 landmarks for full face tracking
      // (MediaPipe FaceLandmarker uses 478 landmarks including iris)
      const now = performance.now();
      const offScreen = now - lastFaceSeenAt > 600;
      return {
        facePresent: false,
        offScreen,
        eyesClosed: false,
        gaze: "unknown",
        smile: 0,
        emotion: "neutral",
        eyebrowRaised: false,
      };
    }

    lastFaceSeenAt = performance.now();

    // MediaPipe FaceLandmarker landmark indices
    const L_OUT = 33;
    const L_IN = 133;
    const R_IN = 362;
    const R_OUT = 263;

    // Iris landmarks (indices 468-477 for refined landmarks)
    const leftIrisIdx = [468, 469, 470, 471, 472];
    const rightIrisIdx = [473, 474, 475, 476, 477];
    const leftIris = irisCenter(lm, leftIrisIdx);
    const rightIris = irisCenter(lm, rightIrisIdx);

    // Eye landmarks for blink detection
    const L_TOP = 159;
    const L_BOT = 145;
    const R_TOP = 386;
    const R_BOT = 374;

    // Get landmarks safely
    const leftOut = lm[L_OUT];
    const leftIn = lm[L_IN];
    const rightOut = lm[R_OUT];
    const rightIn = lm[R_IN];
    const leftTop = lm[L_TOP];
    const leftBot = lm[L_BOT];
    const rightTop = lm[R_TOP];
    const rightBot = lm[R_BOT];

    if (!leftOut || !leftIn || !rightOut || !rightIn || 
        !leftTop || !leftBot || !rightTop || !rightBot) {
      // Missing required landmarks
      return {
        facePresent: true,
        offScreen: false,
        eyesClosed: false,
        gaze: "unknown",
        smile: 0,
        emotion: "neutral",
        eyebrowRaised: false,
      };
    }

    const leftWidth = dist(leftOut, leftIn);
    const rightWidth = dist(rightOut, rightIn);

    const leftOpen = dist(leftTop, leftBot) / (leftWidth + 1e-6);
    const rightOpen = dist(rightTop, rightBot) / (rightWidth + 1e-6);

    const eyesClosed = leftOpen < 0.18 && rightOpen < 0.18;

    // Calculate horizontal gaze ratio (0-1, left to right)
    const gazeFromEye = (iris: any, outer: any, inner: any) => {
      if (!iris || !outer || !inner) return null;
      const minX = Math.min(outer.x, inner.x);
      const maxX = Math.max(outer.x, inner.x);
      if (maxX === minX) return null;
      return (iris.x - minX) / (maxX - minX + 1e-6);
    };

    // Calculate vertical position (using iris center relative to eye boundaries)
    const verticalGaze = (iris: any, top: any, bottom: any) => {
      if (!iris || !top || !bottom) return null;
      const minY = Math.min(top.y, bottom.y);
      const maxY = Math.max(top.y, bottom.y);
      if (maxY === minY) return null;
      return (iris.y - minY) / (maxY - minY + 1e-6);
    };

    const lRatio = leftIris ? gazeFromEye(leftIris, leftOut, leftIn) : null;
    const rRatio = rightIris ? gazeFromEye(rightIris, rightOut, rightIn) : null;
    const lVert = leftIris ? verticalGaze(leftIris, leftTop, leftBot) : null;
    const rVert = rightIris ? verticalGaze(rightIris, rightTop, rightBot) : null;

    let gaze: GazeDirection = "unknown";
    if (lRatio != null && rRatio != null && lVert != null && rVert != null) {
      const hRatio = (lRatio + rRatio) / 2; // 0 = left, 0.5 = center, 1 = right
      const vRatio = (lVert + rVert) / 2; // 0 = up, 0.5 = middle, 1 = down

      // 9-zone detection
      if (vRatio < 0.35) {
        // Upper zones
        if (hRatio < 0.35) gaze = "upper-left";
        else if (hRatio > 0.65) gaze = "upper-right";
        else gaze = "upper-center";
      } else if (vRatio > 0.65) {
        // Lower zones
        if (hRatio < 0.35) gaze = "lower-left";
        else if (hRatio > 0.65) gaze = "lower-right";
        else gaze = "lower-center";
      } else {
        // Middle zones
        if (hRatio < 0.35) gaze = "left";
        else if (hRatio > 0.65) gaze = "right";
        else gaze = "center";
      }
    }

    // Mouth landmarks for smile detection
    const mouthCornerLeft = lm[61];
    const mouthCornerRight = lm[291];
    const mouthTop = lm[13];
    const mouthBottom = lm[14];

    let smile = 0;
    if (mouthCornerLeft && mouthCornerRight && mouthTop && mouthBottom) {
      const mouthWidth = dist(mouthCornerLeft, mouthCornerRight);
      const mouthOpen = dist(mouthTop, mouthBottom);
      smile = mouthWidth / (mouthOpen + 1e-6);
    }

    // Eyebrow landmarks for raised eyebrow detection (confusion)
    // Left eyebrow: top 107, bottom 70
    // Right eyebrow: top 336, bottom 300
    const leftEyebrowTop = lm[107];
    const leftEyebrowInner = lm[70];
    const rightEyebrowTop = lm[336];
    const rightEyebrowInner = lm[300];

    let eyebrowRaised = false;
    if (leftEyebrowTop && leftEyebrowInner && rightEyebrowTop && rightEyebrowInner) {
      const leftEyeArea = Math.abs(leftEyebrowTop.y - leftEyebrowInner.y);
      const rightEyeArea = Math.abs(rightEyebrowTop.y - rightEyebrowInner.y);
      // If eyebrows are significantly higher than inner corners, they're raised
      eyebrowRaised = leftEyeArea > 0.015 || rightEyeArea > 0.015;
    }

    // Enhanced emotion detection
    // Track history for duration-based detection (will need to be done in session page)
    // For now, detect based on current signals
    let emotion: EmotionState = "neutral";
    
    if (eyebrowRaised) {
      emotion = "confusion";
    } else if (smile > 2.2) {
      emotion = "positive";
    } else if (smile < 1.8) {
      // Frown detected - could be concentration or frustration
      // Duration will be determined by session tracking
      emotion = "concentration"; // Default to concentration, session will check duration
    } else {
      emotion = "neutral";
    }

    return {
      facePresent: true,
      offScreen: false,
      eyesClosed,
      gaze,
      smile: Number(smile.toFixed(2)),
      emotion,
      eyebrowRaised,
    };
  };

  const init = async () => {
    try {
      const vision = await import("@mediapipe/tasks-vision");
      const { FaceLandmarker, FilesetResolver } = vision as any;

      const fileset = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      faceLandmarker = await FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
      });
    } catch (err) {
      console.error("Face tracker init error:", err);
    }
  };

  const loop = async () => {
    if (stopped) return;

    if (!faceLandmarker) {
      rafId = requestAnimationFrame(loop);
      return;
    }

    if (videoEl.readyState >= 2 && videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
      const ts = performance.now();
      try {
        const res = faceLandmarker.detectForVideo(videoEl, ts);
        // FaceLandmarker returns faceLandmarks as an array of arrays
        // Each face is an array of landmarks (x, y, z normalized coordinates)
        const lm = res?.faceLandmarks?.[0] ?? null;
        
        if (lm && lm.length > 0) {
          const base = computeSignals(lm);
          onUpdate({
            t: Number(getT().toFixed(2)),
            ...base,
          });
        } else {
        // No face detected - use fallback signals
        const now = performance.now();
        const offScreen = now - lastFaceSeenAt > 600;
        onUpdate({
          t: Number(getT().toFixed(2)),
          facePresent: false,
          offScreen,
          eyesClosed: false,
          gaze: "unknown",
          smile: 0,
          emotion: "neutral",
          eyebrowRaised: false,
        });
        }
      } catch (err) {
        console.error("Face detection error:", err);
        // On error, send fallback signals
        const now = performance.now();
        const offScreen = now - lastFaceSeenAt > 600;
        onUpdate({
          t: Number(getT().toFixed(2)),
          facePresent: false,
          offScreen,
          eyesClosed: false,
          gaze: "unknown",
          smile: 0,
          emotion: "neutral",
          eyebrowRaised: false,
        });
      }
    }

    rafId = requestAnimationFrame(loop);
  };

  init().then(() => {
    if (!stopped) rafId = requestAnimationFrame(loop);
  });

  return () => {
    stopped = true;
    if (rafId) cancelAnimationFrame(rafId);
    try {
      faceLandmarker?.close?.();
    } catch {}
  };
}
