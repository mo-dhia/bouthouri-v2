import { expect, test } from "bun:test";
import { mountVisionFixture as mountFixture } from "./test-support/vision-mount";

test("reduced visible arrival waits for boot and first static GPU presentation", async () => {
  const fixture = await mountFixture({ reduced: true, managed: true, holdObjectBoot: true });
  try {
    fixture.frame(); await fixture.flush();
    expect(fixture.stats().bootRequests).toBe(1);
    expect(fixture.route.readiness()).toEqual({ ready: true, registered: false, assets: false });
    expect(fixture.route.stats().readySkips).toContain(true);
    expect(fixture.route.stats().starts).toEqual([]);
    await fixture.resolveBoot();
    expect(fixture.stats().draws).toBe(0);
    expect(fixture.route.readiness()).toEqual({ ready: true, registered: false, assets: false });
    fixture.frame();
    expect(fixture.canvas.dataset.heroRendered).toBe("true");
    expect(fixture.route.readiness()).toEqual({ ready: true, registered: true, assets: true });
    expect(fixture.route.stats().presented).toBe(1);
    await fixture.route.release(); fixture.frame();
    expect(fixture.route.stats().starts).toEqual([true]);
    expect(fixture.hero.dataset.heroEntry).toBe("1");
    expect(fixture.stats().lastHeroAction).toBe(1);
    expect(fixture.stats().draws).toBe(1);
    expect(fixture.stats().queued).toBe(0); expect(fixture.stats().maxPending).toBe(1);
  } finally { fixture.restore(); }
});

test("reduced visible renderer rejection/null/draw failure retains explicit readability", async () => {
  for (const failure of ["reject", "null", "draw"] as const) {
    const fixture = await mountFixture({ reduced: true, managed: true, holdObjectBoot: true, drawFailureAt: failure === "draw" ? 1 : undefined });
    try {
      fixture.frame(); await fixture.flush();
      if (failure === "reject") await fixture.rejectBoot(); else await fixture.resolveBoot(failure === "null" ? "null" : "renderer");
      fixture.frame();
      expect(fixture.canvas.dataset.heroRendered).toBeUndefined();
      expect(fixture.route.readiness()).toEqual({ ready: true, registered: true, assets: true });
      expect(fixture.route.stats().presented).toBe(1);
      await fixture.route.release(); fixture.frame();
      expect(fixture.hero.dataset.heroEntry).toBe("1"); expect(fixture.stats().lastHeroAction).toBe(1);
      expect(fixture.stats().queued).toBe(0); expect(fixture.stats().maxPending).toBe(1);
    } finally { fixture.restore(); }
  }
});

test("physical offscreen restoration does not wait for a static draw", async () => {
  for (const placement of [{ initialScrollY: 1080 }, { heroTop: 400, physicalHeight: 300 }]) {
    const fixture = await mountFixture({ reduced: true, managed: true, holdObjectBoot: true, ...placement });
    try {
      fixture.frame(); await fixture.flush();
      expect(fixture.route.readiness()).toEqual({ ready: true, registered: true, assets: true });
      expect(fixture.stats().draws).toBe(0);
      await fixture.route.release(); fixture.frame();
      expect(fixture.route.stats().starts).toEqual([true]); expect(fixture.hero.dataset.heroEntry).toBe("1");
      expect(fixture.stats().maxPending).toBe(1);
    } finally { fixture.restore(); }
  }
});

test("canceled held boot cannot publish stale ready/presented work", async () => {
  const fixture = await mountFixture({ reduced: true, managed: true, holdObjectBoot: true });
  try {
    fixture.frame(); await fixture.flush(); expect(fixture.stats().bootRequests).toBe(1);
    fixture.stop(); const before = fixture.route.stats();
    expect(fixture.stats().bootAborted).toBe(true);
    await fixture.resolveBoot();
    expect(fixture.route.stats()).toEqual(before);
    expect(fixture.stats().draws).toBe(0); expect(fixture.stats().disposals).toBe(1);
    expect(fixture.stats().queued).toBe(0); expect(fixture.stats().managerRemoved).toBe(true);
    expect(fixture.stats().subscribers).toBe(0); expect(fixture.stats().observersDisconnected).toBe(true);
  } finally { fixture.restore(); }
});
