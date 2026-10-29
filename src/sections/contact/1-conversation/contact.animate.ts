import scrollManager from "@/lib/scrollInteraction/scrollManager";
import { designPixels, pixelsToVw } from "@/lib/viewport-design";
import { ContactScrub, contactEntryPose, contactLineOffset, contactRangeProgress } from "./contact-motion";
import { pageEntryPath, routeEntries, skipPageEntry } from "@/lib/navigation/route-entry";

let serial = 0;

/** The source Contact-only timelines, presented by one finite RAF owner. */
export function mountContactMotion(root: HTMLElement) {
  const opening = root.querySelector<HTMLElement>("[data-contact-opening]");
  const titleLines = opening?.querySelectorAll<HTMLElement>("[data-contact-line]");
  const lastTitleLine = titleLines?.[titleLines.length - 1]?.parentElement;
  const axis = root.querySelector<HTMLElement>("[data-contact-axis]");
  const alternative = root.querySelector<HTMLElement>("[data-contact-alternative]");
  const revealLines = alternative ? [...alternative.querySelectorAll<HTMLElement>("[data-contact-line]")] : [];
  if (!opening || !lastTitleLine || !axis || !alternative || !revealLines.length) return () => {};
  const key = `contact-motion-${++serial}`;
  const heroClock = new ContactScrub();
  const revealClock = new ContactScrub();
  const originalTitleTransform = lastTitleLine.style.transform;
  const originalAxisTransform = axis.style.transform;
  const originalRevealTransforms = revealLines.map((line) => line.style.transform);
  const entryLines = [...opening.querySelectorAll<HTMLElement>("[data-route-line]")];
  const support = [...opening.querySelectorAll<HTMLElement>("[data-route-support]")];
  const originalEntry = entryLines.map((line) => line.style.transform);
  const originalSupport = support.map((element) => ({ transform: element.style.transform, opacity: element.style.opacity }));
  const direction = root.dataset.locale === "ar" ? -1 : 1;
  let ranges = { heroStart: 0, heroEnd: 1, revealStart: 0, revealEnd: 1 };
  let raf = 0;
  let alive = true;
  let initialized = false;
  let observer: ResizeObserver | undefined;
  let lastHero = Number.NaN;
  let lastReveal = Number.NaN;
  let entryStarted = false;
  let entryStart: number | undefined;
  let finishEntryPromise: (() => void) | undefined;
  const arrival = routeEntries(root.ownerDocument ?? document).register(root, pageEntryPath(root, "contact"), {
    start: startEntry,
    finish() { entryStarted = true; root.dataset.contactEntered = "true"; entryStart = undefined; restoreEntry(); finishEntryPromise?.(); finishEntryPromise = undefined; },
  });

  function restoreEntry() {
    entryLines.forEach((line, index) => { line.style.transform = originalEntry[index]; });
    support.forEach((element, index) => {
      element.style.transform = originalSupport[index].transform;
      element.style.opacity = originalSupport[index].opacity;
    });
    delete opening!.dataset.routeEntering;
  }
  function presentEntry(now: number) {
    if (entryStart === undefined) return;
    const elapsed = now - entryStart;
    entryLines.forEach((line, index) => {
      line.style.transform = `translate3d(0, ${contactEntryPose(elapsed, index).offset}%, 0)`;
    });
    support.forEach((element, index) => {
      const pose = contactEntryPose(elapsed, index, true);
      element.style.transform = `translate3d(0, ${pixelsToVw(designPixels(pose.offset, window.innerWidth), window.innerWidth)}, 0)`;
      element.style.opacity = String(pose.opacity);
    });
    const end = Math.max(450 + Math.max(0, entryLines.length - 1) * 60, 470 + Math.max(0, support.length - 1) * 45);
    if (elapsed >= end) { entryStart = undefined; restoreEntry(); finishEntryPromise?.(); finishEntryPromise = undefined; }
  }
  function startEntry(skip = false) {
    if (entryStarted || !initialized || !alive) return;
    entryStarted = true;
    if (root.dataset.contactEntered === "true") return;
    root.dataset.contactEntered = "true";
    if (skip || skipPageEntry(false, window)) return;
    entryStart = performance.now();
    opening!.dataset.routeEntering = "true";
    presentEntry(entryStart);
    wake();
    return new Promise<void>(resolve => { finishEntryPromise = resolve; });
  }

  function present() {
    if (heroClock.value !== lastHero) {
      lastHero = heroClock.value;
      lastTitleLine!.style.transform = `translate3d(${direction * 4 * lastHero}%, 0, 0)`;
      axis!.style.transform = `scaleX(${.18 + .82 * lastHero})`;
    }
    if (revealClock.value !== lastReveal) {
      lastReveal = revealClock.value;
      revealLines.forEach((line, index) => {
        line.style.transform = `translate3d(0, ${contactLineOffset(lastReveal, index, revealLines.length)}%, 0)`;
      });
    }
  }
  function frame(now: number) {
    raf = 0;
    if (!alive || document.hidden) return;
    heroClock.sample(now);
    revealClock.sample(now);
    present();
    presentEntry(now);
    if (heroClock.active || revealClock.active || entryStart !== undefined) raf = requestAnimationFrame(frame);
  }
  function wake() {
    if (!raf && alive && !document.hidden) raf = requestAnimationFrame(frame);
  }
  function update(snap = false) {
    const scroll = window.scrollY;
    const hero = contactRangeProgress(scroll, ranges.heroStart, ranges.heroEnd);
    const reveal = contactRangeProgress(scroll, ranges.revealStart, ranges.revealEnd);
    if (snap) {
      heroClock.snap(hero);
      revealClock.snap(reveal);
      present();
    } else {
      const now = performance.now();
      heroClock.retarget(hero, now);
      revealClock.retarget(reveal, now);
      if (heroClock.active || revealClock.active) wake();
    }
  }
  function measure() {
    if (!alive || !initialized) return;
    const hero = opening!.getBoundingClientRect();
    const later = alternative!.getBoundingClientRect();
    const scroll = window.scrollY;
    const stage = window.innerHeight;
    ranges = {
      heroStart: hero.top + scroll,
      heroEnd: hero.bottom + scroll - stage * .25,
      revealStart: later.top + scroll - stage * .9,
      revealEnd: later.top + scroll - stage * .42,
    };
    update(true);
  }
  function onScroll() { update(); }
  function visibility() {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
    else { measure(); if (entryStart !== undefined) wake(); }
  }
  function initialize() {
    if (!alive) return;
    initialized = true;
    measure();
    scrollManager.createInstance(key, onScroll, { useRAF: false });
    window.addEventListener("resize", measure);
    window.addEventListener("pageshow", measure);
    document.addEventListener("visibilitychange", visibility);
    document.fonts?.addEventListener("loadingdone", measure);
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(measure);
      observer.observe(root);
      observer.observe(opening!);
    }
    root.dataset.contactMotionReady = "true";
    arrival.ready();
  }
  // Source waits for fonts before creating its Contact timelines. Until then,
  // the server heading/copy remain fully readable and links work natively.
  void (document.fonts?.ready ?? Promise.resolve()).then(initialize, initialize);

  return () => {
    alive = false; arrival.dispose();
    cancelAnimationFrame(raf);
    scrollManager.removeInstance(key);
    observer?.disconnect();
    window.removeEventListener("resize", measure);
    window.removeEventListener("pageshow", measure);
    document.removeEventListener("visibilitychange", visibility);
    document.fonts?.removeEventListener("loadingdone", measure);
    lastTitleLine.style.transform = originalTitleTransform;
    axis.style.transform = originalAxisTransform;
    revealLines.forEach((line, index) => { line.style.transform = originalRevealTransforms[index]; });
    restoreEntry();
    delete root.dataset.contactMotionReady;
  };
}
