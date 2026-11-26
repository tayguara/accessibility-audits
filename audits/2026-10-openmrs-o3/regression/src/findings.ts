import { test, type TestDetails } from '@playwright/test';

export const showKnownFailures = process.env.SHOW_KNOWN_FAILURES === '1';

export type FindingId = 'M1' | 'M3' | 'M6' | 'M7' | 'M8';

interface Finding {
  /** WCAG 2.2 success criterion number. */
  sc: string;
  /** Heading anchor of the finding in ../report.md. */
  anchor: string;
}

export const findings: Record<FindingId, Finding> = {
  M1: { sc: '2.4.3', anchor: 'm1--focus-is-lost-when-changing-the-page-of-a-chart-table' },
  M3: { sc: '4.1.3', anchor: 'm3--patient-search-does-not-announce-the-number-of-results' },
  M6: {
    sc: '2.4.11',
    anchor: 'm6--at-200-zoom-the-fixed-bottom-toolbar-hides-the-focused-control',
  },
  M7: {
    sc: '1.4.10',
    anchor: 'm7--content-is-cut-off-at-320-px-wide-registration-cannot-be-completed',
  },
  M8: { sc: '2.4.2', anchor: 'm8--every-screen-has-the-same-page-title' },
};

/**
 * Call AFTER the preconditions, right before the assertion that reproduces the finding.
 * While the finding is present, that assertion fails and Playwright reports an expected failure.
 * If it passes, Playwright reports "expected to fail, but passed": the bug is fixed.
 * Everything the assertion reads must be proven by a precondition first: an assertion timeout
 * after this call is also an expected failure.
 */
export function expectFindingToFail(id: FindingId): void {
  test.fail(
    !showKnownFailures,
    `${id} (WCAG ${findings[id].sc}) is still present in OpenMRS O3 3.7.1. If this test passes, the bug is fixed: remove this call.`,
  );
}

export function findingDetails(id: FindingId): TestDetails {
  return {
    tag: '@known-failure',
    annotation: {
      type: 'finding',
      description: `${id} · WCAG ${findings[id].sc} · audits/2026-10-openmrs-o3/report.md#${findings[id].anchor}`,
    },
  };
}
