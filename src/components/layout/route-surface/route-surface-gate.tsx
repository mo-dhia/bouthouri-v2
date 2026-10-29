"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { routeEntries, type RouteArrival } from "@/lib/navigation/route-entry";
import { ROUTE_TIMING } from "@/lib/navigation/route-navigation-state";
const load = () => import("./route-surface.animate");

export default function RouteSurfaceGate() {
  const router = useRouter(), pathname = usePathname();
  const controller = useRef<ReturnType<typeof import("./route-surface.animate").mountRouteSurface> | null>(null);
  const initial = useRef<RouteArrival<HTMLElement> | null>(null);
  const initialTimer = useRef<number | null>(null);
  useLayoutEffect(() => {
    const main = [...document.querySelectorAll<HTMLElement>("main[data-route-path]")].find(element => element.dataset.routePath === location.pathname.replace(/\/$/, ""));
    const owner = main?.querySelector<HTMLElement>("[data-vision-root], #services-content, [data-contact-content], [data-experiment-root]");
    const entries = routeEntries();
    if (main?.dataset.routePath && owner && !entries.started(owner) && !location.hash) {
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      initial.current = entries.claim(main.dataset.routePath, navigation?.type === "back_forward"); entries.adopt(initial.current, owner);
      // A never-settling surface chunk must not hold an independently loaded
      // page's masks forever while the server surface stays transparent.
      initialTimer.current = window.setTimeout(() => { if (initial.current) entries.finish(initial.current, true); initial.current = null; initialTimer.current = null; }, ROUTE_TIMING.assetTimeout);
    }
    return () => { if (initialTimer.current !== null) clearTimeout(initialTimer.current); initialTimer.current = null; if (initial.current) entries.finish(initial.current, true); initial.current = null; };
  }, [router]);
  useEffect(() => {
    let disposed = false;
    void load().then(({ mountRouteSurface }) => {
      const surface = document.querySelector<HTMLElement>("[data-route-surface]");
      if (!disposed && surface) { controller.current = mountRouteSurface(surface, href => router.push(href, { scroll: false }), href => router.prefetch(href)); if (initialTimer.current !== null) clearTimeout(initialTimer.current); initialTimer.current = null; }
    }).catch(() => { if (!disposed && initial.current) { routeEntries().finish(initial.current, true); if (initialTimer.current !== null) clearTimeout(initialTimer.current); initialTimer.current = null; } });
    return () => { disposed = true; controller.current?.dispose(); controller.current = null; };
  }, [router]);
  useEffect(() => { controller.current?.update(); }, [pathname]);
  return null;
}
