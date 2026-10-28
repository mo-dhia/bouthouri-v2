import contours from "./hand-contours.json";
import { pixelsToVw } from "@/lib/viewport-design";
import { clamp, cubic, mix, pointString, smooth, type Point } from "./opening-score";

type HandFrame = { x: number; y: number; originX: number; originY: number; contactX: number; contactY: number; releaseX: number; releaseY: number; vectorX: number; vectorY: number; width: number; height: number; rtl: boolean; mobile: boolean; quiet: boolean; tension: number; q: number; clock: number; age: number; openingAge: number; phase: string; entry: number; dt: number; scale: number; viewportWidth: number };

function handContour(closed: number) {
  let from = { x: -18, y: 62 };
  const result = [from];
  contours.open.forEach((open, index) => {
    const target = contours.closed[index], curve = open.map((value, i) => mix(value, target[i], clamp(closed)));
    const to = { x: curve[4], y: curve[5] };
    for (let step = 1; step <= 8; step++) result.push(cubic(from, { x: curve[0], y: curve[1] }, { x: curve[2], y: curve[3] }, to, step / 8));
    from = to;
  });
  return result;
}

function mergeIntoLine(points: Point[], release: Point, top: Point, bottom: Point, age: number, quiet: boolean) {
  const morph = smooth((age - .14) / (quiet ? .55 : .78)), extend = smooth((age - .22) / .85), tail = smooth((age - 1.12) / .43);
  const start = { x: release.x, y: release.y + 55 }, endControl = { x: top.x, y: top.y - 42 };
  const output = points.map((point, index) => {
    const position = index / (points.length - 1), reach = mix(.1, 1, extend), t = mix(.72 * tail, reach, position);
    const target = t < .72 ? cubic(start, { x: start.x, y: Math.min(start.y, top.y) - 90 }, endControl, top, t / .72) : { x: top.x, y: mix(top.y, bottom.y, (t - .72) / .28) };
    return { x: mix(point.x, target.x, morph), y: mix(point.y, target.y, morph) };
  });
  const smoothing = Math.sin(Math.PI * morph), samples = Math.ceil(15 * smoothing);
  if (samples > 0) {
    const previous = output.map((point) => ({ ...point })), sigma = Math.max(1, .5 * samples);
    for (let index = 1; index < output.length - 1; index++) {
      let x = 0, y = 0, total = 0;
      for (let offset = -samples; offset <= samples; offset++) { const point = previous[clamp(index + offset, 0, output.length - 1)], weight = Math.exp(-offset * offset / (2 * sigma * sigma)); x += point.x * weight; y += point.y * weight; total += weight; }
      output[index] = { x: mix(output[index].x, x / total, smoothing), y: mix(output[index].y, y / total, smoothing) };
    }
  }
  return { points: output, merged: age >= 1.55, stroke: mix(1.45, 1.2, morph) };
}

export function createGateHand(scene: HTMLElement) {
  const hand = scene.querySelector<SVGPathElement>("[data-drawn-hand]")!;
  const handle = scene.querySelector<HTMLButtonElement>(".services-gate-handle")!;
  const contact = scene.querySelector<SVGPathElement>("[data-grip-contact]")!;
  const trajectory = scene.querySelector<SVGPathElement>("[data-gate-trajectory]")!;
  const annotation = scene.querySelector<HTMLElement>(".services-grip-annotation")!;
  let closure = 0, tilt = 0, present = false;
  return {
    render(frame: HandFrame) {
      const held = frame.phase === "dragging" || frame.phase === "armed", open = frame.phase === "opening" || frame.phase === "resolved";
      const target = held || frame.phase === "releasing" ? 1 : frame.phase === "returning" ? clamp(5 * Math.abs(frame.q) + .32 * (1 - smooth(frame.age / .45))) : open ? 1 - smooth(frame.openingAge / .27) : 0;
      if (frame.entry <= 0) { closure = 0; tilt = 0; present = false; } else { closure += (target - closure) * (1 - Math.exp(-30 * Math.min(frame.dt, .05))); present = true; }
      const targetTilt = clamp((.11 * frame.vectorX - .045 * frame.vectorY) * (frame.rtl ? -1 : 1), -.3, .3);
      tilt += (targetTilt - tilt) * (1 - Math.exp(-14 * Math.min(frame.dt, .05)));
      const direction = frame.rtl ? -1 : 1, size = frame.mobile ? .83 : .94, x = open ? frame.releaseX : frame.x, y = open ? frame.releaseY : frame.y;
      const angle = tilt + (frame.quiet ? 0 : .012 * Math.sin(.73 * frame.clock)) * (1 - closure), cos = Math.cos(angle), sin = Math.sin(angle);
      const points = handContour(closure).map((point) => ({ x: x + (point.x * cos - point.y * sin) * size * direction, y: y + (point.x * sin + point.y * cos) * size }));
      const lineX = frame.width * (frame.rtl ? frame.mobile ? .93 : .86 : frame.mobile ? .07 : .14);
      const top = { x: lineX, y: .33 * frame.height }, bottom = { x: lineX, y: .73 * frame.height };
      const merged = open ? mergeIntoLine(points, { x, y }, top, bottom, frame.openingAge, frame.quiet) : null;
      hand.setAttribute("d", merged?.merged ? "" : (merged?.points ?? points).map((point, i) => `${i ? "L" : "M"}${pointString(point)}`).join(""));
      trajectory.setAttribute("d", merged?.merged ? `M${top.x},${top.y}L${bottom.x},${bottom.y}` : "");
      hand.style.strokeWidth = String(merged?.stroke ?? 1.45);
      const color = open ? smooth((frame.openingAge - .14) / .78) : 0;
      hand.style.stroke = `rgb(${204 - 17 * color},${199 - 16 * color},${184 - 15 * color})`;
      hand.style.strokeDasharray = "1"; hand.style.strokeDashoffset = String(1 - (frame.quiet ? smooth(frame.entry / .22) : smooth(frame.entry)));
      hand.dataset.pose = merged ? merged.merged ? "merged" : "transforming" : closure > .7 ? "grab" : "open";
      const width = frame.mobile ? 152 : 170, height = frame.mobile ? 172 : 188;
      // DOM hit boxes cross from reference pixels to physical CSS geometry once.
      handle.style.width = `${width * frame.scale / frame.viewportWidth * 100}vw`; handle.style.height = `${height * frame.scale / frame.viewportWidth * 100}vw`;
      handle.style.transform = `translate3d(${pixelsToVw((frame.x - width / 2) * frame.scale, frame.viewportWidth)},${pixelsToVw((frame.y - .48 * height) * frame.scale, frame.viewportWidth)},0)`;
      annotation.style.transform = `translate3d(${pixelsToVw((frame.originX + direction * (frame.mobile ? 70 : 110)) * frame.scale, frame.viewportWidth)},${pixelsToVw((frame.originY + 50) * frame.scale, frame.viewportWidth)},0)`;
      annotation.style.clipPath = `inset(0 0 ${100 * (1 - (open || frame.phase === "releasing" ? 0 : frame.entry))}% 0)`;
      contact.setAttribute("d", `M${frame.contactX - 10},${frame.contactY + 5}Q${frame.contactX},${frame.contactY + 8 + 2 * frame.tension} ${frame.contactX + 11},${frame.contactY + 5}`);
      contact.style.opacity = String(held || frame.phase === "returning" ? .22 + .24 * frame.tension : 0);
      if (!present) { hand.style.strokeDashoffset = "1"; contact.style.opacity = "0"; }
    },
    dispose() { hand.setAttribute("d", ""); trajectory.setAttribute("d", ""); },
  };
}
