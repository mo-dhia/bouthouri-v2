import { expect, test } from "bun:test";
import postcss from "postcss";
import { formatStylesheet } from "./css-format";

test("formatting preserves quoted/unquoted URL payloads and quoted list punctuation", () => {
  const data = "url(data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27/%3E)";
  const quoted = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\'/%3E")';
  const result = formatStylesheet(`.a{background:${data};mask-image:${quoted};content:'a,b:c';transform:translate(1px,2px)}`, "payload.css");
  expect(result).toContain(data);
  expect(result).toContain(quoted);
  expect(result).toContain("content: 'a,b:c'");
  expect(result).toContain("translate(1px, 2px)");
});

test("formatting preserves cascade order, important flags, measured units and responsive boundaries", () => {
  const css = '.a{height:100svh;height:clamp(40px,5vw,70px)!important;--blank: ;font:16px "Questrial"}@media(max-width:700px){.a{height:560px}.a{height:40rem}}';
  const result = formatStylesheet(css, "cascade.css");
  const values: string[] = [];
  postcss.parse(result).walkDecls("height", (decl) => { values.push(`${decl.value}:${!!decl.important}`); });
  expect(values).toEqual(["100svh:false", "clamp(40px, 5vw, 70px):true", "560px:false", "40rem:false"]);
  expect(result).toContain("--blank: ;");
  expect(result).toContain("@media (max-width:700px)");
  expect(formatStylesheet(result, "cascade.css")).toBe(result);
});

test("selector list cleanup leaves specificity and separate override rules intact", () => {
  const result = formatStylesheet('.a,.a{opacity:0}.a{opacity:1}:is(.b,.c)[data-copy="a,b"]{color:#000}', "selectors.css");
  const selectors: string[] = [];
  postcss.parse(result).walkRules((rule) => { selectors.push(rule.selector); });
  expect(selectors).toEqual([".a", ".a", ":is(.b, .c)[data-copy='a,b']"]);
});
