import { afterEach, expect, test } from 'bun:test';
import { loadIsolatedModule } from '@/sections/services/test-support/isolated-module';
import { routeEntries } from '@/lib/navigation/route-entry';

const cleanups: (() => void)[] = [];
afterEach(() => { while (cleanups.length) cleanups.pop()!(); });
function harness({ coarse = false, heldFonts = false } = {}) {
  let now = 0, serial = 0, maxFrames = 0, resolveFonts!: () => void;
  const frames = new Map<number, FrameRequestCallback>(), timers = new Map<number, { time: number; run: () => void }>();
  const subscribers = new Set<() => void>(), state = { menuOpen: false, quietMode: false };
  const media = Object.assign(new EventTarget(), { matches: false }), fine = { matches: !coarse };
  const style = () => ({ transform: '', opacity: '', setProperty(key: string, value: string) { (this as unknown as Record<string, string>)[key] = value; } });
  class Node extends EventTarget {
    dataset: Record<string, string> = {}; style = style(); parent: Node | null = null; children: Node[] = []; attributes = new Map<string, string>();
    ownerDocument!: Document; isConnected = true; tabIndex = 0; capture = new Set<number>();
    card?: Node; image?: Node; media?: Node;
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
      if (selector === 'img') return this.image ?? null;
      return null;
    }
    querySelectorAll() { return this.children; }
    closest() { return { dataset: { routePath: '/en/projects' } }; }
    getBoundingClientRect() { return { left: 0, top: 0, width: 1920, height: 1080 }; }
    hasPointerCapture(id: number) { return this.capture.has(id); }
    setPointerCapture(id: number) { this.capture.add(id); }
    releasePointerCapture(id: number) { this.capture.delete(id); this.dispatchEvent(new Event('lostpointercapture')); }
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
    innerWidth: 1920, innerHeight: 1080, navigator: {}, performance: { now: () => now },
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
    node.append(node.card); node.card.append(node.media); node.media.append(node.image); return node;
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
  expect(h.videos).toHaveLength(0); expect(h.original.every(node => node.tabIndex === 0)).toBe(true);
  expect(h.plane.children.slice(9).every(node => node.tabIndex === -1 && node.attributes.get('aria-hidden') === 'true')).toBe(true);
  const zoom = h.fire(h.viewport, 'wheel', { deltaMode: 0, deltaX: 0, deltaY: 120, ctrlKey: true }); expect(zoom.defaultPrevented).toBe(false);
  const wheel = h.fire(h.viewport, 'wheel', { deltaMode: 0, deltaX: 120, deltaY: 360, ctrlKey: false }); expect(wheel.defaultPrevented).toBe(true);
  await h.advance(4000); expect(h.frames.size).toBe(0); expect(h.maxFrames).toBe(1);
  h.stop(); expect(h.plane.children).toHaveLength(9); expect(h.frames.size + h.timers.size + h.subscribers.size).toBe(0); expect(h.root.dataset.gridEnhanced).toBeUndefined();
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
