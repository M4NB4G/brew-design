# Measurement temperatures checked inside — Tier B

Status: agreed 2026-10-08 ("agree to all"); not started. Written by the S11
session; built in batch S13, item 1 (docs/ROADMAP.md, Sessions).

## Why

The reader checks that a saved recipe's measurement temperatures are an
object, but not the three inside it, so a hand-damaged file whose post-boil
temperature is text ("180") or missing loads: text is carried into the
recipe (not a canonical number, SPEC rule 8) and a missing one blanks the
volumes it corrects (noticed building "Saved rows checked inside",
2026-09-23). The brewery's document already checks its three.

## Sentences — what must be true afterwards

- **MT-S1** A saved recipe or recipe file of version 2 or later whose pre-boil, post-boil or fermentation measurement temperature is not a number or blank (text, a missing one, a list) is unreadable, as a damaged malt row is.
- **MT-S2** A file so damaged is refused with the damaged message, nothing asked and the recipe on screen untouched; a saved copy so damaged starts a new recipe and is kept aside as found (SPEC 13).
- **MT-S3** A version-1 document, saved before the temperatures, still reads at 60 °F; a blank temperature still reads as blank; extra fields inside are ignored.
- **MT-S4** Nothing else changes: every readable document reads as today, and no saved format changes.

## Decisions — agreed 2026-10-08 ("agree to all")

| id | Question | Decision | Rule |
|---|---|---|---|
| MT-Q1 | A saved recipe or recipe file whose measurement temperatures hold text ("180") or are missing one: refuse it as damaged? | Yes, refused like a damaged malt row: a file gets the damaged message; a saved copy starts a new recipe and is kept aside. Version-1 documents still read at 60 °F. Extra fields inside are ignored | A document is read whole or not at all, never guessed (SPEC 13) |
| M1 | Builder model | Opus, high effort | The Models rule's default |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default |
| K | Silent properties | **Schema migration:** versions 1 to 12 as today, the check after each upgrade. **Storage disabled** and the unreadable copy kept aside as today. No saved format changes | — |

## Scenarios — to be written first, must fail before

App (`apps/recipe/test/saved-rows.test.js`, or a new file): *a temperature as text makes the document unreadable* (post-boil "180", in storage and as a file); *a missing temperature makes it unreadable* (each of the three); *version 1 still reads at 60 °F, a blank one as blank, extra fields ignored*; *nothing else changes* (every readable fixture as today).

## Notes for the builder

- `apps/recipe/src/persistence.js` `readDocument`: the shape check (`hasShapeOf`, `hasRowsOf`, `hasWaterOf`) passes an object of any content; the brewery reader's check of its three (`isFigure`) is the model.
- Files likely touched: `apps/recipe/src/persistence.js`; SPEC rule 13; `docs/TEST_COVERAGE.md`.
