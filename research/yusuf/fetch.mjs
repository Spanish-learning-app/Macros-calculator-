#!/usr/bin/env node
// Resolve research/yusuf/ingredients.mjs into research/yusuf/ingredients.json by looking every entry
// up in its source (USDA index, Open Food Facts label, IFCT 2017 Table 1). Owner: Yusuf Benali.
//   node research/yusuf/fetch.mjs
// Output per ingredient, per 100 g: kcal, protein, carbs (available, fibre excluded), fat, fiber,
// sugars, satFat, sodiumMg (null = not reported by the source), plus the citation.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import REG from './ingredients.mjs';
import { off } from './off.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', '..');
const usda = JSON.parse(fs.readFileSync(path.join(root, 'research', 'cache', 'usda', 'index.json'), 'utf8'));
const DS = { sr_legacy: 'SR Legacy', foundation: 'Foundation', fndds: 'FNDDS' };

function fdc(code) {
  const f = usda.find((x) => x.fdcId === Number(code));
  if (!f) throw new Error(`FDC ${code} not found`);
  const n = f.n;
  const fiber = n.fiber ?? 0;
  const kcal = n.kcal ?? n.kcalAtwaterSpecific ?? n.kcalAtwaterGeneral;
  if (kcal == null || n.protein == null || n.fat == null || n.carbsDiff == null) throw new Error(`FDC ${code} incomplete`);
  return {
    citation: `USDA FDC ${DS[f.dataset]} ${code} (${f.description})`,
    kcal,
    protein: n.protein,
    carbs: Math.max(0, n.carbsDiff - fiber),
    fat: n.fat,
    fiber,
    sugars: n.sugars ?? n.sugarsNLEA ?? null,
    satFat: n.satFat ?? (n.fat === 0 ? 0 : null),
    sodiumMg: n.sodiumMg ?? null,
  };
}
function ifct(code) {
  const t = JSON.parse(fs.readFileSync(path.join(root, 'research', 'zainab', 'ifct-table1.json'), 'utf8'));
  const r = t.find((x) => x.code === code);
  if (!r) throw new Error(`IFCT ${code} not found`);
  return {
    citation: `IFCT 2017 ${code} (${r.name}), Table 1 via research/zainab/ifct-table1.json`,
    kcal: r.kcal, protein: r.protein, carbs: r.carbs, fat: r.fat, fiber: r.fiber,
    sugars: r.sugars ?? null, satFat: null, sodiumMg: null,
  };
}
async function offLabel(e) {
  const p = await off(e.code);
  if (p.error) throw new Error(`OFF ${e.code} ${p.error}`);
  let fiber = p.fiber;
  let fiberNote = '';
  if (fiber == null) {
    if (e.fiberFrom) {
      fiber = fdc(e.fiberFrom).fiber;
      fiberNote = `; fibre not on the label, taken from USDA FDC ${e.fiberFrom}`;
    } else if (e.zeroFiber) {
      fiber = 0;
      fiberNote = `; fibre not on the label, set to 0 (${e.zeroFiber})`;
    } else throw new Error(`OFF ${e.code} has no fibre and no rule for it`);
  }
  for (const k of ['kcal', 'protein', 'carbs', 'fat']) if (p[k] == null) throw new Error(`OFF ${e.code} missing ${k}`);
  return {
    citation: `Label: ${p.brand} ${p.name}, ${p.quantity}, read 2026-10-13 via Open Food Facts ${p.url} (OFF entry last edited ${p.lastModified})${fiberNote}`,
    kcal: p.kcal, protein: p.protein, carbs: p.carbs, fat: p.fat, fiber,
    sugars: p.sugars, satFat: p.satFat, sodiumMg: p.sodiumMg,
  };
}

const out = {};
const ids = Object.keys(REG).sort((a, b) => (REG[a].src === 'analogue') - (REG[b].src === 'analogue'));
for (const id of ids) {
  const e = REG[id];
  let v;
  if (e.src === 'fdc') v = fdc(e.code);
  else if (e.src === 'ifct') v = ifct(e.code);
  else if (e.src === 'off') v = await offLabel(e);
  else if (e.src === 'analogue') {
    const base = out[e.of];
    if (!base) throw new Error(`${id}: analogue base ${e.of} not resolved`);
    v = { ...base, citation: `Analogue of ${base.citation} (${e.why})` };
  } else throw new Error(`${id}: unknown src`);
  out[id] = { label: e.label, src: e.src, code: e.code ?? e.of, ...v };
}
fs.writeFileSync(path.join(here, 'ingredients.json'), JSON.stringify(out, null, 1) + '\n');
const f = (x) => (x == null ? '–' : Math.round(x * 10) / 10);
for (const [id, v] of Object.entries(out)) {
  console.log(`${id.padEnd(20)} ${String(f(v.kcal)).padStart(6)} kcal P${f(v.protein)} C${f(v.carbs)} F${f(v.fat)} Fib${f(v.fiber)} Sug${f(v.sugars)} Sat${f(v.satFat)} Na${f(v.sodiumMg)}  ${v.citation.slice(0, 90)}`);
}
console.log(`\n${Object.keys(out).length} ingredients → research/yusuf/ingredients.json`);
