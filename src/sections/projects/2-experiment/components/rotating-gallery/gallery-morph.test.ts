import { expect, test } from 'bun:test';
import { createGalleryMorph } from './gallery-morph';
import type { createExperimentEnvironment } from '../../experiment-environment';

function fixture() {
  const values = () => { const map = new Map<string, string>(); return { setProperty(key: string, value: string) { map.set(key, value); }, getPropertyValue(key: string) { return map.get(key) ?? ''; }, removeProperty(key: string) { map.delete(key); } }; };
  const node = (x = 0, y = 0, width = 10, height = 20) => ({ style: values(), parentElement: null as unknown, dataset: { experimentScale: '.5' }, rect: { x, y, width, height }, removed: false,
    closest() { return this; }, getBoundingClientRect() { const r = this.rect; return { ...r, left: r.x, top: r.y, right: r.x + r.width, bottom: r.y + r.height }; },
    append(element: { parentElement: unknown }) { element.parentElement = this; }, remove() { this.removed = true; }, ownerDocument: { createElement: () => node() },
  });
  const stage = node(10, 20, 400, 500), first = node(60, 70), second = node(90, 90), parent = node(); first.parentElement = second.parentElement = parent;
  const tracks: { killed: boolean; target: Record<string, number>; vars: Record<string, unknown> }[] = [];
  const env = { motion: { tween(target: Record<string, number>, vars: Record<string, unknown>) { const track = { killed: false, target, vars }; tracks.push(track); return { kill() { track.killed = true; } }; } } } as unknown as ReturnType<typeof createExperimentEnvironment>;
  const morph = createGalleryMorph(env, stage as unknown as HTMLElement);
  return { morph, stage, first, second, parent, tracks,
    start() { const snapshot = morph.capture([first, second] as unknown as HTMLElement[]); first.rect = { x: 110, y: 120, width: 30, height: 40 }; second.rect = { x: 180, y: 190, width: 30, height: 40 }; let completions = 0;
      morph.play(snapshot, { duration: 1.4, ease: 'back.inOut(2.2)', stagger: i => i * .015, onComplete: () => completions++ }); return () => completions; },
  };
}
test('native gallery inversion normalizes physical rectangles once and retains source delays/ease', () => {
  const h = fixture(); h.start(); expect(h.tracks).toHaveLength(2);
  expect(h.tracks[0].target).toEqual({ x: 100, y: 100, width: 20, height: 40 });
  expect(h.tracks[0].vars).toMatchObject({ x: 200, y: 200, width: 60, height: 80, duration: 1.4, ease: 'back.inOut(2.2)', delay: 0 });
  expect(h.tracks[1].vars.delay).toBe(.015); h.morph.dispose();
});
test('only the last completed card releases layout; geometry styles and destination parents are restored', () => {
  const h = fixture(), done = h.start();
  (h.tracks[0].vars.onComplete as () => void)(); expect(done()).toBe(0);
  (h.tracks[1].vars.onComplete as () => void)(); expect(done()).toBe(1);
  expect(h.first.parentElement).toBe(h.parent); expect(h.first.style.getPropertyValue('width')).toBe(''); h.morph.dispose(); expect(done()).toBe(1);
});
test('interrupted or destroyed layout kills every owned track and rejects late completion', () => {
  const h = fixture(), done = h.start(); h.morph.dispose();
  expect(h.tracks.every(track => track.killed)).toBe(true); expect(h.first.parentElement).toBe(h.parent);
  h.tracks.forEach(track => (track.vars.onComplete as () => void)()); expect(done()).toBe(0);
});
