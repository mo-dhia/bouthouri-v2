/** Pure drawing geometry for the case pages: the server draws the rest pose, the story controller moves it. */
export type CaseId = 'artefact' | 'vawzen' | 'batiprix' | 'forecasting';

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const round = (value: number) => Math.round(value * 100) / 100;
const polyline = (points: number[][]) => points.map(([x, y], index) => `${index ? 'L' : 'M'}${round(x)} ${round(y)}`).join(' ');

export const ringPath = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
export const roundedSquare = (cx: number, cy: number, size = 44, radius = 8) => {
  const h = size / 2, s = h - radius;
  return `M${cx - s} ${cy - h}H${cx + s}A${radius} ${radius} 0 0 1 ${cx + h} ${cy - s}V${cy + s}A${radius} ${radius} 0 0 1 ${cx + s} ${cy + h}H${cx - s}A${radius} ${radius} 0 0 1 ${cx - h} ${cy + s}V${cy - s}A${radius} ${radius} 0 0 1 ${cx - s} ${cy - h}Z`;
};

/** Batiprix: the market drifts up through the year; the published price follows it at three cadences. */
const SLOT = 36, AXIS_START = 24, SLOTS = 12;
export const marketY = (x: number) => { const u = (x - AXIS_START) / (SLOT * SLOTS); return 250 - 100 * u - 8 * Math.sin(u * 3 * Math.PI); };
export const marketPath = polyline(Array.from({ length: 49 }, (_, index) => { const x = AXIS_START + index * 9; return [x, marketY(x)]; }));
const priceSteps = (every: number) => Array.from({ length: SLOTS }, (_, slot) => {
  const y = marketY(AXIS_START + SLOT * every * Math.floor(slot / every));
  return [[AXIS_START + SLOT * slot, y], [AXIS_START + SLOT * (slot + 1), y]];
}).flat();
export const financeStates = [priceSteps(SLOTS), priceSteps(3), priceSteps(1)];
export const financePath = (progress: number) => {
  const a = clamp01(progress), from = Math.min(1, Math.floor(2 * a)), n = 2 * a - from, eased = n * n * (3 - 2 * n);
  return polyline(financeStates[from].map(([x, y], index) => [x, y + (financeStates[from + 1][index][1] - y) * eased]));
};
export const financeTicks = Array.from({ length: SLOTS + 1 }, (_, index) => `M${AXIS_START + SLOT * index} 290V298`).join(' ');

/** The Forecasting Machine: the cone of the unknown narrows around the present as evidence arrives. */
export const CONE_ORIGIN = 196;
export const coneTransform = (progress: number) => { const k = round(1 - .8 * clamp01(progress)); return `matrix(1 0 0 ${k} 0 ${round(CONE_ORIGIN * (1 - k))})`; };

type Concept = { variant: string; rest: string; route?: string; cursor?: string; turn?: number; ticks: string; parts?: { name: string; d: string }[]; market?: string };
export const CASE_CONCEPTS: Record<CaseId, Concept> = {
  artefact: {
    variant: 'plan',
    rest: 'M140 296H440V96H40V296H90 M200 96V170 M200 222V296 M330 96V128 M330 176V296 M330 196H366 M410 196H440',
    route: 'M115 322 C115 280 118 250 140 232 C170 208 190 196 230 196 C270 196 300 152 345 152 C372 152 388 170 388 200 C388 222 388 236 388 250',
    cursor: ringPath(0, 0, 5),
    ticks: [ringPath(130, 240, 9), ringPath(268, 192, 9), ringPath(388, 240, 9)].join(' '),
  },
  vawzen: {
    variant: 'twist',
    rest: [64, 152, 328, 416].map(x => roundedSquare(x, 214)).join(' '),
    route: 'M240 214 C240 168 300 160 302 124 C304 88 252 84 250 112 C248 140 316 136 344 104 C364 82 378 74 404 70',
    cursor: roundedSquare(0, 0),
    turn: 135,
    ticks: [64, 152, 240, 328, 416].map(x => `M${x} 254V264`).join(' '),
  },
  batiprix: { variant: 'layer', rest: 'M24 290H456', ticks: financeTicks, market: marketPath },
  forecasting: {
    variant: 'cone',
    rest: 'M24 226 C56 222 72 236 100 228 S150 196 176 196 M24 300H456',
    route: 'M176 196 C260 196 360 186 456 184',
    cursor: ringPath(0, 0, 5),
    ticks: 'M176 292V308 M456 292V308',
    parts: [{ name: 'upper', d: 'M176 196 C260 186 360 136 456 104' }, { name: 'lower', d: 'M176 196 C260 206 360 256 456 288' }],
  },
};

