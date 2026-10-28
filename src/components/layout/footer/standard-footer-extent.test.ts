import { expect, test } from "bun:test";
import { standardFooterTail } from "./standard-footer-pose";
import { designHeight, viewportDesigns } from "@/lib/viewport-design";
import { standardFooterPose } from "./standard-footer-pose";
test("a tall native scrollport can reach the complete fixed-design footer without changing composition", () => {
  for (const reference of Object.values(viewportDesigns)) for (const factor of [.75, 1, 1.25]) {
    const width = reference.width * factor, design = designHeight(width), footer = design * .88, top = design * 5;
    for (const physical of [design * .6, design, design * 1.6]) {
      const tail = standardFooterTail(width, physical, false);
      const maxScroll = top + footer + tail - physical;
      const pose = standardFooterPose(maxScroll, top, footer, design);
      expect(pose.progress).toBeCloseTo(1, 12); expect(pose.wordmark).toBeCloseTo(1, 12); expect(pose.metadata).toBeCloseTo(1, 12);
      expect(tail).toBe(Math.max(0, physical - design));
      expect(standardFooterTail(width, physical, true)).toBe(0);
    }
  }
});
