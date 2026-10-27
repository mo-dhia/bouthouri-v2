export const OPENING_DURATION = 26;
export const OPENING_INPUT_LENGTH = 22;
export const JOURNEY_END = 714;
export const STORY_INPUT_LENGTH = 394.72;
export const TOTAL_INPUT_LENGTH = OPENING_INPUT_LENGTH + STORY_INPUT_LENGTH;

export type JourneyFrame = {
  time: number;
  openingTime: number;
  progress: number;
};
export const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
export function smoothRange(from: number, to: number, value: number) {
  const t = clamp01((value - from) / (to - from));
  return t * t * (3 - 2 * t);
}

/** Reference score uses a slower optical opening, then compressed story input. */
export function frameFromProgress(
  progress: number,
  heroInput = 100 / 6.8,
): JourneyFrame {
  const input = clamp01(progress) * TOTAL_INPUT_LENGTH;
  const pivot = (heroInput + 16) * 0.745 - heroInput;
  const opening =
    input <= pivot
      ? input
      : input >= 22
        ? input - 6
        : pivot + ((input - pivot) * (16 - pivot)) / (22 - pivot);
  const storyInput = input - 22;
  const openingTime = input <= 22 ? clamp01(opening / 16) * 26 : 26;
  const time =
    input <= 22
      ? 0
      : storyInput <= 100
        ? storyInput
        : 100 + (storyInput - 100) / 0.48;
  return {
    openingTime,
    time,
    progress: (openingTime + time) / (OPENING_DURATION + JOURNEY_END),
  };
}

export function progressFromStoryTime(time: number) {
  return (
    (OPENING_INPUT_LENGTH + (time <= 100 ? time : 100 + (time - 100) * 0.48)) /
    TOTAL_INPUT_LENGTH
  );
}

export function journeyDistance(viewportHeight: number, mobile = false) {
  return Math.round(
    ((mobile ? 5.8 : 6.8) * viewportHeight * TOTAL_INPUT_LENGTH) / 100,
  );
}
