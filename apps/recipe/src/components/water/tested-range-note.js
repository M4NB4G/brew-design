// The note beside the predicted mash pH when the mash is beyond the range
// Troester's model was tested on (docs/items/mash-ph-acid.md, TR-S1, TR-S2):
// the Water tab and the printed sheet print the same words. The limits are
// the engine's (MASH_PH_TESTED_RANGE); null when none is crossed.

const FIGURES = {
  residualAlkalinity: { label: 'residual alkalinity', unit: 'mEq/L' },
  thickness: { label: 'mash thickness', unit: 'L/kg' },
};

const signed = (v) => (v < 0 ? `−${Math.abs(v)}` : String(v));

export function testedRangeNote(crossed) {
  if (!crossed?.length) return null;
  const limits = crossed.map(({ figure, side, limit }) => {
    const { label, unit } = FIGURES[figure];
    return `${label} ${side} ${signed(limit)} ${unit}`;
  });
  return `Beyond the range the model was tested on (Troester 2009): ${limits.join(', ')}; this prediction is unreliable.`;
}
