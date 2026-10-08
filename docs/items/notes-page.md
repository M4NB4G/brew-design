# Methods and sources page — Tier C

Status: superseded 2026-10-08 by `docs/items/references-page.md` (NM-S1 to NM-S3). Was: agreed 2026-10-05 ("agree to all"); landed 2026-10-06 on branch `S7`
as "A Notes link in the footer opens a page of the methods and their sources,
with a way back to the app"; awaiting the owner's "merge and push". Written by the S6b
session; built in batch S7, third of its three items (docs/ROADMAP.md,
Sessions).

## Why

The app computes gravity, colour, bitterness, alcohol, pitch rates, starters,
volume corrections, water and mash pH, and nothing on the Recipe tab says how
or from what. The Water tab has its own Notes; the rest has none (the
roadmap's "Notes / methodology page", 2026-09-22).

## Sentences — what must be true afterwards

- **NM-S1** A "Notes" link in the footer opens a page of methods and sources; the page has a way back to the app. The Water tab keeps its own Notes screen.
- **NM-S2** The page states each method in words, with its source: extract from FGDB, Tinseth bitterness, Morey colour, alcohol by volume, pitch rates and starter bands, the 60 °F volume correction, the water chemistry, Troester's mash pH, and the Experiments Are Fun Recipe Designer (Rev 3, Persyn Chemical Engineering) as the origin of the recipe math.
- **NM-S3** Every constant the page quotes is read from the engine where the engine exports it, or pinned by a test against the engine; none is written twice.
- **NM-S4** Nothing else changes: no figure, saved document or printed sheet.

## Decisions — agreed 2026-10-05 ("agree to all")

| id | Question | Decision | Rule |
|---|---|---|---|
| NM-Q1 | Where it lives | A "Notes" link in the footer opens a page; the Water tab keeps its own notes | No fourth tab for reference text |
| NM-Q2 | What it states | Each method in words with its source (NM-S2) | The page explains; it does not compute |
| NM-Q3 | Constants it quotes | Read from the engine, or pinned by a test against it | No number written twice |
| M1 | Builder model | Opus (the S7 batch's builder) | The Models rule's default |
| M2 | Inspector model | None: Tier C, no number introduced (NM-S3) | CLAUDE.md, Change control |

## Scenarios — to be written first, must fail before

`apps/recipe/test/notes-page.test.js`: *the footer links to the notes page*; *the page names each method and its source*; *every constant the page quotes equals the engine's*.

## Notes for the builder

- The app has no router: the page can be a view App switches to (like a tab, not saved), or a section reached by an anchor; the builder's choice, recorded in the item's notes.
- Source names to check against the code's own comments: Tinseth and Morey in `packages/engine/src/hops.js` and `grist.js`; Palmer and Kaminski in `water/`; Troester (2009, braukaiser.com) in `water/mash-ph.js` and the Water Notes; IAPWS-95 for water density in `units.js`.
- If writing a sentence raises a question for the owner (a source the code does not name, say), it goes back to him before building.

## Builder's notes (S7, 2026-10-06)

- The page is a view App switches to (`NotesPage.jsx`): the footer's "Notes" opens it in place of the tabs, the stats bar and the tab's cards, scrolled to the top; "← Back to the recipe" returns to the tab that was open. Not saved; every load opens on the app. The header stays, so the °F/°C choice applies to the page; the printed sheet is unchanged.
- The hook's SPEC rule 7 grep refuses Tinseth's, Morey's and the ABV formula's constants written anywhere in the app's source, and the engine does not export them, so the page states those methods in words. It quotes only constants the engine exports, read live (the reference temperature, through `display.js`, so 60 °F or 15.6 °C; the density table's span; the pitch rates; the mash Rv and R ranges; the mash pH range and tested range), and one written figure, 46 points per pound per gallon, pinned against `computeGrist`. The scenario also checks that no other figure is on the page.
- The sources named are those the code names: the Recipe Designer Rev 3, Brewer's Friend and the ASBC (gravity conversions), Morey, Tinseth and Zymurgy May/June 2022 (`hops.js`), White and Zainasheff (`yeast.js`), IAPWS-95 (`units.js`), Palmer and Kaminski, Kolbach, Palmer's How to Brew, Janish's The New IPA and Troester's An Overview of pH (`water/`), Troester's 2009 paper at braukaiser.com (`water/mash-ph.js`). No source the code does not name, so no question went back to the owner.
- `footer.test.js` pinned the company name as the footer's only text (the footer's D1, "no pointer to a Notes page"); NM-Q1 puts the link there, so the scenario now reads the company name and "Notes".
- App.jsx wraps the tabs, stats bar and main in the notes switch without re-indenting them (no reformatting).
- Numbers introduced: none that is a recipe value.
- Gated as Tier B, not Tier C: the change touches `App.jsx`, a Tier B path in CLAUDE.md's change-control table (the hooks require a PASS box for it), so a fresh Opus inspector, default effort (the Models rule's default), returned its box, though M2 named none. M2 is not re-opened; the report puts it to the owner.
- Inspector's FAIL, round 1: the gravity card left out the malt's weight; the footer's coverage row still said the company name was its only text; this file and the coverage row said Tier C. Fixed: the card reads "times its weight in pounds, over the pre-boil volume in gallons" and scenario 2 checks it; the footer row names the link; the gate is recorded here and in the row. Also on its notes: the bitterness card names the hop weight and says the temperature factor falls through the usual whirlpool range (the quadratic rises again below about 167 °F).
