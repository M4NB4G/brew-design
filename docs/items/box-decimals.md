# Number boxes show at most three decimals while not typed in, Tier C

Status: agreed 2026-10-09 ("agree to all", BX-Q1); not started. Written by
the S13 session; built in batch S14, item 1 (docs/ROADMAP.md, Sessions).

## Why

Two roadmap lines, one question. Solve writes each malt's weight unrounded,
so a weight box shows up to six decimals and the last are hidden at 1200 px
("10.085637" reads "10.08563" for 92 % of the built-in bill at 1.055; noticed
building "Design to a target OG", S7, 2026-10-06). A volume box in Pro
barrels does the same after a scale to 10 bbl (mash water "9.090909", pre-boil
"12.727273", boil-off "2.727273"; noticed building S6e, 2026-10-06). Layout
only: no figure changes.

## Sentences: what must be true afterwards

- **BX-S1** Every number box that shows up to six decimals today shows its figure to at most three decimals while it is not being typed in, trailing zeros dropped as today. A greyed figure in an empty box (My brewery's placeholders) is shown the same way.
- **BX-S2** While a box is being typed in, it shows the full figure, as today, and what is typed is never rewritten while typing.
- **BX-S3** The stored figure stays exact: clicking into a box and leaving it without typing changes nothing, and no figure, saved document, recipe file or printed sheet changes.
- **BX-S4** After Solve on the built-in recipe, and after scaling it to 10 bbl in Pro, no weight or volume box is cut off at 1200 px or at 375 px.

## Decisions: agreed 2026-10-09

| id | Question | Decision | Rule |
|---|---|---|---|
| BX-Q1 | Widen the boxes, or show fewer decimals? | Fewer decimals: every number box shows at most 3 while not being typed in; while typing it shows the full figure and what is typed is never rewritten; the stored figure stays exact | 0.001 lb is 0.016 oz and 0.001 bbl is 0.03 gal, finer than a scale or sight glass reads; wider boxes crowd the Grist table on a phone |
| M1 | Builder; inspector | Sonnet 5.5 builds, Opus advises; no inspector (Tier C) | CLAUDE.md, Models (Tier C and D trial) |

## Proof: Tier C, "look at it"

A scenario that fails before: the built-in recipe solved to 1.055 and scaled
to 10 bbl in Pro; each weight and volume box, not focused, shows at most three
decimals; focused, the full figure; typing "10.0856" into a weight box keeps
"10.0856" while typing; leaving a box without typing leaves the saved document
byte for byte. Screenshots at 1200 and 375 px, before and after, in the report.

## Notes for the builder

- Display precision on a box is excluded from the catch-all (CLAUDE.md, Change control), so no number here is a recipe value. Every number the change adds is listed in the report for the Opus advisor to confirm.
- Where it lives: the two shared boxes, `components/NumberField.jsx` and `components/shared/InputRow.jsx`, choose what they show from focus; the value they are handed is already rounded to six decimals by `display.js` (`roundForInput`, default 6). Keep the change in `components/**`: `display.js` and `state.js` are Tier B by path and a Tier C session may not touch them. If the placeholders or a box cannot be reached from the components alone, that part returns to the roadmap for an Opus session and the report names it.
- Boxes with their own precision (the salt and acid boxes on Salts & Acid, the sack boxes to two decimals, the °C boxes to a tenth) are not in BX-S1: they never showed six decimals.
- Existing scenarios read some boxes' shown figures and will see three decimals when not focused: `new-recipe-at-batch.test.js` pins the greyed "19.090909" and "4.090909"; `sparge-typed.test.js` names "0.274194 bbl in the box"; the `*.before.json` captures hold input values. Each such change is display only; update the pin with the old figure kept beside it, and list every changed pin in the report.
