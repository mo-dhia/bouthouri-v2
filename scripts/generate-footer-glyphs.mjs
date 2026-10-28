// Offline asset generation only. Uses the pinned Troika parser and local font.
// Run: bun scripts/generate-footer-glyphs.mjs
import { readFile, writeFile } from 'node:fs/promises';
import typrFactory from 'troika-three-text/libs/typr.factory.js';
import woffFactory from 'troika-three-text/libs/woff2otf.factory.js';

globalThis.self = globalThis;
const Typr = typrFactory();
const file = new URL('../public/assets/textures/questrial-studio.woff', import.meta.url);
const bytes = await readFile(file);
const font = Typr.parse(woffFactory()(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)))[0];
const output = new URL('../src/components/layout/footer/footer-glyph-contours.json', import.meta.url);
const data = JSON.parse(await readFile(output, 'utf8'));
const area = points => Math.abs(points.reduce((sum, p, i) => {
  const q = points[(i + 1) % points.length];
  return sum + p[0] * q[1] - q[0] * p[1];
}, 0));
const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const midpoint = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
function flattenQuadratic(a, b, c, points) {
  // An error bound in font units, not a new runtime curve sampler.
  if (distance(b, midpoint(a, c)) <= 0.5) { points.push(c); return; }
  const ab = midpoint(a, b), bc = midpoint(b, c), center = midpoint(ab, bc);
  flattenQuadratic(a, ab, center, points); flattenQuadratic(center, bc, c, points);
}
function flattenCubic(a, b, c, d, points) {
  if (distance(b, a) + distance(c, b) + distance(d, c) - distance(d, a) <= 0.25) { points.push(d); return; }
  const ab = midpoint(a, b), bc = midpoint(b, c), cd = midpoint(c, d), abc = midpoint(ab, bc), bcd = midpoint(bc, cd), center = midpoint(abc, bcd);
  flattenCubic(a, ab, abc, center, points); flattenCubic(center, bcd, cd, d, points);
}
function densify(points, count) {
  if (distance(points[0], points.at(-1)) < 1e-8) points.pop();
  const lengths = points.map((p, i) => distance(p, points[(i + 1) % points.length]));
  const total = lengths.reduce((a, b) => a + b, 0);
  const remaining = Math.max(0, count - points.length);
  const allocation = lengths.map(length => remaining * length / total);
  const extra = allocation.map(Math.floor);
  allocation.map((value, index) => ({ index, fraction: value - extra[index] })).sort((a, b) => b.fraction - a.fraction)
    .slice(0, remaining - extra.reduce((a, b) => a + b, 0)).forEach(({ index }) => extra[index]++);
  return points.flatMap((p, i) => Array.from({ length: extra[i] + 1 }, (_, j) => {
    const q = points[(i + 1) % points.length], t = j / (extra[i] + 1);
    return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  }));
}
for (const letter of new Set('BOUTHOURI')) {
  const id = Typr.U.codeToGlyph(font, letter.codePointAt(0));
  const path = Typr.U.glyphToPath(font, id), contours = [];
  let at = 0, current = [], pen;
  for (const command of path.cmds) {
    const point = () => [path.crds[at++], path.crds[at++]];
    if (command === 'M') { current = [pen = point()]; contours.push(current); }
    else if (command === 'L') current.push(pen = point());
    else if (command === 'Q') { const b = point(), c = point(); flattenQuadratic(pen, b, c, current); pen = c; }
    else if (command === 'C') { const b = point(), c = point(), d = point(); flattenCubic(pen, b, c, d, current); pen = d; }
    else if (command !== 'Z') throw new Error(`Unsupported font command ${command}`);
  }
  contours.sort((a, b) => area(b) - area(a));
  const { xMin, yMin, xMax, yMax } = font.glyf[id];
  data[letter] = { bounds: [xMin, yMin, xMax, yMax], contours: contours.map((points, i) => densify(points, i ? 128 : 256)
    .map(([x, y]) => [+((x - xMin) / (xMax - xMin)).toFixed(6), +((yMax - y) / (yMax - yMin)).toFixed(6)])) };
}
await writeFile(output, JSON.stringify(Object.fromEntries([...new Set('BOUTHOURI')].map(letter => [letter, data[letter]]))) + '\n');
console.info(JSON.stringify({ wordmark: 'BOUTHOURI', localFont: true, glyphs: Object.fromEntries([...new Set('BOUTHOURI')].map(letter => [letter, data[letter].contours.map(points => points.length)])) }));
