import { getScrollTrigger } from "./scrollTrigger";
import { createSmartStyleSetter } from "./createSmartStyleSetter";

/** Call from a lazily loaded controller, never during server rendering. */
export function mountParallax(element: HTMLElement, key: string): () => void {
  const trigger = getScrollTrigger();
  if (!trigger) return () => {};
  const setter = createSmartStyleSetter(element);
  const initialTransform = element.style.transform;
  trigger.createInstance(key, element, {
    values: [[16, -16]], startPoint: [0], endPoint: [0],
    callback: ({ v }) => setter.set("transform", `translate3d(0, ${v[0]}px, 0)`),
  });
  return () => {
    trigger.removeInstance(key);
    element.style.transform = initialTransform;
    setter.clearCache();
  };
}
