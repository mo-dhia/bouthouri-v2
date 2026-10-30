import { kickScroll } from "@/lib/scrollInteraction/scrollTrigger";
import scrollManager from "@/lib/scrollInteraction/scrollManager";
import { uiStore } from "@/store/uiStore";
import { designPixels, pixelsToVw, viewportDesign } from "@/lib/viewport-design";
import { playMarkTock, setAudioEnabled } from "@/lib/audio/material-audio";
import {
  getHomeRestoreIntent,
  prepareHomeFreshEntry,
  HOME_NAVIGATION_RESTORE_EVENT,
} from "@/lib/navigation/home-navigation";
import {
  clamp,
  smoother,
  heroWorldEvent,
  heroWorldPose,
  createHeroWorldClock,
  createHeroWorldPublisher,
  heroInputProgressFromScroll,
  heroInputFromWorldProgress,
  worldProgressFromScroll,
} from "./hero-world";
import type { PortraitController } from "./hero-portrait";
import { createHeroScrollMagnet } from "./hero-scroll-magnet";
import { portraitFallbackMask } from "./hero-portrait-mask";
import {
  loaderBand,
  loaderOrder,
  loaderReach,
  loaderViewBox,
  markLandedEvent,
  markLoopDurations,
  markLoopPose,
  markLoopSteps,
  markPieces,
  markStatic,
  markTransform,
  wordmarkMarkOffset,
  wordmarkViewBox,
  type Pose,
} from "@/components/layout/header/identity-mark";
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const [wordmarkX, wordmarkY, wordmarkW, wordmarkH] = wordmarkViewBox
  .split(" ")
  .map(Number);
const stageUnits = Number(loaderViewBox.split(" ")[2]);
/** The loaded ⴱ, and the b's bowl height while it reads standalone. */
const tifinagh = markStatic.A();
const standaloneDrop = 50;
/** Seconds the full ⴱ holds before the first move. */
const loadedBeat = 0.5;
/** Gazzar's drift amplitudes, scaled from its 84-unit pieces to the 200-unit ⴱ. */
const driftUnits = 200 / 84;
/** The mark's note, D4, as it locks onto the nav. */
const landingNote = 293.66;

