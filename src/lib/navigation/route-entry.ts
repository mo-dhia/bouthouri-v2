import { designPixels } from "../viewport-design";

type EntryHandler = { start: (skip: boolean) => void | Promise<void>; finish?: () => void; assetsReady?: () => boolean };
type Entry<Owner> = { owner: Owner; path: string; ready: boolean; started: boolean; skip: boolean; fallback: boolean; handler?: EntryHandler; applied?: EntryHandler; done: Promise<void> };
export type RouteArrival<Owner> = { id: number; path: string; skip: boolean; owner?: Owner; released: boolean };

/** Retained decisions only: no listeners, clocks, graphics or side effects at import. */
export function createRouteEntryRegistry<Owner extends object>() {
  const entries = new WeakMap<Owner, Entry<Owner>>(), listeners = new Set<() => void>();
  const held = new Set<Entry<Owner>>();
  let current: RouteArrival<Owner> | null = null, sequence = 0;
  const notify = () => listeners.forEach(listener => listener());
  const entry = (owner: Owner, path: string) => {
    let record = entries.get(owner);
    if (!record || record.path !== path) { record = { owner, path, ready: false, started: false, skip: false, fallback: false, done: Promise.resolve() }; entries.set(owner, record); }
    return record;
  };
  const apply = (record: Entry<Owner>) => {
    if (!record.ready || !record.handler || record.applied === record.handler) return;
    if (current?.path === record.path && current.owner !== record.owner) { held.add(record); return; }
    const managed = current?.owner === record.owner && current.path === record.path;
    if (managed && !current!.released) return;
    const skip = record.started || record.skip || !!(managed && current!.skip);
    record.started = true; record.applied = record.handler;
    try { record.done = Promise.resolve(record.handler.start(skip)).catch(() => { record.handler?.finish?.(); }); }
    catch { record.handler.finish?.(); record.done = Promise.resolve(); }
  };
  const consumeHeld = (path: string) => {
    for (const record of [...held]) if (record.path === path) {
      held.delete(record); record.skip = record.started = true; apply(record);
    }
  };
  return {
    claim(path: string, skip = false) { const previous = current; current = null; if (previous) consumeHeld(previous.path); current = { id: ++sequence, path, skip, released: false }; return current; },
    adopt(arrival: RouteArrival<Owner>, owner: Owner) {
      if (current !== arrival || arrival.owner && arrival.owner !== owner) return false;
      const existing = entries.get(owner);
      if (existing && existing.path !== arrival.path) return false;
      arrival.owner = owner; held.delete(entry(owner, arrival.path)); return true;
    },
    replace(arrival: RouteArrival<Owner>, owner: Owner) {
      if (current !== arrival) return false;
      arrival.skip ||= arrival.released; arrival.released = false;
      if (arrival.owner) { const old = entries.get(arrival.owner); if (old) { old.skip = old.started = true; old.handler?.finish?.(); } }
      arrival.owner = undefined;
      return this.adopt(arrival, owner);
    },
    started(owner: Owner) { return entries.get(owner)?.started ?? false; },
    ready(owner: Owner, path?: string) { const record = entries.get(owner); return !!record?.ready && (!path || record.path === path); },
    assetsReady(owner: Owner) { const record = entries.get(owner); return !!record && (record.fallback || !record.handler?.assetsReady || record.handler.assetsReady()); },
    register(owner: Owner, path: string, handler: EntryHandler) {
      const record = entry(owner, path); record.handler = handler; record.ready = false; record.fallback = false;
      if (current?.path === path && !current.owner) current.owner = owner;
      else if (current?.path === path && current.owner !== owner) held.add(record);
      return {
        ready(skip = false) { if (record.handler !== handler) return; record.ready = true; record.skip ||= skip; apply(record); notify(); },
        presented() { if (record.handler === handler) notify(); },
        dispose() { if (record.handler === handler) { if (held.delete(record)) record.skip = record.started = true; record.handler = undefined; handler.finish?.(); } },
      };
    },
    fallback(owner: Owner, path: string) {
      const record = entry(owner, path); record.ready = true; record.fallback = true; record.skip = record.started = true;
      if (current?.path === path && !current.owner) current.owner = owner;
      if (current?.owner === owner && current.path === path) { current.released = true; current.skip = true; }
      apply(record); notify();
    },
    release(arrival: RouteArrival<Owner>, skip = false) {
      if (current !== arrival) return Promise.resolve();
      arrival.released = true; arrival.skip ||= skip;
      if (!arrival.owner) return Promise.resolve();
      const record = entry(arrival.owner, arrival.path); record.skip ||= arrival.skip;
      if (record.skip || !record.handler) record.started = true;
      apply(record); return record.done;
    },
    finish(arrival: RouteArrival<Owner>, canceled = false) {
      if (current !== arrival) return;
      if (arrival.owner && canceled) { const record = entry(arrival.owner, arrival.path); record.skip = record.started = true; record.handler?.finish?.(); }
      current = null; consumeHeld(arrival.path); notify();
    },
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  };
}
const registries = new WeakMap<Document, ReturnType<typeof createRouteEntryRegistry<HTMLElement>>>();
export function routeEntries(doc: Document = document) {
  let registry = registries.get(doc);
  if (!registry) { registry = createRouteEntryRegistry<HTMLElement>(); registries.set(doc, registry); }
  return registry;
}
export function pageEntryPath(root: HTMLElement, page: "vision" | "services" | "contact") {
  return root.closest<HTMLElement>("[data-route-path]")?.dataset.routePath ?? `/${root.dataset.locale ?? (root.dir === "rtl" ? "ar" : "en")}/${page}`;
}
export function skipPageEntry(reduced: boolean, win: Pick<Window, "scrollY" | "innerWidth"> = window) {
  return reduced || win.scrollY > designPixels(80, win.innerWidth);
}
