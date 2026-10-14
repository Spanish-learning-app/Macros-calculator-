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

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', '..');
const ING = JSON.parse(fs.readFileSync(path.join(here, 'ingredients.json'), 'utf8'));
const RULES = (await import(pathToFileURL(path.join(root, 'app', 'data', 'rules.js')).href)).default;
const usda = JSON.parse(fs.readFileSync(path.join(root, 'research', 'cache', 'usda', 'index.json'), 'utf8'));
const cofid = JSON.parse(fs.readFileSync(path.join(root, 'research', 'cache', 'cofid', 'proximates.json'), 'utf8'));
const DATE = '2026-10-13'; // date the labels, prices and table values were read
const BUILT = new Date().toISOString().slice(0, 10);
const ST = new Map(RULES.mealPrep.storage.map((s) => [s.id, s]));
const T = RULES.mealPrep.targetsBySlot?.lunch ?? RULES.mealPrep.boxTargets;

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
  out.push('', '**Mercadona** (online shop, Barcelona warehouse `bcn1`, prices read ' + r.cost.mercadonaDate + ')', '', '| You need | Product | Pack | Buy | Pack price |', '|---|---|---|---|---|');
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
  const src = `Mercadona Barcelona online prices (warehouse bcn1) read ${c.mercadonaDate}; halal-butcher prices from Carne Halal Online read ${c.otherDate}. Pro-rata: the cost of what goes in the boxes, not of whole packs.`;
  const hasMeat = r.shopping.some((l) => l.shop === 'butcher');
  const xc = hasMeat ? ` Halal-meat price cross-check: ${BUTCHER.crossCheck}.` : '';
  if (c.partialMajor) {
    return `**Indicative cost per box: not available.** No current price was found for ${missing.join(', ')}. The priced part comes to ${eur(c.perBox)} per box (${eur(c.batch)} for the batch). ${src}${xc}`;
  }
  return `**Indicative cost per box: ${eur(c.perBox)}** (${eur(c.batch)} for 4 boxes). ${src}${xc}${missing.length ? ` Not included (no price found, small amounts): ${missing.join(', ')}.` : ''}`;
}

