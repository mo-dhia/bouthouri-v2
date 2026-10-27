import { Camera, DataTexture, Mesh, PlaneGeometry, Scene, ShaderMaterial, SRGBColorSpace, WebGLRenderer } from "three";
import { heroWorldEvent, readHeroWorldPose, worldProgressFromScroll, type HeroWorldPose } from "../1-hero/hero-world";
import { createEnvironmentField } from "./story-environment-field";
import { createEnvironmentPointer } from "./story-environment-pointer";
import { environmentFragment, environmentVertex } from "./story-environment-shaders";
import { clamp, sampleStoryScore, smooth, type StoryFrame } from "./story-score";
import styles from "./story-scene.module.css";

export type SceneGuard = { x: number; y: number; rx: number; ry: number; weight: number };
export type SceneInteraction = { guards: SceneGuard[]; grabbed: boolean };
export type StoryEnvironmentController = { setReducedMode(enabled: boolean): void; dispose(): void };
type StoryEnvironmentOptions = { reduced?: boolean };

/** Cleanup-only adapter retained for imperative callers. */
export function mountStoryEnvironment(stage: HTMLElement, options: StoryEnvironmentOptions = {}) {
  return createStoryEnvironment(stage, options).dispose;
}

/** One fixed material controller for the HOME lifetime, including reading mode. */
export function createStoryEnvironment(stage: HTMLElement, options: StoryEnvironmentOptions = {}): StoryEnvironmentController {
  let reduced = options.reduced ?? false;
  const page = stage.closest<HTMLElement>("main") ?? stage.parentElement!;
  const owner = stage.closest<HTMLElement>(".experience") ?? page;
  const host = document.createElement("div");
  host.className = `global-environment ${styles.environment}`; host.setAttribute("aria-hidden", "true");
  const canvas = document.createElement("canvas"); canvas.className = styles.environmentCanvas; host.append(canvas);
  owner.prepend(host);
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: false, antialias: false, powerPreference: "low-power" });
    renderer.outputColorSpace = SRGBColorSpace;
  } catch {
    host.remove(); stage.dataset.storyEnvironment = "failed";
    return { setReducedMode() {}, dispose() { delete stage.dataset.storyEnvironment; } };
  }
  const canSimulate = renderer.extensions.has("EXT_color_buffer_float");
  const scene = new Scene(), camera = new Camera();
  const zero = new DataTexture(new Uint8Array(4), 1, 1); zero.needsUpdate = true;
  let width = innerWidth, height = innerHeight, aspect = width / Math.max(1, height), mobile = width < 700;
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
  let previousTravel = -1.2, workTravel = -1.35;
  let menuOpen = document.documentElement.dataset.menuOpen === "true";
  const heroRoot = page.querySelector<HTMLElement>("#identity");
  let heroProgress = readHeroWorldPose(heroRoot)?.progress ?? worldProgressFromScroll(
    heroRoot ? -heroRoot.getBoundingClientRect().top : scrollY, heroRoot?.offsetHeight || innerHeight, width <= 700,
  );
  const readFrame = (): StoryFrame => ({ time: Number(stage.dataset.storyTime ?? 0), openingTime: Number(stage.dataset.openingTime ?? 0), progress: Number(stage.dataset.progress ?? 0) });
  const readingFrame: StoryFrame = { time: 0, openingTime: 26, progress: 0, emergence: 1 };
  let frame = readFrame(), refreshFrame = false;
  let guards: SceneGuard[] = [];
  const active = () => !disposed && !lost && visible && !document.hidden && !menuOpen;
  const cancel = () => { if (frameId) cancelAnimationFrame(frameId); if (timer) clearTimeout(timer); frameId = timer = 0; last = 0; };
  function wake() {
    if (!active() || frameId) return;
    if (timer) { clearTimeout(timer); timer = 0; }
    frameId = requestAnimationFrame(render);
  }
  const pointer = createEnvironmentPointer(wake);
  const fail = () => { lost = true; cancel(); host.style.visibility = "hidden"; stage.dataset.storyEnvironment = "failed"; };
  function render(now: number) {
    frameId = 0;
    if (!active()) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 1 / 60); last = now; time += dt * (reduced ? 0.035 : 1);
    if (!reduced && refreshFrame) { frame = readFrame(); refreshFrame = false; }
    // Source resets initialNarrative on reading entry independently of DOM time.
    const score = sampleStoryScore(reduced ? readingFrame : frame, width < 701), input = pointer.state;
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
    const horizontal = clamp((workTravel - previousTravel) / Math.max(dt, 0.001) * 0.18, -1, 1) * (1 - 0.6 * workQuiet);
    previousTravel = workTravel;
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
    stage.dataset.storyEnvironment = "ready"; canvas.dataset.surface = "stateful-sculptural";
    canvas.dataset.simulation = canSimulate && remaining > 0 ? "active" : "rest";
    canvas.dataset.materialTime = time.toFixed(6);
    canvas.dataset.pressureScale = input.pressureScale.toFixed(4);
    canvas.dataset.footerInfluence = input.footerInfluence.toFixed(4);
    canvas.dataset.contextStrength = input.contextStrength.toFixed(4);
    // The studio normal drift is intentional source content even at rest.
    if (pointerMoving || energetic || remaining > 4.5) wake();
    else if (remaining > 0) timer = window.setTimeout(() => { timer = 0; wake(); }, 1000 / 30);
    else timer = window.setTimeout(() => { timer = 0; wake(); }, reduced ? 250 : 1000 / 24);
  }
  const measure = () => {
    if (disposed || lost) return;
    try {
      const nextAspect = innerWidth / Math.max(1, innerHeight), nextMobile = innerWidth < 700;
      const fieldChanged = nextAspect !== aspect || nextMobile !== mobile, gridChanged = nextMobile !== mobile;
      width = innerWidth; height = innerHeight; aspect = nextAspect; mobile = nextMobile;
      renderer.setPixelRatio(Math.min(1.5, Math.max(1, devicePixelRatio))); renderer.setSize(width, height, false);
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
  const onFrame = (event: Event) => {
    const next = (event as CustomEvent<StoryFrame>).detail;
    if (!next || !Number.isFinite(next.time)) return;
    frame = next; refreshFrame = false;
    workTravel = Number(stage.querySelector<HTMLElement>(".work-world")?.dataset.travel ?? -1.35);
    // Parent clock owns this update; use our RAF only for physical settling.
    if (frameId) { cancelAnimationFrame(frameId); frameId = 0; }
    if (timer) { clearTimeout(timer); timer = 0; }
    render(performance.now());
  };
  const interaction = (event: Event) => {
    const detail = (event as CustomEvent<SceneInteraction>).detail;
    if (!detail) return; guards = detail.guards; pointer.setGrabbed(detail.grabbed);
  };
  const hero = (event: Event) => { const detail = (event as CustomEvent<Partial<HeroWorldPose>>).detail; if (detail && Number.isFinite(detail.progress)) { heroProgress = clamp(detail.progress!); wake(); } };
  const visibility = () => { pointer.setActive(!document.hidden && visible && !menuOpen && !lost); if (document.hidden) cancel(); else wake(); };
  const contextLost = (event: Event) => { event.preventDefault(); fail(); };
  const restored = () => {
    if (disposed) return;
    // Context loss invalidates GPU contents even when the allocation keys match.
    // Keep the CPU histories; reinitialize the targets only on the next draw.
    lost = false; fieldCleared = false; fieldNeedsClear = true;
    pointer.setActive(visible && !document.hidden && !menuOpen);
    host.style.removeProperty("visibility"); measure();
  };
  const observer = new IntersectionObserver(([entry]) => { visible = entry?.isIntersecting ?? false; pointer.setActive(visible && !document.hidden && !menuOpen && !lost); if (visible) wake(); else cancel(); });
  observer.observe(page);
  const menu = new MutationObserver(() => {
    menuOpen = document.documentElement.dataset.menuOpen === "true";
    pointer.setActive(!menuOpen && visible && !document.hidden && !lost);
    if (menuOpen) cancel(); else wake();
  });
  menu.observe(document.documentElement, { attributes: true, attributeFilter: ["data-menu-open"] });
  stage.addEventListener("journey-frame", onFrame); stage.addEventListener("journey-scene-interaction", interaction);
  window.addEventListener("resize", measure, { passive: true }); window.addEventListener(heroWorldEvent, hero);
  document.addEventListener("visibilitychange", visibility); canvas.addEventListener("webglcontextlost", contextLost); canvas.addEventListener("webglcontextrestored", restored);
  measure();
  function setReducedMode(enabled: boolean) {
    if (disposed || enabled === reduced) return;
    reduced = enabled;
    // Resume from this HOME's current clock, never its last motion score. A
    // subsequent precise journey event wins; otherwise reread before the draw
    // in case the parent's mode/layout effect refreshed the DOM clock later.
    if (!enabled) { frame = readFrame(); refreshFrame = true; }
    // Source's reduced-prop input effect releases transient targets, retaining
    // smoothed pointer coordinates, protections and the complete field history.
    pointer.resetInput();
    // Wake replaces an idle timer and shares the existing RAF.
    wake();
  }
  function dispose() {
    if (disposed) return;
    disposed = true; cancel(); observer.disconnect(); menu.disconnect(); pointer.dispose();
    stage.removeEventListener("journey-frame", onFrame); stage.removeEventListener("journey-scene-interaction", interaction);
    window.removeEventListener("resize", measure); window.removeEventListener(heroWorldEvent, hero);
    document.removeEventListener("visibilitychange", visibility); canvas.removeEventListener("webglcontextlost", contextLost); canvas.removeEventListener("webglcontextrestored", restored);
    field.dispose(); mesh.geometry.dispose(); material.dispose(); zero.dispose(); renderer.dispose(); renderer.forceContextLoss(); host.remove(); delete stage.dataset.storyEnvironment;
  }
  return { setReducedMode, dispose };
}
