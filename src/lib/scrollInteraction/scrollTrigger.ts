import scrollManager from "./scrollManager";

// Type definitions
type ScrollElement = HTMLElement;
type ScrollElementInput =
  | ScrollElement
  | {
      current?: ScrollElement | null;
      target?: ScrollElement | null;
    };

interface InstanceMeasurements {
  distance: number;
  clientHeight: number;
}

interface ScrollInstance {
  element: ScrollElementInput;
  options: ScrollInstanceOptions;
  state: ScrollInstanceState;
  measurements: InstanceMeasurements | null;
}

interface ScrollInstanceOptions {
  values: number[][];
  startPoint: number[];
  endPoint: number[];
  callback?: (data: CallbackData) => void;
  isUnrestricted?: boolean;
  unrestrictedCallback?: ((data: UnrestrictedCallbackData) => void) | null;
  log?: boolean;
  useRAF?: boolean;
}

interface ScrollInstanceState {
  scrolled: boolean;
  init: boolean;
  lastScrollPosition: number | null;
  hasTriggeredStart: boolean;
  hasTriggeredEnd: boolean;
}

interface CallbackData {
  v: number[];
  ref: ScrollElement;
  vw: number;
  start?: number;
  end?: number;
}

type UnrestrictedCallbackData = Pick<CallbackData, "ref" | "vw">;

function isScrollElement(value: unknown): value is ScrollElement {
  return typeof HTMLElement !== "undefined" && value instanceof HTMLElement;
}

function resolveScrollElement(
  element: ScrollElementInput,
): ScrollElement | null {
  if (isScrollElement(element)) {
    return element;
  }

  return element.current ?? element.target ?? null;
}

export let VzSIFactor = 1;
export function setVzSIFactor(param: number): void {
  if (!Number.isFinite(param) || param <= 0) {
    throw new RangeError("The scroll scale factor must be a positive number.");
  }
  VzSIFactor = param;
}

// Export optimization utilities for direct use
export {
  createIntersectionOptimizer,
  createOptimizedCallback,
  createPerformanceMonitor,
  createRAFBatch,
  createStateTracker,
} from "./optimizations";

export function calcCurrent(
  start: number,
  end: number,
  percentage: number,
): number {
  return start + (percentage / 100) * (end - start);
}

export function calcPercent(
  start: number,
  end: number,
  current: number,
): number {
  return start === end ? 100 : ((current - start) / (end - start)) * 100;
}

// Maps either a raw percentage (0..100) or a start/end/current tuple to a value
// clamped within the [min, max] range. When only one extra argument is provided,
// it is treated as a precomputed percentage. When three are provided, we compute
// the percentage using calcPercent(start, end, current).
export function mapProgress(
  min: number,
  max: number,
  a: number,
  b?: number,
  c?: number,
): number {
  let percent: number;
  if (typeof b === "undefined" && typeof c === "undefined") {
    // a is already a percentage
    percent = a;
  } else if (typeof b === "number" && typeof c === "number") {
    // a,b,c represent start, end, current
    if (a === b) {
      percent = 100;
    } else if (c <= a) {
      percent = 0;
    } else if (c >= b) {
      percent = 100;
    } else {
      percent = calcPercent(a, b, c);
    }
  } else {
    // Invalid arguments, default to 0
    percent = 0;
  }

  // Clamp to [0, 100]
  if (!Number.isFinite(percent)) percent = 0;
  if (percent < 0) percent = 0;
  if (percent > 100) percent = 100;

  return calcCurrent(min, max, percent);
}

// Factory that returns a memoized version of mapProgress which
// avoids recalculating when all inputs are identical to the last call.
export function createMapProgressMemo(): (
  min: number,
  max: number,
  a: number,
  b?: number,
  c?: number,
) => number {
  let lastMin: number | undefined;
  let lastMax: number | undefined;
  let lastA: number | undefined;
  let lastB: number | undefined;
  let lastC: number | undefined;
  let lastMode: "percent" | "range" | undefined;
  let lastResult: number | undefined;

  return (
    min: number,
    max: number,
    a: number,
    b?: number,
    c?: number,
  ): number => {
    const mode =
      typeof b === "undefined" && typeof c === "undefined"
        ? "percent"
        : "range";
    if (
      mode === lastMode &&
      min === lastMin &&
      max === lastMax &&
      a === lastA &&
      b === lastB &&
      c === lastC &&
      typeof lastResult !== "undefined"
    ) {
      return lastResult;
    }

    const result = mapProgress(min, max, a, b, c);
    lastMode = mode;
    lastMin = min;
    lastMax = max;
    lastA = a;
    lastB = b;
    lastC = c;
    lastResult = result;
    return result;
  };
}

