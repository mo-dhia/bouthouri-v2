import { clamp01 } from "./journey-clock";

export const JOURNEY_SCRUB_MS = 480;

/** Recovered Expo.out curve; the source's Expo.in includes endpoint correction. */
export function journeyScrub(from: number, to: number, elapsedMs: number) {
  const t = clamp01(elapsedMs / JOURNEY_SCRUB_MS);
  if (t === 1) return to;
  const inverse = 1 - t;
  const eased = 1 - Math.pow(2, -10 * t) * inverse - Math.pow(inverse, 6) * t;
  return from + (to - from) * eased;
}
