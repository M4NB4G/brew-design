# Footer — Persyn attribution below the page, as in Brew Water Chem — Tier B

Status: agreed 2026-09-23; landed 2026-09-23 as "Below the page, on both
tabs, a footer shows the see-through Persyn logo beside the company name, as
in Brew Water Chem; the printed sheet uses the same logo".

## Why

The roadmap's Footer line asked for parity with Brew Water Chem. The water
app ends every tab with a footer: the full Persyn logo at the left (up to
120 px wide), and beside it two lines of small grey text — the company name,
then "See Notes for important information, methodology, and assumptions."
This app has no footer.

The roadmap line also warned that a white-background logo would show as a
rectangle against the page's tinted gradient. The owner approved a
see-through copy of the full logo on 2026-09-23 (below, Artwork); it is
committed with this file, so the builder starts from exactly the file the
owner saw.

## Sentences — what must be true afterwards

- **F1** Below the page content, on both the Recipe and Options tabs, a footer shows the full Persyn logo at the left and "Persyn Chemical Engineering and Consulting" beside it, laid out as in the water app.
- **F2** The logo sits on the page's tinted background with no white box or halo around it.
- **F3** Screen readers skip the logo, because the text beside it already names the company.
- **F4** The footer appears on screen only. The printed sheet keeps its own footer and is otherwise unchanged.
- **F5** The printed sheet uses the same see-through logo. The white-background copy is removed and nothing refers to it.
- **F6** Nothing else changes: no recipe number, header, tab row or section, apart from the spacing change in D4.

## Decisions — agreed

| id | Question | Decision | Rule |
|---|---|---|---|
| D1 | The water app's second line points to its Notes tab for methodology; what goes there here? | Leave it out. This app has no methodology page, and its "Notes" is the recipe's own notes box, so the line would point the brewer to the wrong place | Don't copy a line whose target doesn't exist; a methodology page would be its own item |
| D2 | Text colour | The water app's footer grey (`#9faec0`), a shade lighter than the header's company line, added as a new token in the shared colour list | Visual parity with the water app; SPEC rule 14 (all colours in `styles.js`) |
| D3 | Logo size | Up to 120 px wide, as in the water app | Parity |
| D4 | Space above the footer | Reduce the empty space below the last section to the water app's, so the footer sits at the same distance below the content | Parity; the extra space was sized for a page with no footer |
| D5 | The printed sheet's logo | Switch to the see-through file and delete the white-background JPG; it prints identically on white paper | The print sheet's own artwork rule (`recipe-print-sheet.md`, P14): use the owner's see-through lockup once it exists. One copy of the logo, so the two cannot drift |
| D6 | The header's circle logo | Keep the current file; the header is pure white, so a see-through copy would look the same | Nothing to gain; smallest change |
| D7 | Where the see-through logo comes from | Committed with this file as `apps/recipe/src/assets/persyn-logo.png`; how it was made is recorded below. The builder does not remake it | The build uses the artwork the owner approved |
| D8 | Tier, models | **Tier B.** Opus builds at high effort; a fresh Opus inspector at default effort | `App.jsx` is on the Tier B path list (change-control table); the footer cannot be placed on the page, nor D4 made, without it. (Proposed as Tier C first; corrected with the owner before this file was committed) |
| D9 | The test | A scenario written first that must fail before the change: the footer carries the company name; screen readers skip its logo; the white-background logo file is gone and nothing refers to it. Plus the far end at desktop and phone width. It uses only what the project already has installed | Tier B procedure, step 2 |
| D10 | Silent properties | None apply: nothing is persisted, computed or measured differently; no storage, ordering, migration or multi-tab effect. The printed sheet's content is unchanged; only which copy of the same logo it prints changes | Named so they are checked, not discovered |

No number is introduced. Every value this item adds is a layout value or a
colour, both excluded from the catch-all (CLAUDE.md, change control).

## Files

