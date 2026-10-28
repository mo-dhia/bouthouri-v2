import { afterEach, describe, expect, test } from "bun:test";
import { designHeight, designPixels, viewportDesign } from "../src/lib/viewport-design";
import { journeyGeometry } from "../src/sections/landing/3-journey/journey-geometry";
import { journeyDistance } from "../src/sections/landing/3-journey/journey-clock";
import { createHorizontalRenderer } from "../src/sections/landing/3-journey/work-renderer.js";
import { createSystemsRenderer } from "../src/sections/landing/3-journey/systems-renderer.js";
import { createWorkOrigin } from "../src/sections/landing/3-journey/work-paths.js";

const globals = ["window", "document", "innerWidth", "innerHeight", "matchMedia", "getComputedStyle"] as const;
const previous = globals.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
afterEach(() => {
  for (const [key, descriptor] of previous) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
});

function fixture(initialWidth: number, rtl: boolean) {
  const state: { width: number; physicalHeight: number } = { width: initialWidth, physicalHeight: viewportDesign(initialWidth).height };
  const nodes: Node[] = [];
  // SVG lengths are measured in viewBox units. These stand-ins exercise the
  // actual wrappers/renderer writes without a browser or replacing source math.
  class Node extends EventTarget {
    dataset: Record<string, string> = {};
    attributes = new Map<string, string>();
    singles = new Map<string, Node>();
    lists = new Map<string, Node[]>();
    style: Record<string, unknown> = {
      setProperty: (key: string, value: string) => { this.style[key] = value; },
      removeProperty: (key: string) => { delete this.style[key]; },
    };
    dir = rtl ? "rtl" : "ltr";
    inert = false;
    tabIndex = 0;
    top = 0;
    height: number = viewportDesign(initialWidth).height;
    constructor() { super(); nodes.push(this); }
    get clientWidth() { return state.width; }
    get clientHeight() { return designPixels(this.height, state.width); }
    get offsetHeight() { return this.clientHeight; }
    get offsetTop() { return designPixels(this.top, state.width); }
    getBoundingClientRect() { return { top: this.offsetTop, height: this.clientHeight, width: state.width }; }
    querySelector(selector: string): Node { return this.singles.get(selector)!; }
    querySelectorAll(selector: string): Node[] { return this.lists.get(selector) ?? []; }
    setAttribute(key: string, value: string) { this.attributes.set(key, value); }
    removeAttribute(key: string) {
      if (key === "style") for (const [key, value] of Object.entries(this.style)) {
        if (typeof value === "string") delete this.style[key];
      }
      else this.attributes.delete(key);
    }
    getTotalLength() { return 400; }
  }
  const bind = (parent: Node, selector: string) => {
    const child = new Node(); parent.singles.set(selector, child); return child;
  };
  const root = new Node(), stage = bind(root, ".stage"), work = bind(root, ".work-world");
  for (const selector of [".work-track", ".work-origin", ".work-outgoing", ".work-carry", ".work-outgoing-tip", ".work-carry-tip", ".work-carry-field"])
    bind(work, selector);
  const stroke = bind(work, ".work-stroke");
  const compositions = Array.from({ length: 4 }, (_, index) => {
    const composition = new Node();
    for (const selector of [".work-title-plane", ".work-meta-plane", ".work-index-plane", ".work-explore"])
      bind(composition, selector);
    const group = bind(stroke, `[data-stroke-project="${index}"]`);
    for (const selector of [".work-symbol-ink", ".work-symbol .work-drawing-tip", ".work-symbol-hit", ".work-connector", ".work-connector-tip"])
      bind(group, selector);
    bind(group, ".work-symbol").lists.set("path", [...group.singles.values()]);
    return composition;
  });
  work.lists.set(".work-composition", compositions);
  const systems = bind(root, ".systems-story"), svg = bind(systems, ".systems-relationships");
  svg.lists.set(".systems-main-stroke,.systems-voice-stroke", Array.from({ length: 3 }, () => new Node()));
  svg.lists.set(".systems-pen-tip", Array.from({ length: 3 }, () => new Node()));
  for (const selector of [".systems-build-copy", ".systems-human-copy", ".systems-ending"]) {
    const block = bind(systems, selector);
    block.lists.set(".systems-word", [new Node(), new Node()]);
    const caption = bind(block, ".systems-caption"); caption.top = 90; caption.height = 20;
  }
  const ending = bind(systems.querySelector(".systems-ending"), "h2"); ending.top = 100; ending.height = 100;
  for (const selector of [".systems-build-layout", ".systems-shared", ".systems-distinct", ".home-footer", ".footer-word-text", ".footer-information", ".footer-colophon"]) {
    const node = bind(systems, selector); node.top = 100; node.height = 80;
  }
  const chrome = bind(root, ".scene-footer"); chrome.top = stage.height - 80;
  root.lists.set(".scene-footer,.progress-track", [chrome, new Node()]);
  root.lists.set('[data-stroke-project="3"] .work-connector,[data-stroke-project="3"] .work-connector-tip', [new Node(), new Node()]);
  const values = {
    window: new EventTarget(), document: new EventTarget(),
    matchMedia: () => ({ matches: true }),
    getComputedStyle: () => ({ lineHeight: String(designPixels(20, state.width)) }),
  };
  for (const [key, value] of Object.entries(values)) Object.defineProperty(globalThis, key, { configurable: true, value });
  Object.defineProperty(globalThis, "innerWidth", { configurable: true, get: () => state.width });
  Object.defineProperty(globalThis, "innerHeight", { configurable: true, get: () => state.physicalHeight });
  const origin = { current: { ...createWorkOrigin(), radius: designPixels(4, state.width), ready: true } };
  const horizontal = createHorizontalRenderer(root, origin, () => rtl);
  const relationships = createSystemsRenderer(root, () => horizontal.pen);
  const snapshot = () => nodes.map((node) => ({
    attributes: [...node.attributes],
    style: Object.fromEntries(Object.entries(node.style).filter(([, value]) => typeof value === "string")),
    dataset: { ...node.dataset },
  }));
  return {
    state, horizontal, relationships, snapshot,
    resize() {
      origin.current.radius = designPixels(4, state.width);
      horizontal.resize(); relationships.resize();
    },
    dispose() { relationships.dispose(); horizontal.dispose(); },
  };
}

