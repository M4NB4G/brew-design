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
| S5 · Mash pH | Mash pH from the grain bill (step 5); the owner's logs and Troester's archived pages are in hand; item 1 (the engine model and its check against the owner's logs) landed; the owner closed the check (MP-Q11, 2026-10-02); item 2 (the malt types in the workbook and the recipe, the predicted mash pH on the Water tab and the sheet, recipe format 7) built, first held for S5b (G3), then live on its own on the owner's word (2026-10-02, G3 reversed; `main` 6e229e2) | S5b |
| S5b · Mash pH and the acid | On branch `S5b` from `main` (item 2 is live; G3 reversed, 2026-10-02): acid past neutral by Troester's acid-side slope (A) · the tested-range warning (A + B) · acid into the mash (B; recipe format 8, AM-Q1 revised 2026-10-03) (`docs/items/mash-ph-acid.md`) | S6b (S6a, a trial, needs none) |
| S6a · Polish, trial (Tier C; Sonnet 5.5 builds, Opus advises) | Water Notes name the tool · Printed sheet with water on one page | — (a trial session writes no scope tables) |
| S6c · Polish, widened trial (Tier B; Sonnet 5.5 builds, Opus advises and inspects) | Measurement temperatures beside their volumes · Blank brewery figures name the built-in one (`docs/items/blank-brewery-figures.md`) | — (a trial session writes no scope tables) |
| S6d · Printed sheet at a glance (Tier C; Sonnet 5.5 builds, Opus advises) | Printed sheet at a glance (`docs/items/print-sheet-legibility.md`) | — (a trial session writes no scope tables) |
| S6b · Polish (Opus) | °C display toggle · Pro unit choices (after S6c, WT-2) | S7 and S8 |
| S7 · Design tools | Inverse solver UI (target OG → grain bill) · Economics · Notes / methodology page | — |
| S8 · My ingredients | My ingredients | — |

Shelved: the `correctVolumeToRef` identity.

## Tier A — engine

| Item | Sentence (draft) | Re-test | Session |
|---|---|---|---|
| `correctVolumeToRef` identity — **shelved** | Its doc says the factor is exactly 1 at the reference temperature, but `(v · d) / d` differs from `v` by one ulp for v = 7 or 5 (exact for 16, 14.5, 12, 5.5); compute `v · (d / d)` or short-circuit `tempF === refTempF`; golden values unaffected (noticed writing the Options page table, 2026-09-21). Shelved 2026-09-22 on the owner's call: a floating-point artifact ~15 digits down, below every displayed precision and every test tolerance; only a test asserting exact bit-equality would see it. Kept so it is not rediscovered as a mystery | suites + inspector | shelved |
| Acidulated malt's lactic acid | The Water tab counts acidulated malt at 2 % lactic acid by weight (the engine's acid table, "published range 1–2 %; midpoint used"), while Troester titrated Weyermann Sauermalz at 315–358 mEq/kg, 2.85–3.22 % lactic, matching Weyermann's ~3 % (docs/sources, the 2009 paper §3.3); the mash pH model uses the 2 % so the app carries one figure (S5-B14); the owner kept 2 % (2026-10-02, S5-B26) and may test it; revisit if his tests say otherwise | suites + inspector | unassigned |
| Water volumes past their limits | A top-up level below the treated water the mash leaves gives a treated share over 100 %; kept as the arithmetic gives it, with a `// FLAG:` in the engine, because the treatment choice's sentences do not say; decide whether it warns, blanks, or is refused (noticed building the water treatment choice, 2026-10-02; its twin, a negative sparge, went when S4b made the sparge typed) | suites + inspector | unassigned |

## Tier B — touches state, selectors, display, or reference-volume

