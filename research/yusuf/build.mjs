#!/usr/bin/env node
// Build the lunch-box deliverables from the recipe definitions and the calculator, so every number in the
// sheets, the records and the library page comes from the same calculation. Owner: Yusuf Benali.
//
//   node research/yusuf/fetch.mjs   # ingredient values (once)
//   node research/yusuf/build.mjs   # → research/yusuf/recipes/<id>.md, app/data/foods-mealprep.js, docs/MEALPREP.md
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { compute, loadSheets, YIELDS, PROPOSED_STORAGE, priceOf } from './calc.mjs';
import REG from './ingredients.mjs';
import { BUTCHER, DESI } from './prices.mjs';
import { stampReview } from '../review/reviewed.mjs';
import { FOODS } from '../../app/data/index.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', '..');
const ING = JSON.parse(fs.readFileSync(path.join(here, 'ingredients.json'), 'utf8'));
const RULES = (await import(pathToFileURL(path.join(root, 'app', 'data', 'rules.js')).href)).default;
const usda = JSON.parse(fs.readFileSync(path.join(root, 'research', 'cache', 'usda', 'index.json'), 'utf8'));
const cofid = JSON.parse(fs.readFileSync(path.join(root, 'research', 'cache', 'cofid', 'proximates.json'), 'utf8'));
const zainab = JSON.parse(fs.readFileSync(path.join(root, 'research', 'zainab', 'out', 'results.json'), 'utf8'));
const DATE = '2026-10-13'; // date the labels, prices and table values were read
const BUILT = new Date().toISOString().slice(0, 10);
const ST = new Map(RULES.mealPrep.storage.map((s) => [s.id, s]));
const TB = RULES.mealPrep.targetsBySlot;
// Words per serving type: the container the prep goes in (RULES.mealPrep.prepServingIds).
const UNIT = { box: { one: 'box', many: 'boxes' }, jar: { one: 'jar', many: 'jars' }, portion: { one: 'portion', many: 'portions' } };
const SLOT_WORD = { breakfast: 'breakfast', lunch: 'lunch', dinner: 'dinner' };

const r1 = (x) => (Math.round(x * 10) / 10).toFixed(1);
const r0 = (x) => String(Math.round(x));
const eur = (x) => `${x.toFixed(2)} €`;
const EAT = { hot: 'hot (microwave)', cold: 'cold (no microwave needed)', either: 'hot or cold' };
const eatShort = { hot: 'Hot', cold: 'Cold', either: 'Hot or cold' };
const fmtG = (g) => (g < 10 && g % 1 ? String(g) : r0(g));

function storageRow(id) {
  if (ST.has(id)) {
    const s = ST.get(id);
    return { cls: `\`${id}\``, fridge: `${s.fridgeDays} day${s.fridgeDays > 1 ? 's' : ''}`, freezer: s.freezable ? `${s.freezerMonths} month${s.freezerMonths > 1 ? 's' : ''}` : 'do not freeze' };
  }
  const p = PROPOSED_STORAGE[id];
  return { cls: `\`${id}\` (not in RULES)`, fridge: '—', freezer: id === 'proposed:bread' ? 'yes (pack)' : '—' };
}

function refValues(chk) {
  if (chk.fdc) {
    const f = usda.find((x) => x.fdcId === chk.fdc);
    const n = f.n;
    const fib = n.fiber ?? 0;
    return { label: `USDA FDC ${f.dataset === 'fndds' ? 'FNDDS' : f.dataset} ${chk.fdc} "${f.description}"`, kcal: n.kcal, protein: n.protein, fat: n.fat, carbs: n.carbsDiff - fib };
  }
  if (chk.zainab) {
    const z = zainab[chk.zainab];
    if (!z) throw new Error(`Zainab result ${chk.zainab} missing`);
    const p = z.per100g;
    return { label: `Zainab Rauf's ${z.dish ?? chk.zainab} (research/zainab, sheet id ${chk.zainab})`, kcal: p.kcal, protein: p.protein, fat: p.fat, carbs: p.carbs };
  }
  if (chk.cofid) {
    const c = cofid.find((x) => x.code === chk.cofid);
    return { label: `CoFID 2021 ${chk.cofid} "${c.name}"`, kcal: Number(c.KCALS), protein: Number(c.PROT), fat: Number(c.FAT), carbs: Number(c.CHO), carbsNote: 'CoFID carbohydrate is in monosaccharide equivalents' };
  }
  return null;
}
function ourValues(r, comps) {
  const cs = comps ? r.components.filter((c) => comps.includes(c.id)) : r.components;
  let g = 0;
  const t = { protein: 0, carbs: 0, fat: 0, fiber: 0 };
  for (const c of cs) {
    g += c.cookedG;
    for (const k of Object.keys(t)) t[k] += c.totals[k];
  }
  const p = Object.fromEntries(Object.entries(t).map(([k, v]) => [k, (v * 100) / g]));
  p.kcal = 4 * p.protein + 4 * p.carbs + 9 * p.fat + 2 * p.fiber;
  return { label: comps ? `our ${cs.map((c) => c.label.toLowerCase()).join(' + ')}` : 'our whole box', ...p };
}

