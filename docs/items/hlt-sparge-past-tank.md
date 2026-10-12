# The HLT's figures when the sparge is more than the tank holds, Tier A + B

Status: agreed 2026-10-12 ("agree to all", HT-Q1, HT-Q2); not started.
Written by the S15b session; built in batch S16, item 3 (docs/ROADMAP.md,
Sessions).

## Why

With the sparge water more than the tank holds (already warned: more than
the top-up level), "Left in the HLT, not used" reads a negative volume
(top-up 8, sparge 8.5: −0.50 gal) beside 0 g of salts, since S12 holds the
salt shares between 0 and 1 (WV-S4) but no sentence decided the volume; and
with the top-up level below the treated water left, the sparge warning
compares the sparge with the typed top-up level, not the treated water the
tank then holds (12 gal treated, 5 mash, top-up 6, sparge 6.5 warns though
the tank holds 7) (noticed building "Water volumes past their limits", S12
item 1, 2026-10-08).

## Sentences: what must be true afterwards

- **HT-S1** "Left in the HLT, not used" is never below 0: with the sparge more than the tank holds it reads 0 (top-up 8, sparge 8.5: 0.00 gal), on the Water tab and the printed sheet, and the existing warning stays.
- **HT-S2** The warning that the sparge is more than the tank holds compares the sparge with the water the tank holds: the typed top-up level, or the treated water the mash leaves when that is larger (12 treated, 5 mash, top-up 6: the tank holds 7; a sparge of 6.5 does not warn, 7.5 does).
- **HT-S3** Within the limits every figure is as today; the salt shares are unchanged (already held, WV-S4); no saved format changes.

## Decisions: agreed 2026-10-12

| id | Question | Decision | Rule |
|---|---|---|---|
| HT-Q1 | "Left in the HLT" when the sparge is more than the tank holds | Held at 0, with the existing warning | Every tank share is already held between 0 and 1 (WV-S4) |
| HT-Q2 | The sparge warning | Compares the sparge with the water the tank holds: the typed top-up level, or the treated water left when larger | The tank holds what is in it |
| M1 | Builder model | Opus, high effort | The Models rule's default |
| M2 | Inspector model | Opus, default effort, a fresh session (one box for the engine, one for the app) | The Models rule's default |
| K | Silent properties | **Conservation:** the shares of the salts still add to 1. **Ordering:** the warning and the held volume read the same tank figures, worked each time the tab is drawn. Nothing is saved; no saved format changes | — |

## Scenarios: to be written first, must fail before

Engine (`packages/engine/test/water/volumes.test.js`, or a new file): *the
water left is never below 0* (top-up 8, sparge 8.5: 0, by hand); *the
sparge warning reads the water the tank holds* (12 / 5 / 6 with sparge 6.5:
no warning; 7.5: warning; top-up 8 with sparge 8.5: warning, by hand);
*within the limits nothing changes*. App (`apps/recipe/test/`, a new file):
*the Water tab and the sheet show 0.00 left*; *the warning follows the
tank*.

## Notes for the builder

- `packages/engine/src/water/volumes.js`, `tankDraws`: `leftGal` is
  `tankGal - spargeGal`; `spargeOverTopUp` is `spargeGal > topUpGal`. The
  warning's name and its text on the Water tab
  (`components/water/WaterGoesCard.jsx`) may need to say "more than the
  tank holds" rather than "more than the top-up level"; the builder checks
  the text against HT-S2.
- The sheet reads `water.tank.leftGal` in `components/recipe-sheet-data.js`.
- Each held figure is arithmetic: pin it by hand with the working in the test.
