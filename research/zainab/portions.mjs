#!/usr/bin/env node
// Household-measure gram weights from USDA SR Legacy food_portion.csv (published portion weights).
//   node research/zainab/portions.mjs 171411 170000 ...
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(here, '..', 'cache', 'usda', 'sr_legacy', 'FoodData_Central_sr_legacy_food_csv_2018-04');
const parse = (l) => { const o = []; let c = '', q = false; for (let i = 0; i < l.length; i++) { const ch = l[i]; if (q) { if (ch === '"' && l[i + 1] === '"') { c += '"'; i++; } else if (ch === '"') q = false; else c += ch; } else if (ch === '"') q = true; else if (ch === ',') { o.push(c); c = ''; } else c += ch; } o.push(c); return o; };
const read = (f) => { const L = fs.readFileSync(path.join(dir, f), 'utf8').split('\n').filter(Boolean); const h = parse(L[0]); return L.slice(1).map((l) => { const c = parse(l); const o = {}; h.forEach((k, i) => (o[k] = c[i])); return o; }); };
const units = Object.fromEntries(read('measure_unit.csv').map((u) => [u.id, u.name]));
const foods = Object.fromEntries(read('food.csv').map((f) => [f.fdc_id, f.description]));
const ids = new Set(process.argv.slice(2));
for (const p of read('food_portion.csv')) if (ids.has(p.fdc_id)) console.log(`${p.fdc_id}\t${p.amount} ${units[p.measure_unit_id] === 'undetermined' ? '' : units[p.measure_unit_id] ?? ''} ${p.modifier} = ${p.gram_weight} g\t${foods[p.fdc_id]}`);
