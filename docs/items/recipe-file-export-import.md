# Recipe file — export and import — Tier B

Status: agreed 2026-09-22 ("A is good. Agree to all."); model rows agreed
2026-09-23 (Opus builds, Opus inspects). Landed 2026-09-23 on branch
`recipe-file-export-import` as "A recipe exports to a file named from its
name and today's date, and imports back after a confirm; a file that is not
a recipe, is damaged, or is newer is refused and the recipe on screen is
untouched". Written by the spec session; built by a new session from
CLAUDE.md's kickoff prompt.
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
| M1 | Builder model | Opus, high effort | The Models rule's default, every tier (the owner, 2026-09-23) |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default (the owner, 2026-09-23). No recipe number is introduced — the item moves an existing document in and out — so no hand-calculated pin is owed |
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

Run alone against the unchanged code, 2026-09-23
(`npx vitest run test/recipe-file.test.js` in `apps/recipe`): 7 failed, 0
passed. The unchanged code has no export, file-name or import behaviour, so
each scenario fails at its first use of one:

1. *export produces the same document …* — `const file = exportRecipeDocument(state)` → TypeError: exportRecipeDocument is not a function
2. *the file name is the recipe name plus today's date …* — `expect(recipeFileName('Hazy IPA', sept22))` → TypeError: recipeFileName is not a function
3. *importing a valid file replaces …* — `const file = exportRecipeDocument(inFile())` → TypeError: exportRecipeDocument is not a function
4. *importing a file that is not a Brew Design recipe …* — `importRecipeFile(text, defaults(), confirm)` → TypeError: importRecipeFile is not a function
5. *importing a damaged file …* — `const good = exportRecipeDocument(inFile())` → TypeError: exportRecipeDocument is not a function
6. *importing a file with a newer version …* — `JSON.parse(exportRecipeDocument(inFile()))` → TypeError: exportRecipeDocument is not a function
7. *exporting changes no recipe value …* — `exportRecipeDocument(state)` → TypeError: exportRecipeDocument is not a function

## Builder's notes — choices the sentences did not make (filled in by the builder)

1. **One document, one reader.** The storage reader was split into a shared
   reader of document text and the storage wrapper around it; the autosave
   and the export both write through one function, so the file and the
   stored copy cannot drift (S1, E1). Storage behaviour is unchanged:
   every earlier persistence, options and identity scenario passes as
   before, and a newer-version document in storage still yields the
   defaults silently.
2. **Old files import.** A version-1 or version-2 file is a Brew Design
   recipe and imports exactly as browser storage reads it (60 °F
   temperatures for version 1; empty name, style and notes for both). Only
   a version above 3 is "newer" (S6); version 0, a missing, fractional or
   text version is "not a recipe or damaged" (S5).
3. **One message for foreign and damaged.** A truncated recipe file and a
   random text file are indistinguishable once the text will not parse, so
   S5's two cases share one message: "Not imported: this file is not a Brew
   Design recipe, or it is damaged. The recipe on screen is unchanged." The
   newer-version message names the file's version and the highest this app
   reads (S6). A newer file is reported as newer even when its recipe would
   not read, since its shape is not this version's to judge.
4. **Checked before asking.** The file is read and checked before the
   confirm; a refused file is never offered for replacement. The confirm
   names the file: "Replace the recipe and settings on screen with the
   recipe in "<file>"? The saved copy will be replaced." — worded to match
   Reset's.
5. **File name.** The characters Windows rejects in a file name
   (`< > : " / \ | ? *`) and control characters become spaces; runs of
   spaces collapse; the ends are trimmed. Everything else is kept as typed
   (apostrophes, dashes, dots, non-ASCII). A name with nothing left after
   cleaning uses the fallback. The date is the brewer's local date. No
   length cap: the browser shortens an over-long name itself.
6. **The file.** Saved as `.json`, type `application/json`: the stored
   document as-is, one line of readable text. A cleared field is written
   as `null` and reads back as cleared, as in storage.
7. **The picker is not filtered** to `.json`, so any file can be chosen and
   a non-recipe is refused with the message (the far end's own check).
8. **"Cleared on the next action"** (E7) is taken as: the next Export,
   Import or Reset, or any edit to the recipe or the display settings.
9. **Header.** Export and Import sit left of Reset in the same outlined
   pill style (the one style is now shared by all three); the row wraps at
   phone width instead of running off the side; the refusal shows as a
   right-aligned line under the row in the existing warning colour.
10. **SPEC.md unchanged.** Rule 13's storage behaviour is unchanged and E10
    names no change to `SPEC.md`; the file's rule is recorded here and in
    the scenarios, and a Tier D roadmap line proposes adding it to
    `SPEC.md`.
11. **Far end, 2026-09-23** (production build, `vite preview`). The named
    working copy "Golden Hour 1.060" (pre-boil 8 gal) exported as
    "Golden Hour 1.060 2026-09-23.json", `application/json`, readable text
    byte-for-byte the saved copy; the saved copy and every stat unchanged by
    the export. The download was captured in the page rather than written
    to disk. Renamed "Edited", pre-boil 12 gal, Pro; importing the file and
    declining left all of that and the saved copy as they were; importing
    and accepting brought back the name, Home, pre-boil 8 and every stat
    exactly as exported, and the saved copy became byte-for-byte the file.
    A reload kept the imported recipe. A text file ("shopping.txt") was
    refused with the message under the controls, nothing asked, recipe and
    saved copy untouched; a version-4 file was refused naming both versions;
    the message cleared on the next edit; the Import button opens the file
    picker. No console errors from the app. At phone width the header row
    wraps; the Volumes card's sideways overflow there is pre-existing and on
    the roadmap ("Phone width").