class ScrollInteractionManager {
  instances: Map<string, ScrollInstance>;
  vw: number;
  vh: number;
  boundHandleResize: () => void;
  resizeTimeout: number | null;
  isListenerAttached: boolean;
  globalStateTracker: unknown | null;
  globalViewportOptimizer: unknown | null;
  performanceMonitor: unknown | null;
  documentResizeObserver: ResizeObserver | null;
  documentResizeRafId: number | null;
  initialMeasureRafId: number | null;

  constructor() {
    this.instances = new Map();
    this.vw = 0;
    this.vh = 0;
    this.boundHandleResize = () => {
      if (this.resizeTimeout !== null) return;
      this.resizeTimeout = window.requestAnimationFrame(() => {
        this.resizeTimeout = null;
        this.handleResize();
      });
    };
    this.resizeTimeout = null;
    this.isListenerAttached = false;

    // Optimization systems (optional, created on-demand)
    this.globalStateTracker = null;
    this.globalViewportOptimizer = null;
    this.performanceMonitor = null;

    this.documentResizeObserver = null;
    this.documentResizeRafId = null;
    this.initialMeasureRafId = null;
  }

  initialize() {
    if (typeof window === "undefined") return;

    if (!this.isListenerAttached) {
      this.vw = window.innerWidth;
      this.vh = window.innerHeight;
      this.setupResizeListener();
      this.setupDocumentResizeObserver();
      this.isListenerAttached = true;
    }
  }

  cleanup() {
    if (typeof window === "undefined") return;

    if (this.isListenerAttached) {
      window.removeEventListener("resize", this.boundHandleResize);
      this.isListenerAttached = false;
    }
    if (this.resizeTimeout !== null) {
      window.cancelAnimationFrame(this.resizeTimeout);
      this.resizeTimeout = null;
    }
    if (this.documentResizeObserver) {
      this.documentResizeObserver.disconnect();
      this.documentResizeObserver = null;
    }
    if (this.documentResizeRafId !== null) {
      window.cancelAnimationFrame(this.documentResizeRafId);
      this.documentResizeRafId = null;
    }
    if (this.initialMeasureRafId !== null) {
      window.cancelAnimationFrame(this.initialMeasureRafId);
      this.initialMeasureRafId = null;
    }
    this.instances.forEach((_instance, key) => scrollManager.removeInstance(key));
    this.instances.clear();
  }

  setupDocumentResizeObserver() {
    if (typeof window === "undefined" || typeof ResizeObserver === "undefined")
      return;

    const root = document.documentElement;
    if (!root) return;

    this.documentResizeObserver = new ResizeObserver(() => {
      if (this.documentResizeRafId !== null) return;
      this.documentResizeRafId = window.requestAnimationFrame(() => {
        this.documentResizeRafId = null;
        this.refreshAllMeasurements();
        scrollManager.requestUpdate();
      });
    });
    this.documentResizeObserver.observe(root);
  }

  invalidateAllMeasurements(): void {
    this.instances.forEach((instance) => {
      instance.measurements = null;
    });
  }

  refreshAllMeasurements(): void {
    this.invalidateAllMeasurements();
    this.instances.forEach((instance) => {
      this.measureInstance(instance);
    });
  }

  measureInstance(instance: ScrollInstance): InstanceMeasurements | null {
    const ref = resolveScrollElement(instance.element);
    if (!ref || typeof ref.offsetTop !== "number") return null;

    let distance = 0;
    let currentElement: HTMLElement | null = ref;
    while (currentElement?.offsetParent) {
      distance += currentElement.offsetTop;
      currentElement = currentElement.offsetParent as HTMLElement | null;
    }

    instance.measurements = {
      distance: distance / VzSIFactor,
      clientHeight: ref.clientHeight,
    };
    return instance.measurements;
  }

  setupResizeListener() {
    if (typeof window === "undefined") return;
    window.addEventListener("resize", this.boundHandleResize, { passive: true });
  }

