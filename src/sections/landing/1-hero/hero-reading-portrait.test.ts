import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import ts from "typescript";
import { createReadingPortraitState, type ReadingPortraitState } from "./hero-reading-portrait";
import type { PortraitController } from "./hero-portrait";
import * as viewport from "@/lib/viewport-design";

const visible = { resolve: 1, exit: 0, pointer: 1, active: true };

test("pre-ready samples cache resolve even for a hidden hero; initialization does not spend a draw", () => {
  const state = createReadingPortraitState();
  state.sample({ ...visible, active: false, exit: 1 });
  state.prepared();
  expect(state.draw(0)).toBe(false);
  state.sample(visible);
  expect(state.draw(0)).toBe(true);
  state.invalidate();
  expect(state.draw(0)).toBe(false);
  state.unavailable();
  state.sample(visible); // The !en branch retains es, including across restore.
  state.prepared();
  expect(state.draw(0)).toBe(false);
});

test("unavailable/prepared retains the sampled resolve and spent budget; only source delta replenishes it", () => {
  const state = createReadingPortraitState();
  state.sample(visible); state.prepared();
  expect(state.draw(0)).toBe(true);
  state.unavailable();
  state.sample({ ...visible, active: false, exit: 1 });
  state.prepared(); state.sample(visible);
  expect(state.draw(0)).toBe(false);
  expect(state.draw(0.015)).toBe(false);
  expect(state.draw(0.002)).toBe(true);
});

async function flush() { for (let i = 0; i < 12; i++) await Promise.resolve(); }

