import { expect, test } from '@playwright/test';
import { findClipped, obscuredState, type Rect } from '../../src/geometry';

const viewport = { width: 640, height: 400 };
// Fixed toolbar docked to the bottom edge: y from 340 to 400.
const bottomBar: Rect = { top: 340, right: 640, bottom: 400, left: 0 };

test.describe('obscuredState', () => {
  test('target fully inside the bottom bar is full', () => {
    const target: Rect = { top: 350, right: 200, bottom: 390, left: 100 };
    expect(obscuredState(target, viewport, [bottomBar])).toBe('full');
  });

  test('target partly under the bar is partial', () => {
    const target: Rect = { top: 320, right: 200, bottom: 360, left: 100 };
    expect(obscuredState(target, viewport, [bottomBar])).toBe('partial');
  });

  test('target above the bar is none', () => {
    const target: Rect = { top: 100, right: 200, bottom: 140, left: 100 };
    expect(obscuredState(target, viewport, [bottomBar])).toBe('none');
  });

  test('target outside the viewport is full', () => {
    const target: Rect = { top: 500, right: 200, bottom: 540, left: 100 };
    expect(obscuredState(target, viewport, [bottomBar])).toBe('full');
  });

  test('target crossing the bottom edge, visible part entirely in the bar, is full', () => {
    const target: Rect = { top: 380, right: 200, bottom: 450, left: 100 };
    expect(obscuredState(target, viewport, [bottomBar])).toBe('full');
  });

  test('no bars is none', () => {
    const target: Rect = { top: 100, right: 200, bottom: 140, left: 100 };
    expect(obscuredState(target, viewport, [])).toBe('none');
  });

  test('edges that coincide within the tolerance count as contained', () => {
    const target: Rect = { top: 339.8, right: 200, bottom: 400.3, left: 100 };
    expect(obscuredState(target, viewport, [bottomBar], 0.5)).toBe('full');
  });
});

test.describe('findClipped', () => {
  const item = (left: number, right: number, clips: { left: number; right: number }[] = []) => ({
    rect: { left, right },
    clips,
  });

  test('item inside the viewport and its clips is not reported', () => {
    expect(findClipped([item(10, 300, [{ left: 0, right: 320 }])], 320)).toEqual([]);
  });

  test('right edge beyond the viewport width plus tolerance is reported', () => {
    const wide = item(10, 322);
    expect(findClipped([wide], 320)).toEqual([wide]);
  });

  test('right edge beyond a clipping ancestor is reported', () => {
    const clipped = item(10, 250, [{ left: 0, right: 200 }]);
    expect(findClipped([clipped], 320)).toEqual([clipped]);
  });

  test('left edge before a clipping ancestor is reported', () => {
    const clipped = item(10, 100, [{ left: 50, right: 300 }]);
    expect(findClipped([clipped], 320)).toEqual([clipped]);
  });

  test('overflow within the tolerance is not reported', () => {
    expect(findClipped([item(-1, 321)], 320)).toEqual([]);
  });

  test('item with no clips and inside the viewport is not reported', () => {
    expect(findClipped([item(0, 320)], 320)).toEqual([]);
  });
});
