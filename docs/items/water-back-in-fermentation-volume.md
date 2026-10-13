# Water back as part of the fermentation volume, Tier A + B

Status: agreed 2026-10-13 ("agree to all else", WF-Q1 to WF-Q9 and R, with
WF-Q2 as the owner changed it); landed 2026-10-13 as "With water back on,
the fermentation volume is the wort from kettle plus the water back, worked
out at the bottom of the Volumes card, and the scale and the brewery's batch
read it". Written by the S15b session; built in batch S15c, item 1
(docs/ROADMAP.md, Sessions).

## Why

The owner's smoke test of S15b (2026-10-13): S15b kept the fermentation
volume as the volume at knock-out and added the water back beside it, as
WB-Q2 agreed. In a brewery the fermentation volume is what is in the
fermenter: the wort from the kettle plus the water back. The Volumes card
should say so, with the fermentation volume at the bottom as the total.

## Sentences: what must be true afterwards

- **WF-S1** With water back off, the Volumes card is as today: one "Fermentation volume" box, its "Fermentation volume measured at" box and its volume at 60 °F.
- **WF-S2** With water back on, the box that was "Fermentation volume" reads "Wort from kettle". Under it come the "Water back" box and "Water back measured at" (kept: the water is measured hot, WF-Q2). At the bottom, "Fermentation volume" is worked out as wort from kettle plus water back, with "Fermentation volume measured at" under it and the fermentation volume at 60 °F.
- **WF-S3** The wort from kettle is corrected to 60 °F at "Fermentation volume measured at" (the cooled wort as it goes into the fermenter); the water back at its own temperature; the fermentation volume at 60 °F is the two corrected volumes added. Every figure at pitch is as S15b worked it from those two volumes.
- **WF-S4** The stats bar, cells needed, the dry-hop rate and the cost per gal read the fermentation volume (the total) (WF-Q4).
- **WF-S5** My brewery's batch volume is the fermentation volume (the total); the Home/Pro scale asks and multiplies by the batch over the fermentation volume as typed (wort from kettle plus water back), and multiplies both alike; "already at the batch" compares the total (WF-Q5).
- **WF-S6** "Less wort after the boil than the fermenter volume" compares the post-boil volume with the wort from kettle (WF-Q6).
- **WF-S7** The knock-out figures read "Wort from kettle OG" and "Wort from kettle IBU"; while water back is on, the Hops card's total and the printed hop schedule's "Total IBU" say "from kettle" (WF-Q7).
- **WF-S8** The printed sheet's volumes read: Wort from kettle, Water back (its temperature noted), Fermentation volume (its temperature noted); its caption reads "OG from kettle … · OG at pitch …" (WF-Q8). The batch volume at the top of the sheet is the fermentation volume.
- **WF-S9** A recipe saved with water back on since S15b reads its fermentation volume as the wort from kettle and keeps its water back and temperature; no saved format changes (recipe format stays 13; WF-Q3 as it falls out of WF-Q2).
- **WF-S10** With water back off every figure is as today.

## Decisions: agreed 2026-10-13

| id | Question | Decision | Rule |
|---|---|---|---|
| WF-Q1 | With water back off | Unchanged: one "Fermentation volume" box, as today | With it off, nothing changes (WB-S9) |
| WF-Q2 | Does water back keep its own temperature box? | **Changed by the owner:** yes, "Water back measured at" stays; the water is measured hot | The owner, 2026-10-13 |
| WF-Q3 | Recipes saved with water back on since S15b | The old fermentation volume reads as the wort from kettle; nothing is dropped (with WF-Q2 changed, no saved field changes: format stays 13) | No figure the brewer typed is lost |
| WF-Q4 | What do cells, the dry-hop rate, cost per gal and the stats bar read? | The new fermentation volume (the total), as now | What ferments (WB-Q4, WB-Q5) |
| WF-Q5 | My brewery's batch volume and the Home/Pro scale | Batch = the new fermentation volume; the scale multiplies wort from kettle and water back alike | The batch is what is in the fermenter |
| WF-Q6 | "Less wort after the boil than the fermenter volume" | Compares post-boil with wort from kettle | Water back is not boiled wort |
| WF-Q7 | Labels for the knock-out figures | "Wort from kettle OG", "Wort from kettle IBU"; the Hops card's and the hop schedule's total say "from kettle" while water back is on (replaces the S15c wording item) | One name for one volume |
| WF-Q8 | Printed sheet | Rows: Wort from kettle, Water back, Fermentation volume (with its measured-at note); OG from kettle and OG at pitch | Prints what the screen shows |
| WF-Q9 | Where it goes | S15c item 1, before Design to target OG and the tank draw, which build on it; the hop wording item folds into WF-Q7 | At most three items per batch; foundations first |
| R | S15b on the live site meanwhile | Left as it is (off by default) | Nothing changes unless a brewer turns it on |
| M1 | Builder model | Opus, high effort | The Models rule's default |
| M2 | Inspector model | Opus, default effort, a fresh session (one box for the engine, one for the app) | The Models rule's default |
| K | Silent properties | **Schema migration:** none (WF-S9). **Ordering:** the stats, cells, dry-hop rate, cost and scale read one fermentation volume. **Blank figures:** a blank wort from kettle or water back blanks the fermentation volume and what reads it, and is named. Not a brewery figure beyond the batch volume's meaning | — |

