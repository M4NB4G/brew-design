# Roadmap — outstanding work, by tier

Sorted by consequence, not convenience (CLAUDE.md, change control). Each line
names its tier and the re-test it costs. Sentences are drafts; the real scope
table is written when the item starts. Landed items are removed.

## Sessions — the order the work is built in

Agreed with the owner 2026-09-23 (CLAUDE.md, Batches): each session builds
its batch — one commit per item, a fresh inspector per Tier A/B item, one
PR and one deploy — and after its report writes the scope tables for the
next batch. The order: numbers a brewer acts on and data safety first,
foundations before what builds on them, cheap housekeeping early, the water
program in dependency order, polish, then new features. Each row below
carries its session.

| Session | Builds, in order | Writes the scope tables for |
|---|---|---|
| S3 · Water tab | Water tab (water step 3) | S4 |
| S4 · Water in the recipe | Water linked to the recipe (step 4) · Water on the printed sheet (step 6) | S5 |
| S5 · Mash pH | Mash pH from the grain bill (step 5) · Sparge acidification | S6 |
| S6 · Polish | Measurement temperatures beside their volumes · °C display toggle · Blank brewery figures name the built-in one | S7 and S8 |
| S7 · Design tools | Inverse solver UI (target OG → grain bill) · Economics · Notes / methodology page | — |
| S8 · My ingredients | My ingredients | — |

Shelved: the `correctVolumeToRef` identity.

## Tier A — engine

| Item | Sentence (draft) | Re-test | Session |
|---|---|---|---|
| `correctVolumeToRef` identity — **shelved** | Its doc says the factor is exactly 1 at the reference temperature, but `(v · d) / d` differs from `v` by one ulp for v = 7 or 5 (exact for 16, 14.5, 12, 5.5); compute `v · (d / d)` or short-circuit `tempF === refTempF`; golden values unaffected (noticed writing the Options page table, 2026-09-21). Shelved 2026-09-22 on the owner's call: a floating-point artifact ~15 digits down, below every displayed precision and every test tolerance; only a test asserting exact bit-equality would see it. Kept so it is not rediscovered as a mystery | suites + inspector | shelved |

## Tier B — touches state, selectors, display, or reference-volume

| Item | Sentence (draft) | Re-test | Session |
|---|---|---|---|
| Measurement temperatures checked inside | The reader checks that a saved recipe's measurement temperatures are an object, but not the three inside it, so a hand-damaged file whose post-boil temperature is text ("180") or missing loads: text is carried into the recipe (not a canonical number, SPEC rule 8) and a missing one blanks the volumes it corrects; check the three as a number or blank and refuse such a document like a damaged row (noticed building "Saved rows checked inside", 2026-09-23) | suites + inspector | unassigned |
| My ingredients | A brewer saves an ingredient that is not on the list — from a searchable box, typed name plus numbers — and it is offered again next time, in that browser only (the site has no server); open for its scope table: a name clash with the master list, whether a brewer may change or delete master entries (inclination: only their own), whether saved ingredients travel in the recipe file or export as rows for the owner's workbook, and its own saved-format version. For the owner himself, a workbook row plus a session covers it. Needs the searchable ingredient boxes (the owner, 2026-09-23) | suites + inspector + far end | S8 |
| °C display toggle | Every temperature shown (the measurement temperatures, the hop wort temperature) switches °F/°C from a header toggle that persists with the display settings; needs `cToF` in the engine, so Tier A + B (split from Options page, 2026-09-21) | suites + inspector + far end | S6 |
| Inverse solver UI | A target OG yields a grain bill via `solveGrist`; the round-trip residual FLAG is shown | suites + inspector | S7 |
| Water linked to the recipe | The treatment choice (mash only; mash and kettle; hot-liquor tank) and the brewery setup (vessels, sparge method, treated volume and top-up, grain absorption, water kept in the mash tun), in the brewery defaults and the recipe; the mash water profile, the additions, and for the tank the sparge liquor's treated share; no predicted kettle minerals; saved format version 5. Water program step 4 | suites + inspector + far end | S4 |
| Mash pH from the grain bill (A + B) | A Troester/Kaiser mash pH model in the engine from each malt's type and colour, the mash water and the acid; a malt-type column in the ingredient workbook; checked against the owner's logged mash pH (cooled samples). Water program step 5 | suites + inspector + far end | S5 |
| Water on the printed sheet | The salt and acid additions, and where they go, on the brew-day sheet. Water program step 6 | suites + inspector | S4 |
| Sparge acidification | Acid for the sparge liquor. Left out of the water program (WP6c) | suites + inspector | S5 |
| Economics | Cost per batch and per unit via `rollupCost` / `costPerUnit` | suites + inspector | S7 |

## Tier C — components, styling

| Item | Sentence (draft) | Re-test | Session |
|---|---|---|---|
| Blank brewery figures name the built-in one | A blank box in My brewery (Options tab) says nothing about what a new recipe will get; show the built-in figure greyed inside the empty box (a `placeholder` on the shared input row, read from `defaultRecipeState()` through `display.js`), as the Home/Pro and gravity-unit choices already do with "Built-in (Home)" and "Built-in (°P)" (noticed building brewery defaults, 2026-09-23) | look at it | S6 |
| Measurement temperatures beside their volumes | The recipe's three measurement temperatures, and each volume at 60 °F, move from the Options tab onto the Volumes card beside the volume each one corrects, so the Options tab holds only the brewery's figures; the phone layout and the printed sheet follow. Deferred on the owner's call (2026-09-23, T3) when the two temperature groups on Options were relabelled "This recipe" and "New recipes start from" instead | look at it | S6 |
| Water Notes name the tool | The Water tab's Notes carry Brew Water Chem's validation note and both disclaimers word for word (Water tab, W8), so they call the tool "Brew Water Chem" and "this tool" inside Brew Design; decide whether they should read "the Water tab" or "Brew Design" (noticed building the Water tab, 2026-09-24) | look at it | unassigned |

## Tier D — config, docs, tooling, tests

| Item | Sentence (draft) | Re-test | Session |
|---|---|---|---|
| Dev-tooling major upgrades | Five advisories remain after `npm audit fix` (S1, 2026-09-23), each needing a major version: the test runner (vitest 3 → 5; a mock path-traversal advisory), esbuild under Vite 7 (reads files through the dev server on Windows), and the workbook reader's uuid (exceljs; the fix is a breaking downgrade). None reaches the built app a visitor loads — the bundle is byte-identical — so each waits for a planned upgrade with both suites re-run | suites | unassigned |
| Notes / methodology page | Later. The print sheet and the recipe file left this row on 2026-09-22 as items of their own | — | S7 |
