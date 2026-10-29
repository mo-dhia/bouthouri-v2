import type { PracticeObjects } from "../../vision/1-opening/practice-objects";
import { installGlobals, loadIsolatedModule } from "./isolated-module";
import { createRouteEntryCapture } from "./route-entry-capture";

class FixtureStyle {
  height = ""; transform = ""; fontSize = ""; clipPath = ""; opacity = "";
  setProperty(property: string, value: string) { Reflect.set(this, property, value); }
  removeProperty(property: string) { Reflect.deleteProperty(this, property); }
}

class FixtureElement extends EventTarget {
  dataset: Record<string, string> = {};
  style = new FixtureStyle();
  hidden = false; disabled = false; textContent = ""; offsetHeight = 0;
  attributes = new Map<string, string>();
  selections = new Map<string, FixtureElement | FixtureElement[]>();
  rectangle = () => ({ left: 0, top: 0, width: 1920, height: 1080 });
  onAppend = () => {};
  querySelector(selector: string): FixtureElement | null { const value = this.selections.get(selector); return Array.isArray(value) ? value[0] ?? null : value ?? null; }
  querySelectorAll(selector: string): FixtureElement[] { const value = this.selections.get(selector); return Array.isArray(value) ? value : value ? [value] : []; }
  closest() { return null; }
  getBoundingClientRect() { const rect = this.rectangle(); return { ...rect, right: rect.left + rect.width, bottom: rect.top + rect.height }; }
  setAttribute(key: string, value: string) { this.attributes.set(key, value); if (key.startsWith("data-")) this.dataset[key.slice(5).replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())] = value; }
  removeAttribute(key: string) { this.attributes.delete(key); }
  getAttribute(key: string) { return this.attributes.get(key) ?? null; }
  appendChild() { this.onAppend(); }
  remove() {}
  getComputedTextLength() { return 1800; }
  hasPointerCapture() { return false; }
  releasePointerCapture() {}
}

class FixtureWindow extends EventTarget {
  innerWidth = 1920; innerHeight = 1080; scrollY = 0;
  scrollTo({ top }: { top: number }) { this.scrollY = top; }
}

class FixtureCustomEvent extends Event {
  detail: unknown;
  constructor(type: string, options: { detail: unknown }) { super(type); this.detail = options.detail; }
}

type FailureOptions = { importFailure?: boolean; createFailure?: boolean; nullRenderer?: boolean; drawFailureAt?: number; resizeFailureAt?: number; disposalFailure?: boolean; reduced?: boolean; managed?: boolean; holdObjectImport?: boolean; holdObjectBoot?: boolean; initialScrollY?: number; heroTop?: number; physicalHeight?: number };
const flush = async () => { for (let step = 0; step < 12; step++) await Promise.resolve(); };

