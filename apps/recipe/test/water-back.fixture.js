// water-back.fixture.js
// "Water back" (docs/items/water-back.md, S15b) added, with water back off,
// what the earlier "nothing else changes" scenarios see: a "Water back" check
// on the Volumes card (WB-S1); three entries of the printed sheet's volumes,
// the knock-out OG, the OG at pitch and their unit, and the water section's
// note, each blank (null) without it (WB-S5, WB-S8); and, in the recipe's
// saved document, its water back (off, blank, at the reference) and version
// 13 (WB-S7). Those scenarios compare what is drawn now through this, which
// takes out exactly those additions, only where they hold their off values,
// and nothing else: anything else that moved still fails the comparison. The
// captures are never re-made (WB-S9).

import { REFERENCE_TEMP_F } from '@brew/engine';

// The check, as static markup draws it and as jsdom does (its attributes the
// other way round).
const CHECK = /<label style="[^"]*"><input (?:type="checkbox" style="[^"]*"|style="[^"]*" type="checkbox")\/?>Water back<\/label>/g;

/** A page's or a card's HTML, or an object of cards' HTML by name, without the check. */
export function withoutWaterBack(html) {
  if (typeof html !== 'string') {
    return Object.fromEntries(Object.entries(html).map(([card, markup]) => [card, withoutWaterBack(markup)]));
  }
  return html.replace(CHECK, '');
}

/** The printed sheet's data without the water back entries it carries blank. */
export function sheetWithoutWaterBack(sheet) {
  const out = JSON.parse(JSON.stringify(sheet));
  const v = out.volumes;
  if (v && v.knockOutOG === null && v.pitchOG === null && v.gravityUnit === null) {
    delete v.knockOutOG;
    delete v.pitchOG;
    delete v.gravityUnit;
  }
  if (out.water && out.water.waterBackNote === null) delete out.water.waterBackNote;
  return out;
}

/** A saved recipe document (parsed) without water back off, read as version 12. */
export function documentWithoutWaterBack(doc) {
  const out = JSON.parse(JSON.stringify(doc));
  const wb = out.recipe?.waterBack;
  if (out.version === 13 && wb && wb.on === false && wb.volumeGal === null && wb.tempF === REFERENCE_TEMP_F) {
    delete out.recipe.waterBack;
    out.version = 12;
  }
  return out;
}

/**
 * A canonical recipe built by hand before water back, or read from an older
 * document, with water back off as the reader puts it in (WB-S7), so the
 * earlier scenarios compare like with like.
 */
export function withWaterBackOff(recipe) {
  return 'waterBack' in recipe ? recipe : { ...recipe, waterBack: { on: false, volumeGal: NaN, tempF: REFERENCE_TEMP_F } };
}
