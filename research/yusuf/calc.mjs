#!/usr/bin/env node
// Lunch-box calculator (EuroFIR-style standard-recipe method, NUTRITION.md §6). Owner: Yusuf Benali.
//
//   node research/yusuf/fetch.mjs          # once: resolve ingredient values → ingredients.json
//   node research/yusuf/mercadona.mjs fetch # refresh Mercadona Barcelona prices (optional)
//   node research/yusuf/calc.mjs           # all sheets in research/yusuf/recipes/*.mjs → out/results.json
//   node research/yusuf/calc.mjs <id|n>    # one sheet, verbose
//
// Method per box recipe (4 boxes):
//   1. Ingredients in raw edible grams for the whole batch, per component (rice, chicken, sauce pot…).
//   2. Nutrients summed from ingredients.json. Macronutrients are conserved (100% retention, §6 step 6);
//      every gram of oil in the recipe is assumed eaten.
//   3. Cooked weight of each component = Σ raw grams × yield factor of that line (YIELDS below, each with
//      its source). Oils, spices, salt and sugar keep their weight. Water that is fully absorbed (couscous,
//      bulgur) is listed as a `water` line; cooking water that boils off is not listed.
//   4. Per 100 g as eaten = batch totals ÷ batch cooked weight × 100 (the whole box, all pots included).
//      kcal = round(4P + 4C + 9F + 2·fibre) from the rounded values (§6 step 7).
//   5. One box = batch cooked weight ÷ 4. Box kcal/protein = per-100 g value × box grams ÷ 100, which is
//      what the app will show.
//   6. Cost per box = Σ (grams × €/g) ÷ 4 at Mercadona Barcelona (warehouse bcn1) and halal-butcher prices.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import REG from './ingredients.mjs';
import { BUTCHER, DESI, PRICE_DATE } from './prices.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', '..');
const ING = JSON.parse(fs.readFileSync(path.join(here, 'ingredients.json'), 'utf8'));
const RULES = (await import(pathToFileURL(path.join(root, 'app', 'data', 'rules.js')).href)).default;
const usda = JSON.parse(fs.readFileSync(path.join(root, 'research', 'cache', 'usda', 'index.json'), 'utf8'));
const MERC = path.join(root, 'research', 'cache', 'yusuf', 'mercadona');

