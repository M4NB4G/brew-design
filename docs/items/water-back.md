# Water back, Tier A + B

Status: agreed 2026-10-09 ("agree to all", S15-Q0, WB-Q1 to WB-Q7); landed
2026-10-12 as "With water back on, the knock-out's extract, colour and
bitterness spread over the volume at pitch, which the stats bar, the cells,
the dry-hop rate and the cost per gal read". Written by the S13 session;
built in batch S15b, on its own (S15-Q0; docs/ROADMAP.md, Sessions).

## Why

An option, off unless turned on, for adding hot-liquor-tank water to the
fermenter after knock-out, a professional brewery's practice: knock out
400 gal, add 78 gal of tank water to the end of the run, 478 gal in the
fermenter at pitch (asked for by the owner, 2026-10-02).

## Sentences: what must be true afterwards

- **WB-S1** The Volumes card has a "Water back" check, off by default. When on, it shows a volume box (gal at Home; bbl or gal in Pro, by Pro's choice) and, beside it, its measurement temperature, the reference by default, in the header's unit.
- **WB-S2** The fermentation volume stays the volume at knock-out. The volume at pitch is the knock-out volume plus the water back, each corrected to 60 °F at its own measurement temperature (SPEC 11), and the card shows it.
- **WB-S3** With water back on, the engine spreads the knock-out's extract, colour and bitterness over the volume at pitch: the stats bar's OG, FG, ABV, SRM and IBU are those at pitch, and the Volumes card shows the knock-out OG and IBU beside them.
- **WB-S4** Cells needed (from the gravity and the volume at pitch), the dry-hop rate and the cost per gal read the volume at pitch.
- **WB-S5** No mineral figure changes; the Water tab and the printed sheet say water back is not in the water figures. The tank's draws do not include it.
- **WB-S6** Switching Home and Pro, the scale multiplies the water back with the other amounts; its temperature stays.
- **WB-S7** The recipe's saved document is version 13: a version-1 to 12 document loads with water back off, its volume blank and its temperature at the reference, and is saved back as 13. Water back is not a brewery figure.
- **WB-S8** The printed sheet prints the water back volume, the knock-out OG and the OG at pitch.
- **WB-S9** With water back off every figure is as today: the golden master, the smoke test and every snapshot unchanged.
- **WB-S10** With water back on and its volume or temperature blank or uncorrectable, the figures at pitch are blank ("—"), and the line under the stats bar names the box (SPEC 8, 11).

## Decisions: agreed 2026-10-09

| id | Question | Decision | Rule |
|---|---|---|---|
| S15-Q0 | Split Water back out of S15? | Yes: Water back is S15b, alone | At most three items per batch; shorter sessions go wrong less (2026-10-02) |
| WB-Q1 | Where is it set? | On the Volumes card: a check, off by default; when on, a volume box with its own measurement temperature, the reference by default | Tank water is hot and shrinks as it cools; every other volume is corrected to 60 °F (SPEC 11) |
| WB-Q2 | The fermentation volume's meaning? | It stays the volume at knock-out; the volume at pitch is knock-out plus water back, both at 60 °F, shown on the card | The owner's example, 400 + 78 = 478 gal at pitch |
| WB-Q3 | Gravity, colour and bitterness dilute? | Yes: the sugar, colour and bitterness at knock-out spread over the volume at pitch, by the engine, with hand-worked pins | They are amounts per volume; water back is not in Rev 4, so every figure needs a hand pin |
| WB-Q4 | Which figures does the stats bar show? | At pitch: OG, FG, ABV, SRM, IBU; knock-out OG and IBU on the Volumes card | The stats bar shows what ferments |
| WB-Q5 | What reads the volume at pitch? | Cells needed (from the pitch gravity), the dry-hop rate, the cost per gal | Each depends on what is in the fermenter |
| WB-Q6 | Minerals and the tank? | No mineral figure (the app works out none for wort, SPEC 10); not drawn from the tank's sums; the Water tab and sheet say water back is not in the water figures; the tank draw a roadmap line | Smallest change |
| WB-Q7 | Scaling, saving, printing? | Scales with the batch on the Home/Pro switch; a recipe figure, not a brewery figure; recipe format 13, older recipes read with it off; the sheet prints it and both gravities | It depends on the recipe's gravity |
| M1 | Builder model | Opus, high effort | The Models rule's default |
| M2 | Inspector model | Opus, default effort, a fresh session (one box for the engine, one for the app, as S5b) | The Models rule's default |
| K | Silent properties | **Schema migration:** recipe versions 1 to 12 upgraded with water back off, then checked (SPEC 13's reader gains the three fields, each of its kind), saved back as 13. **Storage disabled:** as today. **Blank figures:** WB-S10. **Ordering:** the stats bar, the cells and the cost read one volume at pitch. Not a brewery figure, so the brewery format does not change | — |

## Scenarios: to be written first, must fail before

Engine (`packages/engine/test/water-back.test.js`, new): *the extract at knock-out is spread over the volume at pitch* (the owner's 400 gal and 78 gal, with a knock-out OG worked out by hand from a stated °P, the OG at pitch by the extract balance, the working written in the test); *colour is Morey's of the malt colour units over the volume at pitch* (not the knock-out SRM times a ratio: Morey is not linear; worked by hand); *bitterness is the knock-out IBU times knock-out over pitch volume* (by hand); *no water back changes nothing* (the golden master's figures with water back 0 and off). App (`apps/recipe/test/water-back.test.js`, new): *the check, the box and its temperature on the Volumes card*; *the stats bar shows the figures at pitch and the card the knock-out ones*; *cells, dry-hop rate and cost per gal read the volume at pitch*; *the scale multiplies the water back*; *a version-12 recipe loads with water back off and is saved back as 13*; *a blank water back blanks the figures at pitch and is named*; *the sheet prints it*; *nothing else changes with water back off* (the smoke test and the snapshots unchanged).

## Notes for the builder

- Water back is not in Rev 4, so SPEC rule 2 has no cell for it: each figure's rule is arithmetic and needs a hand-calculated pin (CLAUDE.md, Models, the residual risk). State the extract balance used (the sugar mass, °P × SG × volume, kept across the dilution, or the gravity points × volume, a close approximation; the exact balance is the rule that "spreads the sugar") and work the owner's 400 + 78 gal example by hand in the test.
- The engine today: `grist.js` works OG from the pre-boil °P and the volume ratio, colour as Morey's 1.4922 × MCU^0.6859 with MCU per gal of post-boil volume, and ABV from OG and FG; `hops.js` works IBU on the post-boil volume and the dry-hop rate on the fermentation volume; `yeast.js` cells from the post-boil °P and the fermentation volume. A new engine function (or an optional water-back figure to the existing ones) gives the figures at pitch; the knock-out ones stay as today. Tier A: the public surface is `index.js` (SPEC 5).
- App: `state.js` (the three new fields, default off, volume blank, temperature the reference), `selectors.js` (the volume at pitch through `toReferenceVolume` with a fourth kind, its temperature in `measurementTempF` or beside it: the builder's choice, recorded), `components/VolumesSection.jsx`, `StatsBar.jsx`, the sheet, `persistence.js` (format 13), `display.js` (units), the scale (`packages/engine/src/scale.js`). SPEC 6, 8, 10, 11, 13 and the units table.
- The empty-fields line names the water back box and its temperature only while water back is on.
- A roadmap line for the tank's draws including water back (WB-Q6), in this commit.

## Builder's notes (S15b, 2026-10-12)

Choices the sentences did not make, each a claim for the inspector:

- **The extract balance** is the exact one: the sugar's mass, °P × SG ×
  volume, kept across the dilution (SG by the engine's `platoToSg`). The
  engine (`packages/engine/src/water-back.js`) finds the °P at pitch by
  halving an interval until the halves meet in the last digit, with no
  constant of its own; the test works the same figure by hand by solving
  the ASBC formula as a quadratic, a different method. The gravity-points
  balance would read 3.5e-5 lower on the owner's example; the test checks
  it is not that.
- **Colour.** The malt colour units at knock-out are the post-boil wort's
  (computeGrist's, over the post-boil volume: wort lost after the boil
  leaves at its own colour), times knock-out over pitch volume; SRM is
  Morey's of that. "The malt colour units over the volume at pitch" is read
  as the knock-out's colour units spread over it, not Σ(°L × lb) over the
  pitch volume, which would ignore the losses.
- **Bitterness.** The unrounded sum of the additions times knock-out over
  pitch volume, then rounded as the engine rounds its total.
- **FG and ABV** at pitch are computeGrist's own last two steps, moved into
  `attenuate` (and Morey into `moreySrm`) in the same order, so the golden
  master is bit for bit the same; `computeGrist` and `computeHops` also
  return their unrounded sums (`sumMcu`, `sumIBU`).
- **The temperature** sits beside the volume, `waterBack: { on, volumeGal,
  tempF }`, not in `measurementTempF`: the recipe's three measurement
  temperatures, the brewery's and their checks are untouched. It reaches
  `toReferenceVolume` as its own kind, `waterBack`.
- **Turning the check off** keeps the typed volume and temperature in the
  recipe (saved, with it off); no figure reads them while it is off.
- **What reads the volume at pitch:** the stats (OG, FG, ABV, SRM, IBU) come
  from computeRecipe's new `stats`; `grist` and `hops` stay the knock-out's,
  so the Grist table, the Hops card's total IBU and the printed hop
  schedule's total are the knock-out's (a Tier C roadmap line asks whether
  they say so). The dry-hop rate, the cells (°P and volume at pitch) and the
  Cost card's cost per gal read the volume at pitch. "Design to target OG"
  still solves for the knock-out OG (a Tier B roadmap line). The warning
  "Less wort after the boil than the fermenter volume" still compares the
  post-boil volume with the knock-out volume.
- **Cells rise a little** with water back (210 → 220 on the built-in recipe
  with 1 gal): °P × volume grows as SG falls under the sugar balance. Kept,
  with a `// FLAG:` in `selectors.js`.
- **The Volumes card** shows, under the fermentation volume and its warning:
  the check; when on, the volume box (the sheet's precision away from the
  cursor, as the other volume boxes), its temperature box, then read-only
  the volume at pitch at 60 °F and the knock-out OG (the screen's gravity
  unit) and IBU. The water back's own volume at 60 °F is not shown on its
  own row (WB-S1 names the box and its temperature only).
- **The Water tab** shows the note on every screen while water back is on;
  the printed sheet appends it to the Water Treatment section's first line.
  The sheet's volumes table gains a "Water back" row (its temperature noted
  when not 60 °F) and a "Volume at pitch at 60 °F" row, each with a measured
  box; its caption ends "Knock-out OG … · OG at pitch …" in the screen's
  gravity unit. The headline is the stats bar's (at pitch).
- **Earlier scenarios.** Twenty-two pins of recipe version 12 became 13; two
  expected computeRecipe outputs gained the off values; the print-sheet test
  sets the stats it prints; the "nothing else changes" captures are compared
  through `apps/recipe/test/water-back.fixture.js`, which takes out the
  check (unchecked only), the sheet's three off entries and note (null only)
  and a saved water back that is off, blank and at the reference (with the
  version), and nothing else. `eslint.config.js` lists the new jsdom test
  with the others that read the browser's globals.

