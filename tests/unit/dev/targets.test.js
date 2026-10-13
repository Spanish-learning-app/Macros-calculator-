// Author tests for app/core/targets.js (ARCHITECTURE §5.5, NUTRITION.md §2). Owner: Hamza.
// The binding vectors A–K (NUTRITION.md §2.7): rounded outputs exact, unrounded ±0.01, warnings
// as a set with 'estimate' first when ok.
import test from 'node:test';
import assert from 'node:assert/strict';
import { RULES } from '../../fixtures/index.js';
import {
  ACTIVITY_LEVELS,
  GOALS,
  bmi,
  proteinReferenceWeight,
  bmr,
  validateProfile,
  computeTargets,
  resolveTargets,
} from '../../../app/core/targets.js';
import { deepFreeze, close } from './helpers.js';

const FROZEN_RULES = deepFreeze(structuredClone(RULES));

function profile(
  sex,
  ageYears,
  heightCm,
  weightKg,
  activity,
  goal,
  rate,
  lifts,
  flags = [],
  extra = {},
) {
  return deepFreeze({
    sex,
    ageYears,
    heightCm,
    weightKg,
    activity,
    goal,
    rateKgPerWeek: rate,
    lifts,
    healthFlags: flags,
    ...extra,
  });
}

const P = {
  A: profile('male', 30, 175, 80, 'moderate', 'lose', 0.5, true),
  B: profile('female', 35, 160, 85, 'sedentary', 'lose', 0.75, false),
  C: profile('male', 30, 175, 80, 'moderate', 'lose', 0.5, true, [], { bodyFatPct: 18 }),
  D: profile('male', 25, 180, 70, 'very_active', 'gain', 0.5, true),
  E: profile('female', 60, 150, 50, 'sedentary', 'lose', 0.5, false),
  F: profile('male', 68, 170, 65, 'light', 'maintain', 0, false),
  G: profile('male', 55, 172, 95, 'light', 'lose', 1.0, true, [
    'kidney_disease',
    'diabetes_hypo_risk',
  ]),
  H: profile('female', 28, 163, 62, 'light', 'lose', 0.5, false, ['pregnant']),
  I: profile('female', 16, 158, 50, 'light', 'lose', 0.5, false),
  J: profile('female', 24, 165, 48, 'light', 'lose', 0.5, false),
};
P.K = P.A;
const PREFS = { K: deepFreeze({ proteinGPerKg: 2.2, fatPct: 25 }) };

// [bmr, tdee, energyDelta | null, kcal, P, F, C, fibre, warnings, extra]
const VECTORS = {
  A: [
    1748.75,
    2710.56,
    -550,
    2160,
    156,
    72,
    222,
    30,
    [],
    { bmi: 26.12, prw: 77.94, formula: 'mifflin' },
  ],
  B: [
    1514.0,
    1816.8,
    -454.2,
    1360,
    87,
    45,
    152,
    25,
    ['deficit_capped'],
    { bmi: 33.2, prw: 72.4, rate: -0.41 },
  ],
  C: [1786.96, 2769.79, -550, 2220, 156, 74, 233, 31, [], { formula: 'katch' }],
  D: [1705.0, 2941.13, 550, 3490, 126, 116, 486, 49, [], { rate: 0.5 }],
  E: [976.5, 1171.8, 0, 1170, 60, 39, 145, 25, ['deficit_capped', 'kcal_floor'], {}],
  F: [1377.5, 1894.06, 0, 1890, 78, 63, 253, 26, [], {}],
  G: [
    1755.0,
    2413.13,
    -603.28,
    1810,
    66,
    60,
    252,
    25,
    ['kidney_disease', 'diabetes_hypo_risk', 'deficit_capped', 'protein_capped'],
    { bmi: 32.11, prw: 82.38 },
  ],
  H: [
    1337.75,
    1839.41,
    0,
    1840,
    62,
    61,
    261,
    26,
    ['pregnant', 'goal_changed'],
    { goal: 'maintain' },
  ],
  J: [
    1230.25,
    1691.59,
    0,
    1690,
    48,
    56,
    249,
    25,
    ['underweight', 'goal_changed'],
    { goal: 'maintain' },
  ],
  K: [1748.75, 2710.56, -550, 2160, 171, 60, 234, 30, [], {}],
};

