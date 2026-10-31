import scrollManager from '@/lib/scrollInteraction/scrollManager';
import { pixelsToVw, referenceStage } from '@/lib/viewport-design';
import { pageEntryPath, routeEntries, skipPageEntry } from '@/lib/navigation/route-entry';
import { uiStore } from '@/store/uiStore';
import { createMaskedReveal, type MaskedReveal } from '@/sections/vision/masked-reveal';
import { range } from '@/sections/vision/2-perspective/system-geometry';
import { anchoredProgress, caseReading, coneTransform, financePath, storyReveal } from './case-geometry';

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
/** Artefact's mark drifts sideways, The Forecasting Machine's breathes vertically; the others rest on the pointer. */
const SWAY: Record<string, { x: number; y: number }> = { artefact: { x: 2, y: 0 }, forecasting: { x: 0, y: 1.5 } };

type Reveal = { element: HTMLElement; reveal: MaskedReveal; top: number; height: number };
type Box = { element: HTMLElement | SVGElement; top: number; height: number };

/** One demand RAF presents the original's hero entry, mark depth, story reveals, drawings and concept progression. */
export function mountCase(root: HTMLElement) {
  const hero = root.querySelector<HTMLElement>('[data-route-hero]')!, story = root.querySelector<HTMLElement>('.case-story-system')!;
  const markPath = hero.querySelector<SVGPathElement>('[data-case-mark-path]'), tail = hero.querySelector<SVGPathElement>('.case-mark-tail'), depth = hero.querySelector<HTMLElement>('.case-mark-depth');
  const sway = SWAY[[...hero.classList].find(name => name.startsWith('case-identity-'))?.slice(14) ?? ''] ?? { x: 0, y: 0 };
  const progression = story.querySelector<HTMLElement>('.case-progression'), steps = [...story.querySelectorAll<HTMLElement>('[data-reading-step]')];
  const links = [...story.querySelectorAll<HTMLAnchorElement>('[data-reading-link]')], route = story.querySelector<SVGPathElement>('[data-concept-route]'), cursor = story.querySelector<SVGPathElement>('[data-route-cursor]');
  const finance = story.querySelector<SVGPathElement>('[data-concept-finance]'), financeLabels = [...story.querySelectorAll<HTMLElement>('[data-finance-label]')], parts = [...story.querySelectorAll<SVGPathElement>('[data-concept-part]')];
  const turn = Number(cursor?.dataset.cursorTurn ?? 0), nav = root.closest('[data-editorial-page]')?.querySelector<HTMLElement>('.editorial-nav');
  const heroMasks = new Map([...hero.querySelectorAll<HTMLElement>('[data-masked-reveal]')].map(element => [element.dataset.maskedReveal!, createMaskedReveal(element, .18)]));
  const reveals: Reveal[] = [...story.querySelectorAll<HTMLElement>('[data-story-reveal]')].map(element => ({ element, reveal: createMaskedReveal(element, element.dataset.storyReveal === 'copy' ? .14 : .12), top: 0, height: 1 }));
  const depths = [...story.querySelectorAll<HTMLElement>('[data-story-depth]')].map(element => ({ element, amount: Number(element.dataset.storyDepth), top: 0, height: 1 }));
  const draws: Box[] = [...story.querySelectorAll<SVGPathElement>('[data-story-draw]')].map(element => ({ element, top: 0, height: 1 }));
  const motion = matchMedia('(prefers-reduced-motion: reduce)'), key = `case-story-${root.dataset.caseSlug ?? 'project'}-${root.lang}`;
  const savedInline = [...root.querySelectorAll<HTMLElement | SVGElement>('*')].map(element => ({ element, style: element.getAttribute('style'), transform: element.getAttribute('transform'), d: element.getAttribute('d') }));
  let disposed = false, frame = 0, previousTime = 0, measureDirty = true, scrollDirty = true, reduced = motion.matches || uiStore.getState().quietMode, fontsReady = !document.fonts;
  let scale = 1, viewport = 1080, heroTop = 0, heroHeight = 1, anchors: number[] = [], routeLength = 0, presented = false;
  let entryStarted = false, entryDone = false, entrySeconds = 0, ambient = 0, pointerX = 0, pointerY = 0, targetX = 0, targetY = 0;
  const arrival = routeEntries(root.ownerDocument ?? document).register(root, pageEntryPath(root, 'projects'), {
    start(skip) { entryStarted = true; if (skip || skipPageEntry(reduced, window)) { entryDone = true; entrySeconds = 3; } heroEntry(0); wake(); },
    finish() { entryStarted = entryDone = true; entrySeconds = 3; heroEntry(0); },
    assetsReady: () => true,
  });
  const revealHero = (id: string, progress: number) => heroMasks.get(id)?.set(progress, reduced);
  const heroEntry = (dt: number) => {
    if (entryStarted && !entryDone) entrySeconds += Math.min(dt, .05);
    if (reduced) { entryDone = true; entrySeconds = 3; }
    const age = entryStarted ? entrySeconds : 3;
    revealHero('hero-index', range(age, .1, .65)); revealHero('hero-identity', range(age, .14, .69));
    [...heroMasks.keys()].filter(id => id.startsWith('hero-title-')).forEach((id, index) => revealHero(id, range(age, .18 + .13 * index, 1.1 + .13 * index)));
    revealHero('hero-copy', range(age, .69, 1.65)); revealHero('hero-action', range(age, 1.15, 1.72));
    if (entrySeconds >= 2) entryDone = true;
    return reduced ? 1 : entryStarted ? range(age, 0, 1.6) : 0;
  };
  const measure = () => {
    const stage = referenceStage(innerWidth, innerHeight); scale = stage.scale; viewport = innerHeight;
    root.dataset.motion = reduced ? 'reading' : 'true';
    depths.forEach(item => item.element.style.removeProperty('transform'));
    if (nav) story.style.setProperty('--case-nav-clearance', pixelsToVw(Math.round(nav.getBoundingClientRect().height + 32 * scale), innerWidth));
    heroMasks.forEach(mask => mask.measure()); reveals.forEach(item => item.reveal.measure());
    const y = scrollY, box = (element: Element) => { const rect = element.getBoundingClientRect(); return { top: rect.top + y, height: Math.max(1, rect.height) }; };
    reveals.forEach(item => Object.assign(item, box(item.element))); depths.forEach(item => Object.assign(item, box(item.element)));
    draws.forEach(item => Object.assign(item, box(item.element.closest('[data-drawing-window]') ?? item.element)));
    ({ top: heroTop, height: heroHeight } = box(hero));
    anchors = steps.map(step => step.getBoundingClientRect().top + y + Math.min(.3 * step.offsetHeight, 125 * scale));
    routeLength = route?.getTotalLength() ?? 0;
    story.dataset.storyReady = 'true'; scrollDirty = true; measureDirty = false;
    if (fontsReady) arrival.ready(reduced);
  };
  const renderStory = (y: number) => {
    reveals.forEach(item => item.reveal.set(storyReveal(item.top, item.height, y, viewport, scale, reduced), reduced));
    depths.forEach(item => { item.element.style.transform = reduced ? 'none' : `translate3d(0,${pixelsToVw((clamp01((y + viewport - item.top) / (viewport + item.height)) - .5) * item.amount * scale, innerWidth)},0)`; });
    draws.forEach(item => { item.element.style.strokeDashoffset = String(1 - storyReveal(item.top, item.height, y, viewport, scale, reduced)); });
    if (!progression) return;
    const reading = caseReading(anchoredProgress(y + .32 * viewport, anchors), reduced);
    progression.dataset.readingStep = String(reading.step); progression.style.setProperty('--reading-progress', String(reading.progress));
    links.forEach((link, index) => index === reading.step ? link.setAttribute('aria-current', 'step') : link.removeAttribute('aria-current'));
    finance?.setAttribute('d', financePath(reading.progress));
    financeLabels.forEach((label, index) => { label.style.clipPath = index === reading.step ? 'inset(0)' : 'inset(0 0 100%)'; });
    parts.forEach(part => part.setAttribute('transform', coneTransform(reading.progress)));
    if (route) route.style.strokeDashoffset = String(1 - reading.route);
    if (route && cursor && routeLength) { const point = route.getPointAtLength(routeLength * reading.route); cursor.setAttribute('transform', `translate(${point.x} ${point.y})${turn ? ` rotate(${turn * reading.route})` : ''}`); }
  };
  /** Returns whether the hero still needs frames: an unfinished entry, a moving pointer or an idle sway on screen. */
  const renderHero = (dt: number, y: number) => {
    const entry = heroEntry(dt), top = heroTop - y;
    if (top + heroHeight < 0 || top > viewport) return entryStarted && !entryDone;
    const ease = 1 - Math.exp(-9 * dt); pointerX += (targetX - pointerX) * ease; pointerY += (targetY - pointerY) * ease;
    if (!reduced) ambient += dt;
    const drawn = reduced ? 1 : .72 + .28 * range(entry, 0, .62), passed = clamp01(-top / heroHeight);
    if (markPath) { markPath.style.strokeDashoffset = String(1 - drawn); markPath.style.strokeDasharray = drawn >= 1 ? 'none' : '1'; }
    if (tail) tail.style.strokeDashoffset = String(1 - range(passed, 0, .52));
    if (depth) {
      const x = reduced ? 0 : 2 * pointerX + sway.x * Math.sin(.24 * ambient), shift = reduced ? 0 : 2 * pointerY + 10 * passed + sway.y * Math.sin(.31 * ambient);
      depth.style.translate = `${pixelsToVw(x * scale, innerWidth)} ${pixelsToVw(shift * scale, innerWidth)}`;
    }
    return entryStarted && !entryDone || !reduced && (sway.x + sway.y > 0 || Math.abs(targetX - pointerX) + Math.abs(targetY - pointerY) > .0005);
  };
  function wake() {
    if (disposed || frame || document.hidden || uiStore.getState().menuOpen) return;
    frame = requestAnimationFrame(present);
  }
  function present(time: number) {
    frame = 0;
    if (disposed || document.hidden || uiStore.getState().menuOpen) { previousTime = 0; return; }
    const dt = previousTime ? Math.max(0, Math.min(.05, (time - previousTime) / 1000)) : 0; previousTime = time;
    if (measureDirty) measure();
    const y = scrollY, active = renderHero(dt, y);
    if (scrollDirty) { renderStory(y); scrollDirty = false; }
    if (!presented && fontsReady) { presented = true; arrival.presented(); }
    if (active) wake(); else previousTime = 0;
  }
  const onScroll = () => { scrollDirty = true; wake(); };
  const onResize = () => { measureDirty = true; wake(); };
  const onPointer = (event: PointerEvent) => {
    if (event.pointerType === 'touch' || reduced) return;
    const rect = hero.getBoundingClientRect(); targetX = (event.clientX / rect.width - .5) * 2; targetY = ((event.clientY - rect.top) / rect.height - .5) * 2; wake();
  };
  const onLeave = () => { targetX = targetY = 0; wake(); };
  const onVisibility = () => { previousTime = 0; if (frame) cancelAnimationFrame(frame); frame = 0; scrollDirty = true; wake(); };
  const sync = () => {
    const next = motion.matches || uiStore.getState().quietMode;
    if (next !== reduced) { reduced = next; measureDirty = true; }
    onVisibility();
  };
  scrollManager.createInstance(key, onScroll, { useRAF: false });
  hero.addEventListener('pointermove', onPointer, { passive: true }); hero.addEventListener('pointerleave', onLeave);
  window.addEventListener('resize', onResize, { passive: true }); window.addEventListener('pageshow', onResize); motion.addEventListener('change', sync); document.addEventListener('visibilitychange', onVisibility); document.fonts?.addEventListener('loadingdone', onResize);
  const unsubscribe = uiStore.subscribe(sync);
  const onFonts = () => { if (!disposed) { fontsReady = true; measureDirty = true; wake(); } };
  void (document.fonts?.ready ?? Promise.resolve()).then(onFonts, onFonts);
  root.dataset.motion = reduced ? 'reading' : 'true'; wake();
  return () => {
    disposed = true; arrival.dispose(); if (frame) cancelAnimationFrame(frame); frame = 0; unsubscribe(); scrollManager.removeInstance(key);
    hero.removeEventListener('pointermove', onPointer); hero.removeEventListener('pointerleave', onLeave);
    window.removeEventListener('resize', onResize); window.removeEventListener('pageshow', onResize); motion.removeEventListener('change', sync); document.removeEventListener('visibilitychange', onVisibility); document.fonts?.removeEventListener('loadingdone', onResize);
    heroMasks.forEach(mask => mask.dispose()); reveals.forEach(item => item.reveal.dispose());
    links.forEach(link => link.removeAttribute('aria-current'));
    savedInline.forEach(({ element, style, transform, d }) => {
      if (style === null) element.removeAttribute('style'); else element.setAttribute('style', style);
      if (transform === null) element.removeAttribute('transform'); else element.setAttribute('transform', transform);
      if (d !== null) element.setAttribute('d', d);
    });
    delete root.dataset.motion; delete story.dataset.storyReady; if (progression) delete progression.dataset.readingStep;
  };
}
