#!/usr/bin/env node
// Nutrition Lab self-check: applies every data gate in docs/NUTRITION.md §8 (G1-G25) to food records,
// plus the rules self-checks (protein-tip foods, Ramadan timetable; rules 1.7.0).
// Researchers run it before every hand-off. Owner: Dr. Ayesha Siddiqui (Nutrition Lab).
//
//   node research/check-foods.mjs                       # all app/data/foods-*.js
//   node research/check-foods.mjs app/data/foods-pk-home.js [more files…]
//   node research/check-foods.mjs --quiet <files>       # print failing records and warnings only
//
// Ids are always checked for uniqueness across ALL app/data/foods-*.js files plus any named file.
// Exit code: 0 = no failures, 1 = at least one failure (or a file that does not load).
// Every constant comes from app/data/rules.js; this script has no nutrition numbers of its own.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '..');
const DATA_DIR = path.join(ROOT, 'app', 'data');

const args = process.argv.slice(2);
const quiet = args.includes('--quiet');
const named = args.filter((a) => !a.startsWith('--'));

const RULES = (await import(pathToFileURL(path.join(DATA_DIR, 'rules.js')).href)).default;
const V = RULES.vocab;

// ------------------------------------------------------------------ vocab lookups
const GROUPS = new Map(V.groups.map((g) => [g.id, g]));
const TAGS = new Map(V.tags.map((t) => [t.id, t]));
const STYLES = new Set(V.styles.map((s) => s.id));
const METHODS = new Set(V.sourceMethods.map((m) => m.id));
const GRADES = new Set(V.confidenceGrades.map((c) => c.id));
const SLOT_IDS = new Set([...RULES.mealSlots.default, ...RULES.mealSlots.ramadan].map((s) => s.id));
const MEASURES = new Map(RULES.householdMeasures.map((m) => [m.id, m]));
const KATORI_IDS = ['katori-small', 'katori', 'katori-large'];
const SR = V.servingRules;
const isWholeDish = (id) => typeof id === 'string' && (id === SR.wholeDish.idPrefix || id.startsWith(`${SR.wholeDish.idPrefix}-`));
const ID_PREFIXES = ['pk-', 'es-', 'med-', 'intl-'];
const RESTAURANT_STYLES = new Set(['restaurant', 'dhaba', 'street']);
const KT = RULES.kamTel;

