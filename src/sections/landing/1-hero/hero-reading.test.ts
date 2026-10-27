import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import ts from "typescript";
import type { HeroWorldPose } from "./hero-world";
import type { ReadingPortraitState } from "./hero-reading-portrait";

class Surface extends EventTarget {
  dataset: Record<string, string> = {};
  inert = false;
  disabled = false;
  firstElementChild: Surface | null = null;
  writes = 0;
  values: Record<string, string> = {};
  selectors = new Map<string, Surface>();
  style = new Proxy({
    setProperty: (key: string, value: string) => { this.values[key] = value; this.writes++; },
    removeProperty: (key: string) => { delete this.values[key]; this.writes++; },
  } as Record<string, unknown>, {
    get: (target, key: string) => target[key] ?? this.values[key] ?? "",
    set: (_, key: string, value: string) => { this.values[key] = value; this.writes++; return true; },
  });
  key(key: string) { return key.slice(5).replace(/-([a-z])/g, (_, char: string) => char.toUpperCase()); }
  getAttribute(key: string) { return key === "style" ? Object.keys(this.values).length ? JSON.stringify(this.values) : null : this.dataset[this.key(key)] ?? null; }
  setAttribute(key: string, value: string) { if (key === "style") this.values = JSON.parse(value); else this.dataset[this.key(key)] = value; }
  removeAttribute(key: string) { if (key === "style") this.values = {}; else delete this.dataset[this.key(key)]; }
  querySelector(key: string) { return this.selectors.get(key) ?? null; }
}

// Real controller + publisher, isolated from React, GPU, audio, network and RAF.
function harness(initialY = 0, initialHeight = 1392, initialTop = 0) {
  const root = new Surface(), signature = new Surface();
  const elements = Object.fromEntries([
    "identity-hero", "hero-world", "hero-portrait", "hero-marquee", "hero-marquee-track",
    "hero-identity", "hero-copy-exit", "hero-bottom", "marquee-pause",
  ].map((name) => [name, new Surface()]));
  for (const [name, element] of Object.entries(elements)) root.selectors.set(`[data-${name}]`, element);
  elements["hero-identity"].selectors.set("svg", signature);
  let y = initialY, height = initialHeight, top = initialTop, fontResolve!: () => void;
  Object.defineProperty(root, "offsetHeight", { get: () => height });
  Object.assign(root, { getBoundingClientRect: () => ({ top: top - y }) });
  const window = new EventTarget();
  const document = Object.assign(new EventTarget(), {
    hidden: false, documentElement: new Surface(), fonts: { ready: new Promise<void>((resolve) => { fontResolve = resolve; }) },
  });
  const state = { menuOpen: false, entryPhase: "idle", setEntryPhase(value: string) { state.entryPhase = value; listeners.forEach((listener) => listener()); } };
  const listeners = new Set<() => void>(), observers: { callback: () => void; disconnected: boolean }[] = [];
  const forbidden = () => { throw new Error("Reading hero must not start a frame, timer, network request or heavy runtime"); };
  type PreparedPortrait = { render: (...args: unknown[]) => boolean; measure: () => void; dispose: () => void };
  const graphics: { signal: AbortSignal; reading: ReadingPortraitState; ready: (controller: PreparedPortrait) => void }[] = [];
  const context = createContext({
    window, document, Event, CustomEvent, AbortController, requestAnimationFrame: forbidden, cancelAnimationFrame: forbidden,
    setTimeout: forbidden, fetch: forbidden,
    ResizeObserver: class {
      record: typeof observers[number];
      constructor(callback: () => void) { this.record = { callback, disconnected: false }; observers.push(this.record); }
      observe() {}
      disconnect() { this.record.disconnected = true; }
    },
  });
  Object.defineProperty(context, "scrollY", { get: () => y });
  function evaluate(file: string, dependencies: Record<string, unknown>) {
    const compiled = ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    const evaluated = { exports: {} };
    runInContext(`(function(require, module, exports) { ${compiled}\n })`, context)((name: string) => {
      if (!(name in dependencies)) throw new Error(`Unexpected reading dependency: ${name}`);
      return dependencies[name];
    }, evaluated, evaluated.exports);
    return evaluated.exports;
  }
  const world = evaluate("./hero-world.ts", {}) as {
    readHeroWorldPose: (root: Surface) => HeroWorldPose | undefined;
  };
  const { mountHeroReading } = evaluate("./hero-reading.ts", {
    "./hero-world": world,
    "./hero-reading-portrait": evaluate("./hero-reading-portrait.ts", {}),
    "./hero-portrait": { mountHeroPortrait: (_root: unknown, options: { signal: AbortSignal; reading: ReadingPortraitState }) =>
      new Promise<PreparedPortrait>((ready) => { graphics.push({ ...options, ready }); }) },
    "@/store/uiStore": { uiStore: { getState: () => state, subscribe(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener); } } },
  }) as { mountHeroReading: (root: Surface) => () => void };
  const events: HeroWorldPose[] = [];
  window.addEventListener("gazzar:hero-world", (event) => events.push((event as CustomEvent<HeroWorldPose>).detail));
  const mount = () => mountHeroReading(root);
  return {
    root, elements, signature, document, window, events, observers, listeners, mount, graphics,
    pose: () => world.readHeroWorldPose(root),
    scroll(value: number) { y = value; window.dispatchEvent(new Event("scroll")); },
    menu(value: boolean) { state.menuOpen = value; listeners.forEach((listener) => listener()); },
    resize(value: number, offset = top) { height = value; top = offset; window.dispatchEvent(new Event("resize")); },
    visibility(hidden: boolean) { document.hidden = hidden; document.dispatchEvent(new Event("visibilitychange")); },
    resolveFonts: () => fontResolve(),
  };
}

