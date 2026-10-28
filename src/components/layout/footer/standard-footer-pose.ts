import { designHeight } from "@/lib/viewport-design";
const clamp = (x: number) => Math.max(0, Math.min(1, x));
/** Source standardFooterPose, with viewport length supplied by the fixed design. */
export function standardFooterPose(y: number, top: number, height: number, viewportHeight: number, reduced = false) {
  const progress = clamp((y - top + viewportHeight) / Math.max(1, height));
  const smooth = (from: number, to: number) => { const x = clamp((progress - from) / (to - from)); return x * x * (3 - 2 * x); };
  const invitation = reduced ? 1 : smooth(.04, .38);
  return { progress, invitation, wordmark: reduced ? 1 : smooth(.3, .86), metadata: reduced ? 1 : smooth(.62, 1), invitationY: reduced ? 0 : (1 - invitation) * 18, visible: y + viewportHeight > top && y < top + height };
}

/** Native extent belongs to the controller applying the fixed-design reveal. */
export function standardFooterTail(width: number, physicalHeight: number, reduced: boolean) {
  return reduced ? 0 : Math.max(0, physicalHeight - designHeight(width));
}
