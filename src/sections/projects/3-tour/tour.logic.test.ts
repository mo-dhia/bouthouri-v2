import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { createRouteEntryRegistry } from '@/lib/navigation/route-entry';
import { designScale, viewportDesign } from '@/lib/viewport-design';

class ElementFixture extends EventTarget {
  dataset: Record<string, string> = {};
  disabled = true; hidden = false; textContent = ''; focused = false; removed = false;
  children: ElementFixture[] = []; clientWidth = 1200; clientHeight = 700;
  attributes = new Map<string, string>(); inert = true;
  append(child: ElementFixture) { this.children.push(child); }
  remove() { this.removed = true; }
  focus() { this.focused = true; }
  setAttribute(name: string, value: string) { this.attributes.set(name, value); }
  removeAttribute(name: string) { this.attributes.delete(name); }
  toggleAttribute(name: string, force: boolean) { this.dataset[name] = String(force); }
}
function harness() {
  const root = new ElementFixture(), launch = new ElementFixture(), close = new ElementFixture(), mount = new ElementFixture(), status = new ElementFixture(), enter = new ElementFixture(), retry = new ElementFixture(), heading = new ElementFixture();
  root.dataset = { tourSrc: '/viewer/index.html', tourLoading: 'Loading', tourFailed: 'Failed' }; heading.textContent = '360° Tour';
  const nodes: Record<string, ElementFixture | null> = { '[data-tour-launch]': launch, '[data-tour-close]': close, '[data-tour-mount]': mount, '[data-tour-status]': status, '[data-tour-enter]': enter, '[data-tour-retry]': retry, h1: heading, 'details[open]': null };
  const timers = new Map<number, () => void>(), intervals = new Map<number, () => void>(), delays = new Map<number, number>(); let now = 0, serial = 0, subscribed = () => {}, intersect: (visible: boolean) => void = () => {};
  const media = Object.assign(new EventTarget(), { matches: false });
  const win = Object.assign(new EventTarget(), { innerWidth: 1920, performance: { now: () => now }, matchMedia: () => media, setTimeout(callback: () => void, delay: number) { timers.set(++serial, callback); delays.set(serial, delay); return serial; }, clearTimeout(id: number) { timers.delete(id); delays.delete(id); }, setInterval(callback: () => void) { intervals.set(++serial, callback); return serial; }, clearInterval(id: number) { intervals.delete(id); } });
  const frames: (ElementFixture & { contentWindow: unknown; contentDocument: EventTarget & { fullscreenElement: object | null } })[] = [];
  let loaded = false, stopped = 0, started = 0, loadFailed = false; const locks: boolean[] = [], interactions: boolean[] = [], suspensions: boolean[] = [];
  const listeners = new Map<string, Set<() => void>>(), panSteps: number[] = [];
  const pano = { setLocked: (v: boolean) => locks.push(v), startAutorotate() { started++; }, stopAutorotate() { stopped++; }, setViewerSize() {}, requestRedraw() {},
    changePan(degrees: number) { panSteps.push(degrees); }, changeTilt() {},
    addListener(event: string, callback: () => void) { const group = listeners.get(event) ?? new Set(); group.add(callback); listeners.set(event, group); },
    removeEventListener(event: string, callback: () => void) { listeners.get(event)?.delete(callback); }
  };
  const doc = Object.assign(new EventTarget(), { defaultView: win, hidden: false, fullscreenElement: null, createElement() {
    const frame = Object.assign(new ElementFixture(), { contentWindow: { pano, tourLifecycle: { setSuspended: (v: boolean) => suspensions.push(v), getLoadState: () => loadFailed ? 'failed' : loaded ? 'ready' : 'loading' }, tourNavigation: { setInteractionEnabled: (v: boolean) => interactions.push(v), setPreloadEnabled() {} } }, contentDocument: Object.assign(new EventTarget(), { fullscreenElement: null, querySelectorAll: () => [] }) }); frames.push(frame); return frame;
  } });
  Object.assign(root, { ownerDocument: doc, querySelector: (selector: string) => nodes[selector] });
  const state = { quietMode: false, menuOpen: false }, registry = createRouteEntryRegistry<HTMLElement>();
  const code = ts.transpileModule(readFileSync(new URL('./tour.logic.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const evaluated = { exports: {} as typeof import('./tour.logic') };
  const requireModule = (id: string) => {
    if (id === '@/lib/navigation/route-entry') return { routeEntries: () => registry, pageEntryPath: () => '/en/projects/360-tour' };
    if (id === '@/lib/viewport-design') return { designScale, viewportDesign };
    if (id === '@/store/uiStore') return { uiStore: { getState: () => state, subscribe(fn: () => void) { subscribed = fn; return () => { subscribed = () => {}; }; } } };
    throw new Error(`Unexpected dependency: ${id}`);
  };
  const Observer = class { constructor(callback: (entries: { isIntersecting: boolean }[]) => void) { intersect = value => callback([{ isIntersecting: value }]); } observe() {} disconnect() {} };
  new Function('require', 'module', 'exports', 'IntersectionObserver', code)(requireModule, evaluated, evaluated.exports, Observer);
  const cleanup = evaluated.exports.mountTour(root as unknown as HTMLElement);
  return { root, launch, close, mount, status, retry, frames, timers, intervals, state, doc, media, locks, interactions, suspensions, registry, cleanup, listeners, panSteps, delays,
    get rotations() { return { stopped, started }; },
    start() { launch.dispatchEvent(new Event('click')); },
    ready() { loaded = true; frames.at(-1)!.dispatchEvent(new Event('load')); },
    loading() { loaded = false; frames.at(-1)!.dispatchEvent(new Event('load')); },
    event(name: string) { for (const listener of [...listeners.get(name) ?? []]) listener(); },
    failLoad() { loadFailed = true; },
    advance(ms: number) { now += ms; },
    menu(value: boolean) { state.menuOpen = value; subscribed(); },
    intersect,
  };
}

test('a tour route becomes ready from server content without allocating its heavy viewer', () => {
  const h = harness(); expect(h.registry.ready(h.root as unknown as HTMLElement)).toBe(true);
  expect(h.frames).toHaveLength(0); expect(h.launch.disabled).toBe(false); h.cleanup();
});
test('the loading browsing context is excluded from focus until readiness and closing parks it again', () => {
  const h = harness(); h.start();
  expect(h.mount.inert).toBe(true); expect((h.frames[0] as unknown as HTMLIFrameElement).tabIndex).toBe(-1);
  h.ready(); expect(h.mount.inert).toBe(false); expect((h.frames[0] as unknown as HTMLIFrameElement).tabIndex).toBe(0);
  h.close.dispatchEvent(new Event('click')); expect(h.mount.inert).toBe(true); expect(h.mount.attributes.get('aria-hidden')).toBe('true'); h.cleanup();
});
test('closing a loading tour clears polling and removes its browsing context; stale errors cannot remove a retry', () => {
  const h = harness(); h.start(); const old = h.frames[0];
  h.close.dispatchEvent(new Event('click')); expect(old.removed).toBe(true); expect(h.timers.size + h.intervals.size).toBe(0);
  h.start(); old.dispatchEvent(new Event('error')); expect(h.frames[1].removed).toBe(false);
  h.ready(); expect(h.root.dataset.tourState).toBe('live'); expect(h.timers.size + h.intervals.size).toBe(0); h.cleanup();
});
test('a failed boot restores the poster and retry; teardown cancels every timer', () => {
  const h = harness(); h.start(); [...h.timers.values()][0]();
  expect(h.root.dataset.tourState).toBe('failed'); expect(h.status.textContent).toBe('Failed');
  expect(h.frames[0].removed).toBe(true); expect(h.launch.disabled).toBe(false); expect(h.retry.hidden).toBe(false);
  h.start(); h.cleanup(); expect(h.frames[1].removed).toBe(true); expect(h.timers.size + h.intervals.size).toBe(0);
});
test('every room change owns a new watchdog and tile failure restores the retry immediately', () => {
  const h = harness(); h.start(); h.ready(); expect(h.root.dataset.tourPresented).toBe('true');
  h.loading(); h.event('beforechangenode'); expect(h.root.dataset.tourState).toBe('loading'); expect(h.timers.size).toBe(1);
  h.failLoad(); h.event('tourloaderror'); expect(h.root.dataset.tourState).toBe('failed');
  expect(h.frames[0].removed).toBe(true); expect(h.timers.size + h.intervals.size).toBe(0);
  expect(h.root.dataset.tourPresented).toBeUndefined(); expect([...h.listeners.values()].every(group => group.size === 0)).toBe(true); h.cleanup();
});
test('loading already applies suspension and input policy before decoded readiness', () => {
  const h = harness(); h.start(); h.loading(); h.menu(true);
  expect(h.mount.inert).toBe(true); expect(h.suspensions.at(-1)).toBe(true); expect(h.interactions.at(-1)).toBe(false);
  h.ready(); expect(h.frames[0].focused).toBe(false); h.cleanup();
});
test('intentional parking pauses polling and preserves the remaining active loading budget', () => {
  const h = harness(); h.start(); h.loading(); h.advance(12000); h.menu(true);
  expect(h.timers.size + h.intervals.size).toBe(0); h.advance(60000); h.menu(false);
  expect([...h.delays.values()]).toEqual([33000]); expect(h.intervals.size).toBe(1); expect(h.root.dataset.tourState).toBe('loading'); h.cleanup();
});
test('menu and hidden-tab suspension disable navigation and rotation; reduced motion keeps manual interaction', () => {
  const h = harness(); h.start(); h.ready();
  h.menu(true); expect(h.locks.at(-1)).toBe(true); expect(h.interactions.at(-1)).toBe(false);
  h.menu(false); expect(h.locks.at(-1)).toBe(false);
  h.doc.hidden = true; h.doc.dispatchEvent(new Event('visibilitychange')); expect(h.locks.at(-1)).toBe(true);
  h.doc.hidden = false; h.media.matches = true; h.doc.dispatchEvent(new Event('visibilitychange'));
  expect(h.locks.at(-1)).toBe(false); expect(h.interactions.at(-1)).toBe(true); expect(h.rotations.stopped).toBeGreaterThan(0); h.cleanup();
});

test('context loss after readiness releases the viewer and restores a usable retry', () => {
  const h = harness(); h.start(); h.ready();
  h.frames[0].contentDocument.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
  expect(h.root.dataset.tourState).toBe('failed'); expect(h.frames[0].removed).toBe(true); expect(h.launch.disabled).toBe(false); h.cleanup();
});

test('native focus and activation bypass player cancellation; arrow taps and repeats turn the camera', () => {
  const h = harness(); h.start(); h.ready(); const doc = h.frames[0].contentDocument;
  let playerKeys = 0, clicks = 0;
  const control = { closest: () => control, classList: { contains: () => false }, click() { clicks++; } };
  const player = (event: Event) => { playerKeys++; event.preventDefault(); };
  doc.addEventListener('keydown', player); doc.addEventListener('keyup', player);
  const key = (type: string, value: string, repeat = false) => {
    const event = Object.assign(new Event(type, { cancelable: true }), { key: value, repeat });
    Object.defineProperty(event, 'target', { value: control }); doc.dispatchEvent(event); return event;
  };
  for (const type of ['keydown', 'keyup']) {
    expect(key(type, 'Tab').defaultPrevented).toBe(false);
    expect(key(type, ' ').defaultPrevented).toBe(false);
    expect(key(type, 'Enter').defaultPrevented).toBe(false);
  }
  expect(playerKeys).toBe(0); expect(clicks).toBe(0);
  expect(key('keydown', 'ArrowLeft').defaultPrevented).toBe(true); key('keydown', 'ArrowLeft', true); key('keyup', 'ArrowLeft');
  expect(playerKeys).toBe(0); expect(h.panSteps).toEqual([5, 5]);
  control.classList.contains = () => true;
  expect(key('keydown', 'Tab').defaultPrevented).toBe(false); expect(key('keyup', 'Tab').defaultPrevented).toBe(false);
  expect(key('keydown', ' ').defaultPrevented).toBe(true); key('keydown', ' ', true); key('keyup', ' ');
  expect(clicks).toBe(1); expect(playerKeys).toBe(0); h.cleanup();
});
