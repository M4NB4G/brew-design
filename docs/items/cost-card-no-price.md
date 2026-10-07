# A Cost card with no price reads "—" — Tier B

Status: agreed 2026-10-07 ("agree to all"); not started. Written by the S9
session; built in batch S11 (docs/ROADMAP.md, Sessions).

## Why

With no line priced (every new recipe and every older one read) the Cost
card's total and cost per gal read "$0.00" beside "6 lines unpriced": the
sum of no priced lines (EC-Q6), with a `// FLAG:` in `selectors.js`. A 0
nobody entered is a number the brewer did not enter (EC-Q3's rule) (noticed
building "Cost of a batch", S7 item 2, 2026-10-06).

## Sentences — what must be true afterwards

- **CC-S1** With no line priced, the Cost card's total and cost per gal (per bbl in Pro) read "—", with the count of unpriced lines as today.
- **CC-S2** Once one line is priced, they add the priced lines as today (EC-Q6).
- **CC-S3** Nothing else changes: each line's cost, the count, the printed sheet (no cost on it), and no saved format changes.

## Decisions — agreed 2026-10-07 ("agree to all")

| id | Question | Decision | Rule |
|---|---|---|---|
| CC-Q1 | With no line priced, do the total and the cost per unit read "—" until one line is priced? | Yes, keeping the "6 lines unpriced" count | A 0 nobody entered is a number the brewer did not enter (EC-Q3) |
| M1 | Builder model | Opus, high effort | The Models rule's default |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default |
| K | Silent properties | None beyond today's: the card is worked out each time it is drawn; nothing is saved | — |

## Scenarios — to be written first, must fail before

App (`apps/recipe/test/economics.test.js`, or a new file): *with no line priced the total reads "—"* (the built-in recipe: total and cost per gal "—", "6 lines unpriced"); *one priced line gives its sum* (one malt priced at $1.50/lb, 10 lb: $15.00, by hand); *nothing else changes*.

## Notes for the builder

- `selectors.js`'s `computeCost` and its `// FLAG:` (EC-Q6's $0.00); the FLAG goes with the change.
- Files likely touched: `apps/recipe/src/selectors.js`, possibly `components/CostCard.jsx`; SPEC rule 10; `docs/TEST_COVERAGE.md`.
