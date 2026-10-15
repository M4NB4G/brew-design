# A saved recipe the page cannot draw has a way out, Tier B

Status: agreed 2026-10-15 ("agree to all", S19-Q0, NW-Q1 to NW-Q4, M); landed
2026-10-15 as "The whole-page message offers Export saved recipe and Start a
new recipe beside Reload, and a new recipe keeps the brewery's figures".
Written by the S18 session; built in batch S19, item 1 (docs/ROADMAP.md,
Sessions).

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

## Builder's notes (S19, 2026-10-15)

Choices the sentences did not make, each a claim for the inspector:

- **Order and place.** The buttons read Reload, Export saved recipe, Start a
  new recipe, in one row that wraps on a phone; the line sits between the
  message and the buttons, where the tab's Export/Reset line sits. The
  tab's own card is drawn exactly as before (its Reload is not wrapped), so
  its markup and the byte-for-byte page digests are unchanged (NW-S5).
- **The line stays with no saved recipe.** NW-S1 gives the message the line;
  NW-S4 takes away only the Export button, so with nothing saved the line
  still names Export saved recipe. Rare: the whole-page error with no saved
  recipe means the brewery's document or a fault of the app's own, not the
  recipe.
- **The file's name.** "When it can be read" is read as: the stored text is
  JSON whose recipe carries a name as text. Then the file is named from it
  and the date, as Export in the header names one ("Cannot be drawn
  2026-10-15.json"); otherwise the nameless recipe's name ("Brew Design
  recipe 2026-10-15.json"). The full recipe check is not run: it would keep
  the unreadable copy aside, a write Export must not make.
- **The question.** "Start a new recipe? The saved recipe will be removed;
  your brewery's figures and My ingredients are kept." Reset's question is
  the model; this one names what stays, as NW-S3 does.
- **Drawn again = reloaded.** On yes the saved recipe is removed through
  `clearPersisted`, then the page reloads (the builder note's suggestion),
  so the load's own `loadStartingState` builds the new recipe and no
  new-recipe logic is written twice. jsdom cannot reload; the scenario sees
  the reload asked on the console jsdom reports it on, and a second draw
  stands for it, as error-outside-the-tabs.test.js's Reload does.
- **Storage read each time it is drawn.** Whether Export is offered is read
  from storage when the message is drawn, guarded as App.jsx guards it.
- **Outside the named files.** `error-outside-the-tabs.test.js`'s EO-S1
  scenarios expected Reload as the only button; they now expect the three
  (NW-S1 changes that sentence of rule 18). `eslint.config.js` lists the new
  test among the jsdom tests that read the browser's globals, as every such
  test is listed.
- **How the page is made to fail.** The recipe's figures (`computeRecipe`,
  wrapped as error-outside-the-tabs wraps it) throw for a saved recipe named
  "Cannot be drawn", so the cause is the saved recipe itself and a new
  recipe draws. NW-S5's no-error check passes before the change by design.
- **Far end.** On the built app in Chromium (2026-10-15), with a script in
  the browser making the stats bar's number formatting throw while the
  saved recipe is named "Cannot be drawn" (not committed): the message, its
  line and the three buttons; the download "Cannot be drawn
  2026-10-15.json" byte for byte the stored text, storage unchanged; the
  question asked, No changing nothing; Yes reloaded to a new recipe with no
  name and no message, the brewery's document unchanged, no page error.

Failure recorded before the change (the scenario run alone, trimmed):

```
× the whole-page message offers Export saved recipe and Start a new recipe, with their line
  AssertionError: expected 'Something went wrong drawing this pag…' to contain 'Export saved recipe keeps a copy; Sta…'
  Received: "Something went wrong drawing this page. Your saved recipe is kept as it was.Reload"
× Export saved recipe downloads the stored document byte for byte, an unreadable one too, and changes nothing
  Error: no button "Export saved recipe"
× Start a new recipe asks, then removes only the saved recipe and draws a new recipe from the brewery's figures; no changes nothing
  Error: no button "Start a new recipe"
× with no saved recipe, Export saved recipe is not offered
  AssertionError: expected [ 'Reload' ] to deeply equal [ 'Reload', 'Start a new recipe' ]
✓ an error in a tab is caught as before, and with no error nothing changes (a guard: passes before by design)
Tests  4 failed | 1 passed (5)
```
