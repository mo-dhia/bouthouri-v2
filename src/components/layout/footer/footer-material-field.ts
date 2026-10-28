import glyphData from "./footer-glyph-contours.json";
import { footerPartMap, type GlyphBox } from "./footer-paths";
import { brand } from "@/config/brand";

export type MaterialPoint = { x: number; y: number };
export type MaterialContours = MaterialPoint[][][];
export const elasticWeight = (distance: number, radius: number) => {
  const ratio = distance / radius;
  return Math.pow(Math.max(0, 1 - ratio), 4) * (1 + 4 * ratio);
};
const unit = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => {
  const t = unit(value);
  return t * t * (3 - 2 * t);
};

/** Preserve the six quiet episodes, adapted to the actual wordmark's counters and stems. */
export function createIdleTargets(
  source: MaterialContours,
  boxes: GlyphBox[],
): MaterialContours[] {
  return Array.from({ length: 6 }, (_, episode) => source.map((contours, glyph) => {
    const box = boxes[glyph];
    const normalized = glyphData[brand.wordmark[glyph] as keyof typeof glyphData].contours;
    return contours.map((contour, contourIndex) => contour.map((original, index) => {
      const [u, v] = normalized[contourIndex][index];
      let x = u, y = v;
      // B aperture and O counter breathing; retain all contour correspondence.
      if (episode === 0 && glyph === 0) {
        if (contourIndex) x = 0.5 + (x - 0.5) * 0.5;
        else x += 0.06 * smooth(x) * Math.sin(Math.PI * y);
      } else if (episode === 1 && glyph === 1 && contourIndex) x = 0.5 + (x - 0.5) * 0.46;
      // The R counter closes and H crossbar shifts, using the original episode timing.
      else if (episode === 3 && glyph === 7 && contourIndex) { x = 0.4; y = 0.31; }
      else if (episode === 4 && glyph === 4) y += 0.12 * Math.exp(-(((y - 0.5) / 0.16) ** 2));
      else if ((episode === 2 && (glyph === 2 || glyph === 3)) || (episode === 5 && (glyph === 5 || glyph === 6))) {
        const first = episode === 2 ? 2 : 5;
        const left = boxes[first], span = boxes[first + 1].x + boxes[first + 1].width - left.x;
        return {
          x: left.x + span * ((glyph - first) * 0.48 + 0.1 * (1 - y) + 0.36 * x),
          y: left.y + left.height * (episode === 5 ? 0.06 + y * 0.86 : y),
        };
      } else return { ...original };
      return { x: box.x + x * box.width, y: box.y + y * box.height };
    }));
  }));
}