  handleResize() {
    if (typeof window === "undefined") return;

    this.vw = window.innerWidth;
    this.vh = window.innerHeight;
    this.invalidateAllMeasurements();
    this.instances.forEach((instance) => {
      const { element, options, state } = instance;
      const ref = resolveScrollElement(element);
      if (!ref) return;

      this.measureInstance(instance);

      const start = this.calcTop(ref, options.startPoint, instance);
      const end = this.calcBot(ref, options.endPoint, instance);
      const scroll = window.scrollY;
      const percentages: number[] = [];

      state.scrolled = false;

      if (options.unrestrictedCallback) {
        options.unrestrictedCallback({ ref, vw: this.vw });
      }

      this.triggerScroll(instance, scroll, start, end, percentages);
    });
  }

  createInstance(
    key: string,
    element: ScrollElementInput,
    options: Partial<ScrollInstanceOptions> = {},
  ): ScrollInstance {
    this.initialize();

    const {
      values = [],
      startPoint = [0.5],
      endPoint = [0.15, 1],
      callback,
      unrestrictedCallback = null,
      isUnrestricted = false,
      log = false,
      useRAF = true,
    } = options;

    if (this.instances.has(key)) {
      const existingInstance = this.instances.get(key);
      if (existingInstance) {
        Object.assign(existingInstance.options, options);
        existingInstance.element = element;
        existingInstance.measurements = null;
        existingInstance.state.scrolled = false;
        existingInstance.state.lastScrollPosition = null;
        this.initializeScrollListener(key);
        this.scheduleInitialMeasurement();
        return existingInstance;
      }
    }

    const instance: ScrollInstance = {
      element,
      options: {
        values,
        startPoint,
        endPoint,
        callback,
        isUnrestricted,
        unrestrictedCallback,
        log,
        useRAF,
      },
      state: {
        scrolled: false,
        init: false,
        lastScrollPosition: null,
        hasTriggeredStart: false,
        hasTriggeredEnd: false,
      },
      measurements: null,
    };

    this.instances.set(key, instance);
    this.initializeScrollListener(key);
    this.scheduleInitialMeasurement();

    return instance;
  }

  scheduleInitialMeasurement(): void {
    if (typeof window === "undefined") return;
    if (this.initialMeasureRafId !== null) return;

    this.initialMeasureRafId = window.requestAnimationFrame(() => {
      this.initialMeasureRafId = null;
      this.instances.forEach((instance) => {
        if (!instance.measurements) {
          this.measureInstance(instance);
        }
      });
      scrollManager.requestUpdate();
    });
  }

  removeInstance(key: string): void {
    this.instances.delete(key);
    if (scrollManager) {
      scrollManager.removeInstance(key);
    }

    if (this.instances.size === 0) {
      this.cleanup();
    }
  }

  initializeScrollListener(key: string): void {
    const instance = this.instances.get(key);
    if (!instance || !scrollManager) return;

    scrollManager.createInstance(
      key,
      () => this.handleScroll(key),
      { useRAF: instance.options.useRAF ?? true },
    );
  }

  handleScroll(key: string): void {
    if (typeof window === "undefined") return;

    const instance = this.instances.get(key);
    if (!instance) return;

    const { element, options, state } = instance;
    const ref = resolveScrollElement(element);
    if (!ref) return;

    if (!instance.measurements) {
      this.measureInstance(instance);
    }

    const start = this.calcTop(ref, options.startPoint, instance);
    const end = this.calcBot(ref, options.endPoint, instance);
    const scroll = window.scrollY;
    const percentages: number[] = [];

    if (options.unrestrictedCallback && !state.init) {
      state.init = true;
      this.triggerScroll(instance, scroll, start, end, percentages);
      state.scrolled = true;
      return;
    }

    this.triggerScroll(instance, scroll, start, end, percentages);
  }

