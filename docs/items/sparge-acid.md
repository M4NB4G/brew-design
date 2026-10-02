# Sparge acidification — Tier A + B

Status: agreed 2026-10-02 ("agree to all"), not started. Written by the
S4 session; to be built in batch S5
after **Mash pH from the grain bill** (`docs/items/mash-ph.md`). Left out of
the water program (WP6c) and recorded on the roadmap.

## Why

Alkaline sparge water raises the pH of the grain bed late in the lauter and
extracts tannins. S4 shows the sparge water and, with the tank, how much of
it is treated, but no acid is worked out for it. A brewer acidifies the
sparge liquor to a target pH; the acid depends on the water's alkalinity and
pH and on how much sparge water there is — figures the Water tab now has.

## Sentences — what must be true afterwards

- **SA-S1** A switch on the Water tab, "Acidify the sparge water", off unless turned on; on, the Water tab gives the acid for the sparge water to bring it to the target pH, in the acid the brewer picks for it.
- **SA-S2** Mash water treated: the sparge water is the source water, untreated; the acid is for its alkalinity and pH at the sparge volume (the sparge water the brewer types, S4b A1).
- **SA-S3** Hot-liquor tank treated: the acid goes in the tank after the top-up, for the liquor the sparge draws (the treated share already carries the mash's acid), as SA-Q4 decides.
- **SA-S4** The sparge acid never changes the mash figures: not the treated profile, not the predicted mash pH, not the kettle salts.
- **SA-S5** The printed sheet lists the sparge acid under "Sparge" (or "Hot-liquor tank, after the top-up").
- **SA-S6** The switch, the target and the acid picked are saved with the recipe; a recipe saved before them loads with the switch off.
- **SA-S7** A blank figure the sum needs (the sparge water, the source alkalinity or pH) blanks the sparge acid and is named.

## Decisions — agreed

| id | Question | Decision | Rule |
|---|---|---|---|
| M1 | Builder model | Opus, high effort | The Models rule's default |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default |
| SA-Q1 | What the sparge acid aims at | A target pH for the sparge water, typed by the brewer, built in at the figure Palmer & Kaminski give for sparge water (below pH 6), cited beside it | The brewer's own target; a published starting point |
| SA-Q2 | How the acid is worked out | From the water's alkalinity and pH by the carbonate balance (the published carbonic acid constants), the share of alkalinity the acid must neutralise to reach the target pH, then the acid's strength as today. Each constant cited and hand-pinned | A pH target needs the carbonate chemistry; the acid strengths are already in the engine |
| SA-Q3 | Which acid | Picked on its own for the sparge (built in: the same acid as the mash); liquid acids only — acidulated malt is not offered for sparge water | Many brewers use phosphoric in the sparge and lactic in the mash; malt cannot go in water |
| SA-Q4 | The tank: what the sparge acid is for | The topped-up tank, before the sparge draws: its alkalinity and pH are the mix of the treated water the mash left and the untreated top-up (the tank is well mixed); the acid is for the volume in the tank at the top-up level, so the liquor left over carries its share, shown with "left in the tank, not used" | WP6b: a heated tank is well mixed; nothing assumed about the lauter |
| SA-Q5 | The source water's pH | The water report's pH; blank pH blanks the sparge acid (as today a blank test result blanks what needs it) | S3's W5: a blank is never a number nobody entered |
| SA-Q6 | No sparge (full volume), one vessel | The switch is not offered | S4's rule: a choice the setup cannot use is not offered |
| SA-Q7 | Brewery figures | The switch's usual setting, the usual target and the usual sparge acid are brewery figures a new recipe copies, as S4's water setup | S4's WS-S2 |
| SA-Q8 | Saved format | The recipe format moves once in S5 for both items (6): malt types and lab figures, and the sparge switch, target and acid; the brewery format to 3 | One format change per batch where it can be |
| SA-Q9 | Is the sparge acid part of the "customized" reset? | Yes: changing the source water, the sparge volume (through the recipe) or the target returns a sparge acid amount the brewer typed to the recommendation, as the mash acid does today | S3's K ordering |
| K | Silent properties | **Schema migration:** older recipes load with the switch off (SA-S6). **Ordering:** SA-Q9. **Idempotence:** pure sums. **Multi-tab, storage disabled:** as today | — |

## Scenarios — to be written first, must fail before

`packages/engine/test/water/sparge-acid.test.js`: *the acid brings the
sparge water to the target pH* (a worked example by hand: alkalinity, pH,
volume, target → mEq → mL of each liquid acid); *the tank's topped-up mix*.
`apps/recipe/test/sparge-acid.test.js`: *the switch gives the sparge acid
for the chosen treatment*; *the sparge acid never changes the mash
figures*; *the setup limits the choice*; *saved with the recipe; an older
recipe loads with it off*; *a blank figure blanks it and is named*;
*the printed sheet lists it*.

## Notes for the builder

- Files likely touched: `packages/engine/src/water/sparge-acid.js` (new),
  `index.js`; `apps/recipe/src/{selectors,water-state,state,persistence}.js`,
  `components/water/{WaterGoesCard,SaltsAcidScreen}.jsx`,
  `components/OptionsSection.jsx`, `components/recipe-sheet-data.js`,
  `RecipeSheet.jsx`, `SPEC.md`, `docs/TEST_COVERAGE.md`.
