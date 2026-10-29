import { ACESFilmicToneMapping, Color, PerspectiveCamera, Scene, SRGBColorSpace, WebGLRenderer, type Object3D } from "three";
import { createStoryEnvironments, disposeObject, loadStoryModel } from "./story-assets";
import { createGlasses } from "./story-glasses";
import { createSculptures } from "./story-logo";
import { createStoryPointer } from "./story-pointer";
import { createStoryCameraHistory } from "./story-camera-history";
import { createStoryEnvironmentLifecycle } from "./story-environment-lifecycle";
import { createStoryOpticalHistory } from "./story-optical-history";
import { createStoryBoot, waitForStoryTask } from "./story-boot";
import { disposePrivateStoryAtlas } from "./story-atlas-ownership";
import { loadStoryMotionAssets } from "./story-motion-assets";
import { uiStore } from "@/store/uiStore";
import { viewportDesign } from "@/lib/viewport-design";
import { sampleStoryScore, type StoryFrame } from "./story-score";
import { createStoryHeroHandoff } from "./story-hero-handoff";
import { heroWorldPose, readHeroWorldPose, worldProgressFromScroll } from "../1-hero/hero-world";
import { createSpatialType } from "./story-type";
import type { SceneInteraction } from "./story-environment.animate";
import styles from "./story-scene.module.css";

export type StorySceneOptions = { staticMode?: boolean; onReady?: () => void; onFailure?: () => void };
export type StorySceneController = { setStaticMode(enabled: boolean): void; dispose(): void };

/** Compatibility adapter for callers that only need mount/cleanup. */
export function mountStoryScene(stage: HTMLElement, options: StorySceneOptions = {}): () => void {
  return createStoryScene(stage, options).dispose;
}

