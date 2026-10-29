type Tick = (seconds: number, deltaMs: number) => void;

/** One scene-owned request, including finite tracks and renderer callbacks.
 * Pausing retains requests and excludes hidden/menu elapsed time. */
export function createExperimentClock(win: Window, onError: (error: unknown) => void = () => {}) {
  let frame = 0, serial = 0, stopped = false, paused = false, previous = 0;
  let elapsed = win.performance.now(), lastWall = elapsed;
  const ticks = new Set<Tick>(), requests = new Map<number, FrameRequestCallback>();
  const wake = () => { if (!frame && !stopped && !paused && (ticks.size || requests.size)) frame = win.requestAnimationFrame(present); };
  function present() {
    frame = 0;
    if (stopped || paused) return;
    const wall = win.performance.now(), delta = Math.max(0, wall - (previous || lastWall)) || 16.667;
    previous = wall; lastWall = wall; elapsed += delta > 500 ? 33 : delta;
    const callbacks = [...requests.values()]; requests.clear();
    try {
      ticks.forEach(tick => tick(elapsed / 1000, delta > 500 ? 33 : delta));
      callbacks.forEach(callback => callback(elapsed));
    } catch (error) { stopped = true; ticks.clear(); requests.clear(); onError(error); return; }
    wake();
  }
  return {
    now: () => elapsed + (paused ? 0 : Math.max(0, win.performance.now() - lastWall)),
    add(tick: Tick) { if (!stopped) { ticks.add(tick); wake(); } },
    remove(tick: Tick) { ticks.delete(tick); if (!ticks.size && !requests.size && frame) { win.cancelAnimationFrame(frame); frame = 0; previous = 0; } },
    request(callback: FrameRequestCallback) { if (stopped) return 0; const id = ++serial; requests.set(id, callback); wake(); return id; },
    cancel(id: number) { requests.delete(id); if (!ticks.size && !requests.size && frame) { win.cancelAnimationFrame(frame); frame = 0; previous = 0; } },
    pause(value: boolean) { if (paused === value) return; paused = value; previous = 0; lastWall = win.performance.now(); if (frame) win.cancelAnimationFrame(frame); frame = 0; if (!value) wake(); },
    dispose() { stopped = true; if (frame) win.cancelAnimationFrame(frame); frame = 0; ticks.clear(); requests.clear(); },
  };
}
