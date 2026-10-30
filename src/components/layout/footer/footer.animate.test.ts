import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import ts from "typescript";
import * as identity from "../header/identity-mark";
import * as mark from "./footer-mark";
import type { FooterMark } from "./footer.animate";

class Node extends EventTarget {
  dataset: Record<string, string> = {};
  attributes = new Map<string, string>();
  children: Node[] = [];
  parent: Node | undefined;
  id = "";
  rect = { left: 0, top: 0, width: 0, height: 0, bottom: 0 };
  listeners = 0;
  captured = new Set<number>();
  constructor(public name = "div") { super(); }
  addEventListener(...args: Parameters<EventTarget["addEventListener"]>) { this.listeners++; super.addEventListener(...args); }
  removeEventListener(...args: Parameters<EventTarget["removeEventListener"]>) { this.listeners--; super.removeEventListener(...args); }
  setAttribute(name: string, value: string) { this.attributes.set(name, value); }
  getAttribute(name: string) { return this.attributes.get(name) ?? null; }
  removeAttribute(name: string) { this.attributes.delete(name); }
  append(...nodes: Node[]) { nodes.forEach((node) => { node.parent = this; this.children.push(node); }); }
  prepend(node: Node) { node.parent = this; this.children.unshift(node); }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter((child) => child !== this); this.parent = undefined; }
  getBoundingClientRect() { return this.rect; }
  setPointerCapture(id: number) { this.captured.add(id); }
  hasPointerCapture(id: number) { return this.captured.has(id); }
  releasePointerCapture(id: number) { this.captured.delete(id); }
}

