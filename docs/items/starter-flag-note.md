# The starter's note says the 400B band's boundaries leave no gap, Tier A

Status: agreed 2026-10-15 ("agree to all", S19-Q0, SF-Q1, M); not started.
Written by the S18 session; built in batch S19, item 2 (docs/ROADMAP.md,
Sessions).

## Why

`starter.js`'s note above the bands says "The 400B band's own boundary at
900 is not one of these gaps", Rev 3's boundary; since Rev 4 (the owner's
correction of N11, 2026-10-08) the band's lower boundary is 800, read as
`cells < 800`, which leaves no gap (noticed building "Engine comments cite
their sources as the owner gave them", S18 item 2, 2026-10-15).

## Sentences: what must be true afterwards

- **SF-S1** The note above the bands says the 400B band's boundaries, 800 and 1000, leave no gap, and names no 900 boundary.
- **SF-S2** No figure changes: only comment lines change, and every engine and app test passes as before.

## Decisions: agreed 2026-10-15

| id | Question | Decision | Rule |
|---|---|---|---|
| SF-Q1 | Reword or drop the note's 900 sentence? | Reword: the 400B band's boundaries (800 and 1000) leave no gap | A comment states the current rule (Rev 4) |
| M1 | Builder model | Opus, high effort | The Models rule's default |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default |
| K | Silent properties | None a comment can have: no figure, no saved document, no screen changes | — |

## Scenarios: to be written first, must fail before

Engine: a fifth test in `packages/engine/test/engine-comment-sources.test.js`
(it reads the engine's comments as text): *the starter's note says the 400B
band's boundaries leave no gap and names no 900*. Fails before on "boundary
at 900".

## Notes for the builder

- Comment only, in the FLAG note above `BANDS`; the band's own note already
  says Rev 4's rule (S18 item 2). Show the code unchanged with comments
  stripped, as S18 item 2 did.
- No SPEC change; `docs/TEST_COVERAGE.md`'s row for the comment sources
  gains the test. The roadmap line is removed.
