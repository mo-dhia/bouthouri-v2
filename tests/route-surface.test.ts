import { afterEach, expect, test } from "bun:test";
import { routeEntries } from "../src/lib/navigation/route-entry";
import * as homeState from "../src/lib/navigation/home-navigation-state";
import { ROUTE_COVERED_EVENT, ROUTE_HISTORY_KEY, ROUTE_HISTORY_STATE_KEY } from "../src/lib/navigation/route-navigation-state";
import { installGlobals, loadIsolatedModule } from "../src/sections/services/test-support/isolated-module";

class ElementFixture {
  dataset: Record<string, string> = {};
  style = { opacity: "" };
  isConnected = true;
  ownerDocument!: Document;
  previousElementSibling: ElementFixture | null = null;
  selections = new Map<string, ElementFixture>();
  attributes = new Map<string, string>();
  listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();
  scrollHeight = 30000;
  popover = false;
  href = "";
  querySelector(selector: string) { return this.selections.get(selector) ?? null; }
  matches(selector: string) { return selector === ":popover-open" ? this.popover : selector === "[data-portfolio-shell]" && this.dataset.shell === "true"; }
  closest(selector: string) { return selector === "a[href]" && this.href ? this : null; }
  getAttribute(key: string) { return this.attributes.get(key) ?? null; }
  hasAttribute(key: string) { return this.attributes.has(key); }
  setAttribute(key: string, value: string) { this.attributes.set(key, value); }
  removeAttribute(key: string) { this.attributes.delete(key); }
  showPopover() { this.popover = true; }
  hidePopover() { this.popover = false; }
  focus() { Object.assign(this.ownerDocument, { activeElement: this }); }
  addEventListener(type: string, listener: EventListenerOrEventListenerObject) { const group = this.listeners.get(type) ?? new Set(); group.add(listener); this.listeners.set(type, group); }
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject) { this.listeners.get(type)?.delete(listener); }
  dispatchEvent(event: Event) { this.listeners.get(event.type)?.forEach(listener => { if (typeof listener === "function") listener(event); else listener.handleEvent(event); }); return !event.defaultPrevented; }
}
const releases: (() => void)[] = [];
afterEach(() => { while (releases.length) releases.pop()!(); });
const flush = async () => { for (let index = 0; index < 8; index++) await Promise.resolve(); };

function harness({ denied = false, type = "navigate", initialHold = false, deferPushSelection = false, insecure = false, initialState = {} as Record<string, unknown> } = {}) {
  let now = 0, serial = 0, menu = false, stopped = false;
  const frames = new Map<number, FrameRequestCallback>(), timers = new Map<number, { at: number; callback: () => void }>(), storage = new Map<string, string>();
  const writes: Record<string, unknown>[] = [], calls: string[] = [], hard: string[] = [], prefetches: string[] = [];
  const body = new ElementFixture(), html = new ElementFixture(), surface = new ElementFixture(), field = new ElementFixture(); surface.selections.set("[data-route-field]", field);
  const owners: { main: ElementFixture; inner: ElementFixture; heading: ElementFixture; shell: ElementFixture; path: string }[] = [];
  const locationAt = (path: string) => Object.assign(new URL(path, "https://local.test"), { assign: (target: string) => { hard.push(target); } });
  const win = Object.assign(new EventTarget(), {
    location: locationAt("/en/vision"), innerWidth: 1920, innerHeight: 1080, scrollY: 0,
    crypto: insecure ? { getRandomValues: crypto.getRandomValues.bind(crypto) } as Crypto : crypto,
    performance: { now: () => now, getEntriesByType: () => [{ type }] },
    matchMedia: () => ({ matches: false }),
    history: { state: { __NA: true, retained: "next", ...initialState }, replaceState(value: Record<string, unknown>) { this.state = structuredClone(value) as typeof this.state; writes.push(structuredClone(value)); } },
    sessionStorage: {
      getItem(key: string) { if (denied) throw new Error("denied"); return storage.get(key) ?? null; },
      setItem(key: string, value: string) { if (denied) throw new Error("denied"); storage.set(key, value); },
      removeItem(key: string) { if (denied) throw new Error("denied"); storage.delete(key); },
    },
    scrollTo({ top }: { top: number }) { calls.push(menu ? "locked-scroll" : `scroll:${top}`); if (!menu) win.scrollY = top; },
    requestAnimationFrame(callback: FrameRequestCallback) { frames.set(++serial, callback); return serial; },
    cancelAnimationFrame(id: number) { frames.delete(id); },
    setTimeout(callback: () => void, delay: number) { timers.set(++serial, { at: now + delay, callback }); return serial; },
    clearTimeout(id: number) { timers.delete(id); },
  });
  const doc = {
    body, documentElement: html, defaultView: win, activeElement: body,
    fonts: { ready: Promise.resolve() },
    querySelectorAll: () => owners.map(owner => owner.main),
    querySelector: (selector: string) => selector === "dialog.navigation-scene[open]" && menu ? owners[0].shell : null,
  } as unknown as Document;
  [body, html, surface, field].forEach(element => { element.ownerDocument = doc; });
  const owner = (path: string) => {
    const main = new ElementFixture(), inner = new ElementFixture(), heading = new ElementFixture(), shell = new ElementFixture();
    [main, inner, heading, shell].forEach(element => { element.ownerDocument = doc; });
    main.dataset.routePath = path; shell.dataset.shell = "true"; main.previousElementSibling = shell;
    main.selections.set("h1", heading);
    main.selections.set(path.endsWith("vision") ? "[data-vision-root]" : path.endsWith("services") ? "#services-content" : path.endsWith("projects") ? "[data-projects-root], [data-experiment-root]" : "[data-contact-content]", inner);
    const result = { main, inner, heading, shell, path }; owners.push(result); return result;
  };
  const first = owner("/en/vision");
  const entries = routeEntries(doc);
  const directStarts: boolean[] = [];
  if (initialHold) { const claim = entries.claim(first.path, type === "back_forward"); entries.adopt(claim, first.inner as unknown as HTMLElement); }
  // An already visible autonomous direct entry must not be re-covered.
  entries.register(first.inner as unknown as HTMLElement, first.path, { start(skip) { directStarts.push(skip); } }).ready();
  const restoreGlobals = installGlobals({ Element: ElementFixture, ResizeObserver: class { observe() {} disconnect() {} }, MutationObserver: class { observe() {} disconnect() {} } });
  const evaluated = loadIsolatedModule<{ mountRouteSurface: (surface: HTMLElement, push: (href: string) => void, prefetch: (href: string) => void) => { update: () => void; dispose: () => void } }>("src/components/layout/route-surface/route-surface.animate.ts", {
    "@/lib/audio/material-audio": { playMaterialSound() { calls.push("sound"); } },
    "@/lib/navigation/route-entry": { routeEntries },
    "@/lib/navigation/home-navigation-state": homeState,
    "@/lib/navigation/home-navigation": { cancelHomeRouteArrival() {}, prepareHomeRoutePush() { calls.push("home-push"); }, prepareHomeRouteHistory() { calls.push("home-history"); } },
  });
  let outgoingState: Record<string, unknown> = {};
  const controller = evaluated.mountRouteSurface(surface as unknown as HTMLElement, target => {
    calls.push("push"); outgoingState = structuredClone(win.history.state);
    if (!deferPushSelection) { win.location = locationAt(target); win.history.state = { __NA: true, retained: "next" }; }
  }, target => { prefetches.push(target); });
  win.addEventListener(ROUTE_COVERED_EVENT, () => { calls.push("covered"); menu = false; });
  const stop = () => { if (stopped) return; stopped = true; controller.dispose(); restoreGlobals(); };
  releases.push(stop);
  return {
    win, doc, body, surface, field, first, entries, directStarts, calls, hard, prefetches, writes, storage, frames, timers, owner, controller, stop,
    outgoingState: () => outgoingState,
    menu() { menu = true; },
    install(next: ReturnType<typeof owner>) {
      owners.forEach(item => { item.main.isConnected = item.inner.isConnected = item.heading.isConnected = item === next; }); controller.update();
    },
    ready(next: ReturnType<typeof owner>, start: (skip: boolean) => void | Promise<void> = () => {}) { return entries.register(next.inner as unknown as HTMLElement, next.path, { start }).ready(); },
    click(target: string, overrides: Record<string, unknown> = {}, attributes: Record<string, string> = {}) {
      const anchor = new ElementFixture(); anchor.href = new URL(target, win.location.href).href;
      Object.entries(attributes).forEach(([name, value]) => anchor.setAttribute(name, value));
      const event = Object.assign(new Event("click", { cancelable: true }), { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, ...overrides });
      Object.defineProperty(event, "target", { value: anchor }); body.dispatchEvent(event); return event;
    },
    intent(target: string, type = "pointerover") {
      const anchor = new ElementFixture(); anchor.href = new URL(target, win.location.href).href;
      const event = new Event(type); Object.defineProperty(event, "target", { value: anchor }); body.dispatchEvent(event);
    },
    async advance(milliseconds: number, callbackDelay = 0) {
      const end = now + milliseconds;
      while (now < end) {
        now = Math.min(end, now + 20);
        for (const [id, timer] of [...timers]) if (timer.at <= now) { timers.delete(id); timer.callback(); }
        const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback(now - callbackDelay)); await flush();
      }
    },
    traverse(path: string, state: Record<string, unknown>) { win.location = locationAt(path); win.history.state = state as typeof win.history.state; win.dispatchEvent(new Event("popstate")); },
  };
}

