# Printed sheet at a glance — Tier C

Status: landed 2026-10-05 — "The printed sheet reads at a glance: text about
20 % larger, two pages with no section split, the predicted mash pH on two
lines to one decimal, the yeast block on one grid" (batch S6d; Sonnet 5.5 built,
Opus advised). Agreed 2026-10-05 ("agree to all"). Written by the S6c
session after the owner printed a recipe (Home Grown WC Pils, 12 gal) and
found the sheet too small to read at a glance, the predicted mash pH line
cramped and the yeast block uneven. The predicted mash pH to one decimal
(roadmap, Tier C, asked for by the owner 2026-10-05) is folded in (PL-4).

## Why

On brew day the sheet is read at arm's length. Today the body prints at
about 7.5 pt, column headers at 6 pt and labels at 5 pt. The yeast block's
three tables each have their own column widths, so nothing lines up, and
its first column is left-aligned in two tables and centred in the third.
On the owner's recipe the sheet runs to two pages and the "Yeast &
Starter" heading prints alone at the foot of page 1.

## Sentences — what must be true afterwards

- **PL-S1** The printed sheet reads at a glance: body text and figures about 9 pt, column headers about 7.5 pt, section headings about 8.5 pt, the six predicted stats (OG to cells) about 12 pt, the small labels ("measured", style, batch volume, date) about 6.5 pt, notes and captions about 8.5 pt.
- **PL-S2** The sheet may run to two pages; no section is split across a page, and a section heading always prints on the same page as its first table.
- **PL-S3** The predicted mash pH prints on two lines, broken at the comma — "Mash pH (cooled sample)," then "predicted 5.4" — at body size in the body's dark text, beside the measured mash pH box.
- **PL-S4** The predicted mash pH shows and prints to one decimal (the Salts & Acid screen and the sheet): no figure changes, only its display.
- **PL-S5** The yeast block's three rows share one column grid: a first column of 40 % holding text (strain, yeast character, beginning cell count), left-aligned; the other columns equal widths with figures centred, lining up down the block.
- **PL-S6** An empty starter note prints as a blank cell, not "—".
- **PL-S7** On the printed sheet the cell counts say their unit once: "Cells (billion)" in the predicted row and "Cells needed (billion)" in the yeast block (Pro: "trillion"). The screen's labels are unchanged.
- **PL-S8** Nothing else changes: every figure on the sheet and on screen is the same for the same recipe, and nothing saved changes.

## Decisions — agreed 2026-10-05 ("agree to all")

| id | Question | Decision | Rule |
|---|---|---|---|
| PL-1 | Text size | Body and figures 7.5 → 9 pt; column headers 6 → 7.5 pt; section headings 7 → 8.5 pt; the six predicted stats 10 → 12 pt; the small labels 5 → 6.5 pt; notes and captions 7 → 8.5 pt | Readable at arm's length on a brew deck; about 20 % larger keeps the tables at their present width |
| PL-2 | One page or two | Two pages allowed; a section never splits across a page; a heading stays with its table. This supersedes S6a's one-page sheet with water | Legibility over page count; the owner's recipe is already two pages |
| PL-3 | Mash pH line | Two lines at the comma, body size, dark text, not small grey capitals | It is the figure the brewer compares the meter against |
| PL-4 | Fold in "predicted mash pH to one decimal" | Yes: the roadmap line as written (screen and sheet), so 5.4, not 5.40 | Same line, same item; display precision only |
| PL-5 | Yeast grid | One grid for all three rows: first column 40 %, left-aligned text; the rest equal, figures centred | Columns line up, as the grain bill and hop tables do |
| PL-6 | Empty starter note | A blank cell, not "—" | A dash in a column reads as a missing figure |
| PL-7 | "Cells needed (billion cells)" | "Cells needed (billion)", and the sheet's predicted row "Cells (billion)" likewise (Pro: trillion). The printed sheet only: the screen's stats bar and Yeast card keep their labels | The unit said once; the agreed row named the sheet's labels |
| PL-8 | Builder | Sonnet 5.5 with the Opus advisor (`/advisor opus`): a Tier C item, layout and display precision only. The report lists every number the change adds and the advisor confirms none is a recipe value | CLAUDE.md, Models: the Tier C and D trial |
| PL-9 | Inspector | None: Tier C, the suites pass and the builder looks at it (print preview) | CLAUDE.md, Change control |

