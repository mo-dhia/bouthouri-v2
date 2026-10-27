import { smoothRange, type JourneyFrame } from "./journey-clock";

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
const chapterBoundaries = [28, 73, 124, 168, 211, 241, 282, 445, 541, Infinity];
const chapterSlots = [0, 1, 2, 3, 4, 5, 6, null, 7, 8];
const ease = (x: number) =>
  0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, x)));
const cleanupSelector =
  ".optical-beat,.post-concept,.post-extension,.post-line,.post-context,.glasses-opening,.load-status";

function collect(root: HTMLElement) {
  return {
    beats: root.querySelectorAll<HTMLElement>(".optical-beat"),
    panels: Array.from(root.querySelectorAll<HTMLElement>(".post-concept,.post-extension"), (element) => ({
      element,
      lines: element.querySelectorAll<HTMLElement>(".post-line"),
    })),
    context: root.querySelector<HTMLElement>(".post-context"),
    opening: root.querySelector<HTMLElement>(".glasses-opening"),
    label: root.querySelector<HTMLElement>(".chapter"),
    header: root.querySelector<HTMLElement>(".chapter-header"),
    stepWindow: root.querySelector<HTMLElement>(".concept-step-window"),
    steps: root.querySelectorAll<HTMLElement>("[data-concept-step]"),
    number: root.querySelector<HTMLElement>(".progress-number"),
    fill: root.querySelector<HTMLElement>(".progress-fill"),
    cues: root.querySelectorAll<HTMLElement>(".cue-label,.cue-echo"),
    loadStatus: root.querySelector<HTMLElement>(".load-status"),
    cleanup: root.querySelectorAll<HTMLElement>(cleanupSelector),
  };
}

function clearOptical(element: HTMLElement) {
  // Cleanup is unconditional, independent of the last guarded presentation.
  element.removeAttribute("style");
  element.removeAttribute("aria-hidden");
}

/** Per-motion-mount presentation only; the caller keeps frame/renderer ordering. */
export function createJourneyPresentation(root: HTMLElement, stage: HTMLElement) {
  let elements: ReturnType<typeof collect> | undefined = collect(root);
  let styles = new WeakMap<HTMLElement, Map<string, { requested: string; applied: string }>>();
  const style = (element: HTMLElement | null, property: string, value: string) => {
    if (!element) return;
    const current = element.style.getPropertyValue(property);
    let properties = styles.get(element);
    const previous = properties?.get(property);
    // CSSOM normalizes transforms/filters. Retain both strings so a normalized
    // value does not trigger another write, while external clears still repaint.
    if (current === value || (previous?.requested === value && previous.applied === current)) return;
    element.style.setProperty(property, value);
    if (!properties) {
      properties = new Map();
      styles.set(element, properties);
    }
    const applied = element.style.getPropertyValue(property);
    if (previous) {
      previous.requested = value;
      previous.applied = applied;
    } else properties.set(property, { requested: value, applied });
  };
  const attribute = (element: HTMLElement | null, name: string, value: string) => {
    if (element && element.getAttribute(name) !== value) element.setAttribute(name, value);
  };
  const text = (element: HTMLElement | null, value: string) => {
    if (element && element.textContent !== value) element.textContent = value;
  };

  return {
    refresh() {
      if (!elements) return;
      const next = collect(root);
      const retained = new Set(next.cleanup);
      elements.cleanup.forEach((element) => {
        if (!retained.has(element)) clearOptical(element);
      });
      elements = next;
    },
    frame(frame: JourneyFrame) {
      if (!elements) return;
      attribute(stage, "data-progress", frame.progress.toFixed(5));
      attribute(stage, "data-story-time", frame.time.toFixed(4));
      attribute(stage, "data-opening-time", frame.openingTime.toFixed(4));
    },
    optical(time: number) {
      if (!elements) return;
      elements.beats.forEach((element, index) => {
        const [a, b, c, d] = beatWindows[index];
        const enter = smoothRange(a, b, time),
          exit = smoothRange(c, d, time);
        style(element, "opacity", String(enter * (1 - exit)));
        style(element, "filter", `blur(${12 * (1 - enter) + 10 * exit}px)`);
        style(element, "transform", `translate3d(0,${16 * (1 - enter) - 8 * exit}px,0)`);
        style(element, "--focus-tracking", `${0.018 * (1 - enter) + 0.025 * exit}em`);
        attribute(element, "aria-hidden", String(enter * (1 - exit) < 0.45));
      });
      elements.panels.forEach(({ element: panel, lines }, index) => {
        const begin = index ? 93 : 76,
          clear = index ? 109 : 107;
        style(panel, "visibility", time >= begin && time < clear + 16 ? "visible" : "hidden");
        style(panel, "opacity", "1");
        lines.forEach((line, i) => {
          const enter = smoothRange(begin + 2 * i, begin + 8 + 2 * i, time),
            exit = smoothRange(clear + i, clear + 14 + i, time);
          style(line, "transform", `translate3d(0,${112 * (1 - enter) - 112 * exit}%,0)`);
          style(line, "--focus-tracking", `${0.015 * (1 - enter) + 0.012 * exit}em`);
        });
      });
      style(elements.context, "opacity", String(
        smoothRange(78, 86, time) * (1 - smoothRange(105, 122, time)),
      ));
      if (elements.opening) {
        const focus = ease((time - 23) / 25);
        let distance = time < 23 ? 9.8 - 0.4 * ease(time / 22) : 9.4 - 6.2 * focus;
        if (time >= 48)
          distance =
            3.2 - (3.2 - 0.035) * Math.pow(Math.min(1, (time - 48) / 22), 3);
        const clarity = 0.6 * smoothRange(9.8, 9.4, distance) + 0.4 * focus;
        style(elements.opening, "opacity", String(1 - smoothRange(0.03, 0.88, clarity)));
        style(elements.opening, "filter", `blur(${36 * Math.pow(clarity, 1.6)}px) contrast(${1 - 0.32 * clarity})`);
      }
    },
    controls({ time, openingTime }: JourneyFrame) {
      if (!elements) return;
      const index = chapterSlots[chapterBoundaries.findIndex((end) => time < end)];
      const labels = document.documentElement.lang === "ar" ? arabicChapters : chapters;
      text(elements.label, index === null ? "" : labels[index]);
      const concepts = time >= 124 && time < 241;
      const conceptPosition = smoothRange(165, 171, time) + smoothRange(208, 214, time);
      attribute(elements.header, "data-concepts", String(concepts));
      attribute(elements.label, "aria-hidden", String(concepts));
      attribute(elements.stepWindow, "aria-hidden", String(!concepts));
      elements.steps.forEach((step, i) => {
        style(step, "transform", `translate3d(0,${(i - conceptPosition) * 112}%,0)`);
        attribute(step, "aria-hidden", String(!concepts || i !== Math.round(conceptPosition)));
      });
      text(elements.number, String(Math.round(((openingTime + time) / 740) * 100)).padStart(2, "0"));
      style(elements.fill, "transform", `scaleX(${(openingTime + time) / 740})`);
      const atEnd = time >= 710;
      elements.cues.forEach((label) => {
        text(label, document.documentElement.lang === "ar"
          ? atEnd ? "عودة إلى البداية" : "مرّر للاستكشاف"
          : atEnd ? "BACK TO THE START" : "SCROLL TO EXPLORE");
      });
      style(elements.loadStatus, "display", time >= 306 ? "none" : "");
    },
    dispose() {
      elements?.cleanup.forEach(clearOptical);
      elements = undefined;
      styles = new WeakMap();
    },
  };
}
