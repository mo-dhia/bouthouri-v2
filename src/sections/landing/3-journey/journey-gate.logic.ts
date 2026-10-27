"use client";

import { useEffect } from "react";

const loadJourney = () => import("./journey.animate");

export function useJourneyController() {
  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;
    void loadJourney()
      .then(({ mountJourney }) => {
        const root = document.querySelector<HTMLElement>("[data-journey-root]");
        if (!disposed && root) cleanup = mountJourney(root);
      })
      .catch((error: unknown) => {
        if (disposed) return;
        const root = document.querySelector<HTMLElement>("[data-journey-root]");
        if (root) {
          delete root.dataset.enhanced;
          root.querySelector(".experience")?.classList.add("is-reduced");
        }
        console.error(
          "The optional journey enhancement could not load.",
          error,
        );
      });
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);
}
