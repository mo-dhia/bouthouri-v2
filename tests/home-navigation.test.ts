import { afterEach, describe, expect, test } from "bun:test";
import {
  HOME_SEMANTIC_SCENES, HOME_WORK_MOMENTS, captureHomePosition, homePinProgress,
  homeScoreFromPosition, homeScrollTarget, homeWorkPosition, isHomePosition,
  type HomeGeometry, type HomePosition,
} from "../src/lib/navigation/home-position";
import {
  HOME_HISTORY_STATE_KEY, HOME_HISTORY_LIMIT, HOME_LOCALE_MAX_AGE, HOME_LOCALE_RETURN_KEY,
  HOME_POSITIONS_KEY, HOME_WORK_MAX_AGE, HOME_WORK_RETURN_KEY,
  HOME_RETURN_KEY, HOME_RETURN_MAX_AGE, HOME_HANDOFF_KEY, HOME_HANDOFF_MAX_AGE,
  homeCheckpointFromState, homeLinkIntent, parseHomeLocaleReturn, parseHomeWorkReturn, parseHomeReturn, parseHomeHandoff,
  homeDocumentStartsFresh,
  resolveHomeRestoreIntent, serializeHomeCheckpoints,
  type HomeCheckpoint, type HomeRestoreContext,
} from "../src/lib/navigation/home-navigation-state";
import {
  HOME_NAVIGATION_READY_EVENT, HOME_NAVIGATION_RESTORE_EVENT,
  getHomeRestoreIntent, prepareHomeFreshEntry, mountHomeNavigation, type HomeNavigationOptions, type HomeRestoreDetail,
} from "../src/lib/navigation/home-navigation";
import { frameFromProgress, journeyDistance, progressFromStoryTime } from "../src/sections/landing/3-journey/journey-clock";

const desktop: HomeGeometry = { start: 850, distance: 24086, heroInput: 100 / 6.8 };
const mobile: HomeGeometry = { start: 932, distance: 22526, heroInput: 100 / 5.8 };
const now = 1_800_000_000_000;
const position: HomePosition = { section: "work", progress: 0.43 };
const localeRecord = (overrides = {}) => JSON.stringify({ version: 1, from: "/en", to: "/ar", created: now, position, ...overrides });
const workRecord = (overrides = {}) => JSON.stringify({ version: 1, home: "/en", slug: "wujhat", created: now, position, pending: true, ...overrides });
const homeRecord = (overrides = {}) => JSON.stringify({ version: 1, home: "/en", created: now, position, ...overrides });
const handoffRecord = (overrides = {}) => JSON.stringify({ version: 1, to: "/ar", created: now, ...overrides });
const checkpoint = (overrides: Partial<HomeCheckpoint> = {}): HomeCheckpoint => ({ version: 1, id: "entry-1", path: "/en", created: now, position, scrollY: 14000, ...overrides });
const context = (overrides: Partial<HomeRestoreContext> = {}): HomeRestoreContext => ({
  href: "https://local.test/en", navigationType: "navigate", historyState: null,
  localeReturn: null, workReturn: null, positions: null, nativeScrollY: 0, now, ...overrides,
});
const click = { button: 0, defaultPrevented: false, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false };

describe("HOME semantic score mapping", () => {
  test("matches the measured Wujhat position instead of treating display progress as pin progress", () => {
    const y = homeScrollTarget(homeWorkPosition("wujhat"), desktop)!;
    expect(y).toBeCloseTo(13672.13, 2);
    expect(homeScoreFromPosition(captureHomePosition(y, desktop)!)).toBeCloseTo(308, 8);
    expect(homePinProgress(homeWorkPosition("wujhat"))).toBeCloseTo(0.532347859, 7);
    expect(frameFromProgress(homePinProgress(homeWorkPosition("wujhat"))!).progress).toBeCloseTo(334 / 740, 9);
  });

  test("every band preserves its fraction through desktop to mobile and back", () => {
    for (const [section] of HOME_SEMANTIC_SCENES) {
      for (const progress of [0.001, 0.13, 0.5, 0.97, 0.999]) {
        const original: HomePosition = { section, progress };
        const first = captureHomePosition(homeScrollTarget(original, desktop)!, desktop)!;
        const second = captureHomePosition(homeScrollTarget(first, mobile)!, mobile)!;
        expect(second.section).toBe(section);
        expect(second.progress).toBeCloseTo(progress, 8);
      }
    }
    const hero: HomePosition = { section: "hero", progress: 0.6 };
    expect(homeScrollTarget(hero, mobile)).toBeCloseTo(559.2, 8);
    expect(captureHomePosition(homeScrollTarget(hero, mobile)!, mobile)).toEqual(hero);
  });

  test("inverts the opening's nonlinear mobile/desktop pivots using the shared clock", () => {
    for (const geometry of [desktop, mobile]) {
      for (const openingTime of [0, 1, 6, 14, 16.11, 20, 25.999]) {
        const original: HomePosition = { section: "opening", progress: openingTime / 26 };
        const y = homeScrollTarget(original, geometry)!;
        const frame = frameFromProgress((y - geometry.start) / geometry.distance, geometry.heroInput);
        expect(frame.openingTime).toBeCloseTo(openingTime, 8);
        expect(frame.time).toBe(0);
      }
    }
  });

  test("uses source half-open boundaries and keeps the final footer reachable", () => {
    for (const [section, start] of HOME_SEMANTIC_SCENES) {
      if (start < 0) continue;
      const exact = captureHomePosition(desktop.start, desktop, { time: start, openingTime: 26, progress: (26 + start) / 740 });
      expect(exact).toEqual({ section, progress: 0 });
    }
    expect(captureHomePosition(desktop.start + desktop.distance + 100, desktop)).toEqual({ section: "footer", progress: 1 });
    expect(homeScrollTarget({ section: "footer", progress: 1 }, mobile)).toBeCloseTo(23458, 8);
  });

  test("captures the displayed shared score when scroll input is still interpolating", () => {
    const frame = frameFromProgress(progressFromStoryTime(130));
    const result = captureHomePosition(homeScrollTarget(homeWorkPosition("wujhat"), desktop)!, desktop, frame)!;
    expect(result.section).toBe("curve");
    expect(homeScoreFromPosition(result)).toBeCloseTo(130, 8);
  });

  test("all four source query moments and responsive extents use the same clock", () => {
    for (const slug of Object.keys(HOME_WORK_MOMENTS) as (keyof typeof HOME_WORK_MOMENTS)[]) {
      expect(homeScoreFromPosition(homeWorkPosition(slug))).toBeCloseTo(HOME_WORK_MOMENTS[slug], 8);
    }
    expect(journeyDistance(850)).toBe(24086);
    expect(journeyDistance(932, true)).toBe(22526);
    expect(captureHomePosition(100, { start: 0, distance: 0 })).toBeNull();
    expect(homeScrollTarget({ section: "work", progress: NaN }, desktop)).toBeNull();
    expect(isHomePosition({ section: "projects", progress: 0.5 })).toBe(false);
  });
});

