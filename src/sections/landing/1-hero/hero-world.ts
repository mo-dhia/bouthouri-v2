export const clamp = (value: number) => Math.max(0, Math.min(1, value));
export function smooth(start: number, end: number, value: number) {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
}
export function smoother(start: number, end: number, value: number) {
  const t = clamp((value - start) / (end - start));
  return t * t * t * (t * (6 * t - 15) + 10);
}

/** Reference world pose. The parent timeline may dispatch this normalized progress. */
export function heroWorldPose(value: number) {
  const progress = clamp(value);
  return {
    progress,
    exit: clamp((progress - 0.14) / 0.58),
    hidden: progress >= 0.73,
    pointer: 1 - smooth(0.38, 0.71, progress),
    identityOpacity: 1 - smooth(0.1, 0.6, progress),
    signatureOpacity: 1 - smooth(0.14, 0.64, progress),
    marqueeOpacity: Math.pow(1 - smooth(0.18, 0.49, progress), 1.5),
    cueOpacity: 1 - smooth(0.04, 0.28, progress),
    navTravel: 1.04 * smooth(0.015, 0.28, progress),
    navOpacity: 1 - smooth(0.12, 0.29, progress),
    identityY: -0.095 * smooth(0, 0.7, progress),
    signatureY: -0.073 * smooth(0.025, 0.72, progress),
    portraitY: -0.061 * smooth(0.02, 0.72, progress),
    marqueeY: -0.041 * smooth(0.015, 0.72, progress),
    portraitScale: 1 - 0.023 * smooth(0.12, 0.72, progress),
    chapterPresence: smooth(0.81, 1, progress),
    persistentY: [0, 1, 2, 4].map(
      (index) =>
        112 * (1 - smooth(0.83 + 0.02 * index, 0.91 + 0.02 * index, progress)),
    ),
    sideY: 112 * (1 - smooth(0.89, 0.97, progress)),
  };
}

export type HeroWorldPose = ReturnType<typeof heroWorldPose>;
export const heroWorldEvent = "gazzar:hero-world";

/** Source quickTo duration .1 / power2.out, retargeted from its displayed value. */
export function heroWorldScrub(from: number, to: number, elapsedMs: number) {
  const progress = clamp(elapsedMs / 100);
  if (progress === 1) return to;
  return from + (to - from) * (1 - Math.pow(1 - progress, 3));
}

/** Normalized hero trigger input, before the source's 100ms quickTo. */
export function heroInputProgressFromScroll(
  scroll: number,
  height: number,
  mobile: boolean,
) {
  const unit = 100 / (mobile ? 5.8 : 6.8);
  return clamp(scroll / (height + (height / unit) * 22));
}

/** Source worldProgressFromInput: apply only AFTER smoothing raw trigger input. */
export function worldProgressFromInput(progress: number, mobile: boolean) {
  const unit = 100 / (mobile ? 5.8 : 6.8);
  const input = clamp(progress) * (unit + 22) - unit;
  const seam = (unit + 16) * 0.745 - unit;
  const mapped =
    input <= seam
      ? input
      : input >= 22
        ? input - 6
        : seam + ((input - seam) * (16 - seam)) / (22 - seam);
  return clamp((unit + mapped) / (unit + 16));
}

/** Inverse for the existing mapped-world input event, not native magnet input. */
export function heroInputFromWorldProgress(progress: number, mobile: boolean) {
  const unit = 100 / (mobile ? 5.8 : 6.8);
  const mapped = clamp(progress) * (unit + 16) - unit;
  const seam = (unit + 16) * 0.745 - unit;
  const input = mapped <= seam ? mapped : seam + (mapped - seam) * (22 - seam) / (16 - seam);
  return clamp((unit + input) / (unit + 22));
}

export function worldProgressFromScroll(scroll: number, height: number, mobile: boolean) {
  return worldProgressFromInput(heroInputProgressFromScroll(scroll, height, mobile), mobile);
}

/** No RAF: the hero supplies callback wall time and its owner's awake/idle state. */
export function createHeroWorldClock() {
  let input = 0, target = 0, from = 0, started = 0;
  let latestTime = 0, parentTime = 0, awake = false;
  const time = (now: number) => (latestTime = Math.max(latestTime, now));
  const wake = (now: number) => {
    const wall = time(now);
    if (awake) return;
    // A sleeping source ticker wakes inside resetTo. Rebase the local epoch
    // without consuming idle wall time or advancing the explicit displayed FROM.
    started += wall - parentTime;
    parentTime = wall;
    awake = true;
  };
  const pose = (mobile: boolean) => heroWorldPose(worldProgressFromInput(input, mobile));
  return {
    get settled() { return input === target; },
    pose,
    wake,
    sleep() { awake = false; },
    sample(now: number, mobile: boolean) {
      parentTime = time(now);
      awake = true;
      input = heroWorldScrub(from, target, parentTime - started);
      return pose(mobile);
    },
    retarget(value: number, now: number) {
      const next = clamp(value);
      if (next === target) return;
      // Cached hero calls quickTo(next, l.progress): resetTo's explicit start
      // preserves the displayed input, unlike quickTo(next) without a start.
      wake(now);
      from = input; target = next; started = parentTime;
    },
    snap(value: number, now = latestTime) {
      time(now);
      input = from = target = clamp(value);
      started = parentTime;
    },
    resume(now: number) {
      parentTime = time(now);
      from = input; started = parentTime; awake = true;
    },
  };
}

const displayedWorlds = new WeakMap<HTMLElement, { pose: HeroWorldPose }>();

/** Full precision, scoped to the current hero mount; no global route history. */
export function readHeroWorldPose(root: HTMLElement | null) {
  return root ? displayedWorlds.get(root)?.pose : undefined;
}

export function createHeroWorldPublisher(root: HTMLElement, target: EventTarget = window) {
  const state = { pose: heroWorldPose(0) };
  return {
    publish(pose: HeroWorldPose) {
      state.pose = pose; displayedWorlds.set(root, state);
      target.dispatchEvent(new CustomEvent<HeroWorldPose>(heroWorldEvent, { detail: pose }));
    },
    dispose() { if (displayedWorlds.get(root) === state) displayedWorlds.delete(root); },
  };
}
