# Issue drafts for the OpenMRS project

Drafts, **not filed yet**. OpenMRS tracks O3 work in Jira ([issues.openmrs.org](https://issues.openmrs.org),
project O3). Each draft is one root cause, checked against the current `main` on 7 October 2026
([source-verification.md](source-verification.md)). A1 and A3 are already fixed upstream and have no
draft; M1 needs a runtime re-test before it is filed.

Common environment line for every issue:

> Found in O3 Reference Application 3.7.1 (Docker images), confirmed in source on `main` on
> 2026-10-07. Independent WCAG 2.2 AA audit:
> https://github.com/tayguara/accessibility-audits/tree/main/audits/2026-10-openmrs-o3

---

## 1. Patient search does not announce the number of results (WCAG 4.1.3)

**Component:** esm-patient-search-app (`patient-search.component.tsx`, `compact-patient-search.component.tsx`, `patient-search-lg.component.tsx`)

The "N search results" text updates as the user types, but it is not in a live region, so screen
reader users are not told whether the search found anyone. There is no `aria-live`,
`role="status"` or `role="alert"` anywhere in the patient search app. The `<p>` with the count is
also mounted only when results exist, so a live region added to it would not announce reliably.

**Suggested fix:** render a container with `role="status"` that is always present in the search
panel, and update its text with the count (including "0 search results").

## 2. Vitals header is a fake button with no keyboard action and no focus style (WCAG 2.4.7, 4.1.2)

**Component:** esm-patient-vitals-app (`vitals-header.extension.tsx`, `vitals-header.scss`)

`<div role="button" tabIndex={0} onClick={toggleDetailsPanel}>` wraps the vitals header, which
also contains a link ("Vitals history"), a Toggletip button and the "Record vitals" button. It
takes a Tab stop, is announced as a button, has `outline: none` and no focus style, ignores Enter
and Space (Space scrolls the page), and the state it toggles is never read, so it has no effect.

**Suggested fix:** remove `role="button"`, `tabIndex` and the unused `onClick` from the container.

## 3. Calendar days of the date picker have no visible focus (WCAG 2.4.7)

**Component:** esm-styleguide `OpenmrsDatePicker` (`datepicker.module.scss`)

In the calendar pop-up, Tab moves focus into the grid of days and the arrow keys change the selected
date, but the focused day has no visible indicator (`outline: unset` and no `:focus` or
`[data-focus-visible]` rule for `.cds--date-picker__day`). Keyboard users change the date without
seeing it, which in the registration form means a wrong date of birth can be saved unnoticed.

**Suggested fix:** add a `[data-focus-visible]` rule for day cells, matching the Carbon focus token
(2 px outline, at least 3:1 contrast).

## 4. Fixed bottom action bar hides focused elements at high zoom (WCAG 2.4.11)

**Component:** esm-framework workspaces action menu (`action-menu2.module.scss`), patient chart layout

At 200% zoom (tablet layout) the chart actions become a bar fixed to the bottom. Tabbing through
the chart, focused controls end up fully behind that bar and the page does not scroll, because
the element is technically inside the viewport. No `scroll-padding` is set in the three frontend
repositories.

**Suggested fix:** set `scroll-padding-bottom` (and `scroll-padding-top` for the header) on the
chart scroll container, equal to the height of the fixed bars.

## 5. Page title is always "OpenMRS" (WCAG 2.4.2)

**Component:** app shell (`esm-app-shell/src/index.ejs`, build-time `OMRS_PAGE_TITLE`)

The title is set once at build time and never updated, so every screen (login, home, patient chart,
registration) has the same title. Screen reader users cannot tell pages or browser tabs apart.

**Suggested fix:** update `document.title` on route change (for example from the app's route
registration or a small framework hook), e.g. "Register patient — OpenMRS",
"Joshua Johnson — Patient chart — OpenMRS".

## 6. Button nested inside the link of each compact search result (WCAG 4.1.2)

**Component:** esm-patient-search-app (`compact-patient-banner.component.tsx`), patient banner tags slot, visit tag extension

Each result is a `ConfigurableLink` wrapping the patient banner info, which renders the tags slot;
the visit tag renders a Toggletip button inside the link. Interactive content inside a link is
invalid and screen readers handle it inconsistently. In the `<button>` variant of the result, it is
a button inside a button.

**Suggested fix:** render tags as non-interactive labels inside search results, or move the tags
slot outside the link.

## 7. Content clipped at 320 px; registration form unusable (WCAG 1.4.10)

**Components:** esm-patient-registration-app layout; patient chart header and vitals summary

At 320 CSS px there is no horizontal scrollbar, but content is clipped. In registration the
"Jump to" column and buttons do not stack, leaving the form too narrow to use. In the chart, header
actions, the right column of the vitals summary and the last item of the bottom bar are cut, and
summary values overlap.

**Suggested fix:** stack the registration side column above the form below the small breakpoint;
let header rows wrap; make the vitals summary a single column on narrow screens.

## 8. User menu list has invalid structure on every screen (WCAG 1.3.1)

**Component:** esm-primary-navigation-app (`user-menu-panel.component.tsx`)

`<ExtensionSlot>` is rendered directly inside Carbon `<Switcher>` (a `<ul>`), so the list gets `<div>`
children and the `<li>` items from each extension are not direct children of the list.

**Suggested fix:** wrap each extension in a `<li>`/`SwitcherItem` at the slot level, or render the
slot with a list-item wrapper.

## 9. Smaller fixes (one issue or a combined ticket)

| WCAG | Where | Problem | Fix |
| --- | --- | --- | --- |
| 1.4.1 | esm-patient-common-lib pagination (`.configurableLink`), and the same rule in the styleguide | "See all" links use `text-decoration: none`; 1.55:1 against surrounding text | Underline the links |
| 1.4.3 | `OpenmrsDatePicker` placeholders | dd/mm/yyyy placeholder at 1.72:1 (`#c5c5c5` on white) | Darken the placeholder colour token |
| 2.5.8 | Vitals header ("Vitals history" link, "View normal ranges" button); appointments date segments | Targets of 16 px | Increase the clickable area with padding |
| 4.1.2 | Appointments filter dropdowns | `aria-labelledby` points to empty labels | Provide label text or `aria-label` |
| 4.1.2 | Appointments batch-actions bar | `aria-hidden="true"` on a container with focusable controls | Use `inert` while hidden |
