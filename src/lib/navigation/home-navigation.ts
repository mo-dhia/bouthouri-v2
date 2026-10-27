import { frameFromProgress, type JourneyFrame } from "../../sections/landing/3-journey/journey-clock";
import {
  captureHomePosition, homePinProgress, homeScrollTarget, homeWorkPosition,
  isHomeGeometry, isHomePosition, type HomeGeometry, type HomePosition,
} from "./home-position";
import {
  HOME_HISTORY_STATE_KEY, HOME_HISTORY_LIMIT, HOME_LOCALE_RETURN_KEY, HOME_POSITIONS_KEY, HOME_WORK_RETURN_KEY,
  homeCheckpointFromState, homeHistoryId, homeLinkIntent, homePath,
  parseHomeLocaleReturn, parseHomeWorkReturn, resolveHomeRestoreIntent, serializeHomeCheckpoints,
  type HomeCheckpoint, type HomeNavigationType, type HomeRestoreContext, type HomeRestoreIntent,
} from "./home-navigation-state";

export const HOME_NAVIGATION_READY_EVENT = "home-navigation-ready";
export const HOME_NAVIGATION_RESTORE_EVENT = "home-navigation-restore";
export type { HomeGeometry, HomePosition, HomeRestoreIntent };
export type HomeRestoreDetail = {
  intent: HomeRestoreIntent;
  position: HomePosition | null;
  scrollY: number;
  pinProgress: number | null;
  frame: JourneyFrame | null;
};

type BrowserWindow = Window & typeof globalThis;
export type HomeNavigationOptions = {
  root?: HTMLElement;
  getGeometry?: () => HomeGeometry | null;
  getFrame?: () => JourneyFrame | null;
  /** Optional adapters for the unpinned, reduced/quiet reading layout. */
  getPosition?: () => HomePosition | null;
  getTarget?: (position: HomePosition) => number | null;
  scrollTo?: (y: number) => void;
  onRestore?: (detail: HomeRestoreDetail) => void;
  window?: BrowserWindow;
};

type RestoreState = {
  key: string; intent: HomeRestoreIntent | null; applied: boolean;
  freshReload: boolean; layoutKey: string | null;
  localeRaw: string | null; workRaw: string | null;
};
const states = new WeakMap<Document, RestoreState>();
const mounts = new WeakMap<Document, () => void>();
const entryPrepared = new WeakSet<Document>();
const visitedEntries = new WeakMap<Document, Map<string, string>>();
const safeRead = (win: BrowserWindow, key: string) => { try { return win.sessionStorage.getItem(key); } catch { return null; } };
const safeWrite = (win: BrowserWindow, key: string, value: string) => { try { win.sessionStorage.setItem(key, value); } catch { /* Native navigation still works. */ } };
const safeRemove = (win: BrowserWindow, key: string) => { try { win.sessionStorage.removeItem(key); } catch { /* Optional storage. */ } };
const currentKey = (win: BrowserWindow) => `${win.location.href}|${homeHistoryId(win.history.state) ?? ""}`;

function browserWindow(): BrowserWindow | undefined {
  return typeof window === "undefined" ? undefined : window;
}

function navigationType(win: BrowserWindow): HomeNavigationType {
  const entry = win.performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  return entry?.type === "back_forward" || entry?.type === "reload" ? entry.type : "navigate";
}

function restoreState(win: BrowserWindow, type?: HomeNavigationType, reset = false): RestoreState {
  const key = currentKey(win), previous = states.get(win.document);
  if (!reset && previous?.key === key) return previous;
  const context: HomeRestoreContext = {
    href: win.location.href, navigationType: type ?? navigationType(win), historyState: win.history.state,
    localeReturn: safeRead(win, HOME_LOCALE_RETURN_KEY), workReturn: safeRead(win, HOME_WORK_RETURN_KEY),
    positions: safeRead(win, HOME_POSITIONS_KEY), nativeScrollY: win.scrollY, now: Date.now(),
  };
  // Next may commit/unmount HOME in its own earlier popstate capture listener.
  // Destination hero/effects then run before our per-mount listener can run.
  // A previously visited entry ID + exact URL identifies that soft traversal
  // synchronously; PerformanceNavigationTiming still describes the first load.
  const id = homeHistoryId(context.historyState);
  if (!type && previous && id && visitedEntries.get(win.document)?.get(id) === win.location.pathname + win.location.search) {
    context.navigationType = "back_forward";
  }
  const intent = resolveHomeRestoreIntent(context);
  const state: RestoreState = {
    key, intent, applied: false, layoutKey: null,
    freshReload: !!homePath(win.location.pathname) && context.navigationType === "reload" && !intent,
    localeRaw: context.localeReturn, workRaw: context.workReturn,
  };
  states.set(win.document, state);
  return state;
}

