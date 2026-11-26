# Regression tests for the manual findings (OpenMRS O3 3.7.1)

Plain Playwright tests for five of the manual findings of the [audit report](../report.md):
M1, M3, M6, M7 and M8. Each test starts from what the keyboard and screen showed during the
manual audit, not from a scanner rule, and asserts the behaviour that WCAG asks for.

Every one of these tests **fails today on purpose**. They are marked as expected failures, so the
suite is green while the bugs exist and turns red when one of them is fixed (see
[How a known finding is encoded](#how-a-known-finding-is-encoded)).

The target is the pinned 3.7.1 instance from [`../scan/`](../scan/). The tests were written and run
against that instance on 25 Nov 2026, with Playwright 1.63.0 and Chromium only.

## What is covered

| Finding                                                                                   | WCAG                                | Test                                                                                                                                                         | Result against 3.7.1                                                                                                                 |
| ----------------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| [M1](../report.md#m1--focus-is-lost-when-changing-the-page-of-a-chart-table)              | 2.4.3 Focus Order                   | Change the page of the Vitals table with the keyboard; focus must stay on the page selector                                                                  | Reproduced. Focus is on `BODY` afterwards                                                                                            |
| [M3](../report.md#m3--patient-search-does-not-announce-the-number-of-results)             | 4.1.3 Status Messages               | Type in the patient search; the "N search result(s)" counter must be inside a live region that existed before typing                                         | Reproduced. The counter is in no live region                                                                                         |
| [M6](../report.md#m6--at-200-zoom-the-fixed-bottom-toolbar-hides-the-focused-control)     | 2.4.11 Focus Not Obscured (Minimum) | Tab through the Vitals card at 200% zoom; no focused control may be entirely behind a fixed bar                                                              | Reproduced. One stop is entirely hidden (see below)                                                                                  |
| [M7](../report.md#m7--content-is-cut-off-at-320-px-wide-registration-cannot-be-completed) | 1.4.10 Reflow                       | At 320 CSS px, on registration and on the chart: header and toolbar controls must not be cut off, and the main content must not scroll sideways (four tests) | Reproduced: controls are cut off (not visible) and the main content scrolls sideways. Plus two page-level tests that pass on purpose |
| [M8](../report.md#m8--every-screen-has-the-same-page-title)                               | 2.4.2 Page Titled                   | Seven screens must each have a descriptive, distinct title                                                                                                   | Reproduced. All seven are `OpenMRS`                                                                                                  |

M2, M4, M5 and the automatic findings are out of scope.

### What the runs actually found

These are the values from the real runs (`npm run test:show-failures`):

- **M1:** after `ArrowDown` on the page selector the table shows page 2, and `document.activeElement`
  is `BODY (outside pagination)`.
- **M3:** the counter is `<p class="…resultsText…">1 search result</p>`. The only live region on the
  page before typing is an unrelated `<tbody aria-live="polite">`. Placement of the counter: no live region.
- **M6:** at 640x400 CSS px (`deviceScaleFactor` 2), the fixed bars are the top header (0 to 48) and
  the bottom toolbar (about 335 to 400). Of the focus stops inside the Vitals card, one is partly
  covered (Tab stop 36, a row "Options" button) and one is entirely behind the toolbar (stop 37,
  the next row "Options" button, top 352, bottom 400). "Table view" and "Add" are fully visible in
  this run, because the browser scrolls them to the middle of the screen; the control that gets
  hidden is a table row button, at the point where the browser scrolls it only to the edge.
- **M7:** registration: 4 of 10 collected elements are cut off (the header buttons "Implementer
  Tools", "Add patient", "My Account", "App Menu", all beyond the 320 px edge). Chart: 7 of 19
  (the same header buttons, and "Patient lists" in the bottom toolbar).
- **M8:** `OpenMRS` on all seven screens, signed out and signed in.

### M7: two tests per screen, and why

On both screens the main content (the registration form with its "Jump to" menu, and the chart
widgets) sits inside a `div` with `overflow-x: auto` whose content is wider than the screen. Measured
in the runs: registration `scrollWidth` 531 against `clientWidth` 320, chart `scrollWidth` 755 against
`clientWidth` 320. A form and cards are linear content, so having to scroll them in two directions
fails 1.4.10. So M7 has two assertions per screen:

- **Controls are not cut off** (per element). Elements inside the scrolling region are skipped (66 on
  registration, 166 on the chart), because that region can be scrolled; the test covers what the
  scroll cannot reach, the header and the bottom toolbar, which are cut off at 320 px (not visible).
  The attachment `clipped-*.json` and a `scroll-region` annotation record the skipped counts.
- **Main content does not scroll sideways** (region). The precondition proves the region exists and
  spans the screen; the assertion is `scrollWidth <= clientWidth + 1`. The `region` annotation holds the
  measured widths. Failure message prefix: `[M7]`.

The report's "cannot be completed" is not demonstrated by these tests: the region does scroll sideways,
so the form is reachable that way. What they show is that it needs two-direction scrolling.

## Prerequisites

- Node.js 22 or later.
- The OpenMRS instance from [`../scan/`](../scan/) running and past its first start. A fresh volume
  answers with a redirect to `/initialsetup` until the install finishes; on the machine used here that
  took about 90 minutes.
- The tests create their own fixture patient (`Regression Wcagfixture`, with an active visit and 12
  vitals records) through the REST API. The demo patient used by the scanner is not needed.

## Run

```bash
cd audits/2026-10-openmrs-o3/regression
cp .env.example .env        # public demo defaults of the OpenMRS distribution
npm ci
npx playwright install chromium

npm test                    # setup + unit + e2e: all green while the bugs exist
npm run test:unit           # geometry helpers only, no instance and no .env needed
npm run test:show-failures  # turns the expected-failure mark off: the 8 finding tests fail with [Mx] messages
npm run check               # eslint, tsc, prettier
npx playwright test --project=e2e --repeat-each=3
```

`OPENMRS_BASE_URL` in `.env` must use the port of `GATEWAY_PORT` in `../scan/.env`. The credentials in
`.env.example` are the public demo ones of the OpenMRS distribution, not secrets, and `.env` is
ignored by git.

Expected result of `npm test` against the 3.7.1 instance: 24 passed (1 setup, 13 unit, 10 e2e), of
which 8 are expected failures. Roughly one minute.

## How a known finding is encoded

Each finding test follows the same order:

1. **Preconditions.** Prove that the test is looking at the right thing: the widget is visible, there are
   3 pages, the focus moved, the fixed toolbar exists, and so on. A failure here is a real red.
2. `expectFindingToFail('Mx')` (`test.fail()`, called in the middle of the test).
3. **The assertion that reproduces the finding.** While the bug exists it fails, and Playwright reports an
   expected failure. If it ever passes, Playwright reports "Expected to fail, but passed": the bug is
   fixed and the call must be removed.

This is the difference from tagging a test `@fail`, which accepts any failure, including a broken
selector. Here only a failure of the final assertion counts as the finding. One limit to know: an
assertion timeout after the mark is also treated as an expected failure by Playwright, so everything the
final assertion reads is proven by a precondition first. With `SHOW_KNOWN_FAILURES=1` the mark is off and
the real failure is shown, with an `[Mx]` prefix and the actual value.

## Layout

```
src/geometry.ts         pure functions: obscuredState (M6) and findClipped (M7), unit tested
src/findings.ts         finding metadata, expectFindingToFail, findingDetails
src/openmrs.ts          REST helpers: readiness, session, idempotent fixture
src/chart.ts            locators of the Vitals widget
tests/setup/            logs in through the REST API, saves the session and seeds the fixture
tests/unit/             geometry tests (written first)
tests/e2e/              one spec per finding
```

The setup project logs in with `POST /ws/rest/v1/session` and saves the storage state in `.auth/`, so no
test goes through the login screen. Running it twice creates nothing the second time: the fixture is
found by name and reused.

## Design notes and limits

- **M6 viewport.** Playwright cannot drive browser zoom, so 200% zoom of a 1280x800 window is emulated as
  a 640x400 CSS px viewport with `deviceScaleFactor: 2`. That is what the page sees at 200% zoom, and it
  switches the chart to the tablet layout with the fixed bottom toolbar. The criterion was not loosened:
  only a control entirely behind a bar fails (2.4.11 only fails when the focused element is entirely
  hidden); partly covered stops are recorded as an annotation.
- **M6 timing.** The page scrolls focused elements into view with smooth scrolling, so the test waits
  until `scrollY` is stable before it measures. Measuring after two animation frames gave different
  positions on each run.
- **M6 bars.** A fixed bar is an element with `position: fixed`, at least 90% of the width, at most half
  of the height, touching the top or bottom edge, and not containing the focused element.
- **M7 detection.** The probe looks at elements that are interactive or have their own text, skips elements
  smaller than 2 px, elements inside a horizontally scrolling region, and elements inside collapsed
  zero-width panels (the closed user menu), then compares their boxes with the viewport and with the
  clipping boxes of their ancestors. It cannot see text cut by `text-overflow` inside an element's own box
  or content hidden by a transform. The page-level tests (`scrollWidth <= clientWidth`) pass on purpose:
  they show why a page-level check misses the problem.
- **M3 limit.** The test checks the DOM (a pre-existing live region around the counter). It does not run
  a screen reader, so it cannot see announcements made by script outside the page's own live regions.
- **Scope.** Chromium only, English locale, the 3.7.1 build. A different OpenMRS version may need
  different locators.

## Licence

MIT, like the rest of the code in this repository.
