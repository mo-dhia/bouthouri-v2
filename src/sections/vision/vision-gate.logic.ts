'use client';

import { useEffect } from 'react';
import { pageEntryPath, routeEntries } from '@/lib/navigation/route-entry';

const loadVision = () => import('./vision.animate');

export function useVisionController() {
  useEffect(() => {
    let disposed = false, cleanup: (() => void) | undefined;
    const root = document.querySelector<HTMLElement>('[data-vision-root]');
    void loadVision().then(({ mountVision }) => {
      if (!disposed && root?.isConnected) cleanup = mountVision(root);
    }).catch((error: unknown) => {
      if (!disposed && root?.isConnected) { delete root.dataset.motion; root.dataset.visionFallback = 'true'; routeEntries().fallback(root, pageEntryPath(root, 'vision')); }
      console.error('The optional Vision controller could not load.', error);
    });
    return () => { disposed = true; cleanup?.(); };
  }, []);
}