/** Synchronous, SSR-safe and non-consuming. Hero must call this before entry selection. */
export function getHomeRestoreIntent(win = browserWindow()): HomeRestoreIntent | null {
  return win ? restoreState(win).intent : null;
}

function scrollHomeImmediately(win: BrowserWindow, y: number) {
  const smooth = (win as BrowserWindow & {
    __bouthouriLenis?: { scrollTo(target: number, options: { immediate: true; force: true }): void };
  }).__bouthouriLenis;
  smooth?.scrollTo(y, { immediate: true, force: true });
  win.scrollTo({ top: y, behavior: "instant" });
}

/**
 * Hero's first entry selection in this document owns the fresh reload reset.
 * Remounts (quiet/motion, Strict Mode) never reset the reader's later position.
 * Returns true only for that first fresh reload selection, even if native scroll
 * restoration had already put the browser below the hero before hydration.
 */
export function prepareHomeFreshEntry(win = browserWindow()): boolean {
  if (!win || entryPrepared.has(win.document)) return false;
  entryPrepared.add(win.document);
  if (!restoreState(win).freshReload) return false;
  const previous = win.history.scrollRestoration;
  win.history.scrollRestoration = "manual";
  scrollHomeImmediately(win, 0);
  const release = () => {
    win.removeEventListener("load", release);
    if (win.history.scrollRestoration === "manual") win.history.scrollRestoration = previous;
  };
  // When hydration precedes load, suppress the browser's late native replay.
  // This document-boot listener removes itself; it never resets scroll on load.
  if (win.document.readyState === "complete") release();
  else win.addEventListener("load", release, { once: true });
  return true;
}

