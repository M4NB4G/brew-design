// water-back.js
// Water back (docs/items/water-back.md): hot-liquor-tank water added to the
// fermenter after knock-out. The knock-out's extract, colour and bitterness
// spread over the volume at pitch (WB-S3, WB-Q3). Water back is not in Rev 4:
// every figure here is arithmetic on the engine's own formulas, pinned by
// hand in test/water-back.test.js.
// Pure functions. No constant of its own.

import { platoToSg } from './units.js';
import { attenuate, moreySrm } from './grist.js';

/** The volume at pitch: the knock-out volume plus the water back (both at 60 F). */
export function volumeAtPitch(knockOutGal, waterBackGal) {
  return knockOutGal + waterBackGal;
}

// The °P whose sugar per volume is `extract` = °P x SG (SG by platoToSg): the
// sugar's mass is °P / 100 x SG x the density of water x the volume, so it is
// kept across a dilution when °P x SG x volume is. °P x SG rises with °P, so
// it is found by halving [0, extract] (SG >= 1 puts the °P inside) until the
// halves meet in the last digit. Not a number for an extract that is not a
// number or is below zero.
function platoHolding(extract) {
  if (!(extract >= 0)) return NaN;
  let lo = 0;
  let hi = extract;
  for (;;) {
    const mid = (lo + hi) / 2;
    if (mid <= lo || mid >= hi) return mid;
    if (mid * platoToSg(mid) < extract) lo = mid;
    else hi = mid;
  }
}

/**
 * The figures at pitch.
 *
 * input = {
 *   knockOutGal,           // the fermentation volume at knock-out, at 60 F
 *   waterBackGal,          // the water back, at 60 F
 *   plato,                 // the knock-out wort's °P (computeGrist's postBoilPlato)
 *   mcu,                   // its malt colour units (computeGrist's sumMcu)
 *   ibu,                   // its unrounded IBU (computeHops's sumIBU)
 *   apparentAttenuation,  // the recipe's own; no default here
 * }
 *
 * The sugar is kept: °P x SG x volume at pitch equals it at knock-out (the
 * exact balance; the gravity points x volume would be a close approximation).
 * The malt colour units and the IBU are amounts per volume: each is the
 * knock-out's times knock-out over pitch volume. SRM is Morey's of the colour
 * units at pitch, FG and ABV computeGrist's of the OG at pitch, and the IBU is
 * rounded as computeHops rounds its total. A blank volume blanks every figure.
 *
 * -> { pitchGal, plato, OG, FG, ABV, mcu, SRM, ibu, totalIBU }
 */
export function computeWaterBack(input) {
  const { knockOutGal, waterBackGal, plato, mcu, ibu, apparentAttenuation } = input;
  const pitchGal = volumeAtPitch(knockOutGal, waterBackGal);
  const share = knockOutGal / pitchGal;

  const pitchPlato = platoHolding(plato * platoToSg(plato) * share);
  const OG = platoToSg(pitchPlato);
  const { FG, ABV } = attenuate(OG, apparentAttenuation);

  const pitchMcu = mcu * share;
  const pitchIbu = ibu * share;

  return {
    pitchGal,
    plato: pitchPlato,
    OG,
    FG,
    ABV,
    mcu: pitchMcu,
    SRM: moreySrm(pitchMcu),
    ibu: pitchIbu,
    totalIBU: Math.round(pitchIbu),
  };
}

/**
 * The °P from the kettle for a °P at pitch (docs/items/target-og-with-water-
 * back.md, TO-S1): the figures at pitch's sugar balance read the other way.
 * The sugar at pitch, °P x SG x volume at pitch, is the sugar from the kettle,
 * so °P x SG from the kettle is it over the wort from kettle's volume, and the
 * °P is found as computeWaterBack finds the °P at pitch. Volumes at 60 F; a
 * blank one blanks the figure.
 *
 * input = { plato, knockOutGal, waterBackGal } -> °P from the kettle
 */
export function knockOutPlato({ plato, knockOutGal, waterBackGal }) {
  const pitchGal = volumeAtPitch(knockOutGal, waterBackGal);
  return platoHolding((plato * platoToSg(plato) * pitchGal) / knockOutGal);
}
