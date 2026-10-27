import { heroWorldEvent, heroWorldPose, type HeroWorldPose } from "../1-hero/hero-world";
import type { StoryFrame } from "./story-score";

/** The displayed hero clock owns emergence; journey frames own only story time. */
export function createStoryHeroHandoff(readPose: () => HeroWorldPose, invalidate: () => void, target: EventTarget = window) {
  let emergence = readPose().chapterPresence;
  const set = (value: number) => {
    if (value === emergence) return;
    emergence = value; invalidate();
  };
  const update = (event: Event) => {
    const detail = (event as CustomEvent<Partial<HeroWorldPose>>).detail;
    if (!detail || !Number.isFinite(detail.progress)) return;
    // Retain compatibility with progress-only publishers during teardown.
    set(Number.isFinite(detail.chapterPresence) ? detail.chapterPresence! : heroWorldPose(detail.progress!).chapterPresence);
  };
  target.addEventListener(heroWorldEvent, update);
  return {
    sample(frame: StoryFrame): StoryFrame { return { ...frame, emergence }; },
    refresh() { set(readPose().chapterPresence); },
    dispose() { target.removeEventListener(heroWorldEvent, update); },
  };
}
