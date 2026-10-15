# The References page's names say References, Tier B

Status: agreed 2026-10-14 ("agree to all", S18-Q0, RN-Q1, M); landed
2026-10-15 as "The References page's file and the app's names for it say
References, and the commit check's one exception names the new file".
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

## Builder's notes (S18, 2026-10-15)

Choices the sentences did not make, each a claim for the inspector:

- **The new names.** The file `ReferencesPage.jsx` (its component was
  already `ReferencesPage`); in `App.jsx` `referencesOpen` and its setter
  `setReferencesOpen` (the setter goes with the state's name), and
  `openReferences`; the footer's prop `onReferences`. The footer's style
  for the link, `notesStyle`, is `referencesStyle`: it is the footer's link
  to the page (RN-S1). The file is moved with `git mv`; its only changes are
  its first comment line and the sentence saying why it kept its old name,
  now untrue.
- **Comments.** `App.jsx`'s comment on the page's state called it "the
  methods and sources page (notes page, NM-S1)"; it now says the References
  page (references-page.md, RF-S1). `notes-page.test.js`'s head says why it
  keeps its name (RN-Q1). The Water tab's own Notes (`NotesScreen.jsx`)
  and the page's own text ("the Water tab's Notes") are a different page
  and are untouched.
- **The commit check (K).** The hook's one exception changes from
  `NotesPage.jsx` to `ReferencesPage.jsx`; nothing else in the hook. The
  scenario reads the hook's own pattern, comment filter and search command
  and runs them, as the hook does, on a scratch repository holding
  `apps/recipe/src` staged (`git` and `bash`, as `netlify-skip.test.js`
  uses `git`). The search also ran on the real staged change before commit
  (no hits); the commit's own pre-commit run checks it again.
- **RN-S4.** The page-error and error-outside-the-tabs digests (the
  References page among them, byte for byte) pass unchanged. The built
  bundle differs from before only in the footer's prop name (`onNotes` →
  `onReferences`, two places), read by comparing the two builds.
- **The linter.** The new test draws the app in jsdom, so it joins the list
  of jsdom tests in `eslint.config.js` (one line).
- **Historical files** (`docs/items/notes-page.md`, `references-page.md`)
  keep the old name, as the item's notes say.
- **Far end.** The browser suite passed 23/23 on the change's build; in
  Chromium the footer's "References" opened the page (its heading and its
  "Back to the recipe") and Back returned to the recipe.
- **Roadmap.** "Names that still say Notes" is removed.
