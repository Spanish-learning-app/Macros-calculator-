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
const SLOT_WORD = { breakfast: 'breakfast', lunch: 'lunch', dinner: 'dinner', snacks: 'snack' };
const EFFORT_WORD = { cook: 'batch-cooked', assemble: 'no-cook assembly', ready: 'ready to eat' };
const timeText = (r) => (r.effort === 'cook' ? `${r.minutes} min hands-on` : `${r.minutes} min, no cooking`);

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
  const by = { butcher: [], desi: [], mercadona: [], bakery: [] };
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
  if (by.bakery.length) {
    out.push('', '**Bakery (forn de pa)**', '');
    for (const l of by.bakery) out.push(`- ${REG[l.ingId].label}: ${fmtG(l.grams)} g. Price: not looked up.`);
  }
  const mDates = [...new Set(by.mercadona.map((l) => l.price.date).filter(Boolean))].sort().join(' and ') || r.cost.mercadonaDate;
  out.push('', '**Mercadona** (online shop, Barcelona warehouse `bcn1`, prices read ' + mDates + ')', '', '| You need | Product | Pack | Buy | Pack price |', '|---|---|---|---|---|');
  for (const l of by.mercadona) {
    const p = l.price;
    const buy = REG[l.ingId].buy;
    const packs = buy.perUnitG ? Math.ceil(l.grams / buy.perUnitG) : Math.ceil(l.grams / p.packG - 1e-9);
    const unitWord = buy.perUnitG ? (l.ingId === 'egg' ? `${packs} eggs` : `${packs} pieces`) : `${packs} × pack`;
    out.push(`| ${REG[l.ingId].label.replace(/\s*\(.*$/, '')}: ${fmtG(l.grams)} g | [${p.name}](${p.url}) | ${packLabel(l.ingId, p)} | ${unitWord} | ${eur(p.packPrice)} |`);
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
  const hasMeat0 = r.shopping.some((l) => l.shop === 'butcher');
  const src = `Mercadona Barcelona online prices (warehouse bcn1) read ${mDates}${hasMeat0 ? `; halal-butcher prices from Carne Halal Online read ${c.otherDate}` : ''}. Pro-rata: the cost of what goes in the ${UNIT[r.serving].many}, not of whole packs.`;
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
  L.push(`**Meal:** ${SLOT_WORD[r.slot]} prep, logged as "1 ${u.one}". **Effort:** ${EFFORT_WORD[r.effort]} (\`effort: '${r.effort}'\`), ${timeText(r)} for the batch of ${r.boxes}.`, '');
  L.push(`## One ${u.one} at a glance`, '', `| ${u.one[0].toUpperCase() + u.one.slice(1)} weight | kcal | Protein | Carbs | Fat | Fibre |`, '|---|---|---|---|---|---|');
  L.push(`| ${b.grams} g (½ ${u.one} ${r.halfBoxG} g) | ${b.kcal} | ${r1(b.protein)} g | ${r1(b.carbs)} g | ${r1(b.fat)} g | ${r1(b.fiber)} g |`, '');
  L.push(`Targets (\`RULES.mealPrep.targetsBySlot.${r.slot}\`): ${T.kcal.min}–${T.kcal.max} kcal ${ok(r.targets.kcal)}; ${T.proteinG.min}–${T.proteinG.max} g protein ${ok(r.targets.protein)}; at least ${T.minFiberG} g fibre ${ok(r.targets.fiber)}.`, '');
  L.push('## References (at least 2 published recipes)', '');
  for (const ref of s.references) L.push(`- [${ref.title}](${ref.url}): ${ref.used}. *Read: ${ref.read}.*`);
  L.push('', r.effort === 'cook' ? `The standard recipe below triangulates these and then adjusts to the box targets (see "Changes"). No wine anywhere: lemon or water replaces it.` : `The assembly below starts from these and adjusts to the ${SLOT_WORD[r.slot]} targets (see "Changes"). Shop-bought parts are named by product so the label can be checked.`, '');
  L.push(`## Standard recipe: ${r.boxes} ${r.boxes === 1 ? u.one : u.many}, ${r.effort === 'cook' ? 'raw edible grams' : 'grams as bought and drained (edible part)'}`, '');
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
  const chill = r.effort === 'cook' ? 'Chill everything within 60 minutes of cooking (spread on a tray).' : 'Assemble with cold ingredients straight from the fridge and put the boxes back in the fridge at once.';
  L.push('', r.slot === 'lunch' || s.eat === 'cold' ? `${chill} Cold boxes travel in an insulated bag with an ice pack and are eaten within 2 hours of leaving the fridge (1 hour above 32 °C).` : `${chill} Reheat once only, until steaming hot right through (75 °C).`, '');
  L.push('## Eating and reheating', '', `**Eat ${EAT[s.eat]}.** ${s.reheat}`, '');
  L.push(`## Shopping list for ${r.boxes} ${r.boxes === 1 ? u.one : u.many}`, '', shopping(r), '');
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
  L.push('', '## Assumptions and confidence', '', `Confidence **${s.confidence}**: ${s.confidenceWhy} ${r.effort === 'cook' ? 'Macronutrients are 100% retained (NUTRITION.md §6 step 6); all oil is eaten; water that boils off is not counted.' : 'Weights are as bought (drained for jars and cans, edible part for fruit); all oil is eaten. Values from Lab records are the records the app shows for those foods.'}`, '');
  return L.join('\n');
}

