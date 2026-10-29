const clamp = (x: number) => Math.max(0, Math.min(1, x));
/** Source standardFooterPose; the viewport length is the physical window height. */
export function standardFooterPose(y: number, top: number, height: number, viewportHeight: number, reduced = false) {
  const progress = clamp((y - top + viewportHeight) / Math.max(1, height));
  const smooth = (from: number, to: number) => { const x = clamp((progress - from) / (to - from)); return x * x * (3 - 2 * x); };
  const invitation = reduced ? 1 : smooth(.04, .38);
  return { progress, invitation, wordmark: reduced ? 1 : smooth(.3, .86), metadata: reduced ? 1 : smooth(.62, 1), invitationY: reduced ? 0 : (1 - invitation) * 18, visible: y + viewportHeight > top && y < top + height };
}

