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

async function typography(width: number, actualHeight: number, rtl = false) {
  const stage = Object.assign(new EventTarget(), {
    dataset: {} as Record<string, string>,
    querySelectorAll: () => Array.from({ length: 3 }, () => ({ textContent: "Meaning", nextElementSibling: { textContent: "Body" } })),
    querySelector: (selector: string) => selector.includes("eyebrow") ? { textContent: "Intro" } : {
      childNodes: [{ nodeName: "#text", textContent: "Ideas" }, { nodeName: "BR" }, { nodeName: "#text", textContent: "Work." }],
    },
  });
  const reference = viewport.viewportDesign(width), aspect = reference.width / reference.height;
  const camera = new three.PerspectiveCamera(34, aspect, 0.005, 60);
  camera.position.z = 10 * Math.max(1, 0.88 / aspect); camera.lookAt(0, 0, 0);
  const scene = new three.Scene(), root = new three.Group(); scene.add(root);
  const planes: { mesh: three.Object3D; fontSize: number; disposed: boolean }[] = [];
  const loaded = evaluate("./story-type.ts", { document: { documentElement: { lang: rtl ? "ar" : "en" } }, CustomEvent, console }, {
    three, "@/lib/viewport-design": viewport, "./story-score": score, "./story-text-metrics": metrics,
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
  const controller = await loaded.createSpatialType(stage as unknown as HTMLElement, scene, root, camera, width, actualHeight);
  controller.update(270);
  const projected = () => planes.map(({ mesh, fontSize }) => {
    const a = new three.Vector3(0, 0, 0).applyMatrix4(mesh.matrixWorld).project(camera);
    const b = new three.Vector3(0, fontSize, 0).applyMatrix4(mesh.matrixWorld).project(camera);
    return { x: (a.x + 1) * width / 2, y: (1 - a.y) * viewport.designHeight(width) / 2,
      font: Math.abs(b.y - a.y) * viewport.designHeight(width) / 2 };
  });
  return { stage, camera, scene, root, planes, controller, origins, projected };
}

test("spatial type uses fixed reference frusta; projected text and terminal geometry scale proportionally", async () => {
  for (const reference of Object.values(viewport.viewportDesigns)) for (const rtl of [false, true]) {
    const a = await typography(reference.width, reference.height, rtl);
    const b = await typography(reference.width * 1.25, reference.height * 0.6, rtl);
    expect(viewport.designScale(reference.width)).toBe(1);
    expect(a.camera.aspect).toBe(reference.width / reference.height);
    expect(a.camera.aspect).toBe(b.camera.aspect);
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

test("tablet type stays fixed across 700px and same-width height changes; resize retains the text graph", async () => {
  const cases = await Promise.all([typography(650, 300), typography(700, 1400), typography(900, 400), typography(900, 1800)]);
  for (const h of cases) {
    expect(h.camera.aspect).toBe(768 / 1024);
    expect(h.planes.map((plane) => plane.fontSize)).toEqual(cases[0].planes.map((plane) => plane.fontSize));
    const planes = h.planes.slice(), before = h.origins.at(-1)!;
    h.controller.resize(960, 250); h.controller.update(270);
    expect(h.planes).toEqual(planes); expect(h.planes.some((plane) => plane.disposed)).toBe(false);
    expect(h.origins.at(-1)!.x).toBe(before.x); expect(h.origins.at(-1)!.y).toBe(before.y);
  }
  const projected = cases[2].projected();
  expect(cases[3].projected()).toEqual(projected);
  cases.forEach((h) => h.controller.dispose());
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
