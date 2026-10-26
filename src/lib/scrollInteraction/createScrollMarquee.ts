import scrollManager from "./scrollManager";
import {
  createIntersectionOptimizer,
  createStateTracker,
} from "./scrollTrigger";

/**
 * Velocity-coupled marquee engine.
 *
 * Drives a horizontal track that drifts at a constant base speed and reacts to
 * the page's vertical scroll velocity — scrolling accelerates the drift and can
 * flip its direction, smoothed through a spring so the reaction eases in and out
 * rather than snapping. Optional pointer-drag, horizontal-wheel scrubbing and
 * focus-within pausing round out the interaction model. Callers can also opt
 * into hover pausing and provide a persistent pause/play control. The track only
 * animates while its viewport anchor and document are visible.
 *
 * The resting drift runs on the compositor: one infinite Web Animation moves
 * the track, so a marquee at rest costs the main thread nothing. Script runs
 * only while the scroll spring has energy, steering that animation's playback
 * rate (its sign is the direction), and stops itself once the spring settles.
 * Drags and wheel gestures move the animation's clock. Where `Element.animate`
 * is missing the original frame loop writes the transform instead.
 *
 * Extracted from the "trusted by" logo carousel so any duplicated-group marquee
 * (that section, the journal ticker, …) can share one behaviour.
 */

export interface ScrollMarqueeElements {
  /** Anchor observed for viewport visibility; the marquee idles when off screen. */
  viewport: HTMLElement;
  /** Element that receives the pointer / wheel / focus interaction listeners. */
  surface: HTMLElement;
  /** Element whose `transform` is animated (the moving track). */
  track: HTMLElement;
  /** A single seamless loop (one duplicated group); measured for the wrap width. */
  loopUnit: HTMLElement;
  /** Optional persistent pause/play control for an auto-moving marquee. */
  pauseControl?: HTMLButtonElement;
}

export interface ScrollMarqueeOptions {
  /** Unique id for the shared scrollManager registration. */
  instanceId: string;
  /** Seconds for the track to drift one full loop while at rest. */
  durationSeconds?: number;
  /** Allow horizontal wheel / trackpad gestures to scrub the track. Default true. */
  enableWheel?: boolean;
  /** Allow pointer dragging of the track. Default true. */
  enableDrag?: boolean;
  /** Pause the drift while a child of `surface` holds focus. Default true. */
  enableFocusPause?: boolean;
  /** Pause while a mouse or pen pointer is over `surface`. Default false. */
  enablePointerPause?: boolean;
  /** Class toggled on `surface` while a drag is in progress. */
  draggingClassName?: string;
  /**
   * Which way the content travels at rest and while scrolling down; scrolling
   * up runs the opposite way. Default "right" — the behaviour every existing
   * marquee shipped with. A drag always follows the pointer regardless.
   */
  restingDirection?: "left" | "right";
  /** Console prefix for diagnostic logging; omit to stay silent. */
  debugLabel?: string;
  /** Accessible label used while the control can pause motion. */
  pauseLabel?: string;
  /** Accessible label used while the control can resume motion. */
  playLabel?: string;
}

const DEFAULT_DURATION_SECONDS = 34;
const SCROLL_IDLE_RESET_MS = 80;
const MAX_DT_SECONDS = 0.05;
const MAX_SPRING_STEP_SECONDS = 1 / 120;
const MAX_SCROLL_VELOCITY = 1200;
const MAX_VELOCITY_FACTOR = 2.5;
const SPRING_DAMPING = 50;
const SPRING_STIFFNESS = 400;
const VELOCITY_INPUT = 1000;
const VELOCITY_OUTPUT = 5;
const DRAG_THRESHOLD_PX = 4;
// Wheel/trackpad has no "end" event, so we resume the drift after this idle gap,
// mirroring how vertical scroll naturally decays back to the base speed.
const WHEEL_IDLE_RESUME_MS = 220;
// Below this the scroll spring has no visible effect on the drift rate.
const SPRING_SETTLED = 0.01;
// The drift animation's clock starts this many loops in, so reversed playback
// (scrolling up) never reaches time zero, where a reversed animation finishes.
const DRIFT_BASE_LOOPS = 10_000;

