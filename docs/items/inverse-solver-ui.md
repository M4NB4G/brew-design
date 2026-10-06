# Design to a target OG — Tier B

Status: agreed 2026-10-05 ("agree to all"; IS-Q2 replaced by IS-Q2', option
A, the same day; IS-Q7 agreed 2026-10-06, "agree to all"), not started. Written by the S6b
session; built in batch S7, first of its three items (docs/ROADMAP.md,
Sessions). Follows S6b on its branch (recipe format 10).

## Why

The engine has carried an inverse grain solver (`solveGrist`: a target OG,
each malt's share and the brewhouse figures give the weights) since Phase 1,
with nothing on screen to drive it. Brewers design a grain bill by percent of
total and a target gravity; the weights follow. The owner also wants each
malt's percent of total on the Grist card at all times (2026-10-05).

## Sentences — what must be true afterwards

- **IS-S1** The Grist card always shows each malt's % of total grain weight, read from the engine's share (as the printed sheet prints it), "—" where the share is blank.
- **IS-S2** A "Design to target OG" control on the Grist card: a target OG box in the screen's gravity unit (SG, or °P in Pro when chosen) and a Solve step with one % box per malt, filled from the malt's current share (blank where its weight is blank), each editable.
- **IS-S3** Solve sets every malt's weight from the target OG, the percents and the recipe's brewhouse efficiency, pre-boil volume at 60 °F, boil-off rate and boil time, through the engine's `solveGrist`, in one step. The mash water is unchanged; mash Rv, mash R and their range warnings follow from the new weights.
- **IS-S4** Solve changes nothing, and says why, when the percents do not total 100 % (naming the total), or when the target, a percent, a malt's FGDB, the efficiency, the pre-boil volume, the boil-off rate or the boil time is blank (naming each).
- **IS-S5** After Solve, the predicted OG shows beside the target ("Predicted OG 1.0681 for a target of 1.068"), with one line saying the two gravity conversions the engine uses differ slightly (its FLAG); there is no iterating to hide it.
- **IS-S6** The target and the percents are not saved and are not part of the recipe or its file. "Undo solve" restores the weights from before the solve, until the next edit.
- **IS-S7** Nothing else changes: with no Solve, every figure, label and saved document is as before, but for the new % of total readout.

## Decisions — agreed 2026-10-05 ("agree to all"; IS-Q2' option A)

| id | Question | Decision | Rule |
|---|---|---|---|
| IS-Q1 | Where the control lives | A target-OG box and a Solve step on the Grist card, in the screen's gravity unit | Design tools sit beside what they change |
| IS-Q2 | What Solve changes | Only the malt weights, keeping each malt's share by weight. **Replaced by IS-Q2', the owner, 2026-10-05** | — |
| IS-Q2' | How design by percent works | Option A: the Grist card always shows each malt's % of total, read from the engine's share; Solve has one editable % box per malt, filled from those shares (blank where a weight is blank); Solve sets every weight from the target OG and the percents; nothing new is saved, no format change. Covers IS-Q5: a blank weight needs only a % typed | The owner, 2026-10-05: design by percent of total, % always shown |
| IS-Q3 | The solver's round-trip residual (~0.003 °P) | Shown after Solve, with one line why; no iterating | The engine's FLAG; constants are not altered |
| IS-Q4 | Is the target saved? | No: a one-off action, no format change | One format change only when it carries information |
| IS-Q5 | Blank figures | Solve refuses and names them; nothing changes. A blank weight is not one of them (IS-Q2') | No number the brewer did not enter |
| IS-Q6 | Undo | "Undo solve" restores the previous weights until the next edit | The action rewrites many figures at once |
| IS-Q7 | When the % boxes "total 100 %" (agreed 2026-10-06, "agree to all") | The boxes' total, shown to one decimal, reads 100.0; a box left as filled keeps the malt's exact share, so an untouched bill always totals 100 | Percents are shown to one decimal; the shares the engine gives sum to 1 |
| M1 | Builder model | Opus, high effort | The Models rule's default |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default |
| K | Silent properties | **Atomicity:** Solve changes every weight in one step, one autosave. **Idempotence:** Solve twice with the same target and percents gives the same weights. **Undo** lasts until the next edit, in this tab only, not saved. Schema migration none; storage disabled and multi-tab as today | — |

## Scenarios — to be written first, must fail before

`apps/recipe/test/inverse-solver.test.js`: *each malt's % of total always shows* (10 and 1 lb → 90.9 and 9.1 by hand: 10/11, 1/11); *Solve sets the weights from the target and the percents* (the smoke test's reference recipe: 93.1/6.9 % at 1.0681297 gives ~27.0 and ~2.0 lb within the solver's pinned residual; the mash water unchanged); *Solve refuses and names what is missing* (a total of 99.0; each blank figure); *the predicted OG and the residual line show*; *undo restores the weights*; *nothing else changes* (a before-capture of the Grist card without the new column, and the saved document byte for byte).

## Notes for the builder

- The share is the engine's `perMaltWeightFraction` (`docs/items/grist-percent.md`); percent at the edge (`fractionToPercent`). The solver's `percent` is a fraction too (`percentToFraction`).
- `solveGrist` takes the pre-boil volume at 60 °F: pass the corrected one `computeRecipe` already holds (`refVolumesGal.preBoil`), not the measured.
- It also returns `mashWaterGal` for a target mash Rv: unused (IS-S3, mash water unchanged).
- Selectors only (SPEC rule 10): a selector wraps `solveGrist`; the component calls it.
- In Pro with sacks (S6b), the weights Solve writes show in sacks as any weight does.
- Files likely touched: `apps/recipe/src/selectors.js`, `display.js` (if a helper is needed), `components/GristTable.jsx`, `App.jsx` (undo state); SPEC rule 10; `docs/TEST_COVERAGE.md`.
