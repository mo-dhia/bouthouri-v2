import { describe, expect, test } from "bun:test";
import {
  frameFromProgress,
  progressFromStoryTime,
  journeyDistance,
} from "../src/sections/landing/3-journey/journey-clock";
import { staticSystemsPaths } from "../src/sections/landing/3-journey/systems-geometry.js";
import { createJourneyScrubClock, journeyScrub } from "../src/sections/landing/3-journey/journey-scrub";

describe("source scrub timing", () => {
  test("matches the recovered Expo.out samples and finishes after 480ms", () => {
    const source = [
      [0, 0], [60, 0.5760084035010604], [120, 0.8229228496212724],
      [240, 0.9765625], [360, 0.998435826599245], [480, 1],
    ];
    for (const [elapsed, value] of source) {
      expect(journeyScrub(0, 1, elapsed)).toBeCloseTo(value, 14);
      expect(journeyScrub(1, 0, elapsed)).toBeCloseTo(1 - value, 14);
    }
    expect(journeyScrub(0.2, 0.8, 700)).toBe(0.8);
    expect(journeyScrub(0.2, 0.8, -1)).toBe(0.2);
  });
  test("continuous and reversed input preserves progress between presentation frames", () => {
    // Executed cached GSAP 3.15.0 + ScrollTrigger's render-before-resetTo rule.
    // Targets at 30/46/62ms arrive between the 16/32/48/64ms presentation frames.
    const source: [number, number | null, number][] = [
      [0, .2, 0], [16, null, .041112], [30, .4, .069935],
      [32, null, .079326], [46, .05, .137783], [48, null, .135285],
      [62, .3, .119739], [64, null, .124868], [80, null, .160838],
      [542, null, .3],
    ];
    const clock = createJourneyScrubClock();
    for (const [now, target, value] of source) {
      const actual = target === null ? clock.sample(now) : clock.retarget(target, now);
      expect(actual).toBeCloseTo(value, 5);
    }
  });
  test("a stale RAF timestamp cannot undo a more recent input transaction", () => {
    const clock = createJourneyScrubClock();
    clock.retarget(1, 0);
    clock.sample(16);
    const atInput = clock.retarget(.5, 30);
    expect(clock.sample(24)).toBe(atInput);
    expect(clock.sample(32)).toBeGreaterThan(atInput);
  });
  test("visibility pauses freeze the scrub and refresh snaps replace unfinished movement", () => {
    const clock = createJourneyScrubClock();
    clock.retarget(1, 0);
    clock.pause(60);
    expect(clock.sample(1060)).toBeCloseTo(.5760084035010604, 14);
    clock.resume(2060);
    expect(clock.sample(2120)).toBeCloseTo(.8229228496212724, 14);
    expect(clock.snap(.3, 2130)).toBe(.3);
    expect(clock.sample(2200)).toBe(.3);
    expect(clock.target).toBe(.3);
    clock.retarget(.8, 2210, true);
    expect(clock.value).toBe(.8);
    expect(clock.sample(2220)).toBe(.8);
  });
});

describe("home journey score", () => {
  test("preserves the measured desktop scroll extent and final score", () => {
    expect(journeyDistance(1036)).toBe(29357);
    expect(frameFromProgress(0)).toEqual({
      time: 0,
      openingTime: 0,
      progress: 0,
    });
    expect(frameFromProgress(1).time).toBeCloseTo(714, 8);
    expect(frameFromProgress(1).progress).toBeCloseTo(1, 8);
    expect(journeyDistance(844, true)).toBeLessThan(journeyDistance(844));
  });
  test("restores semantic scene positions without accumulating direction errors", () => {
    for (const score of [
      0, 23, 48, 75, 98, 124, 168, 211, 241, 306, 345, 413, 448, 547, 627, 663,
      714,
    ]) {
      for (const ratio of [100 / 6.8, 100 / 5.8]) {
        const frame = frameFromProgress(progressFromStoryTime(score), ratio);
        expect(frame.time).toBeCloseTo(score, 8);
        expect(frame.openingTime).toBeCloseTo(26, 8);
      }
    }
  });
  test("stays finite and monotonic through the non-linear opening transition", () => {
    let previous = -1;
    for (let i = 0; i <= 1000; i++) {
      const frame = frameFromProgress(i / 1000);
      expect(
        Number.isFinite(frame.time + frame.openingTime + frame.progress),
      ).toBe(true);
      expect(frame.progress).toBeGreaterThanOrEqual(previous);
      previous = frame.progress;
    }
  });
});

describe("systems SVG geometry", () => {
  test("produces usable cubic paths across all presentation chapters", () => {
    for (const time of [
      400, 425, 444, 468, 501, 538, 562, 604, 639, 663, 714,
    ]) {
      const paths = staticSystemsPaths(time);
      expect(paths.length).toBe(time >= 656 ? 1 : 3);
      for (const path of paths) {
        expect(path).toMatch(/^M[-\d.]+ [-\d.]+ C/);
        expect(path).not.toMatch(/NaN|Infinity|undefined/);
      }
    }
  });
});
