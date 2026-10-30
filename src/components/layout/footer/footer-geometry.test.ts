import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import ts from "typescript";
import * as viewport from "@/lib/viewport-design";
import { footerInkTop, footerViewBox } from "./footer-mark";
import type * as geometry from "./footer-geometry";

type Rect = { top: number; bottom: number; width: number; height: number };

/** Fits the word in a stage `width` × `height`; `nav` are control rects in client pixels. */
function measure(width: number, height: number, { variant = "home", nav = [] as Rect[] } = {}) {
  const scale = viewport.designScale(width);
  const pixels = (value: string) => parseFloat(value) * (value.endsWith("vw") ? width / 100 : 1);
  const style = () => {
    const values: Record<string, string> = {};
    return Object.assign(values, {
      setProperty(name: string, value: string) { values[name] = value; },
      removeProperty(name: string) { delete values[name]; },
    });
  };
  const svg = { style: style() };
  const word = { querySelector: () => svg };
  const information = { offsetHeight: 90 * scale };
  const root = { dataset: { footerVariant: variant }, style: style(), offsetHeight: height, querySelector: () => information };
  const mask = { getBoundingClientRect: () => ({ width: width * 0.96 }) };
  const source = readFileSync(new URL("./footer-geometry.ts", import.meta.url), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const evaluated = { exports: {} as typeof geometry };
  const globals = {
    innerWidth: width, innerHeight: height,
    document: { querySelectorAll: () => nav.map((rect) => ({ closest: () => null, getBoundingClientRect: () => rect })) },
    getComputedStyle(element: unknown) {
      if (element === information) return { top: `${170 * scale}px` };
      return { getPropertyValue: () => `${(40 / 1920) * 100}vw` };
    },
  };
  runInContext(`(function(require,module,exports){${js}\n})`, createContext(globals))((name: string) => {
    if (name === "./footer-mark") return { footerInkTop, footerViewBox };
    if (name !== "@/lib/viewport-design") throw new Error(`Unexpected footer geometry dependency: ${name}`);
    return viewport;
  }, evaluated, evaluated.exports);
  evaluated.exports.measureFooterWord(root as unknown as HTMLElement, mask as unknown as HTMLElement, word as unknown as HTMLElement);
  const natural = (width * 0.96 * footerViewBox.height) / footerViewBox.width;
  return { root: root.style, svg: svg.style, pixels, natural, wordHeight: pixels(root.style["--footer-word-height"]) };
}

test("the fitted word publishes vw lengths that scale uniformly with width", () => {
  for (const reference of Object.values(viewport.viewportDesigns)) {
    const a = measure(reference.width, reference.height), b = measure(reference.width * 1.25, reference.height * 1.25);
    for (const key of ["--footer-word-height", "--footer-ink-top", "--footer-information-height", "--footer-nav-top", "--footer-nav-bottom"]) {
      expect(a.root[key].endsWith("vw")).toBe(true);
      expect(b.pixels(b.root[key])).toBeCloseTo(a.pixels(a.root[key]) * 1.25, 9);
    }
    expect(a.pixels(a.root["--footer-ink-top"])).toBeCloseTo(a.wordHeight * footerInkTop, 9);
  }
});

test("a short stage shrinks only the ink, never below 40%; a tall one keeps the natural fit", () => {
  for (const reference of Object.values(viewport.viewportDesigns)) {
    const tall = measure(reference.width, reference.height * 3);
    expect(tall.wordHeight).toBeCloseTo(tall.natural, 9);
    expect(tall.svg.height).toBeUndefined();
    let previous = tall.wordHeight;
    for (const share of [0.8, 0.6, 0.45, 0.3, 0.15]) {
      const short = measure(reference.width, reference.height * share);
      expect(short.wordHeight).toBeLessThanOrEqual(previous + 1e-9);
      expect(short.wordHeight).toBeGreaterThanOrEqual(0.4 * short.natural - 1e-9);
      if (short.wordHeight < short.natural - 0.5) expect(short.pixels(short.svg.height)).toBeCloseTo(short.wordHeight, 9);
      previous = short.wordHeight;
    }
    expect(previous).toBeCloseTo(0.4 * tall.natural, 9);
    // A standard footer scrolls; it never shrinks its word.
    const standard = measure(reference.width, reference.height * 0.3, { variant: "standard" });
    expect(standard.wordHeight).toBeCloseTo(standard.natural, 9);
    expect(standard.svg.height).toBeUndefined();
  }
});

test("nav controls on the stage reserve their clearance above and below the word", () => {
  const width = 1920, height = 1080, gap = viewport.designPixels(20, width);
  const clear = measure(width, height);
  const fenced = measure(width, height, {
    nav: [
      { top: 20, bottom: 60, width: 100, height: 40 },
      { top: 1000, bottom: 1040, width: 100, height: 40 },
      { top: -80, bottom: -20, width: 100, height: 60 }, // Off-screen controls do not count.
      { top: 500, bottom: 500, width: 0, height: 0 },
    ],
  });
  expect(fenced.pixels(fenced.root["--footer-nav-top"])).toBeCloseTo(60 + gap, 9);
  expect(fenced.pixels(fenced.root["--footer-nav-bottom"])).toBeCloseTo(height - 1000 + gap, 9);
  expect(clear.pixels(clear.root["--footer-nav-top"])).toBe(0);
  expect(fenced.wordHeight).toBeLessThanOrEqual(clear.wordHeight);
});
