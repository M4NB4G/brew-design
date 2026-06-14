// reference-volume.js
// The volume-to-reference boundary.
//
// The engine expects volumes at the 60 degF reference (see computeGrist in
// @brew/engine). Measurement-temperature correction belongs to the deferred
// Options page, which will supply a per-volume measurement temperature. For
// this MVP this is a NO-OP pass-through: it returns the measured gallons
// unchanged.
//
// When Options lands, this will instead call the engine's
//   correctVolumeToRef(measuredGal, measurementTempF[kind])
// using the measurement temperature configured for `kind`
// ('preBoil' | 'postBoil' | 'ferment'). Pre-boil, post-boil, and fermentation
// volumes are already routed through this function (see selectors.js), so that
// change slots in here with no restructuring at the call sites.
//
// Mash water is intentionally NOT routed through this function: the engine's
// 2.055 qt->lb mash constant already embeds a density assumption, so mash water
// is used exactly as entered.
export function toReferenceVolume(measuredGal, kind) {
  // FUTURE: return correctVolumeToRef(measuredGal, measurementTempF[kind]);
  void kind;
  return measuredGal;
}