describe("HOME handoff expiry and entry selection", () => {
  test("generic HOME return is path-scoped, accepts every semantic scene, and expires after thirty minutes", () => {
    expect(parseHomeReturn(homeRecord({ created: now - HOME_RETURN_MAX_AGE }), "/en", now)?.position).toEqual(position);
    for (const section of ["hero", "footer", "work"] as const) {
      expect(parseHomeReturn(homeRecord({ position: { section, progress: 0.5 } }), "/en", now)?.position.section).toBe(section);
    }
    for (const raw of [homeRecord({ created: now - HOME_RETURN_MAX_AGE - 1 }), homeRecord({ created: now + 1 }),
      homeRecord({ home: "/ar" }), homeRecord({ version: 2 }), homeRecord({ position: { section: "bad", progress: 0 } }),
      homeRecord({ position: { section: "work", progress: -0.1 } }), "{"])
      expect(parseHomeReturn(raw, "/en", now)).toBeNull();
  });

  test("source precedence distinguishes explicit router pixels, generic HOME return, work, locale and history fallback", () => {
    const all = context({ navigationType: "back_forward", homeReturn: homeRecord(), workReturn: workRecord(),
      localeReturn: localeRecord({ from: "/ar", to: "/en", position: { section: "curve", progress: 0.3 } }),
      historyState: { [HOME_HISTORY_STATE_KEY]: checkpoint({ scrollY: 16362 }) } });
    expect(resolveHomeRestoreIntent({ ...all, historyTarget: 0 })).toMatchObject({ kind: "history", scrollY: 0 });
    expect(resolveHomeRestoreIntent(all)).toMatchObject({ kind: "home-return", position });
    expect(resolveHomeRestoreIntent({ ...all, homeReturn: null })?.kind).toBe("work-return");
    expect(resolveHomeRestoreIntent({ ...all, homeReturn: null, workReturn: null })?.kind).toBe("locale");
    expect(resolveHomeRestoreIntent({ ...all, homeReturn: null, workReturn: null, localeReturn: null })?.kind).toBe("history");
    expect(resolveHomeRestoreIntent({ ...all, href: "https://local.test/en?work=wujhat" })?.kind).toBe("home-return");
  });

  test("first-document fresh guard accepts only an exact destination handoff younger than thirty seconds", () => {
    expect(homeDocumentStartsFresh("https://local.test/en", "navigate", null, now)).toBe(true);
    expect(homeDocumentStartsFresh("https://local.test/en", "reload", null, now)).toBe(true);
    expect(homeDocumentStartsFresh("https://local.test/en", "back_forward", null, now)).toBe(false);
    expect(homeDocumentStartsFresh("https://local.test/ar", "navigate", handoffRecord({ created: now - HOME_HANDOFF_MAX_AGE + 1 }), now)).toBe(false);
    expect(homeDocumentStartsFresh("https://local.test/ar", "navigate", handoffRecord({ created: now - HOME_HANDOFF_MAX_AGE }), now)).toBe(true);
    expect(homeDocumentStartsFresh("https://local.test/en", "navigate", handoffRecord(), now)).toBe(true);
    expect(homeDocumentStartsFresh("https://local.test/ar", "navigate", handoffRecord({ created: now + 1 }), now)).toBe(true);
    expect(parseHomeHandoff(handoffRecord(), "/ar/projects", now)).toBeNull();
  });

  test("locale handoff accepts the source two-minute boundary and rejects expired/future/wrong-path records", () => {
    expect(parseHomeLocaleReturn(localeRecord({ created: now - HOME_LOCALE_MAX_AGE }), "/ar", now)?.position).toEqual(position);
    for (const record of [
      localeRecord({ created: now - HOME_LOCALE_MAX_AGE - 1 }), localeRecord({ created: now + 1 }),
      localeRecord({ from: "/ar" }), localeRecord({ to: "/en" }), localeRecord({ version: 2 }),
      localeRecord({ position: { section: "work", progress: 1.01 } }),
      localeRecord({ position: { section: "unknown", progress: 0 } }), "{", "null",
    ]) expect(parseHomeLocaleReturn(record, "/ar", now)).toBeNull();
  });

  test("work return requires a known project, a work fraction, pending=true and the source 30-minute lifetime", () => {
    expect(parseHomeWorkReturn(workRecord({ created: now - HOME_WORK_MAX_AGE }), "/en", now)?.position).toEqual(position);
    for (const record of [
      workRecord({ created: now - HOME_WORK_MAX_AGE - 1 }), workRecord({ created: now + 1 }),
      workRecord({ slug: "unknown" }), workRecord({ pending: false }), workRecord({ home: "/ar" }),
      workRecord({ position: { section: "hero", progress: 0.4 } }), workRecord({ version: 2 }), "[]",
    ]) expect(parseHomeWorkReturn(record, "/en", now)).toBeNull();
  });

  test("ordinary HOME reload is fresh even with a checkpoint and native pixels; Back/Forward restores its entry", () => {
    const saved = checkpoint();
    const historyState = { __NA: true, [HOME_HISTORY_STATE_KEY]: saved };
    expect(resolveHomeRestoreIntent(context({ historyState }))).toBeNull();
    expect(resolveHomeRestoreIntent(context({ historyState, navigationType: "back_forward" }))?.kind).toBe("history");
    expect(resolveHomeRestoreIntent(context({ historyState, navigationType: "reload", nativeScrollY: 5263 }))).toBeNull();
    expect(resolveHomeRestoreIntent(context({ navigationType: "reload", nativeScrollY: 5263 }))).toBeNull();
    expect(resolveHomeRestoreIntent(context({ href: "https://local.test/ar", historyState, navigationType: "reload" }))).toBeNull();
    expect(resolveHomeRestoreIntent(context({ href: "https://local.test/en?audit=another", historyState, navigationType: "reload" }))).toBeNull();
    expect(resolveHomeRestoreIntent(context({ navigationType: "back_forward" }))).toMatchObject({ kind: "native", skipEntry: true, scrollY: 0 });
  });

  test("reload freshness does not override an explicit locale, pending work, work query or native hash", () => {
    expect(resolveHomeRestoreIntent(context({ navigationType: "reload", href: "https://local.test/ar", localeReturn: localeRecord(), nativeScrollY: 5263 }))?.kind).toBe("locale");
    expect(resolveHomeRestoreIntent(context({ navigationType: "reload", workReturn: workRecord(), nativeScrollY: 5263 }))?.kind).toBe("work-return");
    expect(resolveHomeRestoreIntent(context({ navigationType: "reload", href: "https://local.test/en?work=wujhat" }))?.kind).toBe("work-query");
    expect(resolveHomeRestoreIntent(context({ navigationType: "reload", href: "https://local.test/en#beyond", nativeScrollY: 100 }))?.kind).toBe("native");
  });

  test("locale semantics win over native pixels and query return supports each exact slug", () => {
    expect(resolveHomeRestoreIntent(context({ href: "https://local.test/ar", localeReturn: localeRecord(), nativeScrollY: 15000 }))?.kind).toBe("locale");
    expect(resolveHomeRestoreIntent(context({ href: "https://local.test/ar?work=wujhat", localeReturn: localeRecord(), nativeScrollY: 15000 }))?.kind).toBe("work-query");
    for (const slug of Object.keys(HOME_WORK_MOMENTS) as (keyof typeof HOME_WORK_MOMENTS)[]) {
      const result = resolveHomeRestoreIntent(context({ href: `https://local.test/en?work=${slug}` }));
      expect(result).toMatchObject({ kind: "work-query", slug, skipEntry: true });
      expect(result?.position).toEqual(homeWorkPosition(slug));
    }
    expect(resolveHomeRestoreIntent(context({ href: "https://local.test/en?work=unknown" }))).toBeNull();
  });

  test("a consumed work query restores the latest entry on reload instead of repeating its initial seek", () => {
    const saved = checkpoint({ path: "/en?work=wujhat", workQuery: "wujhat", position: { section: "footer", progress: 0.7 } });
    const result = resolveHomeRestoreIntent(context({ href: "https://local.test/en?work=wujhat", navigationType: "reload", historyState: { [HOME_HISTORY_STATE_KEY]: saved } }));
    expect(result?.kind).toBe("reload");
    expect(result?.position).toEqual(saved.position);
  });

  test("hash entries preserve native anchor behavior and no unsupported route is treated as HOME", () => {
    expect(resolveHomeRestoreIntent(context({ href: "https://local.test/en#beyond" }))?.kind).toBe("native");
    expect(resolveHomeRestoreIntent(context({ href: "https://local.test/en/projects/wujhat", workReturn: workRecord() }))).toBeNull();
    expect(resolveHomeRestoreIntent(context({ href: "https://local.test/en/projects?project=wujhat" }))).toBeNull();
  });

  test("history lookup is per ID and URL, chooses a newer stored checkpoint and tolerates corrupted storage", () => {
    const saved = checkpoint({ created: now - 10 }), newer = checkpoint();
    const state = { [HOME_HISTORY_STATE_KEY]: saved };
    expect(homeCheckpointFromState(state, JSON.stringify({ [newer.id]: newer }), "/en", now)).toEqual(newer);
    expect(homeCheckpointFromState(state, "{", "/en", now)).toEqual(saved);
    expect(homeCheckpointFromState({ [HOME_HISTORY_STATE_KEY]: { version: 1, id: "other" } }, JSON.stringify({ [newer.id]: newer }), "/en", now)).toBeNull();
    expect(homeCheckpointFromState(state, null, "/ar", now)).toBeNull();
    expect(homeCheckpointFromState(state, null, "/en", now - 11)).toBeNull();
  });

  test("history storage retains only the last 40 entry checkpoints", () => {
    let raw: string | null = null;
    for (let i = 0; i < 47; i++) raw = serializeHomeCheckpoints(raw, checkpoint({ id: `entry-${i}`, created: now + i }));
    const entries = JSON.parse(raw!) as Record<string, HomeCheckpoint>;
    expect(Object.keys(entries)).toHaveLength(HOME_HISTORY_LIMIT);
    expect(entries["entry-0"]).toBeUndefined();
    expect(entries["entry-46"].id).toBe("entry-46");
  });
});

