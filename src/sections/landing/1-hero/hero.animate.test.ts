import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import ts from "typescript";
import * as viewport from "@/lib/viewport-design";
import type { HeroWorldPose } from "./hero-world";

class Surface extends EventTarget {
  dataset: Record<string, string> = {};
  values: Record<string, string> = {};
  attributes = new Map<string, string>();
  children: Surface[] = [];
  queries = new Map<string, Surface | Surface[]>();
  hidden = false;
  inert = false;
  disabled = false;
  firstChild: { nodeType: number } | null = null;
  nextElementSibling = null;
  textContent = "";
  rect = () => ({ left: 0, top: 0, width: 0, height: 0 });
  get firstElementChild() { return this.children[0] ?? null; }
  style = new Proxy({
    setProperty: (key: string, value: string) => { this.values[key] = value; },
    removeProperty: (key: string) => { delete this.values[key]; },
  } as Record<string, unknown>, {
    get: (target, key: string) => target[key] ?? this.values[key] ?? "",
    set: (_, key: string, value: string) => { this.values[key] = value; return true; },
  });
  getAttribute(key: string) { return key === "style" ? Object.keys(this.values).length ? JSON.stringify(this.values) : null : this.attributes.get(key) ?? null; }
  setAttribute(key: string, value: string) { if (key === "style") this.values = JSON.parse(value); else this.attributes.set(key, value); }
  removeAttribute(key: string) { if (key === "style") this.values = {}; else this.attributes.delete(key); }
  querySelector(key: string) { return this.queries.get(key) ?? null; }
  querySelectorAll(key: string) { return this.queries.get(key) ?? []; }
  getBoundingClientRect() { const rect = this.rect(); return { ...rect, x: rect.left, y: rect.top }; }
  getTotalLength() { return 100; }
  append(child: Surface) { this.children.push(child); }
  replaceChildren() { this.children = []; }
  closest() { return null; }
  matches() { return false; }
  focus() {}
}

