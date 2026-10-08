# A Cost card with no price reads "—" — Tier B

Status: landed 2026-10-08 in batch S11 on branch `S11`, as "With no line
priced, the Cost card's total and cost per gal read "—", not $0.00";
agreed 2026-10-07 ("agree to all"). Written by the S9 session; built in
batch S11 (docs/ROADMAP.md, Sessions).

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

## Builder's notes (S11, 2026-10-08)

Claims for the inspector to verify; none is a decision the sentences made.

- One change, in `selectors.js`'s `computeCost`: with no priced line the total is blank (NaN) in place of the engine's sum of no lines; with one or more it is the engine's `rollupCost` of the priced lines as before. The cost per unit follows with no code of its own: the engine's `costPerUnit` of a blank total is blank. The card already shows a blank as "—" (`dollars`), so `CostCard.jsx` is unchanged.
- "Priced" is as before (EC-Q6): a price that is a number, so a price typed as 0 is priced and the total reads $0.00, a figure the brewer entered (pinned).
- The `// FLAG:` in `selectors.js` (EC-Q6's $0.00) goes with the change; the comment says what the function does now.
- One roadmap line is extended, not added: the inspector of item 2 noticed React's warning "Received NaN for the `children` attribute" when the post-boil measurement temperature is emptied; it is "Post-boil volume at 60 °F" reading "NaN" (seen on the built app); not caused by item 2, since an emptied box is a blank (NaN) that the conversion passes through before and after it, and the family of the existing Tier C line "Figures that depend on an empty box read 'NaN' on the Volumes card", which now names it (procedure step 3).
- One of the three scenarios failed before; "one priced line gives its sum" and "nothing else changes" passed before, as CC-S2 and CC-S3 say nothing changes. The first scenario was rewritten before the change to gather the three figures the card shows, so the recorded failure names each; the recorded failure is from the rewritten one.
- Numbers introduced: none. The blank is NaN, the app's blank figure (SPEC rule 8); the `> 0` is a count of priced lines. The sums are pinned by hand in the test.
