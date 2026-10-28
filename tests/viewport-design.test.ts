import { expect, test } from "bun:test";
import { designHeight, designPixels, designScale, pixelsToVw, viewportDesign, viewportDesigns } from "../src/lib/viewport-design";
import { fixedViewportMedia, fixedViewportStylesheet, fixedViewportValue } from "../scripts/lib/fixed-viewport-css";
import postcss from "postcss";
import { readFileSync } from "node:fs";

test("three reference canvases scale uniformly by width without an orientation input", () => {
  for (const design of Object.values(viewportDesigns)) {
    expect(viewportDesign(design.width)).toBe(design);
    expect(designScale(design.width)).toBe(1);
    expect(designHeight(design.width)).toBe(design.height);
  }
  for (const width of [320, 412, 520, 600, 601, 650, 768, 1024, 1025, 1440, 1920, 2560]) {
    const design = viewportDesign(width), factor = width / design.width;
    expect(designHeight(width)).toBeCloseTo(design.height * factor, 12);
    expect(designPixels(42, width)).toBeCloseTo(42 * factor, 12);
    expect(Number.parseFloat(pixelsToVw(designPixels(42, width), width))).toBeCloseTo(4200 / design.width, 12);
  }
  expect(viewportDesign(650).key).toBe("tablet");
  expect(viewportDesign(1025).key).toBe("desktop");
});

test("conversion freezes actual reference math, including a clamped preferred value", () => {
  const { desktop, tablet, mobile } = viewportDesigns;
  expect(fixedViewportValue("100svh", desktop)).toBe("56.25vw");
  expect(fixedViewportValue("100dvh", tablet)).toBe("133.333333333333vw");
  expect(fixedViewportValue("100vh", mobile)).toBe("222.087378640777vw");
  expect(fixedViewportValue("clamp(130px, 20.4vw, 390px)", desktop)).toBe("20.3125vw");
  expect(fixedViewportValue("calc(160px - clamp(20px, 4.3svh, 60px))", desktop)).toBe("5.914583333333vw");
  expect(fixedViewportValue("min(1em, 7.1vw)", desktop)).toBe("min(1em, 7.1vw)");
  expect(fixedViewportValue("calc(1rem * var(--type-scale, 1))", desktop)).toBe("calc(0.833333333333vw * var(--type-scale, 1))");
  expect(fixedViewportValue("clamp(100px, calc(46svh / var(--title-lines)), 400px)", desktop)).toBe("max(5.208333333333vw, min(calc(25.875vw / var(--title-lines)), 20.833333333333vw))");
  expect(fixedViewportValue("1px solid #fff", desktop, "border")).toBe("1px solid #fff");
  expect(fixedViewportValue("blur(12px)", mobile, "filter")).toBe("blur(12px)");
  expect(fixedViewportValue("1.2px", desktop, "stroke-width")).toBe("1.2");
  expect(fixedViewportValue("1px", mobile, "stroke-dashoffset")).toBe("1");
  expect(fixedViewportValue("clamp(26px, 6.8vw, 46px)", mobile, "font-size")).toBe("6.796116504854vw");
  const payload = "url(\"data:image/svg+xml,<svg width='128'/>\")";
  expect(fixedViewportValue(payload, mobile)).toBe(payload);
});

test("reference geometry queries cannot change composition inside a category", () => {
  const { desktop, tablet, mobile } = viewportDesigns;
  expect(fixedViewportMedia("(max-width:700px)", tablet)).toBe(false);
  expect(fixedViewportMedia("(max-aspect-ratio:6/5) and (min-width:701px)", tablet)).toBe("");
  expect(fixedViewportMedia("(max-width:700px), (max-aspect-ratio:8/9)", tablet)).toBe("");
  expect(fixedViewportMedia("(max-height:600px) and (min-aspect-ratio:6/5)", desktop)).toBe(false);
  expect(fixedViewportMedia("(max-width:900px), (any-pointer:coarse)", desktop)).toBe("(any-pointer:coarse)");
  expect(fixedViewportMedia("(max-width:900px), (any-pointer:coarse)", mobile)).toBe("");
  expect(fixedViewportMedia("(prefers-reduced-motion:reduce)", tablet)).toBe("(prefers-reduced-motion:reduce)");
});

