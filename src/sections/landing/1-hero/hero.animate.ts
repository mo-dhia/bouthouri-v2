import { getScrollTrigger } from "@/lib/scrollInteraction/scrollTrigger";

/** Reference marquee baseline. Full entry/scroll choreography is still pending. */
export function mountHeroMotion(root: HTMLElement): () => void {
  const track = root.querySelector<HTMLElement>("[data-hero-marquee]");
  const cycle = root.querySelector<HTMLElement>("[data-hero-cycle]");
  const trigger = getScrollTrigger();
  if (!track || !cycle || !trigger || typeof track.animate !== "function") return () => {};
  let animation: Animation | undefined;
  let cancelled = false;
  let onScreen = true;
  const syncPlayback = () => {
    if (document.hidden || !onScreen) animation?.pause();
    else animation?.play();
  };
  const measure = () => {
    if (cancelled) return;
    const width = cycle.getBoundingClientRect().width;
    const phase = animation && animation.effect ? Number(animation.currentTime ?? 0) / Number(animation.effect.getTiming().duration) : 0;
    animation?.cancel();
    if (width <= 0) return;
    // Approximately 133px/s at the observed 1912px desktop reference viewport.
    const duration = width / (window.innerWidth * 0.07) * 1000;
    animation = track.animate([{ transform: "translate3d(0, 0, 0)" }, { transform: `translate3d(${-width}px, 0, 0)` }], { duration, iterations: Infinity, easing: "linear" });
    animation.currentTime = (phase % 1) * duration;
    syncPlayback();
  };
  const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(measure);
  observer?.observe(cycle);
  measure();
  void document.fonts.ready.then(measure);
  document.addEventListener("visibilitychange", syncPlayback);
  trigger.createInstance("identity-marquee-visibility", root, {
    values: [[0, 1]], startPoint: [1], endPoint: [0],
    callback: ({ v }) => { onScreen = (v[0] ?? 0) < 1; syncPlayback(); },
  });
  return () => {
    cancelled = true;
    observer?.disconnect();
    document.removeEventListener("visibilitychange", syncPlayback);
    trigger.removeInstance("identity-marquee-visibility");
    animation?.cancel();
  };
}