const KEYS = {
  record: new Set(['id', 'name', 'shortName', 'nameUr', 'nameRoman', 'aliases', 'group', 'state', 'style', 'family', 'per100g', 'addedFatPer100g', 'servings', 'pack', 'serve', 'tags', 'slots', 'halal', 'source']),
  per100g: new Set(['kcal', 'protein', 'carbs', 'fat', 'fiber', 'sugars', 'satFat', 'sodium']),
  serving: new Set(['id', 'label', 'labelUr', 'grams', 'default']),
  source: new Set(['citation', 'method', 'confidence', 'reviewer', 'date', 'notes']),
  halal: new Set(['status', 'reason']),
};
const REQUIRED_NUTRIENTS = ['kcal', 'protein', 'carbs', 'fat', 'fiber'];
const OPTIONAL_NUTRIENTS = ['sugars', 'satFat', 'sodium'];

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ARABIC = /[؀-ۿ]/;

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wordRe = (w) => new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(w)}(?![\\p{L}\\p{N}])`, 'iu');
const BANNED = V.banned.words.map((w) => [w, wordRe(w)]);
const QUALIFIERS = V.banned.allowedQualifiers.map(wordRe);
const LARD = V.banned.lardWords.map((w) => [w, wordRe(w)]);
const LARD_QUALIFIERS = V.banned.lardQualifiers.map(wordRe);
const HALAL_STATUSES = new Map(V.halalStatuses.map((h) => [h.id, h]));
const NOT_HALAL = V.halalRules.notHalal;
const NOT_HALAL_REASON = NOT_HALAL.reasonMustMention.map(wordRe);
// Rules 1.7.1: a reason saying an alcoholic ingredient is LISTED ("the label lists red wine",
// "made with mirin") on a halal/check record. Hedged clauses ("may", "often", "some"), negations
// ("no wine") and vinegar ("wine vinegar") do not count. One sentence at a time.
const ALC = V.halalRules.alcoholIngredient;
const ALC_LISTED = new RegExp(
  `(?<![\\p{L}\\p{N}])(?:${ALC.listedVerbs.map(escapeRe).join('|')})(?:\\s+[\\p{L}()]+){0,3}?\\s+\\(?(${ALC.words.map(escapeRe).join('|')})(?![\\p{L}\\p{N}])(?!\\)?\\s+(?:${ALC.notWhenFollowedBy.map(escapeRe).join('|')}))`,
  'iu',
);
const ALC_HEDGE = /(?<![\p{L}])(?:may|might|can|could|often|some|sometimes|usually|possibly|no|not|without|never|ask)(?![\p{L}])/iu;
const listedAlcohol = (reason) => {
  for (const sentence of reason.split(/(?<=[.;!?])\s+/)) {
    const m = ALC_LISTED.exec(sentence);
    if (m && !ALC_HEDGE.test(sentence.slice(0, m.index + m[0].length))) return m[1];
  }
  return null;
};

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isStr = (v) => typeof v === 'string' && v.trim().length > 0;
const maxOneDecimal = (v) => Math.abs(v * 10 - Math.round(v * 10)) < 1e-9;
const fmt = (n, d = 1) => (isNum(n) ? Number(n.toFixed(d)) : String(n));

// ------------------------------------------------------------------ the gates
function checkRecord(f, ctx) {
  const fail = [];
  const warn = [];
  const F = (gate, msg) => fail.push(`${gate} ${msg}`);
  const W = (gate, msg) => warn.push(`${gate} ${msg}`);

  if (!f || typeof f !== 'object' || Array.isArray(f)) {
    F('G0', 'record is not an object');
    return { fail, warn };
  }

  // G1 id
  if (!isStr(f.id)) F('G1', 'id missing');
  else {
    if (!KEBAB.test(f.id)) F('G1', `id "${f.id}" is not kebab-case`);
    if (!ID_PREFIXES.some((p) => f.id.startsWith(p))) F('G1', `id "${f.id}" must start with ${ID_PREFIXES.join(' | ')}`);
    const where = ctx.idFiles.get(f.id);
    if (where && where.length > 1) F('G1', `duplicate id, also in: ${where.filter((w) => w !== ctx.file).join(', ') || 'the same file'}`);
  }

  // G2 name, aliases
  if (!isStr(f.name)) F('G2', 'name missing');
  if (!Array.isArray(f.aliases) || !f.aliases.every((a) => typeof a === 'string')) F('G2', 'aliases must be an array of strings (may be empty)');

  // G3 Urdu names for Pakistani records
  if (typeof f.id === 'string' && f.id.startsWith('pk-')) {
    if (!isStr(f.nameUr) || !ARABIC.test(f.nameUr)) F('G3', 'pk- record needs nameUr in Urdu script');
    if (!isStr(f.nameRoman)) F('G3', 'pk- record needs nameRoman');
  } else if (f.nameUr !== undefined && (!isStr(f.nameUr) || !ARABIC.test(f.nameUr))) F('G3', 'nameUr must be Urdu script');

  // G4 group, state
  const group = GROUPS.get(f.group);
  if (!group) F('G4', `group "${f.group}" is not in RULES.vocab.groups`);
  if (!isStr(f.state)) F('G4', 'state missing (say exactly what the numbers describe)');

  // G5 per100g
  const p = f.per100g;
  let nutrientsOk = false;
  if (!p || typeof p !== 'object') F('G5', 'per100g missing');
  else {
    nutrientsOk = true;
    for (const k of REQUIRED_NUTRIENTS) {
      if (!isNum(p[k]) || p[k] < 0) {
        F('G5', `per100g.${k} must be a number >= 0 (got ${JSON.stringify(p[k])})`);
        nutrientsOk = false;
      } else if (k === 'kcal' ? !Number.isInteger(p[k]) : !maxOneDecimal(p[k])) {
        F('G5', `per100g.${k} = ${p[k]}: ${k === 'kcal' ? 'kcal must be a whole number' : 'at most 1 decimal'}`);
      }
    }
    for (const k of OPTIONAL_NUTRIENTS) {
      if (p[k] !== undefined && (!isNum(p[k]) || p[k] < 0)) F('G5', `per100g.${k} must be a number >= 0 when present`);
    }
    for (const k of Object.keys(p)) if (!KEYS.per100g.has(k)) W('G20', `unknown per100g key "${k}"`);
  }

  if (nutrientsOk) {
    // G6 energy
    const e = RULES.energy;
    const computed = e.factors.protein * p.protein + e.factors.carbs * p.carbs + e.factors.fat * p.fat + e.factors.fiber * p.fiber;
    const diff = p.kcal - computed;
    const allowed = Math.max((p.kcal * e.tolerance.pct) / 100, e.tolerance.kcal);
    if (Math.abs(diff) > allowed) {
      const pct = computed > 0 ? ` (${diff > 0 ? '+' : ''}${fmt((diff / computed) * 100)}%)` : '';
      F('G6', `energy: stated ${p.kcal} kcal vs 4P+4C+9F+2fibre = ${fmt(computed)}${pct}; allowed ±${fmt(allowed)}`);
    }
    // G7 mass
    const mass = p.protein + p.carbs + p.fat + p.fiber;
    if (mass > 100.5) F('G7', `protein+carbs+fat+fibre = ${fmt(mass)} g per 100 g (> 100)`);
    if (isNum(p.sugars) && p.sugars > p.carbs + 0.5) F('G7', `sugars ${p.sugars} g > available carbs ${p.carbs} g`);
    if (isNum(p.satFat) && p.satFat > p.fat) F('G7', `satFat ${p.satFat} g > fat ${p.fat} g`);
    if (group) {
      // G8 fibre zero
      if (group.fiberZero && p.fiber !== 0) F('G8', `group "${group.id}" must have fibre 0 (got ${p.fiber})`);
      // G9 kcal range
      const r = group.kcalPer100g;
      if (p.kcal < r.min || p.kcal > r.max) F('G9', `kcal ${p.kcal} outside "${group.id}" range ${r.min}-${r.max} (ask Ayesha if the food is real)`);
    }
  }

  // G10-G12 servings
  if (!Array.isArray(f.servings) || f.servings.length === 0) F('G10', 'servings must be a non-empty array');
  else {
    const ids = new Set();
    let defaults = 0;
    const density = {};
    for (const s of f.servings) {
      if (!s || typeof s !== 'object') { F('G10', 'serving is not an object'); continue; }
      const sid = s.id;
      if (!isStr(sid) || !KEBAB.test(sid)) F('G10', `serving id "${sid}" must be kebab-case`);
      else if (sid === 'g') F('G10', 'serving id "g" is reserved for raw grams');
      else if (ids.has(sid)) F('G10', `duplicate serving id "${sid}"`);
      ids.add(sid);
      if (!isStr(s.label)) F('G10', `serving "${sid}" needs a label`);
      if (s.labelUr !== undefined && !isStr(s.labelUr)) F('G10', `serving "${sid}" labelUr must be a non-empty string`);
      if (s.default === true) defaults++;
      for (const k of Object.keys(s)) if (!KEYS.serving.has(k)) W('G20', `unknown serving key "${k}" in "${sid}"`);
      if (!isNum(s.grams) || s.grams <= 0) { F('G10', `serving "${sid}" grams must be > 0`); continue; }
      const whole = isWholeDish(sid);
      const measure = MEASURES.get(sid);
      if (group && !measure) {
        const r = group.servingGrams;
        if (s.grams < r.min || (!whole && s.grams > r.max)) F('G10', `serving "${sid}" = ${s.grams} g outside "${group.id}" serving range ${r.min}-${r.max} g${whole ? '' : ' (a whole dish? use id "whole")'}`);
      }
      if (whole) {
        if (s.grams > SR.wholeDish.maxGrams) F('G10', `whole-dish serving "${sid}" = ${s.grams} g > ${SR.wholeDish.maxGrams} g`);
        if (s.default === true && !SR.wholeDish.mayBeDefault) F('G10', `whole-dish serving "${sid}" cannot be the default`);
      }
      if (nutrientsOk) {
        const kcal = (s.grams * p.kcal) / 100;
        const cap = whole ? SR.wholeDish.maxKcal : SR.maxKcalPerServing;
        if (kcal > cap) F('G10', `serving "${sid}" = ${fmt(kcal, 0)} kcal (> ${cap} for one unit)`);
      }
      if (measure) {
        const d = s.grams / measure.ml;
        density[sid] = d;
        const r = SR.measureDensityGPerMl;
        if (d < r.min || d > r.max) F('G11', `serving "${sid}" = ${s.grams} g for ${measure.ml} ml implies ${fmt(d, 2)} g/ml (allowed ${r.min}-${r.max})`);
      }
    }
    if (defaults !== 1) F('G10', `exactly one serving must have default: true (found ${defaults})`);
    // G12 katori-served groups
    if (group && group.katoriServed) {
      const missing = [...KATORI_IDS, 'tbsp'].filter((id) => !ids.has(id));
      if (missing.length) F('G12', `"${group.id}" is katori-served: add servings ${missing.join(', ')} (see NUTRITION.md §5.1)`);
      const ks = KATORI_IDS.map((id) => density[id]).filter(isNum);
      if (ks.length === 3) {
        const lo = Math.min(...ks);
        const hi = Math.max(...ks);
        if (hi / lo - 1 > 0.03) F('G12', `katori servings use different densities (${ks.map((d) => fmt(d, 2)).join(' / ')} g/ml); use one density`);
        if (isNum(density.tbsp) && Math.abs(density.tbsp / ((lo + hi) / 2) - 1) > 0.1) F('G12', `tbsp density ${fmt(density.tbsp, 2)} g/ml differs from katori density by more than 10%`);
      }
    }
  }

  // G13 tags
  if (!Array.isArray(f.tags)) F('G13', 'tags must be an array');
  else {
    const unknown = f.tags.filter((t) => !TAGS.has(t));
    if (unknown.length) F('G13', `unknown tags: ${unknown.join(', ')}`);
    const kinds = f.tags.map((t) => TAGS.get(t)?.kind);
    const cuisines = kinds.filter((k) => k === 'cuisine').length;
    if (cuisines < V.tagRules.minCuisineTags) F('G13', 'needs at least one cuisine tag');
    const seafood = kinds.filter((k) => k === 'seafood').length;
    if (seafood > V.tagRules.maxSeafoodTags) F('G13', `at most ${V.tagRules.maxSeafoodTags} seafood tag (use the most restrictive: other > prawn > fish)`);
    if (f.tags.includes('halal') || f.tags.includes('halal-check')) F('G13', 'halal is no longer a tag: use the halal field { status, reason } (Meeting 002)');
    if (V.tagRules.veganRequiresVegetarian && f.tags.includes('vegan') && !f.tags.includes('vegetarian')) F('G13', 'vegan requires vegetarian');
    if (new Set(f.tags).size !== f.tags.length) W('G13', 'duplicate tags');
  }

  // G14 slots, style, family
  if (f.slots !== undefined) {
    if (!Array.isArray(f.slots)) F('G14', 'slots must be an array of slot ids');
    else {
      const bad = f.slots.filter((s) => !SLOT_IDS.has(s));
      if (bad.length) F('G14', `unknown slot ids: ${bad.join(', ')}`);
    }
  }
  if (f.style !== undefined && !STYLES.has(f.style)) F('G14', `style "${f.style}" is not one of ${[...STYLES].join(', ')}`);
  if (f.style !== undefined && !isStr(f.family)) F('G14', 'a record with style needs a family');
  if (f.family !== undefined && (!isStr(f.family) || !KEBAB.test(f.family))) F('G14', `family "${f.family}" must be kebab-case`);

  // G15 source
  const src = f.source;
  if (!src || typeof src !== 'object') F('G15', 'source missing');
  else {
    if (!isStr(src.citation)) F('G15', 'source.citation missing');
    if (!METHODS.has(src.method)) F('G15', `source.method "${src.method}" must be one of ${[...METHODS].join(', ')}`);
    if (!GRADES.has(src.confidence)) F('G15', `source.confidence "${src.confidence}" must be A, B or C`);
    if (src.confidence === 'A' && src.method !== 'direct') F('G15', 'confidence A is only allowed with method "direct"');
    if (!isStr(src.reviewer)) F('G15', 'source.reviewer missing');
    if (!isStr(src.date) || !ISO_DATE.test(src.date)) F('G15', `source.date "${src.date}" must be YYYY-MM-DD`);
    for (const k of Object.keys(src)) if (!KEYS.source.has(k)) W('G20', `unknown source key "${k}"`);
    // G16 recipe records
    if (src.method === 'recipe') {
      const a = f.addedFatPer100g;
      if (!isNum(a) || a < 0) F('G16', 'recipe records need addedFatPer100g (grams of oil/ghee per 100 g as served)');
      else if (p && isNum(p.fat) && a > p.fat + 0.1) F('G16', `addedFatPer100g ${a} g > total fat ${p.fat} g`);
    }
    if (RESTAURANT_STYLES.has(f.style) && src.confidence !== 'C') F('G16', `style "${f.style}" must be confidence C`);
    // G19 review status (counted, reported in the summary)
    if (src.reviewer !== 'ayesha') ctx.pendingReview++;
  }
  if (f.addedFatPer100g !== undefined && (!isNum(f.addedFatPer100g) || f.addedFatPer100g < 0)) F('G16', 'addedFatPer100g must be a number >= 0');

  // G21 halal field (Meeting 002): { status, reason }; reason required unless status is 'halal'.
  const h = f.halal;
  const status = h && typeof h === 'object' ? h.status : undefined;
  if (!h || typeof h !== 'object' || Array.isArray(h)) F('G21', 'halal { status, reason } missing');
  else {
    const def = HALAL_STATUSES.get(h.status);
    if (!def) F('G21', `halal.status "${h.status}" must be one of ${[...HALAL_STATUSES.keys()].join(', ')}`);
    else if (def.reasonRequired && !isStr(h.reason)) F('G21', `halal.reason is required when status is "${h.status}" (one plain line)`);
    if (h.reason !== undefined && !isStr(h.reason)) F('G21', 'halal.reason must be a non-empty string when present');
    for (const k of Object.keys(h)) if (!KEYS.halal.has(k)) W('G20', `unknown halal key "${k}"`);
    if (h.status === 'not-halal') {
      if (NOT_HALAL.forbiddenGroups.includes(f.group)) F('G21', `not-halal is only for non-meat foods with lard; group "${f.group}" is not allowed (pork meat stays out)`);
      if (isStr(h.reason) && !NOT_HALAL_REASON.some((re) => re.test(h.reason))) F('G21', `not-halal reason must name the lard or the alcoholic ingredient (${NOT_HALAL.reasonMustMention.join(' / ')})`);
      if (Array.isArray(f.slots) && f.slots.length) W('G21', 'not-halal foods are never suggested: slot hints are ignored');
    } else if (def && isStr(h.reason)) {
      const alc = listedAlcohol(h.reason);
      if (alc) F('G21', `the reason says "${alc}" is a listed ingredient: an alcoholic ingredient makes the food "not-halal" (rules 1.7.1; fermentation traces stay "check", wine vinegar stays "halal")`);
    }
  }

  // G17 banned words: no pork meat and no alcohol, ever; lard words only on not-halal records
  const texts = [f.name, f.nameRoman, ...(Array.isArray(f.aliases) ? f.aliases : [])].filter((t) => typeof t === 'string');
  for (const t of texts) {
    for (const [w, re] of BANNED) {
      if (re.test(t) && !QUALIFIERS.some((q) => q.test(t))) F('G17', `"${t}" contains banned word "${w}" (no pork meat or alcohol)`);
    }
    for (const [w, re] of LARD) {
      if (re.test(t) && !LARD_QUALIFIERS.some((q) => q.test(t)) && status !== 'not-halal') F('G17', `"${t}" mentions lard ("${w}"): such a food must be halal.status "not-halal"`);
    }
  }

  // G22 meal-prep portions (group with prepServing): the DEFAULT serving is a box / jar / portion,
  // the record has a primary slot (slots[0]), and that serving's energy fits the slot's band.
  if (group && group.prepServing && Array.isArray(f.servings)) {
    const ps = group.prepServing;
    const def = f.servings.find((s) => s && s.default === true);
    if (!def || !ps.ids.includes(def.id)) F('G22', `"${group.id}" records need a default serving with id ${ps.ids.join(' / ')} (e.g. "1 box")`);
    const slot = Array.isArray(f.slots) ? f.slots[0] : undefined;
    const band = slot ? ps.kcalBySlot[slot] : undefined;
    if (!slot) F('G22', `"${group.id}" records need slots, with the primary slot first (e.g. ['lunch'])`);
    else if (!band) F('G22', `primary slot "${slot}" has no energy band for "${group.id}" (use ${Object.keys(ps.kcalBySlot).join(', ')})`);
    else if (def && nutrientsOk && isNum(def.grams)) {
      const kcal = (def.grams * p.kcal) / 100;
      if (kcal < band.min || kcal > band.max) F('G22', `1 ${def.id} = ${fmt(kcal, 0)} kcal, outside ${band.min}-${band.max} for a ${slot} prep`);
    }
  }

  // G23 assumed plates (rules v1.6, Meeting 003): a 'plate' / 'half-plate' serving has no published weight,
  // so its label must say it is assumed, and it must be stated in katoris (a multiple of the katori serving).
  if (SR.assumedPlate && Array.isArray(f.servings)) {
    const ap = SR.assumedPlate;
    const katori = f.servings.find((s) => s && s.id === 'katori');
    for (const s of f.servings) {
      if (!s || !ap.ids.includes(s.id)) continue;
      if (!isStr(s.label) || !s.label.toLowerCase().includes(ap.labelMustInclude)) F('G23', `serving "${s.id}" has no published weight: its label must say "${ap.labelMustInclude}" (e.g. "1 plate (home), assumed 2 katori")`);
      if (katori && isNum(katori.grams) && isNum(s.grams)) {
        const n = s.grams / katori.grams;
        const near = Math.round(n / ap.katoriMultipleStep) * ap.katoriMultipleStep;
        if (near === 0 || Math.abs(n - near) / near > ap.tolerancePct / 100) F('G23', `serving "${s.id}" = ${fmt(n, 2)} katori; state the plate as a multiple of ${ap.katoriMultipleStep} katori`);
      }
    }
  }

  // G18 family group consistency
  if (isStr(f.family)) {
    const groups = ctx.familyGroups.get(f.family);
    if (groups && groups.size > 1) W('G18', `family "${f.family}" spans groups: ${[...groups].join(', ')}`);
  }

  // pack (Meeting 004): optional shopping-list pack size, no nutrition effect
  if (f.pack !== undefined) {
    if (!f.pack || typeof f.pack !== 'object' || Array.isArray(f.pack)) F('G10', 'pack must be { grams, label }');
    else {
      if (!isNum(f.pack.grams) || f.pack.grams <= 0) F('G10', 'pack.grams must be a number > 0');
      if (!isStr(f.pack.label)) F('G10', 'pack.label must be a non-empty string');
      for (const k of Object.keys(f.pack)) if (!V.fieldRules.pack.keys.includes(k)) W('G20', `unknown pack key "${k}"`);
    }
  }

  // serve (Meeting 004): optional, how a no-cook (assemble) prep is eaten; meal-prep records only
  if (f.serve !== undefined) {
    const sv = V.fieldRules.serve;
    if (!sv.values.includes(f.serve)) F('G10', `serve must be ${sv.values.map((v) => `'${v}'`).join(', ')}`);
    if (!sv.groups.includes(f.group)) W('G20', `serve is for meal-prep records (group ${sv.groups.join(', ')})`);
  }

  // G25 kam tel (rules 1.7.0, Meeting 005 d): a home-light record is its family's home recipe with less oil
  if (f.style === KT.style) {
    const home = isStr(f.family) ? (ctx.familyStyles.get(f.family) ?? []).filter((r) => r.style === KT.pairsWithStyle) : [];
    const lights = isStr(f.family) ? (ctx.familyStyles.get(f.family) ?? []).filter((r) => r.style === KT.style) : [];
    if (home.length !== 1) F('G25', `${KT.style} needs exactly one "${KT.pairsWithStyle}" record in family "${f.family}" (found ${home.length})`);
    if (lights.length > 1) F('G25', `family "${f.family}" has ${lights.length} ${KT.style} records (one only)`);
    if (src && src.method !== 'recipe') F('G25', `${KT.style} records use method "recipe" (derived from the home sheet)`);
    const h = home[0];
    if (h && nutrientsOk && h.per100g) {
      if (h.group !== f.group) F('G25', `group "${f.group}" differs from home record ${h.id} ("${h.group}")`);
      if (!(p.kcal < h.per100g.kcal)) F('G25', `kcal ${p.kcal} is not below home ${h.id} (${h.per100g.kcal})`);
      else if ((1 - p.kcal / h.per100g.kcal) * 100 < KT.gate.warnKcalDropBelowPct) W('G25', `only ${fmt((1 - p.kcal / h.per100g.kcal) * 100)}% fewer kcal than ${h.id}: is a light variant worth it?`);
      if (!(p.fat < h.per100g.fat)) F('G25', `fat ${p.fat} g is not below home ${h.id} (${h.per100g.fat} g)`);
      if (isNum(f.addedFatPer100g) && isNum(h.addedFatPer100g)) {
        const cap = Math.max(KT.minAddedFatPer100g, h.addedFatPer100g * KT.gate.maxAddedFatRatio);
        if (f.addedFatPer100g > cap + 0.05) F('G25', `addedFatPer100g ${f.addedFatPer100g} > ${fmt(cap)} (home ${h.addedFatPer100g} × ${KT.gate.maxAddedFatRatio}, NUTRITION.md §6.1)`);
        if (f.addedFatPer100g < KT.minAddedFatPer100g - 0.05) W('G25', `addedFatPer100g ${f.addedFatPer100g} is under the ${KT.minAddedFatPer100g} g floor`);
      }
      const order = KT.gate.confidenceOrder;
      if (src && h.source && order.indexOf(src.confidence) < order.indexOf(h.source.confidence)) F('G25', `confidence ${src.confidence} is better than home ${h.id} (${h.source.confidence})`);
      const ids = (r) => (Array.isArray(r.servings) ? r.servings.map((x) => x && x.id).sort().join(',') : '');
      if (ids(f) !== ids(h)) W('G25', `servings differ from home ${h.id} (keep the same ids and density)`);
    }
  }

  // G24 shortName (rules v1.7, Meeting 005 e): optional; plain words, at most N characters, no brackets
  if (f.shortName !== undefined) {
    const sn = V.fieldRules.shortName;
    if (typeof f.shortName !== 'string' || !f.shortName.trim()) F('G24', 'shortName must be a non-empty string when present');
    else {
      if (f.shortName !== f.shortName.trim() || /\s{2,}/.test(f.shortName)) F('G24', `shortName "${f.shortName}" has extra spaces`);
      if ([...f.shortName].length > sn.maxChars) F('G24', `shortName "${f.shortName}" is ${[...f.shortName].length} characters (max ${sn.maxChars})`);
      const bad = [...sn.forbiddenChars].filter((c) => f.shortName.includes(c));
      if (bad.length) F('G24', `shortName "${f.shortName}" must be plain words (no ${bad.join(' ')})`);
      if (sn.mustBeShorterThanName && isStr(f.name) && [...f.shortName].length >= [...f.name].length) F('G24', `shortName "${f.shortName}" is not shorter than name`);
    }
  }

  // G20 unknown top-level keys
  for (const k of Object.keys(f)) if (!KEYS.record.has(k)) W('G20', `unknown field "${k}"`);

  return { fail, warn };
}

// ------------------------------------------------------------------ load files
const allDataFiles = fs
  .readdirSync(DATA_DIR)
  .filter((n) => /^foods-.*\.js$/.test(n))
  .sort()
  .map((n) => path.join(DATA_DIR, n));
const resolveArg = (a) => (fs.existsSync(path.resolve(a)) ? path.resolve(a) : path.resolve(ROOT, a));
const targets = named.length ? named.map(resolveArg) : allDataFiles;
const loadSet = [...new Set([...allDataFiles, ...targets])];

const loaded = new Map(); // abs path -> records | Error
for (const file of loadSet) {
  try {
    const mod = await import(pathToFileURL(file).href);
    const recs = mod.default;
    if (!Array.isArray(recs)) throw new Error('default export is not an array');
    loaded.set(file, recs);
  } catch (err) {
    loaded.set(file, err);
  }
}

const rel = (f) => path.relative(ROOT, f) || f;
const idFiles = new Map();
const familyGroups = new Map();
const familyStyles = new Map(); // family -> records (for G25)
const byId = new Map();
for (const [file, recs] of loaded) {
  if (recs instanceof Error) continue;
  for (const r of recs) {
    if (!r || typeof r.id !== 'string') continue;
    if (!idFiles.has(r.id)) idFiles.set(r.id, []);
    idFiles.get(r.id).push(rel(file));
    if (!byId.has(r.id)) byId.set(r.id, r);
    if (typeof r.family === 'string') {
      if (!familyGroups.has(r.family)) familyGroups.set(r.family, new Set());
      familyGroups.get(r.family).add(r.group);
      if (!familyStyles.has(r.family)) familyStyles.set(r.family, []);
      familyStyles.get(r.family).push(r);
    }
  }
}

// ------------------------------------------------------------------ run
let total = 0;
let failed = 0;
let warned = 0;
let loadErrors = 0;
const ctx = { idFiles, familyGroups, familyStyles, pendingReview: 0, file: '' };

for (const file of targets) {
  const recs = loaded.get(file);
  if (recs instanceof Error || recs === undefined) {
    loadErrors++;
    console.log(`\n${rel(file)}: FAIL could not load: ${recs ? recs.message : 'not found'}`);
    continue;
  }
  console.log(`\n${rel(file)} (${recs.length} record${recs.length === 1 ? '' : 's'})`);
  ctx.file = rel(file);
  recs.forEach((r, i) => {
    total++;
    const { fail, warn } = checkRecord(r, ctx);
    const label = r && typeof r.id === 'string' ? r.id : `#${i}`;
    if (fail.length) failed++;
    if (warn.length) warned++;
    if (fail.length) console.log(`  FAIL ${label}`);
    else if (!quiet || warn.length) console.log(`  ${warn.length ? 'WARN' : 'PASS'} ${label}`);
    for (const m of fail) console.log(`       ✗ ${m}`);
    for (const m of warn) console.log(`       ! ${m}`);
  });
}

