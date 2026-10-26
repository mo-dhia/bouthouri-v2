"use client";

import { type RefObject, useEffect } from "react";
import { useUIStore } from "@/store/uiStore";
import { useReducedMotion } from "./useReducedMotion";

type MountMotion<T extends HTMLElement> = (element: T) => () => void;
type DeferredMotionOptions = { rootMargin?: string; enabled?: boolean };

/** Server markup stays visible while its optional controller loads. */
export function useDeferredMotion<T extends HTMLElement>(
  target: RefObject<T | null> | string,
  load: () => Promise<MountMotion<T>>,
  { rootMargin = "200px", enabled = true }: DeferredMotionOptions = {},
) {
  const quietMode = useUIStore((state) => state.quietMode);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    const element = typeof target === "string" ? document.querySelector<T>(target) : target.current;
    if (!element || !enabled || quietMode || reducedMotion) return;
    let cancelled = false;
    let started = false;
    let cleanup: (() => void) | undefined;
    let observer: IntersectionObserver | undefined;
    const start = () => {
      if (started || cancelled) return;
      started = true;
      observer?.disconnect();
      void load().then((mount) => {
        if (!cancelled) cleanup = mount(element);
      }).catch((error: unknown) => console.error("Optional motion failed to load.", error));
    };
    if (typeof IntersectionObserver === "undefined") start();
    else {
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) start();
      }, { rootMargin });
      observer.observe(element);
    }
    return () => {
      cancelled = true;
      observer?.disconnect();
      cleanup?.();
    };
  }, [enabled, load, quietMode, reducedMotion, target, rootMargin]);
}