// ------------------------------------------------------------------ shopping and cost text
function shopping(r) {
  const by = { butcher: [], desi: [], mercadona: [] };
  for (const l of r.shopping) if (by[l.shop]) by[l.shop].push(l);
  const out = [];
  out.push('**Halal butcher (carnicería halal)**', '');
  if (!by.butcher.length) out.push('- Nothing: this box has no meat.');
  for (const l of by.butcher) {
    const p = l.price;
    out.push(`- ${p.name}: **${r0(l.grams)} g**. ${p.eurPerKg != null ? `${p.eurPerKg.toFixed(2)} €/kg at [Carne Halal Online](${p.url}) on ${p.date}${p.note ? ` (${p.note})` : ''}.` : `${p.note}`}`);
  }
  if (by.desi.length) {
    out.push('', '**Pakistani or Moroccan grocery shelf (usually at or next to the halal butcher)**', '');
    for (const l of by.desi) out.push(`- ${l.price.name}: ${fmtG(l.grams)} g${l.price.note ? ` (${l.price.note})` : ''}. Price: not available.`);
  }
  const mDates = [...new Set(by.mercadona.map((l) => l.price.date).filter(Boolean))].sort().join(' and ') || r.cost.mercadonaDate;
  out.push('', '**Mercadona** (online shop, Barcelona warehouse `bcn1`, prices read ' + mDates + ')', '', '| You need | Product | Pack | Buy | Pack price |', '|---|---|---|---|---|');
  for (const l of by.mercadona) {
    const p = l.price;
    const buy = REG[l.ingId].buy;
    const packs = buy.perUnitG ? Math.ceil(l.grams / buy.perUnitG) : Math.ceil(l.grams / p.packG - 1e-9);
    const unitWord = buy.perUnitG ? (l.ingId === 'egg' ? `${packs} eggs` : `${packs} pieces`) : `${packs} × pack`;
    out.push(`| ${REG[l.ingId].label.replace(/\s*\(.*$/, '')}: ${fmtG(l.grams)} g | [${p.name}](${p.url}) | ${p.pack} | ${unitWord} | ${eur(p.packPrice)} |`);
  }
  const checks = r.shopping.filter((l) => REG[l.ingId].labelCheck);
  out.push('', '**Label checks** (what to read on the pack; what we found on ' + DATE + ')', '');
  for (const l of checks) out.push(`- ${REG[l.ingId].label.replace(/\s*\(.*$/, '')}: ${REG[l.ingId].labelCheck}`);
  out.push(
    '- Every packaged item: look for *manteca* or *manteca de cerdo* (lard), *gelatina* (gelatine, usually pork), *E471 / E472* emulsifiers without "de origen vegetal", and *sebo* (tallow). "Sin cerdo" on a label does not mean halal.',
  );
  return out.join('\n');
}
function costText(r) {
  const c = r.cost;
  const missing = c.unpriced.map((u) => `${REG[u.ingId].label.replace(/\s*\(.*$/, '').toLowerCase()} (${fmtG(u.grams)} g)`);
  const mDates = [...new Set(r.shopping.filter((l) => l.shop === 'mercadona' && l.price.date).map((l) => l.price.date))].sort().join(' and ') || c.mercadonaDate;
  const src = `Mercadona Barcelona online prices (warehouse bcn1) read ${mDates}; halal-butcher prices from Carne Halal Online read ${c.otherDate}. Pro-rata: the cost of what goes in the boxes, not of whole packs.`;
  const hasMeat = r.shopping.some((l) => l.shop === 'butcher');
  const xc = hasMeat ? ` Halal-meat price cross-check: ${BUTCHER.crossCheck}.` : '';
  if (c.partialMajor) {
    return `**Indicative cost per ${UNIT[r.serving].one}: not available.** No current price was found for ${missing.join(', ')}. The priced part comes to ${eur(c.perBox)} per ${UNIT[r.serving].one} (${eur(c.batch)} for the batch). ${src}${xc}`;
  }
  const u = UNIT[r.serving];
  return `**Indicative cost per ${u.one}: ${eur(c.perBox)}** (${eur(c.batch)} for ${r.boxes} ${u.many}). ${src}${xc}${missing.length ? ` Not included (no price found, small amounts): ${missing.join(', ')}.` : ''}`;
}

