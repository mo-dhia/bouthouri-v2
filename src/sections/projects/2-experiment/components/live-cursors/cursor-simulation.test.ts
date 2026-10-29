import { expect, test } from 'bun:test';
import { cursorTarget, guidedCursorTarget } from './cursor-simulation';

test('local paths remain deterministic and bounded through repeated pauses and travel', () => {
  for (let index = 0; index < 3; index++) {
    let previous = cursorTarget(0, index), minX = 1, maxX = 0, minY = 1, maxY = 0, largestStep = 0, deterministic = true;
    for (let frame = 0; frame < 1200; frame++) {
      const point = cursorTarget(frame / 20, index);
      const repeated = cursorTarget(frame / 20, index); deterministic &&= point.x === repeated.x && point.y === repeated.y;
      minX = Math.min(minX, point.x); maxX = Math.max(maxX, point.x); minY = Math.min(minY, point.y); maxY = Math.max(maxY, point.y);
      largestStep = Math.max(largestStep, Math.hypot(point.x - previous.x, point.y - previous.y));
      previous = point;
    }
    expect(deterministic).toBe(true); expect(minX).toBeGreaterThan(.1); expect(maxX).toBeLessThan(.9);
    expect(minY).toBeGreaterThan(.1); expect(maxY).toBeLessThan(.9); expect(largestStep).toBeLessThan(.05);
  }
});
test('authored cursors pause and then travel without a discontinuity at the stop', () => {
  expect(cursorTarget(0, 0)).toEqual(cursorTarget(.8, 0));
  expect(cursorTarget(1.8, 0)).not.toEqual(cursorTarget(0, 0));
  const before = cursorTarget(.9 - .0001, 0), after = cursorTarget(.9 + .0001, 0);
  expect(Math.hypot(before.x - after.x, before.y - after.y)).toBeLessThan(.00001);
});
test('local input guides three distinct targets and fades back to the authored path', () => {
  const targets = [0, 1, 2].map(index => guidedCursorTarget(2, index, { x: .95, y: .02, age: 0 }));
  expect(new Set(targets.map(p => `${p.x},${p.y}`)).size).toBe(3);
  for (let index = 0; index < 3; index++) {
    expect(guidedCursorTarget(2, index, { x: .95, y: .02, age: 4 })).toEqual(cursorTarget(2, index));
    expect(targets[index].x).toBeLessThanOrEqual(.9); expect(targets[index].y).toBeGreaterThanOrEqual(.05);
  }
});
