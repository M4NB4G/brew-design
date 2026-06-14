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
  sgToPlato,
  platoToSg,
  volumeToGallons,
  volumeUnit,
} from '@brew/engine';

// Display modes.
export const MODES = ['home', 'pro'];

// --- Volume: Home gal, Pro bbl (1 bbl = 31 gal) -----------------------------
// volumeUnit(mode) -> 'gal' | 'bbl' (re-exported from the engine).
export { volumeUnit };

export function volumeToCanonical(displayValue, mode) {
  // -> US gallons. volumeToGallons handles the bbl->gal factor for Pro.
  return volumeToGallons(displayValue, mode);
}

export function volumeFromCanonical(gal, mode) {
  return mode === 'pro' ? gal / GALLONS_PER_BBL : gal;
}

// --- Malt weight: lb in both modes ------------------------------------------
export function maltWeightUnit() {
  return 'lb';
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

// --- Quantities identical in both modes (label only) ------------------------
export function tempUnit() {
  return '°F'; // degC is a later Options item
}

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
