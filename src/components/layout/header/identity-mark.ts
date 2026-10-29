/**
 * BOUTHOURI three-piece mark in the 280 × 140 frame: a stem and two equal
 * half-capsules sharing one 15.2 stroke. At rest the stem is a quiet line
 * beside a sound wave whose bowls share a leg; assembled, each piece turns a
 * quarter and the three lock into a B. Poses are `[x, y, degrees]`.
 */
const stroke = 15.2;
const radius = 29;
const run = 16;
const inner = 13.8;
const lip = 0.6;

// Half capsule opening toward +x. The lip overlaps whichever stroke it meets
// so abutting pieces never show an anti-aliased seam.
const capsule = (end: number) =>
  `M ${end} ${radius} H ${-run} A ${radius} ${radius} 0 0 1 ${-run} ${-radius} H ${end} V ${-inner} H ${-run} A ${inner} ${inner} 0 0 0 ${-run} ${inner} H ${end} Z`;
const stem = "M -7.6 -50.4 H 7.6 V 50.4 H -7.6 Z";

export const markPaths = [stem, capsule(lip), capsule(lip)] as const;
/** Translucent loader ghosts abut without a lip, so they never double up. */
export const markGhosts = [stem, capsule(0), capsule(0)] as const;

/** Quiet line, then the wave's arch and cup; both spans are 100.8 long. */
export const markRow = [
  [80.6, 70, 90],
  [178, 70, 90],
  [220.8, 70, -90],
] as const;

/** Stem, upper bowl and lower bowl. The lower bowl keeps turning backward. */
export const markAssembled = [
  [117.5, 70, 0],
  [125.1, 48.6, 180],
  [125.1, 91.4, -180],
] as const;

export const markTransform = (pose: readonly number[]) =>
  `translate(${pose[0]} ${pose[1]}) rotate(${pose[2]})`;

/** Local bounds `[x0, y0, x1, y1]` of each piece before posing. */
export const markBounds = [
  [-7.6, -50.4, 7.6, 50.4],
  [-run - radius, -radius, lip, radius],
  [-run - radius, -radius, lip, radius],
] as const;

const middle = (radius + inner) / 2;
const bend = Math.PI * middle;

/** Stroke length of a piece, lengthened by `extend` at both ends. */
export const markLength = (piece: number, extend = 0) =>
  piece ? 2 * (lip + extend + run) + bend : 100.8 + 2 * extend;

/**
 * Local point `along` a piece's stroke, starting from the end at the left of
 * the row, and `across` it from the centerline (positive toward a bowl's
 * outer edge). The arch starts on its +y leg and the cup on its -y leg.
 */
export function markPoint(
  piece: number,
  along: number,
  across: number,
  extend = 0,
): [number, number] {
  if (!piece) return [across, 50.4 + extend - along];
  const side = piece === 1 ? 1 : -1,
    straight = lip + extend + run,
    reach = middle + across;
  if (along <= straight) return [lip + extend - along, side * reach];
  if (along >= straight + bend)
    return [-run + along - straight - bend, -side * reach];
  const angle = side * (Math.PI / 2 + (along - straight) / middle);
  return [-run + reach * Math.cos(angle), reach * Math.sin(angle)];
}

const fixed = (value: number) => +value.toFixed(3);

/**
 * Local clip that reveals `progress` of a piece along its stroke: the line
 * fills like a bar and the wave is traced through both bowls. The clip
 * overreaches the stroke by one unit on every side.
 */
export function markTrace(piece: number, progress: number) {
  if (progress <= 0) return "";
  const length = markLength(piece, 1),
    at = length * Math.min(1, progress),
    straight = lip + 1 + run,
    stops = [0];
  if (piece)
    for (let step = 0; step <= 18; step++) stops.push(straight + (bend * step) / 18);
  const samples = [...stops.filter((stop) => stop < at), at];
  const edge = (across: number) =>
    samples.map((along) =>
      markPoint(piece, along, across, 1).map(fixed).join(" "),
    );
  const reach = stroke / 2 + 1;
  return `M ${[...edge(reach), ...edge(-reach).reverse()].join(" L ")} Z`;
}
