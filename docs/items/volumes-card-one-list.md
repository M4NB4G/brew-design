# The Volumes card and the line under the stats bar read one list, Tier B

Status: agreed 2026-10-15 ("agree to all", R-1, VO-Q1, S20-Q2 superseded by
the orchestrated run, O-1 to O-5, M); not started. Written by the S19
session; built in the orchestrated run, batch O2 (docs/ROADMAP.md, Sessions).

## Why

The line under the stats bar names the Volumes card's empty boxes in an
order written out in `empty-fields.js`, beside the card's own layout in
`VolumesSection.jsx`, so a row moved or added on the card puts the line out
of screen order and no test fails. It happened once: the measurement
temperatures moved to the card in S6c, and the line named them last until
S10 (the review of S10, 2026-10-08). Tier B by the catch-all's "when in
doubt": every earlier change to `empty-fields.js` was gated Tier B.

## Sentences: what must be true afterwards

- **VO-S1** The line under the stats bar names the Volumes card's empty boxes in the order the card shows them, read from one list of the card's rows that the card and the line share.
- **VO-S2** No figure, no wording and no screen changes: the line names the same boxes in the same words and order as today, with water back off and on, in Home and in Pro, and the card draws byte for byte as before.
- **VO-S3** A row moved in the shared list moves on the card and in the line together.

## Decisions: agreed 2026-10-15

| id | Question | Decision | Rule |
|---|---|---|---|
| VO-Q1 | Should the line name empty boxes in the order of one list the card also uses? | Yes; no figure or wording changes | It went out of order once already (S6c to S10) |
| M1 | Builder model | Opus, high effort | The Models rule's default; O-3 |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default; O-3 |
| K | Silent properties | **Ordering:** the point of the item; the phone layout (one column, Mash, Boil, Ferment) reads the same order. **Water back on/off:** the list's rows that show only with water back on are skipped when it is off, as today. **Saved data:** none; no saved document, format or figure changes. **Durability, atomicity, multi-tab, storage disabled:** not touched. | — |

## Scenarios: to be written first, must fail before

App (`apps/recipe/test/`): *the line's order is the card's order, read from
one list* (the line under the stats bar and the card both follow the shared
list; with a row moved in the list, both move: a test that substitutes a
reordered list and sees the card and the line follow it fails before, the
line keeping its own order) · *nothing changes on screen* (the line's text
for each blank box, water back off and on, Home and Pro, as today; the
byte-for-byte page digests unchanged). Fails before: the line does not read
the card's list.

## Notes for the builder

- `apps/recipe/src/empty-fields.js` (`emptyFields`, its hand-written
  Volumes section) and `apps/recipe/src/components/VolumesSection.jsx`.
  The shared list can be a small module of the card's row keys in order,
  each with its label; keep the change the smallest that makes VO-S1 and
  VO-S3 true, and the card's markup byte for byte (VO-S2).
- The Grist, Yeast and Hops parts of the line keep their own order (out of
  scope).
- SPEC rule 8 says the line is "read from the recipe's own figures": unchanged.
  `docs/TEST_COVERAGE.md` gets a scenario row; the roadmap line "The Volumes
  card's order is written twice" is removed.
