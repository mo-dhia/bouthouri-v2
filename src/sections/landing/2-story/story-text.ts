import { MeshBasicMaterial } from "three";
import { Text, configureTextBuilder } from "troika-three-text";
import { terminalGlyph } from "./story-text-metrics";

const fontUrls = { latin: "/assets/textures/questrial-studio.woff", arabic: "/assets/textures/cairo-studio.woff" };
let configured = false;
const coverage = new Map<string, Promise<Set<number>>>();

/** All HOME characters must exist locally, so Troika never enters its CDN fallback resolver. */
export async function prepareSceneFont(rtl: boolean, texts: string[]) {
  const url = rtl ? fontUrls.arabic : fontUrls.latin;
  if (!configured) {
    configureTextBuilder({ defaultFontURL: fontUrls.latin, unicodeFontsURL: `${location.origin}/assets/textures/scene-unicode`, useWorker: true });
    configured = true;
  }
  let pending = coverage.get(url);
  if (!pending) {
    pending = Promise.all([
      fetch(url).then((response) => { if (!response.ok) throw new Error("The local scene font is unavailable."); return response.arrayBuffer(); }),
      fetch(url.replace(".woff", "-coverage.json")).then((response) => {
        if (!response.ok) throw new Error("The local scene font coverage is unavailable.");
        return response.json() as Promise<number[]>;
      }),
    ]).then(([, points]) => new Set(points)).catch((error: unknown) => { coverage.delete(url); throw error; });
    coverage.set(url, pending);
  }
  const points = await pending;
  for (const text of texts) for (const character of text) {
    if (!/\s/u.test(character) && !points.has(character.codePointAt(0)!)) throw new Error(`Missing local scene glyph U+${character.codePointAt(0)!.toString(16)}.`);
  }
}

export function createSceneText(text: string, fontSize: number, rtl: boolean, spacing = 0, maxWidth = Infinity, lineHeight?: number, color = "#c4bfb3", sdfGlyphSize = 128, textAlign?: "left" | "right") {
  const material = new MeshBasicMaterial({ color, transparent: true, depthTest: false, depthWrite: false, toneMapped: false });
  const mesh = new Text();
  mesh.text = text; mesh.font = rtl ? fontUrls.arabic : fontUrls.latin; mesh.fontSize = fontSize;
  mesh.fontStyle = "normal"; mesh.direction = rtl ? "rtl" : "ltr";
  mesh.anchorX = rtl ? "right" : "left"; mesh.anchorY = "top";
  mesh.letterSpacing = spacing; mesh.maxWidth = maxWidth; mesh.sdfGlyphSize = sdfGlyphSize;
  if (lineHeight !== undefined) mesh.lineHeight = lineHeight;
  if (textAlign) mesh.textAlign = textAlign;
  mesh.unicodeFontsURL = `${location.origin}/assets/textures/scene-unicode`;
  mesh.material = material; mesh.renderOrder = 1000; mesh.frustumCulled = false;
  mesh.clipRect = [-30, -30, 30, 30];
  let disposed = false;
  let settled = false;
  let cancelReady: (() => void) | undefined;
  let timer = 0;
  const ready = new Promise<void>((resolve, reject) => {
    // Troika's font/worker error path does not call sync's callback. Bound it so
    // blocked optional workers/fonts release the scene slot and expose SSR fallback.
    cancelReady = () => { if (!settled) { settled = true; reject(new Error("Scene text mount cancelled.")); } };
    timer = window.setTimeout(() => { settled = true; reject(new Error("The optional scene text worker did not finish.")); }, 10000);
    mesh.sync(() => { clearTimeout(timer); if (!disposed && !settled) { settled = true; resolve(); } });
  });
  const clip = {
    set(x: number, y: number, z: number, w: number) { mesh.clipRect = [x, y, z, w]; return this; },
    get x() { return mesh.clipRect![0]; }, set x(value: number) { mesh.clipRect![0] = value; },
    get z() { return mesh.clipRect![2]; }, set z(value: number) { mesh.clipRect![2] = value; },
  };
  return {
    mesh, clip, ready, fontSize,
    get ink() {
      const bounds = mesh.textRenderInfo?.glyphBounds;
      let min = Infinity, max = -Infinity;
      if (bounds) for (let i = 0; i < bounds.length; i += 4) { min = Math.min(min, bounds[i + 1]); max = Math.max(max, bounds[i + 3]); }
      return { min, max };
    },
    get dot() {
      const info = mesh.textRenderInfo;
      return info ? terminalGlyph(info, text) : null;
    },
    opacity(value: number) { material.opacity = value; },
    dispose() { if (disposed) return; disposed = true; clearTimeout(timer); cancelReady?.(); mesh.removeFromParent(); mesh.dispose(); material.dispose(); },
  };
}
