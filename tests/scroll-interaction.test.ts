import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import scrollManager from "../src/lib/scrollInteraction/scrollManager";
import { getScrollTrigger, setVzSIFactor } from "../src/lib/scrollInteraction/scrollTrigger";
import { createRAFBatch, createStateTracker } from "../src/lib/scrollInteraction/optimizations";

class TestElement {
  constructor(public offsetTop = 0, public clientHeight = 200, public offsetParent: TestElement | null = null) {}
}

const descriptors = new Map<string, PropertyDescriptor | undefined>();
let frames = new Map<number, FrameRequestCallback>();
let listeners = new Map<string, Set<EventListener>>();
let nextFrame = 0;
const viewport = {
  innerWidth: 1280, innerHeight: 1000, scrollY: 0,
  requestAnimationFrame: (callback: FrameRequestCallback) => { frames.set(++nextFrame, callback); return nextFrame; },
  cancelAnimationFrame: (id: number) => { frames.delete(id); },
  addEventListener: (type: string, callback: EventListener) => {
    if (!listeners.has(type)) listeners.set(type, new Set());
    listeners.get(type)!.add(callback);
  },
  removeEventListener: (type: string, callback: EventListener) => { listeners.get(type)?.delete(callback); },
};

function install(name: string, value: unknown) {
  descriptors.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
}

function frame() {
  for (const [id, callback] of [...frames]) {
    if (!frames.delete(id)) continue;
    callback(performance.now());
  }
}

function settle() {
  for (let i = 0; frames.size && i < 10; i++) frame();
  expect(frames.size).toBe(0);
}

function element() {
  return new TestElement(1000, 200, new TestElement()) as unknown as HTMLElement;
}

beforeEach(() => {
  frames = new Map(); listeners = new Map(); nextFrame = 0; viewport.scrollY = 0;
  install("window", viewport);
  install("document", { documentElement: new TestElement() });
  install("HTMLElement", TestElement);
  install("requestAnimationFrame", viewport.requestAnimationFrame);
  install("cancelAnimationFrame", viewport.cancelAnimationFrame);
  install("ResizeObserver", class { observe() {} disconnect() {} });
});

afterEach(() => {
  getScrollTrigger()?.cleanup();
  scrollManager.cleanup();
  setVzSIFactor(1);
  for (const [key, descriptor] of descriptors) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
  descriptors.clear();
});

