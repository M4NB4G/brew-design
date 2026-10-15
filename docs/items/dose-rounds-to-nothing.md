# A dose too small to show is left off the printed sheet, Tier C

Status: agreed 2026-10-15 ("agree to all", R-1, DZ-Q1, O-1 to O-5); not
started. Written by the S19 session; built in the orchestrated run, batch O1,
item 1 (docs/ROADMAP.md, Sessions).

## Why

The printed sheet lists an addition whose amount is above 0 but shows as
nothing at its printed precision: an acid under 0.05 mL at Home prints
"0.0 mL", under 0.5 mL in Pro "0 mL"; a salt under 0.05 g at Home prints
"0.0 g". The sheet's rule is to print only what goes in (P5). Display only,
no dose changes (found by the review of S10, 2026-10-08; LT-Q4).

## Sentences: what must be true afterwards

- **DZ-S1** On the printed sheet, an addition whose amount shows as zero at its printed precision is left off: a salt, the liquid acid, acidulated malt, a kettle salt, a salt added to the water back.
- **DZ-S2** An addition that shows a figure above zero prints as before, to the same digits.
- **DZ-S3** The Water tab is unchanged: its boxes and its "rec" hints still show such a dose as they do today.
- **DZ-S4** With every addition left off, the sheet prints what it prints today when nothing is added.

## Decisions: agreed 2026-10-15

| id | Question | Decision | Rule |
|---|---|---|---|
| DZ-Q1 | A dose above zero that shows as nothing at its precision: leave its row off the printed sheet? | Yes, for every addition on the sheet; the Water tab keeps showing it | The sheet prints only what goes in (P5) |

Tier C (`components/recipe-sheet-data.js`, display only). No inspector
unless building it introduces a number (the catch-all).

## Scenarios: to be written first, must fail before

App (`apps/recipe/test/`, the sheet's data from `recipeSheet`, as
`print-sheet.test.js` reads it): *a dose that shows as zero is left off the
sheet, at Home and in Pro* · *a dose that shows a figure prints as before* ·
*the Water tab still shows the small dose*. Fails before: the row is there,
"0.0 mL".

## Notes for the builder

- Decide "shows as zero" from the figure the sheet prints (the formatted
  text read back as a number), not from a new threshold: a threshold such
  as `< 0.05` is a number the catch-all would gate as Tier B. The rows are
  built in `waterSection` (`recipe-sheet-data.js`): salts and the raising
  salt (`r.amount > 0`), the acid rows, the kettle salts (`k.amount !== 0`)
  and the water back's salts.
- Find what the sheet prints with no additions today (DZ-S4) and keep it.
- `docs/TEST_COVERAGE.md` gets a scenario row; the roadmap line "A dose
  that rounds to nothing prints a row" is removed. SPEC rule 8's printed
  sheet wording needs no change unless it lists the additions printed.
