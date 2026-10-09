// control-character-lint.test.js
// The app's half of "A control-character test warns in the linter" (scope
// table agreed 2026-10-08, docs/items/control-character-lint.md), CR-S4: the
// exported file's name is as today. The linter's half, CR-S3, is
// `npm run lint` reporting no errors and no warnings.
//
// recipe-file.test.js already turns a tab and a line break into spaces, but
// those are spaces to the collapse that follows as well; the characters below
// are not, so only the file-name pattern's control-character range removes
// them.

import { describe, it, expect } from 'vitest';
import { recipeFileName } from '../src/persistence.js';

const sept22 = new Date(2026, 8, 22, 23, 59);

describe('a control-character test warns in the linter', () => {
  it('file names are as today', () => {
    // The first and last of the range \u0000-\u001f, one between, and \u007f
    // (delete): each becomes a space, and the spaces collapse.
    expect(recipeFileName('Hazy\u0000IPA', sept22)).toBe('Hazy IPA 2026-09-22.json');
    expect(recipeFileName('Hazy\u0001\u001fIPA', sept22)).toBe('Hazy IPA 2026-09-22.json');
    expect(recipeFileName('Hazy\u0007IPA\u007f', sept22)).toBe('Hazy IPA 2026-09-22.json');
    // A name of control characters alone is no name.
    expect(recipeFileName('\u0001\u0002\u007f', sept22)).toBe('Brew Design recipe 2026-09-22.json');
    // The first character past the range is kept as typed.
    expect(recipeFileName('Hazy\u0080IPA', sept22)).toBe('Hazy\u0080IPA 2026-09-22.json');
  });
});
