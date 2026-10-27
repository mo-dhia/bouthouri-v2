import { describe, expect, spyOn, test } from "bun:test";
import { Color, CubeUVReflectionMapping, Matrix4, Mesh, MeshBasicMaterial, MeshStandardMaterial, PerspectiveCamera, SRGBColorSpace, WebGLCoordinateSystem, WebGLCubeRenderTarget, WebGLRenderTarget, type Scene, type WebGLRenderer } from "three";
import { WebGLCubeUVMaps } from "three/src/renderers/webgl/WebGLCubeUVMaps.js";
import { WebGLProperties } from "three/src/renderers/webgl/WebGLProperties.js";
import { PMREMGenerator } from "three/src/extras/PMREMGenerator.js";
import { disposePrivateStoryAtlas } from "../src/sections/landing/2-story/story-atlas-ownership";
import { createStoryBoot, waitForStoryTask } from "../src/sections/landing/2-story/story-boot";
import { loadStoryMotionAssets } from "../src/sections/landing/2-story/story-motion-assets";
import { createStoryEnvironments } from "../src/sections/landing/2-story/story-assets";
import { createStoryCameraHistory } from "../src/sections/landing/2-story/story-camera-history";
import { createStoryEnvironmentLifecycle } from "../src/sections/landing/2-story/story-environment-lifecycle";
import { createStoryOpticalHistory } from "../src/sections/landing/2-story/story-optical-history";
import { sampleStoryScore } from "../src/sections/landing/2-story/story-score";
import { createMaterialProtection } from "../src/sections/landing/2-story/story-material-protection";
import { projectTerminalGlyph, terminalGlyph } from "../src/sections/landing/2-story/story-text-metrics";
import { getSettledStoryOrigin } from "../src/sections/landing/2-story/story-origin";
import en from "../src/sections/landing/3-journey/journey-en.json";
import ar from "../src/sections/landing/3-journey/journey-ar.json";
import latinCoverage from "../public/assets/textures/questrial-studio-coverage.json";
import arabicCoverage from "../public/assets/textures/cairo-studio-coverage.json";

test("source studio keeps sRGB softboxes and owns finite raw-cube refreshes", () => {
  let draws = 0, targetDisposals = 0, materialDisposals = 0;
  const materials = new Set<MeshBasicMaterial>();
  const mock = {
    coordinateSystem: WebGLCoordinateSystem, autoClear: false, xr: { enabled: true },
    getRenderTarget: () => null, getActiveCubeFace: () => 0, getActiveMipmapLevel: () => 0,
    setRenderTarget() {},
    render(scene: Scene) { draws++; scene.updateMatrixWorld(); scene.traverse((object) => {
      if (object instanceof Mesh && object.material instanceof MeshBasicMaterial) materials.add(object.material);
    }); },
  };
  const studio = createStoryEnvironments(mock as unknown as WebGLRenderer, true);
  expect(draws).toBe(12);
  expect(mock.autoClear).toBe(false); expect(mock.xr.enabled).toBe(true);
  const mapped = [...materials].filter((m) => m.map);
  expect(mapped).toHaveLength(5);
  for (const material of mapped) {
    if (!material.map) throw new Error("Missing source softbox.");
    expect(material.map.colorSpace).toBe(SRGBColorSpace);
  }
  // R3F's source unsigned-byte map conversion: encoded midpoint is not .502 linear.
  expect(new Color().setRGB(128 / 255, 128 / 255, 128 / 255, SRGBColorSpace).r).toBeCloseTo(0.21586050010324417, 14);
  studio.refresh(); expect(draws).toBe(24);
  studio.refresh(); expect(draws).toBe(36);
  studio.refresh(); expect(draws).toBe(48);
  studio.glasses.addEventListener("dispose", () => targetDisposals++);
  studio.sculpture!.addEventListener("dispose", () => targetDisposals++);
  for (const material of materials) material.addEventListener("dispose", () => materialDisposals++);
  studio.dispose(); studio.dispose();
  expect(targetDisposals).toBe(2); expect(materialDisposals).toBe(9);
  studio.refresh(); expect(draws).toBe(48);
});

