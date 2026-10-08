# Engine corrections — three Tier A items, batch S10a

Status: draft 2026-10-08, awaiting the owner's reply; not started.
Written by the session that wrote the References page's scope table; built
in batch S10a, before S10b (docs/ROADMAP.md, Sessions; RF-Q11). Items in
this order: the boil factor, Morey's coefficients, the IBU conversion.

## Why

Reviewing the equations for the References page (2026-10-08), the owner
found three figures to correct: the 1.01 in the boil concentration is a
temperature allowance the 60 °F volume correction now makes redundant
(RF-Q6); Morey (1998) prints 1.4922 and 0.6859, not the 1.49 and 0.69 the
engine uses (RF-Q7); and the IBU converts oz/gal to mg/L by 7500 where the
exact factor is 7489 (RF-Q9, RF-Q12). Each departs from the Recipe Designer
Rev 3 on its author's word (SPEC rule 2). On the engine's reference recipe
(the golden master), measured by a probe on 2026-10-08: OG 1.06813 becomes
1.06885, ABV 7.49 % becomes 7.58 %, SRM 4.124 becomes 4.105, the Bravo
addition's IBU 23.511 becomes 23.477 (with 7489.0; the exact factor gives
a value the builder works by hand).

## Item 1 — Boil concentration without the 1.01

- **EC1-S1** The original gravity is the pre-boil °P concentrated by the ratio of the pre-boil to the post-boil volume, both at 60 °F, with no other factor.
- **EC1-S2** Design to target OG inverts the same step, so a grain bill solved to a target gives that target back, within the residual the two Plato conversions already leave.
- **EC1-S3** FG, ABV, cells needed and the starter options follow the new OG. The pre-boil gravity, every IBU (read at the pre-boil gravity), the colour, the water and the mash pH do not change.
- **EC1-S4** SPEC rule 2 records the departure from Rev 3, with the owner's reason and date.

## Item 2 — Morey's coefficients

- **EC2-S1** Colour is SRM = 1.4922 × MCU^0.6859 (Morey 1998), in place of 1.49 × MCU^0.69.
- **EC2-S2** Nothing but the SRM and what is drawn from it (the colour swatch) changes.
- **EC2-S3** SPEC rule 2 records the departure from Rev 3.

## Item 3 — The IBU conversion

- **EC3-S1** Each addition's IBU converts oz/gal to mg/L by the exact factor, the ounce in grams times 1000 over the gallon in litres (7489.1), in place of 7500. Every IBU reads 0.145 % lower; a total near a half may round one IBU lower.
- **EC3-S2** Nothing but the IBUs changes; utilization and the whirlpool factor are unchanged.
- **EC3-S3** SPEC rule 2 records the departure from Rev 3.

## Decisions — proposed, for the owner

| id | Question | Recommended | Rule |
|---|---|---|---|
| EC-Q1 | The golden master's Rev 3 values | Each changed value is replaced by one worked by hand, the working beside it in the test, and the Rev 3 value kept in a comment as the record of the departure. Tolerances unchanged | SPEC rule 4; CLAUDE.md, Models (a number whose rule is a published constant needs a hand pin) |
| EC-Q2 | Where the IBU's 7489 comes from | Built from the engine's own unit factors (grams per ounce, litres per gallon), so no new figure is typed | Definitional unit factors; no rounded constant |
| EC-Q3 | Saved recipes | No change to any saved file; they open showing the new figures, since figures are worked out, never saved. A grain bill solved to a target before S10a shows about 1 % more gravity points; Solve again to return to the target. No notice in the app | The recipe holds inputs, not results (SPEC rule 8) |
| EC-Q4 | Order and commits | The boil factor, then Morey, then the IBU; one commit each, a fresh inspector each | CLAUDE.md, Batches |
| EC-Q5 | Before the References page | S10a lands before S10b is built, so the page shows these equations (RF-Q11, RF-Q13) | One set of equations on the page |
| M1 | Builder model | Opus, high effort | CLAUDE.md, Models (default; engine items stay on Opus) |
| M2 | Inspector model | Opus, default effort, a fresh subagent per item | CLAUDE.md, Models |
| Silent property | What does this depend on that nobody decided? | Saved recipes: unchanged, figures shift on open (EC-Q3). Printed sheets already printed keep the old figures. Cells needed can move across a starter band, so a recipe may be offered a different starter. No storage, ordering or multi-tab question: nothing saved changes | — |

## Scenarios — to be written first, must fail before

`packages/engine/test/engine-corrections.test.js`: *the original gravity is
the pre-boil °P concentrated by the volume ratio alone*; *a grain bill
solved to a target OG gives that target back*; *colour is Morey's 1.4922 and
0.6859*; *the IBU converts by the exact ounce and gallon*. Each with a
hand-worked value and its working. The golden master's changed rows follow
EC-Q1.

## Notes for the builder

- The 1.01 lives twice: `packages/engine/src/grist.js` (the forward step) and `packages/engine/src/solver.js` (its inverse). Change both in item 1, or the round trip breaks.
- Morey is `grist.js`'s SRM line; the IBU is `hops.js`'s `(75 / postBoilVolGal) * 100`. `G_PER_OZ` and `LITERS_PER_GALLON` are in `units.js`.
- The probe (2026-10-08) with all three changed: engine 10 failures (golden master: postBoilPlato, OG, FG, ABV, SRM, Bravo IBU; the solver round trip's four), app suite 256/256 passing. Each item's own failures are a subset; record each item's alone.
- `solver.js`'s FLAG quotes the round trip's residual (~29.013 lb); update it with item 1 if it moves, and the solver test's pinned residual with it.
- The roadmap line "Solve with volumes measured hot" quotes OG figures worked with the 1.01 (1.0494, 1.0497); refresh them in item 1's commit (procedure step 3).
- The References page (S10b) is built after this batch: its item file's RF-S6 already says the page shows the engine's equations as they stand then.
- Far end: the built app on the built-in recipe, OG, ABV, SRM and IBU before and after each item, and the printed sheet.

## Builder's notes

(none yet)
