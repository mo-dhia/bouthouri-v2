import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import ts from "typescript";
import { FooterPaths, footerPartMap } from "./footer-paths";
import { brand } from "@/config/brand";
const GLYPHS = brand.wordmark.length;
import * as materialField from "./footer-material-field";
import * as viewport from "@/lib/viewport-design";
import type { FooterThoughts } from "./footer-thoughts";
import type { FooterMaterial } from "./footer-material";

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
    addPath(path: RecordedPath) { this.commands.push(...path.commands); }
  }
  const paint = {
    pathBuilds: 0, contourCalls: 0, clears: 0,
    fills: [] as RecordedPath[], frameFills: [] as RecordedPath[], transforms: [] as number[][], clips: [] as number[][],
    hits: [] as { path: RecordedPath; x: number; y: number }[], hitPath: undefined as RecordedPath | undefined,
    fonts: [] as string[], images: [] as number[][],
    thoughts: [] as { mobile: boolean; x: number; y: number; titleSize: number }[],
    canvases: [] as (Surface & { width: number; height: number })[],
  };
  const context = {
    _font: "",
    set font(value: string) { this._font = value; paint.fonts.push(value); },
    get font() { return this._font; },
    scale() {},
    measureText(text: string) { return { width: text.length * parseFloat(this._font.split(" ")[1]) * 0.5, actualBoundingBoxLeft: 0, actualBoundingBoxRight: 0 }; },
    fillText() {},
    drawImage(_canvas: unknown, ...values: number[]) { paint.images.push(values); },
    clearRect() { paint.clears++; paint.frameFills = []; },
    setTransform(...values: number[]) { paint.transforms.push(values); },
    fill(path?: RecordedPath) { if (path) { paint.fills.push(path); paint.frameFills.push(path); } },
    rect(...values: number[]) { paint.clips.push(values); },
    isPointInPath(path: RecordedPath, x: number, y: number) {
      paint.hits.push({ path, x, y }); return path === paint.hitPath;
    },
    isPointInStroke() { return false; },
    save() {}, restore() {}, beginPath() {}, clip() {}, moveTo() {}, lineTo() {}, stroke() {}, arc() {},
  };
  const document = Object.assign(new EventTarget(), {
    hidden: false, documentElement: new Surface(), body: new Surface(), fonts: { ready: Promise.resolve() },
    createElement: () => {
      const canvas = Object.assign(new Surface(), { width: 0, height: 0, getContext: () => context });
      paint.canvases.push(canvas); return canvas;
    },
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
  let mountedMaterial: FooterMaterial | undefined, wordMeasures = 0, maskResizeNotifications = 0;
  let maskResize: () => void = () => {};
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
    ResizeObserver: class { constructor(callback: () => void) { maskResize = callback; } observe() {} disconnect() {} },
  };
  const dependencies = {
    "@/store/uiStore": { uiStore: { getState: () => state, subscribe: (callback: () => void) => { subscribers.add(callback); return () => subscribers.delete(callback); } } },
    "./footer-geometry": { measureFooterWord() { wordMeasures++; } },
    "./footer-material": { mountFooterMaterial() {
      materialMounts++;
      if (mountedMaterial) return mountedMaterial;
      return { measure() {}, reset() {}, setActive(value: boolean) { active = value; }, dispose() { materialDisposals++; } };
    } },
  };
  const mount = load("./footer.logic.ts", globals, dependencies).mountFooterInteractions as unknown as (root: Surface) => () => void;
  return {
    root, mask, word, clock, stage, document, window, motion, globals, timers, rafs, paint,
    snapshot: () => paint.frameFills.map((path) => path.commands),
    step(ms = 1000 / 60) {
      now += ms;
      const pending = [...rafs.values()]; rafs.clear();
      pending.forEach((callback) => callback(now));
    },
    mount(material?: FooterMaterial) { mountedMaterial = material; return mount(root); },
    maskResize() { maskResizeNotifications++; maskResize(); },
    get measurements() { return { word: wordMeasures, maskResizeNotifications }; },
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
    material(uncached = false, realThoughts = false) {
      class Thoughts { mobile = false; x = 0; y = 0; titleSize = 20; draw() {} dispose() {} }
      const Thought = (realThoughts ? load("./footer-thoughts.ts", globals, {}).FooterThoughts : Thoughts) as unknown as typeof FooterThoughts;
      class TrackedThoughts extends Thought {
        constructor(...args: ConstructorParameters<typeof FooterThoughts>) { super(...args); paint.thoughts.push(this); }
      }
      class TrackedPaths extends FooterPaths {
        contours(progress: number, reverse = false) { paint.contourCalls++; return super.contours(progress, reverse); }
      }
      const exports = load("./footer-material.ts", globals, {
        "@/lib/audio/material-audio": { playMaterialSound() { soundCalls++; }, setFooterFriction() {} },
        "./footer-paths": { FooterPaths: TrackedPaths, footerPartMap },
        "@/lib/viewport-design": viewport,
        "./footer-geometry": { footerGlyphBoxes: () => Array.from({ length: GLYPHS }, (_, i) => ({ x: i * word.rect.width / GLYPHS, y: 0, width: word.rect.width / GLYPHS * 0.8, height: word.offsetHeight })) },
        "./footer-thoughts": { FooterThoughts: TrackedThoughts },
        "./footer-material-field": materialField,
        "../header/material-protection": { emitMaterialProtection() {} },
      }, uncached ? (source) => {
        // The control uses the actual deformation formulas, disabling only cache eligibility.
        if (!source.includes("const restWord =")) throw new Error("Missing footer cache control");
        return source.replace("const restWord =", "const restWord = false &&");
      } : undefined);
      return (exports.mountFooterMaterial as unknown as (root: Surface, reduced: () => boolean) => {
        measure(): void; resizeViewport(): void; reset(): void; setActive(active: boolean): void; dispose(): void;
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
    const paths = cached.paint.fills.slice(-GLYPHS);
    expect(cached.paint.pathBuilds).toBe(GLYPHS); expect(cached.paint.contourCalls).toBe(1);
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
      const scale = viewport.designScale(cached.globals.innerWidth);
      expect(cached.paint.transforms.at(-1)).toEqual([scale, 0, 0, scale, left, top + (wordTop - top)]);
      if (wordTop > top) expect(cached.paint.clips.at(-1)).toEqual([0, (top - wordTop) / scale, 600 / scale, 100 / scale]);
      cached.paint.fills.slice(-GLYPHS).forEach((path, i) => expect(path).toBe(paths[i]));
    }
    expect(cached.paint.pathBuilds).toBe(GLYPHS); expect(cached.paint.contourCalls).toBe(1);
    expect(control.paint.pathBuilds).toBe(GLYPHS * (positions.length + 1));
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
    expect(cached.paint.frameFills).toHaveLength(3);
    for (let i = 0; i < 12; i++) {
      const builds = cached.paint.pathBuilds; pair.step(); expect(cached.paint.pathBuilds - builds).toBe(GLYPHS);
    }
    expect(cached.snapshot()).not.toEqual(rest);
    pair.key("Escape"); expect(cached.mask.dataset.mode).toBe("logo"); // Phase is published on the next RAF.
    let sawReturn = false;
    for (let i = 0; i < 85 && cached.mask.dataset.mode !== "word"; i++) {
      pair.step(); sawReturn ||= cached.mask.dataset.mode === "to-word";
    }
    expect(sawReturn).toBe(true); expect(cached.mask.dataset.mode).toBe("word");
    const builds = cached.paint.pathBuilds; pair.wake(); pair.step();
    expect(cached.paint.pathBuilds - builds).toBe(GLYPHS); expect(cached.snapshot()).toEqual(rest);
    pair.wake(); pair.step(); expect(cached.paint.pathBuilds - builds).toBe(GLYPHS);
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
    const path = h.paint.fills.at(-GLYPHS)!;
    h.paint.hitPath = path; h.mask.rect.left = 31; h.mask.rect.top = 180; h.word.rect.top = 185;
    h.window.dispatchEvent(pointer("pointermove", 56, 235, 1000));
    const hit = h.paint.hits.at(-1)!;
    expect(hit.path).toBe(path);
    expect(hit.x).toBeCloseTo(25 / viewport.designScale(h.globals.innerWidth), 12);
    expect(hit.y).toBeCloseTo(50 / viewport.designScale(h.globals.innerWidth), 12);
  });
  pair.step(); expect(cached.mask.dataset.idleKind).toBe("-1");
  expect(Number(cached.mask.dataset.waveEnergy)).toBeGreaterThan(0);
  for (let i = 0; i < 6; i++) {
    const builds = cached.paint.pathBuilds; pair.step(); expect(cached.paint.pathBuilds - builds).toBe(GLYPHS);
  }
  pair.scenes.forEach((h) => { h.paint.hitPath = undefined; h.window.dispatchEvent(pointer("pointermove", 800, 800, 1400)); });
  for (let i = 0; i < 25; i++) pair.step();
  expect(cached.snapshot()).toEqual(rest);
  const settled = cached.paint.pathBuilds; pair.wake(); pair.step(); expect(cached.paint.pathBuilds).toBe(settled);
  pair.scenes.forEach((h) => {
    h.paint.hitPath = h.paint.fills.at(-GLYPHS);
    h.document.dispatchEvent(pointer("pointerdown", 56, 235, 3000));
  });
  pair.equal(); pair.step(); expect(cached.mask.dataset.mode).toBe("pull"); expect(cached.snapshot()).not.toEqual(rest);
  pair.scenes.forEach((h) => h.window.dispatchEvent(pointer("pointermove", 96, 255, 3100))); pair.step();
  pair.scenes.forEach((h) => h.window.dispatchEvent(pointer("pointerup", 96, 255, 3200))); pair.step();
  expect(cached.mask.dataset.mode).toBe("to-logo");
  pair.materials.forEach((material) => material.reset()); pair.wake(); pair.step();
  expect(cached.snapshot()).toEqual(rest);
  for (const invalidate of ["measure", "reset"] as const) {
    const paths = cached.paint.fills.slice(-GLYPHS), builds = cached.paint.pathBuilds, previous = cached.snapshot();
    if (invalidate === "measure") pair.scenes.forEach((h) => {
      h.mask.rect.width = h.word.rect.width = 720; h.word.offsetHeight = h.word.rect.height = 120; h.globals.devicePixelRatio = 2;
    });
    pair.materials.forEach((material) => material[invalidate]()); pair.wake(); pair.step();
    expect(cached.paint.pathBuilds - builds).toBe(GLYPHS);
    cached.paint.fills.slice(-GLYPHS).forEach((path, i) => expect(path).not.toBe(paths[i]));
    const ratio = 2 * viewport.designScale(cached.globals.innerWidth);
    expect(cached.paint.transforms.at(-1)).toEqual([ratio, 0, 0, ratio, 62, 370]);
    if (invalidate === "measure") expect(cached.snapshot()).not.toEqual(previous);
    else expect(cached.snapshot()).toEqual(previous);
  }
  pair.dispose();
  pair.scenes.forEach((h) => { expect(h.rafs.size).toBe(0); expect(h.timers.size).toBe(0); });
});

