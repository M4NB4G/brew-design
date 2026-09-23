// recipe-sheet-data.js
// The printed recipe sheet's text, shaped from the recipe and its derived
// values (computeRecipe's output) for RecipeSheet.jsx to lay out. Kept apart
// from the component so the suite, which has no DOM, can check what prints.
//
// Computes nothing: every number is a canonical recipe value or a derived
// value put through the display boundary (display.js) and the formatter
// (format.js), which prints a blank as "—". The literals below are display
// precision only.

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
  mashRvUnit,
  mashRUnit,
  pitchRateUnit,
  starterVolumeUnit,
} from '../display.js';
import { num, gravity } from '../format.js';

// The engine's volume reference temperature (correctVolumeToRef's refTempF,
// the screen's "at 60 °F"). A volume measured here needs no note (P11). A
// comparison, not a recipe value.
const REFERENCE_TEMP_F = 60;

const YEAST_TYPE = { ale: 'Ale', lager: 'Lager' };
const YEAST_CHARACTER = { high: 'High', mod: 'Moderate', low: 'Low' };

// Free text that is empty or only blanks prints nothing.
function text(value) {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

// A temperature as typed: whole degrees as whole, otherwise one decimal.
function temperature(tempF) {
  return num(tempF, Number.isInteger(tempF) ? 0 : 1);
}

function tempNote(tempF) {
  return tempF === REFERENCE_TEMP_F ? null : `measured at ${temperature(tempF)} ${tempUnit()}`;
}

export function recipeSheet({ recipe, derived, mode, proGravityUnit, today }) {
  const { grist, hops, pitchRate, cells, starter } = derived;
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
        unit: cellsUnit(mode),
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
      attenuation: pct(recipe.apparentAttenuation),
    },

    // Each volume as the screen shows it: mash water, pre-boil and
    // fermentation as entered, post-boil at the 60 °F reference.
    volumes: {
      unit: vUnit,
      rows: [
        { key: 'mashWater', label: 'Mash water', value: vol(recipe.mashWaterGal), tempNote: null, measuredBox: true },
        { key: 'preBoil', label: 'Pre-boil volume', value: vol(recipe.preBoilVolGal), tempNote: tempNote(temps?.preBoil), measuredBox: true },
        {
          key: 'postBoil',
          label: `Post-boil volume at 60 ${tempUnit()}`,
          value: vol(derived.postBoilVolGal),
          tempNote: tempNote(temps?.postBoil),
          measuredBox: true,
        },
        { key: 'ferment', label: 'Fermentation volume', value: vol(recipe.fermentVolGal), tempNote: tempNote(temps?.ferment), measuredBox: true },
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
      tempUnit: tempUnit(),
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

    yeast: {
      type: YEAST_TYPE[recipe.yeast.type] ?? recipe.yeast.type,
      character: YEAST_CHARACTER[recipe.yeast.density] ?? recipe.yeast.density,
      pitchRate: num(pitchRate, 2),
      pitchRateUnit: pitchRateUnit(),
      cells: num(cellsFromCanonical(cells, mode), mode === 'pro' ? 2 : 0),
      cellsUnit: cellsUnit(mode),
      starterVolumeUnit: starterVolumeUnit(),
      starter: starter.map((o) => ({
        band: o.band,
        volume: num(o.volumeL, 2),
        dme: num(o.dmeGrams, 0),
        note: o.packNote || '—',
      })),
    },

    notes: text(recipe.notes),
  };
}
