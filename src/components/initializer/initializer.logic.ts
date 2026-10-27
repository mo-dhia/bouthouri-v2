"use client";

import { useEffect } from "react";
import { dimensionsStore } from "@/store/dimensionsStore";

export function useInitializer() {
  useEffect(() => {
    let resizeFrame: number | null = null;
    const measure = () => {
      resizeFrame = null;
      dimensionsStore.getState().setViewport(window.innerWidth, window.innerHeight);
    };
    const scheduleMeasure = () => { resizeFrame ??= requestAnimationFrame(measure); };
    measure();
    window.addEventListener("resize", scheduleMeasure, { passive: true });
    return () => {
      window.removeEventListener("resize", scheduleMeasure);
      if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
    };
  }, []);
}
