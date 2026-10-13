#!/usr/bin/env node
// Open Food Facts label lookups for the Spanish packaged products in the lunch boxes.
// Owner: Yusuf Benali (Nutrition Lab).
//
//   node research/yusuf/off.mjs <ean…>      # per-100 g label values, serving, ingredients, last edit date
//
// Raw JSON is cached in research/cache/yusuf/off/ (not committed). OFF values are what contributors
// typed from the printed label; each one is cross-checked against the Mercadona product page
// (ingredients) in research/yusuf/ingredients.mjs and the product's own label where readable.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const CACHE = path.join(here, '..', 'cache', 'yusuf', 'off');
fs.mkdirSync(CACHE, { recursive: true });
const FIELDS = 'code,product_name,brands,nutriments,serving_size,quantity,nutrition_data_per,last_modified_t,ingredients_text,ingredients_text_es,countries_tags,stores';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function off(ean) {
  const file = path.join(CACHE, `p_${ean}.json`);
  if (!fs.existsSync(file)) {
    let ok = false;
    for (let i = 0; i < 4 && !ok; i++) {
      try {
        const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${ean}.json?fields=${FIELDS}`, {
          headers: { 'User-Agent': 'Katori-NutritionLab/0.1 (personal research)' },
        });
        if (res.ok) {
          fs.writeFileSync(file, await res.text());
          ok = true;
        }
      } catch {
        /* retry */
      }
      if (!ok) await sleep(3000 * (i + 1));
    }
    if (!ok) throw new Error(`OFF fetch failed for ${ean}`);
  }
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (d.status === 0 || !d.product) return { ean, error: 'not found' };
  const p = d.product;
  const n = p.nutriments || {};
  const g = (k) => (n[`${k}_100g`] === undefined || n[`${k}_100g`] === '' ? null : Number(n[`${k}_100g`]));
  return {
    ean,
    name: p.product_name,
    brand: p.brands,
    quantity: p.quantity,
    serving: p.serving_size,
    per: p.nutrition_data_per,
    lastModified: p.last_modified_t ? new Date(p.last_modified_t * 1000).toISOString().slice(0, 10) : null,
    kcal: g('energy-kcal'),
    protein: g('proteins'),
    carbs: g('carbohydrates'), // EU labels: available carbohydrate (fibre declared separately)
    sugars: g('sugars'),
    fat: g('fat'),
    satFat: g('saturated-fat'),
    fiber: g('fiber'),
    salt: g('salt'),
    sodiumMg: g('sodium') == null ? null : Math.round(g('sodium') * 1000),
    ingredients: (p.ingredients_text_es || p.ingredients_text || '').slice(0, 400),
    url: `https://world.openfoodfacts.org/product/${ean}`,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  for (const ean of process.argv.slice(2)) {
    console.log(JSON.stringify(await off(ean)));
    await sleep(500);
  }
}
