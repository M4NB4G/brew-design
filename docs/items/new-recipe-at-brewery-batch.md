# A new recipe at the brewery's batch — Tier A + B

Status: landed 2026-10-08 in batch S11 on branch `S11`, as "A new recipe
starts from the built-in recipe scaled to My brewery's batch whenever it is
set, in Pro and in Home"; agreed 2026-10-07 ("agree to all"). Written by the
S9 session; built in batch S11 (docs/ROADMAP.md, Sessions). Tier B in the
event: the engine's scale already existed, so only `state.js` changed.

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

## Builder's notes (S11, 2026-10-08)

Claims for the inspector to verify; none is a decision the sentences made.

- One change in `newRecipe` (`state.js`): the batch a new recipe scales to is the brewery's batch when set, else 10 bbl in Pro, else none (Home: the built-in recipe as it is). The scale is the engine's, through `selectors.js`'s `scaleRecipeTo`, as the Home/Pro switch's; the brewery's set figures then replace the scaled ones, unscaled, in the order PD-S5 already used.
- A brewery batch of zero or a negative figure gives no ratio, as on the Home/Pro switch (SPEC rule 8): the new recipe is then the built-in recipe, with that batch put in its place as before this item. My brewery's boxes take 0 (`min=0`), so 0 is reachable; scaling to it would have zeroed every amount. Pinned in scenario 4.
- Home with the batch at exactly 5.5 gal scales by 1: every amount the same (x × 1 = x exactly).
- The greyed figures needed no code: My brewery reads the new recipe the brewery's figures make (PD-B2). The comment beside that line now says "scaled to its batch" in place of "scaled in Pro" (`OptionsSection.jsx`, a comment only).
- Five older scenarios pinned the old behaviour (a set batch beside the built-in 5.5 gal amounts) and now pin the scaled figures, each by hand: `brewery-defaults.test.js` (12 gal: ratio 24/11; Pale 240/11, Magnum 24/11, mash water 120/11, pre-boil 168/11; the expected recipe built on `scaleRecipeTo` of the built-in recipe with the set figures in place), `brewery-placeholders.test.js` (pre-boil greyed 168/11 = 15.272727), `pro-unit-choices.test.js` (its brewery of 380 gal: greyed pre-boil 2660/170.5 = 15.601173 and boil-off 570/170.5 = 3.343109 bbl in place of the captured 0.225806 and 0.048387, by a named substitution as the file's other "since" changes are).
- Of the six new scenarios, four failed before the change; "with the batch blank nothing changes" and "nothing else changes" passed before, as their sentences (NB-S3, NB-S5) say nothing changes.
- Numbers introduced: none in the app; the guard `batchGal > 0` (no ratio from a zero or negative batch, rule 8's own condition). The ratios are pinned by hand in the scenarios (930/11, 20/11, 24/11, 380/5.5).
- Silent properties: ordering (scale, then set figures) and idempotence are in scenario 3; multi-tab as today (Reset reads the brewery on screen, which each change re-reads from storage; a first visit reads storage). No saved format changes.
