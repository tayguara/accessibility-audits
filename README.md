# Accessibility audits

Independent web accessibility audits against **WCAG 2.2 Level AA**, published as a public
portfolio by [Tayguara Dias Reis](https://github.com/tayguara), Tech Lead in software quality
(ISTQB CTFL).

Each audit follows the W3C [WCAG-EM](https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/)
method: defined scope, representative sample, complete processes, automated scanning **and**
manual testing (keyboard, zoom, reflow, screen readers, DOM inspection). Every finding has the
WCAG criterion, evidence and a suggested fix.

## Audits

| Audit | Target | Result | Deliverables |
| --- | --- | --- | --- |
| [2026-10 — OpenMRS O3](audits/2026-10-openmrs-o3/) | OpenMRS O3 Reference Application 3.7.1, open-source electronic medical record (healthcare; US HHS Section 504 context) | Does not conform to WCAG 2.2 AA in the sample: 18 findings across 11 criteria | [Report](audits/2026-10-openmrs-o3/report.md) ([PDF](audits/2026-10-openmrs-o3/report.pdf)) · [ACR, VPAT® 2.5 format](audits/2026-10-openmrs-o3/acr.md) ([PDF](audits/2026-10-openmrs-o3/acr.pdf)) · [Issue drafts](audits/2026-10-openmrs-o3/issue-drafts.md) · [Source verification](audits/2026-10-openmrs-o3/source-verification.md) |

## Tooling

[`tools/axe-scan`](tools/axe-scan/) runs axe-core with Playwright over a list of pages, including
authenticated pages (saved session) and states that need a click first (side panels, dialogs).
Automated scanning catches only part of the issues, so every report combines it with manual
testing.

## Why open-source targets

Auditing open-source software with a public demo needs no permission from a company, allows the
report to name the product, and lets every finding become a public, verifiable contribution
upstream. All audits here are independent: they are not issued or endorsed by the audited projects.

## Licence

Code (`tools/`): [MIT](LICENSE). Reports and documentation: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
