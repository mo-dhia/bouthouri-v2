import scrollManager from "@/lib/scrollInteraction/scrollManager";
import { designPixels, pixelsToVw } from "@/lib/viewport-design";
import { standardFooterPose } from "./standard-footer-pose";
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
  let material: import("./footer.animate").FooterMark | undefined;
  let loading = false;
  let visible = false;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const standard = root.dataset.footerVariant === "standard" || root.classList.contains("standard-footer");
  const reduced = () =>
    motion.matches ||
    uiStore.getState().quietMode ||
    uiStore.getState().homeSceneFailed;
  let standardReveal = 1, footerTop = 0, footerHeight = 1;
  let standardPoseKey = "";
  const information = root.querySelector<HTMLElement>(".footer-information");
  const colophon = root.querySelector<HTMLElement>(".footer-colophon");
  const standardKey = `standard-footer-${Math.random().toString(36).slice(2)}`;
  const originalInformationStyle = information?.getAttribute("style");
  const originalColophonStyle = colophon?.getAttribute("style");
  const updateStandard = () => {
    if (!standard || disposed) return;
    const pose = standardFooterPose(scrollY, footerTop, footerHeight, innerHeight, reduced());
    standardReveal = pose.visible ? pose.wordmark : 0;
    const key = `${pose.progress}:${reduced()}:${innerWidth}`;
    if (key === standardPoseKey) { syncMaterial(); return; }
    standardPoseKey = key;
    if (information) { information.style.opacity = String(pose.invitation); information.style.transform = `translate3d(0,${pixelsToVw(designPixels(pose.invitationY, innerWidth), innerWidth)},0)`; information.inert = pose.invitation < .1; }
    word.style.transform = `translate3d(0,${(1 - pose.wordmark) * 112}%,0)`;
    if (colophon) { colophon.style.opacity = String(pose.metadata); colophon.style.transform = `translate3d(0,${pixelsToVw(designPixels((1 - pose.metadata) * 10, innerWidth), innerWidth)},0)`; colophon.inert = pose.metadata < .1; }
    syncMaterial();
  };
  const onStandardViewport = () => updateStandard();
  if (standard) window.addEventListener("resize", onStandardViewport, { passive: true });
  const originalWordStyle = word.getAttribute("style");
  const originalFooterStyle = root.getAttribute("style");
  const svg = word.querySelector<SVGSVGElement>("[data-footer-svg]");
  const originalSvgStyle = svg?.getAttribute("style") ?? null;
  const measureStandardPosition = () => {
    if (!standard || disposed) return;
    footerTop = root.getBoundingClientRect().top + scrollY;
    footerHeight = root.offsetHeight;
    updateStandard();
  };
  const measureWord = () => {
    if (disposed) return;
    measureFooterWord(root, mask, word);
    measureStandardPosition();
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
  // HOME's reading layout keeps the word still; a standard footer animates
  // once its own scroll reveal shows the word. Reduced motion and the open
  // menu hold the word.
  const syncMaterial = () =>
    material?.setActive(visible && !root.inert && !uiStore.getState().menuOpen && (standard ? standardReveal > .001 : !reduced()));
  const ensureMaterial = () => {
    if (material || loading || disposed) return;
    loading = true;
    void import("./footer.animate")
      .then(({ mountFooterMark }) => {
        if (!disposed) {
          material = mountFooterMark(root, reduced);
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
  // The parent clock supplies actual visibility; boot the mark only near 663.
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
    updateStandard();
    syncMaterial();
  };
  const unsubscribe = uiStore.subscribe(syncMode);
  motion.addEventListener("change", syncMode);
  const onIntent = () => ensureMaterial();
  mask.addEventListener("pointerenter", onIntent, { passive: true });
  mask.addEventListener("focus", onIntent);
  const resize = new ResizeObserver((entries) => {
    // Upstream content and the physical scroll tail can move the footer while
    // its word geometry stays unchanged; only the mask and HOME's stage-sized
    // root refit the word.
    if (entries.some((entry) => entry.target === mask || entry.target === root)) measureWord();
    else measureStandardPosition();
  });
  resize.observe(mask);
  // HOME's word shrinks with the stage height, which the mask's width ignores.
  if (!standard) resize.observe(root);
  // Standard footers move when preceding route content grows/shrinks. Their
  // mask can retain identical dimensions, so observe the layout owner too.
  if (standard && root.parentElement) {
    resize.observe(root.parentElement);
    const content = root.parentElement.querySelector("main");
    if (content) resize.observe(content);
  }
  document.addEventListener("visibilitychange", updateClock);
  void document.fonts.ready.then(() => {
    if (!disposed) measureWord();
  });
  updateClock();
  measureWord();
  if (standard) scrollManager.createInstance(standardKey, updateStandard, { useRAF: false });
  return () => {
    disposed = true;
    if (standard) { scrollManager.removeInstance(standardKey); window.removeEventListener("resize", onStandardViewport); }
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
    if (standard) for (const [node, previous] of [[information, originalInformationStyle], [colophon, originalColophonStyle]] as const) { if (node) { if (previous == null) node.removeAttribute("style"); else node.setAttribute("style", previous); node.inert = false; } }
    if (originalWordStyle === null) word.removeAttribute("style");
    else word.setAttribute("style", originalWordStyle);
    if (svg) {
      if (originalSvgStyle === null) svg.removeAttribute("style");
      else svg.setAttribute("style", originalSvgStyle);
    }
    if (originalFooterStyle === null) root.removeAttribute("style");
    else root.setAttribute("style", originalFooterStyle);
  };
}
