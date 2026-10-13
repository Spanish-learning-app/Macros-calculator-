#!/usr/bin/env node
// Extract IFCT 2017 Table 1 (proximate principles and dietary fibre) from the PDF text.
//   pdftotext -layout research/cache/ifct/ifct2017.pdf research/cache/ifct/ifct2017.txt
//   node research/zainab/ifct-extract.mjs > research/zainab/ifct-table1.json
// Columns (per 100 g edible portion): WATER PROTCNT ASH FATCE FIBTG FIBINS FIBSOL CHOAVLDF ENERC(kJ).
// CHOAVLDF = available carbohydrate by difference (fibre excluded) — the convention Katori stores.
// Rows where a column is blank (below detection) are emitted with "check": true and must be read by eye.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const txt = fs.readFileSync(path.join(here, '..', 'cache', 'ifct', 'ifct2017.txt'), 'utf8').split('\n');
// Table 1 runs from the first "CEREALS AND MILLETS" header to the start of Table 2 (second header block).
const start = txt.findIndex((l) => /^\s+A\s+CEREALS AND MILLETS/.test(l));
const end = txt.findIndex((l, i) => i > start + 10 && /^\s+A\s+CEREALS AND MILLETS/.test(l));
const rows = [];
const num = /(\d+(?:\.\d+)?)(?:±\d+(?:\.\d+)?)?/g;
for (let i = start; i < end; i++) {
  const m = txt[i].match(/^\s+([A-T]\d{3})\s+(.*)$/);
  if (!m) continue;
  const code = m[1];
  let rest = m[2];
  // name = leading text until two+ spaces followed by a digit (the region count)
  const nm = rest.match(/^(.*?)\s{2,}(\d+)\s{2,}(.*)$/) || rest.match(/^()\s*(\d+)\s{2,}(.*)$/);
  if (!nm) continue;
  let name = nm[1].trim();
  if (!name) {
    const prev = (txt[i - 1] || '').trim();
    const next = (txt[i + 1] || '').trim();
    name = [prev, next].filter((s) => s && !/^\d/.test(s) && !/Table/.test(s)).join(' ');
  }
  const vals = [...nm[3].matchAll(num)].map((x) => Number(x[1]));
  const keys = ['water', 'protein', 'ash', 'fat', 'fiber', 'fiberInsol', 'fiberSol', 'carbs', 'kJ'];
  const row = { code, name, regions: Number(nm[2]) };
  if (vals.length === 9) {
    keys.forEach((k, j) => (row[k] = vals[j]));
    row.kcal = +(row.kJ / 4.184).toFixed(1);
  } else if (vals.length === 6) {
    // fibre columns blank (below detection): WATER PROTCNT ASH FATCE CHOAVLDF ENERC
    ['water', 'protein', 'ash', 'fat', 'carbs', 'kJ'].forEach((k, j) => (row[k] = vals[j]));
    row.fiber = 0;
    row.kcal = +(row.kJ / 4.184).toFixed(1);
    row.note = 'fibre and one more column blank in print (below detection); parsed as 6-column row';
  } else if (vals.length === 5) {
    // fibre and carbohydrate blank: WATER PROTCNT ASH FATCE ENERC
    ['water', 'protein', 'ash', 'fat', 'kJ'].forEach((k, j) => (row[k] = vals[j]));
    row.fiber = 0;
    row.carbs = 0;
    row.kcal = +(row.kJ / 4.184).toFixed(1);
    row.note = 'fibre and carbohydrate blank in print (below detection)';
  } else {
    row.check = true;
    row.raw = nm[3].replace(/\s+/g, ' ');
  }
  rows.push(row);
}
// Table 6 (starch and individual sugars): the last column is TOTAL FREE SUGARS. Attach it as `sugars`.
const t6 = txt.findIndex((l) => /^Table 6\. Starch and Individual Sugars/.test(l.trim()));
const t7 = txt.findIndex((l, i) => i > t6 && /Table 7\. Fatty Acid Profile/i.test(l));
const sug = {};
for (let i = t6; i < t7; i++) {
  const m = txt[i].match(/^\s+([A-T]\d{3})\s+(.*)$/);
  if (!m) continue;
  const nums = [...m[2].replace(/\(.*?\)/g, '').matchAll(/(\d+(?:\.\d+)?)(?:±\d+(?:\.\d+)?)?/g)].map((x) => Number(x[1]));
  if (nums.length >= 3 && sug[m[1]] == null) sug[m[1]] = nums[nums.length - 1];
}
for (const r of rows) if (sug[r.code] != null) r.sugars = sug[r.code];
console.log(JSON.stringify(rows, null, 0).replace(/},{/g, '},\n{'));
