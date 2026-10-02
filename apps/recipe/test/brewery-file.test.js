// brewery-file.test.js
// Scenarios for S4b item 5, "Brewery file" (docs/items/water-as-brewed.md,
// BF-S1 to BF-S3; decisions B2, K: the same reader as storage, versions and
// upgrades; import never touches the recipe). The download and the file
// picker are the far end; here the document, the reader and App's wiring.

import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultRecipeState, emptyBreweryFigures } from '../src/state.js';
import { BREWERY_KEY, saveBrewery, exportRecipeDocument } from '../src/persistence.js';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const text = (markup) => markup.replace(/<[^>]*>/g, ' ').replace(/&#x27;/g, "'").replace(/\s+/g, ' ');

function fakeStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    _map: m,
  };
}

// A brewery with figures of every kind set.
const BREWERY = (() => {
  const e = emptyBreweryFigures();
  return {
    ...e,
    fermentVolGal: 12,
    preBoilVolGal: 16,
    measurementTempF: { ...e.measurementTempF, ferment: 68 },
    efficiency: 0.93,
    mode: 'pro',
    water: { ...e.water, vessels: 2, treatment: 'tank', tankTreatedGal: 14, source: { ...e.water.source, Ca: 40 } },
  };
})();

describe('brewery file', () => {
  it('the brewery file is the document this browser keeps', async () => {
    const p = await import('../src/persistence.js');
    // BF-S1: byte for byte what storage holds.
    const s = fakeStorage();
    saveBrewery(s, BREWERY);
    expect(p.exportBreweryDocument(BREWERY)).toBe(s._map.get(BREWERY_KEY));
    // Named for the brewery and the day, as the recipe file is.
    expect(p.breweryFileName(new Date(2026, 9, 2))).toBe('Brew Design brewery 2026-10-02.json');
  });

  it('importing a brewery file asks first and never touches the recipe', async () => {
    const p = await import('../src/persistence.js');
    const file = p.exportBreweryDocument(BREWERY);
    // BF-S2: asked first; declined, nothing changes.
    let asked = 0;
    expect(p.importBreweryFile(file, () => ((asked += 1), false))).toEqual({ outcome: 'declined' });
    expect(asked).toBe(1);
    // Confirmed: the brewery's figures, as saved.
    const r = p.importBreweryFile(file, () => true);
    expect(r.outcome).toBe('replaced');
    expect(r.brewery).toEqual(BREWERY);
    // App replaces the brewery's figures through its usual brewery change
    // (saved at once) and never the recipe; it asks with the file's name.
    const app = readFileSync(join(SRC, 'App.jsx'), 'utf8');
    const handler = app.slice(app.indexOf('const importBrewery'), app.indexOf('};', app.indexOf('const importBrewery')));
    expect(handler).toMatch(/importBreweryFile\(/);
    expect(handler).toMatch(/window\.confirm\(/);
    expect(handler).toMatch(/changeBrewery\(result\.brewery\)/);
    expect(handler).not.toMatch(/setRecipe|setMode|setProGravityUnit|savePersisted/);
    // Options offers both.
    const { default: OptionsSection } = await import('../src/components/OptionsSection.jsx');
    const r0 = defaultRecipeState();
    const options = text(
      renderToStaticMarkup(
        createElement(OptionsSection, {
          measurementTempF: r0.measurementTempF,
          refVolumesGal: { preBoil: 7, postBoil: 5.5, ferment: 5.5 },
          mode: 'home',
          setMeasurementTemp: () => {},
          brewery: emptyBreweryFigures(),
          setBreweryFigure: () => {},
          setBreweryTemp: () => {},
          setBreweryWater: () => {},
          onUseRecipeFigures: () => {},
          onForgetBrewery: () => {},
          onExportBrewery: () => {},
          onImportBreweryFile: () => {},
          breweryFileMessage: 'Not imported: test message',
        }),
      ),
    );
    expect(options).toContain('Export my brewery figures');
    expect(options).toContain('Import my brewery figures');
    expect(options).toContain('Not imported: test message');
  });

  it('a file that is not a brewery file, is damaged, or is newer is refused; an older one is read as storage reads it', async () => {
    const p = await import('../src/persistence.js');
    const never = () => {
      throw new Error('asked');
    };
    const refused = (t) => p.importBreweryFile(t, never);
    // BF-S3: not a brewery file — a recipe file, text, nothing.
    for (const t of [exportRecipeDocument({ recipe: defaultRecipeState(), mode: 'home', proGravityUnit: 'plato' }), '{not json', '', 'null']) {
      const r = refused(t);
      expect(r.outcome).toBe('refused');
      expect(r.message).toMatch(/not a Brew Design brewery file, or it is damaged/);
      expect(r.message).toMatch(/Your brewery figures are unchanged\./);
    }
    // Damaged: a figure of the wrong kind.
    const damaged = JSON.parse(p.exportBreweryDocument(BREWERY));
    damaged.brewery.efficiency = '93';
    expect(refused(JSON.stringify(damaged)).outcome).toBe('refused');
    // Newer than this app reads.
    const newer = JSON.parse(p.exportBreweryDocument(BREWERY));
    newer.version = 4;
    const n = refused(JSON.stringify(newer));
    expect(n.outcome).toBe('refused');
    expect(n.message).toMatch(/saved by a newer version of Brew Design \(file version 4; this app reads up to version 3\)/);
    // Older files read as storage reads them: version 1 with the water blank,
    // version 2 without the water kept in the mash tun.
    const { water, ...v1 } = BREWERY;
    const r1 = p.importBreweryFile(JSON.stringify({ version: 1, brewery: v1 }), () => true);
    expect(r1.brewery).toEqual({ ...v1, water: emptyBreweryFigures().water });
    const r2 = p.importBreweryFile(JSON.stringify({ version: 2, brewery: { ...BREWERY, water: { ...BREWERY.water, keptInTunGal: 2 } } }), () => true);
    expect(r2.brewery).toEqual(BREWERY);
  });
});
