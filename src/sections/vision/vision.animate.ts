import scrollManager from '@/lib/scrollInteraction/scrollManager';
import { pixelsToVw, viewportDesign } from '@/lib/viewport-design';
import { uiStore } from '@/store/uiStore';
import { clamp01, practiceHeroLayout, practiceHeroPointer } from './1-opening/practice-hero';
import type { PracticeObjects } from './1-opening/practice-objects';
import { createSystemPassage } from './2-perspective/system.animate';
import { editorialOffset, range, viewportProgress } from './2-perspective/system-geometry';
import { createVisionNarrative } from './3-narrative/narrative.animate';
import { createMaskedReveal } from './masked-reveal';

const loadObjects = () => import('./1-opening/practice-objects');

/** One demand RAF presents editorial DOM, source entry, pointer and logo together. */
export function mountVision(root: HTMLElement) {
  const opening = root.querySelector<HTMLElement>('.practice-opening')!, canvas = opening.querySelector<HTMLCanvasElement>('canvas')!;
  const rtl = root.dir === 'rtl', motion = matchMedia('(prefers-reduced-motion: reduce)'), abort = new AbortController();
  const system = createSystemPassage(root.querySelector<HTMLElement>('[data-visual-chapter="perspective"]')!, rtl), narrative = createVisionNarrative(root, rtl);
  const heroMasks = new Map([...opening.querySelectorAll<HTMLElement>('[data-masked-reveal]')].map(element => [element.dataset.maskedReveal!, createMaskedReveal(element, .18)]));
  const compositions = [...root.querySelectorAll<HTMLElement>('[data-editorial-composition]')].map(element => ({ element, top: 0, height: 1, layers: [...element.querySelectorAll<HTMLElement>('[data-editorial-layer]')].map(layer => ({ element: layer, kind: layer.dataset.editorialLayer! })) }));
  const advance = root.querySelector<HTMLAnchorElement>('[data-vision-advance]');
  const key = `vision-editorial-${rtl ? 'ar' : 'en'}`;
  let disposed = false, frame = 0, previousTime = 0, measureDirty = true, scrollDirty = true, reduced = motion.matches || uiStore.getState().quietMode;
  let objects: PracticeObjects | null = null, objectPending = false, objectsFailed = false, width = 1920, height = 1080, scale = 1, top = 0, left = 0, actualWidth = 1920, extent = 1080;
  let entryStarted = false, entryDone = false, entrySeconds = 0, ambient = 0, pointerX = 0, pointerY = 0, targetX = 0, targetY = 0, lastHeroDraw = -Infinity, forceDraw = true;
  const savedInline = [...root.querySelectorAll<HTMLElement | SVGElement>('*')].map(element => ({ element, style: element.getAttribute('style') }));
  const revealHero = (id: string, progress: number) => heroMasks.get(id)?.set(progress, reduced);
  const heroEntry = (dt: number) => {
    if (!entryStarted && (scrollY > 80 || !document.documentElement.dataset.routeBusy)) { entryStarted = true; if (scrollY > 80) { entryDone = true; entrySeconds = 3; } }
    if (entryStarted && !entryDone) entrySeconds += Math.min(dt, .05);
    if (reduced) { entryDone = true; entrySeconds = 3; }
    revealHero('hero-index', range(entrySeconds, .1, .65)); revealHero('hero-identity', range(entrySeconds, .14, .69));
    [...heroMasks.keys()].filter(id => id.startsWith('hero-title-')).forEach((id, index) => revealHero(id, range(entrySeconds, .18 + .13 * index, 1.1 + .13 * index)));
    revealHero('hero-copy', range(entrySeconds, .69, 1.65)); revealHero('hero-action', range(entrySeconds, 1.15, 1.72));
    if (entrySeconds >= 2) entryDone = true;
    const progress = reduced ? 1 : range(entrySeconds, 0, 1.6); opening.dataset.heroEntry = String(progress); return progress;
  };
  const measure = () => {
    const design = viewportDesign(innerWidth); width = design.width; height = design.height; scale = innerWidth / width;
    compositions.forEach(composition => composition.layers.forEach(layer => layer.element.style.removeProperty('transform')));
    root.dataset.motion = reduced ? 'reading' : 'true';
    heroMasks.forEach(mask => mask.measure()); system.measure(reduced); narrative.measure(reduced);
    compositions.forEach(composition => { const box = composition.element.getBoundingClientRect(); composition.top = (box.top + scrollY) / scale; composition.height = box.height / scale; });
    const box = opening.getBoundingClientRect(); top = box.top + scrollY; left = box.left; actualWidth = box.width;
    const layout = practiceHeroLayout('about', width, height); opening.style.setProperty('--hero-copy-start', pixelsToVw(Math.max(.34 * width, layout.x + .12 * layout.size) * scale, innerWidth));
    extent = objects?.resize(actualWidth, height * scale) ?? height * scale;
    forceDraw = true; scrollDirty = true; measureDirty = false;
  };
  function wake() {
    if (disposed || frame || document.hidden || uiStore.getState().menuOpen) return;
    frame = requestAnimationFrame(present);
  }
  const fail = () => {
    if (disposed) return;
    objectsFailed = true; objects?.dispose(); objects = null; opening.dataset.depthFallback = 'true'; forceDraw = false;
  };
  const requestObjects = () => {
    if (disposed || objectPending || objects || objectsFailed) return;
    objectPending = true;
    void loadObjects().then(module => disposed ? null : module.createPracticeObjects(canvas, 'about', abort.signal)).then(renderer => {
      objectPending = false; if (!renderer) return;
      if (disposed) { renderer.dispose(); return; }
      objects = renderer; extent = renderer.resize(actualWidth, height * scale); forceDraw = true; wake();
    }).catch(fail);
  };
  function present(time: number) {
    frame = 0;
    if (disposed || document.hidden || uiStore.getState().menuOpen) { previousTime = 0; return; }
    const dt = previousTime ? Math.max(0, Math.min(.05, (time - previousTime) / 1000)) : 0; previousTime = time;
    if (measureDirty) measure();
    const nativeScroll = scrollY, visible = nativeScroll < top + extent && nativeScroll + innerHeight > top;
    const portrait = width <= 700 || height / width > 1.12, entry = heroEntry(dt);
    if (visible) requestObjects();
    if (visible && !reduced) {
      ambient += dt;
      const ease = 1 - Math.exp(-9 * dt); pointerX += (targetX - pointerX) * ease; pointerY += (targetY - pointerY) * ease;
    } else pointerX = pointerY = targetX = targetY = 0;
    if (scrollDirty || forceDraw) {
      compositions.forEach(composition => {
        const remapped = system.editorialScroll(composition.element, nativeScroll, reduced) / scale;
        const progress = viewportProgress(remapped, composition.top, composition.height, height);
        composition.layers.forEach(layer => { layer.element.style.transform = `translate3d(0,${pixelsToVw(editorialOffset(progress, layer.kind, portrait, reduced) * scale, innerWidth)},0)`; });
      });
      system.render(nativeScroll, reduced); narrative.render(nativeScroll, reduced); scrollDirty = false;
    }
    if (visible && objects && (forceDraw || !entryDone || !reduced && time - lastHeroDraw >= (portrait ? 1000 / 30 : 1000 / 60) - 1)) {
      try { objects.render(clamp01((nativeScroll - top) / extent), pointerX, pointerY, reduced, ambient, entry); lastHeroDraw = time; forceDraw = false; }
      catch { fail(); }
    }
    if (!entryDone || visible && !reduced && !objectsFailed || Math.abs(pointerX - targetX) + Math.abs(pointerY - targetY) > .0005) wake();
    else previousTime = 0;
  }
  const onScroll = () => { scrollDirty = true; forceDraw = true; wake(); };
  const onResize = () => { measureDirty = true; wake(); };
  const onPointer = (event: PointerEvent) => {
    if (event.pointerType === 'touch' || reduced || scrollY >= top + extent || event.clientY + scrollY > top + extent) { targetX = targetY = 0; return; }
    const pointer = practiceHeroPointer('about', width, height, (event.clientX - left) / scale, (event.clientY + scrollY - top) / scale); targetX = pointer.x; targetY = pointer.y; wake();
  };
  const onLeave = () => { targetX = targetY = 0; wake(); };
  const onEntry = () => { if (!entryStarted) { entryStarted = true; entrySeconds = 0; } wake(); };
  const onVisibility = () => { previousTime = 0; if (frame) cancelAnimationFrame(frame); frame = 0; forceDraw = true; scrollDirty = true; wake(); };
  const sync = () => {
    const next = motion.matches || uiStore.getState().quietMode;
    if (next !== reduced) { reduced = next; measureDirty = true; scrollDirty = true; forceDraw = true; }
    onVisibility();
  };
  const onAdvance = (event: MouseEvent) => {
    event.preventDefault();
    const reading = root.querySelector<HTMLElement>('[data-system-details-reading]')!, target = root.querySelector<HTMLElement>('[data-system-step="0"] .practice-reading')!;
    const navBottom = root.closest('[data-editorial-page]')?.querySelector('.editorial-nav')?.getBoundingClientRect().bottom ?? 0;
    const padding = Math.max(20, .035 * height) * scale, offset = new DOMMatrixReadOnly(getComputedStyle(reading).transform).m42;
    const destination = target.getBoundingClientRect().top + scrollY - offset - navBottom - padding;
    const start = Number(root.querySelector<HTMLElement>('[data-visual-chapter]')!.dataset.readingStart ?? Infinity);
    window.scrollTo({ top: Math.max(0, Math.min(destination, start)), behavior: reduced ? 'instant' : 'smooth' });
  };
  scrollManager.createInstance(key, onScroll, { useRAF: false });
  root.addEventListener('pointermove', onPointer, { passive: true }); root.addEventListener('pointerleave', onLeave); opening.addEventListener('practice-hero-enter', onEntry); advance?.addEventListener('click', onAdvance);
  window.addEventListener('resize', onResize, { passive: true }); window.addEventListener('pageshow', onResize); motion.addEventListener('change', sync); document.addEventListener('visibilitychange', onVisibility); document.fonts.addEventListener('loadingdone', onResize);
  const unsubscribe = uiStore.subscribe(sync);
  const near = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) requestObjects(); }, { rootMargin: '50%' }); near.observe(opening);
  void document.fonts.ready.then(() => { if (!disposed) { measureDirty = true; wake(); } });
  root.dataset.motion = reduced ? 'reading' : 'true'; wake();
  return () => {
    disposed = true; abort.abort(); if (frame) cancelAnimationFrame(frame); frame = 0; near.disconnect(); unsubscribe(); scrollManager.removeInstance(key);
    root.removeEventListener('pointermove', onPointer); root.removeEventListener('pointerleave', onLeave); opening.removeEventListener('practice-hero-enter', onEntry); advance?.removeEventListener('click', onAdvance);
    window.removeEventListener('resize', onResize); window.removeEventListener('pageshow', onResize); motion.removeEventListener('change', sync); document.removeEventListener('visibilitychange', onVisibility); document.fonts.removeEventListener('loadingdone', onResize);
    system.dispose(); narrative.dispose(); heroMasks.forEach(mask => mask.dispose()); objects?.dispose();
    savedInline.forEach(({ element, style }) => { if (style === null) element.removeAttribute('style'); else element.setAttribute('style', style); });
    delete root.dataset.motion; delete opening.dataset.depthFallback; delete opening.dataset.heroEntry;
  };
}
