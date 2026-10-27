import { expect, test } from "bun:test";
import {
  MENU_REVERSE_RATE,
  menuTimelineDuration,
  menuTimelineFrame,
} from "./menu-timeline";

test("source HOME tracks end at 1020ms and reverse at 1.55x", () => {
  expect(menuTimelineDuration(4, 5)).toBe(1020);
  expect(menuTimelineDuration(4, 5) / MENU_REVERSE_RATE).toBeCloseTo(
    658.064516129,
    8,
  );
});

test("source track offsets and polynomial easing stay distinct", () => {
  expect(menuTimelineFrame(180, 4, 5).surface).toBe(50);
  expect(menuTimelineFrame(420, 4, 5).content).toBe(50);
  expect(menuTimelineFrame(470, 4, 5).lineScale).toBe(0.5);
  expect(menuTimelineFrame(680, 4, 5).lineOpacity).toBe(0.25);
  expect(menuTimelineFrame(580, 4, 5).links[0]).toBe(7);
  expect(menuTimelineFrame(690, 4, 5).secondary[0]).toBe(6.5625);
  expect(menuTimelineFrame(775, 4, 5).footer).toBe(13.75);
});

test("reversal hides secondary rolls before content and the surface", () => {
  const late = menuTimelineFrame(1020 - 100 * MENU_REVERSE_RATE, 4, 5);
  expect(late.surface).toBe(0);
  expect(late.content).toBe(0);
  expect(late.secondary[4]).toBeGreaterThan(0);
  const early = menuTimelineFrame(180, 4, 5);
  expect(early.content).toBe(100);
  expect(early.links).toEqual([112, 112, 112, 112]);
  expect(early.surface).toBe(50);
});

test("full endpoints clamp every authored track", () => {
  expect(menuTimelineFrame(-100, 4, 5)).toEqual({
    surface: 100,
    content: 100,
    lineScale: 0,
    lineOpacity: 1,
    links: [112, 112, 112, 112],
    secondary: [105, 105, 105, 105, 105],
    footer: 110,
  });
  expect(menuTimelineFrame(2000, 4, 5)).toEqual({
    surface: 0,
    content: 0,
    lineScale: 1,
    lineOpacity: 0,
    links: [0, 0, 0, 0],
    secondary: [0, 0, 0, 0, 0],
    footer: 0,
  });
});
