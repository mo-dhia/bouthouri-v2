import { viewportDesign, pixelsToVw } from '@/lib/viewport-design';
import { createMaskedReveal } from '../masked-reveal';
import { systemStructures, systemPhases, systemReading, compileWord, extractWord, viewportProgress, editorialOffset } from './system-geometry';
import outlines from './word-outlines.json';

/** System words become the drawn route; all SVG calculations use reference pixels. */
export function createSystemPassage(chapter: HTMLElement, rtl: boolean) {
  const field = chapter.querySelector<SVGSVGElement>('[data-system-details]')!;
  const passage = chapter.querySelector<HTMLElement>('[data-system-details-passage]')!, reading = chapter.querySelector<HTMLElement>('[data-system-details-reading]')!;
  const descriptions = [...chapter.querySelectorAll('[data-system-description]')].map(node => createMaskedReveal(node));
  const contextHeading = chapter.querySelector<HTMLElement>('[data-system-step="2"] h2')!, contextMetadata = chapter.querySelector<HTMLElement>('[data-system-step="2"] .practice-metadata')!;
  const words = outlines[rtl ? 'ar' : 'en'].words.map(word => compileWord(word.outline, word.advance));
  const attr = (element: Element, name: string, value: string) => { if (element.getAttribute(name) !== value) element.setAttribute(name, value); };
  const sourceWords = [...chapter.querySelectorAll<HTMLElement>('[data-system-word]')].map((element, index) => ({
    element, group: field.querySelector<SVGGElement>(`[data-system-type="${index}"]`)!, mask: field.querySelector(`[data-thread-mask-gradient="${index}"]`)!, bridgeMask: field.querySelector(`[data-bridge-mask-gradient="${index}"]`)!, bridge: field.querySelector<SVGPathElement>(`[data-material-bridge="${index}"]`)!, surface: field.querySelector(`[data-material-surface="${index}"]`)!, edge: field.querySelector(`[data-material-edge="${index}"]`)!, light: field.querySelector(`[data-material-light="${index}"]`)!, above: [...field.querySelectorAll(`[data-thread-mask-above="${index}"]`)], below: [...field.querySelectorAll(`[data-thread-mask-below="${index}"]`)], x: 0, y: 0, size: 1, top: 0, height: 1,
  }));
  const threads = [...field.querySelectorAll<SVGPathElement>('[data-system-thread]')], walks = [...field.querySelectorAll<SVGPathElement>('[data-system-walk]')], structure = field.querySelector<SVGGElement>('[data-system-structure]')!;
  const visual = chapter.querySelector<HTMLElement>('.chapter-visual')!, rail = chapter.querySelector<HTMLElement>('.chapter-visual-rail')!;
  const measureCanvas = document.createElement('canvas').getContext('2d')!, measurePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  let geometry = systemStructures.desktop, scale = 1, width = 1920, height = 1080, top = 0, left = 0, chapterHeight = 1, chapterWidth = 1, start = 0, end = 1, distance = 0, railTop = 0, railBottom = 0, visualX = 0, visualWidth = 1, visualHeight = 1, visualTop = 0, contextBottom = 0, portrait = false;
  const escapeLengths = [1, 1]; 
  const snapshot = [field, structure, ...sourceWords.flatMap(word => [word.group, word.mask, word.bridgeMask, word.bridge, word.surface, word.edge, word.light, ...word.above, ...word.below]), ...threads, ...walks].map(element => ({ element, attributes: [...element.attributes].map(attribute => [attribute.name, attribute.value] as const) }));
  const curve = (from: { x: number; y: number }, to: { x: number; y: number }, index: number) => {
    const sign = rtl ? -1 : 1, edge = (rtl ? .025 : .975) * chapterWidth, tangent = index === 0 ? geometry.entryTangent : geometry.detailTangent, length = portrait ? 65 : 100, magnitude = Math.hypot(...tangent), approach = { x: to.x - tangent[0] / magnitude * length, y: to.y - tangent[1] / magnitude * length };
    return portrait ? `C ${from.x + 65 * sign} ${from.y} ${edge} ${from.y + 8} ${edge} ${from.y + 40} C ${edge} ${approach.y} ${approach.x} ${approach.y} ${to.x} ${to.y}` : `C ${from.x + 100 * sign} ${from.y} ${approach.x} ${approach.y} ${to.x} ${to.y}`;
  };
  const placement = (progress: number, scroll: number, offset: number) => {
    const settle = systemPhases(progress).settle, size = Math.min(visualWidth / geometry.width, visualHeight / geometry.height) * (1.04 - .065 * settle);
    const pin = Math.max(railTop, Math.min(Math.min(scroll, end) + (portrait ? .53 * height : visualTop), railBottom - distance - visualHeight)) - top + offset;
    const x = visualX + (visualWidth - geometry.width * size) / 2 + 8 * settle;
    let y = pin + (visualHeight - geometry.height * size) / 2;
    if (portrait) y += (contextBottom - top + offset - geometry.top * size - y) * settle;
    return { x, y, scale: size, point: (point: number[]) => ({ x: x + point[0] * size, y: y + point[1] * size }) };
  };
  const stroke = (path: SVGPathElement, tail: number, head: number, localScale = 1) => {
    const length = Math.max(0, head - tail); path.style.visibility = length > 1e-5 ? 'visible' : 'hidden'; path.style.strokeDasharray = length === 1 ? 'none' : `${length * localScale} ${(2 - length) * localScale}`; path.style.strokeDashoffset = String(-tail * localScale);
  };
  return {
    measure(reduced: boolean) {
      width = viewportDesign(innerWidth).width; height = viewportDesign(innerWidth).height; scale = innerWidth / width; portrait = width <= 700 || height / width > 1.12;
      reading.style.removeProperty('transform'); passage.style.setProperty('--system-details-distance', '0vw'); descriptions.forEach(reveal => reveal.measure());
      const bounds = chapter.getBoundingClientRect(); top = (bounds.top + scrollY) / scale; left = bounds.left / scale; chapterHeight = bounds.height / scale; chapterWidth = bounds.width / scale;
      sourceWords.forEach(word => {
        const rect = word.element.getBoundingClientRect(), heading = word.element.closest('h2')!, composition = word.element.closest<HTMLElement>('[data-editorial-composition]')!.getBoundingClientRect(), style = getComputedStyle(word.element);
        const transform = new DOMMatrixReadOnly(getComputedStyle(heading).transform).m42;
        measureCanvas.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        const metrics = measureCanvas.measureText(word.element.textContent ?? '');
        word.x = rect.left / scale - left; word.y = (rect.top + scrollY - transform + metrics.fontBoundingBoxAscent) / scale - top; word.size = parseFloat(style.fontSize) / scale / 1000; word.top = (composition.top + scrollY) / scale; word.height = composition.height / scale;
      });
      geometry = systemStructures[portrait ? 'mobile' : 'desktop']; [geometry.primary, geometry.details].forEach((path, i) => attr(walks[i], 'd', path));
      visual.querySelector('svg')!.setAttribute('viewBox', `0 0 ${geometry.width} ${geometry.height}`);
      visual.querySelectorAll('path').forEach((path, i) => { path.setAttribute('d', i === 0 ? geometry.primary : geometry.details); path.style.strokeDashoffset = '0'; });
      start = top + sourceWords[0].y - height * (portrait ? .37 : .57); chapter.dataset.readingStart = String(start * scale);
      contextBottom = (contextMetadata.getBoundingClientRect().bottom + scrollY - new DOMMatrixReadOnly(getComputedStyle(contextMetadata).transform).m42) / scale + 32;
      end = Math.max(start + 1.55 * height, (contextHeading.getBoundingClientRect().top + scrollY - new DOMMatrixReadOnly(getComputedStyle(contextHeading).transform).m42) / scale - .23 * height);
      distance = reduced ? 0 : (end - start) * .1; passage.style.setProperty('--system-details-distance', pixelsToVw(distance * scale, innerWidth));
      field.setAttribute('viewBox', `0 0 ${chapterWidth} ${chapterHeight + distance}`);
      field.querySelectorAll('[data-directional-mask]').forEach(element => { attr(element, 'width', String(chapterWidth + 400)); attr(element, 'height', String(chapterHeight + distance + 400)); });
      sourceWords.forEach(word => [...word.above, ...word.below].forEach(element => attr(element, 'width', String(chapterWidth + 400))));
      const railBounds = rail.getBoundingClientRect(), railStyle = getComputedStyle(rail), visualBounds = visual.getBoundingClientRect();
      railTop = (railBounds.top + scrollY + parseFloat(railStyle.paddingTop)) / scale; railBottom = (railBounds.bottom + scrollY - parseFloat(railStyle.paddingBottom)) / scale; visualX = visualBounds.left / scale - left; visualWidth = visualBounds.width / scale; visualHeight = visual.clientHeight / scale; visualTop = (parseFloat(getComputedStyle(visual).top) || .28 * height * scale) / scale;
      sourceWords.forEach((word, index) => {
        const p = index === 0 ? .15 : .585, scroll = start + (end - start) * p, offset = editorialOffset(viewportProgress(scroll, word.top, word.height, height), 'heading', portrait, reduced);
        const from = { x: word.x + (rtl ? 0 : words[index].advance) * word.size, y: word.y + offset + (rtl ? -220 : -290) * word.size }, to = placement(p, scroll, 0).point(index === 0 ? geometry.entry : geometry.junction);
        measurePath.setAttribute('d', `M ${from.x} ${from.y} ${curve(from, to, index)}`); escapeLengths[index] = Math.max(1, measurePath.getTotalLength());
      });
      field.dataset.scrollRange = ((end - start + distance) * scale).toFixed(1);
    },
    editorialScroll(element: HTMLElement, nativeScroll: number, reduced: boolean) { return reading.contains(element) ? systemReading(nativeScroll / scale, start, end, reduced).scroll * scale : nativeScroll; },
    render(nativeScroll: number, reduced: boolean) {
      const state = systemReading(nativeScroll / scale, start, end, reduced), phases = systemPhases(state.progress, reduced);
      reading.style.transform = `translate3d(0,${pixelsToVw(state.offset * scale, innerWidth)},0)`; visual.style.visibility = reduced ? 'visible' : 'hidden'; chapter.dataset.systemDetailsReady = 'true'; field.style.visibility = reduced ? 'hidden' : 'visible'; field.dataset.progress = state.progress.toFixed(4);
      sourceWords.forEach((word, i) => { word.element.style.color = phases.phases[i].dom ? '' : 'transparent'; }); descriptions.forEach((reveal, i) => reveal.set(phases.descriptions[i], reduced));
      if (reduced) return;
      const wordStates = words.map((word, i) => extractWord(word, phases.phases[i].extraction, rtl));
      const positions = sourceWords.map((word, i) => {
        const offset = editorialOffset(viewportProgress(state.scroll, word.top, word.height, height), 'heading', portrait, reduced), y = word.y + offset + state.offset, transform = `translate(${word.x} ${y}) scale(${word.size})`, warped = wordStates[i], sign = rtl ? -1 : 1, exit = word.x + warped.exit * word.size;
        attr(word.group, 'transform', transform); attr(word.bridge, 'transform', transform); word.group.style.display = phases.phases[i].dom ? 'none' : '';
        let threadBoundary = word.x + warped.threadBoundary * word.size + 1.5 * sign; threadBoundary = sign * Math.min(sign * threadBoundary, sign * exit - 3.5);
        const bridgeBoundary = word.x + warped.bridgeBoundary * word.size + .5 * sign;
        attr(word.bridgeMask, 'x1', String(bridgeBoundary)); attr(word.bridgeMask, 'x2', String(bridgeBoundary + 1.5 * sign)); attr(word.mask, 'x1', String(threadBoundary)); attr(word.mask, 'x2', String(threadBoundary + 2 * sign));
        const above = y - 1050 * word.size - 4, below = y + 400 * word.size + 4;
        word.above.forEach(element => attr(element, 'height', String(Math.max(0, above + 200)))); word.below.forEach(element => { attr(element, 'y', String(below)); attr(element, 'height', String(Math.max(0, chapterHeight + distance + 200 - below))); });
        attr(word.surface, 'd', warped.d); attr(word.edge, 'd', warped.d); attr(word.light, 'x1', String(warped.lightX - .35 * warped.band)); attr(word.light, 'x2', String(warped.lightX + .35 * warped.band)); attr(word.bridge, 'd', phases.phases[i].escapeHead > 0 ? warped.bridge : '');
        return { x: word.x, y, size: word.size };
      });
      const placed = placement(state.progress, state.scroll, state.offset); attr(structure, 'transform', `translate(${placed.x} ${placed.y}) scale(${placed.scale})`); structure.style.display = '';
      stroke(walks[0], 0, phases.phases[0].head, placed.scale); stroke(walks[1], 0, phases.phases[1].head, placed.scale);
      positions.forEach((position, index) => {
        const word = wordStates[index], phase = phases.phases[index], from = { x: position.x + word.exit * position.size, y: position.y + word.spine * position.size }, seam = { x: position.x + word.seam * position.size, y: from.y }, to = placed.point(index === 0 ? geometry.entry : geometry.junction), run = Math.abs(from.x - seam.x), escape = escapeLengths[index], total = Math.max(.001, run + escape);
        attr(threads[index], 'd', `M ${seam.x} ${seam.y} L ${from.x} ${from.y} ${curve(from, to, index)}`); stroke(threads[index], (run * phase.sourceTail + escape * phase.escapeTail) / total, (run + escape * phase.escapeHead) / total);
      });
    },
    dispose() {
      descriptions.forEach(reveal => reveal.dispose()); reading.style.removeProperty('transform'); passage.style.removeProperty('--system-details-distance'); sourceWords.forEach(word => word.element.style.removeProperty('color')); visual.style.removeProperty('visibility');
      snapshot.forEach(({ element, attributes }) => { [...element.attributes].forEach(attribute => element.removeAttribute(attribute.name)); attributes.forEach(([name, value]) => element.setAttribute(name, value)); });
      delete chapter.dataset.systemDetailsReady; delete chapter.dataset.readingStart;
    },
  };
}
