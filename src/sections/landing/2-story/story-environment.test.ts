import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createContext, runInContext, type Context } from "node:vm";
import ts from "typescript";
import * as three from "three";
import * as heroWorld from "../1-hero/hero-world";
import { createEnvironmentField } from "./story-environment-field";
import type { createEnvironmentPointer } from "./story-environment-pointer";
import type { StoryEnvironmentController } from "./story-environment.animate";
import { createMaterialProtection } from "./story-material-protection";
import * as score from "./story-score";

// Execute the real controller/input code against a CPU renderer and event surface.
// No browser, WebGL context, source bundle execution or global module mocks.
function evaluate(file: string, context: Context, dependencies: Record<string, unknown>, tail = "") {
  const source = readFileSync(new URL(file, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText;
  const evaluated = { exports: {} as Record<string, unknown> };
  const require = (name: string) => {
    if (!(name in dependencies)) throw new Error(`Unexpected test dependency: ${name}`);
    return dependencies[name];
  };
  const value = runInContext(`(function(require, module, exports) { ${compiled}\n${tail}\n})`, context)(require, evaluated, evaluated.exports);
  return { exports: evaluated.exports, value };
}

class Surface extends EventTarget {
  dataset: Record<string, string> = {};
  className = "";
  children: Surface[] = [];
  parentElement: Surface | null = null;
  removed = false;
  style = { visibility: "", removeProperty: (key: string) => { if (key === "visibility") this.style.visibility = ""; } };
  append(child: Surface) { child.parentElement = this; this.children.push(child); }
  prepend(child: Surface) { child.parentElement = this; this.children.unshift(child); }
  remove() { this.removed = true; if (this.parentElement) this.parentElement.children = this.parentElement.children.filter((child) => child !== this); }
  setAttribute() {}
  closest(selector: string): Surface | null { return this.parentElement?.closest(selector) ?? null; }
  querySelector(): Surface | null { return null; }
}

function environmentHarness({ reduced = false, simulate = true, failCreation = false, failMeasure = false, initialHeroProgress = undefined as number | undefined } = {}) {
  const page = new Surface(), owner = new Surface(), stage = new Surface();
  const heroRoot = Object.assign(new Surface(), { offsetHeight: 1000, getBoundingClientRect: () => ({ top: 0 }) });
  page.querySelector = () => heroRoot;
  stage.closest = (selector) => selector === "main" ? page : selector === ".experience" ? owner : null;
  const document = Object.assign(new EventTarget(), {
    hidden: false, documentElement: new Surface(), createElement: () => new Surface(), getElementById: () => stage,
  });
  const window = new EventTarget();
  const publisher = heroWorld.createHeroWorldPublisher(heroRoot as unknown as HTMLElement, window);
  if (initialHeroProgress !== undefined) publisher.publish(heroWorld.heroWorldPose(initialHeroProgress));
  const fine = Object.assign(new EventTarget(), { matches: true });
  const rafs = new Map<number, FrameRequestCallback>(), timers = new Map<number, { callback: () => void; delay: number }>();
  let serial = 0, now = 1000, renders = 0, rendererDisposals = 0, contextLosses = 0, creations = 0, throwRender = false;
  const intersections: { callback: (entries: { isIntersecting: boolean }[]) => void; disposed: number }[] = [];
  const mutations: { callback: () => void; disposed: number }[] = [];
  const fields: { field: ReturnType<typeof createEnvironmentField>; clears: number; advances: number; disposals: number }[] = [];
  const pointers: ReturnType<typeof createEnvironmentPointer>[] = [];
  const surfaces: three.Mesh<three.PlaneGeometry, three.ShaderMaterial>[] = [];
  const errors: unknown[][] = [];
  const dimensions: number[][] = [];
  class Renderer {
    outputColorSpace = "";
    extensions = { has: () => simulate };
    target: three.WebGLRenderTarget | null = null;
    constructor() { creations++; if (failCreation) throw new Error("No context"); }
    getRenderTarget() { return this.target; }
    setRenderTarget(target: three.WebGLRenderTarget | null) { this.target = target; }
    getClearAlpha() { return 0; }
    getClearColor(color: three.Color) { return color.set(0); }
    setClearColor() {}
    clear() {}
    setPixelRatio() {}
    setSize(width: number, height: number) { if (failMeasure) throw new Error("Cannot resize"); dimensions.push([width, height]); }
    render(scene: three.Scene) {
      if (throwRender) throw new Error("Optional material draw failed");
      renders++;
      const mesh = scene.children[0] as three.Mesh<three.PlaneGeometry, three.ShaderMaterial>;
      if (mesh.material.uniforms.uTime && !surfaces.includes(mesh)) surfaces.push(mesh);
    }
    dispose() { rendererDisposals++; }
    forceContextLoss() { contextLosses++; }
  }
  const requestAnimationFrame = (callback: FrameRequestCallback) => { const id = ++serial; rafs.set(id, callback); return id; };
  const cancelAnimationFrame = (id: number) => { rafs.delete(id); };
  const setTimeout = (callback: () => void, delay: number) => { const id = ++serial; timers.set(id, { callback, delay }); return id; };
  const clearTimeout = (id: number) => { timers.delete(id); };
  Object.assign(window, { setTimeout, clearTimeout, requestAnimationFrame, cancelAnimationFrame });
  const context = createContext({
    window, document, innerWidth: 1360, innerHeight: 1000, devicePixelRatio: 1, scrollY: 0,
    performance: { now: () => now }, Element: Surface, console: { error: (...args: unknown[]) => errors.push(args) },
    requestAnimationFrame, cancelAnimationFrame, setTimeout, clearTimeout, matchMedia: () => fine,
    IntersectionObserver: class {
      record: typeof intersections[number];
      constructor(callback: typeof intersections[number]["callback"]) { this.record = { callback, disposed: 0 }; intersections.push(this.record); }
      observe() {}
      disconnect() { this.record.disposed++; }
    },
    MutationObserver: class {
      record: typeof mutations[number];
      constructor(callback: () => void) { this.record = { callback, disposed: 0 }; mutations.push(this.record); }
      observe() {}
      disconnect() { this.record.disposed++; }
    },
  });
  const pointerModule = evaluate("./story-environment-pointer.ts", context, {
    "./story-score": score, "./story-material-protection": { createMaterialProtection },
  }).exports as { createEnvironmentPointer: typeof createEnvironmentPointer };
  const loaded = evaluate("./story-environment.animate.ts", context, {
    three: { ...three, WebGLRenderer: Renderer }, "./story-score": score,
    "../1-hero/hero-world": heroWorld,
    "./story-environment-pointer": { createEnvironmentPointer(wake: () => void) {
      const pointer = pointerModule.createEnvironmentPointer(wake); pointers.push(pointer); return pointer;
    } },
    "./story-environment-field": { createEnvironmentField(aspect: number, mobile: boolean) {
      const field = createEnvironmentField(aspect, mobile), record = { field, clears: 0, advances: 0, disposals: 0 };
      const clear = field.clear, advance = field.advance, dispose = field.dispose;
      field.clear = (renderer) => { record.clears++; clear.call(field, renderer); };
      field.advance = (renderer, dt) => { record.advances++; advance.call(field, renderer, dt); };
      field.dispose = () => { record.disposals++; dispose(); };
      fields.push(record); return field;
    } },
    "./story-environment-shaders": { environmentVertex: "", environmentFragment: "" },
    "./story-scene.module.css": {},
  }).exports as {
    createStoryEnvironment(stage: unknown, options: { reduced: boolean }): StoryEnvironmentController;
    mountStoryEnvironment(stage: unknown): () => void;
  };
  const controller = loaded.createStoryEnvironment(stage, { reduced });
  const event = (type: string, properties: Record<string, unknown> = {}) => window.dispatchEvent(Object.assign(new Event(type), properties));
  return {
    controller, module: loaded, stage, owner, fields, pointers, surfaces, dimensions, rafs, timers, errors,
    get stats() { return { creations, renders, rendererDisposals, contextLosses }; },
    get canvas() { return owner.children[0].children[0]; },
    step(dt = 1 / 60) { now += dt * 1000; const pending = [...rafs.values()]; rafs.clear(); for (const callback of pending) callback(now); },
    timer() { const [id, timer] = timers.entries().next().value!; timers.delete(id); timer.callback(); },
    event,
    hero(progress: number) { publisher.publish(heroWorld.heroWorldPose(progress)); },
    frame(time: number, openingTime = 26) {
      const detail = { time, openingTime, progress: (openingTime + time) / 740 };
      Object.assign(stage.dataset, { storyTime: String(time), openingTime: String(openingTime), progress: String(detail.progress) });
      stage.dispatchEvent(Object.assign(new Event("journey-frame"), { detail }));
    },
    resize(width = context.innerWidth, height = context.innerHeight) { context.innerWidth = width; context.innerHeight = height; event("resize"); },
    dpr(value: number) { context.devicePixelRatio = value; event("resize"); },
    hidden(value: boolean) { document.hidden = value; document.dispatchEvent(new Event("visibilitychange")); },
    menu(value: boolean) { document.documentElement.dataset.menuOpen = String(value); for (const entry of mutations) entry.callback(); },
    visible(value: boolean) { for (const entry of intersections) entry.callback([{ isIntersecting: value }]); },
    lose() { owner.children[0].children[0].dispatchEvent(new Event("webglcontextlost", { cancelable: true })); },
    restore() { owner.children[0].children[0].dispatchEvent(new Event("webglcontextrestored")); },
    failDraw() { throwRender = true; },
    get disconnected() { return intersections.every((entry) => entry.disposed === 1) && mutations.every((entry) => entry.disposed === 1); },
  };
}

test("source reduced-prop updates retain material time, pointer, targets and wave/stroke memory", () => {
  const h = environmentHarness();
  h.event("pointermove", { pointerType: "mouse", clientX: 1088, clientY: 300 });
  h.event("pointerdown", { pointerType: "mouse", clientX: 1088, clientY: 300, pointerId: 1, button: 0 });
  h.step();
  const field = h.fields[0], pointer = h.pointers[0], surface = h.surfaces[0], geometry = surface.geometry;
  const time = surface.material.uniforms.uTime.value as number, pulse = field.field.uniforms.uPulse.value.clone();
  const x = pointer.state.fieldX, cell = surface.material.uniforms.uCell.value;
  expect(x).toBeGreaterThan(0); expect(pulse.z).toBeGreaterThan(0);
  expect(field.clears).toBe(1);
  // The reference keeps w.current and useMemo([aspect,mobile]) through reduced.
  h.controller.setReducedMode(true); h.controller.setReducedMode(true);
  expect(h.rafs.size).toBe(1); expect(h.timers.size).toBe(0); h.step();
  expect(h.fields).toHaveLength(1); expect(h.pointers).toHaveLength(1); expect(h.stats.creations).toBe(1);
  expect(h.surfaces[0]).toBe(surface); expect(surface.geometry).toBe(geometry); expect(surface.material.uniforms.uCell.value).toBe(cell);
  expect(surface.material.uniforms.uTime.value - time).toBeCloseTo(0.035 / 60, 10);
  expect(pointer.state.fieldX).toBe(x); expect(field.clears).toBe(1);
  expect(pointer.state.hovering).toBe(false); expect(pointer.state.pressed).toBe(false); expect(pointer.state.targetX).toBe(0);
  expect(field.field.uniforms.uStroke.value.x).toBeCloseTo(x * 1.36, 10);
  expect(field.field.uniforms.uPulse.value.x).toBe(pulse.x); expect(field.field.uniforms.uPulse.value.y).toBe(pulse.y);
  expect(field.field.uniforms.uPulse.value.z / pulse.z).toBeCloseTo(0.32 * Math.exp(-10 / 60), 10);
  const reducedTime = surface.material.uniforms.uTime.value as number;
  h.controller.setReducedMode(false); h.step();
  expect(surface.material.uniforms.uTime.value - reducedTime).toBeCloseTo(1 / 60, 10);
  expect(field.clears).toBe(1); h.controller.dispose();
});

test("reading selects source zero narrative and resumes the current DOM/event clock without losing field/time", () => {
  const h = environmentHarness(); h.frame(174); h.step();
  const field = h.fields[0], surface = h.surfaces[0], material = surface.material;
  const time = material.uniforms.uTime.value as number, clears = field.clears;
  expect(material.uniforms.uStage.value).toBeGreaterThan(0.9); expect(field.field.uniforms.uQuiet.value).toBe(0.45);
  h.controller.setReducedMode(true); h.step();
  expect(material.uniforms.uStage.value).toBe(0); expect(field.field.uniforms.uQuiet.value).toBe(0);
  expect(material.uniforms.uTime.value - time).toBeCloseTo(0.035 / 60, 10);
  expect(h.fields).toHaveLength(1); expect(field.clears).toBe(clears); expect(field.disposals).toBe(0);
  h.frame(220); // A stale/late motion event cannot replace the reading narrative.
  expect(material.uniforms.uStage.value).toBe(0); expect(field.field.uniforms.uQuiet.value).toBe(0);
  h.controller.setReducedMode(false);
  // Parent layout can refresh silently after the mode setter, before its RAF.
  h.stage.dataset.storyTime = "98"; h.stage.dataset.openingTime = "26"; h.step();
  expect(material.uniforms.uStage.value).toBeCloseTo(score.sampleStoryScore({ time: 98, openingTime: 26, progress: 0 }).environment, 14);
  h.controller.setReducedMode(true); h.hidden(true); const draws = h.stats.renders;
  h.controller.setReducedMode(false); h.frame(128.123456789);
  expect(h.stats.renders).toBe(draws); expect(h.rafs.size + h.timers.size).toBe(0);
  // Event detail wins over the rounded DOM snapshot when it arrives after resume.
  h.stage.dataset.storyTime = "128.12"; h.hidden(false); h.step();
  expect(material.uniforms.uStage.value).toBeCloseTo(score.sampleStoryScore({ time: 128.123456789, openingTime: 26, progress: 0 }).environment, 14);
  expect(h.fields).toHaveLength(1); expect(field.clears).toBe(clears); expect(material.uniforms.uTime.value).toBeGreaterThan(time);
  h.controller.dispose();
  const cold = environmentHarness({ reduced: true }); cold.frame(174); cold.step();
  expect(cold.surfaces[0].material.uniforms.uStage.value).toBe(0); expect(cold.fields[0].field.uniforms.uQuiet.value).toBe(0);
  cold.controller.dispose();
});

test("background gain/presence use the published displayed hero clock, never opening/raw input", () => {
  const progress = 0.430123456789, h = environmentHarness({ initialHeroProgress: progress });
  h.event("pointerdown", { pointerType: "mouse", clientX: 1000, clientY: 400, pointerId: 1, button: 0 }); h.step();
  const material = h.surfaces[0].material, field = h.fields[0].field, pointer = h.pointers[0];
  const expectPose = (p: number) => {
    const blend = score.smooth(0.25, 0.72, p);
    expect(material.uniforms.uAmplitude.value).toBeCloseTo(0.86 + 0.14 * blend, 14);
    expect(field.uniforms.uPress.value / pointer.state.press).toBeCloseTo(Math.max(0.48, 0.42 + 0.58 * blend), 14);
  };
  expectPose(progress); // Late boot reads the publisher's full precision WeakMap.
  h.event("gazzar:hero-world-input", { detail: { progress: 1 } });
  h.frame(0, 26); expectPose(progress);
  h.hero(0.55); h.step(); expectPose(0.55);
  h.frame(0, 0); expectPose(0.55);
  h.hero(0.32); h.step(); expectPose(0.32);
  expect(h.fields).toHaveLength(1); expect(h.stats.creations).toBe(1); h.controller.dispose();
});

test("source allocation keys preserve no-op/same-aspect/DPR history and replace only the changed field/grid", () => {
  const h = environmentHarness();
  h.event("pointerdown", { pointerType: "mouse", clientX: 1000, clientY: 400, pointerId: 1, button: 0 }); h.step();
  const first = h.fields[0], mesh = h.surfaces[0], geometry = mesh.geometry, material = mesh.material;
  let gridDisposals = 0; geometry.addEventListener("dispose", () => gridDisposals++);
  const pointerX = h.pointers[0].state.fieldX;
  h.resize();
  expect(h.pointers[0].state.fieldX).toBe(pointerX); expect(h.fields).toHaveLength(1); expect(first.disposals).toBe(0);
  h.step(); expect(first.clears).toBe(1);
  h.resize(2720, 2000); h.step();
  h.dpr(2); h.step();
  expect(h.fields).toHaveLength(1); expect(mesh.geometry).toBe(geometry); expect(first.clears).toBe(1);
  expect(h.dimensions.at(-1)).toEqual([2720, 2000]);
  // An aspect change reallocates even if the rounded target width is unchanged.
  h.resize(1361, 1000); expect(h.fields).toHaveLength(2); expect(first.disposals).toBe(1);
  expect(h.fields[1].field.uniforms.uCell.value.x).toBe(first.field.uniforms.uCell.value.x);
  expect(mesh.geometry).toBe(geometry); expect(gridDisposals).toBe(0); h.step();
  expect(h.fields[1].clears).toBe(1); expect(h.fields[1].advances).toBe(1);
  expect(material.uniforms.uAspect.value).toBe(1.361);
  h.resize(800, 1000); h.step(); const desktop = h.fields.at(-1)!;
  h.resize(640, 800); // Same .8 aspect, different mobile key / geometry args.
  expect(desktop.disposals).toBe(1); expect(mesh.geometry).not.toBe(geometry); expect(gridDisposals).toBe(1);
  expect(mesh.geometry.parameters.widthSegments).toBe(96); expect(mesh.geometry.parameters.heightSegments).toBe(96);
  expect(mesh.material).toBe(material); h.step(); h.controller.dispose(); h.controller.dispose();
  expect(h.fields.every((entry) => entry.disposals === 1)).toBe(true);
  expect(h.stats.rendererDisposals).toBe(1); expect(h.stats.contextLosses).toBe(1);
});

test("mode, resize and context restore submit no hidden/menu/offscreen GPU work and clean up once", () => {
  const h = environmentHarness(); h.step();
  const field = h.fields[0], materialTime = Number(h.canvas.dataset.materialTime);
  h.hidden(true); const hiddenRenders = h.stats.renders, hiddenClears = field.clears;
  h.controller.setReducedMode(true); h.resize(); h.lose(); h.restore();
  expect(h.fields).toHaveLength(1); expect(field.clears).toBe(hiddenClears);
  expect(h.stats.renders).toBe(hiddenRenders); expect(h.rafs.size + h.timers.size).toBe(0);
  h.hidden(false); h.step();
  expect(Number(h.canvas.dataset.materialTime)).toBeGreaterThan(materialTime);
  expect(h.stats.creations).toBe(1); expect(field.clears).toBe(hiddenClears + 1);
  h.menu(true); const pausedRenders = h.stats.renders;
  h.controller.setReducedMode(false); h.resize(1362, 1000);
  expect(h.fields.at(-1)!.clears).toBe(0); expect(h.stats.renders).toBe(pausedRenders);
  expect(h.rafs.size + h.timers.size).toBe(0);
  h.menu(false); h.step(); h.visible(false); const offscreenRenders = h.stats.renders;
  h.controller.setReducedMode(true); h.resize(1364, 1000);
  expect(h.fields.at(-1)!.clears).toBe(0); expect(h.stats.renders).toBe(offscreenRenders);
  expect(h.rafs.size + h.timers.size).toBe(0);
  h.visible(true); h.step(); h.controller.dispose(); h.controller.dispose();
  h.event("pointermove", { pointerType: "mouse", clientX: 1000, clientY: 300 }); h.resize(); h.hidden(false); h.menu(false);
  expect(h.disconnected).toBe(true); expect(h.owner.children).toHaveLength(0);
  expect(h.rafs.size + h.timers.size).toBe(0); expect(h.stage.dataset.storyEnvironment).toBeUndefined();
  expect(h.fields.every((entry) => entry.disposals === 1)).toBe(true);
  expect(h.stats.rendererDisposals).toBe(1); expect(h.stats.contextLosses).toBe(1);
});

test("visible idle changes cadence through one scheduler, and optional failures retain cleanup ownership", () => {
  const h = environmentHarness(); h.step();
  // Initial work travel is itself an input impulse; let its six-second tail end.
  for (let i = 0; i < 140; i++) { if (!h.rafs.size) h.timer(); h.step(0.05); }
  expect([...h.timers.values()][0].delay).toBeCloseTo(1000 / 24, 10);
  h.controller.setReducedMode(true); expect(h.timers.size).toBe(0); h.step();
  expect([...h.timers.values()][0].delay).toBe(250);
  h.timer(); h.failDraw(); h.step();
  expect(h.stage.dataset.storyEnvironment).toBe("failed"); expect(h.errors).toHaveLength(1);
  expect(h.rafs.size + h.timers.size).toBe(0); h.controller.setReducedMode(false);
  expect(h.rafs.size + h.timers.size).toBe(0);
  h.controller.dispose(); h.controller.dispose(); expect(h.stats.rendererDisposals).toBe(1); expect(h.stats.contextLosses).toBe(1);
  const noFloat = environmentHarness({ simulate: false }); noFloat.step();
  expect(noFloat.canvas.dataset.simulation).toBe("rest"); expect(noFloat.fields[0].clears).toBe(0);
  noFloat.controller.dispose();
  const failed = environmentHarness({ failCreation: true });
  expect(failed.owner.children).toHaveLength(0); expect(failed.fields).toHaveLength(0);
  expect(failed.stage.dataset.storyEnvironment).toBe("failed");
  failed.controller.setReducedMode(true); failed.controller.dispose(); failed.controller.dispose();
  expect(failed.stage.dataset.storyEnvironment).toBeUndefined(); expect(failed.stats.contextLosses).toBe(0);
  const resizeFailed = environmentHarness({ failMeasure: true });
  expect(resizeFailed.stage.dataset.storyEnvironment).toBe("failed"); expect(resizeFailed.errors).toHaveLength(1);
  expect(resizeFailed.rafs.size + resizeFailed.timers.size).toBe(0);
  resizeFailed.controller.dispose(); resizeFailed.controller.dispose();
  expect(resizeFailed.stats.rendererDisposals).toBe(1); expect(resizeFailed.stats.contextLosses).toBe(1);
  expect(resizeFailed.fields[0].disposals).toBe(1);
});

function gateHarness() {
  type Effect = () => void | (() => void);
  type Slot = { ref?: { current: unknown }; value?: unknown; deps?: readonly unknown[]; cleanup?: () => void };
  const slots: Slot[] = [], pending: (() => void)[] = [], idle = new Map<number, () => void>();
  let index = 0, id = 0, calls = 0, disposals = 0;
  const modes: boolean[] = [];
  const stage = {};
  const hooks = {
    useRef<T>(initial: T) { const slot = slots[index++] ??= {}; return (slot.ref ??= { current: initial }) as { current: T }; },
    useState<T>(initial: T): [T, (next: T) => void] { const slot = slots[index++] ??= { value: initial }; return [slot.value as T, (next) => { slot.value = next; }]; },
    useEffect(effect: Effect, deps: readonly unknown[]) {
      const slot = slots[index++] ??= {};
      if (slot.deps && slot.deps.length === deps.length && slot.deps.every((dep, i) => Object.is(dep, deps[i]))) return;
      slot.deps = deps; pending.push(() => { slot.cleanup?.(); slot.cleanup = effect() || undefined; });
    },
  };
  const context = createContext({
    window: { requestIdleCallback(callback: () => void) { const key = ++id; idle.set(key, callback); return key; }, cancelIdleCallback(key: number) { idle.delete(key); } },
    document: { getElementById: () => stage }, console,
  });
  const { value: mount } = evaluate("./story-scene-gate.tsx", context, {
    react: hooks, "react/jsx-runtime": {},
    "@/lib/scene/sceneActivation": { useSceneActivation: () => ({ shouldMount: false }) },
    "@/lib/scene/sceneBootGate": { useSceneBootSlot: () => false },
    "@/lib/useReducedMotion": {}, "@/store/uiStore": {},
    "./story-environment.animate": { createStoryEnvironment(_stage: unknown, { reduced }: { reduced: boolean }) {
      calls++; modes.push(reduced); return { setReducedMode(mode: boolean) { modes.push(mode); }, dispose() { disposals++; } };
    } },
  }, "return StorySceneMount;") as { value: (props: { staticMode: boolean; onFailure(): void }) => null };
  return {
    modes, idle,
    get calls() { return calls; }, get disposals() { return disposals; },
    render(staticMode: boolean) { index = 0; mount({ staticMode, onFailure() {} }); for (const effect of pending.splice(0)) effect(); },
    start() { for (const callback of idle.values()) callback(); idle.clear(); },
    dispose() { for (const slot of slots) slot.cleanup?.(); },
  };
}

test("gate reads latest mode across idle/import, retains its handle, and cancels late imports", async () => {
  const h = gateHarness(); h.render(false); h.render(true);
  expect(h.idle.size).toBe(1); expect(h.calls).toBe(0);
  h.start(); h.render(false); await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  expect(h.calls).toBe(1); expect(h.modes).toEqual([false]);
  h.render(true); h.render(false); expect(h.calls).toBe(1); expect(h.modes).toEqual([false, true, false]);
  h.dispose(); expect(h.disposals).toBe(1);
  const cancelled = gateHarness(); cancelled.render(false); cancelled.start(); cancelled.dispose();
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  expect(cancelled.calls).toBe(0); expect(cancelled.disposals).toBe(0);
  const idleUnmount = gateHarness(); idleUnmount.render(true); idleUnmount.dispose();
  expect(idleUnmount.idle.size).toBe(0); expect(idleUnmount.calls).toBe(0);
});
