import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import postcss, { type AtRule, type Container, type Document as CssDocument } from "postcss";
import { fixedViewportMedia } from "../../../scripts/lib/fixed-viewport-css";
import { viewportDesigns, type ViewportDesign } from "@/lib/viewport-design";

const servicesCss = readFileSync(new URL("./services.module.css", import.meta.url), "utf8");
// Read the actual parent API; no second copy of shared CSS is supplied to the test.
const parentCss = readFileSync(new URL("../../components/layout/editorial/editorial.module.css", import.meta.url), "utf8");
const globalCss = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

// Exact --ed-gutter declarations retained from public 0ht1z612ephb8.css,
// https://www.thisisgazzar.com/_next/static/immutable/chunks/0ht1z612ephb8.css
// Width queries resolve at the three reference widths; aspect queries stay live in each profile.
const sourceGutterFixture = `
.editorial-page{--ed-gutter:5.3vw}
html[lang=ar] .editorial-page{--ed-gutter:6vw}
@media (max-width:700px){.editorial-page{--ed-gutter:6vw}}
@media (max-width:700px),(max-aspect-ratio:8/9){.practice-page{--ed-gutter:7vw}}
`;
type Viewport = { design: ViewportDesign; width: number; height: number };
const canvas = (design: ViewportDesign, width: number = design.width, height: number = design.height): Viewport => ({ design, width, height });
const references = Object.values(viewportDesigns).map((design) => canvas(design));
// One physical window per width profile crosses the source's live 8/9 compact threshold.
const crossings = [canvas(viewportDesigns.desktop, 1920, 2400), canvas(viewportDesigns.tablet, 1024, 700), canvas(viewportDesigns.mobile, 600, 400)];
const expected = { desktop: { en: "5.3vw", ar: "6vw" }, tablet: { en: "7vw", ar: "6vw" }, mobile: { en: "7vw", ar: "6vw" } } as const;

function liveFeature(feature: string, { width, height }: Viewport) {
  const match = /^\((min-|max-)?(aspect-ratio|orientation)\s*:\s*([^()]+)\)$/.exec(feature.trim());
  if (!match) throw new Error(`Unsupported gutter fixture media: ${feature}`);
  if (match[2] === "orientation") return (height >= width ? "portrait" : "landscape") === match[3].trim();
  const [numerator, denominator] = match[3].split("/").map(Number), actual = width / height, ratio = numerator / denominator;
  return match[1] === "min-" ? actual >= ratio : match[1] === "max-" ? actual <= ratio : actual === ratio;
}
function mediaActive(query: string, viewport: Viewport) {
  const normalized = query.replace(/\s+/g, " ").trim();
  const fixed = { "(width > 1024px)": "desktop", "(600px < width <= 1024px)": "tablet", "(width <= 600px)": "mobile" } as const;
  if (normalized in fixed) return fixed[normalized as keyof typeof fixed] === viewport.design.key;
  const resolved = fixedViewportMedia(query, viewport.design);
  if (resolved === false) return false;
  return resolved === "" || postcss.list.comma(resolved).some((branch) => branch.split(/\s+and\s+/).every((feature) => liveFeature(feature, viewport)));
}

