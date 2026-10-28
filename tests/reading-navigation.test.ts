import { expect, test } from "bun:test";
import { readingNavigation } from "../src/sections/landing/3-journey/reading-navigation";
import { designPixels } from "../src/lib/viewport-design";

test("restored reading positions select the source project anchor instead of interpolating the work track", () => {
  const previousScroll = Object.getOwnPropertyDescriptor(globalThis, "scrollY");
  const previousWidth = Object.getOwnPropertyDescriptor(globalThis, "innerWidth");
  Object.defineProperty(globalThis, "innerWidth", { configurable: true, value: 412 });
  let currentY = 8541;
  let enhanced = false;
  const tops = new Map([
    [".glasses-chapter", 865],
    ["#beyond", 2097],
    ['[data-work-index="0"]', 3927],
    ['[data-work-index="1"]', 4938],
    ['[data-work-index="2"]', 5950],
    ['[data-work-index="3"]', 6961],
  ]);
  const root = {
    hasAttribute: () => enhanced,
    querySelector(selector: string) {
      const top = tops.get(selector);
      return top === undefined
        ? null
        : { getBoundingClientRect: () => ({ top: top - currentY }) };
    },
  } as unknown as HTMLElement;
  Object.defineProperty(globalThis, "scrollY", {
    configurable: true,
    get: () => currentY,
  });
  try {
    const { getTarget } = readingNavigation(root);
    const workTarget = (score: number) =>
      getTarget({ section: "work", progress: (score - 306) / 142 });
    expect(workTarget(312)).toBe(3827);
    expect(workTarget(345)).toBe(4838);
    expect(workTarget(381)).toBe(5850);
    expect(workTarget(448)).toBe(6861);
    expect(workTarget((308 + 345) / 2)).toBe(3827);
    currentY = 0;
    expect(workTarget(312)).toBe(3827);
    expect(getTarget({ section: "hero", progress: 0.5 })).toBe(432.5);
    expect(getTarget({ section: "opening", progress: 0.8 })).toBe(865);
    expect(getTarget({ section: "perspective", progress: 0.8 })).toBe(865);
    expect(getTarget({ section: "footer", progress: 1 })).toBe(2097);
    for (const width of [1920, 1440, 768, 960, 640, 412, 515]) {
      Object.defineProperty(globalThis, "innerWidth", { configurable: true, value: width });
      expect(workTarget(312)).toBeCloseTo(3927 - designPixels(100, width), 10);
    }
    tops.delete('[data-work-index="0"]');
    expect(workTarget(312)).toBe(2097);
    enhanced = true;
    expect(workTarget(312)).toBeNull();
  } finally {
    if (previousScroll) Object.defineProperty(globalThis, "scrollY", previousScroll);
    else Reflect.deleteProperty(globalThis, "scrollY");
    if (previousWidth) Object.defineProperty(globalThis, "innerWidth", previousWidth);
    else Reflect.deleteProperty(globalThis, "innerWidth");
  }
});
