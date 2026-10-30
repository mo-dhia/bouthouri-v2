import {
  markEase as E,
  markLoopDurations,
  markLoopPose,
  markRipple,
  wordmarkLetters,
  wordmarkRest,
  wordmarkSpan,
  type MarkLoopStep,
  type Pose,
} from "../header/identity-mark";

/**
 * The footer's BOUTHOURI, drawn from the kit like the nav logo. Its b is the
 * live mark: it chomps along the word to the middle, reads ب → ⴱ → b alone,
 * then spits the letters back into place, last in first out. Pure poses in
 * wordmark units; `footer.animate.ts` owns time, input and the DOM.
 */
export type LetterPose = { x: number; y: number; r: number; sx: number; sy: number };
export type MarkPlace = { x: number; y: number; s: number };
export type FooterFrame = { place: MarkPlace; pose: Pose; letters: LetterPose[] };

/** Letters after the b. Each pivots on its centre at the x-height middle. */
export const footerLetters = wordmarkLetters.slice(1);
/** Ink is -200..100; the box adds room above and below for the loop and the spit. */
export const footerViewBox = { x: -10, y: -280, width: wordmarkSpan + 20, height: 460 };
export const footerInkTop = (-200 - footerViewBox.y) / footerViewBox.height;
export const footerHome = { x: 100, y: 0 };
/** The b reads the scripts at the word's middle, centred on its ink. */
export const footerSolo = { x: wordmarkSpan / 2, y: -50 };
/** The solo b keeps its bowl on the x-height: drop 50 at y -50 is the word's b. */
export const footerSoloDrop = 50;
/** Smaller spread than the hero, so the rings stay inside the footer's box. */
export const footerRipple = { ...markRipple, spread: 115 } as const;

export const footerDurations = { eat: 2800, spit: 2000, first: 2600, hold: 5200 } as const;
export type SoloStep = { id: MarkLoopStep; dur: number; lock?: boolean };
/** From b through ب and ⴱ back to b, holding each script as the nav does. */
export const footerSoloSteps: readonly SoloStep[] = [
  { id: "B", dur: 500 },
  { id: "BC", dur: markLoopDurations.BC },
  { id: "C", dur: 1100, lock: true },
  { id: "CA", dur: markLoopDurations.CA },
  { id: "A", dur: 1100, lock: true },
  { id: "AB", dur: markLoopDurations.AB },
  { id: "B", dur: 700, lock: true },
];

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a), 0, 1);
const smooth = (x: number) => x * x * (3 - 2 * x);
/** Eases in and out over `a` at each end and glides at constant speed between. */
const cruise = (x: number, a = 0.3) => {
  const v = 1 / (1 - a);
  if (x < a) return (v * x * x) / (2 * a);
  if (x > 1 - a) return 1 - (v * (1 - x) * (1 - x)) / (2 * a);
  return v * (x - a / 2);
};

const B0 = wordmarkRest();
const centres = footerLetters.map((letter) => letter.x + letter.w / 2);
const travel = footerSolo.x - footerHome.x;
/** The bowl's outer radius: while the b eats and spits, letters inside it are behind its lips. */
export const footerLip = 100;
/** How far the jaws open to eat, and how close a letter is when the mouth starts drawing it in. */
const gape = 40,
  reach = 110;
/** A letter is swallowed over its width plus this, and the jaws shut at `chomp` of the way. */
const tail = 40,
  chomp = 0.7;
const last = footerLetters[footerLetters.length - 1];
/** The word slides into the mouth as the b walks forward; the i's bite lands at 90%. */
const shift = (last.x - footerHome.x - footerLip + chomp * (last.w + tail)) / 0.9 - travel;

export const restLetter = (index: number): LetterPose => ({ x: centres[index], y: 0, r: 0, sx: 1, sy: 1 });
const hidden = (index: number): LetterPose => ({ x: centres[index], y: 0, r: 0, sx: 0, sy: 0 });

/** b with its jaws open `J` degrees on the right: h2 is the upper half, h1 the lower. */
export function withJaw(pose: Pose, J: number): Pose {
  if (!J) return pose;
  return { ...pose, h1: { ...pose.h1, a: pose.h1.a + J }, h2: { ...pose.h2, a: pose.h2.a - J } };
}

export function wordFrame(): FooterFrame {
  return { place: { ...footerHome, s: 1 }, pose: B0, letters: footerLetters.map((_, i) => restLetter(i)) };
}

/**
 * The b opens and walks to the middle while the word slides into its mouth.
 * Each letter stretches toward the lips, squeezes through and is pulled in;
 * the jaws snap shut on its tail and open for the next. After the i the b
 * stays shut and gulps. `primed` is the jaw a pull already opened.
 */
