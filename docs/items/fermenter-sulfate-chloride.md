# The fermenter's sulfate and chloride with water back on, Tier A + B

Status: agreed 2026-10-14 ("agree to all", FM-Q1r, FM-Q3 to FM-Q6r,
FM-Q8 to FM-Q10, M; FM-Q1 and FM-Q2 of 2026-10-13 replaced by FM-Q1r and
FM-Q6r on the owner's word); not started. Written by the S15c session;
built in batch S17, item 1 (docs/ROADMAP.md, Sessions).

## Why

With water back on, the brewer needs to know whether the water in the
fermenter still meets the style's sulfate and chloride, or whether more
salt is needed (the owner, 2026-10-14). The style's targets are
brewing-water targets and do not count the malt; the kettle water is
brought to them before the boil, and the boil concentrates it. Water back
dilutes it again: untreated water back up to the boil-off only gives back
the boil's concentration, and only more than that (high-gravity brewing),
or weaker water, leaves the fermenter below the target. The built-in
recipe, pre-boil 7 gal, post-boil 5.5 gal, kettle water at a 150 mg/L
sulfate target, untreated water back:

| Water back | Fermenter sulfate |
|---|---|
| none | 150 × 7 ÷ 5.5 = 190.9 mg/L |
| 1 gal | 150 × 7 ÷ 6.5 = 161.5 mg/L |
| 1.5 gal (the boil-off) | 150 × 7 ÷ 7.0 = 150.0 mg/L |
| 3 gal | 150 × 7 ÷ 8.5 = 123.5 mg/L, short |

The malt's own chloride is not small (reported at 60 to 200 mg/L in wort:
Palmer citing Ballast Point, via Precision Fermentation; Montana State's
barley program, 60 to 122 mg/L by growing site; secondhand, the pages not
read by the builder), but it is in the wort with or without the water back
and the targets do not count it, so the comparison leaves it out on both
sides (FM-Q6r).

## Sentences: what must be true afterwards

- **FM-S1** With water back on, the Water tab's Salts & Acid screen shows the fermenter's sulfate, chloride and SO₄:Cl ratio from the water and salts only, beside the style's targets with the usual near / far marks, labelled "Water and salts only; the style targets do not count the malt either."
- **FM-S2** They are worked as: the kettle water before the boil (the source water plus the salts that reach the kettle: the mash's at the brewhouse efficiency, the sparge's share, and the kettle salts when on; the same sums the kettle water readout uses), concentrated by the boil (× pre-boil ÷ post-boil volume), then mixed with the water back at the wort from kettle's and the water back's volumes, every volume at 60 °F.
- **FM-S3** The water back's own sulfate and chloride: with the HLT treated, the source water's plus the salts it carries (S15c item 3) over its volume at 60 °F; with the mash water treated, the source water's.
- **FM-S4** With kettle salts off the figures still show (FM-Q3); only these three figures are new, no other kettle or beer mineral figure.
- **FM-S5** Where a figure is below its target, the grams to add to the water back that bring the fermenter to it: gypsum for sulfate, calcium chloride for chloride, each only when on hand (when not, the tab names the salt it would need); nothing at or above target (FM-Q9).
- **FM-S6** The printed sheet prints the three figures, their targets, and the grams to add to the water back.
- **FM-S7** Sulfate and chloride in whole mg/L, the ratio to 0.01 (FM-Q8).
- **FM-S8** A blank figure the sums need blanks them, and the tab names it, as for every water figure.
- **FM-S9** With water back off none of this shows, and every figure is as today (FM-Q10).
- **FM-S10** SPEC 10's "No wort mineral figure is worked out" narrows to except these three, with water back on.

## Decisions: agreed 2026-10-14

| id | Question | Decision | Rule |
|---|---|---|---|
| FM-Q1r | What the figures are for | Checking the style's sulfate and chloride with water back on: the fermenter's figures from the water and salts, boil included, beside the style's targets with the usual near / far marks | The figure answers the brewer's question (the owner, 2026-10-14) |
| FM-Q3 | Kettle salts off | The figures still show, from the salts that reach the kettle from the mash and the sparge; only these three, no other kettle minerals | What reaches the fermenter does not depend on a switch for an addition the brewer is not making |
| FM-Q4 | Volumes for the boil and the mix | All at 60 °F: pre-boil over post-boil for the boil, then the wort from kettle and the water back | The volumes the stats bar reads |
| FM-Q5 | The water back's own sulfate and chloride | HLT treated: the source water plus the salts it carries over its volume at 60 °F; mash water treated: the source water | Only treated water carries salts (WD-Q4) |
| FM-Q6r | The malt's own sulfate and chloride | Not counted, and no source needed; the label says the targets do not count it either | Compare like with like |
| FM-Q8 | Precision | Whole mg/L; the ratio to 0.01 | As the predicted profile shows them |
| FM-Q9 | Below a target | The grams of gypsum (sulfate) and calcium chloride (chloride) to add to the water back to bring the fermenter to target, from the salts on hand; nothing at or above target | The kettle-salts rule, applied to the water back |
| FM-Q10 | With water back off | Not shown: the fermenter is the boiled kettle water, at or above the pre-boil target | No figure without a decision behind it |
| M1 | Builder model | Opus, high effort | The Models rule's default |
| M2 | Inspector model | Opus, default effort, a fresh session (one box for the engine, one for the app) | The Models rule's default |
| K | Silent properties | **Conservation:** the sulfate and chloride in the fermenter are what went in the kettle and the water back, by mass. **Ordering:** the figures read the same draws, kettle sums and corrected volumes as the Water tab and the stats bar. **Nothing is saved:** the grams to add are a recommendation, not a recipe field; no saved format changes | — |

## Scenarios: to be written first, must fail before

Engine (a new file under `packages/engine/test/water/`): *the boil and the
water back* (the table above, by hand: 190.9, 161.5, 150.0, 123.5); *the
grams to bring the fermenter to target* (by hand from the engine's salt
table: gypsum's sulfate and calcium chloride's chloride per g per gal over
the fermentation volume at 60 °F); *nothing at or above target*. App (a new
file): *with water back on, the Salts & Acid screen and the sheet show the
three figures, their targets and the grams* (the built-in recipe, HLT
treated, by hand); *the water back from the HLT carries its salts, from the
mash water treated none*; *kettle salts off still shows them*; *a salt not
on hand is named*; *off, nothing changes*.

## Notes for the builder

- Builds on S15c (the wort from kettle, the water back's draw on the HLT).
- The kettle water's sums are in `selectors.js` `computeWater` (the kettle
  block, `kettleShares`, `shareOfSalts`); today they run only with kettle
  salts on. The salt table is the engine's `SALT_CONTRIBUTIONS_PER_G_GAL`.
- Put the mix and the grams in the engine (`packages/engine/src/water/`),
  not the app (SPEC 7).
- The label's wording, the screen's layout and the sheet's line are the
  builder's, in the item's words.
