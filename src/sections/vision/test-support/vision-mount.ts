import type { PracticeObjects } from "../1-opening/practice-objects";
import { installGlobals, loadIsolatedModule } from "../../services/test-support/isolated-module";
import { createRouteEntryCapture } from "../../services/test-support/route-entry-capture";

class FixtureStyle {
  setProperty(property: string, value: string) { Reflect.set(this, property, value); }
  removeProperty(property: string) { Reflect.deleteProperty(this, property); }
}
class FixtureElement extends EventTarget {
  dir = "ltr"; dataset: Record<string, string> = {}; style = new FixtureStyle();
  selections = new Map<string, FixtureElement | FixtureElement[]>();
  attributes = new Map<string, string>();
  rectangle = () => ({ left: 0, top: 0, width: 1920, height: 1080 });
  querySelector(selector: string) { const value = this.selections.get(selector); return Array.isArray(value) ? value[0] ?? null : value ?? null; }
  querySelectorAll(selector: string) { const value = this.selections.get(selector); return Array.isArray(value) ? value : value ? [value] : []; }
  closest() { return null; }
  getBoundingClientRect() { const rect = this.rectangle(); return { ...rect, right: rect.left + rect.width, bottom: rect.top + rect.height }; }
  getAttribute(key: string) { return this.attributes.get(key) ?? null; }
  setAttribute(key: string, value: string) { this.attributes.set(key, value); }
  removeAttribute(key: string) { this.attributes.delete(key); }
}
type FixtureOptions = { reduced?: boolean; managed?: boolean; holdObjectBoot?: boolean; initialScrollY?: number; heroTop?: number; physicalHeight?: number; drawFailureAt?: number };
const flush = async () => { for (let step = 0; step < 12; step++) await Promise.resolve(); };

/** Actual mountVision with inert passage, narrative, text and GPU adapters. */
export async function mountVisionFixture(options: FixtureOptions = {}) {
  const window = Object.assign(new EventTarget(), { innerWidth: 1920, innerHeight: options.physicalHeight ?? 1080, scrollY: options.initialScrollY ?? 0 });
  const fonts = Object.assign(new EventTarget(), { ready: Promise.resolve() });
  const document = Object.assign(new EventTarget(), { fonts, hidden: false });
  const motion = Object.assign(new EventTarget(), { matches: options.reduced ?? false });
  const root = new FixtureElement(), hero = new FixtureElement(), canvas = new FixtureElement(), perspective = new FixtureElement();
  root.dataset.locale = "en";
  hero.rectangle = () => ({ left: 0, top: (options.heroTop ?? 0) - window.scrollY, width: 1920, height: 1080 });
  const masks = ["hero-index", "hero-identity", "hero-title-0", "hero-title-1", "hero-copy", "hero-action"].map(id => {
    const element = new FixtureElement(); element.dataset.maskedReveal = id; return element;
  });
  hero.selections.set("canvas", canvas); hero.selections.set("[data-masked-reveal]", masks); hero.selections.set("[data-editorial-layer]", []);
  root.selections.set(".practice-opening", hero); root.selections.set('[data-visual-chapter="perspective"]', perspective);
  root.selections.set("[data-editorial-composition]", [hero]); root.selections.set("*", [hero, canvas, perspective, ...masks]);
  const route = createRouteEntryCapture("/en/vision", options.managed);
  const pending = new Map<number, FrameRequestCallback>(); let frameId = 0, time = 0, maxPending = 0;
  const requestFrame = (callback: FrameRequestCallback) => { const id = ++frameId; pending.set(id, callback); maxPending = Math.max(maxPending, pending.size); return id; };
  const observers: { disconnected: boolean }[] = [];
  class FixtureIntersectionObserver {
    disconnected = false;
    constructor() { observers.push(this); }
    observe() {}
    disconnect() { this.disconnected = true; }
  }
  let scrollCallback: (() => void) | undefined, managerRemoved = false, bootRequests = 0, bootSignal: AbortSignal | undefined, draws = 0, disposals = 0;
  let resolveObjects!: (renderer: PracticeObjects | null) => void, rejectObjects!: (reason: Error) => void;
  const boot = new Promise<PracticeObjects | null>((resolve, reject) => { resolveObjects = resolve; rejectObjects = reject; });
  const storeListeners = new Set<() => void>(), state = { menuOpen: false, quietMode: false };
  const reveals = new Map<FixtureElement, number>();
  const objects: PracticeObjects = {
    resize() { return 1080; },
    render() { draws++; if (draws === options.drawFailureAt) throw new Error("First static draw failed."); canvas.dataset.heroRendered = "true"; },
    dispose() { disposals++; },
  };
  const restoreGlobals = installGlobals({ window, document, innerWidth: window.innerWidth, innerHeight: window.innerHeight, scrollY: window.scrollY, matchMedia: () => motion, IntersectionObserver: FixtureIntersectionObserver, requestAnimationFrame: requestFrame, cancelAnimationFrame: (id: number) => pending.delete(id) });
  let dispose: (() => void) | undefined;
  try {
    const runtime = loadIsolatedModule<{ mountVision: (root: HTMLElement) => () => void }>("src/sections/vision/vision.animate.ts", {
      "@/lib/scrollInteraction/scrollManager": { createInstance: (_key: string, callback: () => void) => { scrollCallback = callback; }, removeInstance: () => { managerRemoved = true; scrollCallback = undefined; } },
      "@/store/uiStore": { uiStore: { getState: () => state, subscribe: (listener: () => void) => { storeListeners.add(listener); return () => storeListeners.delete(listener); } } },
      "@/lib/navigation/route-entry": route.module,
      "./2-perspective/system.animate": { createSystemPassage: () => ({ measure() {}, render() {}, editorialScroll: (_element: unknown, scroll: number) => scroll, dispose() {} }) },
      "./3-narrative/narrative.animate": { createVisionNarrative: () => ({ measure() {}, render() {}, dispose() {} }) },
      "./masked-reveal": { createMaskedReveal: (element: FixtureElement) => ({ set: (progress: number) => reveals.set(element, progress), measure() {}, dispose() {} }) },
      "./1-opening/practice-objects": { createPracticeObjects: (_canvas: unknown, _kind: unknown, signal: AbortSignal) => { bootRequests++; bootSignal = signal; return options.holdObjectBoot ? boot : Promise.resolve(objects); } },
    });
    dispose = runtime.mountVision(root as unknown as HTMLElement); await flush();
  } catch (error) { dispose?.(); restoreGlobals(); throw error; }
  let stopped = false;
  return {
    root, hero, canvas, route, flush,
    stats: () => ({ queued: pending.size, maxPending, bootRequests, bootAborted: bootSignal?.aborted ?? false, draws, disposals, managerRemoved, subscribers: storeListeners.size, observersDisconnected: observers.every(observer => observer.disconnected), lastHeroAction: reveals.get(masks.at(-1)!) }),
    frame() { const callbacks = [...pending.values()]; pending.clear(); time += 1000 / 60; callbacks.forEach(callback => callback(time)); },
    async resolveBoot(result: "renderer" | "null" = "renderer") { resolveObjects(result === "null" ? null : objects); await flush(); },
    async rejectBoot() { rejectObjects(new Error("Renderer boot rejected.")); await flush(); },
    scrollTo(y: number) { window.scrollY = y; Reflect.set(globalThis, "scrollY", y); scrollCallback?.(); },
    stop() { if (!stopped) { stopped = true; dispose?.(); } },
    restore() { if (!stopped) { stopped = true; dispose?.(); } restoreGlobals(); },
  };
}
