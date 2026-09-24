# Ingredient master list

`Brew Design Ingredients.xlsx` is the owner's master list of malts, hops and
yeast strains: the list the app's type-to-search ingredient boxes offer,
and the numbers picking one fills in (malts: FGDB and colour; hops: alpha
acid; yeasts: ale/lager, with the lab range and attenuation shown on the
Yeast card). The owner edits it in Excel. Its Read Me tab explains the
columns, units and legend.

## How it reaches the app

The app never opens the workbook. It reads a copy,
`apps/recipe/src/ingredients.json`, which the refresh tool writes from it:

```
npm run refresh-ingredients --workspace @brew/recipe
```

The refresh refuses an unusable workbook (a duplicate name, a blank or
non-number required figure, a percentage outside 0–100 %, and so on),
naming the sheet and row, and then writes nothing.
`apps/recipe/test/ingredients.test.js` fails, naming the row, whenever the
copy and the workbook disagree, so an edited workbook committed without
its refreshed copy cannot pass the suite. A workbook edit committed with
its refreshed copy is Tier D (CLAUDE.md, Ingredient data; SPEC.md rule 16).
Picking an ingredient copies its numbers into the recipe, so editing the
workbook never changes a recipe already made.

## Where the seed came from (2026-09-23)

- **Malts and hops:** the Costs Ref sheet in 50 of the owner's recipe
  workbooks (OneDrive › Brewing Stuff › Recipes). Each workbook carries its
  own copy of Costs Ref, and the copies had drifted.
- **Yeasts:** the yeast block of each recipe's Grist and Pitch sheet: brand,
  strain, ale/lager, apparent attenuation, initial fermentation temperature.
  Costs Ref prices yeast by lab and pack only, so it has no strain list.
- **Where copies disagreed:** the value the owner entered most often; a tie
  goes to the most recently saved workbook. Prices come from the most
  recently saved workbook. Obvious spelling variants of one ingredient were
  merged into one row. Every disagreement and every merge is listed, with
  all the values seen, on the workbook's Review tab.
- **Yeast attenuation** is the target the owner entered in his recipes, not
  the lab's specification; every yeast row starts as Status "Check", and the
  lab temperature range is left blank to fill in.
- The recipe workbooks were read, never changed. The file was checked in
  Excel: 91 formulas, no errors.

## The owner's review (2026-09-23)

Every Review-tab item was decided by the owner and applied to the sheets;
the Review tab stays as the record. Numbers changed by those decisions:
Aromatic Malt FGDB 70% → 79% (Briess); Midnight Wheat FGDB 0% → 75%
(tertiary sources; Briess publishes no FGDB); Raw Wheat 3.3 → 2.0 °L;
Bravo 14.2% → 14.4% alpha; Hallertau Mittelfrüh 4.2% → 2.9% alpha; Mount
Hood $23 → $2 per 2 oz. White Wheat is renamed White Wheat Malt, and a
duplicate Flaked Oats row (one workbook's lowercase spelling, same numbers)
is merged. The owner named the strains the recipes had left unnamed, filled
in every lab temperature range, and added seven strains (G01 Stefon,
L13 Global, WLP066 London Fog, and Fermentis W-34/70, S-04, US-05, K-97).
Rows the owner decided or sourced are Status "Confirmed". Checked in Excel:
90 formulas, no errors.
