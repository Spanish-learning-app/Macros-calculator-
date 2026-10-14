#!/usr/bin/env node
// Mercadona online shop (tienda.mercadona.es) price and label lookups for the lunch-box costings.
// Owner: Yusuf Benali (Nutrition Lab).
//
//   node research/yusuf/mercadona.mjs fetch                 # cache every category we shop in (Barcelona warehouse)
//   node research/yusuf/mercadona.mjs add <categoryId…>          # cache extra categories (own read date)
//   node research/yusuf/mercadona.mjs find <words…>         # search the cached categories by name
//   node research/yusuf/mercadona.mjs product <id…>         # full product page: price, ingredients, allergens
//
// Warehouse: the shop maps postal code 08001 (Barcelona, Raval) to warehouse "bcn1" (response header
// x-customer-wh, checked 2026-10-13). Prices are the public online-shop prices for that warehouse on the
// date of the fetch. Raw JSON is cached in research/cache/yusuf/mercadona/ (not committed).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const CACHE = path.join(here, '..', 'cache', 'yusuf', 'mercadona');
const WH = 'bcn1';
const API = 'https://tienda.mercadona.es/api';
// Category ids (from /api/categories/?wh=bcn1) for everything the 12 boxes use.
const CATEGORIES = {
  118: 'Arroz', 121: 'Legumbres', 120: 'Pasta y fideos', 29: 'Verdura', 27: 'Fruta',
  28: 'Lechuga y ensalada preparada', 77: 'Huevos', 104: 'Yogures naturales y sabores',
  109: 'Yogures griegos', 103: 'Yogures desnatados', 112: 'Aceite, vinagre y sal', 115: 'Especias',
  117: 'Otras salsas', 122: 'Atún y otras conservas de pescado', 127: 'Conservas de verdura y frutas',
  126: 'Tomate', 60: 'Pan de molde y otras especialidades', 62: 'Pan tostado y rallado',
  142: 'Platos preparados fríos', 897: 'Listo para Comer', 145: 'Congelados fruta y verdura',
  129: 'Sopa y caldo', 133: 'Frutos secos', 53: 'Queso untable, fresco y especialidades',
  72: 'Leche y bebidas vegetales', 89: 'Azúcar y edulcorante', 38: 'Aves y pollo (non-halal; reference only)',
  // Sprint 2 (breakfast and dinner preps), added with `add` so the Sprint 1 prices keep their date:
  78: 'Cereales', 69: 'Harina y preparado repostería', 90: 'Mermelada y miel',
};

fs.mkdirSync(CACHE, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getJson(url, file) {
  for (let i = 0; i < 4; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Katori-NutritionLab/0.1 (personal research)' } });
      if (res.ok) {
        const j = await res.json();
        if (file) fs.writeFileSync(file, JSON.stringify(j));
        return j;
      }
    } catch {
      /* retry */
    }
    await sleep(1500 * (i + 1));
  }
  throw new Error(`failed: ${url}`);
}

function flatten(cat) {
  const out = [];
  const walk = (c, trail) => {
    for (const p of c.products || []) out.push({ ...p, _cat: trail });
    for (const s of c.categories || []) walk(s, `${trail} > ${s.name}`);
  };
  walk(cat, cat.name);
  return out;
}
const priceLine = (p) => {
  const pi = p.price_instructions || {};
  return `${pi.unit_price} € (${pi.unit_size ?? ''} ${pi.size_format ?? ''}) = ${pi.reference_price} €/${pi.reference_format}`;
};

const [cmd, ...args] = process.argv.slice(2);
if (cmd === 'fetch') {
  const stamp = new Date().toISOString().slice(0, 10);
  for (const id of Object.keys(CATEGORIES)) {
    await getJson(`${API}/categories/${id}/?lang=es&wh=${WH}`, path.join(CACHE, `cat_${id}.json`));
    process.stdout.write(`cat ${id} ${CATEGORIES[id]} ok\n`);
    await sleep(400);
  }
  fs.writeFileSync(path.join(CACHE, 'fetched.json'), JSON.stringify({ date: stamp, warehouse: WH }));
} else if (cmd === 'add') {
  // Cache extra categories without re-reading the others; their read date goes to fetched.json → extra.
  const stamp = new Date().toISOString().slice(0, 10);
  const meta = JSON.parse(fs.readFileSync(path.join(CACHE, 'fetched.json'), 'utf8'));
  meta.extra = meta.extra || {};
  for (const id of args) {
    await getJson(`${API}/categories/${id}/?lang=es&wh=${WH}`, path.join(CACHE, `cat_${id}.json`));
    meta.extra[id] = stamp;
    process.stdout.write(`cat ${id} ${CATEGORIES[id] ?? ''} ok (${stamp})\n`);
    await sleep(400);
  }
  fs.writeFileSync(path.join(CACHE, 'fetched.json'), JSON.stringify(meta));
} else if (cmd === 'find') {
  const terms = args.map((a) => a.toLowerCase());
  for (const f of fs.readdirSync(CACHE).filter((n) => n.startsWith('cat_'))) {
    const cat = JSON.parse(fs.readFileSync(path.join(CACHE, f), 'utf8'));
    for (const p of flatten(cat)) {
      const name = `${p.display_name} ${p.packaging ?? ''}`.toLowerCase();
      if (terms.every((t) => name.includes(t))) console.log(`${p.id}\t${p.display_name} | ${p.packaging ?? ''} | ${priceLine(p)} | ${p._cat}`);
    }
  }
} else if (cmd === 'product') {
  for (const id of args) {
    const p = await getJson(`${API}/products/${id}/?lang=es&wh=${WH}`, path.join(CACHE, `p_${id}.json`));
    const ni = p.nutrition_information || {};
    console.log(`${p.id} | ${p.display_name} | ${p.packaging ?? ''} | ${priceLine(p)} | ean ${p.ean ?? '-'} | brand ${p.brand ?? '-'} | origin ${p.origin ?? '-'}`);
    console.log(`  legal name: ${p.details?.legal_name ?? '-'}`);
    console.log(`  ingredients: ${(ni.ingredients || '-').replace(/\s+/g, ' ').slice(0, 900)}`);
    console.log(`  allergens: ${(ni.allergens || '-').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').slice(0, 300)}`);
    console.log(`  url: https://tienda.mercadona.es/product/${p.id}/`);
    await sleep(300);
  }
} else {
  console.log('Usage: node research/yusuf/mercadona.mjs fetch | add <categoryId…> | find <words…> | product <id…>');
}
