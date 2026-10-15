# My ingredients' empty note names the strain box, Tier C

Status: agreed 2026-10-15 ("agree to all", R-1, MN-Q1, MN-Q2, O-1 to O-5);
not started. Written by the S19 session; built in the orchestrated run, batch
O1, item 2 (docs/ROADMAP.md, Sessions).

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
