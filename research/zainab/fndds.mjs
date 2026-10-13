#!/usr/bin/env node
// FNDDS 2021-2023 (survey foods) lookup. research/usda.mjs does not index FNDDS because FNDDS
// food_nutrient.csv uses the legacy nutrient numbers (208 energy, 203 protein, 204 fat, 205 carbs
// by difference, 291 fibre, 269 sugars, 606 sat fat, 307 sodium, 255 water). This reads them.
//   node research/zainab/fndds.mjs search biryani        # matches with per-100 g macros
//   node research/zainab/fndds.mjs get 2706538           # per-100 g + portions (gram weights)
// carbs = available carbohydrate = by difference minus fibre (what Katori stores).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const base = path.join(here, '..', 'cache', 'usda', 'fndds');
const dir = path.join(base, fs.readdirSync(base).find((d) => fs.statSync(path.join(base, d)).isDirectory()));
const cacheFile = path.join(base, 'zainab-fndds-index.json');
const MAP = { 208: 'kcal', 203: 'protein', 204: 'fat', 205: 'carbsDiff', 291: 'fiber', 269: 'sugars', 606: 'satFat', 307: 'sodiumMg', 255: 'water' };
function parse(line) {
  const out = []; let cur = ''; let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true; else if (c === ',') { out.push(cur); cur = ''; } else cur += c;
  }
  out.push(cur); return out;
}
function rows(file) {
  const lines = fs.readFileSync(path.join(dir, file), 'utf8').split('\n').filter(Boolean);
  const h = parse(lines[0]);
  return lines.slice(1).map((l) => { const c = parse(l); const o = {}; h.forEach((k, i) => (o[k] = c[i])); return o; });
}
function build() {
  const foods = {};
  for (const r of rows('food.csv')) foods[r.fdc_id] = { fdcId: Number(r.fdc_id), description: r.description, n: {}, portions: [] };
  for (const r of rows('food_nutrient.csv')) { const k = MAP[r.nutrient_id]; if (k && foods[r.fdc_id]) foods[r.fdc_id].n[k] = Number(r.amount); }
  for (const r of rows('food_portion.csv')) if (foods[r.fdc_id] && Number(r.gram_weight) > 0) foods[r.fdc_id].portions.push(`${r.portion_description} = ${r.gram_weight} g`);
  const list = Object.values(foods);
  fs.writeFileSync(cacheFile, JSON.stringify(list));
  return list;
}
const list = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf8')) : build();
const per100 = (f) => ({ fdcId: f.fdcId, dataset: 'fndds', description: f.description, kcal: f.n.kcal, protein: f.n.protein,
  carbs: f.n.carbsDiff == null ? null : +(f.n.carbsDiff - (f.n.fiber || 0)).toFixed(2), carbsDiff: f.n.carbsDiff, fat: f.n.fat,
  fiber: f.n.fiber, sugars: f.n.sugars, satFat: f.n.satFat, sodiumMg: f.n.sodiumMg, water: f.n.water });
const [cmd, ...args] = process.argv.slice(2);
if (cmd === 'search') {
  const t = args.join(' ').toLowerCase().split(/\s+/);
  const hits = list.filter((f) => t.every((x) => f.description.toLowerCase().includes(x))).sort((a, b) => a.description.length - b.description.length).slice(0, 30);
  for (const f of hits) { const p = per100(f); console.log(`${f.fdcId}\t${p.kcal} kcal\tP${p.protein} C${p.carbs} F${p.fat} Fib${p.fiber}\t${f.description}`); }
  if (!hits.length) console.log('No matches.');
} else if (cmd === 'get') {
  for (const id of args) { const f = list.find((x) => String(x.fdcId) === id); console.log(f ? JSON.stringify({ ...per100(f), portions: f.portions }) : `{"fdcId":${id},"error":"not found"}`); }
}