// ------------------------------------------------------------------ yields (cooked ÷ raw weight)
const usdaP = (id) => {
  const f = usda.find((x) => x.fdcId === id);
  if (!f) throw new Error(`USDA ${id} missing`);
  return { p: f.n.protein, d: f.description };
};
const proteinRatio = (raw, cooked) => {
  const a = usdaP(raw);
  const b = usdaP(cooked);
  return { f: +(a.p / b.p).toFixed(3), src: `USDA water balance: protein ${a.p} g raw (FDC ${raw}) ÷ ${b.p} g cooked (FDC ${cooked}, ${b.d}); protein assumed 100% retained` };
};
const B = (f, row) => ({ f, src: `Bognár 2002, ${row}` });
export const YIELDS = {
  none: { f: 1, src: 'Not cooked, or weight kept (oil, spices, salt): weight unchanged' },
  absorbed: { f: 1, src: 'Stated water balance: the grain keeps its own weight and the measured water is fully absorbed (covered, off the heat, no evaporation counted)' },
  riceWhite: B(2.94, 'Table 29: Rice, long corn, polished, stewed (absorption method), e = 2.94 (n = 25)'),
  riceBrown: B(2.6, 'Table 29: Rice, long corn, unpolished, stewed, e = 2.60 (n = 7)'),
  pastaWW: proteinRatio(169738, 168910),
  thighRoast: proteinRatio(173627, 172388),
  thighBraised: proteinRatio(173627, 172853),
  breastRoast: proteinRatio(171077, 171477),
  breastStewed: proteinRatio(171077, 171478),
  breastPanFried: B(0.8, 'Table 9: Escallop of chicken (breast), pan fried, e = 0.80 (n = 3)'),
  beefBrowned: proteinRatio(174030, 171794),
  kebabPanFried: B(0.81, 'Table 7: Roast forcemeat ball (cevapcici), pan fried, e = 0.81 (n = 10)'),
  meatballPanFried: B(0.81, 'Table 7: Rissole, burger, pan fried, e = 0.81 (n = 10)'),
  dalBoiled: B(2.45, 'Table 20: Peas (dried), boiled/stewed, e = 2.45 (n = 6); used for soaked chana dal'),
  onionSoft: B(0.83, 'Table 17: Onion, transparent, roasted (pan), e = 0.83 (n = 3)'),
  onionBrown: B(0.42, 'Table 17: Onion, brown, roasted (pan), e = 0.42 (n = 3)'),
  vegStew: B(0.76, 'Table 19: Fruit vegetables, stew, e = 0.76 (n = 3)'),
  zucchiniStew: B(0.73, 'Table 19: Zucchini, stew, e = 0.73 (n = 3); used for oven-roasting'),
  pepperStew: B(0.74, 'Table 19: Paprika, stew, e = 0.74 (n = 3); used for oven-roasting'),
  carrotStew: B(0.92, 'Table 17: Carrot, stew, e = 0.92 (n = 3); used for oven-roasting'),
  greenBeansBoiled: B(0.93, 'Table 20: Green beans, boiled, e = 0.93 (n = 120)'),
  peasStewed: B(0.92, 'Table 20: Green peas, stewed, e = 0.92 (n = 9)'),
  potatoPanFried: B(0.77, 'Table 21: Roasted (pan-fried) potatoes, fresh, e = 0.77 (n = 3)'),
  potatoBoiled: B(1.0, 'Table 21: Potato, without peel, boiled, e = 1.00 (n = 272)'),
  eggSet: B(0.91, 'Table 2: Scrambled eggs, e = 0.91 (n = 6); used for the tortilla egg mixture'),
  // Sprint 2 (breakfast and dinner preps)
  pancakeWholemeal: B(0.89, 'Table 2: Pancake with whole meal flour, e = 0.89 (n = 10); used for the oat-yogurt-egg batter'),
  beefBraised: proteinRatio(171206, 171203),
  meatballBoiled: B(0.87, 'Table 7: Small meat ball, boiled, e = 0.87 (n = 3); meatballs simmered in the sofregit'),
  spinachStewed: B(0.84, 'Table 18: Spinach, stewed, e = 0.84 (n = 25)'),
  lentilsDry: B(2.73, 'Table 20: Lentils (dried product), boiled/stewed, e = 2.73 (n = 6)'),
  roti: { f: 0.799, src: "Zainab Rauf's roti sheet (research/zainab/recipes/pk-roti.md): dough of 100 g atta + 70 g water + 0.5 g salt cooked on the tawa to 34.4 g water per 100 g (Rasool et al. 2006, Pakistani chapattis 32.5–36.3%; FNDDS 2707713 roti 35.4%) weighs 136.3 g: yield 0.799 of the dough" },
  parathaPlain: { f: 0.731, src: "Zainab Rauf's paratha sheet (research/zainab/recipes/pk-paratha-home.md): dough + fat cooked to 30.6 g water per 100 g (CoFID 2021 11-1104 homemade paratha) gives yield 0.731 of the raw total" },
  alooParatha: { f: 0.651, src: "Zainab Rauf's aloo paratha sheet (research/zainab/recipes/pk-aloo-paratha.md): dough, potato filling and fat cooked to 46.7 g water per 100 g (CoFID 2021 11-912 stuffed paratha, analysed) gives yield 0.651 of the raw total" },
  waterSimmer40: { f: 0.6, src: "Lab convention C.simmerAjar30 (research/zainab/conventions.mjs, assumption): 30% of the free water evaporates per 30 min with the lid ajar; 40 min → 40% gone, 60% kept" },
};
const KEEP = new Set(['oil-olive', 'oil-sunflower', 'salt', 'sugar']);
const isKept = (id) => KEEP.has(id) || (REG[id] && /spice|masala|hanout|pepper, black|Cumin|Coriander seed|Paprika|Turmeric|chilli powder|Cinnamon|Cloves|Cardamom|Bay leaf|Oregano|Black pepper/i.test(REG[id].label));
const ADDED_FAT = new Set(['oil-olive', 'oil-sunflower']);
// Components whose storage class is not (yet) in RULES.mealPrep.storage. They do not set the box use-by
// here; the sheet says so, and the gap is reported to Ayesha.
export const PROPOSED_STORAGE = {
  'proposed:bread': { label: 'Bread (pita)', note: 'room temperature until the pack date; freeze if not used in 3 days (manufacturer storage text). Not a use-by item.' },
  'proposed:whole-fruit': { label: 'Whole fruit (banana) and nuts', note: 'room temperature; not a use-by item.' },
  'proposed:sealed-pack': { label: 'Sealed pack (microwave rice cup, can, single cheese tub)', note: 'stays sealed in the box until you eat it; keeps to the date on the pack (rice cups and cans in the cupboard, Burgos tubs in the fridge). Once opened it follows the class of what it is mixed into.' },
};

