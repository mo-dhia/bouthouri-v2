import { homeWorkPosition, isHomePosition, isHomeWorkSlug, type HomePosition, type HomeWorkSlug } from "./home-position";

export const HOME_HISTORY_STATE_KEY = "gazzarHomeNavigation";
export const HOME_POSITIONS_KEY = "gazzar-home-positions-v1";
export const HOME_LOCALE_RETURN_KEY = "gazzar-home-locale-return-v1";
export const HOME_WORK_RETURN_KEY = "gazzar-home-work-return-v1";
export const HOME_LOCALE_MAX_AGE = 120_000;
export const HOME_WORK_MAX_AGE = 1_800_000;
export const HOME_HISTORY_LIMIT = 40;

export type HomePath = "/en" | "/ar";
export type HomeNavigationType = "navigate" | "reload" | "back_forward";
export type HomeCheckpoint = {
  version: 1; id: string; path: string; created: number; position: HomePosition;
  scrollY: number; workQuery?: HomeWorkSlug;
};
export type HomeLocaleReturn = { version: 1; from: HomePath; to: HomePath; created: number; position: HomePosition };
export type HomeWorkReturn = { version: 1; home: HomePath; slug: HomeWorkSlug; created: number; position: HomePosition; pending: true };
export type HomeRestoreIntent = {
  kind: "locale" | "work-query" | "work-return" | "history" | "reload" | "native";
  position: HomePosition | null;
  /** History visits use saved native pixels; locale/work restoration uses semantics. */
  scrollY: number;
  skipEntry: true;
  slug?: HomeWorkSlug;
};

export function homePath(path: string): HomePath | null {
  const normalized = path.replace(/\/$/, "");
  return normalized === "/en" || normalized === "/ar" ? normalized : null;
}

const object = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
const parse = (raw: string | null): unknown => { try { return JSON.parse(raw ?? "null"); } catch { return null; } };
const validAge = (created: unknown, now: number, maxAge = Infinity): created is number =>
  typeof created === "number" && Number.isFinite(created) && created <= now && now - created <= maxAge;

export function parseHomeLocaleReturn(raw: string | null, destination: HomePath, now: number): HomeLocaleReturn | null {
  const value = object(parse(raw));
  if (!value || value.version !== 1 || value.to !== destination ||
    typeof value.from !== "string" || homePath(value.from) !== value.from || value.from === value.to ||
    !validAge(value.created, now, HOME_LOCALE_MAX_AGE) || !isHomePosition(value.position)) return null;
  return value as HomeLocaleReturn;
}

export function parseHomeWorkReturn(raw: string | null, destination: HomePath, now: number): HomeWorkReturn | null {
  const value = object(parse(raw));
  if (!value || value.version !== 1 || value.home !== destination || value.pending !== true ||
    !isHomeWorkSlug(value.slug) || !validAge(value.created, now, HOME_WORK_MAX_AGE) ||
    !isHomePosition(value.position) || value.position.section !== "work") return null;
  return value as HomeWorkReturn;
}

export function parseHomeCheckpoint(value: unknown, path: string, now: number): HomeCheckpoint | null {
  const entry = object(value);
  if (!entry || entry.version !== 1 || typeof entry.id !== "string" || !entry.id || entry.id.length > 128 ||
    entry.path !== path || !validAge(entry.created, now) || !isHomePosition(entry.position) ||
    typeof entry.scrollY !== "number" || !Number.isFinite(entry.scrollY) || entry.scrollY < 0 ||
    (entry.workQuery !== undefined && !isHomeWorkSlug(entry.workQuery))) return null;
  return entry as HomeCheckpoint;
}

export function homeHistoryId(state: unknown): string | null {
  const entry = object(object(state)?.[HOME_HISTORY_STATE_KEY]);
  return entry?.version === 1 && typeof entry.id === "string" && entry.id.length > 0 && entry.id.length <= 128 ? entry.id : null;
}

export function homeCheckpointFromState(state: unknown, raw: string | null, path: string, now: number): HomeCheckpoint | null {
  const direct = parseHomeCheckpoint(object(state)?.[HOME_HISTORY_STATE_KEY], path, now);
  const id = homeHistoryId(state);
  const saved = id ? parseHomeCheckpoint(object(parse(raw))?.[id], path, now) : null;
  if (saved?.id === id && (!direct || saved.created > direct.created)) return saved;
  return direct;
}

