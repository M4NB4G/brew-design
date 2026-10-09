# Other automated accessibility findings, Tier C

Status: agreed 2026-10-09 ("agree to all", AX-Q1 to AX-Q3); not started.
Written by the S13 session; built in batch S14, item 3 (docs/ROADMAP.md,
Sessions).

## Why

The full axe-core scan of the built app (F1 item 3, 2026-10-06, 1200 and
375 px) found no missing box name but three other kinds: colour contrast
(serious; 8 to 42 places per screen, WCAG 2.2 criterion 1.4.3), table headers
with no text (the remove-button column of the Grist and Hops tables, WCAG
1.3.1), and content outside any landmark.

Measured 2026-10-09 against WCAG AA's 4.5:1 for normal text (contrast of each
text colour on each background it can sit on: card white, stat box, toggle
pill, notice panel, page, input):

| Text colour | Ratio range |
|---|---|
| Muted grey-blue (`textMuted`) | 2.69 to 3.31 |
| Secondary (`textSecondary`) | 3.98 to 4.90 |
| "Off target" amber (`matchOff`) | 3.26 to 4.01 |
| "Near target" green (`matchNear`) | 3.88 to 4.77 |
| Footer company line (`textFooter`, Brew Water Chem's footer grey) | 1.84 to 2.26 |
| Notice, warn and primary text | pass (4.92 and up) |

## Sentences: what must be true afterwards

- **AX-S1** Each text colour that reads below 4.5:1 on a background it sits on becomes the lightest shade of its own hue that reaches 4.5:1 on every background it sits on: the muted text, the secondary text, the off-target amber, the near-target green and the footer's company line.
- **AX-S2** The remove-button column of the Grist and Hops tables has a heading only screen readers hear, "Remove".
- **AX-S3** Every part of the page sits in a landmark: the header, the tab row as navigation, the stats bar and the tab content in the main region, the footer.
- **AX-S4** An axe-core scan of the built app, on each tab and Water screen at 1200 and 375 px, finds no colour-contrast, empty-table-header or outside-a-landmark finding.
- **AX-S5** Nothing else changes: no figure, saved document or printed sheet (its own palette stays); the layout is as today.

## Decisions: agreed 2026-10-09

| id | Question | Decision | Rule |
|---|---|---|---|
| AX-Q1 | How are the new shades chosen? | Each failing colour becomes the lightest shade of its own hue that reaches 4.5:1 on every background it sits on; the builder works them out and shows before and after screenshots | A rule derives the shades, so the owner is not asked to pick numbers |
| AX-Q2 | The footer's company line, Brew Water Chem's grey: darken it too? | Yes, by the same rule | It is text the brewer reads |
| AX-Q3 | Empty table headers and content outside a landmark? | A heading only screen readers hear ("Remove"), the tab row marked as navigation, the stats bar inside the main region; nothing visible changes | WCAG 1.3.1 |
| M1 | Builder; inspector | Sonnet 5.5 builds, Opus advises; no inspector (Tier C) | CLAUDE.md, Models (Tier C and D trial) |

## Proof: Tier C, "look at it", and a scan

A browser scenario that fails before: axe-core run on the built app (each
tab, each Water screen, 1200 and 375 px) reports none of the three kinds.
The shades' working (the hue kept, the lightness stepped until the lowest
ratio across the backgrounds reaches 4.5) goes in the item file beside the
old and new colour. Screenshots of each tab before and after.

## Notes for the builder

- Colour contrast needs a rendered page, so the scan runs in the browser suite (`apps/recipe/test/browser/`), not jsdom. The suite serves the app under the Content-Security-Policy; inject axe-core with `page.evaluate` of its source (run by the browser's devtools channel, not subject to the policy), not `addScriptTag`, which the policy blocks. axe-core is already a test-only dependency.
- "Hue kept": convert to HSL, keep H and S, lower L until the lowest ratio across its backgrounds is at least 4.5; round to the hex that first passes. A script in `apps/recipe/scripts/` or the item file's notes; the working must be checkable.
- The colours are in `components/shared/styles.js` (Tier C); the printed sheet's `printColors` are not screen colours and stay.
- Greyed placeholders are not checked by axe's contrast rule; they stay as they are (SPEC 17: greyed). Say so in the report.
- The landmark: the stats bar and tab row sit between the header and `main` in `App.jsx`, which is Tier B by path. If the landmarks cannot be added from components alone (wrapping `TabBar`'s own markup in `nav`, for instance, and the stats bar in a labelled region inside its own component), the part that needs `App.jsx` returns to the roadmap for an Opus session and the report names it.
