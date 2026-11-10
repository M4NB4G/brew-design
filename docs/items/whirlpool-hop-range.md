# A whirlpool hop outside the model's range, Tier A

Status: agreed 2026-11-10, not started. Written by the planning session of
the run "wrong-on-first-use"; batch 1, item 1 (docs/ROADMAP.md, Sessions).

## Why

The whirlpool temperature factor (`packages/engine/src/hops.js`) is a
quadratic in the wort temperature. It reaches its minimum, 0.2187, at
167.0 °F and rises again below it: 0.3302 at 150 °F and 1.0000 at 122 °F, so
a cooler hop stand shows more bitterness than a hotter one (20 min, 1 oz at
10 % alpha in 6 gal: 6.02 IBU at 150 °F against 5.18 at 180 °F). Above 212 °F
it passes 1 (1.035 at 213 °F, 1.30 at 220 °F). Nothing warns or limits the
box (read-through, 2026-11-10).

The article (Meiners and Cavanna, Skeptical Brewing, Part 3, *Zymurgy*
May/June 2022) is not in `docs/sources`, and no item file gives the range it
fitted. The curve itself passes exactly through 1.00 at 212 °F, 0.50 at
194 °F and 0.25 at 176 °F (halving every 18 °F; its coefficients are
1/2592, 334/2592 and 28456/2592 to the digits written), so 176 to 212 °F is
the range it is tied to. That is the planning session's inference from the
arithmetic; the owner agreed the range (H-1).

## Sentences: what must be true afterwards

- **WH-S1** From 176 to 212 °F every hop's temperature factor, and every bitterness figure, is as today.
- **WH-S2** Below 176 °F a hop's temperature factor is the curve's own figure at 176 °F; it never rises as the wort gets cooler.
- **WH-S3** Above 212 °F a hop's temperature factor is the curve's own figure at 212 °F; a hop never counts for more than at the boil.
- **WH-S4** The Hops card names each kettle hop below 176 °F and says its bitterness is held at the 176 °F figure, in the header's temperature unit; the printed hop schedule marks the same hops the same way. A hop at 176 °F or above carries no note.
- **WH-S5** A blank hop temperature is a blank figure, as today.
- **WH-S6** The specification records the two limits as a departure from Rev 4, the owner's decision of 2026-11-10, as it does for the starter; the References page states the range beside the equation.

## Decisions: agreed 2026-11-10

| id | Question | Decision | Rule |
|---|---|---|---|
| H-1 | The range the curve is used on | 176 to 212 °F | The curve's own three exact points (212, 194, 176 °F); the article is not in the repository |
| H-2 | Below the range | The factor is held at the range's low end and the hop is named | A cooler stand never shows more bitterness than a hotter one |
| H-3 | Above 212 °F | The factor is held at the boil's; the box refuses an entry above 213 °F (the owner: "I am cool with 213 being the cutoff"). The refusal is built in item 3 (`docs/items/impossible-entries.md`), not here | The model has no data above the boil; wort boils a fraction of a degree above water |
| H-4 | Saved recipes with a hop below 176 °F show a different IBU after the deploy | Accepted; no saved format changes | The stored recipe is unchanged; only the figure worked out from it moves |
| M1 | Builder model | Opus 5.5, high effort | CLAUDE.md, Models |
| M2 | Inspector model | Opus 5.5, default effort, a fresh session | CLAUDE.md, Models |
| K | Silent properties | **Saved data:** no document, format or version changes (H-4). **Continuity:** the factor is continuous at both limits, since each side uses the curve's own figure there. **Ordering, idempotence, multi-tab, storage disabled:** not touched. **Golden master:** Rev 4's cached rows must lie inside the range; if one does not, the item stops with a question | Named so they are checked, not discovered |

## Scenarios: to be written first, must fail before

Engine: *a hop below 176 °F is held at the 176 °F factor, and one above
212 °F at the 212 °F factor* (150 °F, 122 °F and 170 °F give the 176 °F
figure; 213 °F and 220 °F give the 212 °F figure; 176, 194 and 212 °F are as
before). The two held figures are pinned by hand, the working beside them in
the test:

- at 176 °F: 0.0003858 × 30976 − 0.12885802 × 176 + 10.97839506
  = 11.9505408 − 22.67901152 + 10.97839506 = 0.24992434
- at 212 °F: 0.0003858 × 44944 − 0.12885802 × 212 + 10.97839506
  = 17.3393952 − 27.31790024 + 10.97839506 = 0.99989002

App: *the Hops card and the printed hop schedule name a hop below 176 °F,
and no other* (through `computeRecipe`, in °F and in °C).

## Notes for the builder

- The only numbers this item adds are the two limits, 176 and 212 °F. The
  held figures are the existing quadratic evaluated at the limits, not new
  constants. No app file writes either limit: the engine exports them and
  the app reads them (SPEC rules 7 and 9).
- The engine does not refuse a temperature; it holds. The box's refusal
  above 213 °F belongs to item 3.
- The note on the card and the sheet is decided by the engine's figures
  (the hop's temperature against the exported limit), not by a range
  written in a component.
- SPEC rule 2 gains the departure; rule 4's tolerances are untouched.
  `docs/TEST_COVERAGE.md` gains a row per scenario.
- Far end: the built app in a browser, a hop at 150 °F and one at 180 °F,
  Home and Pro, °F and °C, and the printed sheet.

## Builder's notes

(to be filled in)
