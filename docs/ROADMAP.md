# Roadmap — outstanding work, by tier

Sorted by consequence, not convenience (CLAUDE.md, change control). Each line
names its tier and the re-test it costs. Sentences are drafts; the real scope
table is written when the item starts. Landed items are removed.

## Tier A — engine

| Item | Sentence (draft) | Re-test |
|---|---|---|
| Grain-bill percentage per malt | The grain calculation returns each malt's share of the total grain weight as a fraction, so the printed sheet can show a percentage column without doing arithmetic in the app (SPEC rule 7). Scope table agreed: `docs/items/grist-percent.md` | both suites + inspector |
| `correctVolumeToRef` identity — **shelved** | Its doc says the factor is exactly 1 at the reference temperature, but `(v · d) / d` differs from `v` by one ulp for v = 7 or 5 (exact for 16, 14.5, 12, 5.5); compute `v · (d / d)` or short-circuit `tempF === refTempF`; golden values unaffected (noticed writing the Options page table, 2026-09-21). Shelved 2026-09-22 on the owner's call: a floating-point artifact ~15 digits down, below every displayed precision and every test tolerance; only a test asserting exact bit-equality would see it. Kept so it is not rediscovered as a mystery | suites + inspector |

## Tier B — touches state, selectors, display, or reference-volume

| Item | Sentence (draft) | Re-test |
|---|---|---|
| Recipe file — export and import | Export writes the saved document to a file named from the recipe name and date; import asks, then replaces what is on screen and becomes the working copy; a foreign, damaged or newer-version file is refused with the current recipe untouched. Scope table agreed: `docs/items/recipe-file-export-import.md` | suites + inspector + far end |
| Ingredient list in the app | The owner's ingredient workbook (`data/Brew Design Ingredients.xlsx`) reaches the app as a list of malts (FGDB, colour), hops (alpha acid) and yeasts (ale/lager, attenuation), and a test fails whenever the app's list and the workbook disagree; each number's rule is its workbook cell. Open for the scope table: how an edit in Excel reaches the app, what a routine row edit costs in review, and the rule for the owner's Review-tab decisions (2026-09-23) | suites + inspector |
| Searchable ingredient boxes | The malt, hop and yeast name boxes search the ingredient list as the brewer types; picking one fills that ingredient's numbers, every number stays editable and the brewer's own figure wins, and a name not on the list can still be typed; the saved recipe keeps its current shape. Needs the ingredient list in the app (2026-09-23) | suites + inspector + far end |
| °C display toggle | Every temperature shown (the measurement temperatures, the hop wort temperature) switches °F/°C from a header toggle that persists with the display settings; needs `cToF` in the engine, so Tier A + B (split from Options page, 2026-09-21) | suites + inspector + far end |
| Empty-field handling | Clearing a field explains why downstream stats are blank and never writes NaN into state | suites + inspector |
| Inverse solver UI | A target OG yields a grain bill via `solveGrist`; the round-trip residual FLAG is shown | suites + inspector |
| Water tab | The water-chemistry solver is reachable from the app | suites + inspector |
| Economics | Cost per batch and per unit via `rollupCost` / `costPerUnit` | suites + inspector |

## Tier C — components, styling

| Item | Sentence (draft) | Re-test |
|---|---|---|
| Printed recipe sheet | A print control opens the browser's print dialog on a print-only recipe sheet — header band, name/style/volume/date, the six headline numbers, grain bill with percentages, volumes, hop schedule, yeast and starter, notes, footer with blank brewer lines — in the screen's units, computing nothing, Letter portrait. Scope table agreed: `docs/items/recipe-print-sheet.md` | suites + look at it in print preview |
| Header mark | The Persyn medallion replaces the flask in the app header, wordmark and kicker unchanged; blocked on artwork the owner is producing. Scope table agreed: `docs/items/header-persyn-mark.md` | suites + look at it |
| Footer | Persyn attribution, parity with Brew Water Chem — uses the full Persyn lockup the header-mark item specifies; note a white-background image would show a rectangle against the page gradient, so it needs the transparent artwork | look at it |
| Phone width | Stats bar and tables degrade without horizontal page scroll | look at it |
| Dead code | `UnitToggle.jsx` removed; unused imports in `VolumesSection.jsx` and `YeastSection.jsx` removed, with the unused `vUnit` the fermentation row left behind in `YeastSection.jsx` (Options page, 2026-09-21) | suites |
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
| Notes / methodology page | Later. The print sheet and the recipe file left this row on 2026-09-22 as items of their own | — |
