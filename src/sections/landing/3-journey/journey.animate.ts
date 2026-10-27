import {
  getScrollTrigger,
  kickScroll,
} from "@/lib/scrollInteraction/scrollTrigger";
import { uiStore } from "@/store/uiStore";
import {
  frameFromProgress,
  journeyDistance,
  progressFromStoryTime,
  smoothRange,
  type JourneyFrame,
} from "./journey-clock";
import { createHorizontalRenderer } from "./work-renderer.js";
import { createWorkOrigin } from "./work-paths.js";
import { createSystemsRenderer } from "./systems-renderer.js";
import { createOpeningType } from "./opening-type.js";
import {
  mountHomeNavigation,
  HOME_NAVIGATION_READY_EVENT,
  type HomeRestoreDetail,
} from "@/lib/navigation/home-navigation";
import { readingNavigation } from "./reading-navigation";
import { getSettledStoryOrigin } from "../2-story/story-origin";
import { createJourneyScrubClock } from "./journey-scrub";

const beatWindows = [
  [14, 19, 25, 30],
  [26, 30, 36, 41],
  [37, 41, 47, 52],
  [48, 52, 57, 62],
];
const chapters = [
  "PERSPECTIVE",
  "LOOK CLOSER",
  "BEYOND",
  "PERSPECTIVE",
  "CLARITY",
  "DIRECTION",
  "PUT TO WORK",
  "CLARITY",
  "STRUCTURE, SET FREE",
];
const arabicChapters = [
  "منظور",
  "انظر أقرب",
  "أبعد",
  "منظور",
  "وضوح",
  "اتجاه",
  "أفكار تعمل",
  "وضوح",
  "بِنْيَة بلا قيود",
];

function optical(root: HTMLElement, time: number) {
  root
    .querySelectorAll<HTMLElement>(".optical-beat")
    .forEach((element, index) => {
      const [a, b, c, d] = beatWindows[index];
      const enter = smoothRange(a, b, time),
        exit = smoothRange(c, d, time);
      element.style.opacity = String(enter * (1 - exit));
      element.style.filter = `blur(${12 * (1 - enter) + 10 * exit}px)`;
      element.style.transform = `translate3d(0,${16 * (1 - enter) - 8 * exit}px,0)`;
      element.style.setProperty(
        "--focus-tracking",
        `${0.018 * (1 - enter) + 0.025 * exit}em`,
      );
      element.setAttribute("aria-hidden", String(enter * (1 - exit) < 0.45));
    });
  root
    .querySelectorAll<HTMLElement>(".post-concept,.post-extension")
    .forEach((panel, index) => {
      const begin = index ? 93 : 76,
        clear = index ? 109 : 107;
      panel.style.visibility =
        time >= begin && time < clear + 16 ? "visible" : "hidden";
      panel.style.opacity = "1";
      panel.querySelectorAll<HTMLElement>(".post-line").forEach((line, i) => {
        const enter = smoothRange(begin + 2 * i, begin + 8 + 2 * i, time),
          exit = smoothRange(clear + i, clear + 14 + i, time);
        line.style.transform = `translate3d(0,${112 * (1 - enter) - 112 * exit}%,0)`;
        line.style.setProperty(
          "--focus-tracking",
          `${0.015 * (1 - enter) + 0.012 * exit}em`,
        );
      });
    });
  const context = root.querySelector<HTMLElement>(".post-context");
  if (context)
    context.style.opacity = String(
      smoothRange(78, 86, time) * (1 - smoothRange(105, 122, time)),
    );
  const opening = root.querySelector<HTMLElement>(".glasses-opening");
  if (opening) {
    const ease = (x: number) =>
      0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, x)));
    const focus = ease((time - 23) / 25);
    let distance = time < 23 ? 9.8 - 0.4 * ease(time / 22) : 9.4 - 6.2 * focus;
    if (time >= 48)
      distance =
        3.2 - (3.2 - 0.035) * Math.pow(Math.min(1, (time - 48) / 22), 3);
    const clarity = 0.6 * smoothRange(9.8, 9.4, distance) + 0.4 * focus;
    opening.style.opacity = String(1 - smoothRange(0.03, 0.88, clarity));
    opening.style.filter = `blur(${36 * Math.pow(clarity, 1.6)}px) contrast(${1 - 0.32 * clarity})`;
  }
}