function normalizedSelector(selector: string) { return selector.replace(/:global\(([^()]+)\)/g, "$1").replace(/\s+/g, " ").trim(); }
function matchesServicesMain(selector: string, locale: "en" | "ar") {
  const normalized = normalizedSelector(selector), language = /html\[lang=['"]?(en|ar)['"]?\]/.exec(normalized);
  if (language && language[1] !== locale) return false;
  const target = normalized.replace(/html\[lang=['"]?(en|ar)['"]?\]\s*/g, "");
  if (![".editorial-page", ".practice-page", ".root > main", ".root > main.practice-page"].includes(target)) throw new Error(`Unknown Services gutter parent selector: ${selector}`);
  return true;
}
function specificity(selector: string) {
  const normalized = normalizedSelector(selector), attributes = normalized.match(/\[[^\]]*\]/g)?.length ?? 0, plain = normalized.replace(/\[[^\]]*\]/g, "");
  return [(plain.match(/#[\w-]+/g) ?? []).length, (plain.match(/\.[\w-]+/g) ?? []).length + attributes, (plain.replace(/[.#][\w-]+/g, "").match(/[a-zA-Z][\w-]*/g) ?? []).length];
}
function compare(a: number[], b: number[]) { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i]; return 0; }
function gutter(css: string, viewport: Viewport, locale: "en" | "ar") {
  let winner: { value: string; priority: number[] } | undefined;
  postcss.parse(css).walkDecls("--ed-gutter", (declaration) => {
    const rule = declaration.parent;
    if (rule?.type !== "rule") return;
    let ancestor: Container | CssDocument | undefined = rule.parent;
    while (ancestor) { if (ancestor.type === "atrule" && (ancestor as AtRule).name === "media" && !mediaActive((ancestor as AtRule).params, viewport)) return; ancestor = ancestor.parent; }
    for (const selector of postcss.list.comma(rule.selector)) {
      if (!matchesServicesMain(selector, locale)) continue;
      const priority = [Number(Boolean(declaration.important)), ...specificity(selector)];
      if (!winner || compare(priority, winner.priority) >= 0) winner = { value: declaration.value.trim(), priority };
    }
  });
  return winner?.value;
}
function requireParentGutter(css: string, viewport: Viewport, locale: "en" | "ar") {
  const value = gutter(css, viewport, locale);
  if (!value) throw new Error(`Missing parent --ed-gutter for Services ${locale}/${viewport.design.key}; padding/inset declarations become invalid.`);
  return value;
}

describe("Services source gutter inheritance", () => {
  test("public-source specificity yields EN5.3/7/7 and AR6/6/6 at the references and keeps the compact aspect live", () => {
    for (const viewport of references) for (const locale of ["en", "ar"] as const) expect(gutter(sourceGutterFixture, viewport, locale)).toBe(expected[viewport.design.key][locale]);
    expect(crossings.map((viewport) => [gutter(sourceGutterFixture, viewport, "en"), gutter(sourceGutterFixture, viewport, "ar")])).toEqual([["7vw", "6vw"], ["5.3vw", "6vw"], ["7vw", "6vw"]]);
  });

  test("actual shared main provides the source gutter in every Services locale/profile and live aspect", () => {
    const gutters = (css: string) => Object.fromEntries([...references, ...crossings].flatMap((viewport) => (["en", "ar"] as const)
      .map((locale) => [`${viewport.design.key} ${viewport.width}x${viewport.height} ${locale}`, requireParentGutter(css, viewport, locale)])));
    expect(gutters(parentCss)).toEqual(gutters(sourceGutterFixture));
  });

  test("Services never shadows its parent's gutter and all four body compositions consume it", () => {
    const parsed = postcss.parse(servicesCss), ownedDeclarations: string[] = [];
    parsed.walkDecls("--ed-gutter", (declaration) => { ownedDeclarations.push(declaration.toString()); });
    expect(ownedDeclarations).toEqual([]);
    for (const profile of parsed.nodes.filter((node): node is AtRule => node.type === "atrule" && node.name === "media")) {
      for (const [selector, property] of [[".practice-opening", "padding"], [":global(.solving-page) .practice-hero-type", "left"], [".service-index", "padding"], [".practice-end", "padding"]]) {
        const consumers: string[] = [];
        profile.walkRules(selector, (rule) => { rule.walkDecls(property, (declaration) => { if (declaration.value.includes("var(--ed-gutter)")) consumers.push(declaration.value); }); });
        expect(consumers.length).toBeGreaterThan(0);
      }
    }
  });

  test("the parent-dependency regression rejects the missing-variable desktop failure", () => {
    const missing = postcss.parse(parentCss);
    missing.walkDecls("--ed-gutter", (declaration) => { declaration.remove(); });
    expect(() => requireParentGutter(missing.toString(), canvas(viewportDesigns.desktop), "en")).toThrow("Missing parent --ed-gutter");
    expect(() => requireParentGutter(missing.toString(), canvas(viewportDesigns.tablet), "ar")).toThrow("Missing parent --ed-gutter");
  });
});

// Relevant original margin/padding declarations, preserving stylesheet order:
// 0ht1z612ephb8.css typography/common rules, then 36vl4h0t25ivv.css masks.
const sourceTypographyFixture = `
html[data-typography=questrial-cairo][lang=ar] :is(.masked-text-line,.editorial-line){margin-block:-.19em;padding-block:.19em}
.editorial-line{margin-block:-.07em;padding-block:.07em}
html[lang=ar] .editorial-line{margin-block:-.13em;padding-block:.13em}
`;
const sourceMaskFixture = `
.editorial-page .masked-text .masked-text-line{margin-block:-.09em;padding-block:.09em}
html[lang=ar] .masked-text .masked-text-line{margin-block:-.14em;padding-block:.14em}
`;
type InkTarget = "server-mask" | "rendered-mask" | "editorial-line";
type InkNode = { tag: string; classes: string[]; attributes?: Record<string, string> };

/** Only the descendant/class/:is selectors used by these ink-padding rules. */
function inkSelector(selector: string, module: boolean) {
  if (!module) return selector;
  const globals: string[] = [];
  return selector.replace(/:global\(([^()]+)\)/g, (_, global: string) => `§${globals.push(global) - 1}§`)
    .replace(/\.([\w-]+)/g, ".local-$1").replace(/§(\d+)§/g, (_, index: string) => globals[Number(index)]);
}
function inkAlternatives(selector: string): string[] {
  const group = /:is\(([^()]+)\)/.exec(selector);
  if (!group) return [selector];
  return postcss.list.comma(group[1]).flatMap((choice) => inkAlternatives(selector.replace(group[0], choice)));
}
function inkMatches(selector: string, locale: "en" | "ar", target: InkTarget) {
  const nodes: InkNode[] = [
    { tag: "html", classes: [], attributes: { lang: locale, "data-typography": "questrial-cairo" } },
    { tag: "main", classes: ["editorial-page", "practice-page", "solving-page"] },
    { tag: "div", classes: ["local-page"] },
  ];
  if (target !== "editorial-line") nodes.push({ tag: "span", classes: ["masked-text", "local-masked-text"] });
  nodes.push({ tag: "span", classes: target === "rendered-mask" ? ["masked-rendered-line-mask", "masked-text-line"] : target === "server-mask" ? ["editorial-line", "local-editorial-line", "masked-text-line", "local-masked-text-line"] : ["editorial-line", "local-editorial-line"] });
  const compounds = selector.trim().split(/\s+/);
  function matches(compound: string, node: InkNode) {
    const tag = /^[a-z]+/.exec(compound)?.[0];
    if (tag && tag !== node.tag) return false;
    for (const name of compound.matchAll(/\.([\w-]+)/g)) if (!node.classes.includes(name[1])) return false;
    for (const attribute of compound.matchAll(/\[([\w-]+)=['"]?([\w-]+)['"]?\]/g)) if (node.attributes?.[attribute[1]] !== attribute[2]) return false;
    return true;
  }
  let index = nodes.length - 1;
  if (!matches(compounds.pop()!, nodes[index--])) return false;
  while (compounds.length) {
    const compound = compounds.pop()!;
    while (index >= 0 && !matches(compound, nodes[index])) index--;
    if (index-- < 0) return false;
  }
  return true;
}
function ink(css: { text: string; module: boolean }[], viewport: Viewport, locale: "en" | "ar", target: InkTarget) {
  const result = new Map<string, { value: string; priority: number[] }>();
  for (const sheet of css) postcss.parse(sheet.text).walkDecls(/^(margin|padding)-block$/, (declaration) => {
    const rule = declaration.parent;
    if (rule?.type !== "rule" || !/\.(?:masked-text-line|masked-rendered-line-mask|editorial-line)(?![\w-])/.test(rule.selector)) return;
    let ancestor: Container | CssDocument | undefined = rule.parent;
    while (ancestor) { if (ancestor.type === "atrule" && (ancestor as AtRule).name === "media" && !mediaActive((ancestor as AtRule).params, viewport)) return; ancestor = ancestor.parent; }
    for (const selector of postcss.list.comma(rule.selector).flatMap((item) => inkAlternatives(inkSelector(item, sheet.module)))) {
      if (!inkMatches(selector, locale, target)) continue;
      const priority = [Number(Boolean(declaration.important)), ...specificity(selector)], previous = result.get(declaration.prop);
      if (!previous || compare(priority, previous.priority) >= 0) result.set(declaration.prop, { value: declaration.value.trim(), priority });
    }
  });
  return Object.fromEntries([...result].map(([property, item]) => [property, item.value]));
}

describe("Services source masked-line ink padding", () => {
  test("source36 wins the equal-specificity earlier AR typography .19em while plain editorial lines retain it", () => {
    const early = [{ text: sourceTypographyFixture, module: false }], source = [...early, { text: sourceMaskFixture, module: false }];
    expect(specificity("html[data-typography=questrial-cairo][lang=ar] .masked-text-line")).toEqual(specificity("html[lang=ar] .masked-text .masked-text-line"));
    expect(ink(early, canvas(viewportDesigns.tablet), "ar", "server-mask")).toEqual({ "margin-block": "-.19em", "padding-block": ".19em" });
    expect(ink(source, canvas(viewportDesigns.tablet), "ar", "server-mask")).toEqual({ "margin-block": "-.14em", "padding-block": ".14em" });
    expect(ink(source, canvas(viewportDesigns.tablet), "ar", "editorial-line")).toEqual({ "margin-block": "-.19em", "padding-block": ".19em" });
  });

  test("actual global/module cascade matches source for server masks, raw runtime masks and editorial lines in all six profiles", () => {
    const source = [{ text: sourceTypographyFixture + sourceMaskFixture, module: false }], actual = [{ text: globalCss, module: false }, { text: servicesCss, module: true }];
    for (const viewport of [...references, ...crossings]) for (const locale of ["en", "ar"] as const) for (const target of ["server-mask", "rendered-mask", "editorial-line"] as const) {
      const expected = ink(source, viewport, locale, target);
      expect(expected["padding-block"]).toBe(target === "editorial-line" ? locale === "ar" ? ".19em" : ".07em" : locale === "ar" ? ".14em" : ".09em");
      expect(ink(actual, viewport, locale, target)).toEqual(expected);
    }
  });
});
