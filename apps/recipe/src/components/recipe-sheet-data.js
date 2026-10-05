// recipe-sheet-data.js
// The printed recipe sheet's text, shaped from the recipe and its derived
// values (computeRecipe's output) for RecipeSheet.jsx to lay out. Kept apart
// from the component so the suite, which has no DOM, can check what prints.
//
// Computes nothing: every number is a canonical recipe value or a derived
// value put through the display boundary (display.js) and the formatter
// (format.js), which prints a blank as "—". The literals below are display
// precision only.

import { REFERENCE_TEMP_F } from '@brew/engine';
import { testedRangeNote } from './water/tested-range-note.js';
import {
  resolveGravityUnit,
  gravityUnitLabel,
  gravityFromCanonical,
  volumeUnit,
  volumeFromCanonical,
  maltWeightUnit,
  hopWeightUnit,
  hopWeightFromCanonical,
  dryHopRateUnit,
  dryHopRateFromCanonical,
  cellsUnit,
  cellsFromCanonical,
  percentUnit,
  fractionToPercent,
  tempUnit,
  tempReadout,
  referenceTemp,
  mashRvUnit,
  mashRUnit,
  pitchRateUnit,
  starterVolumeUnit,
  saltUnit,
  liquidAcidUnit,
  acidMaltUnit,
  acidMaltFromCanonical,
} from '../display.js';
import { num, gravity } from '../format.js';
import { TEST_RESULT_KEYS } from '../water-state.js';
import {
  TREATMENT_LABELS,
  KETTLE_LABEL,
  KETTLE_CAVEAT,
  KETTLE_ASSUMPTION,
  KETTLE_BIAS_NOTE,
  KETTLE_HELD_NOTE,
} from './water/WaterGoesCard.jsx';

const YEAST_TYPE = { ale: 'Ale', lager: 'Lager' };
const YEAST_CHARACTER = { high: 'High', mod: 'Moderate', low: 'Low' };

// The sheet says "cells" once, in the label ("Cells (billion)"): the unit is
// the display file's first word. The screen's labels keep the whole.
const sheetCellsUnit = (mode) => cellsUnit(mode).split(' ')[0];