async function flushReading() { for (let i = 0; i < 12; i++) await Promise.resolve(); }

test("deferred portrait readiness preserves pending native samples and never fabricates a body wake", async () => {
  const h = harness(), dispose = h.mount();
  await flushReading();
  expect(h.graphics).toHaveLength(1);
  const pending = h.graphics[0], calls: unknown[][] = [];
  h.scroll(1044); // Hidden hero still samples the pending portrait before returning.
  expect(pending.reading.frame).toMatchObject({ resolve: 1, exit: 1, active: false });
  h.visibility(true); h.scroll(348);
  expect(pending.reading.frame.active).toBe(false); // Hidden document skips tU.
  h.visibility(false);
  expect(pending.reading.frame.exit).toBe(h.pose()!.exit);
  pending.reading.prepared();
  pending.ready({ render: (...args) => { calls.push(args); return false; }, measure() {}, dispose() {} });
  await flushReading();
  expect(calls).toHaveLength(0);
  h.scroll(696);
  expect(calls).toEqual([[0, 1, h.pose()?.exit, h.pose()?.pointer, true]]);
  h.scroll(1044);
  expect(calls.at(-1)).toEqual([0, 1, 1, 0, false]);
  dispose();
  expect(pending.signal.aborted).toBe(true);
});

test("reading cleanup cancels preparation and an unstarted deferred import cannot mount a renderer", async () => {
  const h = harness(), dispose = h.mount();
  await flushReading();
  const pending = h.graphics[0];
  dispose();
  expect(pending.signal.aborted).toBe(true);
  let released = 0;
  pending.ready({ render: () => { throw Error("Stale portrait wake"); }, measure() {}, dispose() { released++; } });
  await flushReading();
  expect(released).toBe(1);
  const cancelled = harness(), cancel = cancelled.mount();
  cancel();
  await flushReading();
  expect(cancelled.graphics).toHaveLength(0);
});

test("source reading wakes sample current world and retain the last visible body at hidden .75", () => {
  const h = harness(), dispose = h.mount();
  const copy = h.elements["hero-copy-exit"], bottom = h.elements["hero-bottom"], scene = h.elements["identity-hero"];
  expect(h.pose()?.progress).toBe(0);
  h.scroll(348);
  expect(h.pose()?.progress).toBe(0.25);
  expect(Number(copy.style.opacity)).toBeCloseTo(0.784, 7);
  expect(Number(bottom.style.opacity)).toBeCloseTo(0.04296875, 7);
  h.scroll(696);
  expect(Number(copy.style.opacity)).toBeCloseTo(0.104, 7);
  expect(Number(bottom.style.opacity)).toBe(0);
  const writes = copy.writes;
  h.scroll(1044);
  expect(h.pose()?.progress).toBe(0.75);
  expect(scene.style.opacity).toBe("0");
  expect(scene.style.visibility).toBe("hidden");
  expect(scene.inert).toBe(true);
  expect(copy.writes).toBe(writes);
  h.scroll(348);
  expect(scene.style.opacity).toBe("1");
  expect(scene.inert).toBe(false);
  expect(Number(copy.style.opacity)).toBeCloseTo(0.784, 7);
  dispose();
});

test("deep reading mount publishes exact native precision and hides the scene without inventing a prior body pose", () => {
  const h = harness(1167.123456789), copy = h.elements["hero-copy-exit"];
  copy.style.opacity = "1";
  const dispose = h.mount();
  expect(h.pose()?.progress).toBe(1167.123456789 / 1392);
  expect(h.pose()).toBe(h.events.at(-1));
  expect(h.pose()?.progress).not.toBe(Number(h.root.dataset.heroWorld));
  expect(copy.style.opacity).toBe("1");
  expect(h.elements["identity-hero"].style.opacity).toBe("0");
  h.resize(865, 100);
  h.scroll(532.5);
  expect(h.pose()?.progress).toBe(0.5);
  expect(Number(copy.style.opacity)).toBeCloseTo(0.104, 7);
  dispose();
});

test("hidden documents keep the world publisher current while body waits for visibility", () => {
  const h = harness(), dispose = h.mount(), copy = h.elements["hero-copy-exit"];
  h.visibility(true);
  const writes = copy.writes;
  h.scroll(696);
  expect(h.pose()?.progress).toBe(0.5);
  expect(copy.writes).toBe(writes);
  h.visibility(false);
  expect(Number(copy.style.opacity)).toBeCloseTo(0.104, 7);
  dispose();
});

