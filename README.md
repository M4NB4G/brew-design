# Brew Recipe Designer

Monorepo for the Brew Recipe Designer (Persyn Chemical Engineering and Consulting).
Source of truth for the math: `Experiments_Are_Fun_Recipe_Designer_Rev_3.xlsm`.

## Phase 1: calculation engine

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

UI, persistence, and the water-chemistry port land in later phases.

## Getting started

```bash
npm install                          # sets up the npm workspace
npm test --workspace @brew/engine    # runs the Vitest golden-master suite
```

The engine is pinned to the spreadsheet's cached values by golden-master tests.
Tolerances are intentionally tight (SG 1e-6; Plato/SRM/IBU 1e-4) and are not
loosened to mask implementation error.

## Layout

```
packages/
  engine/            @brew/engine — the pure calculation engine
apps/                deployable apps (later phases)
```
