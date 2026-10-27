import { clamp } from "./story-score";

export type SculpturePose = { x: number; y: number; z: number; rx: number; ry: number; rz: number; scale: number };
type Key = { at: number; pose: SculpturePose; bow?: [number, number, number] };
export type SculptureRoute = Key[];
const fields = ["x", "y", "z", "rx", "ry", "rz", "scale"] as const;
const pose = (x: number, y: number, z: number, rx: number, ry: number, rz: number, scale: number): SculpturePose => ({ x, y, z, rx, ry, rz, scale });
const key = (at: number, pose: SculpturePose, bow?: Key["bow"]): Key => ({ at, pose, bow });

/** Measured original sculpture paths: curve / circle / dash, not generic reveals. */
export function createSculptureRoutes(aspect: number, rtl: boolean): SculptureRoute[] {
  const portrait = aspect < 0.88;
  const halfHeight = 3.06 * Math.max(1, 0.88 / aspect);
  const bottom = -halfHeight - 4;
  const top = halfHeight + 5;
  const responsive = (index: number, p: SculpturePose) => portrait
    ? { ...p, x: p.x * 0.35, y: p.y * 0.7, z: p.z + 2, scale: p.scale * [0.86, 0.86, 0.58][index] } : p;
  const curve = responsive(0, pose(1.6, -0.05, 1.05, 0.3, -0.56, -2.1, 3.35));
  const circle = responsive(1, pose(0, 0, 1.25, 0.08, 0.12, 0, 2.92));
  const dash = responsive(2, pose(1.2, -0.35, 0.7, -0.1, -0.24, 0.12, 4.9));
  const routes = [
    [
      key(0, pose(2, bottom, -0.7, 1.03, -0.6, -1.52, curve.scale)),
      key(100, pose(2, bottom, -0.7, 1.03, -0.6, -1.52, curve.scale)),
      key(114, responsive(0, pose(1.85, -2, 0.1, 0.7, -0.92, -1.85, 3.35)), [0.12, 0, 0.15]),
      key(128, curve),
      key(141, { ...curve, rx: 0.16, ry: -0.2, rz: -2.2, x: curve.x - 0.12, z: curve.z + 0.15 }),
      key(158, pose(-3.5, 0.68 * top, -0.8, 0.74, -0.35, -2.64, curve.scale * 0.88), [-0.25, 0.2, 0]),
      key(170, pose(-8, top, -2, 0.65, -0.4, -2.6, 2.25)),
      key(282, pose(-8, top, -2, 0.65, -0.4, -2.6, 2.25)),
    ],
    [
      key(0, pose(-0.6, bottom, -7, -0.12, 1.48, -0.16, circle.scale)),
      key(140, pose(-0.6, bottom, -7, -0.12, 1.48, -0.16, circle.scale)),
      key(156, responsive(1, pose(-0.8, -2, 0.7, 0.05, 1.2, -0.14, 2.92)), [-0.2, 0, 0.1]),
      key(174, circle),
      key(185, { ...circle }),
      key(202, pose(4.8, 0.7 * top, -1, -0.24, -0.54, 0.35, circle.scale * 0.88), [0.3, 0.2, -0.1]),
      key(216, pose(8, top, -2, -0.3, -0.65, 0.45, 2.2)),
      key(282, pose(8, top, -2, -0.3, -0.65, 0.45, 2.2)),
    ],
    [
      key(0, pose(1.8, bottom, -14, 0.88, 0.75, -0.57, dash.scale)),
      key(184, pose(1.8, bottom, -14, 0.88, 0.75, -0.57, dash.scale)),
      key(204, responsive(2, pose(0.85, -1.9, 0.3, 0.12, -0.35, 0.16, 4.9))),
      key(218, dash),
      key(232, { ...dash, x: dash.x + 0.14 }),
      key(250, pose(portrait ? 1.25 : 2.4, 0.72, -5.2, 1.25, 0.1, 0, portrait ? 1.75 : 2.45), [0.15, 0.12, -0.2]),
      key(264, pose(portrait ? 4.3 : 6.4, 0.72, -7, 1.45, 0.15, 0, 1.8)),
      key(278, pose(portrait ? 10 : 14, 0.72, -8, 1.45, 0.15, 0, 1.8)),
      key(282, pose(portrait ? 10 : 14, 0.72, -8, 1.45, 0.15, 0, 1.8)),
    ],
  ];
  if (rtl) for (const k of routes[2]) { k.pose.x *= -1; if (k.bow) k.bow[0] *= -1; }
  return routes;
}

/** Hermite translation with .72 tangents; smoothstep rotation/scale and authored bows. */
export function sampleSculptureRoute(route: SculptureRoute, time: number): SculpturePose {
  let index = route.length - 2;
  for (let i = 1; i < route.length; i++) if (time <= route[i].at) { index = i - 1; break; }
  const start = route[index], end = route[index + 1];
  const before = route[Math.max(0, index - 1)], after = route[Math.min(route.length - 1, index + 2)];
  if (fields.every((field) => start.pose[field] === end.pose[field])) return { ...start.pose };
  const p = clamp((time - start.at) / (end.at - start.at));
  const smooth = p * p * (3 - 2 * p), bow = 16 * p * p * (1 - p) ** 2;
  const result = { ...start.pose };
  for (const field of fields) result[field] += (end.pose[field] - start.pose[field]) * smooth;
  const stopped = (a: Key, b: Key) => Math.hypot(a.pose.x - b.pose.x, a.pose.y - b.pose.y, a.pose.z - b.pose.z) < 1e-5 || [128, 174, 218].includes(a.at);
  for (const field of ["x", "y", "z"] as const) {
    const span = end.at - start.at;
    const incoming = stopped(start, before) ? 0 : (end.pose[field] - before.pose[field]) / (end.at - before.at) * span * 0.72;
    const outgoing = stopped(end, after) ? 0 : (after.pose[field] - start.pose[field]) / (after.at - start.at) * span * 0.72;
    result[field] = (2 * p ** 3 - 3 * p * p + 1) * start.pose[field] + (p ** 3 - 2 * p * p + p) * incoming
      + (-2 * p ** 3 + 3 * p * p) * end.pose[field] + (p ** 3 - p * p) * outgoing;
  }
  if (end.bow) { result.x += end.bow[0] * bow; result.y += end.bow[1] * bow; result.z += end.bow[2] * bow; }
  return result;
}
