import { clamp } from "./story-score";

export type MaterialProtection = {
  source: "portrait" | "footer";
  active: boolean;
  pressureScale: number;
  influence: number;
  clientX: number;
  clientY: number;
};

/** Independent publishers cannot erase another owner's active protection. */
export function createMaterialProtection() {
  const sources = new Map<MaterialProtection["source"], MaterialProtection>();
  return {
    update(detail: MaterialProtection) {
      if (!detail || !["portrait", "footer"].includes(detail.source)) return;
      if (!detail.active) sources.delete(detail.source);
      else if (Number.isFinite(detail.pressureScale) && Number.isFinite(detail.influence)) {
        sources.set(detail.source, { ...detail, pressureScale: clamp(detail.pressureScale), influence: clamp(detail.influence) });
      }
    },
    get pressureScale() { return Math.min(1, ...[...sources.values()].map((source) => source.pressureScale)); },
    get footerInfluence() { return sources.get("footer")?.influence ?? 0; },
    clear() { sources.clear(); },
  };
}
