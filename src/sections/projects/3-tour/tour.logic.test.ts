import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { createRouteEntryRegistry } from '@/lib/navigation/route-entry';
import { designScale, viewportDesign } from '@/lib/viewport-design';

class ElementFixture extends EventTarget {
  dataset: Record<string, string> = {};
  disabled = true; hidden = false; textContent = ''; focused = false; removed = false;
  children: ElementFixture[] = []; clientWidth = 1200; clientHeight = 700;
  append(child: ElementFixture) { this.children.push(child); }
  remove() { this.removed = true; }
  focus() { this.focused = true; }
  setAttribute() {}
  toggleAttribute(name: string, force: boolean) { this.dataset[name] = String(force); }
}
function harness() {
  const root = new ElementFixture(), launch = new ElementFixture(), close = new ElementFixture(), mount = new ElementFixture(), status = new ElementFixture(), enter = new ElementFixture(), retry = new ElementFixture(), heading = new ElementFixture();
  root.dataset = { tourSrc: '/viewer/index.html', tourLoading: 'Loading', tourFailed: 'Failed' }; heading.textContent = '360° Tour';
  const nodes: Record<string, ElementFixture | null> = { '[data-tour-launch]': launch, '[data-tour-close]': close, '[data-tour-mount]': mount, '[data-tour-status]': status, '[data-tour-enter]': enter, '[data-tour-retry]': retry, h1: heading, 'details[open]': null };
  const timers = new Map<number, () => void>(), intervals = new Map<number, () => void>(); let serial = 0, subscribed = () => {}, intersect: (visible: boolean) => void = () => {};
  const media = Object.assign(new EventTarget(), { matches: false });
  const win = Object.assign(new EventTarget(), { innerWidth: 1920, matchMedia: () => media, setTimeout(callback: () => void) { timers.set(++serial, callback); return serial; }, clearTimeout(id: number) { timers.delete(id); }, setInterval(callback: () => void) { intervals.set(++serial, callback); return serial; }, clearInterval(id: number) { intervals.delete(id); } });
  const frames: (ElementFixture & { contentWindow: unknown; contentDocument: EventTarget & { fullscreenElement: object | null } })[] = [];
  let loaded = false, stopped = 0, started = 0; const locks: boolean[] = [], interactions: boolean[] = [];
  const pano = { getIsLoaded: () => loaded, getIsTileLoading: () => false, setLocked: (v: boolean) => locks.push(v), startAutorotate() { started++; }, stopAutorotate() { stopped++; }, setViewerSize() {}, requestRedraw() {} };
  const doc = Object.assign(new EventTarget(), { defaultView: win, hidden: false, fullscreenElement: null, createElement() {
    const frame = Object.assign(new ElementFixture(), { contentWindow: { pano, tourNavigation: { setInteractionEnabled: (v: boolean) => interactions.push(v), setPreloadEnabled() {} } }, contentDocument: Object.assign(new EventTarget(), { fullscreenElement: null, querySelectorAll: () => [] }) }); frames.push(frame); return frame;
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
  return { root, launch, close, status, retry, frames, timers, intervals, state, doc, media, locks, interactions, registry, cleanup,
    get rotations() { return { stopped, started }; },
    start() { launch.dispatchEvent(new Event('click')); },
    ready() { loaded = true; frames.at(-1)!.dispatchEvent(new Event('load')); },
    menu(value: boolean) { state.menuOpen = value; subscribed(); },
    intersect,
  };
}

test('a tour route becomes ready from server content without allocating its heavy viewer', () => {
  const h = harness(); expect(h.registry.ready(h.root as unknown as HTMLElement)).toBe(true);
  expect(h.frames).toHaveLength(0); expect(h.launch.disabled).toBe(false); h.cleanup();
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
