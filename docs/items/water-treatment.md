# Water treatment choice — Tier A + B

Status: agreed 2026-10-02 ("agree to all else", Q3 changed to 0.1 qt/lb),
not started. Written by the S3 session; to be built in batch S4 (docs/ROADMAP.md, Sessions) as the first of
three items: **Water treatment choice** (this file), then **Water saved with
the recipe** (`docs/items/water-saved.md`), then **Water on the printed
sheet** (`docs/items/water-print-sheet.md`). Water program step 4
(`docs/items/water-program.md`, WP6a, WP6b, WP10, WP11). Revised with the
owner's answers of 2026-09-24/25: the kettle is a salt balance (Q7), kettle
salts are available with either treatment (A), the tank's top-up is typed
and the tank is never emptied into the mash tun (B), what the sparge does
not draw is left in the tank and discarded (C).

## Why

S3 put Brew Water Chem's screens in Brew Design with one typed volume. A
brewer does not treat "a volume": one treats the mash water; another treats
the hot-liquor tank's first fill, mashes in from it, tops it up untreated and
sparges from it; either may add salts to the kettle to bring the whole water
to the target. The additions depend on which, and on the brewery's vessels
and losses. This item builds it, with the water volumes worked out by the
engine from the recipe.

## Sentences — what must be true afterwards

- **WT-S1** The Water tab asks where the water is treated — the mash water, or the hot-liquor tank's first fill — and, with either, whether salts also go in the kettle; it works the additions out for that choice.
- **WT-S2** The water volumes come from the recipe: the grain absorbs its weight times the absorption rate (0.1 qt/lb built in); the sparge water is what the kettle needs before the boil, plus the grain's absorption and the water kept in the mash tun, less the mash water; the total water is the mash water plus the sparge water. The Water tab shows them.
- **WT-S3** Mash water treated: the salts and acid are for the recipe's mash water; the sparge water is shown as untreated.
- **WT-S4** Hot-liquor tank treated: the salts and acid are for the typed treated volume; the mash draws its water from it; the tank is then topped up with untreated water to the typed top-up level and the sparge draws the sparge water from it. The Water tab shows the sparge liquor's treated share (treated volume less mash water, over the top-up level), and what is left in the tank after the sparge — its volume and the salts in it — as not used. A warning shows when the mash water is more than the treated volume, and when the sparge water is more than the top-up level.
- **WT-S5** Salts in the kettle, with either treatment: every gram of salt in the mash water reaches the kettle (the lauter is not assumed to mix); the sparge brings the salts it carries; each kettle salt is what the whole water (mash plus sparge) needs to reach the target, less what reaches the kettle from the mash and the sparge, never below zero. No acid goes in the kettle.
- **WT-S6** No choice shows a predicted kettle or wort mineral figure; every profile shown is labelled as the treated water.
- **WT-S7** The brewery setup the sums need — the number of vessels, the sparge method, the tank's treated volume and top-up level, the absorption rate, and the water kept in the mash tun — is set with the treatment choice on the Water tab, for this recipe. A choice the setup cannot use is not offered.
- **WT-S8** The typed water volume is gone. Everything else on the Water tab works as in S3, and the entries are still not saved (the next item saves them).
- **WT-S9** A blank figure the sums need (a volume, the absorption rate, a treated volume, the top-up level) blanks the figures that need it, shows "—", and the tab names it.

## Decisions — agreed

| id | Question | Decision | Rule |
|---|---|---|---|
| M1 | Builder model | Opus, high effort | The Models rule's default (2026-09-23) |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default |
| Q1 | Step 4 as one item or two | Two, plus the printed sheet: (1) the treatment choice and its volumes, kept while the page is open (this item); (2) saving the water with the recipe and in the brewery's figures; (3) the sheet. S4 builds all three, one deploy | Numbers before persistence; the saved format changes once, in item 2 |
| Q2 | Which pre-boil volume the water sums use | Its 60 °F figure — the one the engine already uses — because water is drawn and measured cold; the hot reading is a few percent larger | The engine's one reference (SPEC 11); mash water is used as entered, as today |
| Q3 | Grain absorption | Built in 0.1 qt/lb, 0.025 gal/lb by the definitional 4 qt/gal; a brewery figure the brewer sets from their own logs (item 2). Supersedes WP11's 0.5 qt/lb (Palmer), which the owner judged far too high; he checks it on his next brew (total water in less pre-boil collected), and the comment beside the figure says so | The owner's figure, 2026-10-02; hand-pinned |
| Q4 | Water kept in the mash tun | Built in 0 gal (none assumed until the brewery sets it); counted as water that does not reach the kettle, in the sparge sum | Named as the owner names it |
| Q5 | What the number of vessels does | Limits the choices: one vessel means no sparge, so the mash water is the only treatment (all the water in the mash); two or three vessels offer both treatments. It changes no number by itself | WP10: each figure arrives with the calculation that uses it |
| Q6 | What the sparge method does | None (full volume): no sparge water — the mash water is all the water, and a warning shows when the recipe's mash water differs from the total the sums need; salts in the kettle then only make up any shortfall of the brewer's own mash amounts. Batch and fly: the same sums; recorded now for sparge acidification (S5) | WP6c: acid for the sparge comes later |
| Q7 | Kettle salts | A salt balance, assuming poor lauter mixing (WT-S5): each kettle salt = the whole water's need − what reaches the kettle from the mash − what the sparge carries, never below zero; no acid. The owner, 2026-09-24 | WP6b: salts are conserved; no mixing is assumed |
| A | Salts in the kettle with which treatment | With either (the owner, 2026-09-25): a switch beside the treatment choice, not a third choice | The owner's answer |
| B | The tank's top-up level | Typed, a brewery figure; the tank is never emptied into the mash tun, so the sparge draws only the sparge water it needs (the owner, 2026-09-25) | The owner's answer |
| C | Treated water the sparge does not draw | Left in the tank and discarded; shown as "left in the tank, not used", with its salts, and never counted as reaching the kettle (the owner, 2026-09-25) | The owner's answer |
| D | The tank treatment in Pro | Offered in both Home and Pro: Home/Pro sets units only (W-S4), and a Pro brewery on reverse-osmosis water may treat its tank. It is never the built-in choice (Q9), so a brewery that does not treat its tank never sees its figures. Agreed 2026-10-02 | Home/Pro changes units, not what is calculated |
| Q8 | Acid in the hot-liquor tank | Yes, the acid for the treated volume goes in the tank (WP6b), so the sparge liquor's treated share carries acid too; a note says so | WP6b as agreed |
| Q9 | Built-in treatment choice and setup | Mash water treated; no kettle salts; three vessels; batch sparge; the tank's treated volume and top-up level blank (the tank choice names them until set) | A new recipe computes without a figure nobody decided |
| Q10 | Where the setup is set | On the Salts & Acid screen, a "Where the water goes" card in place of the Mash Volume card: the treatment, the kettle switch, the setup figures, then the volumes. The brewery's own figures on Options → My brewery come with item 2 | The recipe's copy beside its figures |
| K | Silent properties | **Ordering:** as in S3, changing the choice or a figure that changes a treated volume returns the brewer's own salt and acid amounts to the recommendation. **Durability:** none yet — item 2 saves. **Idempotence:** the sums are pure; the same recipe gives the same volumes. **Multi-tab, storage, migration:** none in this item | — |

