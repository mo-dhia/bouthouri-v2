/** Source editorial-logo camera and pose, evaluated in the fixed reference canvas. */
export type PracticeKind = 'about' | 'services';
export const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
export const smooth01 = (value: number) => { const n = clamp01(value); return n * n * (3 - 2 * n); };
export const practiceLogo = {
  diameter: 73.600516,
  worldUnitsPerPixel: .02,
  halfAngle: -410.3550821110788 / 180,
  halfOffset: [(118.913103479137 - 137.4465684964374) * .02, -(88.38151229152174 - 51.9042756629948) * .02],
  halfPitch: 55 / 73.600516,
};
export function practiceHeroLayout(kind: PracticeKind, width: number, height: number) {
  const portrait = width <= 700 || height / width > 1.12;
  const diameter = portrait ? Math.min(.6 * width, .36 * height) : Math.min(.36 * width, .58 * height);
  const size = diameter * (portrait ? 1.18 : 1.2);
  const center = width * (portrait && kind === 'about' ? .82 : .5) - (kind === 'about' ? diameter * practiceLogo.halfPitch : 0);
  return { x: kind === 'about' ? Math.max(center, .52 * size + .035 * width + 7) : center, y: height * (portrait ? kind === 'about' ? .44 : .46 : .49), size, portrait };
}
export function practiceHeroPointer(kind: PracticeKind, width: number, height: number, x: number, y: number) {
  const layout = practiceHeroLayout(kind, width, height), about = kind === 'about';
  if (layout.portrait) return { x: 0, y: 0 };
  const dx = (x - (layout.x - (about ? .25 * layout.size : 0))) / (layout.size * (about ? .4 : .65));
  const dy = (layout.y - y) / (.65 * layout.size);
  const strength = 1 - smooth01((Math.hypot(dx, dy) - .8) / .65);
  return { x: Math.max(-1, Math.min(1, dx)) * strength, y: Math.max(-1, Math.min(1, dy)) * strength };
}
export function practiceHeroPose(kind: PracticeKind, width: number, height: number, rtl: boolean, progress: number, pointerX = 0, pointerY = 0, reduced = false, seconds = 0, entry = 1) {
  void rtl;
  const layout = practiceHeroLayout(kind, width, height), about = kind === 'about';
  const scroll = reduced ? 0 : smooth01(progress), hover = reduced || layout.portrait ? 0 : 1;
  const drift = reduced ? 0 : layout.portrait ? .7 : 1;
  const oscillate = (frequency: number, phase: number) => .8 * Math.sin(seconds * frequency + phase) + .2 * Math.sin(seconds * frequency * .617 + phase + 1.7);
  const rotationDrift = [(about ? .07 : .061) * oscillate(.37, .15), (about ? .105 : .092) * oscillate(.281, .7), (about ? .033 : .025) * oscillate(.193, 2.1)].map(n => n * drift);
  const tilt = about ? [-.015 * scroll, .02 * scroll, 0] : [-.012 * scroll, -.02 * scroll, 0];
  const pointer = about ? [.095 * pointerY, .14 * pointerX, pointerX * pointerY * .02] : [.078 * pointerY, .12 * pointerX, pointerX * pointerY * .014];
  const opening = reduced ? 0 : Math.pow(1 - clamp01(entry), 3);
  return {
    x: layout.x + (about ? 7.5 : 5.5) * oscillate(.237, .4) * drift + pointerX * hover * (about ? 2.5 : 1.5),
    y: layout.y + (about ? 12.5 : 9.5) * oscillate(.279, -.6) * drift - pointerY * hover * (about ? 1.8 : 1.2),
    size: layout.size,
    depth: (about ? 8 : 6) * oscillate(.181, 1.2) * drift - opening * layout.size * .28 + pointerX * pointerY * hover * 6,
    rotation: (about ? [.1, -.16, 0] : [.12, -.12, 0]).map((base, i) => base + tilt[i] + pointer[i] * hover + rotationDrift[i] + [.18, about ? -.25 : .23, about ? -.045 : .04][i] * opening),
    light: 4.2 - .9 * opening,
    lightDirection: [-.75 + scroll * (about ? 1.1 : .72) + hover * pointerX * .5 + .1 * oscillate(.173, .4) * drift, .8 - .6 * scroll + hover * pointerY * .34 + .08 * oscillate(.137, 2) * drift, 1.25],
    environmentRotation: [.035 * scroll + hover * pointerY * .13, scroll * (about ? .32 : .2) + hover * pointerX * .3 + .085 * oscillate(.113, .8) * drift, hover * pointerX * pointerY * .025],
    environmentIntensity: 1.65 + .12 * scroll - .32 * opening,
    roughness: .35 - scroll * (about ? .018 : .035),
  };
}
