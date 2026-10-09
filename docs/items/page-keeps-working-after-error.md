# Page keeps working after an error — Tier B

Status: agreed 2026-10-08 ("agree to all"); landed 2026-10-09 as "An error
while a tab or the References page is drawn shows a message in its place,
and the header and the saved recipe are untouched". Written by the S11
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

## Builder's notes (S13, 2026-10-09)

Claims for the inspector to verify; none is a decision the sentences made.

- The catch is a new class component, `components/PageError.jsx` (an error boundary: `getDerivedStateFromError`), drawn in `App.jsx` twice: around the tab content inside `<main>` (the Recipe, Water and Options tabs), and around the References page. Below the header (PE-Q1). The tab row, the stats bar with the line under it, the My brewery banner, the footer and the printed sheet stay outside it: the tab row so the tab choices work (PE-S3), the stats bar and banner as they are not a tab's content. An error in any of those, or in the figures App works out before drawing, still blanks the page; that is a new roadmap line (Tier B, "An error outside the tabs still blanks the page"), in scope (procedure step 3).
- The message clears, and the content is drawn again, when any of the tab, the recipe, Home/Pro, the four unit choices or the brewery's figures changes after the error (K, ordering: another tab, Reset). The recipe covers Reset and an import; the unit choices and the brewery are my additions, so a unit choice that caused the error can be undone. It clears only once the message is already shown, so the update that first drew it does not clear it at once. With the part still failing, the next draw shows the message again.
- On the References page there is no tab row, as before; with the message there, Reload returns to the app (the page is never saved open).
- Reload is the browser's own reload (`window.location.reload()`). jsdom cannot reload, so the scenario checks the button is there and the far end checks it reloads.
- The message's text, the line and the button take their colours, radii and shadow from `styles.js` (SPEC 14); the line reads "Export in the header saves a copy, and Reset to defaults starts a new recipe." (PE-S2, naming the header's button as it reads). The message is a `role="alert"`, so a screen reader reads it.
- How the scenario makes a card throw: `vi.mock` replaces, for this test file only, four drawn parts (the Cost card, the Water tab, the Options tab, the References page) with a wrapper that draws the real part unless the test names it, when it throws while drawn; the Cost card also throws for a recipe named "Boom", standing for a saved recipe that itself fails (PE-Q2's rule).
- "Nothing else changes" compares SHA-256 digests of the whole drawn page (each tab in Home and Pro, the References page) with `page-error.before.json`, captured on the unchanged code; React's generated ids (`_r_0_`, …) depend on how many parts the test file has drawn before, so they are renumbered by first appearance before hashing.
- `eslint.config.js` lists the two new jsdom test files beside the others that draw the whole app, so the linter reads the browser's globals there (Tier D, needed for `npm run lint`).
- Three of the four scenarios failed before (the error uncaught: "CostCard could not be drawn"); "nothing else changes when nothing goes wrong" passed before, as PE-S5 says nothing changes there (guard).
- Numbers introduced: none. Layout values only (rem, px, weights).
- SPEC: a new rule 18 states the invariant.
- Far end 2026-10-09 on the built app served with netlify.toml's headers, in Chromium: one label in each place's bundled code ("+ Add line", "Load Example", "My brewery", "← Back to the recipe") swapped in transit for an expression that throws when the page sets a flag. At each of the four places: the message, the line and Reload in place of the content, every header button visible; storage unchanged by the error; Export downloads the saved document; Print opens; °C is saved; Reload loads the page again with the recipe as saved. A saved recipe that fails: the message on load and after Reload, another tab clears it, back on Recipe it shows again, Reset draws a new recipe. No uncaught page error.
