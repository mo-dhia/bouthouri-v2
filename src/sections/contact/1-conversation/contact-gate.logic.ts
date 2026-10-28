"use client";

import { useEffect } from "react";
import type { Locale } from "@/i18n/routing";
import { useDeferredMotion } from "@/lib/useDeferredMotion";
import { useUIStore } from "@/store/uiStore";
import { useReducedMotion } from "@/lib/useReducedMotion";

const loadInteractions = () => import("./contact-form.logic").then((module) => module.mountContactInteractions);
const loadMotion = () => import("./contact.animate").then((module) => module.mountContactMotion);

export function useContactEnhancements(locale: Locale) {
  const selector = `[data-contact-content][data-locale='${locale}']`;
  const quiet = useUIStore((state) => state.quietMode);
  const reduced = useReducedMotion();
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(selector);
    // Entry is one-shot for this route element, including a reduced first load.
    // Re-enabling optional scroll motion must not replay a completed arrival.
    if (root && (quiet || reduced || window.matchMedia("(prefers-reduced-motion: reduce)").matches)) root.dataset.contactEntered = "true";
  }, [selector, quiet, reduced]);
  // Form/cue behavior remains available in quiet and OS-reduced mode.
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(selector);
    if (!root) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    void loadInteractions().then((mount) => {
      if (!cancelled) cleanup = mount(root);
    }).catch((error: unknown) => console.error("Contact interactions failed to load.", error));
    return () => { cancelled = true; cleanup?.(); };
  }, [selector]);
  useDeferredMotion(selector, loadMotion);
}
