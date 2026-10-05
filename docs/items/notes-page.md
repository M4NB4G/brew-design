# Methods and sources page — Tier C

Status: agreed 2026-10-05 ("agree to all"), not started. Written by the S6b
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
