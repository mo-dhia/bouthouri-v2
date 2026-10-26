"use client";

import { type RefObject, useEffect, useState } from "react";
import { subscribeToScenePreboot } from "./sceneBootGate";

type Options = {
  targetRef: RefObject<Element | null>;
  enabled?: boolean;
  activateMargin?: string;
  prewarmMargin?: string;
  preload?: () => void;
};

export function useSceneActivation({
  targetRef, enabled = true, activateMargin = "0px", prewarmMargin = "400px", preload,
}: Options) {
  const [isActive, setIsActive] = useState(false);
  const [shouldMount, setShouldMount] = useState(false);
  useEffect(() => {
    const target = targetRef.current;
    if (!enabled || !target) return;
    let cancelled = false;
    const warm = () => {
      if (cancelled) return;
      preload?.();
      setShouldMount(true);
    };
    if (typeof IntersectionObserver === "undefined") {
      queueMicrotask(() => { if (!cancelled) { warm(); setIsActive(true); } });
      return () => { cancelled = true; };
    }
    const activeObserver = new IntersectionObserver(([entry]) => {
      setIsActive(entry?.isIntersecting ?? false);
      if (entry?.isIntersecting) setShouldMount(true);
    }, { rootMargin: activateMargin });
    const warmObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        warm();
        warmObserver.disconnect();
      }
    }, { rootMargin: prewarmMargin });
    activeObserver.observe(target);
    warmObserver.observe(target);
    const unsubscribe = subscribeToScenePreboot(() => queueMicrotask(warm));
    return () => {
      cancelled = true;
      activeObserver.disconnect();
      warmObserver.disconnect();
      unsubscribe();
    };
  }, [activateMargin, enabled, preload, prewarmMargin, targetRef]);
  return { isActive: enabled && isActive, shouldMount: enabled && shouldMount };
}
