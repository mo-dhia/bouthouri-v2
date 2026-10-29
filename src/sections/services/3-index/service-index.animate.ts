import { designScale, pixelsToVw } from "@/lib/viewport-design";
import { createMaskedReveal } from "../masked-reveal";
import { clamp, range } from "../2-opening/opening-score";

export function createServiceIndex(root: HTMLElement, reduced: boolean) {
  const section = root.querySelector<HTMLElement>("[data-service-index]")!;
  const entries = [...section.querySelectorAll<HTMLElement>("[data-index-entry]")].map((element) => {
    const title = element.querySelector<HTMLElement>("[data-index-title]")!, copy = element.querySelector<HTMLElement>("[data-index-copy]")!;
    return { element, title, copy, rule: element.querySelector<HTMLElement>(".service-index-rule"), titleReveal: createMaskedReveal(title, .12), copyReveal: createMaskedReveal(copy, .12), top: 0, copyTop: 0, height: 0 };
  });
  let viewportHeight = 1, mobile = false, scale = 1, lastScroll = NaN;
  function tick(scroll: number) {
    if (scroll === lastScroll) return;
    lastScroll = scroll;
    entries.forEach((entry) => {
      const distance = viewportHeight - (entry.top - scroll), progress = clamp(distance / (viewportHeight + entry.height));
      const title = reduced ? 1 : range(distance, .08 * viewportHeight, .4 * viewportHeight), copy = reduced ? 1 : range(viewportHeight - (entry.copyTop - scroll), .12 * viewportHeight, .44 * viewportHeight), rule = reduced ? 1 : range(distance, .06 * viewportHeight, .46 * viewportHeight);
      entry.titleReveal.set(title, reduced); entry.copyReveal.set(copy, reduced);
      entry.title.style.transform = `translate3d(0,${pixelsToVw(reduced ? 0 : (.5 - progress) * (mobile ? 8 : 22) * scale, window.innerWidth)},0)`;
      entry.copy.style.transform = `translate3d(0,${pixelsToVw(reduced ? 0 : (.5 - progress) * (mobile ? 3 : 8) * scale, window.innerWidth)},0)`;
      if (entry.rule) entry.rule.style.transform = `scaleX(${rule})`;
      entry.element.dataset.indexMoving = String(!reduced && (title > 0 && title < 1 || copy > 0 && copy < 1));
    });
  }
  return {
    tick,
    measure() {
      viewportHeight = window.innerHeight; mobile = window.innerWidth <= 600; scale = designScale(window.innerWidth);
      entries.forEach((entry) => { entry.title.style.removeProperty("transform"); entry.copy.style.removeProperty("transform"); entry.titleReveal.measure(); entry.copyReveal.measure(); });
      entries.forEach((entry) => { const rect = entry.element.getBoundingClientRect(); entry.top = rect.top + window.scrollY; entry.height = rect.height; entry.copyTop = entry.copy.getBoundingClientRect().top + window.scrollY; });
      lastScroll = NaN; tick(window.scrollY); section.dataset.indexReady = "true";
    },
    dispose() { delete section.dataset.indexReady; entries.forEach((entry) => { entry.titleReveal.dispose(); entry.copyReveal.dispose(); entry.title.style.removeProperty("transform"); entry.copy.style.removeProperty("transform"); entry.rule?.style.removeProperty("transform"); delete entry.element.dataset.indexMoving; }); },
  };
}
