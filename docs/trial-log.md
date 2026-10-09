# Tier C and D trial log

The record the owner reviews the trial from (CLAUDE.md, Models: the Tier C and
D trial, then the widened trial). One row per batch. Figures are the owner's
`/usage` readings at the end of each session, as sent; a session cannot run
`/usage` itself, and no start reading was taken, so a batch's cost is the
whole session's, not per item. "Builder" and "advisor" are the trial's two
models (CLAUDE.md, Models). Last updated 2026-10-09.

## Batches

| Batch | Items | Tier | Cost | Time | Builder / advisor | Send-backs | Fixes after a commit |
|---|---|---|---|---|---|---|---|
| S6a | 2 (Water Notes name the tool; printed sheet with water on one page) | C | $5.13 | API 11m 8s, wall 32m 50s | $3.27 / $1.86 (a further $0.0016 on a third model) | not recorded here | not recorded here |
| S6c | | | | | | | |
| S6d | | | | | | | |
| F1 | 3 (tests on GitHub; a linter; a name for every box) | D, D, C | $10.02 | API 17m 4s, active 25m 34s | 67 % / 33 % (basis, cost or tokens, not stated) | 0 | 0 |
| S10b | 1 (the References page) | C and D | $10.02 | API 26m, wall 30m | not split: the report lists only the builder's model line | 0 | 1 (a docs-only note, `597b677`) |
| F2 | 3 (security headers; browser checks kept in the repo; header unit switches on their own row) | D, D, C | $9.56 | API 17m 35s, wall 34m 57s | $5.52 Sonnet / $4.03 Opus (58 % / 42 %) | 0 | 0 so far (the reading is from before the merge) |

S6c and S6d are left blank until their readings are in.

Per item, from the whole session's cost: S6a about $2.57, F1 about $3.34, F2
about $3.19. F1's items were the heavier kind (a new browser-DOM test suite
with two test-only dependencies, a before-and-after browser run, and a strip
across four older byte-for-byte scenarios); S6a's were a wording fix and a
print layout; F2's were a config block, a browser suite with its own server and
a test-only dependency, and a header layout read from measured positions.

## F1 detail

- CI: green on the first run of the first push (run 37507836800 on the pull
  request, #55); no fix commit was needed.
- The advisor changed the builder's work three times: it narrowed the linter's
  Tier B downgrade to the one finding; it asked for the lockfile to be checked
  for changed versions (none changed); and it caught that the box-name scan had
  never opened "Design to target OG" (the scenario now does).
- Every number each item adds was confirmed by the advisor as no recipe value.
- Merged on the owner's word: `main` at e2d5edf.

## S10b detail

- The reading (2026-10-08, 20:08 UTC) is one line for the builder's model and
  no advisor line, so no split between builder and advisor is recorded. It was
  taken after the merge, so $10.02 covers the whole session: the build, the
  report, the branch correction, the follow-up commit, the merge and push, and
  the questions after them. It equals F1's $10.02 to the cent; the times differ
  (F1 API 17m 4s, S10b API 26m), so it is read as a coincidence.
- Send-backs: 0. After the report the owner corrected the builder's claim that
  `main` was stale: the cloud clone's `origin/main` read 7404297, while GitHub's
  was 3916114 (S10a on top). That changed no code.
- Fix after a commit: 1, `597b677`, a docs-only correction to the item file's
  branch note, made as a follow-up commit so the reviewed hash stayed valid.
- The advisor was called twice, before building and before the commit. It
  changed the builder's work once: the page divided an engine constant
  (`G_PER_LB / 1000`), which made SPEC rule 7's new sentence untrue; the
  equation is now written in the engine's own form. Every number the item adds
  was confirmed as no recipe value.
- Merge: on the owner's word, `main` at `597b677`; the pull request is
  M4NB4G/brew-design#64. The Netlify build and CI were not checked here.

## F2 detail

- The reading (2026-10-09) is the owner's `/usage` after the report and before
  the merge, so $9.56 covers the build, the report, the pull request and the
  questions after it. No start reading was taken. It splits by model: $5.52
  Sonnet, $4.03 Opus (the advisor).
- Questions to the owner: 2, asked together before building (where the header's
  unit switches go on a screen and on a phone); both answered "their own row"
  and "agree". Send-backs after the report: 0.
- CI: green on the first run of the pull request (M4NB4G/brew-design#68), both
  the push and the pull-request run; Netlify's header-rules check passed on the
  deploy preview. The deployed headers themselves are read after the merge: the
  sandbox's proxy refused the preview address.
- The advisor was called four times: before building, and before each commit.
  It changed the builder's work in these ways: it asked for the tab clicks to
  be counted (the first browser check would have skipped a missing tab without
  saying so; all three were clicked in the re-run) and for the unverified Deploy Preview claim to come out of the
  coverage row; it found the "pinned outside the app's code" wording untrue for
  the built-in recipe's own readings, and the wait in the two
  expected-violation checks racing; it asked for the real count from the
  inline-script break (the first run's output had been cut at nine lines); it
  asked that the install scripts of the new packages be checked (only a
  macOS-only optional one has any); and it asked for one click of °C on the
  phone, to show a moved switch still works. Every number each item adds was
  confirmed as no recipe value.
- Not built, put to the roadmap: the GitHub check running the browser suite.
  Put to the owner: what "the test totals" in the roadmap means.

## Not like for like

- S7 (an all-Opus session, three Tier A/B items with a fresh inspector each, one
  with a FAIL round, and an engine change) read $25.23. It is not a Tier C and
  D comparison.
- No Opus Tier C and D batch has been measured (CLAUDE.md, Models). Until one
  is, a saving against Opus cannot be stated, only the cost per item here.
- The line counters in the readings ("+280 −0" for F1, "0 added, 0 removed" for
  S6a, "168 added, 0 removed" for F2, whose commits add 802 lines) do not match
  the commits and are not used.
