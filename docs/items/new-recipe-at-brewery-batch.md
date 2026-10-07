# A new recipe at the brewery's batch — Tier A + B

Status: agreed 2026-10-07 ("agree to all"); not started. Written by the S9
session; built in batch S11 (docs/ROADMAP.md, Sessions).

## Why

A new recipe that opens with My brewery's batch (fermentation) volume set
(say 465 gal in Pro) takes that batch with the built-in 5.5 gal amounts and
volumes beside it: 10 lb of Pale, 7 gal pre-boil, 1.5 gal/hr boil-off. The
post-boil volume sits far below the batch, and the cells and the dry-hop
rate are worked over 465 gal. PD-S5 scales only with the batch blank (to
10 bbl). Home has the same mismatch: a brewery batch of 10 gal opens beside
the 5.5 gal amounts (noticed building S6e, 2026-10-06; Home found writing
this table, 2026-10-07).

## Sentences — what must be true afterwards

- **NB-S1** A new recipe (Reset, or a load with no readable saved recipe) with My brewery's batch volume set starts from the built-in recipe scaled to that batch, by the engine's scale (SPEC rule 8), in Pro and in Home.
- **NB-S2** The brewery's other set figures then take their places, unscaled (the pre-boil volume, boil-off rate, efficiency and the rest); a blank figure never reaches the recipe.
- **NB-S3** With the batch blank, nothing changes: Pro starts at 10 bbl (PD-S5), Home at the built-in 5.5 gal.
- **NB-S4** My brewery's greyed figures name the figure a new recipe actually gets, scaled to the set batch (PD-B2's rule).
- **NB-S5** Nothing else changes: no saved format changes; an existing or loaded recipe is never rescaled; switching Home and Pro asks as today.

## Decisions — agreed 2026-10-07 ("agree to all")

| id | Question | Decision | Rule |
|---|---|---|---|
| NP-Q1 | Scale a new recipe to the brewery's set batch, and in Home too? | Yes, in Pro and Home: the built-in recipe scaled to the brewery's batch | A new recipe's amounts fit its batch; the same scale as the Home/Pro switch |
| NP-Q2 | After scaling, do the brewery's own set figures still replace the scaled ones? | Yes: scale first, then the brewery's set figures take their places | A figure the brewer set is never overwritten (PD-S5's order) |
| NP-Q3 | My brewery's greyed figures | They follow: each names the figure a new recipe gets | SPEC 17: the greyed figure is the one a new recipe gets |
| M1 | Builder model | Opus, high effort | The Models rule's default |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default |
| K | Silent properties | **Ordering:** scale, then the brewery's set figures. **Idempotence:** the same brewery gives the same new recipe each time. **Multi-tab:** the brewery is read when the recipe is created (SPEC 17). Saved formats: none change | — |

## Scenarios — to be written first, must fail before

App (`apps/recipe/test/new-recipe-at-batch.test.js`, new): *a new Pro recipe starts at the brewery's batch* (465 gal: ratio 465 / 5.5, 10 lb of Pale → 845.4545… lb, worked by hand); *a new Home recipe starts at the brewery's batch* (10 gal: 10 / 5.5); *the brewery's set figures take their places unscaled*; *with the batch blank nothing changes* (Pro 10 bbl, Home 5.5 gal); *the greyed figures follow*; *nothing else changes* (saved format, a loaded recipe untouched).

## Notes for the builder

- `newRecipe` in `state.js` scales only for Pro with the batch blank today; the scale is the engine's `scaleRecipe` through `selectors.js` (`scaleRecipeTo`). The ratio is a pure arithmetic number: pin it by hand.
- The greyed figures read the new recipe the brewery's figures make (S6e); they should follow without their own code — check.
- Files likely touched: `apps/recipe/src/state.js`; SPEC rule 17; `docs/TEST_COVERAGE.md`.
