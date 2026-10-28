import { playMaterialSound } from "@/lib/audio/material-audio";
import { homeCheckpointFromState, homeHistoryId, HOME_POSITIONS_KEY } from "@/lib/navigation/home-navigation-state";
import { cancelHomeRouteArrival, prepareHomeRouteHistory, prepareHomeRoutePush } from "@/lib/navigation/home-navigation";
import { routeEntries, type RouteArrival } from "@/lib/navigation/route-entry";
import {
  ROUTE_ABORT_EVENT, ROUTE_COVERED_EVENT, ROUTE_HANDOFF_KEY, ROUTE_HISTORY_KEY, ROUTE_HISTORY_STATE_KEY, ROUTE_TIMING,
  parseRouteCheckpoint, parseRouteHandoff, readRoutePositions, routeDuration, routeEntryId, routeFrame, routeIntent, routePath, serializeRoutePositions,
  type RouteCheckpoint,
} from "@/lib/navigation/route-navigation-state";
import { designPixels } from "@/lib/viewport-design";

type Owner = { main: HTMLElement; inner: HTMLElement; path: string; home: boolean };
type Selection = { owner: Owner; id: string | null; path: string; scrollY: number };
type LocationSelection = { href: string; id: string | null; key: string | null };
type Transaction = {
  id: number; href: string; kind: "push" | "history" | "direct" | "locale"; started: number;
  outgoing: Owner | null; owner: Owner | null; arrival: RouteArrival<HTMLElement>; restoreY?: number;
  fonts: boolean; committed: boolean; restored: boolean; focus: boolean; activeElement: Element | null;
  origin: LocationSelection; destination: LocationSelection | null; navigationStarted: boolean;
  revealProgress: number; presentation: number;
};
type SavedEditorialRestore = Transaction & { restoreY: number };
type SuspendedRestore = { selection: LocationSelection; target: number; elapsed: number; revealProgress: number; kind: Transaction["kind"]; skip: boolean; focus: boolean; activeElement: Element | null };
const activeControllers = new WeakMap<Document, () => void>();