// ------------------------------------------------------------------ recipe sheet
function sheetMd(s, r) {
  const L = [];
  const p = r.per100g;
  const b = r.box;
  const ok = (v) => (v ? 'met' : '**missed**');
  const u = UNIT[r.serving];
  const T = TB[r.slot];
  L.push(`# R-MP-${s.n} · ${s.names.en}`, '');
  L.push(`Record \`${s.id}\` in \`app/data/foods-mealprep.js\` · library page: [docs/MEALPREP.md](../../../docs/MEALPREP.md) · numbers from \`node research/yusuf/calc.mjs ${s.n}\` (definition: \`${s.file}\`). Generated by \`research/yusuf/build.mjs\` on ${BUILT} (labels, prices and table values read ${DATE}); edit the \`.mjs\`, not this file.`, '');
  L.push('| Language | Name |', '|---|---|', `| English | ${s.names.en} |`, `| Español | ${s.names.es} |`, `| Català | ${s.names.ca} |`);
  if (s.names.ur) L.push(`| اردو | ${s.names.ur} |`);
  if (s.names.roman) L.push(`| Roman Urdu | ${s.names.roman} |`);
  L.push('', `**Eat:** ${EAT[s.eat]}. **Halal:** ${s.halal.status}${s.halal.reason ? `: ${s.halal.reason}` : ''} **Confidence:** ${s.confidence}.`, '');
  L.push(`**Meal:** ${SLOT_WORD[r.slot]} prep, logged as "1 ${u.one}".`, '');
  L.push(`## One ${u.one} at a glance`, '', `| ${u.one[0].toUpperCase() + u.one.slice(1)} weight | kcal | Protein | Carbs | Fat | Fibre |`, '|---|---|---|---|---|---|');
  L.push(`| ${b.grams} g (½ ${u.one} ${r.halfBoxG} g) | ${b.kcal} | ${r1(b.protein)} g | ${r1(b.carbs)} g | ${r1(b.fat)} g | ${r1(b.fiber)} g |`, '');
  L.push(`Targets (\`RULES.mealPrep.targetsBySlot.${r.slot}\`): ${T.kcal.min}–${T.kcal.max} kcal ${ok(r.targets.kcal)}; ${T.proteinG.min}–${T.proteinG.max} g protein ${ok(r.targets.protein)}; at least ${T.minFiberG} g fibre ${ok(r.targets.fiber)}.`, '');
  L.push('## References (at least 2 published recipes)', '');
  for (const ref of s.references) L.push(`- [${ref.title}](${ref.url}): ${ref.used}. *Read: ${ref.read}.*`);
  L.push('', `The standard recipe below triangulates these and then adjusts to the box targets (see "Changes"). No wine anywhere: lemon or water replaces it.`, '');
  L.push(`## Standard recipe: ${r.boxes} ${u.many}, raw edible grams`, '');
  for (const c of r.components) {
    L.push(`### ${c.label}`, '', `| Ingredient | Raw g (${r.boxes} ${u.many}) | Per ${u.one} | Notes |`, '|---|---|---|---|');
    for (const l of c.lines) {
      const name = l.ingId === 'water' ? 'Water (absorbed)' : REG[l.ingId].label;
      L.push(`| ${name} | ${fmtG(l.grams)} | ${fmtG(Math.round((l.grams / r.boxes) * 10) / 10)} | ${l.note || ''} |`);
    }
    L.push('');
  }
  L.push('## Method', '');
  s.method.forEach((m, i) => L.push(`${i + 1}. ${m}`));
  L.push('');
  const oils = r.components.flatMap((c) => c.lines).filter((l) => l.ingId.startsWith('oil-'));
  const oilG = oils.reduce((a, l) => a + l.grams, 0);
  L.push('## Added fat', '', `${oilG} g of oil for the batch (${r1(oilG / r.boxes)} g per ${u.one}), all assumed eaten. That is ${r1(r.addedFatPer100g)} g per 100 g as eaten (\`addedFatPer100g\`). Oil is weighed, not poured: 1 tbsp of oil = 13.6 g (\`RULES.referenceWeightsG\`).`, '');
  L.push(`## Yield and ${u.one} weight`, '', `| Component | Raw g | Cooked g | Per ${u.one} g | Storage |`, '|---|---|---|---|---|');
  for (const c of r.components) L.push(`| ${c.label} | ${c.rawG} | ${c.cookedG} | **${c.boxG}** | ${storageRow(c.storage).cls} |`);
  L.push(`| **Batch** | ${r.rawG} | ${r.cookedG} | **${b.grams}** (½ ${u.one} ${r.halfBoxG}) | |`, '');
  L.push(`Overall yield ${r.yield} (cooked ÷ raw, absorbed water included). Yield factors used:`, '');
  const used = [...new Set(r.components.flatMap((c) => c.lines.map((l) => l.yieldKey)))];
  for (const k of used) L.push(`- ×${YIELDS[k].f} (\`${k}\`): ${YIELDS[k].src}.`);
  L.push('');
  L.push('## Per 100 g as eaten (the food record)', '', '| kcal | Protein | Carbs (available) | Fat | Fibre | Sugars | Sat fat | Sodium | Added fat |', '|---|---|---|---|---|---|---|---|---|');
  L.push(`| ${p.kcal} | ${r1(p.protein)} g | ${r1(p.carbs)} g | ${r1(p.fat)} g | ${r1(p.fiber)} g | ${p.sugars == null ? '—' : `${r1(p.sugars)} g`} | ${p.satFat == null ? '—' : `${r1(p.satFat)} g`} | ${p.sodium == null ? '—' : `${p.sodium} mg`} | ${r1(r.addedFatPer100g)} g |`, '');
  L.push(`Per 100 g = batch totals ÷ ${r.cookedG} g × 100, with every part of the ${u.one} included (NUTRITION.md §6). Sugars, saturated fat and sodium are given only when the ingredients that lack them carry under 10% of the total; spice-blend sodium (black salt in chaat masala) is not counted.`, '');
  L.push('## Energy check', '', `kcal = round(4P + 4C + 9F + 2·fibre) = **${p.kcal}** per 100 g. The sum of the tables\' own energy values is ${r.tableKcalPer100g} kcal per 100 g (gap ${r.energyGapPct}%), within the ±10% data gate.`, '');
  L.push('## Cross-check', '');
  const checks = [s.crossCheck, ...(s.extraChecks || [])].filter(Boolean);
  for (const chk of checks) {
    const ref = refValues(chk);
    if (!ref) {
      L.push(`- ${chk.note}`);
      continue;
    }
    const ours = ourValues(r, chk.comps);
    const d = ((ours.kcal - ref.kcal) / ref.kcal) * 100;
    L.push(`- ${ref.label}: ${r0(ref.kcal)} kcal, P ${r1(ref.protein)}, C ${r1(ref.carbs)}, F ${r1(ref.fat)} per 100 g${ref.carbsNote ? ` (${ref.carbsNote})` : ''}. ${ours.label[0].toUpperCase() + ours.label.slice(1)}: ${r0(ours.kcal)} kcal, P ${r1(ours.protein)}, C ${r1(ours.carbs)}, F ${r1(ours.fat)}. Difference ${d >= 0 ? '+' : ''}${r1(d)}% in energy${Math.abs(d) > 25 ? ' (over 25%, explained next)' : ''}. ${chk.note}`);
  }
  L.push('');
  L.push('## Storage (per component, `RULES.mealPrep.storage`)', '', `| Component | Per ${u.one} | Class | Fridge (≤ 5 °C) | Freezer |`, '|---|---|---|---|---|');
  for (const c of r.components) {
    const sr = storageRow(c.storage);
    L.push(`| ${c.label} | ${c.boxG} g | ${sr.cls} | ${sr.fridge} | ${sr.freezer} |`);
  }
  L.push('', `Use-by of a packed ${u.one} = cooked date + the shortest fridge life in it = **${r.fridgeDays} day${r.fridgeDays > 1 ? 's' : ''}**. A frozen ${u.one} has no use-by until it is moved to the fridge (then 1 day).`, '');
  L.push(s.storagePlan, '');
  for (const c of r.components) if (PROPOSED_STORAGE[c.storage]) L.push(`- ${PROPOSED_STORAGE[c.storage].label}: ${PROPOSED_STORAGE[c.storage].note}`);
  L.push('', r.slot === 'lunch' ? 'Chill everything within 60 minutes of cooking (spread on a tray). Cold boxes travel in an insulated bag with an ice pack and are eaten within 2 hours of leaving the fridge (1 hour above 32 °C).' : 'Chill everything within 60 minutes of cooking (spread on a tray). Reheat once only, until steaming hot right through (75 °C).', '');
  L.push('## Eating and reheating', '', `**Eat ${EAT[s.eat]}.** ${s.reheat}`, '');
  L.push(`## Shopping list for ${r.boxes} ${u.many}`, '', shopping(r), '');
  L.push(`## Cost per ${u.one}`, '', costText(r), '');
  L.push(`## Changes made to meet the ${SLOT_WORD[r.slot]} targets`, '');
  for (const ch of s.changes) L.push(`- ${ch}`);
  L.push('', '## Ingredient values (per 100 g, carbs = available carbohydrate)', '', '| Ingredient | Source | kcal | P | C | F | Fibre |', '|---|---|---|---|---|---|---|');
  const seen = new Set();
  for (const c of r.components)
    for (const l of c.lines) {
      if (l.ingId === 'water' || seen.has(l.ingId)) continue;
      seen.add(l.ingId);
      const v = ING[l.ingId];
      L.push(`| ${l.ingId} | ${v.citation} | ${r0(v.kcal)} | ${r1(v.protein)} | ${r1(v.carbs)} | ${r1(v.fat)} | ${r1(v.fiber)} |`);
    }
  L.push('', '## Assumptions and confidence', '', `Confidence **${s.confidence}**: ${s.confidenceWhy} Macronutrients are 100% retained (NUTRITION.md §6 step 6); all oil is eaten; water that boils off is not counted.`, '');
  return L.join('\n');
}

