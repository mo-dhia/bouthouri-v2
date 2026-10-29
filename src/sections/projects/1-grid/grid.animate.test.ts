import { afterEach, expect, test } from 'bun:test';
import { loadIsolatedModule } from '@/sections/services/test-support/isolated-module';
import { routeEntries } from '@/lib/navigation/route-entry';

const cleanups: (() => void)[] = [];
afterEach(() => { while (cleanups.length) cleanups.pop()!(); });
function harness({ coarse = false, heldFonts = false, width = 1920, height = 1080 } = {}) {
  let now = 0, serial = 0, maxFrames = 0, resolveFonts!: () => void;
  const frames = new Map<number, FrameRequestCallback>(), timers = new Map<number, { time: number; run: () => void }>(), holders = new Map<number, Node>();
  const subscribers = new Set<() => void>(), state = { menuOpen: false, quietMode: false };
  const media = Object.assign(new EventTarget(), { matches: false }), fine = { matches: !coarse };
  const style = () => ({ transform: '', opacity: '', setProperty(key: string, value: string) { (this as unknown as Record<string, string>)[key] = value; } });
  class Node extends EventTarget {
    dataset: Record<string, string> = {}; style = style(); parent: Node | null = null; children: Node[] = []; attributes = new Map<string, string>();
    ownerDocument!: Document; isConnected = true; tabIndex = 0; capture = new Set<number>();
    card?: Node; image?: Node; media?: Node; caption?: Node; offsetHeight = 22;
    constructor() { super(); this.ownerDocument = doc; }
    getAttribute(key: string) { return this.attributes.get(key) ?? null; }
    setAttribute(key: string, value: string) { this.attributes.set(key, value); }
    removeAttribute(key: string) { this.attributes.delete(key); if (key === 'style') this.style = style(); }
    append(node: Node) { node.remove(); node.parent = this; node.isConnected = true; this.children.push(node); }
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(node => node !== this); this.parent = null; }
    contains(node: Node): boolean { return node === this || this.children.some(child => child.contains(node)); }
    querySelector(selector: string): Node | null {
      if (selector === '[data-grid-card]') return this.card ?? null;
      if (selector === '[data-grid-media]') return this.media ?? null;
      if (selector === '[data-grid-caption]') return this.caption ?? null;
      if (selector === 'img') return this.image ?? null;
      return null;
    }
    querySelectorAll() { return this.children; }
    closest() { return { dataset: { routePath: '/en/projects' } }; }
    getBoundingClientRect() { return { left: 0, top: 0, width, height }; }
    hasPointerCapture(id: number) { return this.capture.has(id); }
    // One capture owner per pointer; a handoff notifies the previous owner, and
    // capture events bubble with their original target like the DOM's.
    setPointerCapture(id: number) {
      const previous = holders.get(id); holders.set(id, this); this.capture.add(id);
      if (previous && previous !== this && previous.capture.delete(id)) previous.bubble('lostpointercapture', id);
    }
    releasePointerCapture(id: number) { if (this.capture.delete(id)) { holders.delete(id); this.bubble('lostpointercapture', id); } }
    bubble(type: string, pointerId: number, target: Node = this) {
      const event = new Event(type); Object.defineProperties(event, { target: { value: target }, pointerId: { value: pointerId } });
      this.dispatchEvent(event); this.parent?.bubble(type, pointerId, target);
    }
    cloneNode() { return item(this.dataset.reel); }
  }
  class Video extends Node {
    paused = true; currentTime = 0; src = ''; muted = false; loop = false; playsInline = false; preload = ''; hidden = true; loads = 0;
    getAttribute(key: string) { return key === 'src' ? this.src || null : super.getAttribute(key); }
    removeAttribute(key: string) { if (key === 'src') this.src = ''; super.removeAttribute(key); }
    play() { this.paused = false; this.dispatchEvent(new Event('playing')); return Promise.resolve(); }
    pause() { this.paused = true; } load() { this.loads++; }
  }
  const videos: Video[] = [];
  const win = Object.assign(new EventTarget(), {
    innerWidth: width, innerHeight: height, navigator: {}, performance: { now: () => now },
    getComputedStyle: () => ({ rowGap: '8px' }),
    matchMedia: (query: string) => query.includes('reduced') ? media : fine,
    setTimeout(run: () => void, delay: number) { const id = ++serial; timers.set(id, { time: now + delay, run }); return id; },
    clearTimeout(id: number) { timers.delete(id); },
    requestAnimationFrame(callback: FrameRequestCallback) { const id = ++serial; frames.set(id, callback); maxFrames = Math.max(maxFrames, frames.size); return id; },
    cancelAnimationFrame(id: number) { frames.delete(id); },
  });
  const documentFixture = Object.assign(new EventTarget(), { hidden: false, defaultView: win,
    fonts: { ready: heldFonts ? new Promise<void>(resolve => { resolveFonts = resolve; }) : Promise.resolve() },
    createElement() { const video = new Video(); videos.push(video); return video; },
  });
  const doc = documentFixture as unknown as Document;
  function item(reel: string) {
    const node = new Node(); node.dataset.reel = reel; node.card = new Node(); node.media = new Node(); node.image = new Node();
    node.caption = new Node(); node.append(node.card); node.card.append(node.media); node.media.append(node.image); node.card.append(node.caption); return node;
  }
  const root = new Node(), viewport = new Node(), plane = new Node(); root.append(viewport); viewport.append(plane);
  root.querySelector = selector => selector === '[data-grid-viewport]' ? viewport : selector === '[data-grid-plane]' ? plane : null;
  for (let i = 0; i < 9; i++) plane.append(item(`/reel-${i}.mp4`));
  const original = [...plane.children];
  const evaluated = loadIsolatedModule<{ mountProjectsGrid: (root: HTMLElement) => () => void }>('src/sections/projects/1-grid/grid.animate.ts', {
    '@/store/uiStore': { uiStore: { getState: () => state, subscribe(callback: () => void) { subscribers.add(callback); return () => subscribers.delete(callback); } } },
    '@/lib/navigation/route-entry': { routeEntries, pageEntryPath: () => '/en/projects' },
  });
  let stopped = false; const cleanup = evaluated.mountProjectsGrid(root as unknown as HTMLElement);
  const stop = () => { if (!stopped) { stopped = true; cleanup(); } }; cleanups.push(stop);
  const fire = (node: EventTarget, type: string, props: Record<string, unknown> = {}) => {
    const event = new Event(type, { cancelable: true }); Object.entries(props).forEach(([key, value]) => Object.defineProperty(event, key, { value })); node.dispatchEvent(event); return event;
  };
  return { root, viewport, plane, original, win, doc: documentFixture, frames, timers, videos, subscribers, fire, media, stop, resolveFonts: () => resolveFonts(),
    get maxFrames() { return maxFrames; },
    async advance(ms: number) { const end = now + ms; for (let i = 0; i < 4; i++) await Promise.resolve(); while (now < end) {
      now = Math.min(end, now + 16.667); for (const [id, timer] of [...timers]) if (timer.time <= now) { timers.delete(id); timer.run(); }
      const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback(now)); await Promise.resolve();
    } },
    menu(open: boolean) { state.menuOpen = open; subscribers.forEach(callback => callback()); },
  };
}
const pointer = (x: number, y: number) => ({ pointerId: 1, pointerType: 'mouse', button: 0, clientX: x, clientY: y });

