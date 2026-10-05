# Measurement temperatures beside their volumes — Tier B

Status: landed 2026-10-05 in batch S6c on branch `claude/charming-curie-zilruw`, as "Each measurement temperature is entered on the Volumes card under the volume it corrects, with that volume at 60 °F beside it, and the Options tab holds only the brewery's figures"; agreed 2026-10-03 ("agree to all"). Written by the S5b
session; built in batch S6c, the widened trial, first of its two items
(docs/ROADMAP.md, Sessions; moved from S6b, WT-1, 2026-10-05). S6a's one-page printed sheet lands first (MT-Q2).

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
| M1 | Builder model | Sonnet 5.5 at high effort (WT-6, the owner, 2026-10-05), with the Opus advisor (`/advisor opus`) checking the approach and confirming every number before commit (WT-3', the owner, 2026-10-05; was Opus, high effort, S6-M1) | The widened trial (CLAUDE.md, Models): this item changes neither the engine nor saved data |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default |
| K | Silent properties | None new: nothing saved changes (the temperatures are already in the recipe); ordering, multi-tab and storage disabled as today | — |

## Scenarios — to be written first, must fail before

`apps/recipe/test/measurement-temps-volumes.test.js`: *each temperature sits under its volume* (the three boxes on the Volumes card, in order, each with its 60 °F volume; a phone renders each on its own line); *the Options tab holds only the brewery's figures*; *nothing else changes* (every derived figure equal for the same entries; the saved document byte for byte).

## Notes for the builder

- Files likely touched: `components/VolumesSection.jsx`, `components/OptionsSection.jsx`, `App.jsx` (the setter moves to the Volumes card; this makes it Tier B), the tests that look for the temperatures on the Options tab (`options.test.js`, `empty-fields.test.js`), possibly `components/recipe-sheet-data.js` per MT-Q2. SPEC rules 8 and 11 name no tab, so no rule changes unless the build finds one.
- The post-boil volume is worked out, not entered; its temperature box sits under its "as measured" and "at 60 °F" readouts.

## Builder's notes (S6c, 2026-10-05)

Claims for the inspector to verify; none is a decision the sentences made.

- The Volumes card's new boxes are built from the engine's reference and the display unit, never a written "60 °F". Pre-boil and fermentation: the volume, its temperature box, then its volume at 60 °F. Post-boil (worked out, not entered): its existing "as measured" readout (only when the temperature is not 60 °F) and "at 60 °F" readout, then its temperature box (the notes above). The labels keep the Options tab's wording ("Pre-boil volume measured at (°F)").
- The Options card's one-line notice ("Volumes are corrected to the 60 °F reference from the temperature they were measured at; mash water is used as entered") moved with the temperatures to the top of the Volumes card, so the statement that mash water is not corrected is not lost. Words unchanged.
- The "less wort after the boil than the fermenter volume" warning stays under the fermentation volume (now beneath its 60 °F readout).
- `temperatureChange` (the box's change handler) moved from `OptionsSection.jsx` to `VolumesSection.jsx`; `empty-fields.test.js` imports it from there. `OptionsSection` no longer takes the recipe's temperatures, their 60 °F volumes or the setter; tests that still pass them to it pass extra props, harmlessly.
- The line under the stats bar still names the three temperatures last (E2 says "screen order"; they now sit among the volumes). Left as it was, text and order, because MV-S5 says nothing else changes; the question is on the roadmap (Tier C) and in the report.
- Stale comments naming the Options tab as the temperatures' place were updated (`selectors.js`, `empty-fields.js`, `reference-volume.js`, two tests). No SPEC rule names a tab; SPEC is unchanged.
- MV-S4: the printed sheet is untouched (`recipe-sheet-data.js` not in the diff); it keeps its "measured at" notes.
- Numbers introduced: none (display precision `num(x, 3)` only).