## Scenarios: to be written first, must fail before

App (`apps/recipe/test/water-back-in-fermentation-volume.test.js`, jsdom):
*with water back off the card is as today*; *on, wort from kettle, water
back and its temperature, then the fermentation volume and its temperature
at the bottom* (the built-in recipe: wort 5.5 gal at 68 °F, water back 1 gal
at 170 °F; the fermentation volume at 60 °F by hand from the engine's
density table); *the stats, cells, dry-hop rate and cost read the total*;
*the scale and the brewery's batch read the total* (a 6.5 gal recipe scaled
to 10 bbl: both volumes × 310 / 6.5, by hand; at the batch, nothing asked);
*the post-boil warning compares the wort from kettle*; *the labels and the
sheet*; *a recipe saved by S15b reads the same figures*; *nothing else
changes with water back off*. Engine: the scale's ratio over the total
(`packages/engine/test/scale.test.js`), by hand.

## Notes for the builder

- The stored fermentation volume (`fermentVolGal`) holds the wort from
  kettle while water back is on (WF-S9: no saved field changes); the total
  is worked out by the engine (`volumeAtPitch`), never stored.
- S15b's figures at pitch already read the two corrected volumes (the
  fermentation volume's temperature for the wort, the water back's own):
  WF-S3 is mostly the card, the labels, the scale and the batch.
- The scale is the engine's (`packages/engine/src/scale.js`, Tier A); the
  "already at the batch" comparison is the app's (`state.js`, `switchMode`).
- The S15b roadmap line "The hop schedule's total IBU with water back on"
  (Tier C) is folded in here (WF-Q7) and goes when this lands.

## Builder's notes (S15c, 2026-10-13)

Choices the sentences did not make, each a claim for the inspector:

- **The scale's exact batch.** With water back on, the engine multiplies the
  water back by the ratio and sets the wort from kettle to the batch less
  it: the same figure as the wort from kettle times the ratio, but the two
  then add to the batch exactly, so "already at the batch" holds after a
  scale (multiplying both left a last-digit difference in about one case in
  four). With water back off the fermentation volume becomes the batch, as
  before. A blank water back while on gives no ratio: the switch changes
  units only, as for a blank fermentation volume.
- **Where the check sits.** Off, the card is as today, the check last. On,
  the check sits under the wort from kettle box, heading the water back's
  rows, so the check moves up when ticked. The Volumes card's order of
  WF-S2 is otherwise as written.
- **The post-boil warning's words.** It compared the post-boil volume with
  the wort from kettle already (S15b kept the box as the knock-out volume);
  while water back is on it now reads "Less wort after the boil than the
  wort from kettle", since "the fermenter volume" now names the total
  (WF-Q7, one name for one volume). Off, the words are as today. It sits
  under the wort from kettle box while on.
- **The fermentation volume shown.** As typed, read-only, to 0.001 like the
  card's other read-only volumes (6.500 gal); worked out by the engine's
  `volumeAtPitch` through `selectors.js` (`fermentationVolume`), never
  stored. The sheet prints it to the volume boxes' precision (6.50 gal),
  with no 60 °F row (WF-S8 names three rows).
- **The line under the stats bar** names "Wort from kettle" in place of
  "Fermentation volume" while on, and the fermentation volume's temperature
  after the water back's, the card's order.
- **Earlier scenarios rebased.** S15b's WB-S1, WB-S2, WB-S6 and WB-S8 pinned
  the old ratio (310 / 5.5) and names ("Volume at pitch", "Knock-out");
  they now pin 310 / 6.5 and the new names. The two guards that list every
  figure `computeRecipe` returns (`design-warnings`, `empty-fields`) carry
  the new one, the fermentation volume as typed.
- **Recorded failure.** Engine 1 of 2 (the off guard passed). App 8 of 10;
  WF-S1 (the card off) and WF-S4 (the stats, cells, dry-hop rate and cost
  read the total, which S15b already did) passed before, as guards.
