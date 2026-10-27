import glyphData from "./footer-glyph-contours.json";
import logoData from "./footer-logo-contours.json";

type Point = { x: number; y: number };
export type GlyphBox = { x: number; y: number; width: number; height: number };
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => {
  const t = clamp(value);
  return t * t * t * (t * (6 * t - 15) + 10);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Public reference outline data only; no original application/runtime is shipped. */
export class FooterPaths {
  readonly source: Point[][][];
  readonly parts: GlyphBox[];
  private readonly targets: GlyphBox[];
  private readonly bridges: GlyphBox[];
  private readonly centres: Point[][];
  constructor(
    readonly boxes: GlyphBox[],
    readonly width: number,
  ) {
    this.source = [..."GAZZAR"].map((letter, i) =>
      glyphData[letter as keyof typeof glyphData].contours.map((contour) =>
        contour.map(([x, y]) => ({
          x: boxes[i].x + x * boxes[i].width,
          y: boxes[i].y + y * boxes[i].height,
        })),
      ),
    );
    this.centres = this.source.map((contours, i) =>
      contours.map((contour) =>
        contour.reduce(
          (center, point) => ({
            x:
              center.x +
              (point.x - boxes[i].x) / boxes[i].width / contour.length,
            y:
              center.y +
              (point.y - boxes[i].y) / boxes[i].height / contour.length,
          }),
          { x: 0, y: 0 },
        ),
      ),
    );
    const mobile = width < 680,
      diameter = mobile
        ? Math.min(82, 0.18 * width)
        : Math.min(0.74 * boxes[0].height, 0.13 * width),
      scale = diameter / 73.600516;
    const radiusX = 36.800258 * scale,
      radiusY = 36.789158 * scale,
      half = 36.78900314797175 * scale,
      gap = 0.34 * diameter,
      dash = 52.198462 * scale;
    const gutter = width * (mobile ? 0.06 : 0.055) + 2;
    let left = width - gutter - (half + 2 * radiusX + dash + 2 * gap);
    const cy = mobile ? -0.86 * diameter : boxes[0].y + 0.44 * boxes[0].height;
    this.parts = [
      { width: half, height: 73.53424828230845 * scale },
      { width: 2 * radiusX, height: 2 * radiusY },
      { width: dash, height: 15.170137516 * scale },
    ].map((size) => {
      const part = { x: left, y: cy - size.height / 2, ...size };
      left += size.width + gap;
      return part;
    });
    const circle = this.parts[1];
    this.targets = [
      this.parts[0],
      { x: circle.x, y: circle.y, width: radiusX, height: radiusY },
      { x: circle.x, y: circle.y + radiusY, width: radiusX, height: radiusY },
      { x: circle.x + radiusX, y: circle.y, width: radiusX, height: radiusY },
      {
        x: circle.x + radiusX,
        y: circle.y + radiusY,
        width: radiusX,
        height: radiusY,
      },
      this.parts[2],
    ];
    const bridgeSize = Math.min(0.94 * boxes[0].height, 0.18 * width),
      middleY = boxes[0].y + 0.5 * boxes[0].height;
    this.bridges = [
      {
        x: 0.18 * width - 0.25 * bridgeSize,
        y: middleY - 0.5 * bridgeSize,
        width: 0.5 * bridgeSize,
        height: bridgeSize,
      },
      {
        x: 0.5 * width - 0.5 * bridgeSize,
        y: middleY - 0.5 * bridgeSize,
        width: 0.5 * bridgeSize,
        height: 0.5 * bridgeSize,
      },
      {
        x: 0.5 * width - 0.5 * bridgeSize,
        y: middleY,
        width: 0.5 * bridgeSize,
        height: 0.5 * bridgeSize,
      },
      {
        x: 0.5 * width,
        y: middleY - 0.5 * bridgeSize,
        width: 0.5 * bridgeSize,
        height: 0.5 * bridgeSize,
      },
      {
        x: 0.5 * width,
        y: middleY,
        width: 0.5 * bridgeSize,
        height: 0.5 * bridgeSize,
      },
      {
        x: 0.82 * width - 0.44 * bridgeSize,
        y: middleY - 0.125 * bridgeSize,
        width: 0.88 * bridgeSize,
        height: 0.25 * bridgeSize,
      },
    ];
  }
  private mass(glyph: number, point: number): Point {
    const [x, y] = logoData[glyph].outer[point];
    if (glyph === 5) return { x, y };
    const cx = glyph === 0 ? 1 : +(glyph === 1 || glyph === 4),
      cy = glyph === 0 ? 0.5 : 1,
      sy = glyph === 0 ? 0.5 : 1,
      dx = x - cx,
      dy = (y - cy) / sy,
      r = Math.hypot(dx, dy),
      inner = glyph === 0 ? 0.613 : 0.584;
    const amount = r ? Math.max(0, (r - inner) / (1 - inner)) / r : 0;
    return { x: cx + dx * amount, y: cy + dy * sy * amount };
  }
  contours(progress: number, reverse = false): Point[][][] {
    const t = clamp(progress);
    return this.source.map((contours, glyph) => {
      const sourceBox = this.boxes[glyph],
        bridge = this.bridges[glyph],
        target = this.targets[glyph],
        shape = logoData[glyph];
      const settle = reverse ? ease(t / 0.42) : ease(t / 0.48),
        travel = reverse ? ease((t - 0.44) / 0.3) : ease((t - 0.57) / 0.43),
        form = reverse ? 1 - ease((t - 0.6) / 0.4) : ease(t / 0.4),
        outline = reverse ? 1 - ease(t / 0.32) : ease((t - 0.57) / 0.43);
      const frame = reverse
        ? {
            x:
              target.x +
              (bridge.x - target.x) * settle +
              (sourceBox.x - bridge.x) * travel,
            y:
              target.y +
              (bridge.y - target.y) * settle +
              (sourceBox.y - bridge.y) * travel,
            width:
              target.width +
              (bridge.width - target.width) * settle +
              (sourceBox.width - bridge.width) * travel,
            height:
              target.height +
              (bridge.height - target.height) * settle +
              (sourceBox.height - bridge.height) * travel,
          }
        : {
            x:
              sourceBox.x +
              (bridge.x - sourceBox.x) * settle +
              (target.x - bridge.x) * travel,
            y:
              sourceBox.y +
              (bridge.y - sourceBox.y) * settle +
              (target.y - bridge.y) * travel,
            width:
              sourceBox.width +
              (bridge.width - sourceBox.width) * settle +
              (target.width - bridge.width) * travel,
            height:
              sourceBox.height +
              (bridge.height - sourceBox.height) * settle +
              (target.height - bridge.height) * travel,
          };
      const angle =
          (("rotation" in shape ? shape.rotation : 0) ?? 0) *
          (reverse ? 1 - ease((t - 0.44) / 0.26) : form),
        cos = Math.cos(angle),
        sin = Math.sin(angle);
      const holes = reverse ? ease((t - 0.74) / 0.26) : 1 - ease(t / 0.23);
      return contours.map((contour, contourIndex) =>
        contour.map((point, index) => {
          const x = (point.x - sourceBox.x) / sourceBox.width,
            y = (point.y - sourceBox.y) / sourceBox.height;
          let u: number, v: number;
          if (contourIndex === 0) {
            const mass = this.mass(glyph, index),
              target = shape.outer[index];
            u = x + (mass.x - x) * form + (target[0] - mass.x) * outline;
            v = y + (mass.y - y) * form + (target[1] - mass.y) * outline;
          } else {
            const center = this.centres[glyph][contourIndex];
            u = mix(center.x, x, holes);
            v = mix(center.y, y, holes);
          }
          const px = (u - 0.5) * frame.width,
            py = (v - 0.5) * frame.height;
          return {
            x: frame.x + 0.5 * frame.width + px * cos - py * sin,
            y: frame.y + 0.5 * frame.height + px * sin + py * cos,
          };
        }),
      );
    });
  }
}