/** Artefact: one walk through each tour; a ring per panorama, a tick per hotspot. */
const tourRing = (cx: number) => `H${cx} A40 40 0 0 1 ${cx} 90 A40 40 0 0 1 ${cx} 170`;
const hotspotTicks = (cx: number, angles: number[]) => angles.map(angle => {
  const r = angle * Math.PI / 180, x = Math.cos(r), y = Math.sin(r);
  return `M${round(cx + 48 * x)} ${round(130 + 48 * y)}L${round(cx + 56 * x)} ${round(130 + 56 * y)}`;
}).join(' ');
export const TOUR_STUDY = {
  walk: `M0 170 ${[110, 250, 390].map(tourRing).join(' ')} H470 M560 170 ${[600, 740, 880, 1020].map(tourRing).join(' ')} H1080`,
  hotspots: [...[110, 250, 390].map(cx => hotspotTicks(cx, [-112, -68])), ...[600, 740, 880, 1020].map(cx => hotspotTicks(cx, [-125, -90, -55]))].join(' '),
};

/** Vawzen: one line, twisted once for every site it carried. */
const twist = (cx: number) => `H${cx - 60} C${cx - 20} 176 ${cx + 20} 150 ${cx + 20} 125 C${cx + 20} 100 ${cx - 20} 100 ${cx - 20} 125 C${cx - 20} 150 ${cx + 20} 176 ${cx + 60} 176`;
export const TWIST_STUDY = { rest: 'M355 25V236 M710 25V236', draw: `M0 176 ${twist(355)} ${twist(710)} H1080` };

/** Batiprix: sources read at the edge, one internal base, a daily sync, then web and Windows. */
const cylinder = (cx: number) => `M${cx - 30} 80a30 10 0 0 0 60 0a30 10 0 0 0 -60 0V120a30 10 0 0 0 60 0V80`;
export const TRIP_STUDY = {
  rest: `${cylinder(540)} ${cylinder(900)} ${ringPath(180, 100, 7)}`,
  draw: 'M0 40 C90 40 120 100 173 100 M0 100H173 M0 160 C90 160 120 100 173 100 M187 100H510 M570 100 C660 70 780 70 870 100 M930 100 C990 100 1010 50 1080 50 M930 100 C990 100 1010 150 1080 150',
};

/** Normalized reading position between the measured step anchors; equal to the original's piecewise map. */
export function anchoredProgress(position: number, anchors: number[]) {
  if (!anchors.length || position <= anchors[0]) return 0;
  for (let index = 1; index < anchors.length; index++) {
    if (position < anchors[index]) return (index - 1 + clamp01((position - anchors[index - 1]) / Math.max(1, anchors[index] - anchors[index - 1]))) / (anchors.length - 1);
  }
  return 1;
}

export function caseReading(progress: number, reduced = false) {
  const a = reduced ? 1 : clamp01(progress);
  return { progress: a, step: Math.min(2, Math.floor(2 * a + .5)), route: .08 + .92 * a };
}

/** The original's reveal window: from 93% of the viewport to just past its middle. */
export function storyReveal(top: number, height: number, scroll: number, viewport: number, scale: number, reduced: boolean) {
  if (reduced) return 1;
  const start = top - .93 * viewport, end = top - .52 * viewport + Math.min(.2 * height, 70 * scale);
  return clamp01((scroll - start) / Math.max(1, end - start));
}