test("source full-bounds recapture preserves entry/cache order independently of navigation type", () => {
  // Source1912x1009: the first pin changes top1009 to0, without a size change.
  const below = { x: 0, y: 1009, top: 1009, bottom: 2018, left: 0, right: 1912, width: 1912, height: 1009 };
  const pinned = { ...below, y: 0, top: 0, bottom: 1009 };
  const create = () => {
    let scratch = 256;
    const captures: number[] = [];
    const lifecycle = createStoryEnvironmentLifecycle(below, () => captures.push(scratch), () => { scratch = 512; });
    return { lifecycle, captures };
  };
  // Foreground assign AND reload: the child is ready before the pin measure.
  const foreground = create();
  foreground.lifecycle.activate(below); foreground.lifecycle.measure(pinned);
  expect(foreground.captures).toEqual([512]);
  // Browser DOMRect coordinates are prototype accessors, not own spread keys.
  const nativeRect = Object.create(Object.fromEntries(Object.entries(pinned).map(([key, value]) => [key, value]))) as typeof pinned;
  expect(Object.keys(nativeRect)).toHaveLength(0);
  expect(foreground.lifecycle.measure(nativeRect)).toBe(false);
  expect(foreground.lifecycle.measure(pinned)).toBe(false);
  expect(foreground.captures).toEqual([512]);
  // Hidden entry tail: the queued position measure precedes the child commit.
  const hiddenTail = create();
  hiddenTail.lifecycle.activate(pinned);
  expect(hiddenTail.captures).toEqual([256]); expect(hiddenTail.lifecycle.active).toBe(true);
  hiddenTail.lifecycle.activate(pinned);
  expect(hiddenTail.captures).toEqual([256]);
  const narrow = { ...pinned, width: 1910, right: 1910 };
  hiddenTail.lifecycle.measure(narrow); hiddenTail.lifecycle.measure(pinned);
  expect(hiddenTail.captures).toEqual([256, 512, 512]);
  hiddenTail.lifecycle.measure(below); hiddenTail.lifecycle.measure(pinned);
  expect(hiddenTail.captures).toEqual([256, 512, 512, 512, 512]);
  hiddenTail.lifecycle.dispose();
  expect(hiddenTail.lifecycle.measure(below)).toBe(false);
  expect(hiddenTail.captures).toHaveLength(5);
  const remount = create(); remount.lifecycle.measure(pinned); remount.lifecycle.activate(pinned);
  expect(remount.captures).toEqual([256]);
});

test("reading studio keeps the glasses cube while motion studios acquire and release independently", () => {
  let draws = 0, privateDisposals = 0;
  const renderer = {
    coordinateSystem: WebGLCoordinateSystem, autoClear: false, xr: { enabled: true },
    getRenderTarget: () => null, getActiveCubeFace: () => 0, getActiveMipmapLevel: () => 0,
    setRenderTarget() {}, render(scene: Scene) { draws++; scene.updateMatrixWorld(); },
  } as unknown as WebGLRenderer;
  // A genuine static boot owns only its six-face glasses studio.
  const studio = createStoryEnvironments(renderer, false), glasses = studio.glasses;
  expect(draws).toBe(6); expect(studio.sculpture).toBeUndefined();
  studio.setSculpture(false); expect(draws).toBe(6);
  studio.setSculpture(true); const first = studio.sculpture!;
  first.texture.addEventListener("dispose", () => privateDisposals++);
  expect(draws).toBe(12); expect(studio.glasses).toBe(glasses);
  studio.setSculpture(true); expect(draws).toBe(12);
  studio.setSculpture(false); studio.setSculpture(false);
  expect(privateDisposals).toBe(1); expect(studio.sculpture).toBeUndefined();
  studio.refreshGlasses(); expect(draws).toBe(18); expect(studio.glasses).toBe(glasses);
  studio.setSculpture(true);
  expect(studio.sculpture).not.toBe(first); expect(draws).toBe(24);
  studio.dispose(); studio.setSculpture(true); studio.refreshGlasses();
  expect(draws).toBe(24);
});

