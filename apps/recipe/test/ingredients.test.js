// ingredients.test.js
// Scenarios for the Ingredient list in the app item (scope table agreed
// 2026-09-23, docs/items/ingredient-list-in-app.md), named from its sentences
// S1, S2 and S3 and its silent property L8 (idempotence). S4 — nothing on
// screen or in any recipe changes — is proved by the unchanged suites and the
// far end (the built bundle byte-identical to main's).
//
// The app's copy is apps/recipe/src/ingredients.json; the owner's workbook is
// data/Brew Design Ingredients.xlsx. Each number's rule is its workbook cell
// (L5), so the pin is exact equality with that cell — no tolerance.

import { describe, it, expect } from 'vitest';
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ExcelJS from 'exceljs';

// Imported inside each scenario so that, before the reader, the refresh tool
// and the copy exist, each scenario fails on its own rather than the whole
// file failing to load.
const reader = () => import('../scripts/ingredient-workbook.js');
const refresher = () => import('../scripts/refresh-ingredients.js');

async function realWorkbook() {
  const { WORKBOOK_PATH, readWorkbook } = await reader();
  return readWorkbook(WORKBOOK_PATH);
}

async function committedCopyText() {
  const { COPY_PATH } = await reader();
  // The repository stores the copy with LF line endings; a Windows checkout
  // may turn them into CRLF. The committed bytes are the LF form.
  return readFileSync(COPY_PATH, 'utf8').replace(/\r\n/g, '\n');
}

const sheetRow = (sheet, row) => new RegExp(`^${sheet} row ${row}\\b`);