const roundDebugNumber = (value: number) => Math.round(value * 1000) / 1000;

function getEventTargetSummary(event: Event) {
  const target = event.target;

  if (!(target instanceof Element)) {
    return { targetTag: null, linkHref: null, linkLabel: null };
  }

  const link = target.closest("a");

  return {
    targetTag: target.tagName.toLowerCase(),
    linkHref: link instanceof HTMLAnchorElement ? link.href : null,
    linkLabel:
      link?.getAttribute("aria-label") ?? link?.getAttribute("title") ?? null,
  };
}

function wrapOffset(value: number, width: number) {
  if (width <= 0 || !Number.isFinite(value)) return 0;

  const normalized = ((value % width) + width) % width;
  return normalized === 0 ? 0 : normalized - width;
}

export function createScrollMarquee(
  elements: ScrollMarqueeElements,
  options: ScrollMarqueeOptions,
): (() => void) | null {
  if (typeof window === "undefined") return null;

  const { viewport, surface, track, loopUnit, pauseControl } = elements;
  if (!viewport || !surface || !track || !loopUnit) return null;

  const {
    instanceId,
    durationSeconds = DEFAULT_DURATION_SECONDS,
    enableWheel = true,
    enableDrag = true,
    enableFocusPause = true,
    enablePointerPause = false,
    draggingClassName,
    restingDirection = "right",
    debugLabel,
    pauseLabel = "Pause carousel animation",
    playLabel = "Play carousel animation",
  } = options;

  /* offset -= base * directionFactor, so -1 moves the track right and +1 moves
     it left. The sign of "content travels leftward" is therefore +1. */
  const restingDirectionFactor = restingDirection === "left" ? 1 : -1;

  const stateTracker = createStateTracker();
  const reducedMotionQuery =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;

  const viewportOptimizer = createIntersectionOptimizer({
    rootMargin: "-1px 0px",
    threshold: 0.01,
    onEnter: () => {
      isVisible = true;
      debugState("viewport-enter");
      startTicker("viewport-enter");
    },
    onExit: () => {
      isVisible = false;
      debugState("viewport-exit");
      stopTicker("viewport-exit");
      resetScrollVelocityState("viewport-exit");
    },
  });

  let offset = 0;
  let loopWidth = 0;
  let targetScrollVelocity = 0;
  let smoothScrollVelocity = 0;
  let smoothVelocityMomentum = 0;
  let directionFactor = restingDirectionFactor;
  let lastLoggedDirectionFactor = directionFactor;
  let lastScrollY = window.scrollY;
  let lastScrollAt = performance.now();
  let lastFrameAt = 0;
  let rafId: number | null = null;
  let isVisible = !("IntersectionObserver" in window);
  let isPausedByInteraction = false;
  let isPausedByPointer = false;
  let isPausedByControl = false;
  let isReducedMotion = reducedMotionQuery?.matches ?? false;
  let isDocumentVisible = !document.hidden;
  let resizeObserver: ResizeObserver | null = null;
  let dragPointerId: number | null = null;
  let dragStartX = 0;
  let dragStartOffset = 0;
  let hasPassedDragThreshold = false;
  let suppressNextClick = false;
  let wheelIdleTimeoutId: number | null = null;
  /** The compositor drift, once there is a loop to drift through. */
  let drift: Animation | null = null;
  /** The rate last given to the drift; a pending update reads back the old one. */
  let driftRate = restingDirectionFactor;
  const canDrift = typeof track.animate === "function";
  const driftDurationMs = durationSeconds * 1000;

  /** The drift clock for an offset: one loop is one duration, offset 0 its start. */
  function driftTimeFor(value: number) {
    const progress =
      loopWidth > 0 ? -wrapOffset(value, loopWidth) / loopWidth : 0;
    return (DRIFT_BASE_LOOPS + progress) * driftDurationMs;
  }

  /** Reads the offset the compositor has carried the track to. */
  function syncOffsetFromDrift() {
    const time = drift?.currentTime;
    if (typeof time !== "number" || !Number.isFinite(time) || loopWidth <= 0)
      return;
    const progress = (time / driftDurationMs) % 1;
    offset = wrapOffset(-progress * loopWidth, loopWidth);
  }

  function setDriftRate(rate: number) {
    if (!drift || rate === driftRate) return;
    driftRate = rate;
    // updatePlaybackRate keeps the compositor's clock continuous; a direct
    // playbackRate write can jump by the main thread's lag behind it.
    if (typeof drift.updatePlaybackRate === "function")
      drift.updatePlaybackRate(rate);
    else drift.playbackRate = rate;
  }

  function driftKeyframes(): Keyframe[] {
    return [
      { transform: "translate3d(0px, 0, 0)" },
      { transform: `translate3d(${(-loopWidth).toFixed(3)}px, 0, 0)` },
    ];
  }

  /** Creates, or re-measures, the drift; it starts paused at the current offset. */
  function syncDrift() {
    if (!canDrift || loopWidth <= 0 || isReducedMotion) return;
    if (drift) {
      // The clock is a fraction of a loop, so a new width keeps the position
      // in proportion, as the frame loop's rescaling did.
      (drift.effect as KeyframeEffect | null)?.setKeyframes(driftKeyframes());
      return;
    }
    drift = track.animate(driftKeyframes(), {
      duration: driftDurationMs,
      iterations: Number.POSITIVE_INFINITY,
      easing: "linear",
    });
    drift.addEventListener("finish", handleDriftFinish);
    drift.addEventListener("cancel", handleDriftCancel);
    drift.pause();
    driftRate = 1;
    setDriftRate(directionFactor);
    drift.currentTime = driftTimeFor(offset);
  }

  /**
   * Reversed playback finishes at time zero even with infinite iterations.
   * That is the loop's seam, so the clock moves back to the buffered seam and
   * the drift carries on; a drift that may not run stays paused there.
   */
  function handleDriftFinish() {
    // A seek, pause or gesture since the boundary superseded this event.
    if (!drift || drift.playState !== "finished") return;
    offset = 0;
    drift.currentTime = driftTimeFor(offset);
    if (!canAnimate()) drift.pause();
  }

  /** Cancelled by something else: a stationary track keeps no promotion hint. */
  function handleDriftCancel() {
    if (drift?.playState === "idle") track.style.willChange = "";
  }

  function cancelDrift() {
    drift?.removeEventListener("finish", handleDriftFinish);
    drift?.removeEventListener("cancel", handleDriftCancel);
    drift?.cancel();
    drift = null;
  }

  function getDebugState() {
    syncOffsetFromDrift();
    return {
      offset: roundDebugNumber(offset),
      loopWidth: roundDebugNumber(loopWidth),
      targetScrollVelocity: roundDebugNumber(targetScrollVelocity),
      smoothScrollVelocity: roundDebugNumber(smoothScrollVelocity),
      directionFactor,
      rafActive: rafId !== null,
      driftState: drift?.playState ?? null,
      driftRate,
      isVisible,
      isPausedByInteraction,
      isPausedByPointer,
      isPausedByControl,
      isReducedMotion,
      isDocumentVisible,
      dragPointerId,
      hasPassedDragThreshold,
      suppressNextClick,
      focusPaused: isFocusPaused(),
    };
  }

  function debugState(event: string, payload?: Record<string, unknown>) {
    if (!debugLabel) return;

    console.log(
      `[${debugLabel}] ${JSON.stringify({
        event,
        ...(payload ?? {}),
        ...getDebugState(),
      })}`,
    );
  }

  function resetScrollVelocityState(reason?: string) {
    targetScrollVelocity = 0;
    smoothScrollVelocity = 0;
    smoothVelocityMomentum = 0;
    lastScrollY = window.scrollY;
    lastScrollAt = performance.now();
    lastFrameAt = 0;

    if (reason) {
      debugState("reset-scroll-velocity", { reason });
    }
  }

  function canAnimate() {
    return (
      isVisible &&
      !isPausedByInteraction &&
      !isPausedByPointer &&
      !isPausedByControl &&
      !isFocusPaused() &&
      !isReducedMotion &&
      isDocumentVisible &&
      loopWidth > 0
    );
  }

  function isFocusPaused() {
    return enableFocusPause && surface.matches(":focus-within");
  }

  function setTrackOffset() {
    if (drift) {
      drift.currentTime = driftTimeFor(offset);
      return;
    }
    stateTracker.trackStyle(
      track,
      "transform",
      `translate3d(${offset.toFixed(3)}px, 0, 0)`,
    );
  }

  function syncPauseControl() {
    if (!pauseControl) return;

    pauseControl.dataset.marqueeReady = isReducedMotion ? "false" : "true";
    pauseControl.dataset.marqueePaused = `${isPausedByControl}`;
    pauseControl.disabled = isReducedMotion;
    pauseControl.setAttribute(
      "aria-label",
      isPausedByControl ? playLabel : pauseLabel,
    );
  }

  function setManualDirectionFromOffsetDelta(delta: number) {
    if (delta > 0) {
      directionFactor = -1;
    } else if (delta < 0) {
      directionFactor = 1;
    }
  }

  function applyManualOffset(nextOffset: number) {
    syncOffsetFromDrift();
    const previousOffset = offset;
    const manualDelta = nextOffset - previousOffset;

    offset = wrapOffset(nextOffset, loopWidth);
    setManualDirectionFromOffsetDelta(manualDelta);
    resetScrollVelocityState();
    setTrackOffset();
  }

  function setDraggingState(isDragging: boolean) {
    if (!draggingClassName) return;
    stateTracker.trackClassToggle(surface, draggingClassName, isDragging);
  }

  function measureLoopWidth() {
    syncOffsetFromDrift();
    const previousWidth = loopWidth;
    const nextWidth = loopUnit.offsetWidth || track.scrollWidth / 2 || 0;

    if (nextWidth <= 0) {
      loopWidth = 0;
      debugState("measure-loop-width-zero", {
        nextWidth,
        trackScrollWidth: track.scrollWidth,
        loopUnitOffsetWidth: loopUnit.offsetWidth,
      });
      stopTicker("measure-loop-width-zero");
      return;
    }

    if (previousWidth > 0 && previousWidth !== nextWidth) {
      offset = wrapOffset((offset / previousWidth) * nextWidth, nextWidth);
    } else if (previousWidth === 0) {
      offset = wrapOffset(offset, nextWidth);
    }

    loopWidth = nextWidth;
    debugState("measure-loop-width", {
      previousWidth: roundDebugNumber(previousWidth),
      nextWidth: roundDebugNumber(nextWidth),
    });

    if (!isReducedMotion) {
      if (canDrift) syncDrift();
      else setTrackOffset();
      startTicker("measure-loop-width");
    }
  }

  function tick(now: number) {
    rafId = null;

    if (!canAnimate()) {
      debugState("tick-cancelled-cannot-animate", { canAnimate: false });
      return;
    }

    if (lastFrameAt === 0) {
      lastFrameAt = now;
    }

    const dt = Math.min(
      Math.max((now - lastFrameAt) / 1000, 0),
      MAX_DT_SECONDS,
    );

    lastFrameAt = now;

    const currentScrollY = window.scrollY;
    const scrollDelta = currentScrollY - lastScrollY;

    const rawScrollVelocity = scrollDelta / Math.max(dt, 0.001);
    targetScrollVelocity = Math.min(
      MAX_SCROLL_VELOCITY,
      Math.max(-MAX_SCROLL_VELOCITY, rawScrollVelocity),
    );
    lastScrollY = currentScrollY;

    if (scrollDelta !== 0) {
      lastScrollAt = now;
      // Spring settling can cross zero by a tiny amount; only real scroll input
      // may reverse the marquee so its resting drift stays stable.
      directionFactor =
        scrollDelta > 0 ? restingDirectionFactor : -restingDirectionFactor;
    }

    if (now - lastScrollAt > SCROLL_IDLE_RESET_MS) {
      targetScrollVelocity = 0;
    }

    // Fixed substeps keep the explicit spring stable when a frame is delayed.
    const springSteps = Math.max(1, Math.ceil(dt / MAX_SPRING_STEP_SECONDS));
    const springStep = dt / springSteps;

    for (let step = 0; step < springSteps; step += 1) {
      const springForce =
        (targetScrollVelocity - smoothScrollVelocity) * SPRING_STIFFNESS;
      const dampingForce = smoothVelocityMomentum * SPRING_DAMPING;

      smoothVelocityMomentum += (springForce - dampingForce) * springStep;
      smoothScrollVelocity += smoothVelocityMomentum * springStep;
    }

    if (
      !Number.isFinite(smoothScrollVelocity) ||
      !Number.isFinite(smoothVelocityMomentum)
    ) {
      resetScrollVelocityState("non-finite-spring-state");
    }

    const rawVelocityFactor =
      (smoothScrollVelocity / VELOCITY_INPUT) * VELOCITY_OUTPUT;
    const velocityFactor = Math.min(
      MAX_VELOCITY_FACTOR,
      Math.max(-MAX_VELOCITY_FACTOR, rawVelocityFactor),
    );
    if (drift) {
      // The compositor carries the drift; the frame only steers its rate.
      setDriftRate(directionFactor * (1 + Math.abs(velocityFactor)));
      const settled =
        targetScrollVelocity === 0 &&
        Math.abs(smoothScrollVelocity) < SPRING_SETTLED &&
        Math.abs(smoothVelocityMomentum) < SPRING_SETTLED;
      if (settled) {
        smoothScrollVelocity = 0;
        smoothVelocityMomentum = 0;
        setDriftRate(directionFactor);
        lastFrameAt = 0;
        debugState("drift-settled");
        return;
      }
      rafId = window.requestAnimationFrame(tick);
      return;
    }

    const baseSpeed = loopWidth / durationSeconds;
    const baseDistance = baseSpeed * dt;

    if (directionFactor !== lastLoggedDirectionFactor) {
      lastLoggedDirectionFactor = directionFactor;
      debugState("direction-change", {
        velocityFactor: roundDebugNumber(velocityFactor),
        scrollDelta: roundDebugNumber(scrollDelta),
        currentScrollY: roundDebugNumber(currentScrollY),
      });
    }

    offset -= baseDistance * directionFactor * (1 + Math.abs(velocityFactor));
    offset = wrapOffset(offset, loopWidth);

    setTrackOffset();
    rafId = window.requestAnimationFrame(tick);
  }

  function startTicker(reason: string, fromScroll = false) {
    if (canAnimate() && drift && drift.playState !== "running") {
      // Cancelled by something else, or reversed onto time zero before its
      // finish event: play() would rewind to zero, or throw while reversed,
      // so restore a buffered clock at the position it was showing first.
      const time = drift.currentTime;
      if (time === null || (driftRate < 0 && Number(time) <= 0)) {
        syncOffsetFromDrift();
        drift.currentTime = driftTimeFor(offset);
      }
      track.style.willChange = "transform";
      drift.play();
    }
    if (!canAnimate() || rafId !== null) {
      debugState("start-ticker-skipped", {
        reason,
        canAnimate: canAnimate(),
        rafAlreadyActive: rafId !== null,
      });
      return;
    }

    track.style.willChange = "transform";
    // A scroll that wakes the spring is itself the first delta to measure.
    if (!fromScroll) lastScrollY = window.scrollY;
    lastFrameAt = performance.now();
    rafId = window.requestAnimationFrame(tick);
    debugState("start-ticker", { reason });
  }

  function stopTicker(reason: string) {
    track.style.willChange = "";
    // A finished (reversed onto zero) drift resumes if seeked unpaused, so
    // gestures and pauses take it over paused as well.
    if (drift?.playState === "running" || drift?.playState === "finished") {
      drift.pause();
      syncOffsetFromDrift();
    }

    if (rafId === null) {
      debugState("stop-ticker-skipped", { reason });
      return;
    }

    window.cancelAnimationFrame(rafId);
    rafId = null;
    lastFrameAt = 0;
    debugState("stop-ticker", { reason });
  }

  function pauseForInteraction(reason: string) {
    if (isPausedByInteraction) {
      debugState("pause-interaction-skipped", { reason });
      return;
    }

    isPausedByInteraction = true;
    debugState("pause-interaction", { reason });
    stopTicker(`pause:${reason}`);
  }

  function resumeFromInteraction(reason: string) {
    if (!isPausedByInteraction) {
      debugState("resume-interaction-skipped", { reason });
      return;
    }

    isPausedByInteraction = false;
    debugState("resume-interaction", { reason });
    resetScrollVelocityState(`resume:${reason}`);
    startTicker(`resume:${reason}`);
  }

  function clearWheelIdleTimeout() {
    if (wheelIdleTimeoutId === null) return;

    window.clearTimeout(wheelIdleTimeoutId);
    wheelIdleTimeoutId = null;
  }

  function resetInteraction() {
    clearWheelIdleTimeout();
    const pointerId = dragPointerId;
    dragPointerId = null;
    if (pointerId !== null) {
      try {
        if (surface.hasPointerCapture(pointerId))
          surface.releasePointerCapture(pointerId);
      } catch {
        // A removed surface may already have lost its pointer capture.
      }
    }
    hasPassedDragThreshold = false;
    suppressNextClick = false;
    isPausedByInteraction = false;
    setDraggingState(false);
  }

  function scheduleWheelIdleResume() {
    clearWheelIdleTimeout();
    wheelIdleTimeoutId = window.setTimeout(() => {
      wheelIdleTimeoutId = null;

      // An active drag owns its own resume. Other pause reasons are independent,
      // and startTicker checks all of them before restarting motion.
      if (dragPointerId !== null) {
        debugState("wheel-idle-resume-skipped");
        return;
      }

      resumeFromInteraction("wheel-idle");
    }, WHEEL_IDLE_RESUME_MS);
  }

  function handleFocusIn(event: FocusEvent) {
    debugState("focus-in", {
      ...getEventTargetSummary(event),
      eventType: event.type,
    });
    stopTicker(`focus:${event.type}`);
  }

  function handleFocusOut(event: FocusEvent) {
    const nextTarget = event.relatedTarget;

    if (nextTarget instanceof Node && surface.contains(nextTarget)) {
      return;
    }

    if (dragPointerId === null) startTicker("focus-out");
  }

  function handlePointerEnter(event: PointerEvent) {
    if (event.pointerType === "touch") return;
    isPausedByPointer = true;
    stopTicker("pointer-enter");
  }

  function handlePointerLeave(event: PointerEvent) {
    if (event.pointerType === "touch") return;
    isPausedByPointer = false;
    startTicker("pointer-leave");
  }

  function handlePauseControlClick() {
    if (isReducedMotion) return;

    isPausedByControl = !isPausedByControl;
    syncPauseControl();

    if (isPausedByControl) {
      stopTicker("pause-control");
    } else {
      resetScrollVelocityState("play-control");
      startTicker("play-control");
    }
  }

  function handleVisibilityChange() {
    isDocumentVisible = !document.hidden;

    if (isDocumentVisible) {
      resetScrollVelocityState("document-visible");
      startTicker("document-visible");
    } else {
      stopTicker("document-hidden");
      resetScrollVelocityState("document-hidden");
    }
  }

  function handleWheel(event: WheelEvent) {
    if (loopWidth <= 0 || isReducedMotion) return;

    const horizontal = Math.abs(event.deltaX);
    const vertical = Math.abs(event.deltaY);

    if (horizontal === 0 || horizontal < vertical) return;

    debugState("horizontal-wheel", {
      deltaX: roundDebugNumber(event.deltaX),
      deltaY: roundDebugNumber(event.deltaY),
    });
    event.preventDefault();
    pauseForInteraction("horizontal-wheel");
    applyManualOffset(offset - event.deltaX);
    scheduleWheelIdleResume();
  }

  function handlePointerDown(event: PointerEvent) {
    const pointerPayload = {
      ...getEventTargetSummary(event),
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      button: event.button,
      clientX: roundDebugNumber(event.clientX),
    };

    if (!event.isPrimary) {
      debugState("pointer-down-ignored", {
        ...pointerPayload,
        reason: "not-primary",
      });
      return;
    }

    if (event.pointerType === "mouse" && event.button !== 0) {
      debugState("pointer-down-ignored", {
        ...pointerPayload,
        reason: "non-left-mouse-button",
      });
      return;
    }

    if (loopWidth <= 0 || isReducedMotion) {
      debugState("pointer-down-ignored", {
        ...pointerPayload,
        reason: "inactive-marquee",
      });
      return;
    }

    syncOffsetFromDrift();
    dragPointerId = event.pointerId;
    dragStartX = event.clientX;
    dragStartOffset = offset;
    hasPassedDragThreshold = false;
    suppressNextClick = false;
    debugState("pointer-down-armed", pointerPayload);
  }

  function handlePointerMove(event: PointerEvent) {
    if (event.pointerId !== dragPointerId) return;

    const deltaX = event.clientX - dragStartX;

    if (!hasPassedDragThreshold) {
      if (Math.abs(deltaX) < DRAG_THRESHOLD_PX) return;

      hasPassedDragThreshold = true;
      suppressNextClick = true;
      setDraggingState(true);
      debugState("drag-threshold-crossed", {
        ...getEventTargetSummary(event),
        pointerId: event.pointerId,
        deltaX: roundDebugNumber(deltaX),
        threshold: DRAG_THRESHOLD_PX,
      });
      pauseForInteraction("drag-threshold-crossed");
      resetScrollVelocityState("drag-threshold-crossed");

      try {
        surface.setPointerCapture(event.pointerId);
        debugState("pointer-capture-set", { pointerId: event.pointerId });
      } catch (error) {
        debugState("pointer-capture-set-failed", {
          pointerId: event.pointerId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    event.preventDefault();
    applyManualOffset(dragStartOffset + deltaX);
  }

  function finishPointerDrag(event: PointerEvent) {
    if (event.pointerId !== dragPointerId) {
      debugState("pointer-finish-ignored", {
        pointerId: event.pointerId,
        activePointerId: dragPointerId,
        eventType: event.type,
      });
      return;
    }

    const wasDragging = hasPassedDragThreshold;
    const hadPointerCapture = surface.hasPointerCapture(event.pointerId);

    try {
      if (hadPointerCapture) {
        surface.releasePointerCapture(event.pointerId);
      }
    } catch (error) {
      debugState("pointer-capture-release-failed", {
        pointerId: event.pointerId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    debugState("pointer-finish", {
      ...getEventTargetSummary(event),
      pointerId: event.pointerId,
      eventType: event.type,
      wasDragging,
      hadPointerCapture,
    });

    dragPointerId = null;
    hasPassedDragThreshold = false;
    setDraggingState(false);

    resumeFromInteraction(`pointer-finish:${event.type}`);
  }

  function handleClickCapture(event: MouseEvent) {
    if (!suppressNextClick) {
      debugState("click-pass-through", {
        ...getEventTargetSummary(event),
        defaultPrevented: event.defaultPrevented,
      });
      return;
    }

    debugState("click-suppressed-after-drag", {
      ...getEventTargetSummary(event),
      defaultPrevented: event.defaultPrevented,
    });
    event.preventDefault();
    event.stopPropagation();
    suppressNextClick = false;
  }

  function handleNativeDragStart(event: DragEvent) {
    debugState("native-dragstart-prevented", {
      ...getEventTargetSummary(event),
    });
    event.preventDefault();
  }

  function handleReducedMotionChange(event: MediaQueryListEvent) {
    isReducedMotion = event.matches;
    syncPauseControl();
    debugState("reduced-motion-change", { matches: event.matches });

    if (isReducedMotion) {
      stopTicker("reduced-motion-enabled");
      resetScrollVelocityState("reduced-motion-enabled");
      resetInteraction();
      cancelDrift();
      track.style.transform = "";
      track.style.willChange = "";
      return;
    }

    measureLoopWidth();
    startTicker("reduced-motion-disabled");
  }

  syncPauseControl();
  measureLoopWidth();

  scrollManager.createInstance(instanceId, () => {
    lastScrollAt = performance.now();
    // At rest only the compositor runs; a scroll wakes the spring.
    if (drift) startTicker("scroll", true);
  });

  viewportOptimizer.observe(viewport, instanceId);

  if (enableWheel) {
    surface.addEventListener("wheel", handleWheel, { passive: false });
  }

  if (enableDrag) {
    surface.addEventListener("pointerdown", handlePointerDown);
    surface.addEventListener("pointermove", handlePointerMove);
    surface.addEventListener("pointerup", finishPointerDrag);
    surface.addEventListener("pointercancel", finishPointerDrag);
    surface.addEventListener("click", handleClickCapture, true);
    surface.addEventListener("dragstart", handleNativeDragStart, true);
  }

  if (enablePointerPause) {
    surface.addEventListener("pointerenter", handlePointerEnter);
    surface.addEventListener("pointerleave", handlePointerLeave);
  }

  if (enableFocusPause) {
    surface.addEventListener("focusin", handleFocusIn);
    surface.addEventListener("focusout", handleFocusOut);
    surface.addEventListener("focus", handleFocusIn, true);
    surface.addEventListener("blur", handleFocusOut, true);
  }

  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(measureLoopWidth);
    resizeObserver.observe(loopUnit);
    resizeObserver.observe(track);
  } else {
    window.addEventListener("resize", measureLoopWidth, { passive: true });
  }

  reducedMotionQuery?.addEventListener("change", handleReducedMotionChange);
  pauseControl?.addEventListener("click", handlePauseControlClick);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  if (isVisible) {
    startTicker("initial-visible");
  }

  return () => {
    debugState("cleanup");
    stopTicker("cleanup");
    cancelDrift();
    resetInteraction();
    scrollManager.removeInstance(instanceId);
    viewportOptimizer.disconnect();
    resizeObserver?.disconnect();
    window.removeEventListener("resize", measureLoopWidth);
    surface.removeEventListener("wheel", handleWheel);
    surface.removeEventListener("pointerdown", handlePointerDown);
    surface.removeEventListener("pointermove", handlePointerMove);
    surface.removeEventListener("pointerup", finishPointerDrag);
    surface.removeEventListener("pointercancel", finishPointerDrag);
    surface.removeEventListener("click", handleClickCapture, true);
    surface.removeEventListener("dragstart", handleNativeDragStart, true);
    surface.removeEventListener("pointerenter", handlePointerEnter);
    surface.removeEventListener("pointerleave", handlePointerLeave);
    surface.removeEventListener("focusin", handleFocusIn);
    surface.removeEventListener("focusout", handleFocusOut);
    surface.removeEventListener("focus", handleFocusIn, true);
    surface.removeEventListener("blur", handleFocusOut, true);
    reducedMotionQuery?.removeEventListener(
      "change",
      handleReducedMotionChange,
    );
    pauseControl?.removeEventListener("click", handlePauseControlClick);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    setDraggingState(false);
    isPausedByControl = false;
    if (pauseControl) {
      pauseControl.dataset.marqueeReady = "false";
      pauseControl.dataset.marqueePaused = "false";
      pauseControl.disabled = true;
      pauseControl.setAttribute("aria-label", pauseLabel);
    }
    track.style.transform = "";
    track.style.willChange = "";
    stateTracker.clearAll();
  };
}
