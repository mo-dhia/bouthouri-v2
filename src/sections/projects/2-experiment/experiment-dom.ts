/** DOM inside an experiment is a reference camera, like an SVG viewBox.
 * Its pixel coordinates are emitted as inherited width-based CSS lengths. */
export function designCss(value: unknown) {
  return String(value).replace(/(-?(?:\d*\.)?\d+(?:e[+-]?\d+)?)px\b/gi, 'calc($1 * var(--experiment-unit))');
}

export function setDesignStyle(element: HTMLElement | SVGElement, property: string, value: unknown) {
  if (property === 'cssText') element.style.cssText = designCss(value);
  else element.style.setProperty(property.startsWith('--') ? property : property.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`), designCss(value));
  return value;
}

export function referenceRect(element: Element) {
  const scale = Number(element.closest<HTMLElement>('[data-experiment-camera]')?.dataset.experimentScale ?? 1) || 1;
  const rect = element.getBoundingClientRect();
  return { x: rect.x / scale, y: rect.y / scale, width: rect.width / scale, height: rect.height / scale,
    left: rect.left / scale, top: rect.top / scale, right: rect.right / scale, bottom: rect.bottom / scale };
}
