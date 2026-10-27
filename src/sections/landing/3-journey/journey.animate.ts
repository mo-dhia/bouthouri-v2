import {
  getScrollTrigger,
  kickScroll,
} from "@/lib/scrollInteraction/scrollTrigger";
import { uiStore } from "@/store/uiStore";
import {
  frameFromProgress,
  journeyDistance,
  progressFromStoryTime,
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
import { createJourneyPresentation } from "./journey-presentation";

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
    if (experience.classList.contains("is-reduced") !== quiet)
      experience.classList.toggle("is-reduced", quiet);
    if (quiet) {
      delete root.dataset.enhanced;
      stage.dataset.storyTime = "0.0000";
      stage.dataset.openingTime = "0.0000";
      stage.dataset.progress = "0.00000";
      const label = root.querySelector<HTMLElement>(".chapter");
      if (label) {
        label.textContent = document.documentElement.lang === "ar" ? "منظور" : "PERSPECTIVE";
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
    const presentation = createJourneyPresentation(root, stage);
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
      const { time } = frame;
      presentation.frame(frame);
      presentation.optical(time);
      work.update(time);
      systems.update(time);
      presentation.controls(frame);
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
      presentation.refresh();
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
      presentation.dispose();
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
