"use client";
import { useLayoutEffect } from "react";
const load = () => import("./editorial.animate");
export default function EditorialAnimateGate({ page }: { page: string }) {
  useLayoutEffect(() => { let disposed = false; let cleanup: (() => void) | undefined;
    const path = location.pathname.replace(/\/$/, "");
    const root = [...document.querySelectorAll<HTMLElement>(`[data-editorial-page="${page}"]`)].find(element => element.querySelector<HTMLElement>("main")?.dataset.routePath === path);
    void load().then(({ mountEditorial }) => { if (!disposed && root?.isConnected && location.pathname.replace(/\/$/, "") === path) cleanup = mountEditorial(root); }).catch(() => {});
    return () => { disposed = true; cleanup?.(); };
  }, [page]);
  return null;
}
