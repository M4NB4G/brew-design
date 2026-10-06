# Scale the recipe when switching Home and Pro — Tier A + B

Status: agreed 2026-10-06 ("agree to all"; PD-Q2 settled as PD-Q2'' the same
day), not started. Written by the S6b session; built in batch S6e, on its own,
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
