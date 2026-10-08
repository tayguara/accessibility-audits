# OpenMRS O3: audit findings checked against current source

Audit target: O3 Reference Application 3.7.1. This note checks each finding against the **current `main`** of the frontend repos. It is read-only work: shallow clones plus `gh api`. No issues, comments or forks were made.

Checked on **2026-10-07**. These are the `main` commits inspected:

| Repo | `main` HEAD inspected | Commit date |
|---|---|---|
| openmrs/openmrs-esm-core | `ef15c205c8ac00dba379cfe8bd682b56817c693b` | 2026-10-07T14:39:29+05:30 |
| openmrs/openmrs-esm-patient-chart | `58c8416556e04c4b3e4f60d00a60b248d5c1fccd` | 2026-10-07T20:57:38Z |
| openmrs/openmrs-esm-patient-management | `f33b707088c8177357e39b08fc6fcc34b8d3d040` | 2026-10-07T20:36:52Z |

Supporting third-party sources, pinned to the versions in the repos' `yarn.lock`:
- `@carbon/react` 1.92.1 (tag `v11.92.1`)
- `@carbon/styles` 1.91.0 (packaged in tag `v11.92.1`)

## Summary table

| ID | Finding | Status on `main` | Where |
|---|---|---|---|
| A1 | Help menu button has no accessible name | **Fixed** (released in esm-core v11.0.0, 2026-10-06) | core `esm-help-menu-app/.../help.component.tsx` L48-52 |
| A2 | `<ul class="cds--switcher">` has `<div>` children (extension slots) that wrap `<li>` | **Still present** | core `user-menu-panel.component.tsx` L22-26 + `ExtensionSlot.tsx` L97-104 |
| A3 | `role="refine-search"` (invalid role) on the refine search form | **Fixed on main, not released yet** (latest patient-management release is v11.1.0, 2026-06-26, which predates the fix) | patient-management `refine-search.component.tsx` L118-122 |
| A5 | "See all" pagination link not underlined | **Still present** (`text-decoration: none`) | chart `esm-patient-common-lib/src/pagination/pagination.scss` L49-50; same in core styleguide `pagination.module.scss` L49-50 |
| A6/M2 | Vitals header `<div role="button" tabIndex={0}>` contains a link and buttons | **Still present**: has `onClick`, no `onKeyDown`, `outline: none`, no focus style. The toggled state is never read | chart `vitals-header.extension.tsx` L48-49, L132; `vitals-header.scss` L13-20 |
| M1 | Focus lost when paging in patient chart widgets | **Unclear**: the source shows no remount of the pagination | chart `paginated-vitals.component.tsx` L167-177; `pagination.component.tsx` L33-53 |
| M3 | "N search result(s)" not announced | **Still present**: no `aria-live` or `role="status"` anywhere in `esm-patient-search-app` | patient-management `patient-search.component.tsx` L85-93; `compact-patient-search.component.tsx` L191-197; `patient-search-lg.component.tsx` L106-114 |
| M4 | Compact search result link wraps interactive content (visit tag Toggletip button) | **Still present** (and the `<button>` variant nests a button inside a button) | patient-management `compact-patient-banner.component.tsx` L220-244; core `patient-banner-patient-info.component.tsx` L83; chart `visit-tag.extension.tsx` L30-33 |
| M5 | OpenmrsDatePicker: no focus indicator on day cells or trigger button | **Day cells: still present** (`outline: unset`, no `:focus` or `[data-focus-visible]` rule). **Trigger: partly mitigated**: no rule of its own, but the parent group gets a `:focus-within` outline | core `datepicker/datepicker.module.scss` L13-24, L228-249, L410-418 |
| M6 | Fixed bottom action bar on tablet; no `scroll-padding` | **Still present**: no `scroll-padding*` anywhere in the 3 repos | core `workspaces2/action-menu2/action-menu2.module.scss` L45-57 |
| M8 | Page title is always "OpenMRS" | **Still present**: title is set once at build time. No `document.title` write anywhere | core `shell/esm-app-shell/src/index.ejs` L6; `rspack.config.js` L45 |

## Details

