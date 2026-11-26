import { expect, test, type Page } from '@playwright/test';
import { vitalsWidget } from '../../src/chart';
import { expectFindingToFail, findingDetails } from '../../src/findings';
import { obscuredState, type ObscuredState, type Rect } from '../../src/geometry';
import { chartPath, readFixture } from '../../src/openmrs';

// 1280x800 at 200% zoom is a 640x400 CSS px viewport at 2 device pixels per CSS pixel.
// Emulating it this way (instead of browser zoom, which Playwright cannot drive) triggers the same
// responsive breakpoint: the tablet layout with the fixed bottom toolbar.
test.use({ viewport: { width: 640, height: 400 }, deviceScaleFactor: 2 });

const MAX_TABS = 80;

interface Stop {
  index: number;
  description: string;
  inWidget: boolean;
  isAdd: boolean;
  rect: Rect;
  scrollY: number;
  bars: Rect[];
  state: ObscuredState;
}

interface Snapshot {
  description: string;
  inWidget: boolean;
  isAdd: boolean;
  rect: Rect;
  scrollY: number;
  bars: Rect[];
  viewport: { width: number; height: number };
}

/** Runs in the page: fixed bars (header / bottom toolbar) that do not contain the focused element. */
function snapshotFocus(): Snapshot {
  const active = document.activeElement as HTMLElement;
  const rect = active.getBoundingClientRect();
  const bars: Rect[] = [];
  for (const el of Array.from(document.body.querySelectorAll<HTMLElement>('*'))) {
    const style = getComputedStyle(el);
    if (style.position !== 'fixed' || style.visibility === 'hidden' || style.display === 'none') {
      continue;
    }
    const box = el.getBoundingClientRect();
    const wide = box.width >= window.innerWidth * 0.9;
    // A bar is short; this also leaves out full-screen containers such as the modals root.
    const short = box.height > 0 && box.height <= window.innerHeight / 2;
    const docked = box.top <= 0.5 || box.bottom >= window.innerHeight - 0.5;
    if (wide && short && docked && !el.contains(active)) {
      bars.push({ top: box.top, right: box.right, bottom: box.bottom, left: box.left });
    }
  }
  const inner = active.querySelector('[aria-label], [alt]');
  const own = active.getAttribute('aria-label') || (active.textContent ?? '').trim();
  const text = own || inner?.getAttribute('aria-label') || inner?.getAttribute('alt') || '';
  return {
    description: `<${active.tagName.toLowerCase()}> "${text.slice(0, 30)}"`,
    inWidget: active.closest('[data-extension-id="vitals-overview-widget"]') !== null,
    isAdd: (active.textContent ?? '').trim() === 'Add',
    rect: { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left },
    scrollY: window.scrollY,
    bars,
    viewport: { width: window.innerWidth, height: window.innerHeight },
  };
}

/** The browser scrolls focus into view with smooth scrolling: wait until scrollY is stable. */
function waitForScrollToSettle(): Promise<void> {
  return new Promise((resolve) => {
    let last = -1;
    let stableFrames = 0;
    const tick = () => {
      stableFrames = window.scrollY === last ? stableFrames + 1 : 0;
      last = window.scrollY;
      if (stableFrames >= 6) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

interface Walk {
  stops: Stop[];
  shots: { label: string; png: Buffer }[];
}

/** Tab from the top of the page until focus leaves the Vitals widget after "Add". */
async function walkTabs(page: Page): Promise<Walk> {
  const stops: Stop[] = [];
  const shots: Walk['shots'] = [];
  let reachedAdd = false;
  for (let index = 1; index <= MAX_TABS; index++) {
    await page.keyboard.press('Tab');
    await page.evaluate(waitForScrollToSettle);
    const snap = await page.evaluate(snapshotFocus);
    reachedAdd = reachedAdd || (snap.inWidget && snap.isAdd);
    if (reachedAdd && !snap.inWidget) break;
    if (!snap.inWidget) continue;

    const state = obscuredState(snap.rect, snap.viewport, snap.bars);
    stops.push({ index, ...snap, state });
    const seen = shots.some((shot) => shot.label === state);
    if (state !== 'none' && !seen) {
      shots.push({ label: state, png: await page.screenshot() });
    }
  }
  return { stops, shots };
}

test(
  'M6 · 2.4.11 Focus Not Obscured (Minimum) (AA) · no focused control is hidden by a fixed bar at 200% zoom',
  findingDetails('M6'),
  async ({ page }, testInfo) => {
    await page.goto(chartPath(readFixture().patientUuid, 'Patient Summary'));
    await expect(vitalsWidget(page)).toBeVisible();
    await page.evaluate(() => document.fonts.ready);

    // The tablet layout shows at least one fixed bar docked to the bottom.
    const initial = await page.evaluate(snapshotFocus);
    expect(
      initial.bars.some((bar) => bar.bottom >= initial.viewport.height - 0.5),
      'a fixed toolbar is docked to the bottom (tablet layout)',
    ).toBe(true);
    expect(initial.scrollY, 'page starts scrolled to the top').toBe(0);
    await expect(page.locator('body')).toBeFocused();

    const { stops, shots } = await walkTabs(page);
    expect(
      stops.some((stop) => stop.isAdd),
      `Tab reaches the "Add" button of the Vitals widget in at most ${MAX_TABS} presses`,
    ).toBe(true);
    expect(stops.length, 'several focus stops inside the Vitals widget').toBeGreaterThan(5);

    await testInfo.attach('focus-stops.json', {
      body: JSON.stringify(stops, null, 2),
      contentType: 'application/json',
    });
    for (const shot of shots) {
      await testInfo.attach(`focus-${shot.label}.png`, {
        body: shot.png,
        contentType: 'image/png',
      });
    }
    const partial = stops.filter((stop) => stop.state === 'partial');
    testInfo.annotations.push({
      type: 'partially-obscured',
      description: `${partial.length} focus stop(s) partly covered (not a 2.4.11 failure on their own): ${partial.map((stop) => `#${stop.index} ${stop.description}`).join(', ') || 'none'}`,
    });

    expectFindingToFail('M6');
    const full = stops.filter((stop) => stop.state === 'full');
    const actual = full
      .map(
        (stop) =>
          `#${stop.index} ${stop.description} top ${Math.round(stop.rect.top)} bottom ${Math.round(stop.rect.bottom)}`,
      )
      .join('; ');
    expect(
      full,
      `[M6] ${full.length} focus stop(s) entirely behind a fixed bar at 200% zoom (viewport 640x400). Actual: ${actual}`,
    ).toHaveLength(0);
  },
);
