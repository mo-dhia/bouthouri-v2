import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import ts from "typescript";
import type { RefObject } from "react";
import type * as BootGate from "./sceneBootGate";
import { measureViewportDistance } from "./viewportDistance";

const compiled = ts.transpileModule(
  readFileSync(new URL("./sceneBootGate.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } },
).outputText;

type Effect = {
  dependencies: readonly unknown[];
  create: () => void | (() => void);
  cleanup?: void | (() => void);
};
type Hook = {
  slots: unknown[];
  effects: Map<number, Effect>;
  pendingEffects: number[];
  cursor: number;
  mounted: boolean;
  dirty: boolean;
  wantsBoot: boolean;
  isReady: boolean;
  hasBootSlot: boolean;
  stateWrites: number;
  top: number;
  target: RefObject<Element | null>;
};

// Each test executes the actual module with its own browser/timers and a small
// React hook fixture (persistent state/refs, dependency cleanup, effect commits).
// No process-global module mocks, DOM installation, or real timers are used.
function harness({ server = false } = {}) {
  let current: Hook | undefined;
  const hooks: Hook[] = [];
  const intervals = new Map<number, { callback: () => void; delay: number }>();
  const timeouts = new Map<number, { callback: () => void; at: number }>();
  let serial = 0, now = 0;
  const window = {
    scrollY: 0,
    innerHeight: 1000,
    setInterval(callback: () => void, delay: number) {
      const id = ++serial;
      intervals.set(id, { callback, delay });
      return id;
    },
    clearInterval(id: number) { intervals.delete(id); },
    setTimeout(callback: () => void, delay: number) {
      const id = ++serial;
      timeouts.set(id, { callback, at: now + delay });
      return id;
    },
    clearTimeout(id: number) { timeouts.delete(id); },
  };
  const document = { visibilityState: "visible" };
  const react = {
    useState(initial: unknown) {
      const hook = current!, index = hook.cursor++;
      if (!(index in hook.slots)) hook.slots[index] = initial;
      return [hook.slots[index], (value: unknown) => {
        hook.slots[index] = value;
        hook.stateWrites++;
        hook.dirty = true;
      }];
    },
    useRef(initial: unknown) {
      const hook = current!, index = hook.cursor++;
      if (!(index in hook.slots)) hook.slots[index] = { current: initial };
      return hook.slots[index];
    },
    useEffect(create: Effect["create"], dependencies: readonly unknown[]) {
      const hook = current!, index = hook.cursor++;
      const previous = hook.effects.get(index);
      if (previous && dependencies.length === previous.dependencies.length &&
        dependencies.every((value, entry) => Object.is(value, previous.dependencies[entry]))) return;
      hook.effects.set(index, { create, dependencies, cleanup: previous?.cleanup });
      hook.pendingEffects.push(index);
    },
  };
  const evaluated = { exports: {} as typeof BootGate };
  const context = createContext(server ? {} : { window, document });
  const snapshot = runInContext(`(function(require,module,exports){${compiled}
    return () => ({ requests: bootSlotQueue.length, waiters: bootWindowWaiters.length, busy: isBootSlotBusy });
  })`, context)((name: string) => {
    if (name === "react") return react;
    if (name === "./viewportDistance") return { measureViewportDistance };
    throw new Error(`Unexpected boot-gate dependency: ${name}`);
  }, evaluated, evaluated.exports) as () => { requests: number; waiters: number; busy: boolean };

  function render(hook: Hook) {
    hook.cursor = 0;
    hook.dirty = false;
    current = hook;
    try {
      hook.hasBootSlot = evaluated.exports.useSceneBootSlot(hook.wantsBoot, hook.isReady, hook.target);
    } finally {
      current = undefined;
    }
    const pending = hook.pendingEffects.splice(0);
    for (const index of pending) hook.effects.get(index)!.cleanup?.();
    for (const index of pending) {
      const effect = hook.effects.get(index)!;
      effect.cleanup = effect.create();
    }
  }

  async function flush() {
    // Drain the module's async queue/Promise continuations, committing any state
    // update as React would. This never samples scroll or advances timer time.
    for (let turn = 0; turn < 8; turn++) {
      await Promise.resolve();
      for (const hook of hooks) if (hook.mounted && hook.dirty) render(hook);
    }
  }

  return {
    module: evaluated.exports, window, document, intervals, timeouts, snapshot, flush,
    mount(top = 1100, wantsBoot = true) {
      const hook: Hook = {
        slots: [], effects: new Map(), pendingEffects: [], cursor: 0,
        mounted: true, dirty: false, wantsBoot, isReady: false,
        hasBootSlot: false, stateWrites: 0, top,
        target: { current: null },
      };
      hook.target.current = {
        getBoundingClientRect: () => ({ top: hook.top, bottom: hook.top + 100 }),
      } as Element;
      hooks.push(hook);
      render(hook);
      return Object.assign(hook, {
        update(props: Partial<Pick<Hook, "wantsBoot" | "isReady">>) {
          Object.assign(hook, props);
          render(hook);
        },
        unmount() {
          if (!hook.mounted) return;
          hook.mounted = false;
          for (const effect of hook.effects.values()) effect.cleanup?.();
        },
      });
    },
    async samples(count: number, moving = false) {
      for (let sample = 0; sample < count; sample++) {
        now += 100;
        if (moving) window.scrollY++;
        for (const [id, interval] of [...intervals]) {
          expect(interval.delay).toBe(100);
          if (intervals.has(id)) interval.callback();
        }
        await flush();
      }
    },
    async elapse(ms: number) {
      now += ms;
      for (const [id, timer] of [...timeouts]) {
        if (timer.at <= now && timeouts.has(id)) {
          timeouts.delete(id);
          timer.callback();
        }
      }
      await flush();
    },
  };
}

test("pending HOME unmount releases its hidden quiet waiter, queued request and busy slot immediately", async () => {
  const h = harness(), home = h.mount();
  await h.samples(1);
  h.document.visibilityState = "hidden";
  home.unmount();
  // Cleanup must work synchronously without another sample or visibility wake.
  expect(h.intervals.size).toBe(0);
  expect(h.snapshot()).toEqual({ requests: 0, waiters: 0, busy: false });
  await h.flush();
  expect(home.stateWrites).toBe(0);
  expect(h.timeouts.size).toBe(0);
});

test("withdrawing boot eligibility cleans a pending request without unmounting", async () => {
  const h = harness(), home = h.mount();
  h.document.visibilityState = "hidden";
  home.update({ wantsBoot: false });
  expect(h.intervals.size).toBe(0);
  expect(h.snapshot()).toEqual({ requests: 0, waiters: 0, busy: false });
  home.update({ wantsBoot: true });
  await h.flush();
  expect(h.intervals.size).toBe(1);
  expect(home.hasBootSlot).toBe(false);
  home.unmount();
});

test("cancelling one pending hook keeps live requests waiting and selects the current nearest viewport after quiet", async () => {
  const h = harness(), departed = h.mount(1050), first = h.mount(1100), second = h.mount(1800);
  let quiet = false;
  const pending = h.module.waitForScrollQuiet().then(() => { quiet = true; });
  await h.samples(1);
  h.document.visibilityState = "hidden";
  departed.unmount();
  expect(h.intervals.size).toBe(1);
  expect(h.snapshot()).toEqual({ requests: 2, waiters: 2, busy: true });
  await h.samples(8, true);
  expect(first.hasBootSlot || second.hasBootSlot).toBe(false);
  expect(quiet).toBe(false);
  first.top = 1900;
  second.top = 1200;
  h.document.visibilityState = "visible";
  await h.samples(2);
  expect(second.hasBootSlot).toBe(false);
  expect(quiet).toBe(false);
  await h.samples(1);
  await pending;
  expect(quiet).toBe(true);
  expect(second.hasBootSlot).toBe(true);
  expect(first.hasBootSlot).toBe(false);
  second.update({ isReady: true });
  await h.samples(3);
  expect(first.hasBootSlot).toBe(false);
  await h.samples(1);
  expect(first.hasBootSlot).toBe(true);
  first.unmount(); second.unmount();
  expect(h.intervals.size + h.timeouts.size).toBe(0);
});

test("a same-turn enqueue after sole cancellation gets its own quiet wait before the old Promise resumes", async () => {
  const h = harness(), departed = h.mount();
  await h.samples(3);
  h.document.visibilityState = "hidden";
  departed.unmount();
  const next = h.mount(); // Deliberately no microtask flush between cleanup and enqueue.
  h.document.visibilityState = "visible";
  await h.flush();
  expect(next.hasBootSlot).toBe(false);
  await h.samples(3);
  expect(next.hasBootSlot).toBe(false);
  await h.samples(1);
  expect(next.hasBootSlot).toBe(true);
  expect(departed.stateWrites).toBe(0);
  next.unmount();
});

test("hook cancellation leaves independent waitForScrollQuiet callers alive on their shared sampler", async () => {
  const h = harness(), departed = h.mount();
  let settled = 0;
  const first = h.module.waitForScrollQuiet().then(() => { settled++; });
  const second = h.module.waitForScrollQuiet().then(() => { settled++; });
  h.document.visibilityState = "hidden";
  departed.unmount();
  expect(h.snapshot()).toEqual({ requests: 0, waiters: 2, busy: false });
  expect(h.intervals.size).toBe(1);
  await h.samples(8, true);
  expect(settled).toBe(0);
  h.document.visibilityState = "visible";
  await h.samples(2);
  expect(settled).toBe(0);
  await h.samples(1);
  await Promise.all([first, second]);
  expect(settled).toBe(2);
  expect(h.intervals.size).toBe(0);
});

test("live slot and standalone waiters retain their own urgency conditions", async () => {
  const h = harness(), visible = h.mount(100);
  let quiet = false;
  const pending = h.module.waitForScrollQuiet().then(() => { quiet = true; });
  await h.samples(6, true);
  expect(visible.hasBootSlot).toBe(false);
  await h.samples(1, true);
  expect(visible.hasBootSlot).toBe(true);
  expect(quiet).toBe(false);
  expect(h.intervals.size).toBe(1);
  visible.unmount();
  await h.samples(2);
  expect(quiet).toBe(false);
  await h.samples(1);
  await pending;
  expect(quiet).toBe(true);
  expect(h.intervals.size + h.timeouts.size).toBe(0);
});

test("a currently granted slot remains exclusive while pending peers cancel", async () => {
  const h = harness(), owner = h.mount();
  await h.samples(4);
  const cancelled = h.mount();
  cancelled.unmount();
  expect(h.snapshot()).toEqual({ requests: 0, waiters: 0, busy: true });
  const next = h.mount();
  expect(h.snapshot()).toEqual({ requests: 1, waiters: 0, busy: true });
  await h.samples(8);
  expect(next.hasBootSlot).toBe(false);
  owner.unmount();
  await h.samples(4);
  expect(next.hasBootSlot).toBe(true);
  next.unmount();
  expect(h.intervals.size + h.timeouts.size).toBe(0);
});

test("ready releases once, clears its watchdog, and stale cleanup/release cannot free the next owner", async () => {
  const h = harness(), owner = h.mount();
  await h.samples(4);
  const staleRelease = [...h.timeouts.values()][0].callback;
  const next = h.mount();
  owner.update({ isReady: true });
  expect(h.timeouts.size).toBe(0);
  await h.samples(4);
  expect(next.hasBootSlot).toBe(true);
  const last = h.mount();
  owner.unmount(); staleRelease(); staleRelease();
  await h.samples(8);
  expect(last.hasBootSlot).toBe(false);
  next.unmount();
  await h.samples(4);
  expect(last.hasBootSlot).toBe(true);
  last.unmount();
  expect(h.intervals.size + h.timeouts.size).toBe(0);
});

test("the unchanged 15s watchdog frees a hung boot and old unmount cannot release its successor", async () => {
  const h = harness(), hung = h.mount();
  await h.samples(4);
  const next = h.mount();
  await h.elapse(14999);
  expect(h.intervals.size).toBe(0);
  expect(next.hasBootSlot).toBe(false);
  await h.elapse(1);
  expect(h.intervals.size).toBe(1);
  await h.samples(4);
  expect(next.hasBootSlot).toBe(true);
  const last = h.mount();
  hung.unmount();
  expect(h.snapshot().busy).toBe(true);
  await h.samples(8);
  expect(last.hasBootSlot).toBe(false);
  next.unmount(); last.unmount();
  await h.flush();
  expect(h.intervals.size + h.timeouts.size).toBe(0);
});

test("cleanup between grant and hook continuation releases without publishing or retaining a watchdog", async () => {
  const h = harness(), departed = h.mount();
  await h.samples(3);
  // The sample resolves the boot-window Promise; the queue continuation grants
  // before the hook's .then gets its turn. Cleanup in that gap is legitimate.
  [...h.intervals.values()][0].callback();
  await Promise.resolve();
  expect(h.snapshot()).toEqual({ requests: 0, waiters: 0, busy: true });
  departed.unmount();
  await h.flush();
  expect(departed.stateWrites).toBe(0);
  expect(h.snapshot()).toEqual({ requests: 0, waiters: 0, busy: false });
  expect(h.intervals.size + h.timeouts.size).toBe(0);
});

test("waitForScrollQuiet preserves sampled quietness, movement reset and hidden visibility gating", async () => {
  const h = harness();
  let settled = false;
  const pending = h.module.waitForScrollQuiet().then(() => { settled = true; });
  await h.samples(3);
  expect(settled).toBe(false);
  await h.samples(1, true);
  await h.samples(2);
  expect(settled).toBe(false);
  h.document.visibilityState = "hidden";
  await h.samples(10);
  expect(settled).toBe(false);
  h.document.visibilityState = "visible";
  await h.samples(1);
  await pending;
  expect(settled).toBe(true);
  expect(h.intervals.size).toBe(0);
});

test("waitForScrollQuiet remains a resolving Promise without browser globals", async () => {
  const h = harness({ server: true });
  await h.module.waitForScrollQuiet();
  expect(h.snapshot()).toEqual({ requests: 0, waiters: 0, busy: false });
  expect(h.intervals.size + h.timeouts.size).toBe(0);
});
