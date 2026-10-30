import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import ts from "typescript";
import { brand } from "@/config/brand";
import * as viewport from "@/lib/viewport-design";
import { standardFooterPose } from "./standard-footer-pose";

class Surface extends EventTarget {
  dataset: Record<string, string> = {};
  attributes = new Map<string, string>();
  style: Record<string, unknown> = {};
  classList = { contains: () => false };
  inert = false;
  lang = "en";
  textContent = "";
  dateTime = "";
  offsetHeight = 100;
  rect = { x: 0, y: 0, top: 0, left: 0, width: 600, height: 100, bottom: 100, right: 600 };
  afterNodes: Surface[] = [];
  parentElement: Surface | null = null;
  after(child: Surface) { this.afterNodes.push(child); }
  setAttribute(name: string, value: string) { this.attributes.set(name, value); }
  getAttribute(name: string) { return this.attributes.get(name) ?? null; }
  removeAttribute(name: string) { this.attributes.delete(name); }
  getBoundingClientRect() { return this.rect; }
  querySelector(selector: string): Surface | null { void selector; return null; }
  closest(selector: string): Surface | null { void selector; return null; }
}

function load(file: string, globals: Record<string, unknown>, dependencies: Record<string, unknown>) {
  const source = readFileSync(new URL(file, import.meta.url), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true,
  } }).outputText;
  const evaluated = { exports: {} as Record<string, (...args: never[]) => unknown> };
  const context = createContext(globals);
  runInContext(`(function(require,module,exports){${js}\n})`, context)((name: string) => {
    if (!(name in dependencies)) throw new Error(`Unexpected footer dependency: ${name}`);
    return dependencies[name];
  }, evaluated, evaluated.exports);
  return evaluated.exports;
}

function harness(variant = "home") {
  const root = new Surface(), mask = new Surface(), word = new Surface(), svg = new Surface(), clock = new Surface(), stage = new Surface(), information = new Surface(), colophon = new Surface();
  root.dataset.footerVariant = variant;
  root.querySelector = (selector) => selector.includes("grab") ? mask : selector.includes("clock") ? clock : selector.includes("word") ? word : selector === ".footer-information" ? information : selector === ".footer-colophon" ? colophon : null;
  word.querySelector = (selector) => selector.includes("svg") ? svg : null;
  root.closest = () => stage;
  const document = Object.assign(new EventTarget(), { hidden: false, fonts: { ready: Promise.resolve() } });
  const window = new EventTarget();
  const motion = Object.assign(new EventTarget(), { matches: false });
  let now = Date.UTC(2026, 9, 27, 14, 16, 20, 588), serial = 0;
  const timers = new Map<number, { at: number; callback: () => void }>();
  const subscribers = new Set<() => void>();
  const state = { quietMode: false, homeSceneFailed: false, menuOpen: false };
  let intersect: (entries: { isIntersecting: boolean }[]) => void = () => {};
  let active = false, mounts = 0, disposals = 0, wordMeasures = 0;
  let resizeCallback: (entries: { target: Surface }[]) => void = () => {};
  const resizeTargets = new Set<Surface>();
  class ClockDate extends Date {
    constructor() { super(now); }
    static now() { return now; }
  }
  const globals = {
    document, window, Date: ClockDate, Intl,
    matchMedia: () => motion,
    innerWidth: 1200, innerHeight: 800, scrollY: 0,
    setTimeout: (callback: () => void, delay: number) => { const id = ++serial; timers.set(id, { at: now + delay, callback }); return id; },
    clearTimeout: (id: number) => timers.delete(id),
    IntersectionObserver: class {
      constructor(callback: typeof intersect) { intersect = callback; }
      observe() {} disconnect() {}
    },
    ResizeObserver: class { constructor(callback: typeof resizeCallback) { resizeCallback = callback; } observe(target: Surface) { resizeTargets.add(target); } disconnect() { resizeTargets.clear(); } },
  };
  const dependencies = {
    "@/config/brand": { brand },
    "@/lib/viewport-design": viewport,
    "./standard-footer-pose": { standardFooterPose },
    "@/lib/scrollInteraction/scrollManager": { __esModule: true, default: { createInstance() {}, removeInstance() {} } },
    "@/store/uiStore": { uiStore: { getState: () => state, subscribe: (callback: () => void) => { subscribers.add(callback); return () => subscribers.delete(callback); } } },
    "./footer-geometry": { measureFooterWord() { wordMeasures++; } },
    "./footer.animate": { mountFooterMark() {
      mounts++;
      return { setActive(value: boolean) { active = value; }, dispose() { disposals++; } };
    } },
  };
  const mount = load("./footer.logic.ts", globals, dependencies).mountFooterInteractions as unknown as (root: Surface) => () => void;
  return {
    root, mask, word, svg, clock, stage, information, colophon, resizeTargets, document, window, motion, globals, timers,
    mount: () => mount(root),
    maskResize() { resizeCallback([{ target: mask }]); },
    layoutResize(target: Surface) { resizeCallback([{ target }]); },
    get measurements() { return { word: wordMeasures }; },
    frame(time: number) { stage.dispatchEvent(new CustomEvent("journey-frame", { detail: { time } })); },
    intersect(value: boolean) { intersect([{ isIntersecting: value }]); },
    mode(change: Partial<typeof state>) { Object.assign(state, change); subscribers.forEach((callback) => callback()); },
    advance(ms: number) {
      const end = now + ms;
      while (true) {
        const next = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
        if (!next || next[1].at > end) break;
        timers.delete(next[0]); now = next[1].at; next[1].callback();
      }
      now = end;
    },
    expectedTime: () => new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Tunis", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(now)),
    iso: () => new Date(now).toISOString(),
    get active() { return active; },
    get mounts() { return mounts; },
    get disposals() { return disposals; },
    get subscribers() { return subscribers.size; },
  };
}