/** Single RAF owner for entry, marquee, scroll departure, and the local portrait. */
export function mountHeroMotion(root: HTMLElement): () => void {
  const freshReloadEntry = prepareHomeFreshEntry();
  // Read synchronously and without consuming: the journey owns restore geometry.
  const restoreIntent = getHomeRestoreIntent();
  const scene = root.querySelector<HTMLElement>("[data-identity-hero]")!;
  const world = root.querySelector<HTMLElement>("[data-hero-world]")!;
  const portraitElement = root.querySelector<HTMLElement>(
    "[data-hero-portrait]",
  )!;
  const portraitEntrance = root.querySelector<HTMLElement>(
    "[data-portrait-entrance]",
  )!;
  const image = portraitEntrance.querySelector<HTMLImageElement>("img")!;
  const marquee = root.querySelector<HTMLElement>("[data-hero-marquee]")!;
  const track = root.querySelector<HTMLElement>("[data-hero-marquee-track]")!;
  const cycle = root.querySelector<HTMLElement>("[data-hero-cycle]")!;
  const identity = root.querySelector<HTMLElement>("[data-hero-identity]")!;
  const copy = root.querySelector<HTMLElement>("[data-hero-copy-entrance]")!;
  const copyExit = root.querySelector<HTMLElement>("[data-hero-copy-exit]")!;
  const name = root.querySelector<HTMLElement>("[data-hero-name-line]")!;
  const source = root.querySelector<HTMLElement>("[data-copy-source]")!;
  const linesRoot = root.querySelector<HTMLElement>("[data-copy-lines]")!;
  const support = root.querySelector<HTMLElement>("[data-hero-support]")!;
  const signature = root.querySelector<SVGElement>("svg[class*='signature']")!;
  const strokes = Array.from(
    root.querySelectorAll<SVGPathElement>("[data-signature-stroke]"),
  );
  const bottom = root.querySelector<HTMLElement>("[data-hero-bottom]")!;
  const cue = root.querySelector<HTMLElement>("[data-hero-cue-entrance]")!;
  const pause = root.querySelector<HTMLButtonElement>("[data-marquee-pause]")!;
  const pausePath = pause.querySelector<SVGPathElement>("path")!;
  const loading = root.querySelector<HTMLElement>("[data-identity-loading]")!;
  const stage = root.querySelector<HTMLElement>("[data-identity-stage]")!;
  const pieces = markPieces.map(
    (name) => stage.querySelector<SVGGElement>(`[data-identity-piece="${name}"]`)!,
  );
  const clips = markPieces.map(
    (name) => stage.querySelector<SVGRectElement>(`[data-identity-clip="${name}"]`)!,
  );
  const materials = markPieces.map(
    (name) => stage.querySelector<SVGGElement>(`[data-identity-material="${name}"]`)!,
  );
  const latent = stage.querySelector<SVGGElement>("[data-identity-latent]")!;
  const choices = root.querySelector<HTMLElement>("[data-identity-choices]")!;
  const buttons = Array.from(
    root.querySelectorAll<HTMLButtonElement>("[data-identity-choice]"),
  );
  const progress = root.querySelector<HTMLElement>("[data-identity-progress]")!;
  const status = root.querySelector<HTMLElement>("[data-identity-status]")!;
  const bypass = root.querySelector<HTMLButtonElement>(
    "[data-identity-continue]",
  )!;
  const utilities = document.querySelector<HTMLElement>(
    "[data-hero-utilities]",
  );
  const nav = utilities?.querySelector<HTMLElement>("[data-hero-nav-entrance]");
  const navWindows = Array.from(
    utilities?.querySelectorAll<HTMLElement>("[data-hero-nav-window]") ?? [],
  );
  const navItems = Array.from(
    utilities?.querySelectorAll<HTMLElement>("[data-hero-nav-item]") ?? [],
  );
  const navLogo = utilities?.querySelector<SVGSVGElement>(
    '[data-nav-context="hero"] [data-home-link] svg',
  );
  // Only the nav b waits for the flying mark; the letters reveal with the nav.
  const navMark = navLogo?.querySelector<SVGGElement>("[data-logo-mark]");
  const navLogoItem = navLogo?.closest<HTMLElement>("[data-hero-nav-item]");
  const touched = [
    scene,
    world,
    portraitElement,
    portraitEntrance,
    image,
    marquee,
    track,
    identity,
    copy,
    copyExit,
    name,
    source,
    signature,
    bottom,
    cue,
    loading,
    stage,
    choices,
    progress,
    ...strokes,
    ...buttons,
    ...navWindows,
    ...navItems,
    ...(utilities ? [utilities] : []),
    ...(nav ? [nav] : []),
    ...(navMark ? [navMark] : []),
  ];
  const oldStyles = new Map(
    touched.map((element) => [element, element.getAttribute("style")]),
  );
  let disposed = false,
    frame = 0,
    lastFrame = 0,
    entered = false,
    entryLocked = false,
    keyboardEntry = false;
  let phase: "loading" | "ready" | "assembling" | "complete" = "loading";
  let elapsed = 0,
    readyTime = 0,
    assemblyTime = 0,
    readiness = 20,
    visualProgress = 0,
    choicesTilt = 0,
    tiltTarget = 0;
  let resolve = 1,
    portrait: PortraitController | undefined;
  const portraitAbort = new AbortController();
  let viewportWidth = innerWidth,
    mobile = viewportDesign(viewportWidth).width <= 700;
  let groupWidth = 1,
    marqueeX = viewportWidth + designPixels(8, viewportWidth),
    paused = false;
  const worldClock = createHeroWorldClock();
  const worldPublisher = createHeroWorldPublisher(root);
  let worldPose = worldClock.pose(mobile);
  let height = root.offsetHeight,
    top = root.getBoundingClientRect().top + scrollY;
  let previousWorld = -1;
  let previousPortraitMask: string | null | undefined;
  let lineElements: HTMLElement[] = [];
  // The loaded mark's loop clock: a step of `markLoopSteps`, seconds into it.
  let loopIndex = 0,
    loopTime = 0;
  // How full ⴱ was when entry began; a bypassed load finishes in flight.
  let fromFill = 0,
    landed = false;
  let flight: { x: number; y: number; scale: number } | undefined;
  let oldOverflow = "",
    oldGutter = "";
  const oldNextInert =
    root.nextElementSibling instanceof HTMLElement
      ? root.nextElementSibling.inert
      : false;
  const next =
    root.nextElementSibling instanceof HTMLElement
      ? root.nextElementSibling
      : undefined;
  const lengths = strokes.map((path) => path.getTotalLength());
  const pace = [1.35, 1.1, 1.2, 1.3, 1.4, 1.65],
    lifts = [0, 0.03, 0, 0, 0, 0.03];
  const weighted = lengths.map((length, i) => length / pace[i]),
    total = weighted.reduce((a, b) => a + b, 0);
  let cursor = 1.04;
  const drawing = weighted.map((weight, i) => {
    cursor += lifts[i];
    const timing = { start: cursor, duration: (1.24 * weight) / total };
    cursor += timing.duration;
    return timing;
  });

  const setPhase = (value: typeof phase) => {
    phase = value;
    root.dataset.heroPhase = value;
    document.documentElement.dataset.heroBoot = value;
    uiStore.getState().setEntryPhase(value);
  };
  const release = () => {
    if (!entryLocked) return;
    entryLocked = false;
    document.documentElement.style.overflow = oldOverflow;
    document.documentElement.style.scrollbarGutter = oldGutter;
    if (next) next.inert = oldNextInert;
    if (utilities) utilities.inert = false;
    if (keyboardEntry) identity.focus({ preventScroll: true });
  };
  const preventScroll = (event: Event) => {
    if (entryLocked) event.preventDefault();
  };
  const stopScrollKeys = (event: KeyboardEvent) => {
    if (
      entryLocked &&
      [
        " ",
        "ArrowDown",
        "ArrowUp",
        "PageDown",
        "PageUp",
        "Home",
        "End",
      ].includes(event.key) &&
      !(event.target instanceof Element && event.target.closest("button,a"))
    )
      event.preventDefault();
  };
  const setCopy = (time: number) => {
    [name, ...lineElements].forEach((line, i) => {
      const p = easeInOut(clamp((time - i * 0.1) / 0.6));
      line.style.transform = `translate3d(0,${(1 - p) * 110}%,0)`;
    });
  };
  const measureCopy = () => {
    const text = source.firstChild;
    if (!text || text.nodeType !== Node.TEXT_NODE) return;
    const range = document.createRange(),
      groups: Array<{ top: number; words: string[] }> = [];
    for (const word of (source.textContent ?? "").matchAll(/\S+/g)) {
      range.setStart(text, word.index!);
      range.setEnd(text, word.index! + word[0].length);
      const rect = range.getBoundingClientRect(),
        last = groups.at(-1);
      if (last && Math.abs(last.top - rect.top) < designPixels(2, viewportWidth)) last.words.push(word[0]);
      else groups.push({ top: rect.top, words: [word[0]] });
    }
    const lineHeight = parseFloat(getComputedStyle(support).lineHeight);
    linesRoot.replaceChildren();
    lineElements = [];
    groups.forEach((group, index) => {
      const mask = document.createElement("span"),
        line = document.createElement("span");
      mask.style.cssText = `position:absolute;inset-inline:0;top:${pixelsToVw(group.top - groups[0].top, viewportWidth)};height:${pixelsToVw(lineHeight, viewportWidth)};overflow:hidden;display:block;`;
      line.textContent = group.words.join(" ");
      line.dataset.heroCopyLine = String(index + 1);
      line.style.cssText =
        "display:block;white-space:pre;will-change:transform;";
      mask.append(line);
      linesRoot.append(mask);
      lineElements.push(line);
    });
    source.style.opacity = "0";
    setCopy(phase === "complete" ? 1.2 : assemblyTime - 0.28);
  };
  const measure = () => {
    if (disposed) return;
    const previousWidth = viewportWidth;
    viewportWidth = innerWidth;
    mobile = viewportDesign(viewportWidth).width <= 700;
    const width = cycle.getBoundingClientRect().width;
    if (marqueeX <= 0 && groupWidth > 1)
      marqueeX = -((-marqueeX % groupWidth) / groupWidth) * width;
    else marqueeX *= viewportWidth / previousWidth;
    groupWidth = width || 1;
    height = root.offsetHeight;
    top = root.getBoundingClientRect().top + scrollY;
    portrait?.measure();
    measureCopy();
    measureFlight();
  };
  const measureFlight = () => {
    if (loading.hidden || phase !== "assembling" || !navLogo) return;
    // Measure the untransformed stage, then put the in-flight transform back.
    const inline = stage.style.transform;
    stage.style.removeProperty("transform");
    const from = stage.getBoundingClientRect();
    stage.style.transform = inline;
    const to = navLogo.getBoundingClientRect();
    const shift =
      (parseFloat(navLogoItem?.dataset.entryY ?? "0") * viewportWidth) / 100;
    const scale = Math.min(to.width / wordmarkW, to.height / wordmarkH);
    flight = {
      x:
        to.left +
        (to.width - wordmarkW * scale) / 2 +
        (wordmarkMarkOffset - wordmarkX) * scale -
        (from.left + from.width / 2),
      y:
        to.top -
        shift +
        (to.height - wordmarkH * scale) / 2 +
        -wordmarkY * scale -
        (from.top + from.height / 2),
      scale: (scale * stageUnits) / (from.width || 1),
    };
  };
  /**
   * Gazzar's loader on ⴱ: each piece fills from the bottom over its third of
   * the load, drifting while latent; the full mark then takes `pose`.
   */
  const drawMark = (pose: Pose, fill: number, ghost: number) => {
    latent.setAttribute("opacity", (0.055 * ghost).toFixed(4));
    markPieces.forEach((name, i) => {
      const band = loaderBand[name],
        order = loaderOrder.indexOf(name),
        f = smoother(order / 3, (order + 1) / 3, fill),
        rest = 1 - f,
        centre = band.y + band.h / 2;
      pieces[i].setAttribute("transform", markTransform(pose[name]));
      // Full pieces open their clip so the moves can range freely.
      clips[i].setAttribute("y", (f === 1 ? -loaderReach : band.y + band.h * rest).toFixed(2));
      clips[i].setAttribute("height", (f === 1 ? 2 * loaderReach : band.h * f).toFixed(2));
      const drift =
        (rest * Math.sin(0.75 * elapsed + 1.7 * order) * 1.2 +
          choicesTilt * Math.sin(1.3 * elapsed + order) * 0.55) *
        driftUnits;
      materials[i].setAttribute(
        "transform",
        `translate(0 ${(centre + drift).toFixed(2)}) scale(${(1 - 0.045 * rest).toFixed(4)} ${(0.7 + 0.3 * f).toFixed(4)}) translate(0 ${(-centre).toFixed(2)})`,
      );
    });
  };
  /** Advances the brand book's ⴱ → b → ب loop and returns its pose. */
  const readLoop = (delta: number, drop: number) => {
    loopTime += delta;
    let guard = 0;
    while (loopTime * 1000 >= markLoopDurations[markLoopSteps[loopIndex]] && guard++ < 12) {
      loopTime -= markLoopDurations[markLoopSteps[loopIndex]] / 1000;
      loopIndex = (loopIndex + 1) % markLoopSteps.length;
    }
    const step = markLoopSteps[loopIndex];
    return markLoopPose(step, Math.min(1, (loopTime * 1000) / markLoopDurations[step]), drop);
  };
  // The loaded ⴱ holds a beat, then reads on.
  const startLoop = (beat: number) => {
    loopIndex = 0;
    loopTime = markLoopDurations.A / 1000 - beat;
  };
  const finish = () => {
    entered = true;
    setPhase("complete");
    release();
    loading.hidden = true;
    loading.inert = true;
    world.style.visibility = "visible";
    identity.style.visibility = "visible";
    bottom.style.visibility = "visible";
    if (utilities) {
      utilities.style.visibility = "visible";
      utilities.style.opacity = "1";
    }
    navMark?.style.removeProperty("visibility");
    navWindows.forEach((window) => window.style.removeProperty("clip-path"));
    navItems.forEach((item) => item.style.removeProperty("transform"));
    cue.style.transform = "none";
    setCopy(1.2);
    resolve = 1;
    portraitEntrance.style.opacity = "1";
    strokes.forEach((path) => {
      path.style.strokeDashoffset = "0";
      path.style.opacity = "1";
    });
    window.dispatchEvent(new Event("identity-entry-complete"));
    previousWorld = -1;
    wake();
  };
  const begin = (sound: boolean) => {
    void setAudioEnabled(sound);
    choices.inert = true;
    bypass.hidden = true;
    if (phase === "loading") startLoop(markLoopDurations.A / 1000);
    fromFill = visualProgress / 100;
    assemblyTime = 0;
    setPhase("assembling");
    measureFlight();
    wake();
  };
  const choose = (event: Event) => {
    if (phase !== "ready") return;
    const button = event.currentTarget as HTMLButtonElement;
    keyboardEntry = button.matches(":focus-visible");
    begin(button.dataset.identityChoice === "sound");
  };
  const bypassEntry = () => {
    if (phase !== "loading") return;
    keyboardEntry = true;
    begin(false);
  };
  const hoverChoice = (event: Event) => {
    tiltTarget =
      (event.currentTarget as HTMLElement).dataset.identityChoice === "sound"
        ? 1
        : -0.35;
    wake();
  };
  const leaveChoice = () => {
    tiltTarget = 0;
    wake();
  };
  const trap = (event: KeyboardEvent) => {
    if (event.key === "Escape" && (phase === "loading" || phase === "ready")) {
      event.preventDefault();
      keyboardEntry = true;
      begin(false);
      return;
    }
    if (event.key !== "Tab" || choices.inert) return;
    if (event.shiftKey && document.activeElement === buttons[0]) {
      event.preventDefault();
      buttons.at(-1)?.focus();
    } else if (!event.shiftKey && document.activeElement === buttons.at(-1)) {
      event.preventDefault();
      buttons[0]?.focus();
    }
  };
  const onPause = () => {
    paused = !paused;
    pause.setAttribute("aria-pressed", String(paused));
    pause.setAttribute(
      "aria-label",
      (paused ? pause.dataset.resumeLabel : pause.dataset.pauseLabel) ?? "",
    );
    pausePath.setAttribute("d", paused ? "m6 4 6 4-6 4Z" : "M6 4v8M10 4v8");
    wake();
  };
  const renderWorld = () => {
    const pose = worldPose,
      currentWorld = pose.progress,
      scale = height * (mobile ? 0.62 : 1),
      portraitY = pose.portraitY * scale,
      portraitScale =
        1 + (pose.portraitScale - 1) * (mobile ? 0.6 : 1);
    const mask =
      portraitEntrance.dataset.portraitReady === "true"
        ? null
        : portraitFallbackMask(pose.exit, portraitY, portraitScale, height);
    // Availability can change without a new world pose (load/context recovery).
    if (mask !== previousPortraitMask) {
      previousPortraitMask = mask;
      if (mask === null) portraitEntrance.style.removeProperty("mask-image");
      else portraitEntrance.style.maskImage = mask;
    }
    if (previousWorld === currentWorld) return;
    previousWorld = currentWorld;
    root.dataset.heroDeparting = String(currentWorld > 0 && !pose.hidden);
    root.dataset.heroWorld = currentWorld.toFixed(4);
    // Entry descendants explicitly restore visibility. Hide the containing box
    // once departure finishes so their visible styles cannot escape it.
    // The outer #identity keeps its reserved viewport height for the timeline.
    scene.style.display = pose.hidden ? "none" : "";
    scene.style.visibility = pose.hidden ? "hidden" : "visible";
    scene.inert = pose.hidden;
    portraitElement.style.transform = `translate3d(0,${pixelsToVw(portraitY, viewportWidth)},0) scale(${portraitScale})`;
    marquee.style.opacity = String(pose.marqueeOpacity);
    marquee.style.transform = `translate3d(0,${pixelsToVw(pose.marqueeY * scale, viewportWidth)},0)`;
    identity.style.transform = `translate3d(0,${pixelsToVw(pose.identityY * scale, viewportWidth)},0)`;
    copyExit.style.opacity = String(pose.identityOpacity);
    signature.style.setProperty(
      "--signature-presence",
      String(pose.signatureOpacity),
    );
    signature.style.transform = `translate3d(0,${pixelsToVw((pose.signatureY - pose.identityY) * scale, viewportWidth)},0)`;
    bottom.style.opacity = String(pose.cueOpacity);
    bottom.style.transform = `translate3d(0,${pixelsToVw(pose.identityY * scale * 0.5, viewportWidth)},0)`;
    worldPublisher.publish(pose);
  };
  const tick = (now: number) => {
    frame = 0;
    if (disposed || document.hidden || uiStore.getState().menuOpen) {
      worldClock.sleep();
      return;
    }
    const magnetMoving = magnet.step(now);
    const delta = lastFrame ? Math.min(0.05, (now - lastFrame) / 1000) : 1 / 60;
    lastFrame = now;
    elapsed += delta;
    choicesTilt += (tiltTarget - choicesTilt) * (1 - Math.exp(-8 * delta));
    if (phase === "loading") {
      visualProgress = Math.min(
        readiness,
        visualProgress +
          Math.min(
            105 * delta,
            (readiness - visualProgress) * (1 - Math.exp(-delta * 9)),
          ),
      );
      if (readiness - visualProgress < 0.08) visualProgress = readiness;
      progress.setAttribute(
        "aria-valuenow",
        String(Math.floor(visualProgress)),
      );
      drawMark(tifinagh, visualProgress / 100, 1);
      if (visualProgress === 100) {
        setPhase("ready");
        status.textContent = status.dataset.readyLabel ?? "";
        bypass.hidden = true;
        readyTime = 0;
        startLoop(loadedBeat);
      } else if (elapsed > 8) bypass.hidden = false;
    }
    if (phase === "ready") {
      readyTime += delta;
      const choice = smoother(1.02, 1.26, readyTime);
      drawMark(readLoop(delta, standaloneDrop), 1, 1 - smoother(0, loadedBeat, readyTime));
      choices.style.visibility = readyTime >= 1.02 ? "visible" : "hidden";
      choices.inert = choice < 1;
      buttons.forEach(
        (button) =>
          (button.style.transform = `translateY(${115 * (1 - choice)}%)`),
      );
      loading.dataset.entryStage = choice === 1 ? "choice" : "loaded";
    }
    if (phase === "assembling") {
      assemblyTime += delta;
      const t = assemblyTime,
        travel = smoother(0, 1.1, t);
      if (flight)
        stage.style.transform = `translate(-50%,-50%) translate3d(${pixelsToVw(flight.x * travel, viewportWidth)},${pixelsToVw(flight.y * travel, viewportWidth)},0) scale(${1 + (flight.scale - 1) * travel})`;
      stage.style.color = `color-mix(in srgb,#d9d5cb ${(1 - smoother(0.62, 1.1, t)) * 100}%,#777772)`;
      // The mark reads on in flight, its b settling onto the x-height; a
      // bypassed ⴱ finishes filling on the way.
      if (!landed) {
        const fill = fromFill + (1 - fromFill) * smoother(0, 0.4, t);
        drawMark(readLoop(delta, standaloneDrop * (1 - travel)), fill, 1 - fill);
      }
      buttons.forEach(
        (button) =>
          (button.style.transform = `translateY(${-115 * smoother(0, 0.24, t)}%)`),
      );
      if (t >= 0.06) world.style.visibility = "visible";
      resolve = clamp((t - 0.06) / 1.2);
      portraitEntrance.style.opacity = portrait
        ? "1"
        : String(smoother(0.06, 1.02, t));
      if (t >= 0.15 && utilities) {
        utilities.style.visibility = "visible";
        utilities.style.opacity = "1";
      }
      navWindows.forEach(
        (window, i) =>
          (window.style.clipPath = `inset(${100 * (1 - easeInOut(clamp((t - 0.15 - 0.06 * i) / 0.55)))}% ${pixelsToVw(designPixels(-12, viewportWidth), viewportWidth)} 0%)`),
      );
      navItems.forEach((item, i) => {
        const y = designPixels(24, viewportWidth) * (1 - easeInOut(clamp((t - 0.15 - 0.06 * i) / 0.55)));
        const entryY = pixelsToVw(y, viewportWidth);
        item.style.transform = `translateY(${entryY})`;
        // Keep the cached offset in the same units as its CSS transform so a
        // width resize can subtract the current physical offset from the rect.
        item.dataset.entryY = entryY;
      });
      if (t >= 0.28) {
        identity.style.visibility = "visible";
        setCopy(t - 0.28);
      }
      if (t >= 0.84) {
        bottom.style.visibility = "visible";
        cue.style.transform = `translateY(${110 * (1 - easeInOut(clamp((t - 0.84) / 0.44)))}%)`;
      }
      strokes.forEach((path, i) => {
        const p = clamp((t - drawing[i].start) / drawing[i].duration);
        path.style.opacity = p > 0 ? "1" : "0";
        path.style.strokeDashoffset = String(
          1 -
            (i === 5
              ? 1 - (1 - p) * (1 - p)
              : 0.5 - 0.5 * Math.cos(Math.PI * p)),
        );
      });
      if (t >= 0.48) release();
      // Hand the b to the live wordmark once it has arrived.
      if (!landed && travel === 1) {
        landed = true;
        stage.style.visibility = "hidden";
        navMark?.style.removeProperty("visibility");
        choices.style.visibility = "hidden";
        loading.inert = true;
        playMarkTock(landingNote);
        window.dispatchEvent(
          new CustomEvent(markLandedEvent, {
            detail: { step: markLoopSteps[loopIndex], elapsed: loopTime * 1000 },
          }),
        );
      }
      if (t >= 2.5 && landed) finish();
    }
    if (entered || phase === "assembling") {
      // Source ticker reads Date.now inside its callback, not the RAF stamp.
      worldPose = worldClock.sample(performance.now(), mobile);
      renderWorld();
      const pose = worldPose;
      if (!paused && !pose.hidden && assemblyTime >= 0.16) {
        marqueeX -= designPixels(133, viewportWidth) * delta;
        if (marqueeX <= 0) marqueeX = -(-marqueeX % groupWidth);
      }
      track.style.transform = `translate3d(${pixelsToVw(root.dataset.locale === "ar" ? viewportWidth - 2 * groupWidth - marqueeX : marqueeX, viewportWidth)},0,0)`;
      const active =
        portrait?.render(
          delta,
          resolve,
          pose.exit,
          pose.pointer,
          !pose.hidden,
        ) ?? false;
      if (
        (!pose.hidden && (!paused || active)) ||
        !worldClock.settled ||
        phase !== "complete" ||
        magnetMoving
      )
        wake();
    } else wake(); // The loader reads its loop until a choice is made.
    if (!frame) worldClock.sleep();
  };
  function wake() {
    if (!disposed && !frame && !document.hidden && !uiStore.getState().menuOpen) {
      worldClock.wake(performance.now());
      frame = requestAnimationFrame(tick);
    }
  }
  let worldWasPaused = document.hidden || uiStore.getState().menuOpen;
  const sync = () => {
    const menuOpen = uiStore.getState().menuOpen;
    const worldPaused = document.hidden || menuOpen;
    if (menuOpen) magnet.reset();
    if (worldPaused) worldClock.sleep();
    else if (worldWasPaused && !worldClock.settled)
      worldClock.resume(performance.now());
    worldWasPaused = worldPaused;
    if (menuOpen || document.hidden) portrait?.reset();
    lastFrame = 0;
    wake();
  };
  const onWorldInput = (event: Event) => {
    const detail = (event as CustomEvent<{ progress: number }>).detail;
    if (detail && Number.isFinite(detail.progress)) {
      root.dataset.heroWorldOwner = "journey";
      setWorldTarget(heroInputFromWorldProgress(detail.progress, mobile));
      wake();
    }
  };
  const setWorldTarget = (value: number, immediate = false) => {
    const next = clamp(value);
    if (immediate || phase !== "complete") {
      worldClock.snap(next, performance.now());
      worldPose = worldClock.pose(mobile);
      previousWorld = -1;
      renderWorld();
    } else worldClock.retarget(next, performance.now());
  };
  const updateScroll = () => {
    setWorldTarget(
      heroInputProgressFromScroll(scrollY - top, height, mobile),
    );
    delete root.dataset.heroWorldOwner;
    wake();
  };
  const snapWorldToScroll = () => {
    setWorldTarget(
      heroInputProgressFromScroll(scrollY - top, height, mobile),
      true,
    );
    delete root.dataset.heroWorldOwner;
    wake();
  };
  const onNavigationRestore = () => {
    magnet.reset();
    if (phase !== "complete") {
      assemblyTime = 2.5;
      finish();
    }
    lastFrame = 0;
    snapWorldToScroll();
  };
  const onResize = () => {
    magnet.reset();
    measure();
    snapWorldToScroll();
  };
  const main =
    root.closest<HTMLElement>("main") ??
    document.querySelector<HTMLElement>('main[data-page="landing"]');
  const magnet = createHeroScrollMagnet({
    read: () => scrollY,
    write: (position) => {
      window.scrollTo({ top: position, behavior: "instant" });
      kickScroll();
      updateScroll();
    },
    bounds: () => ({
      start: top,
      end:
        top + height + (height / (100 / (mobile ? 5.8 : 6.8))) * 22,
    }),
    ready: () =>
      phase === "complete" &&
      !uiStore.getState().quietMode &&
      !uiStore.getState().homeSceneFailed &&
      !uiStore.getState().menuOpen &&
      document.querySelector<HTMLElement>("[data-journey-root]")?.dataset
        .homeNavigation !== "pending",
    wake,
    state: (phase) => {
      if (main) main.dataset.worldMagnet = phase;
    },
    target: (progress, velocity, distance) => {
      const span =
        height + (height / (100 / (mobile ? 5.8 : 6.8))) * 22;
      const world = worldProgressFromScroll(
        progress * span,
        height,
        mobile,
      );
      return world >= 0.995 &&
        world < 0.997 &&
        distance > 0.012 &&
        velocity >= 0
        ? 1
        : world > 0.025 && world <= 0.075 && distance < -0.012 && velocity <= 0
          ? 0
          : null;
    },
    duration: (from, to) => 0.24 + Math.min(0.18, 0.7 * Math.abs(to - from)),
  });
  const unsubscribe = uiStore.subscribe(sync);
  root.dataset.enhanced = "true";
  pause.addEventListener("click", onPause);
  buttons.forEach((button) => {
    button.addEventListener("click", choose);
    button.addEventListener("pointerenter", hoverChoice);
    button.addEventListener("pointerleave", leaveChoice);
    button.addEventListener("focus", hoverChoice);
    button.addEventListener("blur", leaveChoice);
  });
  bypass.addEventListener("click", bypassEntry);
  loading.addEventListener("keydown", trap);
  document.addEventListener("visibilitychange", sync);
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("wheel", preventScroll, {
    passive: false,
    capture: true,
  });
  window.addEventListener("touchmove", preventScroll, {
    passive: false,
    capture: true,
  });
  window.addEventListener("keydown", stopScrollKeys, true);
  root.addEventListener("hero-portrait-wake", wake);
  window.addEventListener("gazzar:hero-world-input", onWorldInput);
  window.addEventListener(HOME_NAVIGATION_RESTORE_EVENT, onNavigationRestore);
  // This controller measures and remaps raw native input itself. Subscribe once
  // through the shared engine, including outside the hero's visible range;
  // its existing RAF remains the only owner of entry and departure presentation.
  scrollManager.createInstance("identity-world", updateScroll, { useRAF: false });
  const resize =
    typeof ResizeObserver === "undefined"
      ? undefined
      : new ResizeObserver(onResize);
  resize?.observe(cycle);
  measure();
  const shouldEnter =
    !restoreIntent?.skipEntry &&
    uiStore.getState().entryPhase !== "complete" &&
    (freshReloadEntry || scrollY < 20) &&
    !location.hash;
  if (shouldEnter) {
    setPhase("loading");
    loading.hidden = false;
    loading.inert = false;
    resolve = 0;
    entryLocked = true;
    oldOverflow = document.documentElement.style.overflow;
    oldGutter = document.documentElement.style.scrollbarGutter;
    document.documentElement.style.scrollbarGutter = "stable";
    document.documentElement.style.overflow = "hidden";
    if (next) next.inert = true;
    if (utilities) {
      utilities.inert = true;
      utilities.style.visibility = "hidden";
    }
    [world, identity, bottom].forEach(
      (element) => (element.style.visibility = "hidden"),
    );
    if (navMark) navMark.style.visibility = "hidden";
    strokes.forEach((path) => {
      path.style.strokeDashoffset = "1";
      path.style.opacity = "0";
    });
    setCopy(0);
    measure();
  } else {
    entered = true;
    assemblyTime = 2.5;
    finish();
  }
  void document.fonts.ready.then(() => {
    if (!disposed) {
      readiness += 25;
      measure();
      wake();
    }
  });
  void import("./hero-portrait")
    .then(({ mountHeroPortrait }) => {
      if (!disposed) return mountHeroPortrait(root, { signal: portraitAbort.signal });
    })
    .then((controller) => {
      if (!controller) return;
      if (disposed) {
        controller.dispose();
        return;
      }
      portrait = controller;
      readiness += 55;
      wake();
    })
    .catch(() => {
      if (!disposed) {
        readiness += 55;
        // The graphics owner restores its fallback on failure. A late rejected
        // preparation must not clear a newer mount's readiness here.
        wake();
      }
    });
  snapWorldToScroll();
  wake();
  return () => {
    disposed = true;
    portraitAbort.abort();
    release();
    cancelAnimationFrame(frame);
    unsubscribe();
    resize?.disconnect();
    scrollManager.removeInstance("identity-world");
    portrait?.dispose();
    worldPublisher.dispose();
    magnet.dispose();
    if (main) delete main.dataset.worldMagnet;
    document.removeEventListener("visibilitychange", sync);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("wheel", preventScroll, true);
    window.removeEventListener("touchmove", preventScroll, true);
    window.removeEventListener("keydown", stopScrollKeys, true);
    window.removeEventListener("gazzar:hero-world-input", onWorldInput);
    window.removeEventListener(
      HOME_NAVIGATION_RESTORE_EVENT,
      onNavigationRestore,
    );
    root.removeEventListener("hero-portrait-wake", wake);
    pause.removeEventListener("click", onPause);
    bypass.removeEventListener("click", bypassEntry);
    loading.removeEventListener("keydown", trap);
    buttons.forEach((button) => {
      button.removeEventListener("click", choose);
      button.removeEventListener("pointerenter", hoverChoice);
      button.removeEventListener("pointerleave", leaveChoice);
      button.removeEventListener("focus", hoverChoice);
      button.removeEventListener("blur", leaveChoice);
    });
    oldStyles.forEach((style, element) => {
      if (style === null) element.removeAttribute("style");
      else element.setAttribute("style", style);
    });
    delete root.dataset.enhanced;
    delete root.dataset.heroDeparting;
    delete root.dataset.heroWorld;
    navItems.forEach((item) => {
      delete item.dataset.entryY;
    });
    scene.inert = false;
    loading.hidden = true;
    choices.inert = true;
    linesRoot.replaceChildren();
    // Back to the server-rendered ⴱ: an unfilled ghost.
    latent.setAttribute("opacity", ".055");
    markPieces.forEach((name, i) => {
      pieces[i].setAttribute("transform", markTransform(tifinagh[name]));
      clips[i].setAttribute("y", "0");
      clips[i].setAttribute("height", "0");
      materials[i].removeAttribute("transform");
    });
    loading.dataset.entryStage = "loading";
    if (uiStore.getState().entryPhase !== "complete")
      uiStore.getState().setEntryPhase("complete");
    window.dispatchEvent(
      new CustomEvent(heroWorldEvent, {
        detail: heroWorldPose(scrollY > top + height ? 1 : 0),
      }),
    );
  };
}
