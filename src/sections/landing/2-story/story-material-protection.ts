import { clamp } from "./story-score";

import type { MaterialProtection } from "@/components/layout/header/material-protection";
export type { MaterialProtection } from "@/components/layout/header/material-protection";

/** Independent publishers cannot erase another owner's active protection. */
export function createMaterialProtection() {
  const sources = new Map<MaterialProtection["source"], MaterialProtection>();
  const publishers = new Map<MaterialProtection["source"], { sequence: number; owner?: HTMLElement; released: boolean }>();
  return {
    update(detail: MaterialProtection) {
      if (!detail || !["portrait", "footer"].includes(detail.source)) return;
      const publisher = detail.publisher ?? 0;
      const previous = publishers.get(detail.source);
      if (previous && (publisher < previous.sequence || publisher === previous.sequence && previous.released)) return;
      publishers.set(detail.source, { sequence: publisher, owner: detail.owner, released: false });
      if (!detail.active) sources.delete(detail.source);
      else if (Number.isFinite(detail.pressureScale) && Number.isFinite(detail.influence)) {
        sources.set(detail.source, { ...detail, pressureScale: clamp(detail.pressureScale), influence: clamp(detail.influence) });
      }
    },
    get pressureScale() { return Math.min(1, ...[...sources.values()].map((source) => source.pressureScale)); },
    get footerInfluence() { return sources.get("footer")?.influence ?? 0; },
    clear() { sources.clear(); },
    release(owner: HTMLElement) {
      for (const publisher of publishers.values()) {
        if (publisher.owner && (publisher.owner === owner || owner.contains(publisher.owner))) publisher.released = true;
      }
      for (const [source, detail] of sources) {
        if (detail.owner && (detail.owner === owner || owner.contains(detail.owner))) sources.delete(source);
      }
    },
  };
}
