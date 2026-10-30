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
    "hero-bottom", "hero-cue-entrance", "marquee-pause", "identity-loading", "identity-stage", "identity-choices", "identity-progress", "identity-status", "identity-continue",
  ].map((key) => [key, new Surface()]));
  for (const [key, element] of Object.entries(elements)) root.queries.set(`[data-${key}]`, element);
  const signature = new Surface(), image = new Surface(), pausePath = new Surface();
  root.queries.set("svg[class*='signature']", signature);
  elements["portrait-entrance"].queries.set("img", image);
  elements["marquee-pause"].queries.set("path", pausePath);
  const strokes = Array.from({ length: 6 }, () => new Surface());
  root.queries.set("[data-signature-stroke]", strokes);
  const stage = elements["identity-stage"];
  // The ⴱ ghost, then each kit piece: its posed group, the clip that fills it and the clipped material.
  const latent = new Surface(), ripples = [new Surface(), new Surface()];
  stage.queries.set("[data-identity-latent]", latent);
  stage.queries.set("[data-identity-ripple]", ripples);
  const pieces = identityMark.markPieces.map((name) => {
    const piece = new Surface(), clip = new Surface(), material = new Surface();
    stage.queries.set(`[data-identity-piece="${name}"]`, piece);
    stage.queries.set(`[data-identity-clip="${name}"]`, clip);
    stage.queries.set(`[data-identity-material="${name}"]`, material);
    return { name, piece, clip, material };
  });
  const choices = ["quiet", "sound"].map((choice) => {
    const button = new Surface();
    button.dataset.identityChoice = choice;
    return button;
  });
  root.queries.set("[data-identity-choice]", choices);
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
  // The 320-unit square stage drawn 160 design pixels wide; the nav wordmark at 0.1 px per unit.
  stage.rect = () => ({ left: 100 * scale(), top: 200 * scale(), width: 160 * scale(), height: 160 * scale() });
  navLogo.rect = () => ({ left: 600 * scale(), top: 40 * scale() + Number.parseFloat(navItems[1].dataset.entryY ?? "0") * width / 100, width: 176.8 * scale(), height: 32 * scale() });
  elements["copy-source"].firstChild = { nodeType: 3 };
  elements["copy-source"].textContent = "First second third";
  const window = new EventTarget(), frames = new Map<number, FrameRequestCallback>();
  // Fonts and the portrait finish together when a test calls `load()`.
  let load!: () => void;
  const loaded = new Promise<void>((resolve) => { load = resolve; });
  let frameId = 0, removed = false, magnetDisposed = false;
  const document = Object.assign(new EventTarget(), {
    hidden: false, documentElement: new Surface(),
    fonts: { ready: loaded },
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
  const sounds: string[] = [], announced: string[] = [], landings: unknown[] = [];
  for (const type of ["identity-mark-landed", "identity-entry-complete"])
    window.addEventListener(type, (event) => {
      announced.push(type);
      if (type === "identity-mark-landed") landings.push((event as CustomEvent).detail);
    });
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
    },
    "@/lib/navigation/home-navigation": { prepareHomeFreshEntry: () => false, getHomeRestoreIntent: () => undefined, HOME_NAVIGATION_RESTORE_EVENT: "home-navigation-restore" },
    "@/components/layout/header/identity-mark": identityMark,
    "./hero-world": world,
    "./hero-portrait-mask": evaluate("./hero-portrait-mask.ts", { "./hero-world": world }),
    "./hero-scroll-magnet": { createHeroScrollMagnet(options: { bounds: typeof magnetBounds }) { magnetBounds = options.bounds; return { reset() {}, step: () => false, dispose() { magnetDisposed = true; } }; } },
    "./hero-portrait": { mountHeroPortrait: () => loaded.then(() => ({ measure() {}, render: () => false, reset() {}, dispose() {} })) },
  }) as { mountHeroMotion: (root: Surface) => () => void };
  const dispose = mountHeroMotion(root);
  return {
    root, elements, signature, navItems, navWindows, navMark, latent, ripples, pieces, choices, sounds, announced, landings, state, dispose,
    /** Resolves fonts and the portrait, then lets their readiness land. */
    async load() { load(); await new Promise((resolve) => setTimeout(resolve, 0)); },
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

/** The rest pose of a fully filled piece: no drift, no squash. */
const settledMaterial = (name: (typeof identityMark.markPieces)[number]) => {
  const band = identityMark.loaderBand[name], centre = band.y + band.h / 2;
  return `translate(0 ${centre.toFixed(2)}) scale(1.0000 1.0000) translate(0 ${(-centre).toFixed(2)})`;
};
const tifinagh = identityMark.markStatic.A();
const posed = (pieces: { name: (typeof identityMark.markPieces)[number]; piece: Surface }[], pose: identityMark.Pose) =>
  pieces.every(({ name, piece }) => piece.attributes.get("transform") === identityMark.markTransform(pose[name]));

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
      // The mark's origin lands on the wordmark's b: x = 600 + (100 + 10) × 0.1,
      // y = 40 + 210 × 0.1, from the stage centre (180, 280).
      const flight = flightOf(h.elements["identity-stage"].style.transform, width);
      expect(flight.x).toBeCloseTo(431 * scale, 9);
      expect(flight.y).toBeCloseTo(-219 * scale, 9);
      expect(flight.scale).toBeCloseTo(0.2, 12);
      // Bypassed at 20 %: ⴱ still filled on the way and holds, its clips open.
      expect(posed(h.pieces, tifinagh)).toBe(true);
      for (const { clip } of h.pieces) {
        expect(clip.attributes.get("y")).toBe("-480.00");
        expect(clip.attributes.get("height")).toBe("960.00");
      }
      expect(h.latent.attributes.get("opacity")).toBe("0.0000");
      expect(h.elements["identity-stage"].style.visibility).toBe("hidden");
      expect(h.navMark.style.visibility).toBe("");
      expect(h.announced).toEqual(["identity-mark-landed"]);
      const landing = h.landings[0] as { step: string; elapsed: number };
      expect(landing.step).toBe("A");
      expect(landing.elapsed).toBeGreaterThan(1050);
      expect(landing.elapsed).toBeLessThan(1200);
      expect(h.sounds).toEqual(["tock 293.66"]);
      h.run(1.5);
      expect(h.announced).toEqual(["identity-mark-landed", "identity-entry-complete"]);
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
  expect(flight.y / flight.x).toBeCloseTo(-219 / 431, 10);
  h.dispose(); expect(h.clean).toBe(true);
});

