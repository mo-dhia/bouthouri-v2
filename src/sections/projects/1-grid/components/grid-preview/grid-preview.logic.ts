type Options = { enabled: () => boolean };

/** A single intent-owned decoder. No media src is assigned before interest;
 * visibility suspension retains the frame/time, while leaving resets it. */
export function createGridPreview(root: HTMLElement, options: Options) {
  const doc = root.ownerDocument, win = doc.defaultView!, abort = new AbortController();
  let disposed = false, suspended = false, generation = 0, interestTimer = 0, stopTimer = 0;
  let video: HTMLVideoElement | null = null, current: HTMLAnchorElement | null = null, candidate: HTMLAnchorElement | null = null;
  const enabled = () => !disposed && !suspended && options.enabled();
  const cancelInterest = () => { win.clearTimeout(interestTimer); interestTimer = 0; candidate = null; };
  const clear = (immediate = false) => {
    cancelInterest(); generation++; current = null;
    win.clearTimeout(stopTimer); stopTimer = 0;
    if (!video) return;
    video.hidden = true;
    const owned = video;
    const pause = () => { stopTimer = 0; if (!current) { owned.pause(); try { owned.currentTime = 0; } catch {} } };
    if (immediate) pause(); else stopTimer = win.setTimeout(pause, 200);
  };
  const play = (item: HTMLAnchorElement) => {
    if (!enabled() || !item.isConnected || !item.dataset.reel) return;
    const ownedGeneration = ++generation;
    if (!video) {
      video = doc.createElement('video'); video.muted = true; video.loop = true; video.playsInline = true; video.preload = 'none'; video.hidden = true;
      video.dataset.gridReel = 'true'; video.setAttribute('aria-hidden', 'true');
      video.addEventListener('playing', () => { if (video && current?.contains(video) && enabled()) video.hidden = false; else video?.pause(); }, { signal: abort.signal });
    }
    win.clearTimeout(stopTimer); stopTimer = 0;
    video.hidden = true; video.pause(); try { video.currentTime = 0; } catch {}
    current = item; item.querySelector('[data-grid-media]')!.append(video);
    if (video.getAttribute('src') !== item.dataset.reel) video.src = item.dataset.reel;
    video.style.transform = item.querySelector<HTMLImageElement>('img')!.style.transform;
    void video.play().catch(() => { if (!disposed && generation === ownedGeneration && video) video.hidden = true; });
  };
  const choose = (item: HTMLAnchorElement | null, delay = 220) => {
    if (item && (current === item || candidate === item && interestTimer)) return;
    clear();
    if (!item || !enabled()) return;
    candidate = item;
    interestTimer = win.setTimeout(() => { interestTimer = 0; candidate = null; play(item); }, delay);
  };
  return {
    get current() { return current; }, get element() { return video; }, get pending() { return !!interestTimer; },
    choose, clear,
    suspend() { suspended = true; cancelInterest(); video?.pause(); },
    resume(hovered: HTMLAnchorElement | null) {
      suspended = false;
      if (!enabled()) { clear(true); return; }
      if (current && video) {
        const ownedGeneration = generation;
        void video.play().catch(() => { if (!disposed && generation === ownedGeneration && video) video.hidden = true; });
      } else if (hovered) choose(hovered);
    },
    dispose() {
      if (disposed) return;
      disposed = true; generation++; abort.abort(); cancelInterest(); win.clearTimeout(stopTimer); stopTimer = 0;
      if (video) { video.pause(); video.removeAttribute('src'); video.load(); video.remove(); }
      video = null; current = null;
    },
  };
}