### A1: Help menu button accessible name. FIXED
Permalink: https://github.com/openmrs/openmrs-esm-core/blob/ef15c205c8ac00dba379cfe8bd682b56817c693b/packages/apps/esm-help-menu-app/src/help-menu/help.component.tsx#L48-L58
```tsx
<Button aria-controls="help-menu-popup" aria-expanded={helpMenuOpen}
  aria-label={t('helpMenu', 'Help menu')} className={styles.helpMenuButton} ...>
```
- Fixed in commit `50e2d4355cb1bf1057374107c934de5c4dc49d29`, "(fix) Give the help menu button an accessible name (#1914)", 2026-09-30.
- The commit is an ancestor of tag `v11.0.0` (released 2026-10-06), so the fix is in a release.

### A2: User menu `<ul>` has `<div>` children. STILL PRESENT
Permalink: https://github.com/openmrs/openmrs-esm-core/blob/ef15c205c8ac00dba379cfe8bd682b56817c693b/packages/apps/esm-primary-navigation-app/src/components/navbar-header-panels/user-menu-panel.component.tsx#L22-L26
```tsx
<Switcher className={styles.userPanelSwitcher} aria-label={t('userMenuOptions', 'User menu options')}>
  <ExtensionSlot className={styles.fullWidth} name="user-panel-slot" />
```
- `ExtensionSlot` always renders a wrapping `<div data-extension-slot-name=...>`: https://github.com/openmrs/openmrs-esm-core/blob/ef15c205c8ac00dba379cfe8bd682b56817c693b/packages/framework/esm-react-utils/src/ExtensionSlot.tsx#L97-L104
- Each extension also gets its own `<div data-extension-id=...>`: [Extension.tsx L153](https://github.com/openmrs/openmrs-esm-core/blob/ef15c205c8ac00dba379cfe8bd682b56817c693b/packages/framework/esm-react-utils/src/Extension.tsx#L153)
- Carbon `Switcher` renders `<ul>` ([Switcher.tsx L148 @ v11.92.1](https://github.com/carbon-design-system/carbon/blob/v11.92.1/packages/react/src/components/UIShell/Switcher.tsx#L148)). `SwitcherItem` renders `<li>` (L142).
- Resulting DOM: `ul > div > div > li`.
- The component comment still says extensions "should in general be wrapped in the `SwitcherItem` Carbon component" (L12-15). The structure has not changed.

### A3: `role="refine-search"`. FIXED on main (not yet released)
Permalink: https://github.com/openmrs/openmrs-esm-patient-management/blob/f33b707088c8177357e39b08fc6fcc34b8d3d040/packages/esm-patient-search-app/src/patient-search-page/refine-search/refine-search.component.tsx#L118-L122
```tsx
<form onSubmit={handleSubmit(onSubmit)} className={styles.refineSearchContainer}
  data-openmrs-role="Refine Search" aria-labelledby={headingId}>
```
- Fixed in commit `aa2f12e1960da9ef145339b63478c59ab1df5afe`, "(fix) Pluralise the refine search filter counts and label the forms (#2719)", 2026-09-04.
- Its diff removes `role="refine-search">`.
- The latest patient-management release, `v11.1.0` (2026-06-26), is *behind* this commit. The fix is therefore on `main` only.

### A5: "See all" link not underlined. STILL PRESENT
- Patient chart, used by widgets through `PatientChartPagination`: https://github.com/openmrs/openmrs-esm-patient-chart/blob/58c8416556e04c4b3e4f60d00a60b248d5c1fccd/packages/esm-patient-common-lib/src/pagination/pagination.scss#L49-L53
  ```scss
  .configurableLink {
    text-decoration: none;
  ```
- The same rule exists in the framework copy (`Pagination` in esm-styleguide): https://github.com/openmrs/openmrs-esm-core/blob/ef15c205c8ac00dba379cfe8bd682b56817c693b/packages/framework/esm-styleguide/src/pagination/pagination.module.scss#L49-L50
- No `:hover` or `:focus` underline rule exists for `.configurableLink` in either file.
- `PatientChartPagination` is still imported by vitals, biometrics, conditions, allergies, immunizations, notes, programs, medications, orders and obs-table widgets.

### A6 / M2: Vitals header `div role="button"`. STILL PRESENT
Permalink: https://github.com/openmrs/openmrs-esm-patient-chart/blob/58c8416556e04c4b3e4f60d00a60b248d5c1fccd/packages/esm-patient-vitals-app/src/vitals-and-biometrics-header/vitals-header.extension.tsx#L132
```tsx
<div className={styles.vitalsHeader} role="button" tabIndex={0} onClick={toggleDetailsPanel}>
```
- The div has `onClick` only. There is no `onKeyDown` or `onKeyUp`, so Enter and Space do nothing.
- `toggleDetailsPanel` toggles `showDetailsPanel` ([L48-49](https://github.com/openmrs/openmrs-esm-patient-chart/blob/58c8416556e04c4b3e4f60d00a60b248d5c1fccd/packages/esm-patient-vitals-app/src/vitals-and-biometrics-header/vitals-header.extension.tsx#L48-L49)), but `showDetailsPanel` is never read anywhere in the file. The "button" has no effect at all.
- The div still contains interactive elements:
  - a `ConfigurableLink` "Vitals history" (L144-149)
  - a Carbon `Toggletip` button "View normal ranges" (L152-158, new compared with older versions)
  - the "Record vitals" `Button` (L216-225)
- The styles remove the outline and add no `:focus` or `:focus-visible` replacement: [vitals-header.scss L13-20](https://github.com/openmrs/openmrs-esm-patient-chart/blob/58c8416556e04c4b3e4f60d00a60b248d5c1fccd/packages/esm-patient-vitals-app/src/vitals-and-biometrics-header/vitals-header.scss#L13-L20).
  ```scss
  .vitalsHeader { ... outline: none; pointer-events: visibleFill; }
  ```

### M1: Focus loss on widget pagination. UNCLEAR
What the source shows:
- `PatientChartPagination` renders Carbon `Pagination` with no `key` prop ([L33-53](https://github.com/openmrs/openmrs-esm-patient-chart/blob/58c8416556e04c4b3e4f60d00a60b248d5c1fccd/packages/esm-patient-common-lib/src/pagination/pagination.component.tsx#L33-L53)). The only condition is `totalItems > 0`, which does not change between pages.
- In the vitals widget the pagination is rendered as `{!isPrinting ? <PatientChartPagination ... onPageNumberChange={({ page }) => goTo(page)} /> : null}`. That is client-side `usePagination` (React state only), with no `key` and no loading-state swap on page change ([paginated-vitals.component.tsx L167-177](https://github.com/openmrs/openmrs-esm-patient-chart/blob/58c8416556e04c4b3e4f60d00a60b248d5c1fccd/packages/esm-patient-vitals-app/src/vitals/paginated-vitals.component.tsx#L167-L177)).
- Carbon `Pagination` 1.92.1 already moves focus to the other arrow when one becomes disabled at the first or last page ([Pagination.tsx L327-358 @ v11.92.1](https://github.com/carbon-design-system/carbon/blob/v11.92.1/packages/react/src/components/Pagination/Pagination.tsx#L327-L358)).

Conclusion:
- Nothing in the source explains a focus loss through a remount.
- The observed loss may come from:
  - rendering in 3.7.1, which pinned older package versions
  - a different widget
  - the outer widget re-rendering, e.g. `isLoading` → `DataTableSkeleton` in `vitals-overview.component.tsx` L198-199 if SWR revalidates
- This cannot be settled from source. It needs re-testing on a current build.

### M3: Search result count not announced. STILL PRESENT
- `grep` finds no `aria-live`, `role="status"` or `role="alert"` anywhere in `packages/esm-patient-search-app/src` (tests excluded).
- Compact or floating search: https://github.com/openmrs/openmrs-esm-patient-management/blob/f33b707088c8177357e39b08fc6fcc34b8d3d040/packages/esm-patient-search-app/src/compact-patient-search/patient-search.component.tsx#L85-L93
  ```tsx
  <p className={styles.resultsText}>
    {t('searchResultsCount', '{{count}} search result', { count: totalResults })}
  ```
- The parent is a plain `<div className={styles.floatingSearchResultsContainer} data-testid=...>` with no live region: [compact-patient-search.component.tsx L191-197](https://github.com/openmrs/openmrs-esm-patient-management/blob/f33b707088c8177357e39b08fc6fcc34b8d3d040/packages/esm-patient-search-app/src/compact-patient-search/compact-patient-search.component.tsx#L191-L197).
- The `<p>` is also mounted conditionally, only in the "has results" branch. A live region would have to sit on a persistent ancestor to be announced reliably.
- The full-page search shows its count in an `<h2>`, also without a live region: [patient-search-lg.component.tsx L106-114](https://github.com/openmrs/openmrs-esm-patient-management/blob/f33b707088c8177357e39b08fc6fcc34b8d3d040/packages/esm-patient-search-app/src/patient-search-page/patient-search-lg.component.tsx#L106-L114).
- The recent-searches variant has the same problem (`recently-searched-patients.component.tsx` L51-56).

### M4: Interactive content nested inside the search result link. STILL PRESENT
Permalink: https://github.com/openmrs/openmrs-esm-patient-management/blob/f33b707088c8177357e39b08fc6fcc34b8d3d040/packages/esm-patient-search-app/src/compact-patient-search/compact-patient-banner.component.tsx#L235-L244
```tsx
<ConfigurableLink className={classNames(styles.patientSearchResult)} ...
  to={interpolateString(config.search.patientChartUrl, { patientUuid: patient.id })}>{children}</ConfigurableLink>
```
- The children are `<PatientBannerPatientInfo patient={fhirPatient} />` (L202-208). No `renderedFrom` is passed.
- `PatientBannerPatientInfo` renders `<ExtensionSlot ... name="patient-banner-tags-slot" .../>`: [core L83](https://github.com/openmrs/openmrs-esm-core/blob/ef15c205c8ac00dba379cfe8bd682b56817c693b/packages/framework/esm-styleguide/src/patient-banner/patient-info/patient-banner-patient-info.component.tsx#L83).
- The `visit-tag` extension, assigned to that slot in `esm-patient-banner-app/src/routes.json`, renders a Toggletip button and does not check `renderedFrom`: [visit-tag.extension.tsx L30-33](https://github.com/openmrs/openmrs-esm-patient-chart/blob/58c8416556e04c4b3e4f60d00a60b248d5c1fccd/packages/esm-patient-banner-app/src/banner-tags/visit-tag.extension.tsx#L30-L33).
  ```tsx
  <Toggletip align="bottom">
    <ToggletipButton label={t('activeVisit', 'Active Visit')}>
  ```
- Extra problem: when `nonNavigationSelectPatientAction` is set, for example in the patient search workspace, the same children go inside a native `<button>` (L220-231). The result is a button nested inside a button.

### M5: OpenmrsDatePicker focus indicators. DAY CELLS STILL PRESENT; TRIGGER PARTLY MITIGATED

**Day cells.** Code: [datepicker.module.scss L410-418](https://github.com/openmrs/openmrs-esm-core/blob/ef15c205c8ac00dba379cfe8bd682b56817c693b/packages/framework/esm-styleguide/src/datepicker/datepicker.module.scss#L410-L418)
```scss
& > tbody > tr > td { ...
  & > div { outline: unset; }
```
- The day cell is a react-aria `CalendarCell` with class `cds--date-picker__day` ([calendar-popover.component.tsx L65-70](https://github.com/openmrs/openmrs-esm-core/blob/ef15c205c8ac00dba379cfe8bd682b56817c693b/packages/framework/esm-styleguide/src/datepicker/calendar-popover.component.tsx#L65-L70)).
- The module has rules for `:hover` and `[data-selected]`, but none for `:focus`, `[data-focused]` or `[data-focus-visible]` on cells.
- Carbon's own day focus rule targets `.flatpickr-day:focus`, not `.cds--date-picker__day` ([_flatpickr.scss @ v11.92.1](https://github.com/carbon-design-system/carbon/blob/v11.92.1/packages/styles/scss/components/date-picker/_flatpickr.scss)). Neither `_flatpickr.scss` nor `_date-picker.scss` contains `date-picker__day`.
- Nothing in esm-styleguide `_overrides.scss` targets it either.

**Trigger button and prev/next month buttons.**
- `.flatButton` uses `component-reset.reset`, plus `:hover` and `:disabled` rules only. There is no `:focus` or `[data-focus-visible]` rule ([L228-249](https://github.com/openmrs/openmrs-esm-core/blob/ef15c205c8ac00dba379cfe8bd682b56817c693b/packages/framework/esm-styleguide/src/datepicker/datepicker.module.scss#L228-L249)).
- The reset does not remove `outline`, so the browser default may still render.
- The trigger sits inside `<Group className={styles.inputGroup}>` ([openmrs-date-picker.component.tsx L128-154](https://github.com/openmrs/openmrs-esm-core/blob/ef15c205c8ac00dba379cfe8bd682b56817c693b/packages/framework/esm-styleguide/src/datepicker/openmrs-date-picker.component.tsx#L128-L154)). That group gets `&:focus-within { @include focus.focus-outline('outline'); }` ([L21-24](https://github.com/openmrs/openmrs-esm-core/blob/ef15c205c8ac00dba379cfe8bd682b56817c693b/packages/framework/esm-styleguide/src/datepicker/datepicker.module.scss#L21-L24)).
- So focusing the trigger outlines the whole field, but nothing indicates the trigger itself versus the date segments.
- The prev/next month buttons in the popover get no such group outline.
- Whether this meets 2.4.7 for the trigger needs a runtime check, so this part is **unclear**.

### M6: Fixed bottom action bar, no `scroll-padding`. STILL PRESENT
Permalink: https://github.com/openmrs/openmrs-esm-core/blob/ef15c205c8ac00dba379cfe8bd682b56817c693b/packages/framework/esm-styleguide/src/workspaces2/action-menu2/action-menu2.module.scss#L45-L57
```scss
:global(.omrs-breakpoint-lt-desktop) {
  .sideRail { ... position: fixed; left: 0; bottom: 0; z-index: 8003; width: 100%;
```
- `grep -rn "scroll-padding|scrollPadding|scroll-margin"` over all `packages/` in the 3 repos finds only one match, unrelated: `scroll-margin-top` in implementer-tools `layout.styles.scss` L9.
- The patient chart content has only `padding-bottom: layout.$spacing-10` on `.chartReview` ([patient-chart.scss L30](https://github.com/openmrs/openmrs-esm-patient-chart/blob/58c8416556e04c4b3e4f60d00a60b248d5c1fccd/packages/esm-patient-chart-app/src/patient-chart/patient-chart.scss#L30)). That lets the last content scroll clear of the bar. It does not stop a focused element mid-page from being scrolled under the fixed bar.

### M8: Page titles. STILL PRESENT
- Title is set at build time: https://github.com/openmrs/openmrs-esm-core/blob/ef15c205c8ac00dba379cfe8bd682b56817c693b/packages/shell/esm-app-shell/src/index.ejs#L6
  ```html
  <title><%= openmrsPageTitle %></title>
  ```
- Its value comes from `const openmrsPageTitle = process.env.OMRS_PAGE_TITLE || 'OpenMRS';` ([rspack.config.js L45](https://github.com/openmrs/openmrs-esm-core/blob/ef15c205c8ac00dba379cfe8bd682b56817c693b/packages/shell/esm-app-shell/rspack.config.js#L45)). It can be configured through the CLI `pageTitle` option, but stays static for the session.
- `grep` for `document.title`, `useDocumentTitle`, `setDocumentTitle` and `react-helmet` over the 3 repos' `packages/` finds no runtime title updates.
- The only nearby use is `react-to-print`'s `documentTitle` for print jobs (e.g. `vitals-overview.component.tsx`). That does not affect the page title.

## Side observations (not in the audit list; noted while reading)
- **Multiple banner landmarks**: `role="banner"` is used on each patient card in full-page search results (`patient-search-page/patient-banner/banner/patient-banner.component.tsx` L80 and L232, patient-management). This likely creates several `banner` landmarks per page.
- **Progressbar with no name or value**: the compact search loading skeleton container uses `role="progressbar"` with no accessible name or value (`compact-patient-search/patient-search.component.tsx` L37; `recently-searched-patients.component.tsx` L18).
- **Divider inside the `<ul>`**: `SwitcherDivider` is also a direct child of the switcher `<ul>` (A2 context). Its rendered element was not checked.
