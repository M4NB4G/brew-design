# A comma typed as the decimal point, Tier B

Status: agreed 2026-10-12 ("agree to all", CM-Q1, CM-Q2); landed
2026-10-13 as "In a salt or acid box a comma typed as the only separator is
the decimal point, and any other entry that is not a number is refused with
a line under the box and nothing saved". Written by the S15b session; built
in batch S16, item 2 (docs/ROADMAP.md, Sessions).

## Why

The water boxes read a typed figure up to its first character that is not
a number, so "2,4" (a phone keyboard that writes the decimal point as a
comma) is saved as 2, with no message, and "14,4" g of a salt as 14 (found
by the review of S10, 2026-10-08; LT-Q4). Tier B by the catch-all: it
changes a dose the brewer acts on.

## Sentences: what must be true afterwards

- **CM-S1** In a salt or acid box, a figure typed with one comma and no point reads the comma as the decimal point: "2,4" is 2.4, "14,4" is 14.4.
- **CM-S2** Any other entry that is not a number (two commas, a comma and a point, letters, "2,4,6") is refused: a line under the box says so, and nothing is saved; the box keeps what was there before once the brewer leaves it.
- **CM-S3** A figure typed with a point is read as today.
- **CM-S4** Nothing else changes: the recommendation, every water figure, the printed sheet and the saved format.

## Decisions: agreed 2026-10-12

| id | Question | Decision | Rule |
|---|---|---|---|
| CM-Q1 | "2,4" typed in a water box | Read as 2.4 when the comma is the only separator; any other text that is not a number refused with a line under the box, nothing saved | No figure the brewer did not enter (SPEC 8) |
| CM-Q2 | Which boxes? | Every typed-text box on the Water tab: the salt and acid boxes | The boxes that read text today |
| M1 | Builder model | Opus, high effort | The Models rule's default |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default |
| K | Silent properties | **Ordering:** the refusal line clears on the next entry the box can read. **Schema migration:** none. **Thousands separators:** a comma is never read as one (CM-Q1: a single comma is the decimal point) | — |

## Scenarios: to be written first, must fail before

App (`apps/recipe/test/comma-decimal-point.test.js`, jsdom): *a comma is the
decimal point* ("2,4" mL saves 2.4; "14,4" g saves 14.4); *anything else
that is not a number is refused and named* ("2,4,6", "2,4.1", "abc": the
line under the box, the saved recipe unchanged); *a point reads as today*;
*nothing else changes*.

## Notes for the builder

- `apps/recipe/src/components/water/SaltsAcidScreen.jsx`: the salts' `parseGrams`
  and `AcidRow`'s `parse` both use `parseFloat`, which stops at the comma.
- Build after "A water box keeps its figure until typed in" (S16 item 1),
  which changes what leaving the box does.

## Builder's notes (S16, 2026-10-13)

Choices the sentences did not make, each a claim for the inspector:

- **What reads as a number**: after surrounding spaces are dropped, digits
  with at most one point (“2.4”, “.5”, “5.”), or digits with exactly one
  comma and no point (“2,4”, “,5”, “2,”), each with an optional sign. A
  negative figure reads as before (a salt box ignores it and reads 0 when
  left; an acid box reads 0). An empty box reads as before (0 when left).
  Everything else is refused, “1e3” included (letters, CM-S2), where it
  used to read 1000.
- **Nothing is saved, typed key by key.** The boxes store each readable
  entry as it is typed (unchanged), so “2,4.1” passes through “2,4”, which
  reads 2.4. When an entry is refused, the water goes back to what it was
  when the typing in that box began, so the saved recipe ends as it was
  (a dose following the recommendation keeps following it). Only that
  box's typing can change the water in between.
- **The line** reads “Not a number, so nothing is saved. Type it as 2.4 or
  2,4.”, in the warning colour, under the box and above the “rec” hint.
  It shows while the entry is refused and stays once the brewer leaves,
  until the next entry the box can read (row K); a lone “.” or “,” on the
  way to “.5” shows it for that one key.
- **Markup**: the box's row (the box and its unit) moved inside the box's
  own component so the line can sit under it; the screen's markup is
  unchanged with nothing refused (the earlier screen captures still pass).
- **Tooling**: the new jsdom test is added to `eslint.config.js`'s list of
  tests that read the browser's globals (Tier D).
