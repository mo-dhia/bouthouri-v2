"use client";
import { useEffect } from "react";
const load = () => import("./editorial.animate");
export default function EditorialAnimateGate({ page }: { page: string }) {
  useEffect(() => { let disposed = false; let cleanup: (() => void) | undefined;
    void load().then(({ mountEditorial }) => { const root = document.querySelector<HTMLElement>(`[data-editorial-page="${page}"]`); if (!disposed && root) cleanup = mountEditorial(root); }).catch(() => {});
    return () => { disposed = true; cleanup?.(); };
  }, [page]);
  return null;
}
