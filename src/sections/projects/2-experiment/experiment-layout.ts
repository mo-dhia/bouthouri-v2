import { viewportDesign } from '@/lib/viewport-design';

/** Source Lab detail stage, frozen at the three agreed design canvases. */
export function experimentLayout(viewportWidth: number) {
  const design = viewportDesign(viewportWidth);
  const inset = design.key === 'desktop' ? 30 : design.key === 'tablet' ? 21.15 : 16.4666666667;
  const top = design.key === 'mobile' ? 80 : 102;
  return { design, scale: viewportWidth / design.width, inset, top,
    width: Math.round(design.width - inset * 2 - 2), height: Math.round(design.height - top - inset - 2) };
}
