import { expect, test } from 'bun:test';
import { CASE_CONCEPTS, CONE_ORIGIN, TOUR_STUDY, TWIST_STUDY, anchoredProgress, caseReading, coneTransform, financePath, financeStates, marketY, passageProgress, storyReveal } from './case-geometry';

const numbers = (d: string) => (d.match(/-?\d*\.?\d+/g) ?? []).map(Number);

test('the Artefact walk draws one ring per panorama and one tick per hotspot', () => {
  expect(TOUR_STUDY.walk.match(/A40 40 0 0 1 \S+ 90/g)?.length).toBe(7);
  expect(TOUR_STUDY.hotspots.match(/M/g)?.length).toBe(18);
});

test('the Vawzen line twists once for each site it carried', () => {
  expect(TWIST_STUDY.draw.match(/C/g)?.length).toBe(6);
  expect(CASE_CONCEPTS.vawzen.ticks.match(/M/g)?.length).toBe(5);
});

test('the Batiprix price steps from yearly through quarterly to monthly and lands on the market', () => {
  const steps = (state: number[][]) => new Set(state.map(([, y]) => y)).size;
  expect(financeStates.map(steps)).toEqual([1, 4, 12]);
  expect(numbers(financePath(0))).toEqual(financeStates[0].flat().map(value => Math.round(value * 100) / 100));
  expect(numbers(financePath(1))).toEqual(financeStates[2].flat().map(value => Math.round(value * 100) / 100));
  financeStates[2].forEach(([x, y], index) => { if (index % 2 === 0) expect(y).toBeCloseTo(marketY(x), 6); });
});

test('the cone holds its origin on the present and narrows by four fifths', () => {
  expect(coneTransform(0)).toBe('matrix(1 0 0 1 0 0)');
  const [, , , k, , shift] = numbers(coneTransform(1));
  expect(k).toBeCloseTo(.2, 6);
  expect(k * CONE_ORIGIN + shift).toBeCloseTo(CONE_ORIGIN, 6);
});

test('reading follows the measured anchors and settles on the last step', () => {
  const anchors = [100, 300, 900];
  expect(anchoredProgress(0, anchors)).toBe(0);
  expect(anchoredProgress(200, anchors)).toBeCloseTo(.25, 6);
  expect(anchoredProgress(600, anchors)).toBeCloseTo(.75, 6);
  expect(anchoredProgress(1200, anchors)).toBe(1);
  expect([0, .24, .26, .74, .76, 1].map(value => caseReading(value).step)).toEqual([0, 0, 1, 1, 2, 2]);
  expect(caseReading(.2, true)).toEqual({ progress: 1, step: 2, route: 1 });
});

test('an unstuck concept plays while the whole drawing is on screen', () => {
  // A 260px drawing at 3000px in a 915px viewport under a 110px navigation clearance.
  const at = (scroll: number) => passageProgress(3000, 260, scroll, 915, 110);
  expect(at(3000 + 260 - 915)).toBe(0);
  expect(at(3000 - 110)).toBe(1);
  expect(at(3000 - 500)).toBeCloseTo((3000 - 500 - 2345) / 545, 6);
  // A drawing too tall for the space still gets 40% of the viewport to play.
  const tall = (scroll: number) => passageProgress(3000, 900, scroll, 915, 110);
  expect(tall(3000 - 110 - 366)).toBe(0);
  expect(tall(3000 - 110)).toBe(1);
});

test('story reveals open from the lower viewport and finish past its middle', () => {
  const at = (scroll: number) => storyReveal(2000, 100, scroll, 1000, 1, false);
  expect(at(2000 - 930)).toBe(0);
  expect(at(2000 - 520 + 20)).toBe(1);
  expect(at(1300)).toBeGreaterThan(0);
  expect(storyReveal(2000, 100, 0, 1000, 1, true)).toBe(1);
});
