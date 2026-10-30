import { describe, expect, test } from "bun:test";
import { createRouteEntryRegistry, skipPageEntry } from "../src/lib/navigation/route-entry";
import { parseRouteCheckpoint, parseRouteHandoff, readRoutePositions, routeDuration, routeFrame, routeIntent, serializeRoutePositions } from "../src/lib/navigation/route-navigation-state";

describe("shared route classification and source clock", () => {
  test("plain anchors and Links share implemented routes while native exceptions remain unclaimed", () => {
    expect(routeIntent("/en/projects", "https://local.test/en/contact")?.destination.page).toBe("projects");
    expect(routeIntent("/en/projects/360-tour", "https://local.test/en/projects")?.destination.page).toBe("projects");
    expect(routeIntent("/ar/projects/360-tour", "https://local.test/en/projects/360-tour")?.hard).toBe(true);
    expect(routeIntent("/en/services/360-tour", "https://local.test/en/projects")).toBeNull();
    expect(routeIntent("/en/contact", "https://local.test/en/vision", "_SELF")?.hard).toBe(false);
    expect(routeIntent("/ar/services", "https://local.test/en/services")?.hard).toBe(true);
    expect(routeIntent("/ar/services", "https://local.test/en/services?campaign=1")?.href).toBe("/ar/services?campaign=1");
    expect(routeIntent("/en/vision/", "https://local.test/en/contact")?.href).toBe("/en/vision");
    expect(routeIntent("/ar", "https://local.test/en")?.hard).toBe(false);
    expect(routeIntent("/en", "https://local.test/en/contact")?.plainHomePush).toBe(true);
    expect(routeIntent("/en?work=wujhat", "https://local.test/en/contact")?.plainHomePush).toBe(false);
    for (const target of ["/en/archive", "/en/vision#next", "/en/contact?different=1", "https://elsewhere.test/en/vision", "mailto:contact@bouthouri.co"]) expect(routeIntent(target, "https://local.test/en/contact")).toBeNull();
    expect(routeIntent("/en/vision", "https://local.test/en/contact", "_blank")).toBeNull();
    expect(routeIntent("/en/vision", "https://local.test/en/contact", "", true)).toBeNull();
  });
  test("uses source sine and fixed-profile duration selection", () => {
    expect(routeFrame(0)).toEqual({ cover: 0, content: 1 });
    expect(routeFrame(1).cover).toBe(1); expect(routeFrame(1).content).toBeCloseTo(.82, 12);
    expect(routeFrame(.25).cover).toBeCloseTo((1 - Math.cos(Math.PI / 4)) / 2, 12);
    expect(routeFrame(.25, true).cover + routeFrame(.25).cover).toBeCloseTo(1, 12);
    expect([1920, 768, 650, 412].map(width => routeDuration(width, false))).toEqual([300, 300, 300, 250]);
    expect(routeDuration(412, false, true)).toBe(300);
    expect(routeDuration(1920, true)).toBe(120); expect(routeDuration(1920, true, true)).toBe(130);
    expect(skipPageEntry(false, { innerWidth: 960, scrollY: 101 })).toBe(true);
    expect(skipPageEntry(false, { innerWidth: 960, scrollY: 100 })).toBe(false);
  });
  test("validates per-entry ownership and bounds persistence without sharing equal URLs", () => {
    let records: Record<string, unknown> = {};
    for (let index = 0; index < 50; index++) records = readRoutePositions(serializeRoutePositions(records, { version: 1, id: String(index), path: "/en/vision", created: 100 + index, scrollY: index * 100 }));
    expect(Object.keys(records)).toHaveLength(40);
    expect(records["0"]).toBeUndefined();
    expect(parseRouteCheckpoint(records["49"], "48", "/en/vision", 1000)).toBeNull();
    expect(parseRouteCheckpoint(records["49"], "49", "/ar/vision", 1000)).toBeNull();
    expect(parseRouteCheckpoint(records["49"], "49", "/en/vision", 148)).toBeNull();
    expect(parseRouteHandoff(JSON.stringify({ to: "/ar/contact", created: 100 }), "/ar/contact", 30099)).toBe(true);
    expect(parseRouteHandoff(JSON.stringify({ to: "/ar/contact", created: 100 }), "/ar/contact", 30100)).toBe(false);
  });
});

