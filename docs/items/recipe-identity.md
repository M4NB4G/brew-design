# Recipe identity — name, style, notes — Tier B

Status: agreed 2026-09-22 ("A is good. Agree to all."); model rows agreed
2026-09-23 (Opus builds, Opus inspects). Landed 2026-09-23 on branch
`recipe-identity` as "The recipe carries a name, a style and notes: empty
when new, saved with it at schema version 3, read by no calculation";
awaiting the owner's "merge and push".

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
| I7 | Files and tier | Tier B. `apps/recipe/src/state.js`, `apps/recipe/src/persistence.js`, `apps/recipe/src/App.jsx`, a new `apps/recipe/src/components/IdentitySection.jsx`, a new `apps/recipe/test/identity.test.js`, `apps/recipe/test/options.test.js` (the three rewrites below), `apps/recipe/test/smoke.test.js` (reference state), `SPEC.md` (rule 13, the version), `docs/TEST_COVERAGE.md`, `docs/ROADMAP.md` (this item's row removed), this file | Smallest change; state, persistence and App are Tier B paths |

## Scenarios — written first, must fail before

New, in `apps/recipe/test/identity.test.js`:

1. *a new recipe has an empty name, style and notes* — S1
2. *the three fields reach no calculation: every derived number is identical with them empty and filled* — S3
3. *name, style and notes round-trip through save and load at version 3* — S4

Rewrites of the three options-page scenarios in `apps/recipe/test/options.test.js`
that pin version 2 as a literal — each is true today and false after this item,
so each is rewritten, not left to fail:

4. *the saved document carries version 2 and the temperatures; a cleared one round-trips as NaN* → *the saved document carries version 3 …*; only the version assertion changes — S4
5. *a version-1 document loads as the same recipe with the reference temperatures and is saved back as version 2* → *… with the reference temperatures and an empty name, style and notes, and is saved back as version 3*. Its fixture must also delete the three new fields, since it is built from the default recipe and a real version-1 document never had them — S5
6. *a version-2 document loads; any other version yields the defaults* → *a version-2 document loads with an empty name, style and notes; a version-3 document loads; any other version yields the defaults*. The version-2 fixture deletes the three fields for the same reason; the rejected set becomes 0, 4, "1", "2", "3" — S5

Expected failure before the change: 1 and 3 — the fields do not exist; 2 —
on today's code the fields do not exist, so "no number moves" would pass
without testing anything: it must first assert the three are present on a
new recipe, and that assertion is its failure; 4 — version 2 ≠ 3; 5 — the
loaded recipe lacks the three fields and saves as 2; 6 — the version-3
document yields the defaults. Record the assertion lines.

Unchanged and must still pass: every scenario in
`apps/recipe/test/persistence.test.js` (they read the schema version from the
code's own constant, so they follow it to 3 — checked 2026-09-23), the other
six options-page scenarios, and the whole smoke test with the reference state
carrying the three empty fields.

## Far end — Tier B

`npm test` at the root; `npm run build`; then the running app in a browser:
type a name, style and notes, reload, confirm all three come back and no stat
moved; confirm a recipe saved before the change still loads.

## Recorded failure (filled in by the builder)

Run alone against the unchanged code, 2026-09-23
(`npx vitest run test/identity.test.js test/options.test.js` in `apps/recipe`):
6 failed, 6 passed (the six other options-page scenarios).

1. *a new recipe has an empty name, style and notes* —
   `expect(s.name).toBe('')` → expected undefined to be ''
2. *the three fields reach no calculation …* —
   `expect(empty).toHaveProperty('name', '')` → expected { malts, efficiency, … } to have property "name" with value ''
3. *name, style and notes round-trip through save and load at version 3* —
   `expect(doc.version).toBe(3)` → expected 2 to be 3
4. *the saved document carries version 3 …* —
   `expect(doc.version).toBe(3)` → expected 2 to be 3
5. *a version-1 document loads … and an empty name, style and notes, and is saved back as version 3* —
   `expect(loaded.recipe).toEqual({ ...v1Recipe, measurementTempF: AT_REFERENCE, name: '', style: '', notes: '' })` → deep-equal fails: `name`, `notes`, `style` missing
6. *a version-2 document loads with an empty name, style and notes; a version-3 document loads; …* —
   `expect(loadPersisted(s, defaults()).recipe).toEqual({ ...v2Recipe, name: '', style: '', notes: '' })` → deep-equal fails: `name`, `notes`, `style` missing

## Builder's notes — choices the sentences did not make (filled in by the builder)

1. **Which item file.** The kickoff named this file; the version read was the
   one revised on the unmerged `items-ready` branch (288f048), whose
   scenario list adds the three options-page rewrites and names
   `identity.test.js` and `options.test.js` in I7. `main` carries the earlier
   version (scenarios in `persistence.test.js`, no rewrites). The sentences
   S1–S6 and the decisions M1, M2, I1–I6 are word-for-word the same in both;
   only the scenario list and I7's file list differ. This commit carries the
   revised version of this one file into `main`, with the status and these
   notes. The other four item files on `items-ready` are untouched.
2. **Scenario 6's failure line.** The item predicted scenario 6 would fail on
   the version-3 document; it fails first on the version-2 line, which comes
   first in the scenario (the unchanged code loads the version-2 document
   without the three fields). The version-3 line would also fail on the
   unchanged code, which rejects version 3 and returns the defaults.
3. **Migration.** Versions 1 and 2 get the three set to empty text
   explicitly (not copied from the defaults), after the version-1
   temperature step and before the existing shape check.
4. **Text is stored as typed.** No trimming, no whitespace or line-ending
   normalisation, no length limit (I4). A stored document whose name, style
   or notes is not text (a number, or null) fails the existing shape check,
   because the default is text, and yields the defaults — no new code.
5. **Scenario 2** compares everything the recipe calculation returns, as a
   whole, with the three empty and filled; the filled name is "1.060" and
   the notes hold gravities and temperatures, so text that looks like a
   number is shown to reach nothing.
6. **Layout.** One new file, two sections: a "Recipe" card with Name and
   Style side by side (they stack when the column is narrower than about
   480 px — a layout value, not a recipe number) above Volumes, and a
   "Notes" card, six rows high and vertically resizable, below Yeast &
   Starter. Both reuse the existing full-width input style from
   `styles.js`; no new colours.
7. **Far end, 2026-09-23.** The live site (version 2) was set to pre-boil 8
   and its saved document copied into the branch build's storage; on load
   every number on the Recipe tab and the stats bar matched the live site
   exactly, the three were empty, and the document was rewritten as
   version 3. A name ("Golden Hour 1.060"), a style and two-line notes were
   typed and survived a reload with no number moved. No console errors. At
   phone width Name and Style stack; the Volumes card's sideways overflow
   there is pre-existing and already on the roadmap ("Phone width").
