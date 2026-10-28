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
const vw = (value: string, width: number) => Number.parseFloat(/(-?[\d.]+)vw/.exec(value)![1]) * width / 100;

test("Contact CSS has only three exclusive design profiles and retains source reference geometry", () => {
  expect(profiles.map((profile) => profile.params)).toEqual(["(width > 1024px)", "(600px < width <= 1024px)", "(width <= 600px)"]);
  const expected = [
    { width: 1920, height: 1080, padTop: 205.2, title: 216, arTitle: 194.4, conversationTop: 140.4 },
    { width: 768, height: 1024, padTop: 194.56, title: 87.55, arTitle: 111.35, conversationTop: 133.12 },
    { width: 412, height: 841.8, padTop: 135, title: 50.264, arTitle: 86.52, conversationTop: 91.5 },
  ];
  expected.forEach((reference, index) => {
    const profile = profiles[index];
    const height = declaration(profile, ".contact-opening", index === 2 ? "min-height" : "height");
    const padTop = declaration(profile, ".contact-opening", "padding-top") || declaration(profile, ".editorial-opening", "padding");
    expect(Math.abs(vw(height, reference.width) - reference.height)).toBeLessThan(.01);
    expect(Math.abs(vw(padTop, reference.width) - reference.padTop)).toBeLessThan(.01);
    expect(Math.abs(vw(declaration(profile, ".contact-question", "font-size"), reference.width) - reference.title)).toBeLessThan(.01);
    expect(Math.abs(vw(declaration(profile, "html[lang=ar] .content .contact-question", "font-size"), reference.width) - reference.arTitle)).toBeLessThan(.02);
    const top = declaration(profile, ".contact-conversation", "padding-top") || declaration(profile, ".contact-conversation", "padding");
    expect(Math.abs(vw(top, reference.width) - reference.conversationTop)).toBeLessThan(.01);
  });
});

test("Contact CSS is canonically formatted and physical height cannot select a layout", () => {
  expect(formatStylesheet(css, file.pathname)).toBe(css);
  sheet.walkDecls((decl) => {
    expect(decl.value).not.toMatch(/(?:\d|\.)(?:s|d|l)?vh\b|\bclamp\(|\drem\b/);
  });
  sheet.walkAtRules("media", (query) => {
    expect(query.params).not.toMatch(/height|orientation|aspect-ratio/);
  });
});
