import { uiStore } from '@/store/uiStore';
import { routeEntries, pageEntryPath } from '@/lib/navigation/route-entry';
import { createExperimentEnvironment } from './experiment-environment';
import { experimentLayout } from './experiment-layout';

type Environment = ReturnType<typeof createExperimentEnvironment>;
type Handle = { destroy(): void; set?(key: string, value: unknown): void; pause?(): void };
type Module = { experiment: { mount(root: HTMLElement, env: Environment): Handle | (() => void) } };
const loaders: Record<string, () => Promise<Module>> = {
  'live-cursors': () => import('./components/live-cursors/live-cursors.logic'),
  heart: () => import('./components/heart/heart.logic'),
  'polka-dots': () => import('./components/polka-dots/polka-dots.logic'),
  dial: () => import('./components/dial/dial.logic'),
  'dynamic-scrollbar': () => import('./components/dynamic-scrollbar/dynamic-scrollbar.logic'),
  'rotating-gallery': () => import('./components/rotating-gallery/rotating-gallery.logic'),
  'paste-up': () => import('./components/paste-up/paste-up.logic'),
  'threejs-test': () => import('./components/threejs-test/threejs-test.logic'),
  'vocal-orb': () => import('./components/vocal-orb/vocal-orb.logic'),
};

/** Connected page owner; each selected renderer remains a separate chunk. */
export function mountExperiment(root: HTMLElement) {
  const doc = root.ownerDocument, win = doc.defaultView!, slug = root.dataset.experiment!;
  const camera = root.querySelector<HTMLElement>('[data-experiment-camera]')!;
  const abort = new AbortController(), query = win.matchMedia('(prefers-reduced-motion: reduce)');
  const originalStyle = camera.getAttribute('style');
  const fields = [...root.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-config-key]')];
  const initial = fields.map(field => field.value);
  let disposed = false, generation = 0, environment: Environment | null = null, handle: Handle | null = null;
  let reduced = query.matches || uiStore.getState().quietMode, profile = experimentLayout(win.innerWidth).design.key;
  let visible = true, resizeTimer = 0, prepared = false, announced = false, destroying = false;
  const announce = () => { if (!announced) { announced = true; root.dispatchEvent(new Event('experiment-ready')); } };
  const arrival = routeEntries(doc).register(root, pageEntryPath(root, 'projects'), {
    start() { root.dataset.experimentEntry = 'complete'; },
    finish() { root.dataset.experimentEntry = 'complete'; },
    assetsReady: () => prepared,
  });
  const disposeRenderer = () => {
    const owned = handle; handle = null;
    destroying = true;
    try { owned?.destroy(); } finally { environment?.dispose(); environment = null; camera.replaceChildren(); destroying = false; }
  };
  const fail = (error?: unknown) => {
    if (disposed || !root.isConnected) return;
    if (process.env.NODE_ENV === 'development' && error) console.error(`[projects] ${slug}: ${error instanceof Error ? `${error.message}\n${error.stack}` : String(error)}`);
    generation++;
    try { disposeRenderer(); } catch { /* Context failure must leave the poster. */ }
    delete root.dataset.experimentLive; root.dataset.experimentFailed = 'true';
    root.querySelector<HTMLFieldSetElement>('[data-config-controls]')!.disabled = true;
    root.querySelector<HTMLButtonElement>('[data-config-reset]')!.disabled = true;
    const status = root.querySelector<HTMLElement>('[data-experiment-status]');
    if (status) status.textContent = root.dataset.locale === 'ar' ? 'تعذّر تشغيل الرسم التفاعلي. يبقى العرض والملاحظات والتنقّل متاحًا.' : 'Interactive graphics are unavailable. The preview, notes and navigation remain available.';
    routeEntries(doc).fallback(root, pageEntryPath(root, 'projects')); announce();
  };
  const values = () => {
    const result: Record<string, unknown> = {};
    fields.forEach(field => {
      const key = field.dataset.configKey!, value = field instanceof HTMLInputElement && field.type === 'range' ? Number(field.value) : field.value;
      if (field.dataset.configPart) {
        const object = (result[key] ??= {}) as Record<string, unknown>;
        object[field.dataset.configPart] = value;
      }
      else if (field.dataset.configIndex) { const list = (result[key] ??= []) as unknown[]; list[Number(field.dataset.configIndex)] = value; }
      else result[key] = value;
    });
    return result;
  };
  const apply = () => {
    Object.entries(values()).forEach(([key, value]) => handle?.set?.(key, value));
    fields.forEach(field => { const output = field.parentElement?.querySelector('output'); if (output) output.value = field.value; });
  };
  const sync = () => {
    const nextReduced = query.matches || uiStore.getState().quietMode;
    if (nextReduced !== reduced) { reduced = nextReduced; boot(); return; }
    const paused = doc.hidden || !visible || uiStore.getState().menuOpen;
    environment?.pause(paused); if (paused) handle?.pause?.();
  };
  function boot() {
    const token = ++generation; prepared = false; delete root.dataset.experimentLive; delete root.dataset.experimentFailed;
    try { disposeRenderer(); } catch { /* A failed context cannot block a fresh owner. */ }
    const load = loaders[slug];
    if (!load) { fail(); return; }
    void load().then(module => {
      if (disposed || token !== generation || !root.isConnected) return;
      const env = createExperimentEnvironment(camera, reduced, error => { if (!disposed && token === generation) fail(error); }); environment = env;
      let instance: Handle | (() => void);
      try { instance = module.experiment.mount(camera, env); }
      catch (error) { fail(error); return; }
      if (disposed || token !== generation || !root.isConnected) { if (typeof instance === 'function') instance(); else instance.destroy(); env.dispose(); return; }
      if (typeof instance === 'function') { instance(); fail(); return; }
      handle = instance;
      apply(); sync();
      const firstPaint = () => {
        if (disposed || token !== generation || !root.isConnected) return;
        if (slug === 'threejs-test' && !camera.querySelector('.tj[data-ready]')) { env.clock.request(firstPaint); return; }
        prepared = true; root.dataset.experimentLive = 'true';
        root.querySelector<HTMLFieldSetElement>('[data-config-controls]')!.disabled = false;
        root.querySelector<HTMLButtonElement>('[data-config-reset]')!.disabled = false;
        arrival.ready(reduced); arrival.presented(); announce();
      };
      env.clock.request(firstPaint);
    }).catch(error => { if (!disposed && token === generation) fail(error); });
  }
  fields.forEach(field => field.addEventListener(field.tagName === 'SELECT' ? 'change' : 'input', apply, { signal: abort.signal }));
  root.querySelector('[data-config-reset]')?.addEventListener('click', () => { fields.forEach((field, i) => { field.value = initial[i]; }); apply(); }, { signal: abort.signal });
  root.addEventListener('keydown', event => { if (event.key === 'Escape') root.querySelectorAll<HTMLDetailsElement>('details[open]').forEach(details => { details.open = false; details.querySelector<HTMLElement>('summary')?.focus({ preventScroll: true }); }); }, { signal: abort.signal });
  const contextLost = (event: Event) => { if (!destroying && event.target instanceof Node && camera.contains(event.target)) { event.preventDefault(); fail(); } };
  root.addEventListener('webglcontextlost', contextLost, { capture: true, signal: abort.signal });
  root.addEventListener('contextlost', contextLost, { capture: true, signal: abort.signal });
  doc.addEventListener('visibilitychange', sync, { signal: abort.signal });
  query.addEventListener('change', sync, { signal: abort.signal });
  const unsubscribe = uiStore.subscribe(sync);
  const observer = new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); sync(); }); observer.observe(root);
  win.addEventListener('resize', () => {
    win.clearTimeout(resizeTimer); resizeTimer = win.setTimeout(() => {
      resizeTimer = 0; const next = experimentLayout(win.innerWidth).design.key;
      if (next !== profile) { profile = next; boot(); } else environment?.resize();
    }, 150);
  }, { signal: abort.signal });
  arrival.ready(reduced); boot();
  return () => {
    disposed = true; generation++; abort.abort(); unsubscribe(); observer.disconnect(); win.clearTimeout(resizeTimer); arrival.dispose();
    try { disposeRenderer(); } catch { /* Other owners still receive cleanup. */ }
    if (originalStyle === null) camera.removeAttribute('style'); else camera.setAttribute('style', originalStyle);
    delete camera.dataset.experimentScale; delete root.dataset.experimentLive; delete root.dataset.experimentFailed; delete root.dataset.experimentEntry;
  };
}