// ------------------------------------------------------------------ records
const STATE = {
  lunch: (s, parts) => `${s.effort === 'assemble' ? 'assembled (no cooking)' : 'cooked'}, one packed lunch box as eaten, all pots included (${parts})`,
  breakfast: (s, parts) => `one prepared breakfast ${s.serving}${s.effort === 'assemble' ? ' (no cooking)' : ''} as eaten (${parts})`,
  dinner: (s, parts) => (s.effort === 'assemble' ? `assembled with little or no cooking, one dinner portion as eaten (${parts})` : `cooked, one freezer dinner portion as eaten (${parts})`),
  snacks: (s, parts) => `assembled (no cooking), one snack ${s.serving} as eaten (${parts})`,
};
const SLOTS = { lunch: ['lunch'], breakfast: ['breakfast'], dinner: ['dinner', 'lunch'], snacks: ['snacks', 'evening'] };
// Boss's note (2026-10-15, brief s3-variety): never roti with salan or curry at lunch. A dinner with roti, or one that is
// cooked on the night or needs a bowl of soup (`dinnerOnly` on the sheet), is offered at dinner only.
const slotsOf = (s, r) => (r.slot === 'dinner' && (/roti/.test(s.id) || s.dinnerOnly) ? ['dinner'] : SLOTS[r.slot]);
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
    ...(s.shortName ? { shortName: s.shortName } : {}),
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
    slots: slotsOf(s, r),
    // serve (Meeting 004, Mariam Review 2 #7): how a no-cook prep is eaten, shown on its row and Day entry.
    ...(s.effort === 'assemble' ? { serve: s.eat } : {}),
    halal: s.halal.reason ? { status: s.halal.status, reason: s.halal.reason } : { status: s.halal.status },
    source: {
      citation: `Recipe R-MP-${s.n}: ${s.names.en}, standard batch of ${r.boxes} ${r.boxes === 1 ? u.one : u.many} (research/yusuf/recipes/${s.id}.md)`,
      method: 'recipe',
      confidence: s.confidence,
      reviewer: 'yusuf',
      date: BUILT,
      notes:
        r.n > 40
          ? `Sprint 3 variety prep (${r.effort === 'assemble' ? 'no-cook, ' : ''}${r.minutes} min hands-on for ${r.boxes}; cuisine ${s.cuisine}). Labels, prices and table values read 2026-10-13 to 2026-10-15. 1 ${u.one} = ${r.box.grams} g = ${r.box.kcal} kcal, ${r1(r.box.protein)} g protein, ${r1(r.box.fiber)} g fibre. Eat ${EAT[s.eat]}; use-by ${r.fridgeDays} day${r.fridgeDays > 1 ? 's' : ''} in the fridge. Ingredients: USDA FDC SR Legacy, dated labels (Open Food Facts, checked against tienda.mercadona.es) and the Lab records of Javier Morales's base foods; yields: Bognár 2002 and USDA raw/cooked water balances. Computed by research/yusuf/calc.mjs.`
          : r.n > 25
          ? `No-cook prep (effort assemble, ${r.minutes} min for ${r.boxes}). Labels, prices and table values read 2026-10-14. 1 ${u.one} = ${r.box.grams} g = ${r.box.kcal} kcal, ${r1(r.box.protein)} g protein, ${r1(r.box.fiber)} g fibre. Eat ${EAT[s.eat]}; use-by ${r.fridgeDays} day${r.fridgeDays > 1 ? 's' : ''} in the fridge. Ingredient values from the Lab records for the market foods (Javier Morales, labels read 2026-10-14) and from research/yusuf/ingredients.json (USDA FDC SR Legacy, dated labels); weights as bought and drained, no cooking yield. Computed by research/yusuf/calc.mjs.`
          : `Labels, prices and table values read ${r.n > 12 ? '2026-10-13/14' : DATE}. 1 ${u.one} = ${r.box.grams} g = ${r.box.kcal} kcal, ${r1(r.box.protein)} g protein, ${r1(r.box.fiber)} g fibre. Eat ${EAT[s.eat]}; use-by ${r.fridgeDays} day${r.fridgeDays > 1 ? 's' : ''} in the fridge${r.fridgeDays === 1 ? ' (boxes 2–4 frozen)' : ''}. Ingredients: USDA FDC (SR Legacy/Foundation), dated labels (Open Food Facts, checked against tienda.mercadona.es), IFCT 2017; yields: Bognár 2002${r.n > 12 ? ", USDA water balances and Zainab Rauf's moisture-based roti and paratha yields" : ' and USDA water balances'}. USDA carbs by difference minus fibre. Computed by research/yusuf/calc.mjs.`,
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
  // Ayesha's review (14 Oct): link the records that match what the sheets calculate with.
  'beef-mince': { foodId: 'intl-beef-mince-lean-raw' },
  'chicken-thigh': { foodId: 'intl-chicken-thigh-raw' },
  'chicken-mince': { foodId: 'intl-chicken-mince-raw' },
  'beef-cubes': { foodId: 'intl-beef-cubes-raw' },
  garlic: { foodId: 'intl-garlic' },
  ginger: { foodId: 'intl-ginger' },
  'green-chilli': { foodId: 'intl-green-chilli' },
  'lemon-juice': { foodId: 'intl-lemon-juice' },
  coriander: { foodId: 'intl-coriander-fresh' },
  mint: { foodId: 'intl-mint-fresh' },
  parsley: { foodId: 'intl-parsley-fresh' },
  'spinach-frozen': { foodId: 'intl-spinach-frozen' },
  'yogurt-whole': { foodId: 'intl-dahi', name: 'Plain whole-milk yogurt (yogur natural)' },
  'yogurt-greek-light': { foodId: 'es-yogur-griego-ligero' }, // Javier's record, same Hacendado 2 % product
  // Sprint 2 add-on (14 Oct): Javier Morales's market records replace the name-only lines where the food is the
  // same product in the same state. The record numbers do not change: calc.mjs keeps its own dated values.
  'protein-yogurt': { foodId: 'es-yogur-proteinas-natural' },
  'milk-semi': { foodId: 'intl-milk-semi-skimmed' },
  'egg-white': { foodId: 'intl-egg-whites-liquid' },
  'rice-basmati': { foodId: 'intl-rice-basmati-dry' },
  'rice-brown': { foodId: 'intl-rice-brown-dry' },
  couscous: { foodId: 'med-couscous-dry' },
  bulgur: { foodId: 'med-bulgur-dry' },
  atta: { foodId: 'intl-atta-wholemeal' },
  'pasta-wholewheat': { foodId: 'intl-pasta-wholewheat-dry' },
  pita: { foodId: 'med-pita-bread' },
  breadcrumbs: { foodId: 'es-pan-rallado' },
  'chickpeas-jar': { foodId: 'es-garbanzos-cocidos' },
  'chana-dal': { foodId: 'intl-chana-dal-dry' },
  'lentils-red': { foodId: 'intl-masoor-dal-dry' },
  'tomato-crushed': { foodId: 'es-tomate-triturado' },
  'green-beans': { foodId: 'intl-green-beans-frozen' },
  peas: { foodId: 'intl-peas-frozen' },
  courgette: { foodId: 'intl-courgette' },
  'pepper-red': { foodId: 'intl-pepper-red' },
  'pepper-green': { foodId: 'intl-pepper-green' },
  spinach: { foodId: 'intl-spinach-raw' },
  chia: { foodId: 'intl-chia-seeds' },
  egg: { foodId: 'intl-egg-raw' },
  oats: { foodId: 'intl-oats-dry' },
  walnuts: { foodId: 'intl-walnuts' },
  banana: { foodId: 'intl-banana' },
  'oil-olive': { foodId: 'med-olive-oil' },
  'oil-sunflower': { foodId: 'intl-cooking-oil', name: 'Sunflower oil (aceite de girasol)' },
  onion: { foodId: 'intl-onion' },
  'onion-red': { foodId: 'intl-onion', name: 'Red onion (cebolla morada)' },
  tomato: { foodId: 'intl-tomato' },
  'tomato-cherry': { foodId: 'intl-tomato-cherry' }, // Javier's record (2026-10-15)
  cucumber: { foodId: 'intl-cucumber' },
  carrot: { foodId: 'intl-carrot' },
  lettuce: { foodId: 'intl-lettuce' },
  potato: { foodId: 'intl-potato-raw' },
  sugar: { foodId: 'intl-sugar' },
  hummus: { foodId: 'med-hummus' },
  tuna: { foodId: 'intl-tuna-canned-water' },
  // Sprint 3 (2026-10-15): Javier Morales's base foods for the variety preps.
  'bocadillo-bread': { foodId: 'es-pan-bocadillo' },
  'tomate-frito': { foodId: 'es-tomate-frito' },
  'mozzarella-light': { foodId: 'intl-mozzarella-fresh', name: 'Mozzarella fresca light (125 g ball)' },
  'rice-noodles': { foodId: 'intl-noodles-rice-dry' },
  'soy-sauce-halal': { foodId: 'intl-soy-sauce', name: 'Soy sauce with a halal logo' },
  'kidney-beans': { foodId: 'intl-kidney-beans-tinned' },
  sweetcorn: { foodId: 'intl-sweetcorn-tinned' },
  'broccoli-frozen': { foodId: 'intl-broccoli', name: 'Frozen broccoli (brócoli ultracongelado)' },
  mushrooms: { foodId: 'intl-mushrooms' },
  peanuts: { foodId: 'intl-peanuts' },
};
// Registry entries read from a Lab record (src 'db') map to that record.
for (const [k, e] of Object.entries(REG)) if (e.src === 'db' && !DB[k]) DB[k] = { foodId: e.foodId };
const FOOD_IDS = new Set(FOODS.map((f) => f.id));
for (const [k, m] of Object.entries(DB)) if (!FOOD_IDS.has(m.foodId)) throw new Error(`DB map ${k} → unknown food ${m.foodId}`);
const shortLabel = (ingId) => REG[ingId].label.replace(/\s*\((?![^)]*\b(?:contramuslo|pechuga|harina|masoor|lenteja|copos|espinaca|judía|guisante|leche|cebolla|pimiento|claras)\b)[^)]*\)/g, '').trim();
const NAME = {};
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
  return { foodId: s.id, boxes: r.boxes, storage, ingredients, effort: r.effort, minutes: r.minutes, ...(r.effort === 'assemble' ? { serve: s.eat } : {}), ...(s.cuisine ? { cuisine: s.cuisine } : {}) };
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
// yet (raw chicken thigh, chicken mince, beef cubes, garlic, ginger, herbs, lemon, spices): Ayesha owns the raw
// meats and spices. storage: one RULES.mealPrep.storage id per component; { id, pot: true } = a side pot packed
// apart; sealed packs, bread and whole fruit are not use-by items and are left out. effort: 'cook' (batch-cooked)
// or 'assemble' (15 min or less, little or no cooking); minutes = hands-on minutes for the batch (§13.1).
// serve (assemble preps only, Meeting 004): 'cold' | 'hot' | 'either', how the prep is eaten (hot = microwave).
// cuisine (Sprint 3, brief s3-variety): 'desi' | 'spanish' | 'mediterranean' | 'italian' | 'mexican' | 'asian' |
// 'middle-eastern' | 'international', for the Prep library's cuisine chips.

