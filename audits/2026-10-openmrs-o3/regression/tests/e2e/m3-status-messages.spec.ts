import { expect, test } from '@playwright/test';
import { expectFindingToFail, findingDetails } from '../../src/findings';
import { readFixture } from '../../src/openmrs';

/** Elements assistive technology treats as live regions. */
const LIVE =
  '[aria-live]:not([aria-live="off"]), [role="status"], [role="alert"], [role="log"], output';

type CounterPlacement =
  | 'inside a live region that existed before typing'
  | 'inside a live region created with the results'
  | 'no live region';

/**
 * Runs in the page. Where is the results counter relative to live regions?
 * `existingRegions` are the live regions marked before typing (data-m3-preexisting).
 */
function counterPlacement(counterText: RegExp): CounterPlacement {
  const counter = Array.from(document.querySelectorAll<HTMLElement>('body *')).find(
    (el) => el.children.length === 0 && counterText.test((el.textContent ?? '').trim()),
  );
  const region = counter?.closest<HTMLElement>(
    '[aria-live]:not([aria-live="off"]), [role="status"], [role="alert"], [role="log"], output',
  );
  if (!region) return 'no live region';
  return region.hasAttribute('data-m3-preexisting')
    ? 'inside a live region that existed before typing'
    : 'inside a live region created with the results';
}

test(
  'M3 · 4.1.3 Status Messages (AA) · the number of search results is announced',
  findingDetails('M3'),
  async ({ page }) => {
    const { familyName } = readFixture();

    await page.goto('home');
    await page.getByRole('button', { name: 'Search patient' }).click();
    const input = page.getByTestId('patientSearchBar');
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();

    // Mark the live regions that exist before any typing: a screen reader only announces
    // changes inside regions it already knows about.
    await page.locator(LIVE).evaluateAll((els) => {
      els.forEach((el) => el.setAttribute('data-m3-preexisting', ''));
    });

    await input.pressSequentially(familyName, { delay: 50 });
    const counter = page.getByText(/^[1-9]\d* search results?$/);
    await expect(counter).toBeVisible();

    const counterText = (await counter.textContent()) ?? '';
    const placement = await page.evaluate(counterPlacement, /^[1-9]\d* search results?$/);

    expectFindingToFail('M3');
    expect(placement, `[M3] "${counterText.trim()}" is not announced. Actual: ${placement}`).toBe(
      'inside a live region that existed before typing',
    );
  },
);
