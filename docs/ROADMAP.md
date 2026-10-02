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
| S4b · Water as brewed | Sparge water typed, the mash tun's water worked out · Kettle water and kettle salts at the recipe's brewhouse efficiency · "HLT" wording · My brewery banner · Brewery file | — (built by the S4 session, on the owner's word, 2026-10-02) |
| S5 · Mash pH | Mash pH from the grain bill (step 5) · Sparge acidification | S6 |
| S6 · Polish | Measurement temperatures beside their volumes · °C display toggle · Pro unit choices · Blank brewery figures name the built-in one | S7 and S8 |
| S7 · Design tools | Inverse solver UI (target OG → grain bill) · Economics · Notes / methodology page | — |
| S8 · My ingredients | My ingredients | — |

Shelved: the `correctVolumeToRef` identity.

## Tier A — engine

| Item | Sentence (draft) | Re-test | Session |
|---|---|---|---|
| `correctVolumeToRef` identity — **shelved** | Its doc says the factor is exactly 1 at the reference temperature, but `(v · d) / d` differs from `v` by one ulp for v = 7 or 5 (exact for 16, 14.5, 12, 5.5); compute `v · (d / d)` or short-circuit `tempF === refTempF`; golden values unaffected (noticed writing the Options page table, 2026-09-21). Shelved 2026-09-22 on the owner's call: a floating-point artifact ~15 digits down, below every displayed precision and every test tolerance; only a test asserting exact bit-equality would see it. Kept so it is not rediscovered as a mystery | suites + inspector | shelved |
| Water volumes past their limits | A top-up level below the treated water the mash leaves gives a treated share over 100 %; kept as the arithmetic gives it, with a `// FLAG:` in the engine, because the treatment choice's sentences do not say; decide whether it warns, blanks, or is refused (noticed building the water treatment choice, 2026-10-02; its twin, a negative sparge, went when S4b made the sparge typed) | suites + inspector | unassigned |
| Kettle shares past their limits | The kettle water (S4b) takes the mash's salts at the recipe's brewhouse efficiency and the sparge's in the share of the kettle the mash liquor leaves; the item's sentences set no limit, so the shares are kept as the arithmetic gives them, with a `// FLAG:`: a low efficiency against the volumes asks for more sparge than there is (the built-in 75 % with the worked example: 8.75 gal of an 8.5 gal sparge, a share of 1.029), a high one gives a sparge share below 0 (95 % with 16 gal of mash water: −0.14), and with no sparge a short kettle gives a mash share above 1 (7 gal of mash water for 14 gal: 2). Decide whether to hold each at 0 or 1, warn, or blank (noticed building the kettle water, 2026-10-02; the first build held them, and its inspector sent the choice back to the owner) | suites + inspector | unassigned |

## Tier B — touches state, selectors, display, or reference-volume

| Item | Sentence (draft) | Re-test | Session |
|---|---|---|---|
| Measurement temperatures checked inside | The reader checks that a saved recipe's measurement temperatures are an object, but not the three inside it, so a hand-damaged file whose post-boil temperature is text ("180") or missing loads: text is carried into the recipe (not a canonical number, SPEC rule 8) and a missing one blanks the volumes it corrects; check the three as a number or blank and refuse such a document like a damaged row (noticed building "Saved rows checked inside", 2026-09-23) | suites + inspector | unassigned |
| My ingredients | A brewer saves an ingredient that is not on the list — from a searchable box, typed name plus numbers — and it is offered again next time, in that browser only (the site has no server); open for its scope table: a name clash with the master list, whether a brewer may change or delete master entries (inclination: only their own), whether saved ingredients travel in the recipe file or export as rows for the owner's workbook, and its own saved-format version. For the owner himself, a workbook row plus a session covers it. Needs the searchable ingredient boxes (the owner, 2026-09-23) | suites + inspector + far end | S8 |
| °C display toggle | Every temperature shown (the measurement temperatures, the hop wort temperature) switches °F/°C from a header toggle that persists with the display settings; needs `cToF` in the engine, so Tier A + B (split from Options page, 2026-09-21) | suites + inspector + far end | S6 |
| Pro unit choices (A + B) | In Pro, two more choices beside the gravity unit, kept with the display settings: liquid volumes in barrels or gallons, and malt weights in pounds or 55 lb sacks. The 55 lb sack is a new unit factor, so it goes in the engine (SPEC 9: no conversion constant in the app). Decided by the owner, 2026-10-02: gallons covers every Pro volume except the dry-hop rate, which stays lb/bbl; a part sack shows as sacks and pounds (e.g. 3 sacks + 12 lb); hops stay in pounds; the brewery figures carry both choices, so a brewery works in its own units without converting on brew day; the printed sheet prints in the brewery's set units (where the brewery has set none, the screen's), departing from the print sheet's P3 for these two choices. Asked for by the owner, 2026-10-02 | suites + inspector + far end | S6 |
| Inverse solver UI | A target OG yields a grain bill via `solveGrist`; the round-trip residual FLAG is shown | suites + inspector | S7 |
| Mash pH from the grain bill (A + B) | A Troester/Kaiser mash pH model in the engine from each malt's type and colour, the mash water and the acid; a malt-type column in the ingredient workbook; checked against the owner's logged mash pH (cooled samples). Water program step 5. Scope table agreed: `docs/items/mash-ph.md` | suites + inspector + far end | S5 |
| Water back | An option, off unless turned on, for adding hot-liquor-tank water to the fermenter after knock-out — a professional brewery's practice: knock out 400 gal, add 78 gal of tank water to the end of the run, 478 gal in the fermenter at pitch. The water-back volume is a recipe figure; the volume at pitch then feeds what depends on it (pitch gravity, cells needed, dry-hop rate), with the knock-out figures beside them. Open for its scope table: whether the added water is treated and what it adds in minerals; its temperature and the 60 °F correction; whether bitterness is diluted with it; which gravity the stats bar shows (knock-out or at pitch); whether the brewery figures carry it. Asked for by the owner, 2026-10-02; not in S4 | suites + inspector + far end | unassigned |
| Sparge acidification | Acid for the sparge liquor. Left out of the water program (WP6c). Scope table agreed: `docs/items/sparge-acid.md` | suites + inspector | S5 |
| Economics | Cost per batch and per unit via `rollupCost` / `costPerUnit` | suites + inspector | S7 |

