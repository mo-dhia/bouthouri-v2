import { frameFromProgress, type JourneyFrame } from "../../sections/landing/3-journey/journey-clock";
import {
  captureHomePosition, homePinProgress, homeScrollTarget, homeWorkPosition,
  isHomeGeometry, isHomePosition, type HomeGeometry, type HomePosition,
} from "./home-position";
import {
  HOME_HISTORY_STATE_KEY, HOME_HISTORY_LIMIT, HOME_LOCALE_RETURN_KEY, HOME_POSITIONS_KEY, HOME_WORK_RETURN_KEY,
  HOME_RETURN_KEY, HOME_HANDOFF_KEY,
  homeCheckpointFromState, homeHistoryId, homeLinkIntent, homePath, homeDocumentStartsFresh,
  parseHomeLocaleReturn, parseHomeWorkReturn, parseHomeReturn, parseHomeHandoff, resolveHomeRestoreIntent, serializeHomeCheckpoints,
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
  /** New HOME owner/locale only, after outgoing cleanup and destination intent selection. */
  onHomeChange?: () => void;
  /** Optional explicit router transaction; do not fill this from every checkpoint. */
  historyTarget?: number | null;
  window?: BrowserWindow;
};

type RestoreState = {
  key: string; intent: HomeRestoreIntent | null; applied: boolean;
  freshEntry: boolean; layoutKey: string | null;
  localeRaw: string | null; workRaw: string | null; homeRaw: string | null;
};
const states = new WeakMap<Document, RestoreState>();
const mounts = new WeakMap<Document, () => void>();
const homeOwners = new WeakMap<Document, { root: HTMLElement; path: string }>();
const entryPrepared = new WeakSet<Document>();
const visitedEntries = new WeakMap<Document, Map<string, string>>();
const retainedCheckpoints = new WeakMap<Document, Map<string, HomeCheckpoint>>();
const documentBoots = new WeakMap<Document, { fresh: boolean }>();
const safeRead = (win: BrowserWindow, key: string) => { try { return win.sessionStorage.getItem(key); } catch { return null; } };
const safeWrite = (win: BrowserWindow, key: string, value: string) => { try { win.sessionStorage.setItem(key, value); } catch { /* Native navigation still works. */ } };
const safeRemove = (win: BrowserWindow, key: string) => { try { win.sessionStorage.removeItem(key); } catch { /* Optional storage. */ } };
const currentKey = (win: BrowserWindow) => `${win.location.href}|${homeHistoryId(win.history.state) ?? ""}`;
const retainedCheckpoint = (win: BrowserWindow) => retainedCheckpoints.get(win.document)?.get(homeHistoryId(win.history.state) ?? "");

function rememberEntry(doc: Document, id: string, path: string) {
  const visited = visitedEntries.get(doc) ?? new Map<string, string>();
  visited.delete(id); visited.set(id, path);
  if (visited.size > HOME_HISTORY_LIMIT) visited.delete(visited.keys().next().value!);
  visitedEntries.set(doc, visited);
}

function browserWindow(): BrowserWindow | undefined {
  return typeof window === "undefined" ? undefined : window;
}

function navigationType(win: BrowserWindow): HomeNavigationType {
  const entry = win.performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  return entry?.type === "back_forward" || entry?.type === "reload" ? entry.type : "navigate";
}

function documentBoot(win: BrowserWindow, type?: HomeNavigationType) {
  const existing = documentBoots.get(win.document);
  if (existing) return existing;
  const timing = win.performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  const initial = new URL(timing?.name || win.location.href, win.location.href);
  const atInitialURL = initial.pathname + initial.search === win.location.pathname + win.location.search;
  const raw = safeRead(win, HOME_HANDOFF_KEY);
  const boot = { fresh: atInitialURL && homeDocumentStartsFresh(win.location.href, type ?? navigationType(win), raw, Date.now()) };
  documentBoots.set(win.document, boot);
  if (boot.fresh) {
    for (const key of [HOME_RETURN_KEY, HOME_WORK_RETURN_KEY, HOME_LOCALE_RETURN_KEY]) safeRemove(win, key);
  }
  if (atInitialURL) safeRemove(win, HOME_HANDOFF_KEY);
  return boot;
}

