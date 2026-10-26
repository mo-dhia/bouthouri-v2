/**
 * Distance of a rect from the current viewport, in px. 0 while any part is
 * on screen; below-viewport distance is the gap to the fold; above-viewport
 * distance is doubled (users rarely scroll back up). Shared by the media
 * scheduler and the scene boot gate so both queues rank work identically.
 */
export function measureViewportDistance(
  rect: DOMRect,
  viewportHeight: number,
): number {
  if (rect.bottom > 0 && rect.top < viewportHeight) {
    return 0;
  }

  if (rect.top >= viewportHeight) {
    return rect.top - viewportHeight;
  }

  return -rect.bottom * 2;
}
