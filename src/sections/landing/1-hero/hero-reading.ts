import { uiStore } from "@/store/uiStore";
import { createHeroWorldPublisher, heroWorldPose } from "./hero-world";
import { createReadingPortraitState } from "./hero-reading-portrait";
import { portraitFallbackMask } from "./hero-portrait-mask";
import type { PortraitController } from "./hero-portrait";

/** Source reduced tU: one body sample per wake, then stop; no animation clock. */
export function mountHeroReading(root: HTMLElement): () => void {
  const scene = root.querySelector<HTMLElement>("[data-identity-hero]");
  const world = root.querySelector<HTMLElement>("[data-hero-world]");
  const portrait = root.querySelector<HTMLElement>("[data-hero-portrait]");
  const portraitEntrance = root.querySelector<HTMLElement>("[data-portrait-entrance]");
  const image = portrait?.querySelector<HTMLImageElement>("img");
  const marquee = root.querySelector<HTMLElement>("[data-hero-marquee]");
  const track = root.querySelector<HTMLElement>("[data-hero-marquee-track]");
  const identity = root.querySelector<HTMLElement>("[data-hero-identity]");
  const copy = root.querySelector<HTMLElement>("[data-hero-copy-exit]");
  const signature = identity?.querySelector<SVGElement>("svg");
  const bottom = root.querySelector<HTMLElement>("[data-hero-bottom]");
  const pause = root.querySelector<HTMLButtonElement>("[data-marquee-pause]");
  if (!scene || !world || !portrait || !marquee || !track || !identity || !copy || !signature || !bottom)
    return () => {};
  const touched = [scene, world, portrait, marquee, track, identity, copy, signature, bottom, ...(portraitEntrance ? [portraitEntrance] : [])];
  const styles = touched.map((element) => [element, element.getAttribute("style")] as const);
  const attributes = ["data-hero-reading", "data-hero-world", "data-hero-departing"].map(
    (key) => [key, root.getAttribute(key)] as const,
  );
  const oldInert = scene.inert, oldDisabled = pause?.disabled;
  const publisher = createHeroWorldPublisher(root);
  const portraitState = createReadingPortraitState();
  const portraitAbort = new AbortController();
  let portraitController: PortraitController | undefined;
  let disposed = false, bodyPending = false, published = false;
  let pose = heroWorldPose(0), bodyProgress = -1;
  let height = 1, top = 0;
  let previousMask: string | null | undefined;

  const render = () => {
    // Source tU leaves the body untouched while hidden/menu-open. A wake during
    // the menu waits for close; merely opening/closing a settled menu is no tick.
    if (disposed || document.hidden || uiStore.getState().menuOpen) return;
    bodyPending = false;
    // A source tU wakes the portrait before the body hidden/cached-pose return.
    // During the deferred preparation this also preserves the !en resolve cache.
    portraitState.sample({ resolve: 1, exit: pose.exit, pointer: pose.pointer, active: !pose.hidden });
    portraitController?.render(0, 1, pose.exit, pose.pointer, !pose.hidden);
    // Source reduced portrait updates its fallback before the body cache/hidden
    // return. Readiness alone is not a wake; the next native sample adds or
    // removes the mask even when the displayed world pose has not changed.
    if (portraitEntrance) {
      const mask = portraitEntrance.dataset.portraitReady === "true"
        ? null : portraitFallbackMask(pose.exit, 0, 1, height);
      if (mask !== previousMask) {
        previousMask = mask;
        if (mask === null) portraitEntrance.style.removeProperty("mask-image");
        else portraitEntrance.style.maskImage = mask;
      }
    }
    scene.style.visibility = pose.hidden ? "hidden" : "visible";
    scene.style.opacity = pose.hidden ? "0" : "1";
    scene.inert = pose.hidden || pose.identityOpacity <= 0.01;
    // The hidden branch returns before caching/writing the visible body pose.
    // Thus .5 -> .75 retains copy .104, rather than writing opacity zero.
    if (pose.hidden || bodyProgress === pose.progress) return;
    bodyProgress = pose.progress;
    world.style.opacity = "1";
    marquee.style.opacity = String(pose.marqueeOpacity);
    identity.style.opacity = "1";
    copy.style.opacity = String(pose.identityOpacity);
    signature.style.setProperty("--signature-presence", String(pose.signatureOpacity));
    bottom.style.opacity = String(pose.cueOpacity);
  };
  const publish = () => {
    // Source tq continues publishing its native reduced trigger even when the
    // document is hidden. The body waits for visibility, independently of BG.
    if (!uiStore.getState().menuOpen) {
      const next = heroWorldPose((scrollY - top) / height);
      if (next.progress !== pose.progress || !published) {
        pose = next;
        published = true;
        root.dataset.heroWorld = pose.progress.toFixed(4);
        root.dataset.heroDeparting = String(pose.progress > 0 && !pose.hidden);
        publisher.publish(pose);
      }
    }
  };
  const sample = () => {
    if (disposed) return;
    bodyPending = true;
    publish();
    render();
  };
  const measure = () => {
    height = Math.max(1, root.offsetHeight);
    const rootTop = root.getBoundingClientRect().top;
    top = rootTop + scrollY;
    if (image) {
      const rect = image.getBoundingClientRect();
      portraitState.measure((rect.top - rootTop) / height, rect.height / height);
    }
    portraitController?.measure();
    sample();
  };
  let menuWasOpen = uiStore.getState().menuOpen;
  const unsubscribe = uiStore.subscribe(() => {
    const menuOpen = uiStore.getState().menuOpen;
    if (menuWasOpen && !menuOpen) {
      // Source menu observer refreshes tq; tU only runs if a wake was pending.
      publish();
      if (bodyPending) render();
    }
    menuWasOpen = menuOpen;
  });
  root.dataset.heroReading = "true";
  root.dataset.heroPhase = "complete";
  document.documentElement.dataset.heroBoot = "complete";
  if (uiStore.getState().entryPhase !== "complete")
    uiStore.getState().setEntryPhase("complete");
  for (const element of [scene, portrait, marquee, track, identity, signature, bottom])
    element.style.removeProperty("transform");
  if (pause) pause.disabled = true;
  window.addEventListener("scroll", sample, { passive: true });
  window.addEventListener("resize", measure, { passive: true });
  window.addEventListener("home-navigation-restore", measure);
  document.addEventListener("visibilitychange", sample);
  const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
  observer?.observe(root);
  observer?.observe(track.firstElementChild ?? track);
  void document.fonts.ready.then(() => { if (!disposed) measure(); });
  measure();
  // Only the optional graphics are deferred. Neither readiness nor wall time
  // fabricates a source wake; the initializer draws without spending its budget.
  void import("./hero-portrait")
    .then(({ mountHeroPortrait }) => {
      if (!disposed) return mountHeroPortrait(root, { signal: portraitAbort.signal, reading: portraitState });
    })
    .then((controller) => {
      if (disposed) controller?.dispose();
      else portraitController = controller;
    })
    .catch(() => { /* Keep the server photograph if optional graphics fail. */ });
  return () => {
    if (disposed) return;
    disposed = true;
    portraitAbort.abort();
    portraitController?.dispose();
    unsubscribe();
    observer?.disconnect();
    publisher.dispose();
    window.removeEventListener("scroll", sample);
    window.removeEventListener("resize", measure);
    window.removeEventListener("home-navigation-restore", measure);
    document.removeEventListener("visibilitychange", sample);
    for (const [element, style] of styles) {
      if (style === null) element.removeAttribute("style");
      else element.setAttribute("style", style);
    }
    for (const [key, value] of attributes) {
      if (value === null) root.removeAttribute(key);
      else root.setAttribute(key, value);
    }
    scene.inert = oldInert;
    if (pause) pause.disabled = oldDisabled ?? false;
  };
}
