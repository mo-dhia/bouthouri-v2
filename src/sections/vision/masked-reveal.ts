import { clamp01 } from './1-opening/practice-hero';

/** Line masks enhance existing server text; disposal restores the exact source nodes. */
export function createMaskedReveal(element: Element, stagger = .16) {
  const root = element.matches('[data-masked-reveal]') ? element as HTMLElement : element.querySelector<HTMLElement>('[data-masked-reveal]')!;
  const source = root.querySelector<HTMLElement>('[data-reveal-source]');
  const original = source ? [...source.childNodes].map(node => node.cloneNode(true)) : [];
  const text = source?.textContent ?? '';
  let pieces = [...root.querySelectorAll<HTMLElement>('[data-reveal-piece]')], last = NaN, lastReduced = false;
  const set = (progress: number, reduced = false) => {
    if (progress === last && reduced === lastReduced) return;
    last = progress; lastReduced = reduced;
    const step = Math.min(stagger, .6 / Math.max(1, pieces.length - 1)), spread = step * Math.max(0, pieces.length - 1);
    pieces.forEach((piece, index) => { piece.style.transform = reduced ? 'none' : `translate3d(0,${112 * Math.pow(1 - clamp01((progress - index * step) / (1 - spread)), 4)}%,0)`; });
  };
  return {
    set,
    measure() {
      if (!source) return;
      const previous = Number.isFinite(last) ? last : 0;
      source.textContent = text;
      const textNode = source.firstChild;
      if (!textNode) { pieces = []; return; }
      const range = document.createRange(), lines: { top: number; text: string }[] = [];
      const add = (top: number, segment: string) => { const line = lines.at(-1); if (line && Math.abs(line.top - top) < 2) line.text += segment; else lines.push({ top, text: segment }); };
      for (const match of text.matchAll(/\S+\s*/gu)) {
        const index = match.index, word = match[0].trimEnd();
        range.setStart(textNode, index); range.setEnd(textNode, index + word.length);
        const boxes = [...range.getClientRects()];
        if (boxes.every(box => Math.abs(box.top - boxes[0].top) < 2)) add(boxes[0]?.top ?? range.getBoundingClientRect().top, match[0]);
        else {
          for (const segment of new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(word)) { range.setStart(textNode, index + segment.index); range.setEnd(textNode, index + segment.index + segment.segment.length); add(range.getBoundingClientRect().top, segment.segment); }
          if (lines.length) lines.at(-1)!.text += match[0].slice(word.length);
        }
      }
      const fragment = document.createDocumentFragment(); pieces = [];
      lines.forEach(line => { const mask = document.createElement('span'), piece = document.createElement('span'); mask.className = 'masked-rendered-line-mask masked-text-line'; piece.className = 'masked-rendered-line'; piece.dataset.revealPiece = ''; piece.textContent = line.text; mask.append(piece); fragment.append(mask); pieces.push(piece); });
      source.replaceChildren(fragment); root.dataset.linesReady = ''; last = NaN; set(previous, lastReduced);
    },
    dispose() {
      if (source) source.replaceChildren(...original.map(node => node.cloneNode(true)));
      delete root.dataset.linesReady; pieces.forEach(piece => piece.style.removeProperty('transform'));
    },
  };
}
export type MaskedReveal = ReturnType<typeof createMaskedReveal>;