// ------------------------------------------------------------------ records
const STATE = {
  lunch: (s, parts) => `cooked, one packed lunch box as eaten, all pots included (${parts})`,
  breakfast: (s, parts) => `one prepared breakfast ${s.serving} as eaten (${parts})`,
  dinner: (s, parts) => `cooked, one freezer dinner portion as eaten (${parts})`,
};
const SLOTS = { lunch: ['lunch'], breakfast: ['breakfast'], dinner: ['dinner', 'lunch'] };
function record(s, r) {
  const u = UNIT[r.serving];
  const p = r.per100g;
  const per100g = { kcal: p.kcal, protein: +r1(p.protein), carbs: +r1(p.carbs), fat: +r1(p.fat), fiber: +r1(p.fiber) };
  if (p.sugars != null) per100g.sugars = +r1(p.sugars);
  if (p.satFat != null) per100g.satFat = +r1(p.satFat);
  if (p.sodium != null) per100g.sodium = p.sodium;
  const parts = r.components.map((c) => `${c.label.toLowerCase()} ${c.boxG} g`).join(', ');
  const aliases = [...new Set([s.names.es, s.names.ca, ...s.aliases])].filter((a) => a !== s.names.roman);
  const rec = {
    id: s.id,
    name: s.name,
    ...(s.names.ur ? { nameUr: s.names.ur } : {}),
    ...(s.names.roman ? { nameRoman: s.names.roman } : {}),
    aliases,
    group: 'lunchbox',
    state: STATE[r.slot](s, parts),
    per100g,
    addedFatPer100g: +r1(r.addedFatPer100g),
    servings: [
      { id: r.serving, label: `1 ${u.one}`, grams: r.box.grams, default: true },
      { id: `half-${r.serving}`, label: `½ ${u.one}`, grams: r.halfBoxG },
    ],
    tags: s.tags,
    slots: SLOTS[r.slot],
    halal: s.halal.reason ? { status: s.halal.status, reason: s.halal.reason } : { status: s.halal.status },
    source: {
      citation: `Recipe R-MP-${s.n}: ${s.names.en}, standard batch of ${r.boxes} ${u.many} (research/yusuf/recipes/${s.id}.md)`,
      method: 'recipe',
      confidence: s.confidence,
      reviewer: 'yusuf',
      date: BUILT,
      notes: `Labels, prices and table values read ${r.n > 12 ? '2026-10-13/14' : DATE}. 1 ${u.one} = ${r.box.grams} g = ${r.box.kcal} kcal, ${r1(r.box.protein)} g protein, ${r1(r.box.fiber)} g fibre. Eat ${EAT[s.eat]}; use-by ${r.fridgeDays} day${r.fridgeDays > 1 ? 's' : ''} in the fridge${r.fridgeDays === 1 ? ' (boxes 2–4 frozen)' : ''}. Ingredients: USDA FDC (SR Legacy/Foundation), dated labels (Open Food Facts, checked against tienda.mercadona.es), IFCT 2017; yields: Bognár 2002${r.n > 12 ? ", USDA water balances and Zainab Rauf's moisture-based roti and paratha yields" : ' and USDA water balances'}. USDA carbs by difference minus fibre. Computed by research/yusuf/calc.mjs.`,
    },
  };
  return stampReview(rec);
}
function serialize(recs) {
  const q = (v) => `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  const val = (v, ind) => {
    if (Array.isArray(v)) {
      if (v.every((x) => typeof x !== 'object')) return `[${v.map((x) => val(x, ind)).join(', ')}]`;
      return `[\n${v.map((x) => `${ind}  ${val(x, `${ind}  `)},`).join('\n')}\n${ind}]`;
    }
    if (v && typeof v === 'object') {
      const entries = Object.entries(v);
      const inline = entries.every(([, x]) => typeof x !== 'object' || x === null) && entries.map(([k, x]) => `${k}: ${val(x, ind)}`).join(', ').length < 90;
      if (inline) return `{ ${entries.map(([k, x]) => `${k}: ${val(x, ind)}`).join(', ')} }`;
      return `{\n${entries.map(([k, x]) => `${ind}  ${k}: ${val(x, `${ind}  `)},`).join('\n')}\n${ind}}`;
    }
    return typeof v === 'string' ? q(v) : String(v);
  };
  return recs.map((r) => `  ${val(r, '  ')},`).join('\n');
}

// ------------------------------------------------------------------ library recipes (app/data/recipes-mealprep.js)
// ARCHITECTURE §13.1 LibraryRecipe = { foodId, boxes, storage: (id | { id, pot: true })[],
//   ingredients: [{ foodId?, name?, grams, section?: 'butcher'|'supermarket', note? }] }.
// A research ingredient maps to a food-database id only when that food is the same thing you buy, in the
// same raw state. `name` overrides the shown name when the database food is a close variant (other fat
// level); research ingredients with no database food go in by `name` only (never an invented id).
const DB = {
  'chicken-breast': { foodId: 'intl-chicken-breast-raw' },
  'beef-mince': { foodId: 'intl-beef-mince-raw', name: 'Lean beef mince (about 10% fat), raw', close: 'database food is 85% lean' },
  'yogurt-whole': { foodId: 'intl-dahi', name: 'Plain whole-milk yogurt (yogur natural)' },
  'yogurt-greek-light': { foodId: 'intl-greek-yogurt', name: 'Greek yogurt, light 2% fat (yogur griego ligero)', close: 'database food is 0% fat' },
  'protein-yogurt': { foodId: 'intl-skyr', name: 'High-protein yogurt or skyr, plain 0% (+Proteínas natural)', close: 'database food is skyr' },
  'milk-semi': { foodId: 'intl-milk-whole', name: 'Semi-skimmed milk (leche semidesnatada)', close: 'database food is whole milk' },
  egg: { foodId: 'intl-egg-raw' },
  oats: { foodId: 'intl-oats-dry' },
  walnuts: { foodId: 'intl-walnuts' },
  banana: { foodId: 'intl-banana' },
  'oil-olive': { foodId: 'med-olive-oil' },
  'oil-sunflower': { foodId: 'intl-cooking-oil', name: 'Sunflower oil (aceite de girasol)' },
  onion: { foodId: 'intl-onion' },
  'onion-red': { foodId: 'intl-onion', name: 'Red onion (cebolla morada)' },
  tomato: { foodId: 'intl-tomato' },
  'tomato-cherry': { foodId: 'intl-tomato', name: 'Cherry tomatoes' },
  cucumber: { foodId: 'intl-cucumber' },
  carrot: { foodId: 'intl-carrot' },
  lettuce: { foodId: 'intl-lettuce' },
  potato: { foodId: 'intl-potato-raw' },
  sugar: { foodId: 'intl-sugar' },
  hummus: { foodId: 'med-hummus' },
  tuna: { foodId: 'intl-tuna-canned-water' },
};
const shortLabel = (ingId) => REG[ingId].label.replace(/\s*\((?![^)]*\b(?:contramuslo|pechuga|harina|masoor|lenteja|copos|espinaca|judía|guisante|leche|cebolla|pimiento|claras)\b)[^)]*\)/g, '').trim();
const NAME = {
  'egg-white': 'Liquid egg whites (claras de huevo pasteurizadas)',
  couscous: 'Couscous, dry (cuscús)',
  'pasta-wholewheat': 'Wholewheat pasta, dry (macarrón integral)',
  pita: 'Pita bread (Mission, no E471)',
  'tomato-crushed': 'Crushed tomato (tomate triturado)',
  'chickpeas-jar': 'Cooked chickpeas, jar, drained (garbanzo cocido)',
  'beef-cubes': 'Boneless beef, cubed (carne sin hueso, a tacos)',
  'chicken-thigh': 'Chicken thigh, boneless, skinless (contramuslo)',
  'chicken-mince': 'Chicken mince (carne picada de pollo)',
  'rice-basmati': 'Basmati rice, dry',
  'rice-brown': 'Brown long-grain rice, dry',
  breadcrumbs: 'Breadcrumbs, plain (pan rallado)',
  'red-lentils': 'Red lentils (masoor dal), dry',
  atta: 'Wholemeal flour, atta (harina integral de trigo)',
  spinach: 'Baby spinach',
  'spinach-frozen': 'Frozen chopped spinach (espinaca ultracongelada)',
  'green-beans': 'Frozen green beans (judía verde)',
  peas: 'Frozen peas (guisantes)',
  courgette: 'Courgette (calabacín)',
  'pepper-red': 'Red pepper (pimiento rojo)',
  'pepper-green': 'Green pepper (pimiento verde)',
  garlic: 'Garlic',
  ginger: 'Fresh ginger',
  'green-chilli': 'Green chillies (hari mirch)',
  'lemon-juice': 'Lemon juice (or lemons)',
};
const MISSING = new Map(); // ingId → { label, recipes: Set }
function libraryRecipe(s, r) {
  const items = new Map();
  for (const c of r.components)
    for (const l of c.lines) {
      if (l.ingId === 'water') continue;
      const m = DB[l.ingId];
      const buy = REG[l.ingId].buy;
      const section = buy?.shop === 'butcher' ? 'butcher' : 'supermarket';
      const key = m ? `${m.foodId}|${m.name ?? ''}` : `name|${l.ingId}`;
      const it = items.get(key) ?? (m ? { foodId: m.foodId, ...(m.name ? { name: m.name } : {}), grams: 0, section } : { name: NAME[l.ingId] ?? shortLabel(l.ingId), grams: 0, section });
      if (!m && buy?.shop === 'desi') it.note = 'Pakistani or Moroccan grocery (next to the halal butcher)';
      it.grams += l.grams;
      items.set(key, it);
      if (!m) {
        const x = MISSING.get(l.ingId) ?? { label: REG[l.ingId].label, recipes: new Set() };
        x.recipes.add(s.n);
        MISSING.set(l.ingId, x);
      }
    }
  const ingredients = [...items.values()].map((i) => ({ ...i, grams: Math.round(i.grams * 10) / 10 }));
  const storage = [];
  for (const c of r.components) {
    if (!ST.has(c.storage)) continue; // proposed classes (bread, whole fruit) are not use-by items
    const e = c.pot ? { id: c.storage, pot: true } : c.storage;
    if (!storage.some((x) => JSON.stringify(x) === JSON.stringify(e))) storage.push(e);
  }
  return { foodId: s.id, boxes: r.boxes, storage, ingredients };
}
function recipesFile(rows) {
  const recs = rows.map(({ s, r }) => libraryRecipe(s, r));
  const header = `// Library meal-prep recipes: the standard batch behind each Lab meal-prep food, for the shopping list
// and storage (ARCHITECTURE §13.1 LibraryRecipe). Owner: Yusuf Benali (Nutrition Lab).
// GENERATED by research/yusuf/build.mjs from research/yusuf/recipes/*.mjs; do not edit by hand.
// The nutrition of a library box always comes from its food record in foods-mealprep.js, never from these
// lines. Grams are raw edible weights for the whole batch (water not listed).
// Ingredients with a foodId are foods in the database; a \`name\` next to a foodId is the exact product when
// the database food is a close variant (fat level). Ingredients with a \`name\` only have no database food
// yet (raw chicken thigh, dry rice, couscous, bulgur, spices…): the Lab will add them and switch them to
// foodIds. storage: one RULES.mealPrep.storage id per component; { id, pot: true } = a side pot packed apart.

export default [
`;
  return `${header}${serialize(recs)}\n];\n`;
}

// ------------------------------------------------------------------ library page
function libraryMd(rows) {
  const L = [];
  const by = (slot) => rows.filter(({ r }) => r.slot === slot);
  const stor = (id) => {
    const x = ST.get(id);
    return `${x.fridgeDays} day${x.fridgeDays > 1 ? 's' : ''} in the fridge, ${x.freezable ? `${x.freezerMonths} month${x.freezerMonths > 1 ? 's' : ''} frozen` : 'do not freeze'}`;
  };
  const table = (list) => {
    const u = UNIT[list[0].r.serving] ?? UNIT.portion;
    L.push(`| # | Prep | Why you will like it | kcal | Protein | Fibre | Eat | Keeps | Cost per ${list[0].r.slot === 'breakfast' ? 'jar or portion' : u.one} |`, '|---|---|---|---|---|---|---|---|---|');
    for (const { s, r } of list) {
      const cost = r.cost.partialMajor ? 'not available' : `${r.cost.perBox.toFixed(2)} €`;
      L.push(`| ${s.n} | [${s.names.en}](../research/yusuf/recipes/${s.id}.md) (1 ${UNIT[r.serving].one}, ${r.box.grams} g) | ${s.pitch} | ${r.box.kcal} | ${r1(r.box.protein)} g | ${r1(r.box.fiber)} g | ${eatShort[s.eat]} | ${s.keeps} | ${cost} |`);
    }
    L.push('');
  };
  const roti = FOODS.find((f) => f.id === 'pk-roti');
  const rotiServ = roti.servings.find((x) => x.id === 'roti');
  const rotiKcal = Math.round((roti.per100g.kcal * rotiServ.grams) / 100);
  const TBk = (slot) => `${TB[slot].kcal.min}–${TB[slot].kcal.max} kcal, ${TB[slot].proteinG.min}–${TB[slot].proteinG.max} g protein and at least ${TB[slot].minFiberG} g fibre`;
  const nB = by('breakfast').length;
  const nL = by('lunch').length;
  const nD = by('dinner').length;

  L.push('# Halal meal-prep library: breakfast, lunch and dinner', '');
  L.push(`**Owner:** Yusuf Benali (Nutrition Lab) · **Reviewed by:** Dr. Ayesha Siddiqui (lunch boxes reviewed in Sprint 1; breakfast and dinner preps pending) · **Prices and labels read:** ${DATE} (lunch) and 2026-10-14 (breakfast and dinner additions)`, '');
  L.push(`${rows.length} halal preps you can batch-cook on Sunday: **${nB} breakfasts**, **${nL} lunch boxes** to carry to university and **${nD} freezer dinners** to eat at home. In the app, search for the prep and log **"1 jar"**, **"1 box"** or **"1 portion"** (or the ½ serving).`, '');
  L.push('Every number comes from a standard recipe calculation (NUTRITION.md §6). Each recipe sheet shows the ingredients in grams, the published recipes it starts from, the yields, storage per component, a shopping list and a dated cost.', '');
  L.push('**Contents:** [Breakfast](#breakfast-preps) · [Lunch boxes](#lunch-boxes) · [Dinner](#freezer-dinners) · [Roti and paratha stock](#roti-and-paratha-stock) · [Storage](#storage-at-a-glance) · [A Sunday that works](#a-sunday-that-works) · [How to batch in the app](#how-to-batch-in-the-app) · [Halal shopping in Barcelona](#halal-shopping-in-barcelona) · [Where the numbers come from](#where-the-numbers-come-from)', '');

  L.push('## Breakfast preps', '');
  L.push(`Each one has ${TBk('breakfast')}, and takes 0–2 minutes in the morning. None uses protein powder: the protein comes from eggs, egg whites and a high-protein yogurt (milk and cultures only).`, '');
  table(by('breakfast'));
  L.push(`Overnight oats do not freeze and keep 3 days, so make 3 jars on Sunday night and 2 more on Wednesday. Everything else freezes: egg muffins, pancakes and the egg rolls ${stor('egg-muffin')}; parathas and roti ${stor('cooked-flatbread')}.`, '');

  L.push('## Lunch boxes', '');
  L.push(`Each one makes **4 boxes** with ${TBk('lunch')}. Five are hot boxes for the microwave, three work hot or cold, and four are cold-only for days when the microwave queue is long.`, '');
  table(by('lunch'));
  L.push('"Cost per box" is the pro-rata cost at Mercadona Barcelona and an online halal butcher; "not available" means we could not find a current price for a main ingredient (boneless halal chicken thigh, chana dal, bulgur or masoor dal), and the sheet shows the part we could price.', '');

  L.push('## Freezer dinners', '');
  L.push(`Eaten at home, so desi curries with roti are welcome. Each portion has ${TBk('dinner')}. The six desi dinners start from Zainab Rauf's home-style standard recipes (research/zainab/), made a little lighter in oil, and each portion includes **2 wholemeal roti** from the roti stock. The Catalan *mandonguilles* come with their own potatoes.`, '');
  table(by('dinner'));
  L.push(`Curries and kebabs keep ${stor('cooked-meat')}; daal ${stor('cooked-curry')}; roti ${stor('cooked-flatbread')}. A frozen portion with its roti is best within 2 months. Raita and kachumber are side pots made fresh (they keep 2 days and cannot be frozen).`, '');

  L.push('## Roti and paratha stock', '');
  L.push(`The dinners (and two breakfasts) use a **weekly roti stock** made in one go. Each medium roti is ${rotiServ.grams} g cooked, from about 29 g wholemeal atta and 21 g water, and is ${rotiKcal} kcal (Zainab's \`pk-roti\` record: ${roti.per100g.kcal} kcal, ${roti.per100g.protein} g protein and ${roti.per100g.fiber} g fibre per 100 g).`, '');
  L.push('- **Batch:** 500 g atta + 350 g water + 2–3 g salt makes about 17 medium roti (the same dough as the recipe sheets: yield 0.799 after cooking).');
  L.push('- Knead, rest 20 min, divide into 50 g balls, roll thin and cook on a dry tawa 30–40 s a side.');
  L.push('- Cool under a cloth, then freeze in stacks of 2 or 4 between sheets of baking paper.');
  L.push('- Reheat from frozen on a hot tawa, 20–30 s a side, or 15–20 s in the microwave under a damp paper towel.');
  L.push(`- Extra roti you eat on their own: log them as **Roti / chapati (home, no ghee)**, "1 roti" (${rotiServ.grams} g, ${rotiKcal} kcal). Parathas: the breakfast aloo paratha and anda-paratha roll sheets give a lighter paratha with 6 g oil each, frozen the same way.`, '');

  L.push('## Storage at a glance', '');
  L.push('| What | Class | Fridge (≤ 5 °C) | Freezer | Source |', '|---|---|---|---|---|');
  for (const x of RULES.mealPrep.storage) L.push(`| ${x.label} | \`${x.id}\` | ${x.fridgeDays} day${x.fridgeDays > 1 ? 's' : ''} | ${x.freezable ? `${x.freezerMonths} month${x.freezerMonths > 1 ? 's' : ''}` : 'do not freeze'} | ${x.source} |`);
  L.push('');
  L.push('- **Use-by** of a jar, box or portion = the day it was cooked + the shortest fridge life of its parts. A frozen one has no use-by until you move it to the fridge; then it keeps 1 day.');
  L.push('- **Rice, pasta, couscous and bulgur keep 1 day** in the fridge: in a rice batch, box 1 goes in the fridge and the rest in the freezer. Move tomorrow\'s box down the night before.');
  L.push('- **Cool fast:** spread food on a tray and get it in the fridge within an hour.');
  L.push('- **Reheat once,** until steaming hot right through (75 °C). Raita, yogurt and salad pots are never microwaved.');
  L.push('- **Cold lunch boxes** travel in an insulated bag with an ice pack; eat within 2 hours of leaving the fridge (1 hour on a day above 32 °C).', '');

  L.push('## A Sunday that works', '');
  L.push('About 2½ hours for a week of breakfasts, lunches and dinners, cooked in this order so the oven and the hob are both busy:', '');
  L.push('1. **Roti stock first** (dough rests while you chop).');
  L.push('2. **One dinner** on the hob (karahi, keema, aloo gosht or daal), 4 portions.');
  L.push('3. **One lunch box** batch, 4 boxes: rice, couscous or pasta last, because they keep 1 day in the fridge.');
  L.push('4. **One oven breakfast** while the hob works: egg muffins at 180 °C, or pancakes on a second pan.');
  L.push('5. **Overnight oats** last, in 5 minutes, straight into the fridge.');
  L.push('6. Cool everything on trays, pack, label with the date, and put tomorrow\'s things in the fridge and the rest in the freezer.', '');
  L.push('Pick a different lunch and dinner each week, one hot and one cold lunch, so Thursday is not the same as Monday. Over a month the freezer builds up a mix of dinners.', '');

  L.push('## How to batch in the app', '');
  L.push('Meal prep in Katori follows ARCHITECTURE §13. Button names may change slightly as the screens are finished; the steps stay the same.', '');
  L.push('1. **Pick a prep.** Every jar, box and portion on this page is a food in the app (search its name, in English, Spanish, Catalan or Urdu). Its standard batch (3 or 4) and its ingredient list come with it.');
  L.push('2. **Cook a batch.** Tell the app you cooked it and on which day. It makes one entry per jar, box or portion and suggests where each goes: the first ones in the fridge (as many as the fridge life allows), the rest in the freezer. You can change fridge or freezer for each one.');
  L.push('3. **Place it on your days.** Put a box in Breakfast, Lunch or Dinner on the days you will eat it. One action per day; the day\'s totals count it straight away. Ticking it eaten marks that box as eaten; deleting the entry frees the box again.');
  L.push('4. **Watch the use-by.** On a box\'s last fridge day the app says "last day"; after it, "past use-by, best not to eat". When you move a frozen box to the fridge, its 1-day clock starts.');
  L.push('5. **Shopping list.** Choose the batches for the week and copy the list: halal butcher first, then the supermarket, merged across recipes (no download needed). Ingredients the food database does not hold yet (dry rice, raw chicken thigh, spices…) appear by name.');
  L.push('6. **Your own recipes.** Build a recipe from foods in the database, weigh the pot if you can, say how many boxes it makes, and it becomes a food with a "1 box" serving. Its halal status is the strictest of its ingredients.', '');
  L.push('The nutrition of a library prep always comes from its Lab record (this page), never from adding up the shopping list.', '');

  L.push('## Halal shopping in Barcelona', '');
  L.push('**Meat:** buy chicken and beef from a halal butcher (*carnicería halal*): there are several in the Raval, Sant Antoni and Poble Sec, and online halal butchers deliver in the province. Supermarket chicken and *caldo de pollo* (stock) are not halal unless the pack carries a halal certification seal.', '');
  L.push('**Labels:** read the ingredients, not the front of the pack.', '');
  L.push('- *Manteca* or *manteca de cerdo* is lard. *Mantequilla* is butter (fine). *Manteca de cacao* is cocoa butter (fine).');
  L.push('- *Gelatina* is usually pork gelatine unless it says *bovina halal* or *vegetal*. Check yogurts, desserts, sweets and "light" dairy.');
  L.push('- *E471* and *E472* (mono- and diglycerides) can come from animal fat. Accept them only when the label says *de origen vegetal*. On ' + DATE + ' every wheat wrap at Mercadona Barcelona listed E471 with no origin, which is why the shami box uses Mission pita (no E471) and the breakfast wrap uses a home-made roti. Hacendado hummus marks its additives as *de origen vegetal*.');
  L.push('- *Sebo* is tallow. *Jamón, chorizo, fuet, sobrasada, panceta, butifarra* are pork. *Sin cerdo* ("no pork") is not the same as halal.');
  L.push('- Wine hides in sauces, stocks and stews (*al vino*, *con vino blanco*, *jerez*, *coñac*, *vi ranci*). These recipes use lemon or water instead.');
  L.push('- Protein powder: whey comes from cheese-making, and not every brand is halal-certified. None of these preps needs it.');
  L.push('- Cheese: some people avoid cheese made with animal rennet (*cuajo animal*). Labels that say *cuajo microbiano* or *coagulante vegetal* avoid the question. None of these preps uses cheese.', '');
  L.push('**Bakeries and cafés:** a croissant *de mantequilla* is made with butter. Cheap pastries and some *bollería* are made with lard, and an *ensaïmada* is made with pork lard (*saïm*) by definition. When in doubt, ask "¿lleva manteca de cerdo?" (Catalan: "porta saïm?"). *Pa amb tomàquet* and *café con leche* are fine; most bocadillos are pork, so pick *tortilla* or *atún*.', '');
  L.push('**Desi grocery:** masoor and chana dal, bulgur, green chillies, whole spices, garam and chaat masala are on the Pakistani or Moroccan shelf at or next to the halal butcher (Raval). Mercadona Barcelona sold none of masoor dal, chana dal or bulgur on the dates checked.', '');
  L.push('**Cross-contact is not tracked.** Katori marks each food halal, check or not halal from its ingredients. It does not track shared slicers, grills, fryers or bread boards in cafés, bakeries and butchers. If that matters to you, ask.', '');

  L.push('## Where the numbers come from', '');
  L.push('- Ingredient values: USDA FoodData Central (SR Legacy and Foundation), IFCT 2017 (chana dal, wholemeal atta), and product labels read on ' + DATE + ' and 2026-10-14 (Open Food Facts entries checked against the Mercadona product page).');
  L.push('- Cooking yields: Bognár A. (2002), *Tables on weight yield of food and retention factors of food constituents*; water balances from USDA raw and cooked pairs; for roti and parathas, Zainab Rauf\'s moisture-based yields (Rasool et al. 2006, FNDDS, CoFID 2021).');
  L.push('- Recipes: at least two published recipes per prep, listed in each sheet; the desi dinners reuse the references Zainab Rauf collected for her home-style records.');
  L.push('- Storage: `RULES.mealPrep.storage` (NHS and UK FSA for rice; USDA FSIS for cooked meat, egg dishes and leftovers; Lab rules for salads, overnight oats and flatbreads).');
  L.push('- Prices: tienda.mercadona.es (Barcelona, postal code 08001) and carnehalalonline.com, read ' + DATE + ' and 2026-10-14. Prices change: the date is part of the number.');
  L.push('- Calculation: `node research/yusuf/fetch.mjs`, then `node research/yusuf/build.mjs`. This page, the recipe sheets, `app/data/foods-mealprep.js` and `app/data/recipes-mealprep.js` come from the same run.', '');
  return L.join('\n');
}

