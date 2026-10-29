import type { createExperimentClock } from './experiment-clock';

type Clock = ReturnType<typeof createExperimentClock>;
type Target = Element | Record<string, unknown>;
type Handle = { kill(): void; targets(): Target[] };
type Vars = Record<string, unknown> & { duration?: number; delay?: number; ease?: string | ((p: number) => number); overwrite?: unknown; onUpdate?: (this: Handle) => void; onComplete?: () => void; stagger?: number | { each: number; grid: number[]; from: string }; repeat?: number; yoyo?: boolean };

/** The finite source curves used by these experiments; no animation library. */
export function experimentEase(name: Vars['ease'] = 'power2.out') {
  if (typeof name === 'function') return name;
  if (name === 'none' || name === 'linear') return (p: number) => p;
  if (name.startsWith('elastic.out')) {
    const [a = 1, period = .3] = name.match(/\(([^)]+)\)/)?.[1].split(',').map(Number) ?? [];
    const amplitude = Math.max(1, a), shift = Math.asin(1 / amplitude) * period / (2 * Math.PI);
    return (p: number) => p === 0 || p === 1 ? p : amplitude * 2 ** (-10 * p) * Math.sin((p - shift) * 2 * Math.PI / period) + 1;
  }
  const out = (p: number) => {
    if (name.startsWith('expo')) return p === 1 ? 1 : 1 - 2 ** (-10 * p);
    if (name.startsWith('sine')) return Math.sin(p * Math.PI / 2);
    if (name.startsWith('back')) { const s = Number(name.match(/\(([\d.]+)/)?.[1] ?? 1.70158); return 1 + (s + 1) * (p - 1) ** 3 + s * (p - 1) ** 2; }
    return 1 - (1 - p) ** (Number(name.match(/power(\d)/)?.[1] ?? 2) + 1);
  };
  if (name.includes('inOut')) return (p: number) => p < .5 ? (1 - out(1 - p * 2)) / 2 : (1 + out(p * 2 - 1)) / 2;
  if (name.endsWith('.in')) return (p: number) => 1 - out(1 - p);
  return out;
}

export function cubicEase(points: number[]) {
  return (p: number) => {
    let lo = 0, hi = 1, t = p;
    const at = (v: number, a: number, b: number) => 3 * (1 - v) ** 2 * v * a + 3 * (1 - v) * v * v * b + v ** 3;
    for (let i = 0; i < 18; i++) { t = (lo + hi) / 2; if (at(t, points[0], points[2]) < p) lo = t; else hi = t; }
    return at(t, points[1], points[3]);
  };
}

const controls = new Set(['duration', 'delay', 'ease', 'overwrite', 'onUpdate', 'onComplete', 'stagger', 'repeat', 'yoyo', 'clearProps']);
const numbers = /-?(?:\d*\.)?\d+(?:e[+-]?\d+)?/gi;
function blend(a: unknown, b: unknown, progress: number): unknown {
  if (typeof b === 'number') return Number(a ?? 0) + (b - Number(a ?? 0)) * progress;
  const to = String(b), from = String(a ?? '');
  const av = from.match(numbers)?.map(Number) ?? [], bv = to.match(numbers)?.map(Number) ?? [];
  if (!bv.length) return progress === 1 ? b : a;
  let i = 0;
  return to.replace(numbers, () => { const n = i++; return String((av[n] ?? 0) + (bv[n] - (av[n] ?? 0)) * progress); });
}

