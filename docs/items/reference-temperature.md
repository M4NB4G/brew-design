# The 60 °F reference held in one place — Tier A + B

Status: agreed 2026-09-23 ("agree to all"); landed 2026-09-23 on branch S2
as "The engine states its 60 °F volume reference once, and every "at 60 °F"
on screen and on the printed sheet, and a new recipe's measurement
temperatures, read it". Written by the S1
session; built in batch S2 (docs/ROADMAP.md, Sessions), first of its four
items — "Post-boil volume as measured" reads the figure this item creates.

## Why

The engine's volume reference, 60 °F, exists today only as the volume
correction's default argument. The app writes 60 itself in the "at 60 °F"
labels (Volumes card, Options tab), in the printed sheet's label and its
rule for when to print "measured at …", and in a new recipe's three
measurement temperatures. If the reference ever moved, or a °C display
arrived (roadmap, S6), those copies would drift from the engine's.

## Sentences — what must be true afterwards

- **R-S1** The engine states its volume reference temperature, 60 °F, once, and the volume correction uses it.
- **R-S2** Every "at 60 °F" on screen and on the printed sheet, and the sheet's rule for when to print "measured at …", read that one figure.
- **R-S3** A new recipe's three measurement temperatures are that figure, as today.
- **R-S4** Nothing is calculated differently.

## Decisions — agreed

| id | Question | Decision | Rule |
|---|---|---|---|
| M1 | Builder model | Opus, high effort | The Models rule's default (the owner, 2026-09-23) |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default |
| R1 | Do the new-recipe measurement temperatures, and old recipes loaded from before those temperatures existed, read the one figure too? | Yes | They are defined as "the reference", so they must stay equal to it |
| R2 | Silent properties (durability, atomicity, idempotence, ordering, storage disabled, schema migration, multi-tab) | None: the figure does not change, no saved format changes, and blank brewery temperatures already fall back to the built-in figure, which is this one | — |

## Scenarios — written first, must fail before

Engine, `packages/engine/test/units.test.js` (or a new file beside it):
1. *the engine states its volume reference temperature, 60 °F, and the volume correction defaults to it* — R-S1. A volume corrected with no reference given equals the same volume corrected at the stated reference, for 16, 14.5, 12, 7 and 5 gal at 150 °F.

App, `apps/recipe/test/reference-temperature.test.js`:
2. *every "at 60 °F" label and the sheet's temperature-note rule read the engine's reference* — R-S2. For example, the sheet's post-boil label carries the engine's figure, a volume measured at the engine's figure prints no note and one measured elsewhere does, and no app source file writes a bare 60 °F reference of its own (a source scan like `spec-rules.test.js`).
3. *a new recipe's measurement temperatures, and a version-1 recipe's, are the engine's reference* — R-S3, R1.
4. *every derived number is unchanged* — R-S4. The reference recipe through `computeRecipe` equals today's pinned values (the smoke test's) at the default temperatures.

Expected failure before the change: the engine exports no reference figure,
so scenarios 1–3 fail on it; scenario 4 passes before and after. It guards
R-S4 and is named as the guard, not as the item's failing scenario.

## Far end — Tier A + B, on the built app

1. Volumes card: "Post-boil volume at 60 °F". Options tab: "at 60 °F" rows and the note. Printed sheet: post-boil label and no "measured at" note at 60. All as today, character for character.
2. A measurement temperature of 150 °F prints "measured at 150 °F" on the sheet, as today.
3. A new recipe (Reset, brewery figures forgotten) has 60/60/60.
4. A recipe saved by the live site loads with every number as on the live site.

## Notes from the spec session, for the builder