export default [
`;
  return `${header}${serialize(recs)}\n];\n`;
}

// ------------------------------------------------------------------ no-cook preps, ready picks, low-cook week
const FOOD = new Map(FOODS.map((f) => [f.id, f]));
const SNAP = '2026-10-14';
// One ready item: [foodId, servingId | grams, qty = 1] → grams and nutrients from the Lab record (what the app shows).
function readyLine([foodId, serving, qty = 1]) {
  const f = FOOD.get(foodId);
  if (!f) throw new Error(`ready pick: unknown food ${foodId}`);
  const sv = typeof serving === 'number' ? null : f.servings.find((x) => x.id === serving);
  if (typeof serving !== 'number' && !sv) throw new Error(`ready pick: ${foodId} has no serving ${serving}`);
  const grams = (sv ? sv.grams : serving) * qty;
  const n = Object.fromEntries(['kcal', 'protein', 'carbs', 'fat', 'fiber'].map((k) => [k, ((f.per100g[k] ?? 0) * grams) / 100]));
  const label = sv ? `${qty > 1 ? `${qty} × ` : ''}${sv.label}` : `${fmtG(grams)} g`;
  return { foodId, name: f.name, grams, label, halal: f.halal.status, ...n };
}
const sumLines = (lines) => lines.reduce((a, l) => ({ kcal: a.kcal + l.kcal, protein: a.protein + l.protein, fiber: a.fiber + l.fiber, grams: a.grams + l.grams }), { kcal: 0, protein: 0, fiber: 0, grams: 0 });

function noCookMd(list) {
  const L = [];
  L.push('## No-cook preps', '');
  L.push(`Fifteen minutes or less, little or no cooking: open, chop, mix, pack. Boiling eggs (10 minutes, hands off), a kettle for couscous and a microwave are the only heat used. Each one meets the same targets per meal as the cooked preps (\`RULES.mealPrep.targetsBySlot\`): breakfast ${TB.breakfast.kcal.min}–${TB.breakfast.kcal.max} kcal and ${TB.breakfast.proteinG.min}–${TB.breakfast.proteinG.max} g protein, lunch ${TB.lunch.kcal.min}–${TB.lunch.kcal.max} kcal and ${TB.lunch.proteinG.min}–${TB.lunch.proteinG.max} g, dinner ${TB.dinner.kcal.min}–${TB.dinner.kcal.max} kcal and ${TB.dinner.proteinG.min}–${TB.dinner.proteinG.max} g, snacks ${TB.snacks.kcal.min}–${TB.snacks.kcal.max} kcal and ${TB.snacks.proteinG.min}–${TB.snacks.proteinG.max} g, with the fibre minimums. The time is hands-on minutes for the whole batch.`, '');
  L.push('| # | Prep | Meal | Why you will like it | kcal | Protein | Fibre | Eat | Time | Keeps | Cost each | Halal |', '|---|---|---|---|---|---|---|---|---|---|---|---|');
  const order = { breakfast: 0, lunch: 1, dinner: 2, snacks: 3 };
  for (const { s, r } of [...list].sort((a, b) => order[a.r.slot] - order[b.r.slot] || a.s.n - b.s.n)) {
    const cost = r.cost.partialMajor ? 'not available' : `${r.cost.perBox.toFixed(2)} €`;
    const halal = s.halal.status === 'halal' ? 'halal' : `**${s.halal.status}**: ${s.halal.reason}`;
    L.push(`| ${s.n} | [${s.names.en}](../research/yusuf/recipes/${s.id}.md) (1 ${UNIT[r.serving].one}, ${r.box.grams} g) | ${SLOT_WORD[r.slot]} | ${s.pitch} | ${r.box.kcal} | ${r1(r.box.protein)} g | ${r1(r.box.fiber)} g | ${eatShort[s.eat]} | ${r.minutes} min for ${r.boxes} | ${s.keeps} | ${cost} | ${halal} |`);
  }
  L.push('');
  L.push('- **The lunch-box test.** Every lunch here travels: a closed box, nothing that leaks, good cold or with one item (a sealed rice cup or the box itself) in the microwave. Fish and eggs are never microwaved; sauces and dips go in a small pot; pitas are filled at lunch so they stay dry.');
  L.push('- **Sealed packs.** Microwave rice cups, cans and single Burgos tubs travel sealed inside the box. They keep to the date on the pack, so a box can be packed 2 days ahead without breaking the 1-day rule for cooked rice. Soaked couscous is cooked starch: that box is made the night before.');
  L.push('- **Eggs.** Boil 6–10 on Sunday or Tuesday night (10 minutes) and keep them in their shells: 3 days in the fridge. Most of these preps use them.');
  L.push('- **Feta is "check".** The feta at Mercadona lists *cuajo* (rennet) without saying its origin. The lentil salad has a halal twin: #40 is the same salad with a sealed tub of queso de Burgos 0% (*cuajo microbiano*) instead of feta, as its own record, so in the app you pick the Burgos one and it is halal. #29 (feta) stays for people who accept it.');
  L.push(`- **Bread.** Mercadona's own barras list E-472e with no origin (product pages read ${SNAP}). For pa amb tomàquet buy a barra at a *forn* made with flour, water, salt and yeast, or ask. The Mission pita (no E471) and Hacendado picos integrales (no lard) are fine.`, '');
  return L;
}

