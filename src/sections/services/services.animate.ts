import scrollManager from "@/lib/scrollInteraction/scrollManager";
import { designScale, pixelsToVw, referenceStage, viewportDesign } from "@/lib/viewport-design";
import { uiStore } from "@/store/uiStore";
import { createServicesOpening } from "./2-opening/opening.animate";
import { createServiceIndex } from "./3-index/service-index.animate";
import { clamp, range } from "./2-opening/opening-score";
import { createMaskedReveal } from "./masked-reveal";
import type { PracticeObjects } from "../vision/1-opening/practice-objects";
import { pageEntryPath, routeEntries, skipPageEntry } from "@/lib/navigation/route-entry";

/** One presentation RAF owns Services scroll, finite entry, gate springs and object poses. */
export function mountServices(root: HTMLElement, reduced: boolean) {
  let alive = true, ready = false, raf = 0, previousTime = 0, needsMeasure = true, dirty = true;
  let scroll = window.scrollY, seconds = 0, entryAge = 0, entryStarted = false, heroTop = 0, heroWidth = 1, heroHeight = 1;
  let renderer: PracticeObjects | null = null, rendererFailed = false, routeDrawPublished = false, pointerTargetX = 0, pointerTargetY = 0, pointerX = 0, pointerY = 0, lastObjectTime = -1;
  const hero = root.querySelector<HTMLElement>(".practice-opening")!, canvas = hero.querySelector<HTMLCanvasElement>("canvas")!;
  const abort = new AbortController();
  const entry = new Map([...hero.querySelectorAll<HTMLElement>("[data-masked-reveal]")].map((element) => [element.dataset.maskedReveal!, createMaskedReveal(element, .18)]));
  const compositions = [...root.querySelectorAll<HTMLElement>("[data-editorial-composition]")].map((element) => ({ element, top: 0, height: 1, layers: [...element.querySelectorAll<HTMLElement>("[data-editorial-layer]")].map((layer) => ({ element: layer, kind: layer.dataset.editorialLayer! })) }));
  // Both synchronous controller wakes and ambient continuation share this guard.
  // A wake during measure/tick may already have reserved the next browser frame.
  const schedule = () => { if (alive && ready && !raf && !document.hidden && !uiStore.getState().menuOpen) raf = requestAnimationFrame(frame); };
  const wake = () => { dirty = true; schedule(); };
  const opening = createServicesOpening(root, wake, reduced), index = createServiceIndex(root, reduced);
  const key = "services-page-presentation";
  const arrival = routeEntries(root.ownerDocument ?? document).register(root, pageEntryPath(root, "services"), {
    start(skip) { entryStarted = true; if (skip || skipPageEntry(reduced, window)) entryAge = 3; presentEntry(0); wake(); },
    finish() { entryStarted = true; entryAge = 3; presentEntry(0); },
    assetsReady: () => rendererFailed || canvas.dataset.heroRendered === "true" || window.scrollY >= heroTop + heroHeight || window.scrollY + window.innerHeight <= heroTop,
  });
  function failRenderer() {
    if (!alive) return;
    rendererFailed = true;
    const failed = renderer; renderer = null;
    // GPU teardown must not interrupt the independent text/gate transaction.
    try { failed?.dispose(); } catch { /* A lost renderer may also reject disposal. */ }
    canvas.hidden = true; root.dataset.depthFallback = "true"; lastObjectTime = -1; arrival.presented();
    wake();
  }
  function resizeRenderer() {
    if (!renderer) return;
    try {
      const extent = renderer.resize(heroWidth, heroHeight);
      hero.querySelector<HTMLElement>(".practice-hero-geometry")!.style.height = pixelsToVw(extent, window.innerWidth);
    } catch { failRenderer(); }
  }
  function measure() {
    needsMeasure = false; opening.measure(); index.measure();
    compositions.forEach((composition) => { const rect = composition.element.getBoundingClientRect(); composition.top = rect.top + window.scrollY; composition.height = rect.height; });
    const rect = hero.getBoundingClientRect(); heroTop = rect.top + window.scrollY; heroWidth = rect.width; heroHeight = rect.height;
    resizeRenderer();
    entry.forEach((reveal) => reveal.measure()); scroll = window.scrollY; dirty = true;
  }
  function presentEntry(delta: number) {
    entryAge = reduced ? 3 : Math.min(3, entryAge + (entryStarted ? delta : 0));
    const age = entryStarted ? entryAge : 3;
    entry.get("hero-index")!.set(range(age, .1, .65), reduced);
    [...entry.keys()].filter((name) => name.startsWith("hero-title-")).forEach((name, i) => entry.get(name)!.set(range(age, .18 + .13 * i, 1.1 + .13 * i), reduced));
    entry.get("hero-copy")!.set(range(age, .69, 1.65), reduced); entry.get("hero-action")!.set(range(age, 1.15, 1.72), reduced);
    const progress = reduced ? 1 : entryStarted ? range(age, 0, 1.6) : 0;
    hero.dataset.heroEntry = String(progress); return progress;
  }
  function frame(time: number) {
    raf = 0;
    if (!alive || document.hidden || uiStore.getState().menuOpen) { previousTime = 0; return; }
    const delta = previousTime ? Math.min(.05, Math.max(0, (time - previousTime) / 1000)) : 1 / 60; previousTime = time;
    if (needsMeasure) measure();
    if (scroll !== window.scrollY) { scroll = window.scrollY; dirty = true; }
    const entryProgress = presentEntry(delta), response = opening.tick(time / 1000, delta, scroll);
    if (dirty) {
      dirty = false; index.tick(scroll);
      const scale = designScale(window.innerWidth), portrait = viewportDesign(window.innerWidth).key !== "desktop";
      compositions.forEach((composition) => {
        const stageHeight = window.innerHeight;
        const progress = clamp((scroll + stageHeight - composition.top) / (composition.height + stageHeight));
        composition.layers.forEach((layer) => { const distance = ({ heading: 24, copy: 40, meta: 10 } as Record<string, number>)[layer.kind] ?? 0; const offset = reduced ? 0 : (1 - 2 * progress) * distance * (portrait ? .45 : 1) * scale; layer.element.style.transform = `translate3d(0,${pixelsToVw(offset, window.innerWidth)},0)`; });
      });
    }
    const heroVisible = scroll < heroTop + heroHeight && scroll + window.innerHeight > heroTop;
    const movingPointer = Math.abs(pointerTargetX - pointerX) + Math.abs(pointerTargetY - pointerY) > .0005;
    if (heroVisible && !reduced) { seconds += delta; const ease = 1 - Math.exp(-9 * delta); pointerX += (pointerTargetX - pointerX) * ease; pointerY += (pointerTargetY - pointerY) * ease; } else pointerX = pointerY = pointerTargetX = pointerTargetY = 0;
    const cadence = viewportDesign(window.innerWidth).key === "desktop" ? 1 / 60 : 1 / 30;
    if (heroVisible && renderer && (reduced ? lastObjectTime < 0 : time / 1000 - lastObjectTime >= cadence - .001 || entryAge < 2 || movingPointer)) {
      try { renderer.render(response.score.heroExit, pointerX, pointerY, reduced, seconds, entryProgress); lastObjectTime = time / 1000; if (!routeDrawPublished && canvas.dataset.heroRendered === "true") { routeDrawPublished = true; arrival.presented(); } }
      catch { failRenderer(); }
    }
    if (entryStarted && entryAge < 2 || response.active || heroVisible && !reduced && !rendererFailed) schedule();
    else previousTime = 0;
  }
  const onScroll = () => { scroll = window.scrollY; wake(); };
  const resize = () => { needsMeasure = true; lastObjectTime = -1; wake(); };
  const pointer = (event: PointerEvent) => {
    if (event.pointerType === "touch" || reduced || viewportDesign(window.innerWidth).key !== "desktop") return;
    const rect = hero.getBoundingClientRect(); if (event.clientY < rect.top || event.clientY > rect.bottom) return;
    // The source object pointer is attenuated outside its central influence ellipse.
    const stage = referenceStage(rect.width, rect.height), referenceX = (event.clientX - rect.left) / stage.scale, referenceY = (event.clientY - rect.top) / stage.scale;
    const size = Math.min(.36 * stage.width, .58 * stage.height) * 1.2, x = (referenceX - .5 * stage.width) / (.65 * size), y = (.49 * stage.height - referenceY) / (.65 * size);
    const t = clamp((Math.hypot(x, y) - .8) / .65), falloff = 1 - t * t * (3 - 2 * t);
    pointerTargetX = clamp(x, -1, 1) * falloff; pointerTargetY = clamp(y, -1, 1) * falloff; wake();
  };
  const leave = () => { pointerTargetX = pointerTargetY = 0; wake(); };
  const visibility = () => { previousTime = 0; if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = 0; opening.suspend(); } else { lastObjectTime = -1; wake(); } };
  const advance = (event: Event) => { const target = Number(root.querySelector<HTMLElement>("[data-services-opening]")!.dataset.readingStart); if (!Number.isFinite(target)) return; event.preventDefault(); window.scrollTo({ top: Math.max(0, target), behavior: reduced ? "instant" : "smooth" }); };
  const advanceLink = root.querySelector<HTMLAnchorElement>("[data-services-advance]")!;
  const observer = new ResizeObserver(resize);
  const unsubscribe = uiStore.subscribe(() => { if (uiStore.getState().menuOpen) { if (raf) cancelAnimationFrame(raf); raf = 0; previousTime = 0; opening.pause(); } else wake(); });
  const fontsChanged = () => { needsMeasure = true; wake(); };

  root.dataset.servicesEnhanced = "true"; root.dataset.practiceReduced = String(reduced);
  scrollManager.createInstance(key, onScroll, { useRAF: false }); window.addEventListener("resize", resize); hero.addEventListener("pointermove", pointer, { passive: true }); hero.addEventListener("pointerleave", leave); document.addEventListener("visibilitychange", visibility); advanceLink.addEventListener("click", advance); document.fonts.addEventListener("loadingdone", fontsChanged); observer.observe(root);
  const initialize = () => {
    if (!alive) return;
    ready = true; measure(); root.dataset.practiceReady = "true"; arrival.ready(reduced); wake();
    // Only the object renderer crosses this later boundary; body copy never does.
    void import("../vision/1-opening/practice-objects").then((module) => alive ? module.createPracticeObjects(canvas, "services", abort.signal) : null).then((objects) => {
      if (!alive) { objects?.dispose(); return; }
      renderer = objects; if (!objects) { failRenderer(); return; }
      resizeRenderer(); lastObjectTime = -1; wake();
    }).catch(failRenderer);
  };
  void (document.fonts?.ready ?? Promise.resolve()).then(initialize, initialize);
  return () => {
    alive = false; arrival.dispose(); abort.abort(); if (raf) cancelAnimationFrame(raf); scrollManager.removeInstance(key); unsubscribe(); observer.disconnect(); window.removeEventListener("resize", resize); hero.removeEventListener("pointermove", pointer); hero.removeEventListener("pointerleave", leave); document.removeEventListener("visibilitychange", visibility); advanceLink.removeEventListener("click", advance); document.fonts.removeEventListener("loadingdone", fontsChanged);
    renderer?.dispose(); opening.dispose(); index.dispose(); entry.forEach((reveal) => reveal.dispose()); compositions.forEach((composition) => composition.layers.forEach((layer) => layer.element.style.removeProperty("transform")));
    hero.querySelector<HTMLElement>(".practice-hero-geometry")!.style.removeProperty("height"); delete hero.dataset.heroEntry; canvas.hidden = false;
    delete root.dataset.servicesEnhanced; delete root.dataset.practiceReady; delete root.dataset.practiceReduced; delete root.dataset.depthFallback;
  };
}