/** Real mountServices + real opening measure/tick/physics/hand; inert text/GPU adapters. */
export async function mountServicesFixture(failures: FailureOptions = {}) {
  const window = new FixtureWindow(), fonts = Object.assign(new EventTarget(), { ready: Promise.resolve() });
  window.scrollY = failures.initialScrollY ?? 0; window.innerHeight = failures.physicalHeight ?? 1080;
  const document = Object.assign(new EventTarget(), { hidden: false, fonts, createElement: () => new FixtureElement() });
  const root = new FixtureElement(), hero = new FixtureElement(), canvas = new FixtureElement(), geometry = new FixtureElement(), advance = new FixtureElement();
  root.dataset.locale = "en";
  const opening = new FixtureElement(), stage = new FixtureElement(), intro = new FixtureElement(), glyph = new FixtureElement(), flight = new FixtureElement(), scene = new FixtureElement(), band = new FixtureElement(), handle = new FixtureElement(), announcement = new FixtureElement();
  opening.offsetHeight = 4212;
  hero.rectangle = () => ({ left: 0, top: (failures.heroTop ?? 0) - window.scrollY, width: 1920, height: 1080 });
  opening.rectangle = () => ({ left: 0, top: 1080 - window.scrollY, width: 1920, height: 4212 });
  stage.rectangle = () => ({ left: 0, top: Math.min(Math.max(1080 - window.scrollY, 0), 4212 - window.scrollY), width: 1920, height: 1080 });
  glyph.rectangle = () => ({ left: 450, top: stage.getBoundingClientRect().top + 350, width: 80, height: 160 });
  let measurements = 0; glyph.onAppend = () => { measurements++; };
  const masks = (ids: string[]) => ids.map((id) => { const element = new FixtureElement(); element.dataset.maskedReveal = id; return element; });
  hero.selections.set("[data-masked-reveal]", masks(["hero-index", "hero-title-0", "hero-title-1", "hero-copy", "hero-action"]));
  opening.selections.set("[data-masked-reveal]", masks(["service-label", "service-title", "service-second", "service-copy", "service-payoff"]));
  hero.selections.set("canvas", canvas); hero.selections.set(".practice-hero-geometry", geometry); hero.selections.set("[data-editorial-layer]", []);
  root.selections.set(".practice-opening", hero); root.selections.set("[data-services-opening]", opening); root.selections.set("[data-services-advance]", advance); root.selections.set("[data-editorial-composition]", [hero]);
  for (const [selector, element] of [[".services-opening-stage", stage], [".services-intro", intro], ["[data-rail-glyph]", glyph], [".services-glyph-flight", flight], [".services-gate-scene", scene]] as const) opening.selections.set(selector, element);
  for (const selector of ["[data-flying-glyph]", "[data-band-clip]"]) flight.selections.set(selector, new FixtureElement());
  flight.selections.set("[data-band-type]", band);
  const surface = new FixtureElement();
  for (const selector of ["[data-gate-top]", "[data-gate-top-edge]", "[data-gate-seam]", "#gate-edge"]) surface.selections.set(selector, new FixtureElement());
  scene.selections.set("svg", surface); scene.selections.set(".services-gate-handle", handle); scene.selections.set("[data-gate-announcement]", announcement);
  for (const selector of [".services-gate-payoff", ".services-it-works", ".services-gate-underlay", "[data-drawn-hand]", "[data-grip-contact]", "[data-gate-trajectory]", ".services-grip-annotation"]) scene.selections.set(selector, new FixtureElement());
  announcement.dataset.message = "The surface is open.";
  const route = createRouteEntryCapture("/en/services", failures.managed);

  const pending = new Map<number, FrameRequestCallback>(); let id = 0, time = 0, running = false, scheduledInsideFrame = 0, maxPending = 0;
  const requestFrame = (callback: FrameRequestCallback) => { const key = ++id; pending.set(key, callback); if (running) scheduledInsideFrame++; maxPending = Math.max(maxPending, pending.size); return key; };
  const cancelFrame = (key: number) => pending.delete(key);
  const observers: { disconnected: boolean }[] = [];
  class FixtureResizeObserver {
    disconnected = false;
    constructor() { observers.push(this); }
    observe() {}
    disconnect() { this.disconnected = true; }
  }
  let scrollCallback: (() => void) | null = null, managerRemoved = false, draws = 0, resizes = 0, disposals = 0, indexTicks = 0, importRequests = 0, bootRequests = 0, bootSignal: AbortSignal | undefined;
  let resolveObjects!: (renderer: PracticeObjects | null) => void, rejectObjects!: (reason: Error) => void;
  const boot = new Promise<PracticeObjects | null>((resolve, reject) => { resolveObjects = resolve; rejectObjects = reject; });
  const storeListeners = new Set<() => void>(), state = { menuOpen: false };
  const reveals = new Map<FixtureElement, number>();
  const objects: PracticeObjects = {
    resize() { resizes++; if (resizes === failures.resizeFailureAt) throw new Error("Resize failed."); return 1080; },
    render() { draws++; if (draws === failures.drawFailureAt) throw new Error("The editorial WebGL context was lost."); canvas.dataset.heroRendered = "true"; },
    dispose() { disposals++; if (failures.disposalFailure) throw new Error("GPU teardown failed."); },
  };
  const objectModule = { createPracticeObjects: (_canvas: unknown, _kind: unknown, signal: AbortSignal) => { bootRequests++; bootSignal = signal; return failures.createFailure ? Promise.reject(new Error("Renderer creation failed.")) : failures.holdObjectBoot ? boot : Promise.resolve(failures.nullRenderer ? null : objects); } };
  let resolveObjectImport!: (module: typeof objectModule) => void;
  // The isolated evaluator lowers import() to a promise of require(). Preserve
  // that promise through __importStar so the module itself can arrive late.
  const objectImport = Object.assign(new Promise<typeof objectModule>((resolve) => { resolveObjectImport = resolve; }), { __esModule: true });
  const restoreGlobals = installGlobals({ window, document, ResizeObserver: FixtureResizeObserver, CustomEvent: FixtureCustomEvent, requestAnimationFrame: requestFrame, cancelAnimationFrame: cancelFrame, getComputedStyle: (element: FixtureElement) => ({ fontSize: element === band ? "80px" : "150px" }) });
  let dispose: (() => void) | undefined;
  try {
    const substitutes: Record<string, unknown> = {
      "@/lib/scrollInteraction/scrollManager": { createInstance: (_key: string, callback: () => void) => { scrollCallback = callback; }, removeInstance: () => { managerRemoved = true; scrollCallback = null; } },
      "@/store/uiStore": { uiStore: { getState: () => state, subscribe: (listener: () => void) => { storeListeners.add(listener); return () => storeListeners.delete(listener); } } },
      "@/lib/navigation/route-entry": route.module,
      "./masked-reveal": { createMaskedReveal: (element: FixtureElement) => ({ set: (progress: number) => reveals.set(element, progress), measure() {}, dispose() {} }) },
      "../masked-reveal": { createMaskedReveal: (element: FixtureElement) => ({ set: (progress: number) => reveals.set(element, progress), measure() {}, dispose() {} }) },
      "./3-index/service-index.animate": { createServiceIndex: () => ({ measure() {}, tick() { indexTicks++; }, dispose() {} }) },
    };
    Object.defineProperty(substitutes, "../vision/1-opening/practice-objects", { get() { importRequests++; if (failures.importFailure) throw new Error("Enhancement chunk unavailable."); return failures.holdObjectImport ? objectImport : objectModule; } });
    const runtime = loadIsolatedModule<{ mountServices: (root: HTMLElement, reduced: boolean) => () => void }>("src/sections/services/services.animate.ts", substitutes);
    dispose = runtime.mountServices(root as unknown as HTMLElement, failures.reduced ?? false);
    await flush();
  } catch (error) { dispose?.(); restoreGlobals(); throw error; }
  let stopped = false;
  return {
    root, hero, opening, handle, announcement, canvas, fonts, route, flush,
    stats: () => ({ queued: pending.size, maxPending, scheduledInsideFrame, measurements, draws, resizes, disposals, indexTicks, importRequests, bootRequests, bootAborted: bootSignal?.aborted ?? false, managerRemoved, subscribers: storeListeners.size, observersDisconnected: observers.every((observer) => observer.disconnected), lastHeroAction: reveals.get(hero.querySelectorAll("[data-masked-reveal]").at(-1)!) }),
    frame() { const callbacks = [...pending.values()]; pending.clear(); time += 1000 / 60; running = true; try { callbacks.forEach((callback) => callback(time)); } finally { running = false; } },
    async resolveBoot(result: "renderer" | "null" = "renderer") { resolveObjects(result === "null" ? null : objects); await flush(); },
    async resolveImport() { resolveObjectImport(objectModule); await flush(); },
    async rejectBoot() { rejectObjects(new Error("Renderer boot rejected.")); await flush(); },
    resize() { window.dispatchEvent(new Event("resize")); },
    fontRefresh() { fonts.dispatchEvent(new Event("loadingdone")); },
    scrollTo(y: number) { window.scrollY = y; scrollCallback?.(); },
    press(key: string) { handle.dispatchEvent(Object.assign(new Event("keydown", { cancelable: true }), { key })); },
    menu(open: boolean) { state.menuOpen = open; storeListeners.forEach((listener) => listener()); },
    stop() { if (!stopped) { stopped = true; dispose?.(); } },
    restore() { if (!stopped) { stopped = true; dispose?.(); } restoreGlobals(); },
  };
}
