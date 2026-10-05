// hlt-wording.test.js
// Scenario for S4b item 3, "HLT wording" (docs/items/water-as-brewed.md,
// HL-S1, HL-S2; decisions D, D2): the hot liquor tank is "HLT" on screen and
// on the printed sheet, spelled out where it is first used.

import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { defaultRecipeState, emptyBreweryFigures } from '../src/state.js';
import { computeRecipe, computeWater } from '../src/selectors.js';
import { defaultWaterState } from '../src/water-state.js';
import { recipeSheet } from '../src/components/recipe-sheet-data.js';

const text = (markup) =>
  markup
    .replace(/<!--[^>]*-->/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ');

const recipe = () => {
  const r = defaultRecipeState();
  return {
    ...r,
    malts: [
      { ...r.malts[0], weightLb: 15 },
      { ...r.malts[1], weightLb: 5 },
    ],
    preBoilVolGal: 14,
    mashWaterGal: 7,
    water: {
      ...defaultWaterState(),
      source: { Ca: 0, Mg: 0, Na: 0, SO4: 48.12, Cl: 0, Alkalinity: 200, pH: 7 },
      styleId: 'ipa',
      enabledSalts: ['gypsum'],
      spargeGal: 8.5,
      treatment: 'tank',
      tankTreatedGal: 12,
      tankTopUpGal: 12,
      kettleSalts: true,
    },
  };
};
// Every mention of a tank, once the spelled-out name is set aside.
const tankWords = (s) => s.replace(/Hot Liquor Tank/g, '').match(/[^.]{0,30}\btanks?\b[^.]{0,30}/gi) ?? [];

describe('HLT wording', () => {
  it('the hot liquor tank reads HLT, spelled out where it is first used', async () => {
    const r = recipe();
    const { default: WaterTab } = await import('../src/components/water/WaterTab.jsx');
    const shown = text(
      renderToStaticMarkup(
        createElement(WaterTab, { water: r.water, figures: computeWater(r.water, r), mode: 'home', screen: 'salts', onScreen: () => {}, setWater: () => {} }),
      ),
    );
    // HL-S2: spelled out in the treatment choice and under the card's heading.
    expect(shown).toContain('The Hot Liquor Tank (HLT) first fill');
    expect(shown).toContain('HLT = Hot Liquor Tank');
    // HL-S1: "HLT" everywhere else.
    expect(shown).toContain("Into the HLT's first fill (12.00 gal)");
    expect(shown).toContain('Left in the HLT, not used');
    expect(shown).toContain('from the HLT');
    expect(shown).toContain('The treated HLT water (first fill)');
    expect(shown).toContain("The acid goes in the HLT with the salts, so the sparge liquor's treated share carries acid too.");
    expect(tankWords(shown)).toEqual([]);

    // The warnings.
    const short = { ...r, mashWaterGal: 13, water: { ...r.water, tankTopUpGal: 8 } };
    const warned = text(
      renderToStaticMarkup(
        createElement(WaterTab, { water: short.water, figures: computeWater(short.water, short), mode: 'home', screen: 'salts', onScreen: () => {}, setWater: () => {} }),
      ),
    );
    expect(warned).toContain("is more than the HLT's treated volume");
    expect(warned).toContain("is more than the HLT's top-up level");
    expect(tankWords(warned)).toEqual([]);

    // My brewery's Treat choice.
    const { default: OptionsSection } = await import('../src/components/OptionsSection.jsx');
    const options = text(
      renderToStaticMarkup(
        createElement(OptionsSection, {
          measurementTempF: r.measurementTempF,
          refVolumesGal: { preBoil: 14, postBoil: 12.5, ferment: 5.5 },
          mode: 'home',
          setMeasurementTemp: () => {},
          brewery: emptyBreweryFigures(),
          setBreweryFigure: () => {},
          setBreweryTemp: () => {},
          setBreweryWater: () => {},
          onUseRecipeFigures: () => {},
          onForgetBrewery: () => {},
        }),
      ),
    );
    expect(options).toContain('The Hot Liquor Tank (HLT) first fill');
    expect(tankWords(options)).toEqual([]);

    // The printed sheet: HLT for the place and the volumes; spelled out once.
    const s = recipeSheet({ recipe: r, derived: computeRecipe(r), water: computeWater(r.water, r), mode: 'home', proGravityUnit: 'plato', today: new Date(2026, 9, 2) });
    expect(s.water.treated).toBe('The Hot Liquor Tank (HLT) first fill');
    expect(s.water.hltNote).toBe('HLT = Hot Liquor Tank');
    expect(s.water.additions.map((a) => a.place)).toContain('HLT');
    expect(s.water.volumes.map((v) => v.label)).toEqual(
      expect.arrayContaining(['HLT first fill, treated', 'HLT topped up to', 'Left in the HLT, not used']),
    );
    expect(tankWords(JSON.stringify(s.water))).toEqual([]);
  });
});
