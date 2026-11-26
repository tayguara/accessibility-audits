import { expect, test, type Page } from '@playwright/test';
import { pageSelect, vitalsWidget } from '../../src/chart';
import { expectFindingToFail, findingDetails } from '../../src/findings';
import { chartPath, readFixture } from '../../src/openmrs';

/** Where keyboard focus is, described for the failure message. */
function focusDescription(page: Page): Promise<string> {
  return page.evaluate(() => {
    const active = document.activeElement;
    if (!active) return 'nothing';
    const isPageSelect =
      active.tagName === 'SELECT' &&
      /of \d+ pages/i.test((active as HTMLSelectElement).labels[0]?.textContent ?? '');
    return isPageSelect ? 'page select' : `${active.tagName} (not the page select)`;
  });
}

test(
  'M1 · 2.4.3 Focus Order (A) · focus stays on the page selector after changing the page',
  findingDetails('M1'),
  async ({ page }) => {
    await page.goto(chartPath(readFixture().patientUuid, 'Patient Summary'));
    const widget = vitalsWidget(page);
    await expect(widget).toBeVisible();

    const select = pageSelect(widget);
    // 12 vitals encounters at 5 per page: 3 pages.
    await expect(select.locator('option')).toHaveCount(3);
    await expect(select).toHaveValue('1');
    await select.focus();
    await expect(select).toBeFocused();

    // Change the page with the keyboard, as the finding describes.
    await page.keyboard.press('ArrowDown');
    await expect(select).toHaveValue('2');

    expectFindingToFail('M1');
    await expect
      .poll(() => focusDescription(page), {
        timeout: 5_000,
        message: '[M1] keyboard focus was lost after changing the page. Actual focus',
      })
      .toBe('page select');
  },
);
