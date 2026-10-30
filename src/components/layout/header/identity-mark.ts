/**
 * BOUTHOURI kit, ported unchanged from `brand-book/bouthouri-mark.html`.
 * Module m = 40 units, the stroke width. Two half rings (outer Ø 5m, inner
 * Ø 3m) and one 1m × 5m bar write B three ways: A = ⴱ (Tifinagh yab),
 * B = b (Latin), C = ب (Arabic ba). The pieces only move and rotate; the bar
 * contracts into the dot of ب, as in the brand book's three-script loop.
 */
export const HALF_D =
  "M-100 0.9V0A100 100 0 0 1 100 0V0.9H60V0A60 60 0 0 0 -60 0V0.9Z";
export const BAR_D = "M-20 -100H20V100H-20Z";

export type Piece = { x: number; y: number; a: number; sy: number };
export type Pose = { h1: Piece; h2: Piece; bar: Piece };
export type MarkState = "A" | "B" | "C";
export type MoveOptions = {
  phi0?: number;
  r0?: number;
  k?: number;
  drop?: number;
};
export type Move = (t: number, options?: MoveOptions) => Pose;

/** Piece order shared by every renderer: two half rings, then the bar. */
export const markPieces = ["h1", "h2", "bar"] as const;
export const markPaths = [HALF_D, HALF_D, BAR_D] as const;

const D2R = Math.PI / 180;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a), 0, 1);
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const markEase = {
  inOutCubic: (x: number) =>
    x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
  outQuart: (x: number) => 1 - Math.pow(1 - x, 4),
  outCubic: (x: number) => 1 - Math.pow(1 - x, 3),
  outBack: (x: number, s = 1.70158) =>
    1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2),
  bump: (x: number) => Math.sin(Math.PI * x),
};
const E = markEase;

/** Halves around centre `cx, cy`, `sep` apart, orbiting at `phi` degrees. */
function halves(cx: number, cy: number, sep: number, phi: number) {
  const s = Math.sin(phi * D2R),
    c = Math.cos(phi * D2R);
  return {
    h1: { x: cx + sep * s, y: cy - sep * c, a: phi, sy: 1 },
    h2: { x: cx - sep * s, y: cy + sep * c, a: phi + 180, sy: 1 },
  };
}

export const markStatic: Record<MarkState, () => Pose> = {
  A: () => ({ ...halves(0, 0, 0, 0), bar: { x: 0, y: 0, a: 90, sy: 1 } }),
  B: () => ({ ...halves(0, 50, 0, 0), bar: { x: -80, y: -50, a: 0, sy: 1 } }),
  C: () => ({
    h1: { x: 0, y: -85, a: 180, sy: 1 },
    h2: { x: 0, y: -85, a: 180, sy: 1 },
    bar: { x: 0, y: 65, a: 90, sy: 0.2 },
  }),
};

/* A -> B: the ⴱ opens, turns over, the bar steps out of the gap,
   stands up and the ring closes beside it as the bowl of b. */
export const markAtoB: Move = (t, o = {}) => {
  const phi0 = o.phi0 || 0,
    r0 = o.r0 == null ? 90 : o.r0,
    k = o.k || 0,
    drop = o.drop == null ? 50 : o.drop;
  const antic = E.bump(seg(t, 0, 0.13));
  const so = E.outQuart(seg(t, 0.05, 0.34));
  const sc = E.outBack(seg(t, 0.62, 0.92), 1.3);
  const sep = 124 * so * (1 - sc) - 7 * antic;
  const phi = phi0 + 180 * E.inOutCubic(seg(t, 0.12, 0.6));
  const cy = drop * E.inOutCubic(seg(t, 0.52, 0.9));
  const spin = 360 * k * E.inOutCubic(seg(t, 0.12, 0.4));
  const d = 215 * E.inOutCubic(seg(t, 0.38, 0.6));
  const pre = { x: d * Math.cos(phi * D2R), y: cy + d * Math.sin(phi * D2R) };
  const stand = 90 * E.inOutCubic(seg(t, 0.56, 0.74));
  const dock = E.outBack(seg(t, 0.68, 0.93), 1.4);
  // No sideways overshoot: keeps the stem out of the counter.
  const dockX = E.outCubic(seg(t, 0.68, 0.9));
  return {
    ...halves(0, cy, sep, phi),
    bar: {
      x: lerp(pre.x, -80, dockX),
      y: lerp(pre.y, drop - 100, dock),
      a: r0 + (phi - phi0) + spin + stand,
      sy: 1,
    },
  };
};

/* B -> A: the bowl opens, the stem lies down, slides into the gap,
   everything turns over together and the ring closes on the bar. */
