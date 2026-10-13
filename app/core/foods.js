// Food records: validation, lookup, portion and nutrient math. Pure.
// Owner: Hamza. Contract: docs/ARCHITECTURE.md §5.3. Step 0 stub: signatures are final.

/** @typedef {import('./types.js').Food} Food */
/** @typedef {import('./types.js').Serving} Serving */
/** @typedef {import('./types.js').Nutrients} Nutrients */

const todo = (name) => {
  throw new Error(`not implemented: foods.${name}`);
};

export const NUTRIENT_KEYS = Object.freeze(['kcal', 'protein', 'carbs', 'fat', 'fiber']);
export const STYLES = Object.freeze(['home', 'restaurant', 'dhaba', 'street']);
/** servingId meaning "qty is grams". Never used as a serving id inside a food record. */
export const GRAMS = 'g';

/**
 * Structural check of one record against the HARD fields (§4.2). With `rules`, also checks that
 * group, tags and slots come from RULES.vocab. Never throws.
 * @param {unknown} food @param {object|null} [rules=null] RULES from app/data/index.js
 * @returns {string[]} human-readable problems, each prefixed with the food id when known; [] = valid.
 */
export function validateFood(food, rules = null) {
  return todo('validateFood');
}

/**
 * @param {...Food[]} lists
 * @returns {Map<string, Food>} insertion order kept. Throws Error('duplicate food id: <id>').
 */
export function buildFoodIndex(...lists) {
  return todo('buildFoodIndex');
}

/** @param {Food} food @returns {Serving} the serving with `default: true`. */
export function defaultServing(food) {
  return todo('defaultServing');
}

/**
 * @param {Food} food @param {string} servingId
 * @returns {Serving|null} GRAMS ('g') -> { id: 'g', label: 'g', grams: 1 }; unknown id -> null.
 */
export function findServing(food, servingId) {
  return todo('findServing');
}

/**
 * @param {Food} food @param {string} servingId @param {number} qty finite, > 0
 * @returns {number} grams, unrounded. RangeError on unknown serving or bad qty.
 */
export function gramsForPortion(food, servingId, qty) {
  return todo('gramsForPortion');
}

/** @param {Food} food @param {number} grams >= 0 @returns {Nutrients} unrounded, five keys only. */
export function nutrientsForGrams(food, grams) {
  return todo('nutrientsForGrams');
}

/** @param {Food} food @param {string} servingId @param {number} qty @returns {Nutrients} unrounded. */
export function nutrientsForPortion(food, servingId, qty) {
  return todo('nutrientsForPortion');
}

/** @param {Nutrients[]} list @returns {Nutrients} key-wise sum; [] -> all zeros. */
export function sumNutrients(list) {
  return todo('sumNutrients');
}

/** @param {Nutrients} nutrients @param {number} factor @returns {Nutrients} */
export function scaleNutrients(nutrients, factor) {
  return todo('scaleNutrients');
}

/**
 * Atwater check from RULES.energyCheck (factors 4/4/9/2 for protein/carbs/fat/fiber; pass when
 * |stated - computed| <= max(tolerancePct% of computed, toleranceKcal)).
 * @param {import('./types.js').Per100g} per100g @param {object} rules RULES
 * @returns {{ computed: number, stated: number, delta: number, tolerance: number, ok: boolean }}
 *   delta = stated - computed.
 */
export function energyCheck(per100g, rules) {
  return todo('energyCheck');
}

/**
 * Style variants of the same dish (same `family`), including `food` itself, ordered by STYLES then
 * name. A food without a family -> [food].
 * @param {Food} food @param {Map<string, Food>} foodIndex @returns {Food[]}
 */
export function variantsOf(food, foodIndex) {
  return todo('variantsOf');
}
