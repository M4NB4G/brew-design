// reference-volume.js
// The volume-to-reference boundary.
//
// The engine expects volumes at the 60 degF reference (see computeGrist in
// @brew/engine). Each corrected volume kind ('preBoil' | 'postBoil' |
// 'ferment') has a measurement temperature in the recipe state
// (measurementTempF, degF; the Options page edits it), and the engine's
// correctVolumeToRef takes the measured volume to the reference by the ratio
// of water densities. Pre-boil, post-boil, and fermentation volumes are routed
// through this function by selectors.js.
//
// Mash water is intentionally NOT routed through this function: the engine's
// 2.055 qt->lb mash constant already embeds a density assumption, so mash water
// is used exactly as entered.
//
// A temperature the engine cannot correct — cleared (NaN), outside its density
// table (0..100 degC), or absent because the map or the kind is missing —
// makes the engine throw a RangeError; that becomes a NaN volume, the app's
// cleared-field convention, so the dependent stats go blank and nothing
// throws. No clamping and no fallback to the uncorrected volume: either would
// be a number the brewer did not enter. Any other error propagates.
import { correctVolumeToRef } from '@brew/engine';

export function toReferenceVolume(measuredGal, kind, measurementTempF) {
  try {
    return correctVolumeToRef(measuredGal, measurementTempF?.[kind]);
  } catch (err) {
    if (err instanceof RangeError) return NaN;
    throw err;
  }
}