export const markBtoA: Move = (t, o = {}) => {
  const phi0 = o.phi0 == null ? 180 : o.phi0,
    r0 = o.r0 || 0,
    k = o.k || 0,
    drop = o.drop == null ? 50 : o.drop;
  const antic = E.bump(seg(t, 0, 0.12));
  const so = E.outQuart(seg(t, 0.08, 0.34));
  const sc = E.outBack(seg(t, 0.74, 0.97), 1.3);
  const sep = 124 * so * (1 - sc) - 6 * antic;
  const cy = drop * (1 - E.inOutCubic(seg(t, 0.12, 0.62)));
  const phi = phi0 + 180 * E.inOutCubic(seg(t, 0.5, 0.88));
  const p1 = E.inOutCubic(seg(t, 0.03, 0.24)); // stem steps left, still upright
  const lay = E.inOutCubic(seg(t, 0.2, 0.38)); // lies down outside the ring
  const p2 = E.inOutCubic(seg(t, 0.36, 0.56)); // slides into the gap
  const spin = 360 * k * E.inOutCubic(seg(t, 0.52, 0.84));
  const ex = lerp(-80, -215, p1),
    ey = lerp(drop - 100 + 8 * antic, cy, lay);
  return {
    ...halves(0, cy, sep, phi),
    bar: {
      x: lerp(ex, 0, p2),
      y: lerp(ey, cy, p2),
      a: r0 + 90 * lay + (phi - phi0) + spin,
      sy: 1,
    },
  };
};

/* B -> C: the top half sweeps round and folds onto the bottom half,
   the stem lies down and contracts into the dot of ب. `drop` is the b's
   bowl height it starts from, as in `markAtoB`. */
export const markBtoC: Move = (t, o = {}) => {
  const phi0 = o.phi0 == null ? 180 : o.phi0,
    r0 = o.r0 || 0,
    drop = o.drop == null ? 50 : o.drop;
  const cy = lerp(drop, -85, E.inOutCubic(seg(t, 0.18, 0.8)));
  const fold = E.outBack(seg(t, 0.3, 0.85), 1.2);
  const shrink = E.inOutCubic(seg(t, 0, 0.3));
  const out = E.outCubic(seg(t, 0, 0.3));
  const mv = E.inOutCubic(seg(t, 0.22, 0.78));
  const angle = (231 - 141 * mv) * D2R; // round the left side, to below the bowl
  const radius = lerp(lerp(128, 158, out), 150, mv);
  return {
    h1: { x: 0, y: cy, a: phi0, sy: 1 },
    h2: { x: 0, y: cy, a: phi0 + 180 + 180 * fold, sy: 1 },
    bar: {
      x: radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      a: r0 + 90 * E.inOutCubic(seg(t, 0.1, 0.6)),
      sy: lerp(1, 0.2, shrink),
    },
  };
};

/* C -> A: the dot circles round into the bowl, the folded half
   sweeps back up, and the dot stretches into the bar of ⴱ. */
export const markCtoA: Move = (t, o = {}) => {
  const phi0 = o.phi0 == null ? 180 : o.phi0,
    r0 = o.r0 == null ? 90 : o.r0;
  const cy = lerp(-85, 0, E.inOutCubic(seg(t, 0.05, 0.6)));
  const orbit = E.inOutCubic(seg(t, 0, 0.5)); // dot travels round the right side
  const th = (90 - 180 * orbit) * D2R;
  const drop = E.outCubic(seg(t, 0.42, 0.62));
  const unfold = E.outBack(seg(t, 0.38, 0.8), 1.25);
  const grow = E.outBack(seg(t, 0.7, 0.95), 1.6);
  return {
    h1: { x: 0, y: cy, a: phi0, sy: 1 },
    h2: { x: 0, y: cy, a: phi0 + 360 + 180 * unfold, sy: 1 },
    bar: {
      x: lerp(150 * Math.cos(th), 0, drop),
      y: cy + lerp(150 * Math.sin(th), 0, drop),
      a: r0 + 180 * orbit,
      sy: lerp(0.2, 1, grow),
    },
  };
};

/** The three-script loop, ⴱ → b → ب → ⴱ, as the brand book's plate 4.0 reads it. */
export type MarkLoopStep = "A" | "AB" | "B" | "BC" | "C" | "CA";
export const markLoopSteps: readonly MarkLoopStep[] = ["A", "AB", "B", "BC", "C", "CA"];
/** Plate 4.0 timings in ms: holds ⴱ 1.3s, b 1.4s, ب 1.6s. */
export const markLoopDurations: Record<MarkLoopStep, number> = {
  A: 1300,
  AB: 1750,
  B: 1400,
  BC: 1600,
  C: 1600,
  CA: 1750,
};
/** Pose `t` of the way through `step`; `drop` is the b's bowl height (50 standalone, 0 in the wordmark). */
export function markLoopPose(step: MarkLoopStep, t: number, drop = 50): Pose {
  switch (step) {
    case "A":
      return markStatic.A();
    case "AB":
      return markAtoB(t, { drop });
    case "B":
      return markAtoB(1, { drop });
    case "BC":
      return markBtoC(t, { drop });
    case "C":
      return markStatic.C();
    case "CA":
      return markCtoA(t);
  }
}

