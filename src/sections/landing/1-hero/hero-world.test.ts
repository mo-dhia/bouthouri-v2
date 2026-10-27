import { describe, expect, test } from "bun:test";
import {
  createHeroWorldClock, createHeroWorldPublisher, heroInputFromWorldProgress,
  heroInputProgressFromScroll, heroWorldPose, readHeroWorldPose,
  worldProgressFromInput, worldProgressFromScroll,
} from "./hero-world";
import source from "./hero-world-source.json";

describe("source raw hero trigger clock", () => {
  for (const fixture of source.cases) test(fixture.label, () => {
    const clock = createHeroWorldClock();
    clock.snap(fixture.from); clock.retarget(fixture.to, 0);
    for (const sample of fixture.samples) {
      const pose = clock.sample(sample.ms, fixture.mobile);
      expect(pose.progress).toBeCloseTo(sample.progress, 14);
      expect(pose.chapterPresence).toBeCloseTo(sample.chapterPresence, 14);
      expect(pose.hidden).toBe(sample.hidden);
      expect(clock.settled).toBe(sample.ms >= 100);
    }
  });

  test("retargets the displayed raw input across the hold and on reversal", () => {
    const clock = createHeroWorldClock();
    for (const action of source.retarget) {
      if (action.kind === "snap") clock.snap(action.input!);
      else if (action.kind === "target") clock.retarget(action.input!, action.ms!);
      else {
        const pose = clock.sample(action.ms!, false);
        expect(pose.progress).toBeCloseTo(action.progress!, 14);
        expect(pose.chapterPresence).toBeCloseTo(action.chapterPresence!, 14);
        expect(pose.hidden).toBe(action.hidden!);
      }
    }
  });

  test("cached GSAP hero quickTo uses its explicit displayed start between frames", () => {
    const clock = createHeroWorldClock();
    expect(source.cachedQuickTo.version).toBe("3.15.0");
    for (const action of source.cachedQuickTo.explicit) {
      if (action.kind === "target") clock.retarget(action.to!, action.ms);
      else clock.sample(action.ms, false);
      // GSAP rounds property writes to six decimals; our raw sampler retains
      // precision, so compare remapped output within two source write quanta.
      expect(Math.abs(clock.pose(false).progress - action.progress)).toBeLessThan(0.000002);
    }
    expect(source.cachedQuickTo.explicit[2].from).toBe(0.271);
    expect(source.cachedQuickTo.implicit[2].from).toBe(0.578125);
  });

  test("stale RAF timestamps cannot roll a newer display/input timestamp backward", () => {
    const clock = createHeroWorldClock();
    clock.retarget(1, 0);
    const displayed = clock.sample(40, false);
    expect(clock.sample(25, false)).toEqual(displayed);
    clock.retarget(0.6, 55);
    expect(clock.sample(50, false)).toEqual(displayed);
    const next = clock.sample(70, false);
    expect(clock.sample(60, false)).toEqual(next);
    clock.snap(0.3, 80);
    expect(clock.sample(65, false)).toEqual(clock.pose(false));
  });

  test("keeps native/magnet bounds in trigger space, including clamps", () => {
    for (const [height, mobile, end] of [[1392, false, 3474.432], [865, true, 1968.74]] as const) {
      expect(heroInputProgressFromScroll(-10, height, mobile)).toBe(0);
      expect(heroInputProgressFromScroll(end / 2, height, mobile)).toBeCloseTo(0.5, 14);
      expect(heroInputProgressFromScroll(end + 1000, height, mobile)).toBe(1);
      expect(worldProgressFromScroll(end + 1000, height, mobile)).toBeCloseTo(1, 14);
      for (const value of [0, 0.025, 0.075, 0.745, 0.81, 0.995, 1]) {
        expect(worldProgressFromInput(heroInputFromWorldProgress(value, mobile), mobile)).toBeCloseTo(value, 14);
      }
    }
  });

  test("menu resumes from the displayed input and restore/refresh snap without a tail", () => {
    const clock = createHeroWorldClock(), fixture = source.cases[0];
    clock.retarget(1, 0);
    const beforeMenu = clock.sample(40, false);
    clock.resume(2040);
    expect(clock.sample(2040, false)).toEqual(beforeMenu);
    expect(clock.sample(2140, false).progress).toBeCloseTo(1, 14);
    clock.snap(0); expect(clock.settled).toBe(true);
    expect(clock.sample(5000, false).progress).toBe(0);
    clock.snap(0.784); // Source's raw displayed value at 40ms, not mapped .8538.
    expect(clock.pose(false).progress).toBeCloseTo(fixture.samples[3].progress, 14);
    expect(clock.sample(6000, false)).toEqual(clock.pose(false));
  });
});

test("late readers get the exact current pose and an older mount cannot clear its replacement", () => {
  const root = {} as HTMLElement, otherRoot = {} as HTMLElement, events = new EventTarget();
  const first = createHeroWorldPublisher(root, events), pose = heroWorldPose(0.8538134490238611);
  first.publish(pose);
  expect(readHeroWorldPose(root)).toBe(pose);
  expect(readHeroWorldPose(otherRoot)).toBeUndefined();
  const second = createHeroWorldPublisher(root, events), replacement = heroWorldPose(0.9154013015184381);
  second.publish(replacement); first.dispose();
  expect(readHeroWorldPose(root)).toBe(replacement);
  second.dispose(); expect(readHeroWorldPose(root)).toBeUndefined();
});
