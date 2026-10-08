# Page keeps working after an error — Tier B

Status: agreed 2026-10-08 ("agree to all"); not started. Written by the S11
session; built in batch S13, item 2 (docs/ROADMAP.md, Sessions).

## Why

Nothing catches an error while the page is drawn, so one unexpected value
blanks the whole page with no message (structural review, 2026-10-06).

## Sentences — what must be true afterwards

- **PE-S1** An error while a tab is drawn (Recipe, Water, Options, or the References page) shows, in place of that tab's content, a short message: "Something went wrong drawing this page. Your saved recipe is kept as it was."
- **PE-S2** The message has a Reload button, and a line saying that Export in the header saves a copy and Reset starts a new recipe.
- **PE-S3** The header stays usable: Export, Import, Reset to defaults, Print and the unit and tab choices work as before.
- **PE-S4** The saved recipe is never cleared or changed by the error; the brewery's figures likewise.
- **PE-S5** Nothing else changes when nothing goes wrong: every tab draws as today.

## Decisions — agreed 2026-10-08 ("agree to all")

| id | Question | Decision | Rule |
|---|---|---|---|
| PE-Q1 | Where does the catch sit? | Around the tab content, below the header, so Export, Reset and Print still work | The brewer can always keep a copy and start over |
| PE-Q2 | What does it show? | "Something went wrong drawing this page. Your saved recipe is kept as it was." A Reload button, and a line that Export saves a copy and Reset starts a new recipe. The saved copy is never cleared | If the saved recipe itself causes the error, Reload would show the message every time; Export then Reset is the way out with nothing lost |
| M1 | Builder model | Opus, high effort | The Models rule's default |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default |
| K | Silent properties | **Durability:** storage is untouched by the error. **Idempotence:** a reload of the same saved recipe shows the same message, and Reset after Export recovers. **Ordering:** choosing another tab, or Reset, clears the message. No saved format changes | — |

## Scenarios — to be written first, must fail before

App (`apps/recipe/test/page-error.test.js`, new, jsdom as `accessible-names.test.js`): *an error in a tab shows the message and keeps the header* (a card made to throw: the message, Reload, the Export/Reset line, the header's buttons present); *the saved recipe is kept* (storage byte for byte the same); *Reset after the error starts a new recipe*; *nothing else changes when nothing goes wrong*.

## Notes for the builder

- React catches drawing errors only in a class component with `getDerivedStateFromError` (an error boundary); it goes in `apps/recipe/src/App.jsx` around the tab content, likely keyed by the tab so another tab or Reset clears it. Its text and button styling come from `components/shared/styles.js` (SPEC 14).
- How the scenario makes a card throw is the builder's call; record it.
- Files likely touched: `apps/recipe/src/App.jsx`; a new component under `components/`; `docs/TEST_COVERAGE.md`; SPEC rule 15 or a new line only if an invariant changes.
