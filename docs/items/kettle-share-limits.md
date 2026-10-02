# Kettle shares held at their limits — Tier A + B

Status: agreed 2026-10-02 (the owner: "KS1 lets follow your
recommendation"), not started. Written and built by the S4 session, as the
answer to the roadmap line "Kettle shares past their limits" that S4b item 2
(`docs/items/water-as-brewed.md`, KW-S1) left for the owner.

## Why

S4b puts the mash's salts into the kettle at the recipe's brewhouse
efficiency, and the sparge's in the share of the kettle the mash liquor
leaves. Because the efficiency also holds the mash's conversion, it does not
always fit the volumes: at the built-in 75 % with the worked example, the
rule asks for 8.75 gal of an 8.5 gal sparge (a share of 1.029); a high
efficiency can ask for less than none of it; with no sparge, a short kettle
asks for twice the mash. S4b kept these as the arithmetic gives them, with a
FLAG, and asked the owner. He chose to hold each share at its limit and say
so.

## Sentences — what must be true afterwards

- **KS-S1** With a sparge, the share of the mash's salts that reaches the kettle is the brewhouse efficiency, but never more than the kettle's share of the mash water (pre-boil ÷ mash water); the sparge's share is never below 0 nor above 1. With no sparge, the mash's share is never above 1.
- **KS-S2** When a share is held at its limit, the Kettle Water card and the printed sheet say so: "A share was held at its limit: the brewhouse efficiency does not fit these volumes (it also counts the mash's conversion), so the kettle salts are an estimate."
- **KS-S3** Within the limits nothing changes: the same figures as S4b for the same entries.

## Decisions — agreed

| id | Question | Decision | Rule |
|---|---|---|---|
| M1 | Builder model | Opus, high effort | Models default |
| M2 | Inspector model | Opus, default effort, a fresh session | Models default |
| KS1 | What happens past the limits | Hold each share at 0–100 % and show a note when that happens (the owner, 2026-10-02) | The owner's answer to the roadmap question |
| K | Silent properties | Pure sums; no saved format changes | — |

## Scenarios — to be written first, must fail before

`packages/engine/test/water/volumes.test.js`: *a share past the whole is held
at its limit* (replacing S4b's "a share past the whole is kept as the
arithmetic gives it"). `apps/recipe/test/kettle-water.test.js`: *a share held
at its limit is said so*.
