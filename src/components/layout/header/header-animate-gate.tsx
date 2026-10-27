"use client";

import { useEffect } from "react";

const loadShell = () => import("./header.logic");

/** All navigation content stays in the server tree; only its controller is deferred. */
export default function HeaderAnimateGate() {
  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    void loadShell()
      .then(({ mountHeader }) => {
        const root = document.querySelector<HTMLElement>("[data-gazzar-shell]");
        if (!cancelled && root) cleanup = mountHeader(root);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);
  return null;
}
