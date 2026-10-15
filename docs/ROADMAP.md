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
| S6e · Pro recipe default (Opus) | Scale the recipe when switching Home and Pro (`docs/items/pro-recipe-default.md`) | — (S7's tables are agreed) |
| S7 · Design tools | Inverse solver UI (target OG → grain bill) · Economics · Notes / methodology page | — |
| F1 · Guard rails (Tier C and D; Sonnet 5.5 builds, Opus advises) | Tests on GitHub for every push · A linter · Every box has a name a screen reader reads (`docs/items/guard-rails.md`; agreed 2026-10-06, before S8, F-Q7) | — (a trial session writes no scope tables) |
| S8 · My ingredients (Opus) | My ingredients (`docs/items/my-ingredients.md`; agreed 2026-10-07) | — |
| S9 · Acid aimed at a mash pH (Opus) | Acid aimed at a mash pH (`docs/items/acid-aimed-at-mash-ph.md`; agreed 2026-10-02, never placed in a session until 2026-10-07; its format rows brought up to date the same day). RA-5: the owner's malt measurements come after this item (the owner, 2026-10-07) | S11 |
| S10 · Wrong on screen (Tier C; Sonnet 5.5 builds, Opus advises) | Water Notes say mash pH is predicted · Liquid acid to 0.1 mL (built, then reverted before merging; rebuilt as Tier B on the owner's word, 0.1 mL at Home and whole mL in Pro, `docs/items/liquid-acid-tenth.md`, 2026-10-08) · Empty-fields line names each temperature beside its volume | — (a trial session writes no scope tables) |
| S10a · Engine corrections (Opus) | Boil concentration without the 1.01 · Morey's coefficients · IBU conversion 7489 (`docs/items/engine-corrections.md`); before S10b (RF-Q11, 2026-10-08) | — |
| S10b · References (Tier C and D; Sonnet 5.5 builds, Opus advises) | References page (`docs/items/references-page.md`; agreed 2026-10-08) | — (a trial session writes no scope tables) |
| S11 · Wrong numbers (Opus) | A new recipe at the brewery's batch (`docs/items/new-recipe-at-brewery-batch.md`) · 15.6 °C typed is the reference (`docs/items/reference-typed-in-celsius.md`) · A Cost card with no price reads "—" (`docs/items/cost-card-no-price.md`); scope tables agreed 2026-10-07 | S12 and S13 |
| S12 · Decisions owed (Opus) | Water volumes past their limits (A) (`docs/items/water-volumes-past-limits.md`) · Costs per batch when the recipe scales (`docs/items/costs-per-batch-when-scaling.md`) · Solve with volumes measured hot (A) (`docs/items/solve-volumes-measured-hot.md`); scope tables agreed 2026-10-08 | — |
| F2 · Guard rails 2 (Tier C and D; Sonnet 5.5 builds, Opus advises) | Security headers · Browser checks kept in the repo · Header unit toggles crowd in Pro (the owner's choice, a compact menu or a second row, asked by the builder) | — (a trial session writes no scope tables) |
| S13 · Data safety (Opus) | Measurement temperatures checked inside (`docs/items/measurement-temps-checked-inside.md`) · Page keeps working after an error (`docs/items/page-keeps-working-after-error.md`) · A control-character test warns in the linter (`docs/items/control-character-lint.md`); scope tables agreed 2026-10-08 | S14 and S15 |
| F3 · Guard rails 3 (Tier D; Sonnet 5.5 builds, Opus advises) | Three more response headers · The GitHub check runs the browser checks · One West Coast Pilsner for the acid tests (agreed 2026-10-09, "agree to all", F3-Q1 to F3-Q4; after S13, the order rule putting data safety first) | None (a trial session writes no scope tables) |
| S14 · Boxes and access (Tier C; Sonnet 5.5 builds, Opus advises) | Solved malt weights and Pro barrel boxes cut off (one question: widen or fewer decimals) · Keyboard focus and hover visible · Other automated accessibility findings | — (a trial session writes no scope tables) |
| S15 · Features (Opus) | My yeast strains (`docs/items/my-yeast-strains.md`) · A saved ingredient the owner's list later gains (`docs/items/saved-ingredient-on-owner-list.md`); scope tables agreed 2026-10-09 | — (S15b's table is agreed) |
| S15b · Water back (Opus) | Water back (`docs/items/water-back.md`; split from S15 on the owner's word, S15-Q0, 2026-10-09; scope table agreed 2026-10-09) | S16 |
| S16 · Water boxes and the HLT (Opus) | A water box keeps its figure until typed in (`docs/items/water-box-keeps-its-figure.md`) · A comma typed as the decimal point (`docs/items/comma-decimal-point.md`) · The HLT's figures when the sparge is more than the tank holds (A + B) (`docs/items/hlt-sparge-past-tank.md`); scope tables agreed 2026-10-12 | — (S15c's tables are agreed) |
| S15c · Water back, completed (Opus) | Water back as part of the fermentation volume (A + B) (`docs/items/water-back-in-fermentation-volume.md`) · Design to target OG with water back on (A + B) (`docs/items/target-og-with-water-back.md`) · Water back drawn from the hot-liquor tank (A + B) (`docs/items/water-back-from-the-hlt.md`); the owner's smoke test of S15b; scope tables agreed 2026-10-13; built after S16 (S15c-Q0) | S17 |
| S17 · Water back's salts and the acid (Opus) | The fermenter's sulfate and chloride with water back on (A + B) (`docs/items/fermenter-sulfate-chloride.md`) · Kettle salts when the acid drops the raising salt (`docs/items/kettle-salts-when-acid-aims.md`) · Grain bill edits return the brewer's own acid (`docs/items/grain-bill-edits-return-acid.md`); scope tables agreed 2026-10-14 | S18 |
| S18 · The page, the sources and the names (Opus) | An error outside the tabs shows a message (`docs/items/error-outside-the-tabs.md`) · Engine comments cite their sources as the owner gave them (A) (`docs/items/engine-comment-sources.md`) · The References page's names say References (`docs/items/references-names.md`); scope tables agreed 2026-10-14 (S18-Q0) | S19 |
| S19 · A way out, a stale note, blank figures (Opus) | A saved recipe the page cannot draw has a way out (`docs/items/way-out-of-page-error.md`) · The starter's note says the 400B band's boundaries leave no gap (A) (`docs/items/starter-flag-note.md`) · Figures that depend on an empty box read "—" on the Volumes card (C) (`docs/items/volumes-card-blank-figures.md`); scope tables agreed 2026-10-15 (S19-Q0, "agree to all") | the next batch |
| S20 · Orchestrated run (planned by S19; built by one orchestrator session, CLAUDE.md "Orchestrated run") | Batch O1 (Tier C; Sonnet 5.5 builds, Opus advises): A dose too small to show is left off the printed sheet (`docs/items/dose-rounds-to-nothing.md`) · My ingredients' empty note names the strain box (`docs/items/my-ingredients-empty-note.md`) · The Water Notes cite the CRC Handbook (`docs/items/notes-cite-crc.md`) · The References page's heading steps down one level (`docs/items/references-heading-level.md`). Batch O2 (Tier B; Opus builds, Opus inspects): The Volumes card and the line under the stats bar read one list (`docs/items/volumes-card-one-list.md`). Batch O3 (Tier D; Opus builds, M1): The development tools upgraded past their advisories (`docs/items/dev-tooling-upgrades.md`). One Opus reviewer per batch; one summary; one deploy. Scope tables agreed 2026-10-15 ("agree to all", R-1 to R-6, O-1 to O-5) | — (the last planned work; what follows is the owner's call) |

Agreed with the owner 2026-10-07 ("agree to all"): S9 to S15 and F2 above,
each batch at most three items. Left out on purpose: sparge acidification
(waits on a page of Palmer & Kaminski's *Water*; the owner does not acidify
his sparge), acidulated malt's lactic acid (waits on the owner's tests), App
state into one place, type checking and the dev-tooling major upgrades (large,
no change a brewer sees; held until the features slow), and the test totals
(taken by the next batch that touches `docs/TEST_COVERAGE.md`).

Shelved: the `correctVolumeToRef` identity. Closed: the predicted mash pH's
one decimal beside the range warning.

Left out of the orchestrated run on the owner's word (2026-10-15, R-2, R-3,
R-5, R-6): App state into one place and type checking (their value was
cheaper future features, and the features are nearly done), acidulated
malt's lactic acid (waits on the owner's tests), and sparge acidification
(the owner does not acidify his sparge; waits on a page of *Water*). Each
keeps its line below.

