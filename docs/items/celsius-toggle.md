# °C display toggle — Tier A + B

Status: agreed 2026-10-03 ("agree to all"), not started. Written by the S5b
session; built in batch S6b, second of its three items (docs/ROADMAP.md,
Sessions), after measurement temperatures beside their volumes.

## Why

Every temperature the app shows and takes is in °F. A brewer who works in
°C converts by hand. The engine has `fToC` but no `cToF`, and SPEC rule 9
forbids a conversion constant in the app, so the engine gains one (split
from the Options page, 2026-09-21, P1).

## Sentences — what must be true afterwards

- **CT-S1** A °F/°C choice in the header, beside Home/Pro, switches every temperature the app shows and takes: the recipe's and the brewery's three measurement temperatures, each hop's wort temperature, the yeast's fermentation temperature, the strain's lab range, the 60 °F reference (shown as 15.6 °C) and the messages that name a temperature range.
- **CT-S2** The recipe stores °F; a temperature typed in °C is stored as the engine's conversion of it (a new `cToF` beside `fToC`) and shows back as typed.
- **CT-S3** Temperature boxes accept tenths of a degree; readouts show whole degrees, except the reference, 15.6 °C.
- **CT-S4** The printed sheet prints temperatures in the screen's unit.
- **CT-S5** The choice is saved with the display settings in the recipe document (recipe format 9; a version-1 to 8 document reads as °F) and is a brewery figure (brewery format 4; a version-1 to 3 document reads with it blank); a new recipe takes the brewery's choice when set, otherwise °F.
- **CT-S6** Nothing else changes: in °F every figure and label is as before, and switching the unit changes no stored figure.

## Decisions — agreed 2026-10-03 ("agree to all")

| id | Question | Decision | Rule |
|---|---|---|---|
| C-Q1 | Is °F/°C a brewery figure, as Home/Pro is? | Yes: it sits in the header beside Home/Pro and is saved with the recipe and the brewery figures — recipe format 9 and brewery format 4 | It follows Home/Pro and the gravity unit |
| C-Q2 | Which temperatures switch | All of them: the three measurement temperatures (recipe and brewery), the hop wort temperature, the fermentation temperature, the yeast strain's range, "at 60 °F" (shown as 15.6 °C) and the out-of-range messages. Recipes still store °F | Store in one unit, convert only for display |
| C-Q3 | Precision in °C | Boxes accept tenths; readouts show whole degrees, except 15.6 for the reference | No made-up digits; 60 °F is not a whole °C |
| C-Q4 | The printed sheet's unit | The screen's, as for gravity today | What you see is what you print (print sheet P3) |
| PU-Q4 | Saved formats (shared with the Pro unit choices) | One format change per item: this item takes recipe 9 and brewery 4 | One format change at a time (AM-Q2) |
| M1 | Builder model | Opus, high effort (S6-M1) | The Models rule's default |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default |
| K | Silent properties | **Round trip:** a temperature typed in °C, saved, switched to °F and back, reads as typed, tested for each kind. **Schema migration:** recipe format 9, brewery format 4 (CT-S5). **Idempotence:** `cToF(fToC(x))` is `x` within the display's precision. Ordering, multi-tab, storage disabled as today | — |

## Scenarios — to be written first, must fail before

Engine (`packages/engine/test/units.test.js`): *°C converts to °F* (hand pins: 0 → 32, 100 → 212, 15.5555… → 60, 19 → 66.2, −40 → −40). App (`apps/recipe/test/celsius-toggle.test.js`): *every temperature switches*; *a temperature typed in °C reads back as typed*; *the sheet prints the screen's unit*; *the choice is saved and older documents read as °F*; *nothing else changes in °F*.

## Notes for the builder

- The format numbers assume this item is the next to move each format. The acid aimed at a mash pH (`docs/items/acid-aimed-at-mash-ph.md`, AA-Q4) also plans a recipe format; whichever lands first takes the next number, and the other follows.
- Files likely touched: `packages/engine/src/units.js`, `index.js`; `apps/recipe/src/{display,state,persistence}.js`, `App.jsx`, `components/Header.jsx` and every component that shows a temperature (`VolumesSection`, `OptionsSection`, `HopsSection`, `YeastCard`, `recipe-sheet-data.js`, `ingredient-search.js`); SPEC rules 9, 13 and 17 and the display-units table.