function restoreState(win: BrowserWindow, type?: HomeNavigationType, reset = false, historyTarget?: number | null): RestoreState {
  const key = currentKey(win), previous = states.get(win.document);
  if (!reset && previous?.key === key) return previous;
  const explicitHistory = typeof historyTarget === "number" && Number.isFinite(historyTarget) && historyTarget >= 0;
  const boot = documentBoot(win, explicitHistory ? "back_forward" : type);
  // Same-document locale pushes consume their short incoming handoff too, but
  // never repeat the head's fresh-document clearing of the outgoing HOME return.
  if (parseHomeHandoff(safeRead(win, HOME_HANDOFF_KEY), win.location.pathname, Date.now())) safeRemove(win, HOME_HANDOFF_KEY);
  const context: HomeRestoreContext = {
    href: win.location.href, navigationType: type ?? navigationType(win), historyState: win.history.state,
    localeReturn: safeRead(win, HOME_LOCALE_RETURN_KEY), workReturn: safeRead(win, HOME_WORK_RETURN_KEY),
    positions: safeRead(win, HOME_POSITIONS_KEY), homeReturn: safeRead(win, HOME_RETURN_KEY),
    retainedCheckpoint: retainedCheckpoint(win),
    nativeScrollY: boot.fresh && !previous ? 0 : win.scrollY, now: Date.now(), historyTarget,
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
    freshEntry: boot.fresh && !previous && !intent,
    localeRaw: context.localeReturn, workRaw: context.workReturn, homeRaw: context.homeReturn ?? null,
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
 * Hero's first entry selection in this document owns the ordinary fresh reset.
 * Remounts (quiet/motion, Strict Mode) never reset the reader's later position.
 * Returns true only for that first fresh document selection, even if native scroll
 * restoration had already put the browser below the hero before hydration.
 */
export function prepareHomeFreshEntry(win = browserWindow()): boolean {
  if (!win || entryPrepared.has(win.document)) return false;
  entryPrepared.add(win.document);
  if (!restoreState(win).freshEntry) return false;
  // This is document policy, not a temporary enhancement lock. Returning to
  // auto at load lets Chromium replay the outgoing pixels after hydration.
  // Keep it through HOME/controller remounts, as the source head does.
  win.history.scrollRestoration = "manual";
  scrollHomeImmediately(win, 0);
  const href = win.location.href;
  const cleanup = () => {
    win.removeEventListener("pageshow", onPageShow);
    win.removeEventListener("pagehide", cleanup);
  };
  const onPageShow = (event: PageTransitionEvent) => {
    cleanup();
    // The source repeats its fresh head reset once at initial pageshow. A late
    // hydration must not leave a listener that resets a later BFCache visit or
    // a different route that mounted in this document before load completed.
    if (!event.persisted && win.location.href === href) scrollHomeImmediately(win, 0);
  };
  win.addEventListener("pageshow", onPageShow, { once: true });
  win.addEventListener("pagehide", cleanup, { once: true });
  return true;
}

/** One HOME/document mount; cleanup is safe to call repeatedly. No content is rendered or hidden. */
export function mountHomeNavigation(options: HomeNavigationOptions = {}): () => void {
  const win = options.window ?? browserWindow();
  if (!win || !homePath(win.location.pathname)) return () => {};
  const doc = win.document;
  mounts.get(doc)?.();
  let state = restoreState(win, undefined, options.historyTarget !== undefined, options.historyTarget), disposed = false, suspended = false;
  let path = win.location.pathname + win.location.search;
  let entryId = homeHistoryId(win.history.state) ?? win.crypto.randomUUID();
  let checkpoint = homeCheckpointFromState(win.history.state, safeRead(win, HOME_POSITIONS_KEY), path, Date.now(), retainedCheckpoint(win));
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
  const writeHistory = (value: { version: 1; id: string }) => {
    // On popstate the URL/state already belong to the destination, even while
    // Next's earlier listener is still tearing down this outgoing owner.
    if (disposed || suspended || !isCurrentHome() || (homeHistoryId(win.history.state) ?? entryId) !== entryId) return;
    const old = win.history.state;
    try {
      win.history.replaceState({ ...(old && typeof old === "object" ? old : {}), [HOME_HISTORY_STATE_KEY]: value }, "");
      state.key = currentKey(win);
    } catch { /* Document memory/session storage remain usable. */ }
  };
  const prepareEntry = () => {
    if (!isCurrentHome()) return;
    // Identity precedes fonts/layout and any Next teardown. Normal captures
    // never rewrite it or call the patched native History API.
    if (!homeHistoryId(win.history.state)) writeHistory({ version: 1, id: entryId });
    rememberEntry(doc, entryId, path);
  };
  const flushHistory = () => { if (checkpoint) writeHistory(checkpoint); };
  const save = (force = false, restored?: HomePosition, outgoing = false) => {
    if (disposed || suspended || !root()?.isConnected || (!outgoing && !isCurrentHome()) || (state.intent && !state.applied && !restored)) return;
    const current = restored ?? position();
    if (!current) return;
    if (!force && checkpoint && checkpoint.position.section === current.section &&
      Math.abs(checkpoint.position.progress - current.progress) < 0.002 && checkpoint.scrollY === Math.max(0, win.scrollY)) return;
    const next: HomeCheckpoint = {
      version: 1, id: entryId, path, created: Date.now(), position: current,
      scrollY: Math.max(0, win.scrollY),
      ...(checkpoint?.workQuery ? { workQuery: checkpoint.workQuery } : {}),
      ...(restored && state.intent?.kind === "work-query" ? { workQuery: state.intent.slug } : {}),
    };
    checkpoint = next;
    rememberEntry(doc, next.id, next.path);
    const retained = retainedCheckpoints.get(doc) ?? new Map<string, HomeCheckpoint>();
    retained.delete(next.id); retained.set(next.id, next);
    if (retained.size > HOME_HISTORY_LIMIT) retained.delete(retained.keys().next().value!);
    retainedCheckpoints.set(doc, retained);
    safeWrite(win, HOME_POSITIONS_KEY, serializeHomeCheckpoints(safeRead(win, HOME_POSITIONS_KEY), next));
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
    if (state.homeRaw && safeRead(win, HOME_RETURN_KEY) === state.homeRaw &&
      parseHomeReturn(state.homeRaw, destination, Date.now())) safeRemove(win, HOME_RETURN_KEY);
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
    // With no stronger HOME/work/locale return or explicit router target, this
    // history fallback uses saved pixels. A pristine locale Back has HOME_RETURN
    // and takes the semantic branch instead (source boot c before pixel T).
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
      flushHistory();
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
    checkpoint = homeCheckpointFromState(win.history.state, safeRead(win, HOME_POSITIONS_KEY), path, Date.now(), retainedCheckpoint(win));
    signature = ""; stable = 0;
    prepareEntry();
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
    flushHistory();
    // Without the source pin, locale departure uses identity height and beyond,
    // not the reading adapter's extended section bands (which include gaps).
    // Preserve checkpoint/within-HOME capture; only this departure is different.
    let homePosition = current, localePosition = current;
    if (intent.kind === "locale" && !geometry()) {
      const height = Math.max(1, doc.getElementById("identity")?.offsetHeight ?? win.innerHeight);
      const beyond = doc.getElementById("beyond");
      const beyondTop = (beyond?.getBoundingClientRect().top ?? 0) + win.scrollY;
      homePosition = { section: "hero", progress: Math.max(0, Math.min(1, win.scrollY / height)) };
      localePosition = win.scrollY < height ? homePosition
        : { section: win.scrollY < beyondTop ? "opening" : "philosophy", progress: 0 };
    }
    const home = homePath(win.location.pathname)!;
    safeWrite(win, HOME_RETURN_KEY, JSON.stringify({ version: 1, home, created: Date.now(), position: homePosition }));
    if (intent.kind === "locale") {
      safeWrite(win, HOME_LOCALE_RETURN_KEY, JSON.stringify({ version: 1, from: intent.from, to: intent.to, created: Date.now(), position: localePosition }));
      safeWrite(win, HOME_HANDOFF_KEY, JSON.stringify({ version: 1, to: intent.to, created: Date.now() }));
    } else if (intent.kind === "project") {
      safeWrite(win, HOME_WORK_RETURN_KEY, JSON.stringify({
        version: 1, home: intent.home, slug: intent.slug, created: Date.now(), pending: true,
        position: current.section === "work" ? current : homeWorkPosition(intent.slug),
      }));
    }
  };
  const onScroll = () => { if (state.applied || !state.intent) queueCapture(); else wake(); };
  const onScrollEnd = () => save(true);
  const onHidden = () => { if (doc.hidden) { save(true); flushHistory(); } };
  const onPageHide = () => {
    save(true);
    flushHistory();
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
  prepareEntry();
  claimHistory();
  status(state.intent && !state.applied ? "pending" : "ready");

  const cleanup = () => {
    if (disposed) return;
    // Next can select another URL/entry before removing this owner. Keep the
    // outgoing capture under its own ID, without touching destination history.
    // Mode/Strict Mode remounts need no native checkpoint either.
    save(true, undefined, true);
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
  const owner = journey() ?? root();
  if (owner?.isConnected) {
    const previous = homeOwners.get(doc);
    const next = { root: owner, path: homePath(win.location.pathname)! };
    // Keep the owner across cleanup: Strict Mode and mode-controller remounts
    // reuse it. A new connected HOME or locale is a new source HOME lifetime.
    // Do this here, never on departure/popstate/cleanup: reading capture and
    // synchronous destination intent selection must precede the mode change.
    homeOwners.set(doc, next);
    if (previous && (previous.root !== next.root || previous.path !== next.path)) options.onHomeChange?.();
  }
  wake();
  return cleanup;
}

// Kept as a named export for consumers that only need to inspect a score target.
export { homePinProgress };