test("exclusive profile cascades preserve desktop-only and mobile-only selectors without leaks", () => {
  const css = fixedViewportStylesheet(".box{height:100svh;margin:16px}@media(min-width:1800px){.only{display:block}}@media(max-width:700px){.box{margin:20px}}@media(prefers-reduced-motion:reduce){.box{animation:none}}", "fixture.css");
  const tree = postcss.parse(css), profiles = tree.nodes.filter((node) => node.type === "atrule");
  expect(profiles).toHaveLength(3);
  expect(profiles.map((node) => node.type === "atrule" ? node.params : "")).toEqual(["(width > 1024px)", "(600px < width <= 1024px)", "(width <= 600px)"]);
  expect(profiles[0].toString()).toContain(".only");
  expect(profiles[1].toString()).not.toContain(".only");
  expect(profiles[2].toString()).not.toContain(".only");
  expect(css).not.toMatch(/\b\d+(?:s|d)?vh\b|clamp\(/);
  for (const profile of profiles) expect(profile.toString()).toContain("prefers-reduced-motion");
  expect(profiles[2].toString()).toContain("height: 222.088vw");
});

test("SVG paint scales once while non-scaling strokes cross the outer screen boundary", () => {
  const reference = viewportDesigns.desktop;
  const frameVw = Number.parseFloat(fixedViewportValue("14px", reference));
  const stroke = Number(fixedViewportValue("1.2px", reference, "stroke-width"));
  expect(stroke * frameVw * 1920 / 100 / 16).toBeCloseTo(1.05, 9);
  expect(stroke * frameVw * 1440 / 100 / 16).toBeCloseTo(.7875, 9);
  expect(fixedViewportValue("-1px", reference, "stroke-dashoffset")).toBe("-1");
  const tree = postcss.parse(fixedViewportStylesheet("", "src/sections/landing/3-journey/journey.module.css"));
  for (const [index, design] of Object.values(viewportDesigns).entries()) {
    const profile = tree.nodes[index + 1]; // The first node is the design contract comment.
    let screenVw = 0;
    if (profile.type === "atrule") profile.walkRules((rule) => {
      if (rule.selector.includes(".work-quiet-symbol path")) rule.walkDecls("stroke-width", (decl) => { screenVw = Number.parseFloat(decl.value); });
    });
    expect(screenVw).toBeGreaterThan(0);
    const width = design.width * .8;
    // non-scaling-stroke ignores the SVG frame scale, so its CSS width supplies it.
    expect(screenVw * width / 100).toBeCloseTo(1, 5);
  }
});

test("shipped CSS host heights agree with the runtime design canvases", () => {
  const files = [
    ["src/app/globals.css", ":root", "--design-height"],
    ["src/sections/landing/1-hero/hero.module.css", ".hero", "height"],
    ["src/sections/landing/1-hero/hero.module.css", ".scene", "height"],
    ["src/components/layout/header/header.module.css", ".readingNavigation", "block-size"],
    ["src/sections/landing/2-story/story-scene.module.css", ".environment", "height"],
    ["src/sections/landing/3-journey/journey.module.css", ".journey :global(.stage)", "height"],
  ];
  for (const [file, selector, property] of files) {
    const root = postcss.parse(readFileSync(file, "utf8"));
    const profiles = root.nodes.filter((node) => node.type === "atrule" && node.name === "media");
    expect(profiles).toHaveLength(3);
    for (const [index, design] of Object.values(viewportDesigns).entries()) {
      let value = "";
      const profile = profiles[index];
      if (profile.type === "atrule") profile.walkRules((rule) => {
        if (rule.selectors.includes(selector)) rule.walkDecls(property, (decl) => { value = decl.value.trim(); });
      });
      expect(value).toEndWith("vw");
      // Serializer-safe coefficients may overshoot by <.01 reference CSS px.
      expect(Math.abs(Number.parseFloat(value) * design.width / 100 - design.height)).toBeLessThan(.01);
    }
  }
});
