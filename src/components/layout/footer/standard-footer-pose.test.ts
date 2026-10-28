import { expect, test } from "bun:test";
import { standardFooterPose } from "./standard-footer-pose";
import { viewportDesigns } from "@/lib/viewport-design";
test("standard footer uses the source staged invitation, wordmark and metadata reveals at every fixed canvas", () => {
  for (const design of Object.values(viewportDesigns)) {
    const top = design.height * 5, height = design.height * .88;
    for (const p of [0, .04, .2, .3, .38, .62, .86, 1]) {
      const pose = standardFooterPose(top - design.height + height * p, top, height, design.height);
      const smooth = (a: number, b: number) => { const x = Math.max(0, Math.min(1, (p - a) / (b - a))); return x*x*(3-2*x); };
      expect(pose.invitation).toBeCloseTo(smooth(.04,.38), 12);
      expect(pose.wordmark).toBeCloseTo(smooth(.3,.86), 12);
      expect(pose.metadata).toBeCloseTo(smooth(.62,1), 12);
      expect(pose.invitationY).toBeCloseTo(18 * (1-smooth(.04,.38)), 12);
    }
    const reading = standardFooterPose(top, top, height, design.height, true);
    expect([reading.invitation,reading.wordmark,reading.metadata,reading.invitationY]).toEqual([1,1,1,0]);
  }
});
