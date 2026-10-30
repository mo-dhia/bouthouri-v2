import { expect, test } from "bun:test";
import { markPieces, type Pose } from "../header/identity-mark";
import {
  eatFrame,
  footerHome,
  footerLetters,
  footerLip,
  footerSolo,
  footerSoloSteps,
  footerViewBox,
  restLetter,
  soloFrame,
  spitFrame,
  wordFrame,
  type FooterFrame,
  type LetterPose,
} from "./footer-mark";

/** Each piece in wordmark units, after the frame's place. */
const world = (frame: FooterFrame) =>
  markPieces.map((name) => {
    const piece = frame.pose[name as keyof Pose];
    return { x: frame.place.x + frame.place.s * piece.x, y: frame.place.y + frame.place.s * piece.y, a: piece.a, sy: piece.sy };
  });
const expectSameMark = (a: FooterFrame, b: FooterFrame) =>
  world(a).forEach((piece, i) => {
    const other = world(b)[i];
    for (const key of ["x", "y", "a", "sy"] as const) expect(piece[key]).toBeCloseTo(other[key], 6);
  });
const expectRest = (letters: LetterPose[]) =>
  letters.forEach((pose, i) => {
    const rest = restLetter(i);
    for (const key of ["x", "y", "r", "sx", "sy"] as const) expect(pose[key]).toBeCloseTo(rest[key], 6);
  });
/** Ink tops: h's ascender, t's and i's caps; the rest sit on the x-height. */
const tops: Record<string, number> = { h: -200, t: -176, i: -176 };
/** A letter's ink corners (x across its advance, y from its top to the baseline) in wordmark units. */
const corners = (pose: LetterPose, index: number) => {
  const { w: width, letter } = footerLetters[index];
  const cos = Math.cos((pose.r * Math.PI) / 180),
    sin = Math.sin((pose.r * Math.PI) / 180);
  return [0, width].flatMap((lx) =>
    [tops[letter] ?? -100, 100].map((ly) => {
      const x = pose.sx * (lx - width / 2),
        y = pose.sy * ly;
      return { x: pose.x + cos * x - sin * y, y: pose.y + sin * x + cos * y };
    }),
  );
};
const steps = (count: number) => Array.from({ length: count + 1 }, (_, i) => i / count);

test("the loop's seams are continuous: word → eat → solo → spit → word", () => {
  const rest = wordFrame(), start = eatFrame(0);
  expect(start.place).toEqual(rest.place);
  expect(start.pose).toEqual(rest.pose);
  expectRest(start.letters);
  // The b ends the meal shut at the word's middle, where the solo's b takes over.
  const fed = eatFrame(1);
  expect(fed.bites).toBe(footerLetters.length);
  expect(fed.letters.every((pose) => pose.sx === 0 && pose.sy === 0)).toBe(true);
  expect(fed.place.x).toBeCloseTo(footerSolo.x, 9);
  expectSameMark(fed, soloFrame(0, 0));
  expectSameMark(soloFrame(footerSoloSteps.length - 1, 1), spitFrame(0));
  expect(spitFrame(0).letters.every((pose) => pose.sx === 0)).toBe(true);
  const home = spitFrame(1);
  expect(home.shots).toBe(footerLetters.length);
  expect(home.place.x).toBeCloseTo(footerHome.x, 9);
  expect(home.place.y).toBe(footerHome.y);
  expectSameMark(home, rest);
  expectRest(home.letters);
});

test("a primed jaw carries into the eat instead of snapping", () => {
  const opened = eatFrame(0, 16), shut = wordFrame();
  expect(opened.pose.h2.a).toBeCloseTo(shut.pose.h2.a - 16, 9);
  expect(opened.pose.h1.a).toBeCloseTo(shut.pose.h1.a + 16, 9);
});

test("every letter disappears behind the b's lips, never in view", () => {
  footerLetters.forEach((letter, i) => {
    let before: FooterFrame | undefined;
    for (const t of steps(20000)) {
      const frame = eatFrame(t);
      if (frame.letters[i].sx === 0) {
        // The last visible pose lies inside the bowl or left of its centre.
        const { place, letters } = before!;
        for (const corner of corners(letters[i], i)) {
          const inside = Math.hypot(corner.x - place.x, corner.y - place.y) <= footerLip * place.s;
          expect(inside || corner.x <= place.x).toBe(true);
        }
        break;
      }
      before = frame;
    }
    expect(before).toBeDefined();
  });
  // Letters go in order, first after the b to the i.
  const gone = footerLetters.map((_, i) => steps(2000).find((t) => eatFrame(t).letters[i].sx === 0)!);
  gone.slice(1).forEach((t, i) => expect(t).toBeGreaterThan(gone[i]));
});

test("eat and spit move smoothly at 60 fps", () => {
  for (const [frames, duration] of [[(t: number) => eatFrame(t), 2800], [(t: number) => spitFrame(t), 2000]] as const) {
    const ticks = steps(Math.round(duration / (1000 / 60)));
    let previous = frames(0);
    for (const t of ticks.slice(1)) {
      const frame = frames(t);
      expect(Math.abs(frame.place.x - previous.place.x)).toBeLessThan(40);
      frame.letters.forEach((pose, i) => {
        const last = previous.letters[i];
        // Appearing and vanishing happen inside the mouth; the rest glides.
        if (!pose.sx || !last.sx) return;
        expect(Math.hypot(pose.x - last.x, pose.y - last.y)).toBeLessThan(60);
        expect(Math.abs(pose.sx - last.sx)).toBeLessThan(0.25);
      });
      previous = frame;
    }
  }
});

test("spat letters stay inside the footer's box and land in the right order", () => {
  for (const t of steps(600)) {
    for (const [i, pose] of spitFrame(t).letters.entries()) {
      if (!pose.sx) continue;
      for (const corner of corners(pose, i)) {
        expect(corner.y).toBeGreaterThanOrEqual(footerViewBox.y);
        expect(corner.y).toBeLessThanOrEqual(footerViewBox.y + footerViewBox.height);
      }
    }
  }
  // Last in, first out: the i comes back first.
  const out = footerLetters.map((_, i) => steps(2000).find((t) => spitFrame(t).letters[i].sx > 0)!);
  out.slice(1).forEach((t, i) => expect(t).toBeLessThan(out[i]));
});