function designMaterial(width: number, height: number, dpr = 1, locale = "en") {
  const h = harness(), scale = viewport.designScale(width);
  Object.assign(h.globals, { innerWidth: width, innerHeight: height, devicePixelRatio: dpr });
  h.root.lang = locale;
  h.mask.rect.width = h.word.rect.width = 0.96 * width;
  h.word.offsetHeight = h.word.rect.height = 0.24 * width;
  h.mask.rect.left = 20 * scale;
  h.mask.rect.top = h.word.rect.top = 180 * scale;
  h.motion.matches = true;
  const material = h.material(false, true);
  material.setActive(true); h.step();
  return { h, material, scale };
}

function equalDesignPaths(a: ReturnType<typeof harness>, b: ReturnType<typeof harness>) {
  const left = a.snapshot(), right = b.snapshot();
  expect(left.map((commands) => commands.map((command) => command[0]))).toEqual(right.map((commands) => commands.map((command) => command[0])));
  let error = 0;
  left.forEach((commands, glyph) => commands.forEach((command, index) => {
    if (command[0] !== "Z") {
      const other = right[glyph][index];
      if (other[0] !== "Z") error = Math.max(error, Math.abs(command[1] - other[1]), Math.abs(command[2] - other[2]));
    }
  }));
  expect(error).toBeLessThan(1e-8);
}

