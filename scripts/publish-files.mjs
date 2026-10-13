#!/usr/bin/env node
// Prints the Artifact publish manifest for Katori (owner: Lena; ARCHITECTURE §11).
//   node scripts/publish-files.mjs          -> JSON: { page, files: { "<published path>": "<repo path>" } }
// The page is app/index.html; every other file under app/ is published at the same relative path,
// except the UI harness (app/ui/dev/). Also checks that every static relative import and every
// <link>/<script> in index.html resolves to a published file and that none uses an absolute path.
// Exit code 1 when a check fails.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, posix } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const APP = join(ROOT, 'app');
const EXCLUDE = [/^ui\/dev\//];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const published = walk(APP)
  .map((full) => relative(APP, full).split('\\').join('/'))
  .filter((p) => p !== 'index.html' && !EXCLUDE.some((re) => re.test(p)))
  .sort();
const publishedSet = new Set(published);

const problems = [];
const check = (from, spec) => {
  if (/^[a-z]+:/i.test(spec) || spec.startsWith('#')) return; // URL schemes, fragments
  if (spec.startsWith('/')) {
    problems.push(`${from}: absolute path "${spec}" (use a relative path)`);
    return;
  }
  const target = posix.normalize(posix.join(posix.dirname(from), spec));
  if (!publishedSet.has(target)) problems.push(`${from}: "${spec}" -> ${target} is not published`);
};

for (const file of published.filter((p) => p.endsWith('.js'))) {
  const src = readFileSync(join(APP, file), 'utf8');
  for (const [, spec] of src.matchAll(/^\s*(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]/gm)) {
    check(file, spec);
  }
  for (const [, spec] of src.matchAll(/^\s*import\s*['"]([^'"]+)['"]/gm)) check(file, spec);
}
const html = readFileSync(join(APP, 'index.html'), 'utf8');
for (const [, spec] of html.matchAll(/(?:src|href)="([^"]+)"/g)) check('index.html', spec);

const manifest = {
  page: 'app/index.html',
  files: Object.fromEntries(published.map((p) => [p, `app/${p}`])),
};
console.log(JSON.stringify(manifest, null, 2));
if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n${problems.map((p) => `  - ${p}`).join('\n')}`);
  process.exit(1);
}
console.error(`\n${published.length} files besides the page; all imports resolve.`);
