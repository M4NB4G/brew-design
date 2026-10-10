// security-headers.test.js
// Scenarios for the Security headers item (Tier D, batch F2, ROADMAP) and for
// "Three more response headers" (Tier D, batch F3). The site sends a
// Content-Security-Policy allowing the page's own files and Google Fonts only,
// refuses to be framed, trusts the type it sends, tells other sites its name
// and not the page, and refuses the camera, microphone and location. Netlify
// reads the headers from `apps/recipe/netlify.toml`; this suite reads them the
// same way and checks the app's own files against the policy. That a browser
// then runs the built app under the policy without one violation is checked at
// the far end, not here.

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { readHeaders, headersFor } from '../../../tools/netlify/headers.mjs';

const APP = fileURLToPath(new URL('../', import.meta.url));
const read = (rel) => readFileSync(`${APP}${rel}`, 'utf8');

const GOOGLE_FONTS_CSS = 'https://fonts.googleapis.com';
const GOOGLE_FONTS_FILES = 'https://fonts.gstatic.com';

const sent = headersFor(readHeaders(read('netlify.toml')), '/');

// "default-src 'self'; font-src https://x" -> { 'default-src': ["'self'"], 'font-src': ['https://x'] }
function directives(policy) {
  const out = {};
  for (const part of (policy ?? '').split(';')) {
    const [name, ...sources] = part.trim().split(/\s+/);
    if (name) out[name] = sources;
  }
  return out;
}

describe('Security headers', () => {
  // SH-S1
  it('every page carries a Content-Security-Policy allowing the page\'s own files and Google Fonts only', () => {
    const csp = sent['Content-Security-Policy'];
    expect(csp, 'no Content-Security-Policy header').toBeTruthy();
    const d = directives(csp);

    // Nothing is allowed unless named: the fallback is the page's own origin.
    expect(d['default-src']).toEqual(["'self'"]);
    // Scripts: the page's own bundle only. No inline script, no eval, no other origin.
    expect(d['script-src']).toEqual(["'self'"]);
    // Styles: the page's own stylesheet and the Google Fonts stylesheet.
    expect(d['style-src']).toEqual(["'self'", GOOGLE_FONTS_CSS]);
    // Fonts: the files the Google Fonts stylesheet names.
    expect(d['font-src']).toEqual([GOOGLE_FONTS_FILES]);
    // Plug-ins, a changed base address and form posts elsewhere are refused.
    expect(d['object-src']).toEqual(["'none'"]);
    expect(d['base-uri']).toEqual(["'self'"]);
    expect(d['form-action']).toEqual(["'self'"]);

    // Every origin the policy names anywhere is one of the two Google Fonts hosts.
    const origins = Object.values(d)
      .flat()
      .filter((s) => /^[a-z]+:|^\*/.test(s));
    expect(origins.sort()).toEqual([GOOGLE_FONTS_CSS, GOOGLE_FONTS_FILES].sort());
  });

  // SH-S2
  it('every page refuses to be framed', () => {
    const d = directives(sent['Content-Security-Policy']);
    expect(d['frame-ancestors']).toEqual(["'none'"]);
    // The older header, for browsers that predate frame-ancestors.
    expect(sent['X-Frame-Options']).toBe('DENY');
  });

  // SH-S3
  it('the page\'s own files ask for nothing the policy refuses', () => {
    const d = directives(sent['Content-Security-Policy']);
    const html = read('index.html');

    // The page loads one module script by address; no inline script, style or handler.
    const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
    expect(scripts.length).toBe(1);
    expect(scripts[0][1]).toMatch(/\bsrc="\/src\/main\.jsx"/);
    expect(scripts[0][2].trim()).toBe('');
    expect(html).not.toMatch(/<style\b/i);
    expect(html).not.toMatch(/\son[a-z]+\s*=/i);
    // Its only other address-bearing tags name files on its own origin.
    expect(html).not.toMatch(/(?:src|href)="(?:https?:)?\/\//i);

    // The stylesheet reaches one other origin, Google Fonts' stylesheet, which the policy allows.
    const css = read('src/index.css').replace(/\/\*[\s\S]*?\*\//g, '');
    const reached = [...css.matchAll(/https?:\/\/[^/'")\s]+/g)].map((m) => m[0]);
    expect([...new Set(reached)]).toEqual([GOOGLE_FONTS_CSS]);
    expect(d['style-src']).toContain(GOOGLE_FONTS_CSS);
  });

  // SH-S4 (F3)
  it('every page tells the browser to trust the type it sends', () => {
    // nosniff is the only value X-Content-Type-Options takes.
    expect(sent['X-Content-Type-Options']).toBe('nosniff');
  });

  // SH-S5 (F3)
  it('every page tells other sites this site\'s name and not the page', () => {
    // The browsers' default, written down.
    expect(sent['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
  });

  // SH-S6 (F3)
  it('every page refuses the camera, microphone and location, which the app does not use', () => {
    // "feature=()" is an empty allow-list: no page, frame or script may use it.
    // The location feature's name in the header is geolocation.
    const features = Object.fromEntries(
      (sent['Permissions-Policy'] ?? '').split(',').map((part) => part.trim().split('=')),
    );
    expect(features).toEqual({ camera: '()', microphone: '()', geolocation: '()' });

    // The app asks for none of them: nothing in its source, or the engine's,
    // reaches the camera, the microphone or the location.
    const walk = (dir, found = []) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = `${dir}${entry.name}`;
        if (entry.isDirectory()) walk(`${path}/`, found);
        else if (/\.(jsx?|mjs)$/.test(entry.name)) found.push(path);
      }
      return found;
    };
    const app = walk(`${APP}src/`);
    const engine = walk(fileURLToPath(new URL('../../../packages/engine/src/', import.meta.url)));
    // Each root yielded files, so the search below read something from both.
    expect(app.length).toBeGreaterThan(0);
    expect(engine.length).toBeGreaterThan(0);
    const asked = [...app, ...engine].filter((f) =>
      /getUserMedia|mediaDevices|geolocation|getCurrentPosition|watchPosition/.test(readFileSync(f, 'utf8')),
    );
    expect(asked).toEqual([]);
  });
});
