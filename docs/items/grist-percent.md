# Grain-bill percentage per malt — Tier A

Status: agreed 2026-09-22 ("A is good. Agree to all." — decision P7). Model
rows M1/M2 proposed by this session and not yet agreed. Not started. Written by
the spec session; to be built by a new session from CLAUDE.md's kickoff prompt.

## Why

The printed recipe sheet (`docs/items/recipe-print-sheet.md`) shows the grain
bill, and a grain bill without percentages is hard to judge at a glance — 10 lb
of one malt means nothing until you know it is 91% of the bill. The owner
agreed to include the column (P7) knowing it widens the work, because the
calculation engine does not produce that number today.

It cannot be computed in the app: SPEC rule 7 forbids brewing math there, and a
malt's share of the bill is arithmetic that produces a recipe value. So it
belongs in the engine, beside the other per-malt values the grain calculation
already returns.

This is a small, self-contained Tier A item, kept separate from the sheet so
the Tier A gate sits tightly around the one new number.

## Sentences — what must be true afterwards

- **S1** The grain calculation returns, for each malt, that malt's share of the total grain weight, as a fraction, in the same per-malt list and the same order as the malts it was given.
- **S2** For a bill whose total weight is a positive finite number, the shares sum to 1.
- **S3** A malt of zero weight in such a bill has a share of exactly 0 — it is listed, not omitted.
- **S4** Where the total weight is zero or not a number (an empty bill, a cleared weight), the shares are not numbers. Nothing throws, nothing is clamped, and no fallback value is substituted.
- **S5** Nothing else changes: every constant, every other per-malt value, and every number the existing tests pin stays exactly what it is.

## Decisions — agreed

| id | Question | Decision | Rule |
|---|---|---|---|
| M1 | Builder model | Opus, high effort | Tier A; the Models rule recommends the strongest available model. **Proposed, not yet agreed** |
| M2 | Inspector model | Fable, default effort | The Models rule recommends a cross-family read for Tier A, and Fable when the builder is Opus. The owner declined Fable for the 400B band item on 2026-09-21; if that is a standing preference rather than a one-item choice, Sonnet instead. **Proposed, not yet agreed** |
| G1 | Fraction or percent | A fraction (0.91), not a percent (91) | The app holds efficiency, attenuation and hop alpha as fractions and shows percent only at the display edge (SPEC display-units table, rule 9) |
| G2 | Where it lives | In the existing per-malt list the grain calculation returns, beside the other per-malt values | Smallest change; the sheet and any future screen read one list |
| G3 | The number's rule | Each malt's weight divided by the total of all malt weights. Definitional arithmetic — no spreadsheet cell and no fitted constant is involved | SPEC rule 2 governs transcribed constants; this introduces none |
| G4 | Degenerate bills | Let the arithmetic propagate: zero total or a cleared weight yields a share that is not a number. No special case, no clamp, no substitution | Matches the volume-correction convention (SPEC rule 11): an input the model cannot use yields a non-number and nothing throws |
| G5 | Rounding | None in the engine. The sheet rounds for display | SPEC rule 2 and the display boundary (rule 9): the engine carries full precision |
| G6 | Silent properties | Order follows the malt list as given, so a row added or removed moves its share with it. The shares are derived on every calculation, never stored, so nothing persists and no saved document changes. Negative weights are not guarded against — they are not reachable from the UI's number inputs and are not part of this item | Named so they are checked, not discovered |
| G7 | Files and tier | Tier A. `packages/engine/src/grist.js` (the per-malt list), a new `packages/engine/test/grist.test.js` (there is no grain-bill test file today — the bill is pinned only by `golden-master.test.js`, whose assertions never change), `docs/TEST_COVERAGE.md` (a new scenario row and the totals), `docs/ROADMAP.md` (this item's row removed), this file. No app files — the sheet consumes it in its own item | Smallest change; the engine path is in the hook regex |

## Scenarios — written first, must fail before

1. *each malt's share is its weight over the bill total, for the reference recipe* — S1 (the two-malt default: 10 lb and 1 lb give 10/11 and 1/11)
2. *the shares sum to 1 for a bill with a positive total weight* — S2
3. *a zero-weight malt is listed with a share of 0* — S3
4. *an empty bill and a cleared weight yield shares that are not numbers, and nothing throws* — S4

Unchanged and must still pass: the whole golden-master suite and every
existing grain-bill assertion.

## Far end — Tier A: both suites

`npm test` at the root; `npm run build`. No browser step is required by the
tier table — no screen shows the number until the printed sheet item lands.

## Recorded failure (filled in by the builder)

## Builder's notes — choices the sentences did not make (filled in by the builder)
