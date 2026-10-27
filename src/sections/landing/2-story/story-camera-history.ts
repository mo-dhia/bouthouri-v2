import { clamp, mix, sampleStoryScore, type StoryFrame, type StoryScore } from "./story-score";

type Pose = Pick<StoryScore, "distance" | "x" | "y" | "rx" | "ry" | "rz" | "focus" | "idle">;
const keys = ["distance", "x", "y", "rx", "ry", "rz", "focus", "idle"] as const;
const starts = [23, 48, 70] as const;

/** Source ScrollTrigger refresh initializes only still-uninitialized camera
 * tweens from the displayed pose. Keep this small history separate from the
 * useful authored sampler; normal forward/reverse sampling stays analytic.
 */
export function createStoryCameraHistory() {
  const initialized = new Set<number>();
  const from = new Map<number, Pose>();
  let current: StoryScore | undefined;
  function refresh() {
    if (!current || current.time <= 0) return;
    const pose = Object.fromEntries(keys.map((key) => [key, Math.round(current![key] * 1e6) / 1e6])) as Pose;
    for (const start of starts) if (!initialized.has(start)) {
      initialized.add(start); from.set(start, pose);
    }
  }
  return {
    refresh,
    sample(frame: StoryFrame, mobile: boolean) {
      const first = !current;
      const score = sampleStoryScore(frame, mobile), time = score.time;
      for (const start of starts) if (time >= start) initialized.add(start);
      const start = time >= 70 ? 70 : time >= 48 ? 48 : time >= 23 ? 23 : undefined;
      const pose = start === undefined ? undefined : from.get(start);
      if (pose && start !== undefined) {
        const p = clamp((time - start) / (start === 23 ? 25 : start === 48 ? 22 : 5));
        const amount = start === 23 ? (1 - Math.cos(Math.PI * p)) / 2 : start === 48 ? p ** 3 : p;
        const target: Partial<Pose> = start === 23
          ? { distance: 3.2, x: -0.12, y: 0.06, rx: 0.018, ry: -0.025, rz: 0.025, focus: 1, idle: 0 }
          : start === 48 ? { distance: 0.035, rx: 0, ry: 0, rz: 0 } : { distance: -0.24 };
        for (const key of keys) if (target[key] !== undefined) score[key] = mix(pose[key], target[key], amount);
      }
      current = score;
      // A restored HOME boots at the already displayed score before its first
      // scene draw; source boot refresh freezes the remaining camera starts.
      if (first && time > 0) refresh();
      return score;
    },
  };
}
