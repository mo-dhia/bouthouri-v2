import { expect, test } from "bun:test";
import { brand } from "@/config/brand";
import glyphs from "./footer-glyph-contours.json";
import { FooterPaths, footerPartMap } from "./footer-paths";
import { createIdleTargets, FooterRefractionWaves } from "./footer-material-field";

const boxes = (width: number) => [...brand.wordmark].map((_, index) => ({
  x: width * 0.96 * index / brand.wordmark.length, y: 0,
  width: width * 0.9 / brand.wordmark.length, height: width * 0.15,
}));
const error = (a: ReturnType<FooterPaths["contours"]>, b: ReturnType<FooterPaths["contours"]>) => {
  let maximum = 0;
  a.forEach((contours, glyph) => contours.forEach((points, contour) => points.forEach((p, index) => {
    const q = b[glyph][contour][index];
    maximum = Math.max(maximum, Math.abs(p.x - q.x), Math.abs(p.y - q.y));
  })));
  return maximum;
};

test("all nine fitted letters preserve counters, finite morphs and exact word/identity endpoints", () => {
  expect(brand.wordmark).toBe("BOUTHOURI");
  expect(Object.keys(glyphs).sort()).toEqual([...new Set(brand.wordmark)].sort());
  for (const width of [1920, 768, 412]) {
    const paths = new FooterPaths(boxes(width), width * 0.96);
    expect(paths.source).toHaveLength(9);
    expect(paths.source.map(contours => contours.length)).toEqual([3, 2, 1, 1, 1, 2, 1, 2, 1]);
    expect(footerPartMap).toEqual([0, 1, 1, 1, 1, 1, 1, 1, 2]);
    expect(error(paths.source, paths.contours(0))).toBeLessThan(1e-9);
    expect(error(paths.source, paths.contours(1, true))).toBeLessThan(1e-9);
    expect(error(paths.contours(1), paths.contours(0, true))).toBeLessThan(1e-9);
    for (const reverse of [false, true]) for (let step = 0; step <= 30; step++) {
      const frame = paths.contours(step / 30, reverse);
      expect(frame.every(contours => contours.every(points => points.every(p => Number.isFinite(p.x) && Number.isFinite(p.y))))).toBe(true);
    }
    for (const frame of createIdleTargets(paths.source, paths.boxes)) {
      expect(frame.map(contours => contours.map(points => points.length))).toEqual(paths.source.map(contours => contours.map(points => points.length)));
      expect(frame.every(contours => contours.every(points => points.every(p => Number.isFinite(p.x) && Number.isFinite(p.y))))).toBe(true);
      expect(error(frame, paths.source)).toBeGreaterThan(0);
    }
  }
});

test("seven letter sectors meet without overlap and recreate the original complete identity ring", () => {
  const paths = new FooterPaths(boxes(1920), 1843.2), frame = paths.contours(1);
  const circle = paths.parts[1], cx = circle.x + circle.width / 2, cy = circle.y + circle.height / 2;
  const first = frame[1][0][0];
  let previous = first;
  for (let glyph = 1; glyph < 8; glyph++) {
    const outline = frame[glyph][0], split = Math.ceil(outline.length / 2);
    expect(Math.hypot(previous.x - outline[0].x, previous.y - outline[0].y)).toBeLessThan(1e-9);
    previous = outline[split - 1];
    outline.forEach((p, index) => {
      const rx = circle.width * (index < split ? 0.5 : 21.409252 / 73.600516);
      const ry = circle.height * (index < split ? 0.5 : 21.357166 / 73.578316);
      expect(((p.x - cx) / rx) ** 2 + ((p.y - cy) / ry) ** 2).toBeCloseTo(1, 10);
    });
  }
  expect(Math.hypot(previous.x - first.x, previous.y - first.y)).toBeLessThan(1e-9);
});

test("the last letter participates in waves and remains independent of unrelated identity parts", () => {
  const waves = new FooterRefractionWaves();
  waves.contact({ x: 100, y: 50 }, 8, { x: 120, y: 10 }, 200);
  waves.advance(0.1);
  const same = waves.offset({ x: 100, y: 50 }, 8, true);
  const other = waves.offset({ x: 100, y: 50 }, 1, true);
  expect(Math.hypot(same.x, same.y)).toBeGreaterThan(0);
  expect(Math.hypot(other.x, other.y)).toBeLessThan(Math.hypot(same.x, same.y));
});


test("a longer fitted word keeps the reference logo size and bottom anchor", () => {
  const width = 1843.2, fittedHeight = 310;
  const paths = new FooterPaths(boxes(1920), width, fittedHeight);
  const ring = paths.parts[1];
  expect(ring.width).toBeCloseTo(239.616, 10);
  expect(ring.y + ring.height / 2).toBeCloseTo(50.96, 10);
  // New word top683.6 instead of old542.2: the viewport logo center stays734.56.
  expect(683.6 + ring.y + ring.height / 2).toBeCloseTo(734.56, 10);
  const shorter = new FooterPaths(boxes(1920), width, fittedHeight - 40);
  expect(shorter.parts[1].width).toBe(ring.width);
  expect(shorter.parts[1].y + 40).toBeCloseTo(ring.y, 10);
});