function assertWarnings(result, expected) {
  if (result.ok) assert.equal(result.warnings[0], 'estimate', 'estimate comes first');
  const rest = result.ok ? result.warnings.slice(1) : result.warnings;
  assert.deepEqual(new Set(rest), new Set(expected));
  assert.equal(rest.length, new Set(rest).size, 'no duplicate warnings');
}

for (const [name, v] of Object.entries(VECTORS)) {
  test(`NUTRITION.md §2.7 vector ${name}`, () => {
    const [bmrV, tdee, delta, kcal, protein, fat, carbs, fiber, warnings, extra] = v;
    const r = computeTargets(P[name], FROZEN_RULES, PREFS[name]);
    assert.equal(r.ok, true);
    assert.deepEqual(
      { kcal: r.kcal, protein: r.protein, fat: r.fat, carbs: r.carbs, fiber: r.fiber },
      { kcal, protein, fat, carbs, fiber },
    );
    close(r.bmr, bmrV, 0.01, 'bmr');
    close(r.tdee, tdee, 0.01, 'tdee');
    close(r.energyDelta, delta, 0.01, 'energyDelta');
    close(r.effectiveRateKgPerWeek, extra.rate ?? delta / 1100, 0.01, 'rate');
    if (extra.bmi) close(r.bmi, extra.bmi, 0.01, 'bmi');
    if (extra.prw) close(r.prw, extra.prw, 0.01, 'prw');
    if (extra.formula) assert.equal(r.bmrFormula, extra.formula);
    assert.equal(r.effectiveGoal, extra.goal ?? P[name].goal);
    assertWarnings(r, warnings);
    // 12. Check: 4P + 4C + 9F is within 5 kcal of kcal.
    assert.ok(Math.abs(4 * r.protein + 4 * r.carbs + 9 * r.fat - r.kcal) <= 5);
  });
}

test('NUTRITION.md §2.7 vector I: a minor gets no targets', () => {
  const r = computeTargets(P.I, FROZEN_RULES);
  assert.equal(r.ok, false);
  for (const k of ['kcal', 'protein', 'carbs', 'fat', 'fiber', 'bmr', 'tdee']) {
    assert.equal(r[k], null, k);
  }
  assertWarnings(r, ['minor', 'no_targets']);
  assert.equal(r.warnings.at(-1), 'no_targets');
  assert.equal(resolveTargets(r, { kcal: 2000 }), null);
});

test('the result has exactly the TargetResult keys', () => {
  const keys = [
    'ok',
    'kcal',
    'protein',
    'carbs',
    'fat',
    'fiber',
    'bmr',
    'tdee',
    'bmi',
    'prw',
    'bmrFormula',
    'effectiveGoal',
    'energyDelta',
    'effectiveRateKgPerWeek',
    'warnings',
  ].sort();
  assert.deepEqual(Object.keys(computeTargets(P.A, RULES)).sort(), keys);
  assert.deepEqual(Object.keys(computeTargets(P.I, RULES)).sort(), keys);
});

test('building blocks: bmi, proteinReferenceWeight, bmr', () => {
  close(bmi(80, 175), 26.1224, 0.0001);
  close(bmi(48, 165), 17.63, 0.01);
  assert.equal(proteinReferenceWeight(60, 175, RULES), 60); // BMI 19.6 <= 25: own weight
  close(proteinReferenceWeight(80, 175, RULES), 77.94, 0.01);
  // Exactly BMI 25 uses the weight itself.
  assert.equal(proteinReferenceWeight(64, 160, RULES), 64);
  assert.deepEqual(bmr(P.A, RULES), { value: 1748.75, formula: 'mifflin' });
  const c = bmr(P.C, RULES);
  assert.equal(c.formula, 'katch');
  close(c.value, 370 + 21.6 * 65.6, 1e-9);
  // Body fat outside profileLimits falls back to Mifflin; the bounds are inclusive.
  assert.equal(bmr({ ...P.A, bodyFatPct: 4 }, RULES).formula, 'mifflin');
  assert.equal(bmr({ ...P.A, bodyFatPct: 61 }, RULES).formula, 'mifflin');
  assert.equal(bmr({ ...P.A, bodyFatPct: 5 }, RULES).formula, 'katch');
  assert.equal(bmr({ ...P.A, bodyFatPct: 60 }, RULES).formula, 'katch');
  assert.equal(bmr({ ...P.A, bodyFatPct: null }, RULES).formula, 'mifflin');
  assert.equal(bmr({ ...P.A, bodyFatPct: '18' }, RULES).formula, 'mifflin');
  assert.throws(() => bmi(0, 175), RangeError);
  assert.throws(() => bmi(80, NaN), RangeError);
});

