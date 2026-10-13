#!/usr/bin/env node
// USDA FoodData Central lookup for the Nutrition Lab (SR Legacy, Foundation, FNDDS bulk CSVs).
//
//   node research/usda.mjs search chicken breast roasted     # top matches with fdc ids
//   node research/usda.mjs get 171477 2346393                 # per-100 g nutrients
//
// Carbs are reported two ways: "carbsDiff" (USDA by difference, includes fibre) and "carbs"
// (available carbohydrate = by difference minus fibre), which is what Katori stores.
// Data lives in research/cache/usda/ (not committed). The first run builds a compact index.

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const CACHE = path.join(here, 'cache', 'usda');
const INDEX = path.join(CACHE, 'index.json');
const DATASETS = ['sr_legacy', 'foundation', 'fndds'];
const NUTRIENTS = {
  1008: 'kcal',
  2047: 'kcalAtwaterGeneral',
  2048: 'kcalAtwaterSpecific',
  1003: 'protein',
  1004: 'fat',
  1005: 'carbsDiff',
  1079: 'fiber',
  2000: 'sugars',
  1063: 'sugarsNLEA',
  1258: 'satFat',
  1093: 'sodiumMg',
  1051: 'water',
};

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

async function readCsv(file, onRow) {
  const rl = readline.createInterface({ input: fs.createReadStream(file), crlfDelay: Infinity });
  let header = null;
  for await (const line of rl) {
    if (!line) continue;
    const cols = parseCsvLine(line);
    if (!header) { header = cols; continue; }
    const row = {};
    header.forEach((h, i) => (row[h] = cols[i]));
    onRow(row);
  }
}

function datasetDir(name) {
  const base = path.join(CACHE, name);
  const sub = fs.readdirSync(base).find((d) => fs.statSync(path.join(base, d)).isDirectory());
  return path.join(base, sub);
}

async function buildIndex() {
  const foods = {};
  for (const ds of DATASETS) {
    const dir = datasetDir(ds);
    await readCsv(path.join(dir, 'food.csv'), (r) => {
      foods[r.fdc_id] = { fdcId: Number(r.fdc_id), dataset: ds, description: r.description, n: {} };
    });
    await readCsv(path.join(dir, 'food_nutrient.csv'), (r) => {
      const key = NUTRIENTS[r.nutrient_id];
      const f = foods[r.fdc_id];
      if (key && f && r.amount !== '') f.n[key] = Number(r.amount);
    });
  }
  const list = Object.values(foods).filter((f) => Object.keys(f.n).length);
  fs.writeFileSync(INDEX, JSON.stringify(list));
  return list;
}

async function load() {
  if (fs.existsSync(INDEX)) return JSON.parse(fs.readFileSync(INDEX, 'utf8'));
  process.stderr.write('Building USDA index (first run only)…\n');
  return buildIndex();
}

function per100(f) {
  const n = f.n;
  const kcal = n.kcal ?? n.kcalAtwaterSpecific ?? n.kcalAtwaterGeneral ?? null;
  const fiber = n.fiber ?? 0;
  const carbsDiff = n.carbsDiff ?? null;
  return {
    fdcId: f.fdcId,
    dataset: f.dataset,
    description: f.description,
    kcal,
    protein: n.protein ?? null,
    carbs: carbsDiff == null ? null : Math.max(0, +(carbsDiff - fiber).toFixed(2)),
    carbsDiff,
    fat: n.fat ?? null,
    fiber: n.fiber ?? null,
    sugars: n.sugars ?? n.sugarsNLEA ?? null,
    satFat: n.satFat ?? null,
    sodiumMg: n.sodiumMg ?? null,
    water: n.water ?? null,
  };
}

const [cmd, ...args] = process.argv.slice(2);
const list = await load();
if (cmd === 'search') {
  const terms = args.join(' ').toLowerCase().split(/\s+/).filter(Boolean);
  const hits = list
    .filter((f) => terms.every((t) => f.description.toLowerCase().includes(t)))
    .sort((a, b) => a.description.length - b.description.length)
    .slice(0, 25);
  for (const f of hits) {
    const p = per100(f);
    console.log(`${f.fdcId}\t${f.dataset}\t${p.kcal ?? '?'} kcal\tP${p.protein} C${p.carbs} F${p.fat} Fib${p.fiber}\t${f.description}`);
  }
  if (!hits.length) console.log('No matches.');
} else if (cmd === 'get') {
  for (const id of args) {
    const f = list.find((x) => String(x.fdcId) === String(id));
    console.log(f ? JSON.stringify(per100(f)) : `{"fdcId":${id},"error":"not found"}`);
  }
} else {
  console.log('Usage: node research/usda.mjs search <words…> | get <fdcId…>');
}
