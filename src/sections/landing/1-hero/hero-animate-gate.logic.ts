"use client";

import { useEffect } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useUIStore } from "@/store/uiStore";

const loadMotion = () =>
  import("./hero.animate").then((module) => module.mountHeroMotion);

export function useHeroMotion() {
  const quietMode = useUIStore((state) => state.quietMode);
  const homeSceneFailed = useUIStore((state) => state.homeSceneFailed);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("#identity");
    if (!root || quietMode || homeSceneFailed || reducedMotion) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    // This controller owns a fixed layer and must establish its departure pose
    // even when history/locale restoration starts below the hero viewport.
    // Only the controller is deferred; the server content stays in the page.
    void loadMotion()
      .then((mount) => {
        if (!cancelled) cleanup = mount(root);
      })
      .catch((error: unknown) =>
        console.error("Optional hero motion failed to load.", error),
      );
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [quietMode, homeSceneFailed, reducedMotion]);
}
