import { designHeight, designScale, viewportDesign } from "@/lib/viewport-design";
import { journeyDistance } from "./journey-clock";

/** Keep source SVG/score math in its reference camera; scale only at the DOM edge. */
export function journeyGeometry(width: number, stageHeight = designHeight(width)) {
  const reference = viewportDesign(width);
  const scale = designScale(width);
  const height = stageHeight / scale;
  const mobile = reference.width <= 700;
  return {
    reference,
    scale,
    width: reference.width,
    height,
    mobile,
    heroInput: 100 / (mobile ? 5.8 : 6.8),
    distance: journeyDistance(height, mobile) * scale,
    compactOpening: mobile || (reference.width <= 900 && reference.height > reference.width),
  };
}
