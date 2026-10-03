# Measurement temperatures beside their volumes — Tier B

Status: agreed 2026-10-03 ("agree to all"), not started. Written by the S5b
session; built in batch S6b, first of its three items (docs/ROADMAP.md,
Sessions). S6a's one-page printed sheet lands first (MT-Q2).

## Why

The recipe's three measurement temperatures sit on the Options tab, away
from the volumes they correct; the owner deferred moving them (2026-09-23,
T3) and relabelled the Options groups "This recipe" and "New recipes start
from" in the meantime. On brew day the temperature is read with the volume:
it belongs beside it.

## Sentences — what must be true afterwards

- **MV-S1** Each of the recipe's three measurement temperatures is entered on the Volumes card under the volume it corrects — pre-boil under the pre-boil volume, post-boil under the post-boil volume, fermentation under the fermentation volume — with that volume at 60 °F beside it.
- **MV-S2** The Options tab holds only the brewery's figures; its "This recipe — measurement temperatures" card is gone.
- **MV-S3** On a phone each temperature sits on its own line under its volume.
- **MV-S4** The printed sheet keeps its "measured at" notes; any layout change follows S6a's one-page sheet.
- **MV-S5** Nothing else changes: every figure is the same for the same entries, and nothing saved changes.

## Decisions — agreed 2026-10-03 ("agree to all")

| id | Question | Decision | Rule |
|---|---|---|---|
| MT-Q1 | Where each temperature goes | On the Volumes card, under the volume it corrects: pre-boil, post-boil and fermentation, each with its volume at 60 °F beside it. The Options tab keeps only the brewery's figures | The temperature belongs to the reading it corrects |
| MT-Q2 | Does the printed sheet change? | Only as much as S6a's one-page sheet leaves room for; it already notes "measured at X °F". S6a goes first | The one-page sheet settles the layout |
| M1 | Builder model | Opus, high effort. This item changes neither the engine nor saved data, so it could join the Sonnet trial if the owner widens it after reviewing S6a; until then, Opus (S6-M1) | The Models rule's default; the trial is not yet reviewed |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default |
| K | Silent properties | None new: nothing saved changes (the temperatures are already in the recipe); ordering, multi-tab and storage disabled as today | — |

## Scenarios — to be written first, must fail before

`apps/recipe/test/measurement-temps-volumes.test.js`: *each temperature sits under its volume* (the three boxes on the Volumes card, in order, each with its 60 °F volume; a phone renders each on its own line); *the Options tab holds only the brewery's figures*; *nothing else changes* (every derived figure equal for the same entries; the saved document byte for byte).

## Notes for the builder

- Files likely touched: `components/VolumesSection.jsx`, `components/OptionsSection.jsx`, `App.jsx` (the setter moves to the Volumes card; this makes it Tier B), the tests that look for the temperatures on the Options tab (`options.test.js`, `empty-fields.test.js`), possibly `components/recipe-sheet-data.js` per MT-Q2. SPEC rules 8 and 11 name no tab, so no rule changes unless the build finds one.
- The post-boil volume is worked out, not entered; its temperature box sits under its "as measured" and "at 60 °F" readouts.