test("ⴱ fills bottom-up with the load, then reads ⴱ → b → ب with the choices and lands mid-loop", async () => {
  const h = harness(1920, 1080, true);
  const part = (name: string) => h.pieces.find((piece) => piece.name === name)!;
  h.step(16);
  h.run(1);
  // 20 % loaded: the bottom half, first, fills from its foot; the bar and top half wait as the ghost.
  expect(h.elements["identity-progress"].attributes.get("aria-valuenow")).toBe("20");
  const bottom = part("h2"), f = 0.2 * 3, filled = f * f * f * (f * (6 * f - 15) + 10);
  expect(Number(bottom.clip.attributes.get("height"))).toBeCloseTo(100.9 * filled, 2);
  expect(Number(bottom.clip.attributes.get("y"))).toBeCloseTo(100 - 100.9 * filled, 2);
  for (const name of ["bar", "h1"]) expect(part(name).clip.attributes.get("height")).toBe("0.00");
  expect(h.latent.attributes.get("opacity")).toBe("0.0550");
  expect(posed(h.pieces, tifinagh)).toBe(true);
  expect(h.state.entryPhase).toBe("loading");

  await h.load();
  for (let i = 0; i < 100 && h.state.entryPhase === "loading"; i++) h.step(50);
  expect(h.state.entryPhase).toBe("ready");
  // Loaded: every clip opens and the full ⴱ holds a beat.
  for (const { clip } of h.pieces) expect(clip.attributes.get("height")).toBe("960.00");
  h.run(0.35);
  expect(posed(h.pieces, tifinagh)).toBe(true);
  // The completed ⴱ sends the brand book's ripple from its ring, two rings apart.
  for (const ripple of h.ripples) {
    expect(Number(ripple.attributes.get("opacity"))).toBeGreaterThan(0);
    expect(Number(ripple.attributes.get("r"))).toBeGreaterThan(100);
    expect(ripple.attributes.get("cy")).toBe("0");
  }
  expect(Number(h.ripples[0].attributes.get("r"))).toBeGreaterThan(Number(h.ripples[1].attributes.get("r")));
  expect(h.elements["identity-loading"].dataset.entryStage).toBe("loaded");
  expect(h.elements["identity-choices"].style.visibility).toBe("hidden");
  // ⴱ → b, with the choices rising as it turns.
  h.run(0.7);
  expect(posed(h.pieces, tifinagh)).toBe(false);
  expect(h.latent.attributes.get("opacity")).toBe("0.0000");
  h.run(0.2);
  expect(h.elements["identity-loading"].dataset.entryStage).toBe("choice");
  expect(h.elements["identity-choices"].style.visibility).toBe("visible");
  expect(h.elements["identity-choices"].inert).toBe(false);
  h.run(1.3);
  expect(posed(h.pieces, identityMark.markLoopPose("B", 1))).toBe(true);
  // Locking into b sends the next ripple, from its bowl.
  expect(Number(h.ripples[0].attributes.get("opacity"))).toBeGreaterThan(0);
  expect(h.ripples[0].attributes.get("cy")).toBe("50");

  // Hovering a choice tilts the pieces; leaving settles them again, by now on ب.
  h.choices[1].dispatchEvent(new Event("pointerenter"));
  h.run(0.3);
  expect(part("h1").material.attributes.get("transform")).not.toBe(settledMaterial("h1"));
  h.choices[1].dispatchEvent(new Event("pointerleave"));
  h.run(3);
  expect(part("h1").material.attributes.get("transform")).toBe(settledMaterial("h1"));
  expect(posed(h.pieces, identityMark.markStatic.C())).toBe(true);
  expect(h.ripples[0].attributes.get("cy")).toBe("0");
  // ب → ⴱ, and round again.
  h.run(3.3);
  expect(posed(h.pieces, tifinagh)).toBe(true);
  h.run(1.6);

  // Chosen mid ⴱ → b: the mark reads on in flight and lands as the wordmark's b.
  h.choices[1].dispatchEvent(new Event("click"));
  h.run(1.15);
  expect(h.announced).toEqual(["identity-mark-landed"]);
  expect(posed(h.pieces, identityMark.wordmarkRest())).toBe(true);
  const landing = h.landings[0] as { step: string; elapsed: number };
  expect(landing.step).toBe("B");
  expect(landing.elapsed).toBeGreaterThan(150);
  expect(landing.elapsed).toBeLessThan(450);
  expect(h.sounds).toEqual(["tock 293.66"]);
  h.run(1.5);
  expect(h.announced).toEqual(["identity-mark-landed", "identity-entry-complete"]);
  h.dispose(); expect(h.clean).toBe(true);
  // Cleanup returns the server-rendered, empty ⴱ.
  expect(h.latent.attributes.get("opacity")).toBe(".055");
  expect(posed(h.pieces, tifinagh)).toBe(true);
  for (const ripple of h.ripples) {
    expect(ripple.attributes.get("opacity")).toBe("0");
    expect(ripple.attributes.get("r")).toBe("100");
    expect(ripple.attributes.has("cy")).toBe(false);
  }
  for (const { clip, material } of h.pieces) {
    expect(clip.attributes.get("height")).toBe("0");
    expect(material.attributes.has("transform")).toBe(false);
  }
});
