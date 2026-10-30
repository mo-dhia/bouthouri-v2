import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import ts from "typescript";
import * as viewport from "@/lib/viewport-design";
import * as identityMark from "@/components/layout/header/identity-mark";
import type { HeroWorldPose } from "./hero-world";

class Surface extends EventTarget {
  dataset: Record<string, string> = {};
  values: Record<string, string> = {};
  attributes = new Map<string, string>();
  children: Surface[] = [];
  parent?: Surface;
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
  append(child: Surface) { child.parent = this; this.children.push(child); }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter((child) => child !== this); }
  replaceChildren() { this.children = []; }
  closest(_key: string): Surface | null { return null; }
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
    "hero-bottom", "hero-cue-entrance", "marquee-pause", "identity-loading", "identity-stage", "identity-below", "identity-track",
    "identity-choices", "identity-progress", "identity-status", "identity-continue",
  ].map((key) => [key, new Surface()]));
  for (const [key, element] of Object.entries(elements)) root.queries.set(`[data-${key}]`, element);
  const signature = new Surface(), image = new Surface(), pausePath = new Surface();
  root.queries.set("svg[class*='signature']", signature);
  elements["portrait-entrance"].queries.set("img", image);
  elements["marquee-pause"].queries.set("path", pausePath);
  const strokes = Array.from({ length: 6 }, () => new Surface());
  root.queries.set("[data-signature-stroke]", strokes);
  const stage = elements["identity-stage"], ripples = new Surface();
  const pieces = identityMark.markPieces.map((piece) => {
    const surface = new Surface();
    stage.queries.set(`[data-identity-piece="${piece}"]`, surface);
    return surface;
  });
  stage.queries.set("[data-identity-ripples]", ripples);
  const scripts = ["A", "B", "C"].map((state, index) => {
    const cell = new Surface();
    cell.dataset.identityScript = state;
    if (!index) cell.dataset.active = "true";
    return cell;
  });
  root.queries.set("[data-identity-script]", scripts);
  root.queries.set("[data-identity-choice]", [new Surface(), new Surface()]);
  const utilities = new Surface(), navLogo = new Surface(), navMark = new Surface();
  const navItems = Array.from({ length: 3 }, () => new Surface());
  const navWindows = Array.from({ length: 3 }, () => new Surface());
  utilities.queries.set("[data-hero-nav-entrance]", new Surface());
  utilities.queries.set("[data-hero-nav-item]", navItems);
  utilities.queries.set("[data-hero-nav-window]", navWindows);
  utilities.queries.set('[data-nav-context="hero"] [data-home-link] svg', navLogo);
  navLogo.queries.set("[data-logo-mark]", navMark);
  navLogo.closest = (key) => key === "[data-hero-nav-item]" ? navItems[1] : null;
  // The hero is a 100svh stage: its measured height is the physical viewport height.
  Object.defineProperty(root, "offsetHeight", { get: () => physicalHeight });
  root.rect = () => ({ top: -y, left: 0, width, height: physicalHeight });
  elements["hero-cycle"].rect = () => ({ left: 0, top: 0, width: 3000 * scale(), height: 200 * scale() });
  // A 660-unit stage drawn 330 design pixels wide; the nav wordmark at 0.1 px per unit.
  stage.rect = () => ({ left: 100 * scale(), top: 200 * scale(), width: 330 * scale(), height: 330 * scale() });
  navLogo.rect = () => ({ left: 600 * scale(), top: 40 * scale() + Number.parseFloat(navItems[1].dataset.entryY ?? "0") * width / 100, width: 176.8 * scale(), height: 32 * scale() });
  elements["copy-source"].firstChild = { nodeType: 3 };
  elements["copy-source"].textContent = "First second third";
  const window = new EventTarget(), frames = new Map<number, FrameRequestCallback>();
  let frameId = 0, removed = false, magnetDisposed = false;
  const document = Object.assign(new EventTarget(), {
    hidden: false, documentElement: new Surface(),
    fonts: { ready: new Promise<void>(() => {}) },
    querySelector: (key: string) => key === "[data-hero-utilities]" ? utilities : null,
    createElement: () => new Surface(),
    createElementNS: () => new Surface(),
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
  const sounds: string[] = [], announced: string[] = [];
  for (const type of ["identity-mark-landed", "identity-entry-complete"])
    window.addEventListener(type, (event) => announced.push(`${type} ${(event as CustomEvent<{ mark: string }>).detail.mark}`));
  let magnetBounds!: () => { start: number; end: number };
  const { mountHeroMotion } = evaluate("./hero.animate.ts", {
    "@/lib/viewport-design": viewport,
    "@/lib/scrollInteraction/scrollTrigger": { kickScroll() {} },
    "@/lib/scrollInteraction/scrollManager": { default: {
      createInstance(_key: string, update: () => void, options: { useRAF: boolean }) { expect(options.useRAF).toBe(false); callback = update; },
      removeInstance() { removed = true; },
    } },
    "@/store/uiStore": { uiStore: { getState: () => state, subscribe(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener); } } },
    "@/lib/audio/material-audio": {
      setAudioEnabled() {},
      playMarkTock(frequency: number) { sounds.push(`tock ${frequency}`); },
      playMarkSwish(duration: number) { sounds.push(`swish ${duration}`); },
    },
    "@/lib/navigation/home-navigation": { prepareHomeFreshEntry: () => false, getHomeRestoreIntent: () => undefined, HOME_NAVIGATION_RESTORE_EVENT: "home-navigation-restore" },
    "@/components/layout/header/identity-mark": identityMark,
    "./hero-world": world,
    "./hero-portrait-mask": evaluate("./hero-portrait-mask.ts", { "./hero-world": world }),
    "./hero-scroll-magnet": { createHeroScrollMagnet(options: { bounds: typeof magnetBounds }) { magnetBounds = options.bounds; return { reset() {}, step: () => false, dispose() { magnetDisposed = true; } }; } },
    "./hero-portrait": { mountHeroPortrait: () => new Promise(() => {}) },
  }) as { mountHeroMotion: (root: Surface) => () => void };
  const dispose = mountHeroMotion(root);
  return {
    root, elements, signature, navItems, navWindows, navMark, pieces, ripples, scripts, sounds, announced, state, dispose,
    pose: () => world.readHeroWorldPose(root), bounds: () => magnetBounds(),
    scroll(progress: number) { y = progress * magnetBounds().end; callback(); },
    step(ms: number) { now += ms; const pending = [...frames.values()]; frames.clear(); expect(pending.length).toBeLessThanOrEqual(1); pending.forEach((frame) => frame(now)); },
    /** Frames of at most 50 ms, the controller's delta cap. */
    run(seconds: number) { for (let left = seconds * 1000; left > 1e-6; left -= 50) this.step(Math.min(50, left)); },
    resize(nextWidth: number, nextHeight: number) { width = nextWidth; physicalHeight = nextHeight; window.dispatchEvent(new Event("resize")); },
    get clean() { return removed && magnetDisposed && !frames.size && !listeners.size; },
  };
}

