# Pro unit choices — Tier A + B

Status: landed 2026-10-05, "In Pro, liquid volumes in barrels or gallons and
malt weights in pounds or 55 lb sacks; the printed sheet in the brewery's set
units (recipe format 10, brewery format 5)". Written by the S5b session;
built in batch S6b, second of its two items, after the °C display toggle.
The owner's decisions of 2026-10-02 (the roadmap line) stand.

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

## Builder's notes (S6b, 2026-10-05)

Choices the sentences did not make, as built:

- The choices are the display settings `proVolumeUnit` (`'bbl'` | `'gal'`) and `proMaltUnit` (`'lb'` | `'sack'`), beside `mode`, `proGravityUnit` and `temperatureUnit` in App, at the recipe document's top level and in the brewery figures (blank `null`). Anything other than gallons is barrels, and anything other than sacks pounds, so a component given neither is as before.
- `display.js`'s volume functions take Pro's choice as a third argument (`volumeUnit`, `volumeToCanonical`, `volumeFromCanonical`; `volumesInBarrels` for the 0.001/0.01 precision); with it absent they are as before, so the smoke test's calls are unchanged. The dry-hop rate keeps `dryHopRateFromCanonical(…, mode)`: lb/bbl in Pro whatever the volume choice.
- Malt in sacks: the box shows the stored pounds ÷ 55 rounded to two decimals (`maltWeightBoxValue`), steps by 0.01, and stores the typed sacks × 55; the split under the box is `splitSacks` (engine) with the pounds at the box's precision (`roundForInput`), "1 sack" singular. The sheet names the column "55 lb sacks" and prints the split with the pounds to two decimals, today's sheet precision; a blank weight prints "—".
- PU-S4 is read per choice: the sheet uses the brewery's volume choice where set and the screen's where not, and the same for malt, each on its own. In Home the sheet prints gallons and pounds whatever the brewery's Pro choices, since the choices exist only in Pro (PU-S1).
- K: App listens for the brewery's key changing in another tab of this browser and reads the brewery's figures again, so the sheet (and My brewery) follow; nothing is saved back on that read but an upgrade of an older document. Proved at the far end with two tabs.
- The header shows the two toggles after °P/SG in Pro (desktop: °P/SG, bbl/gal, lb/sacks, °F/°C, Pro/Home; phone: stacked). My brewery gains "Pro volume unit" (Built-in (bbl)) and "Pro malt weight unit" (Built-in (lb)).
- A caller of the recipe document writer that names neither choice writes barrels and pounds; App always names them. `savePersisted` now passes its state object through to the writer.
- Existing tests that pinned recipe format 9 or brewery format 4 now pin 10 and 5 (their newer cases 11 and 6), their display-setting fixtures carry the two choices, their titles name the current versions; `celsius-toggle.test.js`'s "nothing else changes in °F" leaves out My brewery's two new rows as it does its own; `spec-rules.test.js` lets `display.js` call `splitSacks`.
- Noticed: the header's toggles wrap on a 1200 px screen in Pro and stack five deep on a phone (roadmap, Tier C).
- Numbers: `LB_PER_SACK` = 55, the owner's decision (PU-Q3), an engine constant; `splitSacks` is whole sacks = floor(lb ÷ 55), pounds = lb − sacks × 55, pinned by hand (177 → 3 + 12; 55 → 1 + 0; 54.9 → 0 + 54.9; 3.22 × 55 → 3 + 12.1); the rest are display precision (2 and 3 decimals) and an input step (0.01).
