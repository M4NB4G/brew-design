# An entry that cannot be is refused, Tier B

Status: agreed 2026-11-10, not started. The first builder stopped before any
change with three questions (IE-Q1 to IE-Q3), answered by the owner the same
day ("Agree to all"). Written by the planning session of
the run "wrong-on-first-use"; batch 1, item 3 (docs/ROADMAP.md, Sessions).
Built after item 1 (`docs/items/whirlpool-hop-range.md`), which holds the
hop temperature factor above 212 °F.

## Why

A negative weight, volume or time is accepted and produces figures: a hop
weight of −1 oz gives −36 IBU and a recipe total of −25. The boxes carry a
"minimum 0" hint that a browser does not enforce on typing. Only a blank is
named under the stats bar. It reaches saved recipes: a negative is saved,
exported and loaded again as typed (read-through, 2026-11-10).

## Sentences: what must be true afterwards

- **IE-S1** On the Recipe tab a number box refuses a negative entry: a line under the box says why, nothing is saved, and the box shows its figure again once left. The boxes: each malt's weight, FGDB and colour; the mash water, the pre-boil volume, the boil-off rate, the boil time, the fermentation volume (the wort from kettle with water back on) and the water back; each kettle hop's time, weight and alpha; each dry hop's weight; the brewhouse efficiency and the apparent attenuation; and every price.
- **IE-S2** The percent boxes among them (FGDB, brewhouse efficiency, hop alpha, apparent attenuation) refuse an entry above 100 % the same way.
- **IE-S3** A kettle hop's temperature box refuses an entry above 213 °F the same way, in °C the same temperature.
- **IE-S4** A recipe saved or exported before this change that holds such a figure loads as saved, in storage and from a file: nothing is refused and no saved format changes. The line under the stats bar names each such box ("Negative: Magnum weight", "Above 100 %: …", "Above 213 °F: …"), and every figure that depends on it shows "—" until it is corrected.
- **IE-S6** With the screen in °C, a refused or saved hop temperature above the limit is named as "Above 100.56 °C"; in °F as "Above 213 °F".
- **IE-S7** "Design to target OG" refuses, naming the figure and changing nothing, only while a figure it reads is outside its limits; a figure it does not read leaves it working.
- **IE-S8** The Water tab's figures that depend on a saved Recipe-tab figure outside its limits show "—", and the line under the stats bar names that figure there too.
- **IE-S5** Zero, a blank, and every entry inside these limits behave as today; so do every other temperature box, the Water tab and My brewery.

## Decisions: agreed 2026-11-10

| id | Question | Decision | Rule |
|---|---|---|---|
| N-1 | What the brewer sees for a negative entry | Refused (the owner: "lean refuse for not possible entries"), as the salt and acid boxes refuse a bad entry today (N-1a) | One refusal behaviour across the app (SPEC rule 9) |
| N-2 | Which boxes | The Recipe tab's and the prices. Temperatures are not: a negative °C is real. The Water tab and My brewery become a roadmap line | The owner reads the diff in full |
| N-3 | A saved recipe that already holds one | Loads as saved; never refused | Refusing would set the brewer's recipe aside as unreadable |
| N-4 | Zero | Left as today; anything found wrong becomes a roadmap line | A zero weight is a legitimate row |
| N-5 | Scaling and Solve | The Home/Pro scale keeps a saved negative negative (still named); "Design to target OG" refuses while one is named | The same treatment as a blank |
| N-6 | Percents above 100 | Refused the same way | 100 % is the definitional limit |
| N-7 | A saved negative, percent above 100 or hop above 213 °F | Named under the stats bar, its figures "—" until corrected | SPEC rule 8's line, extended |
| H-3 | The hop temperature's cutoff | 213 °F (the owner, 2026-11-10) | Wort boils a fraction of a degree above water |
| IE-Q1 | With the screen in °C, the limit a refused hop temperature names (213 °F is 100.556 °C; a whole degree or a tenth names a limit that is wrong for some entry) | "Above 100.56 °C" in °C and "Above 213 °F" in °F, in the line under the box and the line under the stats bar (the owner, 2026-11-10: "Agree to all") | The limit is set in °F (H-3); temperatures show in the header's unit (SPEC rule 9). Two decimals is the fewest at which every tenth a brewer can type lands on the side the line says: 100.5 °C (212.9 °F) is taken, 100.6 °C (213.08 °F) refused |
| IE-Q2 | "Design to target OG" while a saved figure is outside its limits: which figures stop it | Only a figure Solve reads: a malt's FGDB, the efficiency, the pre-boil volume, the boil-off rate, the boil time, and with water back on the wort from kettle and the water back. It names the figure in the stats-bar line's words and changes nothing. A hop weight, a price, or a malt weight (which Solve replaces) leaves it working (the owner, 2026-11-10) | N-5: the same treatment as a blank, and a blank stops Solve only when Solve reads it |
| IE-Q3 | The Water tab's figures that read a saved Recipe-tab figure outside its limits | They show "—" as for a blank, and the line under the stats bar names the figure on the Water tab too; the Water tab's own "blank figures" lines do not call it blank; the Water tab's own boxes keep taking any entry (the owner, 2026-11-10) | IE-S4: every figure that depends on it. IE-S5 and N-2 are about which boxes refuse |
| IE-N | A saved negative price | By IE-S4 it blanks the Cost card's total and cost per gal rather than being left out as unpriced; shown to the owner with IE-Q1 to IE-Q3 (2026-11-10), who agreed to all | IE-S4 |
| M1 | Builder model | Opus 5.5, high effort | CLAUDE.md, Models |
| M2 | Inspector model | Opus 5.5, default effort, a fresh session | CLAUDE.md, Models |
| K | Silent properties | **Schema:** no saved format or version changes; the recipe document may still hold such a figure and is readable (IE-S4). **Recipe file:** an import is read by the same reader, so IE-S4 holds for it. **My brewery:** a brewery figure outside the limits reaches a new recipe as today and is then named by IE-S4. **Multi-tab, storage disabled, durability:** a refused entry writes nothing, so nothing new to keep. **Idempotence:** leaving a refused box changes nothing. **Typing:** a figure is judged as entered, so a minus sign alone, or a figure being typed, is not saved until it is a figure inside the limits | Named so they are checked, not discovered |

## Scenarios: to be written first, must fail before

App (`apps/recipe/test/`): *a negative entry is refused and nothing is
saved*; *a percent above 100 and a hop above 213 °F are refused*; *a saved
recipe holding one loads, is named, and its figures are blank* (through
`computeRecipe` and the line under the stats bar; storage and a recipe
file).

## Notes for the builder

- The numbers this item adds are the limits themselves: 0, 100 % (a
  fraction of 1 in the recipe's units) and 213 °F. 0 and 100 % are
  definitional; 213 °F is the owner's. Each is written once and read
  everywhere else; none is written in a component.
- IE-S4's blank figures come from one place the UI already renders from
  (SPEC rule 10); no brewing math enters the app (rule 7).
- SPEC rule 8 gains the refusal and the named line; rule 13 is unchanged
  (say so in the notes). `docs/TEST_COVERAGE.md` gains a row per scenario.
- The roadmap gains nothing from this item beyond what the planning commit
  added (the Water tab and My brewery line).
- Far end: the built app in a browser: type −1 in a hop weight, 120 in the
  efficiency, 214 in a hop temperature (and 101 in °C); load a recipe file
  holding a negative.

## Builder's notes

(to be filled in)