test("r180 versioned CubeUV branch releases its owned512 atlas without disposing256 or generator scratch", () => {
  const properties = new WebGLProperties();
  const renderer = { properties, compile() {} } as unknown as WebGLRenderer;
  const privateCube = new WebGLCubeRenderTarget(512), glassesCube = new WebGLCubeRenderTarget(256);
  const privateAtlas = new WebGLRenderTarget(1536, 2048), glassesAtlas = new WebGLRenderTarget(768, 1024), scratch = new WebGLRenderTarget(1536, 2048);
  privateAtlas.texture.mapping = glassesAtlas.texture.mapping = CubeUVReflectionMapping;
  let privateDisposals = 0, glassesDisposals = 0, scratchDisposals = 0;
  privateAtlas.addEventListener("dispose", () => privateDisposals++);
  glassesAtlas.addEventListener("dispose", () => glassesDisposals++);
  scratch.addEventListener("dispose", () => scratchDisposals++);
  const fromCube = spyOn(PMREMGenerator.prototype, "fromCubemap").mockImplementation(function (this: PMREMGenerator, texture) {
    (this as unknown as { _pingPongRenderTarget: WebGLRenderTarget })._pingPongRenderTarget = scratch;
    return texture === privateCube.texture ? privateAtlas : glassesAtlas;
  });
  const cache = new WebGLCubeUVMaps(renderer);
  try {
    privateCube.texture.needsPMREMUpdate = glassesCube.texture.needsPMREMUpdate = true;
    const privateTexture = cache.get(privateCube.texture), glassesTexture = cache.get(glassesCube.texture);
    const privateMaterial = new MeshStandardMaterial({ envMap: privateCube.texture });
    const glassesMaterial = new MeshStandardMaterial({ envMap: glassesCube.texture });
    (properties.get(privateMaterial) as { envMap: unknown }).envMap = privateTexture;
    (properties.get(glassesMaterial) as { envMap: unknown }).envMap = glassesTexture;
    const parts = [new Mesh(undefined, privateMaterial), new Mesh(undefined, privateMaterial), new Mesh(undefined, glassesMaterial)];
    // Execute the actual installed version branch: raw disposal has no listener.
    privateCube.texture.dispose(); expect(privateDisposals).toBe(0);
    expect(disposePrivateStoryAtlas(renderer, privateCube, parts)).toBe(1);
    expect(privateDisposals).toBe(1); expect(glassesDisposals).toBe(0); expect(scratchDisposals).toBe(0);
    expect(disposePrivateStoryAtlas(renderer, privateCube, parts)).toBe(0);
    expect(disposePrivateStoryAtlas(renderer, glassesCube, parts)).toBe(0);
    expect(cache.get(glassesCube.texture)).toBe(glassesTexture);
    for (const part of parts) part.geometry.dispose();
    privateMaterial.dispose(); glassesMaterial.dispose();
  } finally { fromCube.mockRestore(); cache.dispose(); privateCube.dispose(); glassesCube.dispose(); privateAtlas.dispose(); glassesAtlas.dispose(); scratch.dispose(); }
});

test("reading base readiness bypasses pending motion model/font and releases cancelled asset ownership", async () => {
  const deferred = <T,>() => { let resolve!: (value: T) => void; const promise = new Promise<T>((done) => { resolve = done; }); return { promise, resolve }; };
  const base = deferred<string>(), logo = deferred<Mesh>();
  let ready = 0, baseMounts = 0, releases = 0, modelDisposals = 0;
  const boot = createStoryBoot(base.promise, () => { baseMounts++; }, () => { ready++; });
  const controller = new AbortController();
  const motion = loadStoryMotionAssets(controller.signal, { model: () => logo.promise, lighting: async () => () => { releases++; } });
  const pendingMotion = motion.catch((error: unknown) => error);
  await Promise.resolve(); await Promise.resolve();
  const reading = boot.mount(false).then(() => boot.finish());
  base.resolve("glasses"); await reading;
  expect(ready).toBe(1); expect(baseMounts).toBe(1);
  controller.abort(); expect(await pendingMotion).toMatchObject({ name: "AbortError" }); expect(releases).toBe(1);
  const late = new Mesh(); late.geometry.addEventListener("dispose", () => modelDisposals++);
  logo.resolve(late); await Promise.resolve(); await Promise.resolve();
  expect(modelDisposals).toBe(1); expect(releases).toBe(1);
  const font = deferred<void>(), fontController = new AbortController();
  const pendingFont = waitForStoryTask(font.promise, fontController.signal).catch((error: unknown) => error);
  await boot.mount(true); boot.finish(); fontController.abort();
  expect(await pendingFont).toMatchObject({ name: "AbortError" }); expect(ready).toBe(1); expect(baseMounts).toBe(1);
  font.resolve();
  // A normal cold motion boot still waits for its attachment before its warm.
  const order: string[] = [], normalFont = deferred<void>();
  const normal = createStoryBoot(Promise.resolve("glasses"), () => order.push("base"), () => order.push("warm"));
  const normalMotion = normal.mount(true).then(async () => { await normalFont.promise; normal.finish(); });
  await Promise.resolve(); await Promise.resolve(); expect(order).toEqual(["base"]);
  normalFont.resolve(); await normalMotion; expect(order).toEqual(["base", "warm"]);
});

