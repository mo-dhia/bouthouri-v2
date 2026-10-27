import type { JourneyFrame } from "../3-journey/journey-clock";

export type StoryFrame = JourneyFrame & { emergence?: number };
export type StoryScore = ReturnType<typeof sampleStoryScore>;

export const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
export const mix = (from: number, to: number, amount: number) => from + (to - from) * amount;
export function smooth(from: number, to: number, value: number) {
  const p = clamp((value - from) / (to - from));
  return p * p * (3 - 2 * p);
}

type Ease = "linear" | "sine" | "sine-out" | "cubic-in" | "quadratic";
function ease(amount: number, type: Ease) {
  if (type === "sine") return (1 - Math.cos(Math.PI * amount)) / 2;
  if (type === "sine-out") return Math.sin(Math.PI * amount / 2);
  if (type === "cubic-in") return amount ** 3;
  if (type === "quadratic") return amount < 0.5 ? 2 * amount * amount : 1 - (-2 * amount + 2) ** 2 / 2;
  return amount;
}
function tween(from: number, to: number, time: number, start: number, duration: number, type: Ease = "sine") {
  return mix(from, to, ease(clamp((time - start) / duration), type));
}

/** Original score data, sampled without a timeline runtime or mutable React state. */
export function sampleStoryScore(frame: StoryFrame, mobile = false) {
  const time = clamp(Number.isFinite(frame.time) ? frame.time : 0, 0, 714);
  const openingTime = clamp(Number.isFinite(frame.openingTime) ? frame.openingTime : 0, 0, 26);
  const heroInput = 100 / (mobile ? 5.8 : 6.8);
  const emergence = frame.emergence ?? smooth(0.81, 1, (heroInput + openingTime / 26 * 16) / (heroInput + 16));
  const distance = time >= 70 ? tween(0.035, -0.24, time, 70, 5, "linear")
    : time >= 48 ? tween(3.2, 0.035, time, 48, 22, "cubic-in")
      : time >= 23 ? tween(9.4, 3.2, time, 23, 25) : tween(9.8, 9.4, time, 0, 22);
  const rotation = (initial: number, wide: number, close: number) => time >= 48 ? tween(close, 0, time, 48, 22, "cubic-in")
    : time >= 23 ? tween(wide, close, time, 23, 25) : tween(initial, wide, time, 0, 22);
  const reflection = time >= 232 ? tween(0.14, -0.05, time, 232, 30)
    : time >= 194 ? tween(-0.12, 0.14, time, 194, 22)
      : time >= 176 ? tween(0.16, -0.12, time, 176, 18)
        : time >= 146 ? tween(-0.24, 0.16, time, 146, 25)
          : time >= 128 ? tween(0.1, -0.24, time, 128, 15) : tween(1.12, 0.1, time, 98, 30);
  const lightFocus = time >= 232 ? tween(0.4, 0, time, 232, 30)
    : time >= 194 ? tween(-0.3, 0.4, time, 194, 22)
      : time >= 146 ? tween(1, -0.3, time, 146, 25) : tween(0, 1, time, 128, 15);
  const opticalVeil = time >= 74 ? tween(1, 0, time, 74, 8) : tween(0, 1, time, 66, 5, "quadratic");
  return {
    time, openingTime, emergence, distance,
    // The source's glasses progress is a 100-score tween. The parent's progress
    // is pin input progress and must never be substituted here.
    opticalProgress: clamp(time / 100),
    x: tween(0, -0.12, time, 23, 25),
    y: time >= 23 ? tween(0, 0.06, time, 23, 25) : tween(0.12, 0, time, 0, 22),
    rx: rotation(-0.13, -0.055, 0.018),
    ry: rotation(0.25, 0.07, -0.025),
    rz: rotation(-0.14, -0.035, 0.025),
    focus: tween(0, 1, time, 23, 25),
    idle: tween(1, 0, time, 23, 25),
    darkness: tween(0, 1, time, 60, 9, "quadratic"),
    opticalVeil,
    opacity: (1 - opticalVeil) * smooth(0, 0.16, emergence) * (1 - clamp(time - 305)),
    reflection, lightFocus,
    lightTravel: tween(0, 1, time, 98, 30),
    studioDepth: tween(-80, 0, time, 66, 8),
    studioTilt: -0.12,
    environment: tween(0, 1, time, 84, 110),
    surfaceQuiet: time >= 198 ? tween(1, 0.15, time, 198, 28) : tween(0, 1, time, 92, 54),
    typePresence: tween(0, 1, time, 74, 20, "sine-out"),
  };
}

/** Analytic critically damped spring, as used by the reference pointer controls. */
export function spring(position: number, velocity: number, target: number, frequency: number, dt: number) {
  const delta = position - target;
  const impulse = velocity + frequency * delta;
  const decay = Math.exp(-frequency * dt);
  return { position: target + (delta + impulse * dt) * decay, velocity: (velocity - frequency * impulse * dt) * decay };
}
