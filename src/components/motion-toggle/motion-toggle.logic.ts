"use client";

import { uiStore, useUIStore } from "@/store/uiStore";

export function useMotionToggle() {
  const quietMode = useUIStore((state) => state.quietMode);
  const toggle = () => {
    const state = uiStore.getState();
    state.setQuietMode(!state.quietMode);
  };
  return { quietMode, toggle };
}
