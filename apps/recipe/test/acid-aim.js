// acid-aim.js
// The acid aimed at a mash pH (docs/items/acid-aimed-at-mash-ph.md, batch S9)
// gave the recipe's water a target mash pH (recipe format 12, every older
// document read with 5.4: AA-Q4) and aimed the acid at it (AA-S1): with every
// malt typed, the acid's dose moves, and with it the figures that read it —
// the predicted alkalinity, residual alkalinity and mash pH, and the
// tested-range note — and the printed sheet prints the target (AA-S5).
// These bring an earlier scenario's recorded "before" to what this item
// changes, so it still checks that nothing else did. The aimed figures
// themselves are pinned by hand in acid-aimed.test.js.
import { ACIDS, MASH_PH_TARGET } from '@brew/engine';

const ACID_NAMES = Object.values(ACIDS).map((a) => a.name);

// A recipe as a saved document holds it, with the target the reader gives an
// older one.
export function docWithTarget(recipe) {
  if (!recipe?.water || 'mashPhTarget' in recipe.water) return recipe;
  return { ...recipe, water: { ...recipe.water, mashPhTarget: MASH_PH_TARGET } };
}

// A printed sheet's data recorded before this item, with the acid's figures
// taken from `after`: the acid additions (amounts, and an acid that now goes
// in or no longer does), the predicted alkalinity and residual alkalinity,
// the predicted mash pH and its note, and the target. Every other figure
// stays as recorded: the additions other than the acid must be the same, or
// the recorded ones are kept and the comparison shows the change.
export function sheetWithAimedAcid(before, after) {
  if (!before?.water || !after?.water) return before;
  const isAcid = (a) => ACID_NAMES.includes(a.name);
  const others = (list) => JSON.stringify(list.filter((a) => !isAcid(a)));
  const same = others(before.water.additions) === others(after.water.additions);
  const OWNED = ['Alkalinity', 'Residual alkalinity'];
  return {
    ...before,
    water: {
      ...before.water,
      additions: same ? after.water.additions : before.water.additions,
      profile: before.water.profile.map((row) =>
        OWNED.includes(row.label) ? { ...row, predicted: after.water.profile.find((r) => r.label === row.label).predicted } : row,
      ),
      mashPhPredicted: after.water.mashPhPredicted,
      mashPhNote: after.water.mashPhNote,
      mashPhTarget: after.water.mashPhTarget,
    },
  };
}

// The Salts & Acid screen's markup without the cards this item changes: the
// acid's card (its target box, dose and reason) and the predicted profile
// (its mash pH, target, alkalinity and residual alkalinity read the acid).
// Every other card stays as recorded.
const CARD = '<div style="background:#ffffff;border-radius:14px';
export function withoutAcidCards(html) {
  const parts = html.split(CARD);
  return parts
    .filter((p, i) => i === 0 || !/>(Acid Dose|Acid Additions|Predicted Final Profile)</.test(p))
    .join(CARD);
}
