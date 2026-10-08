# Solve with volumes measured hot — Tier A + B

Status: landed 2026-10-08 in batch S12 on branch
`claude/compassionate-knuth-hydp66`, as "Design to target OG works the boil
as the recipe does, so its weights give the target OG whatever the
measurement temperatures". Written by the S11 session; built in batch S12,
item 3 (docs/ROADMAP.md, Sessions).

## Why

"Design to target OG" gives the engine the pre-boil volume at 60 °F and the
engine boils it off there, while the recipe boils off the measured volume and
corrects the post-boil volume at its own temperature (SPEC rule 11). At the
reference temperatures the two agree; measured hot they do not. On the
built-in recipe with the pre-boil and post-boil both measured at 212 °F, a
target of 1.050 predicts 1.0494 after Solve (1.0497 at 150 °F); worked with
the recipe's own boil it predicts 1.0500, as at 60 °F (checked on the
engine, 2026-10-08). Kept so far with a `// FLAG:` in `selectors.js` (noticed
building "Design to a target OG", S7 item 1, 2026-10-06).

## Sentences — what must be true afterwards

- **SH-S1** Solve works the boil as the recipe does: the measured pre-boil volume boiled off at the recipe's rate and time, the post-boil volume then corrected to 60 °F at its own measurement temperature, the pre-boil volume corrected at its own.
- **SH-S2** The weights Solve writes give the target OG through the recipe's own calculation, within the gravity conversions' known mismatch, whatever the measurement temperatures (212 °F both: 1.0500 for 1.050).
- **SH-S3** At the reference temperatures every solved weight is as today.
- **SH-S4** A measurement temperature the correction cannot use (blank, or outside 0–100 °C) refuses Solve and names it, as a blank pre-boil temperature does today.
- **SH-S5** Nothing else changes: the mash water is not touched, the percents and the target are not saved, "Undo solve" as today, and no saved format changes.

## Decisions — agreed 2026-10-08 ("agree to all")

| id | Question | Decision | Rule |
|---|---|---|---|
| SH-Q1 | Should Solve boil off the measured pre-boil volume and correct the post-boil volume at its own temperature, as the recipe does? (An engine change.) | Yes (the alternative, kept for the record: Solve as today and the card's line names the hot volumes) | Solve must land where the recipe's own calculation lands; every volume reaches the engine corrected the same way (SPEC 11) |
| M1 | Builder model | Opus, high effort | The Models rule's default |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default |
| K | Silent properties | **Idempotence:** solving twice for the same target writes the same weights. **Ordering:** the volumes are corrected before the solve, as for the forward calculation. Nothing new is saved; no saved format changes | — |

## Scenarios — to be written first, must fail before

Engine (`packages/engine/test/solver.test.js`, or a new file): *the solver takes the post-boil volume at 60 °F it is given* (a hand-worked case: target °P × post / pre, the points over the blend's potential, by hand); *without one it works as today* (the golden solve unchanged). App (`apps/recipe/test/inverse-solver.test.js`, or a new file): *Solve hits the target with the volumes measured hot* (212 °F both: the recipe's OG after Solve within the conversions' residual of 1.050; today 1.0494); *at the reference nothing changes* (today's weights exactly); *an unusable post-boil temperature refuses Solve and names it*; *nothing else changes*.

## Notes for the builder

- `packages/engine/src/solver.js` `solveGrist` works its post-boil volume from the pre-boil volume, rate and time (`computePostBoilVol`); the smallest change is likely an optional post-boil volume at 60 °F given by the caller, every constant unchanged (SPEC rule 2). `apps/recipe/src/selectors.js` `solveTargetOG` and its FLAG (the FLAG goes with the change) would pass the post-boil volume worked as `computeRecipe` works it.
- The residual of the two gravity conversions is the engine's own FLAG in `solver.js`; the tolerance in the scenario is that residual, stated with its working.
- Files likely touched: `packages/engine/src/solver.js`; `apps/recipe/src/selectors.js`; possibly `components/TargetOgSolver.jsx` (a refusal's name); SPEC rule 10; `docs/TEST_COVERAGE.md`.

## Builder's notes (S12, 2026-10-08)

- The engine's `solveGrist` takes an optional post-boil volume at 60 °F; without one (`undefined`) it boils the pre-boil volume off as before, every constant unchanged. A blank one (NaN) is kept and blanks the weights, as any blank figure does.
- `solveTargetOG` works the post-boil volume as `computeRecipe` does: the measured pre-boil volume less the boil-off, then `toReferenceVolume` at the post-boil temperature. The FLAG it carried went with the change.
- SH-S4: the post-boil temperature is named only when the measured post-boil volume can be worked out (pre-boil volume, boil-off rate and boil time all entered) and the correction cannot use it; a blank pre-boil volume, rate or time is named as before and the temperature is not also blamed. The sentence follows the pre-boil one: "The post-boil volume cannot be corrected at its measurement temperature."
- SH-S3 at the bit level: at 60 °F the solver now gets the measured post-boil volume corrected (5.5 gal for the built-in recipe), where before it got the corrected pre-boil less the boil-off. `correctVolumeToRef(7, 60)` is 7.000000000000001 (the shelved one-ulp identity on the roadmap), so for the built-in recipe the old post-boil volume was 5.500000000000001 and the new one is the forward calculation's 5.5; the weights differ in the 16th digit, below every shown figure, and now match the forward calculation exactly. For the reference recipe (16 and 14.5 gal, exact) the weights are bit for bit the old ones (pinned). The built-in recipe at 60 °F is pinned by its predicted OG, by hand.
- The tolerance in the scenarios is not a guessed band: each predicted OG is the hand value platoToSg(P + r × pre/post), r the conversions' mismatch at that gravity, worked in decimal arithmetic in the test's header.
- One older scenario moved with the change: `inverse-solver.test.js` scenario 3 pinned the hot pre-boil case to the old boil (the corrected pre-boil less the boil-off); it now pins the new one (the measured 16 gal less 1.5, 14.5 gal at its own 60 °F).
- Numbers introduced: none in the code. The test figures are hand pins, with the working beside them.
