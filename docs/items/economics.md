# Cost of a batch — Tier A + B

Status: agreed 2026-10-05 ("agree to all"; EC-Q6 agreed 2026-10-06, "agree
to all"), not started. Written by the S6b session; built in batch S7, second of its
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