/** Deferred scene leaf. The parent owns SSR, native pinning and the sole story clock. */
export function createStoryScene(stage: HTMLElement, options: StorySceneOptions = {}): StorySceneController {
  const candidate = stage.querySelector<HTMLElement>(".canvas-layer");
  if (!candidate) return { setStaticMode() {}, dispose() {} };
  const host: HTMLElement = candidate;
  let staticMode = options.staticMode ?? false;
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
  let rendererSize = "";
  let design = viewportDesign(innerWidth), aspect = width / height;
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
  canvas.dataset.asset = "portfolio-glasses-and-sculptures";
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setClearColor(0x090909, 0); renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1; renderer.transmissionResolutionScale = 0.5;
    renderer.outputColorSpace = SRGBColorSpace;
  } catch {
    stage.dataset.storyBoot = "failed"; stage.dataset.storyScene = "failed"; options.onFailure?.();
    return { setStaticMode() {}, dispose() {
      restoreDisplay();
      if (stage.dataset.storyFailed === "true") { stage.dataset.storyScene = "failed"; stage.dataset.storyBoot = "failed"; }
      else { delete stage.dataset.storyBoot; if (previousState === null) delete stage.dataset.storyScene; else stage.setAttribute("data-story-scene", previousState); }
    } };
  }
  host.append(canvas);
  const scene = new Scene(), camera = new PerspectiveCamera(34, aspect, 0.005, 60);
  camera.position.set(0, 0, 10);
  let glassesModel: Object3D | undefined, motionModel: Object3D | undefined;
  let motionGeneration = 0, motionPending = false, modeCapture = false;
  let motionAbort = new AbortController();
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
  const isActive = () => !disposed && !lost && visible && !document.hidden && !menuOpen && (staticMode || frame.time < 306);
  const fail = (error?: unknown) => {
    if (disposed) return;
    lost = true; stopFrame(); canvas.style.opacity = "0";
    stage.dataset.storyBoot = "failed"; stage.dataset.storyScene = "failed"; options.onFailure?.();
    if (error) console.error("Optional portfolio story scene failed.", error);
  };
  function requestRender() {
    if (!frameId && sceneReady && isActive()) frameId = requestAnimationFrame(render);
  }
  const pointer = createStoryPointer(canvas, camera, requestRender);
  const hero = stage.closest("main")?.querySelector<HTMLElement>("#identity") ?? null;
  const heroHandoff = createStoryHeroHandoff(() => readHeroWorldPose(hero) ?? heroWorldPose(worldProgressFromScroll(
    hero ? -hero.getBoundingClientRect().top : scrollY, hero?.offsetHeight || innerHeight, design.key === "mobile",
  )), () => {
    if (staticMode) return;
    frame = heroHandoff.sample(frame); requestRender();
  });
  frame = heroHandoff.sample(frame);
  let cameraHistory = createStoryCameraHistory();
  let opticalHistory = createStoryOpticalHistory();
  if (!staticMode) opticalHistory.sample(cameraHistory.sample(frame, design.key === "mobile"));
  if (staticMode) pointer.setActive(false);
  const currentScore = () => {
    const score = staticMode ? sampleStoryScore({ time: 0, openingTime: 26, progress: 26 / 740, emergence: 1 }, design.key === "mobile") : opticalHistory.sample(cameraHistory.sample(frame, design.key === "mobile"));
    if (staticMode) score.idle = 0;
    return score;
  };
  function render(now: number, warm = false) {
    frameId = 0;
    if (!sceneReady || (!warm && !isActive()) || disposed || lost || document.hidden || !glasses) return;
    const dt = lastRender ? Math.min((now - lastRender) / 1000, 0.05) : 1 / 60;
    elapsed += dt; lastRender = now;
    const score = currentScore();
    if (!staticMode && score.time >= 98) activateStudio();
    const pointerMoving = pointer.advance(dt, score.time, score.emergence);
    const glassMoving = glasses.update(score, pointer, aspect, elapsed, dt);
    const logoMoving = sculptures?.update(score, pointer, dt) ?? false;
    if (modeCapture) { modeCapture = false; environments?.refreshGlasses(); }
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
    canvas.dataset.opticalVeil = score.opticalVeil.toFixed(6);
    canvas.dataset.glassesVisible = String(glasses.root.visible);
    if (!ready) { ready = true; stage.dataset.storyBoot = "ready"; stage.dataset.storyScene = "ready"; options.onReady?.(); }
    if (!warm && !staticMode && (pointerMoving || glassMoving || logoMoving)) requestRender();
  }
  function measure() {
    const rect = host.getBoundingClientRect();
    width = Math.max(1, rect.width || host.clientWidth || stage.clientWidth);
    height = Math.max(1, rect.height || host.clientHeight || stage.clientHeight);
    design = viewportDesign(innerWidth); aspect = width / height;
    visible = rect.bottom > 0 && rect.top < innerHeight && rect.width > 0;
    // Source react-use-measure routes ResizeObserver through its 50ms scroll
    // debounce too. Coalesce capture with that existing full-bounds measure:
    // an immediate scroll must update the shared frame before cube invalidation
    // can cause a resize-owned draw of the previous glasses pose.
    if (sceneReady) scrollMeasure();
    const dpr = Math.min(Math.max(1, devicePixelRatio), design.key === "mobile" ? 1.5 : 2), size = `${width}:${height}:${dpr}`;
    if (size !== rendererSize) {
      renderer.setPixelRatio(dpr); renderer.setSize(width, height, false); rendererSize = size;
    }
    camera.aspect = aspect; camera.updateProjectionMatrix();
    pointer.measure(); sculptures?.resize(aspect); typography?.resize(width, height);
    canvas.dataset.dpr = String(renderer.getPixelRatio());
    requestRender();
  }
  function onFrame(event: Event) {
    if (staticMode) return;
    const next = (event as CustomEvent<StoryFrame>).detail;
    if (!next || !Number.isFinite(next.time) || !Number.isFinite(next.openingTime)) return;
    frame = heroHandoff.sample(next);
    // The source clock exists before optional GPU assets. Retain both property
    // histories even when render() cannot draw yet or the stage is offscreen.
    opticalHistory.sample(cameraHistory.sample(frame, design.key === "mobile"));
    stage.dataset.storyActivity = visible ? document.hidden ? "hidden" : menuOpen ? "menu" : "visible" : "offscreen";
    // The parent owns time, not GPU draws. Coalesce clock/resize/pointer demand
    // into the scene's existing RAF, like the source demand-rendered Canvas.
    // Drawing here skips that invalidation boundary and can initialize native
    // CubeUV work in a different transmission clear state.
    if (frame.time >= 306) {
      canvas.style.opacity = "0"; stopFrame();
      // Restores can skip Ideas entirely. Its settled pen origin is a CPU
      // projection even after the object canvas has stopped drawing.
      if (typography) {
        camera.position.set(0, 0, 10 * Math.max(1, 0.88 / aspect)); camera.lookAt(0, 0, 0);
        camera.updateMatrixWorld(); typography.update(frame.time);
      }
    }
    else requestRender();
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
  intersection.observe(host);
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
    cameraRefreshTimer = window.setTimeout(() => {
      cameraRefreshTimer = 0;
      if (!staticMode && !disposed) { cameraHistory.refresh(); opticalHistory.refresh(); }
    }, 200);
  };
  window.addEventListener("resize", cameraRefresh, { passive: true });
  function measureEnvironment() {
    clearTimeout(environmentMeasureTimer); environmentMeasureTimer = 0;
    if (!sceneReady || disposed || lost || document.hidden || menuOpen || !visible) return;
    if (environmentLifecycle?.measure(bounds())) requestRender();
  }
  const scrollMeasure = () => {
    clearTimeout(environmentMeasureTimer);
    if (!document.hidden && !menuOpen) environmentMeasureTimer = window.setTimeout(measureEnvironment, 50);
  };
  function activateStudio() {
    if (staticMode || !sceneReady || !sculptures || !environments?.sculpture || !environmentLifecycle || environmentLifecycle.active || disposed || lost || document.hidden || menuOpen) return;
    clearTimeout(environmentMeasureTimer); environmentMeasureTimer = 0;
    try { environmentLifecycle.activate(bounds()); }
    catch (error) { fail(error); }
  }
  function scheduleStudio() {
    if (staticMode || !sculptures || !entryComplete || studioIdle || environmentLifecycle?.active || document.hidden || menuOpen || disposed) return;
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

  const externalTextures = () => new Set([environments?.glasses.texture, environments?.sculpture?.texture].filter((texture) => texture !== undefined));
  const cancelStudio = () => {
    if (!studioIdle) return;
    if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(studioIdle);
    else window.clearTimeout(studioIdle);
    studioIdle = 0;
  };
  const resetEnvironmentLifecycle = () => {
    environmentLifecycle?.dispose();
    const studio = environments;
    if (!studio) return;
    environmentLifecycle = createStoryEnvironmentLifecycle(bounds(), () => studio.refresh(), () => {
      if (!sculptures || !studio.sculpture) return;
      sculptures.setEnvironment(studio.sculpture.texture);
      for (const object of sculptures.objects) renderer.compile(object, camera, scene);
    });
  };
  const disposeMotion = () => {
    typography?.dispose(); typography = undefined;
    if (sculptures && environments?.sculpture) disposePrivateStoryAtlas(renderer, environments.sculpture, sculptures.objects);
    sculptures?.dispose(); sculptures = undefined;
    if (motionModel) { disposeObject(motionModel, externalTextures()); motionModel = undefined; }
    releaseLighting?.(); releaseLighting = undefined;
    environments?.setSculpture(false);
    if (glasses) pointer.setObjects([glasses.hitPlane]);
  };
  const disposeVisuals = () => {
    sceneReady = false; motionGeneration++; motionAbort.abort();
    environmentLifecycle?.dispose(); environmentLifecycle = undefined;
    disposeMotion();
    glasses?.dispose(); glasses = undefined;
    if (glassesModel) { disposeObject(glassesModel, externalTextures()); glassesModel = undefined; }
    environments?.dispose(); environments = undefined;
  };
  const currentMotion = (generation: number) => !disposed && !lost && !staticMode && generation === motionGeneration;
  async function installMotion(model: Object3D, release: () => void, generation: number) {
    let ownSculptures: ReturnType<typeof createSculptures> | undefined;
    let ownType: Awaited<ReturnType<typeof createSpatialType>> | undefined;
    try {
      if (!currentMotion(generation) || !environments) return;
      environments.setSculpture(true);
      ownSculptures = createSculptures(model, scene, environments.sculpture!.texture, aspect, document.documentElement.lang === "ar");
      ownSculptures.root.visible = false; ownSculptures.setEnvironment(null);
      ownType = await createSpatialType(stage, scene, ownSculptures.root, camera, width, height, requestRender, motionAbort.signal);
      if (!currentMotion(generation)) return;
      motionModel = model; releaseLighting = release;
      sculptures = ownSculptures; typography = ownType;
      sculptures.resize(aspect);
      typography.resize(width, height); typography.update(frame.time);
      pointer.setObjects([glasses!.hitPlane, ...sculptures.objects]);
      // Adoption transfers all ownership; stale async work cleans up below.
      ownSculptures = undefined; ownType = undefined;
    } finally {
      if (motionModel !== model) {
        ownType?.dispose(); ownSculptures?.dispose(); disposeObject(model, externalTextures()); release();
        environments?.setSculpture(false);
      }
    }
  }
  async function upgradeMotion() {
    if (!sceneReady || staticMode || disposed || lost || sculptures || motionPending) return;
    motionPending = true;
    const generation = motionGeneration;
    try {
      const assets = await loadStoryMotionAssets(motionAbort.signal);
      await installMotion(assets.model, assets.release, generation);
      if (currentMotion(generation)) {
        renderer.compile(scene, camera);
        scheduleStudio(); requestRender();
      }
    } catch (error) { if (currentMotion(generation)) fail(error); }
    finally {
      motionPending = false;
      // A rapid quiet→motion cycle may supersede an in-flight layout. Start
      // its replacement only after the stale attachment has released its graph.
      if (generation !== motionGeneration) void upgradeMotion();
    }
  }
  stage.dataset.storyBoot = "models";
  const baseLoad = loadStoryModel("glasses-folded").then((model) => {
    if (disposed) { disposeObject(model); throw new DOMException("Story disposed.", "AbortError"); }
    glassesModel = model; return model;
  }).catch((error: unknown) => { if (!disposed) fail(error); throw error; });
  const boot = createStoryBoot(baseLoad, (model, motion) => {
      if (disposed || lost) return;
      stage.dataset.storyBoot = "environments";
      const studio = createStoryEnvironments(renderer, motion && !staticMode);
      environments = studio;
      resetEnvironmentLifecycle();
      glasses = createGlasses(model, scene, camera, studio.glasses.texture, width);
  }, () => {
      if (disposed || lost || !glasses || !environments) return;
      stage.dataset.storyBoot = "compile";
      pointer.setObjects([glasses.hitPlane, ...(sculptures?.objects ?? [])]);
      // Compile both sides of the lens-transmission branch before the first
      // visible crossing. One deliberate warm draw uploads the actual current
      // frame even when #top is below the viewport; no offscreen loop follows.
      const score = currentScore();
      glasses.update(score, pointer, aspect, elapsed, 0);
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
        environments.glasses.texture.needsPMREMUpdate = true;
        glasses.prepare(renderer); renderer.compile(scene, camera);
      } finally { renderer.setClearColor(clear, alpha); }
      sceneReady = true; measure();
      stage.dataset.storyBoot = "warm";
      render(performance.now(), true);
      scheduleStudio();
      requestRender();
      void upgradeMotion();
  });
  // Cold normal motion retains its measured assets→base→type→warm ordering.
  // Reading can independently mount/finish the glasses base at either await.
  async function startBoot() {
    const generation = motionGeneration;
    const signal = motionAbort.signal;
    let assets: Awaited<ReturnType<typeof loadStoryMotionAssets>> | undefined;
    try {
      if (!staticMode) assets = await loadStoryMotionAssets(signal);
      await waitForStoryTask(boot.mount(Boolean(assets) && currentMotion(generation)), signal);
      if (assets) {
        const owned = assets; assets = undefined;
        stage.dataset.storyBoot = "typography";
        await installMotion(owned.model, owned.release, generation);
      }
      if (!disposed && !lost) boot.finish();
    } catch (error) {
      if (assets) { disposeObject(assets.model); assets.release(); }
      if (generation === motionGeneration && !disposed && !lost) { disposeVisuals(); fail(error); }
    }
  }
  void startBoot();

  function setStaticMode(enabled: boolean) {
    if (disposed || lost || enabled === staticMode) return;
    staticMode = enabled; motionGeneration++; motionAbort.abort(); motionAbort = new AbortController();
    stopFrame(); cancelStudio(); clearTimeout(cameraRefreshTimer); clearTimeout(environmentMeasureTimer);
    cameraRefreshTimer = environmentMeasureTimer = 0;
    pointer.reset(); glasses?.reset();
    cameraHistory = createStoryCameraHistory(); opticalHistory = createStoryOpticalHistory();
    if (enabled) { host.style.display = "block"; disposeMotion(); }
    else {
      restoreDisplay();
      heroHandoff.refresh();
      frame = heroHandoff.sample({ time: Number(stage.dataset.storyTime ?? 0), openingTime: Number(stage.dataset.openingTime ?? 0), progress: Number(stage.dataset.progress ?? 0) });
      opticalHistory.sample(cameraHistory.sample(frame, design.key === "mobile"));
    }
    // Source reduced-prop rerender recaptures its existing256 Environment even
    // without a geometry change. Defer that finite work while hidden/offscreen.
    resetEnvironmentLifecycle(); modeCapture = Boolean(environments);
    measure(); pointer.setActive(!staticMode && visible && !document.hidden && !menuOpen);
    if (staticMode && !sceneReady) {
      void boot.mount(false).then(() => { if (!disposed && !lost && staticMode) boot.finish(); }).catch((error: unknown) => { if (!disposed) fail(error); });
    }
    else if (!sceneReady) void startBoot();
    requestRender(); void upgradeMotion();
  }
  function dispose() {
    if (disposed) return;
    disposed = true; stopFrame(); intersection.disconnect(); resize.disconnect(); menu.disconnect();
    clearTimeout(cameraRefreshTimer); window.removeEventListener("resize", cameraRefresh);
    clearTimeout(environmentMeasureTimer);
    cancelStudio();
    window.removeEventListener("identity-entry-complete", onEntry);
    window.removeEventListener("scroll", scrollMeasure, true);
    heroHandoff.dispose();
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
  }
  return { setStaticMode, dispose };
}
