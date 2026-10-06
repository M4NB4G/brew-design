# Scale the recipe when switching Home and Pro — Tier A + B

Status: landed 2026-10-06 in batch S6e on branch `ccr-4383daa1-vqcze5`, as
"Switching Home and Pro asks whether to scale the recipe to that side's batch,
and a new recipe that opens in Pro starts at 10 bbl"; agreed 2026-10-06
("agree to all"; PD-Q2 settled as PD-Q2'' the same day; PD-B1 and PD-B2
agreed while building). Written by the S6b session; built in batch S6e, on its own,
before S7 (docs/ROADMAP.md, Sessions).

## Why

Switching Home to Pro changes the units only, so the built-in 5.5 gal recipe
shows as 0.177 bbl, with every Pro figure a small decimal. The owner wants a
Pro recipe default: on the switch, the recipe can be scaled to a brewery-sized
batch (2026-10-06).

## Sentences — what must be true afterwards

- **PD-S1** Switching Home → Pro asks whether to scale the recipe to the Pro batch ("Scale this recipe to the Pro batch, 10 bbl?"). Yes scales it; No leaves it as it is, shown in Pro's units. A switch never changes a figure without the brewer's yes.
- **PD-S2** Switching Pro → Home asks the same for the Home batch.
- **PD-S3** The batch is My brewery's batch (fermentation) volume when it is set, in either direction; where it is blank, 10 bbl (310 gal) for Pro and the built-in 5.5 gal for Home. When the recipe's fermentation volume already equals the batch, nothing is asked.
- **PD-S4** Scaling multiplies every amount by the batch ÷ the recipe's fermentation volume: each malt weight, each kettle and dry hop weight, the mash water, the pre-boil, fermentation and sparge volumes, the boil-off rate, the HLT's treated volume and top-up level, and the brewer's own salt and acid amounts. Percents, times, temperatures, the efficiency, the attenuation and the yeast are unchanged, so OG, FG, ABV, SRM and IBU are unchanged. Nothing is rounded.
- **PD-S5** Reset to defaults in Pro, with My brewery's batch volume blank, starts the built-in recipe scaled to 10 bbl.
- **PD-S6** Nothing else changes: no saved format changes, and declining the offer leaves every figure as before.

## Decisions — agreed 2026-10-06 ("agree to all")

| id | Question | Decision | Rule |
|---|---|---|---|
| PD-Q1 | When does the recipe change size? | On the Home ↔ Pro switch, by a question the brewer answers; never silent | A unit switch must not change numbers the brewer did not ask to change |
| PD-Q2 | The built-in Pro batch | 10 bbl in the fermenter. **Replaced by PD-Q2'', the owner, 2026-10-06** | — |
| PD-Q2' | A "Pro batch volume" brewery figure | Proposed and withdrawn: **replaced by PD-Q2''** | — |
| PD-Q2'' | Which batch | My brewery's batch volume whenever it is filled in, whatever it is; 10 bbl only where it is blank (5.5 gal for Home) | The owner, 2026-10-06: a Pro brewery's batch is already a Pro-sized number, and that brewery does not use Home |
| PD-Q3 | Which batch is the target | Superseded by PD-Q2'' | — |
| PD-Q4 | What scales | Every amount by the ratio of fermentation volumes (PD-S4); percents, times, temperatures, efficiency, attenuation and yeast stay | Same ratios keep OG, FG, ABV, SRM and IBU; the boil-off rate scales or the post-boil volume and OG drift |
| PD-Q5 | Rounding | None; shown at today's precision | No made-up digits |
| PD-Q6 | Pro → Home | The same offer in reverse (PD-S2, PD-S3) | Symmetry; a round trip returns the same recipe |
| PD-Q7 | Reset in Pro with no brewery batch | The built-in recipe scaled to 10 bbl | A new Pro recipe should not start at 0.177 bbl |
| PD-Q8 | Saved formats | None: no new saved figure | One format change only when it carries information |
| PD-Q9 | When it is built | Its own session, S6e, before S7 | It changes what every Pro user sees first |
| PD-B1 | (asked while building, agreed 2026-10-06) What "Reset in Pro" means, since Reset also resets Home/Pro | A new recipe that opens in Pro — My brewery's Home/Pro set to Pro, its batch blank — on Reset or on a first visit with no saved recipe. Reset pressed while viewing Pro with My brewery's Home/Pro blank still lands in Home at 5.5 gal, as before | SPEC 17: a new recipe takes the brewery's display settings, or the built-in ones |
| PD-B2 | (asked while building, agreed 2026-10-06) My brewery's greyed figures with My brewery set to Pro and the batch blank | They follow: each greyed box names the figure a new recipe actually gets, scaled (10 bbl, 12.727273 bbl pre-boil, 2.727273 bbl/hr) | SPEC 17: the greyed figure is the one a new recipe gets in its place |
| M1 | Builder model | Opus, high effort | The Models rule's default |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default |
| K | Silent properties | **Atomicity:** a scale is one step and one autosave. **Idempotence:** Home → Pro → Home with yes both ways returns the same amounts within floating-point round-off. Storage disabled and multi-tab as today | — |

