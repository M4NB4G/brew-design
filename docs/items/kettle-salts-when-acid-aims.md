# Kettle salts when the acid drops the raising salt, Tier B

Status: agreed 2026-10-14 ("agree to all", KA-Q1, M); not started. Written
by the S15c session; built in batch S17, item 2 (docs/ROADMAP.md, Sessions).

## Why

With kettle salts on, the kettle's salts are what the whole kettle water
needs for the style, less what the mash brings. Since the acid aims at a
mash pH (S9), a mash above the target gets no alkalinity-raising salt
(AA-Q7), so the kettle's balance puts that baking soda in the kettle
instead: the amber ale of `acid-aimed.test.js` with kettle salts and a 4 gal
sparge gets 0.46 g of baking soda in the kettle at a target of 5.4, against
0.26 g at 6.0 (noticed building the acid aimed at a mash pH, S9,
2026-10-07). Baking soda carries no sulfate or chloride, so this item does
not move S17 item 1's figures.

## Sentences: what must be true afterwards

- **KA-S1** With kettle salts on and the acid aiming at the mash pH (the mash above the target, so no raising salt in the mash), the kettle gets no alkalinity-raising salt: the amber ale above, 0 g of baking soda in the kettle at a target of 5.4.
- **KA-S2** With the mash at or below the target (no acid; the raising salt follows the style), the kettle's salts are as today (the amber ale at 6.0: 0.26 g).
- **KA-S3** The kettle's other salts, and every other figure, are as today; no saved format changes.

## Decisions: agreed 2026-10-14

| id | Question | Decision | Rule |
|---|---|---|---|
| KA-Q1 | While the acid aims at the mash pH, does the kettle get the raising salt the style's alkalinity asks for? | No: the kettle gets no alkalinity-raising salt; mashes at or below the target keep today's figures | The style's alkalinity serves the mash pH; once the acid aims at it, nothing asks for the raising salt (AA-Q7) |
| M1 | Builder model | Opus, high effort | The Models rule's default |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default |
| K | Silent properties | **Ordering:** the kettle reads the same "acid aims" condition the salts and the acid card read. Nothing is saved; no saved format changes | — |

## Scenarios: to be written first, must fail before

App (`apps/recipe/test/`, a new file, the amber ale of
`acid-aimed.test.js` with kettle salts on and a 4 gal sparge): *at 5.4 the
kettle has no baking soda* (0 g, against 0.46 g today); *at 6.0 as today*
(0.26 g); *the other kettle salts unchanged* (by hand or against today's
figures); *off, nothing changes*.

## Notes for the builder

- `selectors.js` `computeWater`: the kettle block solves the whole kettle
  water with the style's raising salt; the mash's `withoutRaise` /
  `recommendedSalts` already say when the acid aims. Engine untouched
  unless the solver needs a switch.
- Check whether leaving the raising salt out changes the solver's other
  kettle salts (it solves the ions together); KA-S3 asks that they stay as
  today, so drop the raising salt from the result, not from the solve,
  unless the owner is asked again.
