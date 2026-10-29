import { expect, test } from 'bun:test';
import { experiment } from './live-cursors.logic';
import type { createExperimentEnvironment } from '../../experiment-environment';

type Tick = (seconds: number, delta: number) => void;
class FixtureElement extends EventTarget {
  className = ''; dir = ''; innerHTML = ''; textContent: string | null = '';
  dataset: Record<string, string> = {};
  children: FixtureElement[] = []; parentElement: FixtureElement | null = null;
  attributes = new Map<string, string>();
  ownerDocument!: Document;
  clientWidth = 1858; clientHeight = 946;
  style = Object.assign({ color: '', background: '' }, { values: new Map<string, string>(), setProperty(key: string, value: string) { this.values.set(key, value); } });
  append(...elements: FixtureElement[]) { for (const element of elements) { element.parentElement = this; this.children.push(element); } }
  remove() { if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(child => child !== this); this.parentElement = null; }
  setAttribute(key: string, value: string) { this.attributes.set(key, value); }
  closest(selector: string): FixtureElement | null { return selector.includes('experiment-camera') ? cameraFor(this) : ownerFor(this); }
  getBoundingClientRect() { return { x: 30, y: 80, left: 30, top: 80, width: this.clientWidth * .75, height: this.clientHeight * .75, right: 30 + this.clientWidth * .75, bottom: 80 + this.clientHeight * .75 }; }
  querySelector() { return this.children[0] ?? null; }
}
const cameras = new WeakMap<FixtureElement, FixtureElement>(), owners = new WeakMap<FixtureElement, FixtureElement>();
const cameraFor = (node: FixtureElement): FixtureElement | null => cameras.get(node) ?? (node.parentElement ? cameraFor(node.parentElement) : null);
const ownerFor = (node: FixtureElement): FixtureElement | null => owners.get(node) ?? (node.parentElement ? ownerFor(node.parentElement) : null);
function fixture(reduced = false, arabic = false) {
  const root = new FixtureElement(), owner = new FixtureElement(), instruction = new FixtureElement();
  root.dataset.experimentScale = '.75'; owner.dataset.locale = arabic ? 'ar' : 'en';
  instruction.textContent = arabic ? 'محاكاة محلية للمؤشرات.' : 'Local cursor simulation. No visitors are connected.';
  owner.append(instruction); cameras.set(root, root); owners.set(root, owner);
  const doc = { createElement() { const node = new FixtureElement(); node.ownerDocument = doc as unknown as Document; return node; } };
  root.ownerDocument = doc as unknown as Document;
  let now = 1000;
  const frames = new Set<Tick>();
  const env = { reduced, now: () => now, clientX: (event: PointerEvent) => event.clientX / .75, clientY: (event: PointerEvent) => event.clientY / .75,
    clock: { add(frame: Tick) { frames.add(frame); }, remove(frame: Tick) { frames.delete(frame); } },
  } as unknown as ReturnType<typeof createExperimentEnvironment>;
  const handle = experiment.mount(root as unknown as HTMLElement, env);
  const wrap = root.children[0], pointers = wrap.children.slice(1);
  return { root, handle, wrap, pointers, frames,
    poses: () => pointers.map(pointer => pointer.style.values.get('transform')),
    step(ms: number) { now += ms; frames.forEach(frame => frame(now / 1000, ms)); },
    point(x: number, y: number, type = 'mouse') { const r = wrap.getBoundingClientRect(); wrap.dispatchEvent(Object.assign(new Event('pointerdown'), { clientX: r.left + r.width * x, clientY: r.top + r.height * y, pointerType: type })); },
  };
}

test('mounted cursor study allocates only local demo elements and never accesses a transport', () => {
  const names = ['BroadcastChannel', 'WebSocket', 'EventSource', 'fetch', 'setInterval'];
  const originals = new Map(names.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  let calls = 0;
  const forbidden = function () { calls++; throw new Error('Cursor transport is forbidden'); };
  try {
    names.forEach(name => Object.defineProperty(globalThis, name, { value: forbidden, configurable: true, writable: true }));
    const h = fixture();
    expect(h.pointers).toHaveLength(3); expect(h.wrap.dataset.cursorSimulation).toBe('local');
    expect(h.wrap.children[0].textContent).toContain('simulation');
    expect(h.pointers.map(p => p.children[1].textContent)).toEqual(['Demo 01', 'Demo 02', 'Demo 03']);
    const initial = h.poses(); for (let i = 0; i < 200; i++) h.step(16);
    expect(h.poses()).not.toEqual(initial); expect(h.frames.size).toBe(1); expect(calls).toBe(0);
    h.handle.destroy(); expect(h.frames.size).toBe(0); expect(h.root.children).toHaveLength(0); expect(calls).toBe(0);
  } finally {
    originals.forEach((descriptor, name) => { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else Reflect.deleteProperty(globalThis, name); });
  }
});
test('reduced motion stays still without a frame owner and responds to local touch once', () => {
  const h = fixture(true); expect(h.frames.size).toBe(0); const initial = h.poses();
  h.step(20_000); expect(h.poses()).toEqual(initial);
  h.point(.8, .2, 'touch'); expect(h.poses()).not.toEqual(initial); expect(h.frames.size).toBe(0);
  h.wrap.dispatchEvent(new Event('pointercancel'));
  h.poses().forEach((pose, index) => {
    const coordinates = (value: string) => [...value.matchAll(/calc\(([-\d.e]+) \* /g)].map(match => Number(match[1]));
    coordinates(pose!).forEach((value, axis) => expect(value).toBeCloseTo(coordinates(initial[index]!)[axis], 9));
  });
  h.handle.set('size', 1.4); expect(h.poses().every(p => p?.endsWith('scale(1.4)'))).toBe(true); h.handle.destroy();
});
test('Arabic labeling and lifecycle remain section-owned with no global cursor overlay', () => {
  const h = fixture(false, true); expect(h.wrap.children[0].dir).toBe('rtl'); expect(h.pointers[0].children[1].textContent).toContain('محاكاة');
  h.point(.7, .2); h.step(50); const before = h.poses(); h.handle.destroy(); h.handle.destroy();
  h.point(.1, .8); h.step(1000); expect(h.poses()).toEqual(before); expect(h.frames.size).toBe(0); expect(h.root.children).toHaveLength(0);
});
