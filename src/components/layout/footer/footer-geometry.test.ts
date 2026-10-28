import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import ts from "typescript";
import { brand } from "@/config/brand";
import * as viewport from "@/lib/viewport-design";
import type * as geometry from "./footer-geometry";

function measure(width: number, actualHeight: number, restUnit = "vw", stretched = true) {
  const scale = viewport.designScale(width), reference = viewport.viewportDesign(width);
  const pixels = (value: string) => parseFloat(value) * (value.endsWith("vw") ? width / 100 : 1);
  const style = () => Object.assign({
    fontSize: "", fontWeight: "", letterSpacing: "", lineHeight: "", position: "", left: "",
    setProperty(name: string, value: string) { Object.assign(this, { [name]: value }); },
    removeProperty(name: string) { if (name === "line-height") this.lineHeight = ""; },
  }, {} as Record<string, string>);
  const word = { style: style(), textContent: brand.wordmark, get offsetHeight() { return Math.round(word.getBoundingClientRect().height); },
    querySelector: () => stretched ? ink : null,
    getBoundingClientRect: () => ({ top: 0, height: word.style.lineHeight ? pixels(word.style.lineHeight) : 0.9 * pixels(word.style.fontSize) }),
  };
  const ink = { getBoundingClientRect: () => ({
    top: pixels(word.style["--footer-ink-offset-y"]),
    height: pixels(word.style["--footer-ink-line-height"]) * Number(word.style["--footer-ink-scale-y"]),
  }) };
  const information = { offsetHeight: 90 * scale };
  const root = { dataset: { footerVariant: "home" }, style: style(), offsetHeight: reference.height * scale, querySelector: () => information };
  const mask = { getBoundingClientRect: () => ({ width: width * 0.96 }) };
  const context = {
    font: "400 100px Questrial", letterSpacing: "-3px",
    measureText(text: string) {
      const size = parseFloat(this.font.split(" ")[1]);
      return {
        width: size * text.length * 0.6 + Math.max(0, text.length - 1) * parseFloat(this.letterSpacing),
        actualBoundingBoxLeft: 0, actualBoundingBoxRight: size * text.length * 0.58,
        actualBoundingBoxAscent: size * 0.7, actualBoundingBoxDescent: size * 0.02,
        fontBoundingBoxAscent: size * 0.95, fontBoundingBoxDescent: size * 0.25,
      };
    },
  };
  const source = readFileSync(new URL("./footer-geometry.ts", import.meta.url), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const evaluated = { exports: {} as typeof geometry };
  const globals = {
    innerWidth: width, innerHeight: actualHeight, document: { querySelectorAll: () => [] },
    getComputedStyle(element: unknown) {
      if (element === word) return { fontFamily: "Questrial", fontSize: `${pixels(word.style.fontSize)}px`, letterSpacing: `${pixels(word.style.letterSpacing)}px`,
        lineHeight: `${word.getBoundingClientRect().height}px`, left: `${pixels(word.style.left)}px`,
        getPropertyValue: (name: string) => word.style[name] ?? "" };
      if (element === ink) return { lineHeight: `${pixels(word.style["--footer-ink-line-height"])}px` };
      if (element === information) return { top: `${0.35 * reference.height * scale}px` };
      return { getPropertyValue: () => restUnit === "vw" ? `${reference.height * 0.08 / reference.width * 100}vw` : "8%" };
    },
  };
  runInContext(`(function(require,module,exports){${js}\n})`, createContext(globals))((name: string) => {
    if (name === "@/config/brand") return { brand };
    if (name !== "@/lib/viewport-design") throw new Error(`Unexpected footer geometry dependency: ${name}`);
    return viewport;
  }, evaluated, evaluated.exports);
  evaluated.exports.measureFooterWord(root as unknown as HTMLElement, mask as unknown as HTMLElement, word as unknown as HTMLElement, context as unknown as CanvasRenderingContext2D);
  const boxes = evaluated.exports.footerGlyphBoxes(word as unknown as HTMLElement, context as unknown as CanvasRenderingContext2D);
  return { word, root, boxes, pixels };
}

test("measured footer CSS uses vw while DOM glyph boxes retain physical coordinates and proportional ink", () => {
  for (const reference of Object.values(viewport.viewportDesigns)) {
    const a = measure(reference.width, reference.height), b = measure(reference.width * 1.25, reference.height / 2);
    for (const key of ["fontSize", "letterSpacing", "left"] as const) {
      expect(a.word.style[key].endsWith("vw")).toBe(true);
      expect(b.pixels(b.word.style[key])).toBeCloseTo(a.pixels(a.word.style[key]) * 1.25, 9);
    }
    expect(a.root.style["--footer-word-height"].endsWith("vw")).toBe(true);
    b.boxes.forEach((box, i) => {
      for (const key of ["x", "y", "width", "height"] as const) {
        expect(box[key]).toBeCloseTo(a.boxes[i][key] * 1.25, 9);
        expect(Number.isFinite(box[key])).toBe(true);
      }
    });
    const tall = measure(reference.width, reference.height * 2), percentage = measure(reference.width, reference.height, "%");
    expect(tall.word.style).toMatchObject({ fontSize: a.word.style.fontSize, letterSpacing: a.word.style.letterSpacing, lineHeight: a.word.style.lineHeight });
    expect(percentage.boxes).toEqual(a.boxes);
  }
});

test("taller word ink keeps its fitted width and matches the reference vertical footprint", () => {
  for (const reference of Object.values(viewport.viewportDesigns)) {
    const fitted = measure(reference.width, reference.height, "vw", false);
    const tall = measure(reference.width, reference.height);
    expect(tall.word.style.fontSize).toBe(fitted.word.style.fontSize);
    expect(tall.word.style.letterSpacing).toBe(fitted.word.style.letterSpacing);
    expect(tall.word.style.left).toBe(fitted.word.style.left);
    const ratio = reference.width * 0.96 / 1843.2;
    expect(tall.word.getBoundingClientRect().height).toBeCloseTo(451.4 * ratio, 10);
    expect(Math.min(...tall.boxes.map(box => box.y))).toBeCloseTo(43.2 * ratio, 10);
    expect(Math.max(...tall.boxes.map(box => box.y + box.height))).toBeCloseTo((43.2 + 339) * ratio, 10);
    tall.boxes.forEach((box, index) => {
      expect(box.x).toBe(fitted.boxes[index].x);
      expect(box.width).toBe(fitted.boxes[index].width);
    });
    expect(Number(tall.word.style["--footer-ink-scale-y"])).toBeGreaterThan(1);
    expect(tall.word.style["--footer-ink-offset-y"].endsWith("vw")).toBe(true);
    expect(tall.word.style["--footer-ink-line-height"].endsWith("vw")).toBe(true);
  }
});
