# Recipe file — export and import — Tier B

Status: agreed 2026-09-22 ("A is good. Agree to all."), not started. Written by
the spec session; to be built by a new session from CLAUDE.md's kickoff prompt.
Depends on `docs/items/recipe-identity.md` landing first — the file name comes
from the recipe name.

## Why

The owner keeps his recipe files in OneDrive and wants copies of a Brew Design
recipe there: one file per recipe, saved and reopened like any other document.
Today the app holds exactly one working copy, in the browser's storage, and
there is no way to get a second recipe out of it or a saved one back in.

The app already writes the whole recipe plus the display settings as one
versioned document. Export hands that same document to the browser as a file;
import reads it back. One format, one reader, already proven by the saved-copy
tests.

## Sentences — what must be true afterwards

- **S1** An Export control writes the current recipe and display settings to a file the browser downloads. Its contents are the same document the app saves to browser storage, at the same schema version.
- **S2** The file is named from the recipe name and today's date. A recipe with no name uses a fixed fallback name instead.
- **S3** An Import control opens the system file picker. Choosing a file asks for confirmation before replacing what is on screen.
- **S4** On confirmation, the imported recipe and display settings replace what is on screen and become the working copy in browser storage. Declining leaves everything untouched.
- **S5** A file that is not a Brew Design recipe, or is damaged, is refused with a message saying so on screen. The current recipe is untouched — never replaced, never reset to defaults.
- **S6** A file carrying a schema version newer than the app understands is refused with a message naming that reason. The current recipe is untouched.
- **S7** Exporting does not change the recipe, the working copy, or any derived number.

## Decisions — agreed

| id | Question | Decision | Rule |
|---|---|---|---|
| M1 | Builder model | Opus, high effort | Tier B; the Models rule recommends the strongest available model for A and B |
| M2 | Inspector model | Sonnet, default effort | Never the builder's model; the item introduces no recipe number — it moves an existing document in and out |
| E1 | What is in the file | Exactly the document the app already saves: the whole recipe plus the Home/Pro mode and the Pro gravity unit, carrying the schema version | One format and one reader; a second format would be a second thing to keep true (SPEC rule 13) |
| E2 | File name | The recipe name, cleaned of characters a file system rejects, plus today's date — "Hazy IPA 2026-09-22.json". No name → "Brew Design recipe 2026-09-22.json" | A folder of these has to be readable at a glance |
| E3 | Where the controls live | Beside "Reset to defaults" in the header: Export and Import | That row is already the recipe-level actions row |
| E4 | What import does to what is on screen | Asks first, then replaces, and the imported recipe becomes the working copy | Same shape as Reset, which already asks before discarding |
| E5 | A bad or foreign file | Refused with an on-screen message; the current recipe untouched | Deliberately different from browser storage, which falls back to defaults silently. For a file the owner picked, silently wiping his work would be wrong |
| E6 | A newer-version file | Refused, naming that reason rather than guessing at fields that do not exist yet | Guessing is how numbers go wrong quietly |
| E7 | How a refusal is shown | An inline message near the controls, cleared on the next action. The confirm before replacing stays a browser confirm, matching Reset | A refusal is information, not a decision; a modal for it would be noise |
| E8 | Display settings on import | Applied from the file along with the recipe — the file is a complete snapshot | Half-applying a document invents a state the file never described |
| E9 | Silent properties | The file is a snapshot, not a link: editing after import does not change the file on disk, and re-exporting writes a new file. Import sets state and the existing autosave then writes it — no second write path and no ordering question. Storage being unavailable does not block export or import; only the working copy is lost, as today. No multi-tab sync: a second tab still overwrites on its next change, unchanged from today | Named so they are checked, not discovered |
| E10 | Files and tier | Tier B. `apps/recipe/src/persistence.js` (the document reader/writer the file shares), `apps/recipe/src/App.jsx`, `apps/recipe/src/components/Header.jsx`, `apps/recipe/test/persistence.test.js` or a new `apps/recipe/test/recipe-file.test.js`, `docs/TEST_COVERAGE.md`, `docs/ROADMAP.md` (this item's row removed), this file | Smallest change; persistence and App are Tier B paths |

## Scenarios — written first, must fail before

1. *export produces the same document the app saves, at the current version* — S1
2. *the file name is the recipe name plus today's date; an unnamed recipe uses the fallback* — S2
3. *importing a valid file replaces the recipe and the display settings, and becomes the working copy* — S4
4. *importing a file that is not a Brew Design recipe is refused and leaves the current recipe untouched* — S5
5. *importing a damaged file is refused and leaves the current recipe untouched* — S5
6. *importing a file with a newer version is refused, naming that reason* — S6
7. *exporting changes no recipe value and no derived number* — S7

## Far end — Tier B

`npm test` at the root; `npm run build`; then the running app in a browser:
export a named recipe, confirm the downloaded file's name and that its contents
open as readable text; edit the recipe, import the file back, confirm the
recipe returns and every stat matches; reload and confirm the imported recipe
is the working copy; import a text file that is not a recipe and confirm the
refusal message with the recipe untouched.

## Recorded failure (filled in by the builder)

## Builder's notes — choices the sentences did not make (filled in by the builder)
