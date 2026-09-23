# Ingredient master list

`Brew Design Ingredients.xlsx` is the owner's master list of malts, hops and
yeast strains: the list the app's type-to-search ingredient boxes will offer,
and the numbers picking one fills in (malts: FGDB and colour; hops: alpha
acid; yeasts: ale/lager and attenuation). The owner edits it in Excel. Its
Read Me tab explains the columns, units and legend.

**Nothing in the app reads it yet.** How it reaches the app, and the test
that fails when the app's list and this workbook disagree, are the scope of
the roadmap's "Ingredient list in the app" item. Until that lands, editing
this file changes no number anywhere.

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