test("camera refresh preserves source future-start history without changing authored sampling", () => {
  const frame = (time: number) => ({ time, openingTime: 26, progress: (26 + time) / 740 });
  const continuous = createStoryCameraHistory();
  continuous.sample(frame(0), false); continuous.sample(frame(40.000852), false);
  const normal = continuous.sample(frame(59.997161), false);
  expect(normal.distance).toBeCloseTo(2.686736, 6);
  continuous.sample(frame(74.994497), false);
  expect(continuous.sample(frame(66.993056), false).distance).toBeCloseTo(1.163473, 6);
  const refreshed = createStoryCameraHistory();
  refreshed.sample(frame(0), false); refreshed.sample(frame(40.000852), false); refreshed.refresh();
  const close = refreshed.sample(frame(59.997161), false);
  expect(close.distance).toBeCloseTo(3.892087, 6);
  expect(close.rx).toBeCloseTo(0.000889, 6); expect(close.ry).toBeCloseTo(-0.002477, 6); expect(close.rz).toBeCloseTo(0.009281, 6);
  expect(refreshed.sample(frame(71), false).distance).toBeCloseTo(3.662926, 6);
  refreshed.sample(frame(40.000852), false); refreshed.refresh();
  expect(refreshed.sample(frame(59.997161), false).distance).toBeCloseTo(close.distance, 12);
  const restored = createStoryCameraHistory(); restored.sample(frame(40.000852), false);
  expect(restored.sample(frame(59.997161), false).distance).toBeCloseTo(close.distance, 12);
  const remounted = createStoryCameraHistory(); remounted.sample(frame(0), false);
  expect(remounted.sample(frame(59.997161), false).distance).toBeCloseTo(sampleStoryScore(frame(59.997161)).distance, 12);
});

test("veil refresh preserves the source 74-tween FROM and reverse plateau without changing authored scores", () => {
  const score = (time: number) => sampleStoryScore({ time, openingTime: 26, progress: (26 + time) / 740 });
  const normal = createStoryOpticalHistory(); normal.sample(score(0));
  for (const time of [40, 60, 67, 71, 72.502511, 74.353582, 78.434104, 174.007279, 72.502511, 70.491004, 40]) {
    expect(normal.sample(score(time)).opticalVeil).toBeCloseTo(score(time).opticalVeil, 12);
  }
  const refreshed = createStoryOpticalHistory(); refreshed.sample(score(0)); refreshed.sample(score(40.000852)); refreshed.refresh();
  refreshed.sample(score(174.007279));
  // Live source after40 refresh ->174 ->72.502511: veil0, darkness1, visible root.
  const reverse = refreshed.sample(score(72.502511));
  expect(reverse.opticalVeil).toBe(0); expect(reverse.opacity).toBe(1);
  expect(reverse.darkness).toBe(1); expect(reverse.distance).toBe(score(72.502511).distance);
  // Repeated/hidden same-frame sampling does not erase the held FROM value.
  expect(refreshed.sample(score(72.502511)).opticalVeil).toBe(0);
  refreshed.refresh(); expect(refreshed.sample(score(72.502511)).opticalVeil).toBe(0);
  expect(refreshed.sample(score(70.491004)).opticalVeil).toBeCloseTo(0.979274, 6);
  expect(refreshed.sample(score(72.502511)).opticalVeil).toBe(1);
  expect(refreshed.sample(score(74.353582)).opticalVeil).toBe(0);
  expect(refreshed.sample(score(78.434104)).opticalVeil).toBe(0);
  expect(refreshed.sample(score(72.502511)).opticalVeil).toBe(0);
  expect(refreshed.sample(score(69)).opticalVeil).toBeCloseTo(score(69).opticalVeil, 12);
  const restored = createStoryOpticalHistory(); restored.sample(score(40.000852)); restored.sample(score(174));
  expect(restored.sample(score(72.502511)).opticalVeil).toBe(0);
  const remounted = createStoryOpticalHistory(); remounted.sample(score(0)); remounted.sample(score(174));
  expect(remounted.sample(score(72.502511)).opticalVeil).toBe(1);
  expect(score(72.502511).opticalVeil).toBe(1);
});

