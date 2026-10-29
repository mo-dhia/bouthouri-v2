import { expect, test } from "bun:test";
import { designPixels, viewportDesigns } from "@/lib/viewport-design";
import { standardFooterPose } from "./standard-footer-pose";
test("native max scroll completes the standard footer pose at any physical viewport height", () => {
  for (const reference of Object.values(viewportDesigns)) for (const factor of [.75, 1, 1.25]) {
    const width = reference.width * factor, footer = designPixels(reference.height * .88, width), top = designPixels(reference.height * 5, width);
    for (const physical of [.6, 1, 1.6].map((ratio) => designPixels(reference.height * ratio, width))) {
      const maxScroll = top + footer - physical;
      const pose = standardFooterPose(maxScroll, top, footer, physical);
      expect(pose.progress).toBeCloseTo(1, 12); expect(pose.wordmark).toBeCloseTo(1, 12); expect(pose.metadata).toBeCloseTo(1, 12);
      expect(pose.visible).toBe(true);
      expect(standardFooterPose(maxScroll - footer / 2, top, footer, physical).metadata).toBeLessThan(1);
      for (const y of [top - physical + 1, maxScroll - footer / 2, maxScroll]) {
        const reduced = standardFooterPose(y, top, footer, physical, true);
        expect([reduced.invitation, reduced.wordmark, reduced.metadata, reduced.invitationY]).toEqual([1, 1, 1, 0]);
      }
    }
  }
});
