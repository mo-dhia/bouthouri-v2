import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createContext, runInContext, type Context } from "node:vm";
import ts from "typescript";
import * as three from "three";
import * as heroWorld from "../1-hero/hero-world";
import { createEnvironmentField } from "./story-environment-field";
import type { createEnvironmentPointer } from "./story-environment-pointer";
import type { EnvironmentBinding, PersistentStoryEnvironmentController, StoryEnvironmentController } from "./story-environment.animate";
import { createMaterialProtection } from "./story-material-protection";
import * as score from "./story-score";
import * as journeyRender from "../3-journey/journey-render-owner";
import * as viewport from "@/lib/viewport-design";

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
  connected = false;
  get isConnected(): boolean { return !this.removed && (this.parentElement?.isConnected ?? this.connected); }
  style = { visibility: "", removeProperty: (key: string) => { if (key === "visibility") this.style.visibility = ""; } };
  private adopt(child: Surface) { if (child.parentElement) child.parentElement.children = child.parentElement.children.filter((entry) => entry !== child); child.parentElement = this; child.removed = false; }
  append(child: Surface) { this.adopt(child); this.children.push(child); }
  prepend(child: Surface) { this.adopt(child); this.children.unshift(child); }
  remove() { this.removed = true; if (this.parentElement) this.parentElement.children = this.parentElement.children.filter((child) => child !== this); this.parentElement = null; }
  contains(child: Surface): boolean { return child === this || this.children.some((entry) => entry.contains(child)); }
  setAttribute() {}
  closest(selector: string): Surface | null { return this.parentElement?.closest(selector) ?? null; }
  querySelector(): Surface | null { return null; }
}

