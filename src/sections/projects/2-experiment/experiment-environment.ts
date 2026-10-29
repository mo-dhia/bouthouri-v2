import { uiStore } from '@/store/uiStore';
import { createExperimentClock } from './experiment-clock';
import { createExperimentMotion } from './experiment-motion';
import { designCss } from './experiment-dom';
import { experimentLayout } from './experiment-layout';

/** Resources belong to this physical mount, including user-intent audio/ML. */
export function createExperimentEnvironment(root: HTMLElement, reduced: boolean, failure: (error: unknown) => void) {
  const win = root.ownerDocument.defaultView!, clock = createExperimentClock(win, failure);
  let disposed = false, layout = experimentLayout(win.innerWidth, win.innerHeight);
  const media = new Set<HTMLAudioElement>(), workers = new Set<Worker>();
  const timers = new Set<number>(), intervals = new Set<number>();
  const resizers = new Map<ResizeObserver, ResizeObserverCallback>();
  const motion = createExperimentMotion(clock, win, designCss);
  const resize = () => {
    layout = experimentLayout(win.innerWidth, win.innerHeight);
    root.dataset.experimentScale = String(layout.scale);
    root.style.setProperty('--experiment-scale', String(layout.scale));
    root.style.setProperty('--experiment-reference-width', String(layout.design.width));
    root.style.inlineSize = `calc(${layout.width} * var(--experiment-unit))`;
    root.style.blockSize = `calc(${layout.height} * var(--experiment-unit))`;
    resizers.forEach((callback, observer) => callback([], observer));
  };
  resize();
  return {
    clock, motion, reduced, now: clock.now, requestFrame: clock.request, cancelFrame: clock.cancel, fail: failure,
    get disposed() { return disposed; }, get scale() { return layout.scale; }, get designWidth() { return layout.design.width; }, get designHeight() { return layout.design.height; },
    get pixelRatio() { return (win.devicePixelRatio || 1) * layout.scale; },
    clientX(event: { clientX: number }) { return event.clientX / layout.scale; },
    clientY(event: { clientY: number }) { return event.clientY / layout.scale; },
    resizeObserver(callback: ResizeObserverCallback) {
      const observer = new ResizeObserver(callback), disconnect = observer.disconnect.bind(observer);
      resizers.set(observer, callback); observer.disconnect = () => { resizers.delete(observer); disconnect(); };
      return observer;
    },
    audio(src?: string) { const audio = root.ownerDocument.createElement('audio'); if (src) audio.src = src; media.add(audio); return audio; },
    play(audio: HTMLAudioElement) { return uiStore.getState().soundEnabled ? audio.play() : Promise.resolve(); },
    worker(url: string | URL, options?: WorkerOptions) { if (disposed) throw new Error('Departed experiment'); const worker = new Worker(url, options); workers.add(worker); return worker; },
    setTimeout(callback: () => void, delay = 0) { if (disposed) return 0; const id = win.setTimeout(() => { timers.delete(id); if (!disposed) callback(); }, delay); timers.add(id); return id; },
    clearTimeout(id: number) { win.clearTimeout(id); timers.delete(id); },
    setInterval(callback: () => void, delay: number) { if (disposed) return 0; const id = win.setInterval(() => { if (!disposed) callback(); }, delay); intervals.add(id); return id; },
    clearInterval(id: number) { win.clearInterval(id); intervals.delete(id); },
    resize,
    pause(value: boolean) { clock.pause(value); if (value) media.forEach(audio => audio.pause()); },
    dispose() {
      if (disposed) return; disposed = true; motion.dispose(); clock.dispose();
      root.getAnimations({ subtree: true }).forEach(animation => animation.cancel());
      resizers.forEach((_, observer) => observer.disconnect()); resizers.clear();
      media.forEach(audio => { audio.pause(); audio.removeAttribute('src'); audio.load(); }); media.clear();
      timers.forEach(id => win.clearTimeout(id)); timers.clear(); intervals.forEach(id => win.clearInterval(id)); intervals.clear();
      workers.forEach(worker => worker.terminate()); workers.clear();
    },
  };
}
