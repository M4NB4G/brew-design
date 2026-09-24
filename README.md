# Brew Design

Monorepo for Brew Design, the recipe designer of Persyn Chemical Engineering
and Consulting, live at https://brew-design.netlify.app (deployed from
`main`). Source of truth for the math:
`Experiments_Are_Fun_Recipe_Designer_Rev_3.xlsm`.

## The app

`apps/recipe` (`@brew/recipe`) is a React app with no server. It designs one
recipe at a time — grist, volumes, hops, yeast, pitch and starter — in Home
(gal, oz) or Pro (bbl, lb, °P) units, with the stats computed by the engine
and nothing computed in the app (SPEC.md rule 7). It keeps the recipe and
the brewery's own figures in the browser, exports and imports a recipe file,
prints a brew-day sheet, and offers the owner's ingredient list
(`data/`) in searchable boxes. The water-chemistry screens are next on the
roadmap; their engine functions are already ported and tested.

## The calculation engine

`packages/engine` (`@brew/engine`) is a pure, framework-agnostic JavaScript
calculation engine — no DOM, no network, no I/O, no global state. Every function
takes inputs and returns outputs. Constants are reproduced exactly from the
reference spreadsheet; deviations are documented in `// FLAG:` comments rather
than changed.

Modules:

| Module | Responsibility |
|---|---|
| `units.js` | Unit conversions, water density (IAPWS-95) volume correction |
| `grist.js` | Grain bill → gravity, attenuation, ABV, color, mash thickness |
| `hops.js` | Tinseth utilization + whirlpool temp factor → IBU |
| `yeast.js` | Pitch-rate selection and cell-count requirement |
| `starter.js` | Analytic quadratic starter solver (replaces an Excel GoalSeek) |
| `solver.js` | Inverse grist solver (closed-form, gravity-only, OG target) |
| `economics.js` | Cost rollup |
| `water/` | Water chemistry: salt and acid additions, residual alkalinity, the salt solver, style targets (from Brew Water Chem) |

## Getting started

```bash
npm install                          # sets up the npm workspace
npm test                             # both suites (engine + recipe app)
git config core.hooksPath tools/hooks  # activates the pre-commit / commit-msg guards
```

The engine is pinned to the spreadsheet's cached values by golden-master tests.
Tolerances are intentionally tight (SG 1e-6; Plato/SRM/IBU 1e-4) and are not
loosened to mask implementation error.

## Working rules

`CLAUDE.md` holds the change-control tiers and the builder/inspector protocol;
`SPEC.md` is the specification every diff is checked against;
`docs/TEST_COVERAGE.md` says what proves each rule; `docs/ROADMAP.md` is
outstanding work, by tier and by the session that builds it; `docs/items/`
holds each item's agreed scope table.

## Layout

```
packages/
  engine/            @brew/engine — the pure calculation engine
apps/
  recipe/            @brew/recipe — the recipe designer (Vite + React)
data/                the owner's ingredient workbook
docs/                test coverage, roadmap, item scope tables
tools/               git hooks, Netlify build-skip rule
```
