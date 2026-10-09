// serve.mjs
// A static server for the built app (apps/recipe/dist) that sends the response
// headers apps/recipe/netlify.toml sets, so the browser suite runs the app under
// the policy the live site has. `vite preview` ignores netlify.toml.
// Run as a script it listens on PORT (default 4175); the suite starts it.

import http from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readHeaders, headersFor } from '../../../../tools/netlify/headers.mjs';

const APP = fileURLToPath(new URL('../../', import.meta.url));
const DIST = join(APP, 'dist');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
};

export function createServer() {
  const blocks = readHeaders(readFileSync(join(APP, 'netlify.toml'), 'utf8'));
  return http.createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let file = normalize(join(DIST, path));
    if (!file.startsWith(DIST)) return void res.writeHead(403).end();
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) return void res.writeHead(404).end('Not found');
    res.writeHead(200, {
      'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
      ...headersFor(blocks, path),
    });
    res.end(readFileSync(file));
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT ?? 4175);
  createServer().listen(port, () => console.log(`Serving dist/ with netlify.toml headers on http://localhost:${port}`));
}
