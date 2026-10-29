import type { createExperimentEnvironment } from '../../experiment-environment';
import { setDesignStyle, referenceRect } from '../../experiment-dom';
import { leftSvg, rightSvg } from './cursor-icons';
import { cursorTarget, guidedCursorTarget, type CursorPoint } from './cursor-simulation';

type Environment = ReturnType<typeof createExperimentEnvironment>;
const colors = ['#3f76b5', '#c2661f', '#8670a2'];
const clamp = (n: number) => Math.max(0, Math.min(1, n));

/** Local decorative simulation, scoped to this experiment. No visitor transport. */
export const experiment = {
  mount(root: HTMLElement, env: Environment) {
    const doc = root.ownerDocument, abort = new AbortController();
    const owner = root.closest<HTMLElement>('[data-experiment-root]');
    const arabic = owner?.dataset.locale === 'ar';
    const wrap = doc.createElement('div'); wrap.className = 'lc'; wrap.dataset.cursorSimulation = 'local';
    const hint = doc.createElement('p'); hint.className = 'lc__hint'; hint.dir = arabic ? 'rtl' : 'ltr';
    hint.textContent = owner?.querySelector('[data-experiment-instructions]')?.textContent ?? 'Local cursor simulation. Move or tap to guide the pointers.';
    wrap.append(hint); root.append(wrap);
    const started = env.now();
    let smoothing = 18, size = 1, disposed = false;
    let input: (CursorPoint & { at: number }) | undefined;
    const pointers = colors.map((color, index) => {
      const element = doc.createElement('div'); element.className = 'lc__peer'; element.setAttribute('aria-hidden', 'true');
      const pointer = doc.createElement('span'); pointer.className = 'lc__ptr'; pointer.style.color = color; pointer.innerHTML = rightSvg;
      const name = doc.createElement('span'); name.className = 'lc__name'; name.style.background = color; name.textContent = `${arabic ? 'محاكاة' : 'Demo'} ${String(index + 1).padStart(2, '0')}`;
      element.append(pointer, name); wrap.append(element);
      return { ...cursorTarget(0, index), dir: 1, element, pointer };
    });
    const draw = (now: number, delta: number) => {
      if (disposed) return;
      const seconds = env.reduced ? 0 : Math.max(0, (now - started) / 1000);
      const focus = input ? { x: input.x, y: input.y, age: Math.max(0, (now - input.at) / 1000) } : undefined;
      const alpha = env.reduced ? 1 : 1 - Math.exp(-smoothing * Math.min(delta, 50) / 1000);
      pointers.forEach((pointer, index) => {
        const target = guidedCursorTarget(seconds, index, focus), dx = target.x - pointer.x;
        const direction = dx > .002 ? 1 : dx < -.002 ? -1 : pointer.dir;
        pointer.x += dx * alpha; pointer.y += (target.y - pointer.y) * alpha;
        setDesignStyle(pointer.element, 'transform', `translate3d(${pointer.x * wrap.clientWidth}px, ${pointer.y * wrap.clientHeight}px, 0) scale(${size})`);
        if (direction !== pointer.dir) { pointer.pointer.innerHTML = direction === 1 ? rightSvg : leftSvg; pointer.dir = direction; }
      });
    };
    const frame = (seconds: number, delta: number) => draw(seconds * 1000, delta);
    const guide = (event: PointerEvent) => {
      if (disposed) return;
      const rect = referenceRect(wrap);
      if (!rect.width || !rect.height) return;
      input = { x: clamp((env.clientX(event) - rect.left) / rect.width), y: clamp((env.clientY(event) - rect.top) / rect.height), at: env.now() };
      if (env.reduced) draw(env.now(), 0);
    };
    const leave = () => { input = undefined; if (env.reduced) draw(env.now(), 0); };
    wrap.addEventListener('pointermove', guide, { signal: abort.signal, passive: true });
    wrap.addEventListener('pointerdown', guide, { signal: abort.signal, passive: true });
    wrap.addEventListener('pointerleave', leave, { signal: abort.signal });
    wrap.addEventListener('pointercancel', leave, { signal: abort.signal });
    draw(started, 0);
    if (!env.reduced) env.clock.add(frame);
    return {
      set(key: string, value: unknown) {
        const number = Number(value); if (!Number.isFinite(number)) return;
        if (key === 'smoothing') smoothing = Math.max(4, Math.min(40, number));
        if (key === 'size') size = Math.max(.6, Math.min(1.8, number));
        if (env.reduced) draw(env.now(), 0);
      },
      destroy() { if (disposed) return; disposed = true; abort.abort(); env.clock.remove(frame); wrap.remove(); },
    };
  },
};
