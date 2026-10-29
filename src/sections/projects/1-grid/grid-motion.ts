import { clamp, damp, gridTarget, type GridLayout, type Point } from './grid-geometry';

/** One mutable input clock, independent of React and the page's scroll clock. */
export function createGridMotion(layout: GridLayout, start: number) {
  const target = gridTarget(layout, start), pan = { ...target }, pointer = { x: 0, y: 0 }, pointerTarget = { x: 0, y: 0 }, velocity = { x: 0, y: 0 };
  let pressure = 0, pressureTarget = 0, down: { x: number; y: number; pan: Point; time: number; previous: Point; dragged: boolean; direct: boolean } | null = null;
  let suppressClick = false;
  return {
    target, pan, pointer, pointerTarget, velocity,
    get pressure() { return pressure; }, get dragging() { return down !== null; }, get dragged() { return !!down?.dragged; },
    wheel(x: number, y: number) { if (down) return; velocity.x = velocity.y = 0; target.x += x; target.y += y; },
    hover(point: Point | null) { if (point) { pointerTarget.x = point.x; pointerTarget.y = point.y; } pressureTarget = point ? 1 : 0; },
    begin(point: Point, time: number, direct = false) {
      suppressClick = false;
      const moving = velocity.x !== 0 || velocity.y !== 0 || Math.abs(target.x - pan.x) + Math.abs(target.y - pan.y) > 12;
      velocity.x = velocity.y = 0;
      if (moving) { target.x = pan.x; target.y = pan.y; }
      down = { ...point, pan: { ...target }, time, previous: { ...point }, dragged: moving, direct };
    },
    move(point: Point, time: number) {
      if (!down) return;
      const dx = point.x - down.x, dy = point.y - down.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) down.dragged = true;
      const dt = Math.max(1, time - down.time), blend = Math.min(1, dt / 80);
      velocity.x = velocity.x * (1 - blend) + (point.x - down.previous.x) / dt * 1000 * blend;
      velocity.y = velocity.y * (1 - blend) + (point.y - down.previous.y) / dt * 1000 * blend;
      target.x = down.pan.x - dx; target.y = down.pan.y - dy;
      down.previous = { ...point }; down.time = time;
    },
    release(time: number, cancel = false, reduced = false) {
      if (!down) return;
      suppressClick = down.dragged && !cancel;
      if (!cancel && !reduced && down.dragged && time - down.time <= 90) { velocity.x = -clamp(velocity.x, -3500, 3500); velocity.y = -clamp(velocity.y, -3500, 3500); }
      else velocity.x = velocity.y = 0;
      down = null;
    },
    consumeClick() { const suppressed = suppressClick; suppressClick = false; return suppressed; },
    resize(next: GridLayout, previous: GridLayout) {
      for (const point of [target, pan]) { point.x *= next.stepX / previous.stepX; point.y *= next.stepY / previous.stepY; }
      velocity.x = velocity.y = 0; down = null;
    },
    step(delta: number, reduced: boolean) {
      const frames = Math.min(delta, 50) / 16.667;
      let changed = false;
      if (!down && (velocity.x || velocity.y)) {
        const seconds = Math.min(delta, 100) / 1000;
        target.x += velocity.x * seconds; target.y += velocity.y * seconds;
        const decay = Math.exp(-seconds / .45); velocity.x *= decay; velocity.y *= decay;
        if (Math.abs(velocity.x) < 15 && Math.abs(velocity.y) < 15 || reduced) velocity.x = velocity.y = 0;
        changed = true;
      }
      // Touch and pen are direct manipulation: follow the contact on the next
      // presentation, then retain the existing release momentum. Mouse dragging
      // keeps the reference's damped response.
      const ease = reduced || down?.direct ? 1 : damp(down ? .078 : .09, frames);
      for (const key of ['x', 'y'] as const) {
        const before = pan[key]; pan[key] += (target[key] - pan[key]) * ease;
        if (Math.abs(target[key] - pan[key]) < .05) pan[key] = target[key];
        changed ||= before !== pan[key];
      }
      if (!reduced) {
        const influence = pressureTarget / (1 + (Math.abs(target.x - pan.x) + Math.abs(target.y - pan.y)) / 40);
        for (const key of ['x', 'y'] as const) {
          const before = pointer[key]; pointer[key] += (pointerTarget[key] - pointer[key]) * damp(.12, frames);
          if (Math.abs(pointerTarget[key] - pointer[key]) < .0001) pointer[key] = pointerTarget[key];
          changed ||= before !== pointer[key];
        }
        const before = pressure; pressure += (influence - pressure) * damp(.08, frames);
        if (Math.abs(influence - pressure) < .001) pressure = influence;
        changed ||= before !== pressure;
      } else {
        if (pressure || pointer.x || pointer.y) changed = true;
        pressure = pressureTarget = 0; pointer.x = pointer.y = pointerTarget.x = pointerTarget.y = 0;
      }
      return changed;
    },
    get active() { return !!(!down && (velocity.x || velocity.y) || target.x !== pan.x || target.y !== pan.y || pressure !== pressureTarget || Math.abs(pointer.x - pointerTarget.x) + Math.abs(pointer.y - pointerTarget.y) > .0001); },
  };
}