const vertical = (transform: unknown, width: number) => Number(String(transform).match(/translate3d\(0,([^v]+)vw,0\)/)![1]) * width / 100;
const horizontal = (transform: unknown, width: number) => Number(String(transform).match(/translate3d\(([^v]+)vw,0,0\)/)![1]) * width / 100;

test("hero poses and native trigger span follow the physical stage and scale uniformly at reference proportions", () => {
  for (const [referenceWidth, referenceHeight, widths] of [
    [1920, 1080, [1440, 2560]], [768, 1024, [650, 1000]], [412, 915, [320, 540]],
  ] as const) {
    let reference!: HeroWorldPose;
    for (const width of [referenceWidth, ...widths]) {
      const scale = width / referenceWidth, mobile = referenceWidth <= 700;
      const h = harness(width, referenceHeight * scale);
      h.scroll(.6); h.step(100); h.step(100);
      const pose = h.pose();
      if (width === referenceWidth) reference = pose;
      expect(pose).toEqual(reference);
      expect(h.bounds().end).toBeCloseTo(referenceHeight * scale * (1 + (mobile ? .058 : .068) * 22), 10);
      const designTravel = referenceHeight * (mobile ? .62 : 1);
      expect(vertical(h.elements["hero-portrait"].style.transform, width)).toBeCloseTo(pose.portraitY * designTravel * scale, 10);
      expect(vertical(h.elements["hero-identity"].style.transform, width)).toBeCloseTo(pose.identityY * designTravel * scale, 10);
      expect(vertical(h.elements["hero-marquee"].style.transform, width)).toBeCloseTo(pose.marqueeY * designTravel * scale, 10);
      expect(h.elements["copy-lines"].children).toHaveLength(2);
      expect(h.elements["copy-lines"].children[1].style.cssText).toContain(`top:${18 / referenceWidth * 100}vw;height:${18 / referenceWidth * 100}vw`);
      // A shorter window shortens the stage, its native span and its travel; progress keeps the pose.
      h.resize(width, referenceHeight * scale / 2);
      expect(h.bounds().end).toBeCloseTo(referenceHeight * scale / 2 * (1 + (mobile ? .058 : .068) * 22), 10);
      h.scroll(.6); h.step(100); h.step(100);
      expect(h.pose()).toEqual(pose);
      expect(vertical(h.elements["hero-portrait"].style.transform, width)).toBeCloseTo(pose.portraitY * designTravel / 2 * scale, 10);
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

const flightOf = (transform: unknown, width: number) => {
  const match = String(transform).match(/translate\(-50%,-50%\) translate3d\(([^v]+)vw,([^v]+)vw,0\) scale\(([^)]+)\)/)!;
  return { x: Number(match[1]) * width / 100, y: Number(match[2]) * width / 100, scale: Number(match[3]) };
};

test("entry nav offsets, clipping and the measured flight onto the nav b scale without an extra DOM scale", () => {
  for (const [referenceWidth, widths] of [[1920, [1440]], [768, [650]], [412, [320]]] as const) {
    for (const width of [referenceWidth, ...widths]) {
      const h = harness(width, 300, true), scale = width / referenceWidth;
      h.elements["identity-continue"].dispatchEvent(new Event("click")); h.step(16);
      expect(Number.parseFloat(h.navItems[0].dataset.entryY) * width / 100).toBeCloseTo(24 * scale, 10);
      expect(Number(String(h.navItems[0].style.transform).match(/translateY\(([^v]+)vw\)/)![1]) * width / 100).toBeCloseTo(24 * scale, 10);
      expect(Number(String(h.navWindows[0].style.clipPath).match(/inset\(100% ([^v]+)vw 0%\)/)![1]) * width / 100).toBeCloseTo(-12 * scale, 10);
      expect(h.navMark.style.visibility).toBe("hidden");
      h.run(1.1);
      // Settled on ⴱ: the stage centre lands on the wordmark's mark origin,
      // (600 + 110 × 0.1, 40 + 210 × 0.1), from the stage centre (265, 365).
      const flight = flightOf(h.elements["identity-stage"].style.transform, width);
      expect(flight.x).toBeCloseTo(346 * scale, 9);
      expect(flight.y).toBeCloseTo(-304 * scale, 9);
      expect(flight.scale).toBeCloseTo(0.2, 12);
      expect(h.elements["identity-stage"].style.visibility).toBe("hidden");
      expect(h.navMark.style.visibility).toBe("");
      expect(h.announced).toEqual(["identity-mark-landed A"]);
      h.run(1.5);
      expect(h.announced).toEqual(["identity-mark-landed A", "identity-entry-complete A"]);
      h.dispose(); expect(h.clean).toBe(true);
    }
  }
});

test("resizing during entry removes the current CSS nav offset from the measured flight target", () => {
  const h = harness(768, 1024, true);
  h.elements["identity-continue"].dispatchEvent(new Event("click")); h.step(16);
  h.resize(650, 300);
  h.step(0);
  const flight = flightOf(h.elements["identity-stage"].style.transform, 650);
  expect(flight.x).toBeGreaterThan(0);
  expect(flight.y / flight.x).toBeCloseTo(-304 / 346, 10);
  h.dispose(); expect(h.clean).toBe(true);
});

test("the loader loops the three scripts with the brand book's sounds and ripples, then settles forward", () => {
  const h = harness(1920, 1080, true);
  const active = () => h.scripts.filter((cell) => cell.dataset.active).map((cell) => cell.dataset.identityScript);
  h.step(16);
  expect(active()).toEqual(["A"]);
  expect(h.pieces[2].attributes.get("transform")).toBe(identityMark.markTransform(identityMark.markStatic.A().bar));
  h.run(1.3);
  expect(h.sounds).toEqual(["swish 1.75"]);
  h.run(1.8);
  // ⴱ → b locks with a tock on D4, lights the Latin cell and ripples twice around the bowl.
  expect(h.sounds).toEqual(["swish 1.75", "tock 293.66"]);
  expect(active()).toEqual(["B"]);
  h.run(0.2);
  expect(h.ripples.children.map((ring) => ring.attributes.get("cy"))).toEqual(["50", "50"]);
  expect(h.pieces[2].attributes.get("transform")).toBe(identityMark.markTransform(identityMark.markStatic.B().bar));
  h.run(1.2);
  expect(h.ripples.children).toHaveLength(0);
  expect(h.sounds.at(-1)).toBe("swish 1.6");
  // Entering mid b → ب keeps moving forward, skips the ب rest and lands on ⴱ.
  h.elements["identity-continue"].dispatchEvent(new Event("click"));
  h.run(1.1);
  expect(h.announced).toEqual([]);
  expect(h.state.entryPhase).toBe("assembling");
  h.run(2.8);
  expect(h.sounds.slice(-2)).toEqual(["swish 1.75", "tock 196"]);
  expect(active()).toEqual(["A"]);
  expect(h.ripples.children).toHaveLength(0);
  expect(h.announced).toEqual(["identity-mark-landed A", "identity-entry-complete A"]);
  h.dispose(); expect(h.clean).toBe(true);
});

test("entering during ⴱ → b settles on the static b and lands it on the wordmark's b", () => {
  const h = harness(1920, 1080, true);
  h.run(1.5);
  h.elements["identity-continue"].dispatchEvent(new Event("click"));
  h.run(1.6);
  expect(h.announced).toEqual(["identity-mark-landed B"]);
  // The static b sits 50 units below the wordmark's: lift by 50 × 0.1 px.
  const flight = flightOf(h.elements["identity-stage"].style.transform, 1920);
  expect(flight.y).toBeCloseTo(-309, 9);
  h.run(1);
  expect(h.announced.at(-1)).toBe("identity-entry-complete B");
  h.dispose(); expect(h.clean).toBe(true);
});
