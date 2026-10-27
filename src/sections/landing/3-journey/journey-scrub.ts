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

/** ScrollTrigger pre-renders at the last parent tick, then resets at parent time. */
export function createJourneyScrubClock(initial = 0) {
  let from = initial, target = initial, value = initial, started = 0;
  let paused: number | null = null;
  let latestTime = 0, parentTime = 0, awake = false;
  const time = (now: number) => (latestTime = Math.max(latestTime, now));
  const wake = (now: number) => {
    const wall = time(now);
    if (awake || paused !== null) return;
    started += wall - parentTime;
    parentTime = wall;
    awake = true;
  };
  const renderParent = () => {
    value = journeyScrub(from, target, parentTime - started);
    return value;
  };
  const sample = (now: number) => {
    time(now);
    if (paused !== null) return value;
    parentTime = latestTime;
    awake = true;
    return renderParent();
  };
  const snap = (next: number, now: number) => {
    time(now);
    from = target = value = next;
    started = parentTime;
    return value;
  };
  return {
    wake,
    sleep() { awake = false; },
    sample,
    snap,
    retarget(next: number, now: number, immediate = false) {
      if (immediate) return snap(next, now);
      if (next !== target) {
        // Source evaluates the pre-render/explicit FROM before resetTo wakes
        // a sleeping ticker. Input wall time must not pre-render the old tween.
        from = renderParent();
        wake(now);
        target = next;
        started = parentTime;
      }
      return value;
    },
    pause(now: number) {
      if (paused !== null) return;
      sample(now);
      paused = parentTime;
      awake = false;
    },
    resume(now: number) {
      time(now);
      if (paused !== null) {
        started += latestTime - paused;
        parentTime = latestTime;
        paused = null;
        awake = true;
      }
    },
    get target() { return target; },
    get value() { return value; },
  };
}
