# Boxes and access — three Tier C items (one with a Tier B line), batch S14

Status: agreed 2026-10-10 ("agree to all", S14-Q1 to S14-Q4); item 1 landed as "A weight or volume box shows the printed sheet's precision while the cursor is elsewhere, and the full figure while the cursor is in it". Items 2 and 3 not started.
Questions put by the S14 session before building, from measurements of the
built app (2026-10-09, 1200 px and 375 px); answered by the owner. Built in
batch S14 in the roadmap's order: the cut-off boxes, keyboard focus and hover,
the other accessibility findings.

## What was measured before the questions

- **Cut-off boxes.** After Design to target OG, the malt weight boxes cut off
  their figure ("9.863658"); after scaling to 10 bbl, Pro's malt and hop
  weights did ("563.6363…", "3.52272…"). Pro's volume boxes, the case the
  roadmap named, no longer did ("9.090909" bbl showed whole). No box saves its
  figure when the brewer leaves it without typing.
- **Focus.** Chromium already draws a ring (black on the tab buttons, a thin
  dark ring on the boxes); nothing in the app removes it, so WCAG 2.2 2.4.7
  was already met there.
- **Scan** (axe-core, each tab, 1200 and 375 px): colour contrast, 8 to 28
  places per screen, all from two greys (muted 3.0 to 3.3:1, secondary 4.2 to
  4.5:1), with the footer grey at about 2:1 on the page's gradient, which the
  scan cannot read; empty table headers (the Grist and Hops remove columns);
  the stats bar outside any landmark (the page already has `main`); no
  level-one heading (a best-practice rule, not WCAG).

## Decisions — agreed 2026-10-10 ("agree to all")

| id | Question | Decision | Rule |
|---|---|---|---|
| S14-Q1 | Cut-off boxes: widen, or fewer decimals? | Each malt weight, hop weight and volume box shows its figure to the precision the printed sheet prints it (malt 0.01 lb; hops 0.01 oz at Home, 0.001 lb in Pro; volumes 0.01 gal, 0.001 bbl) while the cursor is elsewhere, and the full stored figure while it is in the box. The stored figure, and every number worked from it, stays exact | The precision is the sheet's, so no new number is chosen; widening alone fails at larger batches |
| S14-Q2 | Focus and hover: the browser's ring, one app ring, or every style to stylesheets? | One ring for the whole app: the same 2 px navy ring with a small gap on every box, button and choice, in every browser; buttons and tabs darken slightly under the pointer. One small rule in the global stylesheet, coloured from `styles.js`; a SPEC sentence says that file holds the global focus and hover rules beside the print rules | Visible focus is met either way; this makes it consistent. Moving 347 style objects gains a brewer nothing |
| S14-Q3 | Contrast: darken the failing greys? | Yes: each grey, its hue kept, darkened only until it reaches 4.5:1 on the darkest background it sits on. The three greys then nearly meet; a label and a note differ by size and italics; the page departs a little from Brew Water Chem's palette | WCAG 2.2 AA, 1.4.3 (4.5:1 for normal text); the shade follows from the rule |
| S14-Q4 | The rest of the scan? | All three, nothing visible changes: hidden "Remove" text in the two blank headers; "Brew Design" in the header marked as the page's heading; the stats bar marked as a region named "Recipe figures". The last is in `App.jsx` (Tier B by path): a fresh Opus inspector and its own box | WCAG 2.2 1.3.1; the heading is good practice |
| M1 | Builder model | Opus 5.5 (the session ran on Opus, not the Sonnet 5.5 the roadmap planned; reported to the owner before building) | CLAUDE.md, Models |
| M2 | Inspector model | Item 3 only (it touches `App.jsx`): Opus, default effort, a fresh subagent | CLAUDE.md, Models (Tier B default) |

## Item 1 — Boxes show the sheet's precision (Tier C)

