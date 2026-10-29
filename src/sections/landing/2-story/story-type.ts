import { Group, Vector3, type PerspectiveCamera, type Scene } from "three";
import { clamp, smooth } from "./story-score";
import { createSceneText, prepareSceneFont } from "./story-text";
import { projectTerminalGlyph } from "./story-text-metrics";
import { waitForStoryTask } from "./story-boot";
import { viewportDesign } from "@/lib/viewport-design";

export type WorkOrigin = { x: number; y: number; radius: number; ready: boolean; direction: "ltr" | "rtl" };
type TextPlane = ReturnType<typeof createSceneText>;

function headingLines(heading: Element | null) {
  if (!heading) return [];
  const lines = [""];
  for (const child of heading.childNodes) {
    if (child.nodeName === "BR") lines.push("");
    else lines[lines.length - 1] += child.textContent ?? "";
  }
  return lines.map((line) => line.trim()).filter(Boolean);
}

export async function createSpatialType(stage: HTMLElement, scene: Scene, sculptureRoot: Group, camera: PerspectiveCamera, width: number, _height: number, invalidate?: () => void, signal?: AbortSignal, designViewportWidth = width) {
  const rtl = document.documentElement.lang === "ar";
  const headings = [...stage.querySelectorAll<HTMLElement>(".spatial-description h2")].slice(0, 3);
  const meaningCopy = headings.map((heading) => [heading.textContent ?? "", heading.nextElementSibling?.textContent ?? ""]);
  const ideasLines = headingLines(stage.querySelector(".quiet-outlook h2"));
  const ideasIntro = stage.querySelector(".quiet-outlook .eyebrow")?.textContent ?? "";
  const font = prepareSceneFont(rtl, [...meaningCopy.flat(), ...ideasLines, ideasIntro]);
  await (signal ? waitForStoryTask(font, signal) : font);
  const meaningRoot = new Group(), ideasRoot = new Group();
  // Async motion upgrades share a live glasses canvas. Hide Ideas until the
  // owning controller adopts the completed layout and supplies its first score.
  ideasRoot.visible = false;
  meaningRoot.name = "Sculpture_Meanings_Foreground"; ideasRoot.name = "Ideas_Put_To_Work_Foreground";
  sculptureRoot.add(meaningRoot); scene.add(ideasRoot);
  let planes: TextPlane[] = [];
  let meanings: { group: Group; title: TextPlane; copy: TextPlane; baseY: number; font: number; start: number; clear: number }[] = [];
  let ideas: TextPlane[] = [], intro: TextPlane | null = null;
  // CSS viewport selects the composition; measured host width sizes projection.
  let hostWidth = width, design = viewportDesign(designViewportWidth), portrait = false, ideaX = 0, ideaSize = 0, ideaY = [0.9, -0.24];
  const point = new Vector3(), edge = new Vector3();
  let previousOrigin: WorkOrigin | null = null;
  let generation = 0, disposed = false, layoutReady = false;
  const create = async () => {
    const current = ++generation;
    layoutReady = false;
    for (const plane of planes) plane.dispose(); planes = []; meaningRoot.clear(); meanings = []; ideas = [];
    const make = (...args: Parameters<typeof createSceneText>) => { const plane = createSceneText(...args); planes.push(plane); return plane; };
    const aspect = design.width / design.height;
    portrait = aspect < 0.88;
    const viewHeight = 2 * Math.tan(34 * Math.PI / 360) * (10 * Math.max(1, 0.88 / aspect) + 0.4);
    const bodyY = -0.24 * viewHeight, scale = rtl ? 1.02 : 1.075;
    const layouts = portrait ? [
      { x: -2.25, y: 0.8, z: -1.15, font: 0.56, copy: [-2.1, bodyY, -0.35], width: 4.2 },
      { x: -2.45, y: 0.4, z: -1, font: 0.67, copy: [-2.1, bodyY, -0.4], width: 4.2 },
      { x: -2.22, y: 1.25, z: -1.1, font: 0.57, copy: [-2.1, bodyY, -0.45], width: 4.2 },
    ] : [
      { x: -4.35, y: 0.73, z: -1, font: 1.01, copy: [-3.75, -1.3, -0.35], width: 2.8 },
      { x: -3.85, y: 0.49, z: -1.1, font: 1.12, copy: [1.9, -1.75, -0.45], width: 2.65 },
      { x: -4.22, y: 1.45, z: -1.05, font: 1.05, copy: [-4.1, -1.65, -0.4], width: 3.1 },
    ];
    if (rtl && !portrait) { const right = layouts[0].copy[0] + layouts[0].width; layouts[0].width = 3.6; layouts[0].copy[0] = right - 3.6; layouts[1].copy = [-4.1, -1.4, -0.45]; layouts[1].width = 3.1; }
    const cameraZ = 10 * Math.max(1, 0.88 / aspect);
    meaningCopy.forEach(([titleCopy, bodyCopy], index) => {
      const layout = layouts[index], font = layout.font * scale * (rtl ? portrait ? 1.55 : 1.6 : 1);
      const title = make(titleCopy, font, rtl, rtl ? 0 : -0.039);
      const copySize = (portrait ? 0.3 * clamp(viewHeight / 11, 0.78, 1) : rtl ? 0.31 : 0.255) * scale;
      const copy = make(bodyCopy, copySize, rtl, 0, layout.width, rtl ? 1.75 : 1.18, "#c4bfb3", 128, rtl && index === 0 ? "right" : undefined);
      title.mesh.position.set(layout.x + (rtl ? portrait ? 4.2 : 6.8 : 0), layout.y, layout.z);
      copy.mesh.position.set(layout.copy[0] + (rtl ? layout.width : 0), layout.copy[1], layout.copy[2]); copy.mesh.renderOrder = 1001;
      const group = new Group(); group.add(title.mesh, copy.mesh); meaningRoot.add(group);
      meanings.push({ group, title, copy, baseY: layout.y, font, start: [122, 166, 210][index], clear: [141, 185, 232][index] });
    });
    ideaX = rtl ? portrait ? 2.12 : 3.78 : portrait ? -2.12 : -3.78;
    ideaSize = (rtl ? portrait ? 1.03 : 1.6 : portrait ? 0.94 : 1.35) * scale;
    ideaY = rtl ? [1.1, -0.6] : [0.9, -0.24];
    ideasLines.forEach((line, index) => {
      const font = index ? ideaSize * (rtl ? 0.68 : portrait ? 0.84 : 1.02) : ideaSize;
      const plane = make(line, font, rtl, rtl ? 0 : -(index ? -0.025 : -0.055) * (-0.039 / 0.065));
      ideasRoot.add(plane.mesh); ideas.push(plane);
    });
    intro = make(ideasIntro, portrait ? 0.13 : 0.105, rtl, rtl ? 0 : 0.12, Infinity, undefined, "#a9a79f", 64);
    intro.mesh.renderOrder = 1001; intro.mesh.position.set(ideaX, portrait ? 2.08 : 1.8, -0.8); ideasRoot.add(intro.mesh);
    const batch = [...planes];
    try { await Promise.all(batch.map((plane) => plane.ready)); }
    catch (error) {
      for (const plane of batch) plane.dispose();
      if (disposed || current !== generation) return false;
      throw error;
    }
    if (disposed || current !== generation) return false;
    if (rtl) meanings.forEach(({ title, copy, font }, index) => {
      const layout = layouts[index];
      const perspective = (cameraZ - layout.copy[2]) / (cameraZ - layout.z);
      copy.mesh.position.y = Math.min(layout.copy[1], (layout.y + title.ink.min) * perspective - copy.ink.max - 0.18 * font);
      const lift = Math.max(0, -0.64 * Math.tan(17 * Math.PI / 180) * (cameraZ - layout.copy[2]) - copy.mesh.position.y - copy.ink.min);
      copy.mesh.position.y += lift; title.mesh.position.y += lift / perspective;
    });
    if (rtl && ideas.length === 2) {
      ideaY[1] = Math.min(-0.6, 1.1 + ideas[0].ink.min - ideas[1].ink.max - 0.16 * ideaSize);
      const lift = Math.max(0, -0.64 * Math.tan(34 * Math.PI / 360) * (cameraZ + 0.8) - ideaY[1] - ideas[1].ink.min);
      ideaY = ideaY.map((y) => y + lift);
    }
    previousOrigin = null;
    layoutReady = true;
    return true;
  };
  try { const layout = create(); await (signal ? waitForStoryTask(layout, signal) : layout); }
  catch (error) { disposed = true; generation++; for (const plane of planes) plane.dispose(); meaningRoot.removeFromParent(); ideasRoot.removeFromParent(); throw error; }
  stage.dataset.storyTextRenderer = "troika-sdf";
  let latestTime = Number(stage.dataset.storyTime ?? 0);
  const controller = {
    resize(width: number, _height: number, designViewportWidth = width) {
      void _height; // Physical viewport height does not select or size the design.
      hostWidth = width;
      const nextDesign = viewportDesign(designViewportWidth);
      if (nextDesign === design) return;
      design = nextDesign;
      void create().then((ready) => { if (!disposed && ready) { controller.update(latestTime); invalidate?.(); } }).catch((error: unknown) => {
        if (!disposed) { stage.dataset.storyScene = "failed"; console.error("Optional scene text resize failed.", error); }
      });
    },
    update(time: number) {
      latestTime = time;
      if (!layoutReady) return;
      for (const meaning of meanings) {
        const enter = smooth(meaning.start, meaning.start + 8, time), exit = smooth(meaning.clear, meaning.clear + 14, time);
        const index = meanings.indexOf(meaning);
        meaning.group.position.set((index === 1 ? 1 : -1) * exit * (portrait ? 1.7 : 3.3), 0.1 * enter + 0.6 * exit, -0.65 * exit);
        meaning.group.rotation.set(0, exit * (index === 1 ? -0.05 : 0.04), 0);
        meaning.group.visible = time >= meaning.start && time < meaning.clear + 14;
        meaning.title.clip.set(-30, -meaning.font * (rtl ? 2.1 * (1 - exit) : 1.6) * enter, 30, 0);
        meaning.title.opacity(rtl ? 1 : 1 - exit * exit);
        meaning.copy.opacity(rtl ? 1 : enter * (1 - exit * exit));
        if (rtl) meaning.copy.clip.set(-30, -2.2 * enter * (1 - exit), 30, 0);
      }
      const exit = smooth(280, 305, time);
      ideasRoot.visible = time >= 241 && time < 306;
      ideasRoot.position.x = (rtl ? 1 : -1) * exit * (portrait ? 7 : 13);
      ideas.forEach((plane, index) => {
        const enter = smooth(index ? 248 : 241, index ? 270 : 258, time);
        plane.opacity(rtl ? 1 : 1 - exit);
        plane.mesh.position.set(ideaX, ideaY[index] - (1 - enter) * 0.24, -0.8);
        plane.clip.set(rtl ? -12 : -1, -ideaSize * (rtl ? 2.1 : 1.7) * enter, rtl ? 1 : portrait ? 5 : 10, 1);
      });
      if (intro) {
        intro.opacity(rtl ? 1 : 0.64 * smooth(260, 274, time) * (1 - exit));
        if (rtl) intro.clip.set(-30, -0.5 * smooth(260, 274, time), 30, 0);
      }
      if (ideas[1]) {
        const plane = ideas[1], dot = plane.dot;
        if (!dot) return;
        scene.updateMatrixWorld(true); camera.updateMatrixWorld();
        const origin: WorkOrigin = { ...projectTerminalGlyph(dot, plane.mesh.matrixWorld, camera, ideasRoot.position.x, hostWidth, [point, edge]),
          ready: true, direction: rtl ? "rtl" : "ltr" };
        if (!previousOrigin || Math.abs(previousOrigin.x - origin.x) + Math.abs(previousOrigin.y - origin.y) + Math.abs(previousOrigin.radius - origin.radius) > 1e-5) {
          stage.dispatchEvent(new CustomEvent<WorkOrigin>("story-origin", { detail: origin })); previousOrigin = origin;
        }
        if (time >= 270) { if (rtl) plane.clip.x = dot.maxX; else plane.clip.z = dot.minX; }
      }
    },
    dispose() { disposed = true; generation++; for (const plane of planes) plane.dispose(); meaningRoot.removeFromParent(); ideasRoot.removeFromParent(); delete stage.dataset.storyTextRenderer; },
  };
  return controller;
}
