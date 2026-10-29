import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import ts from "typescript";
import * as three from "three";
import * as viewport from "@/lib/viewport-design";
import * as score from "./story-score";
import * as metrics from "./story-text-metrics";
import type { createSpatialType, WorkOrigin } from "./story-type";
import type { createStoryPointer } from "./story-pointer";

function evaluate(file: string, globals: Record<string, unknown>, dependencies: Record<string, unknown>) {
  const source = readFileSync(new URL(file, import.meta.url), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const evaluated = { exports: {} };
  runInContext(`(function(require,module,exports){${js}\n})`, createContext(globals))((name: string) => {
    if (!(name in dependencies)) throw new Error(`Unexpected story design dependency: ${name}`);
    return dependencies[name];
  }, evaluated, evaluated.exports);
  return evaluated.exports;
}

async function typography(width: number, height: number, rtl = false) {
  const stage = Object.assign(new EventTarget(), {
    dataset: {} as Record<string, string>,
    querySelectorAll: () => Array.from({ length: 3 }, () => ({ textContent: "Meaning", nextElementSibling: { textContent: "Body" } })),
    querySelector: (selector: string) => selector.includes("eyebrow") ? { textContent: "Intro" } : {
      childNodes: [{ nodeName: "#text", textContent: "Ideas" }, { nodeName: "BR" }, { nodeName: "#text", textContent: "Work." }],
    },
  });
  // The scene camera follows the measured physical host, as story-scene does.
  const size = { width, height }, camera = new three.PerspectiveCamera(34, width / height, 0.005, 60);
  const frame = () => {
    camera.aspect = size.width / size.height;
    camera.position.z = 10 * Math.max(1, 0.88 / camera.aspect); camera.lookAt(0, 0, 0); camera.updateProjectionMatrix();
  };
  frame();
  const scene = new three.Scene(), root = new three.Group(); scene.add(root);
  const planes: { mesh: three.Object3D; fontSize: number; disposed: boolean }[] = [];
  const loaded = evaluate("./story-type.ts", { document: { documentElement: { lang: rtl ? "ar" : "en" } }, CustomEvent, console }, {
    three, "./story-score": score, "./story-text-metrics": metrics,
    "./story-boot": {},
    "./story-text": {
      prepareSceneFont: () => Promise.resolve(),
      createSceneText(_text: string, fontSize: number) {
        const plane = {
          mesh: new three.Object3D(), fontSize, disposed: false, ready: Promise.resolve(),
          ink: { min: -fontSize, max: 0 }, dot: { x: 1, y: -0.3, radius: 0.1, minX: 0.9, maxX: 1.1 },
          clip: { set() {}, x: 0, z: 0 }, opacity() {}, dispose() { this.disposed = true; this.mesh.removeFromParent(); },
        };
        planes.push(plane); return plane;
      },
    },
  }) as { createSpatialType: typeof createSpatialType };
  const origins: WorkOrigin[] = [];
  stage.addEventListener("story-origin", (event) => origins.push((event as CustomEvent<WorkOrigin>).detail));
  const controller = await loaded.createSpatialType(stage as unknown as HTMLElement, scene, root, camera, width, height);
  controller.update(270);
  const active = () => planes.filter((plane) => !plane.disposed);
  const projected = () => active().map(({ mesh, fontSize }) => {
    const a = new three.Vector3(0, 0, 0).applyMatrix4(mesh.matrixWorld).project(camera);
    const b = new three.Vector3(0, fontSize, 0).applyMatrix4(mesh.matrixWorld).project(camera);
    return { x: (a.x + 1) * size.width / 2, y: (1 - a.y) * size.height / 2, font: Math.abs(b.y - a.y) * size.height / 2 };
  });
  return {
    stage, camera, scene, root, planes, controller, origins, projected, active, size,
    async resize(nextWidth: number, nextHeight: number) {
      size.width = nextWidth; size.height = nextHeight; frame();
      controller.resize(nextWidth, nextHeight);
      // Real font planes settle asynchronously, even with this inert adapter.
      for (let step = 0; step < 6; step++) await Promise.resolve();
      controller.update(270);
    },
  };
}

test("spatial type frames the physical host; equal proportions at another scale project proportionally", async () => {
  for (const reference of Object.values(viewport.viewportDesigns)) for (const rtl of [false, true]) {
    const a = await typography(reference.width, reference.height, rtl);
    const b = await typography(reference.width * 1.25, reference.height * 1.25, rtl);
    expect(a.camera.aspect).toBe(reference.width / reference.height);
    expect(b.camera.aspect).toBeCloseTo(a.camera.aspect, 12);
    const projected = a.projected();
    b.projected().forEach((plane, i) => {
      expect(plane.x).toBeCloseTo(projected[i].x * 1.25, 9);
      expect(plane.y).toBeCloseTo(projected[i].y * 1.25, 9);
      expect(plane.font).toBeCloseTo(projected[i].font * 1.25, 9);
      expect(a.planes[i].fontSize).toBe(b.planes[i].fontSize);
    });
    expect(b.origins.at(-1)!.radius).toBeCloseTo(a.origins.at(-1)!.radius * 1.25, 10);
    for (const h of [a, b]) {
      expect(h.planes.every(({ mesh }) => mesh.matrixWorld.elements.every(Number.isFinite))).toBe(true);
      expect(h.origins.every((origin) => [origin.x, origin.y, origin.radius].every(Number.isFinite))).toBe(true);
      h.controller.dispose(); expect(h.planes.every((plane) => plane.disposed)).toBe(true);
      expect(h.root.children).toHaveLength(0); expect(h.scene.children).toEqual([h.root]);
    }
  }
});

test("host proportions, not the width profile, select the portrait or landscape type composition", async () => {
  for (const rtl of [false, true]) {
    // First title x: the portrait and landscape source layouts, mirrored for Arabic.
    const titleX = (portrait: boolean) => portrait ? rtl ? -2.25 + 4.2 : -2.25 : rtl ? -4.35 + 6.8 : -4.35;
    for (const [width, height, portrait] of [[1920, 1080, false], [1920, 2400, true], [1024, 700, false], [768, 1024, true], [412, 915, true], [600, 400, false]] as const) {
      const h = await typography(width, height, rtl);
      try { expect(h.planes[0].mesh.position.x).toBeCloseTo(titleX(portrait), 12); }
      finally { h.controller.dispose(); }
    }
  }
});

test("type has no 700px switch; an identical host resize retains the text graph", async () => {
  const cases = await Promise.all([typography(650, 650 * 4 / 3), typography(700, 700 * 4 / 3), typography(900, 1200)]);
  for (const h of cases) {
    expect(h.planes.map((plane) => plane.fontSize)).toEqual(cases[0].planes.map((plane) => plane.fontSize));
    const planes = h.planes.slice(), before = h.origins.at(-1)!;
    await h.resize(h.size.width, h.size.height);
    expect(h.planes).toEqual(planes); expect(h.planes.some((plane) => plane.disposed)).toBe(false);
    expect(h.origins.at(-1)).toBe(before);
  }
  const projected = cases[0].projected();
  cases[1].projected().forEach((plane, i) => {
    expect(plane.x).toBeCloseTo(projected[i].x * 700 / 650, 9); expect(plane.y).toBeCloseTo(projected[i].y * 700 / 650, 9);
  });
  cases.forEach((h) => h.controller.dispose());
});

for (const rtl of [false, true]) test(`${rtl ? "AR" : "EN"} host width or height changes rebuild type and clean up the prior graph`, async () => {
  const fixture = await typography(1010, 700, rtl);
  try {
    for (const [width, height] of [[1010, 700], [1200, 700], [1200, 1600], [586, 1300], [586, 1300], [1905, 1080]]) {
      const unchanged = width === fixture.size.width && height === fixture.size.height, oldPlanes = fixture.active();
      await fixture.resize(width, height);
      const activePlanes = fixture.active(), reference = await typography(width, height, rtl);
      try {
        if (unchanged) expect(activePlanes.every((plane, index) => plane === oldPlanes[index])).toBe(true);
        else { expect(oldPlanes.every((plane) => plane.disposed)).toBe(true); expect(activePlanes).toHaveLength(oldPlanes.length); }
        expect(fixture.root.children).toHaveLength(reference.root.children.length);
        expect(activePlanes.map((plane) => plane.fontSize)).toEqual(reference.planes.map((plane) => plane.fontSize));
        expect(activePlanes.map(({ mesh }) => mesh.matrixWorld.elements)).toEqual(reference.planes.map(({ mesh }) => mesh.matrixWorld.elements));
        const origin = fixture.origins.at(-1)!, expected = reference.origins.at(-1)!;
        expect(origin.x).toBeCloseTo(expected.x, 12); expect(origin.y).toBeCloseTo(expected.y, 12);
        expect(origin.radius).toBeCloseTo(expected.radius, 12);
      } finally { reference.controller.dispose(); }
    }
  } finally { fixture.controller.dispose(); }
  expect(fixture.planes.every((plane) => plane.disposed)).toBe(true);
  expect(fixture.root.children).toHaveLength(0); expect(fixture.scene.children).toEqual([fixture.root]);
  expect(fixture.stage.dataset.storyTextRenderer).toBeUndefined();
});

test("object pointer pull uses the physical canvas basis and releases capture/listeners on disposal", () => {
  const window = new EventTarget(), document = Object.assign(new EventTarget(), { hidden: false });
  const fine = Object.assign(new EventTarget(), { matches: true });
  const canvas = Object.assign(new EventTarget(), {
    style: { cursor: "" }, dataset: {} as Record<string, string>,
    getBoundingClientRect: () => ({ left: 20, right: 820, top: 40, bottom: 490, width: 800, height: 450 }),
    hasPointerCapture: () => captured, setPointerCapture: () => { captured = true; }, releasePointerCapture: () => { captured = false; },
  });
  let captured = false, invalidations = 0;
  const camera = new three.PerspectiveCamera(34, 1920 / 1080, 0.005, 60);
  camera.position.z = 10; camera.updateMatrixWorld();
  const plane = new three.Mesh(new three.PlaneGeometry(20, 20), new three.MeshBasicMaterial()); plane.updateMatrixWorld();
  const loaded = evaluate("./story-pointer.ts", { window, document, matchMedia: () => fine }, { three, "./story-score": score }) as { createStoryPointer: typeof createStoryPointer };
  const pointer = loaded.createStoryPointer(canvas as unknown as HTMLCanvasElement, camera, () => invalidations++);
  pointer.setObjects([plane]); pointer.advance(1 / 60, 0, 1);
  const event = (type: string, x: number, y: number) => Object.assign(new Event(type), { clientX: x, clientY: y, pointerId: 1, button: 0 });
  canvas.dispatchEvent(event("pointerdown", 420, 265)); expect(captured).toBe(true);
  window.dispatchEvent(event("pointermove", 465, 265));
  expect(pointer.state.targetX).toBeCloseTo(45 / 400, 12); expect(pointer.state.targetY).toBe(0);
  expect(pointer.pulls[0].tx).toBeCloseTo(0.38 * Math.tanh(0.5), 12);
  expect(pointer.pulls.every((pull) => [pull.tx, pull.ty, pull.x, pull.y].every(Number.isFinite))).toBe(true);
  pointer.dispose(); expect(captured).toBe(false); expect(canvas.style.cursor).toBe("");
  const before = invalidations; window.dispatchEvent(event("pointermove", 800, 400));
  expect(invalidations).toBe(before); plane.geometry.dispose(); (plane.material as three.Material).dispose();
});
