#!/usr/bin/env node
// Build Zainab's food data files from the record specs + recipe sheets, and write one recipe file
// (Markdown) per recipe-based record.
//
//   node research/zainab/fetch-ingredients.mjs     # after editing ingredients.mjs
//   node research/zainab/build.mjs                 # writes app/data/foods-pk-{home,restaurant,breads-rice,drinks-sweets}.js
//                                                  # and research/zainab/recipes/<record id>.md
//   node research/check-foods.mjs app/data/foods-pk-*.js
//
// Record specs: research/zainab/records/<file>.mjs. Each spec is a record in the NUTRITION.md §3 shape
// minus per100g / addedFatPer100g / source.citation / source.method, which come from:
//   recipe: '<sheet id>'                 → standard recipe (research/zainab/recipes/*.mjs, calc.mjs)
//   direct: { src, code }                → one table entry (src: fdc | cofid | ifct | fndds | label)
//   blend:  { parts: [[recordId|sheetId, grams], …], note }   → weighted mix of computed records
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { compute, loadSheets } from './calc.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(here, '..', '..');
const ING = JSON.parse(fs.readFileSync(path.join(here, 'ingredients.json'), 'utf8'));
const TODAY = '2026-10-14';
const FILES = {
  home: { out: 'app/data/foods-pk-home.js', title: 'Pakistani home cooking.' },
  restaurant: { out: 'app/data/foods-pk-restaurant.js', title: 'Pakistani restaurant, dhaba and street food.' },
  'breads-rice': { out: 'app/data/foods-pk-breads-rice.js', title: 'Breads and rice.' },
  'drinks-sweets': { out: 'app/data/foods-pk-drinks-sweets.js', title: 'Desi drinks (chai, lassi, sharbat) and sweets.' },
};

// ---------------------------------------------------------------- lookups
function lookup(src, code) {
  if (src === 'fdc' || src === 'ifct' || src === 'label') {
    const hit = Object.values(ING).find((v) => v.src === src && String(v.code) === String(code));
    if (hit) return hit;
  }
  if (src === 'cofid') {
    const c = JSON.parse(execFileSync(process.execPath, [path.join(here, 'cofid.mjs'), 'get', code], { encoding: 'utf8' }).trim());
    return { citation: `CoFID 2021 ${code}`, name: c.name, kcal: c.kcal, protein: c.protein, carbs: c.carbs, fat: c.fat, fiber: c.fiber ?? 0, sugars: c.sugars, water: c.water, fiberBasis: c.fiberBasis };
  }
  if (src === 'fndds') {
    const c = JSON.parse(execFileSync(process.execPath, [path.join(here, 'fndds.mjs'), 'get', String(code)], { encoding: 'utf8' }).trim());
    return { citation: `USDA FDC FNDDS ${code}`, name: c.description, kcal: c.kcal, protein: c.protein, carbs: c.carbs, fat: c.fat, fiber: c.fiber ?? 0, sugars: c.sugars, satFat: c.satFat, sodiumMg: c.sodiumMg, water: c.water };
  }
  if (src === 'fdc') {
    const idx = JSON.parse(fs.readFileSync(path.join(ROOT, 'research', 'cache', 'usda', 'index.json'), 'utf8'));
    const f = idx.find((x) => x.fdcId === Number(code));
    const n = f.n;
    return { citation: `USDA FDC SR Legacy ${code}`, name: f.description, kcal: n.kcal, protein: n.protein, carbs: Math.max(0, (n.carbsDiff ?? 0) - (n.fiber ?? 0)), fat: n.fat, fiber: n.fiber ?? 0, sugars: n.sugars ?? null, satFat: n.satFat ?? null, sodiumMg: n.sodiumMg ?? null };
  }
  throw new Error(`lookup ${src} ${code}`);
}
const r1 = (x) => Math.round(x * 10) / 10;

// ---------------------------------------------------------------- serving helpers (NUTRITION.md §5)
export const KATORI_ML = { 'katori-small': 155, katori: 200, 'katori-large': 360, tbsp: 15, cup: 200, mug: 250, glass: 250, tsp: 5 };
const KATORI_UR = { 'katori-small': 'چھوٹی کٹوری', katori: 'کٹوری', 'katori-large': 'بڑی کٹوری', tbsp: 'بڑا چمچ' };
export function katoriSet(density, { suffix = '', defaultId = 'katori' } = {}) {
  const lab = {
    'katori-small': `1 small katori (155 ml)${suffix}`,
    katori: `1 katori (medium, 200 ml)${suffix}`,
    'katori-large': `1 large katori (360 ml)${suffix}`,
    tbsp: '1 tablespoon (chamach)',
  };
  return ['katori-small', 'katori', 'katori-large', 'tbsp'].map((id) => ({
    id,
    label: lab[id],
    labelUr: KATORI_UR[id],
    grams: id === 'tbsp' ? r1(KATORI_ML[id] * density) : Math.round(KATORI_ML[id] * density),
    ...(id === defaultId ? { default: true } : {}),
  }));
}

