# Water program — the plan for bringing Brew Water Chem into Brew Design

Status: plan agreed 2026-09-23 ("agree to all else", after WP6 was reworked
with the owner). This is not an item to build: each step below gets its own
scope table in `docs/items/` when its turn comes, and those tables may refine
anything here. The decisions record what the owner settled so a later spec
session does not re-open them.

## Where it starts

- **The math is already here.** `packages/engine/src/water/*` is line for
  line Brew Water Chem's `src/chemistry/*` (only import paths and comments
  differ; the water app's chemistry last changed 2026-06-08), with 135 engine
  tests including the reference-batch parity.
- **What is left is the screens:** about 1,800 lines over the water app's
  five tabs (Water In, Style, Recipe, Batch Sheet, Notes). The water app
  holds one treated volume (default Pro, 10 bbl) and saves nothing.
- **Mash pH is not predicted anywhere.** The water app's Notes tab says v1.2
  does not predict mash pH: that needs the grain bill ("v2 with the
  Kaiser/Troester model"). It doses acid against alkalinity, treating
  phosphoric as monoprotic at mash pH 5.4. Brew Design has the grain bill.

## Order (WP1)

Each step is its own item, commit and deploy; each needs the one before.

1. **Phone width** — `docs/items/phone-width.md`, agreed.
2. **Brewery defaults** — the brewery's own figures fill a new recipe.
3. **Water tab** — the water app's screens as they are, one typed volume.
4. **Water linked to the recipe** — the treatment choice and the brewery
   setup; saved with the recipe (saved format version 5).
5. **Mash pH from the grain bill** — the pH model (Tier A).
6. **Water on the printed sheet** — the salt and acid additions.

## Decisions — agreed

| id | Question | Decision | Rule |
|---|---|---|---|
| WP1 | Order | As above | Each step deploys alone and needs the one before; brewery defaults come first because the water volumes build on them |
| WP2 | The standalone Brew Water Chem site | Stays live and unchanged as the free public calculator; pointed at Brew Design once the water tab does everything it does | It is public and in use; new work goes in one place |
| WP3 | What the brewery defaults hold | Batch (fermentation) volume, pre-boil volume, boil-off (evaporation) rate, boil time, the three measurement temperatures, brewhouse efficiency, Home/Pro. The water setup (WP10) is added in step 4. Mash water is not a brewery figure | Equipment, not beer; mash water depends on the grain bill |
| WP4 | How the defaults behave | Kept in this browser apart from recipes; a new recipe and Reset start from them; changing them never changes a recipe already made; set on the Options tab, from the recipe on screen or typed | A recipe keeps its own copy — the same rule as ingredient picks |
| WP5 | Between devices | Browser only at first; a "brewery file" can come later | The site has no server |
| WP6a | Where the additions go | The brewer picks per recipe: mash only; mash and kettle; or the hot-liquor tank (HLT). The starting choice comes from the brewery defaults | It is how the brewery works, not a property of the beer |
| WP6b | What each choice calculates | Only what does not depend on lauter mixing (poor mixing in the lauter means no complete dilution can be assumed): the mash water profile and mash pH (the mash is well mixed), and the additions. **Mash only:** salts and acid for the mash water; the sparge noted as untreated. **Mash and kettle:** as mash only, plus kettle salts equal to what the sparge water would have needed to reach the target — salts are conserved, so this assumes no mixing. **HLT:** salts and acid for the treated volume; the mash draws treated water; after the top-up, the sparge liquor's treated share is shown (a heated tank is well mixed) — e.g. treat 14 gal, mash in 8, 6 left, top up to 10 with 4 untreated: 6/10 = 60 %; a warning when the mash water exceeds the treated volume. **No predicted kettle mineral figure on any choice.** Every profile shown is labelled as the treated water, not the wort | A predicted kettle figure would be a guess about the lauter, and a brewer would act on it |
| WP6c | Sparge acidification | Not in this program; a roadmap line | Not needed for mash pH or flavour minerals |
| WP6d | Step 3's volume | One typed volume, as the water app has today (the HLT's first fill, or the mash water); the choices arrive in step 4 | Port first, change behaviour second |
| WP7 | Water style target | Chosen on its own from the water app's 13 style families | The recipe's style is free text; the families are defined targets |
| WP8 | Mash pH model | Troester/Kaiser, with published constants cited in the engine and each pinned by hand-worked values; the ingredient workbook gains a malt-type column (base, crystal, roast, acid malt) and optional lab-measured distilled-water pH and buffering columns that override the model | Every constant needs a rule and a pin |
| WP9 | Checking the model | Against the owner's logged mash pH: his batch logs note it, always on a cooled sample (the basis of the published malt figures too) | A model with nothing outside it to check against is the shared-misreading risk |
| WP11 | Grain absorption default | 0.5 qt of water per pound of grain (Palmer), changeable per brewery | The owner, 2026-09-23; a published figure, cited and hand-pinned in step 4 |
| WP10 | Defaults now or growing | Growing: step 2 holds WP3's figures; step 4 adds the setup its calculation needs — number of vessels (one, two or three), sparge method (none/full-volume, batch, fly), the usual treatment choice, the HLT's treated volume and top-up level, grain absorption, and the water kept in the mash tun — to the brewery defaults and the recipe together | Each figure arrives with the calculation that uses it |

## Brewery figures, as the owner describes his system (for step 4)

- **HLT:** treats the first fill (14 gal), mashes in with 8, tops up with
  untreated water to 10 gal for the sparge, heated to 170 °F.
- **Water kept in the mash tun:** about 2 gal, deliberately left above the
  grain bed to keep the flow through it until the kettle is full — not a
  loss in his words; name it as he does.
- **Grain absorption (WP11):** the owner, 2026-09-23: "Palmer mentions 0.5
  qt of water per pound of grain for absorption. lets use that." The default
  is 0.5 qt/lb (Palmer, *How to Brew*), 0.125 gal/lb by the definitional
  4 qt/gal, a brewery figure the brewer can change. It is a published
  figure, so it needs its citation beside it and a hand-worked pin (step 4).
  His logs can refine it: total water in minus pre-boil collected, over two
  batches of different grain weight, splits into a per-pound part and a
  fixed part.
- **Noted for step 4:** his "about 18 gal total for a 16 gal full kettle"
  with 2 gal kept in the tun leaves nothing for grain absorption; at 0.5
  qt/lb a 29 lb bill absorbs about 3.6 gal, so the app would give about
  21.6 gal. His logs will show which; the step 4 table puts it to him.
- Sparge method, number of vessels and evaporation rate raised by the owner
  (evaporation rate = the boil-off rate, already in WP3).
