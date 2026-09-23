// ingredient-search.test.js
// Scenarios for the Searchable malt and hop boxes item (scope table agreed
// 2026-09-23, docs/items/searchable-malt-hop-boxes.md), named from its
// sentences S1, S2, S4, S5 and decisions B1, B2, B4, B5, B7. The search and
// pick logic is pure (B8); S3 (a number typed after a pick stays), keyboard
// and touch (B6) and phone width (B9) are proved at the far end on the built
// app. Every number a pick fills is a workbook cell (SPEC rule 16), read here
// from the app's copy of the list and checked against it by ingredients.test.js.

import { describe, it, expect } from 'vitest';
import ingredients from '../src/ingredients.json';
import { computeRecipe } from '../src/selectors.js';
import {
  searchIngredients,
  suggestionDetail,
  pickIngredient,
  typeName,
  newRow,
} from '../src/ingredient-search.js';

const names = (list) => list.map((i) => i.name);
const malt = (name) => ingredients.malts.find((m) => m.name === name);
const hop = (name) => ingredients.hops.find((h) => h.name === name);

// The smoke test's reference recipe (canonical units), unchanged.
function referenceState() {
  return {
    name: '',
    style: '',
    notes: '',
    malts: [
      { name: 'Golden Promise', weightLb: 27, fgdb: 0.8, colorL: 2.2 },
      { name: 'Carafoam', weightLb: 2, fgdb: 0.8, colorL: 2.0 },
    ],
    efficiency: 0.93,
    apparentAttenuation: 0.8,
    preBoilVolGal: 16,
    boilOffRateGalPerHr: 1.5,
    boilTimeMin: 60,
    mashWaterGal: 13,
    kettleAdditions: [
      { name: 'Bravo', timeMin: 60, wortTempF: 204, weightOz: 2, alphaAcidFraction: 0.147 },
      { name: 'Helios', timeMin: 30, wortTempF: 204, weightOz: 1, alphaAcidFraction: 0.19 },
      { name: 'Citra LupoMAX', timeMin: 20, wortTempF: 175, weightOz: 2, alphaAcidFraction: 0.18 },
      { name: 'Hopstiener 9326', timeMin: 20, wortTempF: 175, weightOz: 2, alphaAcidFraction: 0.06 },
      { name: 'Helios', timeMin: 20, wortTempF: 175, weightOz: 1, alphaAcidFraction: 0.19 },
    ],
    dryHops: [
      { name: 'DH1', weightOz: 2 },
      { name: 'DH2', weightOz: 2 },
      { name: 'DH3', weightOz: 2 },
      { name: 'DH4', weightOz: 2 },
      { name: 'DH5', weightOz: 1 },
      { name: 'DH6', weightOz: 1 },
      { name: 'DH7', weightOz: 2 },
      { name: 'DH8', weightOz: 2 },
      { name: 'DH9', weightOz: 1 },
    ],
    fermentVolGal: 12,
    yeast: { type: 'ale', density: 'mod' },
    measurementTempF: { preBoil: 60, postBoil: 60, ferment: 60 },
  };
}

