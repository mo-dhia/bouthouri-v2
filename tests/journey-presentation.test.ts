import { afterEach, describe, expect, test } from "bun:test";
import { createJourneyPresentation } from "../src/sections/landing/3-journey/journey-presentation";
import type { JourneyFrame } from "../src/sections/landing/3-journey/journey-clock";
import { referencePixelsToVw, viewportDesign } from "../src/lib/viewport-design";

// Minimal inline-DOM surface: count mutations and normalize transforms as CSSOM
// does. No layout/clock/Three substitutes are needed to exercise presentation.
class InlineElement {
  attributes = new Map<string, string>();
  values = new Map<string, string>();
  lines: InlineElement[] = [];
  writes = { style: 0, attribute: 0, text: 0 };
  queries = 0;
  private content = "";
  style = {
    getPropertyValue: (property: string) => this.values.get(property) ?? "",
    setProperty: (property: string, value: string) => {
      this.writes.style++;
      this.values.set(property, property === "transform" ? value.replaceAll(",", ", ") : value);
    },
  };
  get textContent() { return this.content; }
  set textContent(value: string) { this.writes.text++; this.content = value; }
  getAttribute(name: string) { return this.attributes.get(name) ?? null; }
  setAttribute(name: string, value: string) { this.writes.attribute++; this.attributes.set(name, value); }
  removeAttribute(name: string) {
    if (name === "style") this.values.clear();
    else this.attributes.delete(name);
  }
  querySelectorAll(selector: string) {
    this.queries++;
    if (selector !== ".post-line") throw new Error(`Unexpected panel query: ${selector}`);
    return this.lines;
  }
}

const previousDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
const previousWidth = Object.getOwnPropertyDescriptor(globalThis, "innerWidth");
afterEach(() => {
  if (previousDocument) Object.defineProperty(globalThis, "document", previousDocument);
  else Reflect.deleteProperty(globalThis, "document");
  if (previousWidth) Object.defineProperty(globalThis, "innerWidth", previousWidth);
  else Reflect.deleteProperty(globalThis, "innerWidth");
});

function fixture(lang = "en", width = 1920) {
  Object.defineProperty(globalThis, "innerWidth", { configurable: true, value: width });
  const documentElement = { lang };
  Object.defineProperty(globalThis, "document", { configurable: true, value: { documentElement } });
  const beats = Array.from({ length: 4 }, () => new InlineElement());
  const panels = Array.from({ length: 2 }, () => {
    const element = new InlineElement();
    element.lines = [new InlineElement(), new InlineElement()];
    return element;
  });
  const context = new InlineElement(), stage = new InlineElement();
  const label = new InlineElement(), header = new InlineElement(), stepWindow = new InlineElement();
  const steps = Array.from({ length: 3 }, () => new InlineElement());
  const number = new InlineElement(), fill = new InlineElement();
  const cues = [new InlineElement(), new InlineElement()], loadStatus = new InlineElement();
  let opening = new InlineElement(), queries = 0;
  const singles = new Map([
    [".post-context", context], [".chapter", label], [".chapter-header", header],
    [".concept-step-window", stepWindow], [".progress-number", number],
    [".progress-fill", fill], [".load-status", loadStatus],
  ]);
  const cleanup = () => [...beats, ...panels, ...panels.flatMap((panel) => panel.lines), context, opening, loadStatus];
  const all = () => [...cleanup(), stage, label, header, stepWindow, ...steps, number, fill, ...cues];
  const root = {
    querySelector(selector: string) {
      queries++;
      return selector === ".glasses-opening" ? opening : singles.get(selector) ?? null;
    },
    querySelectorAll(selector: string) {
      queries++;
      if (selector === ".optical-beat") return beats;
      if (selector === ".post-concept,.post-extension") return panels;
      if (selector === "[data-concept-step]") return steps;
      if (selector === ".cue-label,.cue-echo") return cues;
      if (selector.startsWith(".optical-beat,")) return cleanup();
      throw new Error(`Unexpected root query: ${selector}`);
    },
  };
  const presentation = createJourneyPresentation(root as unknown as HTMLElement, stage as unknown as HTMLElement);
  const render = (time: number, openingTime = 26) => {
    const frame: JourneyFrame = { time, openingTime, progress: (time + openingTime) / 740 };
    presentation.frame(frame);
    presentation.optical(time);
    presentation.controls(frame);
  };
  return {
    presentation, render, stage, beats, panels, context, label, header, stepWindow,
    steps, number, fill, cues, loadStatus, documentElement,
    get opening() { return opening; },
    replaceOpening() { opening = new InlineElement(); },
    queryCount: () => queries + panels.reduce((sum, panel) => sum + panel.queries, 0),
    writes: () => all().reduce((total, element) => ({
      style: total.style + element.writes.style,
      attribute: total.attribute + element.writes.attribute,
      text: total.text + element.writes.text,
    }), { style: 0, attribute: 0, text: 0 }),
  };
}

