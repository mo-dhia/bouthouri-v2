/** Grid-only geometry reconstructed from Carter Ogunsola's public Lab controller.
 * All lengths here are reference-camera units. The DOM adapter scales once. */
export type Point = { x: number; y: number };
export type GridLayout = ReturnType<typeof gridLayout>;
export const GRID_COLUMNS = 6;
export const GRID_COUNT = 36;
export const GRID_START = 8;
export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export const smooth = (value: number) => value * value * (3 - 2 * value);
export const damp = (amount: number, frames: number) => 1 - (1 - amount) ** frames;
export function wrap(value: number, extent: number) {
  const positive = (value % extent + extent) % extent;
  return positive >= extent / 2 ? positive - extent : positive;
}
export function gridLayout(width: number, height: number, count = GRID_COUNT) {
  const columns = GRID_COLUMNS, rows = Math.ceil(count / columns), gap = Math.max(16, width * .015);
  // Source --lab-inset at the agreed canvases. Its controller subtracts integer
  // offsetLeft while CSS retains this fraction; preserve that measured residue.
  const anchorInset = width <= 600 ? 16.46666666666667 : width <= 1024 ? 21.15 : 30;
  const cardWidth = Math.max(Math.min(Math.max(200, width * .19), 320), (width - columns * gap) / (columns - 1), 4 / 3 * ((height - rows * gap) / (rows - 1) - 30));
  const cardHeight = cardWidth * .75 + 30, stepX = cardWidth + gap, stepY = cardHeight + gap;
  return { width, height, columns, rows, gap, anchorInset, cardWidth, cardHeight, stepX, stepY, extentX: columns * stepX, extentY: rows * stepY };
}
export function gridTarget(layout: GridLayout, index: number): Point {
  const row = Math.floor(index / layout.columns);
  return { x: index % layout.columns * layout.stepX + row % 3 * layout.stepX / 3, y: row * layout.stepY };
}
export function gridPosition(layout: GridLayout, index: number, pan: Point): Point {
  const target = gridTarget(layout, index);
  return { x: layout.width / 2 + wrap(target.x - pan.x, layout.extentX) - layout.cardWidth / 2,
    y: layout.height / 2 + wrap(target.y - pan.y, layout.extentY) - layout.cardHeight / 2 };
}
export type Homography = { a: number; b: number; c: number; d: number; p: number; q: number; x: number; y: number };
export function homography(width: number, height: number, a: Point, b: Point, c: Point, d: Point): Homography {
  const dx1 = b.x - d.x, dy1 = b.y - d.y, dx2 = c.x - d.x, dy2 = c.y - d.y;
  const dx3 = a.x - b.x - c.x + d.x, dy3 = a.y - b.y - c.y + d.y;
  const divisor = dx1 * dy2 - dx2 * dy1;
  const p = divisor ? (dx3 * dy2 - dx2 * dy3) / divisor : 0, q = divisor ? (dx1 * dy3 - dx3 * dy1) / divisor : 0;
  return { a: (b.x - a.x + p * b.x) / width, b: (b.y - a.y + p * b.y) / width,
    c: (c.x - a.x + q * c.x) / height, d: (c.y - a.y + q * c.y) / height,
    p: p / width, q: q / height, x: a.x, y: a.y };
}
export function warpPoint(layout: GridLayout, point: Point, bow: number, pointer: Point, pressure: number): Point {
  const radial = 1 + .13 * bow * ((point.x / (layout.width / 2)) ** 2 + (point.y / (layout.height / 2)) ** 2);
  let x = point.x * radial, y = point.y * radial;
  if (pressure > .001) {
    const dx = x - pointer.x, dy = y - pointer.y, radius = 1.5 * layout.stepX;
    const force = .22 * pressure * Math.exp(-(dx * dx + dy * dy) / (radius * radius));
    x += dx * force; y += dy * force;
  }
  return { x, y };
}
export function gridCard(layout: GridLayout, index: number, pan: Point, pointer: Point, pressure = 0, bow = 1, reveal = 1) {
  const position = gridPosition(layout, index, pan), { width, height, cardWidth: w, cardHeight: h } = layout;
  const visibleX = Math.max(0, Math.min(position.x + w, width) - Math.max(position.x, 0)) / w;
  const visibleY = Math.max(0, Math.min(position.y + h, height) - Math.max(position.y, 0)) / h;
  const visibility = smooth(visibleX * visibleY), center = { x: position.x + w / 2 - width / 2, y: position.y + h / 2 - height / 2 };
  const distance = Math.min(1, Math.hypot(center.x, center.y) / Math.hypot(width / 2, height / 2));
  const entered = smooth(clamp((reveal - distance * .5) / .5, 0, 1)), scale = .94 + .06 * visibility;
  const origin = { x: position.x - width / 2, y: position.y - height / 2 };
  const corner = (x: number, y: number) => { const p = warpPoint(layout, { x, y }, bow, pointer, pressure); return { x: p.x - origin.x, y: p.y - origin.y }; };
  const matrix = homography(w, h, corner(origin.x, origin.y), corner(origin.x + w, origin.y), corner(origin.x, origin.y + h), corner(origin.x + w, origin.y + h));
  const radius = 1.5 * layout.stepX;
  return { position, matrix, opacity: entered * visibility, scale,
    inset: { x: (1 - scale) * w / 2, y: (1 - scale) * h / 2 + (1 - entered) * 20 },
    parallax: { x: clamp(-center.x * .05, -.05 * w, .05 * w) + clamp((pointer.x - center.x) / radius, -1, 1) * 10 * pressure,
      y: clamp(-center.y * .05, -.05 * h, .05 * h) + clamp((pointer.y - center.y) / radius, -1, 1) * 10 * pressure } };
}
/** Split the projective translation into CSS vw. Inverse-length coefficients
 * remain numeric matrix algebra and divide by the physical reference scale. */
export function projectiveCss(matrix: Homography, scale: number, length: (value: number) => string) {
  const { a, b, c, d, p, q, x, y } = matrix;
  return `translate3d(${length(x)},${length(y)},0) matrix3d(${a - x * p},${b - y * p},0,${p / scale},${c - x * q},${d - y * q},0,${q / scale},0,0,1,0,0,0,0,1)`;
}
