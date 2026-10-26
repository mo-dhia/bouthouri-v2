/**
 * Scroll Animation Optimization Utilities
 *
 * Provides embedded performance optimizations for scroll-triggered animations:
 * - RAF (RequestAnimationFrame) batching to consolidate DOM updates
 * - State tracking to avoid redundant class toggles
 * - Value caching to skip duplicate style updates
 * - Intersection Observer for viewport-based activation
 *
 * @module scrollInteraction/optimizations
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type RAFCallback = () => void;

export interface RAFBatch {
  schedule(key: string, callback: RAFCallback): void;
  cancel(key: string): void;
  cancelAll(): void;
  getPendingCount(): number;
}

interface ElementState {
  classes: Map<string, boolean>;
  styles: Map<string, string>;
  attributes: Map<string, string>;
}

type StyleElement = HTMLElement | SVGElement;

type OptimizedCallbackData = {
  ref?: StyleElement | null;
} & Record<string, unknown>;

type MeasuredCallback<TArgs extends unknown[], TResult> = (
  ...args: TArgs
) => TResult;

function setStyleValue(
  element: StyleElement,
  property: string,
  value: string,
): void {
  const style = element.style as CSSStyleDeclaration & Record<string, string>;
  style[property] = value;
}

interface StateTracker {
  trackClassToggle(
    element: StyleElement,
    className: string,
    shouldAdd: boolean,
  ): boolean;
  trackStyle(element: StyleElement, property: string, value: string): boolean;
  trackAttribute(
    element: StyleElement,
    attribute: string,
    value: string,
  ): boolean;
  clear(element: StyleElement): void;
  clearAll(): void;
}

interface IntersectionOptimizerOptions {
  rootMargin?: string;
  threshold?: number;
  onEnter?: (element: Element, key: string) => void;
  onExit?: (element: Element, key: string) => void;
}

interface IntersectionOptimizer {
  observe(element: StyleElement, key: string): void;
  unobserve(element: StyleElement): void;
  isIntersecting(element: StyleElement): boolean;
  disconnect(): void;
}

interface OptimizedCallbackOptions {
  enableRAF?: boolean;
  enableStateTracking?: boolean;
  enableViewportCheck?: boolean;
  viewportOptions?: IntersectionOptimizerOptions;
}

interface OptimizedCallback {
  rafBatch: RAFBatch | null;
  stateTracker: StateTracker | null;
  viewportOptimizer: IntersectionOptimizer | null;
  wrap<TData extends OptimizedCallbackData>(
    callback: (data: TData) => void,
    key?: string,
  ): (data: TData) => void;
  trackStyle(element: StyleElement, property: string, value: string): boolean;
  trackClassToggle(
    element: StyleElement,
    className: string,
    shouldAdd: boolean,
  ): boolean;
  cleanup(): void;
}

interface PerformanceMetrics {
  callCount: number;
  totalTime: number;
  maxTime: number;
  minTime: number;
  skippedUpdates: number;
}

interface PerformanceStats extends PerformanceMetrics {
  avgTime: number;
  skipRate: number;
}

interface PerformanceMonitor {
  measure<TArgs extends unknown[], TResult>(
    callback: MeasuredCallback<TArgs, TResult>,
    key?: string,
  ): MeasuredCallback<TArgs, TResult>;
  recordSkip(): void;
  getStats(): PerformanceStats;
  logStats(): void;
  reset(): void;
}

// ============================================================================
// RAF BATCHING SYSTEM
// ============================================================================

/**
 * Creates a RAF batching system that consolidates multiple animation updates
 * into a single frame. Callers must still separate layout reads from writes.
 */
export function createRAFBatch(): RAFBatch {
  let rafId: number | null = null;
  const pendingUpdates = new Map<string, RAFCallback>();
  let activeUpdates: Map<string, RAFCallback> | null = null;
  const isScheduled = (): boolean => rafId !== null;

  return {
    schedule(key: string, callback: RAFCallback): void {
      pendingUpdates.set(key, callback);

      if (!isScheduled()) {
        rafId = requestAnimationFrame(() => {
          // A callback can schedule its next frame without losing that update.
          activeUpdates = new Map(pendingUpdates);
          pendingUpdates.clear();
          rafId = null;
          activeUpdates.forEach((cb, updateKey) => {
            try {
              cb();
            } catch (error) {
              console.error(`RAF batch error for ${updateKey}:`, error);
            }
          });

          activeUpdates = null;
        });
      }
    },

    cancel(key: string): void {
      pendingUpdates.delete(key);
      activeUpdates?.delete(key);
    },

    cancelAll(): void {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      pendingUpdates.clear();
      activeUpdates?.clear();
    },

    getPendingCount(): number {
      return pendingUpdates.size;
    },
  };
}

