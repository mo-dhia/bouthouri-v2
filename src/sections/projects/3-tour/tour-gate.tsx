'use client';
import { useEffect } from 'react';
import { routeEntries, pageEntryPath } from '@/lib/navigation/route-entry';

const load = () => import('./tour.logic');
export default function TourGate() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-tour-root]');
    let disposed = false, cleanup: (() => void) | undefined;
    void load().then(({ mountTour }) => {
      if (!disposed && root?.isConnected) cleanup = mountTour(root);
    }).catch(() => { if (!disposed && root?.isConnected) routeEntries().fallback(root, pageEntryPath(root, 'projects')); });
    return () => { disposed = true; cleanup?.(); };
  }, []);
  return null;
}
