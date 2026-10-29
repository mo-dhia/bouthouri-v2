'use client';
import { useEffect, useRef, useState } from 'react';
import { useSceneBootSlot } from '@/lib/scene/sceneBootGate';
import { routeEntries, pageEntryPath } from '@/lib/navigation/route-entry';

const load = () => import('./experiment.animate');
export default function ExperimentGate({ slug }: { slug: string }) {
  const target = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(false), [ready, setReady] = useState(false);
  const granted = useSceneBootSlot(active, ready, target);
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(`[data-experiment-root][data-experiment='${slug}']`);
    target.current = root;
    if (!root) return;
    const observer = new IntersectionObserver(entries => setActive(entries.some(e => e.isIntersecting)));
    observer.observe(root);
    return () => { observer.disconnect(); target.current = null; };
  }, [slug]);
  useEffect(() => {
    if (!granted) return;
    const root = target.current;
    let disposed = false, cleanup: (() => void) | undefined;
    const done = () => { if (!disposed) setReady(true); };
    root?.addEventListener('experiment-ready', done);
    void load().then(({ mountExperiment }) => {
      if (!disposed && root?.isConnected) cleanup = mountExperiment(root);
    }).catch(() => {
      if (!disposed && root?.isConnected) { routeEntries().fallback(root, pageEntryPath(root, 'projects')); done(); }
    });
    return () => { disposed = true; root?.removeEventListener('experiment-ready', done); cleanup?.(); };
  }, [granted, slug]);
  return null;
}
