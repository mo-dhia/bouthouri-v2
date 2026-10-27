import { clamp } from "./story-score";
import { createMaterialProtection, type MaterialProtection } from "./story-material-protection";

export function createEnvironmentPointer(wake: () => void) {
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  const state = {
    enabled: fine.matches, coarse: !fine.matches, hovering: false, pressed: false,
    contextTarget: 1, contextStrength: 1, targetX: 0, targetY: 0, x: 0, y: 0,
    fieldX: 0, fieldY: 0, velocityX: 0, velocityY: 0, press: 0, pressHold: 0,
    anchorX: 0, anchorY: 0, dragX: 0, dragY: 0, scrollVelocity: 0,
    clickSerial: 0, clickX: 0, clickY: 0, pressureScale: 1, footerInfluence: 0,
  };
  const protection = createMaterialProtection();
  let active = true, grabbed = false, lastScroll = scrollY;
  let down: { x: number; y: number; id: number } | null = null;
  const resetInput = () => {
    state.hovering = state.pressed = false; state.pressHold = 0;
    state.targetX = state.targetY = 0; state.contextTarget = 1; down = null; wake();
  };
  const reset = () => {
    resetInput();
    protection.clear(); state.pressureScale = 1; state.footerInfluence = 0;
  };
  const begin = (x: number, y: number) => {
    state.targetX = clamp(x, -1, 1); state.targetY = clamp(y, -1, 1);
    state.anchorX = state.targetX; state.anchorY = state.targetY;
    state.pressed = true; state.pressHold = 0.14;
    state.clickX = state.targetX; state.clickY = state.targetY; state.clickSerial++;
    if (state.coarse) { state.fieldX = state.targetX; state.fieldY = state.targetY; }
  };
  const move = (event: PointerEvent) => {
    if (!active || document.hidden) return;
    if (down && event.pointerType !== "mouse" && Math.hypot(event.clientX - down.x, event.clientY - down.y) > 10) { reset(); return; }
    if (!state.enabled || event.pointerType !== "mouse") return;
    state.targetX = event.clientX / innerWidth * 2 - 1; state.targetY = 1 - event.clientY / innerHeight * 2;
    state.hovering = true;
    const target = event.target instanceof Element ? event.target : null;
    state.contextTarget = target?.closest("[data-portrait-entrance],.services-gate-scene,.project-composition,.projects-playground,[data-object-grab]") ? 0.46
      : target?.closest("p,h1,h2,h3,fieldset,.case-reading-index") ? 0.72 : 1;
    wake();
  };
  const press = (event: PointerEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!active || grabbed || document.hidden || event.button !== 0 || target?.closest("button,a,input,label,select,textarea")) return;
    down = { x: event.clientX, y: event.clientY, id: event.pointerId };
    if (event.pointerType === "mouse") begin(event.clientX / innerWidth * 2 - 1, 1 - event.clientY / innerHeight * 2);
    wake();
  };
  const release = (event: PointerEvent) => {
    const initial = down; down = null;
    if (!initial || initial.id !== event.pointerId) return;
    if (event.pointerType !== "mouse" && Math.hypot(event.clientX - initial.x, event.clientY - initial.y) < 12) begin(event.clientX / innerWidth * 2 - 1, 1 - event.clientY / innerHeight * 2);
    state.pressed = false; wake();
  };
  const leave = (event: PointerEvent) => { if (!event.relatedTarget) reset(); };
  const scroll = () => { state.scrollVelocity = clamp(state.scrollVelocity + (scrollY - lastScroll) / innerHeight * 3, -1, 1); lastScroll = scrollY; wake(); };
  const visibility = () => { if (document.hidden) { reset(); state.press = state.velocityX = state.velocityY = 0; } };
  const change = () => { state.enabled = fine.matches; state.coarse = !fine.matches; reset(); };
  const protect = (event: Event) => {
    protection.update((event as CustomEvent<MaterialProtection>).detail);
    state.pressureScale = protection.pressureScale; state.footerInfluence = protection.footerInfluence;
    wake();
  };
  window.addEventListener("pointermove", move, { passive: true }); window.addEventListener("pointerdown", press, { passive: true });
  window.addEventListener("pointerup", release, { passive: true }); window.addEventListener("pointerout", leave);
  window.addEventListener("pointercancel", reset); window.addEventListener("blur", reset); window.addEventListener("resize", reset);
  window.addEventListener("scroll", scroll, { passive: true }); document.addEventListener("visibilitychange", visibility); fine.addEventListener("change", change);
  window.addEventListener("gazzar:material-protection", protect);
  return {
    state,
    resetInput,
    setActive(value: boolean) { active = value; if (!value) reset(); },
    setGrabbed(value: boolean) { grabbed = value; if (value) { state.pressed = false; state.pressHold = 0; } },
    advance(dt: number, menuOpen: boolean) {
      const follow = 1 - Math.exp(-5.5 * dt), enabled = active && state.enabled && !menuOpen;
      const tx = enabled ? state.targetX : 0, ty = enabled ? state.targetY : 0;
      state.x += (tx - state.x) * follow; state.y += (ty - state.y) * follow;
      state.contextStrength += (Math.min(state.contextTarget, grabbed ? 0.28 : 1, 1 - 0.62 * state.footerInfluence) - state.contextStrength) * (1 - Math.exp(-10 * dt));
      state.pressHold = Math.max(0, state.pressHold - dt); state.scrollVelocity *= Math.exp(-7 * dt);
      if (Math.abs(state.scrollVelocity) < 1e-4) state.scrollVelocity = 0;
      const previousX = state.fieldX, previousY = state.fieldY;
      const fieldActive = !menuOpen && (enabled && state.hovering || state.pressed || state.pressHold > 0);
      if (fieldActive) { const p = 1 - Math.exp(-14 * dt); state.fieldX += (state.targetX - state.fieldX) * p; state.fieldY += (state.targetY - state.fieldY) * p; }
      const velocity = 1 - Math.exp(-12 * dt);
      state.velocityX += ((dt ? (state.fieldX - previousX) / dt : 0) - state.velocityX) * velocity;
      state.velocityY += ((dt ? (state.fieldY - previousY) / dt : 0) - state.velocityY) * velocity;
      const pressure = !menuOpen && (state.pressed || state.pressHold > 0) ? 1 : 0;
      const dx = state.pressed ? 0.45 * clamp(state.targetX - state.anchorX, -1, 1) : 0;
      const dy = state.pressed ? 0.45 * clamp(state.targetY - state.anchorY, -1, 1) : 0;
      state.press += (pressure - state.press) * (1 - Math.exp(-(pressure ? 18 : 5) * dt));
      state.dragX += (dx - state.dragX) * (1 - Math.exp(-(state.pressed ? 10 : 3) * dt));
      state.dragY += (dy - state.dragY) * (1 - Math.exp(-(state.pressed ? 10 : 3) * dt));
      if (menuOpen) { state.press = state.pressHold = state.dragX = state.dragY = state.velocityX = state.velocityY = state.scrollVelocity = 0; state.pressed = false; }
      let moving = false;
      for (const [field, target] of [["x", tx], ["y", ty], ["press", pressure], ["dragX", dx], ["dragY", dy], ["velocityX", 0], ["velocityY", 0]] as const) {
        if (Math.abs(state[field] - target) < 2e-4) state[field] = target; else moving = true;
      }
      return moving || fieldActive && Math.abs(state.fieldX - state.targetX) + Math.abs(state.fieldY - state.targetY) > 2e-4 || state.pressHold > 0 || Math.abs(state.scrollVelocity) > 1e-4;
    },
    dispose() {
      active = false; window.removeEventListener("pointermove", move); window.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release); window.removeEventListener("pointerout", leave); window.removeEventListener("pointercancel", reset);
      window.removeEventListener("blur", reset); window.removeEventListener("resize", reset); window.removeEventListener("scroll", scroll);
      document.removeEventListener("visibilitychange", visibility); fine.removeEventListener("change", change);
      window.removeEventListener("gazzar:material-protection", protect); protection.clear();
    },
  };
}
