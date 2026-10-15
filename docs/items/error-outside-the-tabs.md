# An error outside the tabs shows a message, Tier B

Status: agreed 2026-10-14 ("agree to all", S18-Q0, EO-Q1, EO-Q2, M); landed
2026-10-15 as "An error outside the tabs shows the message and Reload in
place of the whole page, and changes no saved document". Written by the S17
session; built in batch S18, item 1 (docs/ROADMAP.md, Sessions).

## Why

The catch of "Page keeps working after an error" (S13 item 2, SPEC rule 18)
sits around the tabs and the References page, as PE-Q1 placed it. An error
in the stats bar, the line under it, the header, the footer or the printed
sheet, or in the figures the app works out before it draws anything (the
recipe's, the water's, the Cost card's), still blanks the whole page with no
message (noticed building it, 2026-10-09).

## Sentences: what must be true afterwards

- **EO-S1** An error while the stats bar, the line under it, the header, the footer or the printed sheet is drawn, or while the app works out its figures before drawing (the recipe's, the water's, the Cost card's), shows in place of the whole page "Something went wrong drawing this page. Your saved recipe is kept as it was." and a Reload button. The line on Export and Reset is left out: the header is gone.
- **EO-S2** That error changes no saved document, the recipe's or the brewery's.
- **EO-S3** An error while a tab or the References page is drawn is caught as today, below the header, with the line on Export and Reset (SPEC rule 18 unchanged).
- **EO-S4** Reload draws the page again from what is saved.
- **EO-S5** With no error, nothing changes: the page, the saved documents and the printed sheet are as before.

## Decisions: agreed 2026-10-14

| id | Question | Decision | Rule |
|---|---|---|---|
| EO-Q1 | An error in the stats bar, the header, the printed sheet or the figures worked out before drawing: what does the brewer see? | A second catch around the whole page: the same message and a Reload button; the line pointing to Export and Reset left out, the header being gone | Today the page goes blank with no message |
| EO-Q2 | Does that error change any saved recipe or brewery figures? | No, as for the tabs today (SPEC rule 18) | An error drawing the page is not an edit |
| M1 | Builder model | Opus, high effort | The Models rule's default |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default |
| K | Silent properties | **Storage:** the error writes nothing; a recipe that is not drawn is not autosaved. **Idempotence on reload:** a saved recipe that itself causes the error shows the message again on every Reload, and with the header gone the page offers no Reset or Export; EO-Q1 leaves it so. The builder records it as a roadmap line (a way out from a saved recipe that cannot be drawn), not a change. **Ordering:** the inner catch (rule 18) is reached first for an error inside a tab | — |

## Scenarios: to be written first, must fail before

App (`apps/recipe/test/`, a new file, the app drawn whole in jsdom, a part
made to throw as `page-error.test.js` does): *an error in the stats bar, the
header, the footer, the printed sheet, and in each of the figures worked out
before drawing shows the message and Reload, not a blank page* · *the saved
recipe and brewery documents are byte for byte as before* · *an error in a
tab is still caught below the header, with the Export and Reset line* ·
*with no error, nothing changes*.

## Notes for the builder

- `apps/recipe/src/components/PageError.jsx` is the existing catch (a class
  component, `resetKeys`); `App.jsx` places it around the tabs and the
  References page. The outer catch most likely wraps the app where
  `main.jsx` draws it, so it also catches what `App` works out before
  drawing; `main.jsx` is not in the path table, so it is gated as Tier B.
- SPEC rule 18 gains the outer catch; `docs/TEST_COVERAGE.md` rule 18's row.
- The message's wording is rule 18's; the card's layout is the builder's.

## Builder's notes (S18, 2026-10-15)

Choices the sentences did not make, each a claim for the inspector:

- **Where the second catch sits.** Around `<App />` where `main.jsx` draws
  it, inside `StrictMode`: the same `PageError` component with a new
  `whole` switch. Only a catch outside `App` can take an error in what
  `App` works out before it draws (`computeRecipe`, `computeWater`,
  `computeCost`, run in `App`'s own body), so it cannot sit in `App.jsx`;
  `App.jsx` is unchanged. `main.jsx` is outside the path table, gated as
  Tier B (the item's notes).
- **What `whole` changes.** The line on Export and Reset is left out (EO-Q1)
  and the card sits in the page's content column (900 px, the same padding
  as the tabs' `main`), since there is no header above it; the message, the
  Reload button and its action (`window.location.reload()`) are the inner
  catch's own. With no keys the whole-page message clears only on Reload;
  `resetKeys` now reads as none when not given (`?? []`), which changes
  nothing for the inner catch, which always passes them.
- **Ordering (K).** An error in a tab or the References page reaches the
  inner catch first and stops there: the scenario shows the message once,
  with the Export/Reset line and the header's actions.
- **Storage (K).** Nothing in either catch writes. A recipe that is not
  drawn is not autosaved: the autosave is an effect of `App`, which runs
  only once `App` is drawn.
- **The scenario draws `main.jsx` itself.** Each draw resets the module
  registry and imports `main.jsx` on an empty `#root`, so what is tested is
  what the browser runs; `react-dom/client`'s `createRoot` is wrapped only
  to keep the roots it makes, so each test takes its page down. Before the
  change, an error no catch takes makes React hand the error back to the
  test; the draw keeps the page as it was left (blank) for the test to read.
- **Two scenarios pass before by design.** "An error in a tab is still
  caught below the header" (EO-S3, "as today") and "with no error, nothing
  changes" (EO-S5) guard what must not change; the eight places and the
  error after the page is drawn and the reload (EO-S1, EO-S2, EO-S4) failed
  before. EO-S5's digests (`error-outside-the-tabs.before.json`) were taken
  from `main.jsx`'s page before the change.
- **Reload.** jsdom cannot reload a page, so EO-S4 is shown as a fresh draw
  from storage as it is (the reload), as `page-error.test.js` does; the far
  end clicked Reload itself in Chromium.
- **The linter.** The new test reads the browser's globals, so it joins the
  list of jsdom tests in `eslint.config.js` (one line).
- **Roadmap (K).** "An error outside the tabs still blanks the page" is
  removed; "A saved recipe the page cannot draw leaves no way out" records
  the idempotence row: a saved recipe that itself causes the whole-page
  error shows it on every Reload, with no Export or Reset (EO-Q1 leaves it
  so).
- **Far end.** On a build of the change with the stats bar made to throw
  (not committed; `StatsBar.jsx` restored byte for byte), in Chromium: the
  message and Reload alone, storage the same, and Reload, the failure gone,
  drew the saved recipe "My IPA". The browser suite passed 23/23 on the
  change's own build.
