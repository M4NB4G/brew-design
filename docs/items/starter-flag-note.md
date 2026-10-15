# The starter's note says the 400B band's boundaries leave no gap, Tier A

Status: agreed 2026-10-15 ("agree to all", S19-Q0, SF-Q1, M); landed
2026-10-15 as "The starter's note says the 400B band's boundaries, 800 and
1000, leave no gap". Written by the S18 session; built in batch S19, item 2
(docs/ROADMAP.md, Sessions).

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

## Builder's notes (S19, 2026-10-15)

Choices the sentences did not make, each a claim for the inspector:

- **The words.** The note's last sentence now reads "The 400B band's
  boundaries, 800 and 1000, leave no gap -- see its effectiveCells() for the
  owner's rule." Only that sentence changes; the rest of the FLAG note (the
  gaps at 500 and 800 in the 100B and 200B bands) stands, being still true
  of those bands.
- **The scenario's assertion.** It looks for that sentence's opening words
  and for the absence of "boundary at 900", in the comment text the file's
  existing reader gives (white space collapsed across lines).
- **No figure.** `starter.js` with its comments stripped is identical before
  and after (checked by a script, not committed), and the built app is byte
  for byte the same: `index-kFlZ0vbl.js`, SHA-256 abe5fa99…caf75 before and
  after. The far end is therefore the same page as item 1's far end; no
  separate browser check shows anything a comment could change.
- **No SPEC change**: rule 2 already states the band's Rev 4 boundaries.

Failure recorded before the change (the scenario run alone, trimmed):

```
× the starter's note says the 400B band's boundaries leave no gap and names no 900 (SF-S1)
  AssertionError: expected ' Band definitions. `effectiveCells(ce…' to contain 'The 400B band\'s boundaries, 800 and …'
  Expected: "The 400B band's boundaries, 800 and 1000, leave no gap"
Tests  1 failed | 4 passed (5)
```
