# Accessibility Conformance Report: OpenMRS O3 3.7.1

**Format:** based on the ITI VPAT® 2.5 (WCAG edition). VPAT is a registered trademark of the
Information Technology Industry Council (ITI).

> **Independent assessment, not issued by the OpenMRS project.** This report was produced by an
> independent auditor as a portfolio sample. It covers a sample of eight screens and two processes
> (see the [audit report](report.md)). ITI guidance asks for a determination on every Level A and AA
> criterion; criteria outside the tested sample are marked **Not Evaluated** rather than given an
> unsupported determination.

## Product information

| Item | Value |
| --- | --- |
| Name of product/version | OpenMRS O3 Reference Application 3.7.1 |
| Report date | 7 October 2026 |
| Product description | Open-source electronic medical record system (web application) |
| Contact information | Auditor: Tayguara Dias Reis — github.com/tayguara |
| Notes | Evaluated on a local instance with the distribution's demo data. Status of each finding on the current source code: see [source-verification.md](source-verification.md). |
| Evaluation methods used | WCAG-EM sample; automated scan with axe-core 4.13.0 (Playwright 1.63); manual keyboard testing in Firefox and Chrome; 200% zoom and 320 px reflow; DOM inspection; screen readers: Orca + Firefox (Linux), TalkBack + Chrome (Android). NVDA, JAWS and VoiceOver not tested. |

## Applicable standards

| Standard/Guideline | Included in report |
| --- | --- |
| Web Content Accessibility Guidelines 2.2 | Level A (Yes), Level AA (Yes), Level AAA (No) |

## Terms

- **Supports:** the functionality has at least one method that meets the criterion without known defects, within the tested sample.
- **Partially Supports:** some functionality does not meet the criterion.
- **Does Not Support:** the majority of the tested functionality does not meet the criterion, or the failure blocks a task.
- **Not Applicable:** the criterion is not relevant to the tested sample.
- **Not Evaluated:** outside the scope of this sample-based assessment.

## Summary

| Conformance level | Criteria |
| --- | --- |
| Supports | 8 |
| Partially Supports | 3 |
| Does Not Support | 8 |
| Not Applicable | 7 |
| Not Evaluated | 30 |

## Table 1: Success Criteria, Level A

| Criteria | Conformance Level | Remarks and Explanations |
| --- | --- | --- |
| 1.1.1 Non-text Content | Not Evaluated | No automated failures for images or icons with alternatives. Manual review of icons and avatars not performed. The unnamed help button is reported under 4.1.2. |
| 1.2.1 Audio-only and Video-only (Prerecorded) | Not Applicable | No audio-only or video-only content in the sampled screens. |
| 1.2.2 Captions (Prerecorded) | Not Applicable | No prerecorded video in the sampled screens. |
| 1.2.3 Audio Description or Media Alternative (Prerecorded) | Not Applicable | No prerecorded video in the sampled screens. |
| 1.3.1 Info and Relationships | Partially Supports | Form errors are programmatically associated with their fields (aria-describedby, aria-invalid). Fails: the user menu list has invalid structure on every screen (A2). |
| 1.3.2 Meaningful Sequence | Not Evaluated |  |
| 1.3.3 Sensory Characteristics | Not Evaluated |  |
| 1.4.1 Use of Color | Does Not Support | "See all" links in chart widgets are distinguished from surrounding text by colour only, at 1.55:1 (A5). Form errors use text and an icon, not only colour. |
| 1.4.2 Audio Control | Not Applicable | No audio that plays automatically. |
| 2.1.1 Keyboard | Supports | In the sampled processes, all functions tested were operable by keyboard: navigation, table pagination, patient search, registration form and date entry. Several have focus problems reported under 2.4.3, 2.4.7 and 2.4.11. |
| 2.1.2 No Keyboard Trap | Supports | Calendar pop-up closes with Esc and can be left with Tab. No trap found in the sample. |
| 2.1.4 Character Key Shortcuts | Not Evaluated |  |
| 2.2.1 Timing Adjustable | Not Evaluated | The session expires after inactivity; warning and extension behaviour not evaluated. The auto-dismissing error toast is not a failure because the same errors remain next to each field. |
| 2.2.2 Pause, Stop, Hide | Not Evaluated |  |
| 2.3.1 Three Flashes or Below Threshold | Not Evaluated | No flashing content observed. |
| 2.4.1 Bypass Blocks | Not Evaluated | Flagged for manual review by the automated tool on the login page; not concluded. |
| 2.4.2 Page Titled | Does Not Support | Every screen has the same title, "OpenMRS" (M8). |
| 2.4.3 Focus Order | Does Not Support | Changing the page of a chart table moves keyboard focus to the document body (M1). |
| 2.4.4 Link Purpose (In Context) | Not Evaluated |  |
| 2.5.1 Pointer Gestures | Not Evaluated |  |
| 2.5.2 Pointer Cancellation | Not Evaluated |  |
| 2.5.3 Label in Name | Not Evaluated |  |
| 2.5.4 Motion Actuation | Not Evaluated |  |
| 3.1.1 Language of Page | Supports | The page language is declared (automated check passed on all sampled screens). |
| 3.2.1 On Focus | Not Evaluated |  |
| 3.2.2 On Input | Supports | Typing in the patient search updates results without moving focus or changing context (tested with TalkBack). |
| 3.2.6 Consistent Help | Supports | The help button is in the same position on every sampled screen. |
| 3.3.1 Error Identification | Supports | Empty required fields are identified in text next to each field and focus moves to the first error. Recommendation: use the visible label in error messages ("Gender is required" for the field labelled "Sex"). |
| 3.3.2 Labels or Instructions | Supports | Registration fields have visible labels; optional fields are marked and the form states that other fields are required. |
| 3.3.7 Redundant Entry | Not Evaluated |  |
| 4.1.1 Parsing | Not Applicable | Obsolete and removed in WCAG 2.2. |
| 4.1.2 Name, Role, Value | Does Not Support | Help button without a name (A1, fixed in current source); invalid role on the refine-search form (A3, fixed in current source); vitals header is a fake button containing other controls, with no keyboard action (A6, M2); filter dropdowns with empty labels (A9); focusable content inside aria-hidden (A10); a button nested inside each search result link (M4). |

