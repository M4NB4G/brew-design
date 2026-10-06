# Guard rails — three Tier C and D items, batch F1

Status: agreed 2026-10-06 ("agree to all", F-Q1 to F-Q7). Item 1 landed: "A GitHub check runs both suites and the build on every push and pull request"; item 2 landed: "A linter reads the apps and packages, and the GitHub check runs it"; item 3 landed: "Every number box, text box and choice has a name a screen reader reads".
Written by the S7 session after its structural review; built in batch F1,
before S8 (docs/ROADMAP.md, Sessions). Items in this order (F-Q2): tests on
GitHub, the linter, box names.

## Why

The structural review (2026-10-06) found three guard rails missing that get
dearer with every feature built without them: nothing checks a change on
GitHub, no linter reads the code, and a screen reader cannot name most of
the input boxes. S8 adds more boxes, so the names come first.

## Decisions — agreed 2026-10-06 ("agree to all")

| id | Question | Decision | Rule |
|---|---|---|---|
| F-Q1 | Who builds | A new session: Sonnet 5.5 builds, Opus advises (`/advisor opus`) | All three are Tier C or D: the Tier C and D trial (CLAUDE.md, Models) |
| F-Q2 | Order | Tests on GitHub, then the linter, then the box names | The check then guards every later change |
| F-Q3 | When the GitHub check runs | Both suites and the build on every push and pull request; pass or fail shown on each PR; it does not block merging | The owner gates merges ("merge and push"); a public repository runs it free (GitHub Actions billing docs) |
| F-Q4 | What the linter may fix | Findings in screen, tooling and test files are fixed in this batch; a finding in a Tier A or B file stays a warning, not fixed, and returns to the roadmap as its own line for an Opus session | A trial session never changes the engine or saved data (the owner, 2026-10-02) |
| F-Q5 | A box's name | The label the brewer already sees, and in a table the row's name with it ("Weight (lb), Pale 2-Row"); nothing visible on screen or on the printed sheet changes | WCAG 2.2, 1.3.1 and 4.1.2 |
| F-Q6 | How the names are proven | A test that every box has a name, and an automated accessibility scan in the far-end check; the scanning tool is a test-only dependency, never in the built site | Proof by tool, not by reading |
| F-Q7 | The batch | "F1 · Guard rails", before S8 | Names fixed before S8 adds boxes |
| M1 | Builder model | Sonnet 5.5, Opus advising; the report lists every number each change adds, confirmed by the advisor as no recipe value | CLAUDE.md, Models (Tier C and D trial) |
| M2 | Inspector model | None: Tier C and D. An item the catch-all promotes to Tier B, or one that must change a Tier A or B file, is not built in this session: it returns to the roadmap, named in the report | CLAUDE.md, Change control and Models |

## Item 1 — Tests on GitHub for every push (Tier D)

- **GR1-S1** A GitHub check runs `npm test` and `npm run build` on every push to any branch and on every pull request, and shows pass or fail on the pull request.
- **GR1-S2** It does not block merging.
- **GR1-S3** Nothing in the app, its figures, the local hooks or the Netlify deploy changes.

Proof: nothing a unit test can see (say so in the report); the check runs green on the F1 pull request, named with its run link.

## Item 2 — A linter (Tier D)

- **GR2-S1** ESLint, with its recommended rules and React's hooks rules, reads `apps/` and `packages/` through `npm run lint`, and the GitHub check runs it.
- **GR2-S2** Every finding in a screen, tooling or test file is fixed; each finding in a Tier A or B file (`packages/engine/src/**`, `apps/recipe/src/{state,selectors,display,reference-volume,persistence}.js`, `App.jsx`) is set to warn, not fixed, and becomes a roadmap line for an Opus session (F-Q4).
- **GR2-S3** No figure, saved document or printed sheet changes; both suites pass unchanged.

Proof: `npm run lint` exits clean (warnings listed in the report, each with its roadmap line); the suites unchanged.

## Item 3 — Every box has a name a screen reader reads (Tier C)

- **GR3-S1** Every number box, text box and choice on the Recipe, Water and Options tabs, the Cost card, Design to target OG and the notes page has an accessible name: its visible label, and in a table the row's name with it (F-Q5).
- **GR3-S2** No visible text, layout, figure, saved document or printed sheet changes.
- **GR3-S3** A scenario draws each tab and card and fails on any box without a name; it must fail before the change. The far-end check runs an automated accessibility scan on each tab and reports no missing-name finding (F-Q6).

## Notes for the builder

