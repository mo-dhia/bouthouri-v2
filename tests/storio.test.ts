import { describe, expect, test } from "bun:test";
import { create } from "storio";
import { dimensionsStore } from "../src/store/dimensionsStore";

describe("Storio compatibility patch", () => {
  test("functional partial updates preserve actions and other state", () => {
    const store = create((set) => ({
      count: 0,
      label: "preserved",
      increment: () => set((state) => ({ count: state.count + 1 })),
    }));
    store.getState().increment();
    store.getState().increment();
    expect(store.getState().count).toBe(2);
    expect(store.getState().label).toBe("preserved");
    expect(typeof store.getState().increment).toBe("function");
  });

  test("identical object updates do not notify subscribers twice", () => {
    const store = create(() => ({ width: 0 }));
    let notifications = 0;
    const unsubscribe = store.subscribe(() => notifications++);
    store.setState({ width: 1280 });
    store.setState({ width: 1280 });
    expect(notifications).toBe(1);
    unsubscribe();
    store.setState({ width: 1024 });
    expect(notifications).toBe(1);
  });

  test("viewport breakpoints do not overlap at 1024", () => {
    dimensionsStore.getState().setViewport(1024, 768);
    expect(dimensionsStore.getState().isTablet()).toBe(true);
    expect(dimensionsStore.getState().isDesktop()).toBe(false);
    dimensionsStore.getState().setVw(1025);
    expect(dimensionsStore.getState().isDesktop()).toBe(true);
    dimensionsStore.getState().setViewport(0, 0);
  });
});
