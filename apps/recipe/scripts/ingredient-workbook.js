// ingredient-workbook.js
// Reads the owner's ingredient workbook (data/Brew Design Ingredients.xlsx)
// into the ingredient list the app carries (SPEC rule 16), and checks it.
// Shared by the refresh tool (refresh-ingredients.js) and the ingredient test
// (test/ingredients.test.js). Development only: the app never reads the
// workbook, only the copy the refresh tool writes (src/ingredients.json).
//
// Every number is the value Excel stores in its cell, never the displayed
// text, and is carried unrounded; nothing is converted (the workbook stores
// percentages as fractions, colour in °L and temperatures in °F, as the recipe
// state does). Columns are found by their header text in row 1, so a column
// the owner inserts cannot shift a number. Problems name the sheet and the
// workbook's own row number, the one the owner sees in Excel.

import ExcelJS from 'exceljs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const WORKBOOK_PATH = join(HERE, '..', '..', '..', 'data', 'Brew Design Ingredients.xlsx');
export const COPY_PATH = join(HERE, '..', 'src', 'ingredients.json');

// Per sheet: the list it fills, and each carried field in the copy's key
// order, with its header and kind. 'percent' is a required fraction in 0–1;
// 'colour' a required number ≥ 0; 'type' Ale or Lager; 'labTemp' the optional
// lab range (blank as a pair, or both ends with low ≤ high); 'text' a label.
const SHEETS = [
  {
    sheet: 'Malts',
    list: 'malts',
    fields: [
      { key: 'name', header: 'Name', kind: 'name' },
      { key: 'fgdb', header: 'FGDB (%)', kind: 'percent' },
      { key: 'colorL', header: 'Colour (°L)', kind: 'colour' },
    ],
  },
  {
    sheet: 'Hops',
    list: 'hops',
    fields: [
      { key: 'name', header: 'Name', kind: 'name' },
      { key: 'alphaAcidFraction', header: 'Alpha acid (%)', kind: 'percent' },
    ],
  },
  {
    sheet: 'Yeasts',
    list: 'yeasts',
    fields: [
      { key: 'name', header: 'Name', kind: 'name' },
      { key: 'lab', header: 'Lab', kind: 'text' },
      { key: 'productCode', header: 'Product code', kind: 'text' },
      { key: 'type', header: 'Ale / Lager', kind: 'type' },
      { key: 'apparentAttenuation', header: 'Attenuation (%)', kind: 'percent' },
      { key: 'labTempLowF', header: 'Lab temp low (°F)', kind: 'labTemp' },
      { key: 'labTempHighF', header: 'Lab temp high (°F)', kind: 'labTemp' },
    ],
  },
];

export async function readWorkbook(path) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path);
  return workbook;
}

// The value Excel stores: a formula cell by its cached result, a hyperlink by
// its text, rich text as its plain text. Empty cells are null.
function stored(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'object' || value instanceof Date) return value;
  if ('formula' in value || 'sharedFormula' in value) return stored(value.result);
  if ('richText' in value) return value.richText.map((part) => part.text).join('');
  if ('text' in value) return stored(value.text);
  if ('error' in value) return String(value.error); // e.g. #DIV/0!: not a number
  return value;
}

const isBlank = (v) => v === null || (typeof v === 'string' && v.trim() === '');
const isNumber = (v) => typeof v === 'number' && Number.isFinite(v);
const asText = (v) => (isBlank(v) ? '' : typeof v === 'string' ? v.trim() : String(v).trim());
const shown = (v) => (typeof v === 'string' ? JSON.stringify(v) : String(v));