export function mountJourney(root: HTMLElement) {
  const stage = root.querySelector<HTMLElement>("#top")!;
  const chapter = root.querySelector<HTMLElement>(".glasses-chapter")!;
  const experience = root.querySelector<HTMLElement>(".experience")!;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let disposeMotion: (() => void) | undefined;
  let currentQuiet: boolean | undefined;
  let snapRestore: ((detail: HomeRestoreDetail) => void) | undefined;
  let wakeMotion: (() => void) | undefined;
  let pinDistance = 0;
  let modeFrame = 0;
  let settleModePosition: (() => void) | undefined;
  const sync = () => {
    const quiet = uiStore.getState().quietMode || motion.matches || uiStore.getState().homeSceneFailed;
    if (quiet === currentQuiet) {
      wakeMotion?.();
      return;
    }
    const changedMode = currentQuiet !== undefined;
    const previousScroll = scrollY;
    if (modeFrame) cancelAnimationFrame(modeFrame);
    modeFrame = 0;
    const preservePosition = () => {
      if (!changedMode) return;
      const destination = Math.min(previousScroll, Math.max(0, document.documentElement.scrollHeight - innerHeight));
      globalThis.__bouthouriLenis?.resize();
      globalThis.__bouthouriLenis?.scrollTo(destination, { immediate: true, force: true });
      window.scrollTo({ top: destination, behavior: "instant" });
      settleModePosition?.();
      kickScroll();
    };
    const finishModeChange = () => {
      preservePosition();
      if (changedMode) modeFrame = requestAnimationFrame(() => { modeFrame = 0; preservePosition(); });
    };
    currentQuiet = quiet;
    disposeMotion?.();
    disposeMotion = undefined;
    experience.classList.toggle("is-reduced", quiet);
    if (quiet) {
      delete root.dataset.enhanced;
      stage.dataset.storyTime = "0.0000";
      stage.dataset.openingTime = "0.0000";
      stage.dataset.progress = "0.00000";
      const label = root.querySelector<HTMLElement>(".chapter");
      if (label) {
        label.textContent = document.documentElement.lang === "ar" ? arabicChapters[0] : chapters[0];
        label.setAttribute("aria-hidden", "false");
      }
      const header = root.querySelector<HTMLElement>(".chapter-header");
      if (header) header.dataset.concepts = "false";
      root.querySelector(".concept-step-window")?.setAttribute("aria-hidden", "true");
      root.querySelectorAll<HTMLElement>("[data-concept-step]").forEach((step, index) => {
        step.style.transform = `translate3d(0,${index * 112}%,0)`;
        step.setAttribute("aria-hidden", "true");
      });
      const number = root.querySelector<HTMLElement>(".progress-number");
      if (number) number.textContent = "00";
      const fill = root.querySelector<HTMLElement>(".progress-fill");
      if (fill) fill.style.transform = "scaleX(0)";
      root.querySelectorAll<HTMLElement>(".cue-label,.cue-echo").forEach((cue) => {
        cue.textContent = document.documentElement.lang === "ar" ? "مرّر للاستكشاف" : "SCROLL TO EXPLORE";
      });
      const opening = createOpeningType(root);
      let readingDisposed = false;
      const measureOpening = () => opening.measure();
      const explore = root.querySelector<HTMLButtonElement>(".scroll-cue");
      const move = () => root.querySelector<HTMLElement>("#beyond")?.scrollIntoView({ behavior: "auto", block: "start" });
      explore?.addEventListener("click", move);
      window.addEventListener("resize", measureOpening, { passive: true });
      void document.fonts.ready.then(() => { if (!readingDisposed) measureOpening(); });
      disposeMotion = () => {
        readingDisposed = true;
        explore?.removeEventListener("click", move);
        window.removeEventListener("resize", measureOpening);
        opening.dispose();
      };
      finishModeChange();
      window.dispatchEvent(new Event(HOME_NAVIGATION_READY_EVENT));
      return;
    }
    root.dataset.enhanced = "true";
    const trigger = getScrollTrigger();
    if (!trigger) return;
    const opening = createOpeningType(root);
    const viewportProbe = document.createElement("span");
    viewportProbe.setAttribute("aria-hidden", "true");
    viewportProbe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none;width:0;height:100svh;inset:0 auto auto 0";
    root.append(viewportProbe);
    let originWidth = stage.clientWidth, originHeight = stage.clientHeight;
    const origin: {
      current: ReturnType<typeof createWorkOrigin> & { changed?: () => void };
    } = { current: {
      ...createWorkOrigin(),
      ...getSettledStoryOrigin(originWidth, originHeight, document.documentElement.lang === "ar"),
    } };
    const work = createHorizontalRenderer(
      root,
      origin,
      () => document.documentElement.lang === "ar",
    );
    const systems = createSystemsRenderer(root, () => work.pen);
    const onOrigin = (event: Event) => {
      const value = (
        event as CustomEvent<{
          x: number;
          y: number;
          radius: number;
          ready: boolean;
        }>
      ).detail;
      if (!value || !Number.isFinite(value.x + value.y + value.radius)) return;
      Object.assign(origin.current, value);
      origin.current.changed?.();
    };
    stage.addEventListener("story-origin", onOrigin);
    const clock = createJourneyScrubClock();
    let frameId: number | null = null, disposed = false;
    const render = (progress: number) => {
      const frame = frameFromProgress(
        progress,
        100 / (innerWidth <= 700 ? 5.8 : 6.8),
      );
      const { time, openingTime } = frame;
      stage.dataset.progress = frame.progress.toFixed(5);
      stage.dataset.storyTime = time.toFixed(4);
      stage.dataset.openingTime = openingTime.toFixed(4);
      optical(root, time);
      work.update(time);
      systems.update(time);
      const boundaries = [28, 73, 124, 168, 211, 241, 282, 445, 541, Infinity];
      const slots = [0, 1, 2, 3, 4, 5, 6, null, 7, 8];
      const index = slots[boundaries.findIndex((end) => time < end)];
      const labels =
        document.documentElement.lang === "ar" ? arabicChapters : chapters;
      const label = root.querySelector<HTMLElement>(".chapter");
      if (label) label.textContent = index === null ? "" : labels[index];
      const header = root.querySelector<HTMLElement>(".chapter-header");
      const concepts = time >= 124 && time < 241;
      const conceptPosition =
        smoothRange(165, 171, time) + smoothRange(208, 214, time);
      if (header) header.dataset.concepts = String(concepts);
      label?.setAttribute("aria-hidden", String(concepts));
      root
        .querySelector(".concept-step-window")
        ?.setAttribute("aria-hidden", String(!concepts));
      root
        .querySelectorAll<HTMLElement>("[data-concept-step]")
        .forEach((step, i) => {
          step.style.transform = `translate3d(0,${(i - conceptPosition) * 112}%,0)`;
          step.setAttribute(
            "aria-hidden",
            String(!concepts || i !== Math.round(conceptPosition)),
          );
        });
      const number = root.querySelector<HTMLElement>(".progress-number");
      if (number)
        number.textContent = String(
          Math.round(((openingTime + time) / 740) * 100),
        ).padStart(2, "0");
      const fill = root.querySelector<HTMLElement>(".progress-fill");
      if (fill) fill.style.transform = `scaleX(${(openingTime + time) / 740})`;
      const atEnd = time >= 710;
      root.querySelectorAll<HTMLElement>(".cue-label,.cue-echo").forEach((label) => {
        label.textContent = document.documentElement.lang === "ar"
          ? atEnd ? "عودة إلى البداية" : "مرّر للاستكشاف"
          : atEnd ? "BACK TO THE START" : "SCROLL TO EXPLORE";
      });
      const loadStatus = root.querySelector<HTMLElement>(".load-status");
      if (loadStatus) loadStatus.style.display = time >= 306 ? "none" : "";
      stage.dispatchEvent(
        new CustomEvent<JourneyFrame>("journey-frame", { detail: frame }),
      );
    };
    const tick = () => {
      frameId = null;
      if (disposed || document.hidden) {
        clock.sleep();
        return;
      }
      render(clock.sample(performance.now()));
      if (clock.value !== clock.target) frameId = requestAnimationFrame(tick);
      else clock.sleep();
    };
    const request = () => {
      if (frameId === null && !document.hidden) {
        clock.wake(performance.now());
        frameId = requestAnimationFrame(tick);
      }
    };
    const pauseOrResume = () => {
      const now = performance.now();
      if (document.hidden) {
        clock.pause(now);
        if (frameId !== null) cancelAnimationFrame(frameId);
        frameId = null;
      } else {
        clock.resume(now);
        request();
      }
    };
    wakeMotion = pauseOrResume;
    const snap = (progress: number) => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = null;
      clock.snap(progress, performance.now());
      if (document.hidden) clock.pause(performance.now());
      else clock.sleep();
      render(clock.value);
    };
    settleModePosition = () => {
      const start = chapter.getBoundingClientRect().top + scrollY;
      snap(Math.max(0, Math.min(1, (scrollY - start) / pinDistance)));
    };
    snapRestore = (detail) => {
      if (detail.pinProgress === null) return;
      snap(detail.pinProgress);
      kickScroll();
      window.dispatchEvent(new Event("scroll"));
    };
    const measure = () => {
      const mobile = innerWidth <= 700;
      const viewportHeight = mobile ? viewportProbe.getBoundingClientRect().height : innerHeight;
      root.style.setProperty("--journey-distance", `${journeyDistance(viewportHeight, mobile)}px`);
      const distance = Math.round(chapter.getBoundingClientRect().height - stage.offsetHeight);
      pinDistance = distance;
      opening.measure();
      const start = chapter.getBoundingClientRect().top + scrollY;
      trigger.createInstance("home-lens-story", chapter, {
        values: [[0, 1]],
        useRAF: false,
        startPoint: [0, 0, start],
        endPoint: [0, 0, start + distance],
        callback: ({ v }) => {
          const next = v[0] ?? 0;
          clock.retarget(next, performance.now(), frameFromProgress(next).time >= 270);
          request();
        },
      });
      if (originWidth !== stage.clientWidth || originHeight !== stage.clientHeight) {
        originWidth = stage.clientWidth; originHeight = stage.clientHeight;
        Object.assign(origin.current, getSettledStoryOrigin(originWidth, originHeight, document.documentElement.lang === "ar"));
      }
      work.resize();
      systems.resize();
      snap(distance > 0 ? Math.max(0, Math.min(1, (scrollY - start) / distance)) : 0);
      kickScroll();
      window.dispatchEvent(new Event(HOME_NAVIGATION_READY_EVENT));
    };
    const explore = root.querySelector<HTMLButtonElement>(".scroll-cue");
    const skip = document.querySelector<HTMLAnchorElement>(
      'a.skip-link[href="#beyond"]',
    );
    const skipToIntroduction = (event: MouseEvent) => {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      event.preventDefault();
      const y =
        chapter.getBoundingClientRect().top +
        scrollY +
        pinDistance * progressFromStoryTime(102);
      if (globalThis.__bouthouriLenis)
        globalThis.__bouthouriLenis.scrollTo(y, { immediate: true, force: true });
      window.scrollTo({ top: y, behavior: "instant" });
      snap(progressFromStoryTime(102));
      kickScroll();
      root
        .querySelector<HTMLElement>("#beyond")
        ?.focus({ preventScroll: true });
    };
    const move = () => {
      const atEnd = frameFromProgress(clock.target).time >= 710;
      const hero = document.querySelector<HTMLElement>("#identity");
      const y = atEnd
        ? (hero?.offsetHeight ?? innerHeight) * (1 + (innerWidth <= 700 ? 5.8 : 6.8) * 22 / 100)
        : scrollY + 0.9 * innerHeight;
      if (globalThis.__bouthouriLenis) globalThis.__bouthouriLenis.scrollTo(y);
      else window.scrollTo({ top: y, behavior: "smooth" });
    };
    const visibility = () => {
      pauseOrResume();
    };
    window.addEventListener("resize", measure, { passive: true });
    document.addEventListener("visibilitychange", visibility);
    explore?.addEventListener("click", move);
    skip?.addEventListener("click", skipToIntroduction);
    measure();
    void document.fonts.ready.then(() => {
      if (!disposed) measure();
    });
    finishModeChange();
    disposeMotion = () => {
      disposed = true;
      wakeMotion = undefined;
      settleModePosition = undefined;
      snapRestore = undefined;
      pinDistance = 0;
      if (frameId !== null) cancelAnimationFrame(frameId);
      trigger.removeInstance("home-lens-story");
      work.dispose();
      systems.dispose();
      opening.dispose();
      viewportProbe.remove();
      stage.removeEventListener("story-origin", onOrigin);
      window.removeEventListener("resize", measure);
      document.removeEventListener("visibilitychange", visibility);
      explore?.removeEventListener("click", move);
      skip?.removeEventListener("click", skipToIntroduction);
      root
        .querySelectorAll<HTMLElement>(
          ".optical-beat,.post-concept,.post-extension,.post-line,.post-context,.glasses-opening,.load-status",
        )
        .forEach((el) => {
          el.removeAttribute("style");
          el.removeAttribute("aria-hidden");
        });
      root.style.removeProperty("--journey-distance");
      delete root.dataset.enhanced;
    };
  };
  const unsubscribe = uiStore.subscribe(sync);
  const reading = readingNavigation(root);
  const disposeNavigation = mountHomeNavigation({
    root,
    onHomeChange: () => uiStore.getState().setQuietMode(false),
    ...reading,
    getGeometry: () => root.hasAttribute("data-enhanced") && pinDistance > 0 ? {
      start: chapter.getBoundingClientRect().top + scrollY,
      distance: pinDistance,
      heroInput: 100 / (innerWidth <= 700 ? 5.8 : 6.8),
    } : null,
    onRestore: (detail) => snapRestore?.(detail),
  });
  motion.addEventListener("change", sync);
  sync();
  return () => {
    unsubscribe();
    if (modeFrame) cancelAnimationFrame(modeFrame);
    disposeNavigation();
    motion.removeEventListener("change", sync);
    disposeMotion?.();
  };
}
