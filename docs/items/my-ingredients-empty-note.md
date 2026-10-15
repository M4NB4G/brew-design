# My ingredients' empty note names the strain box, Tier C

Status: landed 2026-10-15 as "With nothing saved, My ingredients reads "None
saved yet. Type a malt, boil hop or yeast strain that is not on the ingredient
list in its name box, then choose “Save to my ingredients”."" (agreed
2026-10-15: "agree to all", R-1, MN-Q1, MN-Q2, O-1 to O-5). Written by the S19
session; built in the orchestrated run, batch O1, item 2 (docs/ROADMAP.md,
Sessions).

## Why

With nothing saved, My brewery's My ingredients reads "None saved yet. Type
a malt or boil hop that is not on the ingredient list in its name box, then
choose “Save to my ingredients”." Since My yeast strains (S15 item 1) a
strain is saved from the strain box too (noticed building My yeast strains,
2026-10-11).

## Sentences: what must be true afterwards

- **MN-S1** With nothing saved, My ingredients reads "None saved yet. Type a malt, boil hop or yeast strain that is not on the ingredient list in its name box, then choose “Save to my ingredients”."
- **MN-S2** Nothing else on any page changes: the byte-for-byte page checks change only where the Options page shows this note.

## Decisions: agreed 2026-10-15

| id | Question | Decision | Rule |
|---|---|---|---|
| MN-Q1 | The empty note's new wording? | As MN-S1 | Strains are saved from the strain box since S15 (rule 16) |
| MN-Q2 | The wording changes the whole-page byte-for-byte checks that pin the Options page. Re-capture them? | Yes: re-capture with only the wording changed, and report the old and new checks side by side | A check that pins a page changes only with that page's agreed change |

Tier C (`components/OptionsSection.jsx`, wording only).

## Scenarios: to be written first, must fail before

App: *with nothing saved, My ingredients names the malt, boil hop and yeast
strain boxes* (the Options page drawn whole in jsdom, as
`my-ingredients.test.js` draws it). Fails before on the old sentence.

## Notes for the builder

- The tests that read the old sentence word for word
  (`celsius-toggle.test.js`, `pro-unit-choices.test.js`) take the new one.
- The digests: `page-error.before.json` and
  `error-outside-the-tabs.before.json` (the latter also read by
  `way-out-of-page-error.test.js`), and any other `*.before.json` that draws
  the Options page with nothing saved. Re-capture procedure: on the
  unchanged code, re-run the capture and show it reproduces the stored
  digests; make the change; capture again; only the Options pages' digests
  may differ. The report lists each changed digest, old beside new.
- `docs/TEST_COVERAGE.md` gets a scenario row; the roadmap line "My
  ingredients' empty note names malts and boil hops only" is removed.

## Builder's notes (Sonnet 5.5, 2026-10-15)

- Scenario `with nothing saved, My ingredients names the malt, boil hop and
  yeast strain boxes` (`apps/recipe/test/my-ingredients-empty-note.test.js`)
  failed before on the old sentence, passes after.
- `eslint.config.js` gained one line, the new test in the list of tests that
  draw the app in jsdom (they read `window`, `document` and `MouseEvent`);
  without it lint fails with 8 `no-undef` errors. Tier D tooling, the
  precedent being `volumes-card-blank-figures.test.js`.
- `celsius-toggle.test.js` and `pro-unit-choices.test.js` strip the note by
  its first words ("None saved yet" to the closing `</p>`), so they read no
  later word of it and needed no change; their digests are unchanged.
- The capture, re-run on the unchanged code, reproduced both stored digest
  files exactly. After the change only the Options pages differ:

  | File | Key | Old | New |
  |---|---|---|---|
  | `page-error.before.json` | Home Options | b00874227e4c01202342efd040aa555ea73584d54a38d5be58a49c753975c7cc | 46e2afc22f9d3b611a1bb8162391deb70320d5dd1776c0600fabb1a7a2934407 |
  | `page-error.before.json` | Pro Options | 9f49217524b3460129690fc3716761e04b5a5a90161130a95600388772e46e50 | f66b55910111ba51e63fe2324b06c794a3afdb8bea7d253a2bfbf9a5cccea9d1 |
  | `error-outside-the-tabs.before.json` | Home Options | a11c4ac1141f2db8601b9f9a023dd365d6e95bd6ad38a4e7e0b6e18acc7c476d | c9771f792d7be9c796d30f9c0e5a08e584f123aac2d8f0179dc3222ff8797906 |
  | `error-outside-the-tabs.before.json` | Pro Options | 6066df4d24b217e6d20119acf47a9b2866be646d8b853ae79a97fd86263d6ea7 | aa5d1f16fdb28ebea525c42563315292b66053dfa152ed802a5e46a3dc46dbb3 |

- Far end: the built app in headless Chromium, My brewery with nothing saved:
  `screens/O1-2-options-empty-note.png` (the Options page scrolled to My
  ingredients) and `screens/O1-2-note-closeup.png` (the note alone), in the
  session's scratchpad.
