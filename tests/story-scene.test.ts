import { describe, expect, test } from "bun:test";
import { Matrix4, PerspectiveCamera } from "three";
import { createMaterialProtection } from "../src/sections/landing/2-story/story-material-protection";
import { projectTerminalGlyph, terminalGlyph } from "../src/sections/landing/2-story/story-text-metrics";
import { getSettledStoryOrigin } from "../src/sections/landing/2-story/story-origin";
import en from "../src/sections/landing/3-journey/journey-en.json";
import ar from "../src/sections/landing/3-journey/journey-ar.json";
import latinCoverage from "../public/assets/textures/questrial-studio-coverage.json";
import arabicCoverage from "../public/assets/textures/cairo-studio-coverage.json";

describe("shared material protection", () => {
  test("releasing either owner retains the other owner's pressure protection", () => {
    const protection = createMaterialProtection();
    protection.update({ source: "portrait", active: true, pressureScale: 0.12, influence: 0, clientX: 10, clientY: 20 });
    protection.update({ source: "footer", active: true, pressureScale: 1, influence: 0.75, clientX: 10, clientY: 20 });
    expect(protection.pressureScale).toBe(0.12);
    expect(1 - 0.62 * protection.footerInfluence).toBeCloseTo(0.535, 12);
    protection.update({ source: "portrait", active: false, pressureScale: 1, influence: 0, clientX: 0, clientY: 0 });
    expect(protection.pressureScale).toBe(1);
    expect(protection.footerInfluence).toBe(0.75);
    protection.clear();
    expect(protection.footerInfluence).toBe(0);
    expect(protection.pressureScale).toBe(1);
  });
});

describe("Ideas terminal-period handoff", () => {
  test("matches live source origins before GPU boot across locale and stage geometry", () => {
    const fixtures = [
      [392, 932, false, 0.8660067435143097, 0.5672122502866337, 2.90611074648129],
      [392, 932, true, 0.06853613482513327, 0.6120552072123379, 2.318878042143656],
      [1400, 950, false, 0.857892366197614, 0.7087184771846298, 10.390371267587605],
      [1400, 950, true, 0.16527129364224508, 0.7474329737969402, 7.3850153353333],
      // 844x390 viewport: the original object stage has a 600px minimum.
      [844, 600, false, 0.8749433619431227, 0.7087184771846298, 6.562339747950105],
      [844, 600, true, 0.149323879595268, 0.7474329737969402, 4.664220211789373],
    ] as const;
    for (const [width, height, rtl, x, y, radius] of fixtures) {
      const origin = getSettledStoryOrigin(width, height, rtl);
      expect(origin.x).toBeCloseTo(x, 14); expect(origin.y).toBeCloseTo(y, 14);
      expect(origin.radius).toBeCloseTo(radius, 12); expect(origin.ready).toBe(true);
    }
  });
  test("uses the final logical caret rather than the final visual RTL glyph", () => {
    const carets = new Float32Array(20); carets[16] = -12; carets[17] = -8;
    const dot = terminalGlyph({ glyphBounds: new Float32Array([-50, 0, -40, 10, -15.6640625, 0, -4.3359375, 4, 0, 0, 20, 10]), caretPositions: carets }, "تعمل.");
    expect(dot?.x).toBe(-10); expect(dot?.y).toBe(2); expect(dot?.radius).toBe(5);
  });
  test("stays at the same SVG origin after direct seeks past the Ideas departure", () => {
    const camera = new PerspectiveCamera(34, 392 / 932, 0.005, 60);
    camera.position.z = 10 * 0.88 / camera.aspect; camera.updateMatrixWorld();
    const dot = { x: 1, y: -0.5, radius: 0.05, minX: 0.95, maxX: 1.05 };
    const baseline = projectTerminalGlyph(dot, new Matrix4().makeTranslation(-2.12, -0.24, -0.8), camera, 0, 392);
    for (const departure of [-7, 7, -13, 13]) {
      const projected = projectTerminalGlyph(dot, new Matrix4().makeTranslation(-2.12 + departure, -0.24, -0.8), camera, departure, 392);
      expect(projected.x).toBeCloseTo(baseline.x, 14); expect(projected.y).toBeCloseTo(baseline.y, 14);
      expect(projected.radius).toBeCloseTo(baseline.radius, 12);
    }
  });
});

type Node = string | { props: Record<string, unknown>; children: Node[] };
function text(node: Node): string { return typeof node === "string" ? node : node.children.map(text).join(" "); }
function sceneCopy(node: Node): string[] {
  if (typeof node === "string") return [];
  const className = String(node.props?.className ?? "");
  if (className.includes("spatial-description") || className.includes("quiet-outlook")) return [text(node)];
  return node.children.flatMap(sceneCopy);
}
test("both locale scenes are covered by local studio fonts without CDN fallback", () => {
  for (const [node, coverage] of [[en, latinCoverage], [ar, arabicCoverage]] as const) {
    const available = new Set(coverage);
    for (const copy of sceneCopy(node as Node)) for (const character of copy) {
      if (!/\s/u.test(character)) expect(available.has(character.codePointAt(0)!)).toBe(true);
    }
  }
});