export function serializeHomeCheckpoints(raw: string | null, checkpoint: HomeCheckpoint): string {
  const entries = Object.entries(object(parse(raw)) ?? {}).filter(([id, value]) => {
    const record = object(value);
    return id !== checkpoint.id && record && typeof record.path === "string" &&
      parseHomeCheckpoint(record, record.path, checkpoint.created)?.id === id;
  });
  return JSON.stringify(Object.fromEntries([...entries, [checkpoint.id, checkpoint]].slice(-HOME_HISTORY_LIMIT)));
}

export type HomeRestoreContext = {
  href: string; navigationType: HomeNavigationType; historyState: unknown;
  localeReturn: string | null; workReturn: string | null; positions: string | null;
  nativeScrollY: number; now: number;
};

/** Read-only selection: consuming belongs to the successful geometry/apply transaction. */
export function resolveHomeRestoreIntent(context: HomeRestoreContext): HomeRestoreIntent | null {
  const url = new URL(context.href), path = homePath(url.pathname);
  if (!path) return null;
  const nativeY = Math.max(0, Number.isFinite(context.nativeScrollY) ? context.nativeScrollY : 0);
  const intent = (kind: HomeRestoreIntent["kind"], position: HomePosition | null, scrollY = nativeY): HomeRestoreIntent =>
    ({ kind, position, scrollY, skipEntry: true });
  const locale = parseHomeLocaleReturn(context.localeReturn, path, context.now);
  if (locale) return intent("locale", locale.position);
  const checkpoint = homeCheckpointFromState(context.historyState, context.positions, url.pathname + url.search, context.now);
  const slug = url.searchParams.get("work");
  if (isHomeWorkSlug(slug) && checkpoint?.workQuery !== slug) return { ...intent("work-query", homeWorkPosition(slug)), slug };
  // Hash-only entries belong to the browser's anchor navigation.
  if (url.hash) return intent("native", null);
  if (context.navigationType === "back_forward" && checkpoint) return intent("history", checkpoint.position, checkpoint.scrollY);
  const work = parseHomeWorkReturn(context.workReturn, path, context.now);
  if (work) return { ...intent("work-return", work.position), slug: work.slug };
  // A plain HOME reload starts the authored entry again. Browser-restored pixels
  // and a checkpoint alone are not return intent (R5-01). A valid work query
  // retains its existing once-per-entry semantics, including later reloads.
  if (context.navigationType === "reload") {
    return isHomeWorkSlug(slug) && checkpoint ? intent("reload", checkpoint.position, checkpoint.scrollY) : null;
  }
  if (nativeY > 32 || context.navigationType === "back_forward") return intent("native", null);
  return null;
}

export type HomeClick = Pick<MouseEvent, "button" | "defaultPrevented" | "metaKey" | "ctrlKey" | "shiftKey" | "altKey">;
export type HomeLink = { href: string; target?: string; download?: boolean; inert?: boolean };
export type HomeLinkIntent = { kind: "locale"; from: HomePath; to: HomePath } | { kind: "project"; home: HomePath; slug: HomeWorkSlug };

/** Classification observes eligible native clicks. It never prevents or rewrites one. */
export function homeLinkIntent(event: HomeClick, link: HomeLink, currentHref: string): HomeLinkIntent | null {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
    link.download || link.inert || (link.target && link.target.toLowerCase() !== "_self")) return null;
  let current: URL, target: URL;
  try { current = new URL(currentHref); target = new URL(link.href, current); } catch { return null; }
  const from = homePath(current.pathname);
  if (!from || target.origin !== current.origin || !/^https?:$/.test(target.protocol)) return null;
  const to = homePath(target.pathname);
  if (to && to !== from) return { kind: "locale", from, to };
  const project = target.pathname.match(/^\/(en|ar)\/projects\/([^/]+)\/?$/);
  if (project && `/${project[1]}` === from && isHomeWorkSlug(project[2])) return { kind: "project", home: from, slug: project[2] };
  return null;
}
