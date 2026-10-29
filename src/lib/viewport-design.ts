export const viewportDesigns = {
  desktop: { key: "desktop", width: 1920, height: 1080 },
  tablet: { key: "tablet", width: 768, height: 1024 },
  mobile: { key: "mobile", width: 412, height: 915 },
} as const;

export type ViewportDesign = typeof viewportDesigns[keyof typeof viewportDesigns];

/** Width selects the design profile and its scale; the physical height stays live. */
export function viewportDesign(width: number): ViewportDesign {
  return width <= 600 ? viewportDesigns.mobile : width <= 1024 ? viewportDesigns.tablet : viewportDesigns.desktop;
}

export function designScale(width: number): number {
  return width / viewportDesign(width).width;
}

/** Reference pixels -> actual render/hit-test coordinates. Time/angles/DPR are not lengths. */
export function designPixels(value: number, width: number): number {
  return value * designScale(width);
}

/** The physical stage in reference pixels: the reference width at the window's proportions. */
export function referenceStage(width: number, height: number) {
  const design = viewportDesign(width), scale = width / design.width;
  return { key: design.key, width: design.width, height: height / scale, scale };
}

/** Measured browser pixels -> a CSS vw length; no fixed px styling is emitted. */
export function pixelsToVw(value: number, width: number): string {
  return `${value / width * 100}vw`;
}

export function referencePixelsToVw(value: number, reference: ViewportDesign): string {
  return `${value / reference.width * 100}vw`;
}
