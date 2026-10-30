import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import en from "../src/sections/landing/3-journey/journey-en.json";
import ar from "../src/sections/landing/3-journey/journey-ar.json";
import { WORK_PROJECTS, WORK_SYMBOL_GROWTH, directedWorkPath } from "../src/sections/landing/3-journey/work-paths.js";
import { finalMarkSegments } from "../src/sections/landing/3-journey/systems-geometry.js";
import { HOME_WORK_MOMENTS } from "../src/lib/navigation/home-position";

type Node = { tag: string; props: Record<string, string>; children: (Node | string)[] };
type Project = { slug: string; mark: { path: string }; identity: Record<"en" | "ar", { name: string; lines: string[] }> };
const projects = WORK_PROJECTS as Project[];
const track = (doc: unknown) => ((doc as Node & { children: Node[] }).children[0].children[6] as Node).children[0] as Node;
const numbers = (d: string) => (d.match(/-?\d*\.?\d+/g) ?? []).map(Number);

/** Arc length of an absolute M/L/C/Q path, sampled finely enough for the pen's average speed. */
function pathLength(d: string) {
  const tokens = d.match(/[MLCQ]|-?\d*\.?\d+/g)!;
  let at = [0, 0], total = 0;
  for (let i = 0; i < tokens.length;) {
    const command = tokens[i++], count = command === "C" ? 6 : command === "Q" ? 4 : 2;
    const values = tokens.slice(i, i + count).map(Number); i += count;
    if (command !== "M") {
      const points = [at];
      for (let k = 0; k < values.length; k += 2) points.push(values.slice(k, k + 2));
      const steps = command === "L" ? 1 : 2000;
      let previous = at;
      for (let s = 1; s <= steps; s++) {
        let level = points;
        const t = s / steps;
        while (level.length > 1) level = level.slice(1).map((p, k) => [level[k][0] + (p[0] - level[k][0]) * t, level[k][1] + (p[1] - level[k][1]) * t]);
        total += Math.hypot(level[0][0] - previous[0], level[0][1] - previous[1]); previous = level[0];
      }
    }
    at = values.slice(-2);
  }
  return total;
}

describe("work projects", () => {
  test("marks enter at the left baseline, leave at the right one and use only parser-safe commands", () => {
    for (const { mark } of WORK_PROJECTS) {
      expect(mark.path).toMatch(/^M0 130 (?:[LCQ][^A-Za-z]+)+$/);
      expect(mark.path.match(/[MLCQ]/g)!.filter((c: string) => c === "M")).toHaveLength(1);
      expect(numbers(mark.path).slice(-2)).toEqual([320, 130]);
      expect(numbers(directedWorkPath(mark.path, -1)).slice(0, 2)).toEqual([320, 130]);
    }
  });

  test("marks stay on the 320×220 stage", () => {
    for (const { mark } of WORK_PROJECTS) numbers(mark.path).forEach((value, k) => {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(k % 2 ? 220 : 320);
    });
  });

  test("the last mark has enough segments to become the first systems card", () => {
    // The card is 21 cubics; a shorter morph silently drops its closing edge.
    expect(finalMarkSegments + 4).toBeGreaterThanOrEqual(21);
  });

  test("the pen's reference lengths are the marks' lengths", () => {
    const source = readFileSync(new URL("../src/sections/landing/3-journey/work-renderer.js", import.meta.url), "utf8");
    const lengths = numbers(source.match(/c = \[([^\]]+)\]/)![1]);
    WORK_PROJECTS.forEach(({ mark }: { mark: { path: string } }, index: number) => expect(Math.abs(lengths[index] - pathLength(mark.path))).toBeLessThan(0.5));
  });

  test("home deep links follow the landing order", () => {
    expect(Object.keys(HOME_WORK_MOMENTS)).toEqual(WORK_PROJECTS.map((project: { slug: string }) => project.slug));
  });

  for (const [locale, doc] of [["en", en], ["ar", ar]] as const) test(`${locale} markup matches the runtime marks`, () => {
    const [stroke, ...articles] = track(doc).children as Node[];
    expect(articles).toHaveLength(WORK_PROJECTS.length);
    projects.forEach((project, index) => {
      const group = stroke.children.find((child) => typeof child !== "string" && child.props["data-stroke-project"] === String(index)) as Node;
      const symbol = (group.children[2] as Node).children as Node[];
      for (const path of symbol) expect(path.props.d).toBe(project.mark.path);
      expect(symbol[0].props["data-project-mark"]).toBe(project.slug);

      const article = articles[index], copy = project.identity[locale];
      const [title, , quiet, meta] = article.children as Node[];
      const heading = title.children[0] as Node;
      expect(article.props["aria-labelledby"]).toBe(heading.props.id);
      expect(heading.props["aria-label"]).toBe(copy.name);
      expect((heading.children as Node[]).map((line) => line.children[0])).toEqual(copy.lines);
      const style = article.props.style as unknown as Record<string, string>;
      expect(style["--title-lines"]).toBe(String(copy.lines.length));
      expect(Number(style["--title-fit"])).toBeCloseTo(Math.min(1, 8 / Math.max(...copy.lines.map((line) => line.length))), 9);

      // The reduced-motion symbol is the mark grown around the stage centre.
      const growth = WORK_SYMBOL_GROWTH[index];
      const grown = numbers(project.mark.path).map((value, k) => value * growth - (k % 2 ? 110 : 160) * (growth - 1));
      numbers(((quiet.children[0]) as Node).props.d).forEach((value, k) => expect(Math.abs(value - grown[k])).toBeLessThan(0.006));

      const link = (meta.children as Node[])[1];
      expect(link.props.href).toMatch(/^https:\/\//);
      expect(link.props).toMatchObject({ target: "_blank", rel: "external noopener", "data-case-slug": project.slug });
      // External, so the name says it opens a new tab, as on the Projects grid.
      expect(link.props["aria-label"]).toBe(`${locale === "ar" ? "استكشف المشروع" : "EXPLORE PROJECT"}: ${copy.name}${locale === "ar" ? "، يُفتح في علامة تبويب جديدة" : ", opens in a new tab"}`);
    });
  });
});
