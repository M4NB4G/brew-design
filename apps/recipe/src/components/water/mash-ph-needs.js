// mash-ph-needs.js
// The figures the predicted mash pH needs, as the tab names them (MP-S5):
// a malt's figure with the malt's name, or the recipe's mash water
// (AA-Q1). Computes nothing.

const LABELS = { type: 'Malt type', weightLb: 'Weight', colorL: 'Color', mashWaterGal: 'Mash water' };

/** One need ({ malt, field }) as the tab names it: "Malt type (Carafoam)", "Mash water". */
export function mashPhNeedLabel({ malt, field }) {
  return malt ? `${LABELS[field]} (${malt})` : LABELS[field];
}
