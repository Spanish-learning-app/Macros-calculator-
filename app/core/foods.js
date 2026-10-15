// Food records: validation, lookup, portion and nutrient math. Pure.
// Owner: Hamza. Contract: docs/ARCHITECTURE.md §5.3.

import { round } from './units.js';

/** @typedef {import('./types.js').Food} Food */
/** @typedef {import('./types.js').Serving} Serving */
/** @typedef {import('./types.js').Nutrients} Nutrients */

export const NUTRIENT_KEYS = Object.freeze(['kcal', 'protein', 'carbs', 'fat', 'fiber']);
// RULES.vocab.styles order, which is also the rank: 'home-light' (kam tel, Sprint 3) right after 'home'.
export const STYLES = Object.freeze(['home', 'home-light', 'restaurant', 'dhaba', 'street']);
/** servingId meaning "qty is grams". Never used as a serving id inside a food record. */
export const GRAMS = 'g';
/** Binding (meeting 002, decision 4). Order = best to worst ("worst status" of a recipe, Sprint 2). */
export const HALAL_STATUSES = Object.freeze(['halal', 'check', 'not-halal']);
/** Serving id reserved for "1 box" of a lunch box (meeting 002, decision 8). */
export const BOX = 'box';

const ID_PREFIXES = ['pk-', 'es-', 'med-', 'intl-', 'my-'];
const KEBAB_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const OPTIONAL_PER100G = ['sugars', 'satFat', 'sodium'];
/** Tags removed by meeting 002: halal is the `halal` field now. */
const OLD_HALAL_TAGS = new Set(['halal', 'halal-check']);
/** Float noise below this is cleaned from energyCheck results (1e-9 kcal). */
const ENERGY_DECIMALS = 9;

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isNonEmptyString = (v) => typeof v === 'string' && v.trim() !== '';
const isNonNegative = (v) => Number.isFinite(v) && v >= 0;
const show = (v) => (typeof v === 'string' ? `'${v}'` : String(v));

function vocabIds(list) {
  return Array.isArray(list) ? new Set(list.map((x) => x?.id)) : null;
}

/** Problems with the structure of a record. Each message names the field. */
function structuralProblems(food) {
  const p = [];
  const { id } = food;
  if (id === undefined) p.push('id is missing');
  else if (!isNonEmptyString(id)) p.push(`id must be a non-empty string, got ${show(id)}`);
  else if (!KEBAB_RE.test(id)) p.push(`id ${show(id)} must be kebab-case`);
  else if (!ID_PREFIXES.some((prefix) => id.startsWith(prefix))) {
    p.push(`id ${show(id)} needs a prefix: ${ID_PREFIXES.join(', ')}`);
  }

  if (!isNonEmptyString(food.name)) p.push('name must be a non-empty string');
  for (const key of ['nameUr', 'nameRoman']) {
    if (food[key] !== undefined && typeof food[key] !== 'string') p.push(`${key} must be a string`);
  }
  if (!Array.isArray(food.aliases) || !food.aliases.every((a) => typeof a === 'string')) {
    p.push('aliases must be an array of strings (may be empty)');
  }
  if (!isNonEmptyString(food.group)) p.push('group must be a non-empty string');
  if (!isNonEmptyString(food.state)) p.push('state must be a non-empty string');
  if (food.style !== undefined && !isNonEmptyString(food.style)) p.push('style must be a string');
  if (food.family !== undefined && !isNonEmptyString(food.family)) {
    p.push('family must be a non-empty string');
  }

  if (food.per100g === undefined) p.push('per100g is missing');
  else if (!isObject(food.per100g)) p.push('per100g must be an object');
  else {
    for (const key of NUTRIENT_KEYS) {
      if (!isNonNegative(food.per100g[key])) {
        p.push(`per100g.${key} must be a number >= 0, got ${show(food.per100g[key])}`);
      }
    }
    for (const key of OPTIONAL_PER100G) {
      const v = food.per100g[key];
      if (v !== undefined && !isNonNegative(v)) {
        p.push(`per100g.${key} must be a number >= 0 when present, got ${show(v)}`);
      }
    }
  }
  if (food.addedFatPer100g !== undefined && !isNonNegative(food.addedFatPer100g)) {
    p.push(`addedFatPer100g must be a number >= 0, got ${show(food.addedFatPer100g)}`);
  }

  p.push(...servingProblems(food.servings));

  if (!Array.isArray(food.tags) || !food.tags.every((t) => typeof t === 'string')) {
    p.push('tags must be an array of strings');
  } else {
    for (const tag of food.tags) {
      if (OLD_HALAL_TAGS.has(tag)) {
        p.push(`tag ${show(tag)} is no longer allowed: use halal.status (meeting 002)`);
      }
    }
  }

  p.push(...halalProblems(food.halal));

  if (food.slots !== undefined) {
    if (!Array.isArray(food.slots) || !food.slots.every((s) => typeof s === 'string')) {
      p.push('slots must be an array of slot ids');
    }
  }

  if (food.source === undefined) p.push('source is missing');
  else if (!isObject(food.source)) p.push('source must be an object');
  else if (!isNonEmptyString(food.source.citation)) {
    p.push('source.citation must be a non-empty string');
  }
  return p;
}

