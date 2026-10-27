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
  rectReads = 0;
  rect = { x: 0, y: 0, top: 0, left: 0, width: 600, height: 100, bottom: 100, right: 600 };
  children: Surface[] = [];
  append(child: Surface) { this.children.push(child); }
  remove() {}
  setAttribute(name: string, value: string) { this.attributes.set(name, value); }
  getAttribute(name: string) { return this.attributes.get(name) ?? null; }
  removeAttribute(name: string) { this.attributes.delete(name); }
  getBoundingClientRect() { this.rectReads++; return this.rect; }
  hasPointerCapture() { return false; }
  setPointerCapture() {}
  releasePointerCapture() {}
  focus() {}
  querySelector(selector: string): Surface | null { void selector; return null; }
  closest(selector: string): Surface | null { void selector; return null; }
}

function load(file: string, globals: Record<string, unknown>, dependencies: Record<string, unknown>, rewrite?: (source: string) => string) {
  const source = readFileSync(new URL(file, import.meta.url), "utf8");
  const js = ts.transpileModule(rewrite ? rewrite(source) : source, { compilerOptions: {
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
  type PathCommand = ["M" | "L", number, number] | ["Z"];
  class RecordedPath {
    commands: PathCommand[] = [];
    constructor() { paint.pathBuilds++; }
    moveTo(x: number, y: number) { this.commands.push(["M", x, y]); }
    lineTo(x: number, y: number) { this.commands.push(["L", x, y]); }
    closePath() { this.commands.push(["Z"]); }
  }
  const paint = {
    pathBuilds: 0, contourCalls: 0, clears: 0,
    fills: [] as RecordedPath[], transforms: [] as number[][], clips: [] as number[][],
    hits: [] as { path: RecordedPath; x: number; y: number }[], hitPath: undefined as RecordedPath | undefined,
  };
  const context = {
    clearRect() { paint.clears++; },
    setTransform(...values: number[]) { paint.transforms.push(values); },
    fill(path?: RecordedPath) { if (path) paint.fills.push(path); },
    rect(...values: number[]) { paint.clips.push(values); },
    isPointInPath(path: RecordedPath, x: number, y: number) {
      paint.hits.push({ path, x, y }); return path === paint.hitPath;
    },
    isPointInStroke() { return false; },
    save() {}, restore() {}, beginPath() {}, clip() {}, moveTo() {}, lineTo() {}, stroke() {}, arc() {},
  };
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
    document, window, Date: ClockDate, Intl, Path2D: RecordedPath,
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
    root, mask, word, clock, stage, document, window, motion, globals, timers, rafs, paint,
    snapshot: () => paint.fills.slice(-6).map((path) => path.commands),
    step(ms = 1000 / 60) {
      now += ms;
      const pending = [...rafs.values()]; rafs.clear();
      pending.forEach((callback) => callback(now));
    },
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
    material(uncached = false) {
      class Thoughts { mobile = false; x = 0; y = 0; titleSize = 20; draw() {} dispose() {} }
      class TrackedPaths extends FooterPaths {
        contours(progress: number, reverse = false) { paint.contourCalls++; return super.contours(progress, reverse); }
      }
      const exports = load("./footer-material.ts", globals, {
        "@/lib/audio/material-audio": { playMaterialSound() { soundCalls++; }, setFooterFriction() {} },
        "./footer-paths": { FooterPaths: TrackedPaths },
        "./footer-geometry": { footerGlyphBoxes: () => Array.from({ length: 6 }, (_, i) => ({ x: i * word.rect.width / 6, y: 0, width: word.rect.width / 6 * 0.8, height: word.offsetHeight })) },
        "./footer-thoughts": { FooterThoughts: Thoughts },
        "./footer-material-field": materialField,
        "../header/material-protection": { emitMaterialProtection() {} },
      }, uncached ? (source) => {
        // The control uses the actual deformation formulas, disabling only cache eligibility.
        if (!source.includes("const restWord =")) throw new Error("Missing footer cache control");
        return source.replace("const restWord =", "const restWord = false &&");
      } : undefined);
      return (exports.mountFooterMaterial as unknown as (root: Surface, reduced: () => boolean) => {
        measure(): void; reset(): void; setActive(active: boolean): void; dispose(): void;
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

function materialPair(locale = "en", reduced = false) {
  const scenes = [harness(), harness()];
  scenes.forEach((h) => {
    h.root.lang = locale; h.mode({ quietMode: reduced });
    h.mask.rect.top = 200; h.word.rect.top = 240;
  });
  const materials = scenes.map((h, i) => h.material(i === 1));
  const equal = () => expect(scenes[0].snapshot()).toEqual(scenes[1].snapshot());
  return {
    scenes, materials, equal,
    wake() { materials.forEach((material) => material.setActive(true)); },
    step(ms = 50) { scenes.forEach((h) => h.step(ms)); equal(); },
    key(key: string) { scenes.forEach((h) => h.mask.dispatchEvent(Object.assign(new Event("keydown", { cancelable: true }), { key }))); },
    dispose() { materials.forEach((material) => material.dispose()); },
  };
}

function pointer(type: string, clientX: number, clientY: number, at: number) {
  const event = Object.assign(new Event(type, { cancelable: true }), {
    button: 0, pointerId: 1, pointerType: "mouse", clientX, clientY,
  });
  Object.defineProperty(event, "timeStamp", { value: at });
  return event;
}

test("partial-reveal and reverse scroll reuse exact rest paths with one mask/word read per tick", () => {
  for (const locale of ["en", "ar"]) for (const reduced of [false, true]) {
    const pair = materialPair(locale, reduced), [cached, control] = pair.scenes;
    pair.wake(); pair.step();
    const paths = cached.paint.fills.slice(-6);
    expect(cached.paint.pathBuilds).toBe(6); expect(cached.paint.contourCalls).toBe(1);
    const positions = [
      [0, 199, 239], [0, 198, 236], [0, 199, 239],
      [0, 199, 239], [12, 199, 239], [12, 199, 194],
    ];
    for (const [left, top, wordTop] of positions) {
      const same = cached.mask.rect.left === left && cached.mask.rect.top === top && cached.word.rect.top === wordTop;
      const reads = [cached.mask.rectReads, cached.word.rectReads], clears = cached.paint.clears;
      pair.scenes.forEach((h) => { h.mask.rect.left = left; h.mask.rect.top = top; h.word.rect.top = wordTop; });
      pair.wake(); pair.step();
      expect(cached.mask.rectReads - reads[0]).toBe(1); expect(cached.word.rectReads - reads[1]).toBe(1);
      expect(cached.paint.clears - clears).toBe(same ? 0 : 1);
      expect(cached.paint.transforms.at(-1)).toEqual([1, 0, 0, 1, left, top + (wordTop - top)]);
      if (wordTop > top) expect(cached.paint.clips.at(-1)).toEqual([0, top - wordTop, 600, 100]);
      cached.paint.fills.slice(-6).forEach((path, i) => expect(path).toBe(paths[i]));
    }
    expect(cached.paint.pathBuilds).toBe(6); expect(cached.paint.contourCalls).toBe(1);
    expect(control.paint.pathBuilds).toBe(6 * (positions.length + 1));
    expect(control.paint.contourCalls).toBe(positions.length + 1);
    pair.dispose();
  }
});

test("resolving, morph, thought impulse and reverse retain uncached path coordinates", () => {
  for (const reduced of [false, true]) {
    const pair = materialPair(reduced ? "ar" : "en", reduced), [cached] = pair.scenes;
    pair.wake(); pair.step(); const rest = cached.snapshot();
    pair.key("Enter"); expect(cached.mask.dataset.mode).toBe("resolving");
    for (let i = 0; i < 70 && cached.mask.dataset.mode !== "logo"; i++) pair.step();
    expect(cached.mask.dataset.mode).toBe("logo");
    for (let i = 0; i < 12; i++) {
      const builds = cached.paint.pathBuilds; pair.step(); expect(cached.paint.pathBuilds - builds).toBe(6);
    }
    expect(cached.snapshot()).not.toEqual(rest);
    pair.key("Escape"); expect(cached.mask.dataset.mode).toBe("logo"); // Phase is published on the next RAF.
    let sawReturn = false;
    for (let i = 0; i < 85 && cached.mask.dataset.mode !== "word"; i++) {
      pair.step(); sawReturn ||= cached.mask.dataset.mode === "to-word";
    }
    expect(sawReturn).toBe(true); expect(cached.mask.dataset.mode).toBe("word");
    const builds = cached.paint.pathBuilds; pair.wake(); pair.step();
    expect(cached.paint.pathBuilds - builds).toBe(6); expect(cached.snapshot()).toEqual(rest);
    pair.wake(); pair.step(); expect(cached.paint.pathBuilds - builds).toBe(6);
    pair.dispose();
    pair.scenes.forEach((h) => { expect(h.rafs.size).toBe(0); expect(h.timers.size).toBe(0); });
  }
});

test("idle takeover, hover/waves and pull bypass rest geometry; hits, measure and reset stay current", () => {
  const pair = materialPair(), [cached] = pair.scenes;
  pair.scenes.forEach((h) => { h.word.rect.top = h.mask.rect.top; h.motion.matches = true; });
  pair.wake(); pair.step(); const rest = cached.snapshot();
  pair.scenes.forEach((h) => h.advance(4000)); pair.step();
  expect(Number(cached.mask.dataset.idleKind)).toBeGreaterThanOrEqual(0);
  expect(Number(cached.mask.dataset.idleAmount)).toBeGreaterThan(0);
  expect(cached.snapshot()).not.toEqual(rest);
  pair.scenes.forEach((h) => {
    const path = h.paint.fills.at(-6)!;
    h.paint.hitPath = path; h.mask.rect.left = 31; h.mask.rect.top = 180; h.word.rect.top = 185;
    h.window.dispatchEvent(pointer("pointermove", 56, 235, 1000));
    expect(h.paint.hits.at(-1)).toEqual({ path, x: 25, y: 50 });
  });
  pair.step(); expect(cached.mask.dataset.idleKind).toBe("-1");
  expect(Number(cached.mask.dataset.waveEnergy)).toBeGreaterThan(0);
  for (let i = 0; i < 6; i++) {
    const builds = cached.paint.pathBuilds; pair.step(); expect(cached.paint.pathBuilds - builds).toBe(6);
  }
  pair.scenes.forEach((h) => { h.paint.hitPath = undefined; h.window.dispatchEvent(pointer("pointermove", 800, 800, 1400)); });
  for (let i = 0; i < 25; i++) pair.step();
  expect(cached.snapshot()).toEqual(rest);
  const settled = cached.paint.pathBuilds; pair.wake(); pair.step(); expect(cached.paint.pathBuilds).toBe(settled);
  pair.scenes.forEach((h) => {
    h.paint.hitPath = h.paint.fills.at(-6);
    h.document.dispatchEvent(pointer("pointerdown", 56, 235, 3000));
  });
  pair.equal(); pair.step(); expect(cached.mask.dataset.mode).toBe("pull"); expect(cached.snapshot()).not.toEqual(rest);
  pair.scenes.forEach((h) => h.window.dispatchEvent(pointer("pointermove", 96, 255, 3100))); pair.step();
  pair.scenes.forEach((h) => h.window.dispatchEvent(pointer("pointerup", 96, 255, 3200))); pair.step();
  expect(cached.mask.dataset.mode).toBe("to-logo");
  pair.materials.forEach((material) => material.reset()); pair.wake(); pair.step();
  expect(cached.snapshot()).toEqual(rest);
  for (const invalidate of ["measure", "reset"] as const) {
    const paths = cached.paint.fills.slice(-6), builds = cached.paint.pathBuilds, previous = cached.snapshot();
    if (invalidate === "measure") pair.scenes.forEach((h) => {
      h.mask.rect.width = h.word.rect.width = 720; h.word.offsetHeight = 120; h.globals.devicePixelRatio = 2;
    });
    pair.materials.forEach((material) => material[invalidate]()); pair.wake(); pair.step();
    expect(cached.paint.pathBuilds - builds).toBe(6);
    cached.paint.fills.slice(-6).forEach((path, i) => expect(path).not.toBe(paths[i]));
    expect(cached.paint.transforms.at(-1)).toEqual([2, 0, 0, 2, 62, 370]);
    if (invalidate === "measure") expect(cached.snapshot()).not.toEqual(previous);
    else expect(cached.snapshot()).toEqual(previous);
  }
  pair.dispose();
  pair.scenes.forEach((h) => { expect(h.rafs.size).toBe(0); expect(h.timers.size).toBe(0); });
});
