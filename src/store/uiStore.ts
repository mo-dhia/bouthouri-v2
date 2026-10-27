import { create } from "storio";

export const uiStore = create((set) => ({
  quietMode: false,
  homeSceneFailed: false,
  soundEnabled: false,
  menuOpen: false,
  entryPhase: "idle" as "idle" | "loading" | "ready" | "assembling" | "complete",
  audioPreference: null as "quiet" | "sound" | null,
  audioState: "uninitialized" as "uninitialized" | "muted" | "starting" | "playing" | "error" | "awaiting-user-gesture",
  setQuietMode: (quietMode: boolean) => set({ quietMode }),
  setHomeSceneFailed: (homeSceneFailed: boolean) => set({ homeSceneFailed }),
  setSoundEnabled: (soundEnabled: boolean) => set({ soundEnabled }),
  setMenuOpen: (menuOpen: boolean) => set({ menuOpen }),
  setEntryPhase: (entryPhase: "idle" | "loading" | "ready" | "assembling" | "complete") => set({ entryPhase }),
  setAudioPreference: (audioPreference: "quiet" | "sound" | null) => set({ audioPreference }),
  setAudioState: (audioState: "uninitialized" | "muted" | "starting" | "playing" | "error" | "awaiting-user-gesture") => set({ audioState }),
}));

// React Compiler recognizes hooks by their use-prefixed names.
export const useUIStore = uiStore;
