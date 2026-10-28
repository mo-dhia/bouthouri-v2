"use client";

import { useEffect } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useUIStore } from "@/store/uiStore";

const load = () => import("./services.animate").then((module) => module.mountServices);

export function useServicesMotion() {
  const quiet = useUIStore((state) => state.quietMode);
  const reduced = useReducedMotion();
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("#services-content");
    if (!root) return;
    let cancelled = false, dispose: (() => void) | undefined;
    void load().then((mount) => { if (!cancelled) dispose = mount(root, quiet || reduced || window.matchMedia("(prefers-reduced-motion: reduce)").matches); }).catch((error: unknown) => { console.error("Services enhancement failed to load.", error); });
    return () => { cancelled = true; dispose?.(); };
  }, [quiet, reduced]);
}
