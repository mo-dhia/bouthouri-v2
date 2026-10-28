import { Camera, DataTexture, Mesh, PlaneGeometry, Scene, ShaderMaterial, SRGBColorSpace, WebGLRenderer } from "three";
import { heroWorldEvent, readHeroWorldPose, worldProgressFromScroll, type HeroWorldPose } from "../1-hero/hero-world";
import { createEnvironmentField } from "./story-environment-field";
import { createEnvironmentPointer } from "./story-environment-pointer";
import { environmentFragment, environmentVertex } from "./story-environment-shaders";
import { clamp, sampleStoryScore, smooth, type StoryFrame } from "./story-score";
import styles from "./story-scene.module.css";
import { isJourneyRendering, journeyOwnsRender, journeyRenderOwnerEvent } from "../3-journey/journey-render-owner";
import { designHeight, viewportDesign } from "@/lib/viewport-design";

export type SceneGuard = { x: number; y: number; rx: number; ry: number; weight: number };
export type SceneInteraction = { guards: SceneGuard[]; grabbed: boolean };
export type StoryEnvironmentController = { setReducedMode(enabled: boolean): void; dispose(): void };
type EditorialPose = { time: number; environment: number; surfaceQuiet: number };
export type EnvironmentBinding = { stage: HTMLElement; page: HTMLElement; owner: HTMLElement } & (
  | { kind: "home"; heroRoot: HTMLElement | null }
  | { kind: "editorial"; pose: () => EditorialPose }
);
export type EnvironmentAttachment = { invalidate(): void; release(): void };
export type PersistentStoryEnvironmentController = StoryEnvironmentController & { bind(binding: EnvironmentBinding): EnvironmentAttachment };
type StoryEnvironmentOptions = { reduced?: boolean; pose?: () => { time: number; environment: number; surfaceQuiet: number } };

/** Cleanup-only adapter retained for imperative callers. */
export function mountStoryEnvironment(stage: HTMLElement, options: StoryEnvironmentOptions = {}) {
  return createStoryEnvironment(stage, options).dispose;
}

/** Compatibility adapter for standalone imperative consumers and their focused tests. */
export function createStoryEnvironment(stage: HTMLElement, options: StoryEnvironmentOptions = {}): StoryEnvironmentController {
  const page = options.pose ? stage : stage.closest<HTMLElement>("main") ?? stage.parentElement!;
  const owner = stage.closest<HTMLElement>(".experience") ?? page;
  return createEnvironment(owner, options, options.pose
    ? { kind: "editorial", stage, page, owner, pose: options.pose }
    : { kind: "home", stage, page, owner, heroRoot: page.querySelector<HTMLElement>("#identity") });
}

/** Source 88009/20109: document resources persist; route attachments are leases. */
export function createPersistentStoryEnvironment(parking: HTMLElement, options: { reduced?: boolean } = {}): PersistentStoryEnvironmentController {
  return createEnvironment(parking, options);
}

