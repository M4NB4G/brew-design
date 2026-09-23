# Ingredient list in the app — Tier B

Status: landed 2026-09-23 on branch `ingredient-list-in-app`, "The app carries
a copy of the owner's ingredient list, every number exactly its workbook cell,
and a test fails naming the row whenever the two disagree or the workbook is
unusable"; awaiting the owner's "merge and push". Agreed 2026-09-23 ("agree to
all"); written by the spec session, built by a new session from CLAUDE.md's
kickoff prompt.

## Why

The owner wants the malt, hop and yeast boxes to be searchable, filling in
an ingredient's numbers when one is picked. His Recipe Designer spreadsheet
already does this: the Grist and Hops sheets look FGDB and alpha acid up
from Costs Ref by name. But each of his 50 recipe workbooks carries its own
copy of Costs Ref, and the copies had drifted (Bravo 14.2% in 39 copies,
14.7% in 6; Midnight Wheat 0% FGDB in 44).

So the list became one workbook, `data/Brew Design Ingredients.xlsx`: seeded
from all 50 copies (1e934f6), reviewed by the owner row by row, and
decisions applied (44c62ac). It has 42 malts, 43 hops and 32 yeast strains,
and nothing in the app reads it yet. Provenance is in `data/README.md`, and
every decision is on the workbook's Review tab.