/** Navigation/readiness are event driven. Only finite cover/reveal owns a RAF. */
export function mountRouteSurface(surface: HTMLElement, push: (href: string) => void, prefetch: (href: string) => void = () => {}) {
  const doc = surface.ownerDocument, win = doc.defaultView!;
  activeControllers.get(doc)?.();
  const html = doc.documentElement, field = surface.querySelector<HTMLElement>("[data-route-field]")!, entries = routeEntries(doc);
  const read = (key: string) => { try { return win.sessionStorage.getItem(key); } catch { return null; } };
  const write = (key: string, value: string) => { try { win.sessionStorage.setItem(key, value); } catch { /* Optional persistence. */ } };
  const remove = (key: string) => { try { win.sessionStorage.removeItem(key); } catch { /* Optional persistence. */ } };
  let positions = readRoutePositions(read(ROUTE_HISTORY_KEY));
  let disposed = false, suspended = false, queued = false, sequence = 0, frame = 0;
  let active: Transaction | null = null, phase = "idle", selected: Selection | null = null;
  let suspendedRestore: SuspendedRestore | null = null, settleAnimation: (() => void) | null = null;
  let dimmed: { main: HTMLElement; opacity: string } | null = null, resize: ResizeObserver | null = null;
  const timers = new Set<number>();
  const prefetched = new Set<string>();
  const href = () => win.location.pathname + win.location.search + win.location.hash;
  const locationSelection = (): LocationSelection => ({
    href: href(),
    id: routePath(win.location.pathname)?.page === "home" ? homeHistoryId(win.history.state) : routeEntryId(win.history.state),
    key: (win as Window & { navigation?: { currentEntry?: { key?: string } } }).navigation?.currentEntry?.key ?? null,
  });
  const sameSelection = (expected: LocationSelection, current: LocationSelection) => {
    if (expected.href !== current.href || expected.key !== null && expected.key !== current.key || expected.id !== null && expected.id !== current.id) return false;
    // A destination HOME/page may install its identity after URL selection.
    expected.id ??= current.id; expected.key ??= current.key;
    return true;
  };
  const reduced = () => win.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ownerAt = (path: string): Owner | null => {
    const parsed = routePath(new URL(path, win.location.href).pathname);
    if (!parsed) return null;
    const main = [...doc.querySelectorAll<HTMLElement>("main[data-route-path]")].find(element => element.isConnected && element.dataset.routePath === parsed.path);
    const inner = main?.querySelector<HTMLElement>(parsed.page === "home" ? "[data-journey-root]" : parsed.page === "vision" ? "[data-vision-root]" : parsed.page === "services" ? "#services-content" : "[data-contact-content]");
    return main && inner?.isConnected ? { main, inner, path: parsed.path, home: parsed.page === "home" } : null;
  };
  const valid = (transaction: Transaction) => !disposed && !suspended && active === transaction;
  const hasSavedEditorialRestore = (transaction: Transaction | null): transaction is SavedEditorialRestore => {
    const page = transaction ? routePath(transaction.arrival.path)?.page : undefined;
    return transaction !== null && typeof transaction.restoreY === "number" && Number.isFinite(transaction.restoreY) && transaction.restoreY >= 0 && page !== undefined && page !== "home";
  };
  const editorialRestorePending = () => hasSavedEditorialRestore(active) && !active.restored && active.href === href();
  const later = (callback: () => void, delay: number) => { const timer = win.setTimeout(() => { timers.delete(timer); callback(); }, delay); timers.add(timer); };
  const setPhase = (value: string) => { phase = value; surface.dataset.phase = value; };
  const undim = () => { if (dimmed) { dimmed.main.style.opacity = dimmed.opacity; dimmed = null; } };
  const stopAnimation = () => {
    if (frame) win.cancelAnimationFrame(frame); frame = 0;
    const settle = settleAnimation; settleAnimation = null; settle?.();
  };
  const closeMenu = (owner: Owner | null, canceled = false) => {
    const shell = owner?.main.previousElementSibling;
    win.dispatchEvent(new CustomEvent(canceled ? ROUTE_ABORT_EVENT : ROUTE_COVERED_EVENT, { detail: { shell: shell?.matches("[data-portfolio-shell]") ? shell : null } }));
  };
  const identify = (owner: Owner, fresh = false): Selection => {
    let id = owner.home ? homeHistoryId(win.history.state) : routeEntryId(win.history.state);
    if (!owner.home && (fresh || !id)) {
      id = win.crypto.randomUUID();
      try { win.history.replaceState({ ...win.history.state, [ROUTE_HISTORY_STATE_KEY]: { version: 1, id } }, ""); } catch { /* In-memory selection still works. */ }
    }
    return { owner, id, path: win.location.pathname + win.location.search, scrollY: Math.max(0, win.scrollY) };
  };
  const capture = (outgoing = false) => {
    if (!selected?.owner.main.isConnected) return;
    const owner = ownerAt(href()), sameOwner = owner?.main === selected.owner.main && owner.inner === selected.owner.inner;
    const samePath = selected.path === win.location.pathname + win.location.search;
    const id = selected.owner.home ? homeHistoryId(win.history.state) : routeEntryId(win.history.state);
    // Only HOME may install a missing identity after this shell mounted. Never
    // adopt another selected entry's identity on pagehide or an outgoing capture.
    if (!outgoing && selected.id === null && selected.owner.home && samePath && sameOwner) selected.id = id;
    if (!selected.id) return;
    const live = !outgoing && !editorialRestorePending() && samePath && sameOwner && id === selected.id;
    const scrollY = live ? Math.max(0, win.scrollY) : selected.scrollY;
    selected.scrollY = scrollY;
    const checkpoint: RouteCheckpoint = { version: 1, id: selected.id, path: selected.path, created: Date.now(), scrollY };
    const serialized = serializeRoutePositions(positions, checkpoint); positions = readRoutePositions(serialized); write(ROUTE_HISTORY_KEY, serialized);
    // Never write an outgoing record into the already-selected popstate entry.
    if (live && !selected.owner.home && selected.path === win.location.pathname + win.location.search && routeEntryId(win.history.state) === selected.id) {
      try { win.history.replaceState({ ...win.history.state, [ROUTE_HISTORY_STATE_KEY]: checkpoint }, ""); } catch { /* Memory/storage retain the boundary. */ }
    }
  };
  const reset = (canceled = true) => {
    const previous = active; active = null;
    stopAnimation();
    timers.forEach(timer => win.clearTimeout(timer)); timers.clear(); resize?.disconnect(); resize = null;
    undim();
    if (previous) { entries.finish(previous.arrival, canceled); if (canceled) { cancelHomeRouteArrival(previous.href); closeMenu(previous.outgoing, true); } }
    delete html.dataset.routeBusy; delete html.dataset.routeCover; surface.dataset.active = "false"; field.style.opacity = "0"; setPhase("idle");
    try { if (surface.matches(":popover-open")) surface.hidePopover(); } catch { /* Non-popover fallback. */ }
  };
  const continueTransaction = (transaction: Transaction) => {
    if (!valid(transaction)) return false;
    const current = locationSelection();
    let matches: boolean;
    if (!transaction.navigationStarted) matches = sameSelection(transaction.origin, current);
    else if (current.href === transaction.href) {
      transaction.destination ??= current;
      matches = sameSelection(transaction.destination, current);
    } else matches = !transaction.destination && sameSelection(transaction.origin, current);
    // The origin may legitimately remain selected during our own pending push.
    // A foreign route/entry supersedes it without requiring a popstate event.
    if (!matches) reset();
    return matches;
  };
  const animate = (transaction: Transaction, revealing: boolean, complete: () => void, cancel?: () => void) => {
    const start = win.performance.now(), duration = routeDuration(win.innerWidth, reduced(), revealing);
    const from = revealing ? transaction.revealProgress : 0, presentation = transaction.presentation;
    settleAnimation = cancel ?? null;
    const tick = (now: number) => {
      if (revealing && transaction.presentation !== presentation) return;
      frame = 0; if (!continueTransaction(transaction)) return;
      const progress = Math.min(1, Math.max(0, from + (now - start) / duration)), pose = routeFrame(progress, revealing);
      if (revealing) transaction.revealProgress = progress;
      field.style.opacity = String(pose.cover);
      if (!revealing && dimmed) dimmed.main.style.opacity = String(pose.content);
      if (progress < 1) frame = win.requestAnimationFrame(tick); else { settleAnimation = null; complete(); }
    };
    tick(start);
  };
  const finish = (transaction: Transaction) => {
    if (!continueTransaction(transaction)) return;
    const owner = transaction.owner;
    const currentOwner = ownerAt(transaction.href);
    if (!owner || currentOwner?.main !== owner.main || currentOwner.inner !== owner.inner) { update(); return; }
    if (owner?.main.isConnected && href() === transaction.href) selected = identify(owner);
    reset(false);
    const focused = doc.activeElement;
    if (transaction.focus && owner?.main.isConnected && (focused === transaction.activeElement || focused === doc.body || !focused || !focused.isConnected)) {
      const target = win.scrollY < designPixels(80, win.innerWidth) ? owner.main.querySelector<HTMLElement>("h1") ?? owner.main : owner.main;
      target.setAttribute("tabindex", "-1"); target.dataset.routeFocus = "true"; target.focus({ preventScroll: true });
    }
  };
  const update = () => {
    if (disposed || suspended) return;
    const transaction = active;
    if (!transaction) { const owner = ownerAt(href()); if (owner && (!selected || selected.owner.main !== owner.main || selected.owner.inner !== owner.inner || selected.path !== win.location.pathname + win.location.search)) selected = identify(owner); return; }
    if (!continueTransaction(transaction)) return;
    if (href() !== transaction.href || phase === "covering") return;
    const owner = ownerAt(transaction.href);
    if (!owner) {
      if (phase === "revealing") { transaction.presentation++; stopAnimation(); setPhase("waiting"); transaction.restored = false; }
      return;
    }
    if (!transaction.committed) {
      transaction.committed = true; transaction.owner = owner; selected = identify(owner, transaction.kind === "push");
      if (hasSavedEditorialRestore(transaction)) selected.scrollY = transaction.restoreY;
      transaction.destination = locationSelection();
      if (!owner.home) entries.adopt(transaction.arrival, owner.inner);
      if (typeof ResizeObserver !== "undefined") { resize = new ResizeObserver(wake); resize.observe(owner.inner); }
      if (transaction.kind === "push" && !owner.home) win.scrollTo({ top: 0, behavior: "instant" });
    }
    // Replacement completion belongs to the current physical owner, even when
    // the selected entry and its final geometry happen to be identical.
    if (transaction.owner?.main !== owner.main || transaction.owner.inner !== owner.inner) {
      transaction.presentation++; stopAnimation(); setPhase("waiting");
      transaction.owner = owner; transaction.restored = false;
      selected = identify(owner);
      if (hasSavedEditorialRestore(transaction)) selected.scrollY = transaction.restoreY;
      if (!owner.home) entries.replace(transaction.arrival, owner.inner);
      resize?.disconnect(); if (resize) resize.observe(owner.inner);
    }
    if (phase !== "waiting") return;
    const expired = win.performance.now() - transaction.started >= ROUTE_TIMING.assetTimeout;
    const ready = owner.home ? owner.inner.dataset.homeNavigation === "ready" : entries.ready(owner.inner, owner.path);
    if (!expired && (!transaction.fonts || !ready)) return;
    if (transaction.kind === "direct" && win.performance.now() - transaction.started < ROUTE_TIMING.directMinimum) return;
    if (!transaction.restored && hasSavedEditorialRestore(transaction)) {
      const extent = Math.max(0, Math.max(html.scrollHeight, doc.body.scrollHeight) - win.innerHeight);
      if (transaction.restoreY > extent + 1 && !expired) return;
      win.scrollTo({ top: Math.min(transaction.restoreY, extent), behavior: "instant" }); transaction.restored = true;
      win.dispatchEvent(new Event("scroll"));
    }
    // Check the current cached visibility after history scroll restoration.
    // Held practice owners can draw entry pose zero on their existing RAF.
    if (!expired && !owner.home && !entries.assetsReady(owner.inner)) return;
    setPhase("revealing"); undim();
    const presentation = ++transaction.presentation;
    const entry = owner.home ? Promise.resolve() : entries.release(transaction.arrival, expired || reduced() || transaction.kind === "history");
    const reveal = new Promise<void>(resolve => animate(transaction, true, resolve, resolve));
    void Promise.all([entry, reveal]).then(() => { if (transaction.presentation === presentation) finish(transaction); });
  };
  function wake() { if (!queued && !disposed && !suspended) { queued = true; queueMicrotask(() => { queued = false; update(); }); } }
  const begin = (target: string, kind: Transaction["kind"], restoreY?: number, resume?: SuspendedRestore) => {
    reset();
    const origin = locationSelection(), navigationStarted = kind === "direct" || kind === "history";
    const elapsed = resume?.elapsed ?? 0;
    const transaction: Transaction = { id: ++sequence, href: target, kind, started: win.performance.now() - elapsed, outgoing: selected?.owner ?? null, owner: null, arrival: entries.claim(new URL(target, win.location.href).pathname.replace(/\/$/, ""), resume?.skip ?? kind === "history"), restoreY, fonts: !doc.fonts, committed: false, restored: false, focus: resume?.focus ?? kind !== "history", activeElement: resume ? resume.activeElement : doc.activeElement, origin, destination: navigationStarted ? { ...origin } : null, navigationStarted, revealProgress: resume?.revealProgress ?? 0, presentation: 0 };
    // Protect a saved target even before the first asynchronous owner update.
    if (hasSavedEditorialRestore(transaction) && selected?.path === win.location.pathname + win.location.search && selected.id === origin.id) selected.scrollY = transaction.restoreY;
    active = transaction; html.dataset.routeBusy = "true"; html.dataset.routeCover = "true"; surface.dataset.active = "true";
    try { surface.showPopover(); } catch { surface.removeAttribute("popover"); }
    void (doc.fonts?.ready ?? Promise.resolve()).then(() => { if (valid(transaction)) { transaction.fonts = true; wake(); } }, () => { if (valid(transaction)) { transaction.fonts = true; wake(); } });
    later(wake, Math.max(0, ROUTE_TIMING.directMinimum - elapsed));
    later(() => { if (!continueTransaction(transaction)) return; if (transaction.committed && !ownerAt(transaction.href)) reset(); else wake(); }, Math.max(0, ROUTE_TIMING.assetTimeout - elapsed));
    later(() => {
      if (!continueTransaction(transaction)) return;
      if (!transaction.committed && kind !== "locale") { reset(); win.location.assign(target); }
      else if (phase === "waiting" || phase === "revealing") { if (transaction.owner && !transaction.owner.home) entries.release(transaction.arrival, true); reset(); }
    }, Math.max(0, ROUTE_TIMING.navigationTimeout - elapsed));
    return transaction;
  };
  const warm = (target: string) => {
    if (prefetched.has(target)) return;
    prefetched.add(target); if (prefetched.size > 40) prefetched.delete(prefetched.values().next().value!);
    try { prefetch(target); } catch { prefetched.delete(target); }
  };
  const onIntent = (event: Event) => {
    if (active || !(event.target instanceof Element)) return;
    const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
    if (!anchor || anchor.closest("[inert]")) return;
    const intent = routeIntent(anchor.href, win.location.href, anchor.getAttribute("target") ?? doc.querySelector("base[target]")?.getAttribute("target") ?? "", anchor.hasAttribute("download"));
    if (intent && !intent.hard) warm(intent.href);
  };
  const onClick = (event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !(event.target instanceof Element)) return;
    const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
    if (!anchor || anchor.closest("[inert]")) return;
    const target = anchor.getAttribute("target") ?? doc.querySelector("base[target]")?.getAttribute("target") ?? "";
    const download = anchor.hasAttribute("download");
    const intent = routeIntent(anchor.href, win.location.href, target, download);
    if (!intent) {
      if (active && !download && (!target || target.toLowerCase() === "_self")) {
        try { const destination = new URL(anchor.href, win.location.href); if (destination.origin === win.location.origin && /^https?:$/.test(destination.protocol)) reset(); } catch { /* Invalid href stays native. */ }
      }
      return;
    }
    event.preventDefault(); event.stopImmediatePropagation();
    if (active) return;
    const owner = ownerAt(href()); if (owner && !selected) selected = identify(owner);
    capture(); playMaterialSound("click"); if (!intent.hard) warm(intent.href);
    const transaction = begin(intent.href, intent.hard ? "locale" : "push"); setPhase("covering");
    if (!doc.querySelector("dialog.navigation-scene[open]") && !reduced() && transaction.outgoing) dimmed = { main: transaction.outgoing.main, opacity: transaction.outgoing.main.style.opacity };
    animate(transaction, false, () => {
      if (!continueTransaction(transaction)) return;
      undim(); closeMenu(transaction.outgoing); setPhase("waiting");
      transaction.navigationStarted = true;
      if (intent.hard) { write(ROUTE_HANDOFF_KEY, JSON.stringify({ to: intent.destination.path, created: Date.now() })); win.location.assign(intent.href); return; }
      if (intent.plainHomePush) prepareHomeRoutePush(intent.href);
      try { push(intent.href); if (href() === transaction.href) transaction.destination = locationSelection(); wake(); } catch { if (continueTransaction(transaction)) { reset(); win.location.assign(intent.href); } }
    });
  };
  const onPopState = () => {
    const pending = active, current = locationSelection();
    // A synthetic/no-op pop at the still-selected origin (or pending target)
    // must not turn an owned request into another history transaction.
    if (pending && sameSelection({ ...(pending.destination ?? pending.origin) }, current)) return;
    const from = selected?.owner.path ?? ""; capture(true);
    const parsed = routePath(win.location.pathname);
    if (!parsed || win.location.hash) { reset(); const owner = ownerAt(href()); selected = owner ? identify(owner) : null; wake(); return; }
    const id = parsed.page === "home" ? homeHistoryId(win.history.state) : routeEntryId(win.history.state);
    const path = win.location.pathname + win.location.search;
    const saved = id ? parseRouteCheckpoint(positions[id], id, path) ?? parseRouteCheckpoint(win.history.state?.[ROUTE_HISTORY_STATE_KEY], id, path) : null;
    // The retained physical owner may still be the origin after another URL
    // was selected. This is a real cross-route Back, not a same-path update.
    const previousLogical = pending?.destination ?? pending?.origin;
    const pendingOriginReturn = !!saved && parsed.page !== "home" && (pending?.kind === "push" || pending?.kind === "history") && phase === "waiting" &&
      pending.navigationStarted && !pending.committed && previousLogical !== undefined && previousLogical.href !== current.href && selected?.path === path &&
      pending.outgoing?.main === selected.owner.main && pending.outgoing.inner === selected.owner.inner;
    if (selected?.owner.path === parsed.path && !pendingOriginReturn) { reset(); const owner = ownerAt(href()); selected = owner ? identify(owner) : null; wake(); return; }
    const home = parsed.page === "home" ? homeCheckpointFromState(win.history.state, read(HOME_POSITIONS_KEY), path, Date.now()) : null;
    const y = saved?.scrollY ?? home?.scrollY;
    const transaction = begin(href(), "history", y);
    if (parsed.page === "home" && id && y !== undefined) prepareHomeRouteHistory(from, win.location.href, id, y);
    field.style.opacity = "1"; setPhase("waiting"); closeMenu(transaction.outgoing); wake();
  };
  const onPageHide = () => {
    const transaction = active, currentOwner = ownerAt(href());
    let retained: SuspendedRestore | null = null;
    if (hasSavedEditorialRestore(transaction) &&
      (!transaction.restored || currentOwner?.main !== transaction.owner?.main || currentOwner?.inner !== transaction.owner?.inner) &&
      transaction.destination?.id != null && sameSelection({ ...transaction.destination }, locationSelection())) {
      retained = { selection: locationSelection(), target: transaction.restoreY, elapsed: Math.max(0, win.performance.now() - transaction.started), revealProgress: transaction.revealProgress, kind: transaction.kind, skip: transaction.arrival.skip, focus: transaction.focus, activeElement: transaction.activeElement };
    }
    capture(); closeMenu(selected?.owner ?? null, true); reset(); suspendedRestore = retained; suspended = true;
  };
  // Keep only the last native input number in memory. No persistence, geometry,
  // timers, frames or native history work occurs in this input path.
  const onScroll = () => {
    if (!selected || editorialRestorePending() || !selected.owner.main.isConnected || selected.path !== win.location.pathname + win.location.search) return;
    const id = selected.owner.home ? homeHistoryId(win.history.state) : routeEntryId(win.history.state);
    if (id !== selected.id) return;
    const owner = ownerAt(href());
    if (owner?.main === selected.owner.main && owner.inner === selected.owner.inner) selected.scrollY = Math.max(0, win.scrollY);
  };
  const onPageShow = (event: PageTransitionEvent) => {
    if (!event.persisted) return;
    suspended = false; reset();
    const retained = suspendedRestore; suspendedRestore = null;
    if (retained && !win.location.hash && sameSelection({ ...retained.selection }, locationSelection())) {
      const owner = ownerAt(href());
      if (owner) { selected = identify(owner); selected.scrollY = retained.target; }
      const transaction = begin(href(), retained.kind, retained.target, retained);
      field.style.opacity = String(routeFrame(transaction.revealProgress, true).cover); setPhase("waiting");
    } else selected = null;
    wake();
  };
  const unsubscribe = entries.subscribe(wake);
  const observer = new MutationObserver(wake);
  observer.observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-route-path", "data-home-navigation"] });
  doc.body.addEventListener("click", onClick, true);
  doc.body.addEventListener("pointerover", onIntent, { passive: true }); doc.body.addEventListener("focusin", onIntent);
  win.addEventListener("popstate", onPopState, true); win.addEventListener("pagehide", onPageHide); win.addEventListener("pageshow", onPageShow);
  win.addEventListener("scroll", onScroll, { passive: true });
  win.addEventListener("home-navigation-ready", wake); win.addEventListener("home-navigation-restore", wake);
  const initial = ownerAt(href()); if (initial) selected = identify(initial);
  const handoff = parseRouteHandoff(read(ROUTE_HANDOFF_KEY), win.location.pathname); remove(ROUTE_HANDOFF_KEY);
  if (initial && !initial.home && !win.location.hash && !entries.started(initial.inner)) {
    const navigation = win.performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const saved = selected?.id && (navigation?.type === "reload" || navigation?.type === "back_forward") ? parseRouteCheckpoint(positions[selected.id], selected.id, selected.path) ?? parseRouteCheckpoint(win.history.state?.[ROUTE_HISTORY_STATE_KEY], selected.id, selected.path) : null;
    const transaction = begin(href(), "direct", saved?.scrollY); transaction.focus = navigation?.type !== "back_forward";
    transaction.arrival.skip ||= navigation?.type === "back_forward" || !!saved;
    if (handoff) transaction.focus = true;
    field.style.opacity = "1"; setPhase("waiting"); wake();
  }
  const dispose = () => {
    if (disposed) return; reset(); suspendedRestore = null; disposed = true; observer.disconnect(); unsubscribe();
    doc.body.removeEventListener("click", onClick, true); win.removeEventListener("popstate", onPopState, true); win.removeEventListener("pagehide", onPageHide); win.removeEventListener("pageshow", onPageShow);
    doc.body.removeEventListener("pointerover", onIntent); doc.body.removeEventListener("focusin", onIntent);
    win.removeEventListener("home-navigation-ready", wake); win.removeEventListener("home-navigation-restore", wake);
    win.removeEventListener("scroll", onScroll);
    if (activeControllers.get(doc) === dispose) activeControllers.delete(doc);
  };
  activeControllers.set(doc, dispose);
  return { update: wake, dispose };
}
