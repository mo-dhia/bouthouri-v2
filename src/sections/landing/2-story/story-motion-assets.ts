import type { Object3D } from "three";
import { acquireStoryLighting, disposeObject, loadStoryModel } from "./story-assets";
import { waitForStoryTask } from "./story-boot";

type Loaders = { model(): Promise<Object3D>; lighting(): Promise<() => void> };
const loaders: Loaders = { model: () => loadStoryModel("logo-finished-components"), lighting: acquireStoryLighting };

/** Abort mount ownership, including resources that finish before or after the
 * other request. Network byte caching remains separate from parsed GPU graphs.
 */
export async function loadStoryMotionAssets(signal: AbortSignal, source: Loaders = loaders) {
  if (signal.aborted) throw new DOMException("Story task cancelled.", "AbortError");
  let model: Object3D | undefined, release: (() => void) | undefined;
  let closed = false, adopted = false;
  const clear = () => { if (model) disposeObject(model); model = undefined; release?.(); release = undefined; };
  signal.addEventListener("abort", clear, { once: true });
  try {
    await waitForStoryTask(Promise.all([
      source.model().then((value) => { if (closed || signal.aborted) disposeObject(value); else model = value; }),
      source.lighting().then((value) => { if (closed || signal.aborted) value(); else release = value; }),
    ]), signal);
    adopted = true;
    return { model: model!, release: release! };
  } finally {
    closed = true; signal.removeEventListener("abort", clear);
    if (!adopted) clear();
  }
}