test('actual controller has one presentation request, sleeps at rest and releases visual clones', async () => {
  const h = harness(); await h.advance(4000); expect(h.plane.children).toHaveLength(36); expect(h.frames.size).toBe(0); expect(h.maxFrames).toBe(1);
  expect(h.original.every(node => node.caption?.parent === node)).toBe(true);
  expect(h.videos).toHaveLength(0); expect(h.original.every(node => node.tabIndex === 0)).toBe(true);
  expect(h.plane.children.slice(9).every(node => node.tabIndex === -1 && node.attributes.get('aria-hidden') === 'true')).toBe(true);
  const zoom = h.fire(h.viewport, 'wheel', { deltaMode: 0, deltaX: 0, deltaY: 120, ctrlKey: true }); expect(zoom.defaultPrevented).toBe(false);
  const wheel = h.fire(h.viewport, 'wheel', { deltaMode: 0, deltaX: 120, deltaY: 360, ctrlKey: false }); expect(wheel.defaultPrevented).toBe(true);
  await h.advance(4000); expect(h.frames.size).toBe(0); expect(h.maxFrames).toBe(1);
  h.stop(); expect(h.plane.children).toHaveLength(9); expect(h.frames.size + h.timers.size + h.subscribers.size).toBe(0); expect(h.root.dataset.gridEnhanced).toBeUndefined();
  expect(h.original.every(node => node.caption?.parent === node.card && !node.caption?.style.transform)).toBe(true);
  h.fire(h.viewport, 'wheel', { deltaX: 500, deltaY: 500 }); expect(h.frames.size).toBe(0);
});

