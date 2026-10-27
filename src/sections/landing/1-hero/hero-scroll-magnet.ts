type Bounds = { start: number; end: number };
type MagnetOptions = {
  read: () => number;
  write: (position: number) => void;
  bounds: () => Bounds;
  ready: () => boolean;
  wake: () => void;
  state: (phase: "idle" | "waiting" | "settling", target?: number) => void;
  target?: (
    progress: number,
    velocity: number,
    distance: number,
  ) => number | null;
  duration?: (from: number, to: number) => number;
};
const bound = (min: number, max: number, value: number) =>
  Math.max(min, Math.min(max, value));
const cubicInOut = (value: number) =>
  value < 0.5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2;

/** Intent collection has no RAF: the hero owns stepping and scroll writes. */
export function createHeroScrollMagnet(options: MagnetOptions) {
  let disposed = false,
    armed = false,
    inside = false;
  let previous = options.read(),
    sampledAt = performance.now(),
    velocity = 0,
    distance = 0;
  let inputAt = 0,
    movedAt = 0,
    written = previous;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let settling:
    | {
        from: number;
        to: number;
        start: number;
        end: number;
        began: number;
        duration: number;
      }
    | undefined;
  const pointers = new Set<number>(),
    keys = new Set<string>();
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const ready = () =>
    !disposed && !document.hidden && !motion.matches && options.ready();
  const stop = () => {
    clearTimeout(timer);
    timer = undefined;
    settling = undefined;
    armed = inside = false;
    velocity = distance = 0;
    options.state("idle");
  };
  const wait = () => {
    if (!armed || !ready()) return;
    if (inside) options.state("waiting");
    clearTimeout(timer);
    timer = setTimeout(settle, 120);
  };
  const settle = () => {
    timer = undefined;
    if (pointers.size || keys.size) return;
    if (!inside || !ready()) {
      stop();
      return;
    }
    const now = performance.now();
    if (now - Math.max(inputAt, movedAt) < 119) {
      wait();
      return;
    }
    const { start, end } = options.bounds();
    const progress = (options.read() - start) / (end - start);
    if (!(progress > 0 && progress < 1) || end <= start) {
      stop();
      return;
    }
    const momentum =
      velocity * Math.exp(-Math.max(0, now - movedAt - 120) / 220);
    const target = options.target
      ? options.target(progress, momentum, distance)
      : Number(
          progress +
            (Math.abs(bound(-0.18, 0.18, 0.14 * momentum)) >
            Math.abs(bound(-0.18, 0.18, 0.52 * distance))
              ? bound(-0.18, 0.18, 0.14 * momentum)
              : bound(-0.18, 0.18, 0.52 * distance)) >=
            0.5,
        );
    if (target === null) {
      stop();
      return;
    }
    const destination = target ? Math.ceil(end) : Math.floor(start);
    if (Math.abs(destination - options.read()) <= 1) {
      stop();
      return;
    }
    armed = inside = false;
    written = options.read();
    settling = {
      from: progress,
      to: target,
      start,
      end,
      began: now,
      duration:
        1000 *
        (options.duration?.(progress, target) ??
          0.25 +
            0.22 *
              Math.pow(bound(0, 1, Math.abs(target - progress) / 0.68), 0.7)),
    };
    options.state("settling", target);
    options.wake();
  };
  const intent = () => {
    if (!ready()) {
      stop();
      return;
    }
    if (settling) stop();
    if (!armed) {
      previous = options.read();
      sampledAt = performance.now();
      velocity = distance = 0;
    }
    armed = true;
    inputAt = performance.now();
    wait();
  };
  const reset = () => {
    stop();
    pointers.clear();
    keys.clear();
    previous = options.read();
    sampledAt = performance.now();
  };
  const scroll = () => {
    const position = options.read(),
      now = performance.now();
    if (settling) {
      if (Math.abs(position - written) > 2) stop();
      return;
    }
    const delta = position - previous,
      interval = bound(16, 80, now - sampledAt);
    previous = position;
    sampledAt = now;
    if (!armed || !ready() || Math.abs(delta) < 0.5) return;
    const { start, end } = options.bounds();
    if (end <= start) return;
    const speed = delta / (end - start) / (interval / 1000);
    distance =
      (Math.sign(delta) === Math.sign(distance) ? distance : 0) +
      delta / (end - start);
    velocity =
      Math.sign(speed) !== Math.sign(velocity)
        ? speed
        : Math.sign(speed) *
          Math.max(Math.abs(speed), 0.88 * Math.abs(velocity));
    movedAt = now;
    inside = position > start && position < end;
    if (!inside) options.state("idle");
    wait();
  };
  const wheel = (event: WheelEvent) => {
    if (
      event.ctrlKey ||
      event.metaKey ||
      !event.deltaY ||
      Math.abs(event.deltaX) > Math.abs(event.deltaY)
    )
      stop();
    else intent();
  };
  const down = (event: PointerEvent) => {
    reset();
    pointers.add(event.pointerId);
    intent();
  };
  const up = (event: PointerEvent) => {
    pointers.delete(event.pointerId);
    inputAt = performance.now();
    wait();
  };
  const keydown = (event: KeyboardEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      target?.closest('input,textarea,select,[contenteditable="true"]') ||
      ![
        "ArrowDown",
        "ArrowUp",
        "PageDown",
        "PageUp",
        "Home",
        "End",
        " ",
      ].includes(event.key)
    ) {
      stop();
      return;
    }
    keys.add(event.key);
    intent();
  };
  const keyup = (event: KeyboardEvent) => {
    if (keys.delete(event.key)) {
      inputAt = performance.now();
      wait();
    }
  };
  window.addEventListener("scroll", scroll, { passive: true, capture: true });
  window.addEventListener("wheel", wheel, { passive: true, capture: true });
  window.addEventListener("pointerdown", down, {
    passive: true,
    capture: true,
  });
  window.addEventListener("pointerup", up, { passive: true, capture: true });
  window.addEventListener("pointercancel", up, {
    passive: true,
    capture: true,
  });
  window.addEventListener("keydown", keydown, { passive: true, capture: true });
  window.addEventListener("keyup", keyup, { passive: true, capture: true });
  window.addEventListener("click", stop, { passive: true, capture: true });
  window.addEventListener("blur", reset);
  window.addEventListener("resize", reset);
  window.addEventListener("pagehide", reset);
  document.addEventListener("visibilitychange", reset);
  motion.addEventListener("change", reset);
  return {
    reset,
    step(now: number) {
      if (!settling) return false;
      if (!ready() || Math.abs(options.read() - written) > 2) {
        stop();
        return false;
      }
      const pose = settling,
        progress = bound(0, 1, (now - pose.began) / pose.duration);
      const value = pose.from + (pose.to - pose.from) * cubicInOut(progress);
      written =
        progress === 1
          ? pose.to
            ? Math.ceil(pose.end)
            : Math.floor(pose.start)
          : Math.round(pose.start + value * (pose.end - pose.start));
      options.write(written);
      if (progress === 1) {
        settling = undefined;
        previous = options.read();
        sampledAt = performance.now();
        options.state("idle");
        return false;
      }
      return true;
    },
    dispose() {
      disposed = true;
      reset();
      window.removeEventListener("scroll", scroll, true);
      window.removeEventListener("wheel", wheel, true);
      window.removeEventListener("pointerdown", down, true);
      window.removeEventListener("pointerup", up, true);
      window.removeEventListener("pointercancel", up, true);
      window.removeEventListener("keydown", keydown, true);
      window.removeEventListener("keyup", keyup, true);
      window.removeEventListener("click", stop, true);
      window.removeEventListener("blur", reset);
      window.removeEventListener("resize", reset);
      window.removeEventListener("pagehide", reset);
      document.removeEventListener("visibilitychange", reset);
      motion.removeEventListener("change", reset);
    },
  };
}
