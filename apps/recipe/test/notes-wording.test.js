// notes-wording.test.js
// Scenario for the roadmap item "Water Notes name the tool" (S6a, decisions
// NT-Q1 to NT-Q3, agreed 2026-10-03). Inside Brew Design the Notes' two
// disclaimers and the validation note call the app "Brew Design", not
// "Brew Water Chem"; "Brew Water Chem" stays only where the text credits the
// chemistry's origin. Only the name changes, every other word is untouched.
// Rendered to markup with react-dom/server, as water-tab.test.js does.

import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const notes = async () => {
  const { default: NotesScreen } = await import('../src/components/water/NotesScreen.jsx');
  return renderToStaticMarkup(createElement(NotesScreen))
    .replace(/<!--[^>]*-->/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ');
};

describe('water notes name the tool', () => {
  it('the disclaimers call the app Brew Design, and Brew Water Chem appears only as the credit for the chemistry', async () => {
    const t = await notes();
    expect(t).toContain('Brew Design is a free informational tool provided as-is');
    expect(t).toContain('Brew Design is a free, open-source calculator');
    expect(t).toContain('reliance on outputs produced by Brew Design,');
    const mentions = t.match(/Brew Water Chem/g) || [];
    expect(mentions).toHaveLength(1);
    expect(t).toContain("is Brew Water Chem's, unchanged");
  });
});
