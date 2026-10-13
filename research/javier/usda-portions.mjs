#!/usr/bin/env node
// Household portions (gram weights) from the USDA bulk CSVs, for the fdcIds given.
//   node research/javier/usda-portions.mjs 173944 171688
// Reads food_portion.csv + measure_unit.csv from SR Legacy, Foundation and FNDDS in research/cache/usda/.
// Owner: Javier Morales (Nutrition Lab).

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const CACHE = path.join(here, '..', 'cache', 'usda');

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

const ids = new Set(process.argv.slice(2));
for (const ds of ['sr_legacy', 'foundation', 'fndds']) {
  const base = path.join(CACHE, ds);
  const sub = fs.readdirSync(base).find((d) => fs.statSync(path.join(base, d)).isDirectory());
  const dir = path.join(base, sub);
  const units = {};
  const muFile = path.join(dir, 'measure_unit.csv');
  if (fs.existsSync(muFile)) await readCsv(muFile, (r) => (units[r.id] = r.name));
  await readCsv(path.join(dir, 'food_portion.csv'), (r) => {
    if (!ids.has(r.fdc_id)) return;
    const unit = units[r.measure_unit_id] && units[r.measure_unit_id] !== 'undetermined' ? units[r.measure_unit_id] : '';
    console.log(
      `${r.fdc_id}\t${ds}\t${r.amount} ${unit} ${r.portion_description} ${r.modifier}`.replace(/\s+/g, ' ').trim() +
        `\t= ${r.gram_weight} g`,
    );
  });
}
