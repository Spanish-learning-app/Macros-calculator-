#!/usr/bin/env node
// FNDDS 2021-2023 (survey foods) lookup, per 100 g, plus portions.
//   node research/javier/fndds.mjs search gyro sandwich
//   node research/javier/fndds.mjs get 2706962
// Why this exists: FNDDS food_nutrient.csv keys nutrients by the legacy nutrient NUMBER
// (208 energy, 203 protein, 204 fat, 205 carbohydrate by difference, 291 fibre, 269 sugars,
// 606 saturated fat, 307 sodium, 255 water), not by nutrient id, so research/usda.mjs
// finds no FNDDS nutrients. Carbs printed as "carbs" = available carbohydrate
// (by difference minus fibre), the Katori convention.
// Owner: Javier Morales (Nutrition Lab).

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const BASE = path.join(here, '..', 'cache', 'usda', 'fndds');
const DIR = path.join(BASE, fs.readdirSync(BASE).find((d) => fs.statSync(path.join(BASE, d)).isDirectory()));
const NBR = { 208: 'kcal', 203: 'protein', 204: 'fat', 205: 'carbsDiff', 291: 'fiber', 269: 'sugars', 606: 'satFat', 307: 'sodiumMg', 255: 'water' };

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') {
      out.push(cur);
      cur = '';
    } else cur += c;
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
    if (!header) {
      header = cols;
      continue;
    }
    const row = {};
    header.forEach((h, i) => (row[h] = cols[i]));
    onRow(row);
  }
}

const [cmd, ...args] = process.argv.slice(2);
const foods = {};
await readCsv(path.join(DIR, 'food.csv'), (r) => (foods[r.fdc_id] = { fdcId: r.fdc_id, description: r.description, n: {}, portions: [] }));
let wanted;
if (cmd === 'search') {
  const terms = args.join(' ').toLowerCase().split(/\s+/);
  wanted = new Set(Object.values(foods).filter((f) => terms.every((t) => f.description.toLowerCase().includes(t))).map((f) => f.fdcId));
} else wanted = new Set(args);
await readCsv(path.join(DIR, 'food_nutrient.csv'), (r) => {
  if (!wanted.has(r.fdc_id)) return;
  const k = NBR[r.nutrient_id];
  if (k) foods[r.fdc_id].n[k] = Number(r.amount);
});
if (cmd === 'get') {
  await readCsv(path.join(DIR, 'food_portion.csv'), (r) => {
    if (wanted.has(r.fdc_id) && Number(r.gram_weight) > 0) foods[r.fdc_id].portions.push(`${r.portion_description} = ${r.gram_weight} g`);
  });
}
for (const id of wanted) {
  const f = foods[id];
  if (!f) {
    console.log(`${id}\tnot found`);
    continue;
  }
  const n = f.n;
  const carbs = n.carbsDiff == null ? null : +(n.carbsDiff - (n.fiber ?? 0)).toFixed(2);
  if (cmd === 'search') {
    console.log(`${id}\tfndds\t${n.kcal} kcal\tP${n.protein} C${carbs} F${n.fat} Fib${n.fiber}\t${f.description}`);
  } else {
    console.log(JSON.stringify({ fdcId: Number(id), dataset: 'fndds', description: f.description, ...n, carbs, portions: f.portions }));
  }
}
