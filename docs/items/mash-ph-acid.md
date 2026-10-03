# Mash pH and the acid — Tier A + B (three items, batch S5b)

Status: agreed 2026-10-02 ("agree to all"), not started. Written by the S5
item 2 session after the owner's far-end use of item 2 (below). Batch S5b
builds the three items in order on the item 2 branch, `S5-item2`, so that
item 2 and these three merge as one deploy (G3).

## Why

The owner opened his West Coast Pilsner (20 lb of pale malt, 8 gal of mash
water, the example report, the hot-liquor tank treated at 14 gal) and added
acid until the predicted mash pH read 5.3: 35 mL of 75 % phosphoric, about
8 times the recommendation (4.2 mL). Three things showed:

- The model counts acid beyond the water's alkalinity on the published
  straight line (0.013 × R + 0.013), fitted over Troester's whole alkalinity
  range. His own acid-side data (paper, Table 3, three grists at 4 L/kg)
  are steeper near zero: least-squares slopes over the four points from
  residual alkalinity 0 to −5.61 mEq/L are 0.0961 (100 % Pilsner), 0.0735
  (50/50 Pilsner/Munich I) and 0.0746 (85/15 Pilsner/CaraMunich II) pH·L/mEq,
  mean 0.0814, against the model's 0.065.
- 35 mL takes the treated water to −7.8 mEq/L, past the most acidic water
  Troester tested (−5.61 mEq/L); nothing on screen says so.
