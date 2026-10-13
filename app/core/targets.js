// Daily targets from a profile. Pure. The algorithm is Ayesha's (docs/NUTRITION.md); every constant
// comes from RULES (app/data/rules.js: bmr, activityLevels, goals, rails, proteinReferenceWeight,
// protein, fat, carbs, fiber, rounding, healthFlags, derivedFlags, warnings, profileLimits).
// Binding test vectors: profiles A, B, C (and any further vectors in NUTRITION.md).
// Owner: Hamza. Contract: docs/ARCHITECTURE.md §5.5. Step 0 stub: signatures are final.

/** @typedef {import('./types.js').Profile} Profile */
/** @typedef {import('./types.js').TargetPrefs} TargetPrefs */
/** @typedef {import('./types.js').TargetResult} TargetResult */
/** @typedef {import('./types.js').Nutrients} Nutrients */

const todo = (name) => {
  throw new Error(`not implemented: targets.${name}`);
};

/** Binding enum (kickoff minutes, decision 6). Must equal RULES.activityLevels[].id. */
export const ACTIVITY_LEVELS = Object.freeze([
  'sedentary',
  'light',
  'moderate',
  'very_active',
  'extra_active',
]);
/** Must equal RULES.goals[].id. */
export const GOALS = Object.freeze(['lose', 'maintain', 'gain']);

/** @param {number} weightKg @param {number} heightCm @returns {number} unrounded */
export function bmi(weightKg, heightCm) {
  return todo('bmi');
}

/**
 * RULES.proteinReferenceWeight: BMI <= bmiAbove -> weightKg; else
 * W + excessFraction * (weightKg - W) with W = referenceBmi * heightM^2.
 * @param {number} weightKg @param {number} heightCm @param {object} rules
 * @returns {number} unrounded kg
 */
export function proteinReferenceWeight(weightKg, heightCm, rules) {
  return todo('proteinReferenceWeight');
}

/**
 * Mifflin-St Jeor; Katch-McArdle when bodyFatPct is a number inside RULES.profileLimits.bodyFatPct.
 * @param {Profile} profile @param {object} rules
 * @returns {{ value: number, formula: 'mifflin'|'katch' }} unrounded
 */
export function bmr(profile, rules) {
  return todo('bmr');
}

/**
 * Checks types, enums (ACTIVITY_LEVELS, GOALS, RULES.healthFlags ids and appliesToSex, rate in
 * RULES.goals[].ratesKgPerWeek) and RULES.profileLimits. Never throws.
 * @param {unknown} profile @param {object} rules @returns {string[]} problems; [] = valid.
 */
export function validateProfile(profile, rules) {
  return todo('validateProfile');
}

/**
 * Full calculation exactly as docs/NUTRITION.md §2.2 (steps 1–12): flags, effective goal, BMR,
 * TDEE, rails, kcal, PRW, protein, fat (floor rounded up), carbs, fibre, check. warnings =
 * 'estimate' first (when ok) + codes that fired + ids of active health and derived flags.
 * @param {Profile} profile @param {object} rules RULES
 * @param {TargetPrefs} [prefs] { proteinGPerKg?, fatPct? }: the user's own choices, clamped to
 *   RULES ranges (NUTRITION.md §2.1). Binding vectors: NUTRITION.md §2.7 A–K.
 * @returns {TargetResult}
 */
export function computeTargets(profile, rules, prefs = {}) {
  return todo('computeTargets');
}

/**
 * Final daily targets: a manual override (number) wins for its key; null/undefined is ignored.
 * @param {TargetResult} computed @param {Partial<Record<keyof Nutrients, number|null>>} overrides
 * @returns {Nutrients|null} null when computed.ok is false (no targets: logging only).
 */
export function resolveTargets(computed, overrides) {
  return todo('resolveTargets');
}
