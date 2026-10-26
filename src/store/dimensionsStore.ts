import { create, type Store } from "storio";

export type DimensionsState = {
  vw: number;
  vh: number;
  setViewport: (vw: number, vh: number) => void;
  setVw: (vw: number) => void;
  isMobile: () => boolean;
  isTablet: () => boolean;
  isDesktop: () => boolean;
};

export const dimensionsStore: Store<DimensionsState> = create<DimensionsState>((set) => ({
  vw: 0,
  vh: 0,
  setViewport: (vw, vh) => set({ vw, vh }),
  setVw: (vw) => set({ vw }),
  isMobile: () => dimensionsStore.getState().vw <= 600,
  isTablet: () => {
    const { vw } = dimensionsStore.getState();
    return vw > 600 && vw <= 1024;
  },
  isDesktop: () => dimensionsStore.getState().vw > 1024,
}));

export const useDimensionsStore = dimensionsStore;
