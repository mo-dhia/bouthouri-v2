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

/** The presentation clock advances before retargeting, including between RAFs. */
export function createJourneyScrubClock(initial = 0) {
  let from = initial, target = initial, value = initial, started = 0;
  let paused: number | null = null;
  let latestTime = 0;
  const time = (now: number) => {
    latestTime = Math.max(latestTime, now);
    return paused ?? latestTime;
  };
  const sample = (now: number) => {
    value = journeyScrub(from, target, time(now) - started);
    return value;
  };
  const snap = (next: number, now: number) => {
    from = target = value = next;
    started = time(now);
    return value;
  };
  return {
    sample,
    snap,
    retarget(next: number, now: number, immediate = false) {
      if (immediate) return snap(next, now);
      if (next !== target) {
        from = sample(now);
        target = next;
        started = time(now);
      }
      return value;
    },
    pause(now: number) {
      if (paused !== null) return;
      sample(now);
      paused = latestTime;
    },
    resume(now: number) {
      time(now);
      if (paused !== null) {
        started += latestTime - paused;
        paused = null;
      }
    },
    get target() { return target; },
    get value() { return value; },
  };
}
