import { brand } from "@/config/brand";
import { markStatic, type Piece } from "@/components/layout/header/identity-mark";
import glyphData from "./footer-glyph-contours.json";
import logoData from "./footer-logo-contours.json";

type Point = { x: number; y: number };
type Shape = { outer: number[][]; mass?: number[][]; rotation?: number };
// B becomes the kit's bar; the remaining letters run round the ring, half each.
const waveSplit = 1 + Math.ceil((brand.wordmark.length - 1) / 2);
export const footerPartMap = [...brand.wordmark].map((_, index) =>
  index === 0 ? 0 : index < waveSplit ? 1 : 2,
);

function sampleOutline(points: number[][], count: number): number[][] {
  const lengths = points.map((p, i) => {
    const q = points[(i + 1) % points.length];
    return Math.hypot(q[0] - p[0], q[1] - p[1]);
  });
  const total = lengths.reduce((sum, length) => sum + length, 0);
  let edge = 0, start = 0;
  return Array.from({ length: count }, (_, i) => {
    const distance = i / count * total;
    while (edge < points.length - 1 && start + lengths[edge] < distance) start += lengths[edge++];
    const p = points[edge], q = points[(edge + 1) % points.length];
    const t = lengths[edge] ? (distance - start) / lengths[edge] : 0;
    return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  });
}

// Kit geometry (m = 40): half rings of centreline radius 80 with a 0.9 lip
// at each end, and a 40 × 200 bar. The footer settles on the static b.
const ringMiddle = 80,
  ringHalf = 20,
  ringLip = 0.9,
  ringBend = Math.PI * ringMiddle,
  ringLength = 2 * ringLip + ringBend;
const markPose = markStatic.B();
const markPoses: Piece[] = [markPose.bar, markPose.h1, markPose.h2];
const markLocalBounds = [
  [-20, -100, 20, 100],
  [-100, -100, 100, ringLip],
  [-100, -100, 100, ringLip],
] as const;
/** The b's extent in kit units: its bar top to its bowl bottom. */
const markHeight = 300;

export type GlyphBox = { x: number; y: number; width: number; height: number };
const turn = (piece: Piece) => ({
  cos: Math.round(Math.cos(piece.a * Math.PI / 180)),
  sin: Math.round(Math.sin(piece.a * Math.PI / 180)),
});
/** Kit-unit boxes of the bar, upper bowl and lower bowl in the static b. */
export const footerMarkParts: GlyphBox[] = markLocalBounds.map(([x0, y0, x1, y1], piece) => {
  const pose = markPoses[piece],
    { cos, sin } = turn(pose),
    xs = [x0 * cos - y0 * sin, x1 * cos - y1 * sin],
    ys = [x0 * sin + y0 * cos, x1 * sin + y1 * cos];
  return {
    x: pose.x + Math.min(...xs), y: pose.y + Math.min(...ys),
    width: Math.abs(xs[1] - xs[0]), height: Math.abs(ys[1] - ys[0]),
  };
});
const markLeft = Math.min(...footerMarkParts.map((part) => part.x));
const markWidth = Math.max(...footerMarkParts.map((part) => part.x + part.width)) - markLeft;

/**
 * Local point `along` a half ring's centreline from its first lip, and
 * `across` it (positive toward the outer edge). Posed, the upper bowl runs
 * from the bar over the top and the lower bowl back underneath, so the eight
 * letters follow one continuous ring.
 */
function ringPoint(along: number, across: number): [number, number] {
  const reach = ringMiddle + across;
  if (along <= ringLip) return [-reach, ringLip - along];
  if (along >= ringLip + ringBend) return [reach, along - ringLip - ringBend];
  const angle = Math.PI + (along - ringLip) / ringMiddle;
  return [reach * Math.cos(angle), reach * Math.sin(angle)];
}

/**
 * One letter's share of a bowl, normalized to that bowl's box: the outer
 * edge forward, then the inner edge back. Its mass collapses the inner edge
 * onto the ring's centre, so the letter first becomes a solid wedge.
 */
function strokeSector(piece: number, index: number, sectors: number, count: number): Required<Omit<Shape, "rotation">> {
  const from = ringLength * index / sectors,
    to = ringLength * (index + 1) / sectors,
    outerCount = Math.ceil(count / 2),
    innerCount = count - outerCount,
    box = footerMarkParts[piece],
    pose = markPoses[piece],
    { cos, sin } = turn(pose);
  const at = (along: number, across: number) => {
    const [u, v] = ringPoint(along, across);
    return [(pose.x + u * cos - v * sin - box.x) / box.width, (pose.y + u * sin + v * cos - box.y) / box.height];
  };
  const outer = Array.from({ length: outerCount }, (_, i) => from + (to - from) * i / (outerCount - 1));
  const inner = Array.from({ length: innerCount }, (_, i) => to - (to - from) * i / (innerCount - 1));
  return {
    outer: [...outer.map((along) => at(along, ringHalf)), ...inner.map((along) => at(along, -ringHalf))],
    mass: [...outer.map((along) => at(along, ringHalf)), ...inner.map((along) => at(along, -ringMiddle))],
  };
}
/**
 * The sector point each glyph point travels to: wound like the glyph and
 * started where the two outlines lie closest, so no letter turns inside out
 * on its way to the mark.
 */
