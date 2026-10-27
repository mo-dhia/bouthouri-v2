import { ACESFilmicToneMapping, Color, PerspectiveCamera, Scene, SRGBColorSpace, WebGLRenderer, type Object3D } from "three";
import { acquireStoryLighting, createStoryEnvironments, disposeObject, loadStoryModel } from "./story-assets";
import { createGlasses } from "./story-glasses";
import { createSculptures } from "./story-logo";
import { createStoryPointer } from "./story-pointer";
import { createStoryCameraHistory } from "./story-camera-history";
import { createStoryEnvironmentLifecycle } from "./story-environment-lifecycle";
import { uiStore } from "@/store/uiStore";
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
  let models: Object3D[] = [];
  let environments: ReturnType<typeof createStoryEnvironments> | undefined;
  let releaseLighting: (() => void) | undefined;
  let glasses: ReturnType<typeof createGlasses> | undefined;
  let sculptures: ReturnType<typeof createSculptures> | undefined;
  let typography: Awaited<ReturnType<typeof createSpatialType>> | undefined;
  let environmentLifecycle: ReturnType<typeof createStoryEnvironmentLifecycle> | undefined;
  let environmentMeasureTimer = 0, studioIdle = 0;
  let entryComplete = uiStore.getState().entryPhase === "complete";
  const bounds = () => host.getBoundingClientRect();
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
  const cameraHistory = createStoryCameraHistory();
  if (!staticMode) cameraHistory.sample(frame, width < 701);
  if (staticMode) pointer.setActive(false);
  const currentScore = () => {
    const score = staticMode ? sampleStoryScore({ time: 0, openingTime: 26, progress: 26 / 740 }, width < 701) : cameraHistory.sample(frame, width < 701);
    if (staticMode) score.idle = 0;
    return score;
  };
  function render(now: number, warm = false) {
    frameId = 0;
    if (!sceneReady || (!warm && !isActive()) || disposed || lost || document.hidden || !glasses || !staticMode && (!sculptures || !typography)) return;
    const dt = lastRender ? Math.min((now - lastRender) / 1000, 0.05) : 1 / 60;
    elapsed += dt; lastRender = now;
    const score = currentScore();
    if (!staticMode && score.time >= 98) activateStudio();
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
    canvas.dataset.environmentVersion = String(environments?.glasses.texture.pmremVersion ?? 0);
    if (!ready) { ready = true; stage.dataset.storyBoot = "ready"; stage.dataset.storyScene = "ready"; options.onReady?.(); }
    if (!warm && !staticMode && (pointerMoving || glassMoving || logoMoving)) requestRender();
  }
  function measure() {
    width = Math.max(1, host.clientWidth || stage.clientWidth);
    height = Math.max(1, host.clientHeight || stage.clientHeight);
    const rect = stage.getBoundingClientRect(); visible = rect.bottom > 0 && rect.top < innerHeight && rect.width > 0;
    if (sceneReady && !document.hidden && !menuOpen && visible) environmentLifecycle?.measure(bounds());
    renderer.setPixelRatio(Math.min(Math.max(1, devicePixelRatio), width < 701 ? 1.5 : 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height; camera.updateProjectionMatrix();
    pointer.measure(); sculptures?.resize(width / height); typography?.resize(width, height);
    canvas.dataset.dpr = String(renderer.getPixelRatio());
    requestRender();
  }
  function onFrame(event: Event) {
    if (staticMode) return;
    const next = (event as CustomEvent<StoryFrame>).detail;
    if (!next || !Number.isFinite(next.time) || !Number.isFinite(next.openingTime)) return;
    frame = next;
    // The source clock exists before optional GPU assets. Retain that camera
    // history even when render() cannot draw yet or the stage is offscreen.
    cameraHistory.sample(frame, width < 701);
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
      measureEnvironment(); scheduleStudio();
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
    if (menuOpen) stopFrame(); else { measureEnvironment(); scheduleStudio(); requestRender(); }
  });
  menu.observe(document.documentElement, { attributes: true, attributeFilter: ["data-menu-open"] });
  let cameraRefreshTimer = 0;
  const cameraRefresh = () => {
    clearTimeout(cameraRefreshTimer);
    cameraRefreshTimer = window.setTimeout(() => { cameraRefreshTimer = 0; if (!staticMode && !disposed) cameraHistory.refresh(); }, 200);
  };
  window.addEventListener("resize", cameraRefresh, { passive: true });
  function measureEnvironment() {
    clearTimeout(environmentMeasureTimer); environmentMeasureTimer = 0;
    if (!sceneReady || disposed || lost || document.hidden || menuOpen || !visible || staticMode) return;
    if (environmentLifecycle?.measure(bounds())) requestRender();
  }
  const scrollMeasure = () => {
    if (staticMode) return;
    clearTimeout(environmentMeasureTimer);
    if (!document.hidden && !menuOpen) environmentMeasureTimer = window.setTimeout(measureEnvironment, 50);
  };
  function activateStudio() {
    if (staticMode || !sceneReady || !environmentLifecycle || disposed || lost || document.hidden || menuOpen) return;
    clearTimeout(environmentMeasureTimer); environmentMeasureTimer = 0;
    try { environmentLifecycle.activate(bounds()); }
    catch (error) { fail(error); }
  }
  function scheduleStudio() {
    if (staticMode || !entryComplete || studioIdle || environmentLifecycle?.active || document.hidden || menuOpen || disposed) return;
    const run = () => { studioIdle = 0; activateStudio(); };
    studioIdle = typeof window.requestIdleCallback === "function"
      ? window.requestIdleCallback(run, { timeout: 1200 }) : window.setTimeout(run, 32);
  }
  const onEntry = () => { entryComplete = true; scheduleStudio(); };
  window.addEventListener("identity-entry-complete", onEntry);
  window.addEventListener("scroll", scrollMeasure, { passive: true, capture: true });
  stage.addEventListener("journey-frame", onFrame);
  document.addEventListener("visibilitychange", visibility);
  canvas.addEventListener("webglcontextlost", contextLost);
  measure();

  const disposeVisuals = () => {
    sceneReady = false;
    environmentLifecycle?.dispose(); environmentLifecycle = undefined;
    typography?.dispose(); typography = undefined;
    sculptures?.dispose(); sculptures = undefined;
    glasses?.dispose(); glasses = undefined;
    // Models were freshly parsed for this mount. Their cloned material graph,
    // embedded roughness map and bitmap source belong exclusively to this mount.
    const externalTextures = new Set([environments?.glasses.texture, environments?.sculpture?.texture].filter((texture) => texture !== undefined));
    for (const model of models) disposeObject(model, externalTextures); models = [];
    environments?.dispose(); environments = undefined;
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
      const studio = createStoryEnvironments(renderer, !staticMode);
      environments = studio;
      environmentLifecycle = createStoryEnvironmentLifecycle(bounds(), () => studio.refresh(), () => {
        if (!sculptures || !studio.sculpture) return;
        sculptures.setEnvironment(studio.sculpture.texture);
        // Only these physical materials changed. Text was already compiled by
        // boot; keep its derived SDF programs out of this environment commit.
        for (const object of sculptures.objects) renderer.compile(object, camera, scene);
      });
      glasses = createGlasses(models[0], scene, camera, studio.glasses.texture, width);
      if (!staticMode) {
        sculptures = createSculptures(models[1], scene, studio.sculpture!.texture, width / height, document.documentElement.lang === "ar");
        // Source mounts this private studio after identity entry. Prewarm its
        // model/type programs without converting its 512px environment yet.
        sculptures.setEnvironment(null);
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
      // Source lazily initializes its CubeUV cache inside r180's transparent
      // transmission clear state. Preserve that field, including unused texels.
      const clear = renderer.getClearColor(new Color()), alpha = renderer.getClearAlpha();
      try {
        renderer.setClearColor(0xffffff, 0.5);
        glasses.prepare(renderer);
        // The source has a second glasses-only Environment capture before its
        // private 512px studio initializes. Refresh the existing 256px cache
        // while its scratch size is still 256; this keeps cold state clean.
        studio.glasses.texture.needsPMREMUpdate = true;
        glasses.prepare(renderer); renderer.compile(scene, camera);
      } finally { renderer.setClearColor(clear, alpha); }
      sceneReady = true; measure();
      stage.dataset.storyBoot = "warm";
      render(performance.now(), true);
      scheduleStudio();
      requestRender();
    } catch (error) { disposeVisuals(); fail(error); }
  })();

  return () => {
    disposed = true; stopFrame(); intersection.disconnect(); resize.disconnect(); menu.disconnect();
    clearTimeout(cameraRefreshTimer); window.removeEventListener("resize", cameraRefresh);
    clearTimeout(environmentMeasureTimer);
    if (studioIdle) {
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(studioIdle);
      else window.clearTimeout(studioIdle);
    }
    window.removeEventListener("identity-entry-complete", onEntry);
    window.removeEventListener("scroll", scrollMeasure, true);
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
