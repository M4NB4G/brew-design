# Brew Design — specification

The rules every change is checked against. The source of truth for all math is
the reference spreadsheet `Experiments_Are_Fun_Recipe_Designer_Rev_3.xlsm`
(Persyn Chemical Engineering). It is not in the repo; its cached values are
pinned by the golden-master tests.

## 1. Engine (`packages/engine`)

1. Pure functions only. No DOM, no network, no I/O, no global state.
2. Every constant is reproduced exactly from the spreadsheet / Phase 1 Port
   Spec. Do not round, simplify, or "improve" a constant.
   Deviation (2026-09-21, the owner, as the spreadsheet's author): the 400B
   starter band serves 800-1000 billion cells inclusive from the pack alone,
   and above 1000 with one extra 200B pack, superseding Rev 3's strict
   boundary at 900 (`packages/engine/src/starter.js`).
3. When faithful transcription produces a result that looks wrong, keep it and
   add a `// FLAG:` comment saying what and why. Never silently fix.
4. Golden-master tolerances are fixed and never loosened:
   SG abs 1e-6 · Plato / SRM / IBU / utilization / tempFactor 1e-4 ·
   integers exact · starter volume and DME 1e-2.
5. The public surface is `src/index.js` only. Nothing imports engine internals.
6. `computeGrist` / `computeHops` take volumes at the 60 °F reference; the
   caller corrects first. `mashWaterGal` is used as entered — the 2.055 qt→lb
   constant embeds its own density assumption.

## 2. App (`apps/recipe`)

7. **No brewing math in the app.** Every computed number comes from
   `@brew/engine`. A formula like `46 * fgdb`, a Tinseth term, or an ABV
   expression anywhere in `apps/` is a defect.
8. **One canonical state object** in engine units: US gal, lb, oz, °F, SG,
   billion cells, L. State never holds display units.
9. **Convert only at the edges.** `display.js` is the only place that converts
   between canonical and display units, using engine constants and functions
   (`GALLONS_PER_BBL`, `OZ_PER_LB`, `G_PER_OZ`, `sgToPlato`, `platoToSg`, …).
   No new conversion constants anywhere in the app.
10. `selectors.js` is the only place the app calls engine compute functions.
    The UI renders from `computeRecipe(state)`; tests assert through it.
11. `toReferenceVolume(measuredGal, kind, measurementTempF)` is the
    volume-correction slot. Pre-boil, post-boil, and ferment volumes route
    through it and reach the engine corrected to 60 °F by
    `correctVolumeToRef` at the measurement temperature of their kind
    (`measurementTempF[kind]`, °F, held in the recipe state, 60 by default);
    mash water does not. A temperature the engine cannot correct — cleared
    (NaN) or outside its density table (0–100 °C) — yields a NaN volume;
    nothing throws, and no clamping or fallback to the measured volume.
12. The smoke test (`apps/recipe/test/smoke.test.js`) pins the reference
    recipe through the UI's own selectors. Its assertions and tolerances
    never change; its reference state is a canonical state and gains a field
    only when the canonical state does, at the value that leaves every pinned
    number the same.
13. Persisted state is the canonical state, under one key, in one JSON
    document carrying a schema version (2). A version-1 document — saved
    before the measurement temperatures existed — loads as the same recipe
    with the three at 60 °F and is saved back as version 2. Unreadable data,
    any other version, or unavailable storage yields the defaults and never
    throws. A cleared field (NaN) round-trips as NaN, never as 0 or null.

### Display units

| Quantity | Home | Pro |
|---|---|---|
| Volume | gal | bbl (1 bbl = 31 gal) |
| Malt weight | lb | lb |
| Hop weight | oz | lb |
| Gravity | SG | °P default, SG optional |
| Mash Rv / Mash R | qt/lb · lb/lb | same |
| Pitch rate | billion/L/°P | same |
| Cells per batch | billion | trillion (= billion / 1000) |
| Starter volume | L | L |
| Dry-hop rate | oz/gal | lb/bbl |
| Temperature | °F | °F |
| FGDB, efficiency, attenuation, hop alpha | shown as %; state holds the fraction | same |

## 3. Design

14. `apps/recipe/src/components/shared/styles.js` is the only styling source.
    No hex or rgb literals outside it, except data-driven colors (the SRM
    swatch). The visual language matches Brew Water Chem.
15. Read-only computed values render as plain text, never as an input box.

## 4. Verification

```
npm test --workspace @brew/engine
npm test --workspace @brew/recipe
npm run build --workspace @brew/recipe
```
