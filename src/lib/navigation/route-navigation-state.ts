import { viewportDesign } from "../viewport-design";

export const ROUTE_HISTORY_KEY = "bouthouri-route-positions-v1";
export const ROUTE_HISTORY_STATE_KEY = "bouthouriRouteEntry";
export const ROUTE_HANDOFF_KEY = "bouthouri-route-handoff-v1";
export const ROUTE_COVERED_EVENT = "bouthouri-route-covered";
export const ROUTE_ABORT_EVENT = "bouthouri-route-abort";
export const ROUTE_TIMING = { cover: 300, reveal: 380, directMinimum: 160, assetTimeout: 4500, navigationTimeout: 8000 } as const;
export type RoutePath = { path: string; locale: "en" | "ar"; page: "home" | "vision" | "services" | "contact" | "projects" };
export function routePath(path: string): RoutePath | null {
  const match = path.match(/^\/(en|ar)(?:\/(vision|services|contact|projects)(?:\/(live-cursors|dial|polka-dots|heart|threejs-test|dynamic-scrollbar|rotating-gallery|paste-up|vocal-orb))?)?\/?$/);
  if (match?.[3] && match[2] !== 'projects') return null;
  return match ? { path: path.replace(/\/$/, ""), locale: match[1] as RoutePath["locale"], page: (match[2] || "home") as RoutePath["page"] } : null;
}
export function routeIntent(href: string, current: string, target = "", download = false) {
  try {
    const from = new URL(current), to = new URL(href, from), source = routePath(from.pathname), destination = routePath(to.pathname);
    if (!source || !destination || download || target && target.toLowerCase() !== "_self" || to.origin !== from.origin || !/^https?:$/.test(to.protocol) || to.hash || destination.path === source.path) return null;
    const hard = source.locale !== destination.locale && !(source.page === "home" && destination.page === "home");
    return { href: destination.path + (to.search || (hard ? from.search : "")), source, destination, hard, plainHomePush: destination.page === "home" && source.locale === destination.locale && !to.searchParams.has("work") };
  } catch { return null; }
}
export function routeFrame(progress: number, reveal = false) {
  const p = Math.max(0, Math.min(1, progress)), eased = .5 - Math.cos(Math.PI * p) / 2, cover = reveal ? 1 - eased : eased;
  return { cover, content: 1 - .18 * cover };
}
export function routeDuration(width: number, reduced: boolean, reveal = false) {
  return reduced ? reveal ? 130 : 120 : viewportDesign(width).key === "mobile" ? reveal ? 300 : 250 : reveal ? ROUTE_TIMING.reveal : ROUTE_TIMING.cover;
}
export type RouteCheckpoint = { version: 1; id: string; path: string; scrollY: number; created: number };
const object = (value: unknown): Record<string, unknown> | null => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
export function routeEntryId(state: unknown): string | null {
  const value = object(object(state)?.[ROUTE_HISTORY_STATE_KEY]);
  return value?.version === 1 && typeof value.id === "string" && value.id.length > 0 && value.id.length <= 128 ? value.id : null;
}
export function parseRouteCheckpoint(value: unknown, id: string, path: string, now = Date.now()): RouteCheckpoint | null {
  const record = object(value);
  return record?.version === 1 && record.id === id && record.path === path && typeof record.scrollY === "number" && Number.isFinite(record.scrollY) && record.scrollY >= 0 && typeof record.created === "number" && Number.isFinite(record.created) && record.created <= now ? record as RouteCheckpoint : null;
}
export function readRoutePositions(raw: string | null): Record<string, unknown> {
  try { return object(JSON.parse(raw ?? "null")) ?? {}; } catch { return {}; }
}
export function serializeRoutePositions(records: Record<string, unknown>, checkpoint: RouteCheckpoint) {
  const valid = Object.entries(records).filter(([id, value]) => { const record = object(value); return id !== checkpoint.id && typeof record?.path === "string" && parseRouteCheckpoint(record, id, record.path, checkpoint.created); });
  return JSON.stringify(Object.fromEntries([...valid, [checkpoint.id, checkpoint]].slice(-40)));
}
export function parseRouteHandoff(raw: string | null, path: string, now = Date.now()) {
  try { const record = object(JSON.parse(raw ?? "null")); return !!record && record.to === path && typeof record.created === "number" && Number.isFinite(record.created) && record.created <= now && now - record.created < 30_000; } catch { return false; }
}