/** The server footer's word, laid out at one client pixel per wordmark unit, 500 px down a 1080 stage. */
function harness() {
  const { footerViewBox: box } = mark;
  const root = new Node(), mask = new Node(), word = new Node(), svg = new Node("svg"), lettering = new Node("g"), group = new Node("g");
  const pieces = identity.markPieces.map((name) => Object.assign(new Node("path"), { piece: name }));
  const letters = mark.footerLetters.map(() => new Node("g"));
  const ripples = mark.footerRipple.delays.map(() => new Node("circle"));
  svg.append(lettering, group);
  mask.rect = word.rect = { left: 0, top: 500, width: box.width, height: box.height, bottom: 500 + box.height };
  svg.rect = { ...mask.rect };
  const select: Record<string, Node> = { "[data-footer-grab]": mask, "[data-footer-word]": word, "[data-footer-svg]": svg, "[data-footer-mark]": group, "[data-footer-letters]": lettering };
  const query = (selector: string) => select[selector] ?? pieces.find((piece) => selector === `[data-footer-piece="${piece.piece}"]`) ?? null;
  Object.assign(root, { querySelector: query });
  Object.assign(svg, { querySelector: query, querySelectorAll: (selector: string) => (selector.includes("letter") ? letters : ripples) });
  Object.assign(group, { querySelector: query });
  const document = Object.assign(new Node(), { hidden: false, createElementNS: (_: string, name: string) => new Node(name) });
  const window = new Node();
  let now = 1000, serial = 0;
  const timers = new Map<number, { at: number; callback: () => void }>();
  const rafs = new Map<number, (time: number) => void>();
  const sounds: string[] = [], shields: boolean[] = [];
  const state = { reduced: false };
  const globals = {
    document, window, Math, innerWidth: 1920, innerHeight: 1080,
    performance: { now: () => now },
    setTimeout: (callback: () => void, delay: number) => { const id = ++serial; timers.set(id, { at: now + delay, callback }); return id; },
    clearTimeout: (id: number) => timers.delete(id),
    requestAnimationFrame: (callback: (time: number) => void) => { const id = ++serial; rafs.set(id, callback); return id; },
    cancelAnimationFrame: (id: number) => rafs.delete(id),
  };
  const source = readFileSync(new URL("./footer.animate.ts", import.meta.url), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const evaluated = { exports: {} as { mountFooterMark: (root: Node, reduced: () => boolean) => FooterMark | undefined } };
  const dependencies: Record<string, unknown> = {
    "@/lib/audio/material-audio": { playMaterialSound: (kind: string) => sounds.push(kind), setFooterFriction() {} },
    "../header/identity-mark": identity,
    "../header/material-protection": { createMaterialProtectionPublisher: () => (shield: { active: boolean }) => shields.push(shield.active) },
    "./footer-mark": mark,
  };
  runInContext(`(function(require,module,exports){${js}\n})`, createContext(globals))((name: string) => {
    if (!(name in dependencies)) throw new Error(`Unexpected footer mark dependency: ${name}`);
    return dependencies[name];
  }, evaluated, evaluated.exports);
  const controller = evaluated.exports.mountFooterMark(root, () => state.reduced)!;
  /** Wordmark units → client pixels. */
  const client = (x: number, y: number) => ({ clientX: x - box.x, clientY: y - box.y + 500 });
  const pointer = (type: string, x: number, y: number, more: Record<string, unknown> = {}) =>
    mask.dispatchEvent(Object.assign(new Event(type, { cancelable: true }), { pointerId: 1, pointerType: "mouse", button: 0, ...client(x, y), ...more }));
  const restLetters = mark.footerLetters.map((letter, i) => mark.letterTransform(mark.restLetter(i), letter.w));
  return {
    controller, root, mask, svg, lettering, group, letters, pieces, document, window, timers, rafs, sounds, shields, state, pointer,
    get mode() { return mask.dataset.mode; },
    get masked() { return lettering.getAttribute("mask"); },
    atRest: () => letters.every((letter, i) => letter.getAttribute("transform") === restLetters[i]) && group.getAttribute("transform") === mark.placeTransform({ ...mark.footerHome, s: 1 }),
    /** Plays `ms` of wall time at 60 fps, firing timers and frames as a browser would. */
    run(ms: number) {
      const end = now + ms;
      while (now < end) {
        now = Math.min(end, now + 1000 / 60);
        for (const [id, timer] of [...timers].sort((a, b) => a[1].at - b[1].at)) if (timer.at <= now) { timers.delete(id); timer.callback(); }
        const pending = [...rafs.values()]; rafs.clear();
        pending.forEach((callback) => callback(now));
      }
    },
  };
}

const soloLength = mark.footerSoloSteps.reduce((sum, step) => sum + step.dur, 0);

test("the b eats the word, reads its three scripts alone, spits the word back and holds", () => {
  const h = harness();
  expect(h.svg.children[0].name).toBe("defs");
  h.controller.setActive(true);
  h.run(mark.footerDurations.first - 100);
  expect(h.mode).toBe("word"); expect(h.mask.dataset.grabbable).toBe("true"); expect(h.atRest()).toBe(true);
  h.run(200);
  expect(h.mode).toBe("busy");
  expect(h.masked).toMatch(/^url\(#footer-mouth-[a-z0-9]+\)$/);
  h.run(mark.footerDurations.eat);
  expect(h.mode).toBe("mark"); expect(h.masked).toBeNull();
  expect(h.letters.every((letter) => letter.getAttribute("transform")!.includes("scale(0.0000 0.0000)"))).toBe(true);
  expect(h.sounds.filter((sound) => sound === "hover").length).toBeGreaterThan(3); // A chomp per bite.
  h.run(soloLength);
  expect(h.mode).toBe("busy"); expect(h.masked).not.toBeNull();
  h.run(mark.footerDurations.spit);
  expect(h.mode).toBe("word"); expect(h.masked).toBeNull(); expect(h.atRest()).toBe(true);
  h.run(mark.footerDurations.hold - 300);
  expect(h.mode).toBe("word");
  // At rest the controller sleeps on one timer, not frames.
  expect(h.rafs.size).toBe(0); expect(h.timers.size).toBe(1);
  h.run(400);
  expect(h.mode).toBe("busy");
});

test("a moving cursor leans the letters and holds the loop; a resting one lets it go", () => {
  const h = harness();
  h.controller.setActive(true);
  h.pointer("pointerenter", 1000, -50);
  for (let i = 0; i < 8; i++) { h.pointer("pointermove", 1000 + 10 * i, -40); h.run(500); }
  expect(h.mode).toBe("word"); // 4 s, past the first hold.
  expect(h.atRest()).toBe(false); // Letters near the cursor lean toward it.
  expect(h.shields.at(-1)).toBe(true);
  h.run(1600 + 1300);
  expect(h.mode).toBe("busy");
  h.pointer("pointerleave", 1000, -40);
  expect(h.shields.at(-1)).toBe(false);
});

test("a grab stretches after the pointer, Escape springs it back, and a full pull feeds the word", () => {
  const h = harness();
  h.controller.setActive(true);
  const h4 = mark.footerLetters[3], index = 3, x = h4.x + h4.w / 2;
  h.pointer("pointerdown", x, -50);
  expect(h.mask.dataset.held).toBe("true"); expect(h.mask.captured.has(1)).toBe(true);
  h.pointer("pointermove", x + 40, -50); h.run(300);
  const moved = (i: number) => parseFloat(h.letters[i].getAttribute("transform")!.slice(10)) - mark.restLetter(i).x;
  expect(moved(index)).toBeGreaterThan(10);
  expect(moved(index)).toBeGreaterThan(moved(index + 1)); expect(moved(index + 1)).toBeGreaterThan(moved(index + 3) - 1e-9);
  // The b opens its jaw as the pull grows.
  const shut = identity.markTransform(identity.wordmarkRest().h2);
  expect(h.pieces[1].getAttribute("transform")).not.toBe(shut);
  h.mask.dispatchEvent(Object.assign(new Event("keydown", { cancelable: true }), { key: "Escape" }));
  expect(h.mask.dataset.held).toBe("false"); expect(h.mask.captured.size).toBe(0);
  h.run(1000);
  // Back to the hover's small lean toward the cursor, jaw shut.
  expect(Math.abs(moved(index))).toBeLessThan(5); expect(h.mode).toBe("word");
  expect(h.pieces[1].getAttribute("transform")).toBe(shut);
  h.pointer("pointerdown", x, -50); h.run(100);
  h.pointer("pointermove", x + 100, -50); h.run(400);
  h.pointer("pointerup", x + 100, -50);
  expect(h.mode).toBe("busy"); expect(h.sounds).toContain("click");
  // A pull that falls short just springs back.
  const short = harness();
  short.controller.setActive(true);
  short.pointer("pointerdown", x, -50); short.run(100);
  short.pointer("pointermove", x + 20, -50); short.run(800);
  short.pointer("pointerup", x + 20, -50); short.mask.dispatchEvent(new Event("click")); // The browser's click after the release.
  short.pointer("pointerleave", x + 20, -50); short.run(1000);
  expect(short.mode).toBe("word"); expect(short.atRest()).toBe(true);
  // A still press is no pull, even when the layout moves under it.
  const still = harness();
  still.controller.setActive(true);
  still.pointer("pointerdown", x, -50); still.run(800);
  still.svg.rect = { ...still.svg.rect, top: 400, bottom: 400 + mark.footerViewBox.height };
  still.pointer("pointerup", x, -50); still.pointer("pointerleave", x, -50); still.run(1000);
  expect(still.mode).toBe("word");
});

test("keys drive the loop: Enter feeds the word, Enter in the solo skips a held script", () => {
  const h = harness();
  h.controller.setActive(true);
  const key = (name: string, repeat = false) => { const event = Object.assign(new Event("keydown", { cancelable: true }), { key: name, repeat }); h.mask.dispatchEvent(event); return event.defaultPrevented; };
  expect(key("Enter")).toBe(true);
  expect(h.mode).toBe("busy");
  // A held Space repeats; it neither scrolls the page nor acts again.
  expect(key(" ", true)).toBe(true); expect(h.mode).toBe("busy");
  h.run(mark.footerDurations.eat + mark.footerSoloSteps[0].dur + mark.footerSoloSteps[1].dur + 100);
  expect(h.mode).toBe("mark");
  expect(key(" ")).toBe(true);
  h.run(50);
  // The held ⴱ ended early, so the whole loop finishes sooner.
  h.run(soloLength - mark.footerSoloSteps[0].dur - mark.footerSoloSteps[1].dur - mark.footerSoloSteps[2].dur + 100);
  expect(h.mode).toBe("busy");
  // Assistive technology clicks the button without a pointer.
  const assisted = harness();
  assisted.controller.setActive(true);
  assisted.mask.dispatchEvent(new Event("click"));
  expect(assisted.mode).toBe("busy");
});

test("reduced motion, a hidden tab, a route change and dispose leave no clock or DOM behind", () => {
  const h = harness();
  h.state.reduced = true;
  h.controller.setActive(true);
  expect(h.rafs.size + h.timers.size).toBe(0); expect(h.mode).toBe("word"); expect(h.mask.dataset.grabbable).toBe("false");
  h.state.reduced = false;
  h.controller.setActive(true);
  h.run(mark.footerDurations.first + 600);
  expect(h.mode).toBe("busy");
  h.document.hidden = true; h.document.dispatchEvent(new Event("visibilitychange"));
  expect(h.rafs.size + h.timers.size).toBe(0);
  h.run(5000); expect(h.mode).toBe("busy");
  h.document.hidden = false; h.document.dispatchEvent(new Event("visibilitychange"));
  h.window.dispatchEvent(new Event("portfolio-route-start"));
  expect(h.mode).toBe("word"); expect(h.atRest()).toBe(true); expect(h.masked).toBeNull();
  h.run(200);
  h.controller.dispose();
  expect(h.svg.children.some((child) => child.name === "defs")).toBe(false);
  expect(h.atRest()).toBe(true); expect(h.masked).toBeNull();
  expect(h.mask.dataset).toEqual({});
  expect(h.mask.listeners + h.window.listeners + h.document.listeners).toBe(0);
  expect(h.rafs.size + h.timers.size).toBe(0);
  h.controller.setActive(true); h.run(5000);
  expect(h.rafs.size + h.timers.size).toBe(0);
  // Shown after a long hidden spell, the first hold is still 2.6 s.
  const late = harness();
  late.document.hidden = true; late.document.dispatchEvent(new Event("visibilitychange"));
  late.run(100000);
  late.controller.setActive(true);
  late.document.hidden = false; late.document.dispatchEvent(new Event("visibilitychange"));
  late.run(mark.footerDurations.first + 100);
  expect(late.mode).toBe("busy");
});
