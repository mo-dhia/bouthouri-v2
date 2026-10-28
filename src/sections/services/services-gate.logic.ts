"use client";

import { useEffect } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useUIStore } from "@/store/uiStore";
import { pageEntryPath, routeEntries } from "@/lib/navigation/route-entry";

const load = () => import("./services.animate").then((module) => module.mountServices);

export function useServicesMotion() {
  const quiet = useUIStore((state) => state.quietMode);
  const reduced = useReducedMotion();
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("#services-content");
    if (!root) return;
    let cancelled = false, dispose: (() => void) | undefined;
    void load().then((mount) => { if (!cancelled && root.isConnected) dispose = mount(root, quiet || reduced || window.matchMedia("(prefers-reduced-motion: reduce)").matches); }).catch((error: unknown) => { if (!cancelled && root.isConnected) routeEntries().fallback(root, pageEntryPath(root, "services")); console.error("Services enhancement failed to load.", error); });
    return () => { cancelled = true; dispose?.(); };
  }, [quiet, reduced]);
}
