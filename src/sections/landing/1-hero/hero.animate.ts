import {
  getScrollTrigger,
  kickScroll,
} from "@/lib/scrollInteraction/scrollTrigger";
import { uiStore } from "@/store/uiStore";
import { setAudioEnabled } from "@/lib/audio/material-audio";
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

const origins = [
  [78.5, 70, 0],
  [133.5, 70, 0],
  [212.5, 70, 0],
];
const assembled = [
  [118.913103479137, 88.38151229152174, -410.3550821110788 / Math.PI],
  [137.4465684964374, 51.9042756629948, 0],
  [163.5457992608359, 22.70018681765191, 0],
];
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

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
  const anchor = root.querySelector<HTMLElement>("[data-identity-anchor]")!;
  const mark = root.querySelector<SVGElement>("[data-identity-mark]")!;
  const pieces = Array.from(
    root.querySelectorAll<SVGElement>("[data-identity-piece]"),
  );
  const clips = Array.from(
    root.querySelectorAll<SVGRectElement>("[data-identity-clip]"),
  );
  const materials = Array.from(
    root.querySelectorAll<SVGElement>("[data-identity-material]"),
  );
  const latents = Array.from(
    root.querySelectorAll<SVGElement>("[data-identity-latent]"),
  );
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
  const navLogo = utilities?.querySelector<SVGElement>(
    '[data-nav-context="hero"] [data-home-link] svg',
  );
  const trigger = getScrollTrigger();
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
    mark,
    choices,
    progress,
    ...strokes,
    ...buttons,
    ...navWindows,
    ...navItems,
    ...(utilities ? [utilities] : []),
    ...(nav ? [nav] : []),
    ...(navLogo ? [navLogo] : []),
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
    visualProgress = 0;
  let resolve = 1,
    portrait: PortraitController | undefined;
  const portraitAbort = new AbortController();
  let groupWidth = 1,
    marqueeX = innerWidth + 8,
    paused = false;
  const worldClock = createHeroWorldClock();
  const worldPublisher = createHeroWorldPublisher(root);
  let worldPose = worldClock.pose(innerWidth <= 700);
  let height = root.offsetHeight,
    top = root.getBoundingClientRect().top + scrollY;
  let previousWorld = -1,
    choicesTilt = 0,
    tiltTarget = 0;
  let previousPortraitMask: string | null | undefined;
  let lineElements: HTMLElement[] = [];
  let loadingBox: DOMRect | undefined, logoBox: DOMRect | undefined;
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
      if (last && Math.abs(last.top - rect.top) < 2) last.words.push(word[0]);
      else groups.push({ top: rect.top, words: [word[0]] });
    }
    const lineHeight = parseFloat(getComputedStyle(support).lineHeight);
    linesRoot.replaceChildren();
    lineElements = [];
    groups.forEach((group, index) => {
      const mask = document.createElement("span"),
        line = document.createElement("span");
      mask.style.cssText = `position:absolute;inset-inline:0;top:${group.top - groups[0].top}px;height:${lineHeight}px;overflow:hidden;display:block;`;
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
    const width = cycle.getBoundingClientRect().width;
    if (marqueeX <= 0 && groupWidth > 1)
      marqueeX = -((-marqueeX % groupWidth) / groupWidth) * width;
    groupWidth = width || 1;
    height = root.offsetHeight;
    top = root.getBoundingClientRect().top + scrollY;
    portrait?.measure();
    measureCopy();
    if (!loading.hidden && navLogo) {
      loadingBox = anchor.getBoundingClientRect();
      logoBox = navLogo.getBoundingClientRect();
      if (navItems[1])
        logoBox = new DOMRect(
          logoBox.x,
          logoBox.y - parseFloat(navItems[1].dataset.entryY ?? "0"),
          logoBox.width,
          logoBox.height,
        );
      mark.style.left = `${loadingBox.left}px`;
      mark.style.top = `${loadingBox.top}px`;
      mark.style.width = `${loadingBox.width}px`;
      mark.style.height = `${loadingBox.height}px`;
      mark.style.transformOrigin = "0 0";
      mark.style.transform = "translate3d(0,0,0)";
    }
  };
  const fillLogo = (assembly: number, fill: number) => {
    pieces.forEach((piece, i) => {
      const from = origins[i],
        to = assembled[i],
        a = clamp(assembly),
        f = smoother(i / 3, (i + 1) / 3, fill),
        latent = 1 - f;
      piece.setAttribute(
        "transform",
        `translate(${from[0] + (to[0] - from[0]) * a} ${from[1] + (to[1] - from[1]) * a}) rotate(${from[2] + (to[2] - from[2]) * a})`,
      );
      clips[i].setAttribute("height", String(84 * f));
      clips[i].setAttribute("y", String(42 - 84 * f));
      latents[i].setAttribute("opacity", String(0.055 * latent));
      const flutter = latent * Math.sin(0.75 * elapsed + 1.7 * i) * 1.2;
      materials[i].setAttribute(
        "transform",
        `translate(0 ${flutter + choicesTilt * Math.sin(1.3 * elapsed + i) * 0.55}) scale(${1 - 0.045 * latent} ${0.7 + 0.3 * f})`,
      );
    });
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
    if (navLogo) navLogo.style.removeProperty("visibility");
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
  const choose = (event: Event) => {
    if (phase !== "ready") return;
    const button = event.currentTarget as HTMLButtonElement;
    keyboardEntry = button.matches(":focus-visible");
    void setAudioEnabled(button.dataset.identityChoice === "sound");
    choices.inert = true;
    assemblyTime = 0;
    setPhase("assembling");
    wake();
  };
  const bypassEntry = () => {
    if (phase !== "loading") return;
    void setAudioEnabled(false);
    keyboardEntry = true;
    choices.inert = true;
    setPhase("assembling");
    assemblyTime = 0;
    wake();
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
      bypassEntry();
      if (phase === "ready") {
        void setAudioEnabled(false);
        setPhase("assembling");
        assemblyTime = 0;
      }
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
      scale = height * (innerWidth <= 700 ? 0.62 : 1),
      portraitY = pose.portraitY * scale,
      portraitScale =
        1 + (pose.portraitScale - 1) * (innerWidth <= 700 ? 0.6 : 1);
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
    portraitElement.style.transform = `translate3d(0,${portraitY}px,0) scale(${portraitScale})`;
    marquee.style.opacity = String(pose.marqueeOpacity);
    marquee.style.transform = `translate3d(0,${pose.marqueeY * scale}px,0)`;
    identity.style.transform = `translate3d(0,${pose.identityY * scale}px,0)`;
    copyExit.style.opacity = String(pose.identityOpacity);
    signature.style.setProperty(
      "--signature-presence",
      String(pose.signatureOpacity),
    );
    signature.style.transform = `translate3d(0,${(pose.signatureY - pose.identityY) * scale}px,0)`;
    bottom.style.opacity = String(pose.cueOpacity);
    bottom.style.transform = `translate3d(0,${pose.identityY * scale * 0.5}px,0)`;
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
      fillLogo(0, visualProgress / 100);
      if (visualProgress === 100) {
        setPhase("ready");
        status.textContent = status.dataset.readyLabel ?? "";
        readyTime = 0;
      }
      if (elapsed > 8) bypass.hidden = false;
    }
    if (phase === "ready") {
      readyTime += delta;
      const assembly = smoother(0.1, 0.82, readyTime),
        choice = smoother(1.02, 1.26, readyTime);
      fillLogo(assembly, 1);
      choices.style.visibility = readyTime >= 1.02 ? "visible" : "hidden";
      choices.inert = choice < 1;
      buttons.forEach(
        (button) =>
          (button.style.transform = `translateY(${115 * (1 - choice)}%)`),
      );
      loading.dataset.entryStage =
        choice === 1 ? "choice" : assembly === 1 ? "assembled" : "converging";
    }
    if (phase === "assembling") {
      assemblyTime += delta;
      const t = assemblyTime,
        flight = smoother(0, 1.1, t);
      if (loadingBox && logoBox)
        mark.style.transform = `translate3d(${(logoBox.left - loadingBox.left) * flight}px,${(logoBox.top - loadingBox.top) * flight}px,0) scale(${1 + (logoBox.width / loadingBox.width - 1) * flight},${1 + (logoBox.height / loadingBox.height - 1) * flight})`;
      mark.style.color = `color-mix(in srgb,#d6d3c9 ${(1 - smoother(0.62, 1.1, t)) * 100}%,#777772)`;
      fillLogo(
        1 - smoother(0.38, 1.1, t),
        visualProgress / 100 + (1 - visualProgress / 100) * smoother(0, 0.4, t),
      );
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
          (window.style.clipPath = `inset(${100 * (1 - easeInOut(clamp((t - 0.15 - 0.06 * i) / 0.55)))}% -12px 0%)`),
      );
      navItems.forEach((item, i) => {
        const y = 24 * (1 - easeInOut(clamp((t - 0.15 - 0.06 * i) / 0.55)));
        item.style.transform = `translateY(${y}px)`;
        item.dataset.entryY = String(y);
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
      if (flight === 1) {
        mark.style.visibility = "hidden";
        if (navLogo) navLogo.style.removeProperty("visibility");
        choices.style.visibility = "hidden";
        loading.inert = true;
      }
      if (t >= 2.5) finish();
    }
    if (entered || phase === "assembling") {
      // Source ticker reads Date.now inside its callback, not the RAF stamp.
      worldPose = worldClock.sample(performance.now(), innerWidth <= 700);
      renderWorld();
      const pose = worldPose;
      if (!paused && !pose.hidden && assemblyTime >= 0.16) {
        marqueeX -= 133 * delta;
        if (marqueeX <= 0) marqueeX = -(-marqueeX % groupWidth);
      }
      track.style.transform = `translate3d(${root.dataset.locale === "ar" ? innerWidth - 2 * groupWidth - marqueeX : marqueeX}px,0,0)`;
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
    } else if (
      phase !== "ready" ||
      readyTime < 1.3 ||
      Math.abs(choicesTilt - tiltTarget) > 0.0001
    )
      wake();
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
      setWorldTarget(heroInputFromWorldProgress(detail.progress, innerWidth <= 700));
      wake();
    }
  };
  const setWorldTarget = (value: number, immediate = false) => {
    const next = clamp(value);
    if (immediate || phase !== "complete") {
      worldClock.snap(next, performance.now());
      worldPose = worldClock.pose(innerWidth <= 700);
      previousWorld = -1;
      renderWorld();
    } else worldClock.retarget(next, performance.now());
  };
  const updateScroll = () => {
    setWorldTarget(
      heroInputProgressFromScroll(scrollY - top, height, innerWidth <= 700),
    );
    delete root.dataset.heroWorldOwner;
    wake();
  };
  const snapWorldToScroll = () => {
    setWorldTarget(
      heroInputProgressFromScroll(scrollY - top, height, innerWidth <= 700),
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
        top + height + (height / (100 / (innerWidth <= 700 ? 5.8 : 6.8))) * 22,
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
        height + (height / (100 / (innerWidth <= 700 ? 5.8 : 6.8))) * 22;
      const world = worldProgressFromScroll(
        progress * span,
        height,
        innerWidth <= 700,
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
  window.addEventListener("scroll", updateScroll, { passive: true });
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
  trigger?.createInstance("identity-world", root, {
    values: [[0, 1]],
    startPoint: [1],
    endPoint: [-2],
    useRAF: false,
    callback: updateScroll,
  });
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
    if (navLogo) navLogo.style.visibility = "hidden";
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
    trigger?.removeInstance("identity-world");
    portrait?.dispose();
    worldPublisher.dispose();
    magnet.dispose();
    if (main) delete main.dataset.worldMagnet;
    document.removeEventListener("visibilitychange", sync);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("scroll", updateScroll);
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
    if (uiStore.getState().entryPhase !== "complete")
      uiStore.getState().setEntryPhase("complete");
    window.dispatchEvent(
      new CustomEvent(heroWorldEvent, {
        detail: heroWorldPose(scrollY > top + height ? 1 : 0),
      }),
    );
  };
}