test("plain HTTP LAN editorial arrival and soft navigation do not require randomUUID", async () => {
  const h = harness({ insecure: true }); await h.advance(600);
  const first = ((h.win.history.state as Record<string, unknown>)[ROUTE_HISTORY_STATE_KEY] as { id: string }).id;
  expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  expect(h.click("/en/contact").defaultPrevented).toBe(true); await h.advance(320);
  const next = h.owner("/en/contact"); h.install(next); h.ready(next); await h.advance(1000);
  expect(h.surface.dataset.phase).toBe("idle");
  expect(((h.win.history.state as Record<string, unknown>)[ROUTE_HISTORY_STATE_KEY] as { id: string }).id).not.toBe(first);
  expect(h.hard).toEqual([]); h.stop();
});

test("Projects joins managed menu navigation with its own connected grid owner", async () => {
  const h = harness(); h.menu(); h.intent('/en/projects');
  expect(h.prefetches).toContain('/en/projects');
  expect(h.click('/en/projects').defaultPrevented).toBe(true); await h.advance(320);
  const grid = h.owner('/en/projects'), starts: boolean[] = [];
  h.install(grid); h.ready(grid, skip => { starts.push(skip); }); await h.advance(1000);
  expect(starts).toEqual([false]); expect(h.surface.dataset.phase).toBe('idle');
  expect(h.win.location.pathname).toBe('/en/projects'); expect(h.win.scrollY).toBe(0);
  expect(h.hard).toEqual([]); expect(h.frames.size + h.timers.size).toBe(0); h.stop();
});

test("mounted body capture waits for full cover, releases old menu before routing and ignores connected old page readiness", async () => {
  const h = harness(); h.menu(); h.win.scrollY = 700;
  expect(h.surface.dataset.active).not.toBe("true");
  expect(h.click("/en/contact").defaultPrevented).toBe(true);
  expect(h.calls).toEqual(["sound"]);
  await h.advance(280); expect(h.calls).not.toContain("push");
  await h.advance(40); expect(h.calls.indexOf("covered")).toBeLessThan(h.calls.indexOf("push"));
  expect(h.field.style.opacity).toBe("1"); expect(h.surface.dataset.phase).toBe("waiting");
  h.entries.fallback(h.first.inner as unknown as HTMLElement, h.first.path); await flush();
  expect(h.surface.dataset.phase).toBe("waiting");
  const contact = h.owner("/en/contact"), starts: boolean[] = [];
  h.ready(contact, skip => { starts.push(skip); }); h.install(contact); await flush();
  expect(starts).toEqual([false]); expect(h.calls).not.toContain("locked-scroll");
  await h.advance(400); expect(h.surface.dataset.active).toBe("false"); expect(h.frames.size).toBe(0); expect(h.timers.size).toBe(0);
  expect(h.writes.every(state => state.__NA === true && state.retained === "next")).toBe(true);
});

test("route reveal uses cached source callback-clock samples when RAF dispatch is delayed", async () => {
  const h = harness(); h.win.matchMedia = () => ({ matches: true });
  h.click("/en/contact"); await h.advance(140);
  const contact = h.owner("/en/contact"); h.ready(contact); h.install(contact); await flush();
  expect(h.surface.dataset.phase).toBe("revealing");
  expect(h.field.style.opacity).toBe("1");
  // Actual cached core32919 fresh130ms sine tween, created at the current
  // parent tick: elapsed wall80/96ms with forwarded stamps33.58/82.92ms.
  // R4's controlled schedule proves the sampling contract, not browser paint.
  await h.advance(80, 46.42);
  expect(Number(h.field.style.opacity)).toBeCloseTo(.322698, 5);
  await h.advance(16, 13.08);
  expect(Number(h.field.style.opacity)).toBeCloseTo(.159492, 5);
  await h.advance(34, 5);
  expect(h.surface.dataset.active).toBe("false");
  expect(h.field.style.opacity).toBe("0");
  expect(h.frames.size).toBe(0); expect(h.timers.size).toBe(0);
});