const flushImports = async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); };

test("Tunis clock stays current when a pinned work visit becomes an already-intersecting reading footer", async () => {
  const h = harness(), dispose = h.mount();
  h.intersect(true); h.frame(714); await flushImports();
  h.frame(345.63); // The IO remains true; there will be no new crossing callback.
  h.advance(5 * 60000 + 5893);
  h.mode({ quietMode: true });
  expect(h.clock.textContent).toBe(h.expectedTime());
  expect(h.clock.dateTime).toBe(h.iso());
  expect(h.active).toBe(false);
  expect(h.mounts).toBe(1);
  expect(h.timers.size).toBe(1);
  dispose(); expect(h.timers.size).toBe(0); expect(h.disposals).toBe(1);
});

test("clock updates at source minute boundaries, pauses only for a hidden document and cleans up", () => {
  const h = harness(), dispose = h.mount();
  expect(h.clock.textContent).toBe(h.expectedTime());
  h.advance(39432); // 14:17:00.020Z, the source's minute +20ms boundary.
  expect(h.clock.dateTime).toBe("2026-10-27T14:17:00.020Z");
  h.document.hidden = true; h.document.dispatchEvent(new Event("visibilitychange"));
  const previous = h.clock.textContent;
  h.advance(8 * 60000); expect(h.clock.textContent).toBe(previous); expect(h.timers.size).toBe(0);
  h.document.hidden = false; h.document.dispatchEvent(new Event("visibilitychange"));
  expect(h.clock.textContent).toBe(h.expectedTime());
  expect(h.clock.dateTime).toBe(h.iso());
  dispose(); expect(h.subscribers).toBe(0); expect(h.timers.size).toBe(0);
  h.motion.matches = true; h.motion.dispatchEvent(new Event("change")); expect(h.timers.size).toBe(0);
});

test("HOME reading disables mark eligibility while a standard reduced footer retains its reveal", async () => {
  for (const variant of ["home", "standard"]) {
    const h = harness(variant), dispose = h.mount();
    h.intersect(true); h.frame(714); await flushImports(); expect(h.active).toBe(true);
    h.mode({ quietMode: true }); expect(h.active).toBe(variant === "standard");
    h.mode({ quietMode: false }); expect(h.active).toBe(true);
    h.motion.matches = true; h.motion.dispatchEvent(new Event("change"));
    expect(h.active).toBe(variant === "standard");
    h.motion.matches = false; h.motion.dispatchEvent(new Event("change"));
    // The open menu covers the footer; the word waits instead of eating behind it.
    h.mode({ menuOpen: true }); expect(h.active).toBe(false);
    h.mode({ menuOpen: false }); expect(h.active).toBe(true);
    h.mode({ homeSceneFailed: true }); expect(h.active).toBe(variant === "standard");
    dispose();
  }
});