// ------------------------------------------------------------------ recipe sheet
function sheetMd(s, r) {
  const L = [];
  const p = r.per100g;
  const b = r.box;
  const ok = (v) => (v ? 'met' : '**missed**');
  L.push(`# R-MP-${s.n} · ${s.names.en}`, '');
  L.push(`Record \`${s.id}\` in \`app/data/foods-mealprep.js\` · library page: [docs/MEALPREP.md](../../../docs/MEALPREP.md) · numbers from \`node research/yusuf/calc.mjs ${s.n}\` (definition: \`${s.file}\`). Generated by \`research/yusuf/build.mjs\` on ${BUILT} (labels, prices and table values read ${DATE}); edit the \`.mjs\`, not this file.`, '');
  L.push('| Language | Name |', '|---|---|', `| English | ${s.names.en} |`, `| Español | ${s.names.es} |`, `| Català | ${s.names.ca} |`);
  if (s.names.ur) L.push(`| اردو | ${s.names.ur} |`);
  if (s.names.roman) L.push(`| Roman Urdu | ${s.names.roman} |`);
  L.push('', `**Eat:** ${EAT[s.eat]}. **Halal:** ${s.halal.status}${s.halal.reason ? `: ${s.halal.reason}` : ''} **Confidence:** ${s.confidence}.`, '');
  L.push('## One box at a glance', '', '| Box weight | kcal | Protein | Carbs | Fat | Fibre |', '|---|---|---|---|---|---|');
  L.push(`| ${b.grams} g (½ box ${r.halfBoxG} g) | ${b.kcal} | ${r1(b.protein)} g | ${r1(b.carbs)} g | ${r1(b.fat)} g | ${r1(b.fiber)} g |`, '');
  L.push(`Targets (\`RULES.mealPrep.targetsBySlot.lunch\`): ${T.kcal.min}–${T.kcal.max} kcal ${ok(r.targets.kcal)}; ${T.proteinG.min}–${T.proteinG.max} g protein ${ok(r.targets.protein)}; at least ${T.minFiberG} g fibre ${ok(r.targets.fiber)}.`, '');
  L.push('## References (at least 2 published recipes)', '');
  for (const ref of s.references) L.push(`- [${ref.title}](${ref.url}): ${ref.used}. *Read: ${ref.read}.*`);
  L.push('', `The standard recipe below triangulates these and then adjusts to the box targets (see "Changes"). No wine anywhere: lemon or water replaces it.`, '');
  L.push('## Standard recipe: 4 boxes, raw edible grams', '');
  for (const c of r.components) {
    L.push(`### ${c.label}`, '', '| Ingredient | Raw g (4 boxes) | Per box | Notes |', '|---|---|---|---|');
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
  L.push('## Added fat', '', `${oilG} g of oil for the batch (${r1(oilG / r.boxes)} g per box), all assumed eaten. That is ${r1(r.addedFatPer100g)} g per 100 g as eaten (\`addedFatPer100g\`). Oil is weighed, not poured: 1 tbsp of oil = 13.6 g (\`RULES.referenceWeightsG\`).`, '');
  L.push('## Yield and box weight', '', '| Component | Raw g | Cooked g | Per box g | Storage |', '|---|---|---|---|---|');
  for (const c of r.components) L.push(`| ${c.label} | ${c.rawG} | ${c.cookedG} | **${c.boxG}** | ${storageRow(c.storage).cls} |`);
  L.push(`| **Batch** | ${r.rawG} | ${r.cookedG} | **${b.grams}** (½ box ${r.halfBoxG}) | |`, '');
  L.push(`Overall yield ${r.yield} (cooked ÷ raw, absorbed water included). Yield factors used:`, '');
  const used = [...new Set(r.components.flatMap((c) => c.lines.map((l) => l.yieldKey)))];
  for (const k of used) L.push(`- ×${YIELDS[k].f} (\`${k}\`): ${YIELDS[k].src}.`);
  L.push('');
  L.push('## Per 100 g as eaten (the food record)', '', '| kcal | Protein | Carbs (available) | Fat | Fibre | Sugars | Sat fat | Sodium | Added fat |', '|---|---|---|---|---|---|---|---|---|');
  L.push(`| ${p.kcal} | ${r1(p.protein)} g | ${r1(p.carbs)} g | ${r1(p.fat)} g | ${r1(p.fiber)} g | ${p.sugars == null ? '—' : `${r1(p.sugars)} g`} | ${p.satFat == null ? '—' : `${r1(p.satFat)} g`} | ${p.sodium == null ? '—' : `${p.sodium} mg`} | ${r1(r.addedFatPer100g)} g |`, '');
  L.push(`Per 100 g = batch totals ÷ ${r.cookedG} g × 100, with every pot of the box included (NUTRITION.md §6). Sugars, saturated fat and sodium are given only when the ingredients that lack them carry under 10% of the total; spice-blend sodium (black salt in chaat masala) is not counted.`, '');
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
  L.push('## Storage (per component, `RULES.mealPrep.storage`)', '', '| Component | Per box | Class | Fridge (≤ 5 °C) | Freezer |', '|---|---|---|---|---|');
  for (const c of r.components) {
    const sr = storageRow(c.storage);
    L.push(`| ${c.label} | ${c.boxG} g | ${sr.cls} | ${sr.fridge} | ${sr.freezer} |`);
  }
  L.push('', `Use-by of a packed box = cooked date + the shortest fridge life in it = **${r.fridgeDays} day${r.fridgeDays > 1 ? 's' : ''}**. A frozen box has no use-by until it is moved to the fridge (then 1 day).`, '');
  L.push(s.storagePlan, '');
  for (const c of r.components) if (PROPOSED_STORAGE[c.storage]) L.push(`- ${PROPOSED_STORAGE[c.storage].label}: ${PROPOSED_STORAGE[c.storage].note}`);
  L.push('', 'Chill everything within 60 minutes of cooking (spread on a tray). Cold boxes travel in an insulated bag with an ice pack and are eaten within 2 hours of leaving the fridge (1 hour above 32 °C).', '');
  L.push('## Eating and reheating', '', `**Eat ${EAT[s.eat]}.** ${s.reheat}`, '');
  L.push('## Shopping list for 4 boxes', '', shopping(r), '');
  L.push('## Cost per box', '', costText(r), '');
  L.push('## Changes made to meet the box targets', '');
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
function record(s, r) {
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
    state: `cooked, one packed lunch box as eaten, all pots included (${parts})`,
    per100g,
    addedFatPer100g: +r1(r.addedFatPer100g),
    servings: [
      { id: 'box', label: '1 box', grams: r.box.grams, default: true },
      { id: 'half-box', label: '½ box', grams: r.halfBoxG },
    ],
    tags: s.tags,
    slots: ['lunch'],
    halal: s.halal.reason ? { status: s.halal.status, reason: s.halal.reason } : { status: s.halal.status },
    source: {
      citation: `Recipe R-MP-${s.n}: ${s.names.en}, standard batch of 4 boxes (research/yusuf/recipes/${s.id}.md)`,
      method: 'recipe',
      confidence: s.confidence,
      reviewer: 'yusuf',
      date: BUILT,
      notes: `Labels, prices and table values read ${DATE}. 1 box = ${r.box.grams} g = ${r.box.kcal} kcal, ${r1(r.box.protein)} g protein, ${r1(r.box.fiber)} g fibre. Eat ${EAT[s.eat]}; use-by ${r.fridgeDays} day${r.fridgeDays > 1 ? 's' : ''} in the fridge${r.fridgeDays === 1 ? ' (boxes 2–4 frozen)' : ''}. Ingredients: USDA FDC (SR Legacy/Foundation), dated labels (Open Food Facts, checked against tienda.mercadona.es), IFCT 2017; yields: Bognár 2002 and USDA water balances. USDA carbs by difference minus fibre. Computed by research/yusuf/calc.mjs.`,
    },
  };
  return rec;
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

// ------------------------------------------------------------------ library page
function libraryMd(rows) {
  const L = [];
  L.push('# Halal lunch-box library', '');
  L.push('**Owner:** Yusuf Benali (Nutrition Lab) · **Reviewed by:** Dr. Ayesha Siddiqui (pending) · **Prices and labels read:** ' + DATE, '');
  L.push('Twelve halal lunch boxes you can batch-cook on Sunday and carry to university. Each one makes **4 boxes**, has 35–50 g of protein, 550–750 kcal and at least 8 g of fibre. In the app, search for the box and log **"1 box"** (or "½ box").', '');
  L.push('Five are hot boxes for the microwave, three work hot or cold, and four are cold-only for days when the microwave queue is long. Meat comes from a halal butcher; everything else is on the Mercadona list in each recipe.', '');
  L.push('Every number comes from a standard recipe calculation (NUTRITION.md §6). Each recipe sheet shows the ingredients in grams, the sources, the yields, storage per component, a shopping list and a cost per box.', '');
  L.push('## The boxes', '');
  L.push('| # | Box | Why you will like it | kcal | Protein | Fibre | Eat | Keeps | Cost per box |', '|---|---|---|---|---|---|---|---|---|');
  for (const { s, r } of rows) {
    const keeps = s.keeps;
    const cost = r.cost.partialMajor ? 'not available' : `${r.cost.perBox.toFixed(2)} €`;
    L.push(`| ${s.n} | [${s.names.en}](../research/yusuf/recipes/${s.id}.md) | ${s.pitch} | ${r.box.kcal} | ${r1(r.box.protein)} g | ${r1(r.box.fiber)} g | ${eatShort[s.eat]} | ${keeps} | ${cost} |`);
  }
  L.push('', 'Spanish and Catalan names, plus the Urdu names, are in each recipe sheet and in the app\'s search. "Cost per box" is the pro-rata cost at Mercadona Barcelona and an online halal butcher on ' + DATE + '; "not available" means we could not find a current price for a main ingredient (boneless halal chicken thigh, chana dal or bulgur), and the sheet shows the part we could price.', '');
  L.push('## A Sunday that works', '');
  L.push('- **Pick two boxes a week**, one hot and one cold, so Thursday is not the same as Monday.');
  L.push('- **Rice, pasta, couscous and bulgur keep 1 day in the fridge.** In a rice or couscous batch, box 1 goes in the fridge and boxes 2–4 go in the freezer. Move tomorrow\'s box to the fridge the night before.');
  L.push('- **Cooked chicken, meat and kebabs keep 3 days**, tortilla 3 days (do not freeze it), and cut salads, raita and yogurt pots 2 days. Salad boxes are mixed twice: Sunday for Monday and Tuesday, Tuesday night for Wednesday and Thursday.');
  L.push('- **Cool fast:** spread food on a tray and get it in the fridge within an hour.');
  L.push('- **Reheat once,** until steaming hot right through (75 °C). Raita, yogurt and salad travel in their own pot and are never microwaved. No fish or egg boxes go in the microwave.');
  L.push('- **Cold boxes** travel in an insulated bag with an ice pack. Eat them within 2 hours of leaving the fridge (1 hour on a day above 32 °C).');
  L.push('- In the app, a box\'s use-by is the cooked date plus the shortest fridge life in it. A frozen box has no use-by until you move it to the fridge.', '');
  L.push('## Halal shopping in Barcelona', '');
  L.push('**Meat:** buy chicken and beef from a halal butcher (*carnicería halal*): there are several in the Raval, Sant Antoni and Poble Sec, and online halal butchers deliver in the province. Supermarket chicken and *caldo de pollo* (stock) are not halal unless the pack carries a halal certification seal.', '');
  L.push('**Labels:** read the ingredients, not the front of the pack.', '');
  L.push('- *Manteca* or *manteca de cerdo* is lard. *Mantequilla* is butter (fine). *Manteca de cacao* is cocoa butter (fine).');
  L.push('- *Gelatina* is usually pork gelatine unless it says *bovina halal* or *vegetal*. Check yogurts, desserts, sweets and "light" dairy.');
  L.push('- *E471* and *E472* (mono- and diglycerides) can come from animal fat. Accept them only when the label says *de origen vegetal*. On ' + DATE + ' every wheat wrap at Mercadona Barcelona listed E471 with no origin, which is why the shami box uses Mission pita (no E471). Hacendado hummus marks its additives as *de origen vegetal*.');
  L.push('- *Sebo* is tallow. *Jamón, chorizo, fuet, sobrasada, panceta, butifarra* are pork. *Sin cerdo* ("no pork") is not the same as halal.');
  L.push('- Wine hides in sauces, stocks and stews (*al vino*, *con vino blanco*, *jerez*, *coñac*). These recipes use lemon or water instead.');
  L.push('- Cheese: some people avoid cheese made with animal rennet (*cuajo animal*). Labels that say *cuajo microbiano* or *coagulante vegetal* avoid the question. None of the 12 lunch boxes uses cheese.', '');
  L.push('**Bakeries and cafés:** a croissant *de mantequilla* is made with butter. Cheap pastries and some *bollería* are made with lard, and an *ensaïmada* is made with pork lard (*saïm*) by definition. When in doubt, ask "¿lleva manteca de cerdo?" (Catalan: "porta saïm?"). *Pa amb tomàquet* and *café con leche* are fine; most bocadillos are pork, so pick *tortilla* or *atún*.', '');
  L.push('**Cross-contact is not tracked.** Katori marks each food halal, check or not halal from its ingredients. It does not track shared slicers, grills, fryers or bread boards in cafés, bakeries and butchers. If that matters to you, ask.', '');
  const TB = RULES.mealPrep.targetsBySlot;
  const stor = (id) => {
    const x = ST.get(id);
    return x ? `\`${id}\`: ${x.fridgeDays} day${x.fridgeDays > 1 ? 's' : ''} in the fridge, ${x.freezable ? `${x.freezerMonths} month${x.freezerMonths > 1 ? 's' : ''} frozen` : 'no freezing'}` : `\`${id}\``;
  };
  L.push('## Planned for Sprint 2: breakfast and dinner preps', '');
  L.push(`The Boss asked for meal prep at every meal, not just lunch (${DATE}). Sprint 2 adds two more sets, built exactly like the lunch boxes: a standard batch recipe from at least two published recipes, per-portion macros, storage per component, a shopping list and a dated cost. They ship in the same \`lunchbox\` group, which \`rules.js\` now uses for prepared portions at any meal: the default serving is "1 box", "1 jar" or "1 portion" (\`RULES.mealPrep.prepServingIds\`), and the first slot in \`slots\` sets the energy band.`, '');
  L.push(`**Breakfast: 5–6 preps** (design target ${TB.breakfast.kcal.min}–${TB.breakfast.kcal.max} kcal, ${TB.breakfast.proteinG.min}–${TB.breakfast.proteinG.max} g protein, at least ${TB.breakfast.minFiberG} g fibre; eaten cold or reheated in 1–2 minutes):`, '');
  L.push(`1. Overnight oats with skyr-style protein yogurt or whey, fruit and nuts: "1 jar"; ${stor('overnight-oats')}.`);
  L.push(`2. Egg-and-vegetable muffins (whole eggs and egg whites, peppers, spinach): "1 portion" of 3 muffins; ${stor('egg-muffin')}.`);
  L.push('3. Chia pudding with milk and protein yogurt: "1 jar"; same storage as overnight oats.');
  L.push('4. Protein pancakes (oats, eggs, skyr) to freeze and toast: "1 portion".');
  L.push(`5. Freezer aloo parathas and anda-paratha rolls: "1 portion"; ${stor('cooked-flatbread')}, reheated on the tawa.`);
  L.push('6. Halal breakfast wraps (egg, halal chicken or turkey, vegetables): "1 portion". The wrap must be one without animal E471 (see the label notes above), or a pita.', '');
  L.push(`**Dinner: 6–8 preps** (design target ${TB.dinner.kcal.min}–${TB.dinner.kcal.max} kcal, ${TB.dinner.proteinG.min}–${TB.dinner.proteinG.max} g protein, at least ${TB.dinner.minFiberG} g fibre). These are eaten at home, so daal and gravies are welcome. Built with Zainab Rauf (Pakistani cuisine researcher), starting from her home-style standard recipes, and portioned for the freezer:`, '');
  L.push(`1. Chicken karahi, frozen flat in "1 portion" bags; ${stor('cooked-meat')}.`);
  L.push('2. Keema (plain or matar) in portions.');
  L.push('3. Chicken jalfrezi.');
  L.push('4. Aloo gosht with halal beef or mutton.');
  L.push(`5. Daal (masoor or chana) in portions; ${stor('cooked-curry')}.`);
  L.push('6. Seekh and shami kebabs, frozen cooked, to reheat or grill on the night.');
  L.push(`7. Roti and paratha stock, frozen between sheets of baking paper; ${stor('cooked-flatbread')}.`);
  L.push('8. One Catalan dinner: halal-beef *mandonguilles amb pèsols* (meatballs with peas).', '');
  L.push('For each one, Sprint 2 gives: portions per batch, "1 portion" macros, freezer life, how to reheat from frozen, and one weekly shopping list across breakfast, lunch and dinner.', '');
  L.push('## Where the numbers come from', '');
  L.push('- Ingredient values: USDA FoodData Central (SR Legacy and Foundation), IFCT 2017 (chana dal), and product labels read on ' + DATE + ' (Open Food Facts entries checked against the Mercadona product page).');
  L.push('- Cooking yields: Bognár A. (2002), *Tables on weight yield of food and retention factors of food constituents*, and water balances from USDA raw and cooked pairs.');
  L.push('- Storage: `RULES.mealPrep.storage` (NHS and UK FSA for rice; USDA FSIS for cooked meat and egg dishes; a conservative Lab rule for salads).');
  L.push('- Prices: tienda.mercadona.es (Barcelona, postal code 08001) and carnehalalonline.com, both read ' + DATE + '. Prices change: the date is part of the number.');
  L.push('- Calculation: `node research/yusuf/fetch.mjs`, then `node research/yusuf/build.mjs`. This page, the 12 recipe sheets and `app/data/foods-mealprep.js` are generated from the same run.', '');
  return L.join('\n');
}

// ------------------------------------------------------------------ main
const sheets = await loadSheets();
const rows = sheets.map((s) => ({ s, r: compute(s) }));
for (const { s, r } of rows) fs.writeFileSync(path.join(here, 'recipes', `${s.id}.md`), sheetMd(s, r));
const header = `// Halal lunch-box library: each box as an ordinary food record with a "1 box" serving (Meeting 002).
// Owner: Yusuf Benali (Nutrition Lab). Reviewed by Dr. Ayesha Siddiqui (pending: reviewer is 'yusuf').
// Record format: docs/NUTRITION.md §3 (group 'lunchbox', G22). Values per 100 g of the whole packed box as
// eaten, every pot included. GENERATED by research/yusuf/build.mjs from research/yusuf/recipes/*.mjs:
// edit the recipe definitions and rebuild, do not edit by hand. Recipe sheets: research/yusuf/recipes/<id>.md.

export default [
`;
fs.writeFileSync(path.join(root, 'app', 'data', 'foods-mealprep.js'), `${header}${serialize(rows.map(({ s, r }) => record(s, r)))}\n];\n`);
fs.writeFileSync(path.join(root, 'docs', 'MEALPREP.md'), libraryMd(rows));
for (const { s, r } of rows) console.log(`R-MP-${s.n} ${s.id}: ${r.box.grams} g, ${r.box.kcal} kcal, ${r1(r.box.protein)} g P, ${r1(r.box.fiber)} g fibre, ${r.cost.partialMajor ? 'cost n/a' : `${r.cost.perBox.toFixed(2)} €`}`);
console.log(`\n${rows.length} sheets, app/data/foods-mealprep.js and docs/MEALPREP.md written.`);
void priceOf;
void DESI;
