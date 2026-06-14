// selectors.js
// The app's single source of derived values. Every number here comes from
// @brew/engine -- this module does NO brewing math. It only wires canonical
// recipe state into the engine and routes the three boil/ferment volumes
// through the (currently no-op) reference-volume boundary.
//
// The UI renders from computeRecipe() via useMemo; the smoke test calls the
// same function with the reference recipe, so the correctness gate exercises
// the exact selector the UI uses.

import {
  computePostBoilVol,
  computeGrist,
  computeHops,
  selectPitchRate,
  computeCellsNeeded,
  solveStarter,
} from '@brew/engine';
import { toReferenceVolume } from './reference-volume.js';

export function computeRecipe(state) {
  // Boil-off is applied to the measured (hot) pre-boil volume; the resulting
  // pre-/post-boil and ferment volumes are then taken to the 60 degF reference
  // the engine expects. toReferenceVolume is a no-op for now (see its module).
  const preBoilRefGal = toReferenceVolume(state.preBoilVolGal, 'preBoil');
  const postBoilRawGal = computePostBoilVol(
    state.preBoilVolGal,
    state.boilOffRateGalPerHr,
    state.boilTimeMin,
  );
  const postBoilRefGal = toReferenceVolume(postBoilRawGal, 'postBoil');
  const fermentRefGal = toReferenceVolume(state.fermentVolGal, 'ferment');

  const grist = computeGrist({
    malts: state.malts,
    efficiency: state.efficiency,
    preBoilVolGal: preBoilRefGal,
    postBoilVolGal: postBoilRefGal,
    mashWaterGal: state.mashWaterGal, // NOT reference-corrected (engine design)
    apparentAttenuation: state.apparentAttenuation,
  });

  const hops = computeHops({
    kettleAdditions: state.kettleAdditions,
    preBoilSg: grist.preBoilSg,
    postBoilVolGal: postBoilRefGal,
    dryHops: state.dryHops,
    fermentVolGal: fermentRefGal,
  });

  const pitchRate = selectPitchRate(state.yeast.type, state.yeast.density);
  const cells = computeCellsNeeded({
    pitchRate,
    postBoilPlato: grist.postBoilPlato,
    fermentVolGal: fermentRefGal,
  });
  const starter = solveStarter(cells);

  return {
    postBoilVolGal: postBoilRefGal,
    grist,
    hops,
    pitchRate,
    cells,
    starter,
  };
}