const fontSizes = (h: ReturnType<typeof harness>) => h.paint.fonts.map((font) => Number(parseFloat(font.split(" ")[1]).toFixed(8)));

test("each fixed reference draws at factor one; proportional fonts, morphs, waves and hits share one scale", () => {
  for (const reference of Object.values(viewport.viewportDesigns)) for (const locale of ["en", "ar"]) {
    const a = designMaterial(reference.width, reference.height, 1, locale);
    const b = designMaterial(reference.width * 1.25, reference.height * 0.8, 2, locale);
    expect(a.scale).toBe(1); expect(b.scale).toBe(1.25);
    expect(a.h.paint.transforms.at(-1)).toEqual([1, 0, 0, 1, 20, 180]);
    expect(b.h.paint.transforms.at(-1)).toEqual([2.5, 0, 0, 2.5, 50, 450]);
    equalDesignPaths(a.h, b.h);
    expect(fontSizes(a.h)).toEqual(fontSizes(b.h));
    const physicalTitleA = a.h.paint.thoughts[0].titleSize * a.h.paint.transforms.at(-1)![0];
    const physicalTitleB = b.h.paint.thoughts[0].titleSize * b.h.paint.transforms.at(-1)![0] / 2;
    expect(physicalTitleB / physicalTitleA).toBeCloseTo(1.25, 12);
    for (const [pair, x, y, at] of [[a, 50, 40, 1000], [b, 50, 40, 1000], [a, 90, 55, 1100], [b, 90, 55, 1100]] as const) {
      pair.h.paint.hitPath = pair.h.paint.fills.at(-GLYPHS);
      pair.h.window.dispatchEvent(pointer("pointermove", (20 + x) * pair.scale, (180 + y) * pair.scale, at));
      expect(pair.h.paint.hits.at(-1)!.x).toBeCloseTo(x, 10);
      expect(pair.h.paint.hits.at(-1)!.y).toBeCloseTo(y, 10);
      pair.h.step(50);
    }
    equalDesignPaths(a.h, b.h);
    expect(Number(a.h.mask.dataset.waveEnergy)).toBeGreaterThan(0);
    for (const pair of [a, b]) pair.h.mask.dispatchEvent(Object.assign(new Event("keydown", { cancelable: true }), { key: "Enter" }));
    for (let i = 0; i < 70; i++) { a.h.step(50); b.h.step(50); }
    expect(a.h.mask.dataset.mode).toBe("logo");
    equalDesignPaths(a.h, b.h);
    expect(a.h.paint.images.length).toBeGreaterThan(0);
    const imageA = a.h.paint.images.at(-1)!, imageB = b.h.paint.images.at(-1)!;
    // Source bitmap pixels may change with DPR; destination geometry stays logical.
    imageA.slice(4).forEach((value, i) => expect(imageB[4 + i] * b.scale).toBeCloseTo(value * 1.25, 9));
    for (const pair of [a, b]) {
      expect(pair.h.snapshot().flat(2).filter((value) => typeof value === "number").every(Number.isFinite)).toBe(true);
      pair.material.dispose();
      expect(pair.h.rafs.size + pair.h.timers.size).toBe(0);
      expect(pair.h.paint.canvases.at(-1)!.width).toBe(1);
      const builds = pair.h.paint.pathBuilds;
      pair.h.window.dispatchEvent(pointer("pointermove", 20, 20, 5000));
      expect(pair.h.paint.pathBuilds).toBe(builds);
    }
  }
});

