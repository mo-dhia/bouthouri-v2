import { expect, test } from "bun:test";
import { brand } from "@/config/brand";
import glyphs from "./footer-glyph-contours.json";
import { FooterPaths, footerMarkParts, footerPartMap } from "./footer-paths";
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
/** A glyph's final outline in sector order: outer edge forward, inner edge back. */
const sector = (paths: FooterPaths, frame: ReturnType<FooterPaths["contours"]>, glyph: number) => {
  const outline: { x: number; y: number }[] = [];
  paths.orders[glyph].forEach((point, index) => (outline[point] = frame[glyph][0][index]));
  return outline;
};

test("all nine fitted letters preserve counters, finite morphs and exact word/identity endpoints", () => {
  expect(brand.wordmark).toBe("BOUTHOURI");
  expect(Object.keys(glyphs).sort()).toEqual([...new Set(brand.wordmark)].sort());
  for (const width of [1920, 768, 412]) {
    const paths = new FooterPaths(boxes(width), width * 0.96);
    expect(paths.source).toHaveLength(9);
    expect(paths.source.map(contours => contours.length)).toEqual([3, 2, 1, 1, 1, 2, 1, 2, 1]);
    expect(footerPartMap).toEqual([0, 1, 1, 1, 1, 2, 2, 2, 2]);
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

test("eight letters trace adjoining sectors of the kit b's one continuous ring", () => {
  const paths = new FooterPaths(boxes(1920), 1843.2), frame = paths.contours(1);
  const [bar, upper, lower] = paths.parts, unit = bar.width / footerMarkParts[0].width;
  // Static b (m = 40): a 40 × 200 bar standing on the left of one ring of
  // outer radius 100, its foot level with the ring's centre.
  expect(bar.width).toBeCloseTo(40 * unit, 9);
  expect(bar.height).toBeCloseTo(200 * unit, 9);
  expect(upper.width).toBeCloseTo(200 * unit, 9);
  expect(upper.x).toBeCloseTo(bar.x, 9);
  expect(lower.x).toBeCloseTo(bar.x, 9);
  expect(bar.y + bar.height).toBeCloseTo(upper.y + 100 * unit, 9);
  expect(lower.y + lower.height - bar.y).toBeCloseTo(300 * unit, 9);
  const cuts = [1, 2].map((part) => {
    const glyphs = footerPartMap.flatMap((value, glyph) => value === part ? [glyph] : []);
    let previous: { x: number; y: number } | undefined, travelled = 0;
    for (const glyph of glyphs) {
      const outline = sector(paths, frame, glyph), split = Math.ceil(outline.length / 2);
      if (previous) expect(Math.hypot(previous.x - outline[0].x, previous.y - outline[0].y)).toBeLessThan(1e-9);
      for (let i = 1; i < split; i++) travelled += Math.hypot(outline[i].x - outline[i - 1].x, outline[i].y - outline[i - 1].y);
      previous = outline[split - 1];
    }
    const first = sector(paths, frame, glyphs[0]), last = sector(paths, frame, glyphs.at(-1)!);
    return { travelled, start: [first[0], first.at(-1)!], end: [last[Math.ceil(last.length / 2) - 1], last[Math.ceil(last.length / 2)]] };
  });
  // The outer edge runs both lips and the outer half circle.
  const outerEdge = (2 * 0.9 + Math.PI * 100) * unit;
  for (const { travelled } of cuts) {
    expect(travelled).toBeGreaterThan(0.999 * outerEdge);
    expect(travelled).toBeLessThan(1.0001 * outerEdge);
  }
  // The upper bowl closes where the lower bowl opens, outer on outer, their
  // lips overlapping across the ring's equator.
  expect(cuts[0].end[0].x).toBeCloseTo(cuts[1].start[0].x, 9);
  expect(cuts[0].end[1].x).toBeCloseTo(cuts[1].start[1].x, 9);
  expect(cuts[0].end[0].y - cuts[1].start[0].y).toBeCloseTo(1.8 * unit, 9);
  expect(cuts[1].end[0].x).toBeCloseTo(cuts[0].start[0].x, 9);
});

test("joined morph frames keep each bowl's sectors abutting", () => {
  const paths = new FooterPaths(boxes(1920), 1843.2);
  expect(paths.joined(0.47)).toBe(false);
  expect(paths.joined(0.45, true)).toBe(false);
  for (const [progress, reverse] of [[0.48, false], [0.7, false], [1, false], [0, true], [0.3, true], [0.44, true]] as const) {
    expect(paths.joined(progress, reverse)).toBe(true);
    const frame = paths.contours(progress, reverse);
    for (let glyph = 1; glyph < footerPartMap.length - 1; glyph++) {
      if (footerPartMap[glyph] !== footerPartMap[glyph + 1]) continue;
      const a = sector(paths, frame, glyph), b = sector(paths, frame, glyph + 1), split = Math.ceil(a.length / 2);
      // This sector's closing radial edge is the next sector's opening edge.
      expect(Math.hypot(a[split - 1].x - b[0].x, a[split - 1].y - b[0].y)).toBeLessThan(1e-9);
      expect(Math.hypot(a[split].x - b.at(-1)!.x, a[split].y - b.at(-1)!.y)).toBeLessThan(1e-9);
    }
  }
});

test("letters keep their winding on the way to the mark instead of turning inside out", () => {
  const paths = new FooterPaths(boxes(1920), 1843.2);
  const area = (points: { x: number; y: number }[]) =>
    points.reduce((sum, p, i) => sum + p.x * points[(i + 1) % points.length].y - points[(i + 1) % points.length].x * p.y, 0) / 2;
  const source = paths.source.map(contours => area(contours[0]));
  const mark = paths.contours(1).map((contours, glyph) => area(contours[0]) / source[glyph]);
  for (const reverse of [false, true]) for (let step = 0; step <= 100; step++) {
    const frame = paths.contours(step / 100, reverse);
    // Same orientation throughout, never thinner than half its mark sector.
    frame.forEach((contours, glyph) => expect(area(contours[0]) / source[glyph]).toBeGreaterThan(0.5 * Math.min(1, mark[glyph])));
  }
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
  // The b stands as tall as the reference ring, on the same center.
  const [bar, , lower] = paths.parts, top = bar.y, bottom = lower.y + lower.height;
  expect(bottom - top).toBeCloseTo(239.616, 10);
  expect((top + bottom) / 2).toBeCloseTo(50.96, 10);
  // New word top683.6 instead of old542.2: the viewport logo center stays734.56.
  expect(683.6 + (top + bottom) / 2).toBeCloseTo(734.56, 10);
  const shorter = new FooterPaths(boxes(1920), width, fittedHeight - 40);
  expect(shorter.parts[0].width).toBe(bar.width);
  expect(shorter.parts[0].y + 40).toBeCloseTo(bar.y, 10);
});
