# Design warnings — mash ratios and post-boil volume — Tier A + B

Status: agreed 2026-09-23 ("agree to all"), not started. Written by the spec
session; to be built by a new session from CLAUDE.md's kickoff prompt,
**after** `docs/items/yeast-card.md` has landed (W8): it reuses that item's
warning style.

## Why

The owner (2026-09-23): the mash ratios should "warn if outside the
recommended (see example workbook)", and the app should warn "if your post
boil volume is lower than you fermenter volume specified". His Recipe
Designer — the reference spreadsheet `Experiments Are Fun Recipe Designer
Rev 3.xlsm` and `Recipe Designer Template Rev 3.xlsm` alike — carries the
recommended mash ranges as text beside the computed values on
"Grist and Pitch Calc's":

- **F3** "Rv Should be 1.25-2", beside E3 "Estimated Mash Rv (qt/lb)"
- **F4** "R should be\n2.5-4", beside E4 "Estimated Mash R (lb/lb)"

The app computes both (`computeGrist` → `mashRv`, `mashR`) and shows them
read-only on the Volumes card, with no guidance.

## Sentences — what must be true afterwards

- **V1** When Mash Rv is outside 1.25–2 qt/lb, a warning beside it reads "Should be 1.25–2 qt/lb".
- **V2** When Mash R is outside 2.5–4 lb/lb, a warning beside it reads "Should be 2.5–4 lb/lb".
- **V3** When the post-boil volume is less than the fermentation volume, the Volumes card warns "Less wort after the boil than the fermenter volume".
- **V4** A warning changes no number and blocks nothing; a blank (not a number) value gives no warning.

## Decisions — agreed

| id | Question | Decision | Rule |
|---|---|---|---|
| M1 | Builder model | Opus, high effort | The Models rule's default, every tier (the owner, 2026-09-23) |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default. The four limits are spreadsheet cells (F3, F4); the boundary cases in the tests are worked by hand (below) |
| W1 | Ends of each range | Inside: 1.25 and 2, 2.5 and 4 give no warning | "Should be 1.25–2" reads as inclusive |
| W2 | The two ranges do not agree (R = Rv × 2.055, so 2.5–4 lb/lb is Rv ≈ 1.217–1.946) | Keep both exactly as the workbook has them, each checked against its own cell, with a `// FLAG:` in the engine recording the mismatch. Changed only if the owner gives new figures | The owner's cells are the rule; no invented reconciled range (SPEC rule 3) |
| W3 | Where the limits live | In the engine, beside the mash formulas, as constants from F3 and F4, exported through `index.js`; the app shows the warning only | SPEC rules 2 and 7: spreadsheet constants and every computed fact live in the engine |
| W4 | Which volumes are compared | Both at the 60 °F reference — the post-boil and fermentation volumes as the engine receives them (`refVolumesGal`). Equal volumes give no warning | Like with like, whatever temperature each was measured at |
| W5 | Home/Pro | The same checks in both modes; the mash units are the same, and the volume check runs on canonical gallons | SPEC display table; rule 9 |
| W6 | Printed sheet | No warnings on the sheet | Warnings are design aids; the sheet is for brew day |
| W7 | Look | An amber line under the value, the same style as the Yeast card's temperature warning | One look for every warning |
| W8 | Order | After the Yeast card | That item sets the style this one reuses |
| W9 | Tier and silent properties | Tier A (engine constants and checks) + B (selectors, Volumes card). **Idempotence/ordering:** pure functions of the recipe, recomputed every render. **Storage/schema:** nothing stored; no version change. **Blank:** a NaN value (a cleared field, an uncorrectable temperature — SPEC rule 11) gives no warning, since the stat itself shows a dash | The limits are numbers (CLAUDE.md catch-all) |
| W10 | Files | `packages/engine/src/grist.js` (the two ranges and a check beside `mashRv`/`mashR`), `packages/engine/src/index.js` (exports), `packages/engine/test/design-warnings.test.js` (new), `apps/recipe/src/selectors.js` (the three warnings in `computeRecipe`'s result), `apps/recipe/src/components/VolumesSection.jsx`, `apps/recipe/src/components/shared/styles.js` (only if the Yeast card left no warning token to reuse), `apps/recipe/test/design-warnings.test.js` (new), `SPEC.md` (only if a rule's text changes), `docs/TEST_COVERAGE.md`, `docs/ROADMAP.md` (the "Design warnings" row removed), this file | Smallest change |

