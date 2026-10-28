import type { GatePhysics } from "./gate-physics";
import { clamp, mix, mixPoint, pointString, smooth, type Point } from "./opening-score";

/** Source aperture: a twelve-control-point hole opens into a viewport-size diamond. */
export function gateSurface(gate: GatePhysics, width: number, height: number, radius: number) {
  const origin = { x: gate.grabOrigin.x * width, y: gate.grabOrigin.y * height };
  const opening = gate.completed, progress = opening ? smooth(gate.openingAge / (gate.reduced ? .42 : .96)) : 0;
  const contact = opening ? gate.openingContact : gate.position, surface = opening ? gate.openingSurface : gate.surface;
  const x = contact.x * radius, y = contact.y * radius, length = Math.hypot(x, y);
  const direction = opening ? gate.releaseDirection : length ? { x: x / length, y: y / length } : { x: 1, y: 0 };
  const tangent = { x: -direction.y, y: direction.x };
  const bend = 8 * clamp(Math.abs(surface.x * direction.y - surface.y * direction.x)), spread = 18 + .72 * length;
  const shear = clamp((gate.velocity.x * tangent.x + gate.velocity.y * tangent.y) * .025, -.12, .12);
  const at = (along: number, across: number): Point => ({ x: origin.x + direction.x * along + tangent.x * across, y: origin.y + direction.y * along + tangent.y * across });
  const tip = { x: origin.x + x, y: origin.y + y }, start = at(-.045 * length, -spread * (1 + shear));
  const controls = [start, at(.1 * length, -.58 * spread), at(.83 * length, -.24 * spread - bend), tip, at(.9 * length, .24 * spread), at(.2 * length, .62 * spread), at(.075 * length, .82 * spread), at(-.025 * length, .57 * spread), at(-.055 * length, .22 * spread), at(-.055 * length, 0), at(-.055 * length, -.25 * spread), at(-.045 * length, -.74 * spread), start];
  const center = { x: .5 * width, y: .5 * height }, diagonal = 1.65 * Math.hypot(width, height);
  const diamondAt = (along: number, across: number): Point => ({ x: center.x + direction.x * along + tangent.x * across, y: center.y + direction.y * along + tangent.y * across });
  const diamond = [diamondAt(0, -diagonal), diamondAt(diagonal, 0), diamondAt(0, diagonal), diamondAt(-diagonal, 0), diamondAt(0, -diagonal)];
  const expanded = [diamond[0]];
  for (let edge = 0; edge < 4; edge++) expanded.push(mixPoint(diamond[edge], diamond[edge + 1], 1 / 3), mixPoint(diamond[edge], diamond[edge + 1], 2 / 3), diamond[edge + 1]);
  const points = controls.map((point, index) => { const delay = index >= 1 && index <= 5 ? 0 : .045; return mixPoint(point, expanded[index], opening ? smooth((gate.openingAge - delay) / (gate.reduced ? .36 : .91 - delay)) : 0); });
  let hole = `M${pointString(points[0])}`;
  for (let i = 1; i < 13; i += 3) hole += `C${pointString(points[i])} ${pointString(points[i + 1])} ${pointString(points[i + 2])}`;
  hole += "Z";
  const visible = length > .08 || opening;
  return {
    hole: visible ? hole : "", lip: visible ? `M${pointString(points[0])}C${pointString(points[1])} ${pointString(points[2])} ${pointString(points[3])}C${pointString(points[4])} ${pointString(points[5])} ${pointString(points[6])}` : "",
    cx: mix(origin.x + .45 * x, center.x, progress), cy: mix(origin.y + .45 * y, center.y, progress), angle: progress === 1 ? 0 : Math.atan2(direction.y, direction.x) * (1 - progress), progress,
    cover: `M-4,-4H${width + 4}V${height + 4}H-4Z${visible ? hole : ""}`,
  };
}
