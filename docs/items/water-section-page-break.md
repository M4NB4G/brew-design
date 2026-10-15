# The Water Treatment section may break between its tables on the printed sheet, Tier C

Status: landed 2026-10-15 — "On the printed sheet, the Water Treatment
section may break between its tables, each table with its caption kept whole
and the heading with the first". Agreed
2026-10-15 (PB-Q1, the owner: "agree"). Written after the orchestrated run
S20, from the owner's printed sheet of "Home Grown WC Pils" (2026-10-15).

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

## Builder's notes

- Built on the designated branch `claude/elegant-ride-u7gawb` at f7e1899, not
  on a branch `water-section-page-break` from `main` (98f2ca3): `main` holds
  neither this item file nor the S20 work the sheet now carries, so a branch
  from `main` would have had neither. (The harness also names this branch as
  the only one to push.) The pull request against `main` therefore shows the
  unmerged S20 commits too; this item's own diff is `git diff f7e1899..HEAD`.
- Four blocks, not three. The item's sentences name the additions block, the
  treated water's profile and the kettle water's profile; with water back on
  the section prints a fourth table, the fermenter's, which the sentences do
  not list. Left out of a block it would be split mid-row or parted from its
  caption, which PB-S3 forbids, so it is a block of its own. Derived from
  PB-S3, easy to reverse.
- The heading goes inside the first block, with its caption line, the
  additions table and the mash pH box, in place of leaning on `break-after:
  avoid`: a heading in the same kept-whole block as its table cannot print
  alone at a page's foot whatever the browser does with `break-after`. The
  heading's own `break-after: avoid` stays, for the sections that are whole.
- No style is added: the block is a plain wrapper (`print-block`), the
  section a `section` without the keep-whole class, and the print rules give
  the block the same `break-inside: avoid` the section has. The wrappers
  change no spacing (no padding, border or margin of their own).
- PB-S4 is pinned by capture: the sheet's markup for the owner's recipe as the
  code drew it before the item (`water-section-page-break.before.json`, the
  date fixed), equal to the sheet now once the keep-whole classes and the
  blocks are taken out. That scenario passes before the change, as a pin; the
  other two fail before it.
- This replaces the behaviour `docs/items/print-sheet-legibility.md` (PL-S2)
  asked for: a Water Treatment block that did not fit moved whole to page 2.
  Its far-end notes stay as history.
- Far end: the owner's printed PDF is not in the repository, so the recipe was
  rebuilt from this file's description (`west-coast-pils.fixture.js`'s recipe,
  mash water treated, the acid into the mash, kettle salts on, four kettle
  hops, two dry hops, WLP833 as a lager, a one-line note), with the fixture's
  75 % phosphoric where the owner's recipe has 10 % (one acid row either way),
  and seven brewer-typed salt amounts (four of them salts the recommendation
  does not use) so the section is about half a page and does not fit what
  page 1 has left; without them it fits and nothing breaks. Printed
  to Letter in Chromium, before: page 1 ends after Water & Volumes (about 57 %
  full), Water Treatment and the rest on page 2. After: page 1 carries the
  Water Treatment heading, the additions table with the mash pH box and the
  treated water's profile; the kettle water's block opens page 2; two pages,
  no table cut. With water back on, the first block stays on page 1 and the
  three profile tables, each whole, follow on page 2. Print preview used the
  fallback font (Source Sans 3 is fetched from Google Fonts, which the build
  sandbox cannot reach), as in S6d.
