# Options page — Tier B

Status: agreed 2026-09-21 ("agree to all", after the owner amended P9 — an
Options tab, the Volumes card first with the fermentation volume in it — and
the table was restated in engineering language), not started. Written by
the spec session; to be built by a new session from CLAUDE.md's kickoff
prompt. R1 (a Roles-rule amendment: plain language to the owner) was applied
to CLAUDE.md in the same commit as this file, so it is not a builder file.

## Why

SPEC rule 11 names `toReferenceVolume` as the volume-correction slot and
says it is a no-op "until the Options page supplies measurement temps";
`reference-volume.js` carries a `FUTURE:` comment for the same call. The
engine's `correctVolumeToRef` exists and is pinned (`units.test.js`: factor
exactly 1 at 60 °F; ~3.2 % shrink from 190 °F), but nothing reaches it. A
brewer who measures 16 gal hot at 190 °F is brewing on 15.48 gal at
reference; today the app cannot say so. Coverage: rule 6 "partial", rule 11
"gap" (`docs/TEST_COVERAGE.md`).

Facts probed on `main` at c35014d (engine, `node`): `correctVolumeToRef`
computes `(v · d) / d`, not `v · (d / d)`; at 60 °F it returns 7 →
7.000000000000001 and 5 → 4.999999999999999 (one ulp), and is exact for 16,
14.5, 12, 13, 5.5, 1.5, 6.25, 0.1. `fToC(212) === 100` and `fToC(32) === 0`
exactly, so the table range 0–100 °C is 32–212 °F inclusive. NaN, 31.9,
212.1, Infinity all throw `RangeError` from `waterDensityC`. Sample
corrections: 16 @ 190 °F → 15.483893355696411; 14.5 @ 212 °F →
13.90996951399231; 12 @ 40 °F → 12.011398052054219; 7 @ 170 °F →
6.82357933090943.

## Sentences — what must be true afterwards

