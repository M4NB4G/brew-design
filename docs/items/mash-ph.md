# Mash pH from the grain bill — Tier A + B (two items)

Status: agreed 2026-10-02 ("agree to all"), not started. Written by the
S4 session; to be built in batch S5
(docs/ROADMAP.md, Sessions) before **Sparge acidification**
(`docs/items/sparge-acid.md`). Water program step 5
(`docs/items/water-program.md`: WP8 the model, WP9 the check against the
owner's logs).

## Why

Brew Water Chem doses acid against alkalinity and says it does not predict
mash pH: that needs the grain bill. Brew Design has the grain bill. The
mash pH is what the water treatment is for, and the figure a brewer checks
with a meter on brew day (the printed sheet now has the box for it).

## Sentences — what must be true afterwards

- **MP-S1** The Water tab shows the predicted mash pH, as a cooled sample reads, worked out from the grain bill, the treated mash water and its salts, and the acid in the mash.
- **MP-S2** Each malt's part comes from its type (base, crystal, roast, acidulated) and its colour by the published model (Troester/Kaiser), cited beside each figure; a malt with lab-measured figures (its distilled-water mash pH and its buffering) uses those instead.
- **MP-S3** The owner's ingredient workbook gains a malt-type column and two optional lab columns; picking a malt copies its type and lab figures into the recipe, as its other figures are copied; a malt typed by hand has its type chosen by the brewer.
- **MP-S4** The model's figures are checked against the owner's logged mash pH for his past batches (cooled samples); each batch's predicted and measured pH and their difference are recorded in this file and pinned by a test.
- **MP-S5** A blank figure the model needs (a malt's type or weight, the mash water, a test result) blanks the predicted pH, shows "—", and is named.
- **MP-S6** The printed sheet prints the predicted mash pH beside the measured mash pH box.
- **MP-S7** A recipe saved before malt types (saved format 6 or earlier; S4b moved it to 6) loads as the same recipe with each malt's type as MP-Q8 decides, and is saved back at the next version.
- **MP-S8** Nothing else changes: every other recipe and water figure is the same for the same entries.

## Decisions — agreed

| id | Question | Decision | Rule |
|---|---|---|---|
| M1 | Builder model | Opus, high effort | The Models rule's default (2026-09-23) |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default |
| MP-Q1 | One item or two | Two, built in this order: (1) the model in the engine and its check against your logs (no screen yet); (2) the malt types in the workbook and the recipe, the figure on the Water tab and the sheet, the saved format | Numbers before what shows and saves them; each item deploys alone |
| MP-Q2 | The malt types | Four: base (pale, Pilsner, Munich, Vienna, wheat — any kilned malt), crystal/caramel, roast (roasted malt and barley, chocolate, black), acidulated. You set each malt's type in your workbook | The model has a different rule for each family; wheat and Munich follow the base-malt rule by colour |
| MP-Q3 | Where the model's figures come from | Kai Troester's published mash pH model (braukaiser.com, 2009–2010) — each malt family's distilled-water pH from its colour and its buffering — transcribed as published, cited beside each figure, each pinned by a value worked out by hand. No figure chosen by the builder | SPEC rule 2: every constant reproduced as published; CLAUDE.md hand-pin rule |
| MP-Q4 | Your lab-measured malt figures | Two optional columns in the workbook (distilled-water mash pH; buffering, mEq per kg per pH); where both are filled, they replace the model's for that malt | WP8 as agreed |
| MP-Q5 | Acidulated malt counted twice? | The Water tab's acidulated-malt acid addition is the acid; an acidulated malt row in the grain bill is counted by its lactic acid too. If you list it in both places it is counted twice — so the Water tab warns when the grain bill has an acidulated malt and the Water tab's acid is also acidulated malt | Each gram of acid counted once; the brewer decides where it is listed |
| MP-Q6 | Which water the model uses | The treated mash water, as the Water tab predicts it (its calcium, magnesium and alkalinity after salts and acid), at the recipe's mash water volume — the same for mash-water and tank treatment, since the mash draws the treated water | WP6b: the mash is well mixed; S4's treated profile |
| MP-Q7 | Phosphoric acid's strength | Keep it as today (one proton, as at mash pH 5.4) for the dose and the profile; the model uses the same figure, so the screen stays consistent | Change one thing at a time; a later item can refine it |
| MP-Q8 | An older recipe's malts (no type saved) | Each malt row loads with its type blank; the Water tab names them and shows "—" until the brewer picks types (picking the malt again from the list fills it) | SPEC 16: the recipe never refers back to the ingredient list; no number the brewer did not enter |
| MP-Q9 | Does the acid recommendation aim at a mash pH? | Not in this item: the recommendation stays as today (to the style's residual alkalinity); the predicted pH is shown beside it. Aiming the acid at a target pH is a roadmap line for later | One behaviour change at a time; the model is checked against your logs first |
| MP-Q10 | A mash pH range warning | Yes: a warning when the predicted pH is outside the range your logs and Palmer & Kaminski give for a cooled sample (5.2–5.6), the range cited beside it | A warning changes no number; the range is a published figure |
| MP-Q11 | Checking against your logs (MP-S4) | You supply at least five past batches (grain bill, water report, salts and acid, measured cooled mash pH). The builder reports each difference; no pass/fail line is set by the builder — you judge the result before item 2 is built | WP9; the model is only as good as its check, and the judgment is yours |
| MP-Q12 | Where the figure shows | The Water tab's Salts & Acid screen, at the top of the predicted profile card ("Predicted mash pH (cooled sample)"), and on the printed sheet beside the measured box. Not in the stats bar | The stats bar holds the recipe's figures; the water figures stay on the Water tab |
| K | Silent properties | **Schema migration:** malt rows gain a type and two lab figures — recipe format 7 — S4b took 6 (MP-Q8 for older rows). **Ingredient refresh:** the refresh tool and the ingredient test change (Tier B by CLAUDE.md, Ingredient data). **Ordering, multi-tab, storage disabled:** as today. **Idempotence:** the model is pure; same entries, same pH | — |

## Scenarios — to be written first, must fail before

Item 1 (`packages/engine/test/water/mash-ph.test.js`): *each malt family's
figures are the published ones* (hand pins); *the mash pH balances the
grain, the water and the acid* (a worked batch by hand); *lab figures
replace the model's*; *a blank figure blanks the pH*; *the owner's logged
batches* (each predicted figure pinned, the measured beside it).

Item 2 (`apps/recipe/test/mash-ph.test.js`, the ingredient test): *picking
a malt copies its type and lab figures*; *the Water tab shows the predicted
mash pH*; *an older recipe loads with its malt types blank and named*;
*the printed sheet prints the predicted pH beside the measured box*;
*nothing else changes*.

## Notes for the builder

- Needs from the owner before item 1: his logged batches (MP-Q11), and the
  malt-type column filled in his workbook before item 2.
- Files likely touched: `packages/engine/src/water/mash-ph.js` (new),
  `index.js`, engine test; `data/Brew Design Ingredients.xlsx` (owner),
  `apps/recipe/scripts/*`, `ingredients.json`, `apps/recipe/test/ingredients.test.js`,
  `apps/recipe/src/{state,persistence,selectors,display}.js`, `App.jsx`,
  `components/GristTable.jsx`, `components/water/SaltsAcidScreen.jsx`,
  `components/recipe-sheet-data.js`, `RecipeSheet.jsx`, `SPEC.md` (rules 8,
  13, 16), `docs/TEST_COVERAGE.md`.