| File | Tier | Change |
|---|---|---|
| `apps/recipe/src/components/Footer.jsx` (new) | C | The footer (F1–F3, D1–D3) |
| `apps/recipe/src/App.jsx` | B | Renders the footer after `<main>`; D4 |
| `apps/recipe/src/components/shared/styles.js` | C | The new text-colour token (D2) |
| `apps/recipe/src/components/RecipeSheet.jsx` | C | Imports `persyn-logo.png` instead of `persyn-logo.jpg` (D5); nothing else in it changes |
| `apps/recipe/src/assets/persyn-logo.jpg` | C | Deleted (D5) |
| `apps/recipe/test/footer.test.js` (new) | D | The scenarios |
| `docs/TEST_COVERAGE.md`, `docs/ROADMAP.md` (the Footer row removed), this file | D | Docs |

`apps/recipe/src/assets/persyn-logo.png` is already on `main` (committed with
this file); the build does not add or change it.

## Scenarios

In `apps/recipe/test/footer.test.js`:

1. **the footer names Persyn Chemical Engineering and Consulting beside the logo** (F1, D1)
2. **screen readers skip the footer logo** (F3): the logo has an empty text alternative and is hidden from assistive technology
3. **the white-background logo file is gone and nothing refers to it** (F5): `persyn-logo.jpg` does not exist, and no file under `apps/recipe/src` names it

Before the change, 1 and 2 fail because the footer does not exist, and 3
fails because the JPG is still there and the sheet imports it. Record those
failures.

## Far end — look at it

`npm test`; `npm run build`; then the running app (the `recipe-preview`
launch configuration serves the built app) at desktop and phone width:

- the footer is below the last section on both tabs, logo left, company name beside it;
- no white box or halo around the logo on the tinted page;
- the gap above the footer matches the water app's;
- nothing sideways-scrolls because of the footer at phone width;
- the print preview (Print recipe) shows no app footer, and the sheet's logo looks as before.

## Notes for the builder

- **Rendering in the suite.** The suite runs in Node with no browser DOM
  (`apps/recipe/vite.config.js`, `environment: 'node'`), and no testing
  library is installed. `react-dom` is a dependency, so
  `react-dom/server`'s `renderToStaticMarkup` renders a component to a string
  with no new install. The test file is `.js`: use `createElement`, not JSX.
  Vite resolves the image import to a path string under Vitest.
- **Layout, from the water app** (`brew-water-chem/src/App.jsx`, the
  `<footer>` near the end): the footer is `maxWidth 900px`, centred, padding
  `1.5rem 1.25rem`; inside, a row with `alignItems: 'flex-start'` and gap
  `1.25rem`; the logo `maxWidth 120px, width 100%, objectFit contain,
  flexShrink 0`; the text `fontSize 0.72rem`, `lineHeight 1.6`, margin 0, in
  the D2 grey. Copy these values; do not reference the other repository at
  build or run time. If the single line of text sitting at the top of the logo
  looks wrong, that is a question for the owner, not a change.
- **D4 in numbers.** This app's `<main>` has padding `1rem 1.25rem 4rem`; the
  water app's is `1rem 1.25rem`. Drop the `4rem` bottom. The outer wrapper's
  `paddingBottom: '4rem'` is the same in both apps and stays.
- **F3.** The water app's footer logo carries alt text; this one is
  decorative (`alt=""`, `aria-hidden="true"`), as the header mark is.
- **F4 needs no new print rule.** The footer lives inside `#root`, which
  `index.css` hides in print. Confirm it in the print preview; do not add CSS.
- **D5.** Only the import line in `RecipeSheet.jsx` changes. The sheet's logo
  keeps its alt text and its 140 px width.
- **The header's medallion** (`persyn-header-mark.png`, opaque white
  background) is out of scope (D6).

## Artwork — how the see-through logo was made (D7)

Source: `apps/recipe/src/assets/persyn-logo.jpg` (850×447, the full lockup
copied from the water app for the print sheet). Both it and the medallion
were measured first: every pixel is pure grey (red = green = blue), so no
colour is lost.

