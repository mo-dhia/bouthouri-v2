import {
  playMaterialSound,
  setFooterFriction,
} from "@/lib/audio/material-audio";
import { FooterPaths, footerPartMap } from "./footer-paths";
import { footerGlyphBoxes } from "./footer-geometry";
import { FooterThoughts } from "./footer-thoughts";
import {
  createIdleTargets,
  elasticWeight,
  FooterIdleEpisodes,
  FooterRefractionWaves,
  type MaterialContours,
} from "./footer-material-field";
import { emitMaterialProtection } from "../header/material-protection";
import { designScale } from "@/lib/viewport-design";

export type FooterMaterial = {
  measure: () => void;
  resizeViewport: () => void;
  reset: () => void;
  setActive: (value: boolean) => void;
  dispose: () => void;
};
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ease = (n: number) => {
  const t = clamp(n);
  return t * t * t * (t * (6 * t - 15) + 10);
};
const thoughts = {
  en: [
    ["PERSPECTIVE", "A detail means more\nwhen you see what surrounds it."],
    ["CLARITY", "Less to untangle.\nMore to understand."],
    ["DIRECTION", "Choose what matters.\nThen move it forward."],
  ],
  ar: [
    ["منظور", "تتضح التفاصيل\nحين ترى مكانها في الصورة"],
    ["وضوح", "حين يقل التعقيد\nيتضح المعنى"],
    ["اتجاه", "حدد ما يهم\nواجعله نقطة البداية"],
  ],
};

