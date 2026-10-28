import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import postcss, { type AtRule, type Container, type Document as CssDocument } from "postcss";
import { fixedViewportMedia } from "../../../scripts/lib/fixed-viewport-css";
import { viewportDesigns, type ViewportDesign } from "@/lib/viewport-design";

const servicesCss = readFileSync(new URL("./services.module.css", import.meta.url), "utf8");
// Read the actual parent API; no second copy of shared CSS is supplied to the test.
const parentCss = readFileSync(new URL("../../components/layout/editorial/editorial.module.css", import.meta.url), "utf8");

// Exact --ed-gutter declarations retained from public 0ht1z612ephb8.css,
// https://www.thisisgazzar.com/_next/static/immutable/chunks/0ht1z612ephb8.css
// Their media queries are evaluated at the three agreed source reference canvases.
const sourceGutterFixture = `
.editorial-page{--ed-gutter:5.3vw}
html[lang=ar] .editorial-page{--ed-gutter:6vw}
@media (max-width:700px){.editorial-page{--ed-gutter:6vw}}
@media (max-width:700px),(max-aspect-ratio:8/9){.practice-page{--ed-gutter:7vw}}
`;
const profiles = Object.values(viewportDesigns);
const expected = { desktop: { en: "5.3vw", ar: "6vw" }, tablet: { en: "7vw", ar: "6vw" }, mobile: { en: "7vw", ar: "6vw" } } as const;

function mediaActive(query: string, design: ViewportDesign) {
  const normalized = query.replace(/\s+/g, " ").trim();
  const fixed = { "(width > 1024px)": "desktop", "(600px < width <= 1024px)": "tablet", "(width <= 600px)": "mobile" } as const;
  if (normalized in fixed) return fixed[normalized as keyof typeof fixed] === design.key;
  const resolved = fixedViewportMedia(query, design);
  if (resolved === false) return false;
  if (resolved !== "") throw new Error(`Unsupported gutter fixture media: ${query}`);
  return true;
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
function gutter(css: string, design: ViewportDesign, locale: "en" | "ar") {
  let winner: { value: string; priority: number[] } | undefined;
  postcss.parse(css).walkDecls("--ed-gutter", (declaration) => {
    const rule = declaration.parent;
    if (rule?.type !== "rule") return;
    let ancestor: Container | CssDocument | undefined = rule.parent;
    while (ancestor) { if (ancestor.type === "atrule" && (ancestor as AtRule).name === "media" && !mediaActive((ancestor as AtRule).params, design)) return; ancestor = ancestor.parent; }
    for (const selector of postcss.list.comma(rule.selector)) {
      if (!matchesServicesMain(selector, locale)) continue;
      const priority = [Number(Boolean(declaration.important)), ...specificity(selector)];
      if (!winner || compare(priority, winner.priority) >= 0) winner = { value: declaration.value.trim(), priority };
    }
  });
  return winner?.value;
}
function requireParentGutter(css: string, design: ViewportDesign, locale: "en" | "ar") {
  const value = gutter(css, design, locale);
  if (!value) throw new Error(`Missing parent --ed-gutter for Services ${locale}/${design.key}; padding/inset declarations become invalid.`);
  return value;
}

describe("Services source gutter inheritance", () => {
  test("public-source specificity yields EN5.3/7/7 and AR6/6/6", () => {
    for (const design of profiles) for (const locale of ["en", "ar"] as const) expect(gutter(sourceGutterFixture, design, locale)).toBe(expected[design.key][locale]);
  });

  test("actual shared main provides the source gutter in every Services locale/profile", () => {
    for (const design of profiles) for (const locale of ["en", "ar"] as const) expect(requireParentGutter(parentCss, design, locale)).toBe(requireParentGutter(sourceGutterFixture, design, locale));
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
    expect(() => requireParentGutter(missing.toString(), viewportDesigns.desktop, "en")).toThrow("Missing parent --ed-gutter");
    expect(() => requireParentGutter(missing.toString(), viewportDesigns.tablet, "ar")).toThrow("Missing parent --ed-gutter");
  });
});
