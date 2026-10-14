# The fermenter's sulfate and chloride with water back on, Tier A + B

Status: agreed 2026-10-14 ("agree to all", FM-Q1r, FM-Q3 to FM-Q6r,
FM-Q8 to FM-Q10, M; FM-Q1 and FM-Q2 of 2026-10-13 replaced by FM-Q1r and
FM-Q6r on the owner's word); landed 2026-10-14 as "With water back on, the
Salts & Acid screen and the sheet show the fermenter's sulfate, chloride
and SO4:Cl ratio from the water and salts, beside the style's targets, and
the grams to add to the water back when below them". Written by the S15c
session; built in batch S17, item 1 (docs/ROADMAP.md, Sessions).

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

## Builder's notes (S17, 2026-10-14)

Choices the sentences did not make, each a claim for the inspector:

- **Where the arithmetic lives.** A new engine file,
  `packages/engine/src/water/fermenter.js`, exported from `index.js`:
  `fermenterSulfateChloride` (the boil, × pre-boil ÷ post-boil, then the mix
  by mass over the wort from kettle plus the water back, `volumeAtPitch`)
  and `waterBackSaltsToTarget` (the shortfall × the fermentation volume ÷
  the salt's mg/L per g per gal, never below 0). No constant of its own;
  147.4 and 127.4 are the salt table's. A blank stays blank (the ratio is
  blank when either ion is; `Math.max(0, NaN)` is NaN). Exactly at target
  gives 0 with no round-off allowance.
- **The kettle sums.** The salts reaching the kettle from the mash and the
  sparge (`kettleShares`, `shareOfSalts`) now run whatever the kettle
  switch, so the fermenter reads them with kettle salts off (FM-Q3); with
  kettle salts on it adds the kettle balance, the same salts the kettle
  water readout shows. The kettle readout's figures are unchanged.
- **When the figures are blank.** Until there is a recommendation (a full
  water report and a positive treated volume): before that the salts in the
  water are not known. The card sits inside the Salts & Acid section that
  every other card needs a treated volume for.
- **The water back's own.** From the HLT, the source water plus the salts it
  carries (S15c item 3) over its volume at 60 °F; the acid it carries is not
  counted (no acid in the engine's table carries sulfate or chloride).
  Mash water treated: the source water's.
- **Blank figures named (FM-S8).** While water back is on, the Water tab's
  "Blank figures the water sums need" line also names the brewhouse
  efficiency (with a sparge), the boil-off rate, the boil time, the wort
  from kettle and the water back (the water back now with the mash water
  treated too). A measurement temperature the correction cannot use is not
  added there: the line under the stats bar names it on the same tab.
- **Not on hand (FM-S5).** The grams are worked out but not shown; the tab
  says "Sulfate is below the target and needs Gypsum (CaSO₄·2H₂O), which
  is not on hand." The sheet prints only the grams (FM-S6).
- **The screen.** A card "Fermenter" after the Kettle Water card, titled
  "Fermenter, with the water back", the label FM-S1 gives, three tiles with
  the near / far colours (`targetMatch`), each salt to add as "Add to the
  water back: <salt> <g>" at the salts' screen precision (0.1 g Home, whole
  g Pro), and a line saying the kettle water is boiled and mixed.
- **The sheet.** The grams as additions, "Water back"; a table after the
  kettle water's, "Fermenter, with the water back (mg/L)" with the label.
  With water back off the sheet's data carries no fermenter entry, so it is
  as before byte for byte.
- **The water back note (FM-S10).** Both notes ended "no mineral figure for
  the beer is worked out"; they now end "of the beer's minerals, only the
  fermenter's sulfate and chloride count it."
- **Recorded failure.** Engine 6 of 6, "fermenterSulfateChloride is not a
  function"; app 7 of 7 ("Cannot read properties of undefined (reading
  'SO4')", and "expected undefined to be null" for FM-S9). After recording,
  the FM-S9 assertion on the sheet changed from `toBeNull()` to
  `toBeUndefined()`, when the sheet's data was made to carry no entry with
  water back off.
