# Water back drawn from the hot-liquor tank, Tier A + B

Status: agreed 2026-10-13 ("agree to all", WD-Q1 to WD-Q5, M; WD-Q6
answered by the owner 2026-10-13 before building); landed 2026-10-13 as
"With the HLT treated, the water back is drawn from the tank after the
sparge and carries its share of the salts, and the Water tab and the sheet
list what it carries".
Written by the S15b session; built in batch S15c, item 3, after item 1 and
after S16 item 3 (docs/ROADMAP.md, Sessions).

## Why

With water back on (S15b), the tank water added to the fermenter is in no
water figure (WB-Q6): the HLT's draws, its salts' shares and the water left
in it count the mash and the sparge only, and a tank that also supplies the
water back holds less than the tab says is left.

## Sentences: what must be true afterwards

- **WD-S1** With the HLT treated and water back on, the water back is drawn from the tank after the sparge, as typed (measured hot, as the tank's other volumes are used): the tank's draws are the mash, the sparge, the water back and what is left, and the water back carries its share of the tank's salts, and of the acid when the acid goes with the salts. The shares still add to 100 %.
- **WD-S2** A water back more than the tank holds after the sparge draws what is left; "Left in the HLT, not used" is 0; a warning says the rest is untreated water, which carries no salts.
- **WD-S3** With the mash water treated, the water back is untreated source water and carries no salts.
- **WD-S4** The Water tab and the printed sheet list the grams of each salt (and the acid) the water back carries. No mineral figure for the beer is worked out (that is a later item, the fermenter's sulfate and chloride); the note that water back is not in the water figures says instead what it is in.
- **WD-S5** With water back off every figure is as today.

## Decisions: agreed 2026-10-13

| id | Question | Decision | Rule |
|---|---|---|---|
| WD-Q1 | Tank treated: is the water back drawn from it? | Yes, after the sparge, carrying its share of the salts (and of the acid when the acid goes with the salts) | The shares add to 100 % (WV-S4) |
| WD-Q2 | The water back is more than the tank holds after the sparge | Draw what is left, hold "Left" at 0, warn that the rest is untreated | Same as the sparge (S16, HT-Q1) |
| WD-Q3 | Volume used for the tank draw | The water back as typed (hot), as the tank's other volumes are | The tank's volumes are used as typed |
| WD-Q4 | Mash water treated | Water back is untreated source water, no salts | Only the treated water carries salts |
| WD-Q5 | Minerals in the beer | None worked out here; the Water tab and sheet list the grams of salt the water back carries. The fermenter's sulfate and chloride are a later item (FM-Q1, FM-Q2) | SPEC 10 |
| WD-Q6 | Does "Total water" on the Water tab count the water back? (asked by the builder, as the notes below required) | No: "Total water" stays the mash and sparge water, the water that goes through the mash tun, from which the water left in the mash tun is worked out; the water back shows on its own row, "Water back, to the fermenter", with the salts it carries | One name for one volume (WF-Q7); the owner, 2026-10-13 |
| M1 | Builder model | Opus, high effort | The Models rule's default |
| M2 | Inspector model | Opus, default effort, a fresh session (one box for the engine, one for the app) | The Models rule's default |
| K | Silent properties | **Conservation:** the tank's salt shares (mash, sparge, water back, left) add to 1. **Ordering:** the warning and the held volume read the same draws. Nothing is saved; no saved format changes | — |

## Scenarios: to be written first, must fail before

Engine (`packages/engine/test/water/volumes.test.js` or a new file): *the
water back is drawn after the sparge* (a worked tank: treated, mash,
top-up, sparge, water back; each share by hand); *more than is left draws
what is left* (by hand); *the shares add to one*; *without water back
nothing changes*. App: *the Water tab and the sheet list what the water back
carries*; *with the mash water treated it carries nothing*; *the warning*.

## Notes for the builder

- Builds on S16 item 3 (the water left never below 0, the sparge warning
  against what the tank holds) and S15c item 1 (the water back's place on
  the Volumes card).
- `packages/engine/src/water/volumes.js` `tankDraws` and `shareOfSalts`;
  `selectors.js` `computeWater` (which takes the recipe, so it can read the
  water back as typed); `components/water/WaterGoesCard.jsx`;
  `components/recipe-sheet-data.js`.
- Not decided by the table: whether "Total water" on the Water tab counts
  the water back. Put it to the owner before building rather than choosing.

## Builder's notes (S15c, 2026-10-13)

Choices the sentences did not make, each a claim for the inspector:

- **The tank's draws.** `tankDraws` takes the water back as typed (none
  draws nothing): what the sparge leaves, never below 0, less what the water
  back draws (all of it at most); the water back's share of the tank is the
  share the mash leaves times what it draws over the water the tank holds,
  as the sparge's is. The rest of a water back past what is left is
  returned (`waterBackUntreatedGal`) so the warning names it without the app
  subtracting.
- **The acid it carries.** With the HLT treated and the acid with the
  salts, its share of each acid amount the tab shows (the brewer's own or
  the recommendation), every acid with an amount above 0; into the mash,
  none. The other draws still list salts only, as before.
- **Where the row sits.** HLT treated: between "Carried by the sparge" and
  "Left in the HLT, not used", as a draw, its volume as typed (a water back
  past the tank shows its whole volume and the warning names the untreated
  part, as the sparge row does). Mash water treated: under "Total water",
  "untreated, no salts". The sheet puts the row in the same places and its
  line "Water back carries …" (HLT treated) before the note.
- **The note** (WD-S4) replaces S15b's "Water back is not in the water
  figures": with the HLT treated, "Water back is drawn from the HLT after
  the sparge and carries its share of the HLT's salts (and of the acid when
  it goes with the salts); no mineral figure for the beer is worked out.";
  with the mash water treated, "Water back is untreated source water and
  carries no salts; no mineral figure for the beer is worked out."
- **A blank water back** while on with the HLT treated blanks the water left
  and what the water back draws, and the Water tab's line of blank figures
  names it ("Water back"), as it names the other figures the sums need.
- **S15b's WB-S5 rebased**: it asserted every water figure unchanged with
  water back on; it now asserts the recommendation, salts, acid, predicted
  profile, mash pH, kettle and volumes unchanged, and the new note.
- **Recorded failure.** Engine 4 of 4. App 5 of 5; two of the app
  scenario's text patterns were corrected after recording (they assumed
  gypsum was listed first; the figures were as pinned), so the scenario
  still fails at its first assertion on the unchanged code.
