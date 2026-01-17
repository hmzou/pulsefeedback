import type { RawMetricPoint } from "../storage/sessionStore";
import { computeEngagement } from "./report";

/**
 * Detect confusion candidates based on user signals.
 * confusionCandidate = (engagement < 0.35) OR (emotion becomes negative) OR (offScreen true) OR (eyesClosed true for >1s)
 */
export function isConfusionCandidate(
  point: RawMetricPoint,
  isTaskActive: boolean,
  eyesClosedDuration: number = 0
): boolean {
  const engagement = computeEngagement(point, isTaskActive);
  
  // Low engagement
  if (engagement < 0.35) return true;
  
  // Negative emotion
  if (point.emotion === "negative" || point.emotion === "frustration") return true;
  
  // Off screen
  if (point.offScreen) return true;
  
  // Eyes closed for more than 1 second
  if (point.eyesClosed && eyesClosedDuration > 1.0) return true;
  
  return false;
}