test('captured drag consumes the root click without swallowing the following keyboard activation', async () => {
  const h = harness(); await h.advance(4000);
  h.fire(h.viewport, 'pointerdown', pointer(900, 500)); h.fire(h.win, 'pointermove', { ...pointer(1200, 650), target: h.root });
  expect(h.root.capture.has(1)).toBe(true); h.fire(h.win, 'pointerup', pointer(1200, 650)); expect(h.root.capture.size).toBe(0);
  expect(h.fire(h.root, 'click').defaultPrevented).toBe(true); expect(h.fire(h.root, 'click').defaultPrevented).toBe(false); h.stop();
});

test('coarse settled previews stop during a touch drag and cancellation leaves no stale click', async () => {
  const h = harness({ coarse: true }); await h.advance(5000); expect(h.videos).toHaveLength(1); expect(h.videos[0].paused).toBe(false);
  h.fire(h.viewport, 'pointerdown', { ...pointer(900, 500), pointerType: 'touch' });
  h.fire(h.win, 'pointermove', { ...pointer(1100, 650), pointerType: 'touch', target: h.root }); await h.advance(220);
  expect(h.videos[0].paused).toBe(true); h.fire(h.win, 'pointercancel', pointer(1100, 650)); expect(h.fire(h.root, 'click').defaultPrevented).toBe(false);
  h.stop(); expect(h.videos[0].src).toBe(''); expect(h.videos[0].loads).toBe(1);
});

