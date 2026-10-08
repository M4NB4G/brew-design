// headers.mjs
// Reads the `[[headers]]` blocks of a netlify.toml, so a test, or a local
// server standing in for Netlify, can see the response headers the deploy
// sends (apps/recipe/netlify.toml). Only the shape that file uses is read:
//
//   [[headers]]
//     for = "/*"
//     [headers.values]
//       Name = "value"
//
// Values are double-quoted strings with no escapes; anything else is refused
// rather than guessed at.

const QUOTED = /^"([^"\\]*)"$/;

function unquote(text, where) {
  const m = QUOTED.exec(text.trim());
  if (!m) throw new Error(`${where}: expected a plain double-quoted string, found ${text.trim()}`);
  return m[1];
}

// Returns [{ for: '/*', values: { 'Header-Name': 'value', ... } }, ...].
export function readHeaders(tomlText) {
  const blocks = [];
  let block = null;
  let inValues = false;
  for (const raw of tomlText.split(/\r?\n/)) {
    const line = raw.replace(/^\s+/, '').replace(/\s+$/, '');
    if (line === '' || line.startsWith('#')) continue;
    if (line === '[[headers]]') {
      block = { for: null, values: {} };
      blocks.push(block);
      inValues = false;
      continue;
    }
    if (line === '[headers.values]') {
      if (!block) throw new Error('[headers.values] before any [[headers]]');
      inValues = true;
      continue;
    }
    if (line.startsWith('[')) {
      // Any other table (e.g. [build]) ends the headers block.
      block = null;
      inValues = false;
      continue;
    }
    if (!block) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    const value = unquote(line.slice(eq + 1), key);
    if (inValues) block.values[key.replace(/^"|"$/g, '')] = value;
    else if (key === 'for') block.for = value;
  }
  return blocks;
}

// The headers a path receives: every block whose `for` matches, later blocks
// winning. Only "/*" (everything) and an exact path are understood.
export function headersFor(blocks, path) {
  const out = {};
  for (const b of blocks) {
    if (b.for === '/*' || b.for === path) Object.assign(out, b.values);
  }
  return out;
}