  triggerScroll(
    instance: ScrollInstance,
    scroll: number,
    start: number,
    end: number,
    percentages: number[],
  ): void {
    const { element, options, state } = instance;
    const ref = resolveScrollElement(element);
    if (!ref) return;

    // optional debug logging when enabled
    if (options && options.log === true) {
      console.log(JSON.stringify({ scroll, start, end }));
    }

    // Detect scroll direction and zone
    const lastScroll = state.lastScrollPosition;
    const isScrollingDown = lastScroll !== null && scroll > lastScroll;
    const isScrollingUp = lastScroll !== null && scroll < lastScroll;

    // Determine current and previous zones
    const currentlyAboveStart = scroll < start;
    const currentlyInZone = scroll >= start && scroll <= end;
    const currentlyBelowEnd = scroll > end;

    const wasAboveStart = lastScroll !== null && lastScroll < start;
    const wasBelowEnd = lastScroll !== null && lastScroll > end;

    // CRITICAL: Detect zone completely skipped (jumped over entirely)
    // Early exit optimization - only check if we have previous scroll data
    if (lastScroll !== null && lastScroll !== scroll) {
      // Scrolling down: jumped from above start to below end (skipped entire zone)
      if (isScrollingDown && wasAboveStart && currentlyBelowEnd) {
        // Fire both 0% and 100% in sequence
        this.calculatePercentages(percentages, options.values, 0);
        options.callback?.({ v: percentages, ref, vw: this.vw });

        // Reuse percentages array instead of creating new one
        percentages.length = 0;
        this.calculatePercentages(percentages, options.values, 1);
        options.callback?.({ v: percentages, ref, vw: this.vw });

        state.hasTriggeredStart = true;
        state.hasTriggeredEnd = true;
        state.scrolled = true;
        state.lastScrollPosition = scroll;
        return;
      }

      // Scrolling up: jumped from below end to above start (skipped entire zone)
      if (isScrollingUp && wasBelowEnd && currentlyAboveStart) {
        // Fire both 100% and 0% in sequence
        this.calculatePercentages(percentages, options.values, 1);
        options.callback?.({ v: percentages, ref, vw: this.vw });

        // Reuse percentages array instead of creating new one
        percentages.length = 0;
        this.calculatePercentages(percentages, options.values, 0);
        options.callback?.({ v: percentages, ref, vw: this.vw });

        state.hasTriggeredStart = true;
        state.hasTriggeredEnd = true;
        state.scrolled = true;
        state.lastScrollPosition = scroll;
        return;
      }

      // Scrolling down: jumped from above start into zone (guarantee 0% fires first)
      if (
        isScrollingDown &&
        wasAboveStart &&
        (currentlyInZone || currentlyBelowEnd) &&
        !state.hasTriggeredStart
      ) {
        this.calculatePercentages(percentages, options.values, 0);
        options.callback?.({ v: percentages, ref, vw: this.vw });
        state.hasTriggeredStart = true;
        state.hasTriggeredEnd = false;
        percentages.length = 0; // Clear for next use
        // Don't return - continue to process current zone position
      }

      // Scrolling up: jumped from below end into zone (guarantee 100% fires first)
      if (
        isScrollingUp &&
        wasBelowEnd &&
        (currentlyInZone || currentlyAboveStart) &&
        !state.hasTriggeredEnd
      ) {
        this.calculatePercentages(percentages, options.values, 1);
        options.callback?.({ v: percentages, ref, vw: this.vw });
        state.hasTriggeredEnd = true;
        state.hasTriggeredStart = false;
        percentages.length = 0; // Clear for next use
        // Don't return - continue to process current zone position
      }
    }

    // Handle above start position
    if (currentlyAboveStart && !state.scrolled) {
      this.calculatePercentages(percentages, options.values, 0);
      options.callback?.({ v: percentages, ref, vw: this.vw });
      state.scrolled = true;
      state.hasTriggeredStart = true;
      state.hasTriggeredEnd = false;
    }
    // Handle below end position
    else if (currentlyBelowEnd && !state.scrolled) {
      this.calculatePercentages(percentages, options.values, 1);
      options.callback?.({ v: percentages, ref, vw: this.vw });
      state.scrolled = true;
      state.hasTriggeredEnd = true;
      state.hasTriggeredStart = false;
    }

    // Handle active zone (between start and end)
    if (currentlyInZone) {
      const progress = end === start ? 1 : (scroll - start) / (end - start);
      this.calculatePercentages(percentages, options.values, progress);
      options.callback?.({ v: percentages, ref, vw: this.vw, start, end });
      if (state.scrolled) {
        state.scrolled = false;
      }
    }

    // Update last scroll position for next comparison
    state.lastScrollPosition = scroll;
  }

