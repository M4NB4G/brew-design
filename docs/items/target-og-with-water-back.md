# Design to target OG with water back on, Tier A + B

Status: agreed 2026-10-13 ("agree to all", TO-Q1, TO-Q2, M); not started.
Written by the S15b session; built in batch S15c, item 2, after item 1
(docs/ROADMAP.md, Sessions).

## Why

"Design to target OG" solves the grain bill for the OG from the kettle; with
water back on, the stats bar shows the OG at pitch, so a brewer who types
the OG they want in the fermenter gets a lower one there (the built-in
recipe with 1 gal of water back: a target of 1.056 reads 1.047 at pitch)
(noticed building water back, S15b, 2026-10-12).

## Sentences: what must be true afterwards

- **TO-S1** With water back on, the target typed is the OG at pitch, and the card says so ("Target OG at pitch"). The engine works back from it to the OG from the kettle by the same sugar balance the figures at pitch use (°P × SG × volume kept; the wort from kettle and the water back each at 60 °F), then solves the grain bill as today.
- **TO-S2** After Solve, the stats bar's OG is the target, within the gravity conversions' mismatch the solver already carries.
- **TO-S3** A blank or uncorrectable water back, or its temperature, refuses Solve and is named, as any other blank figure Solve needs.
- **TO-S4** With water back off, Solve is as today.

## Decisions: agreed 2026-10-13

| id | Question | Decision | Rule |
|---|---|---|---|
| TO-Q1 | With water back on, what is the target OG? | The OG at pitch, worked back by the engine to the OG from the kettle, with the card saying so | The stats bar shows what ferments (WB-Q4) |
| TO-Q2 | Blank water back during Solve | Solve refuses and names the box | Same rule as every other blank (IS-S4) |
| M1 | Builder model | Opus, high effort | The Models rule's default |
| M2 | Inspector model | Opus, default effort, a fresh session (one box for the engine, one for the app) | The Models rule's default |
| K | Silent properties | **Ordering:** Solve reads the same corrected volumes as the stats bar. Nothing is saved (the target never is, IS-S6); no saved format changes | — |

## Scenarios: to be written first, must fail before

Engine (`packages/engine/test/water-back.test.js` or a new file): *the OG
from the kettle for an OG at pitch* (the owner's 400 + 78 gal: from 10.11768692
°P at pitch back to 12 °P, by hand, the inverse of S15b's pin). App
(`apps/recipe/test/`, a new file): *with water back on, Solve gives the
target at pitch on the stats bar* (the built-in recipe with 1 gal, by hand);
*a blank water back or temperature refuses Solve and is named*; *off,
nothing changes*.

## Notes for the builder

- Builds on S15c item 1 ("Wort from kettle"). The engine has the forward
  balance (`water-back.js`); the inverse is the same balance read the other
  way, so no new constant.
- `selectors.js` `solveTargetOG`; `components/TargetOgSolver.jsx` for the
  label; the solved OG it shows after Solve should be the one at pitch.