function servingProblems(servings) {
  if (!Array.isArray(servings) || servings.length === 0) {
    return ['servings must be a non-empty array'];
  }
  const p = [];
  const seen = new Set();
  let defaults = 0;
  servings.forEach((s, i) => {
    const where = `servings[${i}]`;
    if (!isObject(s)) {
      p.push(`${where} must be an object`);
      return;
    }
    if (!isNonEmptyString(s.id)) p.push(`${where}.id must be a non-empty string`);
    else if (s.id === GRAMS) p.push(`${where}: serving id 'g' is reserved for grams`);
    else if (seen.has(s.id)) p.push(`${where}: serving id ${show(s.id)} is a duplicate`);
    else seen.add(s.id);
    if (!isNonEmptyString(s.label)) p.push(`${where}.label must be a non-empty string`);
    if (!(Number.isFinite(s.grams) && s.grams > 0)) {
      p.push(`${where}.grams must be a number > 0, got ${show(s.grams)}`);
    }
    if (s.default !== undefined && typeof s.default !== 'boolean') {
      p.push(`${where}.default must be a boolean`);
    }
    if (s.default === true) defaults += 1;
  });
  if (defaults !== 1) {
    p.push(`servings: exactly one default serving (default: true) is required, found ${defaults}`);
  }
  return p;
}

function halalProblems(halal) {
  if (halal === undefined) return ['halal is missing: { status, reason? } is required'];
  if (!isObject(halal)) return ['halal must be an object { status, reason? }'];
  if (!HALAL_STATUSES.includes(halal.status)) {
    return [`halal.status ${show(halal.status)} must be one of ${HALAL_STATUSES.join(', ')}`];
  }
  if (halal.status !== 'halal' && !isNonEmptyString(halal.reason)) {
    return [`halal.reason is required (non-empty) when status is '${halal.status}'`];
  }
  if (halal.reason !== undefined && typeof halal.reason !== 'string') {
    return ['halal.reason must be a string'];
  }
  return [];
}

/** Vocabulary membership against RULES. Only fields that are structurally sound are checked. */
function vocabularyProblems(food, rules) {
  const p = [];
  const vocab = rules.vocab ?? {};
  const groups = vocabIds(vocab.groups);
  if (groups && isNonEmptyString(food.group) && !groups.has(food.group)) {
    p.push(`group ${show(food.group)} is not in RULES.vocab.groups`);
  }
  const tags = vocabIds(vocab.tags);
  if (tags && Array.isArray(food.tags)) {
    for (const tag of food.tags) {
      if (typeof tag === 'string' && !OLD_HALAL_TAGS.has(tag) && !tags.has(tag)) {
        p.push(`tag ${show(tag)} is not in RULES.vocab.tags`);
      }
    }
  }
  const styles = vocabIds(vocab.styles);
  if (styles && isNonEmptyString(food.style) && !styles.has(food.style)) {
    p.push(`style ${show(food.style)} is not in RULES.vocab.styles`);
  }
  const slotIds = new Set(
    [rules.mealSlots?.default, rules.mealSlots?.ramadan].flatMap((list) =>
      Array.isArray(list) ? list.map((s) => s?.id) : [],
    ),
  );
  if (slotIds.size > 0 && Array.isArray(food.slots)) {
    for (const slot of food.slots) {
      if (typeof slot === 'string' && !slotIds.has(slot)) {
        p.push(`slot ${show(slot)} is not in RULES.mealSlots.default or .ramadan`);
      }
    }
  }
  if (isObject(food.source)) {
    const methods = vocabIds(vocab.sourceMethods);
    if (methods && food.source.method !== undefined && !methods.has(food.source.method)) {
      p.push(`source.method ${show(food.source.method)} is not in RULES.vocab.sourceMethods`);
    }
    const grades = vocabIds(vocab.confidenceGrades);
    if (grades && food.source.confidence !== undefined && !grades.has(food.source.confidence)) {
      p.push(
        `source.confidence ${show(food.source.confidence)} is not in RULES.vocab.confidenceGrades`,
      );
    }
  }
  return p;
}

