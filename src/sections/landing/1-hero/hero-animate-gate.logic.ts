"use client";

import { useDeferredMotion } from "@/lib/useDeferredMotion";

const loadMotion = () => import("./hero.animate").then((module) => module.mountHeroMotion);

export function useHeroMotion() {
  useDeferredMotion<HTMLElement>("#top", loadMotion);
}
