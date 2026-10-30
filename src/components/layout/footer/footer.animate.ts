import { playMaterialSound, setFooterFriction } from "@/lib/audio/material-audio";
import { markPieces, setMarkPose } from "../header/identity-mark";
import { createMaterialProtectionPublisher } from "../header/material-protection";
import {
  eatFrame,
  footerDurations,
  footerHome,
  footerLetters,
  footerLip,
  footerRipple,
  footerSolo,
  footerSoloSteps,
  footerViewBox,
  letterTransform,
  placeTransform,
  soloFrame,
  spitFrame,
  withJaw,
  wordFrame,
  type FooterFrame,
} from "./footer-mark";

export type FooterMark = {
  reset(): void;
  setActive(active: boolean): void;
  dispose(): void;
};

type Phase = "word" | "eat" | "solo" | "spit";
type Spring = { x: number; y: number; r: number; vx: number; vy: number; vr: number };
type Held = {
  id: number;
  index: number;
  touch: boolean;
  at: number;
  startX: number;
  startY: number;
  clientX: number;
  clientY: number;
  moved: number;
};

/** Element 0 is the b; 1..8 the letters. Centres sit on the ink's middle. */
const centres = [footerHome.x, ...footerLetters.map((letter) => letter.x + letter.w / 2)];
const boxes = [{ x: 0, w: 200 }, ...footerLetters.map((letter) => ({ x: letter.x, w: letter.w }))];
const pullLimit = 70;
const pullShare = [1, 0.35, 0.12];
const hoverRadius = 300;
/** A cursor that has rested this long over the word no longer holds the loop. */
const hoverIdle = 1600;
const svgNS = "http://www.w3.org/2000/svg";

/**
 * Drives the footer wordmark: holds on the word, then the b eats it, reads
 * the three scripts alone and spits it back. Pointer and keyboard keep the
 * old grab: letters lean toward a hovering cursor, a grabbed letter stretches
 * after it and springs back, and a pull past the threshold, a tap, a click or
 * Enter feeds the word to the b. One RAF owns every write; holds wait on timers.
 */
