# Boxes and access — three Tier C items (one with a Tier B line), batch S14

Status: agreed 2026-10-10 ("agree to all", S14-Q1 to S14-Q4); item 1 landed as "A weight or volume box shows the printed sheet's precision while the cursor is elsewhere, and the full figure while the cursor is in it"; item 2 landed as "Every box, button and choice shows one navy ring when it has the keyboard's focus, and buttons darken slightly under the pointer"; item 3 landed as "The greys reach 4.5:1 on their backgrounds, and the remove columns, the wordmark and the stats bar carry what a screen reader needs".
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
- Item 1, far end 2026-10-10 (Chromium, built app): no number box cut off at 1200 or 375 px on the Recipe, Water and Options tabs after Design to target OG at 1.055 or after scaling to 10 bbl; Pale 2-Row's box clicked shows and selects 563.636364; 600.125 typed is kept, shows 600.13 after Tab, and is saved as 600.125; the browser suite (15) passes (the item 1 commit's body said 17: that run counted two of the builder's own checks, not kept).
- Item 1, numbers introduced: the decimals 2 and 3, display precision (excluded from the catch-all), each the printed sheet's. No recipe value.
- Item 1, earlier tests: `celsius-toggle`, `pro-unit-choices` and `economics`'s "nothing else changes" compare through `test/box-figures.fixture.js`, which writes a captured box figure (or greyed figure) as drawn now only where a box BA1 changed, named by `BA1_BOX`, now shows that same figure rounded (at most three decimals); every other byte and box figure is compared, and the captures are not re-made. `page-error`'s digests are taken with each box `BA1_BOX` names read with the cursor in it (the full figure and greyed figure), and equal the digests captured before, unchanged. `sparge-typed` pinned the Pro sparge box's "0.274194"; it now pins "0.274" (8.5 / 31 to 0.001 bbl). My brewery's greyed figures were pinned to six decimals in `brewery-placeholders` (0.177419, 0.048387, 15.272727), `new-recipe-at-batch` (19.090909, 4.090909, 12.727273, 2.727273) and `pro-recipe-default` (12.727273, 2.727273); each now pins the same figure to the sheet's precision, its hand working kept beside it. The browser suite's Pro scale check reads the box's "563.64", then the full figure with the cursor in it.
- Item 2: `index.css` gains two rules, `:focus-visible` (2 px solid `var(--focus-ring)`, 2 px offset) and `button:not(:disabled):hover` (`filter: brightness(0.94)`), the latter only where the pointer hovers (`@media (hover: hover)`): on a touch screen a tapped button would otherwise stay darkened until the next tap (the advisor's catch; the touch case fails without the guard, `brightness(0.94)` against `none`, and passes with it); `styles.js` gains `interaction`, `--focus-ring` set to `colors.textPrimary` (the navy); `main.jsx` writes it to the page's root through its style object, which the page's policy allows (no inline style element, no violation in the browser suite). No component changes, so the jsdom captures and page digests are untouched.
- Item 2, recorded failure (`npm run e2e`, `focus-and-hover.spec.js`, before the change): 2 of 2 failed. The ring on Export reached by Tab read `{ style: 'auto', width: '1px', color: 'rgb(16, 16, 16)', offset: '0px' }` against `{ 'solid', '2px', 'rgb(31, 49, 71)', '2px' }`; Export's filter under the pointer read `none` against `brightness(0.94)`. The tabs and pills ease every change over 0.15 s (their own `transition`), so the spec reads each style once settled.
- Item 2, numbers introduced: the ring's 2 px width and 2 px gap and the hover's 0.94 brightness, layout and visual values (excluded from the catch-all). No recipe value.
- Item 2, far end 2026-10-10 (Chromium, built app, 1200 px): the ring shows clearly round the active Home pill (navy on its pale pill) and a number box; Import under the pointer turns a shade darker; the browser suite (18, with this item's 3) passes. A box clicked with the mouse also shows the ring: browsers treat a text or number box as keyboard-focused however it is entered. At 375 px the ring shows whole round the Home pill beside the brand, a weight box and a malt type choice; nothing clips it.
- Item 2, nothing else changes (BA2-S4): the built app from item 1's commit and from this change, each tab in Home and Pro at 1200 and 375 px, nothing focused and the pointer off the page, screenshotted full page: 12 of 12 identical byte for byte. (A first run differed in the 375 px Pro stats tiles; a second build-for-build run was identical, and two runs of the same build differed there too, so it is the screenshot's own noise.)
- Item 2, "in every browser": checked in Chromium only; Firefox and Safari draw the same ring by the same `:focus-visible` rule, which both support.
- Item 3, where each grey sits (surveyed in the built app: every tab and Water screen, Home and Pro, 1200 and 375 px, the References page): textMuted on white, the notice tint #f0f5fa, the page's gradient (#f5f7fa to #eaf0f6: the inactive tabs) and the stat tiles' gradient (#e8eef6 to #dfe9f2); textSecondary on white, the pill tint #e8eef6, the notice tint, the page's gradient (the References page's back link) and the stat tiles' gradient; textFooter on the page's gradient only. The darkest each sits on: #dfe9f2, #dfe9f2, #eaf0f6 (a gradient counted at its darker end).
- Item 3, the shades (hue and saturation kept, lightness lowered in steps of 0.0005 until 4.5:1, then rounded to whole steps of 1/255): textMuted #7c8fa6 to #586a81 (4.50:1 on #dfe9f2; 5.54:1 on white), textSecondary #5a7390 to #536a85 (4.53:1; 5.57:1), textFooter #9faec0 to #5a6f88 (4.50:1 on #eaf0f6; 5.17:1 on white). textSecondary lands at 4.53 rather than 4.50 because its next lighter whole-step colour falls below 4.5. `contrast.test.js` works each ratio from the colours by WCAG's definitions and checks that half a percent lighter fails.
- Item 3, the greys on the page's gradient (the inactive tabs, the footer) are what axe reports as "incomplete", not as findings, so the scan cannot prove them; `contrast.test.js`'s worked ratios are their proof.
- Item 3, the empty headers: the scan found four, not the roadmap's two (the Grist table's, the kettle and dry hop tables', and the Cost card's remove column, which the roadmap line did not name). Each gets the hidden "Remove". The hidden text uses a visually-hidden style (`tokens.visuallyHidden` in `styles.js`); each such header cell is `position: relative`, because the Cost card's table scrolls sideways on a phone and the hidden text otherwise widened the page to 531 px at 375 px (the phone header check caught it).
- Item 3, the heading: the wordmark's block becomes an `h1` with `margin: 0` and `font-weight: 400`, which keep its look; the References page keeps its own `h1`, so it has two (a roadmap line).
- Item 3, the region: the stats bar's block in `App.jsx` gains `role="region"` and `aria-label="Recipe figures"`, the only Tier B line in the batch.
- Item 3, recorded failures: `npm run e2e`'s `accessibility-scan.spec.js` on item 2's build: 4 of 4 failed, with color-contrast in 610 places, empty-table-header 10, page-has-heading-one 24 and region 24 across the scans, and nothing else; `contrast.test.js` run alone before the colours changed: 3 of 4 failed, `expected 2.694698071252709 to be greater than or equal to 4.5` (textMuted), 3.98 (textSecondary), 1.97 (textFooter); its first case checks the formulas against the published figures and passes either way.
- Item 3, nothing else changes (BA3-S6): with the old greys, the heading, the hidden text (with its header cell) and the region leave each tab in Home and Pro at 1200 and 375 px byte for byte as item 2's build (12 of 12 screenshots). The earlier byte-for-byte scenarios (`celsius-toggle`, `economics`, `inverse-solver`, `pro-unit-choices`) compare through `test/access.fixture.js`, applied to both sides, which writes back each of item 3's changes and nothing else (the three greys in hex and in rgb, the hidden text and its header cell's position, the heading, the region); `page-error`'s digests are taken through it and equal the captures unchanged. No capture is re-made.
- Item 3, the scan serves axe from the page's own address and runs it without its stylesheet preload, which would fetch the page's stylesheets itself and break the page's policy. In axe 4.14 the preload feeds the stylesheet rule (css-orientation-lock, `axe.js` reads the preloaded stylesheets only there) and the audio and video rules (the page has neither); every other rule runs as before.
- Item 3, numbers introduced: the three shades (colours, visual values) and the hidden text's 1 px box (layout). No recipe value.