describe("shared material protection", () => {
  test("releasing either owner retains the other owner's pressure protection", () => {
    const protection = createMaterialProtection();
    protection.update({ source: "portrait", active: true, pressureScale: 0.12, influence: 0, clientX: 10, clientY: 20 });
    protection.update({ source: "footer", active: true, pressureScale: 1, influence: 0.75, clientX: 10, clientY: 20 });
    expect(protection.pressureScale).toBe(0.12);
    expect(1 - 0.62 * protection.footerInfluence).toBeCloseTo(0.535, 12);
    protection.update({ source: "portrait", active: false, pressureScale: 1, influence: 0, clientX: 0, clientY: 0 });
    expect(protection.pressureScale).toBe(1);
    expect(protection.footerInfluence).toBe(0.75);
    protection.clear();
    expect(protection.footerInfluence).toBe(0);
    expect(protection.pressureScale).toBe(1);
  });
});

describe("Ideas terminal-period handoff", () => {
  test("matches live source origins before GPU boot across locale and stage geometry", () => {
    const fixtures = [
      [392, 932, false, 0.8660067435143097, 0.5672122502866337, 2.90611074648129],
      [392, 932, true, 0.06853613482513327, 0.6120552072123379, 2.318878042143656],
      [1400, 950, false, 0.857892366197614, 0.7087184771846298, 10.390371267587605],
      [1400, 950, true, 0.16527129364224508, 0.7474329737969402, 7.3850153353333],
      // 844x390 viewport: the original object stage has a 600px minimum.
      [844, 600, false, 0.8749433619431227, 0.7087184771846298, 6.562339747950105],
      [844, 600, true, 0.149323879595268, 0.7474329737969402, 4.664220211789373],
    ] as const;
    for (const [width, height, rtl, x, y, radius] of fixtures) {
      const origin = getSettledStoryOrigin(width, height, rtl);
      expect(origin.x).toBeCloseTo(x, 14); expect(origin.y).toBeCloseTo(y, 14);
      expect(origin.radius).toBeCloseTo(radius, 12); expect(origin.ready).toBe(true);
    }
  });
  test("uses the final logical caret rather than the final visual RTL glyph", () => {
    const carets = new Float32Array(20); carets[16] = -12; carets[17] = -8;
    const dot = terminalGlyph({ glyphBounds: new Float32Array([-50, 0, -40, 10, -15.6640625, 0, -4.3359375, 4, 0, 0, 20, 10]), caretPositions: carets }, "تعمل.");
    expect(dot?.x).toBe(-10); expect(dot?.y).toBe(2); expect(dot?.radius).toBe(5);
  });
  test("stays at the same SVG origin after direct seeks past the Ideas departure", () => {
    const camera = new PerspectiveCamera(34, 392 / 932, 0.005, 60);
    camera.position.z = 10 * 0.88 / camera.aspect; camera.updateMatrixWorld();
    const dot = { x: 1, y: -0.5, radius: 0.05, minX: 0.95, maxX: 1.05 };
    const baseline = projectTerminalGlyph(dot, new Matrix4().makeTranslation(-2.12, -0.24, -0.8), camera, 0, 392);
    for (const departure of [-7, 7, -13, 13]) {
      const projected = projectTerminalGlyph(dot, new Matrix4().makeTranslation(-2.12 + departure, -0.24, -0.8), camera, departure, 392);
      expect(projected.x).toBeCloseTo(baseline.x, 14); expect(projected.y).toBeCloseTo(baseline.y, 14);
      expect(projected.radius).toBeCloseTo(baseline.radius, 12);
    }
  });
});

type Node = string | { props: Record<string, unknown>; children: Node[] };
function text(node: Node): string { return typeof node === "string" ? node : node.children.map(text).join(" "); }
function sceneCopy(node: Node): string[] {
  if (typeof node === "string") return [];
  const className = String(node.props?.className ?? "");
  if (className.includes("spatial-description") || className.includes("quiet-outlook")) return [text(node)];
  return node.children.flatMap(sceneCopy);
}
test("both locale scenes are covered by local studio fonts without CDN fallback", () => {
  for (const [node, coverage] of [[en, latinCoverage], [ar, arabicCoverage]] as const) {
    const available = new Set(coverage);
    for (const copy of sceneCopy(node as Node)) for (const character of copy) {
      if (!/\s/u.test(character)) expect(available.has(character.codePointAt(0)!)).toBe(true);
    }
  }
});
