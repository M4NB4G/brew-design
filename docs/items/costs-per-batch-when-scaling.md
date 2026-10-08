# Costs per batch when the recipe scales — Tier B

Status: agreed 2026-10-08 ("agree to all"); not started. Written by the S11
session; built in batch S12, item 2 (docs/ROADMAP.md, Sessions).

## Why

Scaling the recipe to a batch (the Home/Pro switch, SPEC rule 8) multiplies
every amount but leaves the yeast's price and the Cost card's other lines as
they were, each being a cost per batch: a 5.5 gal recipe with $8 of yeast
scaled to 10 bbl still costs $8 of yeast. The switch's question does not say
so (noticed building "Cost of a batch", S7 item 2, 2026-10-06).

## Sentences — what must be true afterwards

- **CS-S1** Scaling the recipe leaves the yeast's price and every other cost line as typed (cost per batch).
- **CS-S2** When the yeast's price or any other cost line is priced, the scale question names them: "The yeast's price and the other cost lines are per batch and stay as typed."
- **CS-S3** When none of them is priced, the question reads as today.
- **CS-S4** Nothing else changes: what scales (PD-S4), the malt and hop prices (per lb and per oz, so their lines' costs follow the scaled amounts), the answer's effect, and no saved format changes.

## Decisions — agreed 2026-10-08 ("agree to all")

| id | Question | Decision | Rule |
|---|---|---|---|
| CS-Q1 | On the Home/Pro scale, should the yeast's price and the other cost lines (each per batch) scale, stay, or stay with the question saying so? | Stay. When any of them is priced, the scale question names them: "The yeast's price and the other cost lines are per batch and stay as typed." | A fixed cost such as a lab fee does not scale, and the app cannot tell which lines do; a figure the brewer typed is never changed silently |
| M1 | Builder model | Opus, high effort | The Models rule's default |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default |
| K | Silent properties | **Atomicity:** a scale is one step and one autosave, as today. Nothing new is saved; no saved format changes | — |

## Scenarios — to be written first, must fail before

App (`apps/recipe/test/pro-recipe-default.test.js`, or a new file): *the question names the per-batch costs when one is priced* (the yeast at $8, or an other line at $3.70: the sentence present); *the question is as today when none is priced* (the built-in recipe: byte for byte today's question); *scaling leaves them as typed* (5.5 gal → 10 bbl with yes: the yeast still $8, CO2 still $3.70; Pale at $1.20/lb on 563.636 lb costs 676.36, by hand); *nothing else changes*.

## Notes for the builder

- The question is built in `apps/recipe/src/state.js` (`switchMode`); the scale is the engine's `scaleRecipe` (unchanged: it already leaves the per-batch prices).
- "Priced" is EC-Q6's: a price that is a number (0 included).
- Files likely touched: `apps/recipe/src/state.js`; SPEC rule 8; `docs/TEST_COVERAGE.md`.
