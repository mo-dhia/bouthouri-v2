"use client";

import { type RefObject, useEffect, useRef, useState } from "react";
import { measureViewportDistance } from "./viewportDistance";

// WebGL context creation, model parsing, and first-render shader compilation
// can interrupt scrolling. This gate, adapted from Artifact, makes boots:
//  1. serialized — one scene boots at a time, page-wide;
//  2. scroll-quiet — prefer a stable scroll position across SCROLL_QUIET_MS,
//     and only grant slots while the tab is visible;
//  3. viewport-first — whenever a slot frees up, the pending scene nearest
//     the CURRENT viewport boots next (distances re-measured after every
//     quiet wait, so moving to another section re-sorts the queue);
//  4. optional prewarming — a caller can explicitly startScenePreboot() after
//     higher-priority work. The initial document does not request this globally.

// Quietness is judged from scroll POSITION samples, never from scroll
// events: while a boot blocks the main thread, rAF gaps suppress scroll
// events and an event-based check reads "quiet" mid-scroll — exactly the
// failure this gate exists to prevent. A position must hold still across
// every sample spanning SCROLL_QUIET_MS before a slot is granted.
const SCROLL_QUIET_MS = 300;
const QUIET_SAMPLE_INTERVAL_MS = 100;
const QUIET_SAMPLES_REQUIRED = Math.ceil(
  SCROLL_QUIET_MS / QUIET_SAMPLE_INTERVAL_MS,
);
// A scene the user is actually looking at may not wait for perfect stillness:
// people micro-scroll while reading, and an empty stage is worse than one
// short hitch. After this much CONTINUOUS on-screen time a pending scene
// boots regardless of motion. Sections flown past usually leave the viewport
// before the deadline; actual boot cost still needs profiling.
const ON_SCREEN_FORCE_MS = 700;
const URGENT_SAMPLES_REQUIRED = Math.ceil(
  ON_SCREEN_FORCE_MS / QUIET_SAMPLE_INTERVAL_MS,
);
// Frees the slot if a boot hangs (asset failure), so one broken scene can
// never starve the rest of the page.
const BOOT_SLOT_WATCHDOG_MS = 15000;

type BootWindowWaiter = {
  resolve: () => void;
  isUrgent: () => boolean;
  urgentSampleCount: number;
};

const bootWindowWaiters: BootWindowWaiter[] = [];
let quietSamplerTimerId: number | null = null;
let lastSampledScrollY: number | null = null;
let stableSampleCount = 0;

function stopQuietSampler(): void {
  if (quietSamplerTimerId !== null) {
    window.clearInterval(quietSamplerTimerId);
    quietSamplerTimerId = null;
  }

  lastSampledScrollY = null;
  stableSampleCount = 0;
}

function sampleBootWindow(): void {
  if (bootWindowWaiters.length === 0) {
    stopQuietSampler();
    return;
  }

  // Exact stillness only: native smooth scrolling and touchpad inertia can
  // continue moving between samples. A tolerance would classify visible
  // movement as quiet.
  const currentScrollY = Math.round(window.scrollY);
  const isStable =
    lastSampledScrollY !== null && currentScrollY === lastSampledScrollY;

  lastSampledScrollY = currentScrollY;
  stableSampleCount = isStable ? stableSampleCount + 1 : 0;

  const isVisible = document.visibilityState === "visible";
  const isQuiet = stableSampleCount >= QUIET_SAMPLES_REQUIRED;
  const readyWaiters: BootWindowWaiter[] = [];

  for (let index = bootWindowWaiters.length - 1; index >= 0; index -= 1) {
    const waiter = bootWindowWaiters[index];

    waiter.urgentSampleCount = waiter.isUrgent()
      ? waiter.urgentSampleCount + 1
      : 0;

    const isForced = waiter.urgentSampleCount >= URGENT_SAMPLES_REQUIRED;

    if (isVisible && (isQuiet || isForced)) {
      readyWaiters.push(waiter);
      bootWindowWaiters.splice(index, 1);
    }
  }

  if (bootWindowWaiters.length === 0) {
    stopQuietSampler();
  }

  for (const waiter of readyWaiters) {
    waiter.resolve();
  }
}

/**
 * Resolves at the next safe moment to run a main-thread-blocking boot: either
 * scrolling has stopped, or `isUrgent` has stayed true long enough that
 * waiting is worse than a brief hitch.
 */
function waitForBootWindow(isUrgent: () => boolean): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    bootWindowWaiters.push({ resolve, isUrgent, urgentSampleCount: 0 });

    if (quietSamplerTimerId === null) {
      quietSamplerTimerId = window.setInterval(
        sampleBootWindow,
        QUIET_SAMPLE_INTERVAL_MS,
      );
    }
  });
}

export function waitForScrollQuiet(): Promise<void> {
  return waitForBootWindow(() => false);
}

