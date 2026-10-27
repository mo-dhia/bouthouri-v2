// Reproduce with: bun src/sections/landing/2-story/story-origin.generate.mjs
// This is a data-generation utility, never imported by a page or controller.
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { typesetterWorkerModule } from "troika-three-text";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
globalThis.self = globalThis;
globalThis.XMLHttpRequest = class LocalFontRequest {
  open(_method, url) {
    if (!url.startsWith("/assets/textures/")) throw new Error(`Nonlocal generator request: ${url}`);
    this.url = url;
  }
  send() {
    readFile(`${root}/public${this.url}`).then((bytes) => {
      this.response = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
      this.status = 200; this.onload();
    }).catch((error) => { this.status = 404; this.onerror(error); });
  }
};
const typesetter = await typesetterWorkerModule.onMainThread._getInitResult();
function glyphMetrics(result) {
  const bounds = new Float32Array(result.glyphIds.length * 4);
  result.glyphIds.forEach((id, index) => {
    const font = result.fontData[result.glyphFontIndices[index]];
    const box = result.glyphData[font.src][id].pathBounds;
    const margin = Math.max(box[2] - box[0], box[3] - box[1]) * (1 / 16 + 0.5 / 128);
    const scale = result.fontSize / font.unitsPerEm;
    const x = result.glyphPositions[index * 2], y = result.glyphPositions[index * 2 + 1];
    bounds.set([x + (box[0] - margin) * scale, y + (box[1] - margin) * scale, x + (box[2] + margin) * scale, y + (box[3] + margin) * scale], index * 4);
  });
  return bounds;
}
const output = {};
for (const rtl of [false, true]) for (const portrait of [false, true]) {
  const fontSize = (rtl ? portrait ? 1.03 : 1.6 : portrait ? 0.94 : 1.35) * (rtl ? 1.02 : 1.075);
  const lines = rtl ? ["أفكار،", "تتحوّل إلى واقع."] : ["Ideas,", "put to work."];
  const results = [];
  for (let index = 0; index < lines.length; index++) {
    results.push(await new Promise((resolve) => typesetter.typeset({
      text: lines[index], font: `/assets/textures/${rtl ? "cairo" : "questrial"}-studio.woff`,
      fontSize: index ? fontSize * (rtl ? 0.68 : portrait ? 0.84 : 1.02) : fontSize,
      anchorX: rtl ? "right" : "left", anchorY: "top", direction: rtl ? "rtl" : "ltr",
      letterSpacing: rtl ? 0 : -(index ? -0.025 : -0.055) * (-0.039 / 0.065), includeCaretPositions: true,
    }, resolve)));
  }
  const first = glyphMetrics(results[0]), second = glyphMetrics(results[1]);
  const caret = (lines[1].length - 1) * 4, carets = results[1].caretPositions;
  const caretX = (carets[caret] + carets[caret + 1]) / 2;
  let glyph = 0, distance = Infinity;
  for (let i = 0; i < second.length; i += 4) {
    const delta = Math.abs((second[i] + second[i + 2]) / 2 - caretX);
    if (delta < distance) { glyph = i; distance = delta; }
  }
  output[`${rtl ? "ar" : "en"}-${portrait ? "portrait" : "landscape"}`] = {
    fontSize,
    firstMinY: Math.min(...Array.from(first).filter((_, i) => i % 4 === 1)),
    secondMinY: Math.min(...Array.from(second).filter((_, i) => i % 4 === 1)),
    secondMaxY: Math.max(...Array.from(second).filter((_, i) => i % 4 === 3)),
    dot: { x: (second[glyph] + second[glyph + 2]) / 2, y: (second[glyph + 1] + second[glyph + 3]) / 2,
      radius: (second[glyph + 2] - second[glyph]) / (2 * (1 + 2 * (1 / 16 + 0.5 / 128))) },
  };
}
await writeFile(new URL("./story-origin-data.json", import.meta.url), `${JSON.stringify(output, null, 2)}\n`);
console.info(JSON.stringify({ variants: Object.keys(output), localFontsOnly: true }));