/**
 * Structural check of one record against the HARD fields (§4.2), including
 * `halal: { status, reason }` (status in HALAL_STATUSES; non-empty reason unless 'halal'). With `rules`, also checks
 * membership: group in RULES.vocab.groups, tags in RULES.vocab.tags, style in RULES.vocab.styles,
 * slots in RULES.mealSlots.default or .ramadan, source.method in RULES.vocab.sourceMethods,
 * source.confidence in RULES.vocab.confidenceGrades. Numeric plausibility (energy, ranges, tagRules, banned words) is the data
 * gate's job (tests/data), not this function's. Never throws.
 * @param {unknown} food @param {object|null} [rules=null] RULES from app/data/index.js
 * @returns {string[]} human-readable problems, each prefixed with the food id when known; [] = valid.
 */
export function validateFood(food, rules = null) {
  let prefix = 'food: ';
  try {
    if (!isObject(food))
      return [`food: must be an object, got ${food === null ? 'null' : typeof food}`];
    if (isNonEmptyString(food.id)) prefix = `${food.id}: `;
    const problems = structuralProblems(food);
    if (isObject(rules)) problems.push(...vocabularyProblems(food, rules));
    return problems.map((msg) => prefix + msg);
  } catch (error) {
    return [`${prefix}could not be validated (${error?.message ?? error})`];
  }
}

/**
 * @param {...Food[]} lists
 * @returns {Map<string, Food>} insertion order kept. Throws Error('duplicate food id: <id>').
 */
export function buildFoodIndex(...lists) {
  const index = new Map();
  for (const list of lists) {
    if (!Array.isArray(list)) throw new TypeError('buildFoodIndex takes arrays of foods');
    for (const food of list) {
      if (!isObject(food) || typeof food.id !== 'string') {
        throw new TypeError('every food needs a string id');
      }
      if (index.has(food.id)) throw new Error(`duplicate food id: ${food.id}`);
      index.set(food.id, food);
    }
  }
  return index;
}

function checkFood(food) {
  if (!isObject(food) || !Array.isArray(food.servings)) {
    throw new TypeError('food must be a food record with servings');
  }
}

/** @param {Food} food @returns {Serving} the serving with `default: true`. */
export function defaultServing(food) {
  checkFood(food);
  const serving = food.servings.find((s) => s?.default === true) ?? food.servings[0];
  if (!serving) throw new TypeError(`food ${food.id} has no servings`);
  return serving;
}

/**
 * @param {Food} food @param {string} servingId
 * @returns {Serving|null} GRAMS ('g') -> { id: 'g', label: 'g', grams: 1 }; unknown id -> null.
 */
export function findServing(food, servingId) {
  checkFood(food);
  if (servingId === GRAMS) return { id: GRAMS, label: 'g', grams: 1 };
  return food.servings.find((s) => s?.id === servingId) ?? null;
}

/**
 * @param {Food} food @param {string} servingId @param {number} qty finite, > 0
 * @returns {number} grams, unrounded. RangeError on unknown serving or bad qty.
 */
