# Saved rows checked inside — Tier B

Status: agreed 2026-09-23 ("agree to all"), not started. Written by the S1
session; built in batch S2 (docs/ROADMAP.md, Sessions), second of its four
items.

## Why

The reader checks only a saved recipe's top-level fields. A hand-damaged
recipe file or saved copy whose malt, hop or yeast lacks a field — its name,
say — loads, and then breaks the search box it feeds (the malt and hop rows
since the searchable boxes; the yeast since the Yeast card). Noticed
building the Yeast card, 2026-09-23.

## Sentences — what must be true afterwards

- **V-S1** A saved recipe or recipe file is readable only if every malt, kettle-hop and dry-hop row, and the yeast, has all its fields, each of the right kind: names are text; numbers are a number or blank; ale/lager and the yeast character are one of their choices.
- **V-S2** A recipe file that fails is refused with the "damaged" message, and the recipe on screen is untouched.
- **V-S3** A saved copy in the browser that fails starts a new recipe, as for any damaged saved copy today.
- **V-S4** Every recipe an earlier version saved still loads, and a blank number still loads as blank.

## Decisions — agreed

| id | Question | Decision | Rule |
|---|---|---|---|
| M1 | Builder model | Opus, high effort | The Models rule's default (the owner, 2026-09-23) |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default |
| V1 | Refuse a damaged recipe, or repair it by filling in the missing fields? | Refuse | A repaired recipe would carry figures nobody entered |
| V2 | Extra fields the app does not know | Ignored | They feed nothing; newer versions are already refused by their version number |
| V3 | Keep a damaged saved copy aside instead of letting the autosave replace it? | Yes: the latest unreadable saved copy is kept, as it was, under its own key; there is no screen for it | Never lose a brewer's work without a trace |
| K | Silent properties | **Schema migration:** none — the rows' fields have not changed since the first version (checked against every version of `state.js`), and version 1–3 yeasts gain their name and fermentation temperature before the check. **Storage disabled:** as today, nothing throws; keeping the copy aside is best-effort and never blocks loading. **Idempotence:** loading twice keeps the same one copy. **Multi-tab:** last write wins, as the recipe | — |

## Scenarios — `apps/recipe/test/saved-rows.test.js`, written first, must fail before

1. *a malt, kettle-hop or dry-hop row missing a field, or holding the wrong kind of value, makes the recipe unreadable* — V-S1, V1. One case per field and per kind (a name that is a number, a weight that is text, a row that is not an object).
2. *a yeast missing a field, or with a type or character outside its choices, makes the recipe unreadable* — V-S1.
3. *a damaged recipe file is refused with the damaged message and changes nothing on screen* — V-S2.
4. *a damaged saved copy starts a new recipe, and the damaged copy is kept aside, as it was* — V-S3, V3. It stays aside after the autosave writes the new recipe; a second load keeps one copy; blocked storage still loads and nothing throws.
5. *every earlier version's saved recipe still loads, blanks as blanks, and unknown extra fields are ignored* — V-S4, V2. Version 1, 2, 3 and 4 documents with blank numbers in every row.

Expected failure before the change: scenarios 1–4 fail (a damaged row loads;
nothing is kept aside); scenario 5 passes before and after. It guards V-S4
and is named as the guard.

## Far end — Tier B, on the built app

1. Import a recipe file with a malt's name removed by hand: refused with the damaged message; the recipe on screen unchanged.
2. Put the same damaged document in browser storage and reload: a new recipe; the damaged text is still in storage under the kept-aside key.
3. A recipe saved by the live site loads with every number as on the live site; one with blank boxes loads with them blank.

## Notes from the spec session, for the builder

- **Today:** `apps/recipe/src/persistence.js` `readDocument` upgrades, then `hasShapeOf(recipe, defaults.recipe)` checks top-level keys only. Row templates: `defaultRecipeState()`'s first malt, first kettle addition, the dry hop and the yeast; `ingredient-search.js` `NEW_ROW` has the same fields. A blank number is stored as `null` and revived as NaN before the check, so "a number or blank" means `typeof === 'number'` after revival.
- **Choices:** type `ale` | `lager`; character (`density`) `high` | `mod` | `low`; the yeast's `name` text and `fermTempF` a number or blank (both added by the version-4 upgrade for older documents). The measurement temperatures' three fields are not in V-S1; if you check them too, say so in your notes — or put it on the roadmap.
- **V3:** in the storage path only (`loadPersisted` / `loadStartingState`), never for a file (a refused file is still on the brewer's disk). Keep the raw text as found — including text that is not JSON and a newer version's document — under one key such as `brew-design.recipe.unreadable`, overwritten by the next unreadable one. Nothing reads it back.
- **Files likely touched:** `persistence.js`, the new test, `SPEC.md` rule 13 (rows are checked; an unreadable saved copy is kept aside), `docs/TEST_COVERAGE.md`, `docs/ROADMAP.md` (row removed).

## Recorded failure (filled in by the builder)

## Builder's notes — choices the sentences did not make (filled in by the builder)