for (const width of [375, 412, 600, 768]) test(`touch follows physical finger distance at ${width}px and reverses without lag`, async () => {
  const h = harness({ coarse: true, width, height: 915 }); await h.advance(4000);
  const position = () => h.original[8].style.transform.match(/translate3d\(([^,]+),([^,]+)/)!.slice(1).map(value => parseFloat(value) * width / 100);
  const before = position(), point = (clientX: number, clientY = 300) => ({ ...pointer(clientX, clientY), pointerType: 'touch' });
  h.fire(h.viewport, 'pointerdown', point(80));
  for (let i = 1; i <= 6; i++) { h.fire(h.viewport, 'pointermove', point(80 + i * 20, 300 + i * 10)); await h.advance(16.667); }
  expect(position()[0] - before[0]).toBeCloseTo(120, 7); expect(position()[1] - before[1]).toBeCloseTo(60, 7);
  h.fire(h.viewport, 'pointermove', point(140, 270)); await h.advance(16.667);
  expect(position()[0] - before[0]).toBeCloseTo(60, 7); expect(position()[1] - before[1]).toBeCloseTo(-30, 7);
  h.fire(h.win, 'pointerup', point(140)); expect(h.fire(h.root, 'click').defaultPrevented).toBe(true);
  await h.advance(8000); expect(h.frames.size).toBe(0); expect(h.maxFrames).toBe(1);
  h.fire(h.viewport, 'pointerdown', point(140)); h.fire(h.win, 'pointerup', point(140));
  expect(h.fire(h.root, 'click').defaultPrevented).toBe(false);
  h.stop(); expect(h.frames.size + h.timers.size + h.subscribers.size).toBe(0);
});

test('implicit touch capture handing off to the root keeps the drag alive', async () => {
  const h = harness({ coarse: true, width: 412, height: 915 }); await h.advance(4000);
  const card = h.original[8].card!, x = () => parseFloat(h.original[8].style.transform.match(/translate3d\(([^,]+)/)![1]) * 412 / 100;
  const contact = (clientX: number) => ({ ...pointer(clientX, 300), pointerType: 'touch', target: card });
  // The browser captures a touch to its target before pointerdown listeners run.
  const before = x(); card.setPointerCapture(1); h.fire(h.viewport, 'pointerdown', contact(80));
  for (let i = 1; i <= 6; i++) { h.fire(h.viewport, 'pointermove', contact(80 + i * 20)); await h.advance(16.667); }
  expect(card.capture.size).toBe(0); expect(h.root.capture.has(1)).toBe(true); expect(h.root.dataset.gridDragging).toBe('true');
  expect(x() - before).toBeCloseTo(120, 7);
  h.fire(h.win, 'pointerup', contact(200)); expect(h.root.capture.size).toBe(0); expect(h.fire(h.root, 'click').defaultPrevented).toBe(true);
  await h.advance(8000);
  // Losing the root's own capture without a pointerup still ends the contact.
  card.setPointerCapture(1); h.fire(h.viewport, 'pointerdown', contact(200)); h.fire(h.viewport, 'pointermove', contact(240)); await h.advance(16.667);
  const lost = x(); h.root.releasePointerCapture(1); expect(h.root.dataset.gridDragging).toBeUndefined();
  h.fire(h.viewport, 'pointermove', contact(300)); await h.advance(16.667); expect(x()).toBeCloseTo(lost, 7);
  expect(h.fire(h.root, 'click').defaultPrevented).toBe(false); h.stop();
});

test('touch and pen stay direct on hybrid devices; additional contacts cannot steal or cancel the drag', async () => {
  const h = harness({ width: 412, height: 915 }); await h.advance(4000);
  const x = () => parseFloat(h.original[8].style.transform.match(/translate3d\(([^,]+)/)![1]) * 412 / 100;
  const contact = (clientX: number) => ({ ...pointer(clientX, 300), pointerType: 'pen', isPrimary: true });
  const before = x(); h.fire(h.viewport, 'pointerdown', contact(60));
  h.fire(h.viewport, 'pointermove', contact(100)); await h.advance(16.667); expect(x() - before).toBeCloseTo(40, 7);
  h.fire(h.viewport, 'pointerdown', { ...contact(300), pointerId: 2, isPrimary: false });
  h.fire(h.win, 'pointercancel', { ...contact(300), pointerId: 2 });
  h.fire(h.viewport, 'pointermove', contact(140)); await h.advance(16.667); expect(x() - before).toBeCloseTo(80, 7);
  h.fire(h.win, 'pointercancel', contact(140)); expect(h.fire(h.root, 'click').defaultPrevented).toBe(false);
  await h.advance(2000); expect(h.frames.size).toBe(0);
  h.media.matches = true; h.fire(h.media, 'change'); await h.advance(100);
  const reducedStart = x(); h.fire(h.viewport, 'pointerdown', { ...contact(140), pointerType: 'touch' });
  h.fire(h.viewport, 'pointermove', { ...contact(200), pointerType: 'touch' }); await h.advance(16.667);
  expect(x() - reducedStart).toBeCloseTo(60, 7);
  h.fire(h.win, 'pointerup', { ...contact(200), pointerType: 'touch' }); await h.advance(500); expect(h.frames.size).toBe(0);
});

test('hidden, MENU and reduced transitions pause media and do not accumulate frame owners', async () => {
  const h = harness(); await h.advance(4000); h.fire(h.original[8], 'pointerenter'); await h.advance(230); expect(h.videos[0].paused).toBe(false);
  h.doc.hidden = true; h.fire(h.doc, 'visibilitychange'); expect(h.videos[0].paused).toBe(true); expect(h.frames.size).toBe(0);
  h.doc.hidden = false; h.fire(h.doc, 'visibilitychange'); expect(h.videos[0].paused).toBe(false);
  h.menu(true); expect(h.videos[0].paused).toBe(true); expect(h.frames.size).toBe(0); h.menu(false); await h.advance(240);
  h.media.matches = true; h.fire(h.media, 'change'); expect(h.videos[0].paused).toBe(true); await h.advance(100);
  expect(h.frames.size).toBe(0); expect(h.maxFrames).toBe(1); h.stop();
});

test('cleanup before font readiness rejects late publication and cancels a pending resize', async () => {
  const h = harness({ heldFonts: true }); h.fire(h.win, 'resize'); expect(h.timers.size).toBe(1); h.stop(); h.resolveFonts(); await h.advance(1000);
  expect(routeEntries(h.doc as unknown as Document).ready(h.root as unknown as HTMLElement)).toBe(false);
  expect(h.frames.size + h.timers.size + h.subscribers.size).toBe(0); expect(h.plane.children).toHaveLength(9);
});