function environmentHarness({ reduced = false, simulate = true, failCreation = false, failMeasure = false, persistent = false, initialHeroProgress = undefined as number | undefined, initialStoryTime = 0, initialWorkTravel = -1.35 } = {}) {
  const page = new Surface(), owner = new Surface(), stage = new Surface(), parking = new Surface();
  page.connected = owner.connected = parking.connected = true;
  const work = new Surface(); work.dataset.travel = String(initialWorkTravel); stage.querySelector = () => work;
  stage.dataset.storyTime = String(initialStoryTime);
  const heroRoot = Object.assign(new Surface(), { offsetHeight: 1000, getBoundingClientRect: () => ({ top: 0 }) });
  page.querySelector = () => heroRoot;
  stage.closest = (selector) => selector === "main" ? page : selector === ".experience" ? owner : null;
  const document = Object.assign(new EventTarget(), {
    hidden: false, documentElement: new Surface(), createElement: () => Object.assign(new Surface(), {
      getBoundingClientRect: () => ({ left: 0, top: 0, width: context.innerWidth, height: viewport.designHeight(context.innerWidth) }),
    }), getElementById: () => stage,
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
  const backgroundDraws: { stage: number; time: number }[] = [];
  const errors: unknown[][] = [];
  const dimensions: number[][] = [];
  const renderTargets = new Set<three.WebGLRenderTarget>();
  class Renderer {
    outputColorSpace = "";
    extensions = { has: () => simulate };
    target: three.WebGLRenderTarget | null = null;
    constructor() { creations++; if (failCreation) throw new Error("No context"); }
    getRenderTarget() { return this.target; }
    setRenderTarget(target: three.WebGLRenderTarget | null) { this.target = target; if (target) renderTargets.add(target); }
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
      if (mesh.material.uniforms.uTime) {
        if (!surfaces.includes(mesh)) surfaces.push(mesh);
        backgroundDraws.push({ stage: mesh.material.uniforms.uStage.value, time: mesh.material.uniforms.uTime.value });
      }
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
    "@/lib/viewport-design": viewport,
  }).exports as { createEnvironmentPointer: typeof createEnvironmentPointer };
  const loaded = evaluate("./story-environment.animate.ts", context, {
    three: { ...three, WebGLRenderer: Renderer }, "./story-score": score,
    "../1-hero/hero-world": heroWorld,
    "../3-journey/journey-render-owner": journeyRender,
    "@/lib/viewport-design": viewport,
    "./story-environment-pointer": { createEnvironmentPointer(...args: Parameters<typeof createEnvironmentPointer>) {
      const pointer = pointerModule.createEnvironmentPointer(...args); pointers.push(pointer); return pointer;
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
    createPersistentStoryEnvironment(parking: unknown, options: { reduced: boolean }): PersistentStoryEnvironmentController;
    mountStoryEnvironment(stage: unknown): () => void;
  };
  const homeBinding = { kind: "home", stage, page, owner, heroRoot } as unknown as EnvironmentBinding;
  const controller = persistent ? loaded.createPersistentStoryEnvironment(parking, { reduced }) : loaded.createStoryEnvironment(stage, { reduced });
  const initialAttachment = persistent ? (controller as PersistentStoryEnvironmentController).bind(homeBinding) : undefined;
  const host = owner.children[0];
  const event = (type: string, properties: Record<string, unknown> = {}) => window.dispatchEvent(Object.assign(new Event(type), properties));
  return {
    controller, module: loaded, stage, work, page, owner, parking, host, homeBinding, initialAttachment, fields, pointers, surfaces, backgroundDraws, dimensions, renderTargets, rafs, timers, errors,
    bind(binding: EnvironmentBinding) { return (controller as PersistentStoryEnvironmentController).bind(binding); },
    get stats() { return { creations, renders, rendererDisposals, contextLosses }; },
    get canvas() { return host.children[0]; },
    step(dt = 1 / 60, after?: () => void, rafOffsetMs = 0) {
      now += dt * 1000;
      const pending = [...rafs];
      for (const [id, callback] of pending) {
        if (!rafs.has(id)) continue;
        rafs.delete(id); callback(now + rafOffsetMs);
      }
      after?.();
    },
    requestAnimationFrame,
    timer() { const [id, timer] = timers.entries().next().value!; timers.delete(id); timer.callback(); },
    event,
    scroll(value: number) { context.scrollY = value; event("scroll"); },
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
    observed(index: number, value: boolean) { intersections[index].callback([{ isIntersecting: value }]); },
    lose() { host.children[0].dispatchEvent(new Event("webglcontextlost", { cancelable: true })); },
    restore() { host.children[0].dispatchEvent(new Event("webglcontextrestored")); },
    failDraw() { throwRender = true; },
    get disconnected() { return intersections.every((entry) => entry.disposed === 1) && mutations.every((entry) => entry.disposed === 1); },
  };
}

test("external publications coalesce into one demand draw when the journey ticker is asleep", () => {
  const h = environmentHarness();
  h.frame(98.123456789); h.frame(174.987654321);
  expect(h.backgroundDraws).toHaveLength(0); expect(h.rafs.size).toBe(1);
  h.step();
  expect(h.backgroundDraws).toHaveLength(1);
  expect(h.backgroundDraws[0].stage).toBeCloseTo(score.sampleStoryScore({ time: 174.987654321, openingTime: 26, progress: 0 }).environment, 14);
  const firstTime = h.backgroundDraws[0].time;
  // Reproduce R15's callback order: the old settling pose draws first, then
  // the journey publishes later in the same refresh. Do not draw it twice.
  h.step(1 / 60, () => { h.frame(40); h.frame(128.123456789); });
  expect(h.backgroundDraws).toHaveLength(2); expect(h.rafs.size).toBe(1);
  expect(h.backgroundDraws[1].time - firstTime).toBeCloseTo(1 / 60, 12);
  h.step();
  expect(h.backgroundDraws).toHaveLength(3);
  expect(h.backgroundDraws[2].stage).toBeCloseTo(score.sampleStoryScore({ time: 128.123456789, openingTime: 26, progress: 0 }).environment, 14);
  expect(h.backgroundDraws[2].time - h.backgroundDraws[1].time).toBeCloseTo(1 / 60, 12);
  h.hidden(true); h.frame(40); h.hero(0.6);
  expect(h.rafs.size + h.timers.size).toBe(0); expect(h.backgroundDraws).toHaveLength(3);
  h.hidden(false); h.step(); expect(h.backgroundDraws).toHaveLength(4);
  expect(h.backgroundDraws[3].stage).toBeCloseTo(score.sampleStoryScore({ time: 40, openingTime: 26, progress: 0 }).environment, 14);
  h.controller.dispose(); expect(h.rafs.size + h.timers.size).toBe(0);
});

test("recurring journey ticks submit the current pose once, preempt old settling and release idle ownership", () => {
  const h = environmentHarness(); h.step();
  const field = h.fields[0];
  expect(h.backgroundDraws).toHaveLength(1); expect(h.rafs.size).toBe(1);
  const owner = journeyRender.createJourneyRenderOwner(h.stage as unknown as HTMLElement);
  const samples = [128.123456789, 136.4753, 142.4567, 159.3256, 151.75, 135.25, 128.5];
  let cursor = 0;
  const tick = () => {
    const time = samples[cursor++];
    owner.render(() => {
      const before = h.backgroundDraws.length;
      h.work.dataset.travel = String(-1.35 + cursor * 0.01);
      h.frame(time);
      expect(h.backgroundDraws).toHaveLength(before + 1);
      expect(h.backgroundDraws.at(-1)!.stage).toBeCloseTo(score.sampleStoryScore({ time, openingTime: 26, progress: 0 }).environment, 14);
      expect(h.rafs.size + h.timers.size).toBe(0);
    });
    if (cursor < samples.length) h.requestAnimationFrame(tick);
    else owner.setPending(false);
  };
  // First real scroll preempts the RAF already queued by the physical tail,
  // before the parent's first callback; no stale old-pose draw can run first.
  owner.setPending(true); expect(h.rafs.size + h.timers.size).toBe(0);
  h.requestAnimationFrame(tick);
  let lastTime = h.backgroundDraws.at(-1)!.time;
  for (let i = 0; i < samples.length; i++) {
    const advances = field.advances;
    h.step();
    expect(h.backgroundDraws).toHaveLength(i + 2); expect(field.advances).toBe(advances + 1);
    const time = h.backgroundDraws.at(-1)!.time;
    expect(time - lastTime).toBeCloseTo(1 / 60, 12); lastTime = time;
    expect(h.rafs.size).toBe(1); expect(h.timers.size).toBe(0);
  }
  // Only the final parent tick releases a standalone physical-settling draw.
  h.step(); expect(h.backgroundDraws).toHaveLength(samples.length + 2);
  owner.setPending(true); h.hidden(true);
  const before = h.backgroundDraws.length;
  owner.render(() => h.frame(174));
  expect(h.backgroundDraws).toHaveLength(before); expect(h.rafs.size + h.timers.size).toBe(0);
  h.hidden(false); expect(h.rafs.size).toBe(0);
  owner.dispose(); expect(h.rafs.size).toBe(1); h.step();
  expect(h.backgroundDraws.at(-1)!.stage).toBeCloseTo(score.sampleStoryScore({ time: 174, openingTime: 26, progress: 0 }).environment, 14);
  h.controller.dispose(); expect(h.rafs.size + h.timers.size).toBe(0);
});

test("handoff from immediate journey draws to an older RAF stamp cannot move material time backward", () => {
  const h = environmentHarness(); h.step();
  const owner = journeyRender.createJourneyRenderOwner(h.stage as unknown as HTMLElement);
  owner.setPending(true);
  owner.render(() => h.frame(151.2819));
  const time = h.backgroundDraws.at(-1)!.time;
  owner.setPending(false); h.menu(true);
  // Actual callback receipt advances 1ms, but its refresh stamp is 4ms behind
  // the previous immediate sample, reproducing R18's mixed-clock ordering.
  h.step(0.001, undefined, -5);
  expect(h.backgroundDraws.at(-1)!.time - time).toBeCloseTo(0.001, 12);
  h.step(1 / 60, undefined, -8);
  expect(h.backgroundDraws.at(-1)!.time - time).toBeCloseTo(0.001 + 1 / 60, 12);
  expect(h.fields[0].field.uniforms.uQuiet.value).toBe(1);
  expect(h.backgroundDraws.every((draw, i, list) => i === 0 || draw.time >= list[i - 1].time)).toBe(true);
  owner.dispose(); h.controller.dispose();
});

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
  expect(field.field.uniforms.uStroke.value.x).toBeCloseTo(x * (1920 / 1080), 10);
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

test("late background boot starts from the current work travel rather than a stale opening default", () => {
  const h = environmentHarness({ initialStoryTime: 350, initialWorkTravel: 0.2 });
  h.step();
  const field = h.fields[0];
  // Source keeps initial lastTravel=-1.2 but reads the current shared travel=.2.
  // The positive impulse saturates at1, then workQuiet applies its .4 gain.
  expect(field.field.uniforms.uHorizontal.value).toBeCloseTo(0.4, 12);
  h.step(); expect(field.field.uniforms.uHorizontal.value).toBe(0);
  expect(h.fields).toHaveLength(1); expect(field.disposals).toBe(0);
  h.controller.dispose();
});

test("reading resets effective work travel with one source horizontal kick and resumes current DOM/event travel", () => {
  const h = environmentHarness(); h.work.dataset.travel = "0.2"; h.frame(350); h.step();
  expect(h.fields[0].field.uniforms.uHorizontal.value).toBeCloseTo(0.4, 12);
  h.step(); // The retained travel is stationary after its first real draw.
  const field = h.fields[0], material = h.surfaces[0].material, u = field.field.uniforms;
  const time = material.uniforms.uTime.value as number, clears = field.clears;
  expect(u.uHorizontal.value).toBe(0);
  h.controller.setReducedMode(true); h.step();
  // Source retains lastTravel=.2, then initialNarrative supplies -1.35. Reading
  // has no workQuiet attenuation, so its first reset impulse clamps to -1.
  expect(u.uHorizontal.value).toBe(-1);
  expect(material.uniforms.uTime.value - time).toBeCloseTo(0.035 / 60, 10);
  h.step(); expect(u.uHorizontal.value).toBe(0);
  h.work.dataset.travel = "0.9"; h.frame(350); expect(u.uHorizontal.value).toBe(0);
  h.work.dataset.travel = "-1.33"; h.controller.setReducedMode(false);
  // A silent parent refresh after the setter must be consumed before drawing.
  h.work.dataset.travel = "-1.32"; h.stage.dataset.storyTime = "350"; h.step();
  // (.03 / (1/60)) * .18 * (1 - .6 * 1), fixed source fixture.
  expect(u.uHorizontal.value).toBeCloseTo(0.1296, 10);
  h.step(); expect(u.uHorizontal.value).toBe(0);
  h.controller.setReducedMode(true); h.step(); h.step();
  h.hidden(true); const draws = h.stats.renders;
  h.controller.setReducedMode(false); h.work.dataset.travel = "-1.31"; h.frame(350.123456789);
  // A newer journey event owns both precise clock and associated work travel.
  h.work.dataset.travel = "-1.30";
  expect(h.stats.renders).toBe(draws); expect(h.rafs.size + h.timers.size).toBe(0);
  h.hidden(false); h.step(); expect(u.uHorizontal.value).toBeCloseTo(0.1728, 10);
  h.step(); expect(u.uHorizontal.value).toBe(0);
  expect(h.fields).toHaveLength(1); expect(h.stats.creations).toBe(1);
  expect(field.clears).toBe(clears); expect(field.disposals).toBe(0);
  expect(material.uniforms.uTime.value).toBeGreaterThan(time); h.controller.dispose();
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

test("reference aspect keys preserve within-profile/height/DPR history and replace only the changed field/grid", () => {
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
  expect(h.dimensions.at(-1)).toEqual([2720, viewport.designHeight(2720)]);
  h.resize(1361, 1000); expect(h.fields).toHaveLength(1); expect(first.disposals).toBe(0);
  expect(mesh.geometry).toBe(geometry); expect(gridDisposals).toBe(0); h.step();
  expect(material.uniforms.uAspect.value).toBe(1920 / 1080);
  h.resize(800, 1000); h.step(); const tablet = h.fields.at(-1)!;
  expect(first.disposals).toBe(1); expect(h.fields).toHaveLength(2);
  h.resize(640, 800); h.step(); // Both sides of the obsolete 700px boundary are tablet.
  expect(tablet.disposals).toBe(0); expect(h.fields).toHaveLength(2); expect(mesh.geometry).toBe(geometry);
  h.resize(600, 800);
  expect(tablet.disposals).toBe(1); expect(mesh.geometry).not.toBe(geometry); expect(gridDisposals).toBe(1);
  expect(mesh.geometry.parameters.widthSegments).toBe(96); expect(mesh.geometry.parameters.heightSegments).toBe(96);
  expect(mesh.material).toBe(material); h.step(); h.controller.dispose(); h.controller.dispose();
  expect(h.fields.every((entry) => entry.disposals === 1)).toBe(true);
  expect(h.stats.rendererDisposals).toBe(1); expect(h.stats.contextLosses).toBe(1);
});

test("background draw geometry and pointer mapping share the fixed profile independently of actual viewport height", () => {
  const h = environmentHarness();
  for (const reference of Object.values(viewport.viewportDesigns)) {
    h.resize(reference.width, reference.height); h.step();
    const field = h.fields.at(-1)!, mesh = h.surfaces[0];
    expect(viewport.designScale(reference.width)).toBe(1);
    expect(h.dimensions.at(-1)).toEqual([reference.width, reference.height]);
    expect(mesh.material.uniforms.uAspect.value).toBe(reference.width / reference.height);
    const bufferMeasurements = h.dimensions.length;
    h.resize(reference.width, reference.height / 2); h.step();
    expect(h.dimensions).toHaveLength(bufferMeasurements);
    expect(h.fields.at(-1)).toBe(field);
    expect(h.dimensions.at(-1)).toEqual([reference.width, reference.height]);
    const input = () => h.event("pointermove", { pointerType: "mouse", clientX: reference.width * 0.75, clientY: reference.height * 0.25 });
    input();
    expect(h.pointers[0].state.targetX).toBe(0.5); expect(h.pointers[0].state.targetY).toBe(0.5);
    h.resize(reference.width * 1.25, reference.height * 0.8); h.dpr(2); h.step();
    expect(h.fields.at(-1)).toBe(field);
    expect(h.dimensions.at(-1)).toEqual([reference.width * 1.25, reference.height * 1.25]);
    h.event("pointermove", { pointerType: "mouse", clientX: reference.width * 1.25 * 0.75, clientY: reference.height * 1.25 * 0.25 });
    expect(h.pointers[0].state.targetX).toBe(0.5); expect(h.pointers[0].state.targetY).toBe(0.5);
    expect([...mesh.material.uniforms.uCell.value.toArray(), mesh.material.uniforms.uAspect.value].every(Number.isFinite)).toBe(true);
  }
  h.controller.dispose(); expect(h.rafs.size + h.timers.size).toBe(0);
});

test("native scroll pressure uses the design canvas height across physical height and proportional width changes", () => {
  for (const reference of Object.values(viewport.viewportDesigns)) {
    const cases = [environmentHarness(), environmentHarness(), environmentHarness()];
    cases[0].resize(reference.width, reference.height);
    cases[1].resize(reference.width, reference.height / 2);
    cases[2].resize(reference.width * 1.25, reference.height / 2);
    cases.forEach((h, i) => {
      const delta = i === 2 ? 50 : 40;
      h.hero(0.5); h.scroll(delta);
      expect(h.pointers[0].state.scrollVelocity).toBeCloseTo(40 / reference.height * 3, 12);
      h.step();
    });
    const scrollPressure = cases[0].fields.at(-1)!.field.uniforms.uScroll.value;
    for (const h of cases) {
      expect(h.fields.at(-1)!.field.uniforms.uScroll.value).toBeCloseTo(scrollPressure, 12);
      const before = h.pointers[0].state.scrollVelocity;
      h.controller.dispose(); h.scroll(100);
      expect(h.pointers[0].state.scrollVelocity).toBe(before);
      expect(h.rafs.size + h.timers.size).toBe(0);
    }
  }
});

test("standalone environment pointer defaults to design height and keeps a finite zero-sized bounds basis", () => {
  for (const supplied of [false, true]) {
    const window = new EventTarget(), fine = Object.assign(new EventTarget(), { matches: true });
    const context = createContext({ window, document: Object.assign(new EventTarget(), { hidden: false }),
      innerWidth: 1920, innerHeight: 540, scrollY: 0, matchMedia: () => fine, Element: Surface });
    const loaded = evaluate("./story-environment-pointer.ts", context, {
      "./story-score": score, "./story-material-protection": { createMaterialProtection }, "@/lib/viewport-design": viewport,
    }).exports as { createEnvironmentPointer: typeof createEnvironmentPointer };
    const pointer = loaded.createEnvironmentPointer(() => {}, supplied ? () => ({ left: 0, top: 0, width: 0, height: 0 }) : undefined);
    context.scrollY = 40; window.dispatchEvent(new Event("scroll"));
    expect(pointer.state.scrollVelocity).toBeCloseTo(supplied ? 1 : 40 / 1080 * 3, 12);
    expect(Number.isFinite(pointer.state.scrollVelocity)).toBe(true); pointer.dispose();
  }
});

test("mode, resize and context restore submit no hidden/offscreen GPU work and clean up once", () => {
  const h = environmentHarness(); h.step();
  const field = h.fields[0], materialTime = Number(h.canvas.dataset.materialTime);
  h.hidden(true); const hiddenRenders = h.stats.renders, hiddenClears = field.clears;
  h.controller.setReducedMode(true); h.resize(); h.lose(); h.restore();
  expect(h.fields).toHaveLength(1); expect(field.clears).toBe(hiddenClears);
  expect(h.stats.renders).toBe(hiddenRenders); expect(h.rafs.size + h.timers.size).toBe(0);
  h.hidden(false); h.step();
  expect(Number(h.canvas.dataset.materialTime)).toBeGreaterThan(materialTime);
  expect(h.stats.creations).toBe(1); expect(field.clears).toBe(hiddenClears + 1);
  h.menu(true); const beforeMenuDraw = h.stats.renders;
  h.controller.setReducedMode(false); h.resize(800, 1000);
  expect(h.fields.at(-1)!.clears).toBe(0); expect(h.stats.renders).toBe(beforeMenuDraw);
  expect(h.rafs.size).toBe(1); h.step();
  expect(h.fields.at(-1)!.clears).toBe(1);
  expect(h.fields.at(-1)!.field.uniforms.uQuiet.value).toBe(1);
  h.menu(false); h.step(); h.visible(false); const offscreenRenders = h.stats.renders;
  h.controller.setReducedMode(true); h.resize(412, 1000);
  expect(h.fields.at(-1)!.clears).toBe(0); expect(h.stats.renders).toBe(offscreenRenders);
  expect(h.rafs.size + h.timers.size).toBe(0);
  h.visible(true); h.step(); h.controller.dispose(); h.controller.dispose();
  h.event("pointermove", { pointerType: "mouse", clientX: 1000, clientY: 300 }); h.resize(); h.hidden(false); h.menu(false);
  expect(h.disconnected).toBe(true); expect(h.owner.children).toHaveLength(0);
  expect(h.rafs.size + h.timers.size).toBe(0); expect(h.stage.dataset.storyEnvironment).toBeUndefined();
  expect(h.fields.every((entry) => entry.disposals === 1)).toBe(true);
  expect(h.stats.rendererDisposals).toBe(1); expect(h.stats.contextLosses).toBe(1);
});

test("MENU retains the source quiet field tail and clock, then returns to normal idle cadence", () => {
  const h = environmentHarness();
  h.event("pointermove", { pointerType: "mouse", clientX: 1088, clientY: 300 });
  h.event("pointerdown", { pointerType: "mouse", clientX: 1088, clientY: 300, pointerId: 1, button: 0 });
  h.step();
  const field = h.fields[0], material = h.surfaces[0].material;
  const before = material.uniforms.uTime.value as number;
  const advances = field.advances;
  expect(field.field.uniforms.uPress.value).toBeGreaterThan(0);
  h.menu(true); h.step(0.05);
  expect(material.uniforms.uTime.value - before).toBeCloseTo(0.05, 12);
  expect(field.advances).toBeGreaterThan(advances);
  expect(field.field.uniforms.uQuiet.value).toBe(1);
  expect(field.field.uniforms.uMotion.value).toBe(0);
  expect(field.field.uniforms.uPress.value).toBe(0);
  expect(field.field.uniforms.uScroll.value).toBe(0);
  // Let the original six-second tail decay; menu does not restart its budget.
  const delays = new Set<number>();
  for (let i = 0; i < 145; i++) {
    if (!h.rafs.size) { delays.add([...h.timers.values()][0].delay); h.timer(); }
    h.step(0.05);
  }
  expect(delays.has(1000 / 30)).toBe(true);
  expect([...h.timers.values()][0].delay).toBeCloseTo(1000 / 24, 12);
  expect(material.uniforms.uTime.value - before).toBeCloseTo(7.3, 10);
  expect(h.fields).toHaveLength(1); expect(h.stats.creations).toBe(1);
  const clears = field.clears;
  h.menu(false); h.step();
  expect(field.field.uniforms.uQuiet.value).toBe(0);
  expect(field.clears).toBe(clears);
  h.menu(true); h.hidden(true);
  const hiddenTime = material.uniforms.uTime.value, draws = h.stats.renders;
  expect(h.rafs.size + h.timers.size).toBe(0); h.step(1);
  expect(material.uniforms.uTime.value).toBe(hiddenTime); expect(h.stats.renders).toBe(draws);
  h.hidden(false); h.step(); expect(material.uniforms.uTime.value).toBeGreaterThan(hiddenTime);
  expect(field.field.uniforms.uQuiet.value).toBe(1);
  h.controller.dispose(); expect(h.rafs.size + h.timers.size).toBe(0);
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
  const slots: Slot[] = [], pending: (() => void)[] = [];
  let index = 0, calls = 0, releases = 0;
  const modes: boolean[] = [];
  const page = { dataset: { routePath: "/en" }, querySelector: () => null }, owner = {};
  const stage = { closest: (selector: string) => selector === ".experience" ? owner : page };
  const effect = (callback: Effect, deps: readonly unknown[]) => {
    const slot = slots[index++] ??= {};
    if (slot.deps && slot.deps.length === deps.length && slot.deps.every((dep, i) => Object.is(dep, deps[i]))) return;
    slot.deps = deps; pending.push(() => { slot.cleanup?.(); slot.cleanup = callback() || undefined; });
  };
  const hooks = {
    useRef<T>(initial: T) { const slot = slots[index++] ??= {}; return (slot.ref ??= { current: initial }) as { current: T }; },
    useState<T>(initial: T): [T, (next: T) => void] { const slot = slots[index++] ??= { value: initial }; return [slot.value as T, (next) => { slot.value = next; }]; },
    useEffect: effect, useLayoutEffect: effect,
  };
  const context = createContext({
    document: { getElementById: () => stage }, location: { pathname: "/en" }, console,
  });
  const { value: mount } = evaluate("./story-scene-gate.logic.ts", context, {
    react: hooks, "react/jsx-runtime": {},
    "@/lib/scene/sceneActivation": { useSceneActivation: () => ({ shouldMount: false }) },
    "@/lib/scene/sceneBootGate": { useSceneBootSlot: () => false },
    "@/lib/useReducedMotion": {}, "@/store/uiStore": {},
    "@/components/layout/environment/environment.logic": { environmentOwner: { navigate() {}, register(_binding: unknown, path: string, reduced: boolean) {
      expect(path).toBe("/en"); calls++; modes.push(reduced);
      return { setReducedMode(mode: boolean) { modes.push(mode); }, release() { releases++; } };
    } } },
  }, "return useHomeEnvironment;") as { value: (staticMode: boolean) => void };
  return {
    modes,
    get calls() { return calls; }, get releases() { return releases; },
    render(staticMode: boolean) { index = 0; mount(staticMode); for (const effect of pending.splice(0)) effect(); },
    dispose() { for (const slot of slots) slot.cleanup?.(); },
  };
}

test("HOME's environment lease survives quiet/object-failure mode changes until HOME itself leaves", () => {
  const h = gateHarness(); h.render(false); h.render(true); h.render(false);
  expect(h.calls).toBe(1); expect(h.releases).toBe(0);
  expect(h.modes).toEqual([false, false, true, false]);
  h.dispose(); expect(h.releases).toBe(1);
});

function editorialBinding(quiet = .65) {
  const root = new Surface(); root.connected = true;
  let surfaceQuiet = quiet;
  const binding = { kind: "editorial", stage: root, page: root, owner: root, pose: () => ({ time: 448, environment: .28, surfaceQuiet }) } as unknown as EnvironmentBinding;
  return { root, binding, focus(value: number) { surfaceQuiet = value; } };
}

test("one retained field/context/phase crosses HOME, editorial leases, connected parking and HOME reentry", () => {
  const h = environmentHarness({ persistent: true, initialWorkTravel: 2.4, initialStoryTime: 350, initialHeroProgress: .13 });
  h.step(); const canvas = h.canvas, material = h.surfaces[0].material, field = h.fields[0];
  const targets = [...h.renderTargets];
  h.step(); expect(field.field.uniforms.uHorizontal.value).toBe(0);
  const pointer = h.pointers[0].state;
  pointer.fieldX = .37; pointer.fieldY = -.18;
  const phase = material.uniforms.uTime.value as number;
  h.initialAttachment!.release();
  expect(h.host.parentElement).toBe(h.parking); expect(canvas.isConnected).toBe(true);
  h.step(.02); expect(material.uniforms.uTime.value).toBeGreaterThan(phase);
  expect(field.field.uniforms.uHorizontal.value).toBe(0); expect(field.field.uniforms.uQuiet.value).toBe(0);
  for (const quiet of [.65, .65, .9, 1]) {
    const editorial = editorialBinding(quiet), attachment = h.bind(editorial.binding);
    // Late HOME cleanup and publications cannot take the new binding back.
    h.initialAttachment!.release(); h.frame(128); h.hero(0);
    expect(h.host.parentElement).toBe(editorial.root); expect(h.canvas).toBe(canvas); expect(canvas.isConnected).toBe(true);
    attachment.invalidate(); h.step(.02);
    expect(material.uniforms.uStage.value).toBe(.28);
    expect(field.field.uniforms.uQuiet.value).toBeCloseTo(.45 * quiet, 12);
    expect(field.field.uniforms.uHorizontal.value).toBe(0);
    expect(pointer.fieldX).toBe(.37); expect(pointer.fieldY).toBe(-.18);
    expect(material.uniforms.uAmplitude.value).toBe(1);
    attachment.release();
  }
  // HOME's existing parent resets narrative, not material history.
  h.stage.dataset.storyTime = "0"; h.work.dataset.travel = "-1.35";
  const beforeHome = material.uniforms.uTime.value;
  const home = h.bind(h.homeBinding); h.step(.02);
  expect(material.uniforms.uTime.value).toBeGreaterThan(beforeHome);
  expect(field.field.uniforms.uHorizontal.value).toBe(-1);
  h.step(.02); expect(field.field.uniforms.uHorizontal.value).toBe(0);
  expect([...h.renderTargets]).toEqual(targets); expect(h.fields).toHaveLength(1); expect(h.pointers).toHaveLength(1);
  expect(h.stats.creations).toBe(1); expect(h.stats.contextLosses).toBe(0);
  home.release(); h.controller.dispose(); h.controller.dispose();
  expect(canvas.isConnected).toBe(false); expect(field.disposals).toBe(1);
  expect(h.stats.rendererDisposals).toBe(1); expect(h.stats.contextLosses).toBe(1);
  expect(h.rafs.size + h.timers.size).toBe(0);
});

test("rebinding the same descriptor rejects old releases, observers, guards and pending journey publications", () => {
  const h = environmentHarness({ persistent: true }); h.step();
  const editorial = editorialBinding(), old = h.bind(editorial.binding), current = h.bind(editorial.binding);
  old.release(); h.initialAttachment!.release(); current.invalidate(); h.step();
  expect(h.host.parentElement).toBe(editorial.root); expect(editorial.root.dataset.storyEnvironment).toBe("ready");
  current.release();
  const journey = journeyRender.createJourneyRenderOwner(h.stage as unknown as HTMLElement);
  journey.setPending(true); const draws = h.backgroundDraws.length;
  const home = h.bind(h.homeBinding);
  expect(h.rafs.size + h.timers.size).toBe(0);
  h.step(.02, () => journey.render(() => { h.work.dataset.travel = "2.6"; h.frame(174.123456789); }));
  expect(h.backgroundDraws).toHaveLength(draws + 1);
  expect(h.backgroundDraws.at(-1)!.stage).toBeCloseTo(score.sampleStoryScore({ time: 174.123456789, openingTime: 26, progress: 0 }).environment, 14);
  h.stage.dispatchEvent(Object.assign(new Event("journey-scene-interaction"), { detail: { grabbed: true, guards: [{ x: 0, y: 0, rx: 1, ry: 1, weight: 1 }] } }));
  const next = h.bind(editorial.binding); home.release(); journey.dispose();
  h.frame(128); h.step();
  expect(h.fields[0].field.uniforms.uGuardWeight.value).toEqual([0, 0, 0, 0]);
  expect(h.surfaces[0].material.uniforms.uStage.value).toBe(.28);
  // A queued callback from the old page must not make this page offscreen.
  const beforeStaleVisibility = h.backgroundDraws.length;
  h.observed(0, false); next.invalidate(); h.step();
  expect(h.backgroundDraws).toHaveLength(beforeStaleVisibility + 1);
  next.release(); h.controller.dispose(); expect(h.disconnected).toBe(true);
  expect(h.rafs.size + h.timers.size).toBe(0);
});

test("retained context loss/restore and paused profile changes stay lazy across route leases", () => {
  const h = environmentHarness({ persistent: true }); h.step();
  const canvas = h.canvas, phase = Number(canvas.dataset.materialTime), editorial = editorialBinding(.9);
  h.lose(); const draws = h.stats.renders;
  const lease = h.bind(editorial.binding); h.resize(412, 457.5); h.controller.setReducedMode(true);
  expect(editorial.root.dataset.storyEnvironment).toBe("failed"); expect(h.stats.renders).toBe(draws);
  h.hidden(true); h.restore();
  expect(h.fields.at(-1)!.clears).toBe(0); expect(h.rafs.size + h.timers.size).toBe(0);
  h.hidden(false); h.step();
  expect(h.canvas).toBe(canvas); expect(Number(canvas.dataset.materialTime)).toBeGreaterThan(phase);
  expect(h.fields.at(-1)!.clears).toBe(1); expect(h.stats.creations).toBe(1);
  h.resize(500, 300); h.step(); expect(h.fields).toHaveLength(2);
  lease.release(); h.controller.dispose(); expect(h.fields.every((field) => field.disposals === 1)).toBe(true);
  expect(h.stats.contextLosses).toBe(1); expect(h.rafs.size + h.timers.size).toBe(0);
});

test("protection publishers remain independent and old route releases cannot erase a newer source", () => {
  const protection = createMaterialProtection(), oldPage = new Surface(), newPage = new Surface();
  const event = (source: "portrait" | "footer", publisher: number, owner: Surface, active = true) => ({ source, publisher, owner: owner as unknown as HTMLElement, active, pressureScale: source === "portrait" ? .2 : 1, influence: source === "footer" ? .75 : 0, clientX: 0, clientY: 0 });
  protection.update(event("footer", 1, oldPage)); protection.update(event("footer", 3, newPage));
  protection.update(event("portrait", 2, oldPage)); expect(protection.pressureScale).toBe(.2);
  protection.update(event("footer", 1, oldPage, false)); protection.update(event("footer", 1, oldPage));
  expect(protection.footerInfluence).toBe(.75);
  protection.release(oldPage as unknown as HTMLElement);
  expect(protection.pressureScale).toBe(1); expect(protection.footerInfluence).toBe(.75);
  protection.update(event("portrait", 2, oldPage)); expect(protection.pressureScale).toBe(1);
  protection.update(event("portrait", 4, newPage)); protection.update(event("portrait", 2, oldPage, false));
  expect(protection.pressureScale).toBe(.2);
  protection.release(newPage as unknown as HTMLElement); expect(protection.footerInfluence).toBe(0); expect(protection.pressureScale).toBe(1);
});

test("route attachment changes retain the active pulse, stroke, pointer press and original simulation tail", () => {
  const h = environmentHarness({ persistent: true, initialHeroProgress: 1 });
  h.event("pointermove", { pointerType: "mouse", clientX: 1088, clientY: 300 });
  h.event("pointerdown", { pointerType: "mouse", clientX: 1088, clientY: 300, pointerId: 1, button: 0 });
  h.step(); const field = h.fields[0], uniforms = field.field.uniforms;
  const x = uniforms.uStroke.value.z, y = uniforms.uStroke.value.w, clears = field.clears, advances = field.advances;
  expect(uniforms.uPulse.value.z).toBeGreaterThan(0);
  const editorial = editorialBinding(.9); h.bind(editorial.binding); h.step(.02);
  expect(h.pointers[0].state.pressed).toBe(true);
  expect(uniforms.uStroke.value.x).toBe(x); expect(uniforms.uStroke.value.y).toBe(y);
  expect(uniforms.uPulse.value.z).toBeGreaterThan(0); expect(field.clears).toBe(clears); expect(field.advances).toBeGreaterThan(advances);
  h.controller.dispose(); expect(h.rafs.size + h.timers.size).toBe(0);
});

test("creation failure remains one optional failed owner across routes and stale failed leases cannot erase a new one", () => {
  const h = environmentHarness({ persistent: true, failCreation: true });
  const editorial = editorialBinding(), old = h.bind(editorial.binding), current = h.bind(editorial.binding);
  old.release(); h.initialAttachment!.release();
  expect(editorial.root.dataset.storyEnvironment).toBe("failed"); expect(h.stats.creations).toBe(1);
  expect(h.fields).toHaveLength(0); expect(h.rafs.size + h.timers.size).toBe(0);
  current.release(); h.controller.dispose(); h.controller.dispose();
  expect(editorial.root.dataset.storyEnvironment).toBeUndefined(); expect(h.stats.contextLosses).toBe(0);
});

test("actual mount publishers mint identity before late events and cleanup reach the retained pointer", () => {
  const protection = createMaterialProtection(), window = new EventTarget();
  class DetailEvent extends Event { detail: unknown; constructor(name: string, options: { detail: unknown }) { super(name); this.detail = options.detail; } }
  window.addEventListener("gazzar:material-protection", event => protection.update((event as DetailEvent).detail as Parameters<typeof protection.update>[0]));
  const loaded = evaluate("../../../components/layout/header/material-protection.ts", createContext({ window, CustomEvent: DetailEvent }), {}).exports as {
    createMaterialProtectionPublisher(root: HTMLElement): (value: Parameters<typeof protection.update>[0]) => void;
  };
  const oldRoot = new Surface(), newRoot = new Surface();
  oldRoot.connected = newRoot.connected = true;
  const old = loaded.createMaterialProtectionPublisher(oldRoot as unknown as HTMLElement);
  const portrait = loaded.createMaterialProtectionPublisher(oldRoot as unknown as HTMLElement);
  const current = loaded.createMaterialProtectionPublisher(newRoot as unknown as HTMLElement);
  const value = { source: "footer" as const, active: true, pressureScale: 1, influence: .75, clientX: 0, clientY: 0 };
  old(value); current(value); portrait({ ...value, source: "portrait", pressureScale: .2 });
  old({ ...value, active: false }); expect(protection.footerInfluence).toBe(.75); expect(protection.pressureScale).toBe(.2);
  protection.release(oldRoot as unknown as HTMLElement); expect(protection.pressureScale).toBe(1); expect(protection.footerInfluence).toBe(.75);
  portrait({ ...value, source: "portrait", pressureScale: .2 }); expect(protection.pressureScale).toBe(1);
  current({ ...value, active: false }); old(value); expect(protection.footerInfluence).toBe(0);
});

test("same-page lease replacement retains current protection; departing-page events cannot repopulate it", () => {
  const h = environmentHarness({ persistent: true }); h.step();
  const detail = { source: "portrait", publisher: 1, owner: h.page, active: true, pressureScale: .2, influence: 0, clientX: 0, clientY: 0 };
  h.event("gazzar:material-protection", { detail }); expect(h.pointers[0].state.pressureScale).toBe(.2);
  const replacement = h.bind(h.homeBinding); h.initialAttachment!.release();
  expect(h.pointers[0].state.pressureScale).toBe(.2);
  h.bind(editorialBinding().binding); replacement.release();
  expect(h.pointers[0].state.pressureScale).toBe(1);
  h.event("gazzar:material-protection", { detail }); expect(h.pointers[0].state.pressureScale).toBe(1);
  h.controller.dispose(); expect(h.rafs.size + h.timers.size).toBe(0);
});
