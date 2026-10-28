import { clamp } from "./2-opening/opening-score";

/** Preserve source line-mask timing while retaining the complete server text. */
export function createMaskedReveal(element: HTMLElement, stagger = .16) {
  const mask = element.matches("[data-masked-reveal]") ? element : element.querySelector<HTMLElement>("[data-masked-reveal]")!;
  const source = mask.querySelector<HTMLElement>("[data-reveal-source]");
  const original = source?.textContent ?? "";
  let pieces = [...mask.querySelectorAll<HTMLElement>("[data-reveal-piece]")];
  let previous = NaN, reduced = false;
  const set = (progress: number, quiet = false) => {
    if (progress === previous && quiet === reduced) return;
    previous = progress; reduced = quiet;
    const delay = Math.min(stagger, .6 / Math.max(1, pieces.length - 1)), total = delay * Math.max(0, pieces.length - 1);
    pieces.forEach((piece, index) => { piece.style.transform = quiet ? "none" : `translate3d(0,${112 * (1 - clamp((progress - index * delay) / (1 - total))) ** 4}%,0)`; });
  };
  return {
    set,
    measure() {
      if (!source) return;
      const progress = Number.isFinite(previous) ? previous : 0;
      source.textContent = original;
      const text = source.firstChild;
      if (!text) return;
      const range = document.createRange(), lines: { top: number; text: string }[] = [];
      const append = (top: number, value: string) => { const last = lines.at(-1); if (last && Math.abs(last.top - top) < 2) last.text += value; else lines.push({ top, text: value }); };
      for (const word of original.matchAll(/\S+\s*/gu)) {
        const index = word.index, value = word[0].trimEnd();
        range.setStart(text, index); range.setEnd(text, index + value.length);
        const rects = [...range.getClientRects()];
        if (rects.every((rect) => Math.abs(rect.top - rects[0].top) < 2)) append(rects[0]?.top ?? range.getBoundingClientRect().top, word[0]);
        else {
          for (const part of new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(value)) { range.setStart(text, index + part.index); range.setEnd(text, index + part.index + part.segment.length); append(range.getBoundingClientRect().top, part.segment); }
          if (lines.length) lines[lines.length - 1].text += word[0].slice(value.length);
        }
      }
      const fragment = document.createDocumentFragment(); pieces = [];
      lines.forEach((line) => { const wrapper = document.createElement("span"), piece = document.createElement("span"); wrapper.className = "masked-rendered-line-mask masked-text-line"; piece.className = "masked-rendered-line"; piece.setAttribute("data-reveal-piece", ""); piece.textContent = line.text; wrapper.appendChild(piece); fragment.appendChild(wrapper); pieces.push(piece); });
      source.replaceChildren(fragment); mask.setAttribute("data-lines-ready", ""); previous = NaN; set(progress, reduced);
    },
    dispose() { if (source) source.textContent = original; mask.removeAttribute("data-lines-ready"); pieces.forEach((piece) => piece.style.removeProperty("transform")); mask.style.removeProperty("clip-path"); },
  };
}