test("editorial Back restores its own pixels once, skips entry/focus and never writes history during scrolling", async () => {
  const h = harness(); h.win.scrollY = 760; h.click("/en/services"); await h.advance(320);
  const visionState = h.outgoingState(), services = h.owner("/en/services"); h.ready(services); h.install(services); await flush(); await h.advance(400);
  const count = h.writes.length;
  for (let index = 0; index < 70; index++) { h.win.scrollY = 1000 + index; h.win.dispatchEvent(new Event("scroll")); h.win.dispatchEvent(new Event("scrollend")); }
  expect(h.writes.length).toBe(count);
  const focused = h.doc.activeElement;
  h.traverse("/en/vision", visionState); await flush(); expect(h.surface.dataset.phase).toBe("waiting");
  const destination = h.owner("/en/vision"), starts: boolean[] = []; h.ready(destination, skip => { starts.push(skip); }); h.install(destination); await flush();
  expect(h.win.scrollY).toBe(760); expect(starts).toEqual([true]);
  await h.advance(400); expect(h.doc.activeElement).toBe(focused); expect(h.frames.size).toBe(0);
  expect(h.storage.get(ROUTE_HISTORY_KEY)).toContain("760");
});

test("a failed/late enhancement fails open at the ceiling and cannot replay; native activations remain unclaimed", async () => {
  const h = harness();
  expect(h.click("/en/contact", { ctrlKey: true }).defaultPrevented).toBe(false);
  expect(h.click("/en/archive").defaultPrevented).toBe(false);
  expect(h.click("/en/contact#form").defaultPrevented).toBe(false);
  h.click("/en/contact"); await h.advance(320);
  const contact = h.owner("/en/contact"); h.install(contact); await flush();
  await h.advance(4600); expect(h.surface.dataset.active).toBe("false");
  const late: boolean[] = []; h.ready(contact, skip => { late.push(skip); });
  expect(late).toEqual([true]); expect(h.frames.size).toBe(0); expect(h.timers.size).toBe(0);
});

test("denied storage retains an inline editorial boundary and dispose cancels every pending job", async () => {
  const h = harness({ denied: true }); h.win.scrollY = 944;
  h.click("/en/services"); await h.advance(320);
  expect(h.outgoingState()[ROUTE_HISTORY_STATE_KEY]).toMatchObject({ scrollY: 944, path: "/en/vision" });
  h.stop(); expect(h.frames.size).toBe(0); expect(h.timers.size).toBe(0);
  await h.advance(9000); expect(h.hard).toEqual([]);
});

test("same-URL traversal captures the outgoing identity before adopting the selected one", async () => {
  const h = harness();
  const previous = String((h.win.history.state as Record<string, unknown>)[ROUTE_HISTORY_STATE_KEY] && ((h.win.history.state as Record<string, unknown>)[ROUTE_HISTORY_STATE_KEY] as { id: string }).id);
  h.win.scrollY = 711; h.win.dispatchEvent(new Event("scroll"));
  h.traverse("/en/vision", { __NA: true, retained: "next", [ROUTE_HISTORY_STATE_KEY]: { version: 1, id: "selected-other" } });
  h.win.scrollY = 300; h.win.dispatchEvent(new Event("scroll"));
  h.traverse("/en/vision", { __NA: true, retained: "next", [ROUTE_HISTORY_STATE_KEY]: { version: 1, id: previous } });
  const records = JSON.parse(h.storage.get(ROUTE_HISTORY_KEY)!);
  expect(records[previous].scrollY).toBe(711);
  expect(records["selected-other"].scrollY).toBe(300);
});

test("managed direct entry honors its minimum while direct history skips page entry", async () => {
  const h = harness({ initialHold: true });
  await h.advance(140); expect(h.directStarts).toEqual([]); expect(h.field.style.opacity).toBe("1");
  await h.advance(40); expect(h.directStarts).toEqual([false]);
  await h.advance(400); expect(h.surface.dataset.active).toBe("false");
  expect((h.doc.activeElement as HTMLElement).dataset.routeFocus).toBe("true");
  h.stop();
  const history = harness({ initialHold: true, type: "back_forward" });
  await history.advance(600); expect(history.directStarts).toEqual([true]); expect(history.doc.activeElement === history.body as unknown as Element).toBe(true);
});

test("navigation failure hard-falls back once, and BFCache never replays an initial cover", async () => {
  const h = harness(); h.click("/en/services"); await h.advance(8200);
  expect(h.hard).toEqual(["/en/services"]); expect(h.surface.dataset.active).toBe("false");
  await h.advance(8200); expect(h.hard).toHaveLength(1); h.stop();
  const resumed = harness(); resumed.win.dispatchEvent(new Event("pagehide"));
  resumed.win.dispatchEvent(Object.assign(new Event("pageshow"), { persisted: true })); await resumed.advance(600);
  expect(resumed.directStarts).toEqual([false]); expect(resumed.frames.size).toBe(0); expect(resumed.timers.size).toBe(0);
});

test("managed visible practice waits for first GPU presentation or fallback and evaluates visibility after restore", async () => {
  const h = harness(); h.click("/en/services"); await h.advance(320);
  const services = h.owner("/en/services"); let rendered = false; const starts: boolean[] = [];
  const publication = h.entries.register(services.inner as unknown as HTMLElement, services.path, { start: skip => { starts.push(skip); }, assetsReady: () => rendered || h.win.scrollY > 1080 });
  publication.ready(); h.install(services); await flush();
  expect(h.surface.dataset.phase).toBe("waiting"); expect(starts).toEqual([]);
  rendered = true; publication.presented(); await flush();
  expect(starts).toEqual([false]); await h.advance(400);
  h.click("/en/contact"); await h.advance(320); const contact = h.owner("/en/contact"); h.ready(contact); h.install(contact); await flush(); await h.advance(400);
  rendered = false;
  h.traverse("/en/services", { __NA: true, retained: "next", [ROUTE_HISTORY_STATE_KEY]: { version: 1, id: "deep-services", path: "/en/services", scrollY: 2000, created: Date.now() } });
  services.main.isConnected = services.inner.isConnected = true; h.install(services); await flush();
  expect(h.win.scrollY).toBe(2000); expect(h.surface.dataset.phase).toBe("revealing"); await h.advance(400);
  h.stop();
  const failed = harness(); failed.click("/en/services"); await failed.advance(320);
  const fallbackOwner = failed.owner("/en/services"); let depthFallback = false;
  const fallbackPublication = failed.entries.register(fallbackOwner.inner as unknown as HTMLElement, fallbackOwner.path, { start() {}, assetsReady: () => depthFallback });
  fallbackPublication.ready(); failed.install(fallbackOwner); await flush(); expect(failed.surface.dataset.phase).toBe("waiting");
  depthFallback = true; fallbackPublication.presented(); await flush(); expect(failed.surface.dataset.phase).toBe("revealing");
});