describe('ingredient list', () => {
  it("the app's ingredient list is exactly the workbook's: every row, every number, in the workbook's order", async () => {
    const { ingredientsFromWorkbook, compareWithCopy } = await reader();
    const fromWorkbook = ingredientsFromWorkbook(await realWorkbook());
    expect(fromWorkbook.problems).toEqual([]);

    const copy = JSON.parse(await committedCopyText());
    expect(compareWithCopy(fromWorkbook, copy)).toEqual([]);
    // Field by field, exact: same rows, same order, same keys, same numbers.
    expect(copy).toStrictEqual(fromWorkbook.list);

    // Pins read by hand from the workbook and the item file, independent of
    // the reader: the row counts, the stored (not displayed) value, zero as a
    // legitimate FGDB and colour, accents kept exactly.
    expect(copy.malts).toHaveLength(42);
    expect(copy.hops).toHaveLength(43);
    expect(copy.yeasts).toHaveLength(32);
    expect(copy.hops.find((h) => h.name === 'Bravo')).toStrictEqual({
      name: 'Bravo',
      alphaAcidFraction: 0.144,
    });
    expect(copy.hops.some((h) => h.name === 'Hallertau Mittelfrüh')).toBe(true);
    expect(copy.yeasts.some((y) => y.name === 'WLP4061 Rhine Kölsch Ale')).toBe(true);
    expect(copy.malts.find((m) => m.name === 'Rice Hulls')).toStrictEqual({
      name: 'Rice Hulls',
      fgdb: 0,
      colorL: 0,
    });
    expect(copy.malts[0]).toStrictEqual({ name: '2-Row Brewers Malt', fgdb: 0.82, colorL: 2.2 });
    expect(copy.yeasts[0]).toStrictEqual({
      name: 'A07 Flagship',
      lab: 'Imperial',
      productCode: 'A07',
      type: 'ale',
      apparentAttenuation: 0.8,
      labTempLowF: 60,
      labTempHighF: 72,
    });
  });

  it('a row added, removed or renamed, or a number changed, in the workbook but not the copy fails the match and names the row', async () => {
    const { ingredientsFromWorkbook, compareWithCopy } = await reader();
    const copy = JSON.parse(await committedCopyText());

    const mismatches = async (edit) => {
      const wb = await realWorkbook();
      edit(wb);
      const fromWorkbook = ingredientsFromWorkbook(wb);
      expect(fromWorkbook.problems).toEqual([]);
      return compareWithCopy(fromWorkbook, copy);
    };
    const cellOf = (ws, rowNumber, header) => {
      const col = ws.getRow(1).values.indexOf(header);
      return ws.getRow(rowNumber).getCell(col);
    };

    // Add a hop: a new row 45 on the Hops sheet.
    const added = await mismatches((wb) => {
      const ws = wb.getWorksheet('Hops');
      const row = ws.getRow(45);
      row.getCell(ws.getRow(1).values.indexOf('Name')).value = 'Strata';
      row.getCell(ws.getRow(1).values.indexOf('Alpha acid (%)')).value = 0.12;
      row.commit();
    });
    expect(added.length).toBeGreaterThan(0);
    expect(added.some((m) => sheetRow('Hops', 45).test(m) && m.includes('Strata'))).toBe(true);

    // Remove a malt: Vienna, row 42, deleted from the sheet.
    const removed = await mismatches((wb) => {
      const ws = wb.getWorksheet('Malts');
      expect(cellOf(ws, 42, 'Name').value).toBe('Vienna');
      ws.spliceRows(42, 1);
    });
    expect(removed.length).toBeGreaterThan(0);
    expect(removed.some((m) => m.startsWith('Malts') && m.includes('Vienna'))).toBe(true);

    // Rename a yeast: row 2, A07 Flagship → A07 Flagship Ale.
    const renamed = await mismatches((wb) => {
      cellOf(wb.getWorksheet('Yeasts'), 2, 'Name').value = 'A07 Flagship Ale';
    });
    expect(renamed.some((m) => sheetRow('Yeasts', 2).test(m) && m.includes('A07 Flagship Ale'))).toBe(true);
    // …and the old name, now in the copy only, is named too.
    expect(renamed.some((m) => m.startsWith('Yeasts') && m.replace('A07 Flagship Ale', '').includes('A07 Flagship'))).toBe(true);

    // Change one alpha: Bravo, row 5, 0.144 → 0.147.
    const changed = await mismatches((wb) => {
      const cell = cellOf(wb.getWorksheet('Hops'), 5, 'Alpha acid (%)');
      expect(cell.value).toBe(0.144);
      cell.value = 0.147;
    });
    expect(changed).toHaveLength(1);
    expect(changed[0]).toMatch(sheetRow('Hops', 5));
    expect(changed[0]).toContain('Bravo');
    expect(changed[0]).toContain('0.147');
    expect(changed[0]).toContain('0.144');
  });

  it('an unusable workbook is refused, naming the sheet and row: duplicate name, blank or non-number required number, percentage outside 0–100%, negative colour, yeast neither Ale nor Lager, lab range inverted', async () => {
    const { ingredientsFromWorkbook } = await reader();
    const real = await realWorkbook();
    const headersOf = (sheet) => real.getWorksheet(sheet).getRow(1).values.slice(1);

    // A small workbook with the real headers; each value is placed under its
    // header by name, so the case reads as the owner would see it.
    const build = ({ malts = [], hops = [], yeasts = [] }) => {
      const wb = new ExcelJS.Workbook();
      for (const [sheet, rows] of [['Malts', malts], ['Hops', hops], ['Yeasts', yeasts]]) {
        const headers = headersOf(sheet);
        const ws = wb.addWorksheet(sheet);
        ws.addRow(headers);
        for (const r of rows) ws.addRow(headers.map((h) => (h in r ? r[h] : null)));
      }
      return wb;
    };
    const malt = (name, fgdb, colour) => ({ Name: name, 'FGDB (%)': fgdb, 'Colour (°L)': colour });
    const hop = (name, alpha) => ({ Name: name, 'Alpha acid (%)': alpha });
    const yeast = (name, type, att, low, high) => ({
      Name: name, Lab: 'Imperial', 'Product code': 'X1', 'Ale / Lager': type,
      'Attenuation (%)': att, 'Lab temp low (°F)': low, 'Lab temp high (°F)': high,
    });
    const good = {
      malts: [malt('Rice Hulls', 0, 0), malt('Vienna', 0.8, 3.2)],
      hops: [hop('Bravo', 0.144)],
      yeasts: [yeast('A07 Flagship', 'Ale', 0.8, 60, 72), yeast('L13 Global', 'Lager', 0.75, null, null)],
    };

    // The base is usable: zero FGDB and colour, and a lab range blank as a pair.
    expect(ingredientsFromWorkbook(build(good)).problems).toEqual([]);

    const refused = (parts) => ingredientsFromWorkbook(build({ ...good, ...parts })).problems;
    const cases = [
      // The seeding slip of 2026-09-23: the same malt spelled with a lower-case f.
      ['duplicate name, capitals ignored', { malts: [malt('Flaked Oats', 0.7, 1), malt('flaked Oats', 0.7, 1)] }, 'Malts', 3],
      ['duplicate name, surrounding spaces ignored', { hops: [hop('Bravo', 0.144), hop(' Bravo ', 0.144)] }, 'Hops', 3],
      ['blank alpha', { hops: [hop('Bravo', null)] }, 'Hops', 2],
      ['blank FGDB', { malts: [malt('Vienna', null, 3.2)] }, 'Malts', 2],
      ['blank colour', { malts: [malt('Vienna', 0.8, null)] }, 'Malts', 2],
      ['blank attenuation', { yeasts: [yeast('A07 Flagship', 'Ale', null, 60, 72)] }, 'Yeasts', 2],
      ['blank ale/lager', { yeasts: [yeast('A07 Flagship', null, 0.8, 60, 72)] }, 'Yeasts', 2],
      ['alpha typed as text', { hops: [hop('Bravo', '14.4%')] }, 'Hops', 2],
      ['colour typed as text', { malts: [malt('Vienna', 0.8, '3.2 °L')] }, 'Malts', 2],
      // FGDB typed as 82 without the % sign: Excel stores 82, not 0.82.
      ['FGDB 82 without the % sign', { malts: [malt('Vienna', 82, 3.2)] }, 'Malts', 2],
      ['alpha above 100%', { hops: [hop('Bravo', 14.4)] }, 'Hops', 2],
      ['attenuation below 0%', { yeasts: [yeast('A07 Flagship', 'Ale', -0.8, 60, 72)] }, 'Yeasts', 2],
      ['negative colour', { malts: [malt('Vienna', 0.8, -1)] }, 'Malts', 2],
      ['yeast neither Ale nor Lager', { yeasts: [yeast('A07 Flagship', 'Hybrid', 0.8, 60, 72)] }, 'Yeasts', 2],
      ['lab range inverted', { yeasts: [yeast('A07 Flagship', 'Ale', 0.8, 72, 60)] }, 'Yeasts', 2],
      ['lab range with only its low end', { yeasts: [yeast('A07 Flagship', 'Ale', 0.8, 60, null)] }, 'Yeasts', 2],
      ['lab range with only its high end', { yeasts: [yeast('A07 Flagship', 'Ale', 0.8, null, 72)] }, 'Yeasts', 2],
      ['lab temperature typed as text', { yeasts: [yeast('A07 Flagship', 'Ale', 0.8, '60F', 72)] }, 'Yeasts', 2],
    ];
    for (const [label, parts, sheet, row] of cases) {
      const problems = refused(parts);
      expect(problems, label).not.toEqual([]);
      expect(problems.some((p) => sheetRow(sheet, row).test(p)), `${label}: ${problems.join(' | ')}`).toBe(true);
    }

    // A header the reader needs, missing: refused, naming the sheet and header.
    const noColour = build(good);
    noColour.getWorksheet('Malts').getRow(1).getCell(headersOf('Malts').indexOf('Colour (°L)') + 1).value = 'Colour';
    const missing = ingredientsFromWorkbook(noColour).problems;
    expect(missing.some((p) => p.startsWith('Malts') && p.includes('Colour (°L)'))).toBe(true);

    // The refresh tool writes nothing from a workbook it refuses.
    const { refreshIngredients } = await refresher();
    const dir = mkdtempSync(join(tmpdir(), 'brew-ingredients-'));
    try {
      const bad = join(dir, 'bad.xlsx');
      const out = join(dir, 'ingredients.json');
      await build({ ...good, malts: [malt('Vienna', 82, 3.2)] }).xlsx.writeFile(bad);
      const result = await refreshIngredients(bad, out);
      expect(result.problems.some((p) => sheetRow('Malts', 2).test(p))).toBe(true);
      expect(existsSync(out)).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('refreshing twice gives an identical copy', async () => {
    const { WORKBOOK_PATH } = await reader();
    const { refreshIngredients } = await refresher();
    const dir = mkdtempSync(join(tmpdir(), 'brew-ingredients-'));
    try {
      const first = join(dir, 'first.json');
      const second = join(dir, 'second.json');
      expect((await refreshIngredients(WORKBOOK_PATH, first)).problems).toEqual([]);
      expect((await refreshIngredients(WORKBOOK_PATH, second)).problems).toEqual([]);
      const a = readFileSync(first);
      const b = readFileSync(second);
      expect(a.equals(b)).toBe(true);
      expect(a.toString('utf8')).toBe(await committedCopyText());
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
