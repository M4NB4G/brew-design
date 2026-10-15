// @vitest-environment jsdom
// references-heading-level.test.js
// Scenario for "The References page's heading steps down one level" (scope
// table agreed 2026-10-15, docs/items/references-heading-level.md, RH-S1,
// RH-Q1; Tier C, markup only). The whole app is drawn in jsdom and the page
// opened from the footer: the header's "Brew Design" is the page's only
// level-one heading, and "References" is a level-two heading. RH-S2 (the page
// looks the same) is looked at in a browser; RH-S3 is the browser suite's
// accessibility scan.
//
// No number is introduced.

import { afterEach, describe, expect, it } from 'vitest';
import { mount, unmount, page, text, click, button } from './page-error.fixture.js';

afterEach(() => unmount());

describe('the References page has one level-one heading', () => {
  it('the References page has one level-one heading, the header\'s "Brew Design", and "References" at level two', () => {
    mount();
    click(button('References'));
    const headings = (level) => [...page().querySelectorAll(`h${level}`)].map((h) => text(h));
    expect(headings(1)).toEqual(['Brew Design']);
    expect(headings(2)).toContain('References');
  });
});
