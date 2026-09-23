# Recipe identity — name, style, notes — Tier B

Status: agreed 2026-09-22 ("A is good. Agree to all."); model rows agreed
2026-09-23 (Opus builds, Opus inspects). Not started. Written by the spec
session; to be built by a new session from CLAUDE.md's kickoff prompt.

## Why

The owner has been designing a real recipe in the app and wants two things the
app cannot do today: save copies as files in OneDrive, and print a recipe
sheet. Both need something the recipe does not have — a name. Malts have names
and hops have names; the recipe itself has none, no style, and nowhere to put
the process detail the app does not model (mash schedule, water notes, what
went wrong last time).

A folder of exported files all called "recipe" is useless, and a printed sheet
with no title is not a document. So identity lands first, and the file and the
sheet build on it.

## Sentences — what must be true afterwards

- **S1** The recipe carries three text fields — name, style, notes — and all three are empty on a new recipe. None of them is ever a number.
- **S2** Name and style are editable at the top of the Recipe tab, above the volumes; notes are a multi-line box at the bottom of the same tab.
- **S3** The three fields reach no calculation: every derived number for a given recipe is exactly what it was before this change, whatever the three contain.
- **S4** The three save and restore with the recipe, in the same one document under the same one key, at schema version 3.
- **S5** A version-1 or version-2 document loads as the same recipe with the three fields empty, every number unchanged, and is written back as version 3. Unreadable data, any other version, or unavailable storage still yields the defaults and never throws.
- **S6** The smoke test's reference state gains the three fields empty, and every number it pins stays identical (SPEC rule 12).

## Decisions — agreed

| id | Question | Decision | Rule |
|---|---|---|---|
| M1 | Builder model | Opus, high effort | The Models rule's default, every tier (the owner, 2026-09-23) |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default (the owner, 2026-09-23). No recipe number is introduced — the three fields are text and reach no calculation — so no hand-calculated pin is owed; the schema tag 3 is a version, not a recipe value |
| I1 | Which fields | Name, style, notes (N1, N2) | Both the file name and the sheet title need a name; style prints beside it on the sheet; notes carry what the app does not model |
| I2 | A stored "brewed on" date | No. The printed sheet carries a blank "Date brewed: ____" to fill in by hand (N3) | The app is a designer, not a brew log; a stored date goes stale the second the recipe is brewed twice |
| I3 | Empty or a default name | Empty. The app never invents "My Recipe" | An invented name is indistinguishable from one the owner chose, and would be exported as if he had named it |
| I4 | Length limit | None in the recipe. The printed sheet wraps a long name rather than truncating it | A limit is a number nobody decided; wrapping loses nothing |
| I5 | Schema version | 2 → 3. Versions 1 and 2 both stay readable; a version-1 document still gets the reference measurement temperatures as it does today, and now also the three empty fields (N4) | SPEC rule 13; nothing the owner has saved may be lost |
| I6 | Silent properties | Still one key, one document, last write wins across tabs — unchanged. The name is not a storage key, so two recipes with the same name do not collide in storage (there is only ever one working copy; files are the way to keep more than one). Autosave stays synchronous on every keystroke; a notes box does not change that. Nothing here is atomic or ordered differently than today | Named so they are checked, not discovered |
| I7 | Files and tier | Tier B. `apps/recipe/src/state.js`, `apps/recipe/src/persistence.js`, `apps/recipe/src/App.jsx`, a new `apps/recipe/src/components/IdentitySection.jsx`, `apps/recipe/test/smoke.test.js` (reference state), `apps/recipe/test/persistence.test.js`, `SPEC.md` (rule 13, the version), `docs/TEST_COVERAGE.md`, `docs/ROADMAP.md` (this item's row removed), this file | Smallest change; state and persistence are Tier B paths |

## Scenarios — `apps/recipe/test/persistence.test.js` and a new `apps/recipe/test/identity.test.js`, written first, must fail before

1. *a new recipe has an empty name, style and notes* — S1
2. *the three fields reach no calculation: every derived number is identical with them empty and filled* — S3
3. *name, style and notes round-trip through save and load at version 3* — S4
4. *a version-2 document loads as the same recipe with the three fields empty and is written back as version 3* — S5
5. *a version-1 document loads with the reference temperatures and the three fields empty* — S5

Unchanged and must still pass: every existing persistence scenario, and the
whole smoke test with the reference state carrying the three empty fields.

## Far end — Tier B

`npm test` at the root; `npm run build`; then the running app in a browser:
type a name, style and notes, reload, confirm all three come back and no stat
moved; confirm a recipe saved before the change still loads.

## Recorded failure (filled in by the builder)

## Builder's notes — choices the sentences did not make (filled in by the builder)
