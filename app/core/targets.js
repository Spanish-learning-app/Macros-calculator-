// Daily targets from a profile. Pure. The algorithm is Ayesha's (docs/NUTRITION.md §2.2, steps
// 1–12); every constant comes from RULES (app/data/rules.js: bmr, activityLevels, goals, rails,
// proteinReferenceWeight, protein, fat, carbs, fiber, rounding, healthFlags, derivedFlags,
// warnings, profileLimits). Binding test vectors: NUTRITION.md §2.7 A–K.
// Owner: Hamza. Contract: docs/ARCHITECTURE.md §5.5.

import { round } from './units.js';

/** @typedef {import('./types.js').Profile} Profile */
/** @typedef {import('./types.js').TargetPrefs} TargetPrefs */
/** @typedef {import('./types.js').TargetResult} TargetResult */
/** @typedef {import('./types.js').Nutrients} Nutrients */

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

const SEXES = Object.freeze(['male', 'female']);
const NUTRIENTS = Object.freeze(['kcal', 'protein', 'carbs', 'fat', 'fiber']);
/** Float noise below 1e-9 is cleaned before Math.ceil (the fat floor). */
const CEIL_DECIMALS = 9;
const DAYS_PER_WEEK = 7;

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isNumber = (v) => typeof v === 'number' && Number.isFinite(v);
const show = (v) => (typeof v === 'string' ? `'${v}'` : String(v));
const ceilClean = (x) => Math.ceil(round(x, CEIL_DECIMALS));
const clampTo = (x, { min, max }) => Math.min(max, Math.max(min, x));

function checkPositive(value, name) {
  if (!(isNumber(value) && value > 0)) {
    throw new RangeError(`${name} must be a number > 0, got ${show(value)}`);
  }
}

/** @param {number} weightKg @param {number} heightCm @returns {number} unrounded */
export function bmi(weightKg, heightCm) {
  checkPositive(weightKg, 'weightKg');
  checkPositive(heightCm, 'heightCm');
  // weight / (height/100)², written so integer inputs divide exactly.
  return (weightKg * 10000) / (heightCm * heightCm);
}

/**
 * RULES.proteinReferenceWeight: BMI <= bmiAbove -> weightKg; else
 * W + excessFraction * (weightKg - W) with W = referenceBmi * heightM^2.
 * @param {number} weightKg @param {number} heightCm @param {object} rules
 * @returns {number} unrounded kg
 */
export function proteinReferenceWeight(weightKg, heightCm, rules) {
  const { bmiAbove, referenceBmi, excessFraction } = rules.proteinReferenceWeight;
  if (bmi(weightKg, heightCm) <= bmiAbove) return weightKg;
  const w = (referenceBmi * heightCm * heightCm) / 10000;
  return w + excessFraction * (weightKg - w);
}

function usesKatch(profile, rules) {
  const limits = rules.profileLimits.bodyFatPct;
  const bf = profile.bodyFatPct;
  return isNumber(bf) && bf >= limits.min && bf <= limits.max;
}

/**
 * Mifflin-St Jeor; Katch-McArdle when bodyFatPct is a number inside RULES.profileLimits.bodyFatPct.
 * @param {Profile} profile @param {object} rules
 * @returns {{ value: number, formula: 'mifflin'|'katch' }} unrounded
 */
export function bmr(profile, rules) {
  if (!isObject(profile)) throw new TypeError('profile must be an object');
  if (usesKatch(profile, rules)) {
    const { constant, perKgLeanMass } = rules.bmr.katchMcArdle;
    const leanKg = profile.weightKg * (1 - profile.bodyFatPct / 100);
    return { value: constant + perKgLeanMass * leanKg, formula: 'katch' };
  }
  const m = rules.bmr.mifflinStJeor;
  if (!Object.hasOwn(m.constant, profile.sex)) throw new RangeError(`unknown sex ${show(profile.sex)}`);
  const value =
    m.perKg * profile.weightKg +
    m.perCm * profile.heightCm +
    m.perYear * profile.ageYears +
    m.constant[profile.sex];
  return { value, formula: 'mifflin' };
}

function inLimits(value, limits) {
  return isNumber(value) && (!limits || (value >= limits.min && value <= limits.max));
}

/**
 * Checks types, enums (ACTIVITY_LEVELS, GOALS, RULES.healthFlags ids and appliesToSex, rate in
 * RULES.goals[].ratesKgPerWeek) and RULES.profileLimits. Never throws.
 * @param {unknown} profile @param {object} rules @returns {string[]} problems; [] = valid.
 */
