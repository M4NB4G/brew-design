# Post-boil volume as measured — Tier B

Status: agreed 2026-09-23 ("agree to all"), not started. Written by the S1
session; built in batch S2 (docs/ROADMAP.md, Sessions), third of its four
items, after "The 60 °F reference held in one place", whose figure it reads.

## Why

The screen and the printed sheet show the post-boil volume only at the 60 °F
reference. A brewer who measures it hot writes a hot reading in the sheet's
measured box beside a cold prediction. Noticed building the print sheet,
2026-09-23.

## Sentences — what must be true afterwards

- **P-S1** When the post-boil measurement temperature is not 60 °F, the Volumes card shows the post-boil volume as it will read at that temperature, beside the 60 °F figure.
- **P-S2** The printed sheet's post-boil row shows the same pair, so a hot reading is compared against a hot prediction.
- **P-S3** The figure is the one the app already works out before correcting to 60 °F — the pre-boil volume as measured, less the boil-off — so there is no new calculation.
- **P-S4** At 60 °F only one figure shows, as today.

## Decisions — agreed

| id | Question | Decision | Rule |
|---|---|---|---|
| M1 | Builder model | Opus, high effort | The Models rule's default (the owner, 2026-09-23) |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default |
| P1 | How the printed row reads | "Post-boil volume 6.25 gal at 180 °F (6.07 gal at 60 °F)", with the measured box beside it | The brewer fills in the figure they can measure |
| P2 | Silent properties | None: display only; no saved format changes | — |

## Scenarios — `apps/recipe/test/post-boil-measured.test.js`, written first, must fail before

1. *the recipe's figures include the post-boil volume at its measurement temperature: the pre-boil volume as measured less the boil-off* — P-S3. Hand pin: the reference recipe, pre-boil 16 gal, boil-off 1.5 gal/hr for 60 min → 16 − 1.5 × 60/60 = 14.5 gal, whatever the post-boil measurement temperature; the 60 °F figure is the engine's correction of 14.5 at that temperature.
2. *at a post-boil temperature other than 60 °F the printed post-boil row reads the measured figure at that temperature and the 60 °F figure* — P-S2, P1.
3. *at 60 °F the printed row is today's, one figure* — P-S4.
4. *every other derived number is unchanged* — the guard.

Expected failure before the change: the recipe's figures carry no
as-measured post-boil volume, and the sheet's row has one figure.

## Far end — Tier B, on the built app

1. Post-boil measured at 180 °F: the Volumes card shows the post-boil volume at 180 °F beside the 60 °F figure, in gal (Home) and bbl (Pro).
2. The printed sheet's post-boil row reads as P1.
3. At 60 °F the card and the sheet are as today.
4. A recipe saved by the live site loads with every number as on the live site.

## Notes from the spec session, for the builder

- **Today:** `apps/recipe/src/selectors.js` computes `postBoilRawGal` (the engine's `computePostBoilVol` on the pre-boil volume as measured) and returns only `postBoilVolGal`, its correction at the post-boil measurement temperature. Return the raw figure as well; no engine change. Rule 10 holds: it is already computed in `selectors.js`.
- **The sheet** (`components/recipe-sheet-data.js`, `RecipeSheet.jsx`) has Predicted and Measured columns; P1's wording goes in the Predicted cell (or the label and a note, as fits the table); the measured box stays.
- **The 60 °F figure's label and the "not 60" test** read the reference constant from the first S2 item.
- **Not decided by the table:** what shows when the post-boil temperature is blank or outside the correction's range. The spec session's reading: the card and the sheet show today's single row (its 60 °F figure is then blank) — the pair appears only for a temperature that is a number other than the reference. If you read it otherwise, ask the owner.
- **Files likely touched:** `selectors.js`, `components/VolumesSection.jsx`, `components/recipe-sheet-data.js`, possibly `RecipeSheet.jsx`, the new test, `docs/TEST_COVERAGE.md`, `docs/ROADMAP.md` (row removed). `print-sheet.test.js`'s existing assertions should still pass unchanged at 60 °F.

## Recorded failure (filled in by the builder)

## Builder's notes — choices the sentences did not make (filled in by the builder)
