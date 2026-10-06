// display.js
// The unit-conversion boundary. Internal recipe state is ALWAYS in the engine's
// canonical units; this module is the only place that converts between canonical
// units and what the user sees. Convert on input (*ToCanonical) and on output
// (*FromCanonical), with the unit label chosen by the current display mode.
//
// All conversion factors come from @brew/engine's unit constants/functions.
// This module defines NO new conversion constants and does NO brewing math.

import {
  GALLONS_PER_BBL,
  OZ_PER_LB,
  G_PER_OZ,
  G_PER_LB,
  sgToPlato,
  platoToSg,
  volumeToGallons,
  volumeUnit as engineVolumeUnit,
  LB_PER_SACK,
  splitSacks,
  fToC,
  cToF,
  REFERENCE_TEMP_F,
} from '@brew/engine';
import { num, roundForInput } from './format.js';

// Display modes.
export const MODES = ['home', 'pro'];

// --- Volume: Home gal, Pro bbl (1 bbl = 31 gal) or gal ---------------------
// proVolumeUnit is Pro's choice, 'bbl' | 'gal' (Pro unit choices, PU-S1); Home
// is always gallons, and Pro without a choice is barrels, as before. Pro in
// gallons shows every volume as Home does (PU-S2); the dry-hop rate is not a
// volume here and stays lb/bbl in Pro.
export const PRO_VOLUME_UNITS = ['bbl', 'gal'];

export function volumesInBarrels(mode, proVolumeUnit) {
  return mode === 'pro' && proVolumeUnit !== 'gal';
}

// The mode whose volume unit applies.
const volumeMode = (mode, proVolumeUnit) => (volumesInBarrels(mode, proVolumeUnit) ? 'pro' : 'home');

// -> 'gal' | 'bbl', by the engine's volumeUnit.
export function volumeUnit(mode, proVolumeUnit) {
  return engineVolumeUnit(volumeMode(mode, proVolumeUnit));
}

export function volumeToCanonical(displayValue, mode, proVolumeUnit) {
  // -> US gallons. volumeToGallons handles the bbl->gal factor.
  return volumeToGallons(displayValue, volumeMode(mode, proVolumeUnit));
}

export function volumeFromCanonical(gal, mode, proVolumeUnit) {
  return volumesInBarrels(mode, proVolumeUnit) ? gal / GALLONS_PER_BBL : gal;
}

// --- Malt weight: lb; Pro may choose 55 lb sacks -----------------------------
// proMaltUnit is Pro's choice, 'lb' | 'sack' (PU-S3); Home is always pounds.
// A malt in sacks is entered as decimal sacks and stored in pounds, by the
// engine's LB_PER_SACK; the whole sacks and the pounds left show beside it.
export const PRO_MALT_UNITS = ['lb', 'sack'];

export function maltInSacks(mode, proMaltUnit) {
  return mode === 'pro' && proMaltUnit === 'sack';
}

export function maltWeightUnit(mode, proMaltUnit) {
  return maltInSacks(mode, proMaltUnit) ? 'sacks' : 'lb';
}

export function maltWeightToCanonical(displayValue, mode, proMaltUnit) {
  // -> lb
  return maltInSacks(mode, proMaltUnit) ? displayValue * LB_PER_SACK : displayValue;
}

export function maltWeightFromCanonical(lb, mode, proMaltUnit) {
  return maltInSacks(mode, proMaltUnit) ? lb / LB_PER_SACK : lb;
}

// A malt weight box's value: pounds as stored; sacks to two decimals, the
// precision the box takes (PU-Q1a). A blank stays blank (NaN).
export function maltWeightBoxValue(lb, mode, proMaltUnit) {
  return maltInSacks(mode, proMaltUnit) ? roundForInput(lb / LB_PER_SACK, 2) : lb;
}

// A weight as whole sacks and the pounds left, "3 sacks + 12.1 lb", the
// pounds by `lbText`; null for a blank weight.
export function sackSplitText(lb, lbText) {
  if (!Number.isFinite(lb)) return null;
  const split = splitSacks(lb);
  return `${split.sacks} ${split.sacks === 1 ? 'sack' : 'sacks'} + ${lbText(split.lb)} lb`;
}

