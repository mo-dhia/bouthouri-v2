import { designPixels, pixelsToVw } from "@/lib/viewport-design";
import { footerInkTop, footerViewBox } from "./footer-mark";

/**
 * Fits the kit wordmark across the mask. HOME's pinned footer shrinks it on
 * short stages so the information keeps its gap above the ink; the box is
 * published in vw for the footer's CSS, with nav exclusions for clearance.
 */
export function measureFooterWord(
  root: HTMLElement,
  mask: HTMLElement,
  word: HTMLElement,
): void {
  const svg = word.querySelector<SVGSVGElement>("[data-footer-svg]"),
    width = mask.getBoundingClientRect().width,
    natural = (width * footerViewBox.height) / footerViewBox.width,
    viewportHeight = innerHeight,
    gap = designPixels(20, innerWidth),
    length = (value: number) => pixelsToVw(value, innerWidth);
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
  let height = natural;
  if (information && root.dataset.footerVariant !== "standard") {
    const restValue = getComputedStyle(root).getPropertyValue("--footer-word-rest").trim();
    const rest = parseFloat(restValue) * (restValue.endsWith("vw") ? innerWidth / 100 : restValue.endsWith("%") ? root.offsetHeight / 100 : 1) || 0;
    const top = Math.max(navTop, parseFloat(getComputedStyle(information).top) || 0);
    const room =
      root.offsetHeight -
      Math.max(rest, navBottom) -
      top -
      information.offsetHeight -
      Math.min(designPixels(48, innerWidth), Math.max(designPixels(24, innerWidth), 0.04 * viewportHeight));
    // Room above the ascender may sit in the gap; only the ink must fit. With
    // no room left the word holds its smallest size. An unlaid-out footer skips.
    if (root.offsetHeight > 0) height = Math.max(0.4 * natural, Math.min(natural, Math.max(0, room) / (1 - footerInkTop)));
  }
  if (svg) {
    if (height < natural - 0.5) svg.style.height = length(height);
    else svg.style.removeProperty("height");
  }
  root.style.setProperty("--footer-word-height", length(height));
  root.style.setProperty("--footer-ink-top", length(height * footerInkTop));
  if (information)
    root.style.setProperty(
      "--footer-information-height",
      length(information.offsetHeight),
    );
}
