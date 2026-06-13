// index.js
// Public surface of @brew/engine. Re-exports the pure calculation functions
// from every module.

export {
  LITERS_PER_GALLON,
  WATER_DENSITY_TABLE_C,
  fToC,
  galToL,
  sgToPlato,
  platoToSg,
  waterDensityC,
  waterDensityF,
  correctVolumeToRef,
  GALLONS_PER_BBL,
  LITERS_PER_BBL,
  G_PER_OZ,
  OZ_PER_LB,
  G_PER_LB,
  volumeToGallons,
  volumeUnit,
  acidMaltUnits,
} from './units.js';

export { computeGrist, computePostBoilVol } from './grist.js';

export { computeHops } from './hops.js';

export { PITCH_RATES, selectPitchRate, computeCellsNeeded } from './yeast.js';

export { solveStarter } from './starter.js';

export { solveGrist } from './solver.js';

export { rollupCost, costPerUnit } from './economics.js';

// Water chemistry engine (relocated from brew-water-chem, behavior preserved).
export {
  SALT_CONTRIBUTIONS_PER_G_GAL,
  HCO3_TO_CACO3,
  saltContribution,
} from './water/salts.js';

export {
  ACIDS,
  acidCapacity,
  acidAlkalinityReduction,
  acidContribution,
  applyAcids,
} from './water/acids.js';

export {
  residualAlkalinity,
  sulfateChlorideRatio,
  ratioCharacter,
} from './water/ra.js';

export { solveAdditions, predictFinalProfile } from './water/solver.js';

export { STYLE_FAMILIES } from './water/styles.js';