// ============================================================================
// STATE TRACKING SYSTEM
// ============================================================================

/**
 * Creates a state tracker that prevents redundant DOM operations
 * by caching previous states and only updating when values change.
 */
export function createStateTracker(): StateTracker {
  let elementStates = new WeakMap<StyleElement, ElementState>();

  function getElementState(element: StyleElement): ElementState {
    let state = elementStates.get(element);

    if (!state) {
      state = {
        classes: new Map(),
        styles: new Map(),
        attributes: new Map(),
      };
      elementStates.set(element, state);
    }

    return state;
  }

  return {
    trackClassToggle(
      element: StyleElement,
      className: string,
      shouldAdd: boolean,
    ): boolean {
      const state = getElementState(element);
      const currentState = state.classes.get(className);

      if (currentState === shouldAdd) {
        return false; // No change needed
      }

      element.classList.toggle(className, shouldAdd);
      state.classes.set(className, shouldAdd);
      return true;
    },

    trackStyle(
      element: StyleElement,
      property: string,
      value: string,
    ): boolean {
      const state = getElementState(element);
      const currentValue = state.styles.get(property);

      if (currentValue === value) {
        return false; // No change needed
      }

      setStyleValue(element, property, value);
      state.styles.set(property, value);
      return true;
    },

    trackAttribute(
      element: StyleElement,
      attribute: string,
      value: string,
    ): boolean {
      const state = getElementState(element);
      const currentValue = state.attributes.get(attribute);

      if (currentValue === value) {
        return false; // No change needed
      }

      element.setAttribute(attribute, value);
      state.attributes.set(attribute, value);
      return true;
    },

    clear(element: StyleElement): void {
      elementStates.delete(element);
    },

    clearAll(): void {
      elementStates = new WeakMap<StyleElement, ElementState>();
    },
  };
}

// ============================================================================
// INTERSECTION OBSERVER OPTIMIZER
// ============================================================================

/**
 * Creates an Intersection Observer that automatically enables/disables
 * scroll animations based on viewport visibility.
 */
export function createIntersectionOptimizer(
  options: IntersectionOptimizerOptions = {},
): IntersectionOptimizer {
  const {
    rootMargin = "100px",
    threshold = 0,
    onEnter = null,
    onExit = null,
  } = options;

  const observedElements = new Map<
    Element,
    { key: string; isIntersecting: boolean }
  >();
  let observer: IntersectionObserver | null = null;

  if (typeof window !== "undefined" && "IntersectionObserver" in window) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const elementData = observedElements.get(entry.target);
          if (!elementData) return;

          const wasIntersecting = elementData.isIntersecting;
          const isIntersecting = entry.isIntersecting;

          // Only fire callbacks if state changed
          if (wasIntersecting !== isIntersecting) {
            elementData.isIntersecting = isIntersecting;

            if (isIntersecting && onEnter) {
              onEnter(entry.target, elementData.key);
            } else if (!isIntersecting && onExit) {
              onExit(entry.target, elementData.key);
            }
          }
        });
      },
      { rootMargin, threshold },
    );
  }

  return {
    observe(element: StyleElement, key: string): void {
      if (!observer || !element) return;

      observedElements.set(element, {
        key,
        isIntersecting: false,
      });

      observer.observe(element);
    },

    unobserve(element: StyleElement): void {
      if (!observer || !element) return;

      observer.unobserve(element);
      observedElements.delete(element);
    },

    isIntersecting(element: StyleElement): boolean {
      if (!observer) return true;
      const data = observedElements.get(element);
      return data ? data.isIntersecting : false;
    },

    disconnect(): void {
      if (observer) {
        observer.disconnect();
        observedElements.clear();
      }
    },
  };
}

// ============================================================================
// OPTIMIZED CALLBACK WRAPPER
// ============================================================================

