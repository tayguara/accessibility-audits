import { expect, test, type Page } from '@playwright/test';
import { expectFindingToFail, findingDetails } from '../../src/findings';
import { findClipped } from '../../src/geometry';
import { chartPath, readFixture } from '../../src/openmrs';

// 320 CSS px is 1280 px at 400% zoom (WCAG 1.4.10). 256 is 1024 / 4.
test.use({ viewport: { width: 320, height: 256 } });

interface Bounds {
  left: number;
  right: number;
}

interface Collected {
  items: Item[];
  skippedInScrollRegion: number;
  skippedCollapsed: number;
  scrollRegions: string[];
}

interface Item {
  description: string;
  rect: Bounds;
  clips: Bounds[];
}

/**
 * Runs in the page. Collects elements that are interactive or carry their own text, and for each
 * one the horizontal boxes of the ancestors that clip it (overflow-x hidden/clip). An element
 * inside an ancestor that scrolls horizontally is skipped (and counted): WCAG 1.4.10 allows
 * scrolling within a region for content that needs it. An element inside a zero-width clipping box
 * is a collapsed panel, hidden on purpose, and is skipped too.
 */
function collectItems(): Collected {
  const interactive = 'a, button, input, select, textarea, summary, [role="button"], [role="tab"]';
  const items: Item[] = [];
  const scrollRegions = new Map<string, string>();
  let skippedInScrollRegion = 0;
  let skippedCollapsed = 0;
  for (const el of Array.from(document.body.querySelectorAll<HTMLElement>('*'))) {
    const ownText = Array.from(el.childNodes).some(
      (node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim() !== '',
    );
    if (!ownText && !el.matches(interactive)) continue;

    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) continue;
    if (style.visibility === 'hidden' || style.display === 'none') continue;

    const clips: Bounds[] = [];
    let scrollsHorizontally = false;
    let collapsed = false;
    for (let parent = el.parentElement; parent; parent = parent.parentElement) {
      const overflowX = getComputedStyle(parent).overflowX;
      if (overflowX === 'visible') continue;
      if (
        (overflowX === 'auto' || overflowX === 'scroll') &&
        parent.scrollWidth > parent.clientWidth
      ) {
        scrollsHorizontally = true;
        scrollRegions.set(
          `<${parent.tagName.toLowerCase()}> scrollWidth ${parent.scrollWidth} > clientWidth ${parent.clientWidth}`,
          '',
        );
        break;
      }
      const box = parent.getBoundingClientRect();
      collapsed = collapsed || parent.clientWidth < 1;
      clips.push({
        left: box.left + parent.clientLeft,
        right: box.left + parent.clientLeft + parent.clientWidth,
      });
    }
    if (scrollsHorizontally) {
      skippedInScrollRegion++;
      continue;
    }
    if (collapsed) {
      skippedCollapsed++;
      continue;
    }

    const label = (el.getAttribute('aria-label') ?? el.textContent ?? el.tagName).trim();
    items.push({
      description: `<${el.tagName.toLowerCase()}> "${label.replace(/\s+/g, ' ').slice(0, 40)}"`,
      rect: { left: rect.left, right: rect.right },
      clips,
    });
  }
  return {
    items,
    skippedInScrollRegion,
    skippedCollapsed,
    scrollRegions: Array.from(scrollRegions.keys()),
  };
}

async function pageOverflow(page: Page): Promise<{ scrollWidth: number; clientWidth: number }> {
  return page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
}

interface RegionMetrics {
  found: boolean;
  description: string;
  scrollWidth: number;
  clientWidth: number;
  left: number;
  right: number;
}

/** Runs in the page: the closest horizontally scrollable ancestor of the screen's main content. */
function regionMetrics(anchorSelector: string): RegionMetrics {
  const none = {
    found: false,
    description: 'none',
    scrollWidth: 0,
    clientWidth: 0,
    left: 0,
    right: 0,
  };
  for (let el = document.querySelector<HTMLElement>(anchorSelector); el; el = el.parentElement) {
    const overflowX = getComputedStyle(el).overflowX;
    if (el !== document.documentElement && (overflowX === 'auto' || overflowX === 'scroll')) {
      const box = el.getBoundingClientRect();
      return {
        found: true,
        description: `<${el.tagName.toLowerCase()}> overflow-x ${overflowX}`,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        left: box.left,
        right: box.right,
      };
    }
  }
  return none;
}

