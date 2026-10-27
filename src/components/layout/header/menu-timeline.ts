const clamp = (n: number) => Math.max(0, Math.min(1, n));
const out = (n: number, power: number) => 1 - (1 - clamp(n)) ** power;
const inOut = (n: number, power: number) => {
  const t = clamp(n);
  return t < 0.5 ? (2 * t) ** power / 2 : 1 - (2 * (1 - t)) ** power / 2;
};

export const MENU_REVERSE_RATE = 1.55;
export const menuTimelineDuration = (links: number, secondary: number) =>
  Math.max(
    900,
    760 + 45 * Math.max(0, links - 1),
    840 + 45 * Math.max(0, secondary - 1),
  );

/** Authored source timeline in milliseconds, including each track's own ease. */
export function menuTimelineFrame(
  time: number,
  links: number,
  secondary: number,
) {
  return {
    surface: 100 * (1 - inOut(time / 360, 4)),
    content: 100 * (1 - inOut((time - 360) / 120, 3)),
    lineScale: inOut((time - 360) / 220, 4),
    lineOpacity: 1 - out((time - 610) / 140, 2),
    links: Array.from(
      { length: links },
      (_, i) => 112 * (1 - out((time - 400 - 45 * i) / 360, 4)),
    ),
    secondary: Array.from(
      { length: secondary },
      (_, i) => 105 * (1 - out((time - 540 - 45 * i) / 300, 4)),
    ),
    footer: 110 * (1 - out((time - 650) / 250, 3)),
  };
}

/** One reversible native clock; changing direction never replaces authored tracks. */
export function createMenuTimeline(
  root: HTMLElement,
  callbacks: { complete: () => void; reverseComplete: () => void },
) {
  const surface = root.querySelector<HTMLElement>("[data-menu-surface]");
  const content = root.querySelector<HTMLElement>("[data-menu-scroll]");
  const line = root.querySelector<HTMLElement>('[class*="menu-opening-line"]');
  const links = Array.from(
    root.querySelectorAll<HTMLElement>("[data-menu-link-inner]"),
  );
  const secondary = Array.from(
    root.querySelectorAll<HTMLElement>("[data-menu-secondary]"),
  );
  const footer = root.querySelector<HTMLElement>("[data-menu-bottom]");
  const touched = [
    surface,
    content,
    line,
    ...links,
    ...secondary,
    footer,
  ].filter((e): e is HTMLElement => e !== null);
  const oldStyles = new Map(touched.map((e) => [e, e.getAttribute("style")]));
  const duration = menuTimelineDuration(links.length, secondary.length);
  let time = 0,
    rate = 0,
    last = 0,
    frame = 0,
    disposed = false;
  const render = () => {
    const pose = menuTimelineFrame(time, links.length, secondary.length);
    if (surface) surface.style.clipPath = `inset(0 0 ${pose.surface}% 0)`;
    if (content) content.style.clipPath = `inset(0 0 ${pose.content}% 0)`;
    if (line) {
      line.style.transform = `scaleX(${pose.lineScale})`;
      line.style.opacity = String(pose.lineOpacity);
    }
    links.forEach((e, i) => {
      e.style.transform = `translateY(${pose.links[i]}%)`;
    });
    secondary.forEach((e, i) => {
      e.style.transform = `translateY(${pose.secondary[i]}%)`;
    });
    if (footer) footer.style.transform = `translateY(${pose.footer}%)`;
  };
  const advance = (now: number) => {
    if (last)
      time = Math.max(
        0,
        Math.min(duration, time + Math.max(0, now - last) * rate),
      );
    last = now;
    render();
  };
  const tick = (now: number) => {
    frame = 0;
    if (disposed || document.hidden) {
      last = 0;
      return;
    }
    advance(now);
    if (rate > 0 && time === duration) {
      rate = last = 0;
      callbacks.complete();
    } else if (rate < 0 && time === 0) {
      rate = last = 0;
      callbacks.reverseComplete();
    } else wake();
  };
  function wake() {
    if (!disposed && rate && !document.hidden && !frame)
      frame = requestAnimationFrame(tick);
  }
  const direction = (value: number) => {
    if (disposed) return;
    // Like the source timeline, reverse/play from the last presented frame.
    // Advancing here would visibly jump between an input and the next RAF.
    rate = value;
    last = performance.now();
    wake();
  };
  const pause = (position?: number) => {
    cancelAnimationFrame(frame);
    frame = 0;
    if (position !== undefined)
      time = Math.max(0, Math.min(duration, position));
    rate = last = 0;
    render();
  };
  const visibility = () => {
    last = 0;
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else wake();
  };
  document.addEventListener("visibilitychange", visibility);
  render();
  return {
    duration,
    time: () => time,
    play: () => direction(1),
    reverse: () => direction(-MENU_REVERSE_RATE),
    pause,
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", visibility);
      oldStyles.forEach((style, element) => {
        if (style === null) element.removeAttribute("style");
        else element.setAttribute("style", style);
      });
    },
  };
}