export function eatFrame(t: number, primed = 0): FooterFrame & { bites: number } {
  const p = cruise(seg(t, 0.08, 0.9)),
    intro = smooth(seg(t, 0, 0.14));
  let shut = 0,
    nod = 0,
    bites = 0;
  const letters = footerLetters.map((letter, i) => {
    const span = letter.w + tail,
      d = footerHome.x + footerLip + (travel + shift) * p - letter.x,
      bite = chomp * span;
    // The jaws close over the last 70 units before the bite, and reopen over 60 after.
    const close = seg(d, bite - 70, bite) ** 2,
      open = i === footerLetters.length - 1 ? 0 : E.outCubic(seg(d, bite, bite + 60));
    shut = Math.max(shut, close * (1 - open));
    nod = Math.max(nod, close * (1 - E.outCubic(seg(d, bite, bite + 60))));
    if (d >= bite) bites++;
    const u = seg(d, 0, span);
    if (u >= 1) return hidden(i);
    const a = smooth(seg(d, -reach, 0)) * intro,
      sx = (1 + 0.25 * a) * (1 - 0.4 * u),
      sy = (1 - 0.5 * a) * (1 - 0.3 * u);
    // Stretched from its trailing edge toward the lips, then sucked in.
    const trailing = letter.x + letter.w - shift * p - 0.55 * span * u * u;
    return { x: trailing - (sx * letter.w) / 2, y: 0, r: -6 * a * (1 - u), sx, sy };
  });
  const open = primed + (gape - primed) * E.outCubic(seg(t, 0, 0.12));
  const gulp = E.bump(seg(t, 0.78, 0.98));
  return {
    place: {
      x: footerHome.x + travel * p - 12 * E.bump(seg(t, 0, 0.16)),
      y: 4 * nod + 5 * gulp,
      s: 1 + 0.06 * gulp,
    },
    pose: withJaw(B0, Math.max(0, open * (1 - shut))),
    letters,
    bites,
  };
}

/** The solo loop at the word's middle, every letter swallowed. The b shrinks a
 * little while its halves fly apart into b, so they stay inside the footer. */
export function soloFrame(index: number, t: number): FooterFrame {
  const step = footerSoloSteps[index];
  return {
    place: { ...footerSolo, s: step.id === "AB" ? 1 - 0.07 * (smooth(seg(t, 0.08, 0.22)) - smooth(seg(t, 0.55, 0.7))) : 1 },
    pose: markLoopPose(step.id, t, footerSoloDrop),
    letters: footerLetters.map((_, i) => hidden(i)),
  };
}

const spitOrder = footerLetters.map((_, i) => footerLetters.length - 1 - i);
const emitted = (index: number) => 0.08 + spitOrder.indexOf(index) * 0.07;
const spitX = (t: number) => {
  let kick = 0;
  footerLetters.forEach((_, i) => {
    kick += 9 * E.bump(seg(t, emitted(i), emitted(i) + 0.08));
  });
  return footerSolo.x - travel * E.inOutCubic(seg(t, 0.06, 0.66)) - kick;
};
const flights = footerLetters.map((_, i) => {
  const from = spitX(emitted(i)) + 55,
    distance = centres[i] - from;
  return { from, lift: clamp(0.1 * distance, 40, 80), dur: 0.2 + (0.16 * distance) / 850 };
});

/**
 * The b walks home and spits the word back, last letter first: each one pops
 * out of the mouth, arcs over and drops onto its place with a small squash.
 */
export function spitFrame(t: number): FooterFrame & { shots: number } {
  let pulse = 0,
    shots = 0;
  const letters = footerLetters.map((_, i) => {
    const at = emitted(i),
      flight = flights[i];
    if (t < at) return hidden(i);
    shots++;
    pulse = Math.max(pulse, E.bump(seg(t, at - 0.01, at + 0.06)));
    const q = seg(t, at, at + flight.dur),
      grow = 0.15 + 0.85 * E.outBack(seg(q, 0, 0.55), 1.6),
      land = E.bump(seg(t, at + flight.dur - 0.015, at + flight.dur + 0.08)),
      sy = grow * (1 - 0.1 * land);
    return {
      x: flight.from + (centres[i] - flight.from) * E.outCubic(q),
      // A thrown arc: up and down in time, landing as the squash starts.
      y: -flight.lift * 4 * q * (1 - q) + 100 * (grow - sy),
      r: -24 * (1 - E.outBack(q, 1.8)),
      sx: grow * (1 + 0.06 * land),
      sy,
    };
  });
  const open = 30 * E.outCubic(seg(t, 0, 0.1)) + 10 * pulse;
  const shut = 1 - E.inOutCubic(seg(t, 0.68, 0.8));
  return {
    place: { x: spitX(t), y: 0, s: 1 },
    pose: withJaw(B0, open * shut),
    letters,
    shots,
  };
}

/** Wordmark units → the letter's SVG transform. */
export const letterTransform = (pose: LetterPose, width: number) =>
  `translate(${pose.x.toFixed(2)} ${pose.y.toFixed(2)})${pose.r ? ` rotate(${pose.r.toFixed(2)})` : ""}${pose.sx !== 1 || pose.sy !== 1 ? ` scale(${pose.sx.toFixed(4)} ${pose.sy.toFixed(4)})` : ""} translate(${(-width / 2).toFixed(2)} 0)`;
export const placeTransform = (place: MarkPlace, r = 0) =>
  `translate(${place.x.toFixed(2)} ${place.y.toFixed(2)})${r ? ` rotate(${r.toFixed(2)})` : ""}${place.s !== 1 ? ` scale(${place.s.toFixed(4)})` : ""}`;
