import { describe, expect, test } from "bun:test";
import * as Three from "three";
import { viewportDesign } from "@/lib/viewport-design";
import { installGlobals, loadIsolatedModule } from "../../services/test-support/isolated-module";
import { practiceHeroPose, practiceLogo } from "./practice-hero";
import type { PracticeObjects } from "./practice-objects";

async function rendererFixture(viewportWidth: number, kind: "about" | "services", rtl: boolean) {
  const viewport = { innerWidth: viewportWidth }, host = { style: { height: "" } };
  const canvas = Object.assign(new EventTarget(), { parentElement: host, dataset: {} as Record<string, string>, closest: () => ({ getAttribute: () => rtl ? "rtl" : "ltr" }) });
  const restoreGlobals = installGlobals({ window: viewport, devicePixelRatio: 1.25 });
  const renderers: FixtureRenderer[] = [], poses: { width: number; height: number }[] = [];
  class FixtureRenderer {
    size = { width: 0, height: 0 }; pixelRatio = 0; disposed = 0;
    constructor() { renderers.push(this); }
    setClearColor() {}
    setPixelRatio(value: number) { this.pixelRatio = value; }
    setSize(width: number, height: number) { this.size = { width, height }; }
    render() {}
    dispose() { this.disposed++; }
  }
  class FixtureEnvironment {
    fromScene() { return { texture: new Three.Texture(), dispose() {} }; }
    dispose() {}
  }
  class FixtureRoom { dispose() {} }
  const model = new Three.Scene(), geometry = new Three.BoxGeometry(1.47201032, 1.47201032, .2), material = new Three.MeshBasicMaterial();
  for (const name of ["Logo_Part_01_Finished", "Logo_Part_02_Finished"]) { const mesh = new Three.Mesh(geometry, material); mesh.name = name; model.add(mesh); }
  let objects: PracticeObjects | null = null;
  try {
    const runtime = loadIsolatedModule<{ createPracticeObjects: (canvas: HTMLCanvasElement, kind: "about" | "services", signal: AbortSignal) => Promise<PracticeObjects | null> }>("src/sections/vision/1-opening/practice-objects.ts", {
      three: { ...Three, WebGLRenderer: FixtureRenderer, PMREMGenerator: FixtureEnvironment },
      "three/addons/environments/RoomEnvironment.js": { RoomEnvironment: FixtureRoom },
      "three/addons/lights/RectAreaLightUniformsLib.js": { RectAreaLightUniformsLib: { init() {} } },
      "@/lib/scene/asset-cache": { loadGLTF: () => Promise.resolve({ scene: model }) },
      "./practice-hero": { practiceLogo, practiceHeroPose: (...args: Parameters<typeof practiceHeroPose>) => { poses.push({ width: args[1], height: args[2] }); return practiceHeroPose(...args); } },
    });
    objects = await runtime.createPracticeObjects(canvas as unknown as HTMLCanvasElement, kind, new AbortController().signal);
    if (!objects) throw new Error("Expected an inert editorial renderer.");
  } catch (error) { restoreGlobals(); geometry.dispose(); material.dispose(); throw error; }
  return { objects, viewport, canvas, host, poses, renderer: renderers[0], restore() { objects?.dispose(); geometry.dispose(); material.dispose(); restoreGlobals(); } };
}