/** Actual motion controller and world clock, with measured CSS frames and no GPU. */
function harness(initialWidth: number, physicalHeight: number, entry = false, locale = "en") {
  let width = initialWidth, now = 1000, y = 0, callback!: () => void;
  const scale = () => viewport.designScale(width);
  const root = new Surface(); root.dataset.locale = locale;
  const elements = Object.fromEntries([
    "identity-hero", "hero-world", "hero-portrait", "portrait-entrance", "hero-marquee", "hero-marquee-track", "hero-cycle",
    "hero-identity", "hero-copy-entrance", "hero-copy-exit", "hero-name-line", "copy-source", "copy-lines", "hero-support",
    "hero-bottom", "hero-cue-entrance", "marquee-pause", "identity-loading", "identity-anchor", "identity-mark", "identity-choices",
    "identity-progress", "identity-status", "identity-continue",
  ].map((key) => [key, new Surface()]));
  for (const [key, element] of Object.entries(elements)) root.queries.set(`[data-${key}]`, element);
  const signature = new Surface(), image = new Surface(), pausePath = new Surface();
  root.queries.set("svg[class*='signature']", signature);
  elements["portrait-entrance"].queries.set("img", image);
  elements["marquee-pause"].queries.set("path", pausePath);
  const strokes = Array.from({ length: 6 }, () => new Surface());
  root.queries.set("[data-signature-stroke]", strokes);
  for (const key of ["identity-piece", "identity-clip", "identity-material", "identity-latent"])
    root.queries.set(`[data-${key}]`, Array.from({ length: 3 }, () => new Surface()));
  root.queries.set("[data-identity-choice]", [new Surface(), new Surface()]);
  const utilities = new Surface(), navLogo = new Surface();
  const navItems = Array.from({ length: 3 }, () => new Surface());
  const navWindows = Array.from({ length: 3 }, () => new Surface());
  utilities.queries.set("[data-hero-nav-entrance]", new Surface());
  utilities.queries.set("[data-hero-nav-item]", navItems);
  utilities.queries.set("[data-hero-nav-window]", navWindows);
  utilities.queries.set('[data-nav-context="hero"] [data-home-link] svg', navLogo);
  Object.defineProperty(root, "offsetHeight", { get: () => viewport.designHeight(width) });
  root.rect = () => ({ top: -y, left: 0, width, height: viewport.designHeight(width) });
  elements["hero-cycle"].rect = () => ({ left: 0, top: 0, width: 3000 * scale(), height: 200 * scale() });
  elements["identity-anchor"].rect = () => ({ left: 100 * scale(), top: 200 * scale(), width: 280 * scale(), height: 140 * scale() });
  navLogo.rect = () => ({ left: 600 * scale(), top: 40 * scale() + Number.parseFloat(navItems[1].dataset.entryY ?? "0") * width / 100, width: 80 * scale(), height: 40 * scale() });
  elements["copy-source"].firstChild = { nodeType: 3 };
  elements["copy-source"].textContent = "First second third";
  const window = new EventTarget(), frames = new Map<number, FrameRequestCallback>();
  let frameId = 0, removed = false, magnetDisposed = false;
  const document = Object.assign(new EventTarget(), {
    hidden: false, documentElement: new Surface(),
    fonts: { ready: new Promise<void>(() => {}) },
    querySelector: (key: string) => key === "[data-hero-utilities]" ? utilities : null,
    createElement: () => new Surface(),
    createRange() {
      let start = 0;
      return { setStart(_node: unknown, value: number) { start = value; }, setEnd() {}, getBoundingClientRect: () => ({ top: (start === 0 ? 0 : start === 6 ? 1.75 : 18) * scale() }) };
    },
  });
  const context = createContext({
    window, document, Event, CustomEvent, AbortController, HTMLElement: Surface, Element: Surface,
    DOMRect: class {
      constructor(public left: number, public top: number, public width: number, public height: number) {}
      get x() { return this.left; } get y() { return this.top; }
    },
    Node: { TEXT_NODE: 3 }, location: { hash: "" }, performance: { now: () => now },
    get innerWidth() { return width; }, get innerHeight() { return physicalHeight; }, get scrollY() { return y; },
    getComputedStyle: () => ({ lineHeight: `${18 * scale()}px` }),
    requestAnimationFrame(callback: FrameRequestCallback) { const id = ++frameId; frames.set(id, callback); return id; },
    cancelAnimationFrame(id: number) { frames.delete(id); },
  });
  function evaluate(file: string, dependencies: Record<string, unknown>) {
    const source = ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    const evaluated = { exports: {} };
    runInContext(`(function(require,module,exports){${source}\n})`, context)((key: string) => {
      if (!(key in dependencies)) throw Error(`Unexpected motion dependency ${key}`);
      return dependencies[key];
    }, evaluated, evaluated.exports);
    return evaluated.exports;
  }
  const world = evaluate("./hero-world.ts", {}) as { readHeroWorldPose: (root: Surface) => HeroWorldPose };
  const state = { entryPhase: entry ? "idle" : "complete", menuOpen: false, setEntryPhase(value: string) { this.entryPhase = value; } };
  const listeners = new Set<() => void>();
  let magnetBounds!: () => { start: number; end: number };
  const { mountHeroMotion } = evaluate("./hero.animate.ts", {
    "@/lib/viewport-design": viewport,
    "@/lib/scrollInteraction/scrollTrigger": { kickScroll() {} },
    "@/lib/scrollInteraction/scrollManager": { default: {
      createInstance(_key: string, update: () => void, options: { useRAF: boolean }) { expect(options.useRAF).toBe(false); callback = update; },
      removeInstance() { removed = true; },
    } },
    "@/store/uiStore": { uiStore: { getState: () => state, subscribe(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener); } } },
    "@/lib/audio/material-audio": { setAudioEnabled() {} },
    "@/lib/navigation/home-navigation": { prepareHomeFreshEntry: () => false, getHomeRestoreIntent: () => undefined, HOME_NAVIGATION_RESTORE_EVENT: "home-navigation-restore" },
    "./hero-world": world,
    "./hero-portrait-mask": evaluate("./hero-portrait-mask.ts", { "./hero-world": world }),
    "./hero-scroll-magnet": { createHeroScrollMagnet(options: { bounds: typeof magnetBounds }) { magnetBounds = options.bounds; return { reset() {}, step: () => false, dispose() { magnetDisposed = true; } }; } },
    "./hero-portrait": { mountHeroPortrait: () => new Promise(() => {}) },
  }) as { mountHeroMotion: (root: Surface) => () => void };
  const dispose = mountHeroMotion(root);
  return {
    root, elements, signature, navItems, navWindows, dispose,
    pose: () => world.readHeroWorldPose(root), bounds: () => magnetBounds(),
    scroll(progress: number) { y = progress * magnetBounds().end; callback(); },
    step(ms: number) { now += ms; const pending = [...frames.values()]; frames.clear(); expect(pending.length).toBeLessThanOrEqual(1); pending.forEach((frame) => frame(now)); },
    resize(nextWidth: number, nextHeight: number) { width = nextWidth; physicalHeight = nextHeight; window.dispatchEvent(new Event("resize")); },
    get clean() { return removed && magnetDisposed && !frames.size && !listeners.size; },
  };
}

const vertical = (transform: unknown, width: number) => Number(String(transform).match(/translate3d\(0,([^v]+)vw,0\)/)![1]) * width / 100;
const horizontal = (transform: unknown, width: number) => Number(String(transform).match(/translate3d\(([^v]+)vw,0,0\)/)![1]) * width / 100;

