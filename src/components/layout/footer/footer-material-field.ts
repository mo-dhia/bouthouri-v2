import glyphData from "./footer-glyph-contours.json";
import type { GlyphBox } from "./footer-paths";

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

/** The six reference episodes: aperture, narrow counter, ZZ, R, crossbar, paired ZZ. */
export function createIdleTargets(
  source: MaterialContours,
  boxes: GlyphBox[],
): MaterialContours[] {
  const normalized = (glyph: number) =>
    glyphData["GAZZAR"[glyph] as keyof typeof glyphData].contours.map(
      (contour) => contour.map(([x, y]) => ({ x, y })),
    );
  const project = (point: MaterialPoint, box: GlyphBox) => ({
    x: box.x + point.x * box.width,
    y: box.y + point.y * box.height,
  });
  return Array.from({ length: 6 }, (_, episode) =>
    source.map((contours, glyph) => {
      const box = boxes[glyph];
      if (episode === 0 && glyph === 0) {
        const original = normalized(0)[0],
          font = original.map((p) => ({
            x: 39 + 633 * p.x,
            y: 670 - 678 * p.y,
          }));
        const find = (x: number, y: number) =>
          font.findIndex((p) => Math.hypot(p.x - x, p.y - y) < 0.01);
        const a = find(550.5, 617.5),
          b = find(666, 482),
          c = find(584, 482),
          d = find(371, 597);
        const fractions = (from: number, to: number) => {
          const values = [0];
          for (let i = from + 1; i <= to; i++)
            values.push(
              values.at(-1)! +
                Math.hypot(
                  font[i].x - font[i - 1].x,
                  font[i].y - font[i - 1].y,
                ),
            );
          return values.map((value) => value / values.at(-1)!);
        };
        const outer = fractions(a, b),
          inner = fractions(c, d);
        const bezier = (
          p: MaterialPoint,
          q: MaterialPoint,
          r: MaterialPoint,
          s: MaterialPoint,
          t: number,
        ) => {
          const u = 1 - t;
          return {
            x:
              u ** 3 * p.x +
              3 * u * u * t * q.x +
              3 * u * t * t * r.x +
              t ** 3 * s.x,
            y:
              u ** 3 * p.y +
              3 * u * u * t * q.y +
              3 * u * t * t * r.y +
              t ** 3 * s.y,
          };
        };
        return [
          font.map((point, index) => {
            let target = point;
            if (index >= a && index <= b)
              target = bezier(
                { x: 550.5, y: 617.5 },
                { x: 638, y: 559 },
                { x: 672, y: 462 },
                { x: 672, y: 352 },
                outer[index - a],
              );
            else if (index > b && index < c)
              target = { x: 672 - ((index - b) / (c - b)) * 69, y: 352 };
            else if (index >= c && index <= d)
              target = bezier(
                { x: 603, y: 352 },
                { x: 603, y: 502 },
                { x: 520, y: 597 },
                { x: 371, y: 597 },
                inner[index - c],
              );
            return project(
              target === point
                ? original[index]
                : { x: (target.x - 39) / 633, y: (670 - target.y) / 678 },
              box,
            );
          }),
        ];
      }
      if ((episode === 1 && glyph === 1) || (episode === 4 && glyph === 4))
        return normalized(glyph).map((contour, index) =>
          contour.map((point) => {
            let { x, y } = point;
            if (episode === 1 && index === 1) x = 0.5 + (x - 0.5) * 0.46;
            if (episode === 4) {
              if (index === 1) y = 78 / 662 + (y - 78 / 662) * 0.75;
              else {
                const px = 3 + 656 * x,
                  py = 662 - 662 * y;
                if (
                  py <= 192.001 &&
                  px >= 86 + (81 / 192) * py - 0.01 &&
                  px <= 576 - (81 / 192) * py + 0.01
                )
                  y = 1 - (py / 662) * 1.36;
              }
            }
            return project({ x, y }, box);
          }),
        );
      if (episode === 3 && glyph === 5)
        return normalized(glyph).map((contour, index) =>
          contour.map((p) =>
            project(index === 1 ? { x: 0.4, y: 0.31 } : p, box),
          ),
        );
      if ((episode === 2 || episode === 5) && (glyph === 2 || glyph === 3)) {
        const first = boxes[2],
          span = boxes[3].x + boxes[3].width - first.x;
        return normalized(glyph).map((contour) => {
          const corner = contour.findIndex(
            (p) => Math.abs(p.x - 1) < 0.00001 && p.y < 0.00001,
          );
          return contour.map((p, index) =>
            episode === 5
              ? {
                  x:
                    first.x +
                    span *
                      ((glyph === 3 ? 0.51 : 0.04) +
                        0.12 * (1 - p.y) +
                        0.32 * (index < corner ? 0 : 1)),
                  y:
                    first.y +
                    first.height * ((glyph === 3 ? 0.12 : 0.02) + 0.86 * p.y),
                }
              : {
                  x:
                    first.x +
                    span *
                      (0.18 * (1 - p.y) +
                        0.36 *
                          (Number(glyph !== 2) + (index < corner ? 0 : 1))),
                  y: first.y + p.y * first.height,
                },
          );
        });
      }
      return contours.map((contour) => contour.map((point) => ({ ...point })));
    }),
  );
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
  private readonly families = ["G", "A", "ZZ", "R", "A", "ZZ"];
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

export class FooterRefractionWaves {
  private readonly partMap = [0, 1, 1, 1, 1, 2];
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
