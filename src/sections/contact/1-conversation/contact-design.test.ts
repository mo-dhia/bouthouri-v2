import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import postcss, { type AtRule } from "postcss";
import { formatStylesheet } from "../../../../scripts/lib/css-format";

const file = new URL("./contact.module.css", import.meta.url);
const css = readFileSync(file, "utf8");
const sheet = postcss.parse(css);
const profiles = sheet.nodes.filter((node): node is AtRule => node.type === "atrule" && node.name === "media");

function declaration(profile: AtRule, selector: string, property: string) {
  let value = "";
  profile.walkRules((rule) => {
    if (rule.selector === selector) rule.walkDecls(property, (decl) => { value = decl.value; });
  });
  return value;
}
/** First shorthand component resolved at a physical viewport: vw follows width, svh follows height. */
function length(value: string, width: number, height: number) {
  let depth = 0, end = value.length;
  for (let index = 0; index < value.length; index++) {
    if (value[index] === "(") depth++; else if (value[index] === ")") depth--;
    else if (value[index] === " " && !depth) { end = index; break; }
  }
  const expression = value.slice(0, end).replace(/var\(--[\w-]+, ([\d.]+)\)/g, "$1")
    .replace(/(-?[\d.]+)vw\b/g, (_, n: string) => String(Number(n) * width / 100))
    .replace(/(-?[\d.]+)svh\b/g, (_, n: string) => String(Number(n) * height / 100))
    .replace(/\bcalc\(/g, "(").replace(/\b(min|max)\(/g, "Math.$1(");
  expect(expression.replace(/Math\.(?:min|max)/g, "")).toMatch(/^[\d.\s()+\-*/,]+$/);
  return Function(`return ${expression}`)() as number;
}

test("Contact CSS has only three exclusive design profiles, retains source geometry at each reference viewport and scales it uniformly", () => {
  expect(profiles.map((profile) => profile.params)).toEqual(["(width > 1024px)", "(600px < width <= 1024px)", "(width <= 600px)"]);
  const expected = [
    { width: 1920, viewport: 1080, height: 1080, padTop: 205.2, title: 216, arTitle: 194.4, conversationTop: 140.4 },
    { width: 768, viewport: 1024, height: 1024, padTop: 194.56, title: 87.55, arTitle: 111.35, conversationTop: 133.12 },
    { width: 412, viewport: 915, height: 841.8, padTop: 135, title: 50.264, arTitle: 86.52, conversationTop: 91.5 },
  ];
  expected.forEach((reference, index) => {
    const profile = profiles[index];
    const height = declaration(profile, ".contact-opening", index === 2 ? "min-height" : "height");
    const padTop = declaration(profile, ".contact-opening", "padding-top") || declaration(profile, ".editorial-opening", "padding");
    const top = declaration(profile, ".contact-conversation", "padding-top") || declaration(profile, ".contact-conversation", "padding");
    const lengths = [
      [height, reference.height, .01], [padTop, reference.padTop, .01],
      [declaration(profile, ".contact-question", "font-size"), reference.title, .01],
      [declaration(profile, "html[lang=ar] .content .contact-question", "font-size"), reference.arTitle, .02],
      [top, reference.conversationTop, .01],
    ] as const;
    for (const [value, expected, tolerance] of lengths) {
      expect(Math.abs(length(value, reference.width, reference.viewport) - expected)).toBeLessThan(tolerance);
      for (const factor of [.5, 1.5]) {
        expect(length(value, reference.width * factor, reference.viewport * factor)).toBeCloseTo(length(value, reference.width, reference.viewport) * factor, 6);
      }
    }
    // The opening is a physical stage: a taller window extends it without recomposing the width profile.
    expect(length(height, reference.width, reference.viewport * 1.4)).toBeCloseTo(reference.height * 1.4, 6);
  });
});

test("Contact CSS is canonically formatted, keeps physical height live and selects layouts by width alone", () => {
  expect(formatStylesheet(css, file.pathname)).toBe(css);
  sheet.walkDecls((decl) => {
    expect(decl.value).not.toMatch(/\bclamp\(|\drem\b|\dv(?:min|max)\b/);
  });
  sheet.walkAtRules("media", (query) => {
    if (query.parent?.type !== "root") expect(query.params).not.toMatch(/\b(?:min-|max-)?(?:width|height)\b/);
  });
});
