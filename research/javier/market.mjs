#!/usr/bin/env node
// Sprint 2 market-food lookups (Javier Morales, Nutrition Lab).
//   node research/javier/market.mjs cat <categoryId…>     # list a Mercadona category (Barcelona warehouse bcn1)
//   node research/javier/market.mjs prod <mercadonaId…>   # product: name, EAN, ingredients, then the OFF label per 100 g
//   node research/javier/market.mjs off <ean…>            # Open Food Facts label only
// Raw JSON cached in research/cache/javier/{mercadona,off}/ (not committed). Mercadona's online shop gives the
// ingredients (used for the halal check) but not the nutrition table, so per-100 g values come from Open Food
// Facts (typed from the printed label by contributors) for the same EAN.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const CACHE = path.join(here, '..', 'cache', 'javier');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getJson(url, file) {
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  for (let i = 0; i < 4; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Katori-NutritionLab/0.1 (personal research)' } });
      if (res.ok) {
        const t = await res.text();
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, t);
        return JSON.parse(t);
      }
      if (res.status === 404) return null;
    } catch {
      /* retry */
    }
    await sleep(1500 * (i + 1));
  }
  return null;
}
const OFF_FIELDS = 'code,product_name,brands,nutriments,serving_size,quantity,last_modified_t,ingredients_text_es,ingredients_text';
async function off(ean) {
  const j = await getJson(`https://world.openfoodfacts.org/api/v2/product/${ean}.json?fields=${OFF_FIELDS}`, path.join(CACHE, 'off', `${ean}.json`));
  const p = j?.product;
  if (!p) return console.log(`  OFF ${ean}: not found`);
  const n = p.nutriments || {};
  const g = (k) => n[`${k}_100g`];
  const date = p.last_modified_t ? new Date(p.last_modified_t * 1000).toISOString().slice(0, 10) : '-';
  console.log(`  OFF ${ean} (${p.product_name} | ${p.brands} | ${p.quantity ?? ''} | serving ${p.serving_size ?? '-'} | edited ${date})`);
  console.log(`    per 100 g: kcal ${g('energy-kcal')} kJ ${g('energy-kj') ?? g('energy')} P ${g('proteins')} C ${g('carbohydrates')} sugars ${g('sugars')} F ${g('fat')} sat ${g('saturated-fat')} fibre ${g('fiber')} salt ${g('salt')}`);
  if (!process.env.NOING) console.log(`    ingredients: ${(p.ingredients_text_es || p.ingredients_text || '-').replace(/\s+/g, ' ').slice(0, 400)}`);
}
const [cmd, ...args] = process.argv.slice(2);
if (cmd === 'cat') {
  for (const id of args) {
    const c = await getJson(`https://tienda.mercadona.es/api/categories/${id}/?lang=es&wh=bcn1`, path.join(CACHE, 'mercadona', `cat_${id}.json`));
    const walk = (x, trail) => {
      for (const p of x.products || []) console.log(`${p.id}\t${p.display_name} | ${p.packaging ?? ''} | ${p.price_instructions?.unit_price} € (${p.price_instructions?.unit_size}) | ${trail}`);
      for (const s of x.categories || []) walk(s, `${trail} > ${s.name}`);
    };
    walk(c, c.name);
  }
} else if (cmd === 'prod') {
  for (const id of args) {
    const p = await getJson(`https://tienda.mercadona.es/api/products/${id}/?lang=es&wh=bcn1`, path.join(CACHE, 'mercadona', `p_${id}.json`));
    if (!p) { console.log(`${id}: not found`); continue; }
    const ni = p.nutrition_information || {};
    console.log(`${p.id} | ${p.display_name} | ${p.packaging ?? ''} | ${p.price_instructions?.unit_size ?? ''} ${p.price_instructions?.size_format ?? ''} | ean ${p.ean ?? '-'} | brand ${p.brand ?? '-'}`);
    console.log(`  ingredients (Mercadona): ${(ni.ingredients || '-').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').slice(0, 500)}`);
    if (p.ean) await off(p.ean);
    await sleep(250);
  }
} else if (cmd === 'off') {
  for (const e of args) await off(e);
} else {
  console.log('Usage: node research/javier/market.mjs cat <id…> | prod <mercadonaId…> | off <ean…>');
}
