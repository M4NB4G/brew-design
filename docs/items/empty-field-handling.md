# Empty-field handling — Tier B

Status: agreed 2026-09-23 ("agree to all"); landed 2026-09-23 on branch S2
as "Every number box can be emptied, and an empty box is a blank figure,
saved as blank; a line under the stats bar names the empty boxes". Written by the S1
session; built in batch S2 (docs/ROADMAP.md, Sessions), last of its four
items.

## Why

Emptying a box behaves two ways today: the volume boxes and the measurement
temperatures snap back to their old number, while every other number box
goes blank and blanks the figures that depend on it — with nothing saying
why. The roadmap draft also said a blank would never be stored; the owner
dropped that (E1).

## Sentences — what must be true afterwards

- **E-S1** Every number box can be emptied, and an empty box is a blank figure.
- **E-S2** When any number box is empty, a line under the stats bar names them — for example "Empty: Pale 2-Row weight, Boil time — figures that depend on them show —" — and names a measurement temperature outside the correction's range the same way.
- **E-S3** A blank stays blank: it is saved, exported and reloaded as blank; the app never puts in a number the brewer did not enter.
- **E-S4** Nothing is calculated differently.

## Decisions — agreed

| id | Question | Decision | Rule |
|---|---|---|---|
| M1 | Builder model | Opus, high effort | The Models rule's default (the owner, 2026-09-23) |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default |
| E1 | "Never store a blank" (the roadmap draft) | Dropped | Otherwise the box looks empty while the stats use the old number |
| E2 | Name the empty boxes, or trace which stat each one blanks? | Name the empty boxes | Simple and always true; tracing would restate the engine's math in the app |
| E3 | Where the line shows | Under the stats bar, on both tabs; never on the printed sheet, which already prints a dash | Seen wherever the blank stat is seen |
| E4 | Do My brewery's boxes count? | No | A blank there means "use the built-in figure" |
| K | Silent properties | **Storage:** blanks are already saved as blank (SPEC rule 13); nothing new is stored. **Schema:** unchanged. **Multi-tab:** as the recipe | — |

## Scenarios — `apps/recipe/test/empty-fields.test.js`, written first, must fail before

1. *the empty number boxes are named, in screen order, by the row they belong to* — E-S2, E2. A malt by its name ("Pale 2-Row weight"), an unnamed row by its place ("Malt 2 weight"), a kettle hop's time, temperature, weight and alpha, a dry hop's weight, the volumes, boil time, efficiency, attenuation, the measurement temperatures; nothing named when nothing is empty.
2. *a measurement temperature the correction cannot use is named with the empty boxes* — E-S2. Read from the recipe's own figures (a temperature that is a number, whose volume at 60 °F is blank), never from a range written in the app.
3. *emptying a volume box or a measurement temperature makes that figure blank* — E-S1. However the builder reaches it — a small change to the boxes' handlers the test can call, or the far end if no test can see it (then say so, as phone width did).
4. *a blank round-trips as blank through saving, the recipe file and reloading* — E-S3 (the existing persistence scenarios cover part; this one covers the volume and temperature boxes newly emptied).
5. *with boxes empty, every figure that does not depend on them is the engine's* — E-S4, the guard.

Expected failure before the change: nothing names empty boxes, and the
volume and temperature boxes cannot be emptied.

## Far end — Tier B, on the built app

1. Empty the first malt's weight: OG, FG, ABV, SRM, IBU and cells show "—", and the line under the stats bar names it; refill it and the line goes.
2. Empty mash water, pre-boil volume, boil-off rate, fermentation volume, and a measurement temperature: each stays empty (no snap-back), its figures show "—", and the line names it — Home and Pro.
3. A measurement temperature of 250 °F: named as outside the correction's range.
4. Reload and export/import with boxes empty: still empty, still named.
5. A new recipe shows no line. The printed sheet shows no line. No sideways scroll at 375 px.
6. A recipe saved by the live site loads with every number as on the live site.

## Notes from the spec session, for the builder

