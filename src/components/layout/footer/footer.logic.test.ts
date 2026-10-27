import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import ts from "typescript";
import { FooterPaths } from "./footer-paths";
import * as materialField from "./footer-material-field";

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
  children: Surface[] = [];
  append(child: Surface) { this.children.push(child); }
  remove() {}
  setAttribute(name: string, value: string) { this.attributes.set(name, value); }
  getAttribute(name: string) { return this.attributes.get(name) ?? null; }
  removeAttribute(name: string) { this.attributes.delete(name); }
  getBoundingClientRect() { return { x: 0, y: 0, top: 0, left: 0, width: 600, height: 100, bottom: 100, right: 600 }; }
  hasPointerCapture() { return false; }
  releasePointerCapture() {}
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
  const root = new Surface(), mask = new Surface(), word = new Surface(), clock = new Surface(), stage = new Surface();
  root.dataset.footerVariant = variant;
  root.querySelector = (selector) => selector.includes("grab") ? mask : selector.includes("clock") ? clock : selector.includes("word") ? word : null;
  root.closest = () => stage;
  const context = { clearRect() {} };
  const document = Object.assign(new EventTarget(), {
    hidden: false, documentElement: new Surface(), body: new Surface(), fonts: { ready: Promise.resolve() },
    createElement: () => Object.assign(new Surface(), { getContext: () => context }),
  });
  const window = new EventTarget();
  const motion = Object.assign(new EventTarget(), { matches: false });
  let now = Date.UTC(2026, 9, 27, 14, 16, 20, 588), serial = 0;
  const timers = new Map<number, { at: number; callback: () => void }>();
  const rafs = new Map<number, FrameRequestCallback>();
  const subscribers = new Set<() => void>();
  const state = { quietMode: false, homeSceneFailed: false, menuOpen: false };
  let intersect: (entries: { isIntersecting: boolean }[]) => void = () => {};
  let active = false, materialMounts = 0, materialDisposals = 0, soundCalls = 0;
  class ClockDate extends Date {
    constructor() { super(now); }
    static now() { return now; }
  }
  const globals = {
    document, window, Date: ClockDate, Intl,
    matchMedia: () => motion, Element: Surface,
    innerWidth: 1200, innerHeight: 800, devicePixelRatio: 1, scrollY: 0,
    performance: { now: () => now },
    getComputedStyle: () => ({ getPropertyValue: () => "Questrial" }),
    setTimeout: (callback: () => void, delay: number) => { const id = ++serial; timers.set(id, { at: now + delay, callback }); return id; },
    clearTimeout: (id: number) => timers.delete(id),
    requestAnimationFrame: (callback: FrameRequestCallback) => { const id = ++serial; rafs.set(id, callback); return id; },
    cancelAnimationFrame: (id: number) => rafs.delete(id),
    IntersectionObserver: class {
      constructor(callback: typeof intersect) { intersect = callback; }
      observe() {} disconnect() {}
    },
    ResizeObserver: class { observe() {} disconnect() {} },
  };
  const dependencies = {
    "@/store/uiStore": { uiStore: { getState: () => state, subscribe: (callback: () => void) => { subscribers.add(callback); return () => subscribers.delete(callback); } } },
    "./footer-geometry": { measureFooterWord() {} },
    "./footer-material": { mountFooterMaterial() {
      materialMounts++;
      return { measure() {}, reset() {}, setActive(value: boolean) { active = value; }, dispose() { materialDisposals++; } };
    } },
  };
  const mount = load("./footer.logic.ts", globals, dependencies).mountFooterInteractions as unknown as (root: Surface) => () => void;
  return {
    root, mask, word, clock, stage, document, window, motion, globals, timers, rafs,
    mount: () => mount(root),
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
    expectedTime: () => new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(now)),
    iso: () => new Date(now).toISOString(),
    get active() { return active; },
    get mounts() { return materialMounts; },
    get disposals() { return materialDisposals; },
    get subscribers() { return subscribers.size; },
    material() {
      class Thoughts { dispose() {} }
      const exports = load("./footer-material.ts", globals, {
        "@/lib/audio/material-audio": { playMaterialSound() { soundCalls++; }, setFooterFriction() {} },
        "./footer-paths": { FooterPaths },
        "./footer-geometry": { footerGlyphBoxes: () => Array.from({ length: 6 }, (_, i) => ({ x: i * 100, y: 0, width: 80, height: 100 })) },
        "./footer-thoughts": { FooterThoughts: Thoughts },
        "./footer-material-field": materialField,
        "../header/material-protection": { emitMaterialProtection() {} },
      });
      return (exports.mountFooterMaterial as unknown as (root: Surface, reduced: () => boolean) => {
        setActive(active: boolean): void; dispose(): void;
      })(root, () => state.quietMode);
    },
    get soundCalls() { return soundCalls; },
  };
}

const flushImports = async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); };

test("Cairo clock stays current when a pinned work visit becomes an already-intersecting reading footer", async () => {
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

test("HOME reading disables material eligibility while a standard reduced footer retains its reveal", async () => {
  for (const variant of ["home", "standard"]) {
    const h = harness(variant), dispose = h.mount();
    h.intersect(true); h.frame(714); await flushImports(); expect(h.active).toBe(true);
    h.mode({ quietMode: true }); expect(h.active).toBe(variant === "standard");
    h.mode({ quietMode: false }); expect(h.active).toBe(true);
    h.motion.matches = true; h.motion.dispatchEvent(new Event("change"));
    expect(h.active).toBe(variant === "standard");
    h.motion.matches = false; h.motion.dispatchEvent(new Event("change"));
    h.mode({ homeSceneFailed: true }); expect(h.active).toBe(variant === "standard");
    dispose();
  }
});

test("inactive real material cannot reactivate itself through Enter or pointer input", () => {
  const h = harness(), material = h.material();
  const enter = () => { const event = Object.assign(new Event("keydown", { cancelable: true }), { key: "Enter" }); h.mask.dispatchEvent(event); return event; };
  expect(h.mask.dataset.mode).toBe("word"); expect(h.mask.dataset.grabbable).toBe("false");
  expect(enter().defaultPrevented).toBe(false);
  expect(h.mask.dataset.mode).toBe("word"); expect(h.soundCalls).toBe(0);
  material.setActive(true); expect(enter().defaultPrevented).toBe(true);
  expect(h.mask.dataset.mode).toBe("resolving"); expect(h.soundCalls).toBe(1);
  material.setActive(false); expect(h.mask.dataset.mode).toBe("word");
  expect(enter().defaultPrevented).toBe(false); expect(h.soundCalls).toBe(1);
  h.document.dispatchEvent(Object.assign(new Event("pointerdown"), { button: 0, pointerId: 1, pointerType: "touch", clientX: 85, clientY: 60 }));
  expect(h.mask.dataset.held).toBe("false"); expect(h.mask.dataset.mode).toBe("word");
  material.dispose(); expect(h.rafs.size).toBe(0);
});
