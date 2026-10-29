import { describe, expect, test } from 'bun:test';
import fixtures from './grid-source-fixtures.json';
import { GRID_START, gridCard, gridLayout, gridTarget, homography, projectiveCss, wrap } from './grid-geometry';
import { createGridMotion } from './grid-motion';

const values = (source: string, kind: string) => source.match(new RegExp(`${kind}\\(([^)]+)\\)`))![1].split(',').map(value => Number.parseFloat(value));

describe('actual cached Lab grid geometry', () => {
  for (const fixture of fixtures.cases) test(`${fixture.width} reference: wrapping, projective corners, opacity and pointer parallax match source`, () => {
    const layout = gridLayout(fixture.width, fixture.height), motion = createGridMotion(layout, GRID_START);
    for (const state of fixture.states) {
      if (state.phase === 'pointer') { motion.hover({ x: fixture.width * -.08, y: fixture.height * .08 }); for (let tick = 0; tick < 60; tick++) motion.step(16.667, false); }
      if (state.phase === 'wheel') { motion.wheel(120, 360); for (let tick = 0; tick < 50; tick++) motion.step(16.667, false); }
      for (const expected of state.cards) {
        const actual = gridCard(layout, expected.index, motion.pan, motion.pointer, motion.pressure);
        const item = values(expected.item, 'translate3d'), matrix = values(expected.card, 'matrix3d'), parallax = values(expected.image, 'translate3d');
        expect(actual.position.x).toBeCloseTo(item[0] + 30, 7); expect(actual.position.y).toBeCloseTo(item[1], 7);
        const ordered = [actual.matrix.a, actual.matrix.b, 0, actual.matrix.p, actual.matrix.c, actual.matrix.d, 0, actual.matrix.q, 0, 0, 1, 0, actual.matrix.x, actual.matrix.y, 0, 1];
        ordered.forEach((value, index) => expect(value).toBeCloseTo(matrix[index], 5));
        expect(actual.opacity).toBeCloseTo(expected.opacity, 9);
        expect(actual.parallax.x).toBeCloseTo(parallax[0], 5); expect(actual.parallax.y).toBeCloseTo(parallax[1], 5);
      }
    }
  });
});

test('all three card sizes retain the source coverage and virtual repetition', () => {
  for (const [width, height, cardWidth, cardHeight] of [[1920, 1080, 349.44, 292.08], [768, 1024, 207.46666666666664, 185.6], [412, 915, 200, 180]]) {
    const layout = gridLayout(width, height); expect(layout.cardWidth).toBeCloseTo(cardWidth, 10); expect(layout.cardHeight).toBeCloseTo(cardHeight, 10);
    const target = gridTarget(layout, 8), initial = gridCard(layout, 8, target, { x: 0, y: 0 });
    expect(initial.position.x + layout.cardWidth / 2).toBeCloseTo(width / 2, 10);
    expect(initial.position.y + layout.cardHeight / 2).toBeCloseTo(height / 2, 10);
    expect(wrap(layout.extentX * 100 + 17, layout.extentX)).toBeCloseTo(17, 9);
    expect(wrap(-layout.extentY * 200 - 19, layout.extentY)).toBeCloseTo(-19, 9);
  }
});

test('vw translation splitting preserves the source homography at every outer width scale', () => {
  const matrix = homography(200, 180, { x: -40, y: 3 }, { x: 240, y: 7 }, { x: -25, y: 185 }, { x: 210, y: 190 });
  for (const scale of [.5, .75, 1, 1.5]) {
    const css = projectiveCss(matrix, scale, value => `${value * scale}vw`), m = values(css, 'matrix3d');
    for (const [x, y] of [[0, 0], [200, 0], [0, 180], [200, 180], [80, 80]]) {
      const divisor = matrix.p * x + matrix.q * y + 1;
      const expectedX = (matrix.a * x + matrix.c * y + matrix.x) / divisor * scale;
      const expectedY = (matrix.b * x + matrix.d * y + matrix.y) / divisor * scale;
      const actualDivisor = m[3] * x * scale + m[7] * y * scale + 1;
      expect((m[0] * x * scale + m[4] * y * scale) / actualDivisor + matrix.x * scale).toBeCloseTo(expectedX, 10);
      expect((m[1] * x * scale + m[5] * y * scale) / actualDivisor + matrix.y * scale).toBeCloseTo(expectedY, 10);
    }
  }
});

