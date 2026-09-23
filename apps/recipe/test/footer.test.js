// footer.test.js
// Scenarios for the Footer item (scope table agreed 2026-09-23,
// docs/items/persyn-footer.md), named from its sentences F1, F3 and F5. The
// suite has no browser DOM, so the footer is rendered to markup with
// react-dom/server; its placement on both tabs, the see-through logo on the
// tint (F2), its absence from print (F4) and the spacing (D4) are the far end.

import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

// Imported inside each scenario so that, before the footer exists, each one
// fails on its own rather than the whole file failing to load.
const renderFooter = async () => {
  const { default: Footer } = await import('../src/components/Footer.jsx');
  // React 19's server renderer puts an image-preload hint ahead of the
  // markup; the footer is the <footer> element itself.
  const markup = renderToStaticMarkup(createElement(Footer));
  return markup.match(/<footer\b.*<\/footer>/s)?.[0] ?? '';
};

const imgTags = (markup) => markup.match(/<img\b[^>]*>/g) ?? [];

const filesUnder = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });

describe('footer', () => {
  it('the footer names Persyn Chemical Engineering and Consulting beside the logo', async () => {
    const markup = await renderFooter();
    expect(markup).toMatch(/^<footer\b/);
    expect(imgTags(markup)).toHaveLength(1);
    // The company name is the footer's only text (D1: no pointer to a Notes page).
    const text = markup.replace(/<[^>]*>/g, '').trim();
    expect(text).toBe('Persyn Chemical Engineering and Consulting');
  });

  it('screen readers skip the footer logo', async () => {
    const [img] = imgTags(await renderFooter());
    expect(img).toMatch(/\salt=""/);
    expect(img).toMatch(/\saria-hidden="true"/);
  });

  it('the white-background logo file is gone and nothing refers to it', () => {
    expect.soft(existsSync(join(SRC, 'assets', 'persyn-logo.jpg'))).toBe(false);
    const referring = filesUnder(SRC).filter((path) =>
      readFileSync(path, 'latin1').includes('persyn-logo.jpg'),
    );
    expect(referring).toEqual([]);
  });
});
