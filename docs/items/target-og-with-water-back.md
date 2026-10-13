# Design to target OG with water back on, Tier A + B

Status: agreed 2026-10-13 ("agree to all", TO-Q1, TO-Q2, M); landed
2026-10-13 as "With water back on, Design to target OG takes the OG at
pitch, works it back to the OG from the kettle and solves the grain bill for
that". Written by the S15b session; built in batch S15c, item 2, after
item 1 (docs/ROADMAP.md, Sessions).

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

## Builder's notes (S15c, 2026-10-13)

Choices the sentences did not make, each a claim for the inspector:

- **The engine's step takes °P.** `knockOutPlato({ plato, knockOutGal,
  waterBackGal })` (`water-back.js`) is the forward balance read the other
  way: °P × SG (SG by `platoToSg`) × the volume at pitch over the wort from
  kettle's volume, then the same halving search the forward step uses. The
  selector turns the target SG into °P by the engine's `sgToPlato` and the
  °P from the kettle back by `platoToSg`, so the target passes through one
  more pair of the two conversions the solver already carries; the stats
  bar lands on the target to 1e-4 (the scenario's tolerance), as Solve did
  without water back. No new constant.
- **The volumes** are the ones `computeRecipe` reads (`pitchVolumes`): the
  wort from kettle at the fermentation volume's measurement temperature and
  the water back at its own (K, ordering).
- **What is named.** TO-S3 names the water back and its temperature; the
  balance also reads the wort from kettle, so a blank wort from kettle
  ("the wort from kettle") or one the correction cannot use is named the
  same way. The temperature lines follow the pre- and post-boil ones ("…
  cannot be corrected at its measurement temperature."), a blank and an
  out-of-range temperature alike, as SH-S4 did.
- **The predicted OG** after Solve is the stats bar's (at pitch with water
  back on, the same figure as before without it); the page passes it to the
  card. The inverse-solver scenarios draw the card alone, so their helper now
  passes the stats bar's OG too; nothing they assert changed.
- **Solve changes only the malt weights.** With water back on the hops are
  untouched, so the IBU at pitch moves with the gravity (the built-in recipe
  at 1.056 at pitch: 40 → 37), as it does without water back.
- **Recorded failure.** Engine 3 of 3. App 3 of 4; TO-S4 (off, as today)
  passed before, a guard.