## Tier A — engine

| Item | Sentence (draft) | Re-test | Session |
|---|---|---|---|
| `correctVolumeToRef` identity — **shelved** | Its doc says the factor is exactly 1 at the reference temperature, but `(v · d) / d` differs from `v` by one ulp for v = 7 or 5 (exact for 16, 14.5, 12, 5.5); compute `v · (d / d)` or short-circuit `tempF === refTempF`; golden values unaffected (noticed writing the Options page table, 2026-09-21). Shelved 2026-09-22 on the owner's call: a floating-point artifact ~15 digits down, below every displayed precision and every test tolerance; only a test asserting exact bit-equality would see it. Kept so it is not rediscovered as a mystery | suites + inspector | shelved |
| Acidulated malt's lactic acid | The Water tab counts acidulated malt at 2 % lactic acid by weight (the engine's acid table, "published range 1–2 %; midpoint used"), while Troester titrated Weyermann Sauermalz at 315–358 mEq/kg, 2.85–3.22 % lactic, matching Weyermann's ~3 % (docs/sources, the 2009 paper §3.3); the mash pH model uses the 2 % so the app carries one figure (S5-B14); the owner kept 2 % (2026-10-02, S5-B26) and may test it; revisit if his tests say otherwise | suites + inspector | unassigned |