test("footer reference typography ignores actual height and the former 680/700 tablet switches", () => {
  const cases = [designMaterial(650, 400), designMaterial(700, 1400), designMaterial(900, 600), designMaterial(900, 1800)];
  for (const { h } of cases) {
    expect(h.paint.thoughts[0].mobile).toBe(false);
    expect(h.paint.thoughts[0].titleSize).toBeCloseTo(cases[0].h.paint.thoughts[0].titleSize, 12);
    expect(fontSizes(h)).toEqual(fontSizes(cases[0].h));
    equalDesignPaths(h, cases[0].h);
  }
  cases.forEach(({ material }) => material.dispose());
});

test("mounted footer resizes its physical buffer without mask RO or material history resets", async () => {
  const pairs = [designMaterial(1920, 1080), designMaterial(1920, 1080)];
  // Material already owns its fine-pointer query. Parent reading eligibility
  // gets a distinct OS-reduced query, as it does in the browser.
  pairs.forEach(({ h }) => { h.globals.matchMedia = () => Object.assign(new EventTarget(), { matches: false }); });
  const disposals = pairs.map(({ h, material }) => { const dispose = h.mount(material); h.intersect(true); return dispose; });
  await flushImports();
  pairs.forEach(({ h }) => h.step(50));
  const [resized, control] = pairs.map((pair) => pair.h);
  const overlay = resized.paint.canvases.find((canvas) => canvas.dataset.footerMaterial === "native-paths")!;
  const measurements = { ...resized.measurements };
  const step = (count = 1) => { for (let i = 0; i < count; i++) { resized.step(50); control.step(50); } };
  let height = 540;
  const resizeCurrentPose = (dpr = resized.globals.devicePixelRatio) => {
    const before = resized.snapshot(), dataset = { ...resized.mask.dataset };
    const builds = resized.paint.pathBuilds, fonts = resized.paint.fonts.length;
    const thoughts = resized.paint.thoughts.length, timers = [...resized.timers], rafs = [...resized.rafs.keys()];
    const rest = resized.mask.dataset.mode === "word" && resized.mask.dataset.idleKind === "-1" && Number(resized.mask.dataset.waveEnergy) === 0;
    resized.globals.innerHeight = height; resized.globals.devicePixelRatio = dpr;
    resized.window.dispatchEvent(new Event("resize"));
    expect(overlay.width).toBe(1920 * dpr); expect(overlay.height).toBe(height * dpr);
    expect(resized.paint.transforms.at(-1)).toEqual([dpr, 0, 0, dpr, 20 * dpr, 180 * dpr]);
    expect(resized.mask.dataset).toEqual(dataset); expect(resized.snapshot()).toEqual(before);
    expect(resized.measurements).toEqual(measurements); // No ResizeObserver publication.
    expect(resized.paint.fonts.length).toBe(fonts); expect(resized.paint.thoughts.length).toBe(thoughts);
    expect([...resized.timers]).toEqual(timers); expect([...resized.rafs.keys()]).toEqual(rafs);
    if (rest) expect(resized.paint.pathBuilds).toBe(builds); // Reuse the same rest paths.
    equalDesignPaths(resized, control);
    height = height === 540 ? 1400 : 540;
    step(); equalDesignPaths(resized, control); expect(resized.mask.dataset).toEqual(control.mask.dataset);
  };
  resizeCurrentPose(); // A resting word has no RAF and must repaint finitely.
  pairs.forEach(({ h }) => h.advance(4000)); step();
  expect(Number(resized.mask.dataset.idleKind)).toBeGreaterThanOrEqual(0);
  expect(Number(resized.mask.dataset.idleAmount)).toBeGreaterThan(0);
  resizeCurrentPose(2);
  pairs.forEach(({ h }) => {
    h.paint.hitPath = h.paint.fills.at(-GLYPHS);
    h.window.dispatchEvent(pointer("pointermove", 70, 220, 1000));
  }); step();
  expect(Number(resized.mask.dataset.waveEnergy)).toBeGreaterThan(0);
  resizeCurrentPose();
  pairs.forEach(({ h }) => h.mask.dispatchEvent(Object.assign(new Event("keydown", { cancelable: true }), { key: "Enter" })));
  step(8); expect(resized.mask.dataset.mode).toBe("to-logo"); resizeCurrentPose();
  step(50); expect(resized.mask.dataset.mode).toBe("logo"); resizeCurrentPose();
  pairs.forEach(({ h }) => h.mask.dispatchEvent(Object.assign(new Event("keydown", { cancelable: true }), { key: "Escape" })));
  step(20); expect(resized.mask.dataset.mode).toBe("to-word"); resizeCurrentPose();
  // DPR-only notification also redraws at the current pose without layout work.
  const currentHeight = resized.globals.innerHeight;
  resized.globals.devicePixelRatio = 1.5;
  resized.window.dispatchEvent(new Event("resize"));
  expect(overlay.width).toBe(2880); expect(overlay.height).toBe(currentHeight * 1.5);
  equalDesignPaths(resized, control); expect(resized.measurements).toEqual(measurements);
  const clears = resized.paint.clears;
  resized.window.dispatchEvent(new Event("resize")); expect(resized.paint.clears).toBe(clears);
  disposals.forEach((dispose) => dispose());
  const width = overlay.width, bufferHeight = overlay.height, paints = resized.paint.fills.length;
  resized.globals.innerHeight = 1700; resized.globals.devicePixelRatio = 2;
  resized.window.dispatchEvent(new Event("resize"));
  expect([overlay.width, overlay.height, resized.paint.fills.length]).toEqual([width, bufferHeight, paints]);
  pairs.forEach(({ h }) => { expect(h.rafs.size + h.timers.size).toBe(0); expect(h.subscribers).toBe(0); });
});

test("physical buffer resize keeps width reset policy and disposed/no-context handles safe", () => {
  const { h, material } = designMaterial(768, 1024);
  h.mask.dispatchEvent(Object.assign(new Event("keydown", { cancelable: true }), { key: "Enter" }));
  h.globals.innerWidth = 900; h.window.dispatchEvent(new Event("resize"));
  expect(h.mask.dataset.mode).toBe("word");
  const overlay = h.paint.canvases.find((canvas) => canvas.dataset.footerMaterial === "native-paths")!;
  expect(overlay.width).toBe(900); expect(overlay.height).toBe(1024);
  material.dispose(); const before = [overlay.width, overlay.height, h.paint.clears];
  h.globals.innerHeight = 600; material.resizeViewport();
  expect([overlay.width, overlay.height, h.paint.clears]).toEqual(before);
  const failed = harness();
  failed.document.createElement = () => Object.assign(new Surface(), { width: 0, height: 0, getContext: () => null }) as unknown as ReturnType<typeof failed.document.createElement>;
  const fallback = failed.material(); expect(() => fallback.resizeViewport()).not.toThrow(); fallback.dispose();
  expect(failed.rafs.size + failed.timers.size).toBe(0);
});