describe("shared practice-object viewport profile", () => {
  test("an already-aborted factory skips shared asset loading and renderer allocation", async () => {
    let assetLoads = 0, rendererAllocations = 0;
    const runtime = loadIsolatedModule<{ createPracticeObjects: typeof import("./practice-objects").createPracticeObjects }>("src/sections/vision/1-opening/practice-objects.ts", {
      three: { ...Three, WebGLRenderer: class { constructor() { rendererAllocations++; } } },
      "@/lib/scene/asset-cache": { loadGLTF: () => { assetLoads++; return Promise.resolve({ scene: new Three.Scene() }); } },
    });
    const abort = new AbortController(); abort.abort();
    for (const kind of ["about", "services"] as const) expect(await runtime.createPracticeObjects({} as HTMLCanvasElement, kind, abort.signal)).toBeNull();
    expect(assetLoads).toBe(0); expect(rendererAllocations).toBe(0);
  });

  test("aborting a pending shared asset wait skips adoption and renderer allocation", async () => {
    let assetLoads = 0, rendererAllocations = 0, modelUpdates = 0;
    let resolveAsset!: (asset: { scene: { updateMatrixWorld(): void } }) => void;
    const sharedAsset = new Promise<{ scene: { updateMatrixWorld(): void } }>((resolve) => { resolveAsset = resolve; });
    const runtime = loadIsolatedModule<{ createPracticeObjects: typeof import("./practice-objects").createPracticeObjects }>("src/sections/vision/1-opening/practice-objects.ts", {
      three: { ...Three, WebGLRenderer: class { constructor() { rendererAllocations++; } } },
      "@/lib/scene/asset-cache": { loadGLTF: () => { assetLoads++; return sharedAsset; } },
    });
    const abort = new AbortController(), pending = runtime.createPracticeObjects({} as HTMLCanvasElement, "services", abort.signal);
    expect(assetLoads).toBe(1); abort.abort();
    const asset = { scene: { updateMatrixWorld() { modelUpdates++; } } }; resolveAsset(asset);
    expect(await pending).toBeNull(); expect(await sharedAsset).toBe(asset);
    expect(modelUpdates).toBe(0); expect(rendererAllocations).toBe(0);
  });

  test("both variants/locales choose CSS viewport profiles when scrollbars narrow their hosts", async () => {
    for (const [viewportWidth, hostWidth] of [[1025, 1010], [601, 586], [1024, 1009], [600, 585]]) {
      const design = viewportDesign(viewportWidth), physicalStage = design.height * viewportWidth / design.width;
      for (const kind of ["about", "services"] as const) for (const rtl of [false, true]) {
        const fixture = await rendererFixture(viewportWidth, kind, rtl);
        try {
          const extent = fixture.objects.resize(hostWidth, physicalStage);
          expect(fixture.poses.length).toBeGreaterThan(0);
          expect(fixture.poses.every((pose) => pose.width === design.width && pose.height === design.height)).toBe(true);
          expect(fixture.renderer.size).toEqual({ width: hostWidth, height: extent });
          // Convert actual buffer extent with viewport vw, never host-width vw.
          expect(parseFloat(fixture.host.style.height)).toBeCloseTo(extent / viewportWidth * 100, 10);
          expect(fixture.host.style.height.endsWith("vw")).toBe(true);
          const referenceExtent = extent / (hostWidth / design.width);
          expect(referenceExtent).toBeCloseTo(Math.round(referenceExtent), 9);
          expect(Math.round(referenceExtent)).toBeGreaterThanOrEqual(design.height);
          // Repeating a measurement must not apply the outer scale twice.
          expect(fixture.objects.resize(hostWidth, physicalStage)).toBe(extent);
          fixture.objects.render(0, .5, -.2, false, 1, 1);
          expect(fixture.poses.at(-1)).toEqual({ width: design.width, height: design.height });
        } finally { fixture.restore(); }
      }
    }
  });

  test("an existing renderer switches profile on viewport changes and keeps measured buffer width", async () => {
    const fixture = await rendererFixture(1025, "services", false);
    try {
      for (const [viewportWidth, hostWidth] of [[1025, 1010], [1024, 1009], [601, 586], [600, 585], [1920, 1905]]) {
        fixture.viewport.innerWidth = viewportWidth; const design = viewportDesign(viewportWidth);
        fixture.objects.resize(hostWidth, design.height * viewportWidth / design.width);
        fixture.objects.render(0, 0, 0, true);
        expect(fixture.poses.at(-1)).toEqual({ width: design.width, height: design.height });
        expect(fixture.renderer.size.width).toBe(hostWidth);
        expect(parseFloat(fixture.host.style.height)).toBeCloseTo(fixture.renderer.size.height / viewportWidth * 100, 10);
      }
    } finally { fixture.restore(); }
  });

  test("the inert context-loss event retains the draw error expected by page failure handlers", async () => {
    const fixture = await rendererFixture(1920, "services", false);
    try {
      fixture.objects.resize(1905, 1080); fixture.objects.render(0, 0, 0, false);
      expect(fixture.canvas.dataset.heroRendered).toBe("true");
      const lost = new Event("webglcontextlost", { cancelable: true }); fixture.canvas.dispatchEvent(lost);
      expect(lost.defaultPrevented).toBe(true); expect(fixture.canvas.dataset.heroRendered).toBeUndefined();
      expect(() => fixture.objects.render(0, 0, 0, false)).toThrow("The editorial WebGL context was lost.");
    } finally { fixture.restore(); }
    expect(fixture.renderer.disposed).toBe(1);
  });
});
