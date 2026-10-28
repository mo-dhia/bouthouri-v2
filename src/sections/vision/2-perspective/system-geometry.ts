import { clamp01, smooth01 } from '../1-opening/practice-hero';

export const systemStructures = {
  desktop: { width: 600, height: 450, top: 80, entry: [64, 300], junction: [358, 174], entryTangent: [0, -1], detailTangent: [-1, 0], primary: 'M 64 300 L 64 104 C 64 90.745 74.745 80 88 80 L 524 80 C 537.255 80 548 90.745 548 104 L 548 350 C 548 363.255 537.255 374 524 374 L 88 374 C 74.745 374 64 363.255 64 350 L 64 300 L 350 300 C 363.255 300 374 289.255 374 276 L 374 190 C 374 181.163 366.837 174 358 174', details: 'M 358 174 L 238 174 C 224.745 174 214 184.745 214 198 L 214 238 C 214 251.255 224.745 262 238 262 L 304 262 C 312.837 262 320 254.837 320 246 L 320 232 C 320 223.163 312.837 216 304 216 L 276 216' },
  mobile: { width: 360, height: 500, top: 48, entry: [44, 366], junction: [216, 166], entryTangent: [0, -1], detailTangent: [-1, 0], primary: 'M 44 366 L 44 72 C 44 58.745 54.745 48 68 48 L 292 48 C 305.255 48 316 58.745 316 72 L 316 434 C 316 447.255 305.255 458 292 458 L 68 458 C 54.745 458 44 447.255 44 434 L 44 366 L 208 366 C 221.255 366 232 355.255 232 342 L 232 182 C 232 173.163 224.837 166 216 166', details: 'M 216 166 L 134 166 C 120.745 166 110 176.745 110 190 L 110 292 C 110 305.255 120.745 316 134 316 L 166 316 C 174.837 316 182 308.837 182 300 L 182 244 C 182 235.163 174.837 228 166 228 L 148 228' },
};
export const range = (value: number, from: number, to: number) => clamp01((value - from) / (to - from));
export const viewportProgress = (scroll: number, top: number, height: number, stageHeight: number) => clamp01((scroll + stageHeight - top) / (height + stageHeight));
export function editorialOffset(progress: number, layer: string, portrait: boolean, reduced: boolean) { return reduced ? 0 : (1 - 2 * clamp01(progress)) * ({ heading: 24, copy: 40, meta: 10 }[layer] ?? 0) * (portrait ? .45 : 1); }
export function systemPhases(progress: number, reduced = false) {
  const p = clamp01(progress);
  const phases = [{ extraction: range(p, .015, .205), escapeHead: range(p, .06, .15), sourceTail: range(p, .205, .27), escapeTail: range(p, .27, .365), head: range(p, .15, .365) }, { extraction: range(p, .405, .635), escapeHead: range(p, .46, .585), sourceTail: range(p, .635, .71), escapeTail: range(p, .71, .815), head: range(p, .585, .815) }];
  return { phases: phases.map(phase => ({ ...phase, dom: reduced || phase.extraction === 0 })), settle: smooth01(range(p, .81, .95)), descriptions: [smooth01(range(p, 0, .13)), smooth01(range(p, .34, .52)), smooth01(range(p, .73, .94))].map(p => reduced ? 1 : p) };
}
export function systemReading(scroll: number, start: number, end: number, reduced: boolean) {
  const distance = Math.max(1, end - start), progress = clamp01((scroll - start) / (distance * (reduced ? 1 : 1.1)));
  const offset = reduced ? 0 : distance * .1 * progress;
  return { progress, scroll: scroll - offset, offset };
}

type Point = [number, number];
type Segment = { command: string; points: Point[] };
export type WordOutline = { outline: string; advance: number; segments: Segment[] };
const mixPoint = (from: Point, to: Point): Point => [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
const formatPoint = (point: Point) => `${point[0].toFixed(3)} ${point[1].toFixed(3)}`;
/** Split long font curves before warping, retaining the source's 75-unit bound. */
export function compileWord(outline: string, advance: number): WordOutline {
  const tokens = outline.match(/[a-zA-Z]|[-+]?(?:\d*\.)?\d+(?:[eE][-+]?\d+)?/g) ?? [];
  const segments: Segment[] = []; let index = 0, current: Point = [0, 0], origin: Point = [0, 0], command = '';
  const scalar = () => Number(tokens[index++]), point = (): Point => [scalar(), scalar()];
  const append = (points: Point[], kind: string) => {
    const length = points.slice(1).reduce((total, p, i) => total + Math.hypot(p[0] - points[i][0], p[1] - points[i][1]), 0);
    if (length <= 75) { segments.push({ command: kind, points: points.slice(1) }); return; }
    const levels = [points]; while (levels.at(-1)!.length > 1) { const last = levels.at(-1)!; levels.push(last.slice(1).map((p, i) => mixPoint(last[i], p))); }
    append(levels.map(level => level[0]), kind); append(levels.map(level => level.at(-1)!).reverse(), kind);
  };
  while (index < tokens.length) {
    if (/^[a-zA-Z]$/.test(tokens[index])) command = tokens[index++];
    if (command === 'M') { origin = current = point(); segments.push({ command, points: [current] }); command = 'L'; }
    else if (['L', 'H', 'V'].includes(command)) { const next: Point = command === 'L' ? point() : command === 'H' ? [scalar(), current[1]] : [current[0], scalar()]; append([current, next], 'L'); current = next; }
    else if (command === 'Q' || command === 'C') { const points = [current, point(), point()]; if (command === 'C') points.push(point()); append(points, command); current = points.at(-1)!; }
    else if (command.toUpperCase() === 'Z') { append([current, origin], 'L'); segments.push({ command: 'Z', points: [] }); current = origin; }
    else throw new Error(`Unsupported Vision font command ${command}`);
  }
  return { outline, advance, segments };
}
export function extractWord(word: WordOutline, progress: number, rtl: boolean) {
  const p = clamp01(progress), advance = word.advance, band = Math.min(.42 * advance, 1550), spine = rtl ? -220 : -290;
  const front = advance - p * (advance + band), reverse = (x: number) => rtl ? advance - x : x;
  const warp = ([x, y]: Point): Point => {
    const at = rtl ? advance - x : x, fraction = clamp01((at - front) / band), amount = 1 - smooth01(fraction), bend = Math.sin(Math.PI * fraction) ** 2;
    return [reverse(at + .12 * band * bend), spine + (y - spine) * amount ** 1.35 - 48 * bend];
  };
  const complete = p === 1, original = p === 0;
  const path = original ? word.outline : complete ? '' : word.segments.map(segment => segment.command + segment.points.map(p => formatPoint(warp(p))).join(' ')).join('');
  const seam = Math.max(0, Math.min(advance, front + band)), bridgeStart = Math.max(0, front + .55 * band), bridgeEnd = Math.min(advance, front + band);
  const bridge = complete || original || bridgeEnd - bridgeStart <= .01 ? '' : Array.from({ length: 13 }, (_, i) => `${i ? 'L' : 'M'} ${formatPoint(warp([reverse(bridgeStart + (bridgeEnd - bridgeStart) * i / 12), spine]))}`).join(' ');
  return { d: path, band, spine, seam: reverse(seam), exit: reverse(advance), lightX: reverse(front + .5 * band), bridge, threadBoundary: warp([reverse(front + .78 * band), spine])[0], bridgeBoundary: warp([reverse(front + .6 * band), spine])[0] };
}
