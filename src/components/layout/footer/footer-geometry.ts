import { brand } from "@/config/brand";
import type { GlyphBox } from "./footer-paths";
import { designPixels, pixelsToVw } from "@/lib/viewport-design";

/** Canvas uses the same local Questrial metrics as the reference's DOM word. */
export function footerGlyphBoxes(
  word: HTMLElement,
  context: CanvasRenderingContext2D,
): GlyphBox[] {
  const style = getComputedStyle(word),
    size = parseFloat(style.fontSize),
    text = word.textContent ?? brand.wordmark,
    origin = parseFloat(style.left) || 0;
  context.font = `400 ${size}px ${style.fontFamily}`;
  context.letterSpacing = style.letterSpacing;
  context.fontKerning = "normal";
  context.direction = "ltr";
  context.textAlign = "left";
  const metrics = context.measureText(text),
    ascent = metrics.fontBoundingBoxAscent ?? 0.95 * size,
    descent = metrics.fontBoundingBoxDescent ?? 0.25 * size;
  const bounds = word.getBoundingClientRect();
  const ink = word.querySelector<HTMLElement>("[data-footer-ink]");
  const scaleY = ink ? Number(style.getPropertyValue("--footer-ink-scale-y")) || 1 : 1;
  const inkBounds = ink?.getBoundingClientRect();
  const lineHeight = inkBounds ? inkBounds.height / scaleY : bounds.height;
  const offsetY = inkBounds ? inkBounds.top - bounds.top : 0;
  const baseline = (lineHeight - ascent - descent) / 2 + ascent;
  return [...text].map((letter, index) => {
    const prefix = context.measureText(text.slice(0, index)).width,
      m = context.measureText(letter);
    return {
      x: prefix - m.actualBoundingBoxLeft + origin,
      y: offsetY + (baseline - m.actualBoundingBoxAscent) * scaleY,
      width: m.actualBoundingBoxLeft + m.actualBoundingBoxRight,
      height: (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) * scaleY,
    };
  });
}