test('constants come from RULES, not from the code', () => {
  const rules = structuredClone(RULES);
  rules.rounding.kcalStep = 50;
  rules.activityLevels.find((a) => a.id === 'moderate').factor = 1.5;
  rules.protein.gPerKgPrw.lift.lose = 1.0;
  rules.fiber.minG = 40;
  const r = computeTargets(P.A, deepFreeze(rules));
  close(r.tdee, 1748.75 * 1.5, 1e-9);
  assert.equal(r.kcal % 50, 0);
  assert.equal(r.protein, Math.round(1.0 * r.prw));
  assert.equal(r.fiber, 40);
  const mifflin = structuredClone(RULES);
  mifflin.bmr.mifflinStJeor.constant.male = 0;
  close(computeTargets(P.A, mifflin).bmr, 1743.75, 1e-9);
});

test('flag effects: pregnant and breastfeeding lock the goal to maintain', () => {
  for (const flag of ['pregnant', 'breastfeeding']) {
    const gain = computeTargets(
      { ...P.H, goal: 'gain', rateKgPerWeek: 0.25, healthFlags: [flag] },
      RULES,
    );
    assert.equal(gain.effectiveGoal, 'maintain');
    assert.equal(gain.energyDelta, 0);
    assertWarnings(gain, [flag, 'goal_changed']);
    const maintain = computeTargets(
      { ...P.H, goal: 'maintain', rateKgPerWeek: 0, healthFlags: [flag] },
      RULES,
    );
    assertWarnings(maintain, [flag]); // no goal_changed when nothing changed
  }
  // appliesToSex: the flag is ignored for a man.
  const man = computeTargets({ ...P.A, healthFlags: ['pregnant'] }, RULES);
  assert.equal(man.effectiveGoal, 'lose');
  assertWarnings(man, []);
});

test('flag effects: eating_disorder disallows lose, allows gain', () => {
  const lose = computeTargets({ ...P.A, healthFlags: ['eating_disorder'] }, RULES);
  assert.equal(lose.effectiveGoal, 'maintain');
  assert.equal(lose.energyDelta, 0);
  assertWarnings(lose, ['eating_disorder', 'goal_changed']);
  // Protein follows the effective goal (lift/maintain 1.6).
  assert.equal(lose.protein, Math.round(1.6 * lose.prw));
  const gain = computeTargets({ ...P.D, healthFlags: ['eating_disorder'] }, RULES);
  assert.equal(gain.effectiveGoal, 'gain');
  assertWarnings(gain, ['eating_disorder']);
  assert.ok(
    RULES.healthFlags.find((f) => f.id === 'eating_disorder').effect.offerHideCalories,
    'the store derives "offer to hide calories" from this flag in warnings',
  );
});

test('flag effects: kidney_disease caps protein at 0.8 g/kg PRW', () => {
  const r = computeTargets({ ...P.F, healthFlags: ['kidney_disease'] }, RULES);
  assert.equal(r.protein, Math.round(0.8 * r.prw));
  assertWarnings(r, ['kidney_disease', 'protein_capped']);
  // The cap also applies to a preference, and is silent when g is already <= 0.8.
  const pref = computeTargets({ ...P.A, healthFlags: ['kidney_disease'] }, RULES, {
    proteinGPerKg: 2.5,
  });
  assert.equal(pref.protein, Math.round(0.8 * pref.prw));
  const low = computeTargets({ ...P.A, healthFlags: ['kidney_disease'] }, RULES, {
    proteinGPerKg: 0.8,
  });
  assertWarnings(low, ['kidney_disease']);
});

test('flag effects: diabetes_hypo_risk and age_over_80 are notes only', () => {
  const base = computeTargets(P.A, RULES);
  const diabetes = computeTargets({ ...P.A, healthFlags: ['diabetes_hypo_risk'] }, RULES);
  const n1 = { ...base, warnings: null };
  const n2 = { ...diabetes, warnings: null };
  assert.deepEqual(n2, n1);
  assertWarnings(diabetes, ['diabetes_hypo_risk']);
  const old = computeTargets({ ...P.F, ageYears: 85 }, RULES);
  assert.equal(old.ok, true);
  assertWarnings(old, ['age_over_80']);
  assertWarnings(computeTargets({ ...P.F, ageYears: 80 }, RULES), []); // strictly over 80
});