describe("fixed journey reference cameras", () => {
  for (const [width, height, scaled] of [[1920, 1080, 1440], [768, 1024, 640], [412, 915, 515]]) {
    test(`${width} × ${height} keeps source distance and scales one composition`, () => {
      const camera = journeyGeometry(width);
      expect([camera.width, camera.height]).toEqual([width, height]);
      expect(camera.distance).toBe(journeyDistance(height, width === 412));
      const resized = journeyGeometry(scaled, designHeight(scaled));
      expect([resized.width, resized.height]).toEqual([width, height]);
      expect(resized.distance).toBeCloseTo(camera.distance * scaled / width, 8);
      expect(resized.heroInput).toBe(camera.heroInput);
      expect(resized.compactOpening).toBe(width !== 1920);
    });
    for (const rtl of [false, true]) test(`${width} ${rtl ? "AR" : "EN"} work/systems ignore physical height and scale their SVG camera once`, () => {
      const f = fixture(width, rtl);
      try {
        for (const time of [270, 308, 413, 444, 538, 627, 714, 413, 308]) {
          f.horizontal.update(time); f.relationships.update(time);
          const before = f.snapshot();
          f.state.physicalHeight = 400;
          f.resize();
          expect(f.snapshot()).toEqual(before);
          f.state.width = scaled;
          f.state.physicalHeight = 1800;
          f.resize();
          expect(f.snapshot()).toEqual(before);
          f.state.width = width;
          f.resize();
        }
      } finally { f.dispose(); }
    });
  }
  test("tablet below the old 700px switch keeps tablet source decisions", () => {
    const tablet = journeyGeometry(640);
    expect(tablet.reference.key).toBe("tablet");
    expect(tablet.mobile).toBe(false);
    expect(tablet.heroInput).toBe(100 / 6.8);
    expect(tablet.compactOpening).toBe(true);
    expect(journeyGeometry(600).reference.key).toBe("mobile");
    expect(journeyGeometry(601).reference.key).toBe("tablet");
    expect(journeyGeometry(1024).reference.key).toBe("tablet");
    expect(journeyGeometry(1025).reference.key).toBe("desktop");
  });
});