/** One HOME/document mount; cleanup is safe to call repeatedly. No content is rendered or hidden. */
export function mountHomeNavigation(options: HomeNavigationOptions = {}): () => void {
  const win = options.window ?? browserWindow();
  if (!win || !homePath(win.location.pathname)) return () => {};
  const doc = win.document;
  mounts.get(doc)?.();
  let state = restoreState(win), disposed = false, suspended = false;
  let path = win.location.pathname + win.location.search;
  let entryId = homeHistoryId(win.history.state) ?? win.crypto.randomUUID();
  let checkpoint = homeCheckpointFromState(win.history.state, safeRead(win, HOME_POSITIONS_KEY), path, Date.now());
  let raf: number | null = null, captureTimer: number | null = null;
  let signature = "", stable = 0, fontsReady = !doc.fonts;
  let previousRestoration: ScrollRestoration | null = null;

  const root = () => options.root ?? doc.querySelector<HTMLElement>("[data-journey-root]");
  const journey = () => {
    const element = root();
    return element?.matches("[data-journey-root]") ? element : element?.querySelector<HTMLElement>("[data-journey-root]");
  };
  const geometry = (): HomeGeometry | null => {
    if (options.getGeometry) {
      const value = options.getGeometry();
      return isHomeGeometry(value) ? value : null;
    }
    const element = journey(), chapter = element?.querySelector<HTMLElement>(".glasses-chapter");
    if (!element?.hasAttribute("data-enhanced") || !chapter || element.querySelector(".experience.is-reduced")) return null;
    const value = {
      start: chapter.getBoundingClientRect().top + win.scrollY,
      distance: Number.parseFloat(win.getComputedStyle(element).getPropertyValue("--journey-distance")),
      heroInput: 100 / (win.innerWidth <= 700 ? 5.8 : 6.8),
    };
    return isHomeGeometry(value) ? value : null;
  };
  const displayedFrame = (): JourneyFrame | null => {
    if (options.getFrame) return options.getFrame();
    const stage = root()?.querySelector<HTMLElement>("#top");
    if (!stage?.dataset.storyTime || !stage.dataset.openingTime) return null;
    const time = Number(stage.dataset.storyTime), openingTime = Number(stage.dataset.openingTime);
    return Number.isFinite(time) && Number.isFinite(openingTime)
      ? { time, openingTime, progress: (time + openingTime) / 740 } : null;
  };
  const position = (): HomePosition | null => {
    const reading = options.getPosition?.();
    if (isHomePosition(reading)) return reading;
    const measured = geometry();
    return measured ? captureHomePosition(win.scrollY, measured, displayedFrame()) : null;
  };
  const isCurrentHome = () => homePath(win.location.pathname) !== null &&
    win.location.pathname + win.location.search === path && !!root()?.isConnected;
  const status = (value: "pending" | "ready") => { const element = root(); if (element) element.dataset.homeNavigation = value; };
  const claimHistory = () => {
    if (previousRestoration === null && state.intent?.position && !state.applied) {
      previousRestoration = win.history.scrollRestoration;
      win.history.scrollRestoration = "manual";
    }
  };
  const releaseHistory = () => {
    if (previousRestoration !== null) {
      if (win.history.scrollRestoration === "manual") win.history.scrollRestoration = previousRestoration;
      previousRestoration = null;
    }
  };
  const save = (force = false, restored?: HomePosition, storageOnly = false) => {
    if (disposed || suspended || !root()?.isConnected || (!storageOnly && !isCurrentHome()) || (state.intent && !state.applied && !restored)) return;
    const current = restored ?? position();
    if (!current) return;
    if (!force && checkpoint && checkpoint.position.section === current.section &&
      Math.abs(checkpoint.position.progress - current.progress) < 0.002) return;
    const next: HomeCheckpoint = {
      version: 1, id: entryId, path, created: Date.now(), position: current,
      scrollY: Math.max(0, win.scrollY),
      ...(checkpoint?.workQuery ? { workQuery: checkpoint.workQuery } : {}),
      ...(restored && state.intent?.kind === "work-query" ? { workQuery: state.intent.slug } : {}),
    };
    checkpoint = next;
    const visited = visitedEntries.get(doc) ?? new Map<string, string>();
    visited.delete(next.id); visited.set(next.id, next.path);
    if (visited.size > HOME_HISTORY_LIMIT) visited.delete(visited.keys().next().value!);
    visitedEntries.set(doc, visited);
    safeWrite(win, HOME_POSITIONS_KEY, serializeHomeCheckpoints(safeRead(win, HOME_POSITIONS_KEY), next));
    if (!storageOnly) {
      const old = win.history.state;
      // Preserve all app/Next fields; only our namespaced checkpoint changes.
      try { win.history.replaceState({ ...(old && typeof old === "object" ? old : {}), [HOME_HISTORY_STATE_KEY]: next }, ""); } catch { /* Storage/native fallback remains. */ }
      state.key = currentKey(win);
    }
  };
  const queueCapture = () => {
    if (disposed || suspended || captureTimer !== null) return;
    captureTimer = win.setTimeout(() => { captureTimer = null; save(); }, 160);
  };
  const scrollInstantly = (y: number) => {
    if (options.scrollTo) { options.scrollTo(y); return; }
    scrollHomeImmediately(win, y);
  };
  const consume = () => {
    const destination = homePath(win.location.pathname)!;
    if (state.localeRaw && safeRead(win, HOME_LOCALE_RETURN_KEY) === state.localeRaw &&
      parseHomeLocaleReturn(state.localeRaw, destination, Date.now())) safeRemove(win, HOME_LOCALE_RETURN_KEY);
    if (state.workRaw && safeRead(win, HOME_WORK_RETURN_KEY) === state.workRaw &&
      parseHomeWorkReturn(state.workRaw, destination, Date.now())) safeRemove(win, HOME_WORK_RETURN_KEY);
  };

  const layoutKey = (measured: HomeGeometry | null, target: number, extent: number) => {
    // DOMRect.top + scrollY can differ by floating-point dust after a seek.
    const number = (value: number | undefined) => value === undefined ? "" : Math.round(value * 64) / 64;
    return [measured ? "pin" : "reading", number(measured?.start), number(measured?.distance),
      number(measured?.heroInput), number(target), number(extent), win.innerWidth, win.innerHeight].join(":");
  };
  const checkLayout = () => {
    raf = null;
    if (disposed || suspended || !isCurrentHome() || !fontsReady || doc.readyState !== "complete") return;
    const measured = geometry(), intent = state.intent;
    if (state.applied && !intent?.position) return;
    const readingTarget = intent?.position && options.getTarget ? options.getTarget(intent.position) : null;
    if (intent?.position && !measured && (readingTarget === null || !Number.isFinite(readingTarget))) return;
    if (!intent && !measured && !options.getPosition) return;
    const extent = Math.max(0, Math.max(doc.documentElement.scrollHeight, doc.body?.scrollHeight ?? 0) - win.innerHeight);
    const initialHistory = intent?.kind === "history" && state.layoutKey === null;
    // Source history visits select saved pixels, including after viewport changes.
    // This differs from reapplying a locale anchor within its restored mount.
    const target = initialHistory ? Math.min(intent.scrollY, extent) : intent?.position
      ? readingTarget ?? (measured ? homeScrollTarget(intent.position, measured) : null)
      : win.scrollY;
    if (target === null || !Number.isFinite(target)) return;
    // Wait for the actual document extent. Never silently clamp a footer restore
    // into an SSR/reduced layout whose long pin has not been installed yet.
    if (target < 0 || target > extent + 1) return;
    // Keep the successful semantic intent across subsequent geometry/reading
    // changes. Captures below update history checkpoints, never this anchor.
    // No current scroll, display progress, frame styles or transform is a key.
    const nextSignature = layoutKey(measured, target, extent);
    if (state.applied && state.layoutKey === nextSignature) return;
    if (state.applied) { state.applied = false; status("pending"); }
    stable = nextSignature === signature ? stable + 1 : 0;
    signature = nextSignature;
    if (stable < 2) { raf = win.requestAnimationFrame(checkLayout); return; }
    state.applied = true;
    state.layoutKey = nextSignature;
    status("ready");
    if (intent) {
      if (intent.position) scrollInstantly(target);
      // Anchor the history visit to the frame it actually restored, rather than
      // its old viewport annotation. Later scrolling cannot replace this anchor.
      const historyPosition = initialHistory ? (measured ? captureHomePosition(target, measured) : options.getPosition?.()) : null;
      if (isHomePosition(historyPosition)) {
        state.intent = { ...intent, position: historyPosition };
        const semanticTarget = options.getTarget?.(historyPosition) ?? (measured ? homeScrollTarget(historyPosition, measured) : null);
        state.layoutKey = layoutKey(measured, semanticTarget ?? target, extent);
      }
      const appliedIntent = state.intent!;
      const pinProgress = measured ? Math.max(0, Math.min(1, (target - measured.start) / measured.distance)) : null;
      const detail: HomeRestoreDetail = {
        intent: appliedIntent, position: appliedIntent.position, scrollY: target, pinProgress,
        frame: pinProgress === null ? null : frameFromProgress(pinProgress, measured?.heroInput),
      };
      // Mark complete before notifying; synchronous scroll/events cannot reapply.
      options.onRestore?.(detail);
      win.dispatchEvent(new win.CustomEvent<HomeRestoreDetail>(HOME_NAVIGATION_RESTORE_EVENT, { detail }));
      consume();
      save(true, appliedIntent.position ?? undefined);
    } else save(true);
  };
  const wake = () => {
    if (disposed || suspended) return;
    if (state.applied && !state.intent?.position) { queueCapture(); return; }
    if (raf === null) raf = win.requestAnimationFrame(checkLayout);
  };
  const resetCycle = (type: HomeNavigationType) => {
    if (!homePath(win.location.pathname)) return;
    state = restoreState(win, type, true);
    path = win.location.pathname + win.location.search;
    entryId = homeHistoryId(win.history.state) ?? win.crypto.randomUUID();
    checkpoint = homeCheckpointFromState(win.history.state, safeRead(win, HOME_POSITIONS_KEY), path, Date.now());
    signature = ""; stable = 0;
    claimHistory();
    status(state.intent ? "pending" : "ready");
    wake();
  };
  const onClick = (event: MouseEvent) => {
    if (!isCurrentHome() || !(event.target instanceof win.Element)) return;
    const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
    if (!anchor) return;
    const intent = homeLinkIntent(event, {
      href: anchor.href,
      target: anchor.getAttribute("target") ?? doc.querySelector("base[target]")?.getAttribute("target") ?? "",
      download: anchor.hasAttribute("download"), inert: !!anchor.closest("[inert]"),
    }, win.location.href);
    if (!intent) return;
    const current = position();
    if (!current) return;
    save(true, current);
    if (intent.kind === "locale") {
      safeWrite(win, HOME_LOCALE_RETURN_KEY, JSON.stringify({ version: 1, from: intent.from, to: intent.to, created: Date.now(), position: current }));
    } else {
      safeWrite(win, HOME_WORK_RETURN_KEY, JSON.stringify({
        version: 1, home: intent.home, slug: intent.slug, created: Date.now(), pending: true,
        position: current.section === "work" ? current : homeWorkPosition(intent.slug),
      }));
    }
  };
  const onScroll = () => { if (state.applied || !state.intent) queueCapture(); else wake(); };
  const onScrollEnd = () => save(true);
  const onHidden = () => { if (doc.hidden) save(true); };
  const onPageHide = () => {
    save(true);
    suspended = true;
    if (raf !== null) win.cancelAnimationFrame(raf);
    if (captureTimer !== null) win.clearTimeout(captureTimer);
    raf = captureTimer = null;
    releaseHistory();
  };
  const onPageShow = (event: PageTransitionEvent) => {
    if (event.persisted) { suspended = false; resetCycle("back_forward"); }
  };
  const onPopState = () => {
    // The browser already selected the destination state; save the outgoing
    // position under its previous ID only, never into that destination state.
    save(true, undefined, true);
    resetCycle("back_forward");
  };
  const onLayoutChange = () => { signature = ""; stable = 0; wake(); };
  const resizeObserver = typeof win.ResizeObserver === "function" ? new win.ResizeObserver(onLayoutChange) : null;
  const mutationObserver = typeof win.MutationObserver === "function" ? new win.MutationObserver(onLayoutChange) : null;
  const observed = new Set<Element>();
  for (const element of [root(), journey(), journey()?.querySelector(".experience"), doc.getElementById("identity"), doc.documentElement]) {
    if (!element || observed.has(element)) continue;
    observed.add(element);
    resizeObserver?.observe(element);
    // Observe owners only, not frame attributes or descendant transforms.
    mutationObserver?.observe(element, { attributes: true, attributeFilter: ["data-enhanced", "class", "style"] });
  }
  doc.addEventListener("click", onClick, true);
  win.addEventListener("scroll", onScroll, { passive: true });
  win.addEventListener("scrollend", onScrollEnd);
  win.addEventListener("resize", onLayoutChange, { passive: true });
  win.addEventListener(HOME_NAVIGATION_READY_EVENT, onLayoutChange);
  // Next's earlier bubble listener can synchronously unmount this HOME root.
  // Select the destination before that teardown can remove our listener.
  win.addEventListener("popstate", onPopState, true);
  win.addEventListener("pagehide", onPageHide);
  win.addEventListener("pageshow", onPageShow);
  doc.addEventListener("visibilitychange", onHidden);
  doc.addEventListener("readystatechange", wake);
  if (doc.fonts) void doc.fonts.ready.then(() => { fontsReady = true; wake(); }, () => { fontsReady = true; wake(); });
  claimHistory();
  status(state.intent && !state.applied ? "pending" : "ready");
  wake();

  const cleanup = () => {
    if (disposed) return;
    save(true);
    disposed = true;
    if (raf !== null) win.cancelAnimationFrame(raf);
    if (captureTimer !== null) win.clearTimeout(captureTimer);
    resizeObserver?.disconnect(); mutationObserver?.disconnect();
    doc.removeEventListener("click", onClick, true);
    win.removeEventListener("scroll", onScroll);
    win.removeEventListener("scrollend", onScrollEnd);
    win.removeEventListener("resize", onLayoutChange);
    win.removeEventListener(HOME_NAVIGATION_READY_EVENT, onLayoutChange);
    win.removeEventListener("popstate", onPopState, true);
    win.removeEventListener("pagehide", onPageHide);
    win.removeEventListener("pageshow", onPageShow);
    doc.removeEventListener("visibilitychange", onHidden);
    doc.removeEventListener("readystatechange", wake);
    releaseHistory();
    const element = root(); if (element) delete element.dataset.homeNavigation;
    if (mounts.get(doc) === cleanup) mounts.delete(doc);
  };
  mounts.set(doc, cleanup);
  return cleanup;
}

// Kept as a named export for consumers that only need to inspect a score target.
export { homePinProgress };
