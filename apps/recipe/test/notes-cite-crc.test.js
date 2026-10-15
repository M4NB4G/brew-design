// notes-cite-crc.test.js
// Scenario for "The Water Notes cite the CRC Handbook for phosphoric acid"
// (scope table agreed 2026-10-15, docs/items/notes-cite-crc.md, CR-S1, CR-S2,
// CR-Q1; Tier C, wording only). The Notes' line on phosphoric acid as
// monoprotic ends with its source, the CRC Handbook of Chemistry and Physics,
// 97th edition (the edition the engine cites), in place of "a single
// proprietary source". The pK values on the line are untouched. CR-S2
// (nothing else changes) is held by the whole-page digests, which carry no
// Notes text, and by the other Notes tests. Rendered to markup with
// react-dom/server, as notes-wording.test.js does.
//
// No number is introduced.

import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const notes = async () => {
  const { default: NotesScreen } = await import('../src/components/water/NotesScreen.jsx');
  return renderToStaticMarkup(createElement(NotesScreen))
    .replace(/<!--[^>]*-->/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ');
};

describe('the Notes cite the CRC Handbook for phosphoric acid', () => {
  it('the Notes cite the CRC Handbook, 97th edition, for phosphoric acid as monoprotic, and not "a single proprietary source"', async () => {
    const t = await notes();
    expect(t).toContain(
      'Phosphoric acid is treated as effectively monoprotic at mash pH. Only the first dissociation (pKa1 ≈ 2.15) is active in the mash pH range; the second (pKa2 ≈ 7.20) is not. Source: CRC Handbook of Chemistry and Physics, 97th ed.',
    );
    expect(t).not.toContain('proprietary');
    expect(t).not.toContain('standard aqueous acid–base chemistry');
  });
});