const READY = {
  breakfast: [
    { name: 'Protein yogurt, banana and almonds', items: [['es-yogur-proteinas-natural', 'pot', 2], ['intl-banana', 'medium'], ['intl-almonds', 'ten']], note: '2 pots of +Proteínas natural (milk and cultures only)' },
    { name: 'Queso fresco batido with kiwi and picos', items: [['es-queso-fresco-batido', 'large'], ['intl-kiwi', 'two'], ['es-picos-integrales', '30g']], note: '200 g of the 0% tub, eaten from a bowl' },
    { name: 'Two boiled eggs, a Burgos tub and a pear', items: [['intl-egg-boiled', 'egg', 2], ['es-queso-burgos-0', 'tub'], ['intl-pear', 'medium'], ['es-picos-integrales', '30g']], note: 'eggs boiled on Sunday' },
  ],
  lunch: [
    { name: 'Gazpacho, tuna, eggs and picos', items: [['es-gazpacho-envasado', 'brick'], ['intl-tuna-canned-water', 120], ['intl-egg-boiled', 'egg', 2], ['es-picos-integrales', '30g'], ['intl-apple', 'medium']], note: 'when the box ran out: 1 brick, 2 Mercadona cans (60 g drained each)' },
    { name: 'Lentils, rice cup and Burgos, no chopping', items: [['es-lentejas-cocidas', 'half-jar'], ['intl-rice-cup-brown', 'pot'], ['es-queso-burgos-0', 'two-tubs'], ['intl-orange', 'fruit']], note: 'half a jar of lentils, rinsed; olive oil and lemon if you have them' },
  ],
  dinner: [
    { name: 'Salmon, rice cup, guacamole and leaves', items: [['intl-salmon-canned', 'can', 2], ['intl-rice-cup-basmati', 'pot'], ['med-guacamole', 'pot'], ['intl-salad-leaves-mixed', 'bowl']], note: '2 cans of salmon al natural' },
    { name: 'Mackerel, chickpeas and tomato', items: [['intl-mackerel-olive-oil', 'can'], ['es-garbanzos-cocidos', 'half-jar'], ['intl-tomato', 'medium'], ['es-picos-integrales', '30g']], note: 'half a jar of chickpeas, rinsed' },
  ],
  snacks: [
    { name: '1 protein yogurt pot + 1 mandarin', items: [['es-yogur-proteinas-natural', 'pot'], ['intl-kinnow', 'medium']], note: 'merienda' },
    { name: '200 g queso fresco batido + 10 almonds', items: [['es-queso-fresco-batido', 'large'], ['intl-almonds', 'ten']], note: '' },
    { name: '2 Burgos 0% tubs + 1 apple', items: [['es-queso-burgos-0', 'two-tubs'], ['intl-apple', 'medium']], note: 'fruit + protein for merienda' },
    { name: '2 boiled eggs', items: [['intl-egg-boiled', 'egg', 2]], note: 'from the Sunday batch' },
    { name: '1 can of tuna + 15 g picos', items: [['intl-tuna-canned-water', 60], ['es-picos-integrales', '15g']], note: '1 Mercadona can, 60 g drained' },
    { name: 'Protein yogurt pot + ½ cup pomegranate', items: [['es-yogur-proteinas-natural', 'pot'], ['intl-pomegranate', 'half-cup']], note: 'fruit + protein for merienda' },
  ],
};
const READY_FRUIT = ['intl-banana', 'intl-apple', 'intl-pear', 'intl-kinnow', 'intl-orange', 'intl-kiwi', 'intl-pomegranate', 'intl-grapes', 'intl-figs', 'intl-melon', 'intl-pineapple', 'intl-blueberries'];

function readyMd() {
  const L = [];
  L.push('## Ready-to-eat picks', '');
  L.push(`Buy and eat, no prep. Every item is a normal food in the app (search it and tap "+"); the numbers are the Lab records' own values for the serving named. All halal; prices and shelves checked at Mercadona Barcelona on ${SNAP}.`, '');
  const T = (slot, title) => {
    L.push(`**${title}**`, '', '| Pick | What to log | kcal | Protein | Fibre |', '|---|---|---|---|---|');
    for (const p of READY[slot]) {
      const lines = p.items.map(readyLine);
      const t = sumLines(lines);
      L.push(`| ${p.name}${p.note ? ` (${p.note})` : ''} | ${lines.map((l) => `${l.name}: ${l.label}`).join('; ')} | ${r0(t.kcal)} | ${r1(t.protein)} g | ${r1(t.fiber)} g |`);
    }
    L.push('');
  };
  T('breakfast', 'Breakfast (no jar ready)');
  T('lunch', 'Lunch (the box ran out)');
  T('dinner', 'Dinner (too tired to cook)');
  T('snacks', 'Snacks and merienda: protein under 200 kcal, or fruit + protein');
  const fr = READY_FRUIT.map((id) => FOOD.get(id)).filter(Boolean).map((f) => {
    const d = f.servings.find((x) => x.default) ?? f.servings[0];
    return `${f.name} (${d.label}, ${r0((f.per100g.kcal * d.grams) / 100)} kcal)`;
  });
  L.push(`**Fruit on the Mercadona shelf on ${SNAP}:** ${fr.join(' · ')}. Pair any fruit with a protein pot, a Burgos tub or 2 eggs for a merienda with 12–25 g protein. Cut-fruit tubs (pineapple, melon) are fine but cost about twice as much per kilo as whole fruit.`, '');
  L.push('**Read the label** of anything else: *gelatina* (in flavoured yogurts and desserts), *E471/E472* without "de origen vegetal" (wraps, sliced bread, bakery barras), *jamón* toppings on salmorejo and salads. The halal-only filter in the app stays on by default.', '');
  return L;
}

