# A saved recipe the page cannot draw has a way out, Tier B

Status: agreed 2026-10-15 ("agree to all", S19-Q0, NW-Q1 to NW-Q4, M); not
started. Written by the S18 session; built in batch S19, item 1
(docs/ROADMAP.md, Sessions).

## Why

Since "An error outside the tabs shows a message" (S18 item 1), an error
outside the tabs shows the message and Reload in place of the whole page,
the header gone with it (EO-Q1). When the saved recipe itself causes that
error, every Reload shows the message again, and the page offers no Export
to keep a copy and no Reset to start a new recipe; the brewer's only way
out is to clear the site's data in the browser, which also loses the
brewery's figures and My ingredients (EO K, noticed writing its scope
table, 2026-10-14).

## Sentences: what must be true afterwards

- **NW-S1** The whole-page message offers, beside Reload, "Export saved recipe" and "Start a new recipe", with the line "Export saved recipe keeps a copy; Start a new recipe replaces it."
- **NW-S2** "Export saved recipe" downloads the saved recipe exactly as stored, byte for byte, whether or not it can be read, and changes nothing.
- **NW-S3** "Start a new recipe" asks first; on yes it removes only the saved recipe and draws the page again, which starts a new recipe from the brewery's figures that are set, as Reset to defaults does. The brewery's figures, My ingredients and the banner's "Not now" are kept. On no, nothing changes.
- **NW-S4** With no saved recipe (none stored, or storage unavailable), "Export saved recipe" is not offered.
- **NW-S5** An error in a tab is caught as today (SPEC rule 18), with its own line on Export and Reset; with no error nothing changes.

## Decisions: agreed 2026-10-15

| id | Question | Decision | Rule |
|---|---|---|---|
| NW-Q1 | When the saved recipe itself causes the whole-page error, what way out does the message offer? | Two buttons beside Reload: "Export saved recipe" downloads the saved copy exactly as stored; "Start a new recipe" asks, then removes only the saved recipe and starts a new one | Rule 18 promises the saved recipe is kept, so a copy can be kept before anything is removed; Reset today removes only the recipe |
| NW-Q2 | Does the whole-page message get a line on the two buttons? | Yes: "Export saved recipe keeps a copy; Start a new recipe replaces it." | The tab message carries such a line today |
| NW-Q3 | Does the new recipe start from the brewery's figures, as Reset does? | Yes; the brewery's figures and My ingredients are kept | Rule 17: a new recipe is the built-in recipe with each brewery figure that is set |
| NW-Q4 | If the cause is the brewery's saved figures, not the recipe, a new recipe does not clear the error. Handle it now? | No; recorded as a silent property, a roadmap line if it is ever seen | No error has come from the brewery's document |
| M1 | Builder model | Opus, high effort | The Models rule's default |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default |
| K | Silent properties | **Storage unavailable:** nothing saved, so no Export; "Start a new recipe" removes nothing and draws the page again. **An unreadable saved copy:** exported as found, byte for byte (it is what storage holds, not a checked recipe file). **Ordering:** the saved recipe is removed before the page is drawn again, so the new draw cannot read it; a removal that fails changes nothing and the page is drawn again as Reload would. **Idempotence:** a second "Start a new recipe" with nothing saved removes nothing. **Multi-tab:** another tab's autosave may write a recipe back after the removal; the next draw then reads that one (accepted, as for Reset today). **The brewery's document as the cause** (NW-Q4): not cleared by a new recipe; left so | — |

## Scenarios: to be written first, must fail before

App (`apps/recipe/test/`, a new file, the page drawn as `main.jsx` draws it,
as `error-outside-the-tabs.test.js` does, a part made to throw): *the
whole-page message offers Export saved recipe and Start a new recipe, with
their line* · *Export saved recipe downloads the stored document byte for
byte, an unreadable one too, and changes nothing* · *Start a new recipe
asks, then removes only the saved recipe and draws a new recipe from the
brewery's figures; the brewery, My ingredients and the banner's choice
kept; no changes nothing* · *with no saved recipe, Export saved recipe is
not offered* · *an error in a tab is caught as before, and with no error
nothing changes*. Fails before: the buttons do not exist.

## Notes for the builder

- `apps/recipe/src/components/PageError.jsx` (`whole`) is where the buttons
  go; `main.jsx` draws it around `App`, so it cannot use `App`'s state: it
  reads and removes through `persistence.js` (`STORAGE_KEY`,
  `clearPersisted`, `recipeFileName`) with the browser's storage, guarded as
  `App.jsx`'s `browserStorage` is. A file name from the saved recipe's name
  when it can be read, else the name a nameless recipe gets.
- "Start a new recipe" can reload the page after removing the saved copy:
  the load then builds the new recipe from the brewery's figures
  (`loadStartingState`), so no new-recipe logic is written twice.
- SPEC rule 18 gains the two buttons; `docs/TEST_COVERAGE.md` rule 18's row
  and a scenario row. The roadmap line "A saved recipe the page cannot draw
  leaves no way out" is removed.