test("plain-anchor pointer/focus intent prefetch is bounded and never warms hard or unsupported destinations", () => {
  const h = harness(); h.intent("/en/contact"); h.intent("/en/contact", "focusin");
  expect(h.prefetches).toEqual(["/en/contact"]);
  h.intent("/ar/contact"); h.intent("/en/archive"); h.intent("/en/contact#form"); expect(h.prefetches).toHaveLength(1);
  for (let index = 0; index < 50; index++) h.intent(`/en/services?visit=${index}`);
  h.intent("/en/services?visit=49", "focusin"); expect(h.prefetches).toHaveLength(51);
});

test("R6 unclaimed ordinary Next activation supersedes managed cover or destination wait without claiming the link", async () => {
  for (const elapsed of [100, 320]) {
    const h = harness(); h.click("/en/services"); await h.advance(elapsed);
    const projects = h.click("/en/archive");
    expect(projects.defaultPrevented).toBe(false);
    h.win.location = Object.assign(new URL("/en/archive", h.win.location.href), { assign: (target: string) => { h.hard.push(target); } });
    h.win.history.state = { __NA: true, retained: "next" };
    h.first.main.isConnected = h.first.inner.isConnected = false;
    h.controller.update(); await h.advance(8200);
    expect(h.hard).toEqual([]); expect(h.calls.filter(call => call === "push")).toHaveLength(elapsed < 300 ? 0 : 1);
    expect(h.surface.dataset.phase).toBe("idle"); expect(h.frames.size).toBe(0); expect(h.timers.size).toBe(0); h.stop();
  }
});

test("R6 selected route or entry changes cancel before cover commit and before the final watchdog", async () => {
  for (const mode of ["cover-route", "cover-entry", "wait-route", "wait-route-no-update", "wait-entry"]) {
    const h = harness(); h.click("/en/services"); await h.advance(mode.startsWith("cover") ? 100 : 320);
    if (mode === "wait-entry") { Object.assign(h.win.history.state, { [ROUTE_HISTORY_STATE_KEY]: { version: 1, id: "first-destination" } }); h.controller.update(); await h.advance(20); }
    if (mode !== "cover-entry" && mode !== "wait-entry") h.win.location = Object.assign(new URL("/en/archive", h.win.location.href), { assign: (target: string) => { h.hard.push(target); } });
    h.win.history.state = Object.assign({ __NA: true, retained: "next" }, { [ROUTE_HISTORY_STATE_KEY]: { version: 1, id: "superseding-entry" } });
    if (mode === "wait-route") h.controller.update();
    await h.advance(8200);
    expect(h.hard).toEqual([]); expect(h.calls.filter(call => call === "push")).toHaveLength(mode.startsWith("cover") ? 0 : 1);
    expect(h.frames.size).toBe(0); expect(h.timers.size).toBe(0); h.stop();
  }
  // A legitimate router request can retain its origin selection until timeout.
  const pending = harness({ deferPushSelection: true }); pending.click("/en/services"); await pending.advance(8200);
  expect(pending.hard).toEqual(["/en/services"]); pending.stop();
  const claimed = harness(); claimed.click("/en/services"); expect(claimed.click("/en/contact").defaultPrevented).toBe(true);
  await claimed.advance(8200); expect(claimed.hard).toEqual(["/en/services"]);
});

test("R6 pagehide after URL selection retains outgoing pixels and later Back restores 1700", async () => {
  const h = harness(); h.win.scrollY = 1700;
  h.click("/en/services"); await h.advance(320);
  const visionState = h.outgoingState(), outgoing = visionState[ROUTE_HISTORY_STATE_KEY] as { id: string };
  expect(visionState[ROUTE_HISTORY_STATE_KEY]).toMatchObject({ scrollY: 1700 });
  Object.assign(h.win.history.state, { __PRIVATE_NEXTJS_INTERNALS_TREE: { retained: true }, unrelated: { destination: true } });
  const selectedState = structuredClone(h.win.history.state), writeCount = h.writes.length;
  h.win.scrollY = 125; h.win.dispatchEvent(new Event("scroll")); h.win.dispatchEvent(new Event("pagehide"));
  expect(JSON.parse(h.storage.get(ROUTE_HISTORY_KEY)!)[outgoing.id].scrollY).toBe(1700);
  expect(h.win.history.state).toEqual(selectedState); expect(h.writes.length).toBe(writeCount);
  h.win.dispatchEvent(Object.assign(new Event("pageshow"), { persisted: true }));
  const services = h.owner("/en/services"); h.ready(services); h.install(services); await h.advance(20);
  h.traverse("/en/vision", visionState);
  const vision = h.owner("/en/vision"); h.ready(vision); h.install(vision); await h.advance(400);
  expect(h.win.scrollY).toBe(1700); expect(h.win.history.state.__NA).toBe(true); expect(h.win.history.state.retained).toBe("next");
});

test("R6 pagehide also rejects a changed same-URL entry or a replaced physical owner", async () => {
  for (const mismatch of ["entry", "owner"]) {
    const h = harness(); h.win.scrollY = 1700; h.win.dispatchEvent(new Event("scroll"));
    const old = (h.win.history.state as Record<string, unknown>)[ROUTE_HISTORY_STATE_KEY] as { id: string };
    if (mismatch === "entry") Object.assign(h.win.history.state, { [ROUTE_HISTORY_STATE_KEY]: { version: 1, id: "new-same-url" }, unrelated: { retained: true } });
    else {
      const replacement = h.owner("/en/vision");
      Object.assign(h.doc, { querySelectorAll: () => [replacement.main, h.first.main] });
    }
    const selectedState = structuredClone(h.win.history.state), writeCount = h.writes.length;
    h.win.scrollY = 125; h.win.dispatchEvent(new Event("scroll")); h.win.dispatchEvent(new Event("pagehide"));
    expect(JSON.parse(h.storage.get(ROUTE_HISTORY_KEY)!)[old.id]?.scrollY).toBe(1700);
    expect(h.win.history.state).toEqual(selectedState); expect(h.writes.length).toBe(writeCount); h.stop();
  }
});