// ------------------------------------------------------------------ rules self-checks (rules 1.7.0)
// R1 protein-tip foods resolve, are halal or check (never not-halal), and their stated protein/kcal match FOODS.
// R2 the Ramadan timetable rows are consecutive dates with HH:MM times, fajr before maghrib.
const ruleFails = [];
const PN = RULES.proteinNudges;
for (const [slot, items] of Object.entries(PN?.suggestions ?? {})) {
  for (const it of items) {
    const r = byId.get(it.foodId);
    const sv = r && Array.isArray(r.servings) ? r.servings.find((x) => x && x.id === it.servingId) : null;
    if (!r) { ruleFails.push(`R1 ${slot}: food "${it.foodId}" not found`); continue; }
    if (!sv) { ruleFails.push(`R1 ${slot}: ${it.foodId} has no serving "${it.servingId}"`); continue; }
    if (r.halal?.status === 'not-halal') ruleFails.push(`R1 ${slot}: ${it.foodId} is not-halal`);
    const g = sv.grams * it.qty;
    const prot = (g * r.per100g.protein) / 100;
    const kcal = (g * r.per100g.kcal) / 100;
    if (Math.abs(prot - it.proteinG) > 0.6) ruleFails.push(`R1 ${slot}: ${it.foodId} protein ${fmt(prot)} g, rules say ${it.proteinG}`);
    if (Math.abs(kcal - it.kcal) > 1) ruleFails.push(`R1 ${slot}: ${it.foodId} kcal ${fmt(kcal, 0)}, rules say ${it.kcal}`);
  }
}
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
for (const [name, t] of Object.entries(RULES.ramadan?.timetables ?? {})) {
  let prev = null;
  for (const [d, fajr, maghrib] of t.rows) {
    if (!ISO_DATE.test(d) || !HHMM.test(fajr) || !HHMM.test(maghrib)) ruleFails.push(`R2 ${name}: bad row ${d} ${fajr} ${maghrib}`);
    else if (fajr >= maghrib) ruleFails.push(`R2 ${name}: ${d} fajr ${fajr} is not before maghrib ${maghrib}`);
    if (prev && Date.parse(d) - Date.parse(prev) !== 86400000) ruleFails.push(`R2 ${name}: ${d} does not follow ${prev}`);
    prev = d;
  }
}
console.log(`\nRules self-checks: ${ruleFails.length ? `${ruleFails.length} FAIL` : 'PASS'} (protein tips, Ramadan timetable)`);
for (const m of ruleFails) console.log(`  ✗ ${m}`);
if (ruleFails.length) failed++;

console.log(
  `\nSummary: ${total} records, ${total - failed} pass, ${failed} fail, ${warned} with warnings` +
    `${loadErrors ? `, ${loadErrors} file(s) failed to load` : ''}. ` +
    `G19: ${ctx.pendingReview} awaiting Ayesha's review.`,
);
process.exit(failed || loadErrors ? 1 : 0);
