import { createRouteEntryRegistry, pageEntryPath, skipPageEntry } from "../../../lib/navigation/route-entry";

type Handler = Parameters<ReturnType<typeof createRouteEntryRegistry<HTMLElement>>["register"]>[2];

/** Wrap the actual registration; never copy its predicate or registry logic. */
export function createRouteEntryCapture(path: string, managed = false) {
  const registry = createRouteEntryRegistry<HTMLElement>();
  const arrival = managed ? registry.claim(path) : null;
  let owner: HTMLElement | undefined, handler: Handler | undefined;
  let ready = 0, presented = 0, disposed = 0;
  const starts: boolean[] = [], readySkips: boolean[] = [];
  const wrapped = {
    ...registry,
    register(root: HTMLElement, registeredPath: string, registeredHandler: Handler) {
      owner = root; handler = registeredHandler;
      const publication = registry.register(root, registeredPath, {
        ...registeredHandler,
        start(skip) { starts.push(skip); return registeredHandler.start(skip); },
      });
      return {
        ready(skip = false) { ready++; readySkips.push(skip); publication.ready(skip); },
        presented() { presented++; publication.presented(); },
        dispose() { disposed++; publication.dispose(); },
      };
    },
  };
  return {
    module: { routeEntries: () => wrapped, pageEntryPath, skipPageEntry },
    readiness() {
      if (!owner || !handler) throw new Error("Controller has not registered its route entry.");
      return { registered: handler.assetsReady?.() ?? true, assets: registry.assetsReady(owner), ready: registry.ready(owner, path) };
    },
    stats: () => ({ ready, presented, disposed, starts: [...starts], readySkips: [...readySkips] }),
    release: () => arrival ? registry.release(arrival) : Promise.resolve(),
  };
}