test("the mark controller loads once, on intent or visibility, and dispose restores the server word", async () => {
  const h = harness();
  h.word.setAttribute("style", "color: red"); h.svg.setAttribute("style", "height: 10vw");
  const dispose = h.mount(); await flushImports();
  expect(h.mounts).toBe(0); // Off-screen: the copy is server HTML, nothing loads.
  h.mask.dispatchEvent(new Event("pointerenter")); h.mask.dispatchEvent(new Event("focus")); await flushImports();
  expect(h.mounts).toBe(1);
  h.intersect(true); h.frame(714); await flushImports();
  expect(h.mounts).toBe(1); expect(h.active).toBe(true);
  h.root.inert = true; h.frame(714); expect(h.active).toBe(false);
  h.root.inert = false; h.frame(714); expect(h.active).toBe(true);
  h.frame(400); expect(h.active).toBe(false); // The story hides the pinned footer.
  h.word.style.transform = "translate3d(0,4%,0)"; h.svg.setAttribute("style", "height: 8vw");
  dispose();
  expect(h.disposals).toBe(1);
  expect(h.word.getAttribute("style")).toBe("color: red"); expect(h.svg.getAttribute("style")).toBe("height: 10vw");
  expect(h.timers.size).toBe(0); expect(h.subscribers).toBe(0); expect(h.resizeTargets.size).toBe(0);
});

test("HOME refits the word when only the stage height changes", () => {
  const h = harness(), dispose = h.mount();
  expect(h.resizeTargets.has(h.root)).toBe(true);
  const before = h.measurements.word;
  h.layoutResize(h.root); // A shorter window: the mask keeps its width.
  expect(h.measurements.word).toBe(before + 1);
  dispose();
});

test("standalone standard footer completes at native max scroll without a tail even when the editorial shell import fails", async () => {
  const h = harness("standard");
  h.globals.innerWidth = 1280;
  h.root.offsetHeight = 633.6; h.root.rect.top = 4000;
  const dispose = h.mount(); h.intersect(true); await flushImports();
  // The physical viewport is the pose length, so tall and short windows both finish at max scroll.
  for (const height of [1024, 600]) {
    h.globals.innerHeight = height;
    h.globals.scrollY = 4000 + 633.6 - height - 633.6 / 2;
    h.window.dispatchEvent(new Event("resize"));
    expect(Number(h.colophon.style.opacity)).toBeLessThan(1);
    h.globals.scrollY = 4000 + 633.6 - height;
    h.window.dispatchEvent(new Event("resize"));
    expect(Number(h.colophon.style.opacity)).toBeCloseTo(1, 12); expect(h.colophon.inert).toBe(false);
    expect(h.word.style.transform).toBe("translate3d(0,0%,0)");
  }
  expect(h.root.afterNodes).toHaveLength(0);
  dispose(); expect(h.root.afterNodes).toHaveLength(0);
});


test("standard footer remeasures upstream content changes without a mask resize", async () => {
  const h = harness("standard"), layout = new Surface(), content = new Surface(); h.root.parentElement = layout;
  layout.querySelector = (selector) => selector === "main" ? content : null;
  h.globals.innerWidth = 1280; h.globals.innerHeight = 1024;
  h.root.offsetHeight = 633.6; h.root.rect.top = 4000;
  const dispose = h.mount(); await flushImports();
  expect(h.resizeTargets.has(layout)).toBe(true); expect(h.resizeTargets.has(content)).toBe(true); expect(h.resizeTargets.has(h.mask)).toBe(true);
  // Textarea/content shrinks while the mask width/height remains unchanged.
  const maskRect = { ...h.mask.rect }; h.root.rect.top = 3840;
  h.layoutResize(content);
  h.globals.scrollY = 3840 + 633.6 - 1024;
  h.window.dispatchEvent(new Event("resize"));
  expect(h.mask.rect).toEqual(maskRect);
  expect(Number(h.colophon.style.opacity)).toBeCloseTo(1, 12); expect(h.colophon.inert).toBe(false);
  expect(h.word.style.transform).toBe("translate3d(0,0%,0)");
  dispose(); expect(h.resizeTargets.size).toBe(0);
});

test("standard footer layout notifications keep the word fit on height-only resize", async () => {
  const h = harness("standard"), layout = new Surface(), content = new Surface(); h.root.parentElement = layout;
  layout.querySelector = (selector) => selector === "main" ? content : null;
  h.globals.innerWidth = 1280; h.globals.innerHeight = 1024;
  const dispose = h.mount(); h.intersect(true); await flushImports();
  const before = { ...h.measurements };
  h.globals.innerHeight = 1200;
  h.window.dispatchEvent(new Event("resize"));
  h.layoutResize(layout); // A taller physical stage resizes the observed parent.
  h.layoutResize(content); // A textarea edit can also move the same word box.
  expect(h.root.afterNodes).toHaveLength(0);
  expect(h.measurements).toEqual(before);
  h.maskResize(); // Real width changes still refit the word.
  expect(h.measurements.word).toBe(before.word + 1);
  dispose(); expect(h.resizeTargets.size).toBe(0);
});
