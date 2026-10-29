import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { experimentLayout } from './experiment-layout';
import { createRouteEntryRegistry } from '@/lib/navigation/route-entry';

type Environment = ReturnType<typeof import('./experiment-environment').createExperimentEnvironment>;
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
class NodeFixture extends EventTarget {
  isConnected = true; dataset: Record<string, string> = {}; disabled = true;
  style = ''; children: NodeFixture[] = [];
  getAttribute() { return null; } setAttribute() {} removeAttribute() {}
  replaceChildren() { this.children = []; } contains(node: unknown) { return this.children.includes(node as NodeFixture); }
  querySelector() { return null; } querySelectorAll() { return []; }
}
function harness() {
  const root = new NodeFixture(), camera = new NodeFixture(), fields = new NodeFixture(), reset = new NodeFixture();
  root.dataset = { experiment: 'heart', locale: 'en' };
  const media = Object.assign(new EventTarget(), { matches: false });
  const timers = new Map<number, () => void>(); let serial = 0;
  const win = Object.assign(new EventTarget(), { innerWidth: 1920, matchMedia: () => media, setTimeout(callback: () => void) { timers.set(++serial, callback); return serial; }, clearTimeout(id: number) { timers.delete(id); } });
  const doc = Object.assign(new EventTarget(), { defaultView: win, hidden: false });
  Object.assign(root, { ownerDocument: doc, querySelector(selector: string) { return selector.includes('camera') ? camera : selector.includes('reset') ? reset : selector.includes('controls') ? fields : null; } });
  const registry = createRouteEntryRegistry<HTMLElement>();
  const pending: { resolve(value: unknown): void; reject(reason: unknown): void }[] = [], environments: { frames: (() => void)[]; failure(error: unknown): void; disposed: number; paused: boolean[] }[] = [];
  let mounts = 0, destroys = 0, pauses = 0, subscriber = () => {};
  const state = { quietMode: false, menuOpen: false };
  const code = ts.transpileModule(readFileSync(new URL('./experiment.animate.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const requireModule = (id: string) => {
    if (id === '@/store/uiStore') return { uiStore: { getState: () => state, subscribe(callback: () => void) { subscriber = callback; return () => { subscriber = () => {}; }; } } };
    if (id === '@/lib/navigation/route-entry') return { routeEntries: () => registry, pageEntryPath: () => '/en/projects/heart' };
    if (id === './experiment-layout') return { experimentLayout };
    if (id === './experiment-environment') return { createExperimentEnvironment(_root: unknown, _reduced: boolean, failure: (error: unknown) => void) {
      const owned = { frames: [] as (() => void)[], failure, disposed: 0, paused: [] as boolean[] }; environments.push(owned);
      return { clock: { request(callback: () => void) { owned.frames.push(callback); } }, pause(value: boolean) { owned.paused.push(value); }, resize() {}, dispose() { owned.disposed++; owned.frames = []; } } as unknown as Environment;
    } };
    if (id.includes('/heart/')) return new Promise((resolve, reject) => { pending.push({ resolve, reject }); });
    throw new Error(`Unexpected fixture dependency ${id}`);
  };
  const evaluatedModule = { exports: {} as typeof import('./experiment.animate') };
  const Observer = class { observe() {} disconnect() {} };
  new Function('require', 'module', 'exports', 'IntersectionObserver', 'Node', 'HTMLInputElement', code)(requireModule, evaluatedModule, evaluatedModule.exports, Observer, NodeFixture, NodeFixture);
  const cleanup = evaluatedModule.exports.mountExperiment(root as unknown as HTMLElement);
  const renderer = { experiment: { mount() { mounts++; return { destroy() { destroys++; }, pause() { pauses++; }, set() {} }; } } };
  return { root, camera, registry, state, environments, pending, cleanup, get counts() { return { mounts, destroys, pauses }; },
    async load() { await flush(); pending.at(-1)!.resolve(renderer); await flush(); },
    async resize(width: number) { win.innerWidth = width; win.dispatchEvent(new Event('resize')); [...timers.values()].forEach(callback => callback()); timers.clear(); await flush(); },
    menu(value: boolean) { state.menuOpen = value; subscriber(); },
    draw() { const env = environments.at(-1)!; const frames = [...env.frames]; env.frames = []; frames.forEach(callback => callback()); },
  };
}

test('departed cold imports never allocate a renderer or publish readiness', async () => {
  const h = harness(); await flush(); h.cleanup(); await h.load();
  expect(h.counts.mounts).toBe(0); expect(h.environments).toHaveLength(0); expect(h.root.dataset.experimentLive).toBeUndefined();
});
test('first renderer frame releases readiness once; menu pauses the same owner; cleanup destroys once', async () => {
  const h = harness(); let announces = 0; h.root.addEventListener('experiment-ready', () => announces++);
  await h.load(); expect(h.root.dataset.experimentLive).toBeUndefined(); expect(h.registry.assetsReady(h.root as unknown as HTMLElement)).toBe(false);
  h.draw(); expect(h.root.dataset.experimentLive).toBe('true'); expect(h.registry.assetsReady(h.root as unknown as HTMLElement)).toBe(true); expect(announces).toBe(1);
  h.menu(true); h.menu(false); expect(h.environments[0].paused.slice(-2)).toEqual([true, false]); expect(h.counts.pauses).toBe(1);
  h.cleanup(); expect(h.counts.destroys).toBe(1); expect(h.environments[0].disposed).toBe(1);
});
test('late departed renderer failures cannot destroy the replacement profile owner', async () => {
  const h = harness(); await h.load(); h.draw(); const old = h.environments[0];
  await h.resize(650); expect(old.disposed).toBe(1); await h.load(); h.draw();
  old.failure(new Error('late model rejection')); expect(h.root.dataset.experimentFailed).toBeUndefined(); expect(h.root.dataset.experimentLive).toBe('true');
  expect(h.environments[1].disposed).toBe(0); h.cleanup(); expect(h.counts.destroys).toBe(2);
});
test('current draw failure releases the route and restores the persistent poster', async () => {
  const h = harness(); await h.load(); h.draw(); h.environments[0].failure(new Error('GPU lost'));
  expect(h.root.dataset.experimentFailed).toBe('true'); expect(h.root.dataset.experimentLive).toBeUndefined(); expect(h.registry.assetsReady(h.root as unknown as HTMLElement)).toBe(true);
  expect(h.counts.destroys).toBe(1); h.cleanup(); expect(h.counts.destroys).toBe(1);
});