export function mountFooterMark(root: HTMLElement, reduced: () => boolean): FooterMark | undefined {
  const mask = root.querySelector<HTMLElement>("[data-footer-grab]");
  const word = root.querySelector<HTMLElement>("[data-footer-word]");
  const svg = root.querySelector<SVGSVGElement>("[data-footer-svg]");
  const mark = svg?.querySelector<SVGGElement>("[data-footer-mark]");
  const pieces = markPieces
    .map((name) => mark?.querySelector(`[data-footer-piece="${name}"]`))
    .filter((piece): piece is Element => !!piece);
  const lettering = svg?.querySelector<SVGGElement>("[data-footer-letters]");
  const letters = svg ? Array.from(svg.querySelectorAll<SVGGElement>("[data-footer-letter]")) : [];
  const ripples = svg ? Array.from(svg.querySelectorAll<SVGCircleElement>("[data-footer-ripple]")) : [];
  if (!mask || !word || !svg || !mark || !lettering || pieces.length !== markPieces.length || letters.length !== footerLetters.length)
    return undefined;

  /* While the b eats and spits, letters inside its bowl or left of it are behind its lips. */
  const defs = document.createElementNS(svgNS, "defs"),
    mouth = document.createElementNS(svgNS, "mask"),
    lips = document.createElementNS(svgNS, "g"),
    bowl = document.createElementNS(svgNS, "circle"),
    behind = document.createElementNS(svgNS, "rect"),
    open = document.createElementNS(svgNS, "rect");
  mouth.id = `footer-mouth-${Math.random().toString(36).slice(2, 10)}`;
  mouth.setAttribute("maskUnits", "userSpaceOnUse");
  [mouth, open].forEach((element) => {
    element.setAttribute("x", "-4000");
    element.setAttribute("y", "-4000");
    element.setAttribute("width", "8000");
    element.setAttribute("height", "8000");
  });
  open.setAttribute("fill", "#fff");
  bowl.setAttribute("r", String(footerLip));
  behind.setAttribute("x", "-4000");
  behind.setAttribute("y", "-4000");
  behind.setAttribute("width", "4000");
  behind.setAttribute("height", "8000");
  lips.setAttribute("fill", "#000");
  lips.append(bowl, behind);
  mouth.append(open, lips);
  defs.append(mouth);
  svg.prepend(defs);

  const protect = createMaterialProtectionPublisher(root);
  const springs: Spring[] = centres.map(() => ({ x: 0, y: 0, r: 0, vx: 0, vy: 0, vr: 0 }));
  const targets = centres.map(() => ({ x: 0, y: 0, r: 0 }));
  let active = false,
    disposed = false,
    phase: Phase = "word",
    phaseStart = 0,
    holdUntil = 0,
    soloIndex = 0,
    rippleAt = -Infinity,
    primed = 0,
    jaw = 0,
    bites = 0,
    shots = 0,
    frameId = 0,
    last = 0,
    hoverAt = 0,
    hiddenAt = 0,
    paused = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let held: Held | undefined;
  let hover: { x: number; y: number } | undefined;

  /** Clock that stops while the document is hidden. */
  const clock = (now = performance.now()) => now - paused;

  const setMode = () => {
    mask.dataset.mode = !active || phase === "word" ? "word" : phase === "solo" ? "mark" : "busy";
    mask.dataset.grabbable = String(active && phase === "word");
    mask.dataset.held = String(!!held && !held.touch);
  };

  const ripple = (now: number) => {
    ripples.forEach((circle, i) => {
      const p = (now - rippleAt - footerRipple.delays[i] * 1000) / (footerRipple.life * 1000);
      if (p < 0 || p >= 1) {
        if (circle.getAttribute("opacity") !== "0") circle.setAttribute("opacity", "0");
        return;
      }
      circle.setAttribute("cx", String(footerSolo.x));
      circle.setAttribute("cy", String(footerSolo.y));
      circle.setAttribute("r", (footerRipple.radius + footerRipple.spread * (1 - (1 - p) ** 3)).toFixed(2));
      circle.setAttribute("opacity", (0.5 * (1 - p)).toFixed(3));
      circle.setAttribute("stroke-width", (2.2 * (1 - p) + 0.4).toFixed(2));
    });
  };
  const rippling = (now: number) => now - rippleAt < (footerRipple.delays[footerRipple.delays.length - 1] + footerRipple.life) * 1000;

  const write = (frame: FooterFrame, eating = false) => {
    const b = springs[0],
      place = placeTransform({ x: frame.place.x + b.x, y: frame.place.y + b.y, s: frame.place.s }, b.r);
    mark.setAttribute("transform", place);
    if (eating) {
      lips.setAttribute("transform", place);
      lettering.setAttribute("mask", `url(#${mouth.id})`);
    } else lettering.removeAttribute("mask");
    setMarkPose(pieces, frame.pose);
    letters.forEach((letter, i) => {
      const pose = frame.letters[i],
        offset = springs[i + 1];
      letter.setAttribute(
        "transform",
        letterTransform({ ...pose, x: pose.x + offset.x, y: pose.y + offset.y, r: pose.r + offset.r }, footerLetters[i].w),
      );
    });
  };

  /** Client pixels → wordmark units, through the SVG's meet fit. */
  const toWord = (clientX: number, clientY: number) => {
    const rect = svg.getBoundingClientRect(),
      scale = Math.min(rect.width / footerViewBox.width, rect.height / footerViewBox.height) || 1;
    return {
      x: footerViewBox.x + (clientX - rect.left - (rect.width - footerViewBox.width * scale) / 2) / scale,
      y: footerViewBox.y + (clientY - rect.top - (rect.height - footerViewBox.height * scale) / 2) / scale,
      scale,
    };
  };
  const nearest = (x: number) => {
    let index = 0,
      best = Infinity;
    boxes.forEach((box, i) => {
      const distance = Math.max(box.x - x, 0, x - box.x - box.w);
      if (distance < best) {
        best = distance;
        index = i;
      }
    });
    return index;
  };
  /** Old pull threshold: a quarter of the glyph height, 24–64 px. */
  const threshold = (scale: number) => Math.max(24, Math.min(64, 0.24 * 300 * scale));

  const aim = () => {
    targets.forEach((target) => {
      target.x = 0;
      target.y = 0;
      target.r = 0;
    });
    if (!active || phase !== "word") return 0;
    if (held) {
      const point = toWord(held.clientX, held.clientY),
        dx = point.x - held.startX,
        dy = point.y - held.startY,
        length = Math.hypot(dx, dy);
      if (length > 0.01) {
        const reach = pullLimit * (1 - Math.exp(-length / pullLimit));
        targets.forEach((target, i) => {
          const share = pullShare[Math.abs(i - held!.index)] ?? 0;
          target.x = (dx / length) * reach * share;
          target.y = (dy / length) * reach * share;
          target.r = Math.max(-9, Math.min(9, dx * 0.06)) * share;
        });
      }
      return 4 + 12 * Math.min(1, (length * point.scale) / threshold(point.scale));
    }
    if (hover) {
      const point = toWord(hover.x, hover.y);
      targets.forEach((target, i) => {
        const dx = point.x - centres[i],
          dy = point.y + 50,
          weight = Math.exp(-((dx * dx + dy * dy) / (hoverRadius * hoverRadius)));
        target.x = dx * 0.07 * weight;
        target.y = dy * 0.07 * weight;
        target.r = Math.max(-4, Math.min(4, (dx / hoverRadius) * 5 * weight));
      });
    }
    return 0;
  };

  /** Springs toward the aims; returns true while anything still moves. */
  const settle = (dt: number, jawAim: number) => {
    let moving = false;
    const steps = Math.max(1, Math.ceil(dt / (1 / 120))),
      h = dt / steps;
    springs.forEach((spring, i) => {
      const grabbed = held?.index === i,
        k = grabbed ? 900 : 300,
        c = grabbed ? 55 : 19,
        target = targets[i];
      for (let s = 0; s < steps; s++) {
        spring.vx += (k * (target.x - spring.x) - c * spring.vx) * h;
        spring.vy += (k * (target.y - spring.y) - c * spring.vy) * h;
        spring.vr += (k * (target.r - spring.r) - c * spring.vr) * h;
        spring.x += spring.vx * h;
        spring.y += spring.vy * h;
        spring.r += spring.vr * h;
      }
      if (
        Math.abs(target.x - spring.x) + Math.abs(target.y - spring.y) + Math.abs(target.r - spring.r) > 0.03 ||
        Math.abs(spring.vx) + Math.abs(spring.vy) + Math.abs(spring.vr) > 0.03
      )
        moving = true;
      else {
        spring.x = target.x;
        spring.y = target.y;
        spring.r = target.r;
        spring.vx = spring.vy = spring.vr = 0;
      }
    });
    jaw += (jawAim - jaw) * (1 - Math.exp(-dt * 14));
    if (Math.abs(jawAim - jaw) > 0.05) moving = true;
    else jaw = jawAim;
    return moving;
  };

  const cancel = () => {
    cancelAnimationFrame(frameId);
    clearTimeout(timer);
    frameId = 0;
    timer = undefined;
  };
  const request = () => {
    if (!active || disposed || document.hidden || frameId) return;
    clearTimeout(timer);
    timer = undefined;
    frameId = requestAnimationFrame(frame);
  };
  const wait = (until: number) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      request();
    }, Math.max(0, until - clock()));
  };

  /** The word only goes once it is fully in view and nobody is handling it. */
  const ready = () => {
    if (held || (hover && performance.now() - hoverAt < hoverIdle)) return false;
    const box = mask.getBoundingClientRect(),
      ink = word.getBoundingClientRect();
    return (
      ink.height > 0 &&
      Math.abs(ink.top - box.top) < 0.02 * ink.height &&
      box.top < innerHeight - 0.3 * box.height &&
      box.bottom > 0.3 * box.height
    );
  };

  const eat = (now: number) => {
    phase = "eat";
    phaseStart = now;
    primed = jaw;
    jaw = 0;
    bites = 0;
    setMode();
  };
  const activate = () => {
    if (!active || phase !== "word") return false;
    playMaterialSound("click");
    eat(clock());
    request();
    return true;
  };
  const next = () => {
    if (!active || phase !== "solo" || footerSoloSteps[soloIndex].id.length > 1) return;
    phaseStart = clock() - footerSoloSteps[soloIndex].dur;
    request();
  };

  function frame(raf: number) {
    frameId = 0;
    if (!active || disposed) return;
    const now = clock(raf),
      dt = Math.min(1 / 30, Math.max(0, (raf - last) / 1000));
    last = raf;
    let view: FooterFrame;
    let animating = false;
    if (phase === "word" && now >= holdUntil) {
      if (ready()) eat(holdUntil < now - 100 ? now : holdUntil);
      else holdUntil = now + 1200;
    }
    if (phase === "eat") {
      const t = (now - phaseStart) / footerDurations.eat;
      if (t >= 1) {
        phase = "solo";
        soloIndex = 0;
        phaseStart += footerDurations.eat;
        setMode();
      } else {
        const eaten = eatFrame(t, primed);
        if (eaten.bites > bites) playMaterialSound("hover");
        bites = eaten.bites;
        view = eaten;
        animating = true;
      }
    }
    if (phase === "solo") {
      let guard = 0;
      while (now - phaseStart >= footerSoloSteps[soloIndex].dur && guard++ < 12) {
        phaseStart += footerSoloSteps[soloIndex].dur;
        soloIndex++;
        if (soloIndex >= footerSoloSteps.length) {
          phase = "spit";
          shots = 0;
          setMode();
          break;
        }
        if (footerSoloSteps[soloIndex].lock) rippleAt = phaseStart;
      }
      if (phase === "solo") {
        const step = footerSoloSteps[soloIndex];
        view = soloFrame(soloIndex, Math.min(1, (now - phaseStart) / step.dur));
        animating = step.id.length > 1;
      }
    }
    if (phase === "spit") {
      const t = (now - phaseStart) / footerDurations.spit;
      if (t >= 1) {
        phase = "word";
        holdUntil = phaseStart + footerDurations.spit + footerDurations.hold;
        setMode();
      } else {
        const spat = spitFrame(t);
        if (spat.shots > shots) playMaterialSound("hover");
        shots = spat.shots;
        view = spat;
        animating = true;
      }
    }
    const jawAim = aim();
    const moving = settle(dt, jawAim);
    if (phase === "word") {
      const rest = wordFrame();
      view = jaw ? { ...rest, pose: withJaw(rest.pose, jaw) } : rest;
    }
    write(view!, phase === "eat" || phase === "spit");
    ripple(now);
    if (animating || moving || rippling(now)) frameId = requestAnimationFrame(frame);
    else if (phase === "word") wait(holdUntil);
    else if (phase === "solo") wait(phaseStart + footerSoloSteps[soloIndex].dur);
  }

  const start = () => {
    const now = clock();
    phase = "word";
    holdUntil = now + footerDurations.first;
    last = performance.now();
    setMode();
    request();
  };
  const reset = () => {
    cancel();
    if (held) release(false);
    hover = undefined;
    phase = "word";
    rippleAt = -Infinity;
    jaw = primed = 0;
    springs.forEach((spring) => {
      spring.x = spring.y = spring.r = spring.vx = spring.vy = spring.vr = 0;
    });
    write(wordFrame());
    ripple(clock());
    protect({ source: "footer", active: false, pressureScale: 1, influence: 0, clientX: 0, clientY: 0 });
    setMode();
    if (active) start();
  };
  const setActive = (value: boolean) => {
    const next = value && !reduced() && !disposed;
    if (next === active) return;
    active = next;
    reset();
  };

  /* Input. Hover is for fine pointers; touch taps; everyone may pull. */
  const fine = (event: PointerEvent) => event.pointerType === "mouse" || event.pointerType === "pen";
  const shield = (event: PointerEvent, on: boolean) =>
    protect({ source: "footer", active: on, pressureScale: 1, influence: on ? 0.75 : 0, clientX: event.clientX, clientY: event.clientY });
  const onEnter = (event: PointerEvent) => {
    if (!active || !fine(event)) return;
    hover = { x: event.clientX, y: event.clientY };
    hoverAt = performance.now();
    shield(event, true);
    request();
  };
  const onMove = (event: PointerEvent) => {
    if (!active) return;
    if (held && event.pointerId === held.id) {
      const step = Math.hypot(event.clientX - held.clientX, event.clientY - held.clientY);
      held.moved += step;
      held.clientX = event.clientX;
      held.clientY = event.clientY;
      const point = toWord(event.clientX, event.clientY),
        pull = Math.hypot(point.x - held.startX, point.y - held.startY) * point.scale;
      setFooterFriction(Math.min(1, pull / threshold(point.scale)), Math.min(1, step / 24), event.clientX / innerWidth - 0.5);
    }
    if (fine(event)) {
      hover = { x: event.clientX, y: event.clientY };
      hoverAt = performance.now();
    }
    shield(event, true);
    request();
  };
  const onLeave = (event: PointerEvent) => {
    if (held && event.pointerId === held.id) return;
    hover = undefined;
    shield(event, false);
    request();
  };
  const onDown = (event: PointerEvent) => {
    if (!active || event.button !== 0 || held) return;
    if (phase === "solo") {
      event.preventDefault();
      next();
      return;
    }
    if (phase !== "word") return;
    const point = toWord(event.clientX, event.clientY);
    held = {
      id: event.pointerId,
      index: nearest(point.x),
      touch: event.pointerType === "touch",
      at: performance.now(),
      startX: point.x,
      startY: point.y,
      clientX: event.clientX,
      clientY: event.clientY,
      moved: 0,
    };
    if (!held.touch) {
      event.preventDefault();
      try {
        mask.setPointerCapture(event.pointerId);
      } catch {}
    }
    setMode();
    shield(event, true);
    request();
  };
  /** Ends a hold; a pull past the threshold, a click or a tap feeds the word. */
  function release(feed: boolean) {
    if (!held) return;
    const { id, touch } = held;
    held = undefined;
    if (!touch && mask!.hasPointerCapture?.(id)) mask!.releasePointerCapture(id);
    setMode();
    if (feed) activate();
    else request();
  }
  const onUp = (event: PointerEvent) => {
    if (!held || event.pointerId !== held.id) return;
    const point = toWord(event.clientX, event.clientY),
      pull = Math.hypot(point.x - held.startX, point.y - held.startY) * point.scale,
      quick = performance.now() - held.at < 650 && held.moved < 10;
    release(pull >= threshold(point.scale) || quick);
  };
  const onCancel = (event: PointerEvent) => {
    if (held && event.pointerId === held.id) release(false);
  };
  const onKey = (event: KeyboardEvent) => {
    if (!active) return;
    if (event.key === "Escape" && held) {
      release(false);
      return;
    }
    if (event.key !== "Enter" && event.key !== " ") return;
    if (phase === "word" && activate()) event.preventDefault();
    else if (phase === "solo") {
      event.preventDefault();
      next();
    }
  };
  const onBlur = () => release(false);
  const onVisibility = () => {
    if (document.hidden) {
      hiddenAt = performance.now();
      cancel();
      return;
    }
    if (hiddenAt) paused += performance.now() - hiddenAt;
    hiddenAt = 0;
    last = performance.now();
    request();
  };
  const onRoute = () => reset();

  mask.addEventListener("pointerenter", onEnter);
  mask.addEventListener("pointermove", onMove, { passive: true });
  mask.addEventListener("pointerleave", onLeave);
  mask.addEventListener("pointerdown", onDown);
  mask.addEventListener("pointerup", onUp);
  mask.addEventListener("pointercancel", onCancel);
  mask.addEventListener("lostpointercapture", onCancel);
  mask.addEventListener("keydown", onKey);
  mask.addEventListener("blur", onBlur);
  window.addEventListener("blur", onBlur);
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("portfolio-route-start", onRoute);
  setMode();

  return {
    reset,
    setActive,
    dispose() {
      if (disposed) return;
      active = false;
      reset();
      disposed = true;
      defs.remove();
      mask.removeEventListener("pointerenter", onEnter);
      mask.removeEventListener("pointermove", onMove);
      mask.removeEventListener("pointerleave", onLeave);
      mask.removeEventListener("pointerdown", onDown);
      mask.removeEventListener("pointerup", onUp);
      mask.removeEventListener("pointercancel", onCancel);
      mask.removeEventListener("lostpointercapture", onCancel);
      mask.removeEventListener("keydown", onKey);
      mask.removeEventListener("blur", onBlur);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("portfolio-route-start", onRoute);
      delete mask.dataset.mode;
      delete mask.dataset.grabbable;
      delete mask.dataset.held;
    },
  };
}
