import { clamp, mix, smooth, type StoryScore } from "./story-score";

/** Source has two consecutive veil tweens, 66..71 to1 and 74..82 to0.
 * A refresh can initialize the second FROM the displayed value before74.
 * Reversing across74 writes that FROM; the completed first tween does not write
 * again until its time changes below71. Keep this bounded property history
 * separate from the authored sampler and camera/scroll timing.
 */
export function createStoryOpticalHistory() {
  let initialized = false, from = 1;
  let previousTime: number | undefined, veil = 0;
  function refresh() {
    if (previousTime === undefined || previousTime <= 0 || initialized) return;
    initialized = true; from = Math.round(veil * 1e6) / 1e6;
  }
  return {
    refresh,
    sample(score: StoryScore) {
      const time = score.time, first = previousTime === undefined;
      if (time >= 74) {
        initialized = true;
        const p = clamp((time - 74) / 8);
        veil = mix(from, 0, (1 - Math.cos(Math.PI * p)) / 2);
      } else if (time >= 71) {
        if (previousTime !== undefined && previousTime >= 74) veil = from;
        else if (previousTime === undefined || previousTime < 71) veil = 1;
      } else veil = score.opticalVeil;
      previousTime = time;
      score.opticalVeil = veil;
      score.opacity = (1 - veil) * smooth(0, 0.16, score.emergence) * (1 - clamp(time - 305));
      if (first && time > 0) refresh();
      return score;
    },
  };
}
