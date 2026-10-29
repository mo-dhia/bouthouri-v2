'use client';
import { useEffect } from 'react';
import { routeEntries, pageEntryPath } from '@/lib/navigation/route-entry';

const load = () => import('./grid.animate');
export default function GridGate() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-projects-root]');
    let disposed = false, cleanup: (() => void) | undefined;
    void load().then(({ mountProjectsGrid }) => { if (!disposed && root?.isConnected) cleanup = mountProjectsGrid(root); }).catch(() => {
      if (!disposed && root?.isConnected) routeEntries().fallback(root, pageEntryPath(root, 'projects'));
    });
    return () => { disposed = true; cleanup?.(); };
  }, []);
  return null;
}
