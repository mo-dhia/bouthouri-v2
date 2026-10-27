export type StoryCanvasBounds = Pick<DOMRectReadOnly, "x" | "y" | "top" | "bottom" | "left" | "right" | "width" | "height">;

const boundsKeys = ["x", "y", "top", "bottom", "left", "right", "width", "height"] as const;
const snapshot = (bounds: StoryCanvasBounds): StoryCanvasBounds => ({
  x: bounds.x, y: bounds.y, top: bounds.top, bottom: bounds.bottom,
  left: bounds.left, right: bounds.right, width: bounds.width, height: bounds.height,
});

/** Drei's one-frame Environment runs again when the full R3F size changes,
 * including top/left. Keep that capture ordered before a pending child-ready
 * commit: the 512px studio must not retroactively affect an earlier measure.
 * This module owns no renderer, timers, scroll mapping or navigation policy.
 */
export function createStoryEnvironmentLifecycle(initial: StoryCanvasBounds, capture: () => void, activate: () => void) {
  let previous = snapshot(initial), active = false, disposed = false;
  return {
    measure(bounds: StoryCanvasBounds) {
      if (disposed || boundsKeys.every((key) => bounds[key] === previous[key])) return false;
      previous = snapshot(bounds); capture(); return true;
    },
    activate(bounds: StoryCanvasBounds) {
      if (disposed || active) return;
      this.measure(bounds);
      activate(); active = true;
    },
    get active() { return active; },
    dispose() { disposed = true; },
  };
}
