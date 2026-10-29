import { expect, test } from 'bun:test';
import { createExperimentClock } from './experiment-clock';
import { createExperimentMotion, experimentEase, experimentGridStagger, cubicEase } from './experiment-motion';
import { designCss, setDesignStyle } from './experiment-dom';
import { experimentLayout } from './experiment-layout';

function harness() {
  let now = 100, serial = 0, max = 0;
  const requests = new Map<number, FrameRequestCallback>();
  const win = { performance: { now: () => now }, requestAnimationFrame(callback: FrameRequestCallback) { requests.set(++serial, callback); max = Math.max(max, requests.size); return serial; }, cancelAnimationFrame(id: number) { requests.delete(id); }, getComputedStyle: () => ({ getPropertyValue: (key: string) => key === 'opacity' ? '1' : '' }) } as unknown as Window;
  const errors: unknown[] = [], clock = createExperimentClock(win, error => errors.push(error));
  return { win, clock, requests, errors, get max() { return max; }, step(ms: number) { now += ms; const frames = [...requests.values()]; requests.clear(); frames.forEach(frame => frame(now)); } };
}

test('source elastic intro and all scene eases stay finite at every sampled phase', () => {
  for (const name of ['elastic.out(1, 0.55)', 'elastic.out(2, 0.6)', 'power2.out', 'power3.inOut', 'expo.out', 'sine.inOut', 'back.inOut(2.2)']) {
    const ease = experimentEase(name);
    expect(ease(0)).toBeCloseTo(0, 9); expect(ease(1)).toBeCloseTo(1, 9);
    for (let i = 0; i <= 200; i++) expect(Number.isFinite(ease(i / 200))).toBe(true);
  }
  expect(experimentEase('elastic.out(1, 0.55)')(.4)).toBeCloseTo(1.008894677392, 8);
  expect(experimentEase('power2.out')(.5)).toBe(.875);
});

test('one scene request survives a paused document without consuming hidden elapsed', () => {
  const h = harness(), poses: number[] = [];
  const tick = (time: number) => poses.push(time); h.clock.add(tick);
  h.clock.request(() => h.clock.request(() => {})); h.step(20); expect(h.max).toBe(1);
  const before = h.clock.now(); h.clock.pause(true); h.step(20_000);
  expect(h.requests.size).toBe(0); expect(h.clock.now()).toBe(before);
  h.clock.pause(false); h.step(16); expect(h.clock.now() - before).toBe(16);
  expect(poses).toHaveLength(2); h.clock.remove(tick); h.clock.dispose(); expect(h.requests.size).toBe(0);
});

test('canceled renderer requests and failures cannot schedule a second owner', () => {
  const h = harness(); let calls = 0;
  const canceled = h.clock.request(() => calls++); h.clock.cancel(canceled); expect(h.requests.size).toBe(0);
  h.clock.add(() => { throw new Error('draw failed'); }); h.step(16);
  expect(h.errors).toHaveLength(1); expect(h.requests.size).toBe(0); expect(calls).toBe(0);
  h.clock.request(() => calls++); h.step(100); expect(calls).toBe(0);
});

test('finite object tracks settle once, retarget from current values and fully release the clock', () => {
  const h = harness(), motion = createExperimentMotion(h.clock, h.win, designCss), value = { x: 0 };
  let completions = 0;
  motion.tween(value, { x: 100, duration: 1, ease: 'none', onComplete: () => completions++ });
  h.step(250); expect(value.x).toBe(25);
  motion.tween(value, { x: 50, duration: .5, ease: 'none', overwrite: true });
  h.step(250); expect(value.x).toBeCloseTo(37.5); h.step(250); expect(value.x).toBe(50);
  expect(completions).toBe(0); expect(h.requests.size).toBe(0);
  motion.tween(value, { x: 80, duration: .1, onComplete: () => completions++ }); h.step(100);
  expect(completions).toBe(1); expect(h.requests.size).toBe(0); motion.dispose();
});

test('DOM design writes retain assignment values and progress transforms use a real scale axis', () => {
  const h = harness(), values = new Map<string, string>();
  const element = { nodeType: 1, style: { transform: '', setProperty(key: string, value: string) { values.set(key, value); }, getPropertyValue(key: string) { return values.get(key) ?? ''; } } } as unknown as HTMLElement;
  const result = setDesignStyle(element, 'width', '52px'); expect(result).toBe('52px'); expect(values.get('width')).toBe('calc(52 * var(--experiment-unit))');
  const motion = createExperimentMotion(h.clock, h.win, designCss);
  motion.set(element, { scaleX: 0 }); expect(element.style.transform).toContain('scale(0, 1)');
  motion.set(element, { scaleX: .75 }); expect(element.style.transform).toContain('scale(0.75, 1)');
  motion.dispose(); h.clock.dispose();
});

test('stage cameras freeze reference dimensions while physical width alone sets the outer scale', () => {
  expect(experimentLayout(1920)).toMatchObject({ width: 1858, height: 946, top: 102, scale: 1 });
  expect(experimentLayout(768)).toMatchObject({ width: 724, height: 899, top: 102, scale: 1 });
  expect(experimentLayout(412)).toMatchObject({ width: 377, height: 817, top: 80, scale: 1 });
  expect(experimentLayout(1440)).toMatchObject({ width: 1858, height: 946, scale: .75 });
  expect(experimentLayout(650)).toMatchObject({ width: 724, height: 899, scale: 650 / 768 });
});


test('source center-grid staggering spans the largest grid side and keeps equal center starts', () => {
  // Cached mesh.DnpBQ695.js distribute(): span = each * max(columns, count / columns).
  const actual = experimentGridStagger(30, [6, 5], .0035);
  expect(Math.min(...actual)).toBe(0); expect(Math.max(...actual)).toBe(.021);
  expect(actual[12]).toBe(actual[17]); expect(actual[0]).toBe(actual[29]);
  expect(experimentGridStagger(4, [2, 2], .0035)).toEqual([0, 0, 0, 0]);
  expect(cubicEase([.16, 1, .3, 1])(0)).toBe(0); expect(cubicEase([.16, 1, .3, 1])(1)).toBe(1);
});


test('a real peer or finite track waking an idle scene never jumps behind its start time', () => {
  const h = harness(); let presented = 0; h.clock.request(time => { presented = time; }); h.step(20);
  h.step(10_000); const before = h.clock.now(); h.clock.request(time => { presented = time; }); h.step(16);
  expect(presented).toBe(before + 16); expect(h.clock.now()).toBe(presented); expect(h.requests.size).toBe(0);
  const motion = createExperimentMotion(h.clock, h.win, designCss), pose = { x: 0 };
  h.step(6000); motion.tween(pose, { x: 100, duration: .1, ease: 'none' }); h.step(50); expect(pose.x).toBe(50); h.step(50); expect(pose.x).toBe(100);
  motion.dispose(); h.clock.dispose();
});
