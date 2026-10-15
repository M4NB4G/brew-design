# The Water Treatment section may break between its tables on the printed sheet, Tier C

Status: agreed 2026-10-15 (PB-Q1, the owner: "agree"); not started. Written
after the orchestrated run S20, from the owner's printed sheet of
"Home Grown WC Pils" (2026-10-15); no session assigned.

## Why

Each section of the printed sheet (its heading and its tables) is kept whole
on one page. On the owner's West Coast Pilsner the Water Treatment section
(the additions, the treated water's profile and the kettle water's profile)
is about half a page and did not fit in what page 1 had left, so the whole
section, and everything after it, moved to page 2: page 1 printed about 45 %
empty and page 2 full to its foot. The recipe is about one and a half pages,
so two pages are expected; the break is what is lopsided.

## Sentences: what must be true afterwards

- **PB-S1** On the printed sheet, the Water Treatment section may break across a page between its tables: the caption line with the additions table (and its mash pH box), the treated water's profile, and the kettle water's profile each stay whole on one page.
- **PB-S2** The Water Treatment heading never prints alone at the foot of a page: it stays on the page of the caption line and additions table.
- **PB-S3** Every other section stays whole on one page, as today, and no table is split mid-row.
- **PB-S4** Nothing else on the sheet changes: no figure, no wording, no order, no style.

## Decisions: agreed 2026-10-15

| id | Question | Decision | Rule |
|---|---|---|---|
| PB-Q1 | May the Water Treatment section split across the page break between its tables, each table still kept whole and the heading kept with the first table? | Yes, Water Treatment only; the other sections stay whole | A table split mid-row is hard to read at the kettle; a section split between tables is not |

Tier C (`components/RecipeSheet.jsx`, `index.css`; print layout only). No
inspector unless building it introduces a number (the catch-all).

## Scenarios: to be written first, must fail before

App (`apps/recipe/test/`, the sheet drawn as `print-sheet.test.js` draws
it): *the Water Treatment section may break between its tables, each kept
whole* (the Water section no longer carries the keep-whole rule; each of its
three blocks does, and the heading is kept with the first) · *every other
section stays whole* (each other section still carries it). Fails before:
the Water section carries the keep-whole rule as a whole.

Browser (`npm run e2e`, or the far-end check by hand): the owner's recipe
(below) printed to Letter in Chromium: page 1 carries the Water Treatment
heading and at least its additions table; no table is cut; two pages.

## Notes for the builder

- Today `Section` in `RecipeSheet.jsx` wraps a heading and its tables in
  `<section class="print-section">`, and `index.css` (print) gives
  `.print-section` `break-inside: avoid` and `.print-heading`
  `break-after: avoid`. The smallest change is likely: the Water section
  drops `break-inside: avoid` on itself and puts it on each of its three
  blocks (caption + additions with the mash pH box; treated profile; kettle
  profile), the heading kept with the first block. Check how Chromium
  honours `break-after: avoid` on the heading when the section itself may
  break; if it does not hold, keep the heading and the first block in one
  wrapper that avoids breaking inside.
- The owner's recipe: "Home Grown WC Pils", West Coast Pilsner, 12.00 gal;
  Pilsner Northstar 12 lb, Pilsner Weyermann 7 lb, Carafoam 1 lb; mash water
  8 gal, sparge 10 gal; mash salts and 10 % phosphoric acid, kettle salts on;
  four kettle hops, two dry hops, WLP833 with a 400B starter, a one-line
  note. Its printed PDF is not in the repository; rebuild an equivalent
  recipe to see the break, and compare page 1's fill before and after.
- No digest should change (the digests draw the screen, not the print
  rules); if one does, stop and say why.
- `docs/TEST_COVERAGE.md` gets a scenario row; this item's roadmap line is
  removed. SPEC needs no change unless it states the keep-whole rule (rule
  14 names "the print rules" without detail).
