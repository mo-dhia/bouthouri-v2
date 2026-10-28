import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import ts from "typescript";
import * as heroWorld from "@/sections/landing/1-hero/hero-world";
import * as viewport from "@/lib/viewport-design";

// Exercise the mounted controller with counted DOM operations. Layout values
// are supplied explicitly; this checks ownership/invalidation, not CSS parity.
function harness({ reading = false, late = false, locale = "en", width = 1920, physicalHeight = 1080, menu = false } = {}) {
  const counts = { queries: 0, geometry: 0, writes: 0 };
  let y = 0;
  class Surface extends EventTarget {
    attributes = new Map<string, string>();
    dataset = new Proxy({} as Record<string, string>, { set: (target, key: string, value: string) => { counts.writes++; target[key] = value; return true; } });
    style = new Proxy({
      setProperty: (key: string, value: string) => { this.style[key] = value; },
      removeProperty: (key: string) => { delete this.style[key]; counts.writes++; },
    } as Record<string, unknown>, { set: (target, key: string, value) => {
      counts.writes++; target[key] = value; this.attributes.set("style", JSON.stringify(target)); return true;
    } });
    children: Surface[] = [];
    parent: Surface | undefined;
    queries = new Map<string, Surface | Surface[]>();
    connected = false;
    className = "";
    top = 0;
    height = 44;
    width = 102;
    fixed = false;
    private inactive = false;
    get inert() { return this.inactive; }
    set inert(value: boolean) { counts.writes++; this.inactive = value; }
    get isConnected(): boolean { return this.parent?.isConnected ?? this.connected; }
    get firstElementChild() { return this.children[0] ?? null; }
    get clientHeight() { counts.geometry++; return this.height; }
    get offsetHeight() { counts.geometry++; return this.height; }
    get offsetWidth() { counts.geometry++; return this.width; }
    getBoundingClientRect() { counts.geometry++; return { top: this.top - (this.fixed ? 0 : y), height: this.height }; }
    querySelector(selector: string) { counts.queries++; const result = this.queries.get(selector); return (Array.isArray(result) ? result[0] : result) ?? null; }
    querySelectorAll(selector: string) { counts.queries++; return (this.queries.get(selector) as Surface[] | undefined) ?? []; }
    getAttribute(key: string) { return this.attributes.get(key) ?? null; }
    hasAttribute(key: string) { return this.attributes.has(key); }
    setAttribute(key: string, value: string) { counts.writes++; this.attributes.set(key, value); }
    removeAttribute(key: string) { counts.writes++; this.attributes.delete(key); }
    append(child: Surface) { child.remove(); child.parent = this; this.children.push(child); }
    before(child: Surface) { child.remove(); child.parent = this.parent; this.parent?.children.splice(this.parent.children.indexOf(this), 0, child); }
    after(child: Surface) { child.remove(); child.parent = this.parent; this.parent?.children.splice(this.parent.children.indexOf(this) + 1, 0, child); }
    remove() { if (this.parent) this.parent.children.splice(this.parent.children.indexOf(this), 1); this.parent = undefined; }
  }
  const body = new Surface(), root = new Surface(), utilities = new Surface(), entrance = new Surface();
  const dialog = Object.assign(new Surface(), {
    open: false, scrollTop: 0,
    showModal() { this.open = true; },
    close() { this.open = false; },
  });
  const menuRail = new Surface(), menuControl = new Surface();
  const menuItems = Array.from({ length: 4 }, (_, index) => {
    const item = new Surface();
    item.dataset.menuItem = String(index);
    Object.defineProperties(item, {
      offsetTop: { get: () => { counts.geometry++; return dialog.open ? item.top : 0; } },
      offsetHeight: { get: () => { counts.geometry++; return dialog.open ? item.height : 0; } },
    });
    return item;
  });
  const menuDescriptions = menuItems.map((_, index) => {
    const description = new Surface();
    description.dataset.menuDescription = String(index);
    return description;
  });
  Object.assign(menuControl, {
    closest: (selector: string) => selector === "[data-menu-control]" ? menuControl : null,
    matches: () => false,
  });
  if (menu) {
    dialog.queries.set("[data-menu-item]", menuItems);
    dialog.queries.set("[data-menu-rail]", menuRail);
    dialog.queries.set("[data-menu-description]", menuDescriptions);
  }
  const hero = new Surface(), persistent = new Surface(), side = new Surface(), sideRoll = new Surface();
  const rolls = Array.from({ length: 4 }, () => new Surface());
  const identity = new Surface(), chapter = new Surface(), original = new Surface();
  body.connected = true; body.append(root);
  root.dataset.locale = locale;
  root.append(utilities); root.append(dialog); utilities.append(entrance); utilities.append(side); side.append(sideRoll);
  root.queries.set("#portfolio-navigation", dialog);
  root.queries.set("[data-hero-utilities]", utilities);
  root.queries.set('[data-nav-layer="hero"]', hero);
  root.queries.set('[data-nav-layer="persistent"]', persistent);
  root.queries.set("[data-shell-side-menu]", side);
  side.queries.set("[data-nav-side-roll]", sideRoll);
  persistent.queries.set("[data-nav-roll]", rolls);
  identity.height = 800; chapter.top = 800;
  original.setAttribute("style", "color: red"); original.setAttribute("aria-hidden", "false");
  let available = !late;
  const insertStage = () => { available = true; body.append(identity); body.append(chapter); chapter.append(original); };
  if (available) insertStage();
  let fontsReady!: () => void;
  const document = Object.assign(new EventTarget(), {
    body, hidden: false, documentElement: new Surface(),
    fonts: { ready: new Promise<void>((resolve) => { fontsReady = resolve; }) },
    querySelector(selector: string) { counts.queries++; return available ? selector === "#identity" ? identity : selector === ".glasses-chapter" ? chapter : null : null; },
    querySelectorAll(selector: string) { counts.queries++; return selector === "[data-menu-control]" ? (menu ? [menuControl] : []) : available ? [original] : []; },
    createComment: () => new Surface(),
    createElement: () => Object.assign(new Surface(), { getContext: () => null }),
  });
  const motion = Object.assign(new EventTarget(), { matches: false });
  const window = Object.assign(new EventTarget(), { matchMedia: () => motion });
  const state = { quietMode: reading, homeSceneFailed: false, soundEnabled: false, menuOpen: false, setMenuOpen(value: boolean) { this.menuOpen = value; } };
  const subscribers = new Set<() => void>();
  let resize!: () => void, mutate!: (records: { type: string }[]) => void;
  let resizeDisconnected = false, mutationDisconnected = false, rowTop = "34px";
  const globals = {
    document, window, Element: Surface, scrollX: 0,
    get innerWidth() { return width; },
    get innerHeight() { return physicalHeight; },
    get scrollY() { return y; },
    getComputedStyle() { counts.geometry++; return { top: rowTop }; },
    setTimeout: () => 1, clearTimeout() {}, cancelAnimationFrame() {},
    ResizeObserver: class {
      constructor(callback: () => void) { resize = callback; }
      observe() {} unobserve() {} disconnect() { resizeDisconnected = true; }
    },
    MutationObserver: class {
      constructor(callback: typeof mutate) { mutate = callback; }
      observe() {} disconnect() { mutationDisconnected = true; }
    },
  };
  let finishMenuReverse = () => {};
  const dependencies: Record<string, unknown> = {
    "@/store/uiStore": { uiStore: { getState: () => state, subscribe: (callback: () => void) => { subscribers.add(callback); return () => subscribers.delete(callback); } } },
    "@/lib/audio/material-audio": { attachAudioLifecycle: () => () => {}, playMaterialSound() {} },
    "@/lib/audio/section-whispers": { attachSectionWhispers: () => () => {} },
    "./menu.module.css": { default: {} },
    "./header.module.css": { default: { readingNavigation: "reading-viewport", readingFrame: "reading-frame" } },
    "./shell-copy": { shellEmail: "contact@bouthouri.co" },
    "./menu-timeline": { createMenuTimeline: (_root: unknown, callbacks: { reverseComplete: () => void }) => {
      finishMenuReverse = callbacks.reverseComplete;
      return { dispose() {}, play() {}, pause() {}, reverse() {}, time: () => 1, duration: 1 };
    } },
    "@/sections/landing/1-hero/hero-world": heroWorld,
    "@/lib/viewport-design": viewport,
  };
  const source = readFileSync(new URL("./header.logic.ts", import.meta.url), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const evaluated = { exports: {} as { mountHeader: (root: unknown) => () => void } };
  runInContext(`(function(require,module,exports){${js}\n})`, createContext(globals))((name: string) => {
    if (!(name in dependencies)) throw new Error(`Unexpected header dependency: ${name}`);
    return dependencies[name];
  }, evaluated, evaluated.exports);
  return {
    counts, root, utilities, entrance, hero, side, identity, chapter, original, motion, window, menuItems, menuDescriptions, menuRail, dialog,
    finishMenuReverse: () => finishMenuReverse(),
    toggleMenu() {
      const event = new Event("click");
      Object.defineProperty(event, "target", { value: menuControl });
      document.dispatchEvent(event);
    },
    mount: () => evaluated.exports.mountHeader(root),
    reset() { counts.queries = counts.geometry = counts.writes = 0; },
    scroll(value: number) { y = value; window.dispatchEvent(new Event("scroll")); },
    mode(value: Partial<typeof state>) { Object.assign(state, value); subscribers.forEach((callback) => callback()); },
    event(progress: number) { window.dispatchEvent(new CustomEvent(heroWorld.heroWorldEvent, { detail: heroWorld.heroWorldPose(progress) })); },
    publisher: () => heroWorld.createHeroWorldPublisher(identity as unknown as HTMLElement, window),
    resize(top = rowTop, nextWidth = width, nextHeight = physicalHeight) { rowTop = top; width = nextWidth; physicalHeight = nextHeight; window.dispatchEvent(new Event("resize")); },
    layout() { resize(); },
    lateStage() { insertStage(); mutate([{ type: "childList" }]); },
    mutation() { mutate([{ type: "childList" }]); },
    locale() { mutate([{ type: "attributes" }]); },
    fontsReady,
    get clean() { return resizeDisconnected && mutationDisconnected && subscribers.size === 0; },
  };
}

test("motion uses full precision and skips native/unchanged poses without geometry, queries or writes", () => {
  const h = harness();
  h.identity.setAttribute("data-enhanced", "true"); h.identity.dataset.heroWorld = "0.1000";
  const publisher = h.publisher(), pose = heroWorld.heroWorldPose(.123456789);
  publisher.publish(pose);
  const dispose = h.mount();
  expect(h.hero.style.transform).toBe(`translate3d(0,${viewport.pixelsToVw(-pose.navTravel * 90, 1920)},0)`);
  h.reset(); h.scroll(200); h.event(pose.progress); h.mutation();
  expect(h.counts).toEqual({ geometry: 0, queries: 0, writes: 0 });
  publisher.publish(heroWorld.heroWorldPose(.2));
  expect(h.counts.geometry).toBe(0); expect(h.counts.queries).toBe(0); expect(h.counts.writes).toBeGreaterThan(0);
  const transform = h.hero.style.transform;
  h.reset(); h.event(.05); h.scroll(400); // Old event/dataset cannot replace the current WeakMap pose.
  expect(h.hero.style.transform).toBe(transform); expect(h.counts.writes).toBe(0);
  h.resize("60px");
  expect(h.hero.style.transform).toBe(`translate3d(0,${viewport.pixelsToVw(-heroWorld.heroWorldPose(.2).navTravel * 116, 1920)},0)`);
  h.reset(); h.scroll(420); expect(h.counts).toEqual({ geometry: 0, queries: 0, writes: 0 });
  dispose(); publisher.dispose(); expect(h.clean).toBe(true);
});

test("reading keeps one document viewport, raw hero height, native offscreen focus eligibility and reversible placement", async () => {
  for (const locale of ["en", "ar"]) {
    const h = harness({ reading: true, locale }), dispose = h.mount();
    const viewport = h.root.children.find((node) => node.dataset.readingNavigation === "true")!;
    expect(viewport.style.top).toBe(`${800 / 1920 * 100}vw`); expect(h.side.parent?.className).toBe("reading-frame");
    h.scroll(200); // .25 raw native input, without the ordinary motion remap.
    expect(h.hero.style.opacity).toBe(String(heroWorld.heroWorldPose(.25).navOpacity));
    h.reset(); h.scroll(200); h.event(0);
    expect(h.counts).toEqual({ geometry: 0, queries: 0, writes: 0 });
    h.scroll(800); h.reset(); h.scroll(9000);
    expect(h.counts).toEqual({ geometry: 0, queries: 0, writes: 0 });
    expect(h.side.inert).toBe(false); expect(h.side.getAttribute("aria-hidden")).toBe("false");
    expect(viewport.style.top).toBe(`${800 / 1920 * 100}vw`); // The document supplies scrolling.
    h.identity.height = 1600; h.chapter.top = 1600; h.scroll(400); h.layout();
    expect(viewport.style.top).toBe(`${1600 / 1920 * 100}vw`);
    expect(h.hero.style.opacity).toBe(String(heroWorld.heroWorldPose(.25).navOpacity));
    h.mode({ menuOpen: true });
    h.utilities.height = 48; h.side.width = 74; h.resize("16px");
    expect(h.side.parent?.style.top).toBe(`${16 / 1920 * 100}vw`); expect(h.side.parent?.style.height).toBe(`${48 / 1920 * 100}vw`);
    expect(h.utilities.style["--nav-right-label"]).toBe(`${74 / 1920 * 100}vw`);
    h.mode({ menuOpen: false });
    h.fontsReady(); await Promise.resolve();
    expect(h.root.children.filter((node) => node.dataset.readingNavigation === "true")).toHaveLength(1);
    h.mode({ quietMode: false }); expect(h.side.parent).toBe(h.utilities); expect(viewport.parent).toBeUndefined();
    h.mode({ homeSceneFailed: true }); expect(h.side.parent?.className).toBe("reading-frame");
    dispose(); expect(h.side.parent).toBe(h.utilities); expect(h.clean).toBe(true);
    expect(h.root.children.some((node) => node.dataset.readingNavigation === "true")).toBe(false);
    expect(h.original.getAttribute("style")).toBe("color: red");
    expect(h.original.inert).toBe(false); expect(h.original.getAttribute("aria-hidden")).toBe("false");
  }
});

test("late stage, geometry-ready, locale and OS mode invalidate caches; font completion after cleanup is inert", async () => {
  const h = harness({ late: true, reading: true }), dispose = h.mount();
  h.scroll(400); h.lateStage();
  expect(h.hero.style.opacity).toBe(String(heroWorld.heroWorldPose(.5).navOpacity));
  expect(h.original.inert).toBe(true);
  h.chapter.top = 950; h.window.dispatchEvent(new Event("home-navigation-ready"));
  expect(h.side.parent?.parent?.style.top).toBe(`${950 / 1920 * 100}vw`);
  h.chapter.top = 1000; h.locale(); expect(h.side.parent?.parent?.style.top).toBe(`${1000 / 1920 * 100}vw`);
  h.mode({ quietMode: false }); h.motion.matches = true; h.motion.dispatchEvent(new Event("change"));
  expect(h.side.parent?.className).toBe("reading-frame");
  dispose(); h.reset(); h.fontsReady(); await Promise.resolve();
  h.resize(); h.scroll(0); h.event(1);
  expect(h.counts).toEqual({ geometry: 0, queries: 0, writes: 0 }); expect(h.clean).toBe(true);
});

test("profile navigation scales measured geometry once and ignores physical viewport height", () => {
  for (const [referenceWidth, referenceHeight, smallerWidth, rowTop, rowHeight] of [
    [1920, 1080, 1440, 46.44, 60.48],
    [768, 1024, 650, 16, 44],
    [412, 915, 320, 16, 44],
  ]) {
    const referencePose = heroWorld.heroWorldPose(.2);
    const expectedTravel = -referencePose.navTravel * (rowTop + rowHeight + 12);
    for (const width of [referenceWidth, smallerWidth]) {
      const scale = width / referenceWidth;
      const h = harness({ reading: true, width, physicalHeight: referenceHeight });
      h.identity.height = h.chapter.top = referenceHeight * scale;
      h.entrance.height = h.utilities.height = rowHeight * scale;
      h.side.width = 102 * scale;
      const dispose = h.mount();
      h.resize(`${rowTop * scale}px`);
      h.scroll(.2 * referenceHeight * scale);
      const transform = h.hero.style.transform as string;
      expect(Number(transform.match(/translate3d\(0,([^v]+)vw,0\)/)![1]) * width / 100).toBeCloseTo(expectedTravel * scale, 10);
      expect(Number.parseFloat(h.side.parent!.parent!.style.top as string) * width / 100).toBeCloseTo(referenceHeight * scale, 10);
      expect(Number.parseFloat(h.side.parent!.style.height as string) * width / 100).toBeCloseTo(rowHeight * scale, 10);
      expect(Number.parseFloat(h.utilities.style["--nav-right-label"] as string) * width / 100).toBeCloseTo(102 * scale, 10);
      h.resize(`${rowTop * scale}px`, width, referenceHeight / 2);
      expect(h.hero.style.transform).toBe(transform);
      expect(h.hero.style.opacity).toBe(String(referencePose.navOpacity));
      dispose();
      expect(h.clean).toBe(true);
    }
  }
});


test("menu rail retains selection through layout and fonts but resets it after a complete close", async () => {
  for (const [width, physicalHeight, nextWidth, enCenter, arCenter] of [
    [1920, 1080, 1440, 70, 97],
    [768, 1024, 650, 34, 59],
    [412, 915, 320, 29, 44],
  ]) {
    for (const locale of ["en", "ar"]) {
      const h = harness({ menu: true, reading: true, locale, width, physicalHeight });
      const center = locale === "en" ? enCenter : arCenter;
      h.menuItems.forEach((item, index) => { item.top = index * center * 2; item.height = center * 2; });
      const dispose = h.mount();
      expect(h.dialog.open).toBe(false);
      expect(h.menuRail.style.transform).toBeUndefined(); // Hidden offsets are zero.
      expect(h.menuItems[0].dataset.selected).toBe("true");
      h.toggleMenu();
      expect(h.dialog.open).toBe(true);
      expect(h.menuRail.style.transform).toBe(`translateY(${viewport.pixelsToVw(center, width)})`);
      h.menuItems[2].dispatchEvent(new Event("pointerenter"));
      expect(h.menuRail.style.transform).toBe(`translateY(${viewport.pixelsToVw(center * 5, width)})`);
      h.menuItems[1].dispatchEvent(new Event("focus"));
      expect(h.menuItems[1].dataset.selected).toBe("true");
      const scale = nextWidth / width;
      h.menuItems.forEach((item) => { item.top *= scale; item.height *= scale; });
      h.resize("34px", nextWidth, physicalHeight / 2);
      expect(h.menuRail.style.transform).toBe(`translateY(${viewport.pixelsToVw(center * 3 * scale, nextWidth)})`);
      h.menuItems[1].height += 8 * scale;
      h.fontsReady(); await Promise.resolve();
      const expected = `translateY(${viewport.pixelsToVw(center * 3 * scale + 4 * scale, nextWidth)})`;
      expect(Number.parseFloat((h.menuRail.style.transform as string).slice(11))).toBeCloseTo(Number.parseFloat(expected.slice(11)), 10);
      h.toggleMenu(); expect(h.dialog.open).toBe(false);
      h.toggleMenu(); expect(h.dialog.open).toBe(true);
      expect(h.menuItems[0].dataset.selected).toBe("true");
      expect(h.menuItems[1].dataset.selected).toBe("false");
      expect(h.menuDescriptions[0].getAttribute("aria-hidden")).toBe("false");
      expect(h.menuDescriptions[1].getAttribute("aria-hidden")).toBe("true");
      expect(h.menuRail.style.transform).toBe(`translateY(${viewport.pixelsToVw(center * scale, nextWidth)})`);
      dispose(); expect(h.clean).toBe(true);
    }
  }
});


test("reopening an interrupted closing timeline preserves its selected row until a complete close", () => {
  const h = harness({ menu: true });
  const dispose = h.mount();
  h.toggleMenu();
  h.menuItems[2].dispatchEvent(new Event("focus"));
  h.toggleMenu();
  expect(h.dialog.dataset.phase).toBe("closing");
  expect(h.dialog.open).toBe(true);
  h.toggleMenu();
  expect(h.dialog.dataset.phase).toBe("opening");
  expect(h.menuItems[2].dataset.selected).toBe("true");
  expect(h.menuDescriptions[2].getAttribute("aria-hidden")).toBe("false");
  h.toggleMenu(); h.finishMenuReverse();
  expect(h.dialog.open).toBe(false);
  h.toggleMenu();
  expect(h.menuItems[0].dataset.selected).toBe("true");
  expect(h.menuItems[2].dataset.selected).toBe("false");
  expect(h.menuDescriptions[0].getAttribute("aria-hidden")).toBe("false");
  dispose(); expect(h.clean).toBe(true);
});
