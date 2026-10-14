# Grain bill edits return the brewer's own acid to the recommendation, Tier B

Status: agreed 2026-10-14 ("agree to all", GA-Q1 to GA-Q4, M); landed
2026-10-14 as "An edit the predicted mash pH reads returns the brewer's own
acid to the recommendation: a malt's weight, type, colour or lab figures, a
malt added or removed, Solve, and the mash water; the salts stay". Written by
the S15c session; built in batch S17, item 3 (docs/ROADMAP.md, Sessions).

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
| GA-Q5 | With the mash water treated, does a mash water edit still return the brewer's own salts (water treatment K), against GA-S4's "every such edit"? | Yes: the salts reset as before; every other grain bill edit, and the mash water with the HLT treated, returns only the acid | The salts were dosed for the treated volume (the owner, 2026-10-14, asked while building after inspection round 1) |
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

## Builder's notes (S17, 2026-10-14)

Choices the sentences did not make, each a claim for the inspector:

- **Which malt figures.** The ones the engine's `mashPh` reads: weight,
  type, colour, distilled-water pH and acidity (`MASH_PH_MALT_FIELDS` in
  `water-state.js`). The lab figures have no box of their own; they change
  through a pick or a type chosen by hand, both covered.
- **Where.** `water-state.js` gains `grainBillChanged` (the acid back to the
  recommendation, the salts kept); `App.jsx`'s row setter calls it for a
  malt figure in that list, its add and remove for a malt, and Solve's new
  recipe carries it, so the acid returns in the same step and autosave as
  the edit (K). `mashWaterChanged` now returns the acid with the HLT
  treated whatever the acid's place; with the mash water treated it keeps
  returning salts and acid, the treated volume's rule (water treatment K):
  put to the owner after FAIL round 1 and kept (GA-Q5), marked `// FLAG:`.
- **A pick.** The ingredient box writes only the figures a pick changes;
  since FAIL round 1 it also tells the page of every pick (`onPick`, passed
  by the Grist table for malts only), so a pick returns the acid even when
  it leaves every figure the pH reads as it was (K).
- **Idempotence (K).** A keystroke that leaves the box's text as it was
  fires no edit in a browser (React drops it), so "the same weight" is
  modelled as the brewer retypes it: the box cleared, then the same figure;
  the weight ends as it was and the acid has returned.
- **Undo solve.** It puts back the weights only; the acid stays the
  recommendation (GA-Q2).
- **The linter.** The new jsdom scenario is added to `eslint.config.js`'s
  list of tests that draw the whole app (tooling, so `npm run lint` reads
  the browser's globals there).
- **FAIL round 1.** The inspector: (1) a pick that left every figure the
  pH reads as it was kept the acid, against GA-S1 and K; (2) the mash water
  treated, a mash water edit returned the salts, against GA-S4's text, with
  no ruling. Changed after it: every malt pick now returns the acid
  (`IngredientSearch`'s `onPick`, `GristTable`, `App.jsx`), with a scenario
  of its own; the owner ruled on (2), GA-Q5, kept as built, with a
  `// FLAG:` and a scenario. Both new scenarios were added after the
  recorded failure; on the unchanged code the pick fails ("a pick, pH
  figures unchanged: expected { phosphoric_10: +0, …(4) } to be null") and
  GA-Q5 holds (the rule it pins is the old one).
- **Recorded failure.** 3 of 6: GA-S1 "a weight: expected { phosphoric_10:
  +0, …(4) } to be null", GA-S1 (mash water) "mash water, HLT treated, acid
  with the salts: expected { phosphoric_10: +0, …(4) } to be null", GA-S3
  "Solve: expected { phosphoric_10: +0, …(4) } to be null"; GA-S2, GA-S5
  and GA-S6 are guards that held. After recording, "the same weight" edit
  was rewritten (cleared, then retyped) when a same-text keystroke proved to
  fire no edit; re-run on the unchanged code, the same 3 of 6 fail with the
  same lines.