describe("native link guards", () => {
  test("recognizes HOME locale and exact case paths without modifying the anchor", () => {
    const link = { href: "/ar?audit=keep#top" };
    expect(homeLinkIntent(click, link, "https://local.test/en")).toEqual({ kind: "locale", from: "/en", to: "/ar" });
    expect(link.href).toBe("/ar?audit=keep#top");
    expect(homeLinkIntent(click, { href: "/en/projects/tranche-finance" }, "https://local.test/en")).toEqual({ kind: "project", home: "/en", slug: "tranche-finance" });
  });

  test("modified, non-primary and previously-cancelled clicks leave no handoff", () => {
    for (const override of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }, { button: 2 }, { defaultPrevented: true }]) {
      expect(homeLinkIntent({ ...click, ...override }, { href: "/ar" }, "https://local.test/en")).toBeNull();
    }
  });

  test("new tabs, named/base targets, downloads, inert, external, unknown and same-locale links stay native", () => {
    for (const link of [
      { href: "/ar", target: "_blank" }, { href: "/ar", target: "case" }, { href: "/ar", download: true },
      { href: "/ar", inert: true }, { href: "https://www.thisisgazzar.com/ar" }, { href: "mailto:hello@example.com" },
      { href: "javascript:void(0)" }, { href: "/en" }, { href: "#beyond" }, { href: "/en/projects/unknown" },
      { href: "/ar/projects/wujhat" }, { href: "http://[" },
    ]) expect(homeLinkIntent(click, link, "https://local.test/en")).toBeNull();
    expect(homeLinkIntent(click, { href: "/ar", target: "_SELF" }, "https://local.test/en")?.kind).toBe("locale");
  });
});

// Small browser adapter: tests exercise public lifecycle events, storage and
// layout readiness without importing a DOM/React runtime or starting Next.
class Events {
  listeners = new Map<string, Set<(event: Event) => void>>();
  captures = new Map<string, Set<(event: Event) => void>>();
  addEventListener(type: string, listener: (event: Event) => void, options: boolean | AddEventListenerOptions = false) {
    const group = (typeof options === "boolean" ? options : options.capture) ? this.captures : this.listeners;
    if (!group.has(type)) group.set(type, new Set());
    group.get(type)!.add(listener);
  }
  removeEventListener(type: string, listener: (event: Event) => void, capture = false) { (capture ? this.captures : this.listeners).get(type)?.delete(listener); }
  dispatchEvent(event: Event) {
    const snapshot = [this.captures, this.listeners].flatMap((group) => [...group.get(event.type) ?? []].map((listener) => ({ group, listener })));
    for (const { group, listener } of snapshot) if (group.get(event.type)?.has(listener)) listener(event);
    return !event.defaultPrevented;
  }
  count() { return [...this.captures.values(), ...this.listeners.values()].reduce((sum, entries) => sum + entries.size, 0); }
}
class ElementStub extends Events {
  isConnected = true;
  dataset: Record<string, string> = {};
  scrollHeight = 50000;
  matches() { return false; }
  querySelector() { return null; }
}
class LinkStub extends ElementStub {
  target = "";
  download = false;
  inert = false;
  constructor(public href: string) { super(); }
  closest(selector: string) { return selector === "a[href]" || (selector === "[inert]" && this.inert) ? this : null; }
  getAttribute(name: string) { return name === "target" ? this.target : null; }
  hasAttribute(name: string) { return name === "download" && this.download; }
}
const cleanups: (() => void)[] = [];
afterEach(() => { while (cleanups.length) cleanups.pop()!(); });

