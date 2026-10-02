# Water on the printed sheet — Tier B

Status: agreed 2026-10-02 ("agree to all"), not started. Written by
the S3 session; to be built in batch S4, third of three items, after
`docs/items/water-saved.md`. Water program step 6 (WP1; S3's W7).

## Why

The printed recipe sheet goes to the kettle. Once the water is part of the
recipe, the salts and acid — and where each goes — are brew-day
instructions the sheet must carry. Brew Water Chem's own batch sheet is the
reference; it was not carried over in S3 (W7).

## Sentences — what must be true afterwards

- **WP-S1** The printed sheet carries a Water section: where the additions go (mash, kettle, hot-liquor tank), each salt and acid with its amount in the screen's units, and the water volumes.
- **WP-S2** It prints the style target and the treated water's predicted profile against it — calcium, magnesium, sodium, sulfate, chloride, alkalinity, residual alkalinity and the sulfate-to-chloride ratio — labelled as the treated water.
- **WP-S3** A blank box for the measured mash pH sits in the Water section.
- **WP-S4** A recipe with no water entries prints no Water section; a blank figure prints "—".
- **WP-S5** The sheet computes nothing; every number is one the Water tab shows.
- **WP-S6** Printing changes nothing, as today.

## Decisions — agreed

| id | Question | Decision | Rule |
|---|---|---|---|
| M1 | Builder model | Opus, high effort | The Models rule's default |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default; no number introduced |
| P1 | What prints | Additions by where they go, the volumes, the style target and the treated water's predicted profile; not the source water report or the per-acid mEq (on screen, not needed at the kettle) | The kettle needs amounts and places; the profile says what they should give |
| P2 | Where on the sheet | After the water volumes and mash ratio, before the hops — the order of a brew day | The existing sheet's order (recipe print sheet S5) |
| P3 | A measured mash pH box | Yes, labelled "Mash pH (cooled sample)" | Your logs note it that way; it is what checks the mash pH model in S5 (WP9) |
| P4 | No water entries | No Water section (as empty notes print no notes) | Recipe print sheet S7 |
| P5 | Salts with a zero amount | Not printed; the section lists only what goes in | The water app's batch sheet does the same |
| K | Silent properties | Printing is a read, as today; the sheet re-renders from the same figures as the Water tab | Recipe print sheet P12 |

## Scenarios — to be written first, must fail before

`apps/recipe/test/print-sheet.test.js` (extended):
1. *the sheet lists each addition where it goes, in the screen's units* — WP-S1, P5.
2. *the sheet prints the treated water's profile against the target* — WP-S2.
3. *a recipe with no water entries prints no Water section* — WP-S4.
4. *the sheet's water figures are the Water tab's* — WP-S5.

## Far end — on the built app

Print preview for mash only, mash and kettle, and the tank, Home and Pro: the section in its place, amounts as on screen, one page where it fits.

## Notes for the builder

- `components/recipe-sheet-data.js` gains a `water` block from `computeWater`'s output; `RecipeSheet.jsx` lays it out; `App.jsx` passes the water figures. No new colour (the print palette exists).

## Recorded failure (filled in by the builder)

## Builder's notes — choices the sentences did not make (filled in by the builder)