## Scenarios — to be written first, must fail before

`apps/recipe/test/print-sheet-legibility.test.js`: *the predicted mash pH reads on two lines at the comma, to one decimal* (the sheet's data and the rendered sheet; the Salts & Acid screen's figure to one decimal); *the yeast block shares one grid* (each of its three tables' first column 40 % and left-aligned, the other columns equal and centred); *an empty starter note prints blank*; *the sheet's cell counts say their unit once* (Home billion, Pro trillion; the screen's labels unchanged); *nothing else changes* (the sheet's figures for the reference recipe equal before and after). Text sizes and page breaks (PL-S1, PL-S2) have no screen in the suite: the far end, a print preview (Letter, headless Chrome) of the owner's WC Pils (12 gal, four kettle hops, two dry hops, water in the mash, 10 % phosphoric) and the reference recipe, with screenshots in the report.

## Notes for the builder

- Files likely touched: `apps/recipe/src/components/RecipeSheet.jsx` (sizes in px: body 10 → 12, column headers 8 → 10, section headings 9 → 11, predicted stats 13 → 16, small labels 7 → 9, notes and captions 9 → 11, the disclaimer 8 → 9; the yeast tables; the mash pH label), `apps/recipe/src/components/recipe-sheet-data.js` (the mash pH to one decimal; the note's blank; the cells unit's first word for the sheet), the Salts & Acid screen's mash pH figure under `components/water/`, and `index.css` (print rules: `break-inside: avoid` per section and `break-after: avoid` on headings).
- PL-7 is done in the sheet's data, not in `display.js`: changing the display file's cells unit would change the screen and make the item Tier B.
- The scenarios that pin the predicted mash pH's "5.70" (`mash-ph.test.js`) and any print-sheet test that pins "billion cells" or the old mash pH label change with this item; say so in the report.
- The browser's own header and footer (date, page title, URL, "1/2") come from the print dialog's "Headers and footers" option, not the app; out of scope.
- PL-2 returns to the print sheet's own rule (`docs/items/recipe-print-sheet.md`, P5 and S9: flow to a second page rather than shrink below readable size). SPEC names no page count; S6a's one-page fit is undone by design, and its far-end notes in `docs/TEST_COVERAGE.md` stay as history.

## Builder's notes (S6d)

- Built on the designated branch `claude/dazzling-franklin-8uv86o` at 4d727d1:
  `main` (33ad2f7) does not yet hold this item file or the S6c work the sheet
  now carries, so a branch from `main` would have had neither.
- The four-column grid has one more column than the yeast character row has
  figures (character, pitch rate, cells needed). The fourth cell of that row is
  left open, without border or fill, so its three columns line up with the
  strain row's and the starter row's first three. PL-5 says "the rest equal"
  and does not say what a short row does; the choice is the builder's, easy to
  reverse.
- The starter table's Note column is centred with the other figures columns
  (PL-5), where it was left-aligned.
- "A section" is each of Predicted, Grain Bill, Water & Volumes, Water
  Treatment, Hop Schedule, Yeast & Starter and Notes, as one block. A recipe
  whose Water Treatment block cannot fit with the earlier blocks moves whole to
  page 2, leaving white space at the foot of page 1; the item's sentence
  (PL-S2) asks for that. A Notes block longer than a page flows, since a
  browser cannot keep more than a page together.
- Sizes are in px, 4/3 of the pt the sentences name: body 12, column headers 10,
  section headings 11, predicted stats 16, small labels 9, notes and captions
  11, the disclaimer 9. The signature line and the notes text take the body
  size. The title, the brand and "Recipe Sheet" in the header band are unchanged
  (the sentences do not name them).
- Print preview used the fallback font (Source Sans 3 is fetched from Google
  Fonts, which the build sandbox cannot reach), which is wider than Source
  Sans; the owner's print will be slightly tighter.