export function validateProfile(profile, rules) {
  try {
    if (!isObject(profile)) return ['profile must be an object'];
    const p = [];
    const limits = rules?.profileLimits ?? {};
    const sexes = Array.isArray(rules?.sexes) ? rules.sexes.map((s) => s.id) : SEXES;
    if (!sexes.includes(profile.sex)) p.push(`sex must be one of ${sexes.join(', ')}`);
    for (const key of ['ageYears', 'heightCm', 'weightKg']) {
      const l = limits[key];
      if (!inLimits(profile[key], l)) {
        p.push(`${key} must be a number${l ? ` from ${l.min} to ${l.max}` : ''}`);
      }
    }
    if (profile.bodyFatPct != null && !inLimits(profile.bodyFatPct, limits.bodyFatPct)) {
      const l = limits.bodyFatPct;
      p.push(`bodyFatPct must be a number${l ? ` from ${l.min} to ${l.max}` : ''} when given`);
    }
    if (!ACTIVITY_LEVELS.includes(profile.activity)) {
      p.push(`activity must be one of ${ACTIVITY_LEVELS.join(', ')}`);
    }
    if (!GOALS.includes(profile.goal)) p.push(`goal must be one of ${GOALS.join(', ')}`);
    else {
      const rates = rules?.goals?.find((g) => g.id === profile.goal)?.ratesKgPerWeek;
      if (Array.isArray(rates) && !rates.includes(profile.rateKgPerWeek)) {
        p.push(`rateKgPerWeek for '${profile.goal}' must be one of ${rates.join(', ')}`);
      }
    }
    if (typeof profile.lifts !== 'boolean') p.push('lifts must be true or false');
    if (!Array.isArray(profile.healthFlags)) p.push('healthFlags must be an array of flag ids');
    else {
      const flags = Array.isArray(rules?.healthFlags) ? rules.healthFlags : [];
      for (const id of profile.healthFlags) {
        const flag = flags.find((f) => f.id === id);
        if (!flag) p.push(`health flag ${show(id)} is not in RULES.healthFlags`);
        else if (Array.isArray(flag.appliesToSex) && !flag.appliesToSex.includes(profile.sex)) {
          p.push(`health flag '${id}' does not apply to sex ${show(profile.sex)}`);
        }
      }
    }
    return p;
  } catch (error) {
    return [`profile could not be validated (${error?.message ?? error})`];
  }
}

/** Throws on input the algorithm cannot run on. Limits and allowed rates are validateProfile's. */
function checkComputable(profile) {
  if (!isObject(profile)) throw new TypeError('profile must be an object');
  if (!SEXES.includes(profile.sex)) throw new RangeError(`unknown sex ${show(profile.sex)}`);
  checkPositive(profile.ageYears, 'ageYears');
  checkPositive(profile.heightCm, 'heightCm');
  checkPositive(profile.weightKg, 'weightKg');
  if (!ACTIVITY_LEVELS.includes(profile.activity)) {
    throw new RangeError(`unknown activity ${show(profile.activity)}`);
  }
  if (!GOALS.includes(profile.goal)) throw new RangeError(`unknown goal ${show(profile.goal)}`);
  const rate = profile.rateKgPerWeek;
  if (profile.goal !== 'maintain' && !isNumber(rate)) {
    throw new RangeError(`rateKgPerWeek must be a number, got ${show(rate)}`);
  }
  if (profile.healthFlags != null && !Array.isArray(profile.healthFlags)) {
    throw new TypeError('healthFlags must be an array');
  }
}

/** A user preference: null/undefined = none; a number is clamped; anything else is bad input. */
function preference(value, range, name) {
  if (value == null) return null;
  if (!isNumber(value)) throw new RangeError(`${name} must be a number or null, got ${show(value)}`);
  return clampTo(value, range);
}

