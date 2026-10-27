import { Raycaster, Vector2, type Camera, type Object3D } from "three";
import { clamp, spring } from "./story-score";

export type Pull = { x: number; y: number; vx: number; vy: number; tx: number; ty: number; held: boolean; cancelled: boolean };
export type StoryPointer = ReturnType<typeof createStoryPointer>;
const makePull = (): Pull => ({ x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, held: false, cancelled: false });
const grabWindows = [[128, 141], [174, 185], [218, 232]];

function advancePull(pull: Pull, dt: number) {
  const steps = Math.max(1, Math.ceil(240 * dt)), step = dt / steps;
  const frequency = pull.held ? 19 : pull.cancelled ? 23 : 14;
  const damping = pull.held || pull.cancelled ? 1 : 0.72;
  for (let i = 0; i < steps; i++) {
    pull.vx += (frequency ** 2 * (pull.tx - pull.x) - 2 * damping * frequency * pull.vx) * step;
    pull.vy += (frequency ** 2 * (pull.ty - pull.y) - 2 * damping * frequency * pull.vy) * step;
    pull.x += pull.vx * step; pull.y += pull.vy * step;
  }
  const moving = Math.abs(pull.x - pull.tx) + Math.abs(pull.y - pull.ty) + Math.abs(pull.vx) + Math.abs(pull.vy) > 4e-5;
  if (!moving) { pull.x = pull.tx; pull.y = pull.ty; pull.vx = pull.vy = 0; }
  return moving;
}

/** Native pointer input and the original bounded, damped object pull. No DOM animation. */
export function createStoryPointer(canvas: HTMLCanvasElement, camera: Camera, invalidate: () => void) {
  const ray = new Raycaster(), ndc = new Vector2();
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  const state = { x: 0, y: 0, targetX: 0, targetY: 0, vx: 0, vy: 0, hovering: false, coarse: !fine.matches, enabled: true };
  const pulls = Array.from({ length: 4 }, makePull);
  let objects: Object3D[] = [], time = 0, emergence = 0, hover = -1, active = true;
  let rect = canvas.getBoundingClientRect();
  let held: { index: number; id: number; x: number; y: number; time: number } | null = null;
  const eligible = (index: number) => index === 0 ? emergence > 0.999 && time < 7
    : time >= grabWindows[index - 1][0] && time <= grabWindows[index - 1][1];
  const cursor = () => { canvas.style.cursor = held ? "grabbing" : hover >= 0 && eligible(hover) ? "grab" : ""; };
  const release = (cancelled = false) => {
    if (!held) return;
    const pull = pulls[held.index];
    pull.held = false; pull.cancelled = cancelled; pull.tx = pull.ty = 0;
    const id = held.id; held = null;
    if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
    cursor(); invalidate();
  };
  const leave = () => { state.hovering = false; hover = -1; cursor(); invalidate(); };
  const cancel = () => { release(true); leave(); };
  const move = (event: PointerEvent) => {
    if (!active) return;
    state.targetX = clamp((event.clientX - rect.left) / Math.max(1, rect.width) * 2 - 1, -1, 1);
    state.targetY = clamp(1 - (event.clientY - rect.top) / Math.max(1, rect.height) * 2, -1, 1);
    state.hovering = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (held && event.pointerId === held.id) {
      const radius = held.index === 0 ? 0.38 : 0.32;
      const factor = 5 * radius / Math.min(innerWidth, innerHeight);
      const dx = (event.clientX - held.x) * factor, dy = (held.y - event.clientY) * factor;
      const length = Math.hypot(dx, dy), limit = length ? radius * Math.tanh(length / radius) / length : 1;
      pulls[held.index].tx = dx * limit; pulls[held.index].ty = dy * limit;
    } else if (state.hovering && objects.length && time < 306) {
      ndc.set(state.targetX, state.targetY); ray.setFromCamera(ndc, camera);
      const hits = ray.intersectObjects(time < 75 ? objects.slice(0, 1) : time >= 98 ? objects.slice(1) : [], true);
      hover = hits.length ? objects.findIndex((object) => {
        let hit: Object3D | null = hits[0].object;
        while (hit) { if (hit === object) return true; hit = hit.parent; }
        return false;
      }) : -1;
      // Objects are supplied [glasses hit plane, curve, circle, dash].
      if (time >= 75 && hover === 0) hover = -1;
    } else hover = -1;
    cursor(); invalidate();
  };
  const down = (event: PointerEvent) => {
    move(event);
    if (event.button !== 0 || hover < 0 || !eligible(hover)) return;
    held = { index: hover, id: event.pointerId, x: event.clientX, y: event.clientY, time };
    pulls[hover].held = true; pulls[hover].cancelled = false;
    canvas.setPointerCapture(event.pointerId);
    canvas.dataset.grabCount = String(Number(canvas.dataset.grabCount ?? 0) + 1);
    canvas.dataset.lastGrab = hover === 0 ? "sunglasses" : `part-${hover}`;
    cursor(); invalidate();
  };
  const up = (event: PointerEvent) => { if (held?.id === event.pointerId) release(); };
  const visibility = () => { if (document.hidden) cancel(); };
  const captureLost = () => release(true);
  const change = () => { state.coarse = !fine.matches; cancel(); };
  window.addEventListener("pointermove", move, { passive: true });
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointerleave", leave);
  canvas.addEventListener("lostpointercapture", captureLost);
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", cancel);
  window.addEventListener("blur", cancel);
  window.addEventListener("scroll", cancel, { passive: true });
  document.addEventListener("visibilitychange", visibility);
  fine.addEventListener("change", change);
  return {
    state, pulls,
    get hovered() { return hover; },
    setObjects(value: Object3D[]) { objects = value; },
    measure() { rect = canvas.getBoundingClientRect(); },
    setActive(value: boolean) { active = value; if (!value) cancel(); },
    advance(dt: number, storyTime: number, presence: number) {
      time = storyTime; emergence = presence;
      if (held && (!eligible(held.index) || Math.abs(time - held.time) > 0.2)) release(true);
      const sx = spring(state.x, state.vx, state.hovering ? state.targetX : 0, 8, dt);
      const sy = spring(state.y, state.vy, state.hovering ? state.targetY : 0, 8, dt);
      state.x = sx.position; state.vx = sx.velocity; state.y = sy.position; state.vy = sy.velocity;
      let moving = false;
      for (const pull of pulls) moving = advancePull(pull, dt) || moving;
      canvas.dataset.grab = held ? "held" : moving ? "settling" : "rest";
      canvas.dataset.glassesPull = Math.hypot(pulls[0].x, pulls[0].y).toFixed(4);
      canvas.dataset.sculpturePull = pulls.slice(1).map((pull) => Math.hypot(pull.x, pull.y).toFixed(4)).join(",");
      return moving || Math.abs(state.x - state.targetX) + Math.abs(state.y - state.targetY) > 1e-4 && state.hovering;
    },
    dispose() {
      active = false; cancel();
      window.removeEventListener("pointermove", move); canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointerleave", leave); window.removeEventListener("pointerup", up);
      canvas.removeEventListener("lostpointercapture", captureLost);
      window.removeEventListener("pointercancel", cancel); window.removeEventListener("blur", cancel);
      window.removeEventListener("scroll", cancel); document.removeEventListener("visibilitychange", visibility);
      fine.removeEventListener("change", change);
    },
  };
}
