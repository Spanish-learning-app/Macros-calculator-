// Pure recipe computation for Zainab's sheets (split out of calc.mjs so recipe sheets that derive from
// other sheets, e.g. recipes/kam-tel.mjs, can import it without an import cycle). Method: see calc.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
      kcal: null, // set below: NUTRITION.md §6 step 7, kcal = round(4P + 4C + 9F + 2·fibre)
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
  p.kcal = Math.round(4 * p.protein + 4 * p.carbs + 9 * p.fat + 2 * p.fiber);
  out.kcalIngredientSum = Math.round(per(tot.kcal)); // sum of the tables' own energy values, for comparison
  out.atwater = p.kcal;
  out.atwaterGap = +((out.kcalIngredientSum - p.kcal) / p.kcal).toFixed(3);
  out.boneShareServed = removed > 0 ? +(removed / (cooked + removed)).toFixed(3) : 0;
  out.massCheck = +(p.protein + p.carbs + p.fat + p.fiber).toFixed(1);
  if (waterCooked < 0) out.error = 'cooked water negative: yield too low';
  return out;
}