- With the tank treated, the acid is shared like the salts: 57 % reaches the
  mash, the rest goes to the sparge or stays in the tank. To lower the mash
  pH, most of a large dose is wasted, and the sparge is acidified (the owner
  does not acidify his sparge, S5-B4').

Phosphoric acid's second proton is not the cause: at mash pH 5.2–5.6 it is
1.0–2.5 % released (pKa₂ 7.20); counting one proton (MP-Q7) is off by at
most 3 %.

## Decisions — agreed 2026-10-02 ("agree to all")

| id | Question | Decision | Rule |
|---|---|---|---|
| G1 | Say when the treated water is past the model's tested range | Yes: a warning beside the predicted pH, the number still shown (item B) | A figure the model cannot support should not look as solid as one it can |
| G2 | Count acid past neutral by Troester's measured acid side | Yes (item A), built next, before aiming the acid at a pH | Aiming the acid (MP-Q9) is only as good as the acid slope |
| G3 | Merge item 2 as it is, or hold it | Hold: these three are built on the item 2 branch and merge with it, one deploy | The live site should not show a figure that invites overdosing without the guard |
| AS-1 | How acid past neutral counts | Table 3's acid-side slope, the mean of the three grists, 0.0814 pH·L/mEq at 4 L/kg, scaled to the mash thickness by the paper's own rule; only acid beyond the water's alkalinity; calcium and magnesium keep the published slope | Published data; no figure chosen by the builder |
| AS-2 | Re-check against the owner's logs | Re-run the 27 batches and report every difference | MP-S4 |
| AS-3 | Acid into the mash on its own | A choice of where the acid goes, separate from where the salts go; into the mash, no acid goes to the sparge or the kettle; the saved format stays 7 (not shipped) | The owner does not acidify his sparge (S5-B4'); no acid wasted |
| AS-4 | The tested-range warning | Beyond −5.61 or +14.3 mEq/L of residual alkalinity (Table 3), or a mash thickness outside 2–5 L/kg (Tables 15, 16) | G1 |
| AS-5 | Aiming the acid at a target pH (MP-Q9) | Next, after these three land | One behaviour change at a time |
| AS-6 | The owner's base malts' distilled-water pH | Optional, when he can: he measures Northstar and Weyermann Pilsner by Troester's method (12.5 g finely ground malt in 50 g distilled water, 10 min at 63–65 °C, cooled before reading) into the workbook's existing column | S5-B13; the largest error in the prediction |
| M1 | Builder model | Opus, high effort | The Models rule's default |
| M2 | Inspector model | Opus, default effort, a fresh session, for each item | The Models rule's default |

## Item A — acid past neutral (Tier A)

Sentences:

- **AS-S1** Acid beyond the treated mash water's alkalinity lowers the predicted mash pH by Troester's measured acid-side slope: 0.0814 pH·L/mEq at 4 L/kg (Table 3, the mean of the three grists' least-squares slopes from 0 to −5.61 mEq/L), scaled to the mash thickness R in proportion to the published slope, 0.0814 × (0.013 × R + 0.013) / (0.013 × 4 + 0.013). Calcium and magnesium lower it by the published slope, as today.
- **AS-S2** Treated water with alkalinity left over is predicted exactly as before; at zero alkalinity the two rules give the same pH.
- **AS-S3** The check against the owner's 27 logged batches is re-run; every batch whose prediction moves is recorded in `docs/items/mash-ph.md` with its old and new figure; no pass/fail line.

Silent property: idempotence (pure, as item 1). Nothing saved changes.

Scenarios (`packages/engine/test/water/mash-ph.test.js`): *acid past neutral counts by the acid-side slope* (the three Table 3 fits worked by hand from the table's points, their mean, a worked batch at 4 L/kg and at another thickness); *water with alkalinity left over is unchanged* (item 1's pins stand); *the owner's logged batches* (re-pinned by hand where they move).

Builder's notes (for the inspector to check): the model's water term splits only when the treated alkalinity is below zero — the published slope times the calcium and magnesium part of the residual alkalinity (Kolbach, the engine's 1.4 and 1.7 in mg/L, over 50.04), plus the acid slope times the (negative) alkalinity in mEq/L; continuous at zero. The constant carries a `// FLAG:`: fitted at 4 L/kg only, its thickness scaling taken from the alkalinity slope by analogy, data only to −5.61 mEq/L. Item 1's batches had at most 53 mL of 10 % phosphoric in 14 gal of water with 50–70 ppm alkalinity; expect few or none to move.

## Item B — the tested range (Tier A + B)

Sentences:

- **TR-S1** When the residual alkalinity of the water the mash draws is below −5.61 or above +14.3 mEq/L (Troester's Table 3), or the mash thickness is outside 2–5 L/kg (Tables 15 and 16), the predicted mash pH still shows, with a warning naming the limit crossed: "Beyond the range the model was tested on (Troester 2009): …; this prediction is unreliable." The ends are inside.
- **TR-S2** The printed sheet carries the same note beside the predicted pH.
- **TR-S3** Nothing else changes: a warning, no figure moves.

Silent property: none new (nothing saved).

Scenarios (`apps/recipe/test/mash-ph.test.js`, describe "the tested range"): *beyond the tested range the predicted pH warns* (the owner's West Coast Pilsner at 35 mL of 75 % phosphoric, −7.8 mEq/L by hand; each edge inside; a thickness of 1.9 and 5.1 L/kg); *the printed sheet carries the note*; *nothing else changes*.

Builder's notes: the limits are engine constants beside the model (as the cooled-sample range), pinned with literals from the paper's tables; the check reads the water the mash draws (item C's mash water when the acid goes into the mash).

## Item C — acid into the mash (Tier B, A if the engine needs a function)

Sentences:

- **AM-S1** With the hot-liquor tank treated, the Water tab offers where the acid goes: with the salts (the tank's first fill, as today) or into the mash. With the mash water treated the choice is not shown (they are the same water).
- **AM-S2** Into the mash: the recommendation is the acid that brings the mash water's alkalinity to the style's target, dosed for the recipe's mash water volume; the salts stay in the tank as today.
- **AM-S3** Into the mash: the sparge and the tank's leftover carry no acid; the predicted profile card shows the water the mash draws (the treated tank water with the acid), and the predicted mash pH reads it.
- **AM-S4** The printed sheet names the acid's place: "Mash" or "HLT".
- **AM-S5** The choice is saved with the recipe's water entries; a new recipe, and a saved recipe without it, has the acid with the salts. It is not a brewery figure.
- **AM-S6** With the acid with the salts, every figure is as before.

Decisions:

| id | Question | Decision | Rule |
|---|---|---|---|
| AM-Q1 | The saved format | Stays 7: format 7 has not shipped. A version-7 document without the choice (the owner's file of 2026-10-02 from the item 2 build) reads with the acid with the salts | No recipe the owner saved is refused |
| AM-Q2 | A brewery figure? | No: the recipe's alone for now; the brewery format stays 3 | One format change at a time |
| AM-Q3 | The default | With the salts, today's behaviour | Every existing recipe unchanged (AM-S6) |

Silent property: **schema** — the water entries gain one choice inside unshipped format 7 (AM-Q1); a version-1 to 6 document reads with the default. Ordering, multi-tab, storage disabled: as today.

Scenarios (`apps/recipe/test/acid-in-mash.test.js`): *the acid can go into the mash* (the West Coast Pilsner: the recommendation for 8 gal of mash water by hand; the sparge carries no acid; the mash water's profile and pH); *with the salts nothing changes*; *a recipe saved without the choice reads with the acid with the salts*; *the printed sheet names the place*.

Builder's notes: files likely touched — `apps/recipe/src/{water-state,selectors,persistence}.js`, `components/water/{SaltsAcidScreen,WaterGoesCard}.jsx`, `components/recipe-sheet-data.js`, `RecipeSheet.jsx`; possibly an engine function for a profile with salts over one volume and acid over another (then Tier A + B). SPEC rules 8, 10 and 13 change.

## The owner's case, for the scenarios

`Home Grown WC Pils` (the owner's export, 2026-10-02): Pilsner Northstar 12 lb (2 °L), Pilsner Weyermann 7 lb (1.8 °L), Carafoam 1 lb (2 °L), all base; mash water 8 gal; the example report (Ca 8, Mg 2, Na 22, SO₄ 0, Cl 20, alkalinity 50, pH 7.2); Pilsner / Light Lager; tank 14 gal, topped up to 12; fly sparge 10 gal; kettle salts on; grain absorption 0.1 qt/lb; 75 % phosphoric 35 mL (the recommendation 4.24 mL; 10 % 47.66 mL). Item 2 predicts 5.70 at the recommendation and 5.30 at 35 mL.
