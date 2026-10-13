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
 * Checks types, enums (ACTIVITY_LEVELS, GOALS, RULES.healthFlags ids, rate in the goal's
 * ratesKgPerWeek) and RULES.profileLimits. Never throws.
 * @param {unknown} profile @param {object} rules @returns {string[]} problems; [] = valid.
 */
export function validateProfile(profile, rules) {
  return todo('validateProfile');
}

/**
 * Full calculation exactly as docs/NUTRITION.md: health/derived flag effects, BMR, TDEE, rails in
 * order, protein, fat (floor rounded up), carbs as remainder, fibre, then rounding per
 * RULES.rounding. warnings = RULES.warnings keys that fired ('estimate' always first) plus the ids
 * of active health and derived flags.
 * @param {Profile} profile @param {object} rules RULES
 * @param {TargetPrefs} [prefs] the user's own protein g/kg PRW and fat % (clamped to RULES ranges)
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
