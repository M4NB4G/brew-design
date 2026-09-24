// skip-unchanged.mjs
// Netlify's `ignore` command (apps/recipe/netlify.toml): cancel the build when
// a push changes nothing the site is built from, so a documents-only push to
// `main` publishes nothing and costs no deploy credits
// (docs/items/netlify-skip-unchanged.md). Netlify runs it from the base
// directory, the repository root: exit 0 cancels the build, exit 1 builds.
// When it cannot tell what changed, it builds.
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// What the site is built from: the app and the engine (not their tests), and
// the root package files.
export function isBuiltFrom(file) {
  if (file === 'package.json' || file === 'package-lock.json') return true;
  if (!/^(apps|packages)\//.test(file)) return false;
  return !/^(apps|packages)\/[^/]+\/test\//.test(file);
}

// previous: the last commit Netlify built; current: this commit;
// changedFiles: the paths that differ between them, or null when the
// comparison failed. Returns 'build' or 'skip'.
export function decide({ previous, current, changedFiles }) {
  if (!previous || !current || previous === current) return 'build';
  if (!Array.isArray(changedFiles)) return 'build';
  return changedFiles.some(isBuiltFrom) ? 'build' : 'skip';
}

function changedBetween(previous, current) {
  try {
    const out = execFileSync('git', ['diff', '--name-only', previous, current], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return out.split('\n').filter(Boolean);
  } catch {
    return null;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const previous = process.env.CACHED_COMMIT_REF;
  const current = process.env.COMMIT_REF;
  const changedFiles = previous && current && previous !== current ? changedBetween(previous, current) : null;
  const decision = decide({ previous, current, changedFiles });
  console.log(
    decision === 'skip'
      ? `Skipping the build: nothing the site is built from changed since ${previous.slice(0, 7)}.`
      : `Building: ${changedFiles ? 'the app, the engine or the package files changed' : 'cannot tell what changed since the last build'}.`,
  );
  process.exit(decision === 'skip' ? 0 : 1);
}
