import metrics from "./story-origin-data.json";

/** Deterministic pen origin before optional models, fonts, workers or GPU boot.
 * Dimensions are the actual #top stage, including its 600/560px minimum.
 * The live story-origin projection remains authoritative during Ideas.
 */
export function getSettledStoryOrigin(width: number, height: number, rtl: boolean) {
  const aspect = Math.max(1, width) / Math.max(1, height);
  const portrait = aspect < 0.88;
  const data = metrics[`${rtl ? "ar" : "en"}-${portrait ? "portrait" : "landscape"}`];
  const cameraZ = 10 * Math.max(1, 0.88 / aspect);
  const x = rtl ? portrait ? 2.12 : 3.78 : portrait ? -2.12 : -3.78;
  let y = -0.24;
  if (rtl) {
    y = Math.min(-0.6, 1.1 + data.firstMinY - data.secondMaxY - 0.16 * data.fontSize);
    y += Math.max(0, -0.64 * Math.tan(34 * Math.PI / 360) * (cameraZ + 0.8) - y - data.secondMinY);
  }
  // Match Three r180's PerspectiveCamera projection operation order without
  // importing its runtime into the native work controller's deferred graph.
  const near = 0.005;
  const top = near * Math.tan(Math.PI / 180 * 0.5 * 34);
  const frustumHeight = 2 * top, frustumWidth = aspect * frustumHeight;
  const sx = 2 * near / frustumWidth, sy = 2 * near / frustumHeight;
  const reciprocalW = 1 / (cameraZ + 0.8);
  const centerX = (data.dot.x + x) * sx * reciprocalW;
  const edgeX = (data.dot.x + data.dot.radius + x) * sx * reciprocalW;
  return {
    x: (centerX + 1) / 2,
    y: (1 - (data.dot.y + y) * sy * reciprocalW) / 2,
    radius: Math.abs(edgeX - centerX) * width / 2,
    ready: true,
    direction: rtl ? "rtl" as const : "ltr" as const,
  };
}
