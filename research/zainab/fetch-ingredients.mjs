#!/usr/bin/env node
// Resolve research/zainab/ingredients.mjs into research/zainab/ingredients.json by looking every
// entry up in its source table (USDA index, FNDDS, IFCT 2017 Table 1/6, CoFID 2021).
//   node research/zainab/fetch-ingredients.mjs
// Output per ingredient (per 100 g, or per 100 ml when perMl): kcal, protein, carbs (available,
// fibre excluded), fat, fiber, sugars, satFat, sodiumMg, water (null = not reported by the source).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import REG from './ingredients.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', '..');
const usdaIndex = JSON.parse(fs.readFileSync(path.join(root, 'research', 'cache', 'usda', 'index.json'), 'utf8'));
const ifct = JSON.parse(fs.readFileSync(path.join(here, 'ifct-table1.json'), 'utf8'));

function fdc(code) {
  const f = usdaIndex.find((x) => x.fdcId === Number(code));
  if (!f) throw new Error(`FDC ${code} not found`);
  const n = f.n;
  const fiber = n.fiber ?? 0;
  return {
    citation: `FDC ${code} (${f.dataset === 'sr_legacy' ? 'SR Legacy' : 'Foundation'}): ${f.description}`,
    kcal: n.kcal ?? n.kcalAtwaterSpecific ?? n.kcalAtwaterGeneral,
    protein: n.protein ?? 0,
    carbs: n.carbsDiff == null ? 0 : Math.max(0, n.carbsDiff - fiber),
    fat: n.fat ?? 0,
    fiber,
    sugars: n.sugars ?? n.sugarsNLEA ?? null,
    satFat: n.satFat ?? (n.fat === 0 ? 0 : null),
    sodiumMg: n.sodiumMg ?? null,
    water: n.water ?? null,
  };
}
function ifctGet(code) {
  const r = ifct.find((x) => x.code === code);
  if (!r || r.check) throw new Error(`IFCT ${code} missing or needs manual read`);
  return {
    citation: `IFCT 2017 ${code}: ${r.name}`,
    kcal: r.kcal, protein: r.protein, carbs: r.carbs, fat: r.fat, fiber: r.fiber,
    sugars: r.sugars ?? null, satFat: null, sodiumMg: null, water: r.water,
  };
}
function cofid(code) {
  const out = execFileSync(process.execPath, [path.join(here, 'cofid.mjs'), 'get', code], { encoding: 'utf8' });
  const c = JSON.parse(out.trim());
  return {
    citation: `CoFID 2021 ${code}: ${c.name}`,
    kcal: c.kcal, protein: c.protein, carbs: c.carbs, fat: c.fat, fiber: c.fiber ?? 0,
    sugars: c.sugars, satFat: null, sodiumMg: null, water: c.water,
  };
}
function fndds(code) {
  const out = execFileSync(process.execPath, [path.join(here, 'fndds.mjs'), 'get', String(code)], { encoding: 'utf8' });
  const c = JSON.parse(out.trim());
  return {
    citation: `FDC ${code} (FNDDS): ${c.description}`,
    kcal: c.kcal, protein: c.protein, carbs: c.carbs, fat: c.fat, fiber: c.fiber ?? 0,
    sugars: c.sugars ?? null, satFat: c.satFat ?? null, sodiumMg: c.sodiumMg ?? null, water: c.water ?? null,
  };
}

const out = {};
for (const [id, e] of Object.entries(REG)) {
  let v;
  if (e.src === 'fdc') v = fdc(e.code);
  else if (e.src === 'ifct') v = ifctGet(e.code);
  else if (e.src === 'cofid') v = cofid(e.code);
  else if (e.src === 'fndds') v = fndds(e.code);
  else if (e.src === 'label') v = { citation: `Label: ${e.label}, ${e.url} (read ${e.date})`, ...e.values };
  else if (e.src === 'fixed') v = { citation: e.label, ...e.values };
  else throw new Error(`unknown src for ${id}`);
  out[id] = { label: e.label, src: e.src, code: e.code ?? null, perMl: !!e.perMl, ...v };
}
fs.writeFileSync(path.join(here, 'ingredients.json'), JSON.stringify(out, null, 1));
for (const [id, v] of Object.entries(out)) {
  const f = (x) => (x == null ? '–' : Math.round(x * 10) / 10);
  console.log(`${id.padEnd(22)} ${String(f(v.kcal)).padStart(6)} kcal P${f(v.protein)} C${f(v.carbs)} F${f(v.fat)} Fib${f(v.fiber)} Sug${f(v.sugars)} Sat${f(v.satFat)} Na${f(v.sodiumMg)}  ${v.citation}`);
}