## Table 2: Success Criteria, Level AA

| Criteria | Conformance Level | Remarks and Explanations |
| --- | --- | --- |
| 1.2.4 Captions (Live) | Not Applicable | No live media. |
| 1.2.5 Audio Description (Prerecorded) | Not Applicable | No prerecorded video in the sampled screens. |
| 1.3.4 Orientation | Not Evaluated |  |
| 1.3.5 Identify Input Purpose | Not Evaluated |  |
| 1.4.3 Contrast (Minimum) | Partially Supports | Most text passes automated checks. Fails: date placeholders in the registration form at 1.72:1 (A4). 76 items over coloured backgrounds need manual review. |
| 1.4.4 Resize Text | Supports | At 200% zoom, registration, search and chart reflow without loss of content or functionality. |
| 1.4.5 Images of Text | Not Evaluated |  |
| 1.4.10 Reflow | Does Not Support | At 320 px wide, content is clipped without a way to reach it; the registration form cannot be completed (M7). |
| 1.4.11 Non-text Contrast | Not Evaluated |  |
| 1.4.12 Text Spacing | Not Evaluated |  |
| 1.4.13 Content on Hover or Focus | Not Evaluated |  |
| 2.4.5 Multiple Ways | Not Evaluated |  |
| 2.4.6 Headings and Labels | Not Evaluated | Recommendation: the same field is named differently in its label, its error and the error summary ("Date of birth", "Birthday", "birthdate"). |
| 2.4.7 Focus Visible | Does Not Support | No visible focus on the vitals card header (M2), on calendar days and the calendar trigger (M5). |
| 2.4.11 Focus Not Obscured (Minimum) | Partially Supports | Passes in the desktop layout. Fails at 200% zoom: the fixed bottom toolbar of the chart fully hides focused controls (M6). |
| 2.5.7 Dragging Movements | Not Evaluated |  |
| 2.5.8 Target Size (Minimum) | Does Not Support | Targets of 16 px in the vitals header (A7) and the appointments date picker (A8). |
| 3.1.2 Language of Parts | Not Evaluated |  |
| 3.2.3 Consistent Navigation | Not Evaluated |  |
| 3.2.4 Consistent Identification | Not Evaluated |  |
| 3.3.3 Error Suggestion | Not Evaluated | Only required-field errors were triggered. |
| 3.3.4 Error Prevention (Legal, Financial, Data) | Not Evaluated |  |
| 3.3.8 Accessible Authentication (Minimum) | Not Evaluated | Login uses username and password without a cognitive test; paste and password manager support not verified. |
| 4.1.3 Status Messages | Does Not Support | The patient search results count is not exposed as a status message (M3). |

## Legal disclaimer

This report describes the observed behaviour of a specific version in a specific sample. It is
not a legal opinion and does not certify conformance with any law or regulation.
