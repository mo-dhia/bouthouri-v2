import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import ts from "typescript";
import type { createEnvironmentOwner } from "./environment.logic";
import type { EnvironmentBinding } from "@/sections/landing/2-story/story-environment.animate";

type Runtime = Pick<typeof import("@/sections/landing/2-story/story-environment.animate"), "createPersistentStoryEnvironment">;
const flush = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };
function coordinatorHarness() {
  const idle = new Map<number, { callback(): void; timeout: number }>(), timers = new Map<number, () => void>();
  const media = Object.assign(new EventTarget(), { matches: false });
  const requests: { resolve(value: Runtime): void; reject(error: Error): void }[] = [];
  let serial = 0, creations = 0, disposals = 0, invalidations = 0, attachments = 0, releases = 0;
  let active: EnvironmentBinding | undefined;
  const initialModes: boolean[] = [], modes: boolean[] = [], bound: EnvironmentBinding[] = [];
  const host = {} as HTMLElement;
  const runtime: Runtime = { createPersistentStoryEnvironment(actualHost, options) {
    expect(actualHost).toBe(host); creations++; initialModes.push(options?.reduced ?? false);
    let disposed = false, currentToken: object | undefined;
    return {
      setReducedMode(value) { if (!disposed) modes.push(value); },
      bind(binding) {
        const token = {}; currentToken = token; attachments++; bound.push(binding); active = binding;
        return {
          invalidate() { if (!disposed && currentToken === token) invalidations++; },
          release() { if (currentToken !== token) return; releases++; currentToken = undefined; active = undefined; },
        };
      },
      dispose() { if (disposed) return; disposed = true; disposals++; active = undefined; },
    };
  } };
  const context = createContext({ matchMedia: () => media, window: {
    requestIdleCallback(callback: () => void, options: { timeout: number }) { const id = ++serial; idle.set(id, { callback, timeout: options.timeout }); return id; },
    cancelIdleCallback(id: number) { idle.delete(id); },
    setTimeout(callback: () => void) { const id = ++serial; timers.set(id, callback); return id; },
    clearTimeout(id: number) { timers.delete(id); },
  } });
  const source = readFileSync(new URL("./environment.logic.ts", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const evaluated = { exports: {} as { createEnvironmentOwner: typeof createEnvironmentOwner } };
  runInContext(`(function(module,exports){${compiled}\n})`, context)(evaluated, evaluated.exports);
  const owner = evaluated.exports.createEnvironmentOwner(() => new Promise<Runtime>((resolve, reject) => { requests.push({ resolve, reject }); }));
  return {
    owner, host, requests, runtime, idle, timers, modes, initialModes, bound,
    get active() { return active; },
    get stats() { return { creations, disposals, invalidations, attachments, releases }; },
    start() { for (const [id, task] of [...idle]) { idle.delete(id); task.callback(); } },
    systemReduced(value: boolean) { media.matches = value; media.dispatchEvent(new Event("change")); },
  };
}
function binding(kind: "home" | "editorial"): EnvironmentBinding {
  const node = {} as HTMLElement;
  return kind === "home" ? { kind, stage: node, page: node, owner: node, heroRoot: null }
    : { kind, stage: node, page: node, owner: node, pose: () => ({ time: 448, environment: .28, surfaceQuiet: .65 }) };
}

test("persistent owner starts HOME once at its idle boundary and adopts latest mode/binding", async () => {
  const h = coordinatorHarness(), home = binding("home");
  const lease = h.owner.register(home, "/en", false);
  const dispose = h.owner.mount(h.host, "en", "/en");
  expect(h.idle.size).toBe(1); expect([...h.idle.values()][0].timeout).toBe(1200);
  expect(h.requests).toHaveLength(0); lease.setReducedMode(true);
  h.start(); expect(h.requests).toHaveLength(1); lease.setReducedMode(false); lease.setReducedMode(true);
  h.requests[0].resolve(h.runtime); await flush();
  expect(h.initialModes).toEqual([true]); expect(h.active).toBe(home);
  lease.release(); expect(h.stats.disposals).toBe(0); expect(h.active).toBeUndefined();
  h.owner.navigate("/en/vision"); const editorial = binding("editorial");
  const next = h.owner.register(editorial, "/en/vision", false);
  lease.release(); lease.invalidate(); lease.setReducedMode(true);
  expect(h.active).toBe(editorial); expect(h.modes.at(-1)).toBe(false);
  next.invalidate(); expect(h.stats.invalidations).toBe(1);
  expect(h.requests).toHaveLength(1); expect(h.stats.creations).toBe(1);
  dispose(); dispose(); expect(h.stats.disposals).toBe(1); expect(h.idle.size + h.timers.size).toBe(0);
  const writes = h.modes.length; h.systemReduced(true); expect(h.modes).toHaveLength(writes);
});

test("a route superseding idle/import uses the latest lease; a zero-binding completion creates no orphan", async () => {
  const h = coordinatorHarness(), dispose = h.owner.mount(h.host, "ar", "/ar");
  const home = h.owner.register(binding("home"), "/ar", false);
  expect(h.idle.size).toBe(1);
  h.owner.navigate("/ar/services"); const service = h.owner.register(binding("editorial"), "/ar/services", false);
  expect(h.idle.size).toBe(0); expect(h.requests).toHaveLength(1);
  home.release(); h.owner.navigate("/ar/vision");
  const visionBinding = binding("editorial"), vision = h.owner.register(visionBinding, "/ar/vision", true);
  service.release(); h.requests[0].resolve(h.runtime); await flush();
  expect(h.stats.creations).toBe(1); expect(h.active).toBe(visionBinding); expect(h.initialModes).toEqual([true]);
  vision.release(); dispose();
  const gap = coordinatorHarness(), gapDispose = gap.owner.mount(gap.host, "en", "/en/contact");
  const contact = gap.owner.register(binding("editorial"), "/en/contact", false); contact.release();
  gap.requests[0].resolve(gap.runtime); await flush(); expect(gap.stats.creations).toBe(0);
  const next = gap.owner.register(binding("editorial"), "/en/contact", true);
  expect(gap.stats.creations).toBe(1); expect(gap.initialModes).toEqual([true]);
  next.release(); gapDispose(); expect(gap.stats.disposals).toBe(1);
});

test("excluded paths cancel old import generations and permit one fresh resource on eligible reentry", async () => {
  const h = coordinatorHarness(), dispose = h.owner.mount(h.host, "en", "/en");
  const old = h.owner.register(binding("home"), "/en", false); h.start();
  h.owner.navigate("/en/archive"); old.release();
  h.owner.register(binding("editorial"), "/en/archive", false);
  h.owner.navigate("/en/services"); const serviceBinding = binding("editorial");
  h.owner.register(serviceBinding, "/en/services", true);
  expect(h.requests).toHaveLength(2);
  h.requests[0].resolve(h.runtime); await flush(); expect(h.stats.creations).toBe(0);
  h.requests[1].resolve(h.runtime); await flush(); expect(h.stats.creations).toBe(1); expect(h.active).toBe(serviceBinding);
  h.owner.navigate("/en/not-a-route"); expect(h.stats.disposals).toBe(1);
  h.owner.navigate("/en/contact"); h.owner.register(binding("editorial"), "/en/contact", false);
  expect(h.stats.creations).toBe(2); expect(h.requests).toHaveLength(2);
  dispose(); expect(h.stats.disposals).toBe(2); expect(h.idle.size + h.timers.size).toBe(0);
});

test('Projects retains the same shared field resource across editorial leases', async () => {
  const h = coordinatorHarness(), dispose = h.owner.mount(h.host, 'en', '/en/contact');
  const first = h.owner.register(binding('editorial'), '/en/contact', false);
  h.requests[0].resolve(h.runtime); await flush();
  const grid = binding('editorial'); h.owner.navigate('/en/projects');
  const next = h.owner.register(grid, '/en/projects', false); first.release();
  expect(h.stats.creations).toBe(1); expect(h.stats.disposals).toBe(0); expect(h.active).toBe(grid);
  next.release(); dispose(); expect(h.stats.disposals).toBe(1);
});

test("import failure stays optional without per-route retries; layout cancellation cannot adopt late work", async () => {
  const h = coordinatorHarness(), dispose = h.owner.mount(h.host, "en", "/en/vision");
  h.owner.register(binding("editorial"), "/en/vision", false);
  h.requests[0].reject(new Error("chunk blocked")); await flush();
  h.owner.navigate("/en/contact"); h.owner.register(binding("editorial"), "/en/contact", false);
  expect(h.requests).toHaveLength(1); expect(h.stats.creations).toBe(0);
  h.owner.navigate("/en/archive"); h.owner.navigate("/en/contact");
  h.owner.register(binding("editorial"), "/en/contact", false); expect(h.requests).toHaveLength(2);
  dispose(); h.requests[1].resolve(h.runtime); await flush();
  expect(h.stats.creations).toBe(0); expect(h.idle.size + h.timers.size).toBe(0);
});

test("superseded layout cleanup and old route leases cannot destroy a newer owner, even in the same slot", async () => {
  const h = coordinatorHarness(), oldDispose = h.owner.mount(h.host, "en", "/en/contact");
  const old = h.owner.register(binding("editorial"), "/en/contact", false);
  const dispose = h.owner.mount(h.host, "ar", "/ar/vision");
  const nextBinding = binding("editorial"), next = h.owner.register(nextBinding, "/ar/vision", false);
  oldDispose(); old.release(); old.setReducedMode(true);
  h.requests[0].resolve(h.runtime); h.requests[1].resolve(h.runtime); await flush();
  expect(h.stats.creations).toBe(1); expect(h.active).toBe(nextBinding);
  h.systemReduced(true); expect(h.modes.at(-1)).toBe(true);
  next.release(); dispose(); expect(h.stats.disposals).toBe(1);
});
