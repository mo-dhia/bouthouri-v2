import { uiStore } from "@/store/uiStore";
import { environmentOwner } from "../environment/environment.logic";

/** Shared editorial shell: small route lifecycle first, optional material later. */
export function mountEditorial(root: HTMLElement) {
  uiStore.getState().setQuietMode(false);
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  const reduced = () => media.matches || uiStore.getState().quietMode;
  const main = root.querySelector<HTMLElement>("main")!;
  environmentOwner.navigate(location.pathname);
  const lease = environmentOwner.register({ kind: "editorial", stage: root, page: root, owner: root,
    pose: () => ({ time: 448, environment: .28, surfaceQuiet: root.dataset.editorialPage === "contact" ? main.dataset.contactFocused === "true" ? 1 : .9 : .65 }),
  }, main.dataset.routePath!, reduced());
  const change = () => lease.setReducedMode(reduced());
  media.addEventListener("change", change);
  const unsubscribe = uiStore.subscribe(change);
  const focus = new MutationObserver(() => lease.invalidate());
  focus.observe(main, { attributes: true, attributeFilter: ["data-contact-focused"] });
  return () => { focus.disconnect(); unsubscribe(); media.removeEventListener("change", change); lease.release(); };
}
