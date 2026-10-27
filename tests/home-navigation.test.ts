import { afterEach, describe, expect, test } from "bun:test";
import {
  HOME_SEMANTIC_SCENES, HOME_WORK_MOMENTS, captureHomePosition, homePinProgress,
  homeScoreFromPosition, homeScrollTarget, homeWorkPosition, isHomePosition,
  type HomeGeometry, type HomePosition,
} from "../src/lib/navigation/home-position";
import {
  HOME_HISTORY_STATE_KEY, HOME_HISTORY_LIMIT, HOME_LOCALE_MAX_AGE, HOME_LOCALE_RETURN_KEY,
  HOME_POSITIONS_KEY, HOME_WORK_MAX_AGE, HOME_WORK_RETURN_KEY,
  homeCheckpointFromState, homeLinkIntent, parseHomeLocaleReturn, parseHomeWorkReturn,
  resolveHomeRestoreIntent, serializeHomeCheckpoints,
  type HomeCheckpoint, type HomeRestoreContext,
} from "../src/lib/navigation/home-navigation-state";
import {
  HOME_NAVIGATION_READY_EVENT, HOME_NAVIGATION_RESTORE_EVENT,
  getHomeRestoreIntent, mountHomeNavigation, type HomeNavigationOptions, type HomeRestoreDetail,
} from "../src/lib/navigation/home-navigation";
import { frameFromProgress, journeyDistance, progressFromStoryTime } from "../src/sections/landing/3-journey/journey-clock";

const desktop: HomeGeometry = { start: 850, distance: 24086, heroInput: 100 / 6.8 };
const mobile: HomeGeometry = { start: 932, distance: 22526, heroInput: 100 / 5.8 };
const now = 1_800_000_000_000;
const position: HomePosition = { section: "work", progress: 0.43 };
const localeRecord = (overrides = {}) => JSON.stringify({ version: 1, from: "/en", to: "/ar", created: now, position, ...overrides });
const workRecord = (overrides = {}) => JSON.stringify({ version: 1, home: "/en", slug: "wujhat", created: now, position, pending: true, ...overrides });
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

  test("a fresh HOME visit ignores unrelated history, while Back/Forward and reload restore its exact entry", () => {
    const saved = checkpoint();
    const historyState = { __NA: true, [HOME_HISTORY_STATE_KEY]: saved };
    expect(resolveHomeRestoreIntent(context({ historyState }))).toBeNull();
    expect(resolveHomeRestoreIntent(context({ historyState, navigationType: "back_forward" }))?.kind).toBe("history");
    expect(resolveHomeRestoreIntent(context({ historyState, navigationType: "reload" }))?.position).toEqual(position);
    expect(resolveHomeRestoreIntent(context({ href: "https://local.test/ar", historyState, navigationType: "reload" }))).toBeNull();
    expect(resolveHomeRestoreIntent(context({ href: "https://local.test/en?audit=another", historyState, navigationType: "reload" }))).toBeNull();
    expect(resolveHomeRestoreIntent(context({ navigationType: "back_forward" }))).toMatchObject({ kind: "native", skipEntry: true, scrollY: 0 });
  });

  test("locale semantics win over native pixels and query return supports each exact slug", () => {
    expect(resolveHomeRestoreIntent(context({ href: "https://local.test/ar?work=wujhat", localeReturn: localeRecord(), nativeScrollY: 15000 }))?.kind).toBe("locale");
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
      { href: "/en/projects" }, { href: "/ar/projects/wujhat" }, { href: "http://[" },
    ]) expect(homeLinkIntent(click, link, "https://local.test/en")).toBeNull();
    expect(homeLinkIntent(click, { href: "/ar", target: "_SELF" }, "https://local.test/en")?.kind).toBe("locale");
  });
});

// Small browser adapter: tests exercise public lifecycle events, storage and
// layout readiness without importing a DOM/React runtime or starting Next.
class Events {
  listeners = new Map<string, Set<(event: Event) => void>>();
  addEventListener(type: string, listener: (event: Event) => void) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(listener);
  }
  removeEventListener(type: string, listener: (event: Event) => void) { this.listeners.get(type)?.delete(listener); }
  dispatchEvent(event: Event) { for (const listener of [...this.listeners.get(event.type) ?? []]) listener(event); return !event.defaultPrevented; }
  count() { return [...this.listeners.values()].reduce((sum, entries) => sum + entries.size, 0); }
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
  let serial = 0, geometry: HomeGeometry | null = desktop;
  const scrolls: number[] = [], details: HomeRestoreDetail[] = [];
  const runtime = Object.assign(new Events(), {
    document, location: new URL(href), scrollY: 0, innerWidth: 1400, innerHeight: 850,
    crypto, Element: ElementStub, CustomEvent,
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
  return { runtime, win, root, document, storage, frames, timers, scrolls, details, settle, mount, setGeometry: (value: HomeGeometry | null) => { geometry = value; } };
}

describe("HOME browser lifecycle", () => {
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
    const raw = localeRecord({ created: Date.now() }); b.storage.set(HOME_LOCALE_RETURN_KEY, raw);
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
    const second = b.mount(); b.settle();
    expect(events).toBe(1); expect(b.scrolls).toHaveLength(1);
    second();
    b.runtime.removeEventListener(HOME_NAVIGATION_RESTORE_EVENT, event);
    expect(b.runtime.count()).toBe(0);
    expect(b.runtime.history.scrollRestoration).toBe("auto");
  });

  test("BFCache return remaps the saved semantic score after a viewport change", () => {
    const b = browser("https://local.test/en?work=remoteplatz");
    b.mount(); b.settle();
    b.runtime.dispatchEvent(new Event("pagehide"));
    b.setGeometry(mobile); b.runtime.innerWidth = 392; b.runtime.innerHeight = 932;
    b.runtime.dispatchEvent(Object.assign(new Event("pageshow"), { persisted: true })); b.settle();
    expect(b.details).toHaveLength(2);
    expect(b.details[1].intent.kind).toBe("history");
    expect(b.details[1].frame?.time).toBeCloseTo(381, 8);
    expect(b.scrolls[1]).toBeCloseTo(homeScrollTarget(homeWorkPosition("remoteplatz"), mobile)!, 8);
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
    b.storage.set(HOME_LOCALE_RETURN_KEY, localeRecord({ created: Date.now() })); b.setGeometry(null);
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