// ---------------------------------------------------------------- serialise as a JS object literal
const IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
function lit(v, ind = '') {
  const pad = ind + '  ';
  if (Array.isArray(v)) {
    if (!v.length) return '[]';
    const simple = v.every((x) => typeof x !== 'object' || x === null);
    const one = '[' + v.map((x) => lit(x, pad)).join(', ') + ']';
    if (simple && one.length < 90) return one;
    return '[\n' + v.map((x) => pad + lit(x, pad)).join(',\n') + ',\n' + ind + ']';
  }
  if (v && typeof v === 'object') {
    const ents = Object.entries(v).filter(([, x]) => x !== undefined);
    const one = '{ ' + ents.map(([k, x]) => `${IDENT.test(k) ? k : JSON.stringify(k)}: ${lit(x, pad)}`).join(', ') + ' }';
    if (one.length < 100 && !one.includes('\n')) return one;
    return '{\n' + ents.map(([k, x]) => `${pad}${IDENT.test(k) ? k : JSON.stringify(k)}: ${lit(x, pad)}`).join(',\n') + ',\n' + ind + '}';
  }
  if (typeof v === 'string') return `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  return JSON.stringify(v);
}

// ---------------------------------------------------------------- recipe markdown
function recipeMd(spec, sheet, res, cross) {
  const L = [];
  const p = res.per100g;
  L.push(`# ${spec.name} — recipe R-${spec.id}`, '');
  L.push(`Record id: \`${spec.id}\` · sheet: \`${sheet.file}\` (sheet id \`${sheet.id}\`) · generated by \`research/zainab/build.mjs\` on ${TODAY}. Calculator: \`research/zainab/calc.mjs\` (EuroFIR recipe method, NUTRITION.md §6).`, '');
  L.push('## References', '');
  for (const s of sheet.sources || []) L.push(`- **${s.ref}** — ${s.url}  \n  ${s.used}`);
  L.push('', '## Ingredients (standard recipe, raw)', '');
  L.push('| Ingredient | As bought | In pot (edible g) | Source | kcal | P | C | F | Fibre | Basis |', '|---|---|---|---|---|---|---|---|---|---|');
  for (const l of res.lines) {
    const ing = ING[l.id];
    const f = l.grams / 100;
    const c = (k) => (ing.perMl ? (ing[k] * l.qty) / 100 : ing[k] * f);
    L.push(`| ${ing.label} | ${l.qty} ${l.unit} | ${l.grams} | ${ing.citation.replace(/\|/g, '/')} | ${Math.round(c('kcal'))} | ${r1(c('protein'))} | ${r1(c('carbs'))} | ${r1(c('fat'))} | ${r1(c('fiber'))} | ${l.note} |`);
  }
  L.push('', `**Raw total (edible, incl. added water):** ${res.rawG} g${res.removedG ? ` (plus ${res.removedG} g bone/peel removed: not eaten, not counted)` : ''}.`, '');
  L.push('## Added fat', '', `${sheet.fatBasis || 'See ingredient lines marked as cooking fat.'}`, '', `Added fat in the served dish: **${res.addedFatPer100g} g per 100 g** (${(sheet.addedFat || []).join(', ') || 'none'}).`, '');
  L.push('## Yield', '');
  const ck = sheet.cooking;
  if (ck.method === 'steps') {
    L.push('Water balance (NUTRITION.md §6 step 5, "a stated water balance"), with the Lab conventions in `research/zainab/conventions.mjs`:', '');
    for (const d of res.cookingDetail || []) L.push(`- ${d}`);
  } else L.push(`Method \`${ck.method}\`${ck.grams != null ? ` (${ck.grams} g)` : ''}${ck.factor != null ? ` (factor ${ck.factor})` : ''}${ck.water != null ? ` (target water ${ck.water} g/100 g)` : ''}: ${ck.basis}`);
  L.push('', `**Cooked weight:** ${res.cookedG} g edible (yield ${res.yield} of the raw edible total)${res.boneShareServed ? `; bones are ${Math.round(res.boneShareServed * 100)}% of the weight on the plate` : ''}. Water in the dish: ${res.waterPer100g ?? 'n/a'} g/100 g.`, '');
  L.push('## Result per 100 g as served', '');
  L.push(`| kcal | Protein | Carbs (available) | Fat | Fibre | Sugars | Sat fat | Sodium |`, '|---|---|---|---|---|---|---|---|');
  L.push(`| ${p.kcal} | ${p.protein} | ${p.carbs} | ${p.fat} | ${p.fiber} | ${p.sugars ?? '–'} | ${p.satFat ?? '–'} | ${p.sodium} mg |`, '');
  L.push('## Energy check', '', `kcal = round(4P + 4C + 9F + 2·fibre) = ${p.kcal} (NUTRITION.md §6 step 7). Sum of the tables' own energy values: ${res.kcalIngredientSum} kcal/100 g (${(res.atwaterGap * 100).toFixed(1)}%).`, '');
  L.push('## Cross-check', '');
  if (!cross.length) L.push('No independent reference found for this dish.');
  for (const c of cross) L.push(`- ${c.citation} "${c.name}": ${c.kcal} kcal, P ${c.protein}, C ${r1(c.carbs)}, F ${c.fat}, fibre ${c.fiber} per 100 g → our value is ${c.diff > 0 ? '+' : ''}${c.diff}% kcal.${Math.abs(c.diff) > 25 ? ' **Over 25%: see note.**' : ''}${c.note ? ' ' + c.note : ''}`);
  L.push('', '## Assumptions and confidence', '');
  for (const a of spec.assumptions || []) L.push(`- ${a}`);
  L.push(`- Confidence **${spec.source.confidence}**: ${spec.confidenceWhy || (spec.source.confidence === 'C' ? 'recipe with assumed oil and/or yield.' : '')}`, '');
  return L.join('\n');
}