describe("Journey presentation DOM cache", () => {
  test("optical lengths follow the fixed design at reference and scaled widths", () => {
    for (const width of [1920, 1440, 768, 960, 640, 412, 515]) {
      const f = fixture("en", width), reference = viewportDesign(width);
      f.render(0);
      const blur = Number.parseFloat(f.beats[0].values.get("filter")!.slice(5)) * width / 100;
      const translate = Number.parseFloat(f.beats[0].values.get("transform")!.split(",")[1]) * width / 100;
      expect(blur).toBeCloseTo(12 * width / reference.width, 10);
      expect(translate).toBeCloseTo(16 * width / reference.width, 10);
      // A profile crossing refreshes cached vw coefficients before repainting.
      Object.defineProperty(globalThis, "innerWidth", { configurable: true, value: 412 });
      f.presentation.refresh(); f.render(0);
      expect(f.beats[0].values.get("filter")).toBe(`blur(${referencePixelsToVw(12, viewportDesign(412))})`);
      f.presentation.dispose();
    }
  });

  test("keeps accepted optical, filter, tracking and post-line poses in both directions", () => {
    const f = fixture();
    for (const time of [0, 19, 27.5, 30, 27.5, 19, 0]) {
      f.render(time);
      const vw = (value: number) => referencePixelsToVw(value, viewportDesign(1920));
      const expected = time === 19 ? ["1", "blur(0vw)", "translate3d(0, 0vw, 0)", "0em", "false"]
        : time === 27.5 ? ["0.5", `blur(${vw(5)})`, `translate3d(0, ${vw(-4)}, 0)`, "0.0125em", "false"]
        : time === 30 ? ["0", `blur(${vw(10)})`, `translate3d(0, ${vw(-8)}, 0)`, "0.025em", "true"]
        : ["0", `blur(${vw(12)})`, `translate3d(0, ${vw(16)}, 0)`, "0.018em", "true"];
      const beat = f.beats[0];
      expect([beat.values.get("opacity"), beat.values.get("filter"), beat.values.get("transform"),
        beat.values.get("--focus-tracking"), beat.getAttribute("aria-hidden")]).toEqual(expected);
    }
    f.render(0);
    expect(f.opening.values.get("filter")).toBe("blur(0vw) contrast(1)");
    expect(f.opening.values.get("opacity")).toBe("1");
    f.render(80);
    expect(f.panels[0].lines[0].values.get("transform")).toBe("translate3d(0, 56%, 0)");
    expect(f.panels[0].lines[0].values.get("--focus-tracking")).toBe("0.0075em");
    expect(f.context.values.get("opacity")).toBe("0.15625");
    expect(f.opening.values.get("opacity")).toBe("0");
    for (const [time, concept, extension] of [
      [75.999, "hidden", "hidden"], [76, "visible", "hidden"],
      [93, "visible", "visible"], [123, "hidden", "visible"], [125, "hidden", "hidden"],
      [123, "hidden", "visible"], [93, "visible", "visible"], [76, "visible", "hidden"],
    ] as const) {
      f.render(time);
      expect(f.panels[0].values.get("visibility")).toBe(concept);
      expect(f.panels[1].values.get("visibility")).toBe(extension);
    }
    f.presentation.dispose();
  });

  test("preserves EN/AR chapter, concept, progress, cue and load-status boundaries on reversal", () => {
    for (const lang of ["en", "ar"]) {
      const f = fixture(lang);
      const checkpoints = [
        [27.999, "PERSPECTIVE", "منظور"], [28, "LOOK CLOSER", "انظر أقرب"],
        [73, "BEYOND", "أبعد"], [124, "PERSPECTIVE", "منظور"],
        [168, "CLARITY", "وضوح"], [211, "DIRECTION", "اتجاه"],
        [241, "PUT TO WORK", "أفكار تعمل"], [282, "", ""],
        [445, "CLARITY", "وضوح"], [541, "STRUCTURE, SET FREE", "بِنْيَة بلا قيود"],
      ] as const;
      for (const [time, en, ar] of [...checkpoints, ...checkpoints.toReversed()]) {
        f.render(time);
        expect(f.label.textContent).toBe(lang === "ar" ? ar : en);
        expect(f.header.getAttribute("data-concepts")).toBe(time >= 124 && time < 241 ? "true" : "false");
      }
      for (const time of [123.999, 124, 168, 211, 241, 211, 168, 124, 123.999]) {
        f.render(time);
        const active = time >= 124 && time < 241;
        expect(f.label.getAttribute("aria-hidden")).toBe(String(active));
        expect(f.stepWindow.getAttribute("aria-hidden")).toBe(String(!active));
        expect(f.steps.map((step) => step.getAttribute("aria-hidden"))).toEqual(
          time === 168 ? ["true", "false", "true"]
            : time === 211 ? ["true", "true", "false"]
            : time === 124 ? ["false", "true", "true"] : ["true", "true", "true"],
        );
      }
      f.render(168);
      expect(f.steps[0].values.get("transform")).toBe("translate3d(0, -56%, 0)");
      for (const time of [305.999, 306, 710, 714, 709.999, 305.999]) {
        f.render(time);
        expect(f.loadStatus.style.getPropertyValue("display")).toBe(time >= 306 ? "none" : "");
        expect(f.cues.map((cue) => cue.textContent)).toEqual(Array(2).fill(lang === "ar"
          ? time >= 710 ? "عودة إلى البداية" : "مرّر للاستكشاف"
          : time >= 710 ? "BACK TO THE START" : "SCROLL TO EXPLORE"));
        if (time === 714) {
          expect(f.number.textContent).toBe("100");
          expect(f.fill.values.get("transform")).toBe("scaleX(1)");
          expect(f.stage.getAttribute("data-story-time")).toBe("714.0000");
        }
      }
      f.presentation.dispose();
    }
  });

  test("does no hot-path queries or repeated writes, while opening-only progress still updates", () => {
    const f = fixture();
    f.render(0, 0);
    const queries = f.queryCount(), writes = f.writes();
    f.render(0, 0);
    expect(f.queryCount()).toBe(queries);
    expect(f.writes()).toEqual(writes);
    f.render(0, 13);
    expect(f.stage.getAttribute("data-opening-time")).toBe("13.0000");
    expect(f.number.textContent).toBe("02");
    expect(f.fill.values.get("transform")).toBe("scaleX(0.01756756756756757)");
    f.render(19);
    const textWrites = f.writes().text;
    f.render(19.001);
    expect(f.writes().text).toBe(textWrites);
    expect(f.queryCount()).toBe(queries);
    f.presentation.dispose();
  });

  test("refreshes replaced measurement nodes and repaints an unchanged score after external clears", () => {
    const f = fixture();
    f.render(80);
    const staleOpening = f.opening, staleLine = f.panels[0].lines[0];
    f.replaceOpening();
    f.panels[0].lines = [new InlineElement()];
    f.presentation.refresh();
    expect(staleOpening.values.size).toBe(0);
    expect(staleLine.values.size).toBe(0);
    const queries = f.queryCount();
    f.render(80);
    expect(f.opening.values.get("opacity")).toBe("0");
    expect(f.panels[0].lines[0].values.get("transform")).toBe("translate3d(0, 56%, 0)");
    expect(staleOpening.values.size).toBe(0);
    expect(staleLine.values.size).toBe(0);
    f.panels[0].lines[0].removeAttribute("style");
    f.label.textContent = "external reset";
    f.header.setAttribute("data-concepts", "true");
    f.render(80);
    expect(f.panels[0].lines[0].values.get("transform")).toBe("translate3d(0, 56%, 0)");
    expect(f.label.textContent).toBe("BEYOND");
    expect(f.header.getAttribute("data-concepts")).toBe("false");
    expect(f.queryCount()).toBe(queries);
    f.presentation.dispose();
    expect(f.opening.values.size).toBe(0);
    expect(f.beats[0].getAttribute("aria-hidden")).toBeNull();
    const writes = f.writes();
    f.render(19);
    f.presentation.refresh();
    expect(f.writes()).toEqual(writes);
    expect(f.queryCount()).toBe(queries);
  });

  test("mode/route remounts use new refs and the current locale", () => {
    const first = fixture();
    first.render(714);
    first.presentation.dispose();
    const firstWrites = first.writes();
    const next = fixture("ar");
    next.render(0, 0);
    expect(next.label.textContent).toBe("منظور");
    expect(next.cues[0].textContent).toBe("مرّر للاستكشاف");
    expect(next.number.textContent).toBe("00");
    // A surviving locale transaction is read at presentation time too.
    next.documentElement.lang = "en";
    next.render(0, 0);
    expect(next.label.textContent).toBe("PERSPECTIVE");
    expect(first.writes()).toEqual(firstWrites);
    next.presentation.dispose();
  });
});