test('derived flags: minor below 18, underweight below BMI 18.5', () => {
  assert.equal(computeTargets({ ...P.J, ageYears: 17 }, RULES).ok, false);
  assertWarnings(computeTargets({ ...P.J, ageYears: 17 }, RULES), [
    'minor',
    'underweight',
    'no_targets',
  ]);
  assert.equal(computeTargets({ ...P.F, ageYears: 18 }, RULES).ok, true);
  const gain = computeTargets({ ...P.J, goal: 'gain', rateKgPerWeek: 0.25 }, RULES);
  assert.equal(gain.effectiveGoal, 'gain');
  assertWarnings(gain, ['underweight']); // requested 275 is under the 20% cap (338.3)
  // BMI exactly 18.5 is not underweight.
  const edge = computeTargets({ ...P.J, heightCm: 200, weightKg: 74 }, RULES);
  assert.ok(!edge.warnings.includes('underweight'));
});

test('older adults: at least 1.2 g/kg from 65, never lowered; not with a preference', () => {
  const at65 = computeTargets({ ...P.F, ageYears: 65 }, RULES);
  assert.equal(at65.protein, Math.round(1.2 * at65.prw));
  const at64 = computeTargets({ ...P.F, ageYears: 64 }, RULES);
  assert.equal(at64.protein, Math.round(1.0 * at64.prw));
  const lifter = computeTargets({ ...P.A, ageYears: 70 }, RULES);
  assert.equal(lifter.protein, Math.round(2.0 * lifter.prw));
  const pref = computeTargets(P.F, RULES, { proteinGPerKg: 0.9 });
  assert.equal(pref.protein, Math.round(0.9 * pref.prw));
});

test('prefs are clamped to RULES ranges; null means the default', () => {
  const hi = computeTargets(P.A, RULES, { proteinGPerKg: 3.5, fatPct: 55 });
  const max = computeTargets(P.A, RULES, { proteinGPerKg: 2.5, fatPct: 40 });
  assert.equal(hi.protein, max.protein);
  assert.equal(hi.fat, max.fat);
  const lo = computeTargets(P.A, RULES, { proteinGPerKg: 0.1, fatPct: 5 });
  const min = computeTargets(P.A, RULES, { proteinGPerKg: 0.8, fatPct: 20 });
  assert.equal(lo.protein, min.protein);
  assert.equal(lo.fat, min.fat);
  assert.deepEqual(
    computeTargets(P.A, RULES, { proteinGPerKg: null, fatPct: null }),
    computeTargets(P.A, RULES),
  );
  assert.deepEqual(computeTargets(P.A, RULES, {}), computeTargets(P.A, RULES));
  assert.throws(() => computeTargets(P.A, RULES, { fatPct: 'lots' }), RangeError);
});

test('fat floor (rounded up) and low carbs (never clamped up)', () => {
  // B with fat 20%: round(30.2) = 30 is under the floor ceil(0.6 × 72.4) = 44.
  const floor = computeTargets(P.B, RULES, { fatPct: 20 });
  assert.equal(floor.fat, 44);
  assertWarnings(floor, ['deficit_capped', 'fat_floor']);
  assert.equal(floor.carbs, Math.round((1360 - 4 * 87 - 9 * 44) / 4));
  // B with high protein and fat: carbs 24 g, noted but not raised.
  const low = computeTargets(P.B, RULES, { proteinGPerKg: 2.5, fatPct: 40 });
  assert.deepEqual([low.protein, low.fat, low.carbs], [181, 60, 24]);
  assertWarnings(low, ['deficit_capped', 'low_carbs']);
});

test('rails: surplus cap and the 1% body-weight deficit cap', () => {
  const small = profile('female', 30, 165, 60, 'sedentary', 'gain', 0.5, false);
  const r = computeTargets(small, RULES);
  close(r.energyDelta, r.tdee * 0.2, 1e-9);
  assertWarnings(r, ['surplus_capped']);
  // Light man losing 1 kg/week: the 1%-of-weight cap (0.01 × 60 × 1100 = 660) binds.
  const light = profile('male', 30, 175, 60, 'extra_active', 'lose', 1, false);
  const l = computeTargets(light, RULES);
  close(l.energyDelta, -660, 1e-9);
  close(l.effectiveRateKgPerWeek, -0.6, 1e-9);
  assertWarnings(l, ['deficit_capped']);
  // The 1,000 kcal cap.
  const big = profile('male', 30, 200, 200, 'extra_active', 'lose', 1, false);
  close(computeTargets(big, RULES).energyDelta, -1000, 1e-9);
});