// ------------------------------------------------------------------ main
const sheets = await loadSheets();
const rows = sheets.map((s) => ({ s, r: compute(s) }));
for (const { s, r } of rows) fs.writeFileSync(path.join(here, 'recipes', `${s.id}.md`), sheetMd(s, r));
const header = `// Halal lunch-box library: each box as an ordinary food record with a "1 box" serving (Meeting 002).
// Owner: Yusuf Benali (Nutrition Lab). Reviewed by Dr. Ayesha Siddiqui (Sprint 1 review: research/review/sprint1.md).
// Record format: docs/NUTRITION.md §3 (group 'lunchbox', G22). Values per 100 g of the whole packed box as
// eaten, every pot included. GENERATED by research/yusuf/build.mjs from research/yusuf/recipes/*.mjs:
// edit the recipe definitions and rebuild, do not edit by hand. Recipe sheets: research/yusuf/recipes/<id>.md.

export default [
`;
fs.writeFileSync(path.join(root, 'app', 'data', 'foods-mealprep.js'), `${header}${serialize(rows.map(({ s, r }) => record(s, r)))}\n];\n`);
fs.writeFileSync(path.join(root, 'app', 'data', 'recipes-mealprep.js'), recipesFile(rows));
fs.writeFileSync(path.join(root, 'docs', 'MEALPREP.md'), libraryMd(rows));
fs.writeFileSync(path.join(here, 'out', 'missing-foods.json'), JSON.stringify(Object.fromEntries([...MISSING].map(([k, v]) => [k, { label: v.label, recipes: [...v.recipes].sort((a, b) => a - b) }])), null, 1) + '\n');
for (const { s, r } of rows) console.log(`R-MP-${s.n} ${s.id}: ${r.box.grams} g, ${r.box.kcal} kcal, ${r1(r.box.protein)} g P, ${r1(r.box.fiber)} g fibre, ${r.cost.partialMajor ? 'cost n/a' : `${r.cost.perBox.toFixed(2)} €`}`);
console.log(`\n${rows.length} sheets, app/data/foods-mealprep.js and docs/MEALPREP.md written.`);
void priceOf;
void DESI;