test("R6 unclaimed hash cancels while modified, external, download and new-window activations remain native", async () => {
  const hash = harness(); hash.click("/en/services"); await hash.advance(100);
  expect(hash.click("/en/vision#reading").defaultPrevented).toBe(false);
  await hash.advance(8200); expect(hash.calls).not.toContain("push"); expect(hash.hard).toEqual([]); hash.stop();
  for (const [target, modifiers, attributes] of [
    ["/en/projects", { ctrlKey: true }, {}], ["/en/projects", { button: 1 }, {}],
    ["https://elsewhere.test/en/projects", {}, {}], ["/en/projects", {}, { target: "_blank" }], ["/en/projects", {}, { download: "" }],
  ] as const) {
    const h = harness(); h.click("/en/services"); await h.advance(100);
    expect(h.click(target, modifiers, attributes).defaultPrevented).toBe(false);
    await h.advance(220); expect(h.calls.filter(call => call === "push")).toHaveLength(1); h.stop();
  }
});

test("R6 native entry key also cancels a pending same-URL replacement before route IDs exist", async () => {
  const h = harness({ deferPushSelection: true }), navigation = { currentEntry: { key: "origin" } };
  Object.assign(h.win, { navigation }); h.click("/en/services"); await h.advance(320);
  h.win.location = Object.assign(new URL("/en/services", h.win.location.href), { assign: (target: string) => { h.hard.push(target); } });
  h.win.history.state = { __NA: true, retained: "next" }; navigation.currentEntry.key = "first-destination";
  h.controller.update(); await h.advance(20);
  navigation.currentEntry.key = "replacement-destination";
  await h.advance(8200); expect(h.hard).toEqual([]); expect(h.surface.dataset.phase).toBe("idle");
});

test("R7 Back to a pending push's connected origin restores its saved pixels with storage available or denied", async () => {
  for (const denied of [false, true]) for (const clamped of [false, true]) {
    const h = harness({ denied }); h.win.scrollY = 1700; h.win.dispatchEvent(new Event("scroll"));
    h.click("/en/services"); await h.advance(320);
    const origin = h.outgoingState(), original = origin[ROUTE_HISTORY_STATE_KEY] as { id: string };
    expect(origin[ROUTE_HISTORY_STATE_KEY]).toMatchObject({ scrollY: 1700 });
    expect(h.first.main.isConnected).toBe(true); expect(h.surface.dataset.phase).toBe("waiting");
    if (clamped) { h.win.scrollY = 125; h.win.dispatchEvent(new Event("scroll")); }
    const focus = h.doc.activeElement, writes = h.writes.length;
    h.traverse("/en/vision", origin); await h.advance(600);
    expect(h.win.scrollY).toBe(1700); expect(h.doc.activeElement).toBe(focus);
    expect(h.directStarts).toEqual([false]); expect(h.writes.length).toBe(writes);
    h.win.dispatchEvent(new Event("pagehide"));
    if (!denied) expect(JSON.parse(h.storage.get(ROUTE_HISTORY_KEY)!)[original.id].scrollY).toBe(1700);
    expect((h.win.history.state as Record<string, unknown>)[ROUTE_HISTORY_STATE_KEY]).toMatchObject({ scrollY: 1700 });
    expect(h.win.history.state.__NA).toBe(true); expect(h.win.history.state.retained).toBe("next");
    h.win.dispatchEvent(Object.assign(new Event("pageshow"), { persisted: true })); await h.advance(600);
    expect(h.win.scrollY).toBe(1700); expect(h.surface.dataset.phase).toBe("idle"); expect(h.hard).toEqual([]);
    expect(h.frames.size).toBe(0); expect(h.timers.size).toBe(0); h.stop();
  }
});

test("R7 pending traversal restores a different known entry on the same owner without borrowing origin pixels", async () => {
  const h = harness(); h.win.scrollY = 1700; h.win.dispatchEvent(new Event("scroll"));
  h.click("/en/services"); await h.advance(320);
  const origin = h.outgoingState(), original = origin[ROUTE_HISTORY_STATE_KEY] as { id: string };
  h.win.scrollY = 125; h.win.dispatchEvent(new Event("scroll"));
  const destination = Object.assign({ __NA: true, retained: "next" }, {
    [ROUTE_HISTORY_STATE_KEY]: { version: 1, id: "other-vision-history", path: "/en/vision", scrollY: 410, created: Date.now() },
    unrelated: { history: true },
  });
  h.traverse("/en/vision", destination); await h.advance(600);
  expect(h.win.scrollY).toBe(410); expect(h.directStarts).toEqual([false]);
  expect(h.win.history.state).toEqual(destination);
  expect(JSON.parse(h.storage.get(ROUTE_HISTORY_KEY)!)[original.id].scrollY).toBe(1700);
  expect(h.calls).not.toContain("scroll:1700"); expect(h.hard).toEqual([]);
});

test("R7 same-path hash, query, unknown entry and a still-selected origin remain native", async () => {
  for (const mode of ["hash", "query", "unknown"]) {
    const h = harness(); h.win.scrollY = 1700; h.win.dispatchEvent(new Event("scroll"));
    h.click("/en/services"); await h.advance(320); h.win.scrollY = 125;
    const origin = h.outgoingState();
    const target = mode === "hash" ? "/en/vision#reading" : mode === "query" ? "/en/vision?native=1" : "/en/vision";
    const state = mode === "hash" ? origin : Object.assign({ __NA: true, retained: "next" }, { [ROUTE_HISTORY_STATE_KEY]: { version: 1, id: `native-${mode}` } });
    h.traverse(target, state); await h.advance(600);
    expect(h.win.scrollY).toBe(125); expect(h.calls).not.toContain("scroll:1700");
    expect(h.surface.dataset.phase).toBe("idle"); expect(h.hard).toEqual([]); h.stop();
  }
  const unchanged = harness({ deferPushSelection: true }); unchanged.win.scrollY = 1700;
  unchanged.click("/en/services"); await unchanged.advance(320); unchanged.win.scrollY = 125;
  unchanged.traverse("/en/vision", structuredClone(unchanged.win.history.state)); await unchanged.advance(60);
  expect(unchanged.win.scrollY).toBe(125); expect(unchanged.calls).not.toContain("scroll:1700");
  expect(unchanged.surface.dataset.phase).toBe("waiting"); unchanged.stop();
});

