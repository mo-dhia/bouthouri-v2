import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import ts from "typescript";
import * as viewport from "@/lib/viewport-design";
import * as motion from "./contact-motion";

function harness({ locale = "en", restored = 0 } = {}) {
  let y = restored, now = 0, fontReady!: () => void;
  class Surface extends EventTarget {
    dataset: Record<string, string> = {};
    style = { transform: "", opacity: "" };
    parentElement: Surface | null = null;
    one = new Map<string, Surface>();
    many = new Map<string, Surface[]>();
    top = 0;
    height = 0;
    querySelector(selector: string) { return this.one.get(selector) ?? null; }
    querySelectorAll(selector: string) { return this.many.get(selector) ?? []; }
    getBoundingClientRect() { return { top: this.top - y, bottom: this.top + this.height - y }; }
  }
  const root = new Surface(), opening = new Surface(), alternative = new Surface(), axis = new Surface();
  const title = [new Surface(), new Surface()], wrappers = [new Surface(), new Surface()], support = [new Surface(), new Surface()];
  const reveal = [new Surface(), new Surface()];
  title.forEach((line, index) => { line.parentElement = wrappers[index]; });
  root.dataset.locale = locale;
  root.one.set("[data-contact-opening]", opening);
  root.one.set("[data-contact-axis]", axis);
  root.one.set("[data-contact-alternative]", alternative);
  opening.many.set("[data-contact-line]", title);
  opening.many.set("[data-route-line]", title);
  opening.many.set("[data-route-support]", support);
  alternative.many.set("[data-contact-line]", reveal);
  opening.height = 1080;
  alternative.top = 2220; alternative.height = 720;
  const frames = new Map<number, (time: number) => void>();
  const keys = new Map<string, { callback: () => void; options: { useRAF: boolean } }>();
  let serial = 0;
  const observers: { disconnected: boolean; callback: () => void }[] = [];
  const fonts = Object.assign(new EventTarget(), { ready: new Promise<void>((resolve) => { fontReady = resolve; }) });
  const document = Object.assign(new EventTarget(), { hidden: false, fonts });
  const window = Object.assign(new EventTarget(), { innerWidth: 1920, innerHeight: 1080 });
  Object.defineProperty(window, "scrollY", { get: () => y });
  const context = createContext({
    window, document, performance: { now: () => now },
    requestAnimationFrame(callback: (time: number) => void) { frames.set(++serial, callback); return serial; },
    cancelAnimationFrame(id: number) { frames.delete(id); },
    ResizeObserver: class {
      record: typeof observers[number];
      constructor(callback: () => void) { this.record = { callback, disconnected: false }; observers.push(this.record); }
      observe() {}
      disconnect() { this.record.disconnected = true; }
    },
  });
  const compiled = ts.transpileModule(readFileSync(new URL("./contact.animate.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const evaluated = { exports: {} };
  runInContext(`(function(require, module, exports) { ${compiled}\n })`, context)((key: string) => {
    if (key === "./contact-motion") return motion;
    if (key === "@/lib/viewport-design") return viewport;
    if (key === "@/lib/scrollInteraction/scrollManager") return { default: {
      createInstance: (key: string, callback: () => void, options: { useRAF: boolean }) => keys.set(key, { callback, options }),
      removeInstance: (key: string) => keys.delete(key),
    } };
    throw new Error(`Unexpected Contact motion dependency: ${key}`);
  }, evaluated, evaluated.exports);
  const mount = (evaluated.exports as { mountContactMotion: (root: Surface) => () => void }).mountContactMotion;
  return {
    root, opening, alternative, axis, title, wrappers, support, reveal, frames, keys, observers, window, document,
    mount: () => mount(root), resolveFonts: () => fontReady(),
    frame(time: number) { now = time; const pending = [...frames.values()]; frames.clear(); pending.forEach((callback) => callback(time)); },
    scroll(value: number) { y = value; keys.forEach(({ callback }) => callback()); },
    resize(width: number, height: number) { window.innerWidth = width; window.innerHeight = height; window.dispatchEvent(new Event("resize")); },
    visibility(hidden: boolean) { document.hidden = hidden; document.dispatchEvent(new Event("visibilitychange")); },
  };
}
const flush = async () => { for (let count = 0; count < 4; count++) await Promise.resolve(); };

test("Contact motion adopts late entry, scrubs both source paths with one RAF and cleans every registration", async () => {
  const h = harness(), dispose = h.mount();
  expect(h.frames.size).toBe(0);
  expect(h.keys.size).toBe(0);
  h.opening.dispatchEvent(new Event("practice-hero-enter")); // Root arrived before fonts/controller readiness.
  h.resolveFonts(); await flush();
  expect(h.keys.size).toBe(1);
  expect([...h.keys.values()][0].options.useRAF).toBe(false);
  expect(h.frames.size).toBe(1);
  expect(h.title[0].style.transform).toContain("112%");
  h.frame(600);
  expect(h.frames.size).toBe(0);
  expect(h.title[0].style.transform).toBe("");
  h.scroll(405); h.scroll(405);
  expect(h.frames.size).toBe(1);
  h.frame(900);
  expect(h.wrappers[1].style.transform).toBe("translate3d(2%, 0, 0)");
  expect(h.axis.style.transform).toBe("scaleX(0.59)");
  h.scroll(1507.2); h.frame(1200);
  expect(h.reveal[0].style.transform).toBe(`translate3d(0, ${motion.contactLineOffset(.5, 0, 2)}%, 0)`);
  expect(h.frames.size).toBe(0);
  dispose();
  expect(h.keys.size).toBe(0);
  expect(h.frames.size).toBe(0);
  expect(h.observers.every((observer) => observer.disconnected)).toBe(true);
  expect(h.wrappers[1].style.transform).toBe("");
  expect(h.axis.style.transform).toBe("");
  expect(h.reveal.map((line) => line.style.transform)).toEqual(["", ""]);
});

test("Contact restored AR pose mirrors the source shift and ignores physical height for design timing", async () => {
  const h = harness({ locale: "ar", restored: 405 }), dispose = h.mount();
  h.resolveFonts(); await flush();
  expect(h.frames.size).toBe(0);
  expect(h.wrappers[1].style.transform).toBe("translate3d(-2%, 0, 0)");
  const prior = h.wrappers[1].style.transform;
  h.resize(1920, 650);
  expect(h.wrappers[1].style.transform).toBe(prior);
  h.visibility(true); h.scroll(810);
  expect(h.frames.size).toBe(0);
  h.visibility(false);
  expect(h.wrappers[1].style.transform).toBe("translate3d(-4%, 0, 0)");
  dispose();
});

test("Contact cancellation before fonts never initializes; remounting optional motion never repeats arrival", async () => {
  const cancelled = harness(), abort = cancelled.mount();
  abort(); cancelled.resolveFonts(); await flush();
  expect(cancelled.keys.size).toBe(0);
  expect(cancelled.frames.size).toBe(0);
  expect(cancelled.root.dataset.contactMotionReady).toBeUndefined();
  const h = harness(), dispose = h.mount();
  h.resolveFonts(); await flush(); h.frame(600); dispose();
  const repeat = h.mount(); await flush();
  expect(h.frames.size).toBe(0);
  expect(h.title[0].style.transform).toBe("");
  repeat();
});
