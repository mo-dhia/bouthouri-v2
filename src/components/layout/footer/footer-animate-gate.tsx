"use client";

import { useEffect } from "react";

export default function FooterAnimateGate() {
  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;
    const root = document.querySelector<HTMLElement>("[data-gazzar-footer]");
    if (!root) return;
    void import("./footer.logic")
      .then(({ mountFooterInteractions }) => {
        if (!disposed) cleanup = mountFooterInteractions(root);
      })
      .catch(() => {});
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);
  return null;
}