export function gramsForPortion(food, servingId, qty) {
  const serving = findServing(food, servingId);
  if (!serving) throw new RangeError(`food ${food.id} has no serving ${show(servingId)}`);
  if (!(Number.isFinite(qty) && qty > 0)) {
    throw new RangeError(`qty must be a finite number > 0, got ${show(qty)}`);
  }
  return serving.grams * qty;
}

/** @param {Food} food @param {number} grams >= 0 @returns {Nutrients} unrounded, five keys only. */
export function nutrientsForGrams(food, grams) {
  if (!isObject(food) || !isObject(food.per100g)) throw new TypeError('food needs per100g');
  if (!isNonNegative(grams))
    throw new RangeError(`grams must be a number >= 0, got ${show(grams)}`);
  const out = {};
  for (const key of NUTRIENT_KEYS) out[key] = (food.per100g[key] * grams) / 100;
  return out;
}

/** @param {Food} food @param {string} servingId @param {number} qty @returns {Nutrients} unrounded. */
export function nutrientsForPortion(food, servingId, qty) {
  return nutrientsForGrams(food, gramsForPortion(food, servingId, qty));
}

/** @param {Nutrients[]} list @returns {Nutrients} key-wise sum; [] -> all zeros. */
export function sumNutrients(list) {
  if (!Array.isArray(list)) throw new TypeError('sumNutrients takes an array');
  const out = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  for (const n of list) {
    for (const key of NUTRIENT_KEYS) out[key] += n?.[key] ?? 0;
  }
  return out;
}

/** @param {Nutrients} nutrients @param {number} factor @returns {Nutrients} */
export function scaleNutrients(nutrients, factor) {
  if (!isObject(nutrients)) throw new TypeError('nutrients must be an object');
  if (!Number.isFinite(factor)) throw new RangeError(`factor must be finite, got ${show(factor)}`);
  const out = {};
  for (const key of NUTRIENT_KEYS) out[key] = (nutrients[key] ?? 0) * factor;
  return out;
}

/**
 * Atwater check from RULES.energy: computed = Σ factors[k] * per100g[k] (4/4/9/2 for
 * protein/carbs/fat/fiber); pass when |stated - computed| <= max(stated * tolerance.pct / 100,
 * tolerance.kcal).
 * @param {import('./types.js').Per100g} per100g @param {object} rules RULES
 * @returns {{ computed: number, stated: number, delta: number, tolerance: number, ok: boolean }}
 *   delta = stated - computed.
 */
export function energyCheck(per100g, rules) {
  if (!isObject(per100g)) throw new TypeError('per100g must be an object');
  const energy = rules?.energy;
  if (!isObject(energy?.factors) || !isObject(energy?.tolerance)) {
    throw new TypeError('rules.energy.factors and rules.energy.tolerance are required');
  }
  let raw = 0;
  for (const [key, factor] of Object.entries(energy.factors)) raw += factor * per100g[key];
  const stated = per100g.kcal;
  if (!Number.isFinite(raw) || !Number.isFinite(stated)) {
    return { computed: raw, stated, delta: stated - raw, tolerance: NaN, ok: false };
  }
  const computed = round(raw, ENERGY_DECIMALS);
  const delta = round(stated - computed, ENERGY_DECIMALS);
  const tolerance = round(
    Math.max((stated * energy.tolerance.pct) / 100, energy.tolerance.kcal),
    ENERGY_DECIMALS,
  );
  return { computed, stated, delta, tolerance, ok: Math.abs(delta) <= tolerance };
}

function styleRank(food) {
  const i = STYLES.indexOf(food.style);
  return i === -1 ? STYLES.length : i;
}

/**
 * Style variants of the same dish (same `family`), including `food` itself, ordered by style (home,
 * home-light, restaurant, dhaba, street; no style last) then name. A food without a family -> [food].
 * @param {Food} food @param {Map<string, Food>} foodIndex @returns {Food[]}
 */
export function variantsOf(food, foodIndex) {
  if (!isObject(food)) throw new TypeError('food must be a food record');
  if (!food.family) return [food];
  const variants = [food];
  for (const other of foodIndex.values()) {
    if (other.family === food.family && other.id !== food.id) variants.push(other);
  }
  return variants.sort(
    (a, b) => styleRank(a) - styleRank(b) || String(a.name).localeCompare(String(b.name), 'en'),
  );
}
