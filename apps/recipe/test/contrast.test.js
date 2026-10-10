// contrast.test.js
// "Each text grey reaches 4.5:1 on the darkest background it sits on, its hue
// kept, darkened no further" (docs/items/boxes-and-access.md, BA3-S1, S14-Q3).
// The ratios are worked here from the colours by WCAG 2.2's own definitions
// (relative luminance, contrast ratio), independently of the app; they prove
// the greys on the page's gradient too, which the browser scan cannot read.
//
// Where each grey sits, surveyed in the built app (2026-10-10; every tab and
// Water screen, Home and Pro, 1200 and 375 px, the References page):
//   textMuted     white, the notice tint #f0f5fa, the page's gradient
//                 (#f5f7fa to #eaf0f6: the inactive tabs), the stat tiles'
//                 gradient (#e8eef6 to #dfe9f2): darkest #dfe9f2
//   textSecondary white, the pill tint #e8eef6, the notice tint, the page's
//                 gradient (the References page's back link), the stat
//                 tiles' gradient: darkest #dfe9f2
//   textFooter    the page's gradient only (the footer): darkest #eaf0f6
// Before (styles.js until S14): textMuted #7c8fa6, textSecondary #5a7390,
// textFooter #9faec0.

import { describe, it, expect } from 'vitest';
import { colors } from '../src/components/shared/styles.js';

const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);

// WCAG 2.2, "relative luminance" and "contrast ratio" (definitions).
const linear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const luminance = (hex) => {
  const [r, g, b] = channels(hex).map(linear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// Hue (degrees), saturation and lightness (0 to 1), and back.
function hsl(hex) {
  const [r, g, b] = channels(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = d === 0 ? 0 : max === r ? ((g - b) / d + (g < b ? 6 : 0)) * 60 : max === g ? ((b - r) / d + 2) * 60 : ((r - g) / d + 4) * 60;
  return { h, s, l };
}
function fromHsl({ h, s, l }) {
  const f = (n) => {
    const k = (n + h / 30) % 12;
    return l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return `#${[0, 8, 4].map((n) => Math.round(f(n) * 255).toString(16).padStart(2, '0')).join('')}`;
}

const GREYS = [
  { name: 'textMuted', before: '#7c8fa6', darkest: '#dfe9f2' },
  { name: 'textSecondary', before: '#5a7390', darkest: '#dfe9f2' },
  { name: 'textFooter', before: '#9faec0', darkest: '#eaf0f6' },
];

describe('each text grey reaches 4.5:1 on the darkest background it sits on (BA3-S1)', () => {
  it('the formulas give the published figures', () => {
    // Black on white is 21:1 by definition; #767676 on white is the well-known
    // lightest grey at 4.5:1 (4.54).
    expect(ratio('#000000', '#ffffff')).toBeCloseTo(21, 9);
    expect(ratio('#767676', '#ffffff')).toBeCloseTo(4.54, 2);
  });

  for (const { name, before, darkest } of GREYS) {
    it(`${name}: 4.5:1 or more, the hue kept, no darker than it needs`, () => {
      const now = colors[name];
      // It failed before.
      expect(ratio(before, darkest)).toBeLessThan(4.5);
      // It passes now, on its darkest background and so on every lighter one.
      expect(ratio(now, darkest)).toBeGreaterThanOrEqual(4.5);
      // Its hue and saturation are the old grey's, within the rounding of a
      // colour to whole steps of 1/255.
      expect(Math.abs(hsl(now).h - hsl(before).h)).toBeLessThan(1);
      expect(Math.abs(hsl(now).s - hsl(before).s)).toBeLessThan(0.01);
      // Darkened no further: half a percent lighter, it falls below 4.5:1.
      expect(ratio(fromHsl({ ...hsl(now), l: hsl(now).l + 0.005 }), darkest)).toBeLessThan(4.5);
    });
  }
});