describe("scroll lifecycle", () => {
  test("removing the final trigger releases its resize and scroll listeners", () => {
    const trigger = getScrollTrigger()!;
    trigger.createInstance("section", element());
    expect(listeners.get("resize")?.size).toBe(1);
    trigger.removeInstance("section");
    expect(listeners.get("resize")?.size).toBe(0);
    expect(listeners.get("scroll")?.size).toBe(0);
    trigger.createInstance("section", element());
    expect(listeners.get("resize")?.size).toBe(1);
  });

  test("explicit cleanup unregisters all owned callbacks", () => {
    const trigger = getScrollTrigger()!;
    trigger.createInstance("a", element());
    trigger.createInstance("b", element());
    trigger.cleanup();
    expect(scrollManager.getInstances()).toEqual([]);
    expect(frames.size).toBe(0);
  });

  test("a zero-length range produces a finite end value", () => {
    const values: number[] = [];
    getScrollTrigger()!.createInstance("point", element(), {
      values: [[0, 1]], startPoint: [0, 0, 100], endPoint: [0, 0, 100],
      callback: ({ v }) => values.push(v[0]),
    });
    settle();
    viewport.scrollY = 100;
    scrollManager.requestUpdate();
    settle();
    expect(values.at(-1)).toBe(1);
    expect(values.every(Number.isFinite)).toBe(true);
  });

  test("the core scheduler delivers the current progress within one frame", () => {
    let progress = -1;
    getScrollTrigger()!.createInstance("progress", element(), {
      values: [[0, 1]], startPoint: [0, 0, 100], endPoint: [0, 0, 200],
      callback: ({ v }) => { progress = v[0]; },
    });
    settle();
    viewport.scrollY = 150;
    scrollManager.requestUpdate();
    expect(progress).toBe(0);
    frame();
    expect(progress).toBe(0.5);
  });

  test("a controller can own RAF scheduling without an extra core frame", () => {
    let progress = -1;
    getScrollTrigger()!.createInstance("direct", element(), {
      values: [[0, 1]], startPoint: [0, 0, 100], endPoint: [0, 0, 200], useRAF: false,
      callback: ({ v }) => { progress = v[0]; },
    });
    settle();
    viewport.scrollY = 150;
    scrollManager.requestUpdate();
    expect(progress).toBe(0.5);
  });

  test("a direct raw-input owner shares one listener, receives out-of-range seeks once, and cleans up independently", () => {
    const positions: number[] = [];
    getScrollTrigger()!.createInstance("ranged-section", element(), {
      values: [[0, 1]], startPoint: [0, 0, 100], endPoint: [0, 0, 200],
    });
    settle();
    scrollManager.createInstance("identity-world", () => positions.push(viewport.scrollY), { useRAF: false });
    expect(listeners.get("scroll")?.size).toBe(1);
    for (const y of [50, 150, 5000, 20]) {
      viewport.scrollY = y;
      for (const listener of listeners.get("scroll") ?? []) listener(new Event("scroll"));
    }
    expect(positions).toEqual([50, 150, 5000, 20]);
    scrollManager.removeInstance("identity-world");
    viewport.scrollY = 180;
    scrollManager.requestUpdate();
    settle();
    expect(positions).toHaveLength(4);
    expect(listeners.get("scroll")?.size).toBe(1);
    getScrollTrigger()!.removeInstance("ranged-section");
    expect(listeners.get("scroll")?.size).toBe(0);
  });

  test("re-registering a key replaces the observed element", () => {
    const trigger = getScrollTrigger()!;
    const replacement = element();
    let observed: HTMLElement | null = null;
    trigger.createInstance("replace", element());
    trigger.createInstance("replace", replacement, { callback: ({ ref }) => { observed = ref; } });
    settle();
    expect(observed as HTMLElement | null).toBe(replacement);
  });

  test("re-registering a listener updates its throttle", () => {
    scrollManager.createInstance("listener", () => {}, { throttle: 100 });
    const updated = scrollManager.createInstance("listener", () => {}, { throttle: 20 });
    expect(updated.throttle).toBe(20);
  });

  test("scale factors reject zero and non-finite values", () => {
    expect(() => setVzSIFactor(0)).toThrow(RangeError);
    expect(() => setVzSIFactor(Number.NaN)).toThrow(RangeError);
  });
});

describe("animation utilities", () => {
  test("a callback can schedule itself for the next frame", () => {
    const batch = createRAFBatch();
    let calls = 0;
    const update = () => { if (++calls < 2) batch.schedule("repeat", update); };
    batch.schedule("repeat", update);
    frame();
    expect(calls).toBe(1);
    frame();
    expect(calls).toBe(2);
  });

  test("cleanup can cancel a different callback in the same batch", () => {
    const batch = createRAFBatch();
    let calls = 0;
    batch.schedule("first", () => batch.cancel("second"));
    batch.schedule("second", () => calls++);
    frame();
    expect(calls).toBe(0);
  });

  test("clearing style tracking permits the same value to be applied again", () => {
    const tracker = createStateTracker();
    const target = { style: { opacity: "" } } as unknown as HTMLElement;
    tracker.trackStyle(target, "opacity", "0.5");
    tracker.clearAll();
    target.style.opacity = "";
    expect(tracker.trackStyle(target, "opacity", "0.5")).toBe(true);
    expect(target.style.opacity).toBe("0.5");
  });
});