- **BA1-S1** Each malt weight, hop weight and volume box (the Volumes card's mash water, pre-boil volume, boil-off rate and fermentation volume; the Water tab's sparge water, treated volume and top-up level; My brewery's batch volume, pre-boil volume, boil-off rate, treated volume and top-up level, with the greyed figure in an empty one), while the cursor is elsewhere, shows its figure to the precision the printed sheet prints it.
- **BA1-S2** With the cursor in the box it shows the full stored figure (to six decimals, as before), so a figure being typed is never cut short.
- **BA1-S3** The stored figure changes only by typing: entering and leaving a box keeps it exact, and no recipe figure, saved document or printed sheet changes.

Scenario: `apps/recipe/test/box-figures.test.js` (8).

## Item 2 — Keyboard focus and hover visible (Tier C)

- **BA2-S1** Every box, button and choice shows the same 2 px navy focus ring with a small gap when it has the keyboard's focus, in every browser.
- **BA2-S2** Buttons and tabs darken slightly under the pointer.
- **BA2-S3** The ring's and the hover's colours come from `styles.js`; the global stylesheet holds the rules, as it holds the print rules (SPEC rule 14).
- **BA2-S4** Nothing else on the page or the printed sheet changes.

## Item 3 — The other accessibility findings (Tier C, one Tier B line)

- **BA3-S1** Each text grey reaches 4.5:1 on the darkest background it sits on, its hue kept, darkened no further.
- **BA3-S2** The two blank table headers carry hidden text, "Remove".
- **BA3-S3** "Brew Design" in the header is the page's level-one heading, looking as it does today.
- **BA3-S4** The stats bar is a region named "Recipe figures".
- **BA3-S5** An automated scan of each tab, at 1200 and 375 px, finds no contrast, empty-header, landmark or heading finding.
- **BA3-S6** Nothing else changes: no figure, no saved document, no printed sheet.

## Builder's notes (S14)

- Branch: the session's harness names it `ccr-a9a34768-873ibd`, not S14 (as F1).
- Item 1: `NumberField` takes `digits` (the grist weight box 2; the hop weight boxes 2 at Home, 3 in Pro) and `InputRow` takes `editValue` (the full figure, shown while the box has the cursor); the Volumes card and the Water tab's volume boxes pass the sheet's precision, 2 for gal and 3 for bbl, as `recipe-sheet-data.js` and the Water tab's own `volumeText` already print them. A box with the cursor in it shows six decimals as before; at 1200 px a long figure is still cut off while being edited (563.636364), which S14-Q1 accepted. `NumberField` still selects the whole figure when the box is entered, now after the full figure is shown (Chromium: the selection is "563.636364").
- Item 1, My brewery (Options tab): its volume boxes take the same rule through `FigureRow`'s `digits`, the greyed figure in an empty box included (`InputRow`'s `editPlaceholder` shows it in full with the cursor in the box). No NumberField caller passes its own `onFocus` or `onBlur`, so the box's own pair is never overridden.
- Item 1, recorded failure (`box-figures.test.js` run alone on the unchanged code): 5 of 8 failed, e.g. `expected '9.090909' to be '9.091'` and `expected '10.125' to be '10.13'`, and the Water tab's sparge and My brewery's greyed pre-boil cases likewise; the other 3 are guards (a figure being typed kept as typed; stored figures exact after entering and leaving boxes) and passed before, as BA1-S2's typing half and BA1-S3 say nothing changes there.
- Item 1, far end 2026-10-10 (Chromium, built app): no number box cut off at 1200 or 375 px on the Recipe, Water and Options tabs after Design to target OG at 1.055 or after scaling to 10 bbl; Pale 2-Row's box clicked shows and selects 563.636364; 600.125 typed is kept, shows 600.13 after Tab, and is saved as 600.125; the browser suite (17) passes.
- Item 1, numbers introduced: the decimals 2 and 3, display precision (excluded from the catch-all), each the printed sheet's. No recipe value.
- Item 1, earlier tests: `celsius-toggle`, `pro-unit-choices` and `economics`'s "nothing else changes" compare through `test/box-figures.fixture.js`, which writes a captured box figure (or greyed figure) as drawn now only where a box BA1 changed, named by `BA1_BOX`, now shows that same figure rounded (at most three decimals); every other byte and box figure is compared, and the captures are not re-made. `page-error`'s digests are taken with each box `BA1_BOX` names read with the cursor in it (the full figure and greyed figure), and equal the digests captured before, unchanged. `sparge-typed` pinned the Pro sparge box's "0.274194"; it now pins "0.274" (8.5 / 31 to 0.001 bbl). My brewery's greyed figures were pinned to six decimals in `brewery-placeholders` (0.177419, 0.048387, 15.272727), `new-recipe-at-batch` (19.090909, 4.090909, 12.727273, 2.727273) and `pro-recipe-default` (12.727273, 2.727273); each now pins the same figure to the sheet's precision, its hand working kept beside it. The browser suite's Pro scale check reads the box's "563.64", then the full figure with the cursor in it.