  calculatePercentages(
    percentages: number[],
    values: number[][],
    progress: number,
  ): void {
    values.forEach(([start, end]) => {
      percentages.push(start + (end - start) * progress);
    });
  }

  toggleInstance(key: string, enabled: boolean): void {
    if (scrollManager) {
      scrollManager.toggleInstance(key, enabled);
    }
  }

  calcTop(
    ref: ScrollElement,
    customStart: number[] | number,
    instance?: ScrollInstance,
  ): number {
    if (typeof window === "undefined") return 0;

    const { dist, clientHeight } = this.readMeasurements(ref, instance);
    const height = this.vh / VzSIFactor;

    if (customStart) {
      if (Array.isArray(customStart) && customStart.length) {
        if (customStart.length === 1) {
          return dist - height * (1 - customStart[0]);
        } else if (customStart.length === 2) {
          return (
            dist - height * (1 - customStart[0]) + clientHeight * customStart[1]
          );
        } else if (customStart.length === 3) {
          return customStart[2];
        } else if (customStart.length === 4) {
          return (
            dist -
            height * (1 - customStart[0]) +
            clientHeight * customStart[1] +
            customStart[3] / VzSIFactor
          );
        }
      } else if (typeof customStart === "number") {
        return dist - height * (1 - customStart);
      }
    }
    return dist - height;
  }

  calcBot(
    ref: ScrollElement,
    customEnd: number[] | number,
    instance?: ScrollInstance,
  ): number {
    if (typeof window === "undefined") return 0;

    const { dist: baseDist, clientHeight } = this.readMeasurements(
      ref,
      instance,
    );
    const height = this.vh / VzSIFactor;
    const dist = baseDist + clientHeight;

    if (customEnd) {
      if (Array.isArray(customEnd) && customEnd.length) {
        if (customEnd.length === 1) {
          return dist - height * customEnd[0];
        } else if (customEnd.length === 2) {
          return dist - height * customEnd[0] - clientHeight * customEnd[1];
        } else if (customEnd.length === 3) {
          return customEnd[2];
        } else if (customEnd.length === 4) {
          return (
            dist -
            height * (1 - customEnd[0]) +
            clientHeight * customEnd[1] +
            customEnd[3] / VzSIFactor
          );
        }
      } else if (typeof customEnd === "number") {
        return dist - height * customEnd;
      }
    }
    return dist;
  }

  readMeasurements(
    ref: ScrollElement,
    instance?: ScrollInstance,
  ): { dist: number; clientHeight: number } {
    if (instance?.measurements) {
      return {
        dist: instance.measurements.distance,
        clientHeight: instance.measurements.clientHeight / VzSIFactor,
      };
    }
    return {
      dist: this.distance(ref),
      clientHeight: ref.clientHeight / VzSIFactor,
    };
  }

  distance(ref: ScrollElement): number {
    let distance = 0;
    let currentElement: HTMLElement | null = ref;

    while (currentElement?.offsetParent) {
      distance += currentElement.offsetTop;
      currentElement = currentElement.offsetParent as HTMLElement | null;
    }
    return distance / VzSIFactor;
  }

  calcRefTop(
    element: ScrollElementInput | ScrollElementInput[],
    num: number[] | number,
  ): number {
    if (Array.isArray(element)) {
      const ref = element[0] ? resolveScrollElement(element[0]) : null;
      return ref ? this.calcTop(ref, num || 0) : 0;
    }

    const ref = resolveScrollElement(element);
    return ref ? this.calcTop(ref, num || 0) : 0;
  }
}

let scrollKickScheduled = false;
export function kickScroll(): void {
  if (typeof window === "undefined") return;
  if (scrollKickScheduled) return;
  scrollKickScheduled = true;
  window.requestAnimationFrame(() => {
    scrollKickScheduled = false;
    scrollManager.requestUpdate();
  });
}

let scrollTriggerInstance: ScrollInteractionManager | null = null;

export function getScrollTrigger(): ScrollInteractionManager | null {
  if (typeof window === "undefined") return null;

  if (!scrollTriggerInstance) {
    scrollTriggerInstance = new ScrollInteractionManager();
  }
  return scrollTriggerInstance;
}

export function refreshScrollMeasurements(): void {
  scrollTriggerInstance?.refreshAllMeasurements();
}

export default getScrollTrigger();