function correspond(source: number[][], target: number[][]): number[] {
  const count = source.length,
    area = (points: number[][]) =>
      points.reduce((sum, [x, y], i) => {
        const [u, v] = points[(i + 1) % count];
        return sum + x * v - u * y;
      }, 0),
    step = Math.sign(area(source)) === Math.sign(area(target)) ? 1 : count - 1,
    at = (start: number, i: number) => (start + step * i) % count;
  let best = 0,
    cost = Infinity;
  for (let start = 0; start < count; start++) {
    let sum = 0;
    for (let i = 0; i < count && sum < cost; i++) {
      const [x, y] = source[i],
        [u, v] = target[at(start, i)];
      sum += (x - u) ** 2 + (y - v) ** 2;
    }
    if (sum < cost) {
      cost = sum;
      best = start;
    }
  }
  return source.map((_, i) => at(best, i));
}
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => {
  const t = clamp(value);
  return t * t * t * (t * (6 * t - 15) + 10);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
// Original Questrial footer at1920×1080: mask1843.2, line451.4,
// first-letter ink y43.2/height339. Anchor geometry to the mask bottom,
// keeping the logo and its bridge independent of the new word's fitted size.
const referenceMask = 1843.2;
const referenceLine = 451.4 / referenceMask;
const logoBottom = (451.4 - 43.2 - 0.44 * 339) / referenceMask;
const bridgeBottom = (451.4 - 43.2 - 0.5 * 339) / referenceMask;
const bridgeDiameter = 0.94 * 339 / referenceMask;

/** Reference-pixel API: normalize DOM boxes before constructing; scale only on draw. */
export class FooterPaths {
  readonly source: Point[][][];
  readonly parts: GlyphBox[];
  /** Per glyph, the sector point (outer edge, then inner edge) each outline point reaches. */
  readonly orders: number[][];
  private readonly targets: GlyphBox[];
  private readonly bridges: GlyphBox[];
  private readonly centres: Point[][];
  private readonly shapes: Shape[];
  constructor(
    readonly boxes: GlyphBox[],
    readonly width: number,
    wordHeight = boxes[0].height * 900 / 662,
  ) {
    if (boxes.length !== brand.wordmark.length) throw new Error("Footer glyph boxes must match the wordmark");
    this.source = [...brand.wordmark].map((letter, i) =>
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
    const sectors = [0, 1, 2].map((part) => footerPartMap.filter((value) => value === part).length);
    this.orders = [];
    this.shapes = [...brand.wordmark].map((letter, index) => {
      const part = footerPartMap[index],
        outline = glyphData[letter as keyof typeof glyphData].contours[0];
      if (!part) {
        this.orders.push(outline.map((_, point) => point));
        return { outer: sampleOutline(logoData[5].outer, outline.length) };
      }
      const shape = strokeSector(part, index - footerPartMap.indexOf(part), sectors[part], outline.length),
        order = correspond(outline, shape.mass);
      this.orders.push(order);
      return {
        outer: order.map((point) => shape.outer[point]),
        mass: order.map((point) => shape.mass[point]),
      };
    });
    const mobile = width < 680,
      diameter = mobile
        ? Math.min(82, 0.18 * width)
        : 0.13 * width,
      scale = diameter / markHeight;
    const gutter = width * (mobile ? 0.06 : 0.055) + 2;
    const cy = mobile ? wordHeight - referenceLine * width - 0.86 * diameter : wordHeight - logoBottom * width;
    // The b stands as tall as the reference logo's ring, centred on its axis.
    const layout = (unit: number, left: number, axis: number) =>
      footerMarkParts.map((part) => ({
        x: left + (part.x - markLeft) * unit,
        y: axis + part.y * unit,
        width: part.width * unit,
        height: part.height * unit,
      }));
    this.parts = layout(scale, width - gutter - markWidth * scale, cy);
    this.targets = this.source.map((_, glyph) => this.parts[footerPartMap[glyph]]);
    const bridgeSize = bridgeDiameter * width,
      unit = bridgeSize / markHeight,
      middleY = wordHeight - bridgeBottom * width,
      bridges = layout(unit, 0.5 * (width - markWidth * unit), middleY);
    this.bridges = this.source.map((_, glyph) => bridges[footerPartMap[glyph]]);
  }
  /** Where a part's thought line leaves its ink. */
  anchor(part: number, mobile: boolean): Point {
    const box = this.parts[part];
    const [u, v] = mobile ? [[0.35, 0.94], [0.13, 0.94], [0.5, 0.94]][part] : [0.13, 0.5];
    return { x: box.x + u * box.width, y: box.y + v * box.height };
  }
  /** Whether each part's letters share one frame, so their sectors abut. */
  joined(progress: number, reverse = false) {
    const t = clamp(progress);
    return reverse ? t <= 0.44 : t >= 0.48;
  }
  private mass(glyph: number, point: number): Point {
    const shape = this.shapes[glyph];
    const [x, y] = (shape.mass ?? shape.outer)[point];
    return { x, y };
  }
  contours(progress: number, reverse = false): Point[][][] {
    const t = clamp(progress);
    return this.source.map((contours, glyph) => {
      const sourceBox = this.boxes[glyph],
        bridge = this.bridges[glyph],
        target = this.targets[glyph],
        shape = this.shapes[glyph];
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