test("R7 rapid pending Back/Forward cancels stale completion and keeps each eventual owner checkpoint", async () => {
  const h = harness(); h.win.scrollY = 1700; h.win.dispatchEvent(new Event("scroll"));
  h.click("/en/services"); await h.advance(320);
  const origin = h.outgoingState(), pendingServices = structuredClone(h.win.history.state);
  h.win.scrollY = 125; h.traverse("/en/vision", origin); await h.advance(40);
  expect(h.win.scrollY).toBe(1700);
  h.win.scrollY = 60; h.traverse("/en/services", pendingServices); await h.advance(40);
  const services = h.owner("/en/services"), starts: boolean[] = [];
  h.ready(services, skip => { starts.push(skip); }); h.install(services); await h.advance(600);
  expect(h.win.scrollY).toBe(60); expect(starts).toEqual([true]);
  h.win.scrollY = 940; h.win.dispatchEvent(new Event("scroll"));
  const serviceEntry = structuredClone(h.win.history.state);
  h.traverse("/en/vision", origin); h.install(h.first); await h.advance(600);
  expect(h.win.scrollY).toBe(1700);
  h.traverse("/en/services", serviceEntry); h.install(services); await h.advance(600);
  expect(h.win.scrollY).toBe(940); expect(starts).toEqual([true]); expect(h.directStarts).toEqual([false]);
  expect(h.hard).toEqual([]); expect(h.frames.size).toBe(0); expect(h.timers.size).toBe(0);
});

test("R8 repeated Back/Forward restores a retained origin before any Services owner exists", async () => {
  for (const denied of [false, true]) for (const clamp of [false, true]) {
    const h = harness({ denied }); h.win.scrollY = 1700; h.win.dispatchEvent(new Event("scroll"));
    h.click("/en/services"); await h.advance(320);
    const origin = h.outgoingState(), originId = (origin[ROUTE_HISTORY_STATE_KEY] as { id: string }).id;
    const pendingServices = structuredClone(h.win.history.state);
    h.win.scrollY = 125; h.traverse("/en/vision", origin); await h.advance(40);
    expect(h.win.scrollY).toBe(1700);
    h.traverse("/en/services", pendingServices); await h.advance(40);
    expect(h.surface.dataset.phase).toBe("waiting"); expect(h.first.main.isConnected).toBe(true);
    if (clamp) { h.win.scrollY = 60; h.win.dispatchEvent(new Event("scroll")); }
    h.traverse("/en/vision", origin); await h.advance(600);
    expect(h.win.scrollY).toBe(1700); expect(h.directStarts).toEqual([false]);
    h.win.dispatchEvent(new Event("pagehide"));
    expect((h.win.history.state as Record<string, unknown>)[ROUTE_HISTORY_STATE_KEY]).toMatchObject({ scrollY: 1700 });
    if (!denied) expect(JSON.parse(h.storage.get(ROUTE_HISTORY_KEY)!)[originId].scrollY).toBe(1700);
    expect(h.hard).toEqual([]); expect(h.frames.size).toBe(0); expect(h.timers.size).toBe(0); h.stop();
  }
});

test("R8 BFCache resumes unapplied exact history when geometry becomes usable, retaining the completed control", async () => {
  for (const denied of [false, true]) for (const hideBeforeApply of [false, true]) {
    const h = harness({ denied });
    const extent = (pixels: number) => { Object.assign(h.doc.documentElement, { scrollHeight: pixels + h.win.innerHeight }); Object.assign(h.doc.body, { scrollHeight: pixels + h.win.innerHeight }); };
    h.win.scrollY = 1700; h.win.dispatchEvent(new Event("scroll")); h.click("/en/services"); await h.advance(320);
    const origin = h.outgoingState(), originId = (origin[ROUTE_HISTORY_STATE_KEY] as { id: string }).id;
    h.win.scrollY = 125; extent(125); h.traverse("/en/vision", origin); await h.advance(40);
    expect(h.surface.dataset.phase).toBe("waiting"); expect(h.win.scrollY).toBe(125);
    if (!hideBeforeApply) { extent(28000); h.controller.update(); await h.advance(600); expect(h.win.scrollY).toBe(1700); }
    h.win.dispatchEvent(new Event("pagehide"));
    expect((h.win.history.state as Record<string, unknown>)[ROUTE_HISTORY_STATE_KEY]).toMatchObject({ scrollY: 1700 });
    if (!denied) expect(JSON.parse(h.storage.get(ROUTE_HISTORY_KEY)!)[originId].scrollY).toBe(1700);
    h.win.dispatchEvent(Object.assign(new Event("pageshow"), { persisted: true })); await h.advance(40);
    extent(28000); h.controller.update(); await h.advance(600);
    expect(h.win.scrollY).toBe(1700); expect(h.directStarts).toEqual([false]); expect(h.doc.activeElement === h.body as unknown as Element).toBe(true);
    h.win.dispatchEvent(new Event("pagehide"));
    expect((h.win.history.state as Record<string, unknown>)[ROUTE_HISTORY_STATE_KEY]).toMatchObject({ scrollY: 1700 });
    if (!denied) expect(JSON.parse(h.storage.get(ROUTE_HISTORY_KEY)!)[originId].scrollY).toBe(1700);
    expect(h.hard).toEqual([]); expect(h.frames.size).toBe(0); expect(h.timers.size).toBe(0); h.stop();
  }
});