| Item | Sentence (draft) | Re-test | Session |
|---|---|---|---|
| Measurement temperatures checked inside | The reader checks that a saved recipe's measurement temperatures are an object, but not the three inside it, so a hand-damaged file whose post-boil temperature is text ("180") or missing loads: text is carried into the recipe (not a canonical number, SPEC rule 8) and a missing one blanks the volumes it corrects; check the three as a number or blank and refuse such a document like a damaged row (noticed building "Saved rows checked inside", 2026-09-23) | suites + inspector | unassigned |
| My ingredients | A brewer saves an ingredient that is not on the list — from a searchable box, typed name plus numbers — and it is offered again next time, in that browser only (the site has no server); open for its scope table: a name clash with the master list, whether a brewer may change or delete master entries (inclination: only their own), whether saved ingredients travel in the recipe file or export as rows for the owner's workbook, and its own saved-format version. For the owner himself, a workbook row plus a session covers it. Needs the searchable ingredient boxes (the owner, 2026-09-23) | suites + inspector + far end | S8 |
| °C display toggle | Every temperature shown (the measurement temperatures, the hop wort temperature) switches °F/°C from a header toggle that persists with the display settings; needs `cToF` in the engine, so Tier A + B (split from Options page, 2026-09-21). Scope table agreed: `docs/items/celsius-toggle.md` | suites + inspector + far end | S6b |
| Pro unit choices (A + B) | In Pro, two more choices beside the gravity unit, kept with the display settings: liquid volumes in barrels or gallons, and malt weights in pounds or 55 lb sacks. The 55 lb sack is a new unit factor, so it goes in the engine (SPEC 9: no conversion constant in the app). Decided by the owner, 2026-10-02: gallons covers every Pro volume except the dry-hop rate, which stays lb/bbl; a part sack shows as sacks and pounds (e.g. 3 sacks + 12 lb); hops stay in pounds; the brewery figures carry both choices, so a brewery works in its own units without converting on brew day; the printed sheet prints in the brewery's set units (where the brewery has set none, the screen's), departing from the print sheet's P3 for these two choices. Asked for by the owner, 2026-10-02. Scope table agreed: `docs/items/pro-unit-choices.md` | suites + inspector + far end | S6b |
| Inverse solver UI | A target OG yields a grain bill via `solveGrist`; the round-trip residual FLAG is shown | suites + inspector | S7 |
| Acid aimed at a mash pH (A + B) | The acid recommendation aims at a recipe target mash pH (default 5.4) through the model instead of the style's alkalinity; the salts keep the style's mineral targets and the style's residual alkalinity stays as information (the owner's reassessment of the pale styles' targets, RA-1 to RA-5, agreed 2026-10-02). Scope table agreed: `docs/items/acid-aimed-at-mash-ph.md` | suites + inspector + far end | after S5b |
| Water back | An option, off unless turned on, for adding hot-liquor-tank water to the fermenter after knock-out — a professional brewery's practice: knock out 400 gal, add 78 gal of tank water to the end of the run, 478 gal in the fermenter at pitch. The water-back volume is a recipe figure; the volume at pitch then feeds what depends on it (pitch gravity, cells needed, dry-hop rate), with the knock-out figures beside them. Open for its scope table: whether the added water is treated and what it adds in minerals; its temperature and the 60 °F correction; whether bitterness is diluted with it; which gravity the stats bar shows (knock-out or at pitch); whether the brewery figures carry it. Asked for by the owner, 2026-10-02; not in S4 | suites + inspector + far end | unassigned |
| Sparge acidification | Acid for the sparge liquor. Left out of the water program (WP6c). Scope table agreed: `docs/items/sparge-acid.md`. Taken out of S5 on the owner's call (2026-10-02): he does not acidify his sparge; its built-in target pH also waits on a page in Palmer & Kaminski's *Water* | suites + inspector | unassigned |
| Economics | Cost per batch and per unit via `rollupCost` / `costPerUnit` | suites + inspector | S7 |

## Tier C — components, styling

| Item | Sentence (draft) | Re-test | Session |
|---|---|---|---|
| Water Notes still say mash pH is not predicted | The Notes' Scope & Limitations says "Mash pH is not predicted yet" and the last Application Assumption says the app "does not predict mash pH"; both are untrue since S5 and S5b. Reword to say the Water tab predicts the mash pH of a cooled sample from the grain bill, within its tested range (noticed building "Water Notes name the tool", 2026-10-03). The water-tab scenario that pins the Notes' "mash pH is water program step 5" changes with it | look at it | unassigned |
| Predicted mash pH one decimal beside the range warning | With the predicted mash pH shown to one decimal (S6d), a prediction of 5.61 to 5.64 shows "5.6" beside the warning "Outside 5.2–5.6", and 5.15 to 5.19 shows "5.2" beside it, so the figure reads as inside the range it is outside of. No figure changes (the range test reads the unrounded pH). Decide whether the warning names the figure it tested, or the screen shows two decimals only in the warning's case (noticed by the Opus advisor building "Printed sheet at a glance", 2026-10-05) | look at it | unassigned |
| Acid shown to the tenth of a mL | Liquid acid shows and prints to whole mL, so a small dose reads well off: with the acid into the mash the West Coast Pilsner's recommendation for 8 gal is 2.42 mL of 75 % phosphoric and shows "2" (17 % low), and a brewer typing it in doses 2. Decide whether liquid acid shows one decimal (Home) as salts do (noticed building acid into the mash, S5b item C, 2026-10-03) | look at it | unassigned |
| Empty-fields line names the measurement temperatures last | The line under the stats bar names the empty boxes "in screen order" (E2), but the three measurement temperatures now sit on the Volumes card beside their volumes while the line still names them last, after the dry hops, as when they were on the Options tab. Decide whether the line names each beside its volume (pre-boil volume, pre-boil measurement temperature, boil-off …) so it reads in screen order; the line's text and every name stay as they are. Display order only, no figure changes (noticed building "Measurement temperatures beside their volumes", S6c item 1, 2026-10-05) | look at it, suites | unassigned |

## Tier D — config, docs, tooling, tests

| Item | Sentence (draft) | Re-test | Session |
|---|---|---|---|
| Test totals in TEST_COVERAGE | The "Total: engine 205, app 153" line has drifted: the suites run 212 and 165 (before S6a) and the line is not kept per item; correct it and decide whether the line stays (noticed building "Water Notes name the tool", 2026-10-03) | suites | unassigned |
| Dev-tooling major upgrades | Five advisories remain after `npm audit fix` (S1, 2026-09-23), each needing a major version: the test runner (vitest 3 → 5; a mock path-traversal advisory), esbuild under Vite 7 (reads files through the dev server on Windows), and the workbook reader's uuid (exceljs; the fix is a breaking downgrade). None reaches the built app a visitor loads — the bundle is byte-identical — so each waits for a planned upgrade with both suites re-run. Built on Opus, not in the Tier C and D trial: it replaces the test runner every check relies on (the owner's decision, 2026-10-02) | suites | unassigned |
| Notes / methodology page | Later. The print sheet and the recipe file left this row on 2026-09-22 as items of their own | — | S7 |