describe('searchable malt and hop boxes', () => {
  // S1, B4
  it('typing part of a name finds it: capitals and accents ignored, matched anywhere, names that start with the text first, then the workbook\'s order', () => {
    expect(names(searchIngredients('malts', 'crys'))).toEqual([
      'American Crystal 120',
      'American Crystal 40',
      'American Crystal 60',
      'American Crystal 80',
      'English Crystal 15',
      'English Crystal 170',
    ]);
    expect(names(searchIngredients('kettleAdditions', 'mittelfruh'))).toEqual(['Hallertau Mittelfrüh']);
    expect(names(searchIngredients('dryHops', 'MITTELFRÜH'))).toEqual(['Hallertau Mittelfrüh']);
    expect(names(searchIngredients('kettleAdditions', 'BRAV'))[0]).toBe('Bravo');
    // "citra": both start with it, in the workbook's order; "a" puts the
    // names starting with A ahead of the rest, each group in workbook order.
    expect(names(searchIngredients('dryHops', 'citra'))).toEqual(['Citra', 'Citra LupoMAX']);
    const a = names(searchIngredients('kettleAdditions', 'a'));
    const startsA = ingredients.hops.map((h) => h.name).filter((n) => n.toLowerCase().startsWith('a'));
    expect(a.slice(0, startsA.length)).toEqual(startsA);
    expect(a.slice(startsA.length).every((n) => !n.toLowerCase().startsWith('a'))).toBe(true);
    expect(searchIngredients('malts', 'zzzz')).toEqual([]);
  });

  // S1, B7
  it('each suggestion shows the numbers a pick would fill, as the boxes show them', () => {
    expect(suggestionDetail('malts', malt('American Crystal 40'))).toBe('77 %, 40 °L');
    expect(suggestionDetail('kettleAdditions', hop('Bravo'))).toBe('14.4 %');
    expect(suggestionDetail('kettleAdditions', hop('Hallertau Mittelfrüh'))).toBe('2.9 %');
    expect(suggestionDetail('malts', malt('2-Row Brewers Malt'))).toBe('82 %, 2.2 °L');
    expect(suggestionDetail('dryHops', hop('Citra'))).toBe('');
  });

  // S2
  it('picking a malt fills its FGDB and colour and leaves the weight', () => {
    const row = { name: 'Old name', weightLb: 3.5, fgdb: 0.8, colorL: 2 };
    expect(pickIngredient('malts', row, malt('American Crystal 40'))).toEqual({
      name: 'American Crystal 40',
      weightLb: 3.5,
      fgdb: 0.77,
      colorL: 40,
    });
  });

  // S2
  it('picking a boil hop fills its alpha and leaves time, temperature and weight; picking a dry hop sets its name only', () => {
    const kettle = { name: '', timeMin: 30, wortTempF: 180, weightOz: 1.5, alphaAcidFraction: 0.1 };
    expect(pickIngredient('kettleAdditions', kettle, hop('Bravo'))).toEqual({
      name: 'Bravo',
      timeMin: 30,
      wortTempF: 180,
      weightOz: 1.5,
      alphaAcidFraction: 0.144,
    });
    const dry = { name: '', weightOz: 2.5 };
    expect(pickIngredient('dryHops', dry, hop('Citra'))).toEqual({ name: 'Citra', weightOz: 2.5 });
    // Idempotence (B11): picking the same ingredient twice equals picking it once.
    const once = pickIngredient('kettleAdditions', kettle, hop('Bravo'));
    expect(pickIngredient('kettleAdditions', once, hop('Bravo'))).toEqual(once);
  });

  // S5, B1
  it('a pick puts the list\'s numbers into the recipe exactly, and every stat equals the recipe with those numbers typed', () => {
    const picked = referenceState();
    picked.malts[1] = pickIngredient('malts', picked.malts[1], malt('American Crystal 40'));
    picked.kettleAdditions[0] = pickIngredient('kettleAdditions', picked.kettleAdditions[0], hop('Bravo'));
    picked.dryHops[0] = pickIngredient('dryHops', picked.dryHops[0], hop('Citra'));

    // The same recipe with the workbook's numbers typed in.
    const typed = referenceState();
    typed.malts[1] = { name: 'American Crystal 40', weightLb: 2, fgdb: 0.77, colorL: 40 };
    typed.kettleAdditions[0] = { name: 'Bravo', timeMin: 60, wortTempF: 204, weightOz: 2, alphaAcidFraction: 0.144 };
    typed.dryHops[0] = { name: 'Citra', weightOz: 2 };

    expect(picked).toEqual(typed);
    expect(Object.is(picked.malts[1].fgdb, 0.77)).toBe(true);
    expect(Object.is(picked.kettleAdditions[0].alphaAcidFraction, 0.144)).toBe(true);
    expect(computeRecipe(picked)).toEqual(computeRecipe(typed));
    // The pick moved the stats: the crystal malt and the lower alpha count.
    expect(computeRecipe(picked).grist.SRM).not.toEqual(computeRecipe(referenceState()).grist.SRM);
  });

  // S4, B2 — the name box's typing edit (typeName) writes the name alone; a
  // name on the list is offered as a suggestion but fills nothing until picked.
  it('editing the name, even to one on the list, leaves every number as it was', () => {
    const row = { name: '', weightLb: 3.5, fgdb: 0.8, colorL: 2 };
    expect(typeName(row, 'My Malt')).toEqual({ name: 'My Malt', weightLb: 3.5, fgdb: 0.8, colorL: 2 });
    expect(searchIngredients('malts', 'My Malt')).toEqual([]);
    for (const typed of ['American Crystal 40', 'american crystal 40']) {
      expect(typeName(row, typed)).toEqual({ name: typed, weightLb: 3.5, fgdb: 0.8, colorL: 2 });
      expect(names(searchIngredients('malts', typed))).toEqual(['American Crystal 40']);
    }
    const kettle = { name: 'Bravo', timeMin: 60, wortTempF: 204, weightOz: 2, alphaAcidFraction: 0.147 };
    expect(typeName(kettle, 'Bravo')).toEqual(kettle);
  });

  // B1
  it('the recipe keeps its own copy: a picked row does not change when the list does', () => {
    const listRow = { ...malt('American Crystal 40') };
    const listHop = { ...hop('Bravo') };
    const pickedMalt = pickIngredient('malts', { name: '', weightLb: 1, fgdb: 0.8, colorL: 2 }, listRow);
    const pickedHop = pickIngredient(
      'kettleAdditions',
      { name: '', timeMin: 10, wortTempF: 212, weightOz: 1, alphaAcidFraction: 0.1 },
      listHop,
    );
    listRow.fgdb = 0.5;
    listRow.colorL = 999;
    listRow.name = 'Renamed';
    listHop.alphaAcidFraction = 0.01;
    expect(pickedMalt).toEqual({ name: 'American Crystal 40', weightLb: 1, fgdb: 0.77, colorL: 40 });
    expect(pickedHop.alphaAcidFraction).toBe(0.144);
    expect(pickedHop.name).toBe('Bravo');
  });

  // B5
  it('a new row starts with an empty name and today\'s starting numbers', () => {
    expect(newRow('malts')).toEqual({ name: '', weightLb: 1, fgdb: 0.8, colorL: 2 });
    expect(newRow('kettleAdditions')).toEqual({
      name: '',
      timeMin: 10,
      wortTempF: 212,
      weightOz: 1,
      alphaAcidFraction: 0.1,
    });
    expect(newRow('dryHops')).toEqual({ name: '', weightOz: 1 });
    // Each call is a fresh row, never a shared object.
    expect(newRow('malts')).not.toBe(newRow('malts'));
  });
});