test("R8 physical replacement during history reveal transfers skip and resumes its finite phase", async () => {
  for (const duringReveal of [false, true]) for (const earlyPublisher of [false, true]) {
    const h = harness(); h.win.scrollY = 1700; h.win.dispatchEvent(new Event("scroll")); h.click("/en/services"); await h.advance(320);
    const origin = h.outgoingState(), originId = (origin[ROUTE_HISTORY_STATE_KEY] as { id: string }).id;
    const services = h.owner("/en/services"); h.install(services); await h.advance(20); h.ready(services); await h.advance(400);
    h.win.scrollY = 940; h.win.dispatchEvent(new Event("scroll")); const focused = h.doc.activeElement;
    h.traverse("/en/vision", origin);
    const vision = h.owner("/en/vision"); h.install(vision); await h.advance(20);
    if (duringReveal) { h.ready(vision); await h.advance(180); expect(h.surface.dataset.phase).toBe("revealing"); expect(h.win.scrollY).toBe(1700); }
    const opacity = Number(h.field.style.opacity), replacement = h.owner("/en/vision"), starts: boolean[] = [];
    h.win.scrollY = 125;
    if (earlyPublisher) { h.ready(replacement, skip => { starts.push(skip); }); expect(starts).toEqual([]); }
    h.install(replacement); await h.advance(20);
    expect(Number(h.field.style.opacity)).toBeLessThanOrEqual(opacity + 1e-12);
    if (!earlyPublisher) h.ready(replacement, skip => { starts.push(skip); });
    if (duringReveal) { await h.advance(240); expect(h.surface.dataset.phase).toBe("idle"); }
    await h.advance(600);
    expect(h.win.scrollY).toBe(1700); expect(starts).toEqual([true]); expect(h.doc.activeElement).toBe(focused);
    h.win.dispatchEvent(new Event("pagehide")); expect(JSON.parse(h.storage.get(ROUTE_HISTORY_KEY)!)[originId].scrollY).toBe(1700);
    expect(h.hard).toEqual([]); expect(h.frames.size).toBe(0); expect(h.timers.size).toBe(0); h.stop();
  }
});

test("R8 suspended history is discarded when a different entry, hash or route supersedes it", async () => {
  for (const change of ["entry", "hash", "route"]) {
    const h = harness(); h.win.scrollY = 1700; h.win.dispatchEvent(new Event("scroll")); h.click("/en/services"); await h.advance(320);
    const origin = h.outgoingState(); h.win.scrollY = 125;
    Object.assign(h.doc.documentElement, { scrollHeight: 125 + h.win.innerHeight }); Object.assign(h.doc.body, { scrollHeight: 125 + h.win.innerHeight });
    h.traverse("/en/vision", origin); await h.advance(40); h.win.dispatchEvent(new Event("pagehide"));
    const target = change === "route" ? "/en/archive" : change === "hash" ? "/en/vision#reading" : "/en/vision";
    Object.assign(h.win, { location: Object.assign(new URL(target, h.win.location.href), { assign: (next: string) => { h.hard.push(next); } }) });
    if (change === "entry") h.win.history.state = Object.assign({ __NA: true, retained: "next" }, { [ROUTE_HISTORY_STATE_KEY]: { version: 1, id: "superseding-bfcache-entry" } });
    h.win.dispatchEvent(Object.assign(new Event("pageshow"), { persisted: true })); await h.advance(40);
    Object.assign(h.doc.documentElement, { scrollHeight: 30000 }); Object.assign(h.doc.body, { scrollHeight: 30000 }); h.controller.update(); await h.advance(8200);
    expect(h.win.scrollY).toBe(125); expect(h.calls).not.toContain("scroll:1700"); expect(h.hard).toEqual([]);
    expect(h.frames.size).toBe(0); expect(h.timers.size).toBe(0); h.stop();
  }
});

test("R9 saved direct reload and Back/Forward retain target, role and remaining minimum across BFCache", async () => {
  for (const type of ["reload", "back_forward"]) for (const denied of [false, true]) for (const completeBeforeHide of [false, true]) for (const target of [0, 1700]) {
    const id = `saved-direct-${type}-${denied}-${completeBeforeHide}-${target}`;
    const checkpoint = { version: 1, id, path: "/en/vision", scrollY: target, created: Date.now() };
    const h = harness({ type, denied, initialHold: true, initialState: { [ROUTE_HISTORY_STATE_KEY]: checkpoint } });
    const extent = (pixels: number) => { Object.assign(h.doc.documentElement, { scrollHeight: pixels + h.win.innerHeight }); Object.assign(h.doc.body, { scrollHeight: pixels + h.win.innerHeight }); };
    h.win.scrollY = 125; extent(125); await h.advance(40);
    expect(h.surface.dataset.phase).toBe("waiting"); expect(h.directStarts).toEqual([]);
    if (completeBeforeHide) { extent(28000); h.controller.update(); await h.advance(600); expect(h.win.scrollY).toBe(target); }
    h.win.dispatchEvent(new Event("pagehide"));
    expect((h.win.history.state as Record<string, unknown>)[ROUTE_HISTORY_STATE_KEY]).toMatchObject({ scrollY: target });
    if (!denied) expect(JSON.parse(h.storage.get(ROUTE_HISTORY_KEY)!)[id].scrollY).toBe(target);
    await h.advance(20000); expect(h.frames.size).toBe(0); expect(h.timers.size).toBe(0);
    h.win.dispatchEvent(Object.assign(new Event("pageshow"), { persisted: true })); await h.advance(40);
    extent(28000); h.controller.update();
    if (!completeBeforeHide) { await h.advance(60); expect(h.surface.dataset.phase).toBe("waiting"); expect(h.win.scrollY).toBe(125); await h.advance(40); }
    await h.advance(600);
    expect(h.win.scrollY).toBe(target); expect(h.directStarts).toEqual([true]);
    const focused = type === "reload" ? target < 80 ? h.first.heading : h.first.main : h.body;
    expect(h.doc.activeElement === focused as unknown as Element).toBe(true);
    if (type === "reload") expect(focused.dataset.routeFocus).toBe("true");
    h.win.dispatchEvent(new Event("pagehide"));
    expect((h.win.history.state as Record<string, unknown>)[ROUTE_HISTORY_STATE_KEY]).toMatchObject({ scrollY: target });
    if (!denied) expect(JSON.parse(h.storage.get(ROUTE_HISTORY_KEY)!)[id].scrollY).toBe(target);
    expect(h.win.history.state.__NA).toBe(true); expect(h.win.history.state.retained).toBe("next");
    expect(h.hard).toEqual([]); expect(h.frames.size).toBe(0); expect(h.timers.size).toBe(0); h.stop();
  }
});

