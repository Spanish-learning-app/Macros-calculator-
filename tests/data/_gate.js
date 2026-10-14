// Kenji's data gate: docs/NUTRITION.md §3, §4 and §8 (G1–G23), implemented from the document and
// RULES, independently of core/foods.validateFood and of research/check-foods.mjs (Ayesha's tool;
// where the two disagree, one of them has a bug). Owner: Kenji.
//
// checkRecord(food, rules) → { fails: Issue[], warns: Issue[] }, Issue = { gate, message }.
// checkFamilies(records) → warns (G18). Cross-file id uniqueness (G1) is checked by the caller.

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PREFIXES = ['pk-', 'es-', 'med-', 'intl-'];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ARABIC = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;
const LATIN_LETTER = /[A-Za-z]/;
const NUTRIENTS = ['kcal', 'protein', 'carbs', 'fat', 'fiber'];
const OPTIONAL_NUTRIENTS = ['sugars', 'satFat', 'sodium'];
const KNOWN_FIELDS = new Set([
  'id',
  'name',
  'nameUr',
  'nameRoman',
  'aliases',
  'group',
  'state',
  'style',
  'family',
  'per100g',
  'addedFatPer100g',
  'servings',
  'tags',
  'halal',
  'slots',
  'source',
]);
const OUT_OF_HOUSE_STYLES = new Set(['restaurant', 'dhaba', 'street']);

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const nonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;
const finite = (v) => typeof v === 'number' && Number.isFinite(v);
const oneDecimal = (v) => Math.abs(v * 10 - Math.round(v * 10)) < 1e-6;