Each pixel becomes black with an opacity taken from its brightness L (0–255):
fully clear at L ≥ 250 (white, and the faint speckle JPG compression leaves),
fully solid at L ≤ 5, linear between —
opacity = clamp((250 − L) × 255 / 245, 0, 255). No line was moved, cropped or
redrawn. The owner saw it before and after on the page tint and on amber and
approved it on 2026-09-23. Output: `persyn-logo.png`, 850×447, 61,852 bytes.

At 120 px wide on screen the file is about seven times screen resolution; on
the printed sheet at 140 px, about six times. No larger original is needed.

## Recorded failure (filled in by the builder)

`npx vitest run test/footer.test.js` in `apps/recipe`, on the unchanged code
(branch `persyn-footer` at `99d9d1c`), 3 failed of 3:

```
× the footer names Persyn Chemical Engineering and Consulting beside the logo
  → Cannot find module '../src/components/Footer.jsx' imported from '…/apps/recipe/test/footer.test.js'
× screen readers skip the footer logo
  → Cannot find module '../src/components/Footer.jsx' imported from '…/apps/recipe/test/footer.test.js'
× the white-background logo file is gone and nothing refers to it
  → expected true to be false // Object.is equality            (persyn-logo.jpg exists)
  → expected [ Array(1) ] to deeply equal []
    + [ "…\\apps\\recipe\\src\\components\\RecipeSheet.jsx" ]  (the sheet names it)
```

The file-exists check was made `expect.soft` after the first run, so that a
single run records both of scenario 3's failures; the run above is the second
one, still on unchanged code.

## Builder's notes — choices the sentences did not make (filled in by the builder)

- **Where the footer sits:** a new `Footer.jsx` rendered in `App.jsx` straight
  after `<main>`, inside the outer wrapper and so inside `#root` — one footer
  for both tabs, hidden in print by the existing `#root { display: none }`
  rule. No CSS added (F4).
- **Layout values:** copied from `brew-water-chem/src/App.jsx`'s `<footer>`
  and checked against it line by line — footer `maxWidth 900px`, centred,
  padding `1.5rem 1.25rem`; row `flex`, `alignItems flex-start`, gap
  `1.25rem`; logo `maxWidth 120px, width 100%, objectFit contain,
  flexShrink 0`; text `0.72rem`, line height 1.6, margin 0. The water app's
  `<main>` padding is `1rem 1.25rem`; this app's now is too (D4).
- **Text element:** a `<p>` holding the company name only, as the water
  app's first line (D1 drops its second).
- **Colour token:** `colors.textFooter` = `#9faec0`, in the Text group of
  `styles.js`. The same value already exists as `printColors.gray`; kept as a
  separate screen token rather than reaching into the print palette, per D2
  ("added as a new token").
- **Decorative logo:** `alt=""` and `aria-hidden="true"`, as the header mark
  (F3).
- **Test rendering:** `react-dom/server`'s `renderToStaticMarkup`. React 19's
  server renderer puts an image-preload `<link>` ahead of the markup; the test
  takes the `<footer>…</footer>` element itself before asserting. Scenario 1
  checks the footer's only text is the company name and that it holds one
  image; scenario 3 scans every file under `apps/recipe/src` (as bytes, so
  images are included) for the JPG's name.
- **Far end, 2026-09-23** (built bundle `index-CQcNJ7jR.js`, served by
  `vite preview` on port 4174 because another session held 4173): the footer
  is below the last section on Recipe and on Options; logo 120 px wide
  (850×447 natural), text `rgb(159,174,192)`; the logo's corner pixel is fully
  clear and 86 % of its pixels are fully clear, and no box shows on the tint;
  the gap from the last card to the footer is 32 px (the card's own margin
  plus `<main>`'s 1rem) and the logo then sits 1.5rem lower, as in the water
  app; at 375 px the page is no wider than the window and the company name
  wraps to two lines beside the logo. Headless Chrome print to PDF (Letter):
  one page, the sheet alone, no app footer, the sheet's logo from the new
  PNG, its disclaimer footer unchanged.
- **The JPG** is deleted with `git rm`; `grep -r persyn-logo.jpg` now finds it
  only in `docs/items/` (this file, `header-persyn-mark.md`,
  `recipe-print-sheet.md`) — history, left as written.