test('computeTargets: bad input throws, inputs are not mutated', () => {
  assert.throws(() => computeTargets(null, RULES), TypeError);
  assert.throws(() => computeTargets({ ...P.A, sex: 'x' }, RULES), RangeError);
  assert.throws(() => computeTargets({ ...P.A, activity: 'couch' }, RULES), RangeError);
  assert.throws(() => computeTargets({ ...P.A, goal: 'bulk' }, RULES), RangeError);
  assert.throws(() => computeTargets({ ...P.A, weightKg: NaN }, RULES), RangeError);
  assert.throws(() => computeTargets({ ...P.A, rateKgPerWeek: undefined }, RULES), RangeError);
  // maintain ignores the rate entirely.
  assert.equal(computeTargets({ ...P.F, rateKgPerWeek: undefined }, RULES).ok, true);
  assert.equal(computeTargets({ ...P.F, rateKgPerWeek: 0.5 }, RULES).energyDelta, 0);
  // Frozen inputs (P and FROZEN_RULES) were used throughout this file.
  assert.ok(Object.isFrozen(P.A) && Object.isFrozen(FROZEN_RULES.goals));
});

test('validateProfile: never throws, reports each problem', () => {
  for (const name of Object.keys(P)) assert.deepEqual(validateProfile(P[name], RULES), [], name);
  const problems = (over) => validateProfile({ ...P.A, ...over }, RULES);
  const cases = [
    [{ sex: 'other' }, /sex/],
    [{ ageYears: 12 }, /ageYears/],
    [{ ageYears: 101 }, /ageYears/],
    [{ heightCm: 119 }, /heightCm/],
    [{ weightKg: 251 }, /weightKg/],
    [{ weightKg: '80' }, /weightKg/],
    [{ bodyFatPct: 70 }, /bodyFatPct/],
    [{ activity: 'couch' }, /activity/],
    [{ goal: 'bulk' }, /goal/],
    [{ rateKgPerWeek: 0.3 }, /rateKgPerWeek/],
    [{ goal: 'maintain', rateKgPerWeek: 0.5 }, /rateKgPerWeek/],
    [{ lifts: 'yes' }, /lifts/],
    [{ healthFlags: 'none' }, /healthFlags/],
    [{ healthFlags: ['diabetes'] }, /diabetes/],
    [{ healthFlags: ['minor'] }, /minor/],
    [{ healthFlags: ['pregnant'] }, /pregnant.*male/],
  ];
  for (const [over, pattern] of cases) {
    const p = problems(over);
    assert.equal(p.length, 1, JSON.stringify([over, p]));
    assert.match(p[0], pattern);
  }
  assert.deepEqual(problems({ bodyFatPct: undefined }), []);
  assert.deepEqual(problems({ ageYears: 13 }), []); // minors are valid input (no targets)
  for (const junk of [null, undefined, 'x', [], 5]) {
    const p = validateProfile(junk, RULES);
    assert.ok(Array.isArray(p) && p.length > 0);
  }
  assert.ok(Array.isArray(validateProfile(P.A, null)));
  assert.ok(Array.isArray(validateProfile(P.A, {})));
});

test('resolveTargets: overrides win per key; null without targets', () => {
  const r = computeTargets(P.A, RULES);
  assert.deepEqual(resolveTargets(r, {}), {
    kcal: 2160,
    protein: 156,
    carbs: 222,
    fat: 72,
    fiber: 30,
  });
  assert.deepEqual(resolveTargets(r, { kcal: 2000, protein: null, fat: undefined }), {
    kcal: 2000,
    protein: 156,
    carbs: 222,
    fat: 72,
    fiber: 30,
  });
  assert.deepEqual(resolveTargets(r, null), resolveTargets(r, {}));
  assert.equal(resolveTargets(null, {}), null);
  assert.throws(() => resolveTargets(r, { kcal: -5 }), RangeError);
});

test('binding enums agree with RULES', () => {
  assert.deepEqual(
    RULES.activityLevels.map((a) => a.id),
    [...ACTIVITY_LEVELS],
  );
  assert.deepEqual(
    RULES.goals.map((g) => g.id),
    [...GOALS],
  );
});
