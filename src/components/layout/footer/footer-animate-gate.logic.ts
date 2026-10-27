"use client";

import { useEffect } from "react";

const loadFooter = () => import("./footer.logic");

export function useFooterController() {
  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;
    const root = document.querySelector<HTMLElement>("[data-gazzar-footer]");
    if (!root) return;
    void loadFooter()
      .then(({ mountFooterInteractions }) => {
        if (!disposed) cleanup = mountFooterInteractions(root);
      })
      .catch(() => {});
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);
}
