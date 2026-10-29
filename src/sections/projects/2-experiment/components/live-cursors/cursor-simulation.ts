export type CursorPoint = { x: number; y: number };
type Stop = CursorPoint & { hold: number; travel: number; bend: number };

// Authored local paths: purposeful moves, curved travel and irregular pauses.
// These points never come from another tab, visitor, stored session or service.
const paths: Stop[][] = [
  [{ x: .22, y: .32, hold: .9, travel: 1.8, bend: .06 }, { x: .71, y: .29, hold: 1.3, travel: 2.2, bend: -.05 }, { x: .64, y: .66, hold: .6, travel: 1.6, bend: .04 }, { x: .31, y: .57, hold: 1.6, travel: 2.4, bend: -.05 }],
  [{ x: .72, y: .58, hold: 1.4, travel: 2.1, bend: -.05 }, { x: .48, y: .25, hold: .7, travel: 1.5, bend: .04 }, { x: .25, y: .62, hold: 1.1, travel: 2.6, bend: -.04 }, { x: .77, y: .42, hold: .8, travel: 1.7, bend: .05 }],
  [{ x: .43, y: .68, hold: .6, travel: 2.5, bend: .04 }, { x: .27, y: .27, hold: 1.5, travel: 1.9, bend: -.05 }, { x: .78, y: .48, hold: .9, travel: 2.3, bend: .06 }, { x: .54, y: .37, hold: 1.2, travel: 1.6, bend: -.03 }],
];
const offsets = [{ x: -.08, y: -.05 }, { x: .07, y: .06 }, { x: -.12, y: .1 }];
const clamp = (n: number) => Math.max(.05, Math.min(.9, n));
const smooth = (p: number) => p * p * (3 - 2 * p);

/** A deterministic, looping demonstration, not a presence or tracking client. */
export function cursorTarget(seconds: number, index: number): CursorPoint {
  const path = paths[index % paths.length];
  const duration = path.reduce((total, stop) => total + stop.hold + stop.travel, 0);
  let time = (Math.max(0, seconds) + index * 1.7) % duration;
  for (let i = 0; i < path.length; i++) {
    const from = path[i], to = path[(i + 1) % path.length];
    if (time < from.hold) return { x: from.x, y: from.y };
    time -= from.hold;
    if (time < from.travel) {
      const progress = smooth(time / from.travel), arc = Math.sin(Math.PI * progress) * from.bend;
      return { x: from.x + (to.x - from.x) * progress + arc * (to.y - from.y), y: from.y + (to.y - from.y) * progress - arc * (to.x - from.x) };
    }
    time -= from.travel;
  }
  return { x: path[0].x, y: path[0].y };
}

/** Briefly guide the demo with this stage's pointer, then return to its path. */
export function guidedCursorTarget(seconds: number, index: number, focus?: CursorPoint & { age: number }): CursorPoint {
  const idle = cursorTarget(seconds, index);
  if (!focus) return idle;
  const amount = .88 * (1 - smooth(Math.max(0, Math.min(1, (focus.age - 1.5) / 1.7))));
  const offset = offsets[index % offsets.length];
  return { x: idle.x + (clamp(focus.x + offset.x) - idle.x) * amount, y: idle.y + (clamp(focus.y + offset.y) - idle.y) * amount };
}
