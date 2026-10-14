# Grain bill edits return the brewer's own acid to the recommendation, Tier B

Status: agreed 2026-10-14 ("agree to all", GA-Q1 to GA-Q4, M); not started.
Written by the S15c session; built in batch S17, item 3 (docs/ROADMAP.md,
Sessions).

## Why

The acid recommendation reads the grain bill and the mash water (AA-S1), but
only a new target returns the brewer's own acid to it (AA-S4; test results
and the treated volume already did). A brewer who typed an acid amount and
then changes a malt keeps the old amount while the recommendation moves
(noticed building the acid aimed at a mash pH, S9, 2026-10-07).

## Sentences: what must be true afterwards

- **GA-S1** An edit the predicted mash pH reads returns the brewer's own acid amounts to the recommendation: a malt's weight, type, colour or either lab figure, a malt added or removed, a pick from the ingredient list, and the mash water (today only while the acid goes into the mash).
- **GA-S2** An edit it does not read leaves them as typed: a malt's name, price or FGDB, and every hop, yeast, volume and cost edit.
- **GA-S3** "Design to target OG" (Solve) changes the malt weights, so it returns them too; "Undo solve" restores the weights but not the old acid amounts (GA-Q2).
- **GA-S4** The brewer's own salt amounts stay as typed on every such edit (GA-Q3).
- **GA-S5** The Home/Pro scale multiplies the brewer's own acid amounts as today and does not return them (GA-Q4).
- **GA-S6** No saved format changes.

## Decisions: agreed 2026-10-14

| id | Question | Decision | Rule |
|---|---|---|---|
| GA-Q1 | Does a malt or mash water edit return the brewer's own acid to the recommendation? | Yes, for any edit the predicted mash pH reads: a malt's weight, type, colour or lab figures, a malt added or removed, and the mash water; a name, price or FGDB edit does not | An edit that moves the recommendation returns the acid to it, as test results and the target already do (AA-S4) |
| GA-Q2 | Solve | Returns it; "Undo solve" restores the weights, not the old acid | Solve changes the malt weights |
| GA-Q3 | The brewer's own salts | Stay as typed; only the acid returns, as with test results | Change one thing at a time |
| GA-Q4 | The Home/Pro scale | Multiplies the brewer's own acid and does not return it | A scale is not an edit (SPEC 8) |
| M1 | Builder model | Opus, high effort | The Models rule's default |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default |
| K | Silent properties | **Ordering:** the acid returns in the same step and autosave as the edit (one undo-free step, as the target's). **Idempotence:** an edit that leaves a figure as it was (typing the same weight) still returns it, as test results do; say so in the scenario. Nothing new is saved; no saved format changes | — |

## Scenarios: to be written first, must fail before

App (`apps/recipe/test/`, a new file): *each edit the mash pH reads returns
the acid* (weight, type, colour, lab figures, add, remove, pick, mash
water); *the others keep it* (name, price, FGDB, a hop, a volume); *Solve
returns it, Undo solve does not bring it back*; *the salts stay*; *the
scale multiplies it*.

## Notes for the builder

- `water-state.js` already returns the acid on a test result, the target and
  (into the mash) the mash water; the malt edits live in `App.jsx`
  (`setRow`, `addRow`, `removeRow`, picks) and `state.js`
  (`withMaltWeights` for Solve).
