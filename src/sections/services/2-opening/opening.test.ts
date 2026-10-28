import { describe, expect, test } from "bun:test";
import { GatePhysics } from "./gate-physics";
import { gateSurface } from "./gate-surface";
import { glyphFlight, openingScore } from "./opening-score";
import fixtures from "./source-fixtures.json";

describe("Services source score", () => {
  test("preserves measured layer ownership, reveal bands and interaction cutoff", () => {
    for (const item of fixtures.scoreCases) {
      const actual = openingScore(item.progress, item.intro, item.hero), expected = item.expected;
      expect(actual.owner).toBe(expected.owner);
      expect(actual.intro).toEqual(expected.intro);
      expect(actual.gate).toEqual(expected.gate);
      expect(actual.glyph.owner).toBe(expected.glyph.owner);
      expect(actual.glyph.visible).toBe(expected.glyph.visible);
      expect(actual.band.visible).toBe(expected.band.visible);
      expect(actual.heroExit).toBe(expected.heroExit);
    }
  });

  test("matches independently evaluated public-source glyph paths in all profiles and both directions", () => {
    for (const item of fixtures.glyphCases) {
      const actual = glyphFlight(item.chapter, item.input), expected = item.expected;
      expect(actual.d).toBe(expected.d);
      expect(actual.transform ?? null).toBe(expected.transform ?? null);
      expect(actual.clipD).toBe(expected.clipD);
      expect(actual.textX).toBeCloseTo(expected.textX, 10);
      expect(actual.bandY).toBeCloseTo(expected.bandY, 10);
      expect(actual.area).toBeCloseTo(expected.rawArea, 10);
      expect(actual.shapeArea).toBeCloseTo(expected.shapeArea, 10);
    }
  });
});

describe("Services source gate spring", () => {
  test("matches source drag, armed release and cancelled return trajectories", () => {
    for (const item of fixtures.states) {
      const gate = new GatePhysics(); gate.begin(item.touch, { x: .52, y: .52 }); gate.pullVector(1.5, -.35, 1 / 30);
      for (let frame = 0; frame < 45; frame++) gate.advance(1 / 60);
      expect(gate.phase).toBe("armed");
      gate.release(item.cancel);
      for (let frame = 0; frame < 180; frame++) {
        gate.advance(1 / 60);
        const expected = item.snapshots.find((snapshot) => snapshot.frame === frame);
        if (!expected) continue;
        expect(String(gate.phase)).toBe(expected.phase);
        expect(gate.position.x).toBeCloseTo(expected.position.x, 10);
        expect(gate.position.y).toBeCloseTo(expected.position.y, 10);
        expect(gate.surface.x).toBeCloseTo(expected.surface.x, 10);
        expect(gate.surface.y).toBeCloseTo(expected.surface.y, 10);
        expect(gate.openingAge).toBeCloseTo(expected.openingAge, 10);
        expect(gate.line).toBeCloseTo(expected.line, 10);
      }
    }
  });

  test("retains finite aperture geometry for direct, reduced, arbitrary-direction and cancelled actions", () => {
    for (const reduced of [false, true]) for (const vector of [[1.5, -.35], [-1.2, .8], [0, 1.8], [0, 0]]) {
      const gate = new GatePhysics(); gate.reduced = reduced; gate.begin(false); gate.pullVector(vector[0], vector[1]);
      for (let frame = 0; frame < 50; frame++) gate.advance(1 / 60);
      gate.release();
      for (let frame = 0; frame < 180; frame++) { gate.advance(1 / 60); const surface = gateSurface(gate, 412, 915, 66); expect(surface.cover).not.toMatch(/NaN|Infinity/); }
      gate.openDirect(); gate.suspend(); expect(gate.phase).toBe("resolved"); gate.reset(); expect(gate.phase).toBe("idle"); expect(gate.position).toEqual({ x: 0, y: 0 });
    }
  });
});
