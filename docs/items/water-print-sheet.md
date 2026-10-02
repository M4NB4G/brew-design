# Water on the printed sheet — Tier B

Status: agreed 2026-10-02 ("agree to all"); landed 2026-10-02 on branch S4 as "The printed sheet carries a Water section: where the additions go, each salt and acid with its amount in the screen's units, and the water volumes". Written by
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

Run alone against the code before this item (2026-10-02):

```
apps/recipe/test/print-sheet.test.js, describe "water on the printed sheet" (4 failed / 4; the 5 earlier sheet scenarios pass):
  × the sheet lists each addition where it goes, in the screen's units — TypeError: Cannot read properties of undefined (reading 'treated')
  × the sheet prints the treated water's profile against the target — TypeError: Cannot read properties of undefined (reading 'profileLabel')
  × a recipe with no water entries prints no Water section — AssertionError: expected undefined to be null
  × the sheet's water figures are the Water tab's — TypeError: Cannot read properties of undefined (reading 'additions')
```

## Builder's notes — choices the sentences did not make (filled in by the builder)

1. **Where the scenarios live.** A new describe, "water on the printed sheet", appended to `apps/recipe/test/print-sheet.test.js` (the item names that file), with the water item's worked example as its recipe.
2. **"No water entries" (WP-S4, P4)** means no test result entered and no salt or acid amount of the brewer's own: then the section is not printed. With entries but no recommendation (a blank test result, a blank treated volume), the additions print as one row "Additions —" and the profile as "—".
3. **What prints, in the screen's units and precision** (WP-S1, P1, P5): each salt and acid where it is treated ("Mash" or "Hot-liquor tank"), and each kettle salt ("Kettle"), skipping zeros; salts 0.1 g Home and 1 g Pro, liquid acid whole mL, acidulated malt 0.01 oz or lb — the Water tab's own precision. The water volumes are the Water tab's card's: mash water, absorbed by the grain, sparge (untreated / from the tank), total; with the tank, its treated fill, top-up level, treated share and what is left. A blank kettle amount prints "—".
4. **The profile** (WP-S2) prints calcium, magnesium, sodium, sulfate, chloride, alkalinity, residual alkalinity and the sulfate-to-chloride ratio, predicted and target, under "Treated water (predicted), not the wort in the kettle, against the <style> target (mg/L)"; an endless ratio prints "∞" as on screen.
5. **Layout.** A "Water Treatment" section after Water & Volumes and before the Hop Schedule (P2): one caption line with the treatment and the water volumes, the additions table with the "Mash pH (cooled sample)" box beside it (P3), then the profile table. The volumes are a line, not a table, to save height.
6. **One page.** The built-in recipe's sheet is 9.16 in tall without water and 10.91 in with it (Letter prints 10 in); the section is 1.75 in. So a small recipe with water now prints on two pages. Recorded as a roadmap line ("Printed sheet with water on one page", Tier C) for the owner.
7. **The sheet computes nothing** (WP-S5): `recipeSheet` takes the Water tab's figures (`computeWater`'s output) as `water`, passed by App; every number goes through the display boundary and the formatter. The S3 scenario "the recipe's figures and printed sheet are unchanged by any water entry" is renamed "… the printed sheet's recipe sections …": it shapes the sheet without the water figures.