function browser(href = "https://local.test/en") {
  const root = new ElementStub(), document = Object.assign(new Events(), {
    readyState: "complete", hidden: false, documentElement: new ElementStub(), body: new ElementStub(),
    querySelector: (selector: string) => selector === "[data-journey-root]" ? root : null, getElementById: () => null,
  });
  const storage = new Map<string, string>(), frames = new Map<number, FrameRequestCallback>(), timers = new Map<number, () => void>();
  const observers = new Set<() => void>();
  class LayoutObserver {
    constructor(private callback: () => void) { observers.add(callback); }
    observe() {}
    disconnect() { observers.delete(this.callback); }
  }
  let serial = 0, geometry: HomeGeometry | null = desktop;
  const scrolls: number[] = [], details: HomeRestoreDetail[] = [];
  const runtime = Object.assign(new Events(), {
    document, location: new URL(href), scrollY: 0, innerWidth: 1400, innerHeight: 850,
    crypto, Element: ElementStub, CustomEvent, ResizeObserver: LayoutObserver, MutationObserver: LayoutObserver,
    performance: { getEntriesByType: () => [{ type: "navigate" }] },
    history: { state: { __NA: true, tree: { retained: true } } as Record<string, unknown>, scrollRestoration: "auto", replaceState(next: Record<string, unknown>) { this.state = next; } },
    sessionStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => { storage.set(key, value); }, removeItem: (key: string) => { storage.delete(key); } },
    requestAnimationFrame: (fn: FrameRequestCallback) => { frames.set(++serial, fn); return serial; },
    cancelAnimationFrame: (id: number) => { frames.delete(id); },
    setTimeout: (fn: () => void) => { timers.set(++serial, fn); return serial; },
    clearTimeout: (id: number) => { timers.delete(id); },
    scrollTo: ({ top }: { top: number }) => { runtime.scrollY = top; scrolls.push(top); },
  });
  const win = runtime as unknown as NonNullable<HomeNavigationOptions["window"]>;
  const settle = () => {
    for (let i = 0; frames.size && i < 12; i++) {
      const current = [...frames]; frames.clear();
      current.forEach(([, fn]) => fn(i * 16));
    }
    expect(frames.size).toBe(0);
  };
  const mount = (extra: Partial<HomeNavigationOptions> = {}) => {
    const cleanup = mountHomeNavigation({ window: win, root: root as unknown as HTMLElement,
      getGeometry: () => geometry, onRestore: (detail) => { details.push(detail); }, ...extra });
    cleanups.push(cleanup); return cleanup;
  };
  const capture = () => runtime.dispatchEvent(new Event("scrollend"));
  const setLocaleReturn = (raw: string) => {
    storage.set(HOME_LOCALE_RETURN_KEY, raw);
    storage.set(HOME_HANDOFF_KEY, handoffRecord({ to: JSON.parse(raw).to, created: Date.now() }));
  };
  return { runtime, win, root, document, storage, frames, timers, scrolls, details, settle, mount, capture,
    setLocaleReturn,
    notifyLayout: () => { for (const callback of observers) callback(); }, observers,
    setGeometry: (value: HomeGeometry | null) => { geometry = value; } };
}

