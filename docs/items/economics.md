# Cost of a batch — Tier A + B

Status: agreed 2026-10-05 ("agree to all"; EC-Q6 agreed 2026-10-06, "agree
to all"); landed 2026-10-06 on branch `S7` as "A Cost card prices each malt,
hop, dry hop, the yeast and other lines, and the batch costs their total and
its cost per gal or bbl (recipe format 11)"; awaiting the owner's "merge and
push". Written by the S6b session; built in batch S7, second of its
three items, after design to a target OG (docs/ROADMAP.md, Sessions).
Follows S6b (recipe format 10): this item takes recipe format 11.

## Why

The engine has a cost roll-up (`rollupCost`: quantity × unit price per line,
and their total) and a cost per unit of output (`costPerUnit`), with nothing
on screen and no prices: the engine ships none, by design. A brewer pricing a
batch types the prices they pay.

## Sentences — what must be true afterwards

- **EC-S1** A Cost card on the Recipe tab lists each malt, kettle hop and dry hop by name, the yeast, and any "other" lines the brewer adds (a name and a cost per batch), each with a price box: a malt per lb (per sack in Pro with sacks), a hop per oz at Home and per lb in Pro, the yeast per batch.
- **EC-S2** Each line's cost is its quantity times its price, and the batch total their sum, from the engine's `rollupCost`; the cost per gal at Home, per bbl in Pro (per gal with Pro's gallons choice), at the fermentation volume, from `costPerUnit`. Costs show in $ to two decimals.
- **EC-S3** Prices are saved with the recipe and its file (recipe format 11); a version-1 to 10 document reads with every price blank. Picking an ingredient leaves its row's price as it was; a new row's price is blank.
- **EC-S4** The engine's cost per unit is blank, not 0, when the batch volume is zero, negative or blank (shown "—").
- **EC-S5** The Cost card is not on the printed sheet. Nothing else changes: every other figure, label and the printed sheet are as before.

## Decisions — agreed 2026-10-05 ("agree to all")

| id | Question | Decision | Rule |
|---|---|---|---|
| EC-Q1 | Where prices come from | Typed by the brewer on a Cost card, per line, saved with the recipe (recipe format 11) | The engine ships no prices; prices belong to the purchase |
| EC-Q2 | Cost per what | Per batch, and per gal (Home) or per bbl (Pro, or per gal with Pro's gallons choice), at the fermentation volume | No packaging-loss model exists |
| EC-Q3 | Cost per unit for a zero or blank batch volume | Blank ("—"), not 0: the engine changes (Tier A) | A 0 is a number the brewer did not enter |
| EC-Q4 | Currency | "$", no conversion | The owner's market |
| EC-Q5 | On the printed sheet | No | The sheet is for brew day |
| EC-Q6 | A line with no price (agreed 2026-10-06, "agree to all") | The line shows "—"; the total and the cost per unit add the priced lines and say how many are unpriced ("3 lines unpriced"); a blank price is not named in the empty-fields line under the stats bar, as it feeds no recipe figure | A cost card is useful before every price is known; the count keeps the total honest |
| M1 | Builder model | Opus, high effort | The Models rule's default |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default |
| K | Silent properties | **Schema migration:** recipe format 11; versions 1–10 read with prices blank; each row's price checked as a number or blank, like its other figures (saved rows checked inside). Prices are never brewery figures. Ordering, storage disabled, multi-tab as today | — |

## Scenarios — to be written first, must fail before

Engine (`packages/engine/test/economics.test.js`, new): *cost per unit is blank for a zero, negative or blank batch* (and 120 / 5.5 = 21.818… by hand otherwise). App (`apps/recipe/test/economics.test.js`): *each line costs its quantity times its price* (10 lb at $1.20 = $12.00; 2 oz at $2.50 = $5.00; Pro: 1 lb hop at $40 = $40.00; sacks: 3.22 sacks at $60 = $193.20, by hand); *the total and the cost per unit* (per gal Home, per bbl Pro: total ÷ (gal ÷ 31)); *prices are saved and older documents read blank*; *nothing else changes* (a before-capture of the Recipe tab's cards and the sheet; the saved document as before at version 11 with blank prices).

## Notes for the builder

- `rollupCost` and `costPerUnit` are engine compute functions: call them in `selectors.js` only (SPEC rule 10).
- Prices are canonical per lb (malt), per oz (hop), per batch (yeast, other): per sack, per Pro lb of hop and per bbl convert at the edge in `display.js` with the engine's `LB_PER_SACK`, `OZ_PER_LB`, `GALLONS_PER_BBL`; no new constant.
- Where prices live in state (e.g. a price on each malt, hop and dry-hop row, one on the yeast, and a list of other lines) is the builder's choice; the row checks in `persistence.js` then require them in format 11.
- The format number assumes this item lands after S6b and before the acid aimed at a mash pH (`docs/items/acid-aimed-at-mash-ph.md`, AA-Q4), which also plans one: whichever lands first takes the next number.
- Files likely touched: `packages/engine/src/economics.js`; `apps/recipe/src/{state,persistence,selectors,display}.js`, `App.jsx`, a new `components/CostCard.jsx`, `ingredient-search.js` (new rows); SPEC rules 8, 13 and the display-units table; `docs/TEST_COVERAGE.md`.

## Builder's notes (S7, 2026-10-06)

Claims for the inspector to verify; none is a decision the sentences made.

- Where prices live (the notes left it to the builder): `pricePerLb` on each malt row, `pricePerOz` on each kettle and dry-hop row, `pricePerBatch` on the yeast, and `otherCosts: [{ name, costPerBatch }]` on the recipe, each blank (NaN) in the built-in recipe and on a new row. The built-in rows are the reader's templates, so format 11 requires every price as a number or blank; the other lines are checked as a list of a text name and a number or blank. A version-1 to 10 document is upgraded with every price blank and no other lines before the checks.
- `selectors.js`'s `computeCost(recipe)` is the only caller of `rollupCost` and `costPerUnit` (SPEC 10). Lines in the card's order: malts, kettle hops, dry hops, the yeast (quantity 1), the other lines (quantity 1). Each line's cost is `rollupCost`'s (an unpriced line's is blank, "—"); the total is `rollupCost` over the priced lines only, and `unpriced` counts the rest (EC-Q6). A priced line whose quantity is blank (a cleared weight) has a blank cost, and so does the total: a blank figure blanks what needs it; the weight is already named under the stats bar.
- The cost per gal is `costPerUnit(total, fermentation volume at 60 °F)`: the fermentation volume goes through `toReferenceVolume` like every volume that reaches the engine (SPEC 11); at the built-in 60 °F it is the volume as entered. Per bbl is per gal × 31 at the display edge (`costPerVolumeFromCanonical`, the engine's `GALLONS_PER_BBL`).
- Prices convert only in `display.js`: per sack = per lb × 55 (`LB_PER_SACK`), a Pro hop per lb = per oz × 16 (`OZ_PER_LB`); entries convert back by division. No new constant.
- A line is named as the empty-fields line names rows: its name, or "Malt n", "Kettle hop n", "Dry hop n"; the yeast line by its strain, or "Yeast"; an other line's name is its own text box, its price box labelled "Line n" while unnamed. Quantities show to two decimals in the screen's units; the yeast and other lines "1 batch". Costs to the cent via `format.js`'s `dollars` ("$12.00", blank "—").
- With no line priced the total and the cost per gal read $0.00 beside the count (EC-Q6's sum of the priced lines); a `// FLAG:` in `selectors.js` and a roadmap line.
- The engine's `costPerUnit` returns NaN for a batch that is not above zero (zero, negative, NaN, missing), where it returned 0 (EC-S4); no other caller existed.
- Earlier scenarios changed for the format: those that pinned version 10 pin 11 (acid-in-mash, celsius-toggle, identity, inverse-solver, mash-ph, measurement-temps-volumes, options, pro-recipe-default, pro-unit-choices, recipe-file, sparge-typed, water-saved, yeast-card); the "newer version" checks read `SCHEMA_VERSION + 1` in place of a written 11; recipes built by hand gain blank prices (acid-in-mash's malts, persistence's and recipe-file's malt rows, yeast-card's yeast, the pro-unit-choices fixture's dry hop); expectations of documents and of older documents read gain blank prices through `test/blank-prices.js`; ingredient-search's new rows carry blank prices. No assertion was loosened; the smoke test is untouched.
- Numbers introduced: none that is a recipe value. Each cost is quantity × price (the engine's `rollupCost`), pinned by hand ($12.00, $5.00, $40.00, $193.20, $34.00, $32.50); the cost per unit is the engine's `costPerUnit`, pinned by hand (21.818… in the engine, $6.18, $191.64, $5.91 in the app); 55, 16 and 31 are the engine's unit constants; two decimals are display precision; step and min are input attributes.
- Noticed and put on the roadmap: per-batch costs do not scale with the recipe (Tier B); a Cost card with no price reads $0.00 (Tier B).
