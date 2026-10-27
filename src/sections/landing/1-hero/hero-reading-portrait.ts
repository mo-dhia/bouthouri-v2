export type ReadingPortraitFrame = {
  resolve: number;
  exit: number;
  pointer: number;
  active: boolean;
  viewTop: number;
  viewHeight: number;
};

/** Source reduced portrait: preparation and a zero-delta wake are distinct draws. */
export function createReadingPortraitState() {
  let frame: ReadingPortraitFrame = { resolve: 1, exit: 0, pointer: 1, active: false, viewTop: 0, viewHeight: 1 };
  let viewTop = 0, viewHeight = 1;
  let ready = false, dirty = true, lastResolve = -1, budget = 1 / 60;
  return {
    get frame() { return frame; },
    measure(top: number, height: number) { viewTop = top; viewHeight = height; },
    sample(next: Omit<ReadingPortraitFrame, "viewTop" | "viewHeight">) {
      if (next.exit !== frame.exit) dirty = true;
      if (next.exit > 0 && (frame.viewTop !== viewTop || frame.viewHeight !== viewHeight)) dirty = true;
      frame = { ...next, viewTop, viewHeight };
      // Source !en caches resolve even when the hero itself is hidden. The
      // document/menu guard belongs to the caller, before this sample.
      if (!ready) lastResolve = next.resolve;
    },
    prepared() { ready = true; dirty = true; },
    unavailable() { ready = false; },
    invalidate() { dirty = true; },
    draw(delta: number) {
      if (!ready || !frame.active) return false;
      budget = Math.min(1 / 30, budget + delta);
      if ((!dirty && lastResolve === frame.resolve) || (lastResolve >= 0 && budget < 1 / 60 - 0.0005)) return false;
      budget = Math.max(0, budget - 1 / 60);
      lastResolve = frame.resolve;
      dirty = false;
      return true;
    },
  };
}

export type ReadingPortraitState = ReturnType<typeof createReadingPortraitState>;