export function measureFooterWord(
  root: HTMLElement,
  mask: HTMLElement,
  word: HTMLElement,
  context: CanvasRenderingContext2D,
): void {
  const family = getComputedStyle(word).fontFamily,
    text = word.textContent ?? brand.wordmark,
    width = mask.getBoundingClientRect().width,
    viewportHeight = innerHeight,
    gap = designPixels(20, innerWidth),
    length = (value: number) => pixelsToVw(value, innerWidth);
  context.font = `400 100px ${family}`;
  context.letterSpacing = "-3px";
  context.fontKerning = "normal";
  const measure = () =>
    [...text].map((letter, index) => {
      const prefix = context.measureText(text.slice(0, index)).width,
        m = context.measureText(letter);
      return {
        left: prefix - m.actualBoundingBoxLeft,
        right: prefix + m.actualBoundingBoxRight,
      };
    });
  let glyphs = measure(),
    left = Math.min(...glyphs.map((g) => g.left)),
    right = Math.max(...glyphs.map((g) => g.right));
  const size = (width / (right - left)) * 100;
  word.style.fontSize = length(size);
  word.style.fontWeight = "400";
  word.style.letterSpacing = length(size * -0.03);
  word.style.removeProperty("line-height");
  context.font = `400 ${size}px ${family}`;
  context.letterSpacing = `${size * -0.03}px`;
  glyphs = measure();
  left = Math.min(...glyphs.map((g) => g.left));
  right = Math.max(...glyphs.map((g) => g.right));
  const origin = (width - (right - left)) / 2 - left,
    metrics = context.measureText(text),
    ascent = metrics.fontBoundingBoxAscent ?? 0.95 * size,
    descent = metrics.fontBoundingBoxDescent ?? 0.25 * size;
  // Preserve the reference's vertical ink footprint while fitting nine letters
  // horizontally. Scale only the word ink, never the assembled identity or clock.
  const ink = word.querySelector<HTMLElement>("[data-footer-ink]");
  const referenceScale = width / 1843.2;
  const targetLine = 451.4 * referenceScale;
  const targetInkTop = 43.2 * referenceScale;
  const targetInkHeight = 339 * referenceScale;
  const scaleY = targetInkHeight / Math.max(1, metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent);
  if (ink) {
    word.style.lineHeight = length(targetLine);
    word.style.setProperty("--footer-ink-line-height", length(size * 0.9));
    word.style.setProperty("--footer-ink-scale-y", String(scaleY));
  }
  const inkTopAt = (lineHeight: number) => ink
    ? (lineHeight - targetLine) / 2 + targetInkTop
    : (lineHeight - ascent - descent) / 2 + ascent - metrics.actualBoundingBoxAscent;
  const minimum = (ink
    ? Math.max(targetLine - 2 * targetInkTop, 2 * (targetInkTop + targetInkHeight) - targetLine)
    : Math.max(
      2 * metrics.actualBoundingBoxAscent - ascent + descent,
      ascent - descent + 2 * metrics.actualBoundingBoxDescent,
    )) + designPixels(2, innerWidth);
  const information = root.querySelector<HTMLElement>(".footer-information");
  let navTop = 0,
    navBottom = 0;
  document
    .querySelectorAll<HTMLElement>(
      '.editorial-nav,[data-nav-layer="persistent"] a,[data-nav-layer="persistent"] button,[data-shell-side-menu] button',
    )
    .forEach((control) => {
      const r = (
        control.closest<HTMLElement>("[data-nav-mask]") ?? control
      ).getBoundingClientRect();
      if (!r.width || !r.height || r.bottom <= 0 || r.top >= innerHeight)
        return;
      if ((r.top + r.bottom) / 2 < viewportHeight / 2)
        navTop = Math.max(navTop, r.bottom + gap);
      else navBottom = Math.max(navBottom, viewportHeight - r.top + gap);
    });
  root.style.setProperty("--footer-nav-top", length(navTop));
  root.style.setProperty("--footer-nav-bottom", length(navBottom));
  if (information && root.dataset.footerVariant !== "standard")
    for (let i = 0; i < 3; i++) {
      const restValue = getComputedStyle(root).getPropertyValue("--footer-word-rest").trim();
      const rest = parseFloat(restValue) * (restValue.endsWith("vw") ? innerWidth / 100 : restValue.endsWith("%") ? root.offsetHeight / 100 : 1);
      const top = Math.max(
        navTop,
        parseFloat(getComputedStyle(information).top),
      );
      const wordHeight = word.getBoundingClientRect().height;
      const inkTop = inkTopAt(wordHeight);
      const available =
        root.offsetHeight -
        Math.max(rest, navBottom) -
        top -
        information.offsetHeight -
        Math.min(designPixels(48, innerWidth), Math.max(designPixels(24, innerWidth), 0.04 * viewportHeight)) +
        inkTop;
      if (wordHeight <= available + designPixels(0.5, innerWidth)) break;
      word.style.lineHeight = length(Math.max(minimum, parseFloat(getComputedStyle(word).lineHeight) - 2 * (wordHeight - available)));
    }
  word.style.position = "relative";
  word.style.left = length(origin);
  const wordHeight = word.getBoundingClientRect().height;
  const inkTop = inkTopAt(wordHeight);
  if (ink) {
    const naturalLine = parseFloat(getComputedStyle(ink).lineHeight);
    const baseline = (naturalLine - ascent - descent) / 2 + ascent;
    word.style.setProperty("--footer-ink-offset-y", length(inkTop - (baseline - metrics.actualBoundingBoxAscent) * scaleY));
  }
  root.style.setProperty("--footer-word-height", length(wordHeight));
  root.style.setProperty(
    "--footer-ink-top",
    length(inkTop),
  );
  if (information)
    root.style.setProperty(
      "--footer-information-height",
      length(information.offsetHeight),
    );
}
