# Blank brewery figures name the built-in one — Tier B

Status: agreed 2026-10-05 ("agree to all"), not started. Written by the S6a
session (on Opus, after the owner widened the trial); built in batch S6c,
the widened trial, second of its two items, after "Measurement temperatures
beside their volumes" (docs/ROADMAP.md, Sessions; moved up from S8, WT-1).

## Why

A blank box in My brewery (Options tab) says nothing about what a new
recipe will get in its place. The choices already name theirs ("Built-in
(Home)", "Built-in (°P)", "Built-in (all)"); the number boxes do not
(noticed building brewery defaults, 2026-09-23).

## Sentences — what must be true afterwards

- **BB-S1** In My brewery, each empty number box shows, greyed inside the box, the figure a new recipe gets in its place: the batch volume 5.5 gal, pre-boil volume 7 gal, boil-off rate 1.5 gal/hr, boil time 60 min, each of the three measurement temperatures 60 °F, brewhouse efficiency 75 %, grain absorption 0.1 qt/lb — each read from the built-in recipe and the built-in water, never written in the component.
- **BB-S2** The greyed figure is in the screen's current units (Home or Pro), as the box's label is.
- **BB-S3** The greyed figure is never a value: it is not saved, not exported in the brewery file, and does not end the My brewery banner. Typing in the box replaces it; emptying the box brings it back.
- **BB-S4** Nothing else changes: every recipe figure, the recipe on screen, saved recipes, recipe files, the brewery's saved document and the printed sheet are the same for the same entries.

## Decisions — agreed 2026-10-05 ("agree to all")

| id | Question | Decision | Rule |
|---|---|---|---|
| BB-Q1 | A built-in figure that is itself blank (the water report, Ca to pH; the HLT treated volume; the top-up level) | The box stays empty, as today | There is no built-in figure to name; a "—" in a box reads as a value |
| BB-Q2 | The figure alone, or with a word | The figure alone, greyed; the unit stays in the row's label | Number boxes are narrow; grey in a box is the usual sign for "not set". The choices say "Built-in (…)" because their option text has room |
| BB-Q3 | Decimals | As the recipe's own box for that figure shows it | The greyed figure matches what typing it would show |
| M1 | Builder model | Sonnet 5.5 at high effort (WT-6, the owner, 2026-10-05), with the Opus advisor (`/advisor opus`) checking the approach and confirming every number before commit | WT-3' (CLAUDE.md, Models: the widened trial) |
| M2 | Inspector model | Opus, default effort, a fresh session | WT-3' |
| SP | Silent properties (durability, atomicity, idempotence, ordering, storage disabled, schema migration, multi-tab) | None new. The figures are read from the built-in recipe, so they show with storage blocked; nothing is stored, so no format change and no migration; a second tab shows the same built-in figures | The greyed figure is display only (BB-S3) |

Numbers: none introduced. Every greyed figure is an existing built-in
figure (the built-in recipe, `GRAIN_ABSORPTION_QT_PER_LB` for the
absorption); the inspector ties each to its source.

## Scenarios — to be written first, must fail before

`apps/recipe/test/brewery-placeholders.test.js`: *each blank brewery box shows the built-in figure greyed* (every BB-S1 box, Home; the batch volume in bbl in Pro; the water report and the two HLT volumes empty, BB-Q1); *a set figure shows itself, not the built-in one*; *the greyed figure is never a value* (the brewery document byte for byte with and without the greyed figures shown; the banner still shows while every figure is blank).

## Notes for the builder

- The shared input row (`components/shared/InputRow.jsx`) has no placeholder today; add one, passed through `OptionsSection.jsx`'s figure row. The built-in figures come from `defaultRecipeState()` (`state.js`) and `defaultWaterState()` (`water-state.js`), converted for the screen through `display.js`, as the boxes' own values are. Reading through the display file is what makes this Tier B (2026-10-02).
- The greyed colour comes from `components/shared/styles.js` (SPEC 14); if no muted input-placeholder colour exists there, add it there, not in the component.
- After item 1 of S6c the recipe's own measurement temperatures are on the Volumes card; the brewery's three stay in My brewery and are the ones this item greys.
- The rendering scenarios run with `npm test --workspace @brew/recipe -- test/brewery-placeholders.test.js`, not `npx vitest` from the root.