interface Screen {
  id: string;
  name: string;
  /** Main content of the screen; the region that holds it is the one measured by the region test. */
  anchor: string;
  open: (page: Page) => Promise<void>;
}

const screens: Screen[] = [
  {
    id: 'registration',
    name: 'P5 patient registration',
    anchor: 'form input',
    open: async (page) => {
      await page.goto('patient-registration');
      await expect(page.locator('form')).toBeVisible();
    },
  },
  {
    id: 'chart',
    name: 'P6 patient chart summary',
    anchor: '[data-extension-id="vitals-overview-widget"]',
    open: async (page) => {
      await page.goto(chartPath(readFixture().patientUuid, 'Patient Summary'));
      await expect(page.getByRole('heading', { name: 'Vitals', exact: true })).toBeVisible();
    },
  },
];

for (const screen of screens) {
  test(`M7 · 1.4.10 Reflow (AA) · ${screen.name} · page-level check passes (false negative on purpose)`, async ({
    page,
  }, testInfo) => {
    await screen.open(page);
    await page.evaluate(() => document.fonts.ready);
    const { scrollWidth, clientWidth } = await pageOverflow(page);
    testInfo.annotations.push({
      type: 'false-negative',
      description: `${screen.name}: page scrollWidth ${scrollWidth} <= clientWidth ${clientWidth}. The clipping is invisible to a page-level check; see the per-element test.`,
    });
    expect(scrollWidth, 'no horizontal scrollbar at 320 px').toBeLessThanOrEqual(clientWidth);
  });

  test(
    `M7 · 1.4.10 Reflow (AA) · ${screen.name} · header and toolbar controls are not cut off at 320 px`,
    findingDetails('M7'),
    async ({ page }, testInfo) => {
      await screen.open(page);
      await page.evaluate(() => document.fonts.ready);
      const { items, ...skipped } = await page.evaluate(collectItems);
      expect(items.length, 'elements were collected').toBeGreaterThan(5);

      const clipped = findClipped(items, 320);
      testInfo.annotations.push({
        type: 'scroll-region',
        description: `${skipped.skippedInScrollRegion} elements skipped because they sit inside a region that scrolls horizontally (${skipped.scrollRegions.join('; ') || 'none'}); ${skipped.skippedCollapsed} skipped inside collapsed zero-width panels.`,
      });
      await testInfo.attach(`clipped-${screen.id}.json`, {
        body: JSON.stringify({ collected: items.length, ...skipped, clipped }, null, 2),
        contentType: 'application/json',
      });
      await testInfo.attach(`reflow-${screen.id}.png`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });

      expectFindingToFail('M7');
      const examples = clipped
        .slice(0, 5)
        .map((item) => item.description)
        .join('; ');
      expect(
        clipped,
        `[M7] ${clipped.length} of ${items.length} elements are cut off at 320 px on ${screen.name}. Actual examples: ${examples}`,
      ).toHaveLength(0);
    },
  );

  test(
    `M7 · 1.4.10 Reflow (AA) · ${screen.name} · main content does not scroll sideways at 320 px`,
    findingDetails('M7'),
    async ({ page }, testInfo) => {
      await screen.open(page);
      await page.evaluate(() => document.fonts.ready);
      const region = await page.evaluate(regionMetrics, screen.anchor);

      expect(region.found, 'the main content sits inside an overflow-x scroll region').toBe(true);
      expect(region.clientWidth, 'the region is visible and spans the screen').toBeGreaterThan(300);
      testInfo.annotations.push({
        type: 'region',
        description: `${screen.name}: ${region.description}, scrollWidth ${region.scrollWidth}, clientWidth ${region.clientWidth}, left ${Math.round(region.left)}, right ${Math.round(region.right)}`,
      });

      expectFindingToFail('M7');
      expect(
        region.scrollWidth,
        `[M7] main content scrolls sideways on ${screen.name} (${region.description}). Actual: scrollWidth ${region.scrollWidth}, clientWidth ${region.clientWidth}`,
      ).toBeLessThanOrEqual(region.clientWidth + 1);
    },
  );
}