/**
 * Wraps a scroll animation callback with automatic optimizations:
 * - RAF batching
 * - State tracking
 * - Viewport detection
 */
export function createOptimizedCallback(
  options: OptimizedCallbackOptions = {},
): OptimizedCallback {
  const {
    enableRAF = true,
    enableStateTracking = true,
    enableViewportCheck = false,
    viewportOptions = {},
  } = options;

  const rafBatch = enableRAF ? createRAFBatch() : null;
  const stateTracker = enableStateTracking ? createStateTracker() : null;
  const viewportOptimizer = enableViewportCheck
    ? createIntersectionOptimizer(viewportOptions)
    : null;

  return {
    rafBatch,
    stateTracker,
    viewportOptimizer,

    wrap<TData extends OptimizedCallbackData>(
      callback: (data: TData) => void,
      key: string = "default",
    ): (data: TData) => void {
      return (data: TData) => {
        // If viewport checking is enabled, skip if not visible
        if (viewportOptimizer && data.ref) {
          if (!viewportOptimizer.isIntersecting(data.ref)) {
            return; // Element not in viewport, skip animation
          }
        }

        // Execute callback
        const execute = () => {
          try {
            callback(data);
          } catch (error) {
            console.error(`Optimized callback error for ${key}:`, error);
          }
        };

        // Use RAF batching if enabled
        if (rafBatch) {
          rafBatch.schedule(key, execute);
        } else {
          execute();
        }
      };
    },

    trackStyle(
      element: StyleElement,
      property: string,
      value: string,
    ): boolean {
      if (stateTracker) {
        return stateTracker.trackStyle(element, property, value);
      }
      setStyleValue(element, property, value);
      return true;
    },

    trackClassToggle(
      element: StyleElement,
      className: string,
      shouldAdd: boolean,
    ): boolean {
      if (stateTracker) {
        return stateTracker.trackClassToggle(element, className, shouldAdd);
      }
      element.classList.toggle(className, shouldAdd);
      return true;
    },

    cleanup(): void {
      if (rafBatch) rafBatch.cancelAll();
      if (stateTracker) stateTracker.clearAll();
      if (viewportOptimizer) viewportOptimizer.disconnect();
    },
  };
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * Creates a performance monitor for tracking animation performance
 */
export function createPerformanceMonitor(): PerformanceMonitor {
  const metrics: PerformanceMetrics = {
    callCount: 0,
    totalTime: 0,
    maxTime: 0,
    minTime: Infinity,
    skippedUpdates: 0,
  };

  return {
    measure<TArgs extends unknown[], TResult>(
      callback: MeasuredCallback<TArgs, TResult>,
    ): MeasuredCallback<TArgs, TResult> {
      return (...args: TArgs) => {
        const start = performance.now();
        const result = callback(...args);
        const duration = performance.now() - start;

        metrics.callCount++;
        metrics.totalTime += duration;
        metrics.maxTime = Math.max(metrics.maxTime, duration);
        metrics.minTime = Math.min(metrics.minTime, duration);

        return result;
      };
    },

    recordSkip(): void {
      metrics.skippedUpdates++;
    },

    getStats(): PerformanceStats {
      return {
        ...metrics,
        avgTime:
          metrics.callCount > 0 ? metrics.totalTime / metrics.callCount : 0,
        skipRate:
          metrics.callCount > 0
            ? (metrics.skippedUpdates / metrics.callCount) * 100
            : 0,
      };
    },

    logStats(): void {
      const stats = this.getStats();
      console.log("=== Scroll Animation Performance ===");
      console.log(`Total Calls: ${stats.callCount}`);
      console.log(
        `Skipped Updates: ${stats.skippedUpdates} (${stats.skipRate.toFixed(2)}%)`,
      );
      console.log(`Avg Time: ${stats.avgTime.toFixed(3)}ms`);
      console.log(`Min Time: ${stats.minTime.toFixed(3)}ms`);
      console.log(`Max Time: ${stats.maxTime.toFixed(3)}ms`);
      console.log(`Total Time: ${stats.totalTime.toFixed(3)}ms`);
    },

    reset(): void {
      metrics.callCount = 0;
      metrics.totalTime = 0;
      metrics.maxTime = 0;
      metrics.minTime = Infinity;
      metrics.skippedUpdates = 0;
    },
  };
}
