import { expect, test } from "bun:test";
import { ContactScrub, contactEntryPose, contactLineOffset, contactRangeProgress, contactScrubEase } from "./contact-motion";

test("Contact reveal uses source cubic-out easing, .5s pieces and .055s stagger", () => {
  expect(contactLineOffset(0, 0, 2)).toBe(112);
  expect(contactLineOffset(0, 1, 2)).toBe(112);
  expect(contactLineOffset(1, 0, 2)).toBe(0);
  expect(contactLineOffset(1, 1, 2)).toBe(0);
  expect(contactLineOffset(.5, 0, 2)).toBeCloseTo(112 * (1 - .2775 / .5) ** 3, 12);
  expect(contactLineOffset(.5, 1, 2)).toBeCloseTo(112 * (1 - .2225 / .5) ** 3, 12);
});

test("Contact source Expo scrub settles in 300ms and retargets continuously", () => {
  const clock = new ContactScrub();
  clock.snap(0); clock.retarget(1, 1000);
  expect(clock.sample(1000)).toBe(0);
  expect(clock.sample(1150)).toBeCloseTo(.9765625, 12);
  clock.retarget(.25, 1150);
  expect(clock.sample(1150)).toBeCloseTo(.9765625, 12);
  expect(clock.sample(1450)).toBe(.25);
  expect(clock.active).toBe(false);
  expect(contactScrubEase(0)).toBe(0);
  expect(contactScrubEase(1)).toBe(1);
});

test("Contact fixed-stage trigger math remains finite and scales once", () => {
  expect(contactRangeProgress(0, 0, 810)).toBe(0);
  expect(contactRangeProgress(405, 0, 810)).toBe(.5);
  expect(contactRangeProgress(810, 0, 810)).toBe(1);
  expect(contactRangeProgress(405 * .75, 0, 810 * .75)).toBe(.5);
  expect(contactRangeProgress(10, 10, 10)).toBe(1);
  expect(contactRangeProgress(-1, 10, 10)).toBe(0);
});

test("Contact route entry retains source line and support durations/easing", () => {
  expect(contactEntryPose(50, 0)).toEqual({ offset: 112, opacity: 1 });
  expect(contactEntryPose(250, 0).offset).toBe(7);
  expect(contactEntryPose(110, 1).offset).toBe(112);
  expect(contactEntryPose(510, 1).offset).toBe(0);
  expect(contactEntryPose(170, 0, true)).toEqual({ offset: 10, opacity: 0 });
  expect(contactEntryPose(320, 0, true)).toEqual({ offset: 1.25, opacity: .875 });
  expect(contactEntryPose(515, 1, true)).toEqual({ offset: 0, opacity: 1 });
});