## Scenarios — written first, must fail before

Engine, `packages/engine/test/design-warnings.test.js`:

1. *the mash ranges are the owner's cells: Rv 1.25–2 qt/lb, R 2.5–4 lb/lb* — W3. The exported constants equal 1.25, 2, 2.5, 4 (the rule is the cell, so no hand working is owed).
2. *Mash Rv warns outside 1.25–2 and not at either end* — V1, W1. Hand-worked, Rv = 4 × water (gal) / grain (lb): 5 gal on 16 lb = 20/16 = 1.25, no warning; 5 gal on 10 lb = 2.0, no warning; 5.5 gal on 10 lb = 2.2, warns; 3 gal on 10 lb = 1.2, warns.
3. *Mash R warns outside 2.5–4 and not at either end, each range on its own* — V2, W1, W2. Hand-worked, R = Rv × 2.055: 4.95 gal on 10 lb, Rv 1.98 (no Rv warning), R 1.98 × 2.055 = 4.0689, warns; 3.075 gal on 10 lb, Rv 1.23 (Rv warns), R 1.23 × 2.055 = 2.52765, no R warning.

App, `apps/recipe/test/design-warnings.test.js`:

4. *the default recipe shows no warning: Rv 20/11 ≈ 1.818, R ≈ 3.736, post-boil 5.5 equals fermentation 5.5* — V1–V3, W4. Hand-worked: 5 gal × 4 / 11 lb = 1.8182; × 2.055 = 3.7364; post-boil 7 − 1.5 × 1 = 5.5 gal.
5. *a fermentation volume above the post-boil volume warns; equal or below does not* — V3, W4. 5.6 warns; 5.5 and 5.0 do not.
6. *the volume check compares both volumes at the 60 °F reference* — W4. A fermentation volume measured warm whose 60 °F volume is below the post-boil volume gives no warning, though its measured figure is above (`correctVolumeToRef`).
7. *a warning changes no number, and a blank value gives none* — V4, W9. `computeRecipe` with and without the warnings' conditions differs only in the warnings; a cleared mash water or fermentation volume gives no warning and nothing throws.

Expected failure before the change: the constants, the check and the warnings do not exist. Record each scenario's trimmed failure.

## Far end — Tier A + B, on the built app

1. Default recipe: no warning.
2. Mash water 5.5 with the default 11 lb grist (Rv 2.0, R 4.11): no Rv warning, an R warning "Should be 2.5–4 lb/lb" — W2 visible. Mash water 3: Rv 1.09, R 2.24, both warn.
3. Fermentation volume 6: the Volumes card warns; 5.5: gone. Pro mode: the same, in bbl.
4. Every stat unchanged by the warnings; the printed sheet shows none.

## Notes from the spec session, for the builder

- **Engine today** (`grist.js`): `mashRv = (mashWaterGal * 4) / sumWeightLb`; `mashR = mashRv * 2.055`. The Volumes card shows them via `grist.mashRv.toFixed(3)` and `grist.mashR.toFixed(3)`.
- **The volumes** are already in `computeRecipe`'s result as `refVolumesGal.postBoil` and `refVolumesGal.ferment`. Whether the volume comparison is an engine function or a comparison in `selectors.js` is the builder's call; SPEC rule 7 forbids brewing math in the app, and a less-than between two engine outputs is not brewing math — record the choice in the builder's notes.
- **W2's FLAG** belongs beside the constants, giving both ranges and the Rv band where only one warns.
- **Engine count** in `docs/TEST_COVERAGE.md` grows by scenarios 1–3; the golden masters are untouched (no existing output changes).
- **Owner-facing language:** "your Recipe Designer's recommended range".

## Recorded failure (filled in by the builder)

## Builder's notes — choices the sentences did not make (filled in by the builder)
