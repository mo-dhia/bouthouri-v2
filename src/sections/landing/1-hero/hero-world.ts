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
  return from + (to - from) * (1 - Math.pow(1 - progress, 3));
}

/** Same world-to-input remap as the reference, including its six-unit opening hold. */
export function worldProgressFromScroll(
  scroll: number,
  height: number,
  mobile: boolean,
) {
  const unit = 100 / (mobile ? 5.8 : 6.8);
  const input = Math.max(0, scroll / height) * unit - unit;
  const seam = (unit + 16) * 0.745 - unit;
  const mapped =
    input <= seam
      ? input
      : input >= 22
        ? input - 6
        : seam + ((input - seam) * (16 - seam)) / (22 - seam);
  return clamp((unit + mapped) / (unit + 16));
}
