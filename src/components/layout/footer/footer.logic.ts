import { brand } from "@/config/brand";
import { uiStore } from "@/store/uiStore";
import { measureFooterWord } from "./footer-geometry";

/** Mounts on source-compatible footer DOM without creating a second footer. */
export function mountFooterInteractions(root: HTMLElement): () => void {
  const mask = root.querySelector<HTMLElement>(
    "[data-footer-grab],.footer-word-mask",
  );
  const word = root.querySelector<HTMLElement>(
    "[data-footer-word],.footer-word-text",
  );
  const clock = root.querySelector<HTMLTimeElement>(
    "[data-footer-clock],.footer-clock time",
  );
  if (!mask || !word) return () => {};
  let disposed = false;
  let clockTimer: ReturnType<typeof setTimeout> | undefined;
  let material: import("./footer-material").FooterMaterial | undefined;
  let loading = false;
  let visible = false;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const standard = root.dataset.footerVariant === "standard" || root.classList.contains("standard-footer");
  const reduced = () =>
    motion.matches ||
    uiStore.getState().quietMode ||
    uiStore.getState().homeSceneFailed;
  const originalWordStyle = word.getAttribute("style");
  const originalFooterStyle = root.getAttribute("style");
  const context = document.createElement("canvas").getContext("2d");
  const measureWord = () => {
    if (!context || disposed) return;
    measureFooterWord(root, mask, word, context);
    material?.measure();
  };
  const updateClock = () => {
    clearTimeout(clockTimer);
    if (disposed || document.hidden) return;
    const now = new Date();
    if (clock) {
      clock.textContent = new Intl.DateTimeFormat("en-GB", {
        timeZone: brand.location.timeZone,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(now);
      clock.dateTime = now.toISOString();
    }
    clockTimer = setTimeout(updateClock, 60000 - (Date.now() % 60000) + 20);
  };
  // HOME's source material reveal remains zero in the unpinned reading layout.
  // A standard footer has its own scroll reveal and retains reduced interaction.
  const syncMaterial = () => material?.setActive(visible && !root.inert && (standard || !reduced()));
  const ensureMaterial = () => {
    if (material || loading || disposed) return;
    loading = true;
    void import("./footer-material")
      .then(({ mountFooterMaterial }) => {
        if (!disposed) {
          material = mountFooterMaterial(root, reduced);
          syncMaterial();
        }
      })
      .catch(() => {
        loading = false;
      });
  };
  const observer = new IntersectionObserver(
    (entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      updateClock();
      if (visible) ensureMaterial();
      syncMaterial();
    },
    { rootMargin: "200px" },
  );
  observer.observe(mask);
  // A pinned footer has a viewport-sized box even while the story hides it.
  // The parent clock supplies actual visibility; boot the material only near 663.
  const stage = root.closest<HTMLElement>("#top");
  const onJourney = (event: Event) => {
    const time = (event as CustomEvent<{ time: number }>).detail?.time;
    if (!Number.isFinite(time)) return;
    const footerVisible = time >= 630;
    if (footerVisible !== visible) {
      visible = footerVisible;
      updateClock();
      if (visible) {
        measureWord();
        ensureMaterial();
      }
    }
    syncMaterial();
  };
  stage?.addEventListener("journey-frame", onJourney);
  let previousReduced = reduced();
  const syncMode = () => {
    const next = reduced();
    if (next !== previousReduced) {
      previousReduced = next;
      updateClock();
    }
    if (uiStore.getState().menuOpen) material?.reset();
    syncMaterial();
  };
  const unsubscribe = uiStore.subscribe(syncMode);
  motion.addEventListener("change", syncMode);
  const onIntent = () => ensureMaterial();
  mask.addEventListener("pointerenter", onIntent, { passive: true });
  mask.addEventListener("focus", onIntent);
  const resize = new ResizeObserver(measureWord);
  resize.observe(mask);
  document.addEventListener("visibilitychange", updateClock);
  void document.fonts.ready.then(() => {
    if (!disposed) measureWord();
  });
  updateClock();
  measureWord();
  return () => {
    disposed = true;
    observer.disconnect();
    resize.disconnect();
    unsubscribe();
    motion.removeEventListener("change", syncMode);
    material?.dispose();
    clearTimeout(clockTimer);
    document.removeEventListener("visibilitychange", updateClock);
    stage?.removeEventListener("journey-frame", onJourney);
    mask.removeEventListener("pointerenter", onIntent);
    mask.removeEventListener("focus", onIntent);
    if (originalWordStyle === null) word.removeAttribute("style");
    else word.setAttribute("style", originalWordStyle);
    if (originalFooterStyle === null) root.removeAttribute("style");
    else root.setAttribute("style", originalFooterStyle);
  };
}
