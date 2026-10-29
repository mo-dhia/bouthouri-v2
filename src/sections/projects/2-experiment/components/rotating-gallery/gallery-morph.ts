import type { createExperimentEnvironment } from '../../experiment-environment';
import { referenceRect, setDesignStyle } from '../../experiment-dom';

type Environment = ReturnType<typeof createExperimentEnvironment>;
type Rect = { x: number; y: number; width: number; height: number };
const properties = ['position', 'left', 'top', 'width', 'height', 'transform', 'transform-origin', 'pointer-events', 'z-index'];
type Snapshot = { element: HTMLElement; from: Rect; original: string[] }[];

/** Native layout inversion for the source's axis-aligned, translated 3D cards.
 * Screen rectangles include its perspective scale. An owned stage layer retains
 * them while their real destination parents determine the final rectangles. */
export function createGalleryMorph(env: Environment, stage: HTMLElement) {
  let layer: HTMLElement | undefined;
  let handles: { kill(): void }[] = [], restore: (() => void) | undefined;
  let version = 0;
  const cancel = () => { version++; handles.forEach(handle => handle.kill()); handles = []; restore?.(); restore = undefined; layer?.remove(); layer = undefined; };
  const capture = (elements: HTMLElement[]): Snapshot => {
    // Capture before killing an interrupted layout; never jump to its endpoint.
    const bounds = elements.map(element => referenceRect(element));
    cancel();
    return elements.map((element, index) => ({ element, from: bounds[index], original: properties.map(key => element.style.getPropertyValue(key)) }));
  };
  const play = (snapshot: Snapshot, options: { duration: number; ease: string; stagger(index: number): number; onComplete(): void }) => {
    const token = ++version, origin = referenceRect(stage);
    const destinations = snapshot.map(({ element }) => ({ rect: referenceRect(element), parent: element.parentElement! }));
    const overlay = stage.ownerDocument.createElement('div'); layer = overlay;
    overlay.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:3';
    stage.append(overlay);
    const complete = () => {
      snapshot.forEach(({ element, original }, index) => {
        destinations[index].parent.append(element);
        properties.forEach((key, i) => { if (original[i]) element.style.setProperty(key, original[i]); else element.style.removeProperty(key); });
      });
      overlay.remove(); if (layer === overlay) layer = undefined;
    };
    restore = complete;
    let remaining = snapshot.length;
    snapshot.forEach(({ element, from }, index) => {
      const to = destinations[index].rect;
      overlay.append(element); element.style.position = 'absolute'; element.style.transform = 'none'; element.style.transformOrigin = '0 0'; element.style.pointerEvents = 'none';
      element.style.zIndex = String(Number(destinations[index].parent.style.zIndex) || 0);
      const pose = { x: from.x - origin.x, y: from.y - origin.y, width: from.width, height: from.height };
      const draw = () => { setDesignStyle(element, 'left', `${pose.x}px`); setDesignStyle(element, 'top', `${pose.y}px`); setDesignStyle(element, 'width', `${pose.width}px`); setDesignStyle(element, 'height', `${pose.height}px`); };
      draw();
      handles.push(env.motion.tween(pose, { x: to.x - origin.x, y: to.y - origin.y, width: to.width, height: to.height,
        duration: options.duration, ease: options.ease, delay: options.stagger(index), onUpdate: draw,
        onComplete() { if (token !== version) return; if (--remaining === 0) { restore = undefined; complete(); handles = []; options.onComplete(); } },
      }));
    });
  };
  return { capture, play, dispose: cancel };
}