// ---------------------------------------------------------------- build
const sheets = await loadSheets();
const SHEETS = Object.fromEntries(sheets.map((s) => [s.id, s]));
const RESULTS = Object.fromEntries(sheets.map((s) => [s.id, compute(s)]));
const outRecords = {};
const recDir = path.join(here, 'recipes');
const built = {};

for (const key of Object.keys(FILES)) {
  const specFile = path.join(here, 'records', `${key}.mjs`);
  if (!fs.existsSync(specFile)) { outRecords[key] = []; continue; }
  const specs = (await import(pathToFileURL(specFile).href)).default;
  outRecords[key] = [];
  for (const spec of specs) {
    let per100g;
    let added;
    let citation;
    let method;
    let notes = spec.source.notes || '';
    if (spec.recipe) {
      const res = RESULTS[spec.recipe];
      if (!res) throw new Error(`${spec.id}: no sheet ${spec.recipe}`);
      const sheet = SHEETS[spec.recipe];
      per100g = { ...res.per100g };
      added = res.addedFatPer100g;
      citation = `Recipe R-${spec.id} (research/zainab/recipes/${spec.id}.md)`;
      method = 'recipe';
      const cross = (spec.crossCheck || []).map((c) => {
        const v = lookup(c.src, c.code);
        return { ...v, citation: c.src === 'cofid' ? `CoFID 2021 ${c.code}` : c.src === 'fndds' ? `USDA FDC FNDDS ${c.code}` : `USDA FDC ${c.code}`, diff: Math.round(((per100g.kcal - v.kcal) / v.kcal) * 100), note: c.note };
      });
      fs.writeFileSync(path.join(recDir, `${spec.id}.md`), recipeMd(spec, sheet, res, cross));
      const cc = cross.map((c) => `${c.citation} ${c.kcal} kcal (${c.diff > 0 ? '+' : ''}${c.diff}%)`).join('; ');
      notes = [notes, `Cooked yield ${res.yield}; added fat ${added} g/100 g.`, cc ? `Cross-check: ${cc}.` : ''].filter(Boolean).join(' ');
    } else if (spec.direct) {
      const v = lookup(spec.direct.src, spec.direct.code);
      per100g = { kcal: Math.round(v.kcal), protein: r1(v.protein), carbs: r1(v.carbs), fat: r1(v.fat), fiber: r1(v.fiber ?? 0) };
      if (v.sugars != null) per100g.sugars = r1(Math.min(v.sugars, v.carbs));
      if (v.satFat != null) per100g.satFat = r1(v.satFat);
      if (v.sodiumMg != null) per100g.sodium = Math.round(v.sodiumMg);
      citation = spec.direct.src === 'cofid' ? `CoFID 2021 ${spec.direct.code}` : spec.direct.src === 'fndds' ? `USDA FDC FNDDS ${spec.direct.code}` : spec.direct.src === 'ifct' ? `IFCT 2017 ${spec.direct.code}` : `USDA FDC SR Legacy ${spec.direct.code}`;
      method = spec.direct.method || 'direct';
    } else if (spec.blend) {
      const tot = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugars: 0, satFat: 0, sodium: 0 };
      let g = 0;
      let fatAdded = 0;
      const optMissing = new Set();
      for (const [ref, grams] of spec.blend.parts) {
        const b = built[ref];
        if (!b) throw new Error(`${spec.id}: blend part ${ref} not built yet`);
        g += grams;
        for (const k of Object.keys(tot)) {
          if (b.per100g[k] == null) optMissing.add(k);
          else tot[k] += (b.per100g[k] * grams) / 100;
        }
        fatAdded += ((b.addedFatPer100g || 0) * grams) / 100;
      }
      per100g = {};
      for (const k of ['protein', 'carbs', 'fat', 'fiber']) per100g[k] = r1((tot[k] * 100) / g);
      per100g.kcal = Math.round(4 * per100g.protein + 4 * per100g.carbs + 9 * per100g.fat + 2 * per100g.fiber);
      for (const k of ['sugars', 'satFat']) if (!optMissing.has(k)) per100g[k] = r1((tot[k] * 100) / g);
      if (!optMissing.has('sodium')) per100g.sodium = Math.round((tot.sodium * 100) / g);
      per100g = { kcal: per100g.kcal, protein: per100g.protein, carbs: per100g.carbs, fat: per100g.fat, fiber: per100g.fiber, ...(per100g.sugars != null ? { sugars: per100g.sugars } : {}), ...(per100g.satFat != null ? { satFat: per100g.satFat } : {}), ...(per100g.sodium != null ? { sodium: per100g.sodium } : {}) };
      added = r1((fatAdded * 100) / g);
      citation = `Recipe R-${spec.id} (research/zainab/recipes/${spec.id}.md)`;
      method = 'recipe';
      const md = [`# ${spec.name} — recipe R-${spec.id}`, '', `Combination record built by \`research/zainab/build.mjs\` (${TODAY}) from other Lab records, by weight:`, '', ...spec.blend.parts.map(([ref, gr]) => `- ${gr} g of \`${ref}\` (${built[ref].name}): ${built[ref].per100g.kcal} kcal, P ${built[ref].per100g.protein}, C ${built[ref].per100g.carbs}, F ${built[ref].per100g.fat}, fibre ${built[ref].per100g.fiber} per 100 g`), '', `Total ${g} g → per 100 g: ${per100g.kcal} kcal, P ${per100g.protein}, C ${per100g.carbs}, F ${per100g.fat}, fibre ${per100g.fiber}; added fat ${added} g/100 g. kcal = round(4P + 4C + 9F + 2·fibre).`, '', '## Assumptions', '', ...(spec.assumptions || []).map((a) => `- ${a}`), `- Confidence ${spec.source.confidence}.`, ''].join('\n');
      fs.writeFileSync(path.join(recDir, `${spec.id}.md`), md);
      notes = [notes, spec.blend.note].filter(Boolean).join(' ');
    } else throw new Error(`${spec.id}: needs recipe, direct or blend`);

    // drop optional nutrients that are unknown
    for (const k of ['sugars', 'satFat', 'sodium']) if (per100g[k] == null) delete per100g[k];
    if (per100g.sugars != null && per100g.sugars > per100g.carbs) per100g.sugars = per100g.carbs;
    const rec = {
      id: spec.id,
      name: spec.name,
      nameUr: spec.nameUr,
      nameRoman: spec.nameRoman,
      aliases: spec.aliases,
      group: spec.group,
      state: spec.state,
      style: spec.style,
      family: spec.family,
      per100g,
      addedFatPer100g: method === 'recipe' ? added : spec.addedFatPer100g,
      servings: typeof spec.servings === 'function' ? spec.servings({ per100g, katoriSet, res: spec.recipe ? RESULTS[spec.recipe] : null }) : spec.servings,
      tags: spec.tags,
      slots: spec.slots,
      halal: spec.halal || { status: 'halal' },
      source: { citation, method, confidence: spec.source.confidence, reviewer: 'zainab', date: TODAY, notes: notes || undefined },
    };
    built[spec.id] = rec;
    outRecords[key].push(rec);
  }
}

for (const [key, f] of Object.entries(FILES)) {
  const recs = outRecords[key];
  const head = `// ${f.title}\n// Owner: Zainab Rauf (Nutrition Lab). Reviewed by Dr. Ayesha Siddiqui.\n// Record format: docs/NUTRITION.md. Values per 100 g as eaten.\n// GENERATED by research/zainab/build.mjs from research/zainab/records/${key}.mjs and the recipe\n// sheets in research/zainab/recipes/. Edit those and re-run the build; do not edit this file by hand.\n\n`;
  fs.writeFileSync(path.join(ROOT, f.out), head + 'export default ' + lit(recs) + ';\n');
  console.log(`${f.out}: ${recs.length} records`);
}
