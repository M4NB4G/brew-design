# Pro unit choices — Tier A + B

Status: agreed 2026-10-03 ("agree to all"), not started. Written by the S5b
session; built in batch S6b, third of its three items (docs/ROADMAP.md,
Sessions). The owner's decisions of 2026-10-02 (the roadmap line) stand.

## Why

A professional brewery may measure its volumes in gallons rather than
barrels, and order and weigh malt in 55 lb sacks. Asked for by the owner,
2026-10-02.

## Sentences — what must be true afterwards

- **PU-S1** In Pro, two choices sit beside the gravity unit: liquid volumes in barrels or gallons, and malt weights in pounds or 55 lb sacks. Home shows neither and stays in gallons and pounds.
- **PU-S2** Gallons covers every Pro volume — the recipe's volumes, the boil-off rate and the water volumes — except the dry-hop rate, which stays lb/bbl. Gallons show to 0.01, as at Home.
- **PU-S3** With sacks, each malt's weight is entered in sacks to two decimals, one box per malt (3.22 sacks is stored as 177.1 lb); the whole sacks and the remainder in pounds ("3 sacks + 12.1 lb") show beside the box, and the printed sheet prints that split, not the decimal. Hops stay in pounds. The 55 lb sack is an engine constant.
- **PU-S4** The printed sheet prints these two choices in the brewery's set units (where the brewery has set none, the screen's), departing from the print sheet's P3 for these two choices only.
- **PU-S5** Both choices are saved with the display settings in the recipe document (recipe format 10; a version-1 to 9 document reads as barrels and pounds) and are brewery figures (brewery format 5; a version-1 to 4 document reads with them blank).
- **PU-S6** Nothing else changes: with barrels and pounds every figure and label is as before.

## Decisions

The owner's, 2026-10-02 (the roadmap line): gallons covers every Pro volume except the dry-hop rate, which stays lb/bbl; a part sack shows as sacks and pounds; hops stay in pounds; the brewery figures carry both choices; the printed sheet prints in the brewery's set units (where none is set, the screen's).

Agreed 2026-10-03 ("agree to all"; PU-Q1 replaced by PU-Q1', Q1a and Q1b the same day, "agree to all"):

| id | Question | Decision | Rule |
|---|---|---|---|
| PU-Q1 | How malt weights are entered with sacks | Still in pounds, one box per malt; "3 sacks + 12 lb" shows beside each malt and on the sheet. **Replaced by PU-Q1', the owner, 2026-10-03** | Shares are designed by weight; the remainder is weighed in pounds; the phone layout stays |
| PU-Q1' | How malt weights are entered with sacks | In sacks with decimals, one box per malt (3.22 sacks is stored as 177.1 lb) | The owner's call, 2026-10-03 |
| PU-Q1a | Precision of the sacks box | Two decimals (0.01 sack = 0.55 lb) | Finer than a brewer weighs; coarser hides pounds |
| PU-Q1b | Does "3 sacks + 12.1 lb" still show? | Yes, beside each box and on the printed sheet; the sheet prints the split, not the decimal, since that is what is weighed on brew day | The owner's 2026-10-02 decision: a part sack shows as sacks and pounds |
| PU-Q2 | Precision of Pro gallons and the pound remainder | Gallons to 0.01, as Home; the remainder at today's pound precision | No new display rule |
| PU-Q3 | The sack's weight | Fixed at 55 lb, an engine constant (not a brewery figure) | The owner's decision of 2026-10-02 |
| PU-Q4 | Saved formats | One format change per item: recipe 10 and brewery 5 (after the °C toggle's 9 and 4) | One format change at a time (AM-Q2) |
| M1 | Builder model | Opus, high effort (S6-M1) | The Models rule's default |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default |
| K | Silent properties | **The sheet reads the brewery's figures:** a change to them in another browser tab changes what the sheet prints. **Schema migration:** recipe format 10, brewery format 5 (PU-S5). Ordering, storage disabled as today | — |

## Scenarios — to be written first, must fail before

Engine (`packages/engine/test/units.test.js`): *a weight splits into 55 lb sacks* (hand pins: 177 lb → 3 sacks + 12 lb; 55 → 1 + 0; 54.9 → 0 + 54.9). App (`apps/recipe/test/pro-unit-choices.test.js`): *Pro volumes in gallons* (every volume but the dry-hop rate); *malt weights in sacks* (typed as decimal sacks, stored in pounds, shown and printed as sacks and pounds); *the sheet prints the brewery's units*; *the choices are saved and older documents read as barrels and pounds*; *nothing else changes with barrels and pounds*.

## Notes for the builder

- The format numbers assume the °C toggle lands first and no other item moves a format between them (see `docs/items/celsius-toggle.md`'s note on the acid aimed at a mash pH).
- Files likely touched: `packages/engine/src/units.js`, `index.js`; `apps/recipe/src/{display,state,persistence}.js`, `App.jsx`, `components/Header.jsx` or `OptionsSection.jsx` (the choices), `GristTable.jsx`, `VolumesSection.jsx`, the water components that show volumes, `recipe-sheet-data.js`; SPEC rules 9, 13 and 17 and the display-units table.
