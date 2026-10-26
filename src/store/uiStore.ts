import { create } from "storio";

export const uiStore = create((set) => ({
  quietMode: false,
  soundEnabled: false,
  menuOpen: false,
  setQuietMode: (quietMode: boolean) => set({ quietMode }),
  setSoundEnabled: (soundEnabled: boolean) => set({ soundEnabled }),
  setMenuOpen: (menuOpen: boolean) => set({ menuOpen }),
}));

// React Compiler recognizes hooks by their use-prefixed names.
export const useUIStore = uiStore;