type BootSlotRequest = {
  grant: (release: () => void) => void;
  isCancelled: () => boolean;
  measureDistance: () => number;
};

const bootSlotQueue: BootSlotRequest[] = [];
let isBootSlotBusy = false;

function pruneCancelledRequests(): void {
  for (let index = bootSlotQueue.length - 1; index >= 0; index -= 1) {
    if (bootSlotQueue[index].isCancelled()) {
      bootSlotQueue.splice(index, 1);
    }
  }
}

function takeNearestRequest(): BootSlotRequest | null {
  pruneCancelledRequests();

  let bestIndex = -1;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < bootSlotQueue.length; index += 1) {
    const distance = bootSlotQueue[index].measureDistance();

    if (distance < bestDistance) {
      bestIndex = index;
      bestDistance = distance;
    }
  }

  if (bestIndex === -1) {
    return bootSlotQueue.shift() ?? null;
  }

  const [nearestRequest] = bootSlotQueue.splice(bestIndex, 1);

  return nearestRequest;
}

async function processBootSlotQueue(): Promise<void> {
  if (isBootSlotBusy || bootSlotQueue.length === 0) {
    return;
  }

  isBootSlotBusy = true;
  // Urgent = something the user is looking at is still waiting to boot.
  await waitForBootWindow(() =>
    bootSlotQueue.some(
      (request) => !request.isCancelled() && request.measureDistance() === 0,
    ),
  );

  // Pick AFTER the wait: the user may have scrolled somewhere else while we
  // waited, and whatever is on screen now must boot first.
  const nextRequest = takeNearestRequest();

  if (!nextRequest) {
    isBootSlotBusy = false;
    return;
  }

  let isReleased = false;

  nextRequest.grant(() => {
    if (isReleased) {
      return;
    }

    isReleased = true;
    isBootSlotBusy = false;
    void processBootSlotQueue();
  });
}

function requestSceneBootSlot(
  isCancelled: () => boolean,
  measureDistance: () => number,
): Promise<() => void> {
  return new Promise((grant) => {
    bootSlotQueue.push({ grant, isCancelled, measureDistance });
    void processBootSlotQueue();
  });
}

/**
 * Grants permission to boot a browser-rendered scene. Returns true once this scene
 * holds the page-wide boot slot; the slot is released when the scene reports
 * ready (or on unmount / watchdog timeout). `targetRef` ranks this scene by
 * distance from the current viewport whenever a slot frees up.
 */
export function useSceneBootSlot(
  wantsBoot: boolean,
  isReady: boolean,
  targetRef: RefObject<Element | null>,
): boolean {
  const [hasBootSlot, setHasBootSlot] = useState(false);
  const releaseRef = useRef<(() => void) | null>(null);
  const watchdogTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!wantsBoot || hasBootSlot) {
      return;
    }

    let isCancelled = false;

    const measureDistance = () => {
      const element = targetRef.current;

      if (!element) {
        return Number.POSITIVE_INFINITY;
      }

      return measureViewportDistance(
        element.getBoundingClientRect(),
        Math.max(window.innerHeight, 1),
      );
    };

    void requestSceneBootSlot(() => isCancelled, measureDistance).then(
      (release) => {
        if (isCancelled) {
          release();
          return;
        }
        releaseRef.current = release;
        watchdogTimerRef.current = window.setTimeout(
          release,
          BOOT_SLOT_WATCHDOG_MS,
        );
        setHasBootSlot(true);
      },
    );

    return () => {
      isCancelled = true;
    };
  }, [wantsBoot, hasBootSlot, targetRef]);

  useEffect(() => {
    if (isReady) {
      releaseRef.current?.();
      releaseRef.current = null;
      if (watchdogTimerRef.current !== null) {
        window.clearTimeout(watchdogTimerRef.current);
        watchdogTimerRef.current = null;
      }
    }
  }, [isReady]);

  useEffect(
    () => () => {
      releaseRef.current?.();
      releaseRef.current = null;

      if (watchdogTimerRef.current !== null) {
        window.clearTimeout(watchdogTimerRef.current);
      }
    },
    [],
  );

  return hasBootSlot;
}

const prebootSubscribers = new Set<() => void>();
let hasPrebootStarted = false;

/**
 * Explicit opt-in warmup for registered scenes after higher-priority work.
 * The caller decides whether warming every registered scene is appropriate.
 */
export function startScenePreboot(): void {
  if (hasPrebootStarted) {
    return;
  }

  hasPrebootStarted = true;

  for (const notifySubscriber of [...prebootSubscribers]) {
    notifySubscriber();
  }

  prebootSubscribers.clear();
}

export function subscribeToScenePreboot(onPreboot: () => void): () => void {
  if (hasPrebootStarted) {
    onPreboot();
    return () => {};
  }

  prebootSubscribers.add(onPreboot);

  return () => {
    prebootSubscribers.delete(onPreboot);
  };
}
