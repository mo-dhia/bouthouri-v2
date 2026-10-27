declare module "troika-three-text" {
  import { Mesh, type Material, type Texture } from "three";
  export type TextRenderInfo = {
    glyphBounds: Float32Array;
    caretPositions: Float32Array;
    blockBounds: [number, number, number, number];
    sdfTexture: Texture;
  };
  export class Text extends Mesh {
    text: string;
    font: string;
    fontSize: number;
    fontStyle: string;
    direction: "ltr" | "rtl";
    anchorX: "left" | "right";
    anchorY: "top";
    letterSpacing: number;
    lineHeight: number | "normal";
    maxWidth: number;
    textAlign: "left" | "right";
    sdfGlyphSize: number;
    unicodeFontsURL: string;
    material: Material;
    clipRect: [number, number, number, number] | null;
    readonly textRenderInfo: TextRenderInfo | null;
    sync(callback: () => void): void;
    dispose(): void;
  }
  export function configureTextBuilder(options: { defaultFontURL: string; unicodeFontsURL: string; useWorker: boolean }): void;
}
