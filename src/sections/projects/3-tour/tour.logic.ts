import { routeEntries, pageEntryPath } from '@/lib/navigation/route-entry';
import { uiStore } from '@/store/uiStore';
import { designScale, viewportDesign } from '@/lib/viewport-design';

type TourWindow = Window & {
  pano?: {
    setLocked(locked: boolean): void;
    stopAutorotate(): void;
    startAutorotate(): void;
    setViewerSize(width: number, height: number): void;
    requestRedraw(): void;
    changePan(degrees: number): void;
    changeTilt(degrees: number): void;
    addListener(event: string, listener: () => void): void;
    removeEventListener(event: string, listener: () => void): void;
  };
  tourLifecycle?: { setSuspended(value: boolean): void; getLoadState(): 'loading' | 'ready' | 'failed' };
  tourNavigation?: { setInteractionEnabled(enabled: boolean): void; setPreloadEnabled(enabled: boolean): void };
  skin?: { divSkin: HTMLElement; updateSize(element: HTMLElement): void };
};

/** Controls and route ownership stay in the host; the isolated player owns rendering. */
export function mountTour(root: HTMLElement) {
  const doc = root.ownerDocument, win = doc.defaultView!, abort = new AbortController();
  const launch = root.querySelector<HTMLButtonElement>('[data-tour-launch]')!, close = root.querySelector<HTMLButtonElement>('[data-tour-close]')!;
  const mount = root.querySelector<HTMLElement>('[data-tour-mount]')!, status = root.querySelector<HTMLElement>('[data-tour-status]')!;
  const enter = root.querySelector<HTMLElement>('[data-tour-enter]')!, retry = root.querySelector<HTMLElement>('[data-tour-retry]')!, enterLabel = enter.textContent;
  const motion = win.matchMedia('(prefers-reduced-motion: reduce)');
  let iframe: HTMLIFrameElement | null = null, poll = 0, timeout = 0, disposed = false, ready = false, visible = true;
  let frameDocument: Document | null = null, frameAbort: AbortController | null = null;
  let removePlayerListeners: (() => void) | undefined;
  let remainingLoadTime = 45000, deadlineStarted = 0;
  const arrival = routeEntries(doc).register(root, pageEntryPath(root, 'projects'), { start() {}, assetsReady: () => true });
  arrival.ready(true); arrival.presented(); launch.disabled = false;
  const player = () => iframe?.contentWindow as TourWindow | null;
  const clearTimers = () => { win.clearInterval(poll); win.clearTimeout(timeout); poll = timeout = 0; };
  const fullscreen = () => Boolean(iframe && (doc.fullscreenElement === iframe || frameDocument?.fullscreenElement));
  const watchLoading = (active: boolean) => {
    if (ready || !iframe) return;
    if (!active) {
      win.clearInterval(poll); poll = 0;
      if (timeout) { remainingLoadTime = Math.max(0, remainingLoadTime - (win.performance.now() - deadlineStarted)); win.clearTimeout(timeout); timeout = 0; }
      return;
    }
    if (!poll) poll = win.setInterval(checkReady, 250);
    if (!timeout) { deadlineStarted = win.performance.now(); timeout = win.setTimeout(fail, remainingLoadTime); }
  };
  const sizeControls = () => {
    const html = frameDocument?.documentElement;
    if (!html) return;
    const desktop = viewportDesign(win.innerWidth).key === 'desktop';
    html.style.setProperty('--tour-unit', `${designScale(win.innerWidth)}px`);
    html.style.setProperty('--tour-brand-width', desktop ? '72' : '48');
    html.style.setProperty('--tour-brand-inset', desktop ? '24' : '12');
    const skin = player()?.skin; if (skin) skin.updateSize(skin.divSkin);
    const controls = frameDocument?.querySelector<HTMLElement>('.ggskin_container');
    if (controls && frameDocument?.defaultView) {
      controls.style.translate = '';
      const buttons = [...controls.children].filter(element => frameDocument!.defaultView!.getComputedStyle(element).visibility !== 'hidden');
      const bottom = Math.max(0, ...buttons.map(element => element.getBoundingClientRect().bottom));
      const overflow = Math.max(0, bottom + 12 * designScale(win.innerWidth) - frameDocument.defaultView.innerHeight);
      if (overflow) controls.style.translate = `0 ${-overflow}px`;
    }
  };
  const sync = () => {
    if (!iframe) return;
    const active = !doc.hidden && !uiStore.getState().menuOpen && (visible || fullscreen());
    watchLoading(active);
    const tour = player();
    if (!tour?.pano || !tour.tourLifecycle) return;
    tour.tourLifecycle.setSuspended(!active);
    tour.tourNavigation?.setInteractionEnabled(active && ready);
    tour.tourNavigation?.setPreloadEnabled(false);
    tour.pano.setLocked(!active || !ready);
    if (!active || !ready || motion.matches || uiStore.getState().quietMode) tour.pano.stopAutorotate();
    else tour.pano.startAutorotate();
    root.toggleAttribute('data-tour-parked', !active);
    mount.inert = !active || !ready;
    if (mount.inert) mount.setAttribute('aria-hidden', 'true'); else mount.removeAttribute('aria-hidden');
    if (active) { if (!fullscreen()) tour.pano.setViewerSize(iframe.clientWidth, iframe.clientHeight); tour.pano.requestRedraw(); }
  };
  const onEscape = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || fullscreen()) return;
    const notes = root.querySelector<HTMLDetailsElement>('details[open]');
    if (notes) { notes.open = false; notes.querySelector('summary')?.focus(); }
    else if (iframe) stop();
  };
  const onFrameKey = (event: KeyboardEvent) => {
    const target = event.target as Element | null;
    const control = target?.closest?.<HTMLElement>('button, a[href], [role="button"]');
    const activation = event.key === 'Enter' || event.key === ' ';
    // Pano2VR cancels keyup and fullscreen keydown defaults. Preserve browser
    // focus and native activation before its handlers; keep panorama arrows.
    if (event.key === 'Tab' || activation && control) {
      event.stopImmediatePropagation();
      if (activation && control?.classList.contains('ggskin_svg')) {
        event.preventDefault();
        if (event.type === 'keydown' && !event.repeat) control.click();
      }
      return;
    }
    // This player records arrow keys but never applies them to its camera.
    // Finite steps, including native repeats, make return locations reachable.
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault(); event.stopImmediatePropagation();
      const pano = player()?.pano;
      if (event.type === 'keydown' && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) pano?.changePan(event.key === 'ArrowLeft' ? 5 : -5);
      if (event.type === 'keydown' && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) pano?.changeTilt(event.key === 'ArrowUp' ? 5 : -5);
      return;
    }
    if (event.type === 'keydown') onEscape(event);
  };
  const removeViewer = () => {
    clearTimers(); ready = false;
    frameAbort?.abort(); frameAbort = null;
    removePlayerListeners?.(); removePlayerListeners = undefined;
    frameDocument?.removeEventListener('keydown', onFrameKey, true);
    frameDocument?.removeEventListener('keyup', onFrameKey, true);
    frameDocument?.removeEventListener('fullscreenchange', sync);
    frameDocument?.removeEventListener('webglcontextlost', fail, true);
    frameDocument = null;
    iframe?.remove(); iframe = null; close.hidden = true;
    mount.inert = true; mount.setAttribute('aria-hidden', 'true');
    delete root.dataset.tourParked; delete root.dataset.tourPresented;
  };
  function stop() {
    removeViewer(); delete root.dataset.tourState; status.textContent = '';
    enter.textContent = enterLabel; enter.hidden = false; retry.hidden = true; launch.disabled = false; launch.focus({ preventScroll: true });
  }
  function fail(event?: Event) {
    if (disposed) return;
    event?.preventDefault();
    removeViewer(); root.dataset.tourState = 'failed'; status.textContent = root.dataset.tourFailed!;
    enter.hidden = true; retry.hidden = false; launch.disabled = false;
  }
  function beginLoading() {
    if (root.dataset.tourState !== 'loading') { clearTimers(); remainingLoadTime = 45000; }
    ready = false; root.dataset.tourState = 'loading'; status.textContent = root.dataset.tourLoading!;
    enter.textContent = root.dataset.tourLoading!; launch.disabled = true;
    if (iframe) iframe.tabIndex = -1;
    mount.inert = true; mount.setAttribute('aria-hidden', 'true');
    sync();
  }
  function bindFrame(tour: TourWindow) {
    if (frameDocument || !iframe) return;
    frameDocument = iframe.contentDocument;
    if (frameDocument?.documentElement) frameDocument.documentElement.lang = root.dataset.locale ?? doc.documentElement.lang;
    const labels: string[] = JSON.parse(root.dataset.tourControls ?? '[]');
    frameDocument?.querySelectorAll<HTMLElement>('.ggskin_container > .ggskin_svg').forEach((control, index) => {
      control.setAttribute('role', 'button'); control.tabIndex = 0;
      if (labels[index]) control.setAttribute('aria-label', labels[index]);
    });
    sizeControls();
    frameDocument?.addEventListener('keydown', onFrameKey, true);
    frameDocument?.addEventListener('keyup', onFrameKey, true);
    frameDocument?.addEventListener('fullscreenchange', sync);
    frameDocument?.addEventListener('webglcontextlost', fail, true);
    const listeners: [string, () => void][] = [['beforechangenode', beginLoading], ['changenode', sync], ['configloaded', sync], ['sizechanged', sizeControls], ['tourloaderror', () => fail()]];
    for (const [event, listener] of listeners) tour.pano!.addListener(event, listener);
    removePlayerListeners = () => { for (const [event, listener] of listeners) tour.pano?.removeEventListener(event, listener); };
    sync();
  }
  function checkReady() {
    if (disposed || !iframe) return;
    try {
      const tour = player();
      if (!tour?.pano || !tour.tourLifecycle) return;
      bindFrame(tour);
      const state = tour.tourLifecycle.getLoadState();
      if (state === 'failed') { fail(); return; }
      if (state !== 'ready') return;
      clearTimers(); ready = true; root.dataset.tourState = 'live'; root.dataset.tourPresented = 'true'; status.textContent = '';
      iframe.tabIndex = 0; sync();
      if (!mount.inert) iframe.focus({ preventScroll: true });
    } catch { fail(); }
  }
  const start = () => {
    if (disposed || iframe) return;
    close.hidden = false;
    iframe = doc.createElement('iframe'); iframe.title = root.querySelector('h1')!.textContent!;
    iframe.allow = 'fullscreen; xr-spatial-tracking'; iframe.allowFullscreen = true; iframe.tabIndex = -1;
    iframe.setAttribute('aria-describedby', 'tour-instructions');
    frameAbort = new AbortController();
    iframe.addEventListener('load', checkReady, { signal: frameAbort.signal });
    iframe.addEventListener('error', fail, { signal: frameAbort.signal });
    iframe.src = root.dataset.tourSrc!; mount.append(iframe); beginLoading();
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
    launch.disabled = true; enter.textContent = enterLabel; enter.hidden = false; retry.hidden = true; status.textContent = ''; delete root.dataset.tourState;
  };
}