function realDate(s) {
  if (typeof s !== 'string' || !ISO_DATE.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

/** Lowercase word tokens (Unicode letters and digits). */
const words = (text) =>
  String(text)
    .toLowerCase()
    .match(/[\p{L}\p{N}]+/gu) ?? [];

/** True when the token sequence of `phrase` appears in `tokens`. */
function hasPhrase(tokens, phrase) {
  const p = words(phrase);
  if (!p.length) return false;
  for (let i = 0; i + p.length <= tokens.length; i++) {
    if (p.every((w, j) => tokens[i + j] === w)) return true;
  }
  return false;
}

export function checkRecord(food, rules) {
  const fails = [];
  const warns = [];
  const fail = (gate, message) => fails.push({ gate, message });
  const warn = (gate, message) => warns.push({ gate, message });
  if (!isObject(food)) {
    fail('G1', 'record is not an object');
    return { fails, warns };
  }
  const V = rules.vocab;
  const group = V.groups.find((g) => g.id === food.group);
  const householdIds = new Set(rules.householdMeasures.map((m) => m.id));
  const mlOf = Object.fromEntries(rules.householdMeasures.map((m) => [m.id, m.ml]));
  const SR = V.servingRules ?? {};
  const wholeRule = SR.wholeDish ?? { idPrefix: 'whole', maxGrams: 3000, maxKcal: 4000 };
  const maxKcalPerServing = SR.maxKcalPerServing ?? 1500;
  const density = SR.measureDensityGPerMl ?? { min: 0.3, max: 1.5 };
  const per = isObject(food.per100g) ? food.per100g : {};
  const kcalPer100 = finite(per.kcal) ? per.kcal : NaN;

  // G1 id (uniqueness across files is checked by the caller)
  if (typeof food.id !== 'string' || !KEBAB.test(food.id))
    fail('G1', `id ${JSON.stringify(food.id)} is not kebab-case`);
  else if (!PREFIXES.some((p) => food.id.startsWith(p)))
    fail('G1', `id ${food.id} has no allowed prefix (${PREFIXES.join(' ')})`);

  // G2 name, aliases
  if (!nonEmpty(food.name)) fail('G2', 'name is missing or empty');
  if (!Array.isArray(food.aliases) || !food.aliases.every((a) => typeof a === 'string')) {
    fail('G2', 'aliases must be an array of strings');
  }

  // G3 pk- names
  if (typeof food.id === 'string' && food.id.startsWith('pk-')) {
    if (!nonEmpty(food.nameUr) || !ARABIC.test(food.nameUr) || LATIN_LETTER.test(food.nameUr)) {
      fail('G3', `pk- record needs nameUr in Urdu script (got ${JSON.stringify(food.nameUr)})`);
    }
    if (!nonEmpty(food.nameRoman)) fail('G3', 'pk- record needs nameRoman');
  }

  // G4 group, state
  if (!group) fail('G4', `group ${JSON.stringify(food.group)} is not in RULES.vocab.groups`);
  if (!nonEmpty(food.state)) fail('G4', 'state is missing or empty');

  // G5 per100g
  if (!isObject(food.per100g)) fail('G5', 'per100g is missing');
  else {
    for (const k of NUTRIENTS) {
      if (!finite(per[k]) || per[k] < 0)
        fail('G5', `per100g.${k} must be a finite number ≥ 0 (got ${per[k]})`);
    }
    if (finite(per.kcal) && !Number.isInteger(per.kcal))
      fail('G5', `per100g.kcal ${per.kcal} is not a whole number`);
    for (const k of ['protein', 'carbs', 'fat', 'fiber']) {
      if (finite(per[k]) && !oneDecimal(per[k]))
        fail('G5', `per100g.${k} ${per[k]} has more than 1 decimal`);
    }
    for (const k of OPTIONAL_NUTRIENTS) {
      if (k in per && (!finite(per[k]) || per[k] < 0))
        fail('G5', `per100g.${k} must be a number ≥ 0 (got ${per[k]})`);
    }
  }
  const macrosOk = NUTRIENTS.every((k) => finite(per[k]) && per[k] >= 0);

  if (macrosOk) {
    // G6 energy
    const f = rules.energy.factors;
    const computed =
      f.protein * per.protein + f.carbs * per.carbs + f.fat * per.fat + f.fiber * per.fiber;
    const tol = Math.max(
      (per.kcal * rules.energy.tolerance.pct) / 100,
      rules.energy.tolerance.kcal,
    );
    if (Math.abs(per.kcal - computed) > tol + 1e-9) {
      fail(
        'G6',
        `energy: stated ${per.kcal} kcal vs 4P+4C+9F+2fibre = ${computed.toFixed(1)} (tolerance ${tol.toFixed(1)})`,
      );
    }
    // G7 mass
    const mass = per.protein + per.carbs + per.fat + per.fiber;
    if (mass > 100.5 + 1e-9) fail('G7', `P+C+F+fibre = ${mass.toFixed(1)} g per 100 g (> 100.5)`);
    if (finite(per.sugars) && per.sugars > per.carbs + 0.5 + 1e-9)
      fail('G7', `sugars ${per.sugars} > carbs ${per.carbs} + 0.5`);
    if (finite(per.satFat) && per.satFat > per.fat + 1e-9)
      fail('G7', `satFat ${per.satFat} > fat ${per.fat}`);
    // G8 fibre zero
    if (group?.fiberZero && per.fiber !== 0)
      fail('G8', `group ${group.id} needs fibre 0 (got ${per.fiber})`);
    // G9 range
    if (group && (per.kcal < group.kcalPer100g.min || per.kcal > group.kcalPer100g.max)) {
      fail(
        'G9',
        `${per.kcal} kcal/100 g is outside ${group.id} ${group.kcalPer100g.min}–${group.kcalPer100g.max}`,
      );
    }
  }

  // G10–G12 servings
  const servings = Array.isArray(food.servings) ? food.servings : null;
  if (!servings || servings.length === 0) fail('G10', 'servings must be a non-empty array');
  else {
    const seen = new Set();
    let defaults = 0;
    for (const s of servings) {
      if (!isObject(s)) {
        fail('G10', 'a serving is not an object');
        continue;
      }
      const sid = s.id;
      const label = `serving ${JSON.stringify(sid)}`;
      if (typeof sid !== 'string' || !KEBAB.test(sid))
        fail('G10', `${label}: id is not kebab-case`);
      if (sid === 'g') fail('G10', `${label}: id 'g' is reserved for raw grams`);
      if (seen.has(sid)) fail('G10', `${label}: duplicate id`);
      seen.add(sid);
      if (!nonEmpty(s.label)) fail('G10', `${label}: label is empty`);
      if (s.default === true) defaults += 1;
      if (!finite(s.grams) || s.grams <= 0) {
        fail('G10', `${label}: grams must be > 0 (got ${s.grams})`);
        continue;
      }
      const kcal = Number.isFinite(kcalPer100) ? (s.grams * kcalPer100) / 100 : NaN;
      const household = householdIds.has(sid);
      const whole =
        typeof sid === 'string' &&
        (sid === wholeRule.idPrefix || sid.startsWith(`${wholeRule.idPrefix}-`));
      if (household) {
        // G11 household measures: density check instead of the group's gram range
        const d = s.grams / mlOf[sid];
        if (d < density.min - 1e-9 || d > density.max + 1e-9) {
          fail(
            'G11',
            `${label}: ${s.grams} g for ${mlOf[sid]} ml is ${d.toFixed(2)} g/ml (allowed ${density.min}–${density.max})`,
          );
        }
        if (kcal > maxKcalPerServing)
          fail('G10', `${label}: ${kcal.toFixed(0)} kcal per serving (> ${maxKcalPerServing})`);
      } else if (whole) {
        if (group && s.grams < group.servingGrams.min)
          fail(
            'G10',
            `${label}: ${s.grams} g is below ${group.id} minimum ${group.servingGrams.min}`,
          );
        if (s.grams > wholeRule.maxGrams)
          fail('G10', `${label}: whole dish ${s.grams} g (> ${wholeRule.maxGrams})`);
        if (kcal > wholeRule.maxKcal)
          fail('G10', `${label}: whole dish ${kcal.toFixed(0)} kcal (> ${wholeRule.maxKcal})`);
        if (s.default === true) fail('G10', `${label}: a whole-dish serving is never the default`);
      } else {
        if (group && (s.grams < group.servingGrams.min || s.grams > group.servingGrams.max)) {
          fail(
            'G10',
            `${label}: ${s.grams} g is outside ${group.id} ${group.servingGrams.min}–${group.servingGrams.max} g`,
          );
        }
        if (kcal > maxKcalPerServing)
          fail('G10', `${label}: ${kcal.toFixed(0)} kcal per serving (> ${maxKcalPerServing})`);
      }
    }
    if (defaults !== 1) fail('G10', `exactly one default serving required (found ${defaults})`);
    // G12 katori-served groups
    if (group?.katoriServed) {
      const need = ['katori-small', 'katori', 'katori-large', 'tbsp'];
      const byId = Object.fromEntries(servings.filter(isObject).map((s) => [s.id, s]));
      const missing = need.filter((id) => !byId[id]);
      if (missing.length)
        fail('G12', `katori-served group ${group.id} is missing ${missing.join(', ')}`);
      else if (need.every((id) => finite(byId[id].grams))) {
        const ref = byId.katori.grams / mlOf.katori;
        for (const id of need) {
          const d = byId[id].grams / mlOf[id];
          if (Math.abs(d / ref - 1) > 0.03 + 1e-9) {
            fail(
              'G12',
              `${id} density ${d.toFixed(3)} g/ml differs from katori ${ref.toFixed(3)} by more than 3%`,
            );
          }
        }
      }
    }
  }

  // G13 tags
  if (!Array.isArray(food.tags)) fail('G13', 'tags must be an array');
  else {
    const tagById = Object.fromEntries(V.tags.map((t) => [t.id, t]));
    for (const t of food.tags) {
      if (t === 'halal' || t === 'halal-check')
        fail('G13', `old halal tag "${t}" (use the halal field)`);
      else if (!tagById[t]) fail('G13', `tag ${JSON.stringify(t)} is not in RULES.vocab.tags`);
    }
    const kinds = food.tags.map((t) => tagById[t]?.kind);
    const cuisines = kinds.filter((k) => k === 'cuisine').length;
    const seafood = kinds.filter((k) => k === 'seafood').length;
    if (cuisines < V.tagRules.minCuisineTags) fail('G13', 'needs at least one cuisine tag');
    if (seafood > V.tagRules.maxSeafoodTags)
      fail('G13', `${seafood} seafood tags (at most ${V.tagRules.maxSeafoodTags})`);
    if (
      V.tagRules.veganRequiresVegetarian &&
      food.tags.includes('vegan') &&
      !food.tags.includes('vegetarian')
    ) {
      fail('G13', 'vegan requires vegetarian');
    }
  }

  // G14 slots, style, family
  const slotIds = new Set(
    [...rules.mealSlots.default, ...(rules.mealSlots.ramadan ?? [])].map((s) => s.id),
  );
  if (food.slots !== undefined) {
    if (!Array.isArray(food.slots)) fail('G14', 'slots must be an array');
    else
      for (const s of food.slots)
        if (!slotIds.has(s)) fail('G14', `slot ${JSON.stringify(s)} is not a slot id`);
  }
  if (food.style !== undefined) {
    if (!V.styles.some((s) => s.id === food.style))
      fail('G14', `style ${JSON.stringify(food.style)} is not in the vocabulary`);
    if (food.family === undefined) fail('G14', 'style requires family');
  }
  if (food.family !== undefined && (typeof food.family !== 'string' || !KEBAB.test(food.family))) {
    fail('G14', `family ${JSON.stringify(food.family)} is not kebab-case`);
  }

  // G15 source
  const src = food.source;
  if (!isObject(src)) fail('G15', 'source is missing');
  else {
    if (!nonEmpty(src.citation)) fail('G15', 'source.citation is empty');
    if (!V.sourceMethods.some((m) => m.id === src.method))
      fail('G15', `source.method ${JSON.stringify(src.method)} is not valid`);
    if (!V.confidenceGrades.some((c) => c.id === src.confidence))
      fail('G15', `source.confidence ${JSON.stringify(src.confidence)} is not A, B or C`);
    if (src.confidence === 'A' && src.method !== 'direct')
      fail('G15', 'confidence A is only for method direct');
    if (!nonEmpty(src.reviewer)) fail('G15', 'source.reviewer is empty');
    if (!realDate(src.date))
      fail('G15', `source.date ${JSON.stringify(src.date)} is not a YYYY-MM-DD date`);
    // G19 review
    if (nonEmpty(src.reviewer) && src.reviewer !== 'ayesha')
      warn('G19', `awaiting Ayesha's review (reviewer ${src.reviewer})`);
  }

  // G16 recipe records and added fat
  if (isObject(src) && src.method === 'recipe' && food.addedFatPer100g === undefined) {
    fail('G16', 'recipe record needs addedFatPer100g');
  }
  if (food.addedFatPer100g !== undefined) {
    const a = food.addedFatPer100g;
    if (!finite(a) || a < 0) fail('G16', `addedFatPer100g must be ≥ 0 (got ${a})`);
    else if (finite(per.fat) && a > per.fat + 0.1 + 1e-9)
      fail('G16', `addedFatPer100g ${a} > fat ${per.fat} + 0.1`);
  }
  if (OUT_OF_HOUSE_STYLES.has(food.style) && isObject(src) && src.confidence !== 'C') {
    fail('G16', `${food.style} style must be confidence C (got ${src.confidence})`);
  }

  // G17 banned words
  const B = V.banned;
  const texts = [
    food.name,
    food.nameRoman,
    ...(Array.isArray(food.aliases) ? food.aliases : []),
  ].filter((t) => typeof t === 'string');
  for (const text of texts) {
    const tokens = words(text);
    const qualified = B.allowedQualifiers.some((q) => hasPhrase(tokens, q));
    for (const w of B.words) {
      if (hasPhrase(tokens, w) && !qualified) fail('G17', `banned word "${w}" in "${text}"`);
    }
    const lardOk =
      food.halal?.status === 'not-halal' || B.lardQualifiers.some((q) => hasPhrase(tokens, q));
    for (const w of B.lardWords) {
      if (hasPhrase(tokens, w) && !lardOk)
        fail('G17', `lard word "${w}" in "${text}" on a record that is not not-halal`);
    }
  }

  // G20 unknown fields
  for (const key of Object.keys(food))
    if (!KNOWN_FIELDS.has(key)) warn('G20', `unknown field "${key}"`);

  // G21 halal
  const H = V.halalRules;
  const h = food.halal;
  const status = V.halalStatuses.find((s) => s.id === h?.status);
  if (!isObject(h)) fail('G21', 'halal { status, reason } is missing');
  else if (!status) fail('G21', `halal.status ${JSON.stringify(h.status)} is not valid`);
  else {
    if (status.reasonRequired && !nonEmpty(h.reason))
      fail('G21', `halal.status ${h.status} needs a reason`);
    if (h.reason !== undefined && typeof h.reason !== 'string')
      fail('G21', 'halal.reason must be a string');
    if (h.status === 'not-halal') {
      if (H.notHalal.forbiddenGroups.includes(food.group))
        fail('G21', `not-halal is not allowed in group ${food.group}`);
      const reason = String(h.reason ?? '').toLowerCase();
      if (!H.notHalal.reasonMustMention.some((w) => reason.includes(w.toLowerCase()))) {
        fail(
          'G21',
          `not-halal reason must name the lard (${H.notHalal.reasonMustMention.join('/')})`,
        );
      }
      if (Array.isArray(food.slots) && food.slots.length > 0)
        fail('G21', 'not-halal foods carry no slot hints (never suggested)');
    }
  }

  // G22 meal prep
  if (food.group === 'lunchbox' && group) {
    const prep = group.prepServing;
    const legacy = group.boxServing;
    const def = servings?.find((s) => isObject(s) && s.default === true);
    if (prep) {
      const primary = Array.isArray(food.slots) ? food.slots[0] : undefined;
      if (!primary) fail('G22', 'meal-prep records need slots (primary slot first)');
      if (!def || !prep.ids.includes(def.id)) {
        fail('G22', `default serving must be one of ${prep.ids.join('/')} (got ${def?.id})`);
      } else if (primary && prep.kcalBySlot[primary] && finite(def.grams)) {
        const band = prep.kcalBySlot[primary];
        const kcal = (def.grams * kcalPer100) / 100;
        if (!(kcal >= band.min && kcal <= band.max)) {
          fail(
            'G22',
            `${def.id} gives ${kcal.toFixed(0)} kcal, outside the ${primary} band ${band.min}–${band.max}`,
          );
        }
      } else if (primary && !prep.kcalBySlot[primary]) {
        fail('G22', `primary slot ${primary} has no meal-prep band`);
      }
    } else if (legacy) {
      const kcal = def && finite(def.grams) ? (def.grams * kcalPer100) / 100 : NaN;
      if (!def || def.id !== legacy.id) fail('G22', `default serving must be "${legacy.id}"`);
      else if (!(kcal >= legacy.kcal.min && kcal <= legacy.kcal.max)) {
        fail(
          'G22',
          `box gives ${kcal.toFixed(0)} kcal, outside ${legacy.kcal.min}–${legacy.kcal.max}`,
        );
      }
    }
  }

  // G23 assumed plate (NUTRITION.md v1.6 §5.5): a `plate` or `half-plate` serving has no published
  // weight, so its label says "assumed" and its grams are a multiple of ½ katori (±2%) when the
  // food has a `katori` serving. Rule values come from RULES.vocab.servingRules.assumedPlate.
  if (servings) {
    const plate = SR.assumedPlate ?? {
      ids: ['plate', 'half-plate'],
      labelMustInclude: 'assumed',
      katoriMultipleStep: 0.5,
      tolerancePct: 2,
    };
    const katori = servings.find((s) => isObject(s) && s.id === 'katori');
    for (const s of servings) {
      if (!isObject(s) || !plate.ids.includes(s.id)) continue;
      if (
        typeof s.label !== 'string' ||
        !s.label.toLowerCase().includes(plate.labelMustInclude.toLowerCase())
      ) {
        fail(
          'G23',
          `serving ${s.id}: the label must say "${plate.labelMustInclude}" (got ${JSON.stringify(s.label)})`,
        );
      }
      if (katori && finite(katori.grams) && katori.grams > 0 && finite(s.grams)) {
        const katoris = s.grams / katori.grams;
        const nearest = Math.round(katoris / plate.katoriMultipleStep) * plate.katoriMultipleStep;
        if (
          nearest === 0 ||
          Math.abs(katoris - nearest) / nearest > plate.tolerancePct / 100 + 1e-9
        ) {
          fail(
            'G23',
            `serving ${s.id}: ${s.grams} g is ${katoris.toFixed(2)} katori, not a multiple of ${plate.katoriMultipleStep} (±${plate.tolerancePct}%)`,
          );
        }
      }
    }
  }

  return { fails, warns };
}

/** G18 (warn): members of a family share a group. */
export function checkFamilies(records) {
  const groupsByFamily = new Map();
  for (const f of records) {
    if (!isObject(f) || typeof f.family !== 'string') continue;
    if (!groupsByFamily.has(f.family)) groupsByFamily.set(f.family, new Map());
    groupsByFamily.get(f.family).set(f.id, f.group);
  }
  const warns = [];
  for (const [family, members] of groupsByFamily) {
    const groups = new Set(members.values());
    if (groups.size > 1) {
      warns.push({
        gate: 'G18',
        id: [...members.keys()].join(', '),
        message: `family ${family} mixes groups ${[...groups].join(', ')}`,
      });
    }
  }
  return warns;
}

// ---------------------------------------------------------------------------------------------
// Meal-prep recipe data gate (ARCHITECTURE §13): app/data/recipes-mealprep.js is an array of
// { foodId, ingredients, boxes, storage } for the shopping list and the use-by. Gate M1–M4:
//   M1 foodId is a known food (and unique, and a lunchbox food: warn when not)
//   M2 ingredients is a non-empty array; every ingredient is { foodId?, name?, grams, section?, note? }
//      (§13.1): grams > 0, and a foodId or a name. A foodId, when given, must be a known food. A
//      name-only line (no foodId) is valid; the count is reported as `stats.nameOnly`, not a failure.
//   M3 boxes is a whole number ≥ 1
//   M4 storage is a non-empty list of ids from RULES.mealPrep.storage. The shape is not fixed by
//      §13, so an array of ids, an array of { id } or an object keyed by id are all accepted.

/** The storage ids named by a recipe's `storage`, or null when the shape is not recognised. */
export function storageIdsOf(storage) {
  if (Array.isArray(storage)) {
    const ids = storage.map((s) => (typeof s === 'string' ? s : isObject(s) ? s.id : undefined));
    return ids;
  }
  if (isObject(storage)) return Object.keys(storage);
  return null;
}

/**
 * @param {unknown} recipes the module's array
 * @param {{ foodsById: Map<string, object>, rules: object }} ctx
 * @returns {{ fails: Issue[], warns: Issue[], stats: { ingredients: number, nameOnly: number } }}
 *   Issue = { gate, id, message }
 */
export function checkMealprepRecipes(recipes, { foodsById, rules }) {
  const fails = [];
  const warns = [];
  const stats = { ingredients: 0, nameOnly: 0 };
  const known = new Set((rules.mealPrep?.storage ?? []).map((s) => s.id));
  const fail = (id, gate, message) => fails.push({ gate, id, message });
  const warn = (id, gate, message) => warns.push({ gate, id, message });
  if (!Array.isArray(recipes)) {
    fail('(file)', 'M1', 'the module must export an array of recipes');
    return { fails, warns, stats };
  }
  const seen = new Set();
  recipes.forEach((r, i) => {
    const id = isObject(r) && typeof r.foodId === 'string' ? r.foodId : `#${i}`;
    if (!isObject(r)) return fail(id, 'M1', 'recipe is not an object');
    // M1
    if (typeof r.foodId !== 'string' || !foodsById.has(r.foodId)) {
      fail(id, 'M1', `foodId ${JSON.stringify(r.foodId)} is not a known food`);
    } else {
      if (seen.has(r.foodId)) fail(id, 'M1', 'duplicate foodId');
      seen.add(r.foodId);
      if (foodsById.get(r.foodId).group !== 'lunchbox')
        warn(
          id,
          'M1',
          `food ${r.foodId} is in group ${foodsById.get(r.foodId).group}, not lunchbox`,
        );
    }
    // M2
    if (!Array.isArray(r.ingredients) || r.ingredients.length === 0) {
      fail(id, 'M2', 'ingredients must be a non-empty array');
    } else {
      r.ingredients.forEach((ing, j) => {
        stats.ingredients += 1;
        if (!isObject(ing)) return fail(id, 'M2', `ingredient ${j} is not an object`);
        const hasFoodId = ing.foodId !== undefined && ing.foodId !== null;
        const hasName = typeof ing.name === 'string' && ing.name.trim() !== '';
        if (hasFoodId) {
          if (typeof ing.foodId !== 'string' || !foodsById.has(ing.foodId))
            fail(
              id,
              'M2',
              `ingredient ${j}: foodId ${JSON.stringify(ing.foodId)} is not a known food`,
            );
        } else if (hasName) stats.nameOnly += 1;
        else fail(id, 'M2', `ingredient ${j} has neither a foodId nor a name`);
        if (!(finite(ing.grams) && ing.grams > 0))
          fail(
            id,
            'M2',
            `ingredient ${j}: grams must be a number > 0 (got ${JSON.stringify(ing.grams)})`,
          );
      });
    }
    // M3
    if (!Number.isInteger(r.boxes) || r.boxes < 1)
      fail(id, 'M3', `boxes must be a whole number ≥ 1 (got ${JSON.stringify(r.boxes)})`);
    // M4
    const ids = storageIdsOf(r.storage);
    if (!ids || ids.length === 0) fail(id, 'M4', 'storage must list at least one storage id');
    else
      for (const sid of ids)
        if (!known.has(sid))
          fail(id, 'M4', `storage ${JSON.stringify(sid)} is not in RULES.mealPrep.storage`);
  });
  return { fails, warns, stats };
}