test("hero poses and native trigger span retain source reference geometry and scale uniformly within each profile", () => {
  for (const [referenceWidth, referenceHeight, widths] of [
    [1920, 1080, [1440, 2560]], [768, 1024, [650, 1000]], [412, 915, [320, 540]],
  ] as const) {
    let reference!: HeroWorldPose;
    for (const width of [referenceWidth, ...widths]) {
      const h = harness(width, referenceHeight);
      h.scroll(.6); h.step(100); h.step(100);
      const pose = h.pose(), scale = width / referenceWidth, mobile = referenceWidth <= 700;
      if (width === referenceWidth) reference = pose;
      expect(pose).toEqual(reference);
      expect(h.bounds().end).toBeCloseTo(referenceHeight * scale * (1 + (mobile ? .058 : .068) * 22), 10);
      const designTravel = referenceHeight * (mobile ? .62 : 1);
      expect(vertical(h.elements["hero-portrait"].style.transform, width)).toBeCloseTo(pose.portraitY * designTravel * scale, 10);
      expect(vertical(h.elements["hero-identity"].style.transform, width)).toBeCloseTo(pose.identityY * designTravel * scale, 10);
      expect(vertical(h.elements["hero-marquee"].style.transform, width)).toBeCloseTo(pose.marqueeY * designTravel * scale, 10);
      expect(h.elements["copy-lines"].children).toHaveLength(2);
      expect(h.elements["copy-lines"].children[1].style.cssText).toContain(`top:${18 / referenceWidth * 100}vw;height:${18 / referenceWidth * 100}vw`);
      const transform = h.elements["hero-portrait"].style.transform;
      h.resize(width, referenceHeight / 2);
      expect(h.elements["hero-portrait"].style.transform).toBe(transform);
      expect(h.pose()).toEqual(pose);
      h.dispose(); expect(h.clean).toBe(true);
    }
  }
});

test("marquee speed and resize phase follow design width for both writing directions", () => {
  for (const locale of ["en", "ar"]) {
    for (const [width, scaledWidth] of [[1920, 1440], [768, 650], [412, 320]]) {
      const h = harness(width, 1000, false, locale);
      h.step(16);
      const start = horizontal(h.elements["hero-marquee-track"].style.transform, width);
      h.step(50);
      const end = horizontal(h.elements["hero-marquee-track"].style.transform, width);
      expect(end - start).toBeCloseTo((locale === "ar" ? 1 : -1) * 133 * .05, 9);
      h.resize(scaledWidth, 300); h.step(0);
      expect(horizontal(h.elements["hero-marquee-track"].style.transform, scaledWidth)).toBeCloseTo(end * scaledWidth / width, 9);
      h.dispose(); expect(h.clean).toBe(true);
    }
  }
});

test("entry nav offsets, clipping and measured logo frame scale without an extra DOM scale", () => {
  for (const [referenceWidth, widths] of [[1920, [1440]], [768, [650]], [412, [320]]] as const) {
    for (const width of [referenceWidth, ...widths]) {
      const h = harness(width, 300, true), scale = width / referenceWidth;
      h.elements["identity-continue"].dispatchEvent(new Event("click")); h.step(16);
      expect(Number.parseFloat(h.navItems[0].dataset.entryY) * width / 100).toBeCloseTo(24 * scale, 10);
      expect(Number(String(h.navItems[0].style.transform).match(/translateY\(([^v]+)vw\)/)![1]) * width / 100).toBeCloseTo(24 * scale, 10);
      expect(Number(String(h.navWindows[0].style.clipPath).match(/inset\(100% ([^v]+)vw 0%\)/)![1]) * width / 100).toBeCloseTo(-12 * scale, 10);
      expect(Number.parseFloat(h.elements["identity-mark"].style.width as string) * width / 100).toBeCloseTo(280 * scale, 10);
      expect(Number.parseFloat(h.elements["identity-mark"].style.top as string) * width / 100).toBeCloseTo(200 * scale, 10);
      h.dispose(); expect(h.clean).toBe(true);
    }
  }
});

test("resizing during entry removes the current CSS nav offset from the measured flight target", () => {
  const h = harness(768, 1024, true);
  h.elements["identity-continue"].dispatchEvent(new Event("click")); h.step(16);
  h.resize(650, 300);
  h.step(0);
  const scale = 650 / 768;
  const transform = String(h.elements["identity-mark"].style.transform);
  const coordinates = transform.match(/translate3d\(([^v]+)vw,([^v]+)vw,0\)/)!;
  const flightX = Number(coordinates[1]) * 650 / 100;
  const flightY = Number(coordinates[2]) * 650 / 100;
  expect(flightX).toBeGreaterThan(0);
  expect(flightY / flightX).toBeCloseTo((40 - 200) / (600 - 100), 10);
  expect(Number.parseFloat(h.elements["identity-mark"].style.width as string) * 650 / 100).toBeCloseTo(280 * scale, 10);
  h.dispose(); expect(h.clean).toBe(true);
});