function deferred() {
  let resolve!: () => void, reject!: (reason: Error) => void;
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

/** Runs the actual graphics/controller module with an observable, non-GPU renderer. */
function graphicsHarness(normal = false) {
  class Surface extends EventTarget {
    dataset: Record<string, string> = {};
    selectors = new Map<string, unknown>();
    querySelector(selector: string) { return this.selectors.get(selector); }
  }
  const root = new Surface(), container = new Surface(), canvas = new Surface();
  const decode = deferred();
  let width = 882.316650390625, height = 588.2166748046875, heroHeight = 825, imageTop = 68.89999389648438, rootTop = 0, dpr = 1;
  let viewportWidth = 538, physicalHeight = 1000;
  const image = {
    naturalWidth: 1536, decode: () => decode.promise,
    getBoundingClientRect: () => ({ width, height, left: 0, top: imageTop + rootTop }),
    get offsetWidth() { return Math.round(width); }, get offsetHeight() { return Math.round(height); },
  };
  Object.defineProperty(root, "offsetHeight", { get: () => heroHeight });
  Object.assign(root, { getBoundingClientRect: () => ({ top: rootTop }) });
  root.selectors.set("[data-portrait-entrance]", container);
  container.selectors.set("img", image); container.selectors.set("canvas", canvas);
  const window = new EventTarget(), document = { hidden: false, documentElement: new Surface() };
  const allocations: { dispose: () => void; releases: number }[] = [];
  class Resource {
    releases = 0;
    constructor() { allocations.push(this); }
    dispose() { this.releases++; }
  }
  class Vector2 { constructor(public x: number, public y: number) {} set(x: number, y: number) { this.x = x; this.y = y; } }
  type Uniforms = Record<string, { value: number | Vector2 }>;
  let uniforms!: Uniforms;
  class Material extends Resource {
    constructor(options: { uniforms: Uniforms }) { super(); uniforms = options.uniforms; }
  }
  const renderers: Renderer[] = [], calls: { kind: string; value?: unknown }[] = [];
  class Renderer extends Resource {
    compile = deferred();
    info = { programs: [{ program: {} }] };
    linked = true;
    draws: { exit: number; view: [number, number]; detail: number }[] = [];
    constructor() { super(); renderers.push(this); }
    setClearColor() {}
    initTexture() {}
    getContext() { return { LINK_STATUS: 35714, getProgramParameter: () => this.linked }; }
    setPixelRatio(value: number) { calls.push({ kind: "ratio", value }); }
    setSize(width: number, height: number) { calls.push({ kind: "size", value: [width, height] }); }
    compileAsync() { return this.compile.promise; }
    render() {
      const view = uniforms.view.value as Vector2;
      this.draws.push({ exit: uniforms.departure.value as number, view: [view.x, view.y], detail: uniforms.exitDetail.value as number });
      calls.push({ kind: "draw" });
    }
  }
  const forbidden = () => { throw Error("Reading graphics must not schedule frames, sample pointers, create alpha canvases or play audio"); };
  const context = createContext({
    window, document: Object.assign(new EventTarget(), document, { createElement: normal ? () => ({
      width: 0, height: 0, getContext: () => ({ drawImage() {}, getImageData: () => ({ data: new Uint8ClampedArray(192 * 128 * 4) }) }),
    }) : forbidden }), Event, DOMException,
    Float32Array, Element: Surface,
    get innerWidth() { return viewportWidth; }, get innerHeight() { return physicalHeight; },
    requestAnimationFrame: forbidden, setTimeout: forbidden,
  });
  // Keep visibility mutable in the module's own document object.
  const page = context.document as typeof document;
  Object.defineProperty(context, "devicePixelRatio", { get: () => dpr });
  const dependencies: Record<string, unknown> = {
    three: {
      WebGLRenderer: Renderer, Texture: Resource, DataTexture: Resource, ShaderMaterial: Material,
      PlaneGeometry: Resource, Vector2, Scene: class { add() {} }, Camera: class {},
      Mesh: class { frustumCulled = true; },
    },
    "./hero-world": { clamp: (x: number) => Math.max(0, Math.min(1, x)) },
    "@/lib/viewport-design": viewport,
    "@/components/layout/header/material-protection": { createMaterialProtectionPublisher: () => normal ? () => {} : forbidden },
    "@/lib/audio/material-audio": { playMaterialImpulse: forbidden, setMaterialMotion: normal ? () => {} : forbidden, clearMaterialMotion: normal ? () => {} : forbidden },
  };
  const source = ts.transpileModule(readFileSync(new URL("./hero-portrait.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const evaluated = { exports: {} as { mountHeroPortrait: (root: unknown, options: { reading?: ReadingPortraitState; signal?: AbortSignal }) => Promise<PortraitController> } };
  runInContext(`(function(require, module, exports) { ${source}\n })`, context)((name: string) => {
    if (!(name in dependencies)) throw Error(`Unexpected graphics dependency ${name}`);
    return dependencies[name];
  }, evaluated, evaluated.exports);
  return {
    root, container, canvas, page, calls, renderers, allocations, decode,
    mount: (reading?: ReadingPortraitState, signal?: AbortSignal) => evaluated.exports.mountHeroPortrait(root, { reading, signal }),
    geometry(w: number, h: number, hero = heroHeight, top = imageTop) { width = w; height = h; heroHeight = hero; imageTop = top; },
    scroll(y: number) { rootTop = -y; },
    dpr(value: number) { dpr = value; },
    viewport(width: number, height = physicalHeight) { viewportWidth = width; physicalHeight = height; },
  };
}

async function initialized() {
  const h = graphicsHarness(), state = createReadingPortraitState();
  state.measure(68.89999389648438 / 825, 588.2166748046875 / 825);
  state.sample(visible);
  const pending = h.mount(state);
  h.decode.resolve(); await flush();
  h.renderers[0].compile.resolve();
  const controller = await pending;
  return { h, state, controller, renderer: h.renderers[0] };
}

test("initializer uses the latest pre-ready hidden-hero sample; measurement without a wake cannot publish a new field", async () => {
  const h = graphicsHarness(), state = createReadingPortraitState();
  state.sample(visible);
  const pending = h.mount(state);
  h.decode.resolve(); await flush();
  state.measure(0.2, 0.6);
  state.sample({ ...visible, exit: 1, pointer: 0, active: false });
  state.measure(0.9, 2); // E.g. a measurement while the menu prevents tU.
  h.renderers[0].compile.resolve();
  const controller = await pending;
  expect(h.renderers[0].draws).toEqual([{ exit: 1, view: [0.2, 0.6], detail: 0 }]);
  controller.render(0, 1, 0, 1, true);
  expect(h.renderers[0].draws).toHaveLength(2); // Initial drawing left budget intact.
  controller.dispose();
});

test("first ready resize can draw; a second real size change clears without drawing, including native reverse/visibility return", async () => {
  const { h, controller, renderer } = await initialized();
  expect(renderer.draws).toHaveLength(1); // Unconditional initializer only.
  expect(h.canvas.dataset.surface).toBe("prepared");
  h.geometry(2544, 1696, 1392, -152);
  controller.measure();
  controller.render(0, 1, 0.7805, 0, true);
  expect(renderer.draws).toHaveLength(2);
  expect(renderer.draws[1].exit).toBe(0.7805);
  expect(renderer.draws[1].detail).toBe(0);
  expect(renderer.draws[1].view).toEqual([-152 / 1392, 1696 / 1392]);
  h.scroll(825); // Reading uses image-relative coordinates, never viewport Y.
  controller.measure();
  controller.render(0, 1, 0, 1, true);
  expect(renderer.draws).toHaveLength(2); // Frozen partial alpha on reverse.
  h.geometry(882.316650390625, 588.2166748046875, 825, 68.89999389648438);
  controller.measure();
  expect(h.calls.at(-1)?.kind).toBe("size");
  controller.render(0, 1, 0, 1, true);
  h.page.hidden = true; controller.render(0, 1, 0.5, 0, true);
  h.page.hidden = false; controller.render(0, 1, 0, 1, true);
  expect(renderer.draws).toHaveLength(2);
  expect(h.container.dataset.portraitReady).toBe("true");
  controller.dispose();
  expect(h.container.dataset.portraitReady).toBe("false");
  expect(h.allocations.every((resource) => resource.releases === 1)).toBe(true);
});

test("same measured image/DPR never clears; CSS dimension changes clear even at identical raster size; capped DPR changes only when effective", async () => {
  const { h, controller, renderer } = await initialized();
  controller.render(0, 1, 0, 1, true); // Spend initial budget.
  const sizes = () => h.calls.filter((call) => call.kind === "size").length;
  const before = sizes();
  controller.measure();
  expect(sizes()).toBe(before);
  h.geometry(882.32, 588.22); controller.measure();
  expect(sizes()).toBe(before + 1);
  h.dpr(1.25); controller.measure();
  expect(sizes()).toBe(before + 2);
  h.dpr(2); controller.measure();
  expect(sizes()).toBe(before + 3);
  h.dpr(3); controller.measure();
  expect(sizes()).toBe(before + 3);
  controller.render(0, 1, 0, 1, true);
  expect(renderer.draws).toHaveLength(2);
  controller.dispose();
});

test("hidden hero does not spend ready budget; source context restore neither initializes nor refills it", async () => {
  const { h, controller, renderer } = await initialized();
  controller.render(0, 1, 1, 0, false);
  h.geometry(2544, 1696, 1392, -152); controller.measure();
  controller.render(0, 1, 0, 1, true);
  expect(renderer.draws).toHaveLength(2);
  h.canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
  expect(h.container.dataset.portraitReady).toBe("false");
  h.canvas.dispatchEvent(new Event("webglcontextrestored"));
  expect(h.container.dataset.portraitReady).toBe("true");
  controller.render(0, 1, 0, 1, true);
  expect(renderer.draws).toHaveLength(2);
  controller.dispose();
});

test("cancel during decode allocates nothing and cannot clear a newer owner's ready image", async () => {
  const h = graphicsHarness(), oldAbort = new AbortController();
  const old = h.mount(createReadingPortraitState(), oldAbort.signal).catch((error: Error) => error);
  oldAbort.abort();
  const state = createReadingPortraitState(); state.sample(visible);
  const next = h.mount(state);
  h.decode.resolve(); await flush();
  expect(h.renderers).toHaveLength(1);
  h.renderers[0].compile.resolve(); const controller = await next;
  expect((await old as Error).name).toBe("AbortError");
  expect(h.container.dataset.portraitReady).toBe("true");
  expect(h.renderers[0].draws).toHaveLength(1);
  controller.dispose();
});

test("cancel during compile revokes ownership immediately; its late completion cannot draw, resize or unset a newer surface", async () => {
  const h = graphicsHarness(), oldAbort = new AbortController();
  const old = h.mount(createReadingPortraitState(), oldAbort.signal).catch((error: Error) => error);
  h.decode.resolve(); await flush();
  oldAbort.abort();
  expect(h.container.dataset.portraitReady).toBe("false");
  const state = createReadingPortraitState(); state.sample(visible);
  const next = h.mount(state); await flush();
  h.renderers[1].compile.resolve(); const controller = await next;
  const sizes = h.calls.filter((call) => call.kind === "size").length;
  h.renderers[0].compile.resolve();
  expect((await old as Error).name).toBe("AbortError");
  expect(h.renderers[0].draws).toHaveLength(0);
  expect(h.renderers[0].releases).toBe(1);
  expect(h.calls.filter((call) => call.kind === "size")).toHaveLength(sizes);
  expect(h.container.dataset.portraitReady).toBe("true");
  controller.dispose();
  expect(h.allocations.every((resource) => resource.releases === 1)).toBe(true);
});

test("compile failure retains the static fallback and releases every owned graphics resource", async () => {
  const h = graphicsHarness();
  const pending = h.mount(createReadingPortraitState()).catch((error: Error) => error);
  h.decode.resolve(); await flush();
  h.renderers[0].compile.reject(Error("Compile failed"));
  expect((await pending as Error).message).toBe("Compile failed");
  expect(h.renderers[0].draws).toHaveLength(0);
  expect(h.container.dataset.portraitReady).toBe("false");
  expect(h.allocations.every((resource) => resource.releases === 1)).toBe(true);
});

test("a resolved compiler with an unlinked program cannot hide the photograph or publish readiness", async () => {
  const h = graphicsHarness();
  const pending = h.mount(createReadingPortraitState()).catch((error: Error) => error);
  h.decode.resolve(); await flush();
  h.renderers[0].linked = false;
  h.renderers[0].compile.resolve();
  expect((await pending as Error).message).toBe("Portrait shader could not compile");
  expect(h.container.dataset.portraitReady).toBe("false");
  expect(h.renderers[0].draws).toHaveLength(0);
  expect(h.allocations.every((resource) => resource.releases === 1)).toBe(true);
});

test("ordinary portrait selects authored detail by design profile and retains measured framebuffer geometry", async () => {
  const h = graphicsHarness(true);
  h.viewport(412, 915);
  const pending = h.mount();
  h.decode.resolve(); await flush(); h.renderers[0].compile.resolve();
  const controller = await pending, renderer = h.renderers[0];
  for (const [width, detail] of [[412, .35], [600, .35], [601, 1], [650, 1], [768, 1], [1024, 1], [1920, 1]]) {
    h.viewport(width);
    controller.measure();
    // Alternate the source exit so every check presents a frame.
    controller.render(0, 1, detail === .35 ? .2 : .3 + width / 100000, 1, true);
    expect(renderer.draws.at(-1)!.detail).toBe(detail);
  }
  const sizes = h.calls.filter((call) => call.kind === "size");
  expect(sizes.map((call) => call.value)).toEqual([[882, 588]]);
  const frame = renderer.draws.at(-1)!;
  h.viewport(1920, 240); controller.measure();
  controller.render(0, 1, .4, 1, true);
  expect(renderer.draws.at(-1)!.view).toEqual(frame.view);
  expect(h.calls.filter((call) => call.kind === "size")).toHaveLength(1);
  controller.dispose();
  expect(h.allocations.every((resource) => resource.releases === 1)).toBe(true);
});