// { list: { malts, hops, yeasts }, rows: { malts: [row numbers], … }, problems: [text] }
export function ingredientsFromWorkbook(workbook) {
  const list = {};
  const rows = {};
  const problems = [];

  for (const { sheet, list: listKey, fields } of SHEETS) {
    list[listKey] = [];
    rows[listKey] = [];
    const ws = workbook.getWorksheet(sheet);
    if (!ws) {
      problems.push(`${sheet}: the sheet is missing`);
      continue;
    }

    const headerRow = ws.getRow(1);
    const columnOf = {};
    headerRow.eachCell({ includeEmpty: false }, (cell, col) => {
      const text = asText(stored(cell.value));
      if (!(text in columnOf)) columnOf[text] = col;
    });
    const missing = fields.filter((f) => !(f.header in columnOf));
    for (const f of missing) problems.push(`${sheet}: no column headed "${f.header}" in row 1`);
    if (missing.length) continue;

    const firstRowOf = new Map(); // lower-cased trimmed name -> row number
    for (let r = 2; r <= ws.rowCount; r++) {
      const cells = {};
      for (const f of fields) cells[f.key] = stored(ws.getRow(r).getCell(columnOf[f.header]).value);
      const name = asText(cells.name);
      if (name === '') continue; // L3: every row with a name

      const at = `${sheet} row ${r} (${name})`;
      const item = {};
      for (const f of fields) {
        const v = cells[f.key];
        if (f.kind === 'name') item.name = name;
        else if (f.kind === 'text') item[f.key] = asText(v);
        else if (f.kind === 'type') {
          const t = asText(v).toLowerCase();
          if (t === 'ale' || t === 'lager') item.type = t;
          else problems.push(`${at}: "${f.header}" is ${isBlank(v) ? 'blank' : shown(v)}; it must be Ale or Lager`);
        } else if (f.kind === 'percent') {
          if (isBlank(v)) problems.push(`${at}: "${f.header}" is blank`);
          else if (!isNumber(v)) problems.push(`${at}: "${f.header}" is ${shown(v)}, not a number`);
          else if (v < 0 || v > 1) {
            const hint = v > 1 ? ' (a percentage typed without the % sign?)' : '';
            problems.push(`${at}: "${f.header}" is stored as ${v}, outside 0–100%${hint}`);
          } else item[f.key] = v;
        } else if (f.kind === 'colour') {
          if (isBlank(v)) problems.push(`${at}: "${f.header}" is blank`);
          else if (!isNumber(v)) problems.push(`${at}: "${f.header}" is ${shown(v)}, not a number`);
          else if (v < 0) problems.push(`${at}: "${f.header}" is ${v}, below 0`);
          else item[f.key] = v;
        } else if (f.kind === 'labTemp') {
          if (isBlank(v)) item[f.key] = null;
          else if (!isNumber(v)) problems.push(`${at}: "${f.header}" is ${shown(v)}, not a number`);
          else item[f.key] = v;
        }
      }

      if (listKey === 'yeasts' && item.labTempLowF !== undefined && item.labTempHighF !== undefined) {
        const low = item.labTempLowF;
        const high = item.labTempHighF;
        if ((low === null) !== (high === null)) {
          problems.push(`${at}: the lab temperature range has only one end; give both or neither`);
        } else if (low !== null && low > high) {
          problems.push(`${at}: the lab temperature range is inverted (low ${low} °F above high ${high} °F)`);
        }
      }

      const key = name.toLowerCase();
      if (firstRowOf.has(key)) {
        problems.push(`${at}: the same name as row ${firstRowOf.get(key)} (capital letters ignored)`);
      } else firstRowOf.set(key, r);

      list[listKey].push(item);
      rows[listKey].push(r);
    }
  }

  return { list, rows, problems };
}

// Every disagreement between the list read from the workbook and the app's
// copy, as text naming the sheet and, for a workbook row, its row number.
// Empty when the two agree exactly: same rows, same order, same numbers.
export function compareWithCopy({ list, rows }, copy) {
  const out = [];
  for (const { sheet, list: listKey, fields } of SHEETS) {
    const book = list[listKey] ?? [];
    const copied = Array.isArray(copy?.[listKey]) ? copy[listKey] : [];
    const copyByName = new Map(copied.map((item, i) => [item?.name, i]));
    const bookNames = new Set(book.map((item) => item.name));

    book.forEach((item, i) => {
      const at = `${sheet} row ${rows[listKey][i]} (${item.name})`;
      if (!copyByName.has(item.name)) {
        out.push(`${at}: in the workbook but not in the app's copy`);
        return;
      }
      const other = copied[copyByName.get(item.name)];
      for (const { key } of fields) {
        if (!Object.is(item[key], other[key])) {
          out.push(`${at}: ${key} is ${shown(item[key])} in the workbook, ${shown(other[key])} in the app's copy`);
        }
      }
      const extra = Object.keys(other).filter((k) => !fields.some((f) => f.key === k));
      if (extra.length) out.push(`${at}: the app's copy carries ${extra.join(', ')}, which the workbook row does not`);
    });

    for (const item of copied) {
      if (!bookNames.has(item?.name)) out.push(`${sheet}: ${shown(item?.name)} is in the app's copy but not in the workbook`);
    }

    if (!out.some((m) => m.startsWith(sheet))) {
      book.forEach((item, i) => {
        if (copied[i]?.name !== item.name) {
          out.push(`${sheet} row ${rows[listKey][i]} (${item.name}): in a different place in the app's copy`);
        }
      });
    }
  }
  return out;
}

// The copy's text: one ingredient per line, keys in a fixed order, so a
// changed number is one changed line in a diff. Numbers are written as
// JSON.stringify writes them: the shortest text that reads back as exactly
// the stored value. LF line endings and a final newline.
export function formatCopy(list) {
  const lines = ['{'];
  SHEETS.forEach(({ list: listKey, fields }, s) => {
    lines.push(`  "${listKey}": [`);
    list[listKey].forEach((item, i) => {
      const ordered = Object.fromEntries(fields.map(({ key }) => [key, item[key]]));
      lines.push(`    ${JSON.stringify(ordered)}${i < list[listKey].length - 1 ? ',' : ''}`);
    });
    lines.push(`  ]${s < SHEETS.length - 1 ? ',' : ''}`);
  });
  lines.push('}');
  return lines.join('\n') + '\n';
}