// ------------------------------------------------------------------ the low-cook weeks
// One Sunday cook + assemblies + ready items, Monday to Friday. A prep entry = [foodId] (1 serving); a ready
// entry = { r: [foodId, serving, qty], buy: research ingredient id for the shopping list }.
// Batch fields: make = jars, boxes or portions made; scale = a 'cook' prep whose only cooking is boiling eggs,
// mixed for the boxes needed (bought pro-rata like an assembly); minutes = hands-on override for that smaller
// batch; from 'freezer' = a portion cooked on an earlier Sunday (not bought this week, costed pro-rata).
const R = (foodId, serving, qty = 1, buy) => ({ r: [foodId, serving, qty], buy });
const WEEK_SNAP = '2026-10-15'; // both weeks priced on one new snapshot (Sprint 3 variety, 2026-10-15)
const WEEKS = {
  // v3 (Sprint 3, the Boss's variety note): lunches mix a bowl, pasta, a sandwich and a salad; no desi lunch and no
  // lentil-tuna salad; desi food stays at dinner (the karahi from the freezer). Fish lunches never three in a row.
  v3: {
    batches: [
      { id: 'es-pollo-patatas-pimientos-horno-portion', when: 'Sunday', make: 4, note: 'Mon–Wed dinners (cooked meat keeps 3 days); the 4th portion goes in the freezer for next week' },
      { id: 'intl-chicken-burrito-bowl-box', when: 'Sunday', make: 2, scale: true, minutes: 15, note: 'Mon, Tue lunches: half the 4-box recipe (1 pack of 2 rice cups)' },
      { id: 'intl-beef-bolognese-pasta-box', when: 'Sunday', make: 4, note: 'the sauce: 1 portion in the fridge for Wednesday, 3 in the freezer for the next weeks; boil the penne on Tuesday night (8 min)' },
      { id: 'es-queso-batido-parfait-jar', when: 'Sunday', make: 3, note: 'Mon–Wed breakfasts' },
      { id: 'es-bocadillo-atun-huevo-box', when: 'Wednesday night', make: 1, note: 'Thursday lunch: half the recipe (boil the egg while you mix)' },
      { id: 'intl-banana-oat-smoothie-jar', when: 'Wednesday night', make: 1, note: 'Thursday breakfast' },
      { id: 'intl-chicken-caesar-salad-box', when: 'Thursday night', make: 1, scale: true, minutes: 15, note: 'Friday lunch: half the recipe' },
      { id: 'intl-banana-oat-smoothie-jar', when: 'Thursday night', make: 1, note: 'Friday breakfast' },
      { id: 'es-crema-verduras-huevo-garbanzos-portion', when: 'Thursday', make: 1, note: 'dinner: half the brik and half the chickpea jar (the rest makes Saturday\'s dinner)' },
      { id: 'pk-chicken-karahi-roti-portion', when: 'Friday morning', make: 1, from: 'freezer', note: 'move 1 portion (with its 2 roti) from the freezer to the fridge for Friday dinner; cooked on an earlier Sunday' },
    ],
    days: [
      { day: 'Monday', breakfast: 'es-queso-batido-parfait-jar', lunch: 'intl-chicken-burrito-bowl-box', dinner: 'es-pollo-patatas-pimientos-horno-portion', ready: [R('es-yogur-proteinas-natural', 'pot', 1, 'protein-yogurt'), R('intl-banana', 'medium', 1, 'banana'), R('intl-kinnow', 'medium', 1, 'mandarin'), R('intl-almonds', 'ten', 1, 'almonds')] },
      { day: 'Tuesday', breakfast: 'es-queso-batido-parfait-jar', lunch: 'intl-chicken-burrito-bowl-box', dinner: 'es-pollo-patatas-pimientos-horno-portion', ready: [R('es-queso-burgos-0', 'tub', 1, 'burgos-0'), R('intl-apple', 'medium', 1, 'apple'), R('intl-almonds', 'ten', 1, 'almonds'), R('es-picos-integrales', '30g', 1, 'picos')] },
      { day: 'Wednesday', breakfast: 'es-queso-batido-parfait-jar', lunch: 'intl-beef-bolognese-pasta-box', dinner: 'es-pollo-patatas-pimientos-horno-portion', ready: [R('es-yogur-proteinas-natural', 'pot', 1, 'protein-yogurt'), R('intl-pear', 'medium', 1, 'pear'), R('intl-almonds', 'ten', 1, 'almonds')] },
      { day: 'Thursday', breakfast: 'intl-banana-oat-smoothie-jar', lunch: 'es-bocadillo-atun-huevo-box', dinner: 'es-crema-verduras-huevo-garbanzos-portion', ready: [R('intl-kinnow', 'medium', 1, 'mandarin'), R('es-queso-burgos-0', 'tub', 1, 'burgos-0')] },
      { day: 'Friday', breakfast: 'intl-banana-oat-smoothie-jar', lunch: 'intl-chicken-caesar-salad-box', dinner: 'pk-chicken-karahi-roti-portion', ready: [R('intl-apple', 'medium', 1, 'apple'), R('es-yogur-proteinas-natural', 'pot', 1, 'protein-yogurt'), R('intl-almonds', 'ten', 1, 'almonds')] },
    ],
  },
  // Budget v2 (Sprint 3): 60 € or less at the till, about 110–130 g protein, all halal, and the same lunch mix:
  // pasta, sandwiches, a bowl and a salad; one fish lunch; desi at dinner (chana masala).
  budget: {
    buy: { egg: { id: 31540, units: 6 } }, // the box of 6 large eggs, not 12
    batches: [
      { id: 'intl-tuna-tomato-pasta-box', when: 'Sunday', make: 2, scale: true, minutes: 15, note: 'Mon lunch and 1 box in the freezer for next week: half the recipe' },
      { id: 'intl-chicken-spinach-pasta-bake-portion', when: 'Sunday', make: 4, note: 'Mon dinner (fridge, pasta keeps 1 day); 3 in the freezer: Wednesday\'s dinner and 2 for next week' },
      { id: 'med-shakshuka-garbanzos-portion', when: 'Sunday', make: 2, scale: true, minutes: 15, note: 'the sauce for Tue and Thu dinners (half the recipe); 2 eggs cracked in on the night' },
      { id: 'intl-overnight-oats-protein-jar', when: 'Sunday', make: 3, note: 'Mon–Wed breakfasts' },
      { id: 'es-bocadillo-pollo-piquillo-box', when: 'Monday night', make: 2, note: 'Tue, Wed lunches' },
      { id: 'med-lentil-rice-burgos-bowl-box', when: 'Wednesday night', make: 1, note: 'Thursday lunch (half the recipe: the other half jar of lentils goes into Friday\'s caesar or a salad)' },
      { id: 'med-menemen-portion', when: 'Wednesday night', make: 2, note: 'Thu breakfast that night\'s pan, Fri reheated' },
      { id: 'intl-chicken-caesar-salad-box', when: 'Thursday night', make: 1, scale: true, minutes: 15, note: 'Friday lunch: half the recipe' },
      { id: 'pk-microwave-chana-masala-portion', when: 'Friday', make: 2, note: 'dinner; the second portion goes in the freezer' },
    ],
    days: [
      { day: 'Monday', breakfast: 'intl-overnight-oats-protein-jar', lunch: 'intl-tuna-tomato-pasta-box', dinner: 'intl-chicken-spinach-pasta-bake-portion', ready: [R('intl-banana', 'medium', 1, 'banana'), R('intl-apple', 'medium', 1, 'apple')] },
      { day: 'Tuesday', breakfast: 'intl-overnight-oats-protein-jar', lunch: 'es-bocadillo-pollo-piquillo-box', dinner: 'med-shakshuka-garbanzos-portion', ready: [R('intl-banana', 'medium', 1, 'banana'), R('intl-apple', 'medium', 1, 'apple')] },
      { day: 'Wednesday', breakfast: 'intl-overnight-oats-protein-jar', lunch: 'es-bocadillo-pollo-piquillo-box', dinner: 'intl-chicken-spinach-pasta-bake-portion', ready: [R('intl-banana', 'medium', 1, 'banana'), R('intl-kinnow', 'medium', 1, 'mandarin')] },
      { day: 'Thursday', breakfast: 'med-menemen-portion', lunch: 'med-lentil-rice-burgos-bowl-box', dinner: 'med-shakshuka-garbanzos-portion', ready: [R('intl-banana', 'medium', 1, 'banana'), R('es-yogur-proteinas-natural', 'pot', 1, 'protein-yogurt')] },
      { day: 'Friday', breakfast: 'med-menemen-portion', lunch: 'intl-chicken-caesar-salad-box', dinner: 'pk-microwave-chana-masala-portion', ready: [R('intl-banana', 'medium', 1, 'banana'), R('intl-apple', 'medium', 1, 'apple')] },
    ],
  },
};
const PANTRY = new Set(['salt', 'black-pepper', 'cumin', 'paprika', 'turmeric', 'chilli-powder', 'cinnamon', 'oregano', 'bay-leaf', 'garam-masala', 'chaat-masala', 'coriander-seed', 'oil-olive', 'oil-sunflower', 'sugar']);
// Javier's pack label (Meeting 004 `pack`) for a Mercadona line, when his record is the same pack we price.
function packLabel(ingId, pr, units = REG[ingId].buy?.units) {
  const m = DB[ingId];
  const f = m && FOOD.get(m.foodId);
  if (!f?.pack || !pr.packG) return pr.pack;
  if (units) return f.pack.label.startsWith(`${units} `) ? f.pack.label : pr.pack;
  if (Math.abs(f.pack.grams - pr.packG) / pr.packG < 0.05) return f.pack.label;
  return pr.pack;
}