## Scenarios — to be written first, must fail before

Engine (`packages/engine/test/scale.test.js`, new): *a recipe scales to a batch* (5.5 → 310 gal: ratio 310 / 5.5 = 56.3636…, 10 lb → 563.636 lb, 1 oz → 56.364 oz, by hand; OG, FG, ABV, SRM and IBU unchanged through the engine's forward calculation); *scaling back returns the recipe*. App (`apps/recipe/test/pro-recipe-default.test.js`): *switching to Pro offers the Pro batch* (10 bbl with no brewery batch; the brewery's batch when set; no offer when already at it); *yes scales, no changes nothing*; *switching to Home offers the Home batch*; *Reset in Pro starts at 10 bbl*; *nothing else changes* (the saved document's format and every figure when the offer is declined).

## Notes for the builder

- Scaling produces recipe values: an engine function (Tier A), called through `selectors.js` (SPEC rule 10); the built-in 10 bbl is an engine or state constant with its rule written beside it (the owner's decision, PD-Q2'').
- The question is a confirm on the switch (`App.jsx`); the header's Pro/Home toggle calls it.
- A blank fermentation volume cannot give a ratio: the builder decides whether the offer is then not made, and records it (a question to the owner if it is not obvious).
- Salt and acid amounts that follow the recommendation are not stored (they are worked out); only the brewer's own amounts scale.
- Files likely touched: `packages/engine/src/` (a scale function, `index.js`); `apps/recipe/src/{state,selectors}.js`, `App.jsx`; SPEC rules 8 and 17; `docs/TEST_COVERAGE.md`.

## Builder's notes (S6e, 2026-10-06)

Claims for the inspector to verify; none is a decision the sentences made.

- A blank, zero or negative fermentation volume, or batch, gives no ratio: nothing is asked and the switch changes units only (the notes left this to the builder).
- The fermentation volume is set to the batch itself rather than multiplied (fermentation volume × batch ÷ fermentation volume is the batch by arithmetic), so a scaled recipe sits exactly at its batch and the "already at the batch" check holds without floating-point round-off. Every other amount is multiplied; a blank (NaN) stays blank.
- The question names the batch in the target side's volume unit (Pro's bbl or gal choice; Home gal), to two decimals (display precision): "10 bbl", "310 gal", "15 bbl", "5.5 gal". A second line says what OK and Cancel do, since the browser's confirm shows OK and Cancel, not Yes and No.
- The built-in Pro batch is a state constant, 10 bbl, the owner's figure (PD-Q2''); its gallons come through `display.js`'s barrel conversion (the engine's 31 gal/bbl), so no conversion is written outside it (SPEC 9).
- The scale is the engine's (`scaleRecipe`, new `packages/engine/src/scale.js`, exported from `index.js`), called through `selectors.js` (`scaleRecipeTo`, SPEC 10); `state.js` imports it from `selectors.js` (no import cycle).
- A new recipe in Pro with the batch blank scales the built-in recipe first, then puts the brewery's set figures in place, so a set pre-boil volume or efficiency is the brewery's, unscaled.
- The brewer's own salt and acid amounts are multiplied; amounts that follow the recommendation (none stored) stay so; the scale does not return the brewer's amounts to the recommendation as a typed mash-water change does. The water report, grain absorption, measurement temperatures and every choice are unchanged.
- The greyed figures (PD-B2) read the new recipe the brewery's figures make, in place of the built-in recipe; for every case but Pro with the batch blank they are the same figures as before.
- Scale and switch are set in one handler, so React renders once and the autosave writes once (K, atomicity). Far end: one confirm per switch, the saved copy at version 10 after it.
- Numbers introduced: 10 (bbl, the Pro batch: the owner's PD-Q2'', pinned at 310 gal = 10 × 31 by hand in both scenarios); the ratio batch ÷ fermentation volume (PD-S4, pinned by hand: 620/11 in both scenario files); the question's two decimals (display precision).
- Noticed and put on the roadmap: a new Pro recipe with the brewery's batch set takes the built-in 5.5 gal amounts beside it (Tier B); Pro barrel boxes cut off a figure that is not round (Tier C).
