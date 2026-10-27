import { ACESFilmicToneMapping, PerspectiveCamera, Scene, SRGBColorSpace, WebGLRenderer, type Object3D, type WebGLRenderTarget } from "three";
import { acquireStoryLighting, createStoryEnvironment, disposeObject, loadStoryModel } from "./story-assets";
import { createGlasses } from "./story-glasses";
import { createSculptures } from "./story-logo";
import { createStoryPointer } from "./story-pointer";
import { sampleStoryScore, type StoryFrame } from "./story-score";
import { createSpatialType } from "./story-type";
import type { SceneInteraction } from "./story-environment.animate";
import styles from "./story-scene.module.css";

export type StorySceneOptions = { staticMode?: boolean; onReady?: () => void; onFailure?: () => void };

/** Deferred scene leaf. The parent owns SSR, native pinning and the sole story clock. */
export function mountStoryScene(stage: HTMLElement, options: StorySceneOptions = {}): () => void {
  const candidate = stage.querySelector<HTMLElement>(".canvas-layer");
  if (!candidate) return () => {};
  const host: HTMLElement = candidate;
  const staticMode = options.staticMode ?? false;
  const previousDisplay = host.style.getPropertyValue("display");
  const previousDisplayPriority = host.style.getPropertyPriority("display");
  // The SSR fallback rule hides enhancement hosts when native reading mode has
  // removed its pin flag. The source still shows one static glasses frame there.
  if (staticMode) host.style.display = "block";
  const restoreDisplay = () => {
    if (previousDisplay) host.style.setProperty("display", previousDisplay, previousDisplayPriority);
    else host.style.removeProperty("display");
  };
  let disposed = false, lost = false, ready = false, frameId = 0;
  let width = Math.max(1, host.clientWidth), height = Math.max(1, host.clientHeight);
  let visible = false, menuOpen = document.documentElement.dataset.menuOpen === "true";
  let elapsed = 0, lastRender = 0, sceneReady = false;
  let frame: StoryFrame = {
    time: Number(stage.dataset.storyTime ?? 0), openingTime: Number(stage.dataset.openingTime ?? 0), progress: Number(stage.dataset.progress ?? 0),
  };
  const previousState = stage.getAttribute("data-story-scene");
  const previousOpacity = host.style.getPropertyValue("opacity");
  const previousOpacityPriority = host.style.getPropertyPriority("opacity");
  stage.dataset.storyScene = "loading";
  stage.dataset.storyBoot = "context";
  const canvas = document.createElement("canvas");
  canvas.className = styles.canvas; canvas.setAttribute("aria-hidden", "true");
  canvas.dataset.asset = "original-gazzar-glasses-and-sculptures";
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setClearColor(0x090909, 0); renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1; renderer.transmissionResolutionScale = 0.5;
    renderer.outputColorSpace = SRGBColorSpace;
  } catch {
    stage.dataset.storyBoot = "failed"; stage.dataset.storyScene = "failed"; options.onFailure?.();
    return () => {
      restoreDisplay();
      if (stage.dataset.storyFailed === "true") { stage.dataset.storyScene = "failed"; stage.dataset.storyBoot = "failed"; }
      else { delete stage.dataset.storyBoot; if (previousState === null) delete stage.dataset.storyScene; else stage.setAttribute("data-story-scene", previousState); }
    };
  }
  host.append(canvas);
  const scene = new Scene(), camera = new PerspectiveCamera(34, width / height, 0.005, 60);
  camera.position.set(0, 0, 10);
  let models: Object3D[] = [], environments: WebGLRenderTarget[] = [];
  let releaseLighting: (() => void) | undefined;
  let glasses: ReturnType<typeof createGlasses> | undefined;
  let sculptures: ReturnType<typeof createSculptures> | undefined;
  let typography: Awaited<ReturnType<typeof createSpatialType>> | undefined;
  const stopFrame = () => { if (frameId) cancelAnimationFrame(frameId); frameId = 0; lastRender = 0; };
  const isActive = () => !disposed && !lost && visible && !document.hidden && !menuOpen && frame.time < 306;
  const fail = (error?: unknown) => {
    if (disposed) return;
    lost = true; stopFrame(); canvas.style.opacity = "0";
    stage.dataset.storyBoot = "failed"; stage.dataset.storyScene = "failed"; options.onFailure?.();
    if (error) console.error("Optional Gazzar story scene failed.", error);
  };
  function requestRender() {
    if (!frameId && sceneReady && isActive()) frameId = requestAnimationFrame(render);
  }
  const pointer = createStoryPointer(canvas, camera, requestRender);
  if (staticMode) pointer.setActive(false);
  const currentScore = () => {
    const score = sampleStoryScore(staticMode ? { time: 0, openingTime: 26, progress: 26 / 740 } : frame, width < 701);
    if (staticMode) score.idle = 0;
    return score;
  };
  function render(now: number, warm = false) {
    frameId = 0;
    if (!sceneReady || (!warm && !isActive()) || disposed || lost || document.hidden || !glasses || !staticMode && (!sculptures || !typography)) return;
    const dt = lastRender ? Math.min((now - lastRender) / 1000, 0.05) : 1 / 60;
    elapsed += dt; lastRender = now;
    const score = currentScore();
    const pointerMoving = pointer.advance(dt, score.time, score.emergence);
    const glassMoving = glasses.update(score, pointer, width / height, elapsed, dt);
    const logoMoving = sculptures?.update(score, pointer, dt) ?? false;
    camera.updateMatrixWorld();
    stage.dispatchEvent(new CustomEvent<SceneInteraction>("journey-scene-interaction", {
      detail: { guards: sculptures?.guards(camera, score.environment) ?? [], grabbed: pointer.pulls.some((pull) => pull.held) },
    }));
    typography?.update(score.time);
    try {
      glasses.shadow(renderer, score);
      renderer.render(scene, camera);
    } catch (error) { fail(error); return; }
    canvas.style.opacity = String(score.opacity);
    // The reference CSS initializes the host at opacity:0. Its dynamic veil now
    // belongs to our canvas, so expose the host only after a successful frame.
    host.style.opacity = "1";
    canvas.dataset.visualTime = score.time.toFixed(3); canvas.dataset.emergence = score.emergence.toFixed(3);
    canvas.dataset.camera = [camera.position.x, camera.position.y, camera.position.z].map((n) => n.toFixed(5)).join(",");
    if (!ready) { ready = true; stage.dataset.storyBoot = "ready"; stage.dataset.storyScene = "ready"; options.onReady?.(); }
    if (!warm && !staticMode && (pointerMoving || glassMoving || logoMoving)) requestRender();
  }
  function measure() {
    width = Math.max(1, host.clientWidth || stage.clientWidth);
    height = Math.max(1, host.clientHeight || stage.clientHeight);
    renderer.setPixelRatio(Math.min(Math.max(1, devicePixelRatio), width < 701 ? 1.5 : 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height; camera.updateProjectionMatrix();
    const rect = stage.getBoundingClientRect(); visible = rect.bottom > 0 && rect.top < innerHeight && rect.width > 0;
    pointer.measure(); sculptures?.resize(width / height); typography?.resize(width, height);
    canvas.dataset.dpr = String(renderer.getPixelRatio());
    requestRender();
  }
  function onFrame(event: Event) {
    if (staticMode) return;
    const next = (event as CustomEvent<StoryFrame>).detail;
    if (!next || !Number.isFinite(next.time) || !Number.isFinite(next.openingTime)) return;
    frame = next;
    stage.dataset.storyActivity = visible ? document.hidden ? "hidden" : menuOpen ? "menu" : "visible" : "offscreen";
    // The parent dispatches inside its scroll-engine RAF. Render synchronously in
    // that owner; the local RAF is exclusively for idle/pointer settling.
    if (frameId) { cancelAnimationFrame(frameId); frameId = 0; }
    if (frame.time >= 306) {
      canvas.style.opacity = "0"; stopFrame();
      // Restores can skip Ideas entirely. Its settled pen origin is a CPU
      // projection even after the object canvas has stopped drawing.
      if (typography) {
        camera.position.set(0, 0, 10 * Math.max(1, 0.88 / (width / height))); camera.lookAt(0, 0, 0);
        camera.updateMatrixWorld(); typography.update(frame.time);
      }
    }
    else render(performance.now());
  }
  const visibility = () => {
    if (document.hidden) { pointer.setActive(false); stopFrame(); }
    else {
      pointer.setActive(!staticMode && visible && !menuOpen);
      if (sceneReady && !ready) render(performance.now(), true);
      requestRender();
    }
  };
  const contextLost = (event: Event) => { event.preventDefault(); fail(); };
  const intersection = new IntersectionObserver(([entry]) => {
    visible = Boolean(entry?.isIntersecting && entry.intersectionRatio > 0);
    pointer.setActive(!staticMode && visible && !document.hidden && !menuOpen);
    if (visible) { pointer.measure(); requestRender(); } else stopFrame();
  }, { threshold: 0.001 });
  intersection.observe(stage);
  const resize = new ResizeObserver(measure); resize.observe(host);
  const menu = new MutationObserver(() => {
    menuOpen = document.documentElement.dataset.menuOpen === "true";
    pointer.setActive(!staticMode && visible && !document.hidden && !menuOpen);
    if (menuOpen) stopFrame(); else requestRender();
  });
  menu.observe(document.documentElement, { attributes: true, attributeFilter: ["data-menu-open"] });
  stage.addEventListener("journey-frame", onFrame);
  document.addEventListener("visibilitychange", visibility);
  canvas.addEventListener("webglcontextlost", contextLost);
  measure();

  const disposeVisuals = () => {
    sceneReady = false;
    typography?.dispose(); typography = undefined;
    sculptures?.dispose(); sculptures = undefined;
    glasses?.dispose(); glasses = undefined;
    // Models were freshly parsed for this mount. Their cloned material graph,
    // embedded roughness map and bitmap source belong exclusively to this mount.
    for (const model of models) disposeObject(model); models = [];
    for (const environment of environments) environment.dispose(); environments = [];
    releaseLighting?.(); releaseLighting = undefined;
  };
  void (async () => {
    stage.dataset.storyBoot = "models";
    const results = await Promise.allSettled(staticMode ? [loadStoryModel("glasses-folded")] : [loadStoryModel("glasses-folded"), loadStoryModel("logo-finished-components"), acquireStoryLighting()]);
    for (const [index, result] of results.entries()) if (result.status === "fulfilled") {
      if (index < 2) models.push(result.value as Object3D);
      else releaseLighting = result.value as () => void;
    }
    if (disposed) { disposeVisuals(); return; }
    const rejected = results.find((result) => result.status === "rejected");
    if (rejected?.status === "rejected") { disposeVisuals(); fail(rejected.reason); return; }
    try {
      stage.dataset.storyBoot = "environments";
      const glassesEnvironment = createStoryEnvironment(renderer, "glasses"); environments.push(glassesEnvironment);
      glasses = createGlasses(models[0], scene, camera, glassesEnvironment.texture, width);
      if (!staticMode) {
        const sculptureEnvironment = createStoryEnvironment(renderer, "sculpture"); environments.push(sculptureEnvironment);
        sculptures = createSculptures(models[1], scene, sculptureEnvironment.texture, width / height, document.documentElement.lang === "ar");
        stage.dataset.storyBoot = "typography";
        const type = await createSpatialType(stage, scene, sculptures.root, camera, width, height, requestRender);
        if (disposed) { type.dispose(); return; }
        typography = type;
      }
      stage.dataset.storyBoot = "compile";
      pointer.setObjects([glasses.hitPlane, ...(sculptures?.objects ?? [])]);
      // Compile both sides of the lens-transmission branch before the first
      // visible crossing. One deliberate warm draw uploads the actual current
      // frame even when #top is below the viewport; no offscreen loop follows.
      const score = currentScore();
      glasses.update(score, pointer, width / height, elapsed, 0);
      sculptures?.update(score, pointer, 0);
      glasses.prepare(renderer); renderer.compile(scene, camera);
      sceneReady = true; measure();
      stage.dataset.storyBoot = "warm";
      render(performance.now(), true);
      requestRender();
    } catch (error) { disposeVisuals(); fail(error); }
  })();

  return () => {
    disposed = true; stopFrame(); intersection.disconnect(); resize.disconnect(); menu.disconnect();
    stage.removeEventListener("journey-frame", onFrame); document.removeEventListener("visibilitychange", visibility);
    canvas.removeEventListener("webglcontextlost", contextLost);
    pointer.dispose(); disposeVisuals(); renderer.dispose(); renderer.forceContextLoss(); canvas.remove();
    if (previousOpacity) host.style.setProperty("opacity", previousOpacity, previousOpacityPriority);
    else host.style.removeProperty("opacity");
    restoreDisplay();
    if (stage.dataset.storyFailed === "true") { stage.dataset.storyScene = "failed"; stage.dataset.storyBoot = "failed"; }
    else {
      if (previousState === null) delete stage.dataset.storyScene; else stage.setAttribute("data-story-scene", previousState);
      delete stage.dataset.storyBoot;
    }
    delete stage.dataset.storyActivity;
  };
}
