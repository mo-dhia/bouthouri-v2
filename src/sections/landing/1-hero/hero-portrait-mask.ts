import { smooth } from "./hero-world";

/** Source CSS fallback in the portrait container's untransformed coordinates. */
export function portraitFallbackMask(
  exit: number,
  translateY: number,
  scale: number,
  heroHeight: number,
): string {
  if (exit <= 0) return "none";
  const boundary = 1.42 - 1.6 * exit;
  const opacity = 1 - smooth(0.92, 1, exit);
  const color = (alpha: number) =>
    `rgb(0 0 0 / ${(alpha * opacity).toFixed(5)})`;
  // The parent scales about 55% height, then translates in viewport pixels.
  // Invert both operations so the alpha field stays at the source screen Y.
  const position = (offset: number) =>
    `${(((boundary + offset - translateY / heroHeight - 0.55 * (1 - scale)) / scale) * 100).toFixed(3)}%`;
  return `linear-gradient(to bottom, ${color(1)} ${position(-0.36)}, ${color(0.844)} ${position(-0.18)}, ${color(0.5)} ${position(0)}, ${color(0.156)} ${position(0.18)}, transparent ${position(0.36)})`;
}
