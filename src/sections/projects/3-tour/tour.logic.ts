import { routeEntries, pageEntryPath } from '@/lib/navigation/route-entry';
import { uiStore } from '@/store/uiStore';
import { designScale, viewportDesign } from '@/lib/viewport-design';

type TourWindow = Window & {
  pano?: {
    getIsLoaded(): boolean;
    getIsTileLoading(): boolean;
    setLocked(locked: boolean): void;
    stopAutorotate(): void;
    startAutorotate(): void;
    setViewerSize(width: number, height: number): void;
    requestRedraw(): void;
  };
  tourNavigation?: { setInteractionEnabled(enabled: boolean): void; setPreloadEnabled(enabled: boolean): void };
  skin?: { divSkin: HTMLElement; updateSize(element: HTMLElement): void };
};

/** The page owns only controls. Pano2VR owns its iframe and render loop after intent. */
export function mountTour(root: HTMLElement) {
  const doc = root.ownerDocument, win = doc.defaultView!, abort = new AbortController();
  const launch = root.querySelector<HTMLButtonElement>('[data-tour-launch]')!, close = root.querySelector<HTMLButtonElement>('[data-tour-close]')!;
  const mount = root.querySelector<HTMLElement>('[data-tour-mount]')!, status = root.querySelector<HTMLElement>('[data-tour-status]')!;
  const enter = root.querySelector<HTMLElement>('[data-tour-enter]')!, retry = root.querySelector<HTMLElement>('[data-tour-retry]')!;
  const motion = win.matchMedia('(prefers-reduced-motion: reduce)');
  let iframe: HTMLIFrameElement | null = null, poll = 0, timeout = 0, disposed = false, ready = false, visible = true;
  let frameDocument: Document | null = null;
  let frameAbort: AbortController | null = null;
  const arrival = routeEntries(doc).register(root, pageEntryPath(root, 'projects'), { start() {}, assetsReady: () => true });
  arrival.ready(true); arrival.presented(); launch.disabled = false;
  const player = () => iframe?.contentWindow as TourWindow | null;
  const clearTimers = () => { win.clearInterval(poll); win.clearTimeout(timeout); poll = timeout = 0; };
  const fullscreen = () => Boolean(iframe && (doc.fullscreenElement === iframe || frameDocument?.fullscreenElement));
  const sizeControls = () => {
    const html = frameDocument?.documentElement;
    if (!html) return;
    const desktop = viewportDesign(win.innerWidth).key === 'desktop';
    html.style.setProperty('--tour-unit', `${designScale(win.innerWidth)}px`);
    html.style.setProperty('--tour-brand-width', desktop ? '72' : '48');
    html.style.setProperty('--tour-brand-inset', desktop ? '24' : '12');
    const skin = player()?.skin; if (skin) skin.updateSize(skin.divSkin);
  };
  const sync = () => {
    if (!ready || !iframe) return;
    const active = !doc.hidden && !uiStore.getState().menuOpen && (visible || fullscreen());
    const tour = player();
    tour?.tourNavigation?.setInteractionEnabled(active);
    // Keep neighbouring tile downloads behind explicit location navigation.
    tour?.tourNavigation?.setPreloadEnabled(false);
    tour?.pano?.setLocked(!active);
    if (!active || motion.matches || uiStore.getState().quietMode) tour?.pano?.stopAutorotate();
    else tour?.pano?.startAutorotate();
    root.toggleAttribute('data-tour-parked', !active);
    if (active) { if (!fullscreen()) tour?.pano?.setViewerSize(iframe.clientWidth, iframe.clientHeight); tour?.pano?.requestRedraw(); }
  };
  const onEscape = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    if ((event.key === 'Enter' || event.key === ' ') && target?.getAttribute('role') === 'button' && target.classList.contains('ggskin_svg')) { event.preventDefault(); target.click(); return; }
    if (event.key !== 'Escape' || fullscreen()) return;
    const notes = root.querySelector<HTMLDetailsElement>('details[open]');
    if (notes) { notes.open = false; notes.querySelector('summary')?.focus(); }
    else if (iframe) stop();
  };
  const removeViewer = () => {
    clearTimers(); ready = false;
    frameAbort?.abort(); frameAbort = null;
    frameDocument?.removeEventListener('keydown', onEscape);
    frameDocument?.removeEventListener('fullscreenchange', sync);
    frameDocument?.removeEventListener('webglcontextlost', fail, true);
    frameDocument = null;
    // Removing the browsing context releases the player, tile requests and GPU resources.
    iframe?.remove(); iframe = null; close.hidden = true;
    delete root.dataset.tourParked;
  };
  function stop() {
    removeViewer(); delete root.dataset.tourState; status.textContent = '';
    enter.hidden = false; retry.hidden = true; launch.disabled = false; launch.focus({ preventScroll: true });
  }
  const fail = (event?: Event) => {
    if (disposed) return;
    event?.preventDefault();
    removeViewer(); root.dataset.tourState = 'failed'; status.textContent = root.dataset.tourFailed!;
    enter.hidden = true; retry.hidden = false; launch.disabled = false;
  };
  const checkReady = () => {
    if (disposed || !iframe) return;
    try {
      const pano = player()?.pano;
      if (!pano?.getIsLoaded() || pano.getIsTileLoading()) return;
      clearTimers(); ready = true; root.dataset.tourState = 'live'; status.textContent = '';
      frameDocument = iframe.contentDocument;
      const labels: string[] = JSON.parse(root.dataset.tourControls ?? '[]');
      frameDocument?.querySelectorAll<HTMLElement>('.ggskin_container > .ggskin_svg').forEach((control, index) => {
        control.setAttribute('role', 'button'); control.tabIndex = 0;
        if (labels[index]) control.setAttribute('aria-label', labels[index]);
      });
      sizeControls();
      frameDocument?.addEventListener('keydown', onEscape);
      frameDocument?.addEventListener('fullscreenchange', sync);
      frameDocument?.addEventListener('webglcontextlost', fail, true);
      sync(); iframe.focus({ preventScroll: true });
    } catch { fail(); }
  };
  const start = () => {
    if (disposed || iframe) return;
    root.dataset.tourState = 'loading'; launch.disabled = true; status.textContent = root.dataset.tourLoading!;
    close.hidden = false;
    iframe = doc.createElement('iframe'); iframe.title = root.querySelector('h1')!.textContent!;
    iframe.allow = 'fullscreen; xr-spatial-tracking'; iframe.allowFullscreen = true;
    iframe.setAttribute('aria-describedby', 'tour-instructions');
    frameAbort = new AbortController();
    iframe.addEventListener('load', checkReady, { signal: frameAbort.signal });
    iframe.addEventListener('error', fail, { signal: frameAbort.signal });
    iframe.src = root.dataset.tourSrc!; mount.append(iframe);
    poll = win.setInterval(checkReady, 250); timeout = win.setTimeout(fail, 45000);
  };
  launch.addEventListener('click', start, { signal: abort.signal });
  close.addEventListener('click', stop, { signal: abort.signal });
  root.addEventListener('keydown', onEscape, { signal: abort.signal });
  doc.addEventListener('visibilitychange', sync, { signal: abort.signal });
  doc.addEventListener('fullscreenchange', sync, { signal: abort.signal });
  win.addEventListener('resize', sizeControls, { signal: abort.signal });
  motion.addEventListener('change', sync, { signal: abort.signal });
  const unsubscribe = uiStore.subscribe(sync);
  const observer = new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); sync(); }); observer.observe(root);
  return () => {
    disposed = true; abort.abort(); unsubscribe(); observer.disconnect(); arrival.dispose(); removeViewer();
    launch.disabled = true; enter.hidden = false; retry.hidden = true; status.textContent = ''; delete root.dataset.tourState;
  };
}
