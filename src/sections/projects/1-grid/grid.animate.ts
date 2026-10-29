import { referenceStage, pixelsToVw } from '@/lib/viewport-design';
import { routeEntries, pageEntryPath } from '@/lib/navigation/route-entry';
import { uiStore } from '@/store/uiStore';
import { GRID_COUNT, GRID_START, gridCard, gridCaption, gridLayout, gridTarget, projectiveCss, wrap } from './grid-geometry';
import { createGridMotion } from './grid-motion';
import { createGridPreview } from './components/grid-preview/grid-preview.logic';

/** The pannable grid is its own input surface, not a document scroll smoother.
 * One demand RAF owns projection, input damping and the finite entrance. */
export function mountProjectsGrid(root: HTMLElement) {
  const doc = root.ownerDocument, win = doc.defaultView!, viewport = root.querySelector<HTMLElement>('[data-grid-viewport]')!, plane = root.querySelector<HTMLElement>('[data-grid-plane]')!;
  const originals = [...plane.querySelectorAll<HTMLAnchorElement>('[data-grid-item]')];
  if (!originals.length) return () => {};
  const abort = new AbortController(), media = win.matchMedia('(prefers-reduced-motion: reduce)'), fine = win.matchMedia('(hover: hover) and (pointer: fine)');
  let reduced = media.matches || uiStore.getState().quietMode, disposed = false, frame = 0, previousTime = 0, dirty = true, measuring = true;
  // Width alone selects the profile and scale. Enhanced CSS sizes the viewport to
  // the physical stage; before it applies, the viewport is the static list's flow
  // height, so the first layout reads the window instead.
  const stage = () => referenceStage(win.innerWidth, root.dataset.gridEnhanced && viewport.getBoundingClientRect().height || win.innerHeight);
  let design = stage(), scale = design.scale, layout = gridLayout(design.width, design.height);
  const motion = createGridMotion(layout, GRID_START);
  const originalRootStyle = root.getAttribute('style'), saved = originals.map(element => ({ element, style: element.getAttribute('style') }));
  const clones: HTMLAnchorElement[] = [];
  for (let index = originals.length; index < GRID_COUNT; index++) {
    const clone = originals[index % originals.length].cloneNode(true) as HTMLAnchorElement;
    clone.dataset.gridClone = 'true'; clone.tabIndex = -1; clone.setAttribute('aria-hidden', 'true');
    plane.append(clone); clones.push(clone);
  }
  const items = [...originals, ...clones].map(element => ({ element, card: element.querySelector<HTMLElement>('[data-grid-card]')!, image: element.querySelector<HTMLImageElement>('img')!, media: element.querySelector<HTMLElement>('[data-grid-media]')!, caption: element.querySelector<HTMLElement>('[data-grid-caption]')! }));
  const savedChildren = items.slice(0, originals.length).flatMap(item => [item.card, item.image, item.caption].map(element => ({ element, style: element.getAttribute('style') })));
  items.forEach(item => item.element.append(item.caption));
  let captionBand = 30, captionGap = 8;
  let entryAge = Infinity, pointerId: number | null = null, contact: PointerEvent | null = null, bounds = viewport.getBoundingClientRect();
  let hovered: HTMLAnchorElement | null = null, resizeTimer = 0, lastInput = 0;
  const blocked = () => disposed || doc.hidden || uiStore.getState().menuOpen;
  const length = (value: number) => pixelsToVw(value * scale, win.innerWidth);
  const localPoint = (event: PointerEvent) => ({ x: (event.clientX - bounds.left) / scale, y: (event.clientY - bounds.top) / scale });
  const mayPlay = () => !reduced && !(win.navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData && !blocked();
  const preview = createGridPreview(root, { enabled: mayPlay });
  const arrival = routeEntries(doc).register(root, pageEntryPath(root, 'projects'), {
    start(skip) { entryAge = skip || reduced ? Infinity : 0; dirty = true; wake(); },
    finish() { entryAge = Infinity; dirty = true; wake(); },
    assetsReady: () => root.dataset.gridReady === 'true',
  });
  function measure() {
    const old = layout; design = stage(); scale = design.scale;
    layout = gridLayout(design.width, design.height); bounds = viewport.getBoundingClientRect();
    // A held contact keeps following from its current point under the new mapping.
    if (layout.stepX !== old.stepX || layout.stepY !== old.stepY) motion.resize(layout, old, contact ? localPoint(contact) : undefined);
    else if (contact) motion.anchor(localPoint(contact));
    captionGap = parseFloat(win.getComputedStyle(items[0].card).rowGap) / scale || 8;
    captionBand = items[0].caption.offsetHeight / scale + captionGap;
    root.style.setProperty('--grid-card-width', length(layout.cardWidth)); root.style.setProperty('--grid-card-height', length(layout.cardHeight));
    root.style.setProperty('--grid-anchor-inset', length(layout.anchorInset));
    root.style.setProperty('--grid-caption-band', length(captionBand));
    root.dataset.gridEnhanced = 'true'; root.dataset.gridReady = 'true'; measuring = false; dirty = true;
    // The first measure ran on the padded static list; map pointers in the enhanced box.
    bounds = viewport.getBoundingClientRect();
  }
  function paint() {
    const age = entryAge, entry = reduced || age >= 2.4 ? { offset: 0, bow: 1, reveal: 1 } : {
      offset: -layout.stepY * 1.5 * 2 ** (-10 * age / 2.4), bow: 1 + 1.2 * 2 ** (-10 * age / 2.4),
      reveal: age <= .1 ? 0 : 1 - (1 - Math.min(1, (age - .1) / 1.5)) ** 3,
    };
    const pan = { x: motion.pan.x, y: motion.pan.y + entry.offset };
    for (let index = 0; index < items.length; index++) {
      const item = items[index], card = gridCard(layout, index, pan, motion.pointer, motion.pressure, entry.bow, entry.reveal);
      item.element.style.transform = `translate3d(${length(card.position.x - Math.round(layout.anchorInset))},${length(card.position.y)},0)`;
      item.card.style.opacity = String(card.opacity);
      item.card.style.transform = `${projectiveCss(card.matrix, scale, length)} translate3d(${length(card.inset.x)},${length(card.inset.y)},0) scale(${card.scale})`;
      const label = gridCaption(card, layout.cardWidth, layout.cardHeight - captionBand, captionGap);
      item.caption.style.transform = `translate3d(${length(label.x)},${length(label.y)},0)`;
      item.caption.style.inlineSize = length(label.width); item.caption.style.opacity = String(card.opacity);
      item.image.style.transform = reduced ? '' : `translate3d(${length(card.parallax.x)},${length(card.parallax.y)},0) scale(1.12)`;
      if (preview.current === item.element && preview.element) preview.element.style.transform = item.image.style.transform;
    }
  }
  function present(time: number) {
    frame = 0;
    if (blocked()) { previousTime = 0; return; }
    const delta = previousTime ? Math.max(0, time - previousTime) : 16.667; previousTime = time;
    if (measuring) measure();
    if (entryAge < 2.4) { entryAge = Math.min(2.4, entryAge + Math.min(delta, 50) / 1000); dirty = true; }
    if (motion.step(delta, reduced)) dirty = true;
    if (dirty) { paint(); dirty = false; }
    if (!fine.matches && mayPlay() && !motion.dragging && !motion.velocity.x && !motion.velocity.y && Math.abs(motion.target.x - motion.pan.x) + Math.abs(motion.target.y - motion.pan.y) < .6) {
      let nearest = 0, distance = Infinity;
      items.forEach((_, index) => { const target = gridTarget(layout, index), x = wrap(target.x - motion.pan.x, layout.extentX), y = wrap(target.y - motion.pan.y, layout.extentY), d = x * x + y * y; if (d < distance) { distance = d; nearest = index; } });
      if (!preview.current && !preview.pending) preview.choose(items[nearest].element, Math.max(0, 350 - (time - lastInput)) + 220);
    }
    if (entryAge < 2.4 || motion.active) wake(); else previousTime = 0;
  }
  function wake() { if (!frame && !blocked()) frame = win.requestAnimationFrame(() => present(win.performance.now())); }
  const onWheel = (event: WheelEvent) => {
    if (blocked() || event.ctrlKey) return;
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? design.height : 1 / scale;
    motion.wheel(event.deltaX * unit, event.deltaY * unit); lastInput = win.performance.now();
    if (!fine.matches) preview.clear(); wake();
  };
  const onDown = (event: PointerEvent) => {
    if (blocked() || event.button !== 0 || event.isPrimary === false || pointerId !== null) return;
    bounds = viewport.getBoundingClientRect(); pointerId = event.pointerId; contact = event;
    motion.begin(localPoint(event), win.performance.now(), event.pointerType === 'touch' || event.pointerType === 'pen'); lastInput = win.performance.now();
    if (!fine.matches) preview.clear();
    if (motion.dragged) root.dataset.gridDragging = 'true'; wake();
  };
  const onMove = (event: PointerEvent) => {
    if (blocked()) return;
    const point = localPoint(event);
    if (!reduced && event.pointerType !== 'touch' && fine.matches) motion.hover({ x: point.x - design.width / 2, y: point.y - design.height / 2 });
    if (motion.dragging && pointerId === event.pointerId) {
      contact = event; motion.move(point, win.performance.now()); lastInput = win.performance.now();
      if (motion.dragged) { root.dataset.gridDragging = 'true'; if (!root.hasPointerCapture(event.pointerId)) { try { root.setPointerCapture(event.pointerId); } catch {} } }
    }
    wake();
  };
  const release = (cancel: boolean) => {
    motion.release(win.performance.now(), cancel, reduced); delete root.dataset.gridDragging;
    const id = pointerId; pointerId = null; contact = null;
    if (id !== null && root.hasPointerCapture(id)) root.releasePointerCapture(id);
    wake();
  };
  viewport.addEventListener('wheel', onWheel, { passive: false, signal: abort.signal });
  viewport.addEventListener('pointerdown', onDown, { signal: abort.signal });
  viewport.addEventListener('pointermove', onMove, { passive: true, signal: abort.signal });
  win.addEventListener('pointermove', event => { if (motion.dragging && !viewport.contains(event.target as Node)) onMove(event); }, { passive: true, signal: abort.signal });
  win.addEventListener('pointerup', event => { if (event.pointerId === pointerId) release(false); }, { signal: abort.signal });
  win.addEventListener('pointercancel', event => { if (event.pointerId === pointerId) release(true); }, { signal: abort.signal });
  // Touch is implicitly captured by the contacted card; moving capture to the
  // root makes that card's lostpointercapture bubble here. Only the root's own
  // loss for the active contact ends the drag.
  root.addEventListener('lostpointercapture', event => { if (event.target === root && event.pointerId === pointerId) release(true); }, { signal: abort.signal });
  win.addEventListener('blur', () => release(true), { signal: abort.signal });
  viewport.addEventListener('pointerleave', () => { motion.hover(null); hovered = null; if (fine.matches) preview.clear(); wake(); }, { signal: abort.signal });
  viewport.addEventListener('dragstart', event => event.preventDefault(), { signal: abort.signal });
  // A held touch's long-press menu cancels the contact (Gecko sends
  // pointercancel), so a pause before dragging would end the gesture. Another
  // input's menu, such as a hybrid device's mouse, is left alone.
  viewport.addEventListener('contextmenu', event => {
    const source = (event as Partial<PointerEvent>).pointerType ?? contact?.pointerType;
    if (contact && contact.pointerType !== 'mouse' && source === contact.pointerType) event.preventDefault();
  }, { signal: abort.signal });
  // The route surface claims link clicks in the body's capture phase; a dragged
  // or catching release must be suppressed before it, whichever card it hits.
  // A touch drag generates no click, so keyboard activation is exempt: it has
  // no pointer type (Gecko still reports detail 1); MouseEvent clicks fall back
  // to their click count.
  win.addEventListener('click', event => {
    const pointerType = (event as Partial<PointerEvent>).pointerType, pointer = pointerType === undefined ? event.detail > 0 : pointerType !== '';
    if (pointer && (event.target === root || viewport.contains(event.target as Node)) && motion.consumeClick()) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, { capture: true, signal: abort.signal });
  items.forEach((item, index) => {
    item.element.addEventListener('pointerenter', () => { hovered = item.element; if (fine.matches) preview.choose(item.element); }, { signal: abort.signal });
    item.element.addEventListener('pointerleave', () => { if (hovered === item.element) { hovered = null; if (fine.matches) preview.clear(); } }, { signal: abort.signal });
    item.element.addEventListener('focus', () => {
      const target = gridTarget(layout, index);
      motion.target.x += wrap(target.x - motion.target.x, layout.extentX); motion.target.y += wrap(target.y - motion.target.y, layout.extentY);
      motion.velocity.x = motion.velocity.y = 0; lastInput = win.performance.now(); wake();
      if (!fine.matches) preview.clear();
    }, { signal: abort.signal });
  });
  const visibility = () => { if (frame) win.cancelAnimationFrame(frame); frame = 0; previousTime = 0; if (doc.hidden) { release(true); preview.suspend(); } else { dirty = true; preview.resume(fine.matches ? hovered : null); wake(); } };
  doc.addEventListener('visibilitychange', visibility, { signal: abort.signal });
  win.addEventListener('resize', () => { win.clearTimeout(resizeTimer); resizeTimer = win.setTimeout(() => { resizeTimer = 0; measuring = true; wake(); }, 150); }, { signal: abort.signal });
  const sync = () => {
    const next = media.matches || uiStore.getState().quietMode;
    if (next !== reduced) { reduced = next; if (reduced) { entryAge = Infinity; motion.hover(null); motion.velocity.x = motion.velocity.y = 0; preview.clear(true); } dirty = true; }
    if (uiStore.getState().menuOpen) { if (frame) win.cancelAnimationFrame(frame); frame = 0; previousTime = 0; release(true); preview.clear(true); }
    else { if (fine.matches && hovered && mayPlay()) preview.choose(hovered); wake(); }
  };
  media.addEventListener('change', sync, { signal: abort.signal });
  const unsubscribe = uiStore.subscribe(sync);
  measure(); paint();
  void (doc.fonts?.ready ?? Promise.resolve()).then(() => { if (!disposed) { arrival.ready(reduced); wake(); } });
  return () => {
    disposed = true; arrival.dispose(); abort.abort(); unsubscribe();
    if (frame) win.cancelAnimationFrame(frame);
    win.clearTimeout(resizeTimer);
    if (pointerId !== null && root.hasPointerCapture(pointerId)) root.releasePointerCapture(pointerId);
    preview.dispose();
    clones.forEach(clone => clone.remove());
    items.slice(0, originals.length).forEach(item => item.card.append(item.caption));
    for (const item of [...saved, ...savedChildren]) { if (item.style === null) item.element.removeAttribute('style'); else item.element.setAttribute('style', item.style); }
    if (originalRootStyle === null) root.removeAttribute('style'); else root.setAttribute('style', originalRootStyle);
    delete root.dataset.gridEnhanced; delete root.dataset.gridReady; delete root.dataset.gridDragging;
  };
}
