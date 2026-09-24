# Roadmap — outstanding work, by tier

Sorted by consequence, not convenience (CLAUDE.md, change control). Each line
names its tier and the re-test it costs. Sentences are drafts; the real scope
table is written when the item starts. Landed items are removed.

## Tier A — engine

| Item | Sentence (draft) | Re-test |
|---|---|---|
| Reference temperature as an engine constant | The engine exports its 60 °F volume reference, and the app's "at 60 °F" labels (Volumes, Options) and the printed sheet's temperature-note check read it instead of writing 60 themselves; today it exists only as `correctVolumeToRef`'s default argument (noticed building the print sheet, 2026-09-23) | suites + inspector |
| `correctVolumeToRef` identity — **shelved** | Its doc says the factor is exactly 1 at the reference temperature, but `(v · d) / d` differs from `v` by one ulp for v = 7 or 5 (exact for 16, 14.5, 12, 5.5); compute `v · (d / d)` or short-circuit `tempF === refTempF`; golden values unaffected (noticed writing the Options page table, 2026-09-21). Shelved 2026-09-22 on the owner's call: a floating-point artifact ~15 digits down, below every displayed precision and every test tolerance; only a test asserting exact bit-equality would see it. Kept so it is not rediscovered as a mystery | suites + inspector |

## Tier B — touches state, selectors, display, or reference-volume

| Item | Sentence (draft) | Re-test |
|---|---|---|
| Post-boil volume as measured | The screen and the printed sheet show the post-boil volume only at the 60 °F reference, so a brewer who measures it hot (post-boil measurement temperature above 60 °F) compares a hot reading in the sheet's measured box against a cold prediction; the selector returns the post-boil volume at its measurement temperature as well, and both surfaces show it beside the 60 °F figure (noticed building the print sheet, 2026-09-23) | suites + inspector + far end |
| Saved rows checked inside | The reader checks only a saved recipe's top-level fields, so a hand-damaged file or saved copy whose malt, hop or yeast lacks its name loads and then breaks the name box it feeds (the malt and hop rows since the searchable boxes; the yeast since the Yeast card); check the shape inside the rows and the yeast, and refuse such a document like any other damaged one (noticed building the Yeast card, 2026-09-23) | suites + inspector |
| My ingredients | A brewer saves an ingredient that is not on the list — from a searchable box, typed name plus numbers — and it is offered again next time, in that browser only (the site has no server); open for its scope table: a name clash with the master list, whether a brewer may change or delete master entries (inclination: only their own), whether saved ingredients travel in the recipe file or export as rows for the owner's workbook, and its own saved-format version. For the owner himself, a workbook row plus a session covers it. Needs the searchable ingredient boxes (the owner, 2026-09-23) | suites + inspector + far end |
| °C display toggle | Every temperature shown (the measurement temperatures, the hop wort temperature) switches °F/°C from a header toggle that persists with the display settings; needs `cToF` in the engine, so Tier A + B (split from Options page, 2026-09-21) | suites + inspector + far end |
| Empty-field handling | Clearing a field explains why downstream stats are blank and never writes NaN into state | suites + inspector |
| Inverse solver UI | A target OG yields a grain bill via `solveGrist`; the round-trip residual FLAG is shown | suites + inspector |
| Water tab | The water-chemistry solver is reachable from the app | suites + inspector |
| Economics | Cost per batch and per unit via `rollupCost` / `costPerUnit` | suites + inspector |

## Tier C — components, styling

| Item | Sentence (draft) | Re-test |
|---|---|---|
| Phone width | Stats bar and tables degrade without horizontal page scroll | look at it |
| Dead code | `UnitToggle.jsx` removed; unused imports in `VolumesSection.jsx` and `YeastSection.jsx` removed, with the unused `vUnit` the fermentation row left behind in `YeastSection.jsx` (Options page, 2026-09-21) | suites |
| One warning style | The Volumes card's warnings read the shared warning style in `styles.js` (`tokens.warning`); the Yeast card's temperature warning still carries the same values inline (`YeastCard.jsx`, `WARNING`), because the design-warnings item could not touch that file. Point it at the shared style so the two cannot drift (noticed building the design warnings, 2026-09-23) | look at it |
| IBU shows "NaN" when blank | The stats bar and the Kettle readout render the raw IBU integer, so a blank input (a cleared malt weight; an uncorrectable pre-boil temperature) shows "NaN" where every other stat shows "—"; route it through `num(…, 0)` (noticed at the Options page far end, 2026-09-21) | look at it |

## Tier D — config, docs, tooling, tests

| Item | Sentence (draft) | Re-test |
|---|---|---|
| Title + favicon | The browser tab reads "Brew Design" and shows an icon | build |
| `npm audit fix` | Dev-tooling advisories cleared | suites |
| Line endings | `.gitattributes` pins `* text=auto eol=lf` so working copies stay LF on Windows (autocrlf rewrote the docs to CRLF on a branch checkout, 2026-09-20) | none |
| README | Describes the app as it is now, not "later phases" | none |
| Starter file header overstates fidelity | `packages/engine/src/starter.js`'s file header says every boundary is exact spreadsheet transcription; the 400B band's 800-1000 rule (starter-400b-band, 2026-09-21) is the owner's own deviation, not a transcription, so the header is now inaccurate for that one band (noticed by the inspector, 2026-09-21) | none |
| Coverage gaps | Close the small items in `docs/TEST_COVERAGE.md` | suites |
| Recipe file in SPEC | `SPEC.md` rule 13 states only the browser-storage copy; add the recipe file's rule — the exported file is the stored document, read by the same reader, and a file that is not a recipe, is damaged, or is newer is refused with the recipe on screen untouched, unlike storage's silent fallback to defaults. The recipe-file item named no change to `SPEC.md`, so it is held in `docs/items/recipe-file-export-import.md` and `recipe-file.test.js` until then (noticed building the recipe file, 2026-09-23) | none |
| Hooks paragraph in CLAUDE.md | CLAUDE.md's Hooks section says `pre-commit` runs the suite only when a Tier A/B or component file is staged and `commit-msg` asks for a box only on A/B; since the ingredient list landed, both hooks also act on the ingredient files (Change control, "Ingredient data"). Say so in that paragraph (noticed building the ingredient list, 2026-09-23) | none |
| Ingredient README | `data/README.md` still says nothing in the app reads the workbook and points to the roadmap's "Ingredient list in the app" row, which is gone; describe the refresh (`npm run refresh-ingredients --workspace @brew/recipe`), the app's copy and the test that holds the two equal (noticed building the ingredient list, 2026-09-23) | none |
| Rule 16 and the Yeast card | `SPEC.md` rule 16 says the recipe never refers back to the list; the Yeast card's information line and temperature warning read the list by the strain's name each time they are drawn (item Q5: the list's current figures), for display only, never stored and never feeding a number. Say so in rule 16 (noticed building the Yeast card, 2026-09-23) | none |
| Notes / methodology page | Later. The print sheet and the recipe file left this row on 2026-09-22 as items of their own | — |
