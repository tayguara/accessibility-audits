import type { Locator, Page } from '@playwright/test';

/** The Vitals card of the Patient Summary (a heading "Vitals" inside a widget card). */
export function vitalsWidget(page: Page): Locator {
  return page.locator('[data-extension-id]').filter({
    has: page.getByRole('heading', { name: 'Vitals', exact: true }),
  });
}

/** Carbon Pagination page-number select; its label reads "Page of N pages". */
export function pageSelect(widget: Locator): Locator {
  return widget.getByRole('combobox', { name: /of \d+ pages/i });
}

export function addButton(widget: Locator): Locator {
  return widget.getByRole('button', { name: 'Add', exact: true });
}

export function tableViewSwitch(widget: Locator): Locator {
  return widget.getByRole('tab', { name: 'Table view' });
}
