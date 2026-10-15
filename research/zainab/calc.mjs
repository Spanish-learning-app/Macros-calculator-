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
import { compute } from './calc-core.mjs';

export { compute };

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
    console.log(`${s.id.padEnd(30)} raw ${String(r.rawG).padStart(7)} → ${String(r.cookedG).padStart(7)} g (y ${r.yield})  ${String(p.kcal).padStart(4)} kcal P${p.protein} C${p.carbs} F${p.fat} Fib${p.fiber} Sug${p.sugars} Sat${p.satFat} Na${p.sodium} H2O ${r.waterPer100g} | addFat ${r.addedFatPer100g} | table-sum ${r.kcalIngredientSum} (${(r.atwaterGap * 100).toFixed(1)}%)${r.boneShareServed ? ' bone ' + r.boneShareServed : ''}${flag}${r.error ? ' ' + r.error : ''}`);
    if (filter && r.cookingDetail) console.log('   evaporation: ' + r.cookingDetail.join('; '));
    if (filter) for (const l of r.lines) console.log(`   ${l.id.padEnd(20)} ${String(l.qty).padStart(6)} ${l.unit}  ${String(l.kcal).padStart(7)} kcal  P${l.protein} F${l.fat}  ${l.note}`);
  }
  if (!filter) {
    fs.mkdirSync(path.join(here, 'out'), { recursive: true });
    fs.writeFileSync(path.join(here, 'out', 'results.json'), JSON.stringify(results, null, 1));
    console.log(`\n${Object.keys(results).length} sheets → research/zainab/out/results.json`);
  }
}
