import {
  frameFromProgress,
  progressFromStoryTime,
  TOTAL_INPUT_LENGTH,
  type JourneyFrame,
} from "../../sections/landing/3-journey/journey-clock";

/** These are the source's restoration bands, not its chapter/whisper windows. */
export const HOME_SEMANTIC_SCENES = [
  ["opening", -26, 0],
  ["perspective", 0, 70],
  ["philosophy", 70, 112],
  ["curve", 112, 156],
  ["circle", 156, 201],
  ["dash", 201, 241],
  ["ideas", 241, 306],
  ["work", 306, 448],
  ["systems", 448, 547],
  ["people", 547, 627],
  ["closing", 627, 663],
  ["footer", 663, 714],
] as const;

export type HomeSection = "hero" | (typeof HOME_SEMANTIC_SCENES)[number][0];
export type HomePosition = { section: HomeSection; progress: number };
export type HomeGeometry = {
  /** Absolute document Y of .glasses-chapter, after the identity hero. */
  start: number;
  /** Actual measured pin distance, excluding the stage's own height. */
  distance: number;
  /** Must agree with the journey renderer; 100 / 6.8 desktop, 100 / 5.8 mobile. */
  heroInput?: number;
};

export const HOME_WORK_MOMENTS = {
  wujhat: 308,
  "tranche-finance": 345,
  remoteplatz: 381,
  "8returns": 413,
} as const;
export type HomeWorkSlug = keyof typeof HOME_WORK_MOMENTS;

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function isHomeWorkSlug(value: unknown): value is HomeWorkSlug {
  return typeof value === "string" && Object.hasOwn(HOME_WORK_MOMENTS, value);
}

export function isHomePosition(value: unknown): value is HomePosition {
  if (!value || typeof value !== "object") return false;
  const { section, progress } = value as Partial<HomePosition>;
  return (
    Number.isFinite(progress) &&
    typeof progress === "number" && progress >= 0 && progress <= 1 &&
    (section === "hero" || HOME_SEMANTIC_SCENES.some(([name]) => name === section))
  );
}

export function isHomeGeometry(value: HomeGeometry | null): value is HomeGeometry {
  return !!value && Number.isFinite(value.start) && value.start > 0 &&
    Number.isFinite(value.distance) && value.distance > 0 &&
    (value.heroInput === undefined || (Number.isFinite(value.heroInput) && value.heroInput > 0));
}

/** Source score is negative during the opening and zero when story time begins. */
export function positionFromHomeFrame(frame: JourneyFrame): HomePosition {
  const score = Math.max(-26, Math.min(714, frame.time > 0 ? frame.time : frame.openingTime - 26));
  const scene = HOME_SEMANTIC_SCENES.find(([, start, end]) => score >= start && score < end)
    ?? HOME_SEMANTIC_SCENES[HOME_SEMANTIC_SCENES.length - 1];
  return { section: scene[0], progress: clamp((score - scene[1]) / (scene[2] - scene[1])) };
}

/** Use the displayed shared frame when available; never interpret display progress as pin progress. */
export function captureHomePosition(
  scrollY: number,
  geometry: HomeGeometry,
  frame?: JourneyFrame | null,
): HomePosition | null {
  if (!Number.isFinite(scrollY) || !isHomeGeometry(geometry)) return null;
  if (scrollY < geometry.start) return { section: "hero", progress: clamp(scrollY / geometry.start) };
  const validFrame = frame && Number.isFinite(frame.time) && Number.isFinite(frame.openingTime) ? frame : null;
  return positionFromHomeFrame(validFrame ?? frameFromProgress(
    clamp((scrollY - geometry.start) / geometry.distance), geometry.heroInput,
  ));
}

export function homeScoreFromPosition(position: HomePosition): number | null {
  if (!isHomePosition(position) || position.section === "hero") return null;
  const scene = HOME_SEMANTIC_SCENES.find(([name]) => name === position.section)!;
  return scene[1] + position.progress * (scene[2] - scene[1]);
}

export function homePinProgress(position: HomePosition, heroInput = 100 / 6.8): number | null {
  const score = homeScoreFromPosition(position);
  if (score === null) return null;
  if (score >= 0) return progressFromStoryTime(score);
  // Invert the opening through the shared clock, including its viewport-dependent
  // pivot. This runs only for navigation, not in either animation update path.
  let low = 0, high = 22 / TOTAL_INPUT_LENGTH;
  for (let i = 0; i < 42; i++) {
    const middle = (low + high) / 2;
    if (frameFromProgress(middle, heroInput).openingTime < score + 26) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}

export function homeScrollTarget(position: HomePosition, geometry: HomeGeometry): number | null {
  if (!isHomePosition(position) || !isHomeGeometry(geometry)) return null;
  if (position.section === "hero") return position.progress * geometry.start;
  return geometry.start + homePinProgress(position, geometry.heroInput)! * geometry.distance;
}

export function homeWorkPosition(slug: HomeWorkSlug): HomePosition {
  return { section: "work", progress: (HOME_WORK_MOMENTS[slug] - 306) / 142 };
}