// The unit a printed sheet names for a weight in sacks: "55 lb sacks".
export function sackUnit() {
  return `${LB_PER_SACK} lb sacks`;
}

// --- Hop weight: Home oz, Pro lb (canonical is oz) --------------------------
export function hopWeightUnit(mode) {
  return mode === 'pro' ? 'lb' : 'oz';
}

export function hopWeightToCanonical(displayValue, mode) {
  // -> oz
  return mode === 'pro' ? displayValue * OZ_PER_LB : displayValue;
}

export function hopWeightFromCanonical(oz, mode) {
  return mode === 'pro' ? oz / OZ_PER_LB : oz;
}

// --- Gravity: canonical is SG. Home shows SG; Pro defaults to Plato (SG opt) -
// gravityUnit is 'sg' | 'plato'. resolveGravityUnit picks the active one from
// the mode plus the user's Pro-mode toggle. Plato is derived from canonical SG
// via the engine's sgToPlato (and parsed back via platoToSg).
export function resolveGravityUnit(mode, proGravityUnit) {
  return mode === 'pro' ? proGravityUnit : 'sg';
}

export function gravityUnitLabel(gravityUnit) {
  return gravityUnit === 'plato' ? '°P' : 'SG';
}

export function gravityFromCanonical(sg, gravityUnit) {
  return gravityUnit === 'plato' ? sgToPlato(sg) : sg;
}

export function gravityToCanonical(displayValue, gravityUnit) {
  return gravityUnit === 'plato' ? platoToSg(displayValue) : displayValue;
}

// --- Cells per batch: Home billion, Pro trillion (= billion / 1000) ---------
export function cellsUnit(mode) {
  return mode === 'pro' ? 'trillion cells' : 'billion cells';
}

export function cellsFromCanonical(billion, mode) {
  return mode === 'pro' ? billion / 1000 : billion;
}

// --- Dry-hop rate: canonical is oz/gal. Home oz/gal, Pro lb/bbl -------------
export function dryHopRateUnit(mode) {
  return mode === 'pro' ? 'lb/bbl' : 'oz/gal';
}

export function dryHopRateFromCanonical(ozPerGal, mode) {
  // oz/gal -> lb/bbl: x (gal per bbl) / (oz per lb).
  return mode === 'pro' ? (ozPerGal * GALLONS_PER_BBL) / OZ_PER_LB : ozPerGal;
}

// --- Percent: FGDB, efficiency, attenuation, alpha acid, ABV -----------------
// State holds the fraction (SPEC rule 8, unit table); the user enters and sees
// percent, the same in both modes. Percent is fraction x 100 by definition, so
// the pair are inverses to within floating-point round-off. No rounding here:
// precision stays the caller's (roundForInput, num).
export function percentUnit() {
  return '%';
}

export function fractionToPercent(fraction) {
  return fraction * 100;
}

export function percentToFraction(percent) {
  return percent / 100;
}

// --- Prices (cost of a batch): canonical $/lb malt, $/oz hop, $/gal ---------
// A malt is priced per lb, or per 55 lb sack in Pro with sacks; a hop per oz
// at Home and per lb in Pro; the yeast and the other lines per batch. The
// cost per unit is per gal, or per bbl in Pro's barrels (EC-S1, EC-S2), by
// the engine's LB_PER_SACK, OZ_PER_LB and GALLONS_PER_BBL.
export function maltPriceUnit(mode, proMaltUnit) {
  return maltInSacks(mode, proMaltUnit) ? '$/sack' : '$/lb';
}

export function maltPriceFromCanonical(perLb, mode, proMaltUnit) {
  return maltInSacks(mode, proMaltUnit) ? perLb * LB_PER_SACK : perLb;
}

export function maltPriceToCanonical(displayValue, mode, proMaltUnit) {
  // -> $/lb
  return maltInSacks(mode, proMaltUnit) ? displayValue / LB_PER_SACK : displayValue;
}

