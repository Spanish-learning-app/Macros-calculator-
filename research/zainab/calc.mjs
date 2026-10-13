#!/usr/bin/env node
// Standard-recipe calculator (EuroFIR-style recipe method) for Zainab's Pakistani dishes.
//
//   node research/zainab/fetch-ingredients.mjs      # once, or after editing ingredients.mjs
//   node research/zainab/calc.mjs                   # all recipe sheets → research/zainab/out/results.json
//   node research/zainab/calc.mjs chicken-karahi-home   # one sheet, verbose
//
// Method, per sheet in research/zainab/recipes/<id>.mjs:
//   1. Ingredients in raw grams AS PURCHASED (ml for perMl label items). `edible` < 1 removes bone/peel
//      before anything else; removed weight is reported (used for "with bones" serving labels).
//   2. Nutrients summed from research/zainab/ingredients.json (USDA / IFCT 2017 / CoFID / labels).
//   3. Cooking: weight change from water evaporation (or frying-oil exchange), as stated in the sheet:
//        { method: 'evaporate', grams, basis }        cooked = raw − grams
//        { method: 'yield', factor, basis }           cooked = raw × factor
//        { method: 'cooked', grams, basis }           cooked weight stated directly
//        { method: 'moisture', water, basis }         cooked weight set so the dish has `water` g/100 g
//      Only water leaves the pot; macronutrients are conserved (no retention losses applied).
//      Fat that is drained or left in the pan is entered as a negative or reduced oil line and stated.
//   4. Result per 100 g as served (edible portion), plus added fat per 100 g.
// Optional nutrients (sugars, sat fat, sodium) are reported only when the ingredients that lack them
// carry < 10% of the relevant total (fat for sat fat, carbs for sugars); sodium treats IFCT plant
// ingredients (no sodium column parsed) as negligible next to added salt, and says so.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ING = JSON.parse(fs.readFileSync(path.join(here, 'ingredients.json'), 'utf8'));
const KEYS = ['kcal', 'protein', 'carbs', 'fat', 'fiber', 'sugars', 'satFat', 'sodiumMg', 'water'];

export function compute(sheet) {
  const tot = Object.fromEntries(KEYS.map((k) => [k, 0]));
  const missing = { sugars: 0, satFat: 0, sodiumMg: 0, water: 0 };
  let raw = 0;
  let removed = 0;
  let addedFat = 0;
  const lines = [];
  for (const line of sheet.ingredients) {
    const [id, qty, note = '', opts = {}] = line;
    const ing = ING[id];
    if (!ing) throw new Error(`${sheet.id}: unknown ingredient ${id}`);
    const edible = opts.edible ?? 1;
    // perMl items: qty is ml; density converts to grams of weight in the pot
    const grams = ing.perMl ? qty * (opts.density ?? 1) : qty * edible;
    const factor = ing.perMl ? qty / 100 : (qty * edible) / 100;
    if (!ing.perMl) removed += qty * (1 - edible);
    raw += grams;
    const c = {};
    for (const k of KEYS) {
      const v = ing[k];
      if (v == null) {
        if (k === 'sugars') missing.sugars += (ing.carbs || 0) * factor;
        if (k === 'satFat') missing.satFat += (ing.fat || 0) * factor;
        if (k === 'sodiumMg') missing.sodiumMg += 1;
        if (k === 'water') missing.water += grams;
        c[k] = 0;
      } else c[k] = v * factor;
      tot[k] += c[k];
    }
    if ((sheet.addedFat || []).includes(id)) addedFat += (ing.fat || 0) * factor;
    lines.push({ id, qty, unit: ing.perMl ? 'ml' : 'g', grams: +grams.toFixed(1), note, kcal: +c.kcal.toFixed(1), protein: +c.protein.toFixed(2), fat: +c.fat.toFixed(2) });
  }
  const ck = sheet.cooking;
  let cooked;
  if (ck.method === 'evaporate') cooked = raw - ck.grams;
  else if (ck.method === 'yield') cooked = raw * ck.factor;
  else if (ck.method === 'cooked') cooked = ck.grams;
  else if (ck.method === 'moisture') {
    // water_final = water_raw − loss ; cooked = raw − loss ; water_final / cooked = w
    const w = ck.water / 100;
    const loss = (tot.water - w * raw) / (1 - w);
    cooked = raw - loss;
  } else if (ck.method === 'steps') {
    // evaporation built from named cooking steps: each step removes `frac` of the water carried by
    // the named ingredient line(s) (water from the ingredient tables), or a stated number of grams.
    let ev = 0;
    ck.detail = [];
    for (const st of ck.steps) {
      let g = 0;
      if (st.grams != null) g = st.grams;
      else {
        const ids = Array.isArray(st.ing) ? st.ing : [st.ing];
        for (const l of lines) if (ids.includes(l.id)) g += l.grams * ((ING[l.id].water ?? 0) / 100) * st.frac;
      }
      ev += g;
      ck.detail.push(`${st.why}: ${g.toFixed(0)} g`);
    }
    cooked = raw - ev;
  } else if (ck.method === 'none') cooked = raw;
  else throw new Error(`${sheet.id}: unknown cooking method`);
  const lossWater = raw - cooked;
  const waterCooked = tot.water - lossWater;
  const per = (x) => (x * 100) / cooked;
  const out = {
    id: sheet.id,
    dish: sheet.dish,
    rawG: +raw.toFixed(1),
    cookedG: +cooked.toFixed(1),
    yield: +(cooked / raw).toFixed(3),
    removedG: +removed.toFixed(1),
    per100g: {
      kcal: Math.round(per(tot.kcal)),
      protein: +per(tot.protein).toFixed(1),
      carbs: +per(tot.carbs).toFixed(1),
      fat: +per(tot.fat).toFixed(1),
      fiber: +per(tot.fiber).toFixed(1),
      sugars: missing.sugars > 0.1 * tot.carbs ? null : +per(tot.sugars).toFixed(1),
      satFat: missing.satFat > 0.1 * tot.fat ? null : +per(tot.satFat).toFixed(1),
      sodium: Math.round(per(tot.sodiumMg)),
    },
    waterPer100g: missing.water > 0.05 * raw ? null : +per(waterCooked).toFixed(1),
    addedFatPer100g: +per(addedFat).toFixed(1),
    lines,
    cookingDetail: ck.detail || null,
  };
  const p = out.per100g;
  out.atwater = Math.round(4 * p.protein + 4 * p.carbs + 9 * p.fat + 2 * p.fiber);
  out.atwaterGap = +((p.kcal - out.atwater) / out.atwater).toFixed(3);
  out.massCheck = +(p.protein + p.carbs + p.fat + p.fiber).toFixed(1);
  if (waterCooked < 0) out.error = 'cooked water negative: yield too low';
  return out;
}