// Totals, shopping and money for one week; md = the page text.
function planWeek(rows, W) {
  const byId = new Map(rows.map((x) => [x.s.id, x]));
  const prep = (id) => {
    const x = byId.get(id);
    if (!x) throw new Error(`week: unknown prep ${id}`);
    return x;
  };
  const res = { batches: [], totals: [], mins: { Sunday: 0, other: 0 } };
  for (const b of W.batches) {
    const { s, r } = prep(b.id);
    const m = b.from ? 0 : (b.minutes ?? r.minutes);
    res.batches.push({ b, s, r, m });
    if (b.when === 'Sunday') res.mins.Sunday += m;
    else res.mins.other += m;
  }
  for (const d of W.days) {
    const meals = ['breakfast', 'lunch', 'dinner'].map((k) => prep(d[k]));
    const ready = d.ready.map((x) => readyLine(x.r));
    for (const l of ready) if (l.halal !== 'halal') throw new Error(`week: ready item ${l.foodId} is ${l.halal}`);
    for (const { s } of meals) if (s.halal.status !== 'halal') throw new Error(`week: prep ${s.id} is ${s.halal.status}`);
    const sum = (k) => meals.reduce((a, m) => a + m.r.box[k], 0) + ready.reduce((a, l) => a + l[k], 0);
    res.totals.push({ day: d.day, kcal: sum('kcal'), protein: sum('protein'), fiber: sum('fiber'), mealProtein: meals.reduce((a, m) => a + m.r.box.protein, 0), readyProtein: ready.reduce((a, l) => a + l.protein, 0), readyKcal: ready.reduce((a, l) => a + l.kcal, 0), meals, ready });
  }
  // ---- shopping list: the batches + the ready items, priced on one date
  const need = new Map(); // ingId → grams
  const add = (ingId, g) => need.set(ingId, (need.get(ingId) ?? 0) + g);
  let freezer = 0;
  for (const { b, r } of res.batches) {
    const f = r.effort === 'cook' && !b.scale && !b.from ? 1 : b.make / r.boxes;
    for (const c of r.components)
      for (const l of c.lines) {
        if (l.ingId === 'water') continue;
        if (b.from) {
          const pr = priceOf(l.ingId, { snap: WEEK_SNAP });
          if (pr.eurPerG != null) freezer += l.grams * f * pr.eurPerG;
        } else add(l.ingId, l.grams * f);
      }
  }
  for (const d of W.days) for (const x of d.ready) add(x.buy, readyLine(x.r).grams);
  // Loose produce: price the week from single pieces, not the 2–3 kg bags the sheets use.
  const WEEK_BUY = { tomato: { id: 69912 }, potato: { id: 69066 }, ...W.buy };
  const merged = new Map(); // Mercadona product → one line (raw and boiled eggs are the same box of eggs)
  for (const [ingId, g] of need) {
    const bu = REG[ingId].buy;
    if (bu?.shop !== 'mercadona' || PANTRY.has(ingId)) continue;
    const key = String(WEEK_BUY[ingId]?.id ?? bu.id);
    const m = merged.get(key);
    if (m) {
      need.set(m, need.get(m) + g);
      need.delete(ingId);
    } else merged.set(key, ingId);
  }
  const groups = { butcher: [], mercadona: [], pantry: [], other: [] };
  let till = 0;
  let eaten = 0;
  const unpriced = [];
  for (const [ingId, g] of [...need].sort((a, b) => REG[a[0]].label.localeCompare(REG[b[0]].label))) {
    const pr = priceOf(ingId, { snap: WEEK_SNAP, id: WEEK_BUY[ingId]?.id, units: WEEK_BUY[ingId]?.units });
    const buy = REG[ingId].buy ?? {};
    const pro = pr.eurPerG != null ? g * pr.eurPerG : null;
    if (pro != null) eaten += pro;
    if (PANTRY.has(ingId)) {
      groups.pantry.push({ ingId, g, pro, pr });
      continue;
    }
    if (pr.shop === 'butcher') {
      groups.butcher.push({ ingId, g, pro, pr });
      if (pro != null) till += pro;
      continue;
    }
    if (pr.shop !== 'mercadona' || pr.eurPerG == null) {
      groups.other.push({ ingId, g, pr });
      unpriced.push(ingId);
      continue;
    }
    const packs = Math.max(1, Math.ceil(g / pr.packG - 1e-9));
    const cost = packs * pr.packPrice;
    till += cost;
    groups.mercadona.push({ ingId, g, packs, cost, pr, units: WEEK_BUY[ingId]?.units ?? buy.units, unit: buy.perUnitG ? (ingId.startsWith('egg') ? 'eggs' : 'pieces') : null });
  }
  const pantry = groups.pantry.reduce((a, x) => a + (x.pro ?? 0), 0);
  Object.assign(res, { groups, till, eaten: eaten + freezer, freezer, pantry, unpriced });
  return res;
}

function weekDaysMd(L, P) {
  L.push('**When to make what**', '', '| When | Make | Hands-on | Gives you |', '|---|---|---|---|');
  for (const { b, s, r, m } of P.batches) {
    const u = UNIT[r.serving];
    L.push(`| ${b.when} | [${s.names.en}](../research/yusuf/recipes/${s.id}.md): ${b.make} ${b.make === 1 ? u.one : u.many}${b.from ? ' from the freezer' : ''} | ${b.from ? '—' : `${m} min${r.effort === 'cook' && !b.scale ? ' (cook)' : ''}`} | ${b.note} |`);
  }
  L.push('', `Sunday: **${P.mins.Sunday} minutes** hands-on. The rest of the week: **${P.mins.other} minutes** in all, spread over the weekday evenings.`, '');
  L.push('**The days** (kcal / protein for each meal; ready items are bought and eaten as they are)', '', '| Day | Breakfast | Lunch | Dinner | Ready (merienda, snacks, with dinner) | Day total |', '|---|---|---|---|---|---|');
  for (const t of P.totals) {
    const cell = ({ s, r }) => `${s.names.en} (${r.box.kcal} / ${r0(r.box.protein)} g)`;
    L.push(`| ${t.day} | ${cell(t.meals[0])} | ${cell(t.meals[1])} | ${cell(t.meals[2])} | ${t.ready.map((l) => `${l.name.replace(/\s*\(.*\)$/, '').replace(/,.*$/, '')} ${l.label.replace(/\s*\(.*\)$/, '')}`).join('; ')} (${r0(t.readyKcal)} / ${r0(t.readyProtein)} g) | **${r0(t.kcal)} kcal, ${r0(t.protein)} g protein**, ${r0(t.fiber)} g fibre |`);
  }
  const avg = (k) => P.totals.reduce((a, t) => a + t[k], 0) / P.totals.length;
  const rng = (k) => `${r0(Math.min(...P.totals.map((t) => t[k])))}–${r0(Math.max(...P.totals.map((t) => t[k])))}`;
  L.push('', `**Week:** ${rng('kcal')} kcal a day (average ${r0(avg('kcal'))}), ${rng('protein')} g protein (average ${r0(avg('protein'))}), ${rng('fiber')} g fibre. Meals are the Lab records (1 jar, box or portion); ready items are the records for the serving named. Coffee, tea and extra fruit are on top: log them as you go.`, '');
  return { avg, rng };
}

function weekShopMd(L, P) {
  L.push(`**Mercadona shopping list** (Barcelona online shop, warehouse bcn1, prices read ${WEEK_SNAP}; you buy whole packs)`, '', '| You need | Product | Buy | Price |', '|---|---|---|---|');
  for (const x of P.groups.mercadona) {
    const bu = REG[x.ingId].buy;
    const n = x.unit ? Math.ceil(x.g / bu.perUnitG) : x.packs;
    const word = (k, one, many) => `${k} ${k === 1 ? one : many}`;
    const pl = packLabel(x.ingId, x.pr, x.units);
    // Javier's labels that count items ("12 eggs", "2 × 125 g cups") read as "1 pack of …".
    const packText = /^\d+ (×|(?!(?:g|kg|ml|l)\b)[a-z])/.test(pl) ? `${word(x.packs, 'pack', 'packs')} of ${pl}` : `${x.packs} × ${pl}`;
    const buyText = x.unit
      ? (x.units ?? 1) > 1
        ? `${pl === x.pr.pack ? `${word(x.packs, 'pack', 'packs')} of ${x.units}${x.unit === 'eggs' ? ' eggs' : ''}` : packText} (uses ${word(n, x.unit === 'eggs' ? 'egg' : 'piece', x.unit)})`
        : word(n, 'piece', 'pieces')
      : packText;
    L.push(`| ${shortLabel(x.ingId)}: ${fmtG(Math.round(x.g))} g | [${x.pr.name}](${x.pr.url}) | ${buyText} | ${eur(x.cost)} |`);
  }
  L.push('');
  if (P.groups.butcher.length) {
    L.push('**Halal butcher**', '');
    for (const x of P.groups.butcher) L.push(`- ${x.pr.name}: ${fmtG(Math.round(x.g))} g, ${x.pr.eurPerKg.toFixed(2)} €/kg at [Carne Halal Online](${x.pr.url}) (read ${x.pr.date}) = ${eur(x.pro)}.`);
    L.push('');
  }
  L.push(`**Cupboard** (most kitchens have these; counted only for what the week uses): ${P.groups.pantry.map((x) => `${shortLabel(x.ingId).toLowerCase()} ${fmtG(Math.round(x.g))} g`).join(', ')}.${P.groups.other.length ? ` Not priced (desi shelf or bakery): ${P.groups.other.map((x) => shortLabel(x.ingId).toLowerCase()).join(', ')}.` : ''}`, '');
}

