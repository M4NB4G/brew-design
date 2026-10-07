# The acid aimed at a mash pH — Tier A + B

Status: landed 2026-10-07 in batch S9, "The acid recommendation is the dose
that brings the predicted mash pH (cooled sample) to the recipe's target, by
the engine's model, for where the acid goes" (AA-Q7 answered by the owner
while building). Agreed 2026-10-02 (RA-1 to RA-5, then AA-Q1 to AA-Q6, each
"agree to all"). Scheduled 2026-10-07 as batch S9, on its own
(docs/ROADMAP.md, Sessions): agreed but never placed in a session until then.
RA-5 answered by the owner, 2026-10-07: his malt measurements come after this
item; it is built on the model's figures as they stand. Written by the S5 item 2
session. Built after batch S5b lands (AS-5, RA-3, `docs/items/mash-ph-acid.md`):
it needs S5b's acid-side slope and, if chosen, acid into the mash.

## Why

The pale styles carry Palmer & Kaminski's targets (*Water*, Table 18):
Pilsner residual alkalinity −40 mg/L as CaCO₃ (alkalinity 2, calcium 50);
Kölsch / Blonde, West Coast IPA and Hazy also −40; Pale Ale, IPA and
Belgian −30. The acid recommendation brings the water to the style's
alkalinity. With the mash pH model (item 2), an all-pale grist at −40
predicts about 5.70 (the owner's West Coast Pilsner), and his logs agree
(most pale batches near the style target read 5.6–5.8): the recommendation
and the 5.2–5.6 warning disagree on almost every pale recipe. The targets
come from Palmer's beer-colour relation; Troester (2009, Conclusion) finds
the common residual-alkalinity relations rest on a misreading of Kolbach,
and a colour proxy cannot know that pale base malt sits at 5.7–5.8.

## Decisions — agreed 2026-10-02 ("agree to all")

| id | Question | Decision | Rule |
|---|---|---|---|
| RA-1 | How to reassess the acid target for pale recipes | The style table is not changed. The acid recommendation aims at a target mash pH through the model; the salts still follow the style's mineral targets | Replacing one published number with one of our own invents a figure; the pH target uses the app's own prediction |
| RA-2 | The target pH | A recipe figure, defaulting to 5.4 (the middle of the agreed 5.2–5.6), changeable per recipe | A default worked out from the agreed range |
| RA-3 | When | After S5b, widening the roadmap's "Acid aimed at a mash pH" | It depends on S5b's acid slope; aiming with the old slope would overdose |
| RA-4 | The style's residual alkalinity | Stays on screen as information (target beside predicted), no longer setting the acid | It still describes the water |
| RA-5 | The owner's malt measurements (AS-6) | Worth doing before relying on the aimed dose: at 5.4 the starting pH's error (±0.2 on the base-malt line) matters most | S5-B13 |

## Sentences — agreed

- **AA-S1** The acid recommendation is the dose that brings the predicted mash pH (cooled sample) to the recipe's target, by the engine's model, for where the acid goes (with the salts or into the mash).
- **AA-S2** The recipe carries a target mash pH, 5.4 by default, entered on the Water tab; a blank target is named and blanks the acid recommendation.
- **AA-S3** The salts still follow the style's mineral targets (calcium, magnesium, sodium, sulfate, chloride); the style's alkalinity and residual alkalinity show as information and no longer set the acid.
- **AA-S4** Changing the target returns the brewer's own acid amounts to the recommendation, as other entries that move the recommendation do (Water tab K).
- **AA-S5** The printed sheet prints the target beside the predicted and the measured mash pH.
- **AA-S6** Nothing else changes: the salts, every recipe figure, and the predicted pH for the same entries.

## Decisions — agreed 2026-10-02 ("agree to all")

| id | Question | Recommended | Rule |
|---|---|---|---|
| AA-Q1 | When the mash pH cannot be predicted (a malt untyped, as in every older recipe until typed) | The acid falls back to the style's alkalinity, as today, with a note naming why ("Aimed at the style's alkalinity: the mash pH needs …") | The Water tab stays useful for an untyped recipe |
| AA-Q2 | A target that needs acid past Troester's tested range | The dose shows, with S5b's tested-range warning; no cap | No number the brewer did not ask for; the warning says what is uncertain |
| AA-Q3 | The predicted pH without acid is already below the target (dark grists) | No acid; the alkalinity-raising salt keeps following the style's alkalinity, as today. Raising to a target pH is a later item | The owner's concern is pale recipes; one behaviour change at a time |
| AA-Q4 | The saved format | Recipe format 8; a format 1–7 recipe reads with the target 5.4. **Revised by the owner, 2026-10-03:** S5b took format 8; this item takes the next recipe format when it is built, and every earlier format reads with the target 5.4. As of 2026-10-07 the recipe format is 11, so this item takes 12 and formats 1–11 read with 5.4 (a figure brought up to date, the owner, 2026-10-07; the decision is unchanged) | Rule 13: every version reads |
| AA-Q5 | A brewery figure (the brewery's usual target)? | No: the recipe's alone; the brewery format does not change (written as "stays 3" on 2026-10-02; it is 6 since My ingredients, brought up to date by the owner, 2026-10-07) | One format change at a time |
| AA-Q6 | Builder and inspector models | Opus at high effort builds; Opus at default effort inspects, a fresh session | The Models rule's default |
| AA-Q7 | Asked while building, 2026-10-07: the style's alkalinity calls for baking soda or pickling lime, but the mash is above the target without it (an amber ale on the example water: 0.33 g of baking soda by the style, then acid to bring the mash back to 5.4) | **The owner, 2026-10-07: acid only.** The acid aims at the target and no alkalinity-raising salt is recommended; at or below the target without it, AA-Q3 as agreed (no acid, the raising salt by the style). The other salts are unchanged | No recommendation adds a base and then an acid that work against each other |
| K | Silent properties | Schema migration (AA-Q4); ordering (AA-S4); idempotence (the dose is the model solved for the target, the same each time) | — |

## Notes for the builder

- The dose is the model solved for the target: the predicted pH is piecewise linear in the acid (S5b item A), so the acid that reaches the target has a closed form in the engine — no search.
- With the acid with the salts, the dose is for the tank's treated volume and only the mash's share lowers the mash pH (the tank's draws); with the acid into the mash (S5b item C), it is for the mash water.
- Files likely touched: `packages/engine/src/water/{mash-ph,solver}.js` and `index.js`; `apps/recipe/src/{water-state,selectors,persistence}.js`; `components/water/SaltsAcidScreen.jsx`, `components/recipe-sheet-data.js`, `RecipeSheet.jsx`; SPEC rules 10 and 13.

## Builder's notes (S9, 2026-10-07)

Choices the sentences did not make, for the inspector to verify:

- **Engine.** `alkalinityForMashPh` (`water/mash-ph.js`) is `mashPh` solved
  for the alkalinity: the pH at zero alkalinity is where the two slopes
  meet, and the target's side picks the slope. `mashPh`'s grist arithmetic
  moved into a shared helper, unchanged in order, so every predicted pH is
  the same bits (AA-S6). `acidForMashPh` (`water/solver.js`) doses as the
  solver's acid step does (88 % lactic, 50.04 mg/L per mEq/L, the volume
  dosed in litres); unlike the solver's step it has no 5 mg/L dead band:
  any alkalinity above the target's is dosed, and none at or below it
  (AA-Q3). `MASH_PH_TARGET` is the engine's `(MASH_PH_RANGE.low +
  MASH_PH_RANGE.high) / 2` (RA-2).
- **The water before the acid** is the salts on screen — the recommendation
  with the brewer's own amounts over it — less the raising salt the style
  recommends (AA-Q7); a raising salt the brewer typed counts. It is the same
  for every place the acid goes (the mash draws the treated water's
  concentration); the dose is for the treated volume with the salts and for
  the mash water into the mash (AA-S1, the item's notes).
- **AA-Q7.** The raising salt's recommendation is 0 only when the aimed dose
  is above zero; the other salts are the solver's as solved, so table salt
  sized with the baking soda's sodium counted stays as it was.
- **AA-S2.** A blank target blanks the dose, and while the brewer follows the
  recommendation also the predicted profile and mash pH (they read the
  acid); the brewer's own acid is still read. The tab names it on its own
  line ("Blank figure the acid recommendation needs: Target mash pH"); the
  line under the stats bar names only the Recipe tab's boxes, as before.
- **AA-Q1.** The fallback note names the malt figures the pH needs and the
  mash water when blank; with none to name it says the pH cannot be worked
  out.
- **Display.** The target is a box on the Acid card (to 0.01); "tgt" beside
  the predicted mash pH tile, as the other tiles; the sheet prints "target"
  as a third line after "predicted" (PL-S3's two lines stay together), as
  typed to 0.01.
- **Earlier scenarios.** Those that pinned the style-aimed dose or format 11
  now pin the aimed dose and format 12 (`acid-in-mash`, the version checks);
  `water-figures` keeps Brew Water Chem's parity with the malts untyped (the
  style's aim, AA-Q1); `mash-ph`'s MP-S8 now holds with the brewer's own
  acid; `inverse-solver`'s "no target saved" excepts the target mash pH; the
  recorded-before snapshots go through `test/acid-aim.js`, which takes only
  the acid's figures and the target from the result.
- **Scenario notes.** AA-S6 passed before the change (a guard that nothing
  else moves). AA-S4's call was corrected after the failure was recorded (it
  passed the brewer's salts as the water); the recorded failure, no step to
  set the target, stands.
- **Roadmap.** Three lines noticed: the kettle salts take the baking soda the
  mash no longer gets (Tier B); a malt or mash water edit keeps the brewer's
  own acid while the recommendation moves (Tier B); the Water Notes still
  describe the acid as neutralizing alkalinity toward the style (Tier C).