- **Today:** `packages/engine/src/units.js` `correctVolumeToRef(volMeasured, tempF, refTempF = 60)`; the app's copies: `OptionsSection.jsx` (the note "corrected to the 60 °F reference", the "at 60 °F (gal)" rows), `VolumesSection.jsx` (post-boil label), `components/recipe-sheet-data.js` (`REFERENCE_TEMP_F = 60` and the post-boil label), `state.js` (`measurementTempF: { preBoil: 60, postBoil: 60, ferment: 60 }`; `persistence.js` upgrades version 1 from the built-in recipe's, so it follows).
- **The number:** the reference is Rev 3's own "at 60 °F" — the spreadsheet's reference, now an engine constant (SPEC rule 2). The golden masters are pinned at it; no hand pin is needed beyond R-S1's identity check. Mind the shelved one-ulp artifact (roadmap): compare corrected volumes with a tolerance, not bit-for-bit, or compare the no-argument call against the explicit-argument call, which are the same arithmetic.
- **Rule 10:** a constant may be imported anywhere (`spec-rules.test.js` checks only functions); `state.js` and components may import it directly.
- **Name** it as the engine names its other constants (e.g. `REFERENCE_TEMP_F` in `units.js`, exported from `index.js`); `boilTimeMin: 60` and the hop `timeMin: 60` in `state.js` are minutes, not this figure — leave them.
- **Files likely touched:** `packages/engine/src/units.js`, `index.js`, an engine test; `apps/recipe/src/state.js`, `components/OptionsSection.jsx`, `components/VolumesSection.jsx`, `components/recipe-sheet-data.js`; the app test; `SPEC.md` rule 11 (name the constant); `docs/TEST_COVERAGE.md`; `docs/ROADMAP.md` (row removed).

## Recorded failure (filled in by the builder)

Run alone against the unchanged code (main 611c643), 2026-09-23:

- Engine, scenario 1: `expected undefined to be 60 // Object.is equality` — the engine exports no reference figure.
- App, scenario 2: `expected 'Post-boil volume at 60 °F' to be 'Post-boil volume at undefined °F'`. Its source scan, run on its own against the same code, names the six copies: `OptionsSection.jsx` the note "corrected to the 60 {tUnit} reference" and the "at 60 ${tUnit}" rows; `recipe-sheet-data.js` `const REFERENCE_TEMP_F = 60` and the post-boil label; `VolumesSection.jsx` the post-boil label; `state.js` `measurementTempF: { preBoil: 60, postBoil: 60, ferment: 60 }`.
- App, scenario 3: `expected { preBoil: 60, postBoil: 60, …(1) } to deeply equal { preBoil: undefined, …(2) }`.
- App, scenario 4 (the guard) passed before, as the table expected.

## Builder's notes — choices the sentences did not make (filled in by the builder)

- **Name and place:** `REFERENCE_TEMP_F = 60` in `packages/engine/src/units.js`, beside `correctVolumeToRef`, whose default argument now reads it; exported from `index.js`. No other engine line changes.
- **The app reads it directly** (a constant, which rule 10 allows): `state.js` for the three new-recipe temperatures (a version-1 recipe is upgraded from the built-in recipe's, so it follows with no change to `persistence.js`); `OptionsSection.jsx` note and "at … °F" rows; `VolumesSection.jsx` and `recipe-sheet-data.js` post-boil labels. The sheet's own copy is deleted; its note rule compares against the engine's.
- **The source scan** (scenario 2) strips comments, then looks for a label "60 °F" / "60 {tUnit}" / "60 ${tempUnit()}", a temperature name set or compared to 60, and a measurement kind defaulting to 60. Boil time and hop time (minutes) do not match. Comments that say "60 degF" are left alone: they write no figure the brewer sees.
- **The engine scenario** compares the no-argument call with the explicit-argument call bit for bit (`toBe`) — the same arithmetic — and never against the measured volume, so the shelved one-ulp artifact cannot bite.
- **SPEC:** rule 6 names the constant; rule 11 says every "at 60 °F" and the sheet's note rule read it, and no app file writes the figure itself.
- **Far end** (built app, port 4175, 2026-09-23): all four checks as the table lists them. For check 4 a version-4 recipe (Pro, SG, 150/180/68 °F, a named strain at 66 °F) was saved by the live site; on the branch build both tabs' text, every box, the printed sheet and the rewritten saved document hash identical to the live site's.