describe("HOME browser lifecycle", () => {
  test("first document clears all stale return records, while direct work query and hash remain explicit URL intents", () => {
    for (const type of ["navigate", "reload"] as const) {
      for (const suffix of ["", "?work=wujhat", "#beyond"]) {
        const b = browser(`https://local.test/ar${suffix}`);
        b.runtime.performance.getEntriesByType = () => [{ type }];
        b.storage.set(HOME_RETURN_KEY, homeRecord({ created: Date.now() }));
        b.storage.set(HOME_WORK_RETURN_KEY, workRecord({ created: Date.now() }));
        b.storage.set(HOME_LOCALE_RETURN_KEY, localeRecord({ created: Date.now() }));
        const intent = getHomeRestoreIntent(b.win);
        expect(intent?.kind ?? null).toBe(suffix.startsWith("?") ? "work-query" : suffix ? "native" : null);
        for (const key of [HOME_RETURN_KEY, HOME_WORK_RETURN_KEY, HOME_LOCALE_RETURN_KEY]) expect(b.storage.has(key)).toBe(false);
      }
    }
  });

  test("matching hard locale handoff preserves mismatched HOME return until successful matching Back apply", () => {
    const b = browser("https://local.test/ar");
    const raw = homeRecord({ created: Date.now(), position: homeWorkPosition("wujhat") });
    b.storage.set(HOME_RETURN_KEY, raw); b.setLocaleReturn(localeRecord({ created: Date.now() }));
    expect(getHomeRestoreIntent(b.win)?.kind).toBe("locale");
    expect(b.storage.has(HOME_HANDOFF_KEY)).toBe(false);
    b.mount(); b.settle();
    expect(b.storage.get(HOME_RETURN_KEY)).toBe(raw); // AR must not consume EN.
    b.runtime.location = new URL("https://local.test/en");
    b.runtime.history.state = { [HOME_HISTORY_STATE_KEY]: checkpoint({ created: Date.now() }) };
    b.setGeometry(null); b.runtime.dispatchEvent(new Event("popstate")); b.settle();
    expect(getHomeRestoreIntent(b.win)?.kind).toBe("home-return");
    expect(b.storage.get(HOME_RETURN_KEY)).toBe(raw); // Getter/geometry wait are non-consuming.
    b.setGeometry(mobile); b.runtime.dispatchEvent(new Event(HOME_NAVIGATION_READY_EVENT)); b.settle();
    expect(b.storage.has(HOME_RETURN_KEY)).toBe(false);
    expect(b.details.at(-1)?.frame?.time).toBeCloseTo(308, 8);
  });

  test("generic HOME return drives pristine EN312→AR/narrow/footer→Back312, while Forward uses the saved AR footer", () => {
    const b = browser();
    const wide = { start: 1009, distance: journeyDistance(1009), heroInput: 100 / 6.8 };
    const narrow = { start: 865, distance: journeyDistance(865, true), heroInput: 100 / 5.8 };
    b.setGeometry(wide); b.runtime.innerWidth = 1912; b.runtime.innerHeight = 1009;
    let dispose: () => void;
    const decisions: ReturnType<typeof getHomeRestoreIntent>[] = [];
    const next = () => { dispose(); decisions.push(getHomeRestoreIntent(b.win)); dispose = b.mount(); };
    b.runtime.addEventListener("popstate", next, true); // Earlier Next capture tears down HOME first.
    dispose = b.mount(); b.settle();
    b.runtime.scrollY = 16362; b.capture();
    b.document.dispatchEvent({ type: "click", target: new LinkStub("https://local.test/ar"), ...click } as unknown as Event);
    const english = b.runtime.history.state[HOME_HISTORY_STATE_KEY] as HomeCheckpoint;
    const home = b.storage.get(HOME_RETURN_KEY)!;
    expect(JSON.parse(home).home).toBe("/en");
    expect(homeScoreFromPosition(JSON.parse(home).position)).toBeCloseTo(312.0114, 3);
    b.runtime.location = new URL("https://local.test/ar"); b.runtime.history.state = { __NA: true };
    dispose(); dispose = b.mount(); b.settle();
    expect(b.storage.get(HOME_RETURN_KEY)).toBe(home);
    expect(b.storage.has(HOME_HANDOFF_KEY)).toBe(false);
    b.setGeometry(narrow); b.runtime.innerWidth = 392; b.runtime.innerHeight = 865;
    b.runtime.dispatchEvent(new Event("resize")); b.settle();
    expect(b.scrolls.at(-1)).toBeCloseTo(12091.398, 2);
    b.runtime.scrollY = 21772; b.capture();
    const arabic = b.runtime.history.state[HOME_HISTORY_STATE_KEY] as HomeCheckpoint;
    expect(b.storage.get(HOME_RETURN_KEY)).toBe(home);
    b.runtime.location = new URL("https://local.test/en"); b.runtime.history.state = { __NA: true, [HOME_HISTORY_STATE_KEY]: english };
    b.runtime.dispatchEvent(new Event("popstate")); b.settle();
    expect(decisions[0]?.kind).toBe("home-return");
    expect(b.details.at(-1)?.intent.kind).toBe("home-return");
    expect(b.scrolls.at(-1)).toBeCloseTo(12091.398, 2);
    expect(b.details.at(-1)?.frame?.time).toBeCloseTo(312.0114, 3);
    expect(b.storage.has(HOME_RETURN_KEY)).toBe(false);
    b.runtime.location = new URL("https://local.test/ar"); b.runtime.history.state = { __NA: true, [HOME_HISTORY_STATE_KEY]: arabic };
    b.runtime.dispatchEvent(new Event("popstate")); b.settle();
    expect(decisions[1]?.kind).toBe("history");
    expect(b.runtime.scrollY).toBe(21772);
    expect(b.details.at(-1)?.frame?.time).toBeCloseTo(714, 8);
    dispose!(); b.runtime.removeEventListener("popstate", next, true);
  });

  test("extra fresh AR document clears EN semantic return, so later EN Back takes the saved-pixel fallback", () => {
    const fresh = browser("https://local.test/ar");
    fresh.storage.set(HOME_RETURN_KEY, homeRecord({ created: Date.now(), position: { section: "work", progress: 6 / 142 } }));
    expect(getHomeRestoreIntent(fresh.win)).toBeNull();
    expect(fresh.storage.has(HOME_RETURN_KEY)).toBe(false);
    const back = browser("https://local.test/en");
    back.runtime.performance.getEntriesByType = () => [{ type: "back_forward" }];
    for (const [key, value] of fresh.storage) back.storage.set(key, value);
    back.runtime.history.state[HOME_HISTORY_STATE_KEY] = checkpoint({ created: Date.now(), scrollY: 16362 });
    back.setGeometry({ start: 865, distance: journeyDistance(865, true), heroInput: 100 / 5.8 });
    back.mount(); back.settle();
    expect(back.details[0].intent.kind).toBe("history");
    expect(back.runtime.scrollY).toBe(16362);
    expect(back.details[0].frame?.time).toBeCloseTo(489.3488, 3);
  });

  test("route-remount guard does not run a late document clear, and explicit router target remains stronger than HOME return", () => {
    const b = browser("https://local.test/ar");
    b.runtime.performance.getEntriesByType = () => [{ type: "reload", name: "https://local.test/en" }];
    const raw = homeRecord({ created: Date.now() }); b.storage.set(HOME_RETURN_KEY, raw);
    b.storage.set(HOME_LOCALE_RETURN_KEY, localeRecord({ created: Date.now() }));
    expect(getHomeRestoreIntent(b.win)?.kind).toBe("locale");
    b.mount(); b.settle();
    expect(b.storage.get(HOME_RETURN_KEY)).toBe(raw);
    const explicit = browser("https://local.test/en");
    explicit.storage.set(HOME_RETURN_KEY, raw);
    expect(parseHomeReturn(raw, "/en", Date.now())).not.toBeNull();
    explicit.mount({ historyTarget: 0 }); explicit.settle();
    expect(explicit.details[0].intent.kind).toBe("history");
    expect(explicit.scrolls).toEqual([0]);
    expect(explicit.storage.has(HOME_RETURN_KEY)).toBe(false);
  });

  test("denied storage after HOME intent capture cannot block application or native link behavior", () => {
    const b = browser(); b.runtime.performance.getEntriesByType = () => [{ type: "back_forward" }];
    b.storage.set(HOME_RETURN_KEY, homeRecord({ created: Date.now() }));
    expect(getHomeRestoreIntent(b.win)?.kind).toBe("home-return");
    Object.defineProperty(b.runtime, "sessionStorage", { get() { throw new Error("denied"); } });
    b.mount(); b.settle();
    expect(b.details[0].intent.kind).toBe("home-return");
    expect(b.scrolls[0]).toBeCloseTo(homeScrollTarget(position, desktop)!, 8);
  });

  test("fresh reload reset precedes hero entry selection and runs only once per document", () => {
    const b = browser();
    b.runtime.performance.getEntriesByType = () => [{ type: "reload" }];
    b.runtime.scrollY = 5263;
    b.runtime.history.state[HOME_HISTORY_STATE_KEY] = checkpoint({ created: Date.now(), position: { section: "perspective", progress: 40 / 70 }, scrollY: 5263 });
    expect(getHomeRestoreIntent(b.win)).toBeNull();
    expect(prepareHomeFreshEntry(b.win)).toBe(true);
    expect(b.scrolls).toEqual([0]);
    expect(b.runtime.history.scrollRestoration).toBe("auto");
    b.mount(); b.settle();
    expect(b.details).toHaveLength(0); // Never dispatch restore to finish the loader.
    b.runtime.scrollY = 8541; b.capture();
    expect(prepareHomeFreshEntry(b.win)).toBe(false);
    expect(b.runtime.scrollY).toBe(8541);
    expect(getHomeRestoreIntent(b.win)).toBeNull();
    expect(b.scrolls).toEqual([0]);
  });

  test("fresh reload before load suppresses native replay, then releases without a second reset", () => {
    const b = browser();
    b.runtime.performance.getEntriesByType = () => [{ type: "reload" }];
    b.document.readyState = "interactive"; b.runtime.scrollY = 5263;
    expect(prepareHomeFreshEntry(b.win)).toBe(true);
    expect(b.runtime.history.scrollRestoration).toBe("manual");
    b.runtime.scrollY = 30; // A later user/owner position must not be reset on load.
    b.runtime.dispatchEvent(new Event("load"));
    expect(b.runtime.history.scrollRestoration).toBe("auto");
    expect(b.runtime.scrollY).toBe(30);
    expect(b.runtime.count()).toBe(0);
    expect(prepareHomeFreshEntry(b.win)).toBe(false);
  });

  test("fresh reset integration leaves locale/history/work/query/hash boot positions alone", () => {
    for (const href of ["https://local.test/en?work=wujhat", "https://local.test/en#beyond", "https://local.test/ar"]) {
      const b = browser(href);
      b.runtime.performance.getEntriesByType = () => [{ type: "reload" }]; b.runtime.scrollY = 5263;
      if (href.endsWith("/ar")) b.setLocaleReturn(localeRecord({ created: Date.now() }));
      expect(prepareHomeFreshEntry(b.win)).toBe(false);
      expect(b.scrolls).toHaveLength(0);
    }
    const history = browser(); history.runtime.performance.getEntriesByType = () => [{ type: "back_forward" }];
    expect(prepareHomeFreshEntry(history.win)).toBe(false);
    expect(history.scrolls).toHaveLength(0);
  });

  test("document-level native clicks save the actual work fraction and leave modified/new-tab links untouched", () => {
    const b = browser();
    const actual = { section: "work", progress: 0.61 } as const;
    b.runtime.scrollY = homeScrollTarget(actual, desktop)!;
    b.mount(); b.settle();
    const href = "https://local.test/en/projects/wujhat", link = new LinkStub(href);
    const event = (overrides = {}) => ({ type: "click", target: link, ...click, ...overrides,
      preventDefault: () => { throw new Error("Navigation must not cancel native clicks"); } }) as unknown as Event;
    b.document.dispatchEvent(event({ ctrlKey: true }));
    link.target = "_blank"; b.document.dispatchEvent(event()); link.target = "";
    link.download = true; b.document.dispatchEvent(event()); link.download = false;
    link.inert = true; b.document.dispatchEvent(event()); link.inert = false;
    expect(b.storage.has(HOME_WORK_RETURN_KEY)).toBe(false);
    expect(b.storage.has(HOME_RETURN_KEY)).toBe(false);
    b.document.dispatchEvent(event());
    const saved = JSON.parse(b.storage.get(HOME_WORK_RETURN_KEY)!);
    expect(saved.slug).toBe("wujhat");
    expect(saved.position.section).toBe("work");
    expect(saved.position.progress).toBeCloseTo(actual.progress, 8);
    expect(link.href).toBe(href);
    link.href = "https://local.test/ar";
    b.document.dispatchEvent(event());
    expect(JSON.parse(b.storage.get(HOME_LOCALE_RETURN_KEY)!).to).toBe("/ar");
    expect(b.storage.has(HOME_POSITIONS_KEY)).toBe(true);
  });

  test("intent is synchronous and non-consuming; no apply until ready, then exactly one immediate restore", () => {
    const b = browser("https://local.test/ar");
    const raw = localeRecord({ created: Date.now() }); b.setLocaleReturn(raw);
    b.setGeometry(null);
    expect(getHomeRestoreIntent(b.win)?.skipEntry).toBe(true);
    expect(getHomeRestoreIntent(b.win)?.position).toEqual(position);
    expect(b.storage.get(HOME_LOCALE_RETURN_KEY)).toBe(raw);
    b.mount(); b.settle();
    expect(b.scrolls).toHaveLength(0);
    expect(b.root.dataset.homeNavigation).toBe("pending");
    expect(b.storage.get(HOME_LOCALE_RETURN_KEY)).toBe(raw);
    b.setGeometry(mobile);
    b.runtime.dispatchEvent(new Event(HOME_NAVIGATION_READY_EVENT)); b.settle();
    expect(b.scrolls).toHaveLength(1);
    expect(b.scrolls[0]).toBeCloseTo(homeScrollTarget(position, mobile)!, 8);
    expect(b.details).toHaveLength(1);
    expect(b.details[0].frame?.time).toBeCloseTo(homeScoreFromPosition(position)!, 8);
    expect(b.storage.has(HOME_LOCALE_RETURN_KEY)).toBe(false);
    expect(b.runtime.history.state.__NA).toBe(true);
    expect(b.runtime.history.state.tree).toEqual({ retained: true });
    for (const type of [HOME_NAVIGATION_READY_EVENT, "resize", "scroll"]) b.runtime.dispatchEvent(new Event(type));
    b.settle(); expect(b.scrolls).toHaveLength(1);
    expect(getHomeRestoreIntent(b.win)?.skipEntry).toBe(true);
  });

  test("waits for fonts and the footer's actual scrollable extent", async () => {
    const b = browser("https://local.test/en?work=8returns");
    let fontReady!: () => void;
    Object.assign(b.document, { fonts: { ready: new Promise<void>((resolve) => { fontReady = resolve; }) } });
    b.document.documentElement.scrollHeight = b.document.body.scrollHeight = 1000;
    b.mount(); b.settle(); expect(b.details).toHaveLength(0);
    fontReady(); await Promise.resolve(); b.settle(); expect(b.details).toHaveLength(0);
    b.document.documentElement.scrollHeight = 50000;
    b.runtime.dispatchEvent(new Event(HOME_NAVIGATION_READY_EVENT)); b.settle();
    expect(b.details[0].frame?.time).toBeCloseTo(413, 8);
    expect((b.runtime.history.state[HOME_HISTORY_STATE_KEY] as HomeCheckpoint).workQuery).toBe("8returns");
  });

  test("remount does not reapply; cleanup removes every listener, timer and pending frame", () => {
    const b = browser("https://local.test/en?work=wujhat");
    let events = 0;
    const event = () => { events++; };
    b.runtime.addEventListener(HOME_NAVIGATION_RESTORE_EVENT, event);
    const first = b.mount(); b.settle();
    b.runtime.dispatchEvent(new Event("scroll"));
    expect(b.timers.size).toBe(1);
    first(); first();
    expect(b.frames.size).toBe(0); expect(b.timers.size).toBe(0);
    expect(b.document.count()).toBe(0);
    expect(b.observers.size).toBe(0);
    const second = b.mount(); b.settle();
    expect(events).toBe(1); expect(b.scrolls).toHaveLength(1);
    second();
    b.runtime.removeEventListener(HOME_NAVIGATION_RESTORE_EVENT, event);
    expect(b.runtime.count()).toBe(0);
    expect(b.runtime.history.scrollRestoration).toBe("auto");
  });

  test("locale-restored Wujhat312 reprojects desktop/mobile and reverse without replacing its intent", () => {
    const b = browser("https://local.test/ar");
    const original: HomePosition = { section: "work", progress: 6 / 142 };
    const wide = { start: 1009, distance: journeyDistance(1009), heroInput: 100 / 6.8 };
    const narrow = { start: 865, distance: journeyDistance(865, true), heroInput: 100 / 5.8 };
    b.setGeometry(wide); b.runtime.innerWidth = 1912; b.runtime.innerHeight = 1009;
    b.setLocaleReturn(localeRecord({ position: original, created: Date.now() }));
    b.mount(); b.settle();
    expect(b.scrolls[0]).toBeCloseTo(16361.625, 2);
    b.runtime.scrollY = wide.start + wide.distance; b.capture();
    expect((b.runtime.history.state[HOME_HISTORY_STATE_KEY] as HomeCheckpoint).position.section).toBe("footer");
    expect(getHomeRestoreIntent(b.win)?.position).toEqual(original);
    b.setGeometry(narrow); b.runtime.innerWidth = 392; b.runtime.innerHeight = 865;
    b.runtime.dispatchEvent(new Event("resize")); b.settle();
    expect(b.scrolls[1]).toBeCloseTo(12091.124, 2);
    expect(b.details[1].frame?.time).toBeCloseTo(312, 8);
    b.setGeometry(wide); b.runtime.innerWidth = 1912; b.runtime.innerHeight = 1009;
    b.notifyLayout(); b.settle();
    expect(b.scrolls[2]).toBeCloseTo(16361.625, 2);
    expect(b.details[2].frame?.time).toBeCloseTo(312, 8);
    expect(getHomeRestoreIntent(b.win)?.position).toEqual(original);
  });

  test("restored footer→reading→motion keeps the original work anchor through later captures", () => {
    const b = browser("https://local.test/ar");
    const original: HomePosition = { section: "work", progress: 6 / 142 };
    const narrow = { start: 865, distance: journeyDistance(865, true), heroInput: 100 / 5.8 };
    let reading = false;
    b.setGeometry(narrow); b.runtime.innerWidth = 392; b.runtime.innerHeight = 865;
    b.setLocaleReturn(localeRecord({ position: original, created: Date.now() }));
    b.mount({ getPosition: () => reading ? { section: "footer", progress: 0.9 } : null,
      // Source adapter: nearest project's absolute top minus 100px.
      getTarget: (saved) => reading && saved.section === "work" ? 3927 - 100 : null });
    b.settle();
    b.runtime.scrollY = narrow.start + narrow.distance; b.capture();
    reading = true; b.setGeometry(null); b.document.documentElement.scrollHeight = b.document.body.scrollHeight = 9406;
    b.runtime.scrollY = 8541; // Parent's initial native clamp before layout settles.
    b.runtime.dispatchEvent(new Event(HOME_NAVIGATION_READY_EVENT)); b.settle();
    expect(b.scrolls.at(-1)).toBe(3827);
    expect(b.details.at(-1)?.pinProgress).toBeNull();
    b.runtime.scrollY = 8541; b.capture();
    expect(getHomeRestoreIntent(b.win)?.position).toEqual(original);
    reading = false; b.setGeometry(narrow); b.document.documentElement.scrollHeight = 22637;
    b.runtime.dispatchEvent(new Event(HOME_NAVIGATION_READY_EVENT)); b.settle();
    expect(b.scrolls.at(-1)).toBeCloseTo(12091.124, 2);
    expect(b.details.at(-1)?.frame?.time).toBeCloseTo(312, 8);
  });

  test("history, project return and consumed query reload also retain their own semantic anchors on resize", () => {
    for (const kind of ["history", "work-return", "reload"] as const) {
      const b = browser(kind === "reload" ? "https://local.test/en?work=wujhat" : "https://local.test/en");
      const original: HomePosition = { section: "work", progress: 6 / 142 };
      if (kind === "work-return") {
        b.runtime.performance.getEntriesByType = () => [{ type: "back_forward" }];
        b.storage.set(HOME_WORK_RETURN_KEY, workRecord({ position: original, created: Date.now() }));
      } else {
        b.runtime.performance.getEntriesByType = () => [{ type: kind === "history" ? "back_forward" : "reload" }];
        b.runtime.history.state[HOME_HISTORY_STATE_KEY] = checkpoint({
          created: Date.now(), position: original, path: kind === "reload" ? "/en?work=wujhat" : "/en",
          scrollY: homeScrollTarget(original, desktop)!,
          ...(kind === "reload" ? { workQuery: "wujhat" } : {}),
        });
      }
      b.mount(); b.settle();
      expect(b.details[0].intent.kind).toBe(kind);
      b.runtime.scrollY = desktop.start + desktop.distance; b.capture();
      b.setGeometry(mobile); b.runtime.innerWidth = 392; b.runtime.innerHeight = 932;
      b.runtime.dispatchEvent(new Event("resize")); b.settle();
      expect(b.details).toHaveLength(2);
      expect(b.details[1].frame?.time).toBeCloseTo(312, 8);
      expect(getHomeRestoreIntent(b.win)?.position?.section).toBe(original.section);
      expect(getHomeRestoreIntent(b.win)?.position?.progress).toBeCloseTo(original.progress, 8);
    }
    const native = browser();
    native.runtime.performance.getEntriesByType = () => [{ type: "back_forward" }];
    native.runtime.scrollY = 1200; native.mount(); native.settle();
    native.setGeometry(mobile); native.runtime.dispatchEvent(new Event("resize")); native.settle();
    expect(native.details).toHaveLength(1); // Native/hash has no semantic anchor to retain.
    expect(native.scrolls).toHaveLength(0);
    expect(native.runtime.scrollY).toBe(1200);
  });

  test("ordinary fresh mode toggles retain the parent's clamped pixels and do not acquire a semantic anchor", () => {
    const b = browser();
    const wide = { start: 1009, distance: journeyDistance(1009), heroInput: 100 / 6.8 };
    let reading = false;
    b.setGeometry(wide); b.runtime.innerWidth = 1912; b.runtime.innerHeight = 1009;
    b.mount({ getPosition: () => reading ? { section: "footer", progress: 0.9 } : null,
      getTarget: () => reading ? 3827 : null }); b.settle();
    b.runtime.scrollY = homeScrollTarget({ section: "people", progress: (580 - 547) / 80 }, wide)!; b.capture();
    reading = true; b.setGeometry(null); b.document.documentElement.scrollHeight = b.document.body.scrollHeight = 12446;
    b.runtime.scrollY = 11437;
    b.runtime.dispatchEvent(new Event(HOME_NAVIGATION_READY_EVENT)); b.settle();
    expect(b.runtime.scrollY).toBe(11437);
    reading = false; b.setGeometry(wide); b.document.documentElement.scrollHeight = 30610;
    b.runtime.dispatchEvent(new Event(HOME_NAVIGATION_READY_EVENT)); b.settle();
    expect(b.runtime.scrollY).toBe(11437);
    expect(b.scrolls).toHaveLength(0); expect(b.details).toHaveLength(0);
    expect(getHomeRestoreIntent(b.win)).toBeNull();
  });

  test("same geometry, frame/data/style updates and repeated READY never seek a restored mount", () => {
    const b = browser("https://local.test/en?work=wujhat");
    b.mount(); b.settle();
    b.runtime.scrollY = desktop.start + desktop.distance; b.capture();
    for (let i = 0; i < 8; i++) {
      b.root.dataset.progress = String(i / 8);
      b.setGeometry({ ...desktop, start: desktop.start + (i % 2 ? 1e-9 : -1e-9) });
      b.notifyLayout();
      b.runtime.dispatchEvent(new Event(HOME_NAVIGATION_READY_EVENT)); b.settle();
    }
    expect(b.scrolls).toHaveLength(1); expect(b.details).toHaveLength(1);
    expect(b.runtime.scrollY).toBe(desktop.start + desktop.distance);
    // A real measured pin change is meaningful even at identical viewport size.
    b.setGeometry({ ...desktop, distance: desktop.distance + 100 }); b.notifyLayout(); b.settle();
    expect(b.scrolls).toHaveLength(2);
    expect(b.details[1].frame?.time).toBeCloseTo(308, 8);
    b.notifyLayout(); b.settle(); expect(b.scrolls).toHaveLength(2);
  });

  test("BFCache history visit restores saved pixels after a viewport change, matching source history policy", () => {
    const b = browser("https://local.test/en?work=remoteplatz");
    b.mount(); b.settle();
    b.runtime.dispatchEvent(new Event("pagehide"));
    b.setGeometry(mobile); b.runtime.innerWidth = 392; b.runtime.innerHeight = 932;
    b.runtime.dispatchEvent(Object.assign(new Event("pageshow"), { persisted: true })); b.settle();
    expect(b.details).toHaveLength(2);
    expect(b.details[1].intent.kind).toBe("history");
    expect(b.scrolls[1]).toBe(b.scrolls[0]);
    expect(b.details[1].frame?.time).toBeCloseTo(frameFromProgress((b.scrolls[0] - mobile.start) / mobile.distance, mobile.heroInput).time, 8);
  });

  test("soft popstate selects history before Next teardown and preserves the outgoing footer for Forward", () => {
    const b = browser("https://local.test/en");
    const wide = { start: 1009, distance: journeyDistance(1009), heroInput: 100 / 6.8 };
    const narrow = { start: 865, distance: journeyDistance(865, true), heroInput: 100 / 5.8 };
    b.setGeometry(wide); b.runtime.innerWidth = 1912; b.runtime.innerHeight = 1009;
    const original: HomePosition = { section: "work", progress: 6 / 142 };
    const decisions: ReturnType<typeof getHomeRestoreIntent>[] = [];
    let dispose: () => void;
    // Next can tear down HOME before even our capture listener gets its turn.
    // First visit/capture EN, then a normal locale push creates a distinct AR ID.
    const next = () => { dispose(); decisions.push(getHomeRestoreIntent(b.win)); dispose = b.mount(); };
    b.runtime.addEventListener("popstate", next, true);
    b.runtime.scrollY = 16362;
    dispose = b.mount(); b.settle();
    const english = b.runtime.history.state[HOME_HISTORY_STATE_KEY] as HomeCheckpoint;
    b.storage.set(HOME_LOCALE_RETURN_KEY, localeRecord({ created: Date.now(), position: original }));
    b.runtime.location = new URL("https://local.test/ar"); b.runtime.history.state = { __NA: true };
    dispose(); dispose = b.mount(); b.settle();
    b.setGeometry(narrow); b.runtime.innerWidth = 392; b.runtime.innerHeight = 865;
    b.runtime.dispatchEvent(new Event("resize")); b.settle();
    b.runtime.scrollY = narrow.start + narrow.distance; b.capture();
    const outgoing = b.runtime.history.state[HOME_HISTORY_STATE_KEY] as HomeCheckpoint;
    b.runtime.location = new URL("https://local.test/en");
    b.runtime.history.state = { __NA: true, [HOME_HISTORY_STATE_KEY]: english };
    b.runtime.dispatchEvent(new Event("popstate")); b.settle();
    expect(decisions[0]?.kind).toBe("history");
    expect(b.details.at(-1)?.intent.kind).toBe("history");
    expect(b.runtime.scrollY).toBe(16362); // Source EN history keeps desktop pixels.
    expect(b.details.at(-1)?.frame?.time).toBeCloseTo(489.3488, 3);
    expect(JSON.parse(b.storage.get(HOME_POSITIONS_KEY)!)[outgoing.id].scrollY).toBe(21772);
    b.runtime.location = new URL("https://local.test/ar");
    b.runtime.history.state = { __NA: true, [HOME_HISTORY_STATE_KEY]: outgoing };
    b.runtime.dispatchEvent(new Event("popstate")); b.settle();
    expect(decisions[1]?.kind).toBe("history");
    expect(b.runtime.scrollY).toBe(21772);
    expect(b.details.at(-1)?.frame?.time).toBeCloseTo(714, 8);
    dispose!(); b.runtime.removeEventListener("popstate", next, true);
  });

  test("popstate selects the destination entry without overwriting its checkpoint with outgoing pixels", () => {
    const b = browser("https://local.test/en?work=wujhat");
    b.mount(); b.settle();
    const outgoingId = (b.runtime.history.state[HOME_HISTORY_STATE_KEY] as HomeCheckpoint).id;
    const destination = checkpoint({ id: "hero-entry", path: "/en", created: Date.now(), position: { section: "hero", progress: 0 }, scrollY: 0 });
    b.runtime.location = new URL("https://local.test/en");
    b.runtime.history.state = { __NA: true, [HOME_HISTORY_STATE_KEY]: destination };
    b.runtime.dispatchEvent(new Event("popstate")); b.settle();
    expect(b.details[1].intent.kind).toBe("history");
    expect(b.details[1].position).toEqual({ section: "hero", progress: 0 });
    expect(b.scrolls.at(-1)).toBe(0);
    const stored = JSON.parse(b.storage.get(HOME_POSITIONS_KEY)!);
    expect(stored[outgoingId].position.section).toBe("work");
    expect(stored["hero-entry"].position.section).toBe("hero");
  });

  test("semantic reading adapters can restore without inventing pin geometry", () => {
    const b = browser("https://local.test/ar");
    b.setLocaleReturn(localeRecord({ created: Date.now() })); b.setGeometry(null);
    b.mount({ getPosition: () => position, getTarget: (saved) => saved.section === "work" ? 3400 + saved.progress * 1200 : null });
    b.settle();
    expect(b.scrolls).toEqual([3916]);
    expect(b.details[0].pinProgress).toBeNull();
    expect(b.details[0].frame).toBeNull();
  });

  test("unavailable session storage does not block query or native navigation", () => {
    const b = browser("https://local.test/en?work=wujhat");
    Object.defineProperty(b.runtime, "sessionStorage", { get() { throw new Error("denied"); } });
    expect(getHomeRestoreIntent(b.win)?.kind).toBe("work-query");
    b.mount(); b.settle();
    expect(b.details[0].frame?.time).toBeCloseTo(308, 8);
    expect(b.runtime.history.state[HOME_HISTORY_STATE_KEY]).toBeDefined();
  });
});
