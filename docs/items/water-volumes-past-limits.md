# Water volumes past their limits — Tier A + B

Status: agreed 2026-10-08 ("agree to all"); not started. Written by the S11
session; built in batch S12, item 1 (docs/ROADMAP.md, Sessions).

## Why

The hot-liquor tank's draws are worked as the arithmetic gives them, with a
`// FLAG:` in the engine (`water/volumes.js`, `tankDraws`). A top-up level
below the treated water the mash leaves gives a treated share over 100 %:
treated 12 gal, mash water 5 gal (7 gal left), top-up level 6 gal, sparge
4 gal reads 117 %, the sparge carrying 39 % of the tank's salts and 19 % left
in 2 gal. No untreated water can go in: the tank holds 7 gal, all treated,
so the sparge liquor is 100 % treated, carries (7/12)(4/7) = 33 % and leaves
(7/12)(3/7) = 25 % in 3 gal. Its twin, mash water more than the treated
volume (already warned), gives a negative share: treated 12, mash 14, top-up
20 reads −10 %, the mash 117 % of the salts and −13 % left (noticed building
the water treatment choice, 2026-10-02; worked on the engine, 2026-10-08).

## Sentences — what must be true afterwards

- **WV-S1** With the top-up level below the treated water the mash leaves, the tank holds only that treated water: no untreated water is added; the sparge liquor's treated share is 100 %; the sparge and the water left are drawn from it (treated 12, mash 5, top-up 6, sparge 4: 100 %, the sparge carrying 1/3 of the salts, 1/4 left in 3 gal).
- **WV-S2** A warning says so on the Water tab: the top-up level is below the treated water the mash leaves, and no untreated water is added.
- **WV-S3** With the mash water more than the treated volume, the mash takes all the treated water and every salt (100 %), the sparge liquor's treated share is 0 %, nothing is left in the tank from the treated fill, and the existing warning stays.
- **WV-S4** No share of the salts or of the treated water is ever below 0 or above 100 %; the shares of the salts still add to 100 %.
- **WV-S5** Nothing else changes: within the limits every figure is as today; the printed sheet shows the same figures as the screen; no saved format changes.

## Decisions — agreed 2026-10-08 ("agree to all")

| id | Question | Decision | Rule |
|---|---|---|---|
| WV-Q1 | Top-up level below the treated water the mash leaves: what happens? | Warn ("no untreated water is added"), and work the tank as holding only the treated water left: share 100 %, the sparge and the leftover drawn from it | A tank cannot be topped up below what it holds; every share is held between 0 and 1, as the kettle shares are (KS1) |
| WV-Q2 | Mash water more than the treated volume (already warned): same item, same rule? | Yes: the mash takes all the treated water and every salt (100 %), the sparge's treated share 0 %, the existing warning stays | Same as WV-Q1 |
| M1 | Builder model | Opus, high effort | The Models rule's default |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default |
| K | Silent properties | **Ordering:** the warning and the held shares read the same figures, worked each time the tab is drawn. **Conservation:** the shares of the salts add to 1 in every case (mash + sparge + left). Nothing is saved; no saved format changes | — |

## Scenarios — to be written first, must fail before

Engine (`packages/engine/test/water/volumes.test.js`, or a new file): *a top-up level below the treated water left adds no untreated water* (12 / 5 / 6 / 4: treated share 1, to the mash 5/12, carried 1/3, left 1/4, water left 3 gal, by hand); *mash water more than the treated volume takes every salt* (12 / 14 / 20 / 4: to the mash 1, share 0, carried 0, left 0, by hand); *the shares always add to one and stay between 0 and 1*; *within the limits nothing changes* (today's figures for a tank inside both limits). App (`apps/recipe/test/water-treatment.test.js`, or a new file): *the Water tab warns when the top-up level is below the treated water left*; *the sheet shows the held figures*.

## Notes for the builder

- `packages/engine/src/water/volumes.js` `tankDraws` and its FLAG (the FLAG goes with the change); its warnings travel through `selectors.js` (`computeWater`'s `warnings`) to `components/water/WaterGoesCard.jsx`, beside the two existing warnings; the sheet reads `water.tank` in `components/recipe-sheet-data.js`.
- The held figures are arithmetic, not a spreadsheet cell: pin each by hand with the working in the test.
- Files likely touched: `packages/engine/src/water/volumes.js`; `apps/recipe/src/selectors.js`; `apps/recipe/src/components/water/WaterGoesCard.jsx`; SPEC rule 10; `docs/TEST_COVERAGE.md`.