/** Native outline morph: the fitted Questrial wordmark becomes the three identity parts. */
export function mountFooterMaterial(
  root: HTMLElement,
  reduced: () => boolean,
): FooterMaterial {
  const mask = root.querySelector<HTMLElement>(
    "[data-footer-grab],.footer-word-mask",
  )!;
  const word = root.querySelector<HTMLElement>(
    "[data-footer-word],.footer-word-text",
  )!;
  const announcement = root.querySelector<HTMLElement>("[data-footer-thought]");
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.dataset.footerMaterial = "native-paths";
  canvas.style.cssText =
    "position:fixed;inset:0;inline-size:100%;block-size:100%;pointer-events:none;z-index:13;visibility:hidden;";
  document.body.append(canvas);
  const context = canvas.getContext("2d");
  if (!context) {
    canvas.remove();
    return { measure() {}, resizeViewport() {}, reset() {}, setActive() {}, dispose() {} };
  }
  const ctx = context,
    labels = thoughts[root.lang === "ar" ? "ar" : "en"],
    rtl = root.lang === "ar";
  let disposed = false,
    frame = 0,
    last = 0,
    phase:
      | "word"
      | "pull"
      | "resolving"
      | "to-logo"
      | "logo"
      | "clearing"
      | "to-word" = "word",
    age = 0;
  let editorial: FooterThoughts | undefined;
  let paths: FooterPaths | undefined,
    width = 1,
    height = 1,
    dpr = 1,
    scale = 1,
    grab: number | null = null,
    startX = 0,
    startY = 0,
    startScroll = 0,
    startAt = 0,
    dx = 0,
    dy = 0,
    pullX = 0,
    pullY = 0,
    pulledGlyph = -1,
    threshold = 36,
    touch = false;
  let concept = 0,
    nextConcept = 0,
    thoughtAge = 0,
    thoughtPhase: "settle" | "form" | "read" | "retract" | "handoff" = "settle",
    thoughtReveal = 0,
    clearFrom = 0,
    engaged = 0,
    candidate = -1,
    candidateAge = 0;
  let drawn: Path2D[] = [];
  let drawnContours: MaterialContours = [],
    idleTargets: MaterialContours[] = [];
  let restGeometry:
    | { paths: Path2D[]; contours: MaterialContours }
    | undefined;
  let paintedRest: { left: number; top: number; shift: number } | undefined;
  const idle = new FooterIdleEpisodes(),
    waves = new FooterRefractionWaves();
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  let enabled = false,
    hovered = -1,
    hovering = false,
    hoverStrength = 0;
  let pointerX = 0,
    pointerY = 0,
    velocityX = 0,
    velocityY = 0,
    pointerAt = 0,
    pointerClientX = 0,
    pointerClientY = 0;
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  let transfer: MaterialContours | undefined,
    transferAge = 0;
  let releaseDelta: MaterialContours | undefined,
    returnDelta: MaterialContours | undefined;
  let silkX = 0,
    silkY = 0;
  const partMap = footerPartMap;
  const canInteract = () =>
    enabled &&
    !root.inert &&
    root.getAttribute("aria-hidden") !== "true" &&
    !document.hidden &&
    document.documentElement.dataset.menuOpen !== "true";
  const restore = () => {
    word.style.visibility = "";
    canvas.style.visibility = "hidden";
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
  const sizeViewport = () => {
    if (disposed) return false;
    const nextDpr = Math.min(devicePixelRatio || 1, 2);
    const nextWidth = Math.ceil(innerWidth * nextDpr), nextHeight = Math.ceil(innerHeight * nextDpr);
    if (nextDpr === dpr && canvas.width === nextWidth && canvas.height === nextHeight) return false;
    dpr = nextDpr;
    // Resetting a backing buffer clears paint, never the reference geometry or
    // material clocks. Its CSS box continues to cover the physical viewport.
    if (canvas.width !== nextWidth) canvas.width = nextWidth;
    if (canvas.height !== nextHeight) canvas.height = nextHeight;
    return true;
  };
  const measure = () => {
    if (disposed) return;
    // DOM bounds/input are physical pixels. All material formulas, capped
    // fonts and offsets below run once in the selected reference pixel space.
    scale = designScale(innerWidth);
    width = mask.getBoundingClientRect().width / scale;
    height = word.getBoundingClientRect().height / scale;
    sizeViewport();
    paths = new FooterPaths(footerGlyphBoxes(word, ctx).map((box) => ({
      x: box.x / scale, y: box.y / scale,
      width: box.width / scale, height: box.height / scale,
    })), width, height);
    idleTargets = createIdleTargets(paths.source, paths.boxes);
    idle.reset();
    waves.clear();
    transfer = undefined;
    editorial?.dispose();
    const family =
      getComputedStyle(root)
        .getPropertyValue(rtl ? "--font-arabic" : "--font-latin")
        .trim() || (rtl ? "Cairo" : "Questrial");
    editorial = new FooterThoughts(width, height, rtl, labels, family, scale);
    drawn = [];
    restGeometry = paintedRest = undefined;
    if (enabled || phase !== "word") wake();
  };
  const announce = () => {
    if (announcement && thoughtReveal > 0.95) {
      announcement.textContent =
        labels[concept][0] + ". " + labels[concept][1].replace("\n", " ");
      announcement.lang = root.lang;
    }
  };
  const chooseConcept = (index: number) => {
    if (
      index === concept &&
      thoughtPhase !== "retract" &&
      thoughtPhase !== "handoff"
    )
      return;
    nextConcept = index;
    if (thoughtPhase !== "retract" && thoughtPhase !== "handoff") {
      clearFrom = thoughtReveal;
      thoughtPhase = "retract";
      thoughtAge = 0;
    }
  };
  const drawThought = () => {
    if (!editorial || !paths || thoughtReveal <= 0) return;
    const part = paths.parts[concept];
    const origin = editorial.mobile
      ? {
          x: part.x + part.width * (concept === 0 ? 0.35 : 0.5),
          y: part.y + 0.94 * part.height,
        }
      : { x: part.x + 0.13 * part.width, y: part.y + 0.5 * part.height };
    const target = {
      x:
        editorial.x +
        width *
          (editorial.mobile ? 0.88 : 0.425) *
          (editorial.mobile ? 0.5 : Number(!rtl)),
      y: editorial.y + 0.5 * editorial.titleSize,
    };
    const distance = Math.max(
      1,
      Math.hypot(target.x - origin.x, target.y - origin.y),
    );
    const impulse =
      phase === "logo"
        ? Math.sin(Math.PI * thoughtReveal) *
          (reduced() ? 2 : Math.min(14, 0.016 * width))
        : 0;
    origin.x += ((target.x - origin.x) / distance) * impulse;
    origin.y += ((target.y - origin.y) / distance) * impulse;
    editorial.draw(
      ctx,
      concept,
      thoughtReveal,
      origin,
      phase === "clearing" || thoughtPhase === "retract",
      reduced(),
    );
    announce();
  };
  const thoughtImpulse = () => {
    if (!paths || !editorial || phase !== "logo") return undefined;
    const part = paths.parts[concept];
    const origin = editorial.mobile
      ? {
          x: part.x + part.width * (concept === 0 ? 0.35 : 0.5),
          y: part.y + 0.94 * part.height,
        }
      : { x: part.x + 0.13 * part.width, y: part.y + 0.5 * part.height };
    const target = {
      x:
        editorial.x +
        width *
          (editorial.mobile ? 0.88 : 0.425) *
          (editorial.mobile ? 0.5 : Number(!rtl)),
      y: editorial.y + 0.5 * editorial.titleSize,
    };
    const distance = Math.max(
      1,
      Math.hypot(target.x - origin.x, target.y - origin.y),
    );
    return {
      origin,
      x: (target.x - origin.x) / distance,
      y: (target.y - origin.y) / distance,
      radius: Math.max(30, 0.75 * part.height),
      amount:
        Math.sin(Math.PI * thoughtReveal) *
        (reduced() ? 2 : Math.min(14, 0.016 * width)),
    };
  };
  const updatePaths = () => {
    if (!paths) return;
    const raw =
      phase === "to-logo"
        ? clamp(age / (reduced() ? 0.48 : 2.24))
        : phase === "to-word"
          ? clamp(age / (reduced() ? 0.42 : 2.04))
          : phase === "word" || phase === "pull" || phase === "resolving"
            ? 0
            : 1;
    const contours = paths.contours(raw, phase === "to-word");
    const impulse = thoughtImpulse();
    drawn = [];
    drawnContours = [];
    const wordMode =
      phase === "word" || phase === "pull" || phase === "resolving";
    const handoff = transfer ? Math.min(1, transferAge / 0.24) : 1;
    const handoffEase = handoff * handoff * (3 - 2 * handoff);
    if (handoff === 1) transfer = undefined;
    contours.forEach((glyph, index) => {
      const path = new Path2D();
      const glyphPoints: MaterialContours[number] = [];
      glyph.forEach((contour, contourIndex) => {
        const points: MaterialContours[number][number] = [];
        glyphPoints.push(points);
        contour.forEach((point, i) => {
          let x = point.x,
            y = point.y;
          if (phase === "to-logo" && releaseDelta) {
            const t = Math.max(0, 1 - raw / 0.21),
              weight = t * t * (3 - 2 * t),
              offset = releaseDelta[index][contourIndex][i];
            x += offset.x * weight;
            y += offset.y * weight;
          }
          if (phase === "to-word" && returnDelta) {
            const t = Math.max(0, 1 - raw / 0.22),
              weight = t * t * (3 - 2 * t),
              offset = returnDelta[index][contourIndex][i];
            x += offset.x * weight;
            y += offset.y * weight;
          }
          if (wordMode) {
            const target =
              idleTargets[idle.kind]?.[index][contourIndex][i] ?? point;
            x += (target.x - point.x) * idle.amount;
            y += (target.y - point.y) * idle.amount;
            const previous = transfer?.[index][contourIndex][i];
            if (previous) {
              x = previous.x + (point.x - previous.x) * handoffEase;
              y = previous.y + (point.y - previous.y) * handoffEase;
            }
            if (idle.amount === 0) {
              const dx = point.x - pointerX,
                dy = point.y - pointerY;
              const weight =
                elasticWeight(
                  Math.hypot(dx, dy),
                  Math.max(42, Math.min(155, 0.58 * height)),
                ) * hoverStrength;
              x += (-0.025 * dx + 0.002 * velocityX) * weight;
              y += (-0.025 * dy + 0.002 * velocityY) * weight;
            }
          }
          if (impulse && partMap[index] === concept) {
            const distance =
              Math.hypot(x - impulse.origin.x, y - impulse.origin.y) /
              impulse.radius;
            const weight =
              Math.pow(Math.max(0, 1 - distance), 4) *
              (1 + 4 * distance) *
              impulse.amount;
            x += impulse.x * weight;
            y += impulse.y * weight;
          }
          if (
            index === pulledGlyph &&
            (phase === "pull" ||
              phase === "word" ||
              phase === "resolving" ||
              (phase === "to-logo" && age < 0.5))
          ) {
            const radius = Math.max(70, 0.84 * paths!.boxes[index].height),
              r = Math.hypot(x - pullX, y - pullY) / radius;
            const elastic =
              Math.pow(Math.max(0, 1 - r), 4) *
              (1 + 4 * r) *
              (phase === "to-logo" ? 1 - ease(age / 0.5) : 1);
            x += silkX * elastic;
            y += silkY * elastic;
          }
          if (!reduced() && (wordMode || phase === "logo")) {
            const wave = waves.offset(point, index, phase === "logo");
            x += wave.x;
            y += wave.y;
          }
          points.push({ x, y });
          if (i === 0) path.moveTo(x, y);
          else path.lineTo(x, y);
          if (i === contour.length - 1) path.closePath();
        });
      });
      drawnContours.push(glyphPoints);
      drawn.push(path);
    });
  };
  const readGeometry = () => {
    const rect = mask.getBoundingClientRect(),
      wordTop = word.getBoundingClientRect().top;
    return { left: rect.left / scale, top: rect.top / scale, shift: (wordTop - rect.top) / scale, wordTop: wordTop / scale };
  };
  const draw = (geometry = readGeometry()) => {
    if (!paths) return;
    if (sizeViewport()) paintedRest = undefined;
    const { left, top, shift } = geometry;
    // Partial reveal only changes placement/clip while the word is undeformed.
    const restWord =
      phase === "word" &&
      idle.kind < 0 &&
      idle.amount === 0 &&
      hoverStrength === 0 &&
      !waves.active &&
      !transfer &&
      silkX === 0 &&
      silkY === 0;
    if (
      restWord &&
      paintedRest?.left === left &&
      paintedRest.top === top &&
      paintedRest.shift === shift
    )
      return;
    if (restWord && restGeometry) {
      drawn = restGeometry.paths;
      drawnContours = restGeometry.contours;
    } else {
      updatePaths();
      if (restWord) restGeometry = { paths: drawn, contours: drawnContours };
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const ratio = dpr * scale;
    ctx.setTransform(ratio, 0, 0, ratio, left * ratio, (top + shift) * ratio);
    if (shift > 0.01) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, -shift, width, height);
      ctx.clip();
    }
    // Paint the assembled ring as one path, avoiding seams between the seven
    // sectors. These paths are rebuilt outside rest mode; the word cache and
    // per-glyph contour correspondence remain untouched for the return morph.
    const assembled = phase === "logo" || phase === "clearing";
    if (assembled) for (let i = 2; i < drawn.length - 1; i++) drawn[1].addPath(drawn[i]);
    drawn.forEach((path, index) => {
      if (assembled && index > 1 && index < drawn.length - 1) return;
      ctx.fillStyle =
        phase === "logo" && partMap[index] === concept ? "#e1ded6" : "#dbd8d0";
      ctx.fill(path, "evenodd");
    });
    if (shift > 0.01) ctx.restore();
    if (phase === "logo" || phase === "clearing") drawThought();
    if (phase === "pull" && Math.hypot(dx, dy) > 3) {
      const length = Math.hypot(dx, dy),
        x = dx / length,
        y = dy / length;
      const tx = pullX + x * threshold,
        ty = pullY + y * threshold;
      const ready = length >= threshold;
      ctx.save();
      ctx.strokeStyle = ctx.fillStyle = ready ? "#e1ded6" : "#aaa69a";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tx - 5 * y, ty + 5 * x);
      ctx.lineTo(tx + 5 * y, ty - 5 * x);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(tx, ty, ready ? 2.5 : 1.5, 0, Math.PI * 2);
      if (ready) ctx.fill();
      else ctx.stroke();
      ctx.restore();
    }
    paintedRest = restWord ? geometry : undefined;
  };
  const resizeViewport = () => {
    if (!sizeViewport()) return;
    paintedRest = undefined;
    // A single current-pose repaint also covers a resting word with no RAF.
    // draw() does not advance age, idle episodes, waves, morph or thought time.
    if (canInteract()) draw();
  };
  const tick = (now: number) => {
    frame = 0;
    if (disposed || document.hidden) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    age += dt;
    engaged = Math.max(0, engaged - dt);
    if (!enabled || !canInteract()) {
      reset();
      return;
    }
    const wordMode = phase === "word" || phase === "pull";
    if (wordMode || phase === "logo") waves.advance(dt);
    const geometry = readGeometry();
    const fullWord = Math.abs(geometry.shift) < height * 0.02;
    if (wordMode)
      idle.advance(
        dt,
        hovering ||
          waves.active ||
          Math.hypot(silkX, silkY) > 0.001 ||
          !fullWord,
        reduced(),
      );
    if (transfer) transferAge += dt;
    const targetHover =
      hovering && phase === "word" ? (reduced() ? 0.16 : 0.6) : 0;
    hoverStrength += (targetHover - hoverStrength) * (1 - Math.exp(-12 * dt));
    if (Math.abs(hoverStrength - targetHover) < 0.001)
      hoverStrength = targetHover;
    const pullLength = Math.hypot(dx, dy),
      limit =
        (paths
          ? Math.min(
              58,
              Math.max(17, 0.23 * (paths.boxes[pulledGlyph]?.height ?? 160)),
            )
          : 30) * (reduced() ? 0.45 : 1);
    const pullAmount =
      phase === "pull" ? limit * (1 - Math.exp(-pullLength / limit)) : 0;
    const goalX = pullLength ? (dx / pullLength) * pullAmount : 0,
      goalY = pullLength ? (dy / pullLength) * pullAmount : 0;
    if (phase !== "to-logo" && phase !== "resolving") {
      silkX += (goalX - silkX) * (1 - Math.exp(-32 * dt));
      silkY += (goalY - silkY) * (1 - Math.exp(-32 * dt));
      if (Math.hypot(silkX, silkY) < 0.001 && pullAmount === 0) {
        silkX = silkY = 0;
        pulledGlyph = -1;
      }
    }
    if (phase === "resolving" && age >= 0.22) {
      captureRelease();
      transfer = undefined;
      silkX = silkY = 0;
      pulledGlyph = -1;
      phase = "to-logo";
      age = 0;
      mask.dataset.mode = "to-logo";
      mask.setAttribute("aria-pressed", "true");
    } else if (phase === "to-logo" && age >= (reduced() ? 0.48 : 2.24)) {
      phase = "logo";
      age = thoughtAge = 0;
      thoughtPhase = "settle";
      concept = 0;
      mask.dataset.mode = "logo";
      announce();
    } else if (phase === "to-word" && age >= (reduced() ? 0.42 : 2.04)) {
      reset();
      return;
    } else if (phase === "clearing") {
      thoughtReveal = clearFrom * (1 - ease(age / (reduced() ? 0.22 : 0.68)));
      if (age >= (reduced() ? 0.38 : 0.88)) {
        phase = "to-word";
        age = 0;
      }
    }
    if (phase === "logo") {
      thoughtAge += dt;
      if (candidate >= 0) {
        candidateAge += dt;
        if (candidateAge >= 0.13) {
          engaged = 1.1;
          chooseConcept(candidate);
        }
      }
      if (
        thoughtPhase === "settle" &&
        thoughtAge >= (reduced() ? 0.12 : 0.24)
      ) {
        thoughtPhase = "form";
        thoughtAge = 0;
      } else if (thoughtPhase === "form") {
        thoughtReveal = ease(thoughtAge / (reduced() ? 0.32 : 1.18));
        if (thoughtReveal === 1) {
          thoughtPhase = "read";
          thoughtAge = 0;
        }
      } else if (
        thoughtPhase === "read" &&
        thoughtAge >= 2.55 &&
        engaged === 0
      ) {
        if (concept === 2) toWord();
        else chooseConcept(concept + 1);
      } else if (thoughtPhase === "retract") {
        thoughtReveal =
          clearFrom * (1 - ease(thoughtAge / (reduced() ? 0.22 : 0.68)));
        if (thoughtAge >= (reduced() ? 0.22 : 0.68)) {
          thoughtPhase = "handoff";
          thoughtAge = 0;
        }
      } else if (thoughtPhase === "handoff" && thoughtAge >= 0.1) {
        concept = nextConcept;
        thoughtPhase = "form";
        thoughtAge = 0;
        announce();
      }
    }
    canvas.style.visibility = "visible";
    word.style.visibility = "hidden";
    mask.dataset.mode = phase;
    draw(geometry);
    const raw =
      phase === "to-logo"
        ? clamp(age / (reduced() ? 0.48 : 2.24))
        : phase === "to-word"
          ? 1 - clamp(age / (reduced() ? 0.42 : 2.04))
          : 0;
    const friction = reduced()
      ? 0
      : phase === "pull"
        ? (Math.hypot(silkX, silkY) / 60) * 0.13
        : phase === "to-logo" || phase === "to-word"
          ? 0.2 * Math.sin(Math.PI * raw)
          : 0.05 * waves.energy;
    setFooterFriction(
      friction,
      phase === "to-logo" || phase === "to-word"
        ? 0.25
        : 0.1 * Math.min(1, Math.hypot(velocityX, velocityY) / 850),
      (pointerClientX / innerWidth - 0.5) * 0.35,
    );
    mask.dataset.idleKind = String(idle.kind);
    mask.dataset.idleAmount = idle.amount.toFixed(5);
    mask.dataset.waveEnergy = waves.energy.toFixed(5);
    const moving =
      phase !== "word" ||
      idle.kind >= 0 ||
      waves.active ||
      transfer ||
      Math.abs(hoverStrength - targetHover) > 0.001 ||
      Math.hypot(silkX - goalX, silkY - goalY) > 0.001;
    if (moving) wake();
    else if (fullWord && !hovering && !reduced() && idle.wait > 0) {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        idleTimer = undefined;
        if (enabled && canInteract() && !hovering && !reduced()) {
          idle.wakeFromWait();
          last = 0;
          wake();
        }
      }, idle.wait * 1000);
    }
  };
  function wake() {
    if (!disposed && !frame && !document.hidden)
      frame = requestAnimationFrame(tick);
  }
  const captureRelease = () => {
    if (paths && drawnContours.length)
      releaseDelta = drawnContours.map((glyph, g) =>
        glyph.map((contour, c) =>
          contour.map((p, i) => ({
            x: p.x - paths!.source[g][c][i].x,
            y: p.y - paths!.source[g][c][i].y,
          })),
        ),
      );
  };
  const activate = (fromPull = false) => {
    if (fromPull) captureRelease();
    else {
      if (!transfer) {
        transfer = drawnContours.map((glyph) =>
          glyph.map((contour) => contour.map((point) => ({ ...point }))),
        );
        transferAge = 0;
      }
      releaseDelta = undefined;
      hoverStrength = 0;
    }
    enabled = true;
    clearTimeout(idleTimer);
    idle.reset();
    waves.clear();
    if (fromPull) transfer = undefined;
    phase = fromPull ? "to-logo" : "resolving";
    age = 0;
    last = 0;
    concept = 0;
    thoughtReveal = 0;
    thoughtPhase = "settle";
    canvas.style.visibility = "visible";
    word.style.visibility = "hidden";
    mask.dataset.mode = phase;
    mask.setAttribute("aria-pressed", String(fromPull));
    playMaterialSound("click");
    wake();
  };
  const toWord = () => {
    if (phase !== "word") {
      if (paths && drawnContours.length) {
        const rest = paths.contours(1);
        returnDelta = drawnContours.map((glyph, g) =>
          glyph.map((contour, c) =>
            contour.map((p, i) => ({
              x: p.x - rest[g][c][i].x,
              y: p.y - rest[g][c][i].y,
            })),
          ),
        );
      }
      clearFrom = thoughtReveal;
      phase = "clearing";
      age = 0;
      last = 0;
      wake();
    }
  };
  const reset = () => {
    clearTimeout(idleTimer);
    idleTimer = undefined;
    waves.clear();
    idle.reset();
    transfer = undefined;
    restGeometry = paintedRest = undefined;
    releaseDelta = returnDelta = undefined;
    hovering = false;
    hovered = -1;
    hoverStrength = 0;
    silkX = silkY = 0;
    emitMaterialProtection({
      source: "footer",
      active: false,
      pressureScale: 1,
      influence: 0,
      clientX: pointerClientX,
      clientY: pointerClientY,
    });
    if (grab !== null && mask.hasPointerCapture(grab))
      mask.releasePointerCapture(grab);
    grab = null;
    dx = dy = 0;
    phase = "word";
    age = thoughtReveal = 0;
    candidate = -1;
    cancelAnimationFrame(frame);
    frame = 0;
    mask.dataset.held = "false";
    mask.dataset.grabbable = "false";
    delete mask.dataset.thresholdReady;
    mask.dataset.mode = "word";
    mask.setAttribute("aria-pressed", "false");
    restore();
  };
  const setActive = (value: boolean) => {
    const changed = value !== enabled;
    enabled = value;
    if (!value) {
      if (changed || frame || phase !== "word") reset();
      return;
    }
    if (changed || phase !== "word" || !idleTimer) wake();
  };
  const hit = (event: PointerEvent) => {
    if (!paths) return -1;
    const geometry = readGeometry(),
      x = event.clientX / scale - geometry.left,
      y = event.clientY / scale - geometry.wordTop;
    if (!drawn.length) draw(geometry);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const tolerance = Math.max(7, Math.min(14, 0.045 * height));
    ctx.lineWidth = 2 * tolerance;
    ctx.lineJoin = "round";
    const index = drawn.findIndex(
      (path) =>
        ctx.isPointInPath(path, x, y, "evenodd") ||
        ctx.isPointInStroke(path, x, y),
    );
    const filled =
      index >= 0 && ctx.isPointInPath(drawn[index], x, y, "evenodd");
    ctx.restore();
    pointerX = x;
    pointerY = y;
    if (index >= 0 && !filled) {
      let best = Infinity;
      drawnContours[index]?.forEach((contour) =>
        contour.forEach((a, i) => {
          const b = contour[(i + 1) % contour.length],
            dx = b.x - a.x,
            dy = b.y - a.y,
            t = clamp(
              ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1),
            ),
            px = a.x + t * dx,
            py = a.y + t * dy,
            d = (x - px) ** 2 + (y - py) ** 2;
          if (d < best) {
            best = d;
            pointerX = px;
            pointerY = py;
          }
        }),
      );
    }
    return index;
  };
  const protection = (active: boolean) =>
    emitMaterialProtection({
      source: "footer",
      active,
      pressureScale: 1,
      influence: active ? 0.75 : 0,
      clientX: pointerClientX,
      clientY: pointerClientY,
    });
  const down = (event: PointerEvent) => {
    if (
      event.button !== 0 ||
      grab !== null ||
      !canInteract() ||
      (event.target instanceof Element &&
        event.target.closest(
          "a,button,input,nav,[data-nav-layer],[data-shell-side-menu]",
        ))
    )
      return;
    const glyph = hit(event);
    if (glyph < 0) return;
    if (phase === "logo") {
      grab = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      startScroll = scrollY;
      pointerClientX = event.clientX;
      pointerClientY = event.clientY;
      engaged = 1.1;
      protection(true);
      return;
    }
    if (phase !== "word") return;
    clearTimeout(idleTimer);
    idleTimer = undefined;
    if (idle.kind >= 0) {
      transfer = drawnContours.map((glyph) =>
        glyph.map((contour) => contour.map((p) => ({ ...p }))),
      );
      transferAge = 0;
      idle.reset();
      waves.clear();
    }
    const rect = mask.getBoundingClientRect();
    grab = event.pointerId;
    touch = event.pointerType === "touch";
    startX = event.clientX;
    startY = event.clientY;
    startScroll = scrollY;
    startAt = event.timeStamp;
    pullX = (event.clientX - rect.left) / scale;
    pullY = (event.clientY - word.getBoundingClientRect().top) / scale;
    pulledGlyph = glyph;
    threshold = Math.max(24, Math.min(64, 0.24 * paths!.boxes[glyph].height));
    dx = 0;
    dy = -1.5;
    phase = "pull";
    canvas.style.visibility = "visible";
    word.style.visibility = "hidden";
    mask.dataset.held = "true";
    mask.dataset.focusOrigin = "pointer";
    if (!touch) {
      mask.setPointerCapture(event.pointerId);
      mask.focus({ preventScroll: true });
      event.preventDefault();
    }
    draw();
    protection(true);
    wake();
  };
  const move = (event: PointerEvent) => {
    const oldX = pointerClientX,
      oldY = pointerClientY,
      dt = Math.max(0.008, (event.timeStamp - pointerAt) / 1000);
    pointerClientX = event.clientX;
    pointerClientY = event.clientY;
    velocityX = pointerAt
      ? Math.max(-1400, Math.min(1400, (event.clientX - oldX) / scale / dt))
      : 0;
    velocityY = pointerAt
      ? Math.max(-1400, Math.min(1400, (event.clientY - oldY) / scale / dt))
      : 0;
    pointerAt = event.timeStamp;
    if ((phase === "word" || phase === "logo") && enabled && canInteract()) {
      const blocked =
        event.target instanceof Element &&
        event.target.closest(
          "a,button,input,nav,[data-nav-layer],[data-shell-side-menu]",
        );
      hovered =
        event.pointerType === "mouse" && fine.matches && !blocked
          ? hit(event)
          : -1;
      hovering = hovered >= 0;
      mask.dataset.grabbable = String(hovering);
      protection(hovering || grab !== null);
      if (hovering) {
        clearTimeout(idleTimer);
        idleTimer = undefined;
        if (idle.kind >= 0) {
          transfer = drawnContours.map((glyph) =>
            glyph.map((contour) => contour.map((p) => ({ ...p }))),
          );
          transferAge = 0;
          idle.reset();
          waves.clear();
        }
        if (!reduced())
          waves.contact(
            { x: pointerX, y: pointerY },
            hovered,
            { x: velocityX, y: velocityY },
            phase === "logo"
              ? Math.max(
                  paths!.parts[partMap[hovered]].height,
                  0.6 * paths!.parts[partMap[hovered]].width,
                )
              : paths!.boxes[hovered].height,
          );
      }
      wake();
    }
    if (phase === "logo") {
      const glyph = hit(event),
        part = glyph < 0 ? -1 : partMap[glyph];
      if (part !== candidate) {
        candidate = part;
        candidateAge = 0;
      }
      if (glyph >= 0) {
        engaged = 1.1;
      }
    }
    if (event.pointerId !== grab) return;
    dx = (event.clientX - startX) / scale;
    dy = (event.clientY - startY) / scale;
    if (
      !canInteract() ||
      Math.abs(scrollY - startScroll) > 6 ||
      (touch && Math.hypot(event.clientX - startX, event.clientY - startY) > 10)
    ) {
      reset();
      return;
    }
    if (phase === "logo") {
      engaged = 1.1;
      return;
    }
    mask.dataset.thresholdReady = String(Math.hypot(dx, dy) >= threshold);
    protection(true);
    wake();
  };
  const up = (event: PointerEvent) => {
    if (event.pointerId !== grab) return;
    const id = grab;
    grab = null;
    if (mask.hasPointerCapture(id)) mask.releasePointerCapture(id);
    mask.dataset.held = "false";
    if (phase === "logo") {
      if (Math.hypot(event.clientX - startX, event.clientY - startY) <= 10)
        toWord();
      return;
    }
    const shortTap =
      touch && Math.hypot(event.clientX - startX, event.clientY - startY) <= 10 && event.timeStamp - startAt < 650;
    if (
      canInteract() &&
      Math.abs(scrollY - startScroll) < 6 &&
      (shortTap || (!touch && Math.hypot(dx, dy) >= threshold))
    )
      activate(true);
    else {
      phase = "word";
      dx = dy = 0;
      hovering = false;
      protection(false);
      wake();
    }
  };
  const key = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      if (phase === "logo") toWord();
      else if (phase === "pull") reset();
      return;
    }
    if (event.key !== " " && event.key !== "Enter") return;
    if (!canInteract()) return;
    event.preventDefault();
    delete mask.dataset.focusOrigin;
    if (phase === "logo") toWord();
    else if (phase === "word") activate();
  };
  const visibility = () => {
    if (document.hidden) reset();
    else if (enabled) wake();
  };
  const cancel = (event: PointerEvent) => {
    if (event.pointerId === grab || grab === null) reset();
  };
  let lastWindowWidth = innerWidth;
  const resize = () => {
    if (lastWindowWidth === innerWidth) { resizeViewport(); return; }
    lastWindowWidth = innerWidth;
    reset();
    sizeViewport();
  };
  document.addEventListener("pointerdown", down, true);
  window.addEventListener("pointermove", move, {
    passive: true,
    capture: true,
  });
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", cancel);
  mask.addEventListener("keydown", key);
  window.addEventListener("blur", reset);
  mask.addEventListener("blur", reset);
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", visibility);
  window.addEventListener("portfolio-route-start", reset);
  measure();
  reset();
  return {
    measure,
    resizeViewport,
    reset,
    setActive,
    dispose() {
      if (disposed) return;
      reset();
      disposed = true;
      editorial?.dispose();
      canvas.remove();
      document.removeEventListener("pointerdown", down, true);
      window.removeEventListener("pointermove", move, true);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      mask.removeEventListener("keydown", key);
      window.removeEventListener("blur", reset);
      mask.removeEventListener("blur", reset);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("portfolio-route-start", reset);
      delete mask.dataset.grabbable;
      delete mask.dataset.mode;
      delete mask.dataset.held;
      delete mask.dataset.focusOrigin;
      mask.removeAttribute("aria-pressed");
    },
  };
}
