'use client';

import { useEffect } from 'react';
import { pageEntryPath, routeEntries } from '@/lib/navigation/route-entry';

const loadCase = () => import('./case.animate');

export function useCaseController() {
  useEffect(() => {
    let disposed = false, cleanup: (() => void) | undefined;
    const root = document.querySelector<HTMLElement>('[data-case-root]');
    void loadCase().then(({ mountCase }) => {
      if (!disposed && root?.isConnected) cleanup = mountCase(root);
    }).catch((error: unknown) => {
      if (!disposed && root?.isConnected) { delete root.dataset.motion; root.dataset.caseFallback = 'true'; routeEntries().fallback(root, pageEntryPath(root, 'projects')); }
      console.error('The optional case controller could not load.', error);
    });
    return () => { disposed = true; cleanup?.(); };
  }, []);
}