// ------------------------------------------------------------------ prices
const MERC_META = JSON.parse(fs.readFileSync(path.join(MERC, 'fetched.json'), 'utf8'));
function mercadonaIndex() {
  const idx = new Map();
  for (const f of fs.readdirSync(MERC).filter((n) => n.startsWith('cat_'))) {
    const catDate = MERC_META.extra?.[f.slice(4, -5)] ?? MERC_META.date;
    const walk = (c) => {
      for (const p of c.products || []) if (!idx.has(p.id) || catDate === MERC_META.date) idx.set(p.id, { ...p, _date: catDate });
      for (const s of c.categories || []) walk(s);
    };
    walk(JSON.parse(fs.readFileSync(path.join(MERC, f), 'utf8')));
  }
  return idx;
}
const MERC_IDX = mercadonaIndex();
const MERC_DATE = MERC_META.date;
// Dated snapshots (research/yusuf/mercadona.mjs snap): one read date for every category in the folder.
const SNAP_ROOT = path.join(root, 'research', 'cache', 'yusuf', 'mercadona-snap');
const SNAPS = new Map();
function snapIndex(date) {
  if (SNAPS.has(date)) return SNAPS.get(date);
  const dir = path.join(SNAP_ROOT, date);
  if (!fs.existsSync(dir)) throw new Error(`Mercadona snapshot ${date} missing: run node research/yusuf/mercadona.mjs snap`);
  const idx = new Map();
  for (const f of fs.readdirSync(dir).filter((n) => n.startsWith('cat_'))) {
    const walk = (c) => {
      for (const p of c.products || []) if (!idx.has(String(p.id))) idx.set(String(p.id), { ...p, _date: date });
      for (const sc of c.categories || []) walk(sc);
    };
    walk(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
  }
  SNAPS.set(date, idx);
  return idx;
}

// opts.snap = 'YYYY-MM-DD': price every Mercadona item from that snapshot (the low-cook week), else each
// item's own buy.snap, else the Sprint 1 cache with its category read dates.
export function priceOf(ingId, opts = {}) {
  const buy = REG[ingId]?.buy;
  if (!buy) return { shop: 'none', eurPerG: null, why: 'not bought separately' };
  if (buy.shop === 'bakery') return { shop: 'bakery', name: REG[ingId].label, eurPerG: null, note: 'bakery (forn) price not looked up' };
  if (buy.shop === 'mercadona') {
    const snap = opts.snap ?? buy.snap;
    const pid = String(opts.id ?? buy.id); // opts.id: a smaller pack of the same food (the week list)
    const p = (snap ? snapIndex(snap).get(pid) : null) ?? MERC_IDX.get(pid);
    if (!p) return { shop: 'mercadona', eurPerG: null, why: `Mercadona product ${pid} not in the cache` };
    const pi = p.price_instructions;
    const price = Number(pi.unit_price);
    let grams;
    let pack;
    if (buy.perUnitG) {
      const units = buy.units ?? pi.total_units ?? 1;
      grams = units * buy.perUnitG;
      pack = `${units} × ${buy.perUnitG} g edible`;
    } else if (pi.size_format === 'l') {
      grams = pi.unit_size * 1000 * (buy.densityGPerMl ?? 1);
      pack = `${pi.unit_size} l`;
    } else {
      grams = (pi.drained_weight || pi.unit_size) * 1000;
      pack = pi.drained_weight ? `${pi.unit_size * 1000} g (${pi.drained_weight * 1000} g drained)` : `${Math.round(pi.unit_size * 1000)} g`;
    }
    return { shop: 'mercadona', id: p.id, name: p.display_name, packPrice: price, packG: grams, pack, eurPerG: price / grams, url: `https://tienda.mercadona.es/product/${p.id}/`, date: p._date };
  }
  if (buy.shop === 'butcher') {
    const it = BUTCHER.items[buy.item];
    return { shop: 'butcher', name: it.name, eurPerG: it.eurPerKg == null ? null : it.eurPerKg / 1000, eurPerKg: it.eurPerKg, url: it.url, note: it.note, date: it.date ?? PRICE_DATE };
  }
  if (buy.shop === 'desi') {
    const it = DESI.items[buy.item];
    return { shop: 'desi', name: it.name, eurPerG: it.eurPerKg == null ? null : it.eurPerKg / 1000, note: it.note, date: PRICE_DATE };
  }
  throw new Error(`${ingId}: unknown shop`);
}

// ------------------------------------------------------------------ compute one sheet
const NUTS = ['kcal', 'protein', 'carbs', 'fat', 'fiber', 'sugars', 'satFat', 'sodiumMg'];
export function compute(sheet) {
  const boxes = sheet.boxes ?? 4;
  const tot = Object.fromEntries(NUTS.map((k) => [k, 0]));
  const missing = { sugars: 0, satFat: 0, sodiumMg: 0 };
  let raw = 0;
  let cooked = 0;
  let addedFat = 0;
  const comps = [];
  const buyList = new Map();
  for (const c of sheet.components) {
    const ct = Object.fromEntries(NUTS.map((k) => [k, 0]));
    let craw = 0;
    let ccooked = 0;
    const lines = [];
    for (const [ingId, grams, note = '', yKey] of c.lines) {
      if (ingId === 'water') {
        const wk = yKey ?? (c.yieldAll ? c.yield : 'absorbed');
        const wy = YIELDS[wk];
        if (!wy) throw new Error(`${sheet.id}: unknown yield ${wk}`);
        craw += grams;
        ccooked += grams * wy.f;
        lines.push({ ingId, grams, note, yieldKey: wk, yield: wy.f, cookedG: grams * wy.f, n: null });
        continue;
      }
      const ing = ING[ingId];
      if (!ing) throw new Error(`${sheet.id}: unknown ingredient ${ingId}`);
      const key = yKey ?? (isKept(ingId) && !c.yieldAll ? 'none' : c.yield);
      const y = YIELDS[key];
      if (!y) throw new Error(`${sheet.id}: unknown yield ${key}`);
      const n = {};
      for (const k of NUTS) {
        const v = ing[k];
        if (v == null) {
          if (k === 'sugars') missing.sugars += ((ing.carbs || 0) * grams) / 100;
          if (k === 'satFat') missing.satFat += ((ing.fat || 0) * grams) / 100;
          if (k === 'sodiumMg') missing.sodiumMg += grams;
          n[k] = 0;
        } else n[k] = (v * grams) / 100;
        ct[k] += n[k];
        tot[k] += n[k];
      }
      if (ADDED_FAT.has(ingId)) addedFat += n.fat;
      craw += grams;
      ccooked += grams * y.f;
      lines.push({ ingId, grams, note, yieldKey: key, yield: y.f, cookedG: grams * y.f, n });
      const b = buyList.get(ingId) ?? 0;
      buyList.set(ingId, b + grams);
    }
    raw += craw;
    cooked += ccooked;
    comps.push({ id: c.id, label: c.label, storage: c.storage, eat: c.eat ?? sheet.eat, pot: c.pot ?? null, rawG: craw, cookedG: ccooked, boxG: ccooked / boxes, totals: ct, lines });
  }
  const per = (x) => (x * 100) / cooked;
  const r1 = (x) => Math.round(x * 10) / 10;
  const p = {
    kcal: 0,
    protein: r1(per(tot.protein)),
    carbs: r1(per(tot.carbs)),
    fat: r1(per(tot.fat)),
    fiber: r1(per(tot.fiber)),
    sugars: missing.sugars > 0.1 * tot.carbs ? null : r1(per(tot.sugars)),
    satFat: missing.satFat > 0.1 * tot.fat ? null : r1(per(tot.satFat)),
    sodium: missing.sodiumMg > 0.05 * raw ? null : Math.round(per(tot.sodiumMg)),
  };
  p.kcal = Math.round(4 * p.protein + 4 * p.carbs + 9 * p.fat + 2 * p.fiber);
  if (p.sugars != null && p.sugars > p.carbs) p.sugars = p.carbs;
  const boxG = Math.round(cooked / boxes);
  const box = {
    grams: boxG,
    kcal: Math.round((p.kcal * boxG) / 100),
    protein: r1((p.protein * boxG) / 100),
    carbs: r1((p.carbs * boxG) / 100),
    fat: r1((p.fat * boxG) / 100),
    fiber: r1((p.fiber * boxG) / 100),
  };
  const slot = sheet.slot ?? 'lunch';
  const T = RULES.mealPrep.targetsBySlot[slot];
  const targets = {
    kcal: box.kcal >= T.kcal.min && box.kcal <= T.kcal.max,
    protein: box.protein >= T.proteinG.min && box.protein <= T.proteinG.max,
    fiber: box.fiber >= T.minFiberG,
  };
  // storage: shortest fridge life among components (RULES.mealPrep.storage)
  const ST = new Map(RULES.mealPrep.storage.map((s) => [s.id, s]));
  // A storage id outside RULES.mealPrep.storage must be written 'proposed:<id>' (see PROPOSED_STORAGE).
  for (const c of comps) if (!ST.has(c.storage) && !(c.storage in PROPOSED_STORAGE)) throw new Error(`${sheet.id}: unknown storage ${c.storage}`);
  const fridgeDays = Math.min(...comps.map((c) => ST.get(c.storage)?.fridgeDays ?? Infinity));
  // cost
  let cost = 0;
  const unpriced = [];
  const shopping = [];
  for (const [ingId, grams] of buyList) {
    const pr = priceOf(ingId);
    const line = { ingId, label: REG[ingId].label, grams, shop: REG[ingId].buy?.shop ?? 'none', price: pr };
    if (pr.eurPerG == null) {
      if (pr.shop !== 'none') unpriced.push({ ingId, grams, why: pr.note || pr.why || 'no current price found' });
    } else {
      line.cost = grams * pr.eurPerG;
      cost += line.cost;
    }
    shopping.push(line);
  }
  const majorUnpriced = unpriced.filter((u) => u.grams / boxes >= 20);
  return {
    id: sheet.id,
    n: sheet.n,
    file: sheet.file,
    effort: sheet.effort ?? 'cook',
    minutes: sheet.minutes ?? null,
    slot,
    serving: sheet.serving ?? 'box',
    boxes,
    rawG: Math.round(raw),
    cookedG: Math.round(cooked),
    yield: +(cooked / raw).toFixed(3),
    per100g: p,
    addedFatPer100g: r1(per(addedFat)),
    tableKcalPer100g: Math.round(per(tot.kcal)),
    energyGapPct: +(((per(tot.kcal) - p.kcal) / p.kcal) * 100).toFixed(1),
    box,
    halfBoxG: Math.round(boxG / 2),
    targets,
    fridgeDays,
    components: comps.map((c) => ({ ...c, rawG: Math.round(c.rawG), cookedG: Math.round(c.cookedG), boxG: Math.round(c.boxG) })),
    cost: {
      perBox: +(cost / boxes).toFixed(2),
      batch: +cost.toFixed(2),
      complete: unpriced.length === 0,
      partialMajor: majorUnpriced.length > 0,
      unpriced,
      mercadonaDate: MERC_DATE,
      otherDate: PRICE_DATE,
    },
    shopping,
  };
}

export async function loadSheets(filter) {
  const dir = path.join(here, 'recipes');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.mjs')).sort();
  const sheets = [];
  for (const f of files) {
    const mod = await import(pathToFileURL(path.join(dir, f)).href);
    const s = mod.default;
    if (!filter || s.id === filter || String(s.n) === String(filter) || f.startsWith(filter)) sheets.push({ ...s, file: `research/yusuf/recipes/${f}` });
  }
  return sheets.sort((a, b) => a.n - b.n);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const filter = process.argv[2];
  const sheets = await loadSheets(filter);
  const results = {};
  for (const s of sheets) {
    const r = compute(s);
    results[s.id] = r;
    const b = r.box;
    const ok = (t) => (t ? 'ok' : 'MISS');
    console.log(`R-MP-${String(r.n).padEnd(2)} ${s.id.padEnd(38)} ${r.slot.slice(0, 5)} ${r.serving.padEnd(7)} ${String(b.grams).padStart(3)} g ${String(b.kcal).padStart(4)} kcal [${ok(r.targets.kcal)}] P${String(b.protein).padStart(5)} [${ok(r.targets.protein)}] C${b.carbs} F${b.fat} Fib${String(b.fiber).padStart(4)} [${ok(r.targets.fiber)}] | /100g ${r.per100g.kcal} kcal P${r.per100g.protein} C${r.per100g.carbs} F${r.per100g.fat} Fib${r.per100g.fiber} | tbl ${r.tableKcalPer100g} (${r.energyGapPct}%) | ${r.cost.perBox.toFixed(2)} €/box${r.cost.complete ? '' : r.cost.partialMajor ? ' PARTIAL' : ' (+minor unpriced)'} | fridge ${r.fridgeDays} d`);
    if (filter) {
      for (const c of r.components) {
        console.log(`   [${c.id}] raw ${c.rawG} g → ${c.cookedG} g (box ${c.boxG} g) storage ${c.storage}`);
        for (const l of c.lines) console.log(`      ${l.ingId.padEnd(18)} ${String(l.grams).padStart(5)} g ×${l.yield} ${l.n ? `${l.n.kcal.toFixed(0)} kcal P${l.n.protein.toFixed(1)} F${l.n.fat.toFixed(1)} Fib${l.n.fiber.toFixed(1)}` : ''} ${l.note}`);
      }
      for (const u of r.cost.unpriced) console.log(`   unpriced: ${u.ingId} ${u.grams} g (${u.why})`);
    }
  }
  if (!filter) {
    fs.mkdirSync(path.join(here, 'out'), { recursive: true });
    fs.writeFileSync(path.join(here, 'out', 'results.json'), JSON.stringify(results, null, 1) + '\n');
    console.log(`\n${Object.keys(results).length} sheets → research/yusuf/out/results.json`);
  }
}