export function hopPriceUnit(mode) {
  return mode === 'pro' ? '$/lb' : '$/oz';
}

export function hopPriceFromCanonical(perOz, mode) {
  return mode === 'pro' ? perOz * OZ_PER_LB : perOz;
}

export function hopPriceToCanonical(displayValue, mode) {
  // -> $/oz
  return mode === 'pro' ? displayValue / OZ_PER_LB : displayValue;
}

export function batchPriceUnit() {
  return '$/batch';
}

// The cost of a gal, or of a bbl in Pro's barrels: $/gal x gal per bbl.
export function costPerVolumeFromCanonical(perGal, mode, proVolumeUnit) {
  return volumesInBarrels(mode, proVolumeUnit) ? perGal * GALLONS_PER_BBL : perGal;
}

// --- Water: salts g and liquid acid mL in both modes -------------------------
// Acidulated malt is canonical grams (the engine doses it by the gram): Home
// shows oz, Pro lb, by the engine's G_PER_OZ and G_PER_LB.
export function saltUnit() {
  return 'g';
}

export function liquidAcidUnit() {
  return 'mL';
}

export function acidMaltUnit(mode) {
  return mode === 'pro' ? 'lb' : 'oz';
}

export function acidMaltFromCanonical(g, mode) {
  return mode === 'pro' ? g / G_PER_LB : g / G_PER_OZ;
}

export function acidMaltToCanonical(displayValue, mode) {
  // -> g
  return mode === 'pro' ? displayValue * G_PER_LB : displayValue * G_PER_OZ;
}

// --- Temperature: canonical °F; shown °F or °C, the header's choice ---------
// temperatureUnit is 'F' | 'C' (°C display toggle, CT-S1); anything else is
// °F, as every temperature was before the choice. The recipe stores °F: a °C
// entry is stored as the engine's cToF of it (CT-S2).
export const TEMPERATURE_UNITS = ['F', 'C'];

export function tempUnit(temperatureUnit) {
  return temperatureUnit === 'C' ? '°C' : '°F';
}

// FLAG: the °C entry is stored as typed, converted (CT-S2), so re-typing a
// shown °C figure can move the stored °F: the 60 °F reference shows as 15.6,
// and 15.6 typed stores 60.08 °F, which is not the reference — the post-boil
// volume then shows a second row "at 16 °C" and the sheet notes "measured at
// 16 °C"; each volume moves in its sixth figure. Kept as specified; the
// question is on the roadmap ("15.6 °C typed is not the reference").
export function tempToCanonical(displayValue, temperatureUnit) {
  // -> °F
  return temperatureUnit === 'C' ? cToF(displayValue) : displayValue;
}

// A temperature box's value: °F as stored; °C to tenths, the precision the
// box takes (CT-S3). A blank figure stays blank (NaN).
export function tempBoxValue(tempF, temperatureUnit) {
  return temperatureUnit === 'C' ? roundForInput(fToC(tempF), 1) : tempF;
}

// A temperature as a readout: °F whole degrees as whole, otherwise one
// decimal, as before; °C whole degrees (CT-S3). A blank prints "—".
export function tempReadout(tempF, temperatureUnit) {
  if (temperatureUnit === 'C') return num(fToC(tempF), 0);
  return num(tempF, Number.isInteger(tempF) ? 0 : 1);
}

// The engine's reference temperature as text: "60" in °F, "15.6" in °C — one
// decimal, as 60 °F is not a whole °C (C-Q3).
export function referenceTemp(temperatureUnit) {
  return temperatureUnit === 'C' ? num(fToC(REFERENCE_TEMP_F), 1) : String(REFERENCE_TEMP_F);
}

// --- Quantities identical in both modes (label only) ------------------------

export function pitchRateUnit() {
  return 'billion/L/°P';
}

export function mashRvUnit() {
  return 'qt/lb';
}

export function mashRUnit() {
  return 'lb/lb';
}

export function starterVolumeUnit() {
  return 'L';
}