export function createExperimentMotion(clock: Clock, win: Window, css: (value: string) => string) {
  const tracks = new Set<{ target: Target; handle: Handle; run: (time: number) => boolean }>();
  const poses = new WeakMap<Element, Record<string, unknown>>();
  const element = (target: Target): target is HTMLElement => 'nodeType' in target;
  const write = (target: Target, key: string, value: unknown) => {
    if (!element(target)) { (target as Record<string, unknown>)[key] = value; return; }
    if (['x', 'y', 'scale', 'scaleX', 'scaleY', 'rotate', 'rotation'].includes(key)) {
      const pose = poses.get(target) ?? { x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 1, rotate: 0 }; poses.set(target, pose);
      pose[key === 'rotation' ? 'rotate' : key] = value;
      const length = (v: unknown) => typeof v === 'number' ? `${v}px` : String(v);
      target.style.transform = css(`translate(${length(pose.x)}, ${length(pose.y)}) rotate(${pose.rotate}deg) scale(${Number(pose.scale) * Number(pose.scaleX)}, ${Number(pose.scale) * Number(pose.scaleY)})`);
    } else target.style.setProperty(key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`), css(String(value)));
  };
  const read = (target: Target, key: string) => {
    if (!element(target)) return (target as Record<string, unknown>)[key] ?? 0;
    if (['x', 'y', 'scale', 'scaleX', 'scaleY', 'rotate', 'rotation'].includes(key)) return poses.get(target)?.[key === 'rotation' ? 'rotate' : key] ?? (key.startsWith('scale') ? 1 : 0);
    const property = key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
    let value = target.style.getPropertyValue(property) || win.getComputedStyle(target).getPropertyValue(property);
    if (key === 'opacity') return Number(value || 1);
    if (/color/i.test(key) && /^#/.test(value)) value = color(value);
    return value;
  };
  function color(value: string) {
    const hex = value.slice(1), n = parseInt(hex.length === 3 ? [...hex].map(x => x + x).join('') : hex, 16);
    return `rgb(${n >> 16 & 255},${n >> 8 & 255},${n & 255})`;
  }
  const all = (target: Target | Target[]) => Array.isArray(target) ? target : [target];
  const cancel = (target: Target | Target[]) => { const targets = all(target); [...tracks].filter(t => targets.includes(t.target)).forEach(t => t.handle.kill()); };
  const frame = (seconds: number) => { [...tracks].forEach(track => { if (track.run(seconds * 1000)) tracks.delete(track); }); if (!tracks.size) clock.remove(frame); };
  const set = (target: Target | Target[], vars: Vars) => all(target).forEach(t => Object.entries(vars).forEach(([key, value]) => { if (controls.has(key)) return; if (key === 'attr' && element(t)) Object.entries(value as Record<string, string>).forEach(([name, v]) => t.setAttribute(name, String(v))); else write(t, key, value); }));
  const tween = (target: Target | Target[], vars: Vars): Handle => {
    const targets = all(target), owned: typeof tracks extends Set<infer T> ? T[] : never = [];
    if (vars.overwrite) cancel(target);
    const handle: Handle = { kill() { owned.forEach(t => tracks.delete(t)); if (!tracks.size) clock.remove(frame); }, targets: () => targets };
    const ease = experimentEase(vars.ease), stagger = typeof vars.stagger === 'number' ? vars.stagger : vars.stagger?.each ?? 0;
    targets.forEach((t, index) => {
      const grid = typeof vars.stagger === 'object' ? vars.stagger.grid : undefined;
      const distance = grid ? Math.hypot(index % grid[1] - (grid[1] - 1) / 2, Math.floor(index / grid[1]) - (grid[0] - 1) / 2) : index;
      const start = clock.now() + ((vars.delay ?? 0) + distance * stagger) * 1000, duration = (vars.duration ?? .5) * 1000;
      if (element(t) && vars.transformOrigin) write(t, 'transformOrigin', vars.transformOrigin);
      const props = Object.entries(vars).filter(([key]) => !controls.has(key) && key !== 'transformOrigin').map(([key, destination]) => {
        if (key === 'attr') return { key, destination, from: element(t) ? Object.fromEntries(Object.keys(destination as object).map(name => [name, Number(t.getAttribute(name))])) : {} };
        const to = /color/i.test(key) && String(destination).startsWith('#') ? color(String(destination)) : destination;
        return { key, destination: to, from: read(t, key) };
      });
      const track = { target: t, handle, run(time: number) {
        if (time < start) return false;
        const raw = duration ? Math.max(0, (time - start) / duration) : 1;
        const count = (vars.repeat ?? 0) + 1, complete = vars.repeat !== -1 && raw >= count;
        const cycle = complete ? count - 1 : Math.floor(raw), p = complete ? 1 : raw % 1, progress = ease(vars.yoyo && cycle % 2 ? 1 - p : p);
        props.forEach(({ key, destination, from }) => {
          if (key === 'attr' && element(t)) Object.entries(destination as Record<string, unknown>).forEach(([name, to]) => t.setAttribute(name, String(blend((from as Record<string, unknown>)[name], Number(to), progress))));
          else write(t, key, blend(from, destination, progress));
        });
        vars.onUpdate?.call(handle);
        if (vars.repeat !== -1 && raw >= (vars.repeat ?? 0) + 1) { if (element(t) && vars.clearProps) String(vars.clearProps).split(',').forEach(key => t.style.removeProperty(key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`))); if (index === targets.length - 1) vars.onComplete?.(); return true; }
        return false;
      } };
      tracks.add(track); owned.push(track);
    });
    clock.add(frame); return handle;
  };
  return { tween, set, cancel,
    fromTo(target: Target | Target[], from: Vars, to: Vars) { set(target, from); return tween(target, to); },
    from(target: Target | Target[], vars: Vars) {
      const originals = all(target).map(t => Object.fromEntries(Object.keys(vars).filter(k => !controls.has(k)).map(k => [k, read(t, k)])));
      set(target, vars); const handles = all(target).map((t, i) => tween(t, { ...vars, ...originals[i] }));
      return { kill: () => handles.forEach(h => h.kill()), targets: () => all(target) };
    },
    dispose() { [...tracks].forEach(t => t.handle.kill()); },
  };
}
