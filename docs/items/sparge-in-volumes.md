# Sparge water in the printed sheet's volumes — Tier C

Status: landed 2026-10-05, "The printed sheet's volumes table has a Sparge water row after the mash water, and the Water Treatment line no longer lists it" (Sonnet 5.5 builder, Opus advisor). Agreed 2026-10-05 ("agree to all"). Written after the
owner asked for the sparge water in the volumes section of the printed sheet.
Today it prints only in the Water Treatment section's caption, and that
section is left out when no water entries are typed.

## Sentences — what must be true afterwards

- **SV-S1** The printed sheet's Water & Volumes table has a "Sparge water" row after the mash water, with the predicted figure in the sheet's volume unit and a box to write the measured volume in, like the other rows.
- **SV-S2** With no sparge selected, the row is not printed.
- **SV-S3** With a sparge selected and the sparge water blank, the row prints "—" for its figure, with its box.
- **SV-S4** The Water Treatment section's water line no longer lists the sparge water. The other water volumes in it are unchanged.
- **SV-S5** The row's figure is the Water tab's sparge water, to the precision the sheet prints the other volumes (2 decimals in gal, 3 in bbl). Nothing else changes: every figure on the sheet and on screen is the same for the same recipe, and nothing saved changes.

## Decisions — agreed 2026-10-05 ("agree to all")

| id | Question | Decision | Rule |
|---|---|---|---|
| SV-1 | Where does the sparge water go | A row in Water & Volumes, after the mash water, with a measured box | The brewer reads volumes there and measures them on brew day |
| SV-2 | With no sparge selected | No row (the owner's call) | There is no such water; the Water tab hides its row the same way |
| SV-2b | A sparge selected, the amount blank | The row shows "—" | A blank figure prints "—" everywhere else on the sheet |
| SV-3 | The Water Treatment caption | The sparge water leaves it | One place per figure |
| SV-4 | Builder | Per CLAUDE.md, Models: a Tier C item runs in the Tier C and D trial (Sonnet 5.5 with the Opus advisor, `/advisor opus`) unless the owner names another model before the build. The report lists every number the change adds and the advisor confirms none is a recipe value | Change control: layout and which rows print; no recipe value |
| SV-5 | Inspector | None: Tier C, suites pass and the builder looks at it (print preview) | CLAUDE.md, Change control |

## Scenarios — to be written first, must fail before

`apps/recipe/test/sparge-in-volumes.test.js`: *the volumes table has a sparge water row after the mash water* (a recipe with a fly or batch sparge of a typed amount: the row's label, its figure equal to the Water tab's, a measured box; Home gal and Pro bbl); *with no sparge there is no row*; *a blank sparge amount prints a dash*; *the Water Treatment line no longer lists the sparge water* (the other volumes in it are as before); *nothing else changes* (the reference recipe's sheet data, captured before, equal after but for the new row). Far end: a print preview (Letter) of a recipe with a sparge and one with none, with screenshots in the report.

## Notes for the builder

- Files likely touched: `apps/recipe/src/components/recipe-sheet-data.js` (the volumes rows, and the water section's volume list, whose "Sparge water (untreated)" / "(from the HLT)" entry goes), `apps/recipe/src/components/RecipeSheet.jsx` only if the row needs rendering the other rows do not.
- The row reads the Water tab's figures (`water.volumes.spargeGal`, the sparge method in `water.setup`); the sheet computes nothing. The existing rows are built from `recipe` and `derived`, and the sheet may be given no `water` (tests do): then no row.
- Consequence to check, not to decide: a new recipe's default sparge method is batch with the amount blank, so the volumes table of a recipe with no water entries prints "Sparge water —" until the brewer picks "none" or types an amount. That follows SV-2b as agreed; the report says so and shows it.
- The caption's label wording ("untreated", "from the HLT") is lost with the line; the Water Treatment section keeps saying where the sparge comes from through "Treated" and the HLT figures. If the builder judges the row's label should carry it ("Sparge water (from the HLT)"), that returns to the owner as a question, not a change.
- The existing test that pins the sparge water line (`apps/recipe/test/print-sheet.test.js`, the water-volumes expectations) changes with this item; say so in the report.

## Builder's notes (filled at landing)

- Built on the designated session branch `claude/youthful-mayer-2ates9`, which already carries the unmerged earlier batches (S6b, S6c, the sheet at a glance) and this item file; `main` does not have them, so a branch `sparge-in-volumes` from `main` could not hold this item's file or the sheet it changes.
- Files changed: `recipe-sheet-data.js` only in `src`; `RecipeSheet.jsx` needed nothing, the table renders every row alike.
- The row shows for `water.setup.spargeMethod !== 'none'` (the Water tab's own effective method, so a one-vessel setup that forces "none" shows no row), and the figure is `water.volumes.spargeGal` through the same `vol()` as the other rows.
- Consequence shown, as the notes asked: a new recipe (batch sparge, amount blank, no water entries) prints "Sparge water —" until the brewer types an amount or picks "none" (screenshot c). That follows SV-2b as agreed.
- Tests that changed with this item, beyond the new file: `print-sheet.test.js` (the water-volumes expectations lose the sparge entries, as the notes said), `hlt-wording.test.js` (its volume-label list loses 'Sparge water (from the HLT)'), and `print-sheet-legibility.test.js` scenario "nothing else changes" (the item file did not list it: its reference recipe carries the default batch sparge with a blank amount, which now prints the dash row; the scenario removes that one row and keeps every other comparison).
- The label stays "Sparge water" with no "(untreated)" or "(from the HLT)", as agreed; the Water Treatment section still says where the sparge comes from through "Treated" and the HLT figures. Not changed, not asked.
- `apps/recipe/test/sparge-in-volumes.before.json` is the sheet data captured from the unchanged code (fly and no sparge, Home and Pro, and a sheet given no water), the baseline for "nothing else changes".
- Numbers added to the change: none in `src`. The test pins are hand-worked: 8.5 gal; 8.5 / 31 = 0.274 bbl; 7 + 8.5 = 15.5, 0.5 absorbed, 1.0 left in the tun.

