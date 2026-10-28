import { uiStore } from "@/store/uiStore";

/** Shared editorial shell: small route lifecycle first, optional material later. */
export function mountEditorial(root: HTMLElement) {
  let disposed = false;
  let material: import("@/sections/landing/2-story/story-environment.animate").StoryEnvironmentController | undefined;
  uiStore.getState().setQuietMode(false);
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  const reduced = () => media.matches || uiStore.getState().quietMode;
  const change = () => material?.setReducedMode(reduced());
  media.addEventListener("change", change);
  const unsubscribe = uiStore.subscribe(change);
  const main = root.querySelector<HTMLElement>("main")!;
  const focus = new MutationObserver(() => root.dispatchEvent(new CustomEvent("journey-frame", { detail: { time: 448, openingTime: 26, progress: 1 } })));
  focus.observe(main, { attributes: true, attributeFilter: ["data-contact-focused"] });
  void import("@/sections/landing/2-story/story-environment.animate").then(({ createStoryEnvironment }) => {
    if (disposed) return;
    material = createStoryEnvironment(root, { reduced: reduced(), pose: () => ({ time: 448, environment: .28, surfaceQuiet: root.dataset.editorialPage === "contact" ? main.dataset.contactFocused === "true" ? 1 : .9 : .65 }) });
  }).catch(() => {});
  // Source entry owns this page-local event; semantic text was already in HTML.
  const hero = main.querySelector<HTMLElement>("[data-route-hero]");
  const entry = requestAnimationFrame(() => hero?.dispatchEvent(new Event("practice-hero-enter")));
  return () => { disposed = true; cancelAnimationFrame(entry); focus.disconnect(); unsubscribe(); media.removeEventListener("change", change); material?.dispose(); };
}
