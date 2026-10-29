import { referenceStage } from '@/lib/viewport-design';

/** Source Lab detail stage: the design profile's width at the window's proportions. */
export function experimentLayout(viewportWidth: number, viewportHeight: number) {
  const design = referenceStage(viewportWidth, viewportHeight);
  const inset = design.key === 'desktop' ? 30 : design.key === 'tablet' ? 21.15 : 16.4666666667;
  const top = design.key === 'mobile' ? 80 : 102;
  return { design, scale: design.scale, inset, top,
    width: Math.round(design.width - inset * 2 - 2), height: Math.round(design.height - top - inset - 2) };
}