This item carries the workbook into the app, checked cell by cell. The
searchable boxes that offer the list are the next item ("Searchable
ingredient boxes", `docs/ROADMAP.md`). Keeping them apart means this item
changes no number on screen: it can be proved exact before anything uses it.

Rejected, with reasons (research of 2026-09-22, in the spec session):
- **scheb/beer-analytics:** names only for malts and hops, so no FGDB,
  colour or alpha. Its yeast table is good, but it is GPL-3.
- **Brewtarget's default data:** complete, but GPL-3 and of unknown
  provenance.
- **The owner's own workbook:** no licence question, and it matches the
  method's "spreadsheet cell" rule for a number.

## Sentences — what must be true afterwards

- **S1** The app carries a copy of the workbook's list: every malt with its FGDB and colour, every hop with its alpha acid, every yeast with ale/lager, attenuation and lab temperature range — each number exactly as the workbook stores it, not rounded.
- **S2** A test fails whenever the app's copy and the workbook disagree — a row added, removed or renamed in one but not the other, or any of those numbers different — and names the row.
- **S3** The same test refuses a workbook the app could not use safely, naming the sheet and row: two rows with the same name (capital letters ignored), a required number blank or not a number, a percentage outside 0–100% (catches 82 typed without the % sign), a colour below 0, a yeast neither Ale nor Lager, a lab range whose low end is above its high end.
- **S4** Nothing on screen changes and no number in any recipe changes; saved recipes, the recipe file and the printed sheet are untouched. The list is carried, not yet offered.

## Decisions — agreed

| id | Question | Decision | Rule |
|---|---|---|---|
| M1 | Builder model | Opus, high effort | The Models rule's default, every tier (the owner, 2026-09-23) |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default. Every number's rule is a workbook cell (L5) and no arithmetic is introduced, so no hand-calculated pin is needed |
| L1 | Master copy; how an edit reaches the app | The repository's workbook is the master. The owner edits a copy wherever he likes and hands it to a session ("here's my update"). The session shows him every changed cell, refreshes the app's copy and reports. After "merge and push" it sends him back the merged file, so his copy is current | One master avoids the drift Costs Ref suffered; the owner sees every change before it lands |
| L2 | Form of the app's copy | A plain text data file, refreshed from the workbook by a tool in the repository and committed beside it; the website never reads the Excel file | A workbook edit shows in a diff only as "binary file changed"; the text copy shows every changed number on its own line in the diff the owner reads. It also keeps a spreadsheet reader out of the shipped app |
| L3 | Which rows | Every row with a name, whatever its Status. A row missing a number the app needs fails the test (S3); it is never dropped | Nothing disappears silently. Today every row is Confirmed or OK |
| L4 | What the copy carries | Malt: name, FGDB, colour. Hop: name, alpha acid. Yeast: name, lab, product code, ale/lager, attenuation, lab temperature low and high. Prices, pack sizes, suppliers, sources, statuses and notes stay in the workbook | Smallest change; prices belong to the Economics item |
| L5 | Each number's rule and pin | Rule: its workbook cell, the owner's figure, with the same standing as a cell of the reference spreadsheet. Pin: the test comparing every number exactly. No unit conversion: the workbook stores percentages as fractions, as the recipe state does (SPEC rule 8), colour in °L and temperatures in °F | The Models rule exempts a spreadsheet-cell rule from a hand-calculated pin; nothing is computed |
| L6 | Cost of a routine workbook edit later | Tier D: refresh, the test, the build, and a report whose diff shows every changed number; no inspector. Changing the refresh tool, the test, or what the copy carries stays Tier B. The builder adds this to CLAUDE.md's change control (text below) and to the hooks | The only rule for these numbers is "equals the owner's cell"; the test checks every cell mechanically and the owner reads every changed number. The alternative is a full inspector run per added hop |
| L7 | This item's tier | Tier B with the inspector, although nothing reads the list yet | It sets up the check every future ingredient number relies on; "when in doubt, it is Tier B" |
| L8 | Silent properties | **Idempotence:** refreshing twice gives a byte-identical copy. **Stored, not displayed:** the refresh reads the value Excel stores (Bravo 0.144), never the displayed text ("14.4%"). **Encoding:** names keep accents exactly (Hallertau Mittelfrüh, WLP4061 Rhine Kölsch Ale), and names are trimmed of leading and trailing spaces. **Ordering:** rows keep the workbook's order. **Durability and schema:** the copy is reference data, never in recipe state, never saved with a recipe, never in the recipe file, so there is no schema change (SPEC rule 13 untouched). **Deploy:** Netlify runs `npm test` before building, so a copy that disagrees with the workbook never deploys. The spreadsheet reader is a development dependency, which Netlify installs for the test. **Workbook open in Excel:** the refresh reads the saved file; Excel's lock file (`~$…`) is never read | Named so the inspector can check each |
| L9 | Files | `apps/recipe/package.json` (+ `package-lock.json`): the spreadsheet reader as a devDependency and a `refresh-ingredients` script. `apps/recipe/scripts/ingredient-workbook.js` (new): reads and validates the workbook into the list, shared by the refresh tool and the test. `apps/recipe/scripts/refresh-ingredients.js` (new): writes the copy. `apps/recipe/src/ingredients.json` (new): the copy. `apps/recipe/test/ingredients.test.js` (new). `SPEC.md` (rule 16). `CLAUDE.md` (change control, L6). `tools/hooks/pre-commit` and `tools/hooks/commit-msg` (L6). `docs/TEST_COVERAGE.md` (rule 16, scenario row, totals). `docs/ROADMAP.md` (this row removed). This file (status, recorded failure, builder's notes). No file in `apps/recipe/src/` other than the new copy, and nothing imports the copy yet | Smallest change; S4 |

### Text to add — agreed with L6

**CLAUDE.md**, change control, after the catch-all paragraph:

> **Ingredient data.** An edit to `data/Brew Design Ingredients.xlsx`
> committed with its refreshed copy `apps/recipe/src/ingredients.json` — the
> refresh tool (`apps/recipe/scripts/`) and `apps/recipe/test/ingredients.test.js`
> unchanged, and the suite passing — is Tier D: no inspector. Each number's rule
> is the owner's workbook cell, and the test checks every one. The report
> carries the copy's diff, so every changed number is on its own line. Any
> change to the refresh tool, the ingredient test, or what the copy carries is
> Tier B.

**SPEC.md**, section 2, after rule 13. It is numbered 16 so that rules 14
and 15 keep their numbers, which the hooks and coverage cite:

> 16. **The ingredient list is the owner's workbook.** `apps/recipe/src/ingredients.json`
>     is generated from `data/Brew Design Ingredients.xlsx` by the refresh tool
>     and never edited by hand; every name and number equals its workbook cell,
>     unrounded, and `apps/recipe/test/ingredients.test.js` fails otherwise. It is
>     reference data: never part of the recipe state, never saved with a recipe.

**Hooks** (L6):
- `pre-commit` runs `npm test` when the workbook, the copy, the refresh tool
  or the ingredient test is staged.
- `commit-msg` requires `Verdict: PASS` when the refresh tool or the
  ingredient test is staged.

A commit that stages only the workbook and the copy needs no box.

## Scenarios — `apps/recipe/test/ingredients.test.js`, written first, must fail before

1. *the app's ingredient list is exactly the workbook's: every row, every number, in the workbook's order* — S1, L4, L5, L8. Reads the real workbook and compares the list with the committed copy, field by field, with exact equality.
2. *a row added, removed or renamed, or a number changed, in the workbook but not the copy fails the match and names the row* — S2. Modify an in-memory copy of the real workbook, one case each: add a hop, remove a malt, rename a yeast, change one alpha. Each case reports a mismatch that names the sheet and the row.
3. *an unusable workbook is refused, naming the sheet and row: duplicate name, blank or non-number required number, percentage outside 0–100%, negative colour, yeast neither Ale nor Lager, lab range inverted* — S3. Uses in-memory workbooks built in the test with the real headers. It includes "flaked Oats" beside "Flaked Oats" (the seeding slip of 2026-09-23), and FGDB typed as 82 without the % sign.
4. *refreshing twice gives an identical copy* — L8. Running the refresh on the same workbook twice yields byte-identical text, equal to the committed file.

Expected failure before the change: all four fail at import, because the
reader, the refresh tool and the copy do not exist. Record the trimmed
error. S4 is proved by the unchanged suites and the far end.

## Far end — Tier B, on the built app

1. Build `main` first and note the JavaScript bundle's content hash. The live
   site's bundle has the same hash as a local build, as seen on 2026-09-21.
2. Then build the branch and note its hash. Nothing imports the copy (S4), so
   **the two bundles must be byte-identical**. That is the far-end proof that
   no screen or number changed. If the hashes differ, stop: something reads
   the list.
3. Open the built app: default recipe, stats and every card as before. Load a
   saved recipe from storage: unchanged.
4. Edit one number in a scratch copy of the workbook (never the committed
   one) and run the refresh against it. The copy's diff is exactly one
   changed line, and the test then fails naming that row. Discard both.

## Notes from the spec session, for the builder

- **Headers, not positions.** Read columns by header text, so a column the
  owner inserts cannot shift a number. A missing header fails the test and
  names the header. The headers today:
  - **Malts:** `Name`, `FGDB (%)`, `Colour (°L)`.
  - **Hops:** `Name`, `Alpha acid (%)`.
  - **Yeasts:** `Name`, `Lab`, `Product code`, `Ale / Lager`,
    `Attenuation (%)`, `Lab temp low (°F)`, `Lab temp high (°F)`.
- **Field names match the recipe state,** so the picker item can copy them
  straight across: malt `fgdb`, `colorL`; hop `alphaAcidFraction`; yeast
  `type` as `'ale'` or `'lager'` (lower case, like `yeast.type` in state),
  `apparentAttenuation`, `labTempLowF`, `labTempHighF`, plus `name`, `lab`
  and `productCode`.
- **Required numbers** are the ones the app will fill in: FGDB, colour,
  alpha, attenuation, and yeast type. The lab temperature range is guidance.
  It may be blank as a pair (every row has one today); if one end is given,
  both are required and low ≤ high. Zero is a legitimate FGDB and colour:
  Rice Hulls is 0% and 0 °L.
- **The copy's text layout** is one ingredient per line, keys in a fixed
  order, so a changed number is one changed line in the diff (L2, L8).
- **Values.** A required cell holding a formula is read by its stored result.
  Every required cell is a plain value today.
- **Source row numbers.** Report failures with the workbook's own row
  number, the one the owner sees in Excel.
- **The spreadsheet reader** is `exceljs` 4, which the spec session used
  throughout. There is no Python on this machine. Writing through Excel's
  own automation from PowerShell failed with "Specified cast is not valid"
  on text cells, for no cause found. This item only reads, and `exceljs`
  reads the Excel-saved workbook reliably.
- **Owner-facing language.** In the report, say "the app's copy of your
  ingredient list", not the file name.
- **The next item's premise was wrong.** The recipe stores a yeast only as
  ale/lager plus the pitch-rate choice, with no strain name. So the
  searchable-boxes item needs a saved-format change for yeast. The roadmap
  row was corrected in this spec's commit; nothing for the builder here.

## Recorded failure (filled in by the builder)

`npx vitest run test/ingredients.test.js` in `apps/recipe`, before the reader,
the refresh tool and the copy existed (2026-09-23), trimmed:

```
 ❯ test/ingredients.test.js (4 tests | 4 failed)
   × the app's ingredient list is exactly the workbook's: every row, every number, in the workbook's order
     → Cannot find module '../scripts/ingredient-workbook.js' imported from '…/apps/recipe/test/ingredients.test.js'
   × a row added, removed or renamed, or a number changed, in the workbook but not the copy fails the match and names the row
     → Cannot find module '../scripts/ingredient-workbook.js' …
   × an unusable workbook is refused, naming the sheet and row: duplicate name, blank or non-number required number, percentage outside 0–100%, negative colour, yeast neither Ale nor Lager, lab range inverted
     → Cannot find module '../scripts/ingredient-workbook.js' …
   × refreshing twice gives an identical copy
     → Cannot find module '../scripts/ingredient-workbook.js' …
      Tests  4 failed (4)
```

## Builder's notes — choices the sentences did not make (filled in by the builder)

Claims for the inspector to verify.

1. **A blank lab range is `null` in the copy.** JSON has no NaN; the copy is
   reference data, not recipe state, so SPEC rule 13's NaN round-trip does
   not apply. Every yeast has both ends today, so no `null` is in the copy.
2. **Ale / Lager** is accepted whatever its capitals and surrounding spaces,
   and carried lower case (`'ale'`, `'lager'`), like `yeast.type` in state.
   Anything else, including blank, is refused.
3. **Names** are trimmed. Duplicates are compared trimmed and lower-cased,
   **within one sheet**; a malt and a hop may share a name. The second row is
   the one refused, naming the first.
4. **A row with no name is skipped** even if it has numbers (L3: "every row
   with a name"); it is not refused. S3's list does not name it.
5. **Lab and product code** are text, trimmed, `""` when blank, and never
   required. A number typed there would be carried as its text. Every
   product code is a text cell today (checked).
6. **Bounds.** A percentage is refused outside 0–1 as stored (0–100 %),
   both ends allowed: Rice Hulls 0, Lactose and Blanc Soft Candi Sugar 1.
   Colour: refused below 0, no upper bound. Lab temperatures: any number, no
   plausibility bound; a range with only one end is refused (the spec
   session's note), as is low above high. Low equal to high is allowed.
7. **Not a number** includes text, an Excel error value (#DIV/0!), a date
   and true/false. A formula is read by its stored result; a formula with
   no stored result counts as blank.
8. **A missing header or sheet** is refused, naming the sheet and the header;
   every problem is gathered, not only the first.
9. **Matching.** The comparison pairs rows by exact name, reports a row on one
   side only, and each field that differs with both values. An order-only
   difference is reported (with the row) once nothing else differs on that
   sheet. A key the copy carries that the workbook row does not is reported.
10. **Line endings.** The copy is written with LF and a final newline. This
    machine has `core.autocrlf=true`, which can check the copy out as CRLF;
    the test compares the committed LF bytes by normalising CRLF to LF when
    reading the working file. No `.gitattributes` change (not a named file).
11. **The refresh tool** takes an optional workbook path and copy path (the
    far end used a scratch workbook); on a refused workbook it prints every
    problem, writes nothing and exits with an error. `npm run
    refresh-ingredients --workspace @brew/recipe` runs it on the defaults.
12. **Extra pins in scenario 1,** read by hand from the workbook and this
    file, not from the reader: 42 / 43 / 32 rows; Bravo 0.144; Rice Hulls 0
    and 0 °L; the first malt and yeast rows in full; Hallertau Mittelfrüh and
    WLP4061 Rhine Kölsch Ale spelled with their accents. A reader bug shared
    by the refresh and the comparison would still fail these.
13. **Hooks.** `pre-commit` runs the suite once when an ingredient file is
    staged; if an A/B file is staged too, the existing A/B block runs it.
    `commit-msg` reuses the A/B refusal text for the refresh tool and the
    test (both are Tier B under L6).
14. **Dependency.** `exceljs` 4.4.0, a devDependency of `apps/recipe`; the
    lock file grows by its dependency tree. It brings one new moderate
    advisory, `uuid` (GHSA-w5hq-g745-h8pq, a bounds check when a caller
    passes its own buffer); npm's only offered fix is a downgrade to exceljs
    3. Development only: the built app is byte-identical to `main`'s. The
    existing roadmap line "`npm audit fix`" covers dev advisories.
15. **Far end, done 2026-09-23.** (1–2) `main` built in a separate worktree
    and the branch built here: all five files in `dist/` byte-identical
    (SHA-256), bundle `index-CQcNJ7jR.js`, the name the live site serves.
    A first worktree build differed in `index.html` alone, by line endings
    only: the fresh worktree had checked `index.html` out as CRLF; rebuilt
    from an LF checkout, identical. (3) The built app with storage cleared:
    the default recipe and every card, no console errors; a saved recipe
    (pre-boil 8, named) loaded after a reload with its values; storage then
    restored. (4) Bravo alpha 0.144 → 0.147 in a scratch copy of the
    workbook, refreshed: exactly one changed line in the copy; the test then
    failed with "Hops row 5 (Bravo): alphaAcidFraction is 0.144 in the
    workbook, 0.147 in the app's copy". Both discarded; the committed
    workbook unchanged. (A first attempt edited the price column by mistake:
    the copy did not change, as L4 intends.)
16. **Noticed, to the roadmap (Tier D):** CLAUDE.md's Hooks paragraph does not
    yet mention the ingredient files; `data/README.md` still says nothing in
    the app reads the workbook and points to this item's removed roadmap row.
