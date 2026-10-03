# Mash pH and the acid — Tier A + B (three items, batch S5b)

Status: agreed 2026-10-02 ("agree to all"). Item A landed: "Acid beyond
the treated mash water's alkalinity lowers the predicted mash pH by
Troester's measured acid-side slope" (its builder's notes below). Item B
landed: "When the water the mash draws or the mash thickness is beyond the
range Troester's model was tested on, the predicted mash pH still shows,
with a note naming the limit crossed, on the Water tab and the printed
sheet" (its builder's notes below). Item C landed: "With the hot-liquor
tank treated, the acid can go into the mash, dosed for the recipe's mash
water, while the salts stay in the tank; recipe format 8" (its builder's
notes below). Written by
the S5 item 2 session after the owner's far-end use of item 2 (below). The
table planned to build the three items on the item 2 branch, `S5-item2`, and
merge them with item 2 as one deploy (G3); the owner reversed G3 on
2026-10-02 and item 2 went live on its own (`main`, 6e229e2), so batch S5b
builds them on branch `S5b` from `main`.

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
| G3 | Merge item 2 as it is, or hold it | Hold: these three are built on the item 2 branch and merge with it, one deploy. **Reversed by the owner, 2026-10-02:** item 2 merged and deployed on its own (`main`, 6e229e2); S5b branches from `main` | The live site should not show a figure that invites overdosing without the guard |
| AS-1 | How acid past neutral counts | Table 3's acid-side slope, the mean of the three grists, 0.0814 pH·L/mEq at 4 L/kg, scaled to the mash thickness by the paper's own rule; only acid beyond the water's alkalinity; calcium and magnesium keep the published slope | Published data; no figure chosen by the builder |
| AS-2 | Re-check against the owner's logs | Re-run the 27 batches and report every difference | MP-S4 |
| AS-3 | Acid into the mash on its own | A choice of where the acid goes, separate from where the salts go; into the mash, no acid goes to the sparge or the kettle; the saved format stays 7 (not shipped). **The format revised by the owner, 2026-10-03:** recipe format 8 (AM-Q1) | The owner does not acidify his sparge (S5-B4'); no acid wasted |
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

Builder's notes (agreed with the table, for the inspector to check): the model's water term splits only when the treated alkalinity is below zero — the published slope times the calcium and magnesium part of the residual alkalinity (Kolbach, the engine's 1.4 and 1.7 in mg/L, over 50.04), plus the acid slope times the (negative) alkalinity in mEq/L; continuous at zero. The constant carries a `// FLAG:`: fitted at 4 L/kg only, its thickness scaling taken from the alkalinity slope by analogy, data only to −5.61 mEq/L. Item 1's batches had at most 53 mL of 10 % phosphoric in 14 gal of water with 50–70 ppm alkalinity; expect few or none to move.

Item A, builder's notes (choices the sentences did not make, for the inspector to check):

- The split is on the treated water's alkalinity below zero, read from the profile the model is given (`Alk`); a blank alkalinity takes the unchanged path and blanks the pH as before. Calcium and magnesium enter through the engine's existing residual-alkalinity function at zero alkalinity, so Kolbach's 1.4 and 1.7 are not written twice.
- The constant is 0.0814 as AS-1 states it (the unrounded mean of the three fits is 0.0813983); the test works the three fits from Table 3's points by hand and checks their mean rounds to it. Its thickness scaling divides by the published slope at 4 L/kg, 0.013 × 4 + 0.013 = 0.065, computed from the published constants rather than written as 0.065.
- AS-S3: no batch moves (every batch keeps some alkalinity after treatment, the lowest 16.2 mg/L); recorded under item 1's table in `docs/items/mash-ph.md`. The batch scenario is unchanged.
- The second scenario, *water with alkalinity left over is unchanged*, passes before and after by design (AS-S2 is a no-change sentence); it adds the case item 1's pins did not cover, alkalinity left over with calcium taking the residual alkalinity below zero, and the meeting at zero. The recorded failure is the first scenario's.
- No SPEC rule changes: rule 2 covers the new constant, rule 3 its FLAG, and rule 10 already says the predicted pH comes from the engine.

## Item B — the tested range (Tier A + B)

Sentences:

- **TR-S1** When the residual alkalinity of the water the mash draws is below −5.61 or above +14.3 mEq/L (Troester's Table 3), or the mash thickness is outside 2–5 L/kg (Tables 15 and 16), the predicted mash pH still shows, with a warning naming the limit crossed: "Beyond the range the model was tested on (Troester 2009): …; this prediction is unreliable." The ends are inside.
- **TR-S2** The printed sheet carries the same note beside the predicted pH.
- **TR-S3** Nothing else changes: a warning, no figure moves.

Silent property: none new (nothing saved).

Scenarios (`apps/recipe/test/mash-ph.test.js`, describe "the tested range"): *beyond the tested range the predicted pH warns* (the owner's West Coast Pilsner at 35 mL of 75 % phosphoric, −7.8 mEq/L by hand; each edge inside; a thickness of 1.9 and 5.1 L/kg); *the printed sheet carries the note*; *nothing else changes*.

Builder's notes: the limits are engine constants beside the model (as the cooled-sample range), pinned with literals from the paper's tables; the check reads the water the mash draws (item C's mash water when the acid goes into the mash).

Item B, builder's notes (choices the sentences did not make, for the inspector to check):

- The engine gains the limits beside the model (residual alkalinity −5.61 to 14.3 mEq/L, thickness 2 to 5 L/kg), a check of the two figures against them, and the same check worked from the model's own entries (malts, mash water, water). The mash thickness is worked by one helper the model now shares, the same arithmetic as before. That makes the commit Tier A + B.
- The residual alkalinity checked is the Water tab's (Kolbach, with calcium and magnesium) of the water the model reads, in mEq/L; Table 3's waters had no hardness, so there it equals the alkalinity. Until item C that water is the treated profile.
- The note shows only while the predicted pH shows; a blank pH carries none. Each limit crossed is named, residual alkalinity first, as "residual alkalinity below −5.61 mEq/L" or "mash thickness above 5 L/kg", joined by a comma, inside the sentence TR-S1 gives.
- The note's words are built once, in a new helper beside the Water tab's components (`components/water/tested-range-note.js`, a file the item did not name), so the tab and the sheet print the same words.
- On the printed sheet the note sits in the mash pH row, after the measured box, in the sheet's small grey italic.
- The edges are pinned on the engine's check with the literals; the West Coast Pilsner's 1.9 and 5.1 L/kg come from mash water worked by hand (4.5534 and 12.2223 gal for 20 lb).

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
| AM-Q1 | The saved format | Stays 7: format 7 has not shipped. A version-7 document without the choice (the owner's file of 2026-10-02 from the item 2 build) reads with the acid with the salts. **Revised by the owner, 2026-10-03** (format 7 shipped with item 2): recipe format 8; a version-1 to 7 document reads with the acid with the salts and is saved back as 8 | No recipe the owner saved is refused; one shape per format, and an older page still open refuses a format-8 file rather than dropping the choice |
| AM-Q2 | A brewery figure? | No: the recipe's alone for now; the brewery format stays 3 | One format change at a time |
| AM-Q3 | The default | With the salts, today's behaviour | Every existing recipe unchanged (AM-S6) |

Silent property: **schema** — the water entries gain one choice inside unshipped format 7 (AM-Q1); a version-1 to 6 document reads with the default. Ordering, multi-tab, storage disabled: as today.

Scenarios (`apps/recipe/test/acid-in-mash.test.js`): *the acid can go into the mash* (the West Coast Pilsner: the recommendation for 8 gal of mash water by hand; the sparge carries no acid; the mash water's profile and pH); *with the salts nothing changes*; *a recipe saved without the choice reads with the acid with the salts*; *the printed sheet names the place*.

Builder's notes: files likely touched — `apps/recipe/src/{water-state,selectors,persistence}.js`, `components/water/{SaltsAcidScreen,WaterGoesCard}.jsx`, `components/recipe-sheet-data.js`, `RecipeSheet.jsx`; possibly an engine function for a profile with salts over one volume and acid over another (then Tier A + B). SPEC rules 8, 10 and 13 change.

Item C, builder's notes (choices the sentences did not make, for the inspector to check):

- No engine function: Tier B. The water the mash draws is two of the engine's own profile calls in the selector — the tank's salts over the tank's volume, then that water's figures as the source with the acid over the mash water — so nothing is worked out in the app. The recommended acid is the engine's solver run for the mash water's volume: its salts are a concentration, so the alkalinity to take out is the tank's, dosed for the mash water. The salt recommendation stays the tank's.
- The choice is `acidPlace` in the water entries, `'salts'` or `'mash'`; with the mash water treated (or one vessel) only `'salts'` is offered and used, whatever is saved. On the Water tab it is a fourth choice, "Acid", beside Vessels, Sparge and Treat, shown only with the tank treated: "With the salts (HLT)" or "Into the mash".
- Changing where the acid goes returns the acid to the recommendation and keeps the brewer's salts (the acid is dosed for a different water); with the acid into the mash, a change to the recipe's mash water does the same for the acid alone, as the mash-water treatment does for both.
- With the acid into the mash and the mash water blank there is no acid dose, no predicted profile and no predicted pH (the profile cannot be worked out without the volume the acid goes in); the blank mash water is named by the tab's existing line.
- On screen into the mash: the acid card says "The acid goes into the mash; the sparge and the water left in the HLT carry none." in place of the HLT notice, and the profile card is titled "The water the mash draws (the treated HLT water with the acid)". The draws in the Where the Water Goes card list salts only, as before.
- Format 8 (AM-Q1 revised): versions 1 to 7 read with `'salts'`; a version-8 document without the choice, or with another value, is refused like any damaged water entry. Older tests that pinned "saved back as version 7" now say 8, as item 2 moved them from 6 to 7 (identity, options, recipe-file, sparge-typed, water-saved, yeast-card, mash-ph tests: the version figures and their scenario names only).
- Not a brewery figure (AM-Q2): the brewery's water figures are a fixed list that does not include it, so a new recipe starts with the acid with the salts; the brewery format stays 3.
- Noticed while building, to the roadmap (Tier C): liquid acid shows to whole mL, so the West Coast Pilsner's 2.42 mL into the mash shows "2".

## The owner's case, for the scenarios

`Home Grown WC Pils` (the owner's export, 2026-10-02): Pilsner Northstar 12 lb (2 °L), Pilsner Weyermann 7 lb (1.8 °L), Carafoam 1 lb (2 °L), all base; mash water 8 gal; the example report (Ca 8, Mg 2, Na 22, SO₄ 0, Cl 20, alkalinity 50, pH 7.2); Pilsner / Light Lager; tank 14 gal, topped up to 12; fly sparge 10 gal; kettle salts on; grain absorption 0.1 qt/lb; 75 % phosphoric 35 mL (the recommendation 4.24 mL; 10 % 47.66 mL). Item 2 predicts 5.70 at the recommendation and 5.30 at 35 mL.
