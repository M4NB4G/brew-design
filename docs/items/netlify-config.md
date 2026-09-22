# Netlify config — Tier D

Status: agreed 2026-09-21 ("agree to all"; D1's facts read off the Netlify
dashboard in the owner's browser the same day). Phase 1 (the build recipe
and the docs it touches) built on branch `netlify-config` and pushed,
awaiting the owner's "merge and push". D3's deploy-log proof (phase 2)
follows that push and is not yet recorded.

## Why

The site builds from settings typed into Netlify's dashboard; nothing in
the repository says how. The dashboard's build command runs the app build
only, so a push to `main` whose pinned numbers fail still goes live —
`docs/TEST_COVERAGE.md` records this as the "No CI (rule 12)" gap. A
`netlify.toml` puts the build recipe in the repository, runs both suites
before the build, and pins the Node version. The roadmap line's "SPA
redirect" is dropped: the app has no URL routes (tabs are on-screen state).

## Facts — the dashboard on 2026-09-21 (D1)

Read from Project configuration → Developer settings → Continuous
deployment, brew-design, by the spec session in the owner's Chrome:

| Setting | Value |
|---|---|
| Runtime | Not set |
| Base directory | `/` |
| Package directory | `apps/recipe` |
| Build command | `npm --workspace @brew/recipe run build` |
| Publish directory | `apps/recipe/dist` |
| Functions directory | `netlify/functions` (default; unused) |
| Deploy log visibility | Logs are public |
| Node.js (Dependency management) | 24.x |
| Build image | Ubuntu Noble 24.04 (default) |
| Production branch | `main`; branch deploys: production branch only; Deploy Previews: any pull request against `main` |
| Repository | github.com/M4NB4G/brew-design |

Netlify docs (Build → Configure builds → Monorepos, read the same day):
the base directory is where dependencies install and the build command
runs; the publish directory is relative to the base directory; Netlify
searches for `netlify.toml` in the package directory, then the base
directory, then the root; the recommended monorepo setup keeps the file in
the package directory; a value in the file overrides the same UI setting;
the package directory itself can only be set in the UI.

## Sentences — what must be true afterwards

- **S1** The build recipe lives in the repository as `apps/recipe/netlify.toml` — the package directory, where Netlify looks first — with `[build] command = "npm test && npm run build"` and `publish = "apps/recipe/dist"` (paths relative to the base directory, the repository root, where the command runs).
- **S2** A push to `main` whose tests fail does not go live: the build stops at the failing suite, Netlify keeps the last good deploy and reports a failed build. Deploy Previews of pull requests against `main` are guarded the same way.
- **S3** `[build.environment] NODE_VERSION = "24"` — the major version the suites are proven on locally (v24.14.0) and the one the dashboard already uses, so the pin changes nothing about today's build environment.
- **S4** The live site is unchanged by this item: the first deploy after the merge serves the same app — every number on screen as before — and its bundle is expected to carry the same content hash as the local build.
- **S5** No redirect rules.
- **S6** In the same change: `docs/TEST_COVERAGE.md` rule 12's proof reads "hook runs it on A/B commits; Netlify runs both suites before every build (`apps/recipe/netlify.toml`)" with status proven, and the "No CI (rule 12)" gap row is removed; the roadmap row is removed; `CLAUDE.md`'s Deploy paragraph gains one sentence: the build runs `npm test` first, so a failing suite does not deploy.

## Decisions — agreed

| id | Question | Decision | Rule |
|---|---|---|---|
| D1 | Facts from the dashboard | Read; the table above | The file must sit where Netlify reads it, and its values must line up with what builds today |
| D2 | Node version | `NODE_VERSION = "24"` | Pin what is proven (local v24.14.0); the dashboard is already 24.x. If Netlify could not provide it the build would fail visibly and the site stay as it was |
| D3 | How the interlock is proven | Not by pushing a failing change. After the owner's "merge and push", the deploy log — public — shows the two suites' pass lines (engine 179, app 25, or the counts of the day) before the Vite build, the deploy succeeds, and the live site serves the same numbers. The builder gets the deploy's link from the owner (pasted, or read in his Chrome as on 2026-09-21) | The far end of a deploy setting is the deploy itself |
| D4 | Builder; inspector | Any model — Sonnet is enough for Tier D; no inspector. The gate is "suites pass"; nothing here is a recipe number (a version pin is not one) | Change-control table |
| D5 | Where the file sits | `apps/recipe/netlify.toml`, not the root | Netlify's recommended monorepo setup and its search order (package directory first); the dashboard already names `apps/recipe` as the package directory; a root file would apply to every site the repository might one day hold |
| D6 | Files | `apps/recipe/netlify.toml` (new), `docs/TEST_COVERAGE.md`, `docs/ROADMAP.md`, `CLAUDE.md` (Deploy paragraph, one sentence), this file (status, far end) | Smallest change |

## The file (builder's reference)

```toml
# Netlify build recipe for the recipe app (Brew Design). The base directory is
# the repository root, so the command runs there: both test suites first, then
# the app build; a failing suite fails the build and nothing deploys.
[build]
  command = "npm test && npm run build"
  publish = "apps/recipe/dist"

[build.environment]
  NODE_VERSION = "24"
```

## Proof — Tier D, "build on Netlify"

No automated scenario: the file is read by Netlify, not by the suites.
Before the change, `npm test` and `npm run build` pass at the root (the
Tier D gate); the hooks do not run the suite for this path, so the builder
runs it by hand. After the owner's "merge and push": the deploy log shows
`npm test` running both suites and passing before `vite build`; the deploy
succeeds; the live bundle name matches the local build's (or, if another
item landed first, the local build of that `main`); the app shows the same
numbers as before. The builder records the deploy's link and the two pass
lines here and closes the "Re-tests owed" entry in `docs/TEST_COVERAGE.md`.

## Recorded proof (filled in by the builder)

Phase 1, before the merge, on `main` at 1ce3ac2: `npm test` — engine
179/179, app 34/34 (both unchanged from the pre-branch baseline); `npm run
build` green, local bundle `index-D6fkUgun.js`. This is the Tier D gate
(D4); no far end, no inspector. D3's deploy-log proof is recorded here
after the owner's "merge and push".

## Builder's notes — choices the sentences did not make (filled in by the builder)

- **The file is byte-for-byte the reference block** in this item (S1, S3,
  D5): no deviation.
- **Root `npm test` runs both workspaces and `npm run build` runs only the
  recipe app's build** (root `package.json`), confirming the base-directory
  command in S1 does what its sentence says before it is ever handed to
  Netlify.
- **No inspector** (D4): Tier D, nothing here is a recipe number.
- **Nothing for the roadmap.** No drive-bys noticed; `.claude/` (untracked
  launch config) stays out of the change.
