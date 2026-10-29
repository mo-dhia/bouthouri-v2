import { expect, test } from "bun:test";
import { fixedViewportMedia, fixedViewportStylesheet } from "./fixed-viewport-css";
import { viewportDesigns } from "../../src/lib/viewport-design";
test("multiple geometry clauses resolve width, keep height as aspect and preserve the motion condition", () => {
  const query = "(min-width: 700px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)";
  expect(fixedViewportMedia(query, viewportDesigns.desktop)).toBe("(max-aspect-ratio:1920/600) and (prefers-reduced-motion: no-preference)");
  expect(fixedViewportMedia(query, viewportDesigns.tablet)).toBe("(max-aspect-ratio:768/600) and (prefers-reduced-motion: no-preference)");
  expect(fixedViewportMedia(query, viewportDesigns.mobile)).toBe(false);
  const sheet = fixedViewportStylesheet(`@media ${query} {.safe {height:20px}}`, "fixture.css");
  expect(sheet).not.toContain("@media and"); expect(sheet).toContain("@media (max-aspect-ratio:1920/600) and (prefers-reduced-motion: no-preference)");
});
