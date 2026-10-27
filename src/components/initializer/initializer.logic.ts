"use client";

import { useEffect } from "react";
import { dimensionsStore } from "@/store/dimensionsStore";
import { uiStore } from "@/store/uiStore";

export function useInitializer() {
  useEffect(() => {
    let disposed = false;
    let resizeFrame: number | null = null;
    let motionRequest = 0;
    let destroySmoothScroll: (() => void) | undefined;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const measure = () => {
      resizeFrame = null;
      dimensionsStore.getState().setViewport(window.innerWidth, window.innerHeight);
    };
    const scheduleMeasure = () => { resizeFrame ??= requestAnimationFrame(measure); };
    const syncMotion = () => {
      const request = ++motionRequest;
      if (motionQuery.matches || uiStore.getState().quietMode || uiStore.getState().homeSceneFailed) {
        destroySmoothScroll?.();
        return;
      }
      void import("@/lib/lenis").then(({ initLenis, destroyLenis }) => {
        if (disposed || request !== motionRequest) return;
        initLenis();
        destroySmoothScroll = destroyLenis;
      }).catch((error: unknown) => console.error("Smooth scrolling failed to load.", error));
    };
    measure();
    syncMotion();
    const unsubscribe = uiStore.subscribe(syncMotion);
    window.addEventListener("resize", scheduleMeasure, { passive: true });
    motionQuery.addEventListener("change", syncMotion);
    return () => {
      disposed = true;
      unsubscribe();
      window.removeEventListener("resize", scheduleMeasure);
      motionQuery.removeEventListener("change", syncMotion);
      if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
      destroySmoothScroll?.();
    };
  }, []);
}