function createEnvironment(parking: HTMLElement, options: { reduced?: boolean }, initial?: EnvironmentBinding): PersistentStoryEnvironmentController {
  let reduced = options.reduced ?? false;
  const host = document.createElement("div");
  host.className = `global-environment ${styles.environment}`; host.setAttribute("aria-hidden", "true");
  const canvas = document.createElement("canvas"); canvas.className = styles.environmentCanvas; host.append(canvas);
  parking.prepend(host);
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: false, antialias: false, powerPreference: "low-power" });
    renderer.outputColorSpace = SRGBColorSpace;
  } catch {
    host.remove();
    let current: EnvironmentBinding | undefined, token: object | undefined, disposed = false;
    const bind = (binding: EnvironmentBinding): EnvironmentAttachment => {
      if (current) delete current.stage.dataset.storyEnvironment;
      if (disposed) return { invalidate() {}, release() {} };
      const owned = {}; token = owned;
      current = binding; binding.stage.dataset.storyEnvironment = "failed";
      return { invalidate() {}, release() { if (token !== owned) return; delete binding.stage.dataset.storyEnvironment; current = undefined; token = undefined; } };
    };
    if (initial) bind(initial);
    return { bind, setReducedMode() {}, dispose() { disposed = true; if (current) delete current.stage.dataset.storyEnvironment; current = undefined; token = undefined; } };
  }
  const canSimulate = renderer.extensions.has("EXT_color_buffer_float");
  const scene = new Scene(), camera = new Camera();
  const zero = new DataTexture(new Uint8Array(4), 1, 1); zero.needsUpdate = true;
  let width = innerWidth, height = designHeight(width), design = viewportDesign(width);
  let rendererSize = "";
  let aspect = design.width / design.height, mobile = design.key === "mobile";
  let field = createEnvironmentField(aspect, mobile);
  const uniforms = {
    uState: { value: canSimulate ? field.texture : zero }, uCell: { value: field.uniforms.uCell.value },
    uAspect: { value: aspect }, uAmplitude: { value: 1 }, uStage: { value: 0 }, uTime: { value: 0 },
  };
  const material = new ShaderMaterial({ uniforms, vertexShader: environmentVertex, fragmentShader: environmentFragment,
    depthTest: false, depthWrite: false, toneMapped: false });
  const geometry = () => new PlaneGeometry(2, 2, mobile ? 96 : 192, mobile ? 96 : 128);
  const mesh = new Mesh(geometry(), material); mesh.frustumCulled = false; scene.add(mesh);
  let disposed = false, lost = false, visible = true, frameId = 0, timer = 0, last = 0;
  let time = 0, remaining = 0, pulse = 0, click = 0, lastX = 0, lastY = 0, initialized = false, fieldCleared = false, fieldNeedsClear = false;
  let previousTravel = -1.2;
  let menuOpen = document.documentElement.dataset.menuOpen === "true";
  let binding: EnvironmentBinding | undefined, attachmentToken: object | undefined, detach: ((keepProtection?: boolean) => void) | undefined;
  let heroProgress = 1, workTravel = -1.35;
  const readFrame = (): StoryFrame => ({ time: Number(binding?.stage.dataset.storyTime ?? 0), openingTime: Number(binding?.stage.dataset.openingTime ?? 0), progress: Number(binding?.stage.dataset.progress ?? 0) });
  const readWorkTravel = () => Number(binding?.stage.querySelector<HTMLElement>(".work-world")?.dataset.travel ?? -1.35);
  const readingFrame: StoryFrame = { time: 0, openingTime: 26, progress: 0, emergence: 1 };
  let frame: StoryFrame = { time: 0, openingTime: 0, progress: 0 }, refreshFrame = false;
  let gapPose: EditorialPose = { time: 0, environment: 0, surfaceQuiet: 0 };
  let guards: SceneGuard[] = [];
  const ownsRender = () => binding?.kind === "home" && journeyOwnsRender(binding.stage);
  const journeyRendering = () => binding?.kind === "home" && isJourneyRendering(binding.stage);
  const active = () => !disposed && !lost && visible && !document.hidden;
  const park = () => { if (frameId) cancelAnimationFrame(frameId); if (timer) clearTimeout(timer); frameId = timer = 0; };
  const cancel = () => { park(); last = 0; };
  function wake() {
    if (!active() || frameId || ownsRender()) return;
    if (timer) { clearTimeout(timer); timer = 0; }
    frameId = requestAnimationFrame(render);
  }
  // The host is a fixed, top-anchored design canvas. Cache its logical bounds
  // here rather than introducing a layout read into every native scroll input.
  const pointerBounds = { left: 0, top: 0, width, height };
  const pointer = createEnvironmentPointer(wake, () => pointerBounds);
  let pointerActive = true;
  const updatePointer = () => {
    const next = visible && !document.hidden && !menuOpen && !lost;
    if (pointerActive !== next) { pointerActive = next; pointer.setActive(next); }
  };
  const currentScore = () => binding?.kind === "home" ? sampleStoryScore(reduced ? readingFrame : frame, mobile)
    : binding?.kind === "editorial" ? binding.pose() : gapPose;
  const fail = () => { lost = true; cancel(); host.style.visibility = "hidden"; if (binding) binding.stage.dataset.storyEnvironment = "failed"; };
  function render() {
    frameId = 0;
    if (!active() || (ownsRender() && !journeyRendering())) return;
    // RAF's refresh timestamp can precede the previous immediate journey draw's
    // callback time. Sample one monotonic clock in both ownership paths.
    const now = Math.max(last, performance.now());
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 1 / 60); last = now; time += dt * (reduced ? 0.035 : 1);
    if (binding?.kind === "home" && !reduced && refreshFrame) { frame = readFrame(); workTravel = readWorkTravel(); refreshFrame = false; }
    // Source resets initialNarrative on reading entry independently of DOM time.
    const score = currentScore(), input = pointer.state;
    const pointerMoving = pointer.advance(dt, menuOpen);
    const workQuiet = smooth(280, 304, score.time) * (1 - smooth(426, 450, score.time));
    const heroBlend = smooth(0.25, 0.72, heroProgress);
    const gain = Math.max(0.48, 0.42 + 0.58 * heroBlend) * (1 - 0.4 * workQuiet) * input.contextStrength * (reduced ? 0.32 : 1);
    const x = input.fieldX * aspect, y = input.fieldY;
    if (!initialized) { lastX = x; lastY = y; initialized = true; }
    const speed = Math.hypot(input.velocityX * aspect, input.velocityY);
    const motion = menuOpen || !input.hovering || input.coarse ? 0 : (0.024 + Math.min(1, 0.85 * speed)) * gain;
    const u = field.uniforms;
    if (speed > 0.025) u.uDirection.value.set(input.velocityX * aspect / speed, input.velocityY / speed);
    if (click !== input.clickSerial) {
      click = input.clickSerial; pulse = Math.min(1.8, pulse + 1.8 * input.pressureScale);
      u.uPulse.value.set(input.clickX * aspect, input.clickY, pulse, 0);
    }
    pulse *= Math.exp(-dt * (reduced ? 10 : 4.8)); u.uPulse.value.z = pulse * gain;
    u.uStroke.value.set(lastX, lastY, x, y); lastX = x; lastY = y;
    u.uMotion.value = motion; u.uPress.value = input.press * input.pressureScale * gain;
    u.uDrag.value.set(input.dragX * aspect, input.dragY);
    // Reading resets narrative travel, while the source keeps its lastTravel
    // memory: the first draw contributes the reset delta to the existing field.
    const travel = binding?.kind === "home" && reduced ? -1.35 : workTravel;
    const horizontal = clamp((travel - previousTravel) / Math.max(dt, 0.001) * 0.18, -1, 1) * (1 - 0.6 * workQuiet);
    previousTravel = travel;
    u.uHorizontal.value = horizontal; u.uScroll.value = input.scrollVelocity * gain;
    u.uQuiet.value = menuOpen ? 1 : 0.45 * score.surfaceQuiet;
    for (let i = 0; i < 4; i++) {
      const guard = guards[i];
      if (guard) { u.uGuards.value[i].set(guard.x, guard.y, guard.rx, guard.ry); u.uGuardWeight.value[i] = guard.weight; }
      else u.uGuardWeight.value[i] = 0;
    }
    const energetic = !menuOpen && (Math.abs(horizontal) > 0.002 || motion > 0.001 || input.press > 0.001 || pulse > 0.002 || Math.abs(input.scrollVelocity) > 0.002);
    remaining = energetic ? 6 : Math.max(0, remaining - dt);
    try {
      if (canSimulate) {
        if (fieldNeedsClear) { field.clear(renderer); fieldNeedsClear = false; fieldCleared = true; }
        if (remaining > 0) { field.advance(renderer, dt); fieldCleared = false; }
        else if (!fieldCleared) { field.clear(renderer); fieldCleared = true; }
      }
      uniforms.uState.value = canSimulate ? field.texture : zero;
      uniforms.uAmplitude.value = (input.coarse ? 0.72 : 1) * (0.86 + 0.14 * heroBlend);
      uniforms.uStage.value = score.environment; uniforms.uTime.value = time;
      renderer.render(scene, camera);
    } catch (error) { console.error("Optional home material failed.", error); fail(); return; }
    if (binding) binding.stage.dataset.storyEnvironment = "ready"; canvas.dataset.surface = "stateful-sculptural";
    canvas.dataset.simulation = canSimulate && remaining > 0 ? "active" : "rest";
    canvas.dataset.materialTime = time.toFixed(6);
    canvas.dataset.pressureScale = input.pressureScale.toFixed(4);
    canvas.dataset.footerInfluence = input.footerInfluence.toFixed(4);
    canvas.dataset.contextStrength = input.contextStrength.toFixed(4);
    if (ownsRender()) return;
    // The studio normal drift is intentional source content even at rest.
    if (pointerMoving || energetic || remaining > 4.5) wake();
    else if (remaining > 0) timer = window.setTimeout(() => { timer = 0; wake(); }, 1000 / 30);
    else timer = window.setTimeout(() => { timer = 0; wake(); }, reduced ? 250 : 1000 / 24);
  }
  const measure = () => {
    if (disposed || lost) return;
    try {
      const nextDesign = viewportDesign(innerWidth), nextAspect = nextDesign.width / nextDesign.height, nextMobile = nextDesign.key === "mobile";
      const fieldChanged = nextAspect !== aspect || nextMobile !== mobile, gridChanged = nextMobile !== mobile;
      width = innerWidth; height = designHeight(width); design = nextDesign; aspect = nextAspect; mobile = nextMobile;
      pointerBounds.width = width; pointerBounds.height = height;
      const dpr = Math.min(1.5, Math.max(1, devicePixelRatio)), size = `${width}:${height}:${dpr}`;
      if (size !== rendererSize) {
        renderer.setPixelRatio(dpr); renderer.setSize(width, height, false); rendererSize = size;
      }
      // Source useMemo([aspect, mobile]) retains both targets on a no-op/DPR-only
      // resize, even when the renderer's CSS dimensions change at the same ratio.
      if (fieldChanged) {
        const previous = field;
        field = createEnvironmentField(aspect, mobile); previous.dispose();
        initialized = false; fieldCleared = false; fieldNeedsClear = false;
      }
      uniforms.uState.value = canSimulate ? field.texture : zero; uniforms.uCell.value = field.uniforms.uCell.value; uniforms.uAspect.value = aspect;
      if (gridChanged) { mesh.geometry.dispose(); mesh.geometry = geometry(); }
      // Clearing is lazy: a hidden/menu resize must not submit GPU work.
      wake();
    } catch (error) { console.error("Optional home material could not resize.", error); fail(); }
  };
  const visibility = () => { updatePointer(); if (document.hidden) cancel(); else wake(); };
  const contextLost = (event: Event) => { event.preventDefault(); fail(); };
  const restored = () => {
    if (disposed) return;
    // Context loss invalidates GPU contents even when the allocation keys match.
    // Keep the CPU histories; reinitialize the targets only on the next draw.
    lost = false; fieldCleared = false; fieldNeedsClear = true;
    updatePointer();
    host.style.removeProperty("visibility"); measure();
  };
  const menu = new MutationObserver(() => {
    menuOpen = document.documentElement.dataset.menuOpen === "true";
    updatePointer();
    // The source keeps its menu-quiet field tail and material clock alive.
    // Input is disabled above; render() supplies uQuiet=1 and no excitation.
    wake();
  });
  menu.observe(document.documentElement, { attributes: true, attributeFilter: ["data-menu-open"] });
  window.addEventListener("resize", measure, { passive: true });
  document.addEventListener("visibilitychange", visibility); canvas.addEventListener("webglcontextlost", contextLost); canvas.addEventListener("webglcontextrestored", restored);
  function bind(next: EnvironmentBinding): EnvironmentAttachment {
    if (disposed) return { invalidate() {}, release() {} };
    detach?.(binding?.page === next.page);
    const token = {}; attachmentToken = token;
    binding = next; visible = true; refreshFrame = false;
    const current = () => !disposed && attachmentToken === token;
    if (next.kind === "home") {
      frame = readFrame(); workTravel = readWorkTravel();
      const heroRoot = next.heroRoot;
      heroProgress = readHeroWorldPose(heroRoot)?.progress ?? worldProgressFromScroll(
        heroRoot ? -heroRoot.getBoundingClientRect().top : scrollY, heroRoot?.offsetHeight || designHeight(width), mobile,
      );
    } else heroProgress = 1;
    next.owner.prepend(host);
    if (lost) next.stage.dataset.storyEnvironment = "failed";
    const onFrame = (event: Event) => {
      if (!current() || next.kind !== "home") return;
      const value = (event as CustomEvent<StoryFrame>).detail;
      if (!value || !Number.isFinite(value.time)) return;
      frame = value; workTravel = readWorkTravel(); refreshFrame = false;
      // Keep the accepted current-journey transaction, including late adoption.
      if (journeyRendering()) render(); else wake();
    };
    const ownership = () => { if (!current()) return; if (ownsRender()) park(); else wake(); };
    const interaction = (event: Event) => {
      if (!current() || next.kind !== "home") return;
      const detail = (event as CustomEvent<SceneInteraction>).detail;
      if (detail) { guards = detail.guards; pointer.setGrabbed(detail.grabbed); }
    };
    const hero = (event: Event) => {
      if (!current() || next.kind !== "home") return;
      // Prefer this mount's publisher; a delayed old hero event cannot supply pose.
      const pose = readHeroWorldPose(next.heroRoot);
      const detail = (event as CustomEvent<Partial<HeroWorldPose>>).detail;
      if (pose) { heroProgress = pose.progress; wake(); }
      else if (!next.heroRoot && detail && Number.isFinite(detail.progress)) { heroProgress = clamp(detail.progress!); wake(); }
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (!current()) return;
      visible = entry?.isIntersecting ?? false; updatePointer(); if (visible) wake(); else cancel();
    });
    observer.observe(next.page);
    next.stage.addEventListener("journey-frame", onFrame); next.stage.addEventListener("journey-scene-interaction", interaction);
    next.stage.addEventListener(journeyRenderOwnerEvent, ownership); window.addEventListener(heroWorldEvent, hero);
    const release = (keepProtection = false) => {
      if (attachmentToken !== token) return;
      gapPose = { ...currentScore(), surfaceQuiet: 0 };
      if (next.kind === "home" && reduced) workTravel = -1.35;
      binding = undefined; attachmentToken = undefined; detach = undefined; refreshFrame = false;
      observer.disconnect(); next.stage.removeEventListener("journey-frame", onFrame);
      next.stage.removeEventListener("journey-scene-interaction", interaction);
      next.stage.removeEventListener(journeyRenderOwnerEvent, ownership); window.removeEventListener(heroWorldEvent, hero);
      delete next.stage.dataset.storyEnvironment;
      guards = []; pointer.setGrabbed(false);
      if (!keepProtection) pointer.releaseProtection(next.page);
      heroProgress = 1; visible = true;
      // Placement adapts the source's sibling surface to accepted isolated shells.
      // The same host stays connected in the locale slot between route commits.
      parking.prepend(host); updatePointer(); wake();
    };
    detach = release;
    updatePointer(); ownership();
    return { invalidate() { if (current()) wake(); }, release };
  }
  if (initial) bind(initial);
  measure();
  function setReducedMode(enabled: boolean) {
    if (disposed || enabled === reduced) return;
    reduced = enabled;
    // Resume from this HOME's current clock, never its last motion score. A
    // subsequent precise journey event wins; otherwise reread before the draw
    // in case the parent's mode/layout effect refreshed the DOM clock later.
    if (!enabled && binding?.kind === "home") { frame = readFrame(); workTravel = readWorkTravel(); refreshFrame = true; }
    // Source's reduced-prop input effect releases transient targets, retaining
    // smoothed pointer coordinates, protections and the complete field history.
    pointer.resetInput();
    // Wake replaces an idle timer and shares the existing RAF.
    wake();
  }
  function dispose() {
    if (disposed) return;
    disposed = true; cancel(); detach?.(); menu.disconnect(); pointer.dispose();
    window.removeEventListener("resize", measure);
    document.removeEventListener("visibilitychange", visibility); canvas.removeEventListener("webglcontextlost", contextLost); canvas.removeEventListener("webglcontextrestored", restored);
    field.dispose(); mesh.geometry.dispose(); material.dispose(); zero.dispose(); renderer.dispose(); renderer.forceContextLoss(); host.remove();
  }
  return { bind, setReducedMode, dispose };
}