## Tier C — components, styling

| Item | Sentence (draft) | Re-test | Session |
|---|---|---|---|
| Blank brewery figures name the built-in one | A blank box in My brewery (Options tab) says nothing about what a new recipe will get; show the built-in figure greyed inside the empty box (a `placeholder` on the shared input row, read from `defaultRecipeState()` through `display.js`), as the Home/Pro and gravity-unit choices already do with "Built-in (Home)" and "Built-in (°P)" (noticed building brewery defaults, 2026-09-23) | look at it | S6 |
| Measurement temperatures beside their volumes | The recipe's three measurement temperatures, and each volume at 60 °F, move from the Options tab onto the Volumes card beside the volume each one corrects, so the Options tab holds only the brewery's figures; the phone layout and the printed sheet follow. Deferred on the owner's call (2026-09-23, T3) when the two temperature groups on Options were relabelled "This recipe" and "New recipes start from" instead | look at it | S6 |
| Water Notes name the tool | The Water tab's Notes carry Brew Water Chem's validation note and both disclaimers word for word (Water tab, W8), so they call the tool "Brew Water Chem" and "this tool" inside Brew Design; decide whether they should read "the Water tab" or "Brew Design" (noticed building the Water tab, 2026-09-24) | look at it | unassigned |
| Printed sheet with water on one page | With the Water Treatment section the built-in recipe's sheet is 10.91 in tall against the 10 in a Letter page prints (9.16 in without it; the section is 1.75 in after compacting the volumes into one line and the mash pH box beside the additions), so a small recipe with water now prints on two pages; decide whether to tighten the whole sheet (type size, margins, row padding) or accept two pages (noticed building water on the printed sheet, 2026-10-02) | look at it | unassigned |

## Tier D — config, docs, tooling, tests

| Item | Sentence (draft) | Re-test | Session |
|---|---|---|---|
| Dev-tooling major upgrades | Five advisories remain after `npm audit fix` (S1, 2026-09-23), each needing a major version: the test runner (vitest 3 → 5; a mock path-traversal advisory), esbuild under Vite 7 (reads files through the dev server on Windows), and the workbook reader's uuid (exceljs; the fix is a breaking downgrade). None reaches the built app a visitor loads — the bundle is byte-identical — so each waits for a planned upgrade with both suites re-run | suites | unassigned |
| Notes / methodology page | Later. The print sheet and the recipe file left this row on 2026-09-22 as items of their own | — | S7 |
