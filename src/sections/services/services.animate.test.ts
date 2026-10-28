import { describe, expect, test } from "bun:test";
import { mountServicesFixture } from "./test-support/services-mount";

describe("mounted Services presentation owner", () => {
  test("real opening.measure synchronous wakes retain one RAF across repeated resize/font refresh", async () => {
    const fixture = await mountServicesFixture();
    try {
      expect(fixture.stats().queued).toBe(1);
      expect(fixture.opening.dataset.readingStart).toBeDefined();
      fixture.frame(); expect(fixture.stats().queued).toBe(1);
      for (let repeat = 0; repeat < 4; repeat++) {
        const before = fixture.stats(); fixture.resize(); fixture.fontRefresh(); fixture.frame();
        expect(fixture.stats().measurements).toBe(before.measurements + 1);
        // The real opening reset/release calls wake while this frame is running.
        expect(fixture.stats().scheduledInsideFrame).toBe(before.scheduledInsideFrame + 1);
        expect(fixture.stats().queued).toBe(1);
        fixture.frame(); expect(fixture.stats().queued).toBe(1);
      }
      expect(fixture.stats().maxPending).toBe(1);
      const indexTicks = fixture.stats().indexTicks;
      for (let frame = 0; frame < 8; frame++) fixture.frame();
      expect(fixture.stats().indexTicks).toBe(indexTicks);
      fixture.menu(true); expect(fixture.stats().queued).toBe(0);
      fixture.menu(false); expect(fixture.stats().queued).toBe(1);
      fixture.stop(); expect(fixture.stats().queued).toBe(0); expect(fixture.stats().managerRemoved).toBe(true);
      expect(fixture.stats().subscribers).toBe(0); expect(fixture.stats().observersDisconnected).toBe(true);
      fixture.resize(); fixture.fontRefresh(); expect(fixture.stats().queued).toBe(0);
    } finally { fixture.restore(); }
  });

  test("a post-startup draw/context failure disposes once while entry and real gate continue", async () => {
    const fixture = await mountServicesFixture({ drawFailureAt: 2 });
    try {
      fixture.frame(); expect(fixture.stats().draws).toBe(1);
      expect(() => fixture.frame()).not.toThrow();
      expect(fixture.stats().draws).toBe(2); expect(fixture.stats().disposals).toBe(1);
      expect(fixture.canvas.hidden).toBe(true); expect(fixture.root.dataset.depthFallback).toBe("true");
      for (let frame = 0; frame < 150; frame++) fixture.frame();
      expect(fixture.hero.dataset.heroEntry).toBe("1"); expect(fixture.stats().lastHeroAction).toBe(1); expect(fixture.stats().queued).toBe(0);
      fixture.scrollTo(4500); fixture.frame(); expect(fixture.handle.disabled).toBe(false); expect(fixture.handle.hidden).toBe(false);
      fixture.press("Enter");
      for (let frame = 0; frame < 210; frame++) fixture.frame();
      expect(fixture.opening.dataset.gateState).toBe("resolved"); expect(fixture.announcement.textContent).toBe("The surface is open.");
      expect(fixture.stats().draws).toBe(2); expect(fixture.stats().disposals).toBe(1); expect(fixture.stats().maxPending).toBe(1);
    } finally { fixture.restore(); }
  });

  test("startup import/create/null/resize failures use the same fallback and preserve finite text entry", async () => {
    for (const failure of [{ importFailure: true }, { createFailure: true }, { nullRenderer: true }, { resizeFailureAt: 1 }]) {
      const fixture = await mountServicesFixture(failure);
      try {
        expect(fixture.canvas.hidden).toBe(true); expect(fixture.root.dataset.depthFallback).toBe("true");
        for (let frame = 0; frame < 150; frame++) fixture.frame();
        expect(fixture.hero.dataset.heroEntry).toBe("1"); expect(fixture.stats().lastHeroAction).toBe(1); expect(fixture.stats().draws).toBe(0); expect(fixture.stats().queued).toBe(0);
        expect(fixture.stats().disposals).toBe("resizeFailureAt" in failure ? 1 : 0);
      } finally { fixture.restore(); }
    }
  });

  test("post-startup resize failure clears the renderer even when GPU disposal also fails", async () => {
    const fixture = await mountServicesFixture({ resizeFailureAt: 2, disposalFailure: true });
    try {
      fixture.frame(); fixture.resize(); expect(() => fixture.frame()).not.toThrow();
      expect(fixture.canvas.hidden).toBe(true); expect(fixture.root.dataset.depthFallback).toBe("true"); expect(fixture.stats().disposals).toBe(1);
      for (let frame = 0; frame < 150; frame++) fixture.frame();
      expect(fixture.hero.dataset.heroEntry).toBe("1"); expect(fixture.stats().draws).toBe(1); expect(fixture.stats().queued).toBe(0);
    } finally { fixture.restore(); }
  });
});
