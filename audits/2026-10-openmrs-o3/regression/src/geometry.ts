export interface Rect {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export type ObscuredState = 'none' | 'partial' | 'full';

function intersect(a: Rect, b: Rect): Rect | null {
  const top = Math.max(a.top, b.top);
  const right = Math.min(a.right, b.right);
  const bottom = Math.min(a.bottom, b.bottom);
  const left = Math.max(a.left, b.left);
  return top < bottom && left < right ? { top, right, bottom, left } : null;
}

function contains(outer: Rect, inner: Rect, tolerance: number): boolean {
  return (
    inner.top >= outer.top - tolerance &&
    inner.right <= outer.right + tolerance &&
    inner.bottom <= outer.bottom + tolerance &&
    inner.left >= outer.left - tolerance
  );
}

/**
 * How much of `target` is covered by fixed bars, within the viewport.
 * 'full' = nothing of the target is visible (WCAG 2.4.11 fails only then),
 * 'partial' = some of it is covered, 'none' = no bar overlaps it.
 */
export function obscuredState(
  target: Rect,
  viewport: { width: number; height: number },
  bars: Rect[],
  tolerance = 0.5,
): ObscuredState {
  const visible = intersect(target, {
    top: 0,
    right: viewport.width,
    bottom: viewport.height,
    left: 0,
  });
  if (!visible) return 'full';
  if (bars.some((bar) => contains(bar, visible, tolerance))) return 'full';
  if (bars.some((bar) => intersect(bar, visible) !== null)) return 'partial';
  return 'none';
}

interface HorizontalBounds {
  left: number;
  right: number;
}

/** Items whose box leaves the viewport or one of their clipping ancestors horizontally. */
export function findClipped<T extends { rect: HorizontalBounds; clips: HorizontalBounds[] }>(
  items: T[],
  viewportWidth: number,
  tolerance = 1,
): T[] {
  return items.filter((item) => {
    const bounds: HorizontalBounds[] = [{ left: 0, right: viewportWidth }, ...item.clips];
    return bounds.some(
      (bound) =>
        item.rect.left < bound.left - tolerance || item.rect.right > bound.right + tolerance,
    );
  });
}