// Free text that is empty or only blanks prints nothing.
function text(value) {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

// A volume measured at the engine's reference temperature needs no note (P11);
// the note is in the screen's temperature unit (CT-S4).
function tempNote(tempF, temperatureUnit) {
  return tempF === REFERENCE_TEMP_F ? null : `measured at ${tempReadout(tempF, temperatureUnit)} ${tempUnit(temperatureUnit)}`;
}

export function recipeSheet({ recipe, derived, water, mode, proGravityUnit, temperatureUnit, today }) {
  const { grist, hops, pitchRate, cells, starter } = derived;
  const tUnit = tempUnit(temperatureUnit);
  const refTemp = referenceTemp(temperatureUnit);
  const temperature = (tempF) => tempReadout(tempF, temperatureUnit);
  const gu = resolveGravityUnit(mode, proGravityUnit);
  const vUnit = volumeUnit(mode);
  const vol = (gal) => num(volumeFromCanonical(gal, mode), mode === 'pro' ? 3 : 2);
  const hopWt = (oz) => num(hopWeightFromCanonical(oz, mode), mode === 'pro' ? 3 : 2);
  const pct = (fraction) => num(fractionToPercent(fraction), 1);
  const temps = recipe.measurementTempF;

  const meta = [];
  if (text(recipe.style)) meta.push({ label: 'Style', value: recipe.style });
  meta.push({ label: 'Batch volume', value: `${vol(recipe.fermentVolGal)} ${vUnit}` });
  meta.push({
    label: 'Date',
    value: today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  });

  return {
    title: text(recipe.name),
    meta,

    // The stats bar's six, in its order.
    headline: [
      { label: 'OG', value: gravity(gravityFromCanonical(grist.OG, gu), gu), unit: gravityUnitLabel(gu), measuredBox: true },
      { label: 'FG', value: gravity(gravityFromCanonical(grist.FG, gu), gu), unit: gravityUnitLabel(gu), measuredBox: true },
      { label: 'ABV', value: pct(grist.ABV), unit: percentUnit(), measuredBox: false },
      { label: 'SRM', value: num(grist.SRM, 1), unit: '', measuredBox: false },
      { label: 'IBU', value: num(hops.totalIBU, 0), unit: '', measuredBox: false },
      {
        label: 'Cells',
        value: num(cellsFromCanonical(cells, mode), mode === 'pro' ? 2 : 0),
        unit: sheetCellsUnit(mode),
        measuredBox: false,
      },
    ],

    grain: {
      weightUnit: maltWeightUnit(),
      rows: recipe.malts.map((m, i) => ({
        name: m.name,
        weight: num(m.weightLb, 2),
        share: pct(grist.perMalt[i]?.perMaltWeightFraction),
        yield: pct(m.fgdb),
        color: num(m.colorL, 1),
      })),
      efficiency: pct(recipe.efficiency),
    },

    // Each volume as the screen shows it: mash water, pre-boil and
    // fermentation as entered, post-boil at the 60 °F reference — or, when
    // the post-boil volume is measured at another temperature, as it will
    // read there, then its 60 °F figure (P1).
    volumes: {
      unit: vUnit,
      rows: [
        { key: 'mashWater', label: 'Mash water', value: vol(recipe.mashWaterGal), tempNote: null, measuredBox: true },
        // The Water tab's sparge water (SV-S1), as it shows it; no row with
        // no sparge (SV-S2) or when the sheet is given no water.
        ...(water && water.setup.spargeMethod !== 'none'
          ? [{ key: 'spargeWater', label: 'Sparge water', value: vol(water.volumes.spargeGal), tempNote: null, measuredBox: true }]
          : []),
        { key: 'preBoil', label: 'Pre-boil volume', value: vol(recipe.preBoilVolGal), tempNote: tempNote(temps?.preBoil, temperatureUnit), measuredBox: true },
        derived.postBoilMeasuredShown
          ? {
              key: 'postBoil',
              label: 'Post-boil volume',
              value: `${vol(derived.postBoilMeasuredGal)} (${vol(derived.postBoilVolGal)} at ${refTemp} ${tUnit})`,
              tempNote: tempNote(temps?.postBoil, temperatureUnit),
              measuredBox: true,
            }
          : {
              key: 'postBoil',
              label: `Post-boil volume at ${refTemp} ${tUnit}`,
              value: vol(derived.postBoilVolGal),
              tempNote: tempNote(temps?.postBoil, temperatureUnit),
              measuredBox: true,
            },
        { key: 'ferment', label: 'Fermentation volume', value: vol(recipe.fermentVolGal), tempNote: tempNote(temps?.ferment, temperatureUnit), measuredBox: true },
      ],
      boilTime: num(recipe.boilTimeMin, 0),
      boilOff: vol(recipe.boilOffRateGalPerHr),
      mashRv: num(grist.mashRv, 2),
      mashRvUnit: mashRvUnit(),
      mashR: num(grist.mashR, 2),
      mashRUnit: mashRUnit(),
    },

    hops: {
      weightUnit: hopWeightUnit(mode),
      tempUnit: tUnit,
      kettle: recipe.kettleAdditions.map((a, i) => ({
        name: a.name,
        time: num(a.timeMin, 0),
        temp: temperature(a.wortTempF),
        weight: hopWt(a.weightOz),
        alpha: pct(a.alphaAcidFraction),
        ibu: num(hops.additions[i]?.ibu, 1),
      })),
      // The engine rounds the sum of the unrounded additions; the sheet
      // prints that total, not a sum of the printed parts.
      totalIbu: num(hops.totalIBU, 0),
      dry: recipe.dryHops.map((d) => ({ name: d.name, weight: hopWt(d.weightOz) })),
      dryRate: num(dryHopRateFromCanonical(hops.dryHopRatio, mode), 2),
      dryRateUnit: dryHopRateUnit(mode),
    },

    // The Yeast card's four (strain, ale/lager, attenuation, fermentation
    // temperature), then the Pitch & Starter card's figures. A blank prints "—",
    // except the starter's note, which prints blank (PL-S6).
    yeast: {
      strain: text(recipe.yeast.name) ?? '—',
      type: YEAST_TYPE[recipe.yeast.type] ?? recipe.yeast.type,
      attenuation: pct(recipe.apparentAttenuation),
      fermTemp: temperature(recipe.yeast.fermTempF),
      tempUnit: tUnit,
      character: YEAST_CHARACTER[recipe.yeast.density] ?? recipe.yeast.density,
      pitchRate: num(pitchRate, 2),
      pitchRateUnit: pitchRateUnit(),
      cells: num(cellsFromCanonical(cells, mode), mode === 'pro' ? 2 : 0),
      cellsUnit: sheetCellsUnit(mode),
      starterVolumeUnit: starterVolumeUnit(),
      starter: starter.map((o) => ({
        band: o.band,
        volume: num(o.volumeL, 2),
        dme: num(o.dmeGrams, 0),
        note: o.packNote,
      })),
    },

    // The Water tab's additions, volumes and treated-water profile
    // (Water on the printed sheet); null with no water entries.
    water: waterSection(water, mode, vol, vUnit),

    notes: text(recipe.notes),
  };
}

// --- Water on the printed sheet (docs/items/water-print-sheet.md) ----------
// What the kettle needs from the Water tab: each addition where it goes, in
// the screen's units and precision (salts 0.1 g Home, 1 g Pro; liquid acid
// whole mL; acidulated malt 0.01 oz or lb), only what goes in (P5); the water
// volumes; the style target and the treated water's predicted profile; and a
// box for the measured mash pH (P3), the predicted mash pH beside it (mash
// pH, MP-S6). `water` is computeWater's output, the
// figures the Water tab shows: nothing here is computed. No water entries —
// no test result entered and no amount of the brewer's own — print no
// section (P4); a blank figure prints "—".
const PLACES = { mash: 'Mash', tank: 'HLT' };

function waterSection(water, mode, vol, vUnit) {
  if (!water) return null;
  const entered = water.missing.length < TEST_RESULT_KEYS.length || water.customized;
  if (!entered) return null;

  const tank = water.setup.treatment === 'tank';
  const place = PLACES[water.setup.treatment];
  // AM-S4: the acid's own place — into the mash, or with the salts.
  const acidPlace = water.setup.acidPlace === 'mash' ? PLACES.mash : place;
  const grams = (g) => num(g, mode === 'pro' ? 0 : 1);

  const additions = [];
  if (!water.recommendation) {
    additions.push({ place, name: 'Additions', amount: '—', unit: '' });
  } else {
    for (const r of [...water.salts, water.raiseSalt]) {
      if (r.amount > 0) additions.push({ place, name: r.name, amount: grams(r.amount), unit: saltUnit(mode) });
    }
    for (const r of water.acid.rows) {
      if (!(r.amount > 0)) continue;
      additions.push(
        r.solid
          ? { place: acidPlace, name: r.name, amount: num(acidMaltFromCanonical(r.amount, mode), 2), unit: acidMaltUnit(mode) }
          : { place: acidPlace, name: r.name, amount: num(r.amount, 0), unit: liquidAcidUnit(mode) },
      );
    }
  }
  for (const k of water.kettle?.salts ?? []) {
    if (k.amount !== 0) additions.push({ place: 'Kettle', name: k.name, amount: grams(k.amount), unit: saltUnit(mode) });
  }

  const v = water.volumes;
  const volumes = [
    { label: 'Mash water', value: vol(v.mashWaterGal) },
    { label: 'Water absorbed by the grain', value: vol(v.absorptionGal) },
    { label: 'Water left in the mash tun', value: vol(v.mashTunLeftGal) },
    { label: 'Total water', value: vol(v.totalGal) },
  ];
  if (tank) {
    const share = water.tank.treatedShare;
    volumes.push(
      { label: 'HLT first fill, treated', value: vol(v.treatedGal) },
      { label: 'HLT topped up to', value: vol(water.tank.topUpGal) },
      {
        label: 'Treated share of the sparge liquor',
        value: Number.isFinite(share) ? `${num(fractionToPercent(share), 0)} %` : '—',
      },
      { label: 'Left in the HLT, not used', value: vol(water.tank.leftGal) },
    );
  }

  const f = water.final;
  const t = water.target;
  const ion = (label, key, target) => ({ label, predicted: num(f?.ions[key], 0), target: num(target, 0) });
  const profile = [
    ion('Calcium', 'Ca', t.Ca),
    ion('Magnesium', 'Mg', t.Mg),
    ion('Sodium', 'Na', t.Na),
    ion('Sulfate', 'SO4', t.SO4),
    ion('Chloride', 'Cl', t.Cl),
    ion('Alkalinity', 'Alk', t.Alk),
    { label: 'Residual alkalinity', predicted: num(f?.residualAlkalinity, 0), target: num(t.RA, 0) },
    {
      label: 'SO₄:Cl ratio',
      predicted: f ? (Number.isFinite(f.ratio) ? num(f.ratio, 2) : '∞') : '—',
      target: num(water.style.so4_cl_target, 2),
    },
  ];

  return {
    treated: TREATMENT_LABELS[water.setup.treatment],
    additions,
    volumeUnit: vUnit,
    volumes,
    style: water.style.name,
    profileLabel: 'Treated water (predicted), not the wort in the kettle',
    profile,
    // PL-S3, PL-S4: the label ends at the comma, where the sheet breaks the
    // line; the figure to one decimal.
    mashPhLabel: 'Mash pH (cooled sample),',
    mashPhPredicted: num(water.mashPh.ph, 1),
    // TR-S2: the Water tab's tested-range note, or null.
    mashPhNote: testedRangeNote(water.mashPh.testedRange),
    // HL-S2: the acronym spelled out on the sheet, with the HLT treated.
    hltNote: tank ? 'HLT = Hot Liquor Tank' : null,
    kettle: kettleSection(water),
  };
}

// The kettle water before the boil (S4b item 2, KW-S6), as the Water tab
// shows it, while kettle salts are on; null otherwise. A blank prints "—".
function kettleSection(water) {
  if (!water.kettle) return null;
  const p = water.kettle.profile;
  const t = water.target;
  const ion = (label, key) => ({ label, predicted: num(p?.ions[key], 0), target: num(t[key], 0) });
  return {
    label: KETTLE_LABEL,
    caveat: KETTLE_CAVEAT,
    assumption: KETTLE_ASSUMPTION[water.setup.spargeMethod],
    // C17: the efficiency's bias, with a sparge (no sparge does not use it).
    biasNote: water.setup.spargeMethod === 'none' ? null : KETTLE_BIAS_NOTE,
    // KS1: a share held at its limit.
    heldNote: water.kettle.held ? KETTLE_HELD_NOTE : null,
    rows: [
      ion('Calcium', 'Ca'),
      ion('Magnesium', 'Mg'),
      ion('Sodium', 'Na'),
      ion('Sulfate', 'SO4'),
      ion('Chloride', 'Cl'),
      {
        label: 'SO₄:Cl ratio',
        predicted: p ? (Number.isFinite(p.ratio) ? num(p.ratio, 2) : '∞') : '—',
        target: num(water.style.so4_cl_target, 2),
      },
    ],
  };
}
