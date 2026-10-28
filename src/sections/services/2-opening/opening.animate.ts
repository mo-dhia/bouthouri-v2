import { pixelsToVw, viewportDesign } from "@/lib/viewport-design";
import { createMaskedReveal } from "../masked-reveal";
import { GatePhysics } from "./gate-physics";
import { createGateHand } from "./gate-hand";
import { gateSurface } from "./gate-surface";
import { clamp, glyphFlight, openingScore, range, smooth } from "./opening-score";

/** No RAF here: the page's single presentation owner calls tick. */
export function createServicesOpening(root: HTMLElement, wake: () => void, reduced: boolean) {
  const opening = root.querySelector<HTMLElement>("[data-services-opening]")!;
  const stage = opening.querySelector<HTMLElement>(".services-opening-stage")!;
  const intro = opening.querySelector<HTMLElement>(".services-intro")!;
  const glyph = opening.querySelector<HTMLElement>("[data-rail-glyph]")!;
  const flight = opening.querySelector<SVGSVGElement>(".services-glyph-flight")!;
  const flyingGlyph = flight.querySelector<SVGPathElement>("[data-flying-glyph]")!;
  const clip = flight.querySelector<SVGPathElement>("[data-band-clip]")!;
  const band = flight.querySelector<SVGTextElement>("[data-band-type]")!;
  const scene = opening.querySelector<HTMLElement>(".services-gate-scene")!;
  const handle = scene.querySelector<HTMLButtonElement>(".services-gate-handle")!;
  const payoff = scene.querySelector<HTMLElement>(".services-gate-payoff")!;
  const works = scene.querySelector<HTMLElement>(".services-it-works")!;
  const underlay = scene.querySelector<HTMLElement>(".services-gate-underlay")!;
  const surface = scene.querySelector<SVGSVGElement>("svg")!;
  const cover = surface.querySelector<SVGPathElement>("[data-gate-top]")!;
  const edge = surface.querySelector<SVGPathElement>("[data-gate-top-edge]")!;
  const seam = surface.querySelector<SVGPathElement>("[data-gate-seam]")!;
  const gradient = surface.querySelector<SVGLinearGradientElement>("#gate-edge")!;
  const announcement = scene.querySelector<HTMLElement>("[data-gate-announcement]")!;
  const masks = new Map([...opening.querySelectorAll<HTMLElement>("[data-masked-reveal]")].map((element) => [element.dataset.maskedReveal!, element]));
  const reveals = new Map([...masks].map(([key, element]) => [key, createMaskedReveal(element, .19)]));
  const physics = new GatePhysics(), hand = createGateHand(scene);
  const rtl = root.dataset.locale === "ar";
  let top = 0, total = 1, width = 1920, height = 1080, scale = 1, mobile = false, actualTop = 0;
  let start = 0, introStart = 0, heroEnd = 0, end = 1, introFraction = .5, heroFraction = .5;
  let seedX = 0, seedY = 0, fontScale = 1, textWidth = 0, originX = 0, originY = 0, radius = 90;
  let score = openingScore(0, .5, .5), lastProgress = NaN, clock = 0, lastTickTime = 0, visible = false, interactive = false, announced = false;
  let activePointer: number | null = null, pendingPointer: number | null = null, pendingAge = 0, keyboard = false;
  let pointerX = 0, pointerY = 0, pointerTime = 0, grabScroll = 0, lastScroll = window.scrollY, keyboardX = 0, keyboardY = 0;
  let lastX = 0, lastY = 0, releaseX = 0, releaseY = 0, previousPhase = physics.phase, hover = 0, hoverTarget = 0, dt = 1 / 60;
  let lastTension = -1;
  const hidden = (element: Element, value: boolean) => { element.setAttribute("data-layer-hidden", String(!value)); element.setAttribute("aria-hidden", String(!value)); };
  const reveal = (name: string, value: number) => { masks.get(name)!.style.clipPath = value <= 0 ? "inset(0 0 100% 0)" : "none"; reveals.get(name)!.set(value, reduced); };
  const atScroll = (scroll: number) => openingScore(clamp((scroll - start) / Math.max(1, end - start)), introFraction, heroFraction);
  const localPointer = (x: number, y: number) => { const rect = stage.getBoundingClientRect(); return { x: (x - rect.left) / rect.width, y: (y - rect.top) / rect.height }; };

  function release(cancel = false) {
    pendingPointer = null; pendingAge = 0; physics.release(cancel); handle.dataset.held = "false"; keyboard = false;
    const pointer = activePointer; activePointer = null;
    if (pointer !== null && handle.hasPointerCapture(pointer)) handle.releasePointerCapture(pointer);
    wake();
  }
  function begin(pointer: number, touch: boolean) {
    if (!interactive || !physics.begin(touch, localPointer(pointerX, pointerY))) return;
    activePointer = pointer; pendingPointer = null; grabScroll = window.scrollY;
    try { handle.setPointerCapture(pointer); } catch { activePointer = null; physics.release(true); return; }
    handle.dataset.held = "true"; wake();
  }
  const down = (event: PointerEvent) => {
    if (event.button !== 0 || !atScroll(window.scrollY).gate.interactive || physics.committed || activePointer !== null || pendingPointer !== null) return;
    interactive = true; pointerX = event.clientX; pointerY = event.clientY; pointerTime = event.timeStamp;
    if (event.pointerType === "touch" || reduced) { pendingPointer = event.pointerId; pendingAge = 0; wake(); }
    else { begin(event.pointerId, false); event.preventDefault(); }
  };
  const move = (event: PointerEvent) => {
    if (pendingPointer === event.pointerId) { if (Math.hypot(event.clientX - pointerX, event.clientY - pointerY) > 8) { pendingPointer = null; pendingAge = 0; } return; }
    if (event.pointerId !== activePointer) return;
    const local = localPointer(event.clientX, event.clientY);
    physics.pullVector((local.x - physics.grabOrigin.x) * width / radius, (local.y - physics.grabOrigin.y) * height / radius, (event.timeStamp - pointerTime) / 1000);
    pointerTime = event.timeStamp; event.preventDefault(); wake();
  };
  const up = (event: PointerEvent) => {
    if (event.pointerId === pendingPointer) { pendingPointer = null; if (reduced) { physics.openDirect(); wake(); } return; }
    if (event.pointerId === activePointer) { move(event); release(); }
  };
  const cancel = (event?: PointerEvent) => { if (!event || event.pointerId === activePointer || event.pointerId === pendingPointer) release(true); };
  const cancelAll = () => release(true);
  const blur = () => { if (keyboard) release(true); };
  const hiddenDocument = () => { if (document.hidden) release(true); };
  const touchMove = (event: TouchEvent) => { if (activePointer !== null && physics.touch) event.preventDefault(); };
  const hoverMove = (event: PointerEvent) => {
    if (!interactive || event.pointerType === "touch") return;
    const rect = stage.getBoundingClientRect(); hoverTarget = smooth(1 - Math.hypot((event.clientX - rect.left) / scale - originX, (event.clientY - rect.top) / scale - originY) / (mobile ? 100 : 180)); wake();
  };
  const leave = () => { hoverTarget = 0; if (pendingPointer !== null) pendingPointer = null; wake(); };
  const key = (event: KeyboardEvent) => {
    if (event.key === "Escape") { release(true); return; }
    if (!interactive || !["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Enter", " "].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "Enter" || event.key === " ") { if (keyboard) release(); else { physics.openDirect(); wake(); } return; }
    if (!keyboard) { if (!physics.begin(false, { x: originX / width, y: originY / height })) return; keyboard = true; grabScroll = window.scrollY; keyboardX = physics.position.x; keyboardY = physics.position.y; handle.dataset.held = "true"; }
    if (event.key === "ArrowRight") keyboardX += .24;
    if (event.key === "ArrowLeft") keyboardX -= .24;
    if (event.key === "ArrowDown") keyboardY += .24;
    if (event.key === "ArrowUp") keyboardY -= .24;
    keyboardX = clamp(keyboardX, -2, 2); keyboardY = clamp(keyboardY, -2, 2); physics.pullVector(keyboardX, keyboardY, 1 / 30); wake();
  };
  function reset() { release(true); physics.reset(); physics.grabOrigin = { x: originX / width, y: originY / height }; lastX = releaseX = originX; lastY = releaseY = originY; previousPhase = "idle"; hover = hoverTarget = 0; announced = false; announcement.textContent = ""; lastTension = -1; }

  function drawGate() {
    const geometry = gateSurface(physics, width, height, radius), completed = physics.completed;
    cover.setAttribute("d", geometry.cover); edge.setAttribute("d", geometry.lip); seam.setAttribute("d", geometry.hole);
    edge.style.opacity = String(.24 + .3 * physics.tension); edge.setAttribute("transform", `translate(${-1.5 * Math.cos(geometry.angle)},${-1.5 * Math.sin(geometry.angle)})`);
    const span = width * (.05 + .08 * physics.tension + (completed ? .6 * geometry.progress : 0));
    gradient.setAttribute("x1", String(geometry.cx - span)); gradient.setAttribute("x2", String(geometry.cx + span)); gradient.setAttribute("y1", String(geometry.cy - 30)); gradient.setAttribute("y2", String(geometry.cy + 30));
    seam.style.opacity = String(.08 + .14 * hover + .4 * physics.tension + (completed ? .3 * (1 - geometry.progress) : 0));
    let x = originX + physics.position.x * radius, y = originY + physics.position.y * radius;
    if (completed) { if (previousPhase === "releasing") { releaseX = lastX; releaseY = lastY; } x = releaseX; y = releaseY; } else { lastX = x; lastY = y; }
    const vector = completed ? physics.releaseVector : physics.position;
    hand.render({ x, y, originX, originY, contactX: physics.grabOrigin.x * width + physics.position.x * radius, contactY: physics.grabOrigin.y * height + physics.position.y * radius, releaseX, releaseY, vectorX: vector.x, vectorY: vector.y, width, height, rtl, mobile, quiet: reduced, tension: physics.tension, q: physics.q, clock, age: physics.age, openingAge: physics.openingAge, phase: physics.phase, entry: score.gate.entry, dt, scale, viewportWidth: window.innerWidth });
    previousPhase = physics.phase;
    const payoffProgress = range(physics.openingAge, 1.5, 2.5), retreat = smooth(range(physics.openingAge, 1.25, 2.05));
    works.style.transform = `translate3d(${pixelsToVw(2 * physics.surface.x * scale, window.innerWidth)},${pixelsToVw((-.205 * height * retreat + 3 * physics.surface.y) * scale, window.innerWidth)},0) scale(${1 - retreat * (mobile ? .68 : .77)})`;
    hidden(payoff, payoffProgress > 0); reveal("service-payoff", payoffProgress); underlay.setAttribute("aria-hidden", String(!completed));
  }
  function drawScore(next: ReturnType<typeof openingScore>) {
    score = next; hidden(intro, score.intro.visible); hidden(flight, score.glyph.visible); hidden(scene, score.gate.visible); flight.setAttribute("aria-hidden", "true");
    scene.style.clipPath = `inset(${(1 - score.gate.entry) * 49.9}% 0 ${(1 - score.gate.entry) * 49.9}% 0)`;
    reveal("service-label", score.intro.label); reveal("service-title", score.intro.title); reveal("service-second", score.intro.second); reveal("service-copy", score.intro.copy);
    intro.style.transform = `translate3d(0,${pixelsToVw(-score.intro.withdraw * (reduced ? 4 : 22) * scale, window.innerWidth)},0)`; glyph.style.color = score.glyph.owner === "dom" ? "" : "transparent";
    const shape = glyphFlight(score.chapter, { width, height, mobile, rtl, quiet: reduced, seedX, seedY, fontScale, textWidth });
    flyingGlyph.setAttribute("d", shape.d); if (shape.transform) flyingGlyph.setAttribute("transform", shape.transform); else flyingGlyph.removeAttribute("transform");
    clip.setAttribute("d", shape.clipD); band.setAttribute("x", String(shape.textX)); band.setAttribute("y", String(shape.bandY + (1 - shape.textIn) * shape.bandHeight * 1.7 - shape.textOut * shape.bandHeight * 1.7)); band.style.display = score.band.visible ? "" : "none";
    interactive = score.gate.interactive && !physics.committed; handle.disabled = !interactive; handle.hidden = !interactive;
    opening.dataset.progress = String(score.chapter); opening.dataset.openingProgress = String(score.progress); opening.dataset.openingOwner = score.owner; opening.dataset.glyphOwner = score.glyph.owner;
  }
  function publish() {
    opening.dataset.gateState = physics.phase; opening.dataset.grabOrigin = JSON.stringify(physics.grabOrigin); opening.dataset.pullVector = JSON.stringify(physics.position); opening.dataset.gateTension = physics.tension.toFixed(3); opening.dataset.gateArmed = String(physics.armed);
    if (Math.abs(physics.tension - lastTension) > .02) { lastTension = physics.tension; physics.events.push({ type: "tension", strength: lastTension }); }
    for (const event of physics.events.splice(0)) opening.dispatchEvent(new CustomEvent("services-gate", { detail: event }));
    if (physics.phase === "resolved" && !announced) { announcement.textContent = announcement.dataset.message ?? ""; announced = true; }
  }
  handle.addEventListener("pointerdown", down); window.addEventListener("pointermove", move, { passive: false }); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", cancel); handle.addEventListener("lostpointercapture", cancel); stage.addEventListener("pointermove", hoverMove, { passive: true }); stage.addEventListener("pointerleave", leave); handle.addEventListener("keydown", key); handle.addEventListener("blur", blur); handle.addEventListener("touchmove", touchMove, { passive: false }); window.addEventListener("blur", cancelAll); window.addEventListener("portfolio-route-start", cancelAll); document.addEventListener("visibilitychange", hiddenDocument);

  return {
    measure() {
      const design = viewportDesign(window.innerWidth), rect = stage.getBoundingClientRect(), nextScale = rect.width / design.width;
      if (Math.abs(rect.width - width * scale) > 1 || Math.abs(rect.height - height * scale) > 1) { release(true); physics.suspend(); }
      physics.reduced = reduced; scale = nextScale; width = design.width; height = rect.height / scale; mobile = design.key !== "desktop";
      hidden(intro, true); hidden(scene, true); hidden(flight, true); band.style.display = ""; band.style.removeProperty("font-size"); intro.style.transform = "none";
      reveals.forEach((entry) => entry.measure()); reveal("service-title", 1); reveal("service-second", 1);
      const baseline = document.createElement("span"); baseline.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline"; glyph.appendChild(baseline);
      const stageRect = stage.getBoundingClientRect(), glyphRect = glyph.getBoundingClientRect(), baselineY = baseline.getBoundingClientRect().top; baseline.remove();
      const hero = root.querySelector<HTMLElement>(".practice-opening")!.getBoundingClientRect();
      top = opening.getBoundingClientRect().top + window.scrollY; actualTop = stageRect.left; total = opening.offsetHeight;
      start = hero.top + window.scrollY; introStart = top - .18 * height * scale; heroEnd = hero.bottom + window.scrollY; end = top + Math.max(1, total - height * scale);
      introFraction = clamp((introStart - start) / Math.max(1, end - start)); heroFraction = clamp((heroEnd - start) / Math.max(1, end - start));
      opening.dataset.readingStart = String(introStart + .2875 * (end - introStart));
      fontScale = parseFloat(getComputedStyle(glyph).fontSize) / scale / 1000; seedX = (glyphRect.left - stageRect.left) / scale; seedY = (baselineY - stageRect.top) / scale;
      // SVG CSS font sizes already carry width scaling. Normalize their length once.
      textWidth = band.getComputedTextLength() / scale; originX = width * (rtl ? .48 : .52); originY = .52 * height; radius = mobile ? 66 : Math.min(100, .075 * width);
      if (!physics.committed) { physics.grabOrigin = { x: originX / width, y: originY / height }; lastX = releaseX = originX; lastY = releaseY = originY; }
      flight.setAttribute("viewBox", `0 0 ${width} ${height}`); surface.setAttribute("viewBox", `0 0 ${width} ${height}`);
      // This CSS px is an SVG USER-SPACE length, not a DOM screen length:
      // viewBox=referenceWidth/referenceHeight scales this text with its path.
      // Normalizing the inherited physical vw font once prevents double scaling.
      band.style.fontSize = `${parseFloat(getComputedStyle(band).fontSize) / scale}px`;
      const current = atScroll(window.scrollY); if (current.gate.reset) reset(); drawScore(current); drawGate(); publish(); lastProgress = current.progress;
    },
    tick(seconds: number, delta: number, scroll: number) {
      dt = delta; const next = atScroll(scroll), changed = next.progress !== lastProgress, onScreen = scroll + window.innerHeight > top && scroll < top + total;
      if ((activePointer !== null || keyboard) && (!next.gate.interactive || Math.abs(scroll - grabScroll) > Math.max(48, .08 * height * scale))) release(true);
      if (pendingPointer !== null && Math.abs(scroll - lastScroll) > 4) { pendingPointer = null; pendingAge = 0; } lastScroll = scroll;
      if (changed) { drawScore(next); lastProgress = next.progress; }
      if (next.gate.reset && (physics.phase !== "idle" || announced)) reset();
      if (!onScreen) { if (visible) { release(true); physics.suspend(); drawGate(); publish(); } visible = false; lastTickTime = 0; interactive = false; handle.disabled = true; handle.hidden = true; return { score: next, active: false }; }
      // The source clock advances during a still, visible intro. Account for that
      // interval on the next input without scheduling invisible hand frames.
      clock += visible && lastTickTime ? Math.max(0, seconds - lastTickTime) : Math.min(delta, .05);
      visible = true; lastTickTime = seconds; interactive = next.gate.interactive && !physics.committed; handle.disabled = !interactive; handle.hidden = !interactive;
      if (pendingPointer !== null && (pendingAge += delta) >= .17 && !reduced) begin(pendingPointer, true);
      let evolving = false;
      if (next.gate.visible) { evolving = physics.phase !== "resolved" || physics.openingAge < 3; if (evolving) physics.advance(delta); hover += (hoverTarget - hover) * (1 - Math.exp(-12 * delta)); if (evolving || changed || Math.abs(hoverTarget - hover) > .0001) drawGate(); }
      else if (changed) drawGate();
      publish();
      return { score: next, active: pendingPointer !== null || (next.gate.visible && (!reduced || evolving && physics.phase !== "idle" || Math.abs(hoverTarget - hover) > .0001)) };
    },
    pause() { lastTickTime = 0; },
    suspend() { lastTickTime = 0; release(true); physics.suspend(); drawGate(); publish(); },
    dispose() {
      release(true); handle.removeEventListener("pointerdown", down); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", cancel); handle.removeEventListener("lostpointercapture", cancel); stage.removeEventListener("pointermove", hoverMove); stage.removeEventListener("pointerleave", leave); handle.removeEventListener("keydown", key); handle.removeEventListener("blur", blur); handle.removeEventListener("touchmove", touchMove); window.removeEventListener("blur", cancelAll); window.removeEventListener("portfolio-route-start", cancelAll); document.removeEventListener("visibilitychange", hiddenDocument);
      reveals.forEach((entry) => entry.dispose()); hand.dispose(); glyph.style.removeProperty("color"); handle.disabled = true; handle.hidden = true;
      for (const element of opening.querySelectorAll<HTMLElement | SVGElement>("[style]")) element.removeAttribute("style");
      for (const element of opening.querySelectorAll("[data-layer-hidden]")) { element.removeAttribute("data-layer-hidden"); if (element !== flight) element.removeAttribute("aria-hidden"); }
      for (const name of ["readingStart", "progress", "openingProgress", "openingOwner", "glyphOwner", "gateState", "grabOrigin", "pullVector", "gateTension", "gateArmed"]) delete opening.dataset[name];
    },
    get geometry() { return { top, total, width, height, scale, actualTop }; },
  };
}
