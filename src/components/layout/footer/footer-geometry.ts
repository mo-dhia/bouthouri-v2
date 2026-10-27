import type { GlyphBox } from "./footer-paths";

/** Canvas uses the same local Questrial metrics as the reference's DOM word. */
export function footerGlyphBoxes(
  word: HTMLElement,
  context: CanvasRenderingContext2D,
): GlyphBox[] {
  const style = getComputedStyle(word),
    size = parseFloat(style.fontSize),
    text = word.textContent ?? "GAZZAR",
    origin = parseFloat(word.style.left) || 0;
  context.font = `400 ${size}px ${style.fontFamily}`;
  context.letterSpacing = style.letterSpacing;
  context.fontKerning = "normal";
  context.direction = "ltr";
  context.textAlign = "left";
  const metrics = context.measureText(text),
    ascent = metrics.fontBoundingBoxAscent ?? 0.95 * size,
    descent = metrics.fontBoundingBoxDescent ?? 0.25 * size;
  const baseline = (word.offsetHeight - ascent - descent) / 2 + ascent;
  return [...text].map((letter, index) => {
    const prefix = context.measureText(text.slice(0, index)).width,
      m = context.measureText(letter);
    return {
      x: prefix - m.actualBoundingBoxLeft + origin,
      y: baseline - m.actualBoundingBoxAscent,
      width: m.actualBoundingBoxLeft + m.actualBoundingBoxRight,
      height: m.actualBoundingBoxAscent + m.actualBoundingBoxDescent,
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
    text = word.textContent ?? "GAZZAR",
    width = mask.getBoundingClientRect().width;
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
  word.style.fontSize = `${size}px`;
  word.style.fontWeight = "400";
  word.style.letterSpacing = `${size * -0.03}px`;
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
  const minimum =
    Math.max(
      2 * metrics.actualBoundingBoxAscent - ascent + descent,
      ascent - descent + 2 * metrics.actualBoundingBoxDescent,
    ) + 2;
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
      if ((r.top + r.bottom) / 2 < innerHeight / 2)
        navTop = Math.max(navTop, r.bottom + 20);
      else navBottom = Math.max(navBottom, innerHeight - r.top + 20);
    });
  root.style.setProperty("--footer-nav-top", `${navTop}px`);
  root.style.setProperty("--footer-nav-bottom", `${navBottom}px`);
  if (information)
    for (let i = 0; i < 3; i++) {
      const rest =
        (parseFloat(
          getComputedStyle(root).getPropertyValue("--footer-word-rest"),
        ) /
          100) *
        root.offsetHeight;
      const top = Math.max(
        navTop,
        parseFloat(getComputedStyle(information).top),
      );
      const inkTop =
        (word.offsetHeight - ascent - descent) / 2 +
        ascent -
        metrics.actualBoundingBoxAscent;
      const available =
        root.offsetHeight -
        Math.max(rest, navBottom) -
        top -
        information.offsetHeight -
        Math.min(48, Math.max(24, 0.04 * innerHeight)) +
        inkTop;
      if (word.offsetHeight <= available + 0.5) break;
      word.style.lineHeight = `${Math.max(minimum, parseFloat(getComputedStyle(word).lineHeight) - 2 * (word.offsetHeight - available))}px`;
    }
  word.style.position = "relative";
  word.style.left = `${origin}px`;
  const baseline = (word.offsetHeight - ascent - descent) / 2 + ascent;
  root.style.setProperty("--footer-word-height", `${word.offsetHeight}px`);
  root.style.setProperty(
    "--footer-ink-top",
    `${baseline - metrics.actualBoundingBoxAscent}px`,
  );
  if (information)
    root.style.setProperty(
      "--footer-information-height",
      `${information.offsetHeight}px`,
    );
}