// The cuisine of each lunch and dinner in a week, for the variety line under the days table.
const mix = (P, k) => P.totals.map((t) => { const x = t.meals[k]; return `${t.day.slice(0, 3)} ${x.s.cuisine}`; }).join(', ');

function weekMd(rows) {
  const P = planWeek(rows, WEEKS.v3);
  const L = [];
  L.push('## A low-cook week', '');
  L.push(`One Sunday cook of about ${P.mins.Sunday} minutes, a few 5–15-minute jobs on weekday evenings, and ready food for the merienda. Monday to Friday, breakfast, lunch and dinner. All halal. Targets for the day: 2,000–2,200 kcal and 120–140 g protein (a PhD student who walks and trains a little; set your own in the app).`, '');
  L.push('**Version 3** (Sprint 3, the Boss\'s note "don\'t be limited, there should be a variety"): the lunches are now a burrito bowl (Mon, Tue), a beef bolognese pasta (Wed), a tuna and egg bocadillo (Thu) and a chicken caesar salad (Fri). No desi lunch and no lentil-tuna salad; desi food stays at dinner (Friday\'s karahi with roti from the freezer). Breakfasts: the queso batido parfait, then a banana-oat smoothie jar.', '');
  const { avg } = weekDaysMd(L, P);
  L.push(`**Variety:** lunches ${mix(P, 1)}; dinners ${mix(P, 2)}.`, '');
  const meal = P.totals.map((t) => t.mealProtein);
  const readyP = avg('readyProtein');
  L.push(`**A lower protein target.** This week is planned for 120–140 g protein. If your target is lower, like Mariam's 96 g (1.6 g per kg at 60 kg), eat smaller portions or fewer add-ons, not different meals: the three preps alone give ${r0(Math.min(...meal))}–${r0(Math.max(...meal))} g a day, and the ready items add about ${r0(readyP)} g. Leave out the protein add-ons (the protein yogurt pots and Burgos tubs) and keep the fruit and almonds, or take the ½ box or ½ portion serving of one meal and fill up with fruit or bread. Set your own target in the app and the day bar shows where you are.`, '');
  weekShopMd(L, P);
  L.push(`**Approximate cost:** about **${eur(P.till)}** at the till for the week (whole packs at Mercadona on ${WEEK_SNAP}, a new price snapshot; halal chicken and beef mince at Carne Halal Online read 2026-10-13). About **${eur(P.eaten - P.freezer)}** of it is the food that goes into this week's batches and ready items (pro-rata, cupboard included), and that includes the 3 bolognese sauce portions and the tray-bake portion left in the freezer for the next weeks. The karahi portion from the freezer was bought on an earlier week: about **${eur(P.freezer)}** of food (pro-rata, same price dates). With it, the week eats about **${eur(P.eaten)}**, **${eur(P.eaten / 5)} a day** for three meals and the merienda, freezer stock included; the rest of the till money stays in the cupboard and fridge (oats, picos, spices, eggs, most of the yogurt and cheese packs). Prices change: the date is part of the number.`, '');
  WEEK_RESULT.v3 = { snap: WEEK_SNAP, totals: P.totals.map(({ day, kcal, protein, fiber, meals }) => ({ day, kcal, protein, fiber, breakfast: meals[0].s.id, lunch: meals[1].s.id, dinner: meals[2].s.id, lunchCuisine: meals[1].s.cuisine, dinnerCuisine: meals[2].s.cuisine })), sundayMinutes: P.mins.Sunday, weekdayMinutes: P.mins.other, till: P.till, eaten: P.eaten, freezer: P.freezer, unpriced: P.unpriced };
  return L;
}

function budgetWeekMd(rows) {
  const P = planWeek(rows, WEEKS.budget);
  const L = [];
  L.push('## A budget low-cook week', '');
  L.push(`The same idea for **60 € or less at the till**: one Sunday cook, short jobs on weekday evenings, and cheap staples (pasta, jarred chickpeas and lentils, tomato, eggs, oats, bananas). Monday to Friday, breakfast, lunch and dinner, about 110–130 g protein a day. All halal: chicken from the halal butcher, mozzarella with microbial coagulant, no cheese with unstated rennet.`, '');
  L.push('**Version 2** (Sprint 3, the Boss\'s variety note): lunches are a tuna-tomato pasta (Mon), a chicken and piquillo bocadillo (Tue, Wed), a lentil and brown-rice bowl (Thu) and a chicken caesar salad (Fri): one fish lunch, no lentil-tuna salad, no desi lunch. Dinners: chicken pasta bake, chickpea shakshuka and a microwave chana masala (desi) on Friday. Breakfasts: overnight oats, then menemen.', '');
  weekDaysMd(L, P);
  L.push(`**Variety:** lunches ${mix(P, 1)}; dinners ${mix(P, 2)}.`, '');
  weekShopMd(L, P);
  L.push(`**Cost:** **${eur(P.till)} at the till** (${eur(P.till / 5)} a day), whole packs at Mercadona on ${WEEK_SNAP} (a new price snapshot) and halal chicken at Carne Halal Online read 2026-10-13. The food eaten this week is about **${eur(P.eaten)}** (${eur(P.eaten / 5)} a day, pro-rata, cupboard included, with the pasta-bake, tuna-pasta and chana masala portions left in the freezer). The till total leaves out the cupboard (oil, salt and spices: about ${eur(P.pantry)} of them go into the week)${P.unpriced.length ? ` and ${P.unpriced.map((i) => shortLabel(i).toLowerCase().replace(/, raw$/, '')).join(', ')} from the desi shop (a few grams, not priced)` : ''}. What is left over stays in the cupboard and fridge for next week (oats, pasta, picos, eggs, most of the spices). Prices change: the date is part of the number.`, '');
  WEEK_RESULT.budget = { snap: WEEK_SNAP, totals: P.totals.map(({ day, kcal, protein, fiber, meals }) => ({ day, kcal, protein, fiber, breakfast: meals[0].s.id, lunch: meals[1].s.id, dinner: meals[2].s.id, lunchCuisine: meals[1].s.cuisine, dinnerCuisine: meals[2].s.cuisine })), sundayMinutes: P.mins.Sunday, weekdayMinutes: P.mins.other, till: P.till, eaten: P.eaten, tillPerDay: P.till / 5, eatenPerDay: P.eaten / 5, unpriced: P.unpriced };
  return L;
}
const WEEK_RESULT = {};