describe("retained physical-owner entry publication", () => {
  test("holds an early ready page, starts once and consumes remounts", async () => {
    const registry = createRouteEntryRegistry<object>(), owner = {}, starts: boolean[] = [];
    const claim = registry.claim("/en/services"); registry.adopt(claim, owner);
    const mount = registry.register(owner, "/en/services", { start: skip => { starts.push(skip); } });
    mount.ready(); mount.ready(); expect(starts).toEqual([]);
    await registry.release(claim); await registry.release(claim); expect(starts).toEqual([false]);
    registry.finish(claim); mount.dispose();
    const remount = registry.register(owner, "/en/services", { start: skip => { starts.push(skip); } }); remount.ready();
    expect(starts).toEqual([false, true]);
  });
  test("failed publisher and canceled arrival cannot replay with a late chunk", async () => {
    const registry = createRouteEntryRegistry<object>(), owner = {}, starts: boolean[] = [];
    const claim = registry.claim("/ar/contact"); registry.adopt(claim, owner);
    await registry.release(claim, true); registry.finish(claim);
    registry.register(owner, "/ar/contact", { start: skip => { starts.push(skip); } }).ready();
    expect(starts).toEqual([true]);
    const second = {}, canceled = registry.claim("/en/vision"); registry.adopt(canceled, second); registry.finish(canceled, true);
    registry.register(second, "/en/vision", { start: skip => { starts.push(skip); } }).ready();
    expect(starts).toEqual([true, true]);
  });
  test("old owner readiness does not release a connected replacement", async () => {
    const registry = createRouteEntryRegistry<object>(), old = {}, destination = {}, starts: string[] = [];
    registry.register(old, "/ar/vision", { start: () => { starts.push("old"); } }).ready();
    const claim = registry.claim("/en/vision");
    expect(registry.adopt(claim, destination)).toBe(true);
    expect(registry.adopt(claim, old)).toBe(false);
    registry.register(destination, "/en/vision", { start: skip => { starts.push(skip ? "skip" : "destination"); } }).ready();
    expect(starts).toEqual(["old"]);
    await registry.release(claim); expect(starts).toEqual(["old", "destination"]);
  });
  test("surface cancellation settles Contact's existing finite completion", async () => {
    const registry = createRouteEntryRegistry<object>(), owner = {};
    let resolve!: () => void, finished = 0;
    const claim = registry.claim("/en/contact"); registry.adopt(claim, owner);
    registry.register(owner, "/en/contact", { start: () => new Promise<void>(done => { resolve = done; }), finish: () => { finished++; resolve(); } }).ready();
    const completion = registry.release(claim); registry.finish(claim, true); await completion;
    expect(finished).toBe(1);
  });
  test("geometry readiness and successful presentation are separate without blocking autonomous entry", () => {
    const registry = createRouteEntryRegistry<object>(), owner = {};
    let presented = false, notifications = 0, starts = 0;
    registry.subscribe(() => { notifications++; });
    const registration = registry.register(owner, "/en/vision", { start: () => { starts++; }, assetsReady: () => presented });
    registration.ready();
    expect(starts).toBe(1); expect(registry.ready(owner, "/en/vision")).toBe(true); expect(registry.assetsReady(owner)).toBe(false);
    presented = true; registration.presented();
    expect(registry.assetsReady(owner)).toBe(true); expect(notifications).toBe(2);
  });
  test("reduced entry skip does not bypass a held assets predicate", async () => {
    const registry = createRouteEntryRegistry<object>(), owner = {}, starts: boolean[] = [];
    const claim = registry.claim("/en/vision"); registry.adopt(claim, owner);
    let presented = false;
    const mount = registry.register(owner, "/en/vision", { start: skip => { starts.push(skip); }, assetsReady: () => presented });
    mount.ready(true);
    expect(registry.ready(owner)).toBe(true); expect(registry.assetsReady(owner)).toBe(false); expect(starts).toEqual([]);
    await registry.release(claim); await registry.release(claim);
    expect(starts).toEqual([true]); expect(registry.assetsReady(owner)).toBe(false);
    presented = true; mount.presented(); expect(registry.assetsReady(owner)).toBe(true);
  });
  test("history and explicit release skip leave assets readiness independent", async () => {
    for (const history of [false, true]) {
      const registry = createRouteEntryRegistry<object>(), owner = {}, starts: boolean[] = [];
      const claim = registry.claim("/en/services", history); registry.adopt(claim, owner);
      registry.register(owner, "/en/services", { start: skip => { starts.push(skip); }, assetsReady: () => false }).ready();
      expect(registry.assetsReady(owner)).toBe(false);
      await registry.release(claim, !history);
      expect(starts).toEqual([true]); expect(registry.assetsReady(owner)).toBe(false);
    }
  });
  test("explicit fallback opens readability and late registration resets only assets fallback", async () => {
    const registry = createRouteEntryRegistry<object>(), owner = {}, starts: boolean[] = [];
    const claim = registry.claim("/en/vision"); registry.adopt(claim, owner);
    const first = registry.register(owner, "/en/vision", { start: skip => { starts.push(skip); }, assetsReady: () => false });
    first.ready(); expect(registry.assetsReady(owner)).toBe(false);
    registry.fallback(owner, "/en/vision");
    expect(registry.assetsReady(owner)).toBe(true); expect(starts).toEqual([true]);
    await registry.release(claim); registry.finish(claim); first.dispose();
    const late = registry.register(owner, "/en/vision", { start: skip => { starts.push(skip); }, assetsReady: () => false });
    expect(registry.assetsReady(owner)).toBe(false);
    late.ready(); late.ready(); expect(starts).toEqual([true, true]); expect(registry.assetsReady(owner)).toBe(false);
  });
  test("Contact without an assets handler and failed publisher fallback remain readable", async () => {
    const registry = createRouteEntryRegistry<object>(), contact = {}, failed = {}, starts: boolean[] = [];
    expect(registry.assetsReady(contact)).toBe(false);
    const claim = registry.claim("/en/contact"); registry.adopt(claim, contact);
    registry.register(contact, "/en/contact", { start: skip => { starts.push(skip); } }).ready(true);
    expect(registry.assetsReady(contact)).toBe(true);
    await registry.release(claim); expect(starts).toEqual([true]); registry.finish(claim);
    registry.fallback(failed, "/ar/contact");
    expect(registry.ready(failed, "/ar/contact")).toBe(true); expect(registry.assetsReady(failed)).toBe(true);
  });
});