export const markTransform = (p: Piece) =>
  `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${p.a.toFixed(2)})${p.sy !== 1 ? ` scale(1 ${p.sy.toFixed(3)})` : ""}`;

/** Writes a pose onto the three piece elements, in `markPieces` order. */
export function setMarkPose(elements: readonly Element[], pose: Pose) {
  markPieces.forEach((name, i) =>
    elements[i]?.setAttribute("transform", markTransform(pose[name])),
  );
}

/* Wordmark: lower-case bouthouri drawn from the same kit. x-height band
   y ∈ [-100, 100] (ring centre y = 0), baseline 100, ascender -200. Every
   glyph part stays its own path so overlapping strokes never cancel. */
const rect = (x: number, y: number, w: number, h: number) =>
  `M${x} ${y}h${w}v${h}h${-w}Z`;
const ring = (cx: number) =>
  `M${cx - 100} 0a100 100 0 1 0 200 0a100 100 0 1 0 -200 0ZM${cx - 60} 0a60 60 0 1 1 120 0a60 60 0 1 1 -120 0Z`;
const arch = (cx: number) =>
  `M${cx - 100} 0.9V0A100 100 0 0 1 ${cx + 100} 0V0.9H${cx + 60}V0A60 60 0 0 0 ${cx - 60} 0V0.9Z`;
const cup = (cx: number) =>
  `M${cx + 100} -0.9V0A100 100 0 0 1 ${cx - 100} 0V-0.9H${cx - 60}V0A60 60 0 0 0 ${cx + 60} 0V-0.9Z`;
const quarter = (cx: number) =>
  `M${cx - 100} 0A100 100 0 0 1 ${cx} -100V-60A60 60 0 0 0 ${cx - 60} 0Z`;
const glyphs: Record<string, { w: number; d: (x: number) => string[] }> = {
  b: { w: 200, d: (x) => [rect(x, -200, 40, 200), ring(x + 100)] },
  o: { w: 200, d: (x) => [ring(x + 100)] },
  u: {
    w: 200,
    d: (x) => [rect(x, -100, 40, 100.5), cup(x + 100), rect(x + 160, -100, 40, 200)],
  },
  t: { w: 112, d: (x) => [rect(x + 34, -176, 40, 276), rect(x, -100, 112, 40)] },
  h: {
    w: 200,
    d: (x) => [rect(x, -200, 40, 300), arch(x + 100), rect(x + 160, -0.5, 40, 100.5)],
  },
  r: { w: 100, d: (x) => [rect(x, -100, 40, 200), quarter(x + 100)] },
  i: { w: 40, d: (x) => [rect(x, -100, 40, 200), rect(x, -176, 40, 40)] },
};
// Optical gaps between pairs; 40 otherwise.
const gaps: Record<string, number> = { bo: 34, ou: 38, ut: 30, th: 30, ho: 40, ur: 46, ri: 40 };

function layoutWordmark(word: string) {
  let x = 0;
  const paths: string[] = [];
  [...word].forEach((letter, i) => {
    if (i) x += gaps[word[i - 1] + letter] ?? 40;
    // The b is the live mark, drawn by its own three pieces.
    if (i) paths.push(...glyphs[letter].d(x));
    x += glyphs[letter].w;
  });
  return { paths, width: x };
}
const word = layoutWordmark("bouthouri");

/** Letters after the b, as separate paths in wordmark units. */
export const wordmarkPaths = word.paths;
export const wordmarkViewBox = `-10 -210 ${word.width + 20} 320`;
export const wordmarkWidth = word.width + 20;
/** The live b sits at x = 100 with the bowl on the x-height band (drop 0). */
export const wordmarkMarkOffset = 100;
export const wordmarkRest = (): Pose => markAtoB(1, { drop: 0 });

/**
 * The entry's mark has landed on the nav b, mid-loop; the nav carries on from
 * there. Detail `{ step: MarkLoopStep, elapsed: ms into that step }`.
 */
export const markLandedEvent = "identity-mark-landed";

/* Loader: ⴱ is the progress. Each piece fills from the bottom of the screen
   over its third of the load, bottom half, bar, then top half; `band` is the
   piece's vertical extent in ⴱ. The loaded ⴱ then reads the three scripts.
   Fill clips span `loaderReach` sideways so the moves never meet an edge. */
export const loaderOrder = ["h2", "bar", "h1"] as const;
export const loaderBand: Record<(typeof markPieces)[number], { y: number; h: number }> = {
  h1: { y: -100, h: 100.9 },
  h2: { y: -0.9, h: 100.9 },
  bar: { y: -20, h: 40 },
};
export const loaderReach = 480;
export const loaderViewBox = "-160 -160 320 320";

/** Brand-book favicon: the b in ink on a bone tile. */
export const iconViewBox = "-190 -190 380 380";