// ------------------------------------------------------------------ library page
function libraryMd(rows) {
  const L = [];
  const by = (slot) => rows.filter(({ r }) => r.slot === slot && r.effort === 'cook');
  const noCook = rows.filter(({ r }) => r.effort !== 'cook');
  const stor = (id) => {
    const x = ST.get(id);
    return `${x.fridgeDays} day${x.fridgeDays > 1 ? 's' : ''} in the fridge, ${x.freezable ? `${x.freezerMonths} month${x.freezerMonths > 1 ? 's' : ''} frozen` : 'do not freeze'}`;
  };
  const table = (list) => {
    const u = UNIT[list[0].r.serving] ?? UNIT.portion;
    L.push(`| # | Prep | Why you will like it | kcal | Protein | Fibre | Eat | Hands-on | Keeps | Cost per ${list[0].r.slot === 'breakfast' ? 'jar or portion' : u.one} |`, '|---|---|---|---|---|---|---|---|---|---|');
    for (const { s, r } of list) {
      const cost = r.cost.partialMajor ? 'not available' : `${r.cost.perBox.toFixed(2)} €`;
      L.push(`| ${s.n} | [${s.names.en}](../research/yusuf/recipes/${s.id}.md) (1 ${UNIT[r.serving].one}, ${r.box.grams} g) | ${s.pitch} | ${r.box.kcal} | ${r1(r.box.protein)} g | ${r1(r.box.fiber)} g | ${eatShort[s.eat]} | ${r.minutes} min for ${r.boxes} | ${s.keeps} | ${cost} |`);
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
  const nCook = rows.length - noCook.length;
  L.push(`**Owner:** Yusuf Benali (Nutrition Lab) · **Reviewed by:** Dr. Ayesha Siddiqui (lunch boxes reviewed in Sprint 1; breakfast, dinner and no-cook preps pending) · **Prices and labels read:** ${DATE} (lunch), 2026-10-14 (breakfast and dinner additions, no-cook preps, ready picks and the low-cook week)`, '');
  L.push(`${rows.length} halal preps in three tiers. **${nCook} to batch-cook** on Sunday: **${nB} breakfasts**, **${nL} lunch boxes** to carry to university and **${nD} freezer dinners** to eat at home. **${noCook.length} no-cook preps** you assemble in 15 minutes or less from market food. And a list of **ready-to-eat picks** that need nothing at all. In the app, search for the prep and log **"1 jar"**, **"1 box"** or **"1 portion"** (or the ½ serving). The Prep library filter *All · Cook · No-cook* uses the same tiers.`, '');
  L.push('Every number comes from a standard recipe calculation (NUTRITION.md §6). Each recipe sheet shows the ingredients in grams, the published recipes it starts from, the yields, storage per component, a shopping list and a dated cost.', '');
  L.push('**Contents:** [Breakfast](#breakfast-preps) · [Lunch boxes](#lunch-boxes) · [Dinner](#freezer-dinners) · [No-cook preps](#no-cook-preps) · [Ready to eat](#ready-to-eat-picks) · [Low-cook week](#a-low-cook-week) · [Budget week](#a-budget-low-cook-week) · [Roti and paratha stock](#roti-and-paratha-stock) · [Storage](#storage-at-a-glance) · [A Sunday that works](#a-sunday-that-works) · [How to batch in the app](#how-to-batch-in-the-app) · [Halal shopping in Barcelona](#halal-shopping-in-barcelona) · [Where the numbers come from](#where-the-numbers-come-from)', '');

  L.push('## Breakfast preps', '');
  L.push(`Each one has ${TBk('breakfast')}, and takes 0–2 minutes in the morning. None uses protein powder: the protein comes from eggs, egg whites and a high-protein yogurt (milk and cultures only).`, '');
  table(by('breakfast'));
  L.push(`All of these freeze: egg muffins, pancakes and the egg rolls ${stor('egg-muffin')}; parathas and roti ${stor('cooked-flatbread')}. The overnight oats jar needs no cooking at all, so it is listed with the [no-cook preps](#no-cook-preps): it does not freeze and keeps 3 days, so make 3 jars on Sunday night and 2 more on Wednesday.`, '');

  L.push('## Lunch boxes', '');
  L.push(`Each one makes **4 boxes** with ${TBk('lunch')}. Five are hot boxes for the microwave, three work hot or cold, and four are cold-only for days when the microwave queue is long.`, '');
  table(by('lunch'));
  L.push('"Cost per box" is the pro-rata cost at Mercadona Barcelona and an online halal butcher; "not available" means we could not find a current price for a main ingredient (boneless halal chicken thigh, chana dal, bulgur or masoor dal), and the sheet shows the part we could price.', '');

  L.push('## Freezer dinners', '');
  L.push(`Eaten at home, so desi curries with roti are welcome. Each portion has ${TBk('dinner')}. The six desi dinners start from Zainab Rauf's home-style standard recipes (research/zainab/), made a little lighter in oil, and each portion includes **2 wholemeal roti** from the roti stock. The Catalan *mandonguilles* come with their own potatoes.`, '');
  table(by('dinner'));
  L.push(`Curries and kebabs keep ${stor('cooked-meat')}; daal ${stor('cooked-curry')}; roti ${stor('cooked-flatbread')}. A frozen portion with its roti is best within 2 months. Raita and kachumber are side pots made fresh (they keep 2 days and cannot be frozen).`, '');
  L.push(...noCookMd(noCook), ...readyMd(), ...weekMd(rows), ...budgetWeekMd(rows));

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
  L.push('Everything happens in the **Prep** tab.', '');
  L.push('1. **Cook a batch.** Under *Library*, tap a prep (grouped by breakfast, lunch and dinner), set the day you cooked it and how many jars, boxes or portions it made (standard: 3 or 4). The app puts the first ones in the fridge, as many as the fridge life allows, and the rest in the freezer; change any of them.');
  L.push('2. **Your boxes.** The batch card lists each box with its use-by: "last day" on the day, "past use-by, best not to eat" after it. Moving a frozen box to the fridge starts its 1-day clock.');
  L.push('3. **Place into a slot.** Pick the meal (Breakfast, Lunch, Dinner…) and tap the days you will eat it, one tap per day. The day\'s totals count it at once; ticking it eaten uses the box, deleting the entry frees it.');
  L.push('4. **Shopping list.** On the batch card, *Shopping list* → *Copy list*: halal butcher first, then the supermarket. Every ingredient is a food in the database except the ground spices and salt, which appear by name.', '');
  L.push('Your own pots work the same way: *New recipe* in the Prep tab, then cook a batch of it.', '');
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
  L.push('- Cheese: some people avoid cheese made with animal rennet (*cuajo animal*). Labels that say *cuajo microbiano* or *coagulante vegetal* avoid the question. Mercadona\'s queso de Burgos 0% says *cuajo microbiano* and its queso fresco batido has no rennet at all (both halal); its feta does not say (check), so #29 is marked check and #40 is its Burgos twin.', '');
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
for (const { s, r } of rows) console.log(`R-MP-${s.n} ${s.id}: ${r.effort} ${r.minutes} min, ${r.box.grams} g, ${r.box.kcal} kcal, ${r1(r.box.protein)} g P, ${r1(r.box.fiber)} g fibre, ${r.cost.partialMajor ? 'cost n/a' : `${r.cost.perBox.toFixed(2)} €`}`);
for (const [k, w] of Object.entries(WEEK_RESULT)) {
  for (const t of w.totals) console.log(`${k} ${t.day}: ${Math.round(t.kcal)} kcal, ${r1(t.protein)} g P, ${r1(t.fiber)} g fibre`);
  console.log(`${k} cost: till ${w.till.toFixed(2)} €, eaten ${w.eaten.toFixed(2)} € (${(w.eaten / 5).toFixed(2)} €/day)${w.freezer ? `, freezer ${w.freezer.toFixed(2)} €` : ''}, unpriced ${w.unpriced.join(', ') || 'none'}`);
}
fs.writeFileSync(path.join(here, 'out', 'low-cook-week.json'), JSON.stringify(WEEK_RESULT, null, 1) + '\n');
console.log(`\n${rows.length} sheets, app/data/foods-mealprep.js and docs/MEALPREP.md written.`);
void priceOf;
void DESI;
