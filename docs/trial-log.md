# Tier C and D trial log

The record the owner reviews the trial from (CLAUDE.md, Models: the Tier C and
D trial, then the widened trial). One row per batch. Figures are the owner's
`/usage` readings at the end of each session, as sent; a session cannot run
`/usage` itself, and no start reading was taken, so a batch's cost is the
whole session's, not per item. "Builder" and "advisor" are the trial's two
models (CLAUDE.md, Models). Last updated 2026-10-06.

## Batches

| Batch | Items | Tier | Cost | Time | Builder / advisor | Send-backs | Fixes after a commit |
|---|---|---|---|---|---|---|---|
| S6a | 2 (Water Notes name the tool; printed sheet with water on one page) | C | $5.13 | API 11m 8s, wall 32m 50s | $3.27 / $1.86 (a further $0.0016 on a third model) | not recorded here | not recorded here |
| S6c | | | | | | | |
| S6d | | | | | | | |
| F1 | 3 (tests on GitHub; a linter; a name for every box) | D, D, C | $10.02 | API 17m 4s, active 25m 34s | 67 % / 33 % (basis, cost or tokens, not stated) | 0 | 0 |

S6c and S6d are left blank until their readings are in.

Per item, from the whole session's cost: S6a about $2.57, F1 about $3.34. F1's
items were the heavier kind (a new browser-DOM test suite with two test-only
dependencies, a before-and-after browser run, and a strip across four older
byte-for-byte scenarios); S6a's were a wording fix and a print layout.

## F1 detail

- CI: green on the first run of the first push (run 37507836800 on the pull
  request, #55); no fix commit was needed.
- The advisor changed the builder's work three times: it narrowed the linter's
  Tier B downgrade to the one finding; it asked for the lockfile to be checked
  for changed versions (none changed); and it caught that the box-name scan had
  never opened "Design to target OG" (the scenario now does).
- Every number each item adds was confirmed by the advisor as no recipe value.
- Merged on the owner's word: `main` at e2d5edf.

## Not like for like

- S7 (an all-Opus session, three Tier A/B items with a fresh inspector each, one
  with a FAIL round, and an engine change) read $25.23. It is not a Tier C and
  D comparison.
- No Opus Tier C and D batch has been measured (CLAUDE.md, Models). Until one
  is, a saving against Opus cannot be stated, only the cost per item here.
- The line counters in the readings ("+280 −0" for F1, "0 added, 0 removed" for
  S6a) do not match the commits and are not used.