- **Today:** `components/VolumesSection.jsx` `volRow` and the fermentation row drop a non-finite entry (snap-back); `components/OptionsSection.jsx` does the same for the three temperatures; boil time, efficiency (`GristTable.jsx`), attenuation (`YeastCard.jsx`) and every `NumberField` already write NaN for an empty box. My brewery's boxes (the same file) blank to `null` — leave them (E4).
- **Only boxes that feed a figure.** The fermentation temperature feeds no calculation and is blank on every new recipe (the yeast-card item), so naming it would put the line on every new recipe; the spec session reads E-S2 as excluding it. Text boxes (names, style, notes) are never named. If you read it otherwise, ask the owner.
- **Out of range** comes from the recipe's own figures: `computeRecipe`'s `refVolumesGal[kind]` is NaN while the measured volume and its temperature are numbers. No range figure (0–100 °C) may be written in the app (the catch-all; SPEC rule 7).
- **Where the naming lives:** a pure function beside the selectors (it calls no engine function, so it need not be in `selectors.js`), tested directly; the line itself is a small component under the stats bar in `App.jsx`'s sticky block, both tabs.
- **SPEC:** say that an emptied box is a blank figure, never replaced by a number, and that the app names the empty boxes (rule 8 or a new rule).
- **Files likely touched:** `App.jsx`, `components/VolumesSection.jsx`, `components/OptionsSection.jsx`, `components/StatsBar.jsx` or a new component, a new pure module, the new test, `SPEC.md`, `docs/TEST_COVERAGE.md`, `docs/ROADMAP.md` (row removed).

## Recorded failure (filled in by the builder)

Run alone against the code after the third S2 item (424918f), 2026-09-23:

- Scenarios 1 and 2: `Cannot find module '../src/empty-fields.js'` — nothing names empty boxes.
- Scenarios 3 and 4: `(0 , volumeChange) is not a function` — the volume and temperature boxes had no handler that could write a blank: their inline handlers dropped an empty entry (`if (Number.isFinite(v)) setField(…)`), so the box snapped back to its old number.
- Scenario 5 (the guard) passed before, as expected.

## Builder's notes — choices the sentences did not make (filled in by the builder)

- **The naming** is `apps/recipe/src/empty-fields.js`: `emptyFields(recipe, derived)` lists the empty boxes, `emptyFieldsLine(names)` makes the line ("…depend on it show —" for one, "…on them…" for more; nothing when none). It calls no engine function and holds no number but counts (0, and a row's place + 1), which scenario 2 checks.
- **Names:** the box's label ("Mash water", "Boil-off rate", "Brewhouse efficiency", "Apparent attenuation"); a row by its name and column ("Pale 2-Row FGDB", "Magnum temperature"), or by its place when unnamed or blank ("Malt 2 weight", "Kettle hop 2 alpha", "Dry hop 2 weight"); a named dry hop says so ("Citra dry-hop weight"), as the same hop may be in the kettle; the Options temperatures as "Pre-boil measurement temperature" and so on, with " (outside the correction's range)" when the correction cannot use them.
- **Screen order:** the Recipe tab top to bottom (Volumes card: Mash, Boil, Ferment; Grist rows then efficiency; the Yeast card's attenuation; kettle hops; dry hops), then the Options tab's three temperatures. The item's example sentence lists "Pale 2-Row weight, Boil time"; on screen the Volumes card is above the Grist table, so boil time comes first — the scenario's "in screen order" governs.
- **Out of range** is read as the item says: a temperature that is a number, whose volume at 60 °F is blank while the measured volume is a number (for post-boil, the as-measured figure from the previous S2 item). With the volume itself blank, only the volume is named.
- **Excluded:** the fermentation temperature (feeds no figure; blank on every new recipe), text boxes, My brewery's boxes (E4).
- **The boxes:** the Volumes card's four volume boxes and the Options tab's three temperatures now write the parsed entry — NaN when emptied — through two small exported handlers (`volumeChange` in `VolumesSection.jsx`, `temperatureChange` in `OptionsSection.jsx`), which the scenarios call with the event an emptied box sends. A blank volume shows as an empty box. Every other number box already wrote NaN.
- **The line** is `components/EmptyFieldsLine.jsx`, in the shared warning style, under the stats bar inside the pinned block in `App.jsx`, so both tabs show it and the printed sheet (outside the app root) never does.
- **SPEC:** rule 8 now says an emptied box is a blank figure, never replaced, and that the line names the empty boxes and an unusable measurement temperature, read from the recipe's own figures.
- **Far end** (built app, 2026-09-23): all six checks as the table lists them — see `docs/TEST_COVERAGE.md`'s scenario row. The live-site comparison needs the pane at desktop width: in a narrow pane the app takes its phone layout, whose text order differs, on both builds.