test("R9 saved direct owner replacement before application protects the selected target", async () => {
  for (const type of ["reload", "back_forward"]) {
    const checkpoint = { version: 1, id: `direct-replacement-${type}`, path: "/en/vision", scrollY: 1700, created: Date.now() };
    const h = harness({ type, initialHold: true, initialState: { [ROUTE_HISTORY_STATE_KEY]: checkpoint } });
    h.win.scrollY = 125; Object.assign(h.doc.documentElement, { scrollHeight: 125 + h.win.innerHeight }); Object.assign(h.doc.body, { scrollHeight: 125 + h.win.innerHeight }); await h.advance(40);
    const replacement = h.owner("/en/vision"), starts: boolean[] = [];
    h.ready(replacement, skip => { starts.push(skip); }); h.install(replacement); await h.advance(40);
    h.win.scrollY = 60; h.win.dispatchEvent(new Event("scroll")); h.win.dispatchEvent(new Event("pagehide"));
    expect((h.win.history.state as Record<string, unknown>)[ROUTE_HISTORY_STATE_KEY]).toMatchObject({ scrollY: 1700 });
    expect(JSON.parse(h.storage.get(ROUTE_HISTORY_KEY)!)[checkpoint.id].scrollY).toBe(1700);
    h.win.dispatchEvent(Object.assign(new Event("pageshow"), { persisted: true }));
    Object.assign(h.doc.documentElement, { scrollHeight: 30000 }); Object.assign(h.doc.body, { scrollHeight: 30000 }); h.controller.update(); await h.advance(700);
    expect(h.win.scrollY).toBe(1700); expect(starts).toEqual([true]);
    expect(h.doc.activeElement === (type === "reload" ? replacement.main : h.body) as unknown as Element).toBe(true);
    expect(h.hard).toEqual([]); expect(h.frames.size).toBe(0); expect(h.timers.size).toBe(0); h.stop();
  }
});

test("R9 partially revealed direct restore keeps remaining phase, skip and focus across owner-gap suspension", async () => {
  for (const type of ["reload", "back_forward"]) {
    const checkpoint = { version: 1, id: `direct-reveal-${type}`, path: "/en/vision", scrollY: 1700, created: Date.now() };
    const h = harness({ type, initialHold: true, initialState: { [ROUTE_HISTORY_STATE_KEY]: checkpoint } });
    h.win.scrollY = 125; await h.advance(340);
    expect(h.win.scrollY).toBe(1700); expect(h.surface.dataset.phase).toBe("revealing");
    const opacity = Number(h.field.style.opacity);
    h.first.main.isConnected = h.first.inner.isConnected = false; h.controller.update(); await h.advance(20);
    h.win.scrollY = 125; h.win.dispatchEvent(new Event("pagehide")); await h.advance(20000);
    h.win.dispatchEvent(Object.assign(new Event("pageshow"), { persisted: true })); await h.advance(20);
    expect(Number(h.field.style.opacity)).toBeLessThanOrEqual(opacity + 1e-12);
    const replacement = h.owner("/en/vision"), starts: boolean[] = [];
    h.ready(replacement, skip => { starts.push(skip); }); h.install(replacement); await h.advance(260);
    expect(h.win.scrollY).toBe(1700); expect(starts).toEqual([true]); expect(h.surface.dataset.phase).toBe("idle");
    expect(h.doc.activeElement === (type === "reload" ? replacement.main : h.body) as unknown as Element).toBe(true);
    expect(h.hard).toEqual([]); expect(h.frames.size).toBe(0); expect(h.timers.size).toBe(0); h.stop();
  }
});

test("R9 direct saved intent cancels on exact-entry supersession and fresh/no-saved captures stay native", async () => {
  for (const change of ["entry", "native-key", "hash"]) {
    const checkpoint = { version: 1, id: `direct-cancel-${change}`, path: "/en/vision", scrollY: 1700, created: Date.now() };
    const h = harness({ type: "reload", initialHold: true, initialState: { [ROUTE_HISTORY_STATE_KEY]: checkpoint } });
    const navigation = { currentEntry: { key: "saved-direct-entry" } }; Object.assign(h.win, { navigation });
    h.win.scrollY = 125; Object.assign(h.doc.documentElement, { scrollHeight: 125 + h.win.innerHeight }); Object.assign(h.doc.body, { scrollHeight: 125 + h.win.innerHeight }); await h.advance(40);
    h.win.dispatchEvent(new Event("pagehide"));
    if (change === "entry") h.win.history.state = Object.assign({ __NA: true, retained: "next" }, { [ROUTE_HISTORY_STATE_KEY]: { version: 1, id: "superseding-direct-entry" } });
    else if (change === "native-key") navigation.currentEntry.key = "superseding-direct-key";
    else Object.assign(h.win, { location: Object.assign(new URL("/en/vision#native", h.win.location.href), { assign: (target: string) => { h.hard.push(target); } }) });
    h.win.dispatchEvent(Object.assign(new Event("pageshow"), { persisted: true }));
    Object.assign(h.doc.documentElement, { scrollHeight: 30000 }); Object.assign(h.doc.body, { scrollHeight: 30000 }); h.controller.update(); await h.advance(8200);
    expect(h.win.scrollY).toBe(125); expect(h.calls).not.toContain("scroll:1700"); expect(h.doc.activeElement === h.body as unknown as Element).toBe(true);
    expect(h.hard).toEqual([]); expect(h.frames.size).toBe(0); expect(h.timers.size).toBe(0); h.stop();
  }
  for (const type of ["navigate", "reload", "back_forward"]) {
    const h = harness({ type, initialHold: true }); h.win.scrollY = 125; await h.advance(40); h.win.dispatchEvent(new Event("pagehide"));
    expect((h.win.history.state as Record<string, unknown>)[ROUTE_HISTORY_STATE_KEY]).toMatchObject({ scrollY: 125 });
    h.win.dispatchEvent(Object.assign(new Event("pageshow"), { persisted: true })); await h.advance(8200);
    expect(h.win.scrollY).toBe(125); expect(h.calls.filter(call => call.startsWith("scroll:"))).toEqual([]);
    expect(h.hard).toEqual([]); expect(h.frames.size).toBe(0); expect(h.timers.size).toBe(0); h.stop();
  }
});

test("R9 saved direct pixels are protected before the first asynchronous owner adoption", async () => {
  for (const target of [0, 1700]) {
    const checkpoint = { version: 1, id: `direct-before-adoption-${target}`, path: "/en/vision", scrollY: target, created: Date.now() };
    const h = harness({ type: "reload", initialHold: true, initialState: { [ROUTE_HISTORY_STATE_KEY]: checkpoint } });
    h.win.scrollY = 125; h.win.dispatchEvent(new Event("pagehide"));
    expect((h.win.history.state as Record<string, unknown>)[ROUTE_HISTORY_STATE_KEY]).toMatchObject({ scrollY: target });
    expect(JSON.parse(h.storage.get(ROUTE_HISTORY_KEY)!)[checkpoint.id].scrollY).toBe(target);
    h.win.dispatchEvent(Object.assign(new Event("pageshow"), { persisted: true })); await h.advance(600);
    expect(h.win.scrollY).toBe(target); expect(h.directStarts).toEqual([true]); expect(h.hard).toEqual([]);
    expect(h.frames.size).toBe(0); expect(h.timers.size).toBe(0); h.stop();
  }
});