test('drag threshold, velocity cap, release expiry and click suppression stay separate', () => {
  const layout = gridLayout(1920, 1080), motion = createGridMotion(layout, GRID_START), initial = { ...motion.target };
  motion.begin({ x: 0, y: 0 }, 0); motion.move({ x: 3, y: 2 }, 16); expect(motion.dragged).toBe(false);
  motion.move({ x: 500, y: -100 }, 32); expect(motion.dragged).toBe(true);
  expect(motion.target).toEqual({ x: initial.x - 500, y: initial.y + 100 });
  motion.release(40); expect(motion.velocity.x).toBe(-3500); expect(motion.consumeClick()).toBe(true); expect(motion.consumeClick()).toBe(false);
  motion.begin({ x: 0, y: 0 }, 100); motion.move({ x: 30, y: 30 }, 120); motion.release(212);
  expect(motion.velocity).toEqual({ x: 0, y: 0 });
  expect(motion.consumeClick()).toBe(true);
  // The first press catches the still-lagging surface rather than following a
  // link; a subsequent stationary tap is an ordinary navigation again.
  motion.begin({ x: 0, y: 0 }, 300); motion.release(310); expect(motion.consumeClick()).toBe(true);
  motion.begin({ x: 0, y: 0 }, 400); motion.release(410); expect(motion.consumeClick()).toBe(false);
});

test('pointer cancellation and reduced motion settle without a perpetual input clock', () => {
  const motion = createGridMotion(gridLayout(412, 915), GRID_START);
  motion.hover({ x: 100, y: 200 }); motion.begin({ x: 0, y: 0 }, 0); motion.move({ x: 120, y: 80 }, 80); motion.release(90, true);
  expect(motion.velocity).toEqual({ x: 0, y: 0 });
  expect(motion.consumeClick()).toBe(false);
  motion.step(16.667, true); expect(motion.pan).toEqual(motion.target); expect(motion.pressure).toBe(0); expect(motion.active).toBe(false);
  motion.hover({ x: 100, y: 200 });
  for (let tick = 0; tick < 500; tick++) motion.step(16.667, false);
  expect(motion.active).toBe(false);
  motion.begin({ x: 0, y: 0 }, 1000); motion.move({ x: 60, y: 60 }, 1016);
  for (let tick = 0; tick < 500; tick++) motion.step(16.667, false);
  expect(motion.active).toBe(false); motion.release(2000, true);
});

test('momentum decays and profile changes retain the same relative virtual position', () => {
  const desktop = gridLayout(1920, 1080), tablet = gridLayout(768, 1024), motion = createGridMotion(desktop, GRID_START);
  motion.begin({ x: 400, y: 400 }, 0); motion.move({ x: 700, y: 200 }, 80); motion.release(90);
  for (let tick = 0; tick < 1000 && motion.active; tick++) motion.step(16.667, false);
  expect(motion.active).toBe(false); expect(motion.velocity).toEqual({ x: 0, y: 0 }); expect(motion.pan).toEqual(motion.target);
  const before = { x: motion.pan.x / desktop.stepX, y: motion.pan.y / desktop.stepY };
  motion.resize(tablet, desktop);
  expect(motion.pan.x / tablet.stepX).toBeCloseTo(before.x, 12); expect(motion.pan.y / tablet.stepY).toBeCloseTo(before.y, 12);
});