export async function loadSheets(filter) {
  const dir = path.join(here, 'recipes');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.mjs')).sort();
  const sheets = [];
  for (const f of files) {
    const mod = await import(pathToFileURL(path.join(dir, f)).href);
    const list = Array.isArray(mod.default) ? mod.default : [mod.default];
    for (const s of list) if (!filter || s.id === filter || f.startsWith(filter)) sheets.push({ ...s, file: `research/zainab/recipes/${f}` });
  }
  return sheets;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const filter = process.argv[2];
  const sheets = await loadSheets(filter);
  const results = {};
  for (const s of sheets) {
    const r = compute(s);
    r.file = s.file;
    results[s.id] = r;
    const p = r.per100g;
    const flag = Math.abs(r.atwaterGap) > 0.1 ? '  <-- ENERGY GAP' : '';
    console.log(`${s.id.padEnd(30)} raw ${String(r.rawG).padStart(7)} → ${String(r.cookedG).padStart(7)} g (y ${r.yield})  ${String(p.kcal).padStart(4)} kcal P${p.protein} C${p.carbs} F${p.fat} Fib${p.fiber} Sug${p.sugars} Sat${p.satFat} Na${p.sodium} H2O ${r.waterPer100g} | addFat ${r.addedFatPer100g} | 4-4-9-2 ${r.atwater} (${(r.atwaterGap * 100).toFixed(1)}%)${flag}${r.error ? ' ' + r.error : ''}`);
    if (filter && r.cookingDetail) console.log('   evaporation: ' + r.cookingDetail.join('; '));
    if (filter) for (const l of r.lines) console.log(`   ${l.id.padEnd(20)} ${String(l.qty).padStart(6)} ${l.unit}  ${String(l.kcal).padStart(7)} kcal  P${l.protein} F${l.fat}  ${l.note}`);
  }
  if (!filter) {
    fs.mkdirSync(path.join(here, 'out'), { recursive: true });
    fs.writeFileSync(path.join(here, 'out', 'results.json'), JSON.stringify(results, null, 1));
    console.log(`\n${Object.keys(results).length} sheets → research/zainab/out/results.json`);
  }
}
