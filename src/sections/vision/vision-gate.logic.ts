'use client';

import { useEffect } from 'react';

const loadVision = () => import('./vision.animate');

export function useVisionController() {
  useEffect(() => {
    let disposed = false, cleanup: (() => void) | undefined;
    void loadVision().then(({ mountVision }) => {
      const root = document.querySelector<HTMLElement>('[data-vision-root]');
      if (!disposed && root) cleanup = mountVision(root);
    }).catch((error: unknown) => {
      const root = document.querySelector<HTMLElement>('[data-vision-root]');
      if (!disposed && root) { delete root.dataset.motion; root.dataset.visionFallback = 'true'; }
      console.error('The optional Vision controller could not load.', error);
    });
    return () => { disposed = true; cleanup?.(); };
  }, []);
}
