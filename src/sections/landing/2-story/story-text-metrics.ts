import { Vector3, type Camera, type Matrix4 } from "three";

type GlyphMetrics = { glyphBounds: Float32Array; caretPositions: Float32Array };
export type TerminalGlyph = { x: number; y: number; radius: number; minX: number; maxX: number };

/** The final logical character need not be the last shaped glyph in RTL text. */
export function terminalGlyph(info: GlyphMetrics, text: string): TerminalGlyph | null {
  const bounds = info.glyphBounds;
  if (!bounds.length || !text.length) return null;
  const caret = (text.length - 1) * 4;
  const center = (info.caretPositions[caret] + info.caretPositions[caret + 1]) / 2;
  let nearest = 0, distance = Infinity;
  for (let i = 0; i < bounds.length; i += 4) {
    const delta = Math.abs((bounds[i] + bounds[i + 2]) / 2 - center);
    if (delta < distance) { distance = delta; nearest = i; }
  }
  return { x: (bounds[nearest] + bounds[nearest + 2]) / 2, y: (bounds[nearest + 1] + bounds[nearest + 3]) / 2,
    radius: (bounds[nearest + 2] - bounds[nearest]) / (2 * (1 + 2 * (1 / 16 + 0.5 / 128))), minX: bounds[nearest], maxX: bounds[nearest + 2] };
}

/** Subtract the Ideas departure before projection: the SVG pen stays in place. */
export function projectTerminalGlyph(dot: TerminalGlyph, matrix: Matrix4, camera: Camera, departureX: number, width: number, scratch = [new Vector3(), new Vector3()]) {
  const [point, edge] = scratch;
  point.set(dot.x, dot.y, 0).applyMatrix4(matrix);
  edge.set(dot.x + dot.radius, dot.y, 0).applyMatrix4(matrix);
  point.x -= departureX; edge.x -= departureX;
  point.project(camera); edge.project(camera);
  return { x: (point.x + 1) / 2, y: (1 - point.y) / 2, radius: Math.abs(edge.x - point.x) * width / 2 };
}
