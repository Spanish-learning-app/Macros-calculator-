#!/usr/bin/env node
// Print the schema.org Recipe (JSON-LD) of a published recipe page: yield, ingredients exactly as
// written, and instructions. Used to triangulate standard recipes from ≥2 Pakistani sources.
//   node research/zainab/recipe-ld.mjs <url> [--steps]
// Pages are cached (untrusted) under research/cache/recipes/ and only parsed as text.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const cache = path.join(here, '..', 'cache', 'recipes');
fs.mkdirSync(cache, { recursive: true });
const url = process.argv[2];
const steps = process.argv.includes('--steps');
const file = path.join(cache, crypto.createHash('sha1').update(url).digest('hex').slice(0, 16) + '.html');
if (!fs.existsSync(file)) execFileSync('curl', ['-sSL', '-A', 'Mozilla/5.0 (research)', '-o', file, url]);
const html = fs.readFileSync(file, 'utf8');
const blocks = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const found = [];
const walk = (o) => {
  if (!o || typeof o !== 'object') return;
  if (Array.isArray(o)) return o.forEach(walk);
  const t = o['@type'];
  if (t === 'Recipe' || (Array.isArray(t) && t.includes('Recipe'))) found.push(o);
  for (const v of Object.values(o)) if (typeof v === 'object') walk(v);
};
for (const b of blocks) { try { walk(JSON.parse(b)); } catch { /* skip */ } }
if (!found.length) { console.log(`NO RECIPE JSON-LD: ${url}`); process.exit(0); }
const r = found[0];
const txt = (s) => String(s).replace(/&#\d+;|&[a-z]+;/g, (e) => ({ '&amp;': '&', '&#8531;': '⅓', '&#189;': '½', '&#188;': '¼', '&#190;': '¾', '&nbsp;': ' ' })[e] ?? e);
console.log(`# ${txt(r.name)}\n${url}\nyield: ${JSON.stringify(r.recipeYield)}`);
for (const i of r.recipeIngredient || []) console.log(`- ${txt(i)}`);
if (steps) {
  const flat = [];
  const w = (x) => { if (!x) return; if (Array.isArray(x)) return x.forEach(w); if (typeof x === 'string') return flat.push(x); if (x.text) flat.push(x.text); if (x.itemListElement) w(x.itemListElement); };
  w(r.recipeInstructions);
  flat.forEach((s, i) => console.log(`${i + 1}. ${txt(s)}`));
}