- The hooks stay as they are (lint runs in the GitHub check and by `npm run lint`, keeping commits fast); a change to the hooks is a question for the owner.
- Use Node 24 in the GitHub check, as Netlify does (`apps/recipe/netlify.toml`).
- Most boxes go through `components/shared/InputRow.jsx` and `components/NumberField.jsx`; naming them there covers most of item 3. The table boxes (Grist, Hops, Cost, the % boxes) need the row's name passed in.
- Earlier "nothing else changes" scenarios compare cards byte for byte against before-captures; a name attribute changes those bytes. Compare through a strip of the added name attributes only (as `withoutTargetOgDesign` does for S7), never by recapturing.
- The scan tool (e.g. axe-core) is a dev dependency; the built bundle must not grow by it (compare the bundle before and after).

## Builder's notes (F1, 2026-10-06)

- Item 1: `.github/workflows/ci.yml`, triggered on every push and every pull request, runs `npm ci`, `npm test` and `npm run build` on Node 24 (`actions/checkout@v4`, `actions/setup-node@v4` with the npm cache), with `contents: read` permission. No branch protection is configured, so nothing blocks a merge (GR1-S2). The workflow is on the branch `ccr-1093c45b-ibf1ig`, not one named F1 (the session's harness names the branch); `git diff e00bea3..HEAD` is the F1 batch alone, `main...` also carries S7's unmerged commits.
- Numbers introduced: none that is a recipe value (the Node version is a tooling setting).
- Item 2: ESLint 9.39.5 (`@eslint/js` 9.39.5, `eslint-plugin-react-hooks` 7.1.1, `eslint-plugin-react` 7.37.5 for JSX counted as use, `globals`), root devDependencies; ESLint 10 was refused by `eslint-plugin-react`'s peer range. The config names `rules-of-hooks` (error) and `exhaustive-deps` (warning) one by one, so the plugin's newer React Compiler rules are not on. `no-unused-vars` allows the leave-one-out copy (`ignoreRestSiblings`): 36 of the first 40 findings were that idiom in tests and persistence.
- Findings fixed (Tier C and D): the unused `colors` import in `NumberField.jsx`, the unused `InputRow` import in `YeastSection.jsx`, an unused parameter in `water-saved.test.js`. The one finding left is a warning in a Tier B file: `persistence.js`'s `no-control-regex`, a roadmap line. Only that one finding is downgraded, for that rule in that file; a new finding in a Tier A or B file (the refresh tool and `ingredients.test.js` included, which are Tier B) is an error, so the guard stays on where the numbers come from.
- Builder's choice for the owner to reverse: the `ignoreRestSiblings` option (ESLint's documented setting for the leave-one-out copy) took 36 of the 40 first findings out by configuration, 4 of them in Tier A or B files (`persistence.js` three, `selectors.js` one), which would otherwise have been warnings and roadmap lines. The lockfile gained 204 packages and changed the version of none already there.
- Both suites and the bundle are unchanged (`index-D4CBS1Oh.js`, 369253 bytes before and after). Numbers introduced: none.
- Item 3: the name is an `aria-label` made from the same strings the screen shows (so Pro's bbl/gal, lb/sacks, $/lb or $/sack and °F/°C follow): `InputRow` names its box "label unit"; a table box is named "column, row" with the row the typed name or "Malt 1", "Kettle hop 1", "Dry hop 1" (`components/shared/rowName.js`); a name search box is "Malt 1 name"; the malt type choice "Malt type, Pale 2-Row"; the other cost lines' name box "Line 1 name"; the Water tab's choices and amount boxes by their label and unit. Boxes already named by a label around them were left as they were. Nothing visible changes: the far-end screenshots equal the build before the change byte for byte (1200 px and 375 px, nine states each: 18 screenshots).
- Two test-only dependencies in `apps/recipe`: `jsdom` 29.1.1 and `axe-core` 4.14.0. The built bundle holds neither (grep of `dist`), and grew 1.0 kB (369.25 to 370.26) by the name text. The lockfile gained 37 packages for them and changed the version of none already there.
- The earlier byte-for-byte scenarios (celsius-toggle, economics, inverse-solver, pro-unit-choices) compare through `test/box-names.fixture.js`, which removes `aria-label` from inputs, choices and text areas on both sides, as the notes asked; the before-captures are not re-made.
- Noticed and put on the roadmap: the full axe scan also finds colour contrast, empty table headers and no `main` landmark (Tier C, a look-at-it with the owner).
- Numbers introduced: none that is a recipe value. The only arithmetic is `i + 1`, a row's place in its name ("Malt 1 name"), as the empty-fields line and the Cost card already name rows.
