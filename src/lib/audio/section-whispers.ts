import { uiStore } from "@/store/uiStore";
import {
  playSectionWhisper,
  prepareSectionWhisper,
  stopSectionWhisper,
} from "./material-audio";
import type { Locale } from "@/i18n/routing";

const gains = {
  perspective: { en: -1.72, ar: -8.46 },
  "look-closer": { en: 5.39, ar: -9.76 },
  beyond: { en: 17.71, ar: -5.1 },
  "put-to-work": { en: 9.2, ar: -5.52 },
  clarity: { en: 14.48, ar: -9.74 },
  "set-free": { en: 10.04, ar: -7.95 },
  "space-for-what-comes-next": { en: 7.27, ar: -7.21 },
} as const;
export type WhisperStem = keyof typeof gains;
const stems = Object.keys(gains) as WhisperStem[];
const src = (stem: WhisperStem, locale: Locale) =>
  `/assets/sounds/sections/${stem}-${locale}.mp3`;

function chapterWhisper(time: number, openingTime: number): WhisperStem | null {
  if (openingTime < 26 - 0.001) return null;
  if (time < 28) return "perspective";
  if (time < 73) return "look-closer";
  if (time < 124) return "beyond";
  if (time < 241) return null;
  if (time < 282) return "put-to-work";
  if (time < 445) return null;
  if (time < 541) return "clarity";
  if (time < 639) return "set-free";
  if (time < 663) return "space-for-what-comes-next";
  return null;
}

/** Consumes the parent's score, never derives another story clock from scroll. */
export function attachSectionWhispers(
  stage: HTMLElement,
  locale: Locale,
): () => void {
  let disposed = false,
    initialized = false,
    enabledBefore = false,
    availableBefore = false;
  let time = Number(stage.dataset.storyTime ?? 0),
    openingTime = Number(stage.dataset.openingTime ?? 0),
    previousTime = time;
  let previousStem: WhisperStem | null = null,
    pending: WhisperStem | null = null,
    closingVoice = false;
  let settle: ReturnType<typeof setTimeout> | undefined;
  let globalLast = -Infinity,
    prefetching = false,
    prefetched = false;
  const lastPlayed = new Map<WhisperStem, number>();
  const available = () =>
    !document.hidden &&
    !uiStore.getState().menuOpen &&
    uiStore.getState().entryPhase === "complete" &&
    document.documentElement.dataset.routeBusy !== "true";
  const prefetch = () => {
    if (
      prefetching ||
      prefetched ||
      !uiStore.getState().soundEnabled ||
      !available()
    )
      return;
    prefetching = true;
    void (async () => {
      try {
        for (const stem of stems) {
          if (disposed || !uiStore.getState().soundEnabled || document.hidden)
            return;
          await prepareSectionWhisper(src(stem, locale));
        }
        prefetched = true;
      } finally {
        prefetching = false;
      }
    })();
  };
  const reset = () => {
    initialized = false;
    pending = null;
    closingVoice = false;
    clearTimeout(settle);
    stopSectionWhisper();
  };
  const update = () => {
    if (disposed) return;
    const stem = chapterWhisper(time, openingTime),
      enabled = uiStore.getState().soundEnabled,
      ready = available();
    prefetch();
    if (
      !initialized ||
      enabled !== enabledBefore ||
      ready !== availableBefore
    ) {
      initialized = true;
      previousStem = stem;
      enabledBefore = enabled;
      availableBefore = ready;
      previousTime = time;
      pending = null;
      closingVoice = false;
      clearTimeout(settle);
      stopSectionWhisper();
      return;
    }
    const reverse = time < previousTime - 0.001;
    previousTime = reverse ? time : Math.max(previousTime, time);
    if (closingVoice && reverse) {
      closingVoice = false;
      stopSectionWhisper();
    }
    if (stem === previousStem) return;
    previousStem = stem;
    pending = enabled && ready ? stem : null;
    clearTimeout(settle);
    if (!(closingVoice && stem === null && !reverse)) {
      closingVoice = false;
      stopSectionWhisper();
    }
    if (!pending) return;
    const candidate = pending;
    settle = setTimeout(() => {
      pending = null;
      if (
        disposed ||
        !available() ||
        !uiStore.getState().soundEnabled ||
        previousStem !== candidate
      )
        return;
      const now = performance.now();
      if (
        now - globalLast < 650 ||
        now - (lastPlayed.get(candidate) ?? -Infinity) < 1800
      )
        return;
      globalLast = now;
      lastPlayed.set(candidate, now);
      closingVoice =
        playSectionWhisper(src(candidate, locale), gains[candidate][locale]) &&
        candidate === "space-for-what-comes-next";
    }, 180);
  };
  const onFrame = (event: Event) => {
    const frame = (event as CustomEvent<{ time: number; openingTime: number }>)
      .detail;
    if (
      !frame ||
      !Number.isFinite(frame.time) ||
      !Number.isFinite(frame.openingTime)
    )
      return;
    time = frame.time;
    openingTime = frame.openingTime;
    update();
  };
  stage.addEventListener("journey-frame", onFrame);
  const unsubscribe = uiStore.subscribe(update);
  document.addEventListener("visibilitychange", reset);
  window.addEventListener("blur", reset);
  update();
  return () => {
    disposed = true;
    reset();
    unsubscribe();
    stage.removeEventListener("journey-frame", onFrame);
    document.removeEventListener("visibilitychange", reset);
    window.removeEventListener("blur", reset);
  };
}
