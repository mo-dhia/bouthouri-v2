/** Focused source Services score and font-outline math, without its GSAP runtime. */
export const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
export const range = (value: number, start: number, end: number) => clamp((value - start) / (end - start));
export const smooth = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };
export const mix = (from: number, to: number, value: number) => from + (to - from) * value;
export type Point = { x: number; y: number };
export const mixPoint = (a: Point, b: Point, t: number): Point => ({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t) });
export const pointString = (p: Point) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`;
export const cubic = (a: Point, b: Point, c: Point, d: Point, t: number): Point => {
  const s = 1 - t;
  return { x: s ** 3 * a.x + 3 * s ** 2 * t * b.x + 3 * s * t ** 2 * c.x + t ** 3 * d.x, y: s ** 3 * a.y + 3 * s ** 2 * t * b.y + 3 * s * t ** 2 * c.y + t ** 3 * d.y };
};

export function openingScore(progress: number, introStart: number, heroEnd: number) {
  const p = clamp(progress), chapter = range(p, introStart, 1);
  const withdraw = smooth(range(chapter, .305, .385));
  const remaining = 1 - withdraw ** .25;
  const flying = chapter >= .305 && chapter < .89;
  const gateEntry = smooth(range(chapter, .89, .965));
  const bandEnter = smooth(range(chapter, .605, .665));
  const bandExit = smooth(range(chapter, .835, .885));
  return {
    progress: p, chapter, heroExit: range(p, 0, heroEnd),
    owner: p < introStart ? "hero" : chapter < .305 ? "intro" : chapter < .605 ? "glyph" : chapter < .89 ? "band" : "gate",
    intro: { visible: chapter < .385, withdraw, label: range(chapter, 0, .07) * remaining, title: range(chapter, .025, .15) * remaining, second: range(chapter, .06, .19) * remaining, copy: range(chapter, .12, .27) * remaining },
    glyph: { owner: chapter < .305 ? "dom" : flying ? "flight" : "none", visible: flying },
    band: { visible: flying && bandEnter > 0 && bandExit < 1 },
    gate: { visible: gateEntry > 0, entry: gateEntry, interactive: gateEntry === 1, cue: range(chapter, .956, 1), reset: chapter <= .89 },
  };
}

export const sourceGlyphs = {
  en: { outline: "M245.0 0.0V-591.0H14.0V-662.0H551.0V-591.0H320.0V0.0Z", bounds: [14, -662, 551, 0], stemWidth: 75, capHeight: 71 },
  ar: { outline: "M95.0 0.0V-716.0H180.0V0.0Z", bounds: [95, -716, 180, 0], stemWidth: 85, capHeight: 0 },
} as const;

type GlyphLayout = { width: number; height: number; mobile: boolean; rtl: boolean; quiet: boolean; seedX: number; seedY: number; fontScale: number; textWidth: number };
const polygon = (points: number[][]) => points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(3)},${y.toFixed(3)}`).join("") + "Z";

export function glyphFlight(chapter: number, layout: GlyphLayout) {
  const { width, height, mobile, rtl, quiet, seedX, seedY, fontScale, textWidth } = layout;
  const glyph = sourceGlyphs[rtl ? "ar" : "en"];
  const [left, top, right, bottom] = glyph.bounds;
  const glyphWidth = (right - left) * fontScale, glyphHeight = (bottom - top) * fontScale;
  const cap = glyph.capHeight * fontScale;
  const area = glyphWidth * cap + glyph.stemWidth * fontScale * (glyphHeight - cap);
  const consolidate = smooth(range(chapter, .35, .465));
  const rotate = smooth(range(chapter, .385, .53));
  const expand = smooth(range(chapter, .475, .605));
  const travel = smooth(range(chapter, .305, .565));
  const bandTravel = smooth(range(chapter, .59, .84));
  const exit = smooth(range(chapter, .84, .89));
  const bandY = mix(height * (mobile ? .69 : .7), height * (quiet ? .5 : .415), bandTravel);
  const startX = seedX + (left + right) * .5 * fontScale, startY = seedY + (top + bottom) * .5 * fontScale;
  const targetX = mix(.5 * width, width * (rtl ? .52 : .48), exit), targetY = mix(bandY, .52 * height, exit);
  const bendX = width * (rtl ? mobile ? .18 : .28 : mobile ? .78 : .68), bendY = height * (mobile ? .56 : .55);
  const x = (1 - travel) ** 2 * startX + 2 * (1 - travel) * travel * bendX + travel ** 2 * targetX;
  const y = (1 - travel) ** 2 * startY + 2 * (1 - travel) * travel * bendY + travel ** 2 * targetY;
  const bandHeight = mix(Math.min(124, .16 * height), 1.4, exit), bandWidth = mix(width + 8, .14 * width, exit);
  const length = mix(glyphHeight, bandWidth, expand), capWidth = mix(glyphWidth, area / glyphHeight, consolidate);
  const capSpan = mix(capWidth, bandHeight, expand), stemSpan = mix((area - capWidth * cap) / (glyphHeight - cap || 1), bandHeight, expand), capLength = cap * (1 - expand);
  const angle = (rtl ? -1 : 1) * Math.PI * .5 * rotate, cos = Math.cos(angle), sin = Math.sin(angle);
  const outline = [[-stemSpan / 2, length / 2], [-stemSpan / 2, -length / 2 + capLength], [-capSpan / 2, -length / 2 + capLength], [-capSpan / 2, -length / 2], [capSpan / 2, -length / 2], [capSpan / 2, -length / 2 + capLength], [stemSpan / 2, -length / 2 + capLength], [stemSpan / 2, length / 2]].map(([px, py]) => [x + px * cos - py * sin, y + px * sin + py * cos]);
  const original = chapter <= .35;
  const textTravel = smooth(range(chapter, .65, .835));
  const overflow = Math.max(0, textWidth - .84 * width), textDistance = Math.max(.09 * width, overflow);
  return { d: original ? glyph.outline : polygon(outline), transform: original ? `translate(${x} ${y}) rotate(${angle * 180 / Math.PI}) translate(${-startX + seedX} ${-startY + seedY}) scale(${fontScale})` : null, clipD: polygon(outline), bandY, bandHeight, textX: .5 * width + (rtl ? -1 : 1) * mix(.5 * textDistance, -.5 * textDistance, textTravel), textIn: smooth(range(chapter, .605, .665)), textOut: smooth(range(chapter, .835, .885)), area, shapeArea: capSpan * capLength + stemSpan * (length - capLength) };
}