- **S1** The recipe state holds three measurement temperatures in °F — `measurementTempF.preBoil`, `.postBoil`, `.ferment` — and a new recipe has all three at 60 °F, the engine's reference (SPEC rule 6), so until a brewer enters one every derived number is what it is today.
- **S2** Pre-boil, post-boil, and fermentation volumes reach the engine corrected to 60 °F by `correctVolumeToRef` at their own measurement temperature, through `toReferenceVolume(measuredGal, kind, measurementTempF)`; mash water is used as entered (SPEC rules 6, 11). The post-boil volume is the measured pre-boil volume less boil-off, corrected at the post-boil temperature — the selector's existing wiring, unchanged.
- **S3** A temperature the engine cannot correct — cleared (NaN) or outside its density table (0–100 °C, i.e. 32–212 °F) — yields a NaN volume, so the stats that depend on it show "—" as they do for a cleared volume; nothing throws and the app does not crash.
- **S4** An "Options" tab, reached from a tab bar under the header (Recipe · Options, drawn as Brew Water Chem's), holds a "Measurement temperatures" card with the three temperatures as editable °F fields, each with the volume at 60 °F the engine receives shown read-only beside it; an edit stores the °F value as typed (canonical and display unit are the same); "Reset to defaults" returns them to 60 °F. The stats bar stays visible on both tabs, and the app opens on Recipe.
- **S5** The saved document carries schema version 2 and the three temperatures; a cleared temperature round-trips as NaN (SPEC rule 13).
- **S6** A version-1 document — one saved by the app before this change — loads as the same recipe with all three temperatures at 60 °F, every number as it was, and is saved back as version 2. Any other version, unreadable data, or unavailable storage yields the defaults, as before.
- **S7** `smoke.test.js` passes with its assertions and tolerances untouched; its reference state gains the three temperatures at 60 °F and nothing else.
- **S8** On the Recipe tab the "Volumes" card comes first — mash water, the boil rows, and the fermentation volume, moved there from the Yeast card — followed by Grist, Hops, and Yeast & Starter. Every value shown and every edit stores exactly what it did before the move.

## Decisions — agreed

| id | Question | Decision | Rule |
|---|---|---|---|
| M1 | Builder model | Opus, high effort | Models: strongest available for Tier B |
| M2 | Inspector model | Sonnet, default effort | The numbers are 60 (the engine's `refTempF`, SPEC rule 6, pinned by `correctVolumeToRef(16, 60) === 16`) and the schema tag 2; nothing unruled, no engine file → the other model |
| P1 | Scope: the °C toggle | Not in this item. It is its own roadmap row, Tier A + B: the engine has `fToC` but no `cToF`, and SPEC rule 9 forbids writing one in the app | Smallest change; one engine line would send the whole item to a cross-family read for a display feature independent of the correction |
| P2 | State shape | `recipe.measurementTempF = { preBoil, postBoil, ferment }` in °F, inside the canonical recipe, not the display settings | It changes numbers, so it is recipe (SPEC rule 8); it persists with the recipe; the keys are the `kind` strings rule 11 names |
| P3 | Defaults | 60 °F for all three | Governing question: any other default changes every number on screen at deploy. 60 is the engine's reference; the factor is 1 |
| P4 | The slot | `toReferenceVolume(measuredGal, kind, measurementTempF)` returns `correctVolumeToRef(measuredGal, measurementTempF?.[kind])`; `computeRecipe` passes `state.measurementTempF` and also returns the three corrected volumes as `refVolumesGal` (`{ preBoil, postBoil, ferment }`, for S4); `postBoilVolGal` stays in the return for the Volumes card | `kind` stays so the routing is checkable — three kinds, none for mash water; SPEC rule 11 is reworded to the new signature |
| P5 | Uncorrectable temperature | The slot catches the engine's `RangeError` (NaN, or outside 0–100 °C) and returns NaN; any other error propagates; a missing map or kind reaches the engine as NaN (`fToC(undefined)`) and is caught the same way. No clamping, no fallback to the uncorrected volume | Clamping or falling back would be a number the brewer did not enter; NaN is the app's cleared-field convention (SPEC rule 13); the engine's table bounds are the rule for the range |
| P6 | Post-boil wiring | Unchanged: `computePostBoilVol(measured pre-boil, boil-off, time)`, then corrected at the post-boil temperature | Existing selector design; changing it is a spreadsheet-parity question, not this item's |
| P7 | Schema | `SCHEMA_VERSION = 2`. A `version: 1` document is read by setting `measurementTempF` to `defaults.recipe.measurementTempF` (overriding any such key — v1 code never wrote one), then validated as v2; the autosave rewrites it as v2 on load. Versions other than 1 and 2 → defaults | Persistence P2 said no migration until a v2 exists; it now does, the migration is the identity in numbers, and the live site holds a day of saved recipes worth keeping |
| P8 | Shape check | `hasShapeOf` stays top-level: `measurementTempF` must be a non-null object; a kind missing inside it yields NaN for that volume (blank stats), never a crash | Persistence's uniform rule; hand-edited documents are not an input |
| P9 | UI | **Tabs:** new `components/TabBar.jsx`, a copy of Brew Water Chem's tab row (`src/App.jsx` "Tabs" block: text buttons, `type="button"`, active `fontWeight: 700` with a 2 px `borderBottom` in `colors.textPrimary`, inactive `colors.textMuted`; row `borderBottom` in `colors.border`; existing tokens only, no new hex), placed under the header's toggle row and above the sticky stats bar — BWC's position, and the stats respond live to a temperature edit. `App.jsx` holds `tab` (`'recipe' \| 'options'`), default `'recipe'`; `<main>` renders one tab's content. **Options tab:** `components/OptionsSection.jsx`, a card labelled "Measurement temperatures" with a one-line caption in `tokens.notice` ("Volumes are corrected to the 60 °F reference from the temperature they were measured at; mash water is used as entered" — text naming the engine's reference, not a computation), three `InputRow`s labelled "Pre-boil volume measured at (°F)", "Post-boil volume measured at (°F)", "Fermentation volume measured at (°F)" (unit via `tempUnit()`), `step={1}`, each followed by a read-only `InputRow` "at 60 °F (gal\|bbl)" showing `Number(volumeFromCanonical(refVolumesGal[kind], mode).toFixed(3))` — the post-boil row's precision. **Recipe tab:** order Volumes, Grist, Hops, Yeast & Starter. `MashSection.jsx` is renamed `VolumesSection.jsx` (git rename), card label "Volumes"; the fermentation-volume `InputRow` moves into it verbatim from `YeastSection.jsx` as the last row of the right column under a "Ferment" sub-label (same style as the "Mash" / "Boil" sub-labels); the post-boil row is relabelled "Post-boil volume at 60 °F" since it already shows the corrected value. `YeastSection.jsx` loses the row and its `fermentVolGal` / `setField` props; unused imports in either file stay (the roadmap's Dead code item, not a drive-by). Setter `setMeasurementTemp(kind, tempF)` in `App.jsx`, shaped like `setYeast` | BWC parity (SPEC design section); read-only values as plain text (SPEC rule 15); the brewer sees the number the engine acts on |
| P9b | Active tab | Not persisted; every load opens on Recipe | Navigation, not a setting; no persisted field beyond S5; BWC does the same |
| P10 | Input pattern | `InputRow` + `parseFloat` + `Number.isFinite` guard, as `MashSection`'s `volRow`: a non-finite entry is not written to state; a non-finite state value is shown as `''` (as `NumberField` does) | Consistency with the neighbouring card; NaN then reaches the slot only from a saved document, which P5 covers |
| P11 | Smoke test | `referenceState` gains `measurementTempF: { preBoil: 60, postBoil: 60, ferment: 60 }`; no assertion or tolerance changes. SPEC rule 12 reworded: its assertions and tolerances never change; its reference state is a canonical state and gains a field only when the canonical state does, at the value that leaves every pinned number the same | Rule 12 guards the gate, not the shape of a canonical state |
| P12 | Silent properties | **Round-off:** `(v · d) / d` differs from `v` by one ulp for v = 7 and 5, exact for 16, 14.5, 12, 5.5 — 1e-16 relative, invisible at display precision, ten orders inside every tolerance; no compensation in the app (a special case would be a rule of its own); the engine's doc claim ("factor is exactly 1") is a Tier A roadmap line added with this file; pinned at 1e-12 by scenario 1. **Migration idempotence:** a v1 document is migrated on read and rewritten as v2 by the autosave on mount; the next load reads v2. **Mixed versions across tabs:** a tab still running the old code writes v1 over v2 on its next edit; the next load migrates it again and the temperatures return to 60 °F — accepted under Persistence P4 (last write wins, no sync). **Storage unavailable, atomicity, durability:** unchanged (Persistence P1, P3, P5) | Named so the inspector can check each |
| P13 | Files and tier | Tier B. `apps/recipe/src/state.js`, `reference-volume.js`, `selectors.js`, `persistence.js`, `App.jsx`, `components/TabBar.jsx` (new), `components/OptionsSection.jsx` (new), `components/MashSection.jsx` → `components/VolumesSection.jsx` (rename, label, fermentation row, post-boil label), `components/YeastSection.jsx` (row removed), `test/options.test.js` (new), `test/smoke.test.js` (P11 only), `SPEC.md` (rules 11, 12, 13), `docs/TEST_COVERAGE.md` (rules 6, 11, 13; scenario row; the rule-11 gap row removed; totals), `docs/ROADMAP.md` (Options page row removed; the Dead code row now names `VolumesSection.jsx`), this file (status, recorded failure, builder's notes) | Smallest change; every Tier B path is already in the hook regex |
| R1 | Roles rule | Everything put to the owner — scope tables, questions, reports — is written in engineering language: what the brewer sees and what happens to the numbers, never code identifiers. File names, signatures, and implementation choices go in the item file for the builder. Applied to CLAUDE.md with this file | The owner is an engineer, not a programmer (2026-09-21); an agreement he cannot follow is not an informed one |

## Scenarios — `apps/recipe/test/options.test.js`, written first, must fail before

Expected values come from the engine (`correctVolumeToRef`, `computeGrist`,
`computeHops`, `computeCellsNeeded` called with the corrected volume), not
from literals — the test asserts the app routes to the engine, not what the
engine says.

1. *the default temperatures are 60 °F and leave every derived number the engine's for the uncorrected volumes, within 1e-12* — S1, S7 (`defaultRecipeState().measurementTempF` equals `{ preBoil: 60, postBoil: 60, ferment: 60 }`; `computeRecipe(defaultRecipeState())` against the engine called with the raw volumes: preBoilSg, OG, SRM, mashRv, totalIBU, dryHopRatio, cells)
2. *a pre-boil temperature corrects only the pre-boil volume* — S2 (reference recipe with `preBoil: 190`: preBoilSg is `computeGrist`'s for `preBoilVolGal: correctVolumeToRef(16, 190)`; `postBoilVolGal` stays 14.5; mashRv stays 1.7931034 — mash water as entered)
3. *a post-boil temperature corrects the post-boil volume* — S2 (`postBoil: 212`: `postBoilVolGal` is `correctVolumeToRef(14.5, 212)` and OG is `computeGrist`'s for it)
4. *a fermentation temperature corrects the fermentation volume* — S2 (`ferment: 40`: cells are `computeCellsNeeded`'s and dryHopRatio is `computeHops`'s for `correctVolumeToRef(12, 40)`)
5. *`toReferenceVolume` corrects at the temperature of its kind and returns NaN for one the engine cannot correct* — S2, S3 (direct: `toReferenceVolume(16, 'preBoil', { preBoil: 190, postBoil: 60, ferment: 60 })` equals `correctVolumeToRef(16, 190)`; NaN, 31, 213, Infinity, a missing map, a missing kind → NaN; `computeRecipe(...).refVolumesGal` carries the three)
6. *an uncorrectable temperature blanks the dependent stats and nothing throws* — S3 (through `computeRecipe`: `preBoil: NaN` → preBoilSg NaN; `ferment: 213` → cells NaN and `starter` empty; neither call throws)
7. *the saved document carries version 2 and the temperatures; a cleared one round-trips as NaN* — S5
8. *a version-1 document loads as the same recipe with the reference temperatures and is saved back as version 2* — S6 (a v1 document with `preBoilVolGal: 16` and no `measurementTempF`: loads with 16, temperatures 60/60/60; after `savePersisted` the stored `version` is 2)
9. *a version-2 document loads; any other version yields the defaults* — S6 (a v2 document with `preBoil: 170` loads with 170; versions 0, 3, `"1"`, `"2"` → defaults)

Expected failure before the change: 1 and 8 on the missing field
(`measurementTempF` undefined); 2–6 because the no-op slot returns the
measured volume (the numbers equal the uncorrected ones; nothing is NaN;
`refVolumesGal` undefined); 7 on `version` 1; 9 because v2 is "a different
version" and loads as the defaults. `smoke.test.js`: 13 before and after.
S4 and S8 are layout, proved at the far end.

## Far end — Tier B, on the built app (`vite preview`, `.claude/launch.json` → `recipe-preview`)

Snapshot `main` first: default recipe, Home — every stat and every input,
and the stored document after one edit (pre-boil 8) for the v1 seed.

Then, on the new build:
1. Tab bar shows Recipe · Options; the Recipe tab reads Volumes, Grist, Hops, Yeast & Starter; the fermentation volume is in Volumes and gone from Yeast; the stats bar is visible on both tabs; a reload opens on Recipe.
2. Default recipe: Options shows 60 / 60 / 60 and "at 60 °F" volumes equal to the entered ones (7.000, 5.500, 5.500); every other number identical to the `main` snapshot.
3. Pre-boil measured at 170 → its "at 60 °F" reads 6.824 (`correctVolumeToRef(7, 170)` = 6.8236); OG rises; the stored document is `version: 2` with `measurementTempF.preBoil: 170`; reload holds.
4. 250 → "—" for the pre-boil reference volume and every stat downstream; no crash; 170 again → recovers.
5. Editing the fermentation volume in Volumes moves cells (Yeast) and the dry-hop rate (Hops) exactly as before and stores `fermentVolGal`.
6. Seed storage with the v1 document captured from `main` (pre-boil 8) → the new build shows pre-boil 8, 60 / 60 / 60, and the stored document is rewritten as `version: 2`.
7. Reset to defaults → 60 / 60 / 60 (the confirm dialog: cancel path unchanged; accept path with `window.confirm` stubbed, as in Persistence).
8. Pro → the "at 60 °F" volumes show in bbl.

## Recorded failure (filled in by the builder)

## Builder's notes — choices the sentences did not make (filled in by the builder)
