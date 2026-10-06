# Guard rails — three Tier C and D items, batch F1

Status: agreed 2026-10-06 ("agree to all", F-Q1 to F-Q7). Item 1 landed: "A GitHub check runs both suites and the build on every push and pull request"; items 2 and 3 not started.
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