export class FooterIdleEpisodes {
  kind = -1;
  amount = 0;
  private age = 0;
  private quiet = 2.4;
  private seed = 91731;
  private recent: string[] = [];
  private cancelling = false;
  private from = 0;
  private cancelAge = 0;
  private readonly families = ["B", "O", "UT", "R", "H", "OU"];
  private random() {
    this.seed = (1664525 * this.seed + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }
  reset() {
    this.kind = -1;
    this.amount = this.age = 0;
    this.cancelling = false;
    this.quiet = 2.1 + this.random();
  }
  get wait() {
    return this.kind < 0 && !this.cancelling ? this.quiet : 0;
  }
  wakeFromWait() {
    if (this.kind < 0 && !this.cancelling) this.quiet = 0;
  }
  advance(dt: number, busy: boolean, reduced: boolean) {
    if (busy || reduced) {
      this.quiet = 2.4;
      if (this.kind >= 0 && !this.cancelling) {
        this.cancelling = true;
        this.from = this.amount;
        this.cancelAge = 0;
      }
    }
    if (this.cancelling) {
      this.cancelAge += dt;
      this.amount = this.from * (1 - smooth(this.cancelAge / 0.2));
      if (this.cancelAge >= 0.2) {
        this.kind = -1;
        this.amount = 0;
        this.cancelling = false;
      }
      return;
    }
    if (busy || reduced) return;
    if (this.kind < 0) {
      this.quiet -= dt;
      if (this.quiet > 0) return;
      let choices = this.families
        .map((_, i) => i)
        .filter((i) => !this.recent.includes(this.families[i]));
      if (!choices.length) choices = this.families.map((_, i) => i);
      this.kind = choices[Math.floor(this.random() * choices.length)];
      this.recent.push(this.families[this.kind]);
      if (this.recent.length > 2) this.recent.shift();
      this.age = 0;
    }
    this.age += dt;
    this.amount =
      smooth(this.age / 1.55) * (1 - smooth((this.age - 2.2) / 1.65));
    if (this.age >= 3.85) {
      this.kind = -1;
      this.amount = 0;
      this.quiet = 1.8 + 1.5 * this.random();
    }
  }
}

/** Coordinates, velocities and capped displacements share reference pixel space. */
export class FooterRefractionWaves {
  private readonly partMap = footerPartMap;
  private readonly packets = Array.from({ length: 6 }, () => ({
    x: 0,
    y: 0,
    dx: 1,
    dy: 0,
    radius: 100,
    amplitude: 0,
    age: 2,
    glyph: -1,
  }));
  private slot = 0;
  private time = 0;
  private last = { x: -9999, y: -9999, time: -1 };
  get active() {
    return this.packets.some((packet) => packet.age < 0.96);
  }
  get energy() {
    return Math.min(
      1,
      this.packets.reduce(
        (sum, p) =>
          sum +
          (p.age < 0.96 ? p.amplitude * Math.sin((Math.PI * p.age) / 0.96) : 0),
        0,
      ) / 18,
    );
  }
  contact(
    point: MaterialPoint,
    glyph: number,
    velocity: MaterialPoint,
    height: number,
  ) {
    if (
      Math.hypot(point.x - this.last.x, point.y - this.last.y) <
        Math.max(12, 0.085 * height) ||
      this.time - this.last.time < 0.045
    )
      return;
    const speed = Math.hypot(velocity.x, velocity.y),
      packet = this.packets[this.slot];
    this.slot = (this.slot + 1) % this.packets.length;
    Object.assign(packet, {
      x: point.x,
      y: point.y,
      glyph,
      dx: speed > 10 ? velocity.x / speed : 1,
      dy: speed > 10 ? velocity.y / speed : 0,
      radius:
        Math.max(45, Math.min(155, 0.56 * height)) *
        (1 + 0.12 * Math.min(1, speed / 1000)),
      amplitude:
        Math.min(10, Math.max(2.2, 0.022 * height)) *
        (0.65 + 0.85 * Math.min(1, speed / 850)),
      age: 0,
    });
    this.last = { ...point, time: this.time };
  }
  advance(dt: number) {
    this.time += dt;
    this.packets.forEach((packet) => {
      if (packet.age < 0.96) packet.age = Math.min(0.96, packet.age + dt);
    });
  }
  clear() {
    this.packets.forEach((packet) => (packet.age = 2));
    this.last = { x: -9999, y: -9999, time: -1 };
  }
  offset(point: MaterialPoint, glyph: number, logo: boolean): MaterialPoint {
    let x = 0,
      y = 0;
    this.packets.forEach((packet) => {
      if (packet.age >= 0.96) return;
      const time = packet.age / 0.96,
        envelope = smooth(Math.min(1, time / 0.16)) * (1 - time) ** 2,
        travel = 0.46 * packet.radius * time;
      const dx = point.x - packet.x - packet.dx * travel,
        dy = point.y - packet.y - packet.dy * travel,
        same = logo
          ? this.partMap[packet.glyph] === this.partMap[glyph]
          : packet.glyph === glyph;
      const across = (-dx * packet.dy + dy * packet.dx) / packet.radius,
        weight =
          elasticWeight(Math.hypot(dx, dy), packet.radius) *
          envelope *
          packet.amplitude *
          (same ? 1 : 0.22),
        bend = 1 - across * across * 2;
      x += (0.52 * packet.dx - packet.dy * bend) * weight;
      y += (0.52 * packet.dy + packet.dx * bend) * weight;
    });
    const length = Math.hypot(x, y),
      scale = length > 13 ? 13 / length : 1;
    return { x: x * scale, y: y * scale };
  }
}
