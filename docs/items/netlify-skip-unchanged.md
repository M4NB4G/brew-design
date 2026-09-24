# Netlify skips unchanged builds — Tier D

Status: agreed 2026-09-23 ("agree to all"); landed 2026-09-23 as "A push to main that changes nothing the site is built from is canceled before it builds, and costs no Netlify credits"; far end 2 (on Netlify) pending the merge. Written and built in
one session on the owner's word ("just do it here", 2026-09-23), waiving the
Handoff rule for this item.

## Why

Netlify's credit plans charge 15 credits for every successful production
deploy; deploy previews, branch deploys and failed or canceled builds cost
nothing, and the site's traffic is negligible. Every push to `main` builds
and publishes, including pushes that change only documents: of the 31
commits on `main` in September 2026, about 20 changed nothing the site is
built from (scope tables, item files, roadmap and method notes, the
ingredient workbook review). The owner was told on 2026-09-23 that half the
month's credits were used. When the credits run out the live site shows
"Site not available" until the cycle resets.

Netlify's `ignore` setting runs a command before the build: exit 0 cancels
the build, anything else builds. It runs from the base directory (the
repository root, `docs/items/netlify-config.md`) and exposes
`CACHED_COMMIT_REF` (the last commit built) and `COMMIT_REF` (this one).

## Sentences — what must be true afterwards

- **S1** A push that changes nothing the site is built from — only documents, the ingredient workbook, tooling, or tests — does not build or publish on Netlify, and costs no credits.
- **S2** A push that changes the app, the engine, or the package files builds and publishes exactly as today, after both suites pass.
- **S3** When Netlify cannot tell what changed since the last build — no previous build, the same commit, or the history unavailable — it builds.
- **S4** Approval is unchanged: one push to `main` per approved item, on the owner's "merge and push"; that push deploys whenever the item changes the site.

## Decisions — agreed 2026-09-23

| id | Question | Decision | Rule |
|---|---|---|---|
| N1 | Skip the Netlify build when a push changes nothing the site is built from (app, engine, package files) | Yes | A deploy that publishes an identical site costs 15 credits for nothing |
| N2 | Does a push that changes only tests deploy? | No, skip it | The published site would be byte-identical. The tests still run on every commit through the local hooks |
| N3 | Put several approved items into one push to `main` instead of one push per item | No, not yet | N1 removes most of the waste without changing "merge and push = deploy". Revisit if the credits are still tight |
| N4 | When Netlify can't tell what changed (e.g. its build cache was cleared), does it build or skip? | Build | If it's unsure, it spends the credits rather than leave a real change undeployed |
| N5 | What "the site is built from" means | Anything under `apps/` or `packages/` except their `test/` folders, plus the root `package.json` and `package-lock.json`. Everything else (`docs/`, `data/`, `tools/`, the root `*.md`, `.gitattributes`, …) is skipped. An ingredient-data change still builds: its refreshed copy lives in `apps/recipe/src` | Errs toward building: the refresh tool under `apps/recipe/scripts` builds though it is not bundled |
| N6 | Files | `tools/netlify/skip-unchanged.mjs` (new: the decision, and the command Netlify runs), `apps/recipe/netlify.toml` (`ignore`), `apps/recipe/test/netlify-skip.test.js` (new), `CLAUDE.md` (Deploy paragraph), `docs/TEST_COVERAGE.md`, this file | Smallest change; Tier D, no number reaches a recipe, so no inspector |

## Scenarios — `apps/recipe/test/netlify-skip.test.js`, written first, must fail before

1. *a push that changes only documents, the workbook, tooling or tests does not build* — S1, N2, N5.
2. *a push that changes the app, the engine or the package files builds* — S2, N5.
3. *when Netlify cannot tell what changed, it builds* — S3, N4: no previous commit, the same commit, a commit the history does not hold.
4. *Netlify runs the skip rule before every build* — S1: `netlify.toml` names the command; run as Netlify runs it, it builds when it cannot tell.

The suite runs inside Netlify's own build, whose clone may not hold old
history, so no scenario depends on a past commit; the skip path against real
history is proved at the far end.

## Far end

1. Locally, the command against real `main` history: a docs-only range skips, a range that changed the app builds.
2. On Netlify, after merge: the merge deploys (it changes `apps/recipe/netlify.toml`); the next docs-only push to `main` shows as canceled, not published.

## Recorded failure (filled in by the builder)

`npx vitest run test/netlify-skip.test.js` (from `apps/recipe`) against
unchanged `main` (71b4f77), all four scenarios, at import:

```
FAIL test/netlify-skip.test.js
Error: Cannot find module '../../../tools/netlify/skip-unchanged.mjs' imported from '…/apps/recipe/test/netlify-skip.test.js'
Test Files  1 failed (1)
     Tests  no tests
```

## Builder's notes (filled in by the builder)

1. **A Node script, not Netlify's usual one-line `git diff --quiet`.** That
   one-liner cancels the build when there is no previous build (it then
   compares the clean working copy and finds nothing), the opposite of N4.
   The script also runs the same on Windows and on Netlify, so the suite
   can test it.
2. **Every failure builds.** No previous or current commit, the same
   commit, or a `git diff` that fails (a shallow clone without the last
   built commit, an unknown commit) all build. If Netlify's image lacked
   `node` at that stage, the command would exit non-zero and Netlify would
   build: the safe direction too.
3. **The test lives in the app suite** (`apps/recipe/test`): the root
   `npm test` runs only the workspaces' suites. It depends on no past
   commit, because it also runs inside Netlify's build.
4. **Test folders skipped** are `apps/*/test/` and `packages/*/test/`;
   everything else under `apps/` and `packages/` builds (N5).
5. **Far end 1, 2026-09-23**, the command against real `main` history:
   62f385b..71b4f77, 2de02d9..71b4f77 and 44c62ac..2df6e0e (documents and the
   workbook only) exit 0, skip; 2df6e0e..62f385b, 99d9d1c..254e706 and
   71b4f77..searchable-malt-hop-boxes exit 1, build.
6. **Far end 2** is on Netlify after the merge: the merge deploys (it
   changes `apps/recipe/netlify.toml`), and the next documents-only push
   to `main` shows as canceled in the deploy list.