### Worked example (a made-up brewery; the scenario pins)

20 lb grain, pre-boil 14 gal at 60 °F, mash water 7 gal, 0.1 qt/lb, 1 gal
kept in the tun; the recommendation for the water and style is 1.2 g/gal
gypsum.

- Absorption 20 × 0.025 = 0.5 gal; sparge 14 + 0.5 + 1 − 7 = 8.5 gal; total 15.5 gal; whole-water need 1.2 × 15.5 = 18.6 g.
- Mash water treated: mash 1.2 × 7 = 8.4 g. With kettle salts: 18.6 − 8.4 − 0 = 10.2 g.
- Tank treated, 12 gal, topped up to 12 gal: tank 1.2 × 12 = 14.4 g; the mash draws 7/12 of it, 8.4 g; 5 gal and 6.0 g stay, topped up to 12 gal (treated share 5/12 = 42 %, 0.5 g/gal); the sparge draws 8.5 gal carrying 4.25 g; 3.5 gal and 1.75 g are left in the tank, not used. With kettle salts: 18.6 − 8.4 − 4.25 = 5.95 g.

## Scenarios — to be written first, must fail before

`packages/engine/test/water/volumes.test.js` and `apps/recipe/test/water-treatment.test.js`:
1. *the water volumes come from the recipe* — WT-S2, Q2–Q4; the worked example by hand: 0.5, 8.5, 15.5 gal.
2. *treating the mash water treats the recipe's mash water* — WT-S3: the additions equal the S3 figures for the recipe's mash water.
3. *the hot-liquor tank treats its first fill, and the sparge draws only what it needs* — WT-S4, B, C, Q8: 14.4 g tank, 8.4 g mash, 5/12 share, 4.25 g carried, 3.5 gal and 1.75 g left, by hand; the two warnings.
4. *salts in the kettle bring the whole water to the target* — WT-S5, Q7, A: 10.2 g after the mash; 5.95 g after the tank; never below zero; no kettle acid.
5. *no choice shows a kettle mineral figure* — WT-S6.
6. *the setup limits the choices* — WT-S7, Q5, Q6, D.
7. *a blank figure the sums need blanks what needs it and is named* — WT-S9.

## Far end — on the built app

1. The worked example typed in: every volume, amount, share and the left-over tank figures as worked by hand, Home and Pro.
2. Mash water treated at the recipe's mash water gives the same additions as S3's typed volume at that figure.
3. Kettle salts with each treatment; no kettle acid; no kettle profile.
4. One vessel offers the mash water only; no sparge warns when the mash water is short; the sparge more than the top-up level warns.
5. No sideways scroll at 375 px; no console errors.

## Notes for the builder

- The engine gains the water-volume sums (grain absorption, sparge, total, the tank's treated share, what the sparge carries and what is left) and the kettle salt balance, as pure functions with the owner's 0.1 qt/lb cited as his figure and hand-pinned (Tier A). The whole-water need is the solver run for the total water volume. `computeWater` gains the treatment choice and reads the recipe's grain weight, mash water and 60 °F pre-boil volume; the typed volume goes.
- Files likely touched: `packages/engine/src/water/volumes.js` (new), `index.js`, engine test; `apps/recipe/src/{selectors,water-state,display}.js`, `App.jsx`, `components/water/*`, the new app test, `SPEC.md` (rule 8's water sentence), `docs/TEST_COVERAGE.md`.

## Recorded failure (filled in by the builder)

## Builder's notes — choices the sentences did not make (filled in by the builder)
