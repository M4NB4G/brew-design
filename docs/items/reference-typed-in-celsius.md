# 15.6 °C typed is the reference — Tier B

Status: landed 2026-10-08 in batch S11 on branch `S11`, as "In °C, a
temperature typed as the reference shows it, 15.6, is stored as the
reference, 60 °F exactly"; agreed 2026-10-07 ("agree to all"). Written by
the S9 session; built in batch S11 (docs/ROADMAP.md, Sessions).

## Why

In °C the 60 °F reference shows as 15.6 °C, but a brewer who types 15.6
stores the engine's conversion, 60.08 °F, which is not the reference: the
post-boil volume then shows a second row "at 16 °C" beside its 15.6 °C
figure, the sheet notes "measured at 16 °C", and each volume is corrected by
0.08 °F (a change in the sixth figure). CT-S2 stores the conversion as typed
(noticed building the °C display toggle, 2026-10-05).

## Sentences — what must be true afterwards

- **RT-S1** In °C, a temperature typed as the reference shows it (15.6, the reference's °C to one decimal) is stored as the reference, 60 °F exactly.
- **RT-S2** Every other °C entry is stored as the engine's conversion, as today (CT-S2).
- **RT-S3** This holds for every temperature box (one conversion at the edge, `display.js`).
- **RT-S4** Nothing else changes: °F entries, every stored figure, and no saved format changes.

## Decisions — agreed 2026-10-07 ("agree to all")

| id | Question | Decision | Rule |
|---|---|---|---|
| RT-Q1 | Should typing exactly what the reference shows store the reference? | Yes: 15.6 °C typed stores 60 °F; every other entry converts as today | What the screen shows for the reference must give back the reference |
| RT-Q2 | Which temperature boxes? | Every temperature box | One conversion at the edge (SPEC rule 9) |
| M1 | Builder model | Opus, high effort | The Models rule's default |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default |
| K | Silent properties | **Idempotence:** 60 °F shown in °C is 15.6, and 15.6 typed stores 60 °F: a round trip changes nothing. Saved formats: none change | — |

## Scenarios — to be written first, must fail before

App (`apps/recipe/test/celsius-toggle.test.js`, or a new file): *15.6 °C typed is the reference* (stored 60 exactly; no "at 16 °C" row; the sheet notes no measurement temperature); *other °C entries convert as before* (15.5 and 15.7: the engine's `cToF`); *every temperature box* (mash, fermentation, a hop's wort temperature, the three measurement temperatures); *nothing else changes*.

## Notes for the builder

- `display.js`: `tempToCanonical` converts (its comment carries the FLAG-style note on this question); the reference as shown is already worked out for the "at 15.6 °C" text (`num(fToC(REFERENCE_TEMP_F), 1)`). Compare against the same figure, not a written 15.6 (SPEC rule 11: no app file writes the figure).
- Files likely touched: `apps/recipe/src/display.js`; SPEC rule 9; `docs/TEST_COVERAGE.md`.

## Builder's notes (S11, 2026-10-08)

Claims for the inspector to verify; none is a decision the sentences made.

- One change, in `display.js`'s `tempToCanonical`, the one °C-to-°F conversion every temperature box calls (the three measurement temperatures on the Volumes card, the yeast's fermentation temperature, each kettle hop's temperature, and My brewery's three; no other box takes a temperature: the item's scenario list names a mash temperature, but the app has no mash temperature box). In °C, an entry equal to the reference as its box shows it, `tempBoxValue(REFERENCE_TEMP_F, 'C')` (the engine's `fToC` of 60, to one decimal: 15.6), is stored as `REFERENCE_TEMP_F` itself; every other entry is the engine's `cToF`, as before. No app file writes 15.6 or 60 (SPEC rule 11).
- The comparison is exact equality of numbers: the box reads `parseFloat` of what is typed, so "15.6", "15.60" and "015.6" all match; 15.56 converts as typed (60.008 °F, pinned).
- The `// FLAG:` beside `tempToCanonical` (CT-S2's 60.08) goes with the change; the comment now says what the function does.
- The scenario draws the whole app in jsdom (as `accessible-names.test.js` and `my-ingredients.test.js` do) so every box is typed into as a brewer does and the saved copy the autosave writes is read back; the sheet's notes are read from the sheet's own data for the saved recipe.
- Two of the four scenarios failed before ("15.6 °C typed is the reference", "every temperature box": every box stored 60.08); "other °C entries convert as before" and "nothing else changes" passed before, as RT-S2 and RT-S4 say nothing changes. "Every temperature box" was first written to stop at the first box; it was rewritten before the change to gather every box's stored figure, and the recorded failure is from the rewritten one, run against the unchanged `display.js`. A wrong box name in that first draft (the yeast's box is named "Fermentation temperature °C") was corrected the same way.
- Numbers introduced: none written; 60 is the engine's `REFERENCE_TEMP_F` and 15.6 its `fToC` at the box's one decimal (`tempBoxValue`, display precision). The other °C pins are by hand in the test (C × 1.8 + 32).