/** Step 2: the active health flags (ticked, for this sex) and derived flags (matched). */
function activeFlags(profile, rules, bmiValue) {
  const ticked = profile.healthFlags ?? [];
  const health = rules.healthFlags.filter(
    (f) => ticked.includes(f.id) && (f.appliesToSex ?? SEXES).includes(profile.sex),
  );
  const derived = rules.derivedFlags.filter(({ when = {} }) => {
    const tests = [];
    if (when.ageYearsBelow !== undefined) tests.push(profile.ageYears < when.ageYearsBelow);
    if (when.ageYearsAbove !== undefined) tests.push(profile.ageYears > when.ageYearsAbove);
    if (when.bmiBelow !== undefined) tests.push(bmiValue < when.bmiBelow);
    return tests.length > 0 && tests.every(Boolean);
  });
  return [...health, ...derived];
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
  checkComputable(profile);
  const R = rules;
  const proteinPref = preference(prefs?.proteinGPerKg, R.protein.overrideGPerKgPrw, 'proteinGPerKg');
  const fatPref = preference(prefs?.fatPct, R.fat.pctOfKcalRange, 'fatPct');
  const codes = [];
  const fire = (code) => codes.includes(code) || codes.push(code);

  // 1. BMI
  const bmiValue = bmi(profile.weightKg, profile.heightCm);

  // 2. Flags
  const flags = activeFlags(profile, R, bmiValue);
  const flagIds = flags.map((f) => f.id);
  if (flags.some((f) => f.effect?.noTargets)) {
    return {
      ok: false,
      kcal: null,
      protein: null,
      carbs: null,
      fat: null,
      fiber: null,
      bmr: null,
      tdee: null,
      bmi: bmiValue,
      prw: null,
      bmrFormula: null,
      effectiveGoal: profile.goal,
      energyDelta: null,
      effectiveRateKgPerWeek: null,
      warnings: [...flagIds, 'no_targets'],
    };
  }

  // 3. Effective goal
  let goal = profile.goal;
  const lock = flags.find((f) => f.effect?.lockGoal)?.effect.lockGoal;
  if (lock !== undefined) {
    if (lock !== goal) fire('goal_changed');
    goal = lock;
  } else if (flags.some((f) => (f.effect?.disallowGoals ?? []).includes(goal))) {
    goal = 'maintain';
    fire('goal_changed');
  }

  // 4–5. BMR and TDEE
  const { value: bmrValue, formula } = bmr(profile, R);
  const tdee = bmrValue * R.activityLevels.find((a) => a.id === profile.activity).factor;

  // 6. Requested change
  const perDay = R.energy.kcalPerKgBodyWeight / DAYS_PER_WEEK;
  const rate = goal === 'maintain' ? 0 : Math.max(0, profile.rateKgPerWeek);
  const requested = rate * perDay;

  // 7. Rails
  const rails = R.rails;
  let target = tdee;
  if (goal === 'lose') {
    const cap = Math.min(
      (tdee * rails.maxDeficitPctOfTdee) / 100,
      rails.maxDeficitKcal,
      ((profile.weightKg * rails.maxLossPctBodyWeightPerWeek) / 100) * perDay,
    );
    if (requested > cap) fire('deficit_capped');
    target = tdee - Math.min(requested, cap);
    const floor = Math.min(rails.minKcalWhenLosing[profile.sex], tdee);
    if (target < floor) {
      target = floor;
      fire('kcal_floor');
    }
  } else if (goal === 'gain') {
    const cap = (tdee * rails.maxSurplusPctOfTdee) / 100;
    if (requested > cap) fire('surplus_capped');
    target = tdee + Math.min(requested, cap);
  }
  const energyDelta = target - tdee;
  const effectiveRateKgPerWeek = energyDelta / perDay;

  // 8. kcal
  const step = R.rounding.kcalStep;
  const kcal = round(target / step) * step;

  // 9. Protein reference weight
  const prw = proteinReferenceWeight(profile.weightKg, profile.heightCm, R);

  // 10. Protein
  let gPerKg = proteinPref ?? R.protein.gPerKgPrw[profile.lifts ? 'lift' : 'noLift'][goal];
  const older = R.protein.olderAdult;
  if (proteinPref === null && profile.ageYears >= older.minAgeYears) {
    gPerKg = Math.max(gPerKg, older.minGPerKgPrw);
  }
  const caps = flags.map((f) => f.effect?.maxProteinGPerKgPrw).filter(isNumber);
  if (caps.length > 0 && gPerKg > Math.min(...caps)) {
    gPerKg = Math.min(...caps);
    fire('protein_capped');
  }
  const protein = round(gPerKg * prw);

  // 11. Fat, carbs, fibre
  const factors = R.energy.factors;
  const pct = fatPref ?? R.fat.defaultPctOfKcal;
  let fat = round((pct * kcal) / (100 * factors.fat));
  const fatFloor = ceilClean(
    Math.max((R.fat.floorPctOfKcal * kcal) / (100 * factors.fat), R.fat.floorGPerKgPrw * prw),
  );
  if (fat < fatFloor) {
    fat = fatFloor;
    fire('fat_floor');
  }
  const carbs = Math.max(
    0,
    round((kcal - factors.protein * protein - factors.fat * fat) / factors.carbs),
  );
  if (carbs < R.carbs.noteBelowG) fire('low_carbs');
  const fiber = Math.max(R.fiber.minG, round((R.fiber.gPer1000Kcal * kcal) / 1000));

  // 12. Check (true by construction unless carbs were clamped at 0, which low_carbs reports)
  const energy = factors.protein * protein + factors.carbs * carbs + factors.fat * fat;
  if (carbs > 0 && Math.abs(energy - kcal) > R.rounding.checkToleranceKcal) {
    throw new Error(`targets check failed: ${energy} kcal from macros vs ${kcal}`);
  }

  const warnings = ['estimate', ...codes];
  for (const id of flagIds) if (!warnings.includes(id)) warnings.push(id);
  return {
    ok: true,
    kcal,
    protein,
    carbs,
    fat,
    fiber,
    bmr: bmrValue,
    tdee,
    bmi: bmiValue,
    prw,
    bmrFormula: formula,
    effectiveGoal: goal,
    energyDelta,
    effectiveRateKgPerWeek,
    warnings,
  };
}

/**
 * Final daily targets: a manual override (number) wins for its key; null/undefined is ignored.
 * @param {TargetResult} computed @param {Partial<Record<keyof Nutrients, number|null>>} overrides
 * @returns {Nutrients|null} null when computed.ok is false (no targets: logging only).
 */
export function resolveTargets(computed, overrides) {
  if (!computed?.ok) return null;
  const out = {};
  for (const key of NUTRIENTS) {
    const o = overrides?.[key];
    if (o == null) out[key] = computed[key];
    else if (isNumber(o) && o >= 0) out[key] = o;
    else throw new RangeError(`override ${key} must be a number >= 0 or null, got ${show(o)}`);
  }
  return out;
}
