# The acid aimed at a mash pH — Tier A + B

Status: agreed 2026-10-02 (RA-1 to RA-5, then AA-Q1 to AA-Q6, each "agree
to all"); not started. Scheduled 2026-10-07 as batch S9, on its own
(docs/ROADMAP.md, Sessions): agreed but never placed in a session until then.
Before building, the owner answers RA-5 (his malt measurements before or after
this item). Written by the S5 item 2
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
| K | Silent properties | Schema migration (AA-Q4); ordering (AA-S4); idempotence (the dose is the model solved for the target, the same each time) | — |

## Notes for the builder

- The dose is the model solved for the target: the predicted pH is piecewise linear in the acid (S5b item A), so the acid that reaches the target has a closed form in the engine — no search.
- With the acid with the salts, the dose is for the tank's treated volume and only the mash's share lowers the mash pH (the tank's draws); with the acid into the mash (S5b item C), it is for the mash water.
- Files likely touched: `packages/engine/src/water/{mash-ph,solver}.js` and `index.js`; `apps/recipe/src/{water-state,selectors,persistence}.js`; `components/water/SaltsAcidScreen.jsx`, `components/recipe-sheet-data.js`, `RecipeSheet.jsx`; SPEC rules 10 and 13.