test("menu pauses both paths and only resumes a pending body wake", () => {
  const h = harness(), dispose = h.mount(), copy = h.elements["hero-copy-exit"];
  h.menu(true);
  h.scroll(348);
  expect(h.pose()?.progress).toBe(0);
  expect(Number(copy.style.opacity)).toBe(1);
  h.menu(false);
  expect(h.pose()?.progress).toBe(0.25);
  expect(Number(copy.style.opacity)).toBeCloseTo(0.784, 7);
  const writes = copy.writes;
  h.menu(true); h.menu(false);
  expect(copy.writes).toBe(writes);
  dispose();
});

test("cleanup restores DOM, removes the publisher and ignores pending fonts/events", async () => {
  const h = harness(348), copy = h.elements["hero-copy-exit"];
  copy.style.opacity = ".9";
  h.elements["hero-portrait"].style.transform = "translateY(5px)";
  const dispose = h.mount();
  expect(h.elements["marquee-pause"].disabled).toBe(true);
  expect(h.elements["hero-portrait"].style.transform).toBe("");
  dispose(); dispose();
  expect(copy.style.opacity).toBe(".9");
  expect(h.elements["hero-portrait"].style.transform).toBe("translateY(5px)");
  expect(h.elements["marquee-pause"].disabled).toBe(false);
  expect(h.root.dataset.heroReading).toBeUndefined();
  expect(h.pose()).toBeUndefined();
  expect(h.listeners.size).toBe(0);
  expect(h.observers.every((observer) => observer.disconnected)).toBe(true);
  const events = h.events.length, writes = copy.writes;
  h.scroll(696); h.resize(865); h.visibility(false); h.resolveFonts();
  await Promise.resolve();
  expect(h.events.length).toBe(events);
  expect(copy.writes).toBe(writes);
});

async function gateHarness({ quiet = false, failed = false, hookReduced = false, osReduced = false, failImport = false, cancel = false } = {}) {
  const state = { quietMode: quiet, homeSceneFailed: failed };
  let effect!: () => (() => void) | undefined;
  let reading = 0, motion = 0, imports = 0, disposed = 0;
  const errors: unknown[] = [];
  const context = createContext({
    window: { matchMedia: () => ({ matches: osReduced }) },
    document: { querySelector: () => ({}) },
    console: { error: (...args: unknown[]) => errors.push(args) },
  });
  const source = readFileSync(new URL("./hero-animate-gate.logic.ts", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const evaluated = { exports: {} as { useHeroMotion: () => void } };
  const dependencies: Record<string, unknown> = {
    react: { useEffect: (callback: typeof effect) => { effect = callback; } },
    "@/lib/useReducedMotion": { useReducedMotion: () => hookReduced },
    "@/store/uiStore": { useUIStore: (selector: (value: typeof state) => unknown) => selector(state) },
    "./hero-reading": { mountHeroReading: () => { reading++; return () => { disposed++; }; } },
  };
  runInContext(`(function(require, module, exports) { ${compiled}\n })`, context)((name: string) => {
    if (name === "./hero.animate") {
      imports++;
      if (failImport) throw new Error("Blocked hero controller chunk");
      return { mountHeroMotion: () => { motion++; return () => { disposed++; }; } };
    }
    if (!(name in dependencies)) throw new Error(`Unexpected gate dependency: ${name}`);
    return dependencies[name];
  }, evaluated, evaluated.exports);
  evaluated.exports.useHeroMotion();
  const cleanup = effect();
  if (cancel) cleanup?.();
  for (let i = 0; i < 8; i++) await Promise.resolve();
  return { reading, motion, imports, errors, cleanup, get disposed() { return disposed; } };
}

for (const [label, options] of [
  ["quiet", { quiet: true }], ["scene failure", { failed: true }],
  ["reduced hook", { hookReduced: true }], ["OS reduced during hydration", { osReduced: true }],
] as const) test(`gate selects lightweight ${label} without importing optional motion`, async () => {
  const gate = await gateHarness(options);
  expect(gate.reading).toBe(1);
  expect(gate.imports).toBe(0);
  expect(gate.motion).toBe(0);
  gate.cleanup?.();
  expect(gate.disposed).toBe(1);
});

test("optional chunk failure starts reading; a cancelled import starts neither controller", async () => {
  const failed = await gateHarness({ failImport: true });
  expect(failed.reading).toBe(1);
  expect(failed.motion).toBe(0);
  expect(failed.errors.length).toBe(1);
  failed.cleanup?.();
  expect(failed.disposed).toBe(1);
  for (const failImport of [false, true]) {
    const cancelled = await gateHarness({ failImport, cancel: true });
    expect(cancelled.reading).toBe(0);
    expect(cancelled.motion).toBe(0);
    expect(cancelled.errors.length).toBe(0);
  }
});

test("eligible normal motion keeps its existing deferred controller", async () => {
  const gate = await gateHarness();
  expect(gate.imports).toBe(1);
  expect(gate.motion).toBe(1);
  expect(gate.reading).toBe(0);
  gate.cleanup?.();
  expect(gate.disposed).toBe(1);
});
