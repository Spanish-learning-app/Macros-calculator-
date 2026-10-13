// Daily targets from a profile. Pure. Formulas, rails, flags and rounding are Ayesha's
// (docs/NUTRITION.md, values in RULES.targets). Binding test vectors: profiles A, B, C.
// Owner: Hamza. Contract: docs/ARCHITECTURE.md §5.5. Step 0 stub: signatures are final.

/** @typedef {import('./types.js').Profile} Profile */
/** @typedef {import('./types.js').TargetResult} TargetResult */
/** @typedef {import('./types.js').Nutrients} Nutrients */

const todo = (name) => {
  throw new Error(`not implemented: targets.${name}`);
};

export const ACTIVITY_LEVELS = Object.freeze([
  'sedentary',
  'light',
  'moderate',
  'very_active',
  'extra_active',
]);
export const GOALS = Object.freeze(['lose', 'maintain', 'gain']);
export const HEALTH_FLAGS = Object.freeze([
  'pregnant',
  'breastfeeding',
  'eating_disorder',
  'kidney_disease',
  'diabetes_hypo_risk',
]);

/** Machine codes in TargetResult.flags. The UI maps each code to text. */
export const TARGET_FLAGS = Object.freeze([
  'AGE_UNDER_18', // ok: false, logging only
  'AGE_OVER_80', // ok: false, formulas not validated
  'BODY_FAT_IGNORED', // bodyFatPct outside RULES range -> Mifflin used
  'RAIL_DEFICIT_CAP', // deficit capped (pct of TDEE or absolute kcal)
  'RAIL_LOSS_1PCT', // loss capped at 1% body weight per week
  'RAIL_SURPLUS_CAP', // surplus capped (pct of TDEE)
  'RAIL_KCAL_FLOOR', // raised to the sex-specific floor
  'GOAL_LOCKED_MAINTAIN', // pregnant / breastfeeding
  'NO_WEIGHT_LOSS', // eating disorder or BMI under 18.5: lose -> maintain
  'HIDE_CALORIES_AVAILABLE', // eating disorder: offer to hide calorie numbers
  'PROTEIN_KIDNEY_CAP', // kidney disease: protein capped
  'HYPO_RISK', // insulin/sulfonylurea note on deficits and fasting
  'PROTEIN_PREF_CLAMPED', // user protein g/kg outside the allowed range
  'FAT_PREF_CLAMPED', // user fat % outside the allowed range
  'LOW_CARB', // carbs under RULES threshold; number kept
]);

/** @param {number} weightKg @param {number} heightCm @returns {number} unrounded */
export function bmi(weightKg, heightCm) {
  return todo('bmi');
}

/**
 * Protein reference weight: actual weight when BMI <= threshold, else W25 + factor * (kg - W25).
 * @param {number} weightKg @param {number} heightCm @param {object} rules RULES
 * @returns {number} unrounded kg
 */
export function proteinReferenceWeight(weightKg, heightCm, rules) {
  return todo('proteinReferenceWeight');
}

/**
 * Mifflin-St Jeor, or Katch-McArdle when bodyFatPct is inside the RULES range.
 * @param {Profile} profile @param {object} rules @returns {{ value: number, formula: 'mifflin'|'katch' }}
 */
export function bmr(profile, rules) {
  return todo('bmr');
}

/** @param {unknown} profile @param {object} rules @returns {string[]} problems; [] = valid. */
export function validateProfile(profile, rules) {
  return todo('validateProfile');
}

/**
 * Full target calculation per NUTRITION.md: unrounded maths and rails in order, then kcal to the
 * nearest RULES step (10), protein and fat to 1 g, carbs from the rounded figures, fibre to 1 g.
 * @param {Profile} profile @param {object} rules RULES
 * @param {import('./types.js').TargetPrefs} [prefs] user overrides of protein g/kg and fat %
 * @returns {TargetResult}
 */
export function computeTargets(profile, rules, prefs = {}) {
  return todo('computeTargets');
}

/**
 * Final daily targets: manual overrides win per key (a null/undefined override is ignored).
 * @param {TargetResult} computed @param {Partial<Nutrients>} overrides
 * @returns {Nutrients|null} null when computed.ok is false.
 */
export function resolveTargets(computed, overrides) {
  return todo('resolveTargets');
}
