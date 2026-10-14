# The References page's names say References, Tier B

Status: agreed 2026-10-14 ("agree to all", S18-Q0, RN-Q1, M); not started.
Written by the S17 session; built in batch S18, item 3 (docs/ROADMAP.md,
Sessions).

## Why

The References page (S10b) lives in `NotesPage.jsx`, opened by `notesOpen`
and `openNotes` in `App.jsx` and the footer's `onNotes`, and the pre-commit
hook's exclusion names `NotesPage.jsx`. The names should say what the page
is (noticed building the References page, S10b, 2026-10-08; `App.jsx` is
Tier B, so a Tier C and D session could not touch it).

## Sentences: what must be true afterwards

- **RN-S1** The References page's file, and the app's names for whether it is open, for opening it and for the footer's link to it, say References, not Notes.
- **RN-S2** The commit check's one exception to its brewing-formula search names the References page's new file, and still only that file; SPEC rule 7 and the coverage table name it.
- **RN-S3** The tests that reach the page by its file follow the new name; the test file keeps its name, after the item that wrote it (RN-Q1).
- **RN-S4** Nothing the brewer sees changes: no figure, no saved document, the page and the footer as before.

## Decisions: agreed 2026-10-14

| id | Question | Decision | Rule |
|---|---|---|---|
| RN-Q1 | Rename the References page's internal names and the commit check's exception to match? | Yes, all together; the test file keeps its name | No figure or saved document changes |
| M1 | Builder model | Opus, high effort | The Models rule's default |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default |
| K | Silent properties | **The commit check:** its exception must follow the file, or the References page's equations would refuse every Tier A/B commit (SPEC rule 7); shown by running the hook's search on the renamed file | — |

## Scenarios: to be written first, must fail before

App (`apps/recipe/test/`): *the References page is drawn from its new file
and opened from the footer, as before* · *the commit check's search skips
the new file and only it, and finds a formula planted anywhere else* (as
`spec-rules.test.js` and the hook's own test do). Fails before: the new
file does not exist.

## Notes for the builder

- The Water tab's own Notes screen (`water/NotesScreen.jsx`) is a different
  page and keeps its name.
- `page-error.test.js` mocks the page by its path; `notes-page.test.js`
  imports it by path and says why it is named so (its comment changes with
  the file).
- Historical item files (`docs/items/notes-page.md`, `references-page.md`)
  keep the old name: they record what was built then.
