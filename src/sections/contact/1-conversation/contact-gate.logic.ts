"use client";

import { useEffect } from "react";
import type { Locale } from "@/i18n/routing";
import { useUIStore } from "@/store/uiStore";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { pageEntryPath, routeEntries } from "@/lib/navigation/route-entry";

const loadInteractions = () => import("./contact-form.logic").then((module) => module.mountContactInteractions);
const loadMotion = () => import("./contact.animate").then((module) => module.mountContactMotion);

export function useContactEnhancements(locale: Locale) {
  const selector = `[data-contact-content][data-locale='${locale}']`;
  const quiet = useUIStore((state) => state.quietMode);
  const reduced = useReducedMotion();
  const sceneFailed = useUIStore((state) => state.homeSceneFailed);
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(selector);
    // Entry is one-shot for this route element, including a reduced first load.
    // Re-enabling optional scroll motion must not replay a completed arrival.
    if (root && (quiet || reduced || sceneFailed || window.matchMedia("(prefers-reduced-motion: reduce)").matches)) { root.dataset.contactEntered = "true"; routeEntries().fallback(root, pageEntryPath(root, "contact")); }
  }, [selector, quiet, reduced, sceneFailed]);
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
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(selector);
    if (!root || quiet || reduced || sceneFailed) return;
    let cancelled = false, started = false, cleanup: (() => void) | undefined;
    let observer: IntersectionObserver | undefined;
    const start = () => {
      if (cancelled || started) return;
      started = true; observer?.disconnect();
      void loadMotion().then(mount => { if (!cancelled && root.isConnected) cleanup = mount(root); }).catch((error: unknown) => {
        if (!cancelled && root.isConnected) routeEntries().fallback(root, pageEntryPath(root, "contact"));
        console.error("Contact motion failed to load.", error);
      });
    };
    if (typeof IntersectionObserver === "undefined") start();
    else { observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) start(); }, { rootMargin: "200px" }); observer.observe(root); }
    return () => { cancelled = true; observer?.disconnect(); cleanup?.(); };
  }, [selector, quiet, reduced, sceneFailed]);
}
