import {
  HOME_WORK_MOMENTS,
  type HomePosition,
} from "@/lib/navigation/home-position";
import { designPixels } from "@/lib/viewport-design";

const workMoments = Object.values(HOME_WORK_MOMENTS);

/** Measure the actual unpinned reading layout instead of inventing pin pixels. */
export function readingNavigation(root: HTMLElement) {
  const bands = () => {
    const rows: Array<{
      section: HomePosition["section"];
      top: number;
      bottom: number;
    }> = [];
    const add = (section: HomePosition["section"], selector: string) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element || element.getBoundingClientRect().height < 2) return;
      const rect = element.getBoundingClientRect();
      rows.push({
        section,
        top: rect.top + scrollY,
        bottom: rect.bottom + scrollY,
      });
    };
    add("hero", "#identity");
    add("opening", ".glasses-opening");
    add("philosophy", "#beyond");
    ["curve", "circle", "dash"].forEach((section, index) =>
      add(
        section as HomePosition["section"],
        `.quiet-philosophy h2:nth-of-type(${index + 1})`,
      ),
    );
    add("ideas", ".quiet-outlook");
    add("work", ".work-world");
    add("systems", ".systems-build-copy");
    add("people", ".systems-human-copy");
    add("closing", ".systems-ending");
    add("footer", ".home-footer");
    rows.sort((a, b) => a.top - b.top);
    return rows.map((row, index) => ({
      ...row,
      end: Math.max(row.bottom, rows[index + 1]?.top ?? row.bottom),
    }));
  };
  return {
    getPosition(): HomePosition | null {
      if (root.hasAttribute("data-enhanced")) return null;
      const rows = bands();
      const row =
        [...rows].reverse().find((row) => scrollY >= row.top) ?? rows[0];
      return row
        ? {
            section: row.section,
            progress: Math.max(
              0,
              Math.min(1, (scrollY - row.top) / Math.max(1, row.end - row.top)),
            ),
          }
        : null;
    },
    getTarget(position: HomePosition): number | null {
      if (root.hasAttribute("data-enhanced")) return null;
      if (["hero", "opening", "perspective"].includes(position.section)) {
        // Source uses its chapter.offsetTop. Our SSR hero is a sibling of the
        // journey's positioned wrapper, so use the equivalent document offset.
        const chapter = root.querySelector<HTMLElement>(".glasses-chapter");
        const start = (chapter?.getBoundingClientRect().top ?? 0) + scrollY;
        return position.section === "hero" ? position.progress * start : start;
      }
      if (position.section === "work") {
        const score = 306 + 142 * position.progress;
        const index = workMoments.reduce(
          (nearest, moment, index) =>
            Math.abs(moment - score) < Math.abs(workMoments[nearest] - score)
              ? index
              : nearest,
          0,
        );
        const project = root.querySelector<HTMLElement>(
          `[data-work-index="${index}"]`,
        );
        if (project) return project.getBoundingClientRect().top + scrollY - designPixels(100, innerWidth);
      }
      return (root.querySelector("#beyond")?.getBoundingClientRect().top ?? 0) + scrollY;
    },
  };
}