## Tier B — touches state, selectors, display, or reference-volume

| Item | Sentence (draft) | Re-test | Session |
|---|---|---|---|
| Sparge acidification | Acid for the sparge liquor. Left out of the water program (WP6c). Scope table agreed: `docs/items/sparge-acid.md`. Taken out of S5 on the owner's call (2026-10-02): he does not acidify his sparge; its built-in target pH also waits on a page in Palmer & Kaminski's *Water* | suites + inspector | unassigned |
| App.jsx state into one place | `App.jsx` is 487 lines holding 16 separate pieces of state and hands each card its values one by one; every feature lands there. Move the recipe's changes into one reducer (React's recommended pattern for complex state) with no figure or saved document changing, so new features touch less of it (structural review, 2026-10-06) | suites + inspector + far end | unassigned |

## Tier C — components, styling

| Item | Sentence (draft) | Re-test | Session |
|---|---|---|---|
| Predicted mash pH one decimal beside the range warning — **closed** | With the predicted mash pH shown to one decimal (S6d), a prediction of 5.61 to 5.64 shows "5.6" beside the warning "Outside 5.2–5.6", and 5.15 to 5.19 shows "5.2" beside it, so the figure reads as inside the range it is outside of. No figure changes (the range test reads the unrounded pH). Decide whether the warning names the figure it tested, or the screen shows two decimals only in the warning's case (noticed by the Opus advisor building "Printed sheet at a glance", 2026-10-05) Closed 2026-10-07 on the owner's call: a difference of a few hundredths of a pH unit is within the noise of the meters brewers use. Kept so it is not rediscovered | look at it | closed |
| The boil time box hands its blank figure to the page as is | With the boil time emptied, the Volumes card's boil time box is given the blank figure itself where the volume and temperature boxes are given an empty box, so React's development build warns "Received NaN for the `value` attribute" (seen in the unit suite while building S20 O2; the built app shows the box empty and logs nothing). Decide whether the box shows an empty box the same way as the others. No figure changes | look at it, suites | unassigned |

## Tier D — config, docs, tooling, tests

| Item | Sentence (draft) | Re-test | Session |
|---|---|---|---|
| Type checking | The code is plain JavaScript with no type checking (6 files carry JSDoc). Add checking, by TypeScript or JSDoc types under `tsc --checkJs`, engine first; it catches a class of errors the inspector now finds by reading. Large: touches every file, each gated by its tier (structural review, 2026-10-06) | suites + inspector | unassigned |
