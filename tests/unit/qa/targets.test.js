// QA tests for app/core/targets.js, written from docs/NUTRITION.md §2 (algorithm §2.2, flags §2.5,
// rounding §2.6, binding vectors A–K §2.7) and docs/ARCHITECTURE.md §4.4 and §5.5.
// Rounded outputs must match exactly, unrounded ones to ±0.01, warnings as a set with 'estimate'
// first when ok. Extra cases (flags, prefs, rails) were worked by hand from §2.2. Owner: Kenji.
import assert from 'node:assert/strict';
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
import { qa, knownBug, RULES, deepFreeze, assertClose, assertBadInput, rng } from './_helpers.js';

deepFreeze(RULES); // the core must never write to RULES

const P = (
  sex,
  ageYears,
  heightCm,
  weightKg,
  activity,
  goal,
  rateKgPerWeek,
  lifts,
  healthFlags = [],
  extra = {},
) =>
  deepFreeze({
    sex,
    ageYears,
    heightCm,
    weightKg,
    activity,
    goal,
    rateKgPerWeek,
    lifts,
    healthFlags,
    ...extra,
  });

const A = P('male', 30, 175, 80, 'moderate', 'lose', 0.5, true);
const with_ = (profile, patch) => deepFreeze({ ...profile, ...patch });
const RESULT_KEYS = [
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
];

/** Checks the rounded outputs exactly, the unrounded ones to ±0.01 and warnings as a set. */
function check(r, exp, label) {
  assert.equal(r.ok, exp.ok ?? true, `${label}: ok`);
  for (const k of ['kcal', 'protein', 'fat', 'carbs', 'fiber']) {
    if (k in exp) assert.equal(r[k], exp[k], `${label}: ${k}`);
  }
  for (const k of ['bmr', 'tdee', 'bmi', 'prw', 'energyDelta', 'effectiveRateKgPerWeek']) {
    if (k in exp) {
      if (exp[k] === null) assert.equal(r[k], null, `${label}: ${k}`);
      else assertClose(r[k], exp[k], 0.01, `${label}: ${k}`);
    }
  }
  if (exp.formula) assert.equal(r.bmrFormula, exp.formula, `${label}: bmrFormula`);
  if (exp.goal) assert.equal(r.effectiveGoal, exp.goal, `${label}: effectiveGoal`);
  if (exp.warnings) {
    if (r.ok) assert.equal(r.warnings[0], 'estimate', `${label}: 'estimate' first`);
    assert.deepEqual(
      [...new Set(r.warnings)].sort(),
      [...exp.warnings].sort(),
      `${label}: warnings`,
    );
    assert.equal(new Set(r.warnings).size, r.warnings.length, `${label}: no duplicate warnings`);
  }
}

// ------------------------------------------------------------------ constants and building blocks
qa('ACTIVITY_LEVELS and GOALS equal the RULES ids', [], () => {
  assert.deepEqual(
    [...ACTIVITY_LEVELS],
    RULES.activityLevels.map((a) => a.id),
  );
  assert.deepEqual(
    [...GOALS],
    RULES.goals.map((g) => g.id),
  );
});

qa('bmi: kg / m², unrounded', [bmi], () => {
  assertClose(bmi(80, 175), 26.1224, 1e-4);
  assertClose(bmi(85, 160), 33.2031, 1e-4);
  assertClose(bmi(64, 160), 25, 1e-12);
  assertClose(bmi(48, 165), 17.6309, 1e-4);
});

qa(
  'proteinReferenceWeight: weight up to BMI 25, then W + 0.4·(kg − W)',
  [proteinReferenceWeight],
  () => {
    assertClose(proteinReferenceWeight(80, 175, RULES), 77.9375, 1e-9, 'vector A');
    assertClose(proteinReferenceWeight(85, 160, RULES), 72.4, 1e-9, 'vector B');
    assertClose(proteinReferenceWeight(95, 172, RULES), 82.376, 1e-9, 'vector G');
    assert.equal(proteinReferenceWeight(70, 180, RULES), 70, 'BMI 21.6');
    assert.equal(proteinReferenceWeight(64, 160, RULES), 64, 'BMI exactly 25 → the weight');
    const rules = deepFreeze({
      ...structuredClone(RULES),
      proteinReferenceWeight: { bmiAbove: 30, referenceBmi: 30, excessFraction: 0.5 },
    });
    assert.equal(
      proteinReferenceWeight(75, 160, rules),
      75,
      'reads bmiAbove from RULES (BMI 29.3)',
    );
    assertClose(
      proteinReferenceWeight(85, 160, rules),
      80.9,
      1e-9,
      'reads referenceBmi and excessFraction',
    );
  },
);

qa('bmr: Mifflin-St Jeor by sex; Katch-McArdle when bodyFatPct is within 5–60', [bmr], () => {
  assert.deepEqual(bmr(A, RULES), { value: 1748.75, formula: 'mifflin' });
  const b = bmr(P('female', 35, 160, 85, 'sedentary', 'lose', 0.75, false), RULES);
  assert.equal(b.formula, 'mifflin');
  assertClose(b.value, 1514);
  const c = bmr(with_(A, { bodyFatPct: 18 }), RULES);
  assert.equal(c.formula, 'katch');
  assertClose(c.value, 1786.96, 1e-9);
  assertClose(bmr(with_(A, { bodyFatPct: 5 }), RULES).value, 2011.6, 1e-9, 'lower limit');
  assert.equal(bmr(with_(A, { bodyFatPct: 60 }), RULES).formula, 'katch', 'upper limit');
  for (const bf of [4.9, 61, null, undefined, '18']) {
    assert.equal(bmr(with_(A, { bodyFatPct: bf }), RULES).formula, 'mifflin', `bodyFatPct ${bf}`);
  }
});

// ------------------------------------------------------------------ binding vectors A–K (§2.7)
const VECTORS = {
  A: [
    A,
    {},
    {
      kcal: 2160,
      protein: 156,
      fat: 72,
      carbs: 222,
      fiber: 30,
      bmr: 1748.75,
      tdee: 2710.56,
      bmi: 26.12,
      prw: 77.94,
      energyDelta: -550,
      effectiveRateKgPerWeek: -0.5,
      formula: 'mifflin',
      goal: 'lose',
      warnings: ['estimate'],
    },
  ],
  B: [
    P('female', 35, 160, 85, 'sedentary', 'lose', 0.75, false),
    {},
    {
      kcal: 1360,
      protein: 87,
      fat: 45,
      carbs: 152,
      fiber: 25,
      bmr: 1514,
      tdee: 1816.8,
      bmi: 33.2,
      prw: 72.4,
      energyDelta: -454.2,
      effectiveRateKgPerWeek: -0.413,
      goal: 'lose',
      warnings: ['estimate', 'deficit_capped'],
    },
  ],
  C: [
    with_(A, { bodyFatPct: 18 }),
    {},
    {
      kcal: 2220,
      protein: 156,
      fat: 74,
      carbs: 233,
      fiber: 31,
      bmr: 1786.96,
      tdee: 2769.79,
      energyDelta: -550,
      formula: 'katch',
      goal: 'lose',
      warnings: ['estimate'],
    },
  ],
  D: [
    P('male', 25, 180, 70, 'very_active', 'gain', 0.5, true),
    {},
    {
      kcal: 3490,
      protein: 126,
      fat: 116,
      carbs: 486,
      fiber: 49,
      bmr: 1705,
      tdee: 2941.13,
      prw: 70,
      energyDelta: 550,
      effectiveRateKgPerWeek: 0.5,
      goal: 'gain',
      warnings: ['estimate'],
    },
  ],
  E: [
    P('female', 60, 150, 50, 'sedentary', 'lose', 0.5, false),
    {},
    {
      kcal: 1170,
      protein: 60,
      fat: 39,
      carbs: 145,
      fiber: 25,
      bmr: 976.5,
      tdee: 1171.8,
      energyDelta: 0,
      effectiveRateKgPerWeek: 0,
      goal: 'lose',
      warnings: ['estimate', 'deficit_capped', 'kcal_floor'],
    },
  ],
  F: [
    P('male', 68, 170, 65, 'light', 'maintain', 0, false),
    {},
    {
      kcal: 1890,
      protein: 78,
      fat: 63,
      carbs: 253,
      fiber: 26,
      bmr: 1377.5,
      tdee: 1894.06,
      energyDelta: 0,
      goal: 'maintain',
      warnings: ['estimate'],
    },
  ],
  G: [
    P('male', 55, 172, 95, 'light', 'lose', 1.0, true, ['kidney_disease', 'diabetes_hypo_risk']),
    {},
    {
      kcal: 1810,
      protein: 66,
      fat: 60,
      carbs: 252,
      fiber: 25,
      bmr: 1755,
      tdee: 2413.13,
      bmi: 32.11,
      prw: 82.38,
      energyDelta: -603.28,
      goal: 'lose',
      warnings: [
        'estimate',
        'kidney_disease',
        'diabetes_hypo_risk',
        'deficit_capped',
        'protein_capped',
      ],
    },
  ],
  H: [
    P('female', 28, 163, 62, 'light', 'lose', 0.5, false, ['pregnant']),
    {},
    {
      kcal: 1840,
      protein: 62,
      fat: 61,
      carbs: 261,
      fiber: 26,
      bmr: 1337.75,
      tdee: 1839.41,
      energyDelta: 0,
      goal: 'maintain',
      warnings: ['estimate', 'pregnant', 'goal_changed'],
    },
  ],
  I: [
    P('female', 16, 158, 50, 'light', 'lose', 0.5, false),
    {},
    {
      ok: false,
      kcal: null,
      protein: null,
      fat: null,
      carbs: null,
      fiber: null,
      bmr: null,
      tdee: null,
      warnings: ['minor', 'no_targets'],
    },
  ],
  J: [
    P('female', 24, 165, 48, 'light', 'lose', 0.5, false),
    {},
    {
      kcal: 1690,
      protein: 48,
      fat: 56,
      carbs: 249,
      fiber: 25,
      bmr: 1230.25,
      tdee: 1691.59,
      energyDelta: 0,
      goal: 'maintain',
      warnings: ['estimate', 'underweight', 'goal_changed'],
    },
  ],
  K: [
    A,
    { proteinGPerKg: 2.2, fatPct: 25 },
    {
      kcal: 2160,
      protein: 171,
      fat: 60,
      carbs: 234,
      fiber: 30,
      bmr: 1748.75,
      tdee: 2710.56,
      energyDelta: -550,
      goal: 'lose',
      warnings: ['estimate'],
    },
  ],
};

for (const [name, [profile, prefs, expected]] of Object.entries(VECTORS)) {
  qa(`NUTRITION.md §2.7 vector ${name}`, [computeTargets], () => {
    const r = computeTargets(profile, RULES, deepFreeze(prefs));
    check(r, expected, `vector ${name}`);
  });
}

qa('computeTargets returns exactly the TargetResult keys (§2.2)', [computeTargets], () => {
  assert.deepEqual(Object.keys(computeTargets(A, RULES)).sort(), [...RESULT_KEYS].sort());
  assert.deepEqual(
    Object.keys(computeTargets(VECTORS.I[0], RULES)).sort(),
    [...RESULT_KEYS].sort(),
    'also when ok is false',
  );
});

qa(
  'prefs default to {}: computeTargets(p, R) === computeTargets(p, R, {})',
  [computeTargets],
  () => {
    assert.deepEqual(computeTargets(A, RULES), computeTargets(A, RULES, {}));
    assert.deepEqual(
      computeTargets(A, RULES, { proteinGPerKg: null, fatPct: null }),
      computeTargets(A, RULES),
      'null prefs are "no choice"',
    );
  },
);

// ------------------------------------------------------------------ health flags (§2.5)
qa('pregnant and breastfeeding lock the goal to maintain (women only)', [computeTargets], () => {
  const bf = P('female', 28, 163, 62, 'light', 'lose', 0.5, false, ['breastfeeding']);
  check(
    computeTargets(bf, RULES),
    {
      kcal: 1840,
      protein: 62,
      fat: 61,
      carbs: 261,
      fiber: 26,
      goal: 'maintain',
      warnings: ['estimate', 'breastfeeding', 'goal_changed'],
    },
    'breastfeeding',
  );
  const m = P('female', 28, 163, 62, 'light', 'maintain', 0, false, ['pregnant']);
  check(
    computeTargets(m, RULES),
    { kcal: 1840, goal: 'maintain', warnings: ['estimate', 'pregnant'] },
    'already maintain: no goal_changed',
  );
  const g = P('female', 28, 163, 62, 'light', 'gain', 0.25, false, ['pregnant']);
  check(
    computeTargets(g, RULES),
    { kcal: 1840, goal: 'maintain', warnings: ['estimate', 'pregnant', 'goal_changed'] },
    'gain → maintain',
  );
  const male = with_(A, { healthFlags: ['pregnant'] });
  check(
    computeTargets(male, RULES),
    { kcal: 2160, protein: 156, goal: 'lose', warnings: ['estimate'] },
    'appliesToSex: ignored for a man',
  );
});

qa('eating_disorder: lose → maintain (goal_changed); gain is kept', [computeTargets], () => {
  check(
    computeTargets(with_(A, { healthFlags: ['eating_disorder'] }), RULES),
    {
      kcal: 2710,
      protein: 125,
      fat: 90,
      carbs: 350,
      fiber: 38,
      energyDelta: 0,
      effectiveRateKgPerWeek: 0,
      goal: 'maintain',
      warnings: ['estimate', 'eating_disorder', 'goal_changed'],
    },
    'lose',
  );
  check(
    computeTargets(
      with_(A, { goal: 'gain', rateKgPerWeek: 0.25, healthFlags: ['eating_disorder'] }),
      RULES,
    ),
    {
      kcal: 2990,
      protein: 140,
      fat: 100,
      carbs: 383,
      fiber: 42,
      energyDelta: 275,
      goal: 'gain',
      warnings: ['estimate', 'eating_disorder'],
    },
    'gain',
  );
});

qa('kidney_disease caps protein at 0.8 g/kg PRW, after prefs', [computeTargets], () => {
  const k = with_(A, { healthFlags: ['kidney_disease'] });
  check(
    computeTargets(k, RULES),
    {
      kcal: 2160,
      protein: 62,
      fat: 72,
      carbs: 316,
      warnings: ['estimate', 'kidney_disease', 'protein_capped'],
    },
    'table value capped',
  );
  check(
    computeTargets(k, RULES, { proteinGPerKg: 2.2 }),
    { protein: 62, warnings: ['estimate', 'kidney_disease', 'protein_capped'] },
    'pref capped',
  );
  check(
    computeTargets(k, RULES, { proteinGPerKg: 0.8 }),
    { protein: 62, carbs: 316, warnings: ['estimate', 'kidney_disease'] },
    'not above the cap: no warning',
  );
});

qa('diabetes_hypo_risk is a note only', [computeTargets], () => {
  const r = computeTargets(with_(A, { healthFlags: ['diabetes_hypo_risk'] }), RULES);
  check(
    r,
    {
      kcal: 2160,
      protein: 156,
      fat: 72,
      carbs: 222,
      fiber: 30,
      energyDelta: -550,
      goal: 'lose',
      warnings: ['estimate', 'diabetes_hypo_risk'],
    },
    'diabetes',
  );
});

qa(
  'minor (under 18): ok false, every target null, warnings minor + no_targets',
  [computeTargets],
  () => {
    const r = computeTargets(with_(A, { ageYears: 17 }), RULES);
    check(
      r,
      {
        ok: false,
        kcal: null,
        protein: null,
        fat: null,
        carbs: null,
        fiber: null,
        bmr: null,
        tdee: null,
        warnings: ['minor', 'no_targets'],
      },
      'age 17',
    );
    assert.ok(!r.warnings.includes('estimate'), "no 'estimate' without targets");
    check(
      computeTargets(with_(A, { ageYears: 18 }), RULES),
      { kcal: 2250, protein: 156, fat: 75, carbs: 238, fiber: 32, warnings: ['estimate'] },
      'age 18 is an adult',
    );
    check(
      computeTargets(with_(A, { ageYears: 16, healthFlags: ['eating_disorder'] }), RULES),
      { ok: false, kcal: null, warnings: ['eating_disorder', 'minor', 'no_targets'] },
      'minor + flag',
    );
    check(
      computeTargets(with_(A, { ageYears: 13 }), RULES),
      { ok: false, warnings: ['minor', 'no_targets'] },
      'age 13',
    );
  },
);

qa(
  'underweight (BMI < 18.5): lose disallowed; gain kept; BMI 18.5 is not underweight',
  [computeTargets],
  () => {
    check(
      computeTargets(P('female', 24, 165, 48, 'light', 'gain', 0.25, false), RULES),
      {
        kcal: 1970,
        protein: 58,
        fat: 66,
        carbs: 286,
        fiber: 28,
        goal: 'gain',
        warnings: ['estimate', 'underweight'],
      },
      'gain',
    );
    check(
      computeTargets(P('female', 24, 200, 74, 'light', 'lose', 0.5, false), RULES),
      { kcal: 1800, protein: 89, goal: 'lose', warnings: ['estimate'] },
      'BMI exactly 18.5',
    );
  },
);

qa(
  'age_over_80 is a note only (age 81 yes, 80 no); 65+ protein rule applies',
  [computeTargets],
  () => {
    check(
      computeTargets(P('male', 81, 170, 65, 'light', 'maintain', 0, false), RULES),
      {
        kcal: 1800,
        protein: 78,
        fat: 60,
        carbs: 237,
        fiber: 25,
        warnings: ['estimate', 'age_over_80'],
      },
      'age 81',
    );
    check(
      computeTargets(P('male', 80, 170, 65, 'light', 'maintain', 0, false), RULES),
      { kcal: 1810, protein: 78, carbs: 240, warnings: ['estimate'] },
      'age 80',
    );
  },
);

// ------------------------------------------------------------------ prefs (§2.1) and rails (§2.2)
qa('prefs: proteinGPerKg clamped to 0.8–2.5, fatPct clamped to 20–40', [computeTargets], () => {
  check(
    computeTargets(A, RULES, { proteinGPerKg: 3 }),
    { protein: 195, fat: 72, carbs: 183, warnings: ['estimate'] },
    'protein 3 → 2.5',
  );
  check(
    computeTargets(A, RULES, { proteinGPerKg: 0.5 }),
    { protein: 62, carbs: 316 },
    'protein 0.5 → 0.8',
  );
  check(
    computeTargets(A, RULES, { fatPct: 50 }),
    { protein: 156, fat: 96, carbs: 168 },
    'fat 50 → 40',
  );
  check(
    computeTargets(A, RULES, { fatPct: 10 }),
    { fat: 48, carbs: 276, warnings: ['estimate'] },
    'fat 10 → 20, floor met',
  );
});

qa('prefs: a protein choice skips the 65+ minimum', [computeTargets], () => {
  check(
    computeTargets(VECTORS.F[0], RULES, { proteinGPerKg: 1.0 }),
    { kcal: 1890, protein: 65, fat: 63, carbs: 266 },
    'F with 1.0 g/kg',
  );
});

qa('fat floor: ceil(max(20% kcal / 9, 0.6 × PRW)), fat_floor', [computeTargets], () => {
  check(
    computeTargets(P('female', 60, 150, 100, 'sedentary', 'lose', 0.5, false), RULES),
    {
      kcal: 1330,
      protein: 89,
      fat: 45,
      carbs: 142,
      fiber: 25,
      energyDelta: -442.95,
      warnings: ['estimate', 'deficit_capped', 'fat_floor'],
    },
    'PRW floor (and protein 88.5 rounds up)',
  );
  check(
    computeTargets(VECTORS.B[0], RULES, { fatPct: 20 }),
    {
      kcal: 1360,
      protein: 87,
      fat: 44,
      carbs: 154,
      warnings: ['estimate', 'deficit_capped', 'fat_floor'],
    },
    'B with fat 20%',
  );
});

qa('low_carbs below 100 g, never clamped up', [computeTargets], () => {
  check(
    computeTargets(VECTORS.E[0], RULES, { proteinGPerKg: 2.5, fatPct: 40 }),
    {
      kcal: 1170,
      protein: 125,
      fat: 52,
      carbs: 51,
      warnings: ['estimate', 'deficit_capped', 'kcal_floor', 'low_carbs'],
    },
    '50.5 rounds half up to 51',
  );
});

knownBug(
  'BUG-T1',
  'Hamza',
  'ruling 2026-10-14: carbs never go negative; protein gives way (NUTRITION worked example)',
  [computeTargets],
  () => {
    // Woman, 200 cm, 100 kg (BMI 25 → PRW 100), 60% body fat (Katch 1234), sedentary, lose 1 kg:
    // kcal 1200 (floor); 2.5 g/kg → 250 g protein; fat floor 60 g; room = −340 → protein 165, carbs 0.
    const p = P('female', 40, 200, 100, 'sedentary', 'lose', 1, false, [], { bodyFatPct: 60 });
    check(
      computeTargets(p, RULES, { proteinGPerKg: 2.5 }),
      {
        kcal: 1200,
        protein: 165,
        fat: 60,
        carbs: 0,
        prw: 100,
        formula: 'katch',
        warnings: [
          'estimate',
          'deficit_capped',
          'kcal_floor',
          'fat_floor',
          'protein_reduced_to_fit',
          'low_carbs',
        ],
      },
      'worked example',
    );
    assert.ok('protein_reduced_to_fit' in RULES.warnings, 'the warning has RULES text');
  },
);

knownBug(
  'BUG-T1',
  'Hamza',
  'ruling 2026-10-14: a fatPct preference gives way first, down to the fat floor only',
  [computeTargets],
  () => {
    // Woman, 150 cm, 100 kg (PRW 73.75), 60% body fat, sedentary, lose 1 kg → kcal 1200.
    // Prefs 2.5 g/kg and 40% fat: protein 184, fat 53, floor 45; room −13 → fat 51, carbs 1.
    const p = P('female', 40, 150, 100, 'sedentary', 'lose', 1, false, [], { bodyFatPct: 60 });
    check(
      computeTargets(p, RULES, { proteinGPerKg: 2.5, fatPct: 40 }),
      {
        kcal: 1200,
        protein: 184,
        fat: 51,
        carbs: 1,
        warnings: ['estimate', 'deficit_capped', 'kcal_floor', 'low_carbs'],
      },
      'fat lowered, protein kept',
    );
  },
);

knownBug(
  'BUG-T1',
  'Hamza',
  'property: high protein prefs at low kcal never give negative carbs (step 12 holds)',
  [computeTargets],
  () => {
    const random = rng(1405);
    let reduced = 0;
    for (let i = 0; i < 300; i++) {
      const profile = P(
        random() < 0.5 ? 'female' : 'male',
        20 + Math.floor(random() * 60),
        170 + Math.round(random() * 60),
        90 + Math.round(random() * 110),
        'sedentary',
        'lose',
        1,
        false,
        [],
        { bodyFatPct: 40 + Math.round(random() * 20) },
      );
      const prefs = deepFreeze({
        proteinGPerKg: 2 + random() * 0.5,
        fatPct: random() < 0.5 ? 40 : null,
      });
      const r = computeTargets(profile, RULES, prefs);
      const label = `${JSON.stringify(profile)} ${JSON.stringify(prefs)}`;
      assert.ok(r.carbs >= 0, `${label}: carbs ${r.carbs}`);
      const err = Math.abs(4 * r.protein + 4 * r.carbs + 9 * r.fat - r.kcal);
      assert.ok(err <= 5, `${label}: step 12 off by ${err}`);
      assert.ok(
        r.fat >= Math.ceil(Math.max((0.2 * r.kcal) / 9, 0.6 * r.prw)),
        `${label}: fat ≥ floor`,
      );
      if (r.warnings.includes('protein_reduced_to_fit')) reduced += 1;
    }
    assert.ok(reduced > 20, `the ruling is exercised (${reduced} cases)`);
  },
);

qa('rails: surplus cap 20% of TDEE (surplus_capped)', [computeTargets], () => {
  check(
    computeTargets(P('female', 60, 150, 50, 'sedentary', 'gain', 0.5, false), RULES),
    {
      kcal: 1410,
      protein: 60,
      fat: 47,
      carbs: 187,
      fiber: 25,
      energyDelta: 234.36,
      effectiveRateKgPerWeek: 0.21,
      goal: 'gain',
      warnings: ['estimate', 'surplus_capped'],
    },
    'gain capped',
  );
});

qa('rails: deficit caps 1,000 kcal and 1% of body weight per week', [computeTargets], () => {
  check(
    computeTargets(P('male', 20, 230, 150, 'extra_active', 'lose', 1, false), RULES),
    {
      kcal: 4400,
      energyDelta: -1000,
      effectiveRateKgPerWeek: -0.91,
      warnings: ['estimate', 'deficit_capped'],
    },
    '1,000 kcal cap',
  );
  check(
    computeTargets(P('male', 25, 170, 55, 'very_active', 'lose', 0.75, false), RULES),
    {
      kcal: 1970,
      energyDelta: -605,
      effectiveRateKgPerWeek: -0.55,
      warnings: ['estimate', 'deficit_capped'],
    },
    '1% of body weight cap',
  );
});

qa(
  'rails: the male floor is 1,500 kcal (kcal_floor), Katch at 60% body fat',
  [computeTargets],
  () => {
    check(
      computeTargets(with_(A, { bodyFatPct: 60 }), RULES),
      {
        kcal: 1500,
        bmr: 1061.2,
        energyDelta: -144.86,
        formula: 'katch',
        warnings: ['estimate', 'deficit_capped', 'kcal_floor'],
      },
      'floor',
    );
  },
);

qa('maintain ignores rateKgPerWeek; a negative rate counts as 0', [computeTargets], () => {
  check(
    computeTargets(with_(VECTORS.F[0], { rateKgPerWeek: 0.5 }), RULES),
    { kcal: 1890, energyDelta: 0 },
    'maintain',
  );
  check(
    computeTargets(with_(A, { rateKgPerWeek: -0.5 }), RULES),
    { kcal: 2710, energyDelta: 0, effectiveRateKgPerWeek: 0 },
    'max(0, rate)',
  );
});

qa('every constant comes from RULES (energy, fibre, activity)', [computeTargets], () => {
  const rules = structuredClone(RULES);
  rules.energy.kcalPerKgBodyWeight = 7000;
  rules.fiber.minG = 35;
  rules.activityLevels.find((a) => a.id === 'moderate').factor = 1.5;
  const r = computeTargets(A, deepFreeze(rules));
  // tdee = 1748.75 × 1.5 = 2623.125; perDay = 1000; deficit 500 → 2123.125 → 2120 kcal.
  assert.equal(r.kcal, 2120);
  assertClose(r.tdee, 2623.125, 1e-9);
  assertClose(r.energyDelta, -500, 1e-9);
  assert.equal(r.fiber, 35);
});

qa(
  'property: §2.2 step 12 and rounding invariants hold for 500 random adult profiles',
  [computeTargets],
  () => {
    const random = rng(2026);
    const pick = (list) => list[Math.floor(random() * list.length)];
    const L = RULES.profileLimits;
    let checked = 0;
    for (let i = 0; i < 500; i++) {
      const goal = pick(GOALS);
      const rates = RULES.goals.find((g) => g.id === goal).ratesKgPerWeek;
      const profile = deepFreeze({
        sex: pick(['male', 'female']),
        ageYears: 18 + Math.floor(random() * (L.ageYears.max - 18 + 1)),
        heightCm: L.heightCm.min + Math.round(random() * (L.heightCm.max - L.heightCm.min)),
        weightKg: L.weightKg.min + Math.round(random() * (L.weightKg.max - L.weightKg.min)),
        activity: pick(ACTIVITY_LEVELS),
        goal,
        rateKgPerWeek: pick(rates),
        lifts: random() < 0.5,
        healthFlags: [],
        ...(random() < 0.3 ? { bodyFatPct: 5 + Math.round(random() * 55) } : {}),
      });
      const r = computeTargets(profile, RULES);
      const label = JSON.stringify(profile);
      assert.equal(r.ok, true, label);
      assert.equal(r.warnings[0], 'estimate', label);
      assert.equal(r.kcal % 10, 0, `${label}: kcal to the nearest 10`);
      for (const k of ['protein', 'fat', 'carbs', 'fiber']) {
        assert.ok(Number.isInteger(r[k]) && r[k] >= 0, `${label}: ${k} whole and ≥ 0`);
      }
      assert.ok(r.fiber >= 25, label);
      const floor = Math.ceil(Math.max((0.2 * r.kcal) / 9, 0.6 * r.prw));
      assert.ok(r.fat >= floor, `${label}: fat ≥ floor`);
      assert.equal(
        r.warnings.includes('low_carbs'),
        r.carbs < 100,
        `${label}: low_carbs iff < 100`,
      );
      if (r.carbs > 0) {
        const err = Math.abs(4 * r.protein + 4 * r.carbs + 9 * r.fat - r.kcal);
        assert.ok(err <= 5, `${label}: step 12 check off by ${err}`);
        checked += 1;
      }
      if (r.effectiveGoal === 'lose') assert.ok(r.energyDelta <= 0, label);
      if (r.effectiveGoal === 'gain') assert.ok(r.energyDelta >= 0, label);
      assertClose(r.effectiveRateKgPerWeek, r.energyDelta / (7700 / 7), 1e-9, label);
    }
    assert.ok(checked > 400);
  },
);

qa('computeTargets refuses bad input and never mutates', [computeTargets], () => {
  assertBadInput(() => computeTargets(with_(A, { activity: 'couch' }), RULES), 'activity');
  assertBadInput(() => computeTargets(with_(A, { goal: 'bulk' }), RULES), 'goal');
  assertBadInput(() => computeTargets(null, RULES), 'null profile');
  const prefs = deepFreeze({ proteinGPerKg: 2.2, fatPct: 25 });
  computeTargets(A, RULES, prefs);
  assert.deepEqual(prefs, { proteinGPerKg: 2.2, fatPct: 25 });
});

// ------------------------------------------------------------------ validateProfile
qa('validateProfile: valid profiles give []', [validateProfile], () => {
  for (const [name, [profile]] of Object.entries(VECTORS)) {
    assert.deepEqual(validateProfile(profile, RULES), [], `vector ${name}`);
  }
  assert.deepEqual(validateProfile(with_(A, { ageYears: 13 }), RULES), [], 'age 13 is accepted');
  assert.deepEqual(
    validateProfile(with_(A, { ageYears: 100, heightCm: 230, weightKg: 250 }), RULES),
    [],
  );
  assert.deepEqual(validateProfile(with_(A, { heightCm: 120, weightKg: 30 }), RULES), []);
});

qa('validateProfile: one problem per broken rule; never throws', [validateProfile], () => {
  const broken = [
    ['sex', { sex: 'other' }],
    ['age 12', { ageYears: 12 }],
    ['age 101', { ageYears: 101 }],
    ['age NaN', { ageYears: NaN }],
    ['height 119', { heightCm: 119 }],
    ['height 231', { heightCm: 231 }],
    ['weight 29', { weightKg: 29 }],
    ['weight 251', { weightKg: 251 }],
    ['weight as text', { weightKg: '80' }],
    ['body fat 70', { bodyFatPct: 70 }],
    ['body fat 2', { bodyFatPct: 2 }],
    ['activity', { activity: 'couch' }],
    ['goal', { goal: 'bulk' }],
    ['rate not offered for lose', { rateKgPerWeek: 0.3 }],
    ['rate 1 for gain', { goal: 'gain', rateKgPerWeek: 1 }],
    ['lifts not boolean', { lifts: 'yes' }],
    ['unknown health flag', { healthFlags: ['diabetes'] }],
    ['derived flag stored', { healthFlags: ['minor'] }],
    ['pregnant man', { healthFlags: ['pregnant'] }],
    ['healthFlags not an array', { healthFlags: 'none' }],
  ];
  for (const [label, patch] of broken) {
    const problems = validateProfile(with_(A, patch), RULES);
    assert.ok(Array.isArray(problems) && problems.length > 0, `no problem for ${label}`);
  }
  for (const junk of [null, undefined, 42, 'profile', [], {}]) {
    let problems;
    assert.doesNotThrow(() => {
      problems = validateProfile(junk, RULES);
    });
    assert.ok(problems.length > 0, `problems for ${String(junk)}`);
  }
});

// ------------------------------------------------------------------ resolveTargets
qa(
  'resolveTargets: overrides win per key; null/undefined ignored; null when !ok',
  [resolveTargets],
  () => {
    const computed = deepFreeze({
      ok: true,
      kcal: 2160,
      protein: 156,
      carbs: 222,
      fat: 72,
      fiber: 30,
      bmr: 1748.75,
      tdee: 2710.5625,
      bmi: 26.12,
      prw: 77.94,
      bmrFormula: 'mifflin',
      effectiveGoal: 'lose',
      energyDelta: -550,
      effectiveRateKgPerWeek: -0.5,
      warnings: ['estimate'],
    });
    assert.deepEqual(resolveTargets(computed, {}), {
      kcal: 2160,
      protein: 156,
      carbs: 222,
      fat: 72,
      fiber: 30,
    });
    assert.deepEqual(
      resolveTargets(computed, deepFreeze({ kcal: 2000, protein: null, fat: undefined })),
      {
        kcal: 2000,
        protein: 156,
        carbs: 222,
        fat: 72,
        fiber: 30,
      },
    );
    assert.deepEqual(resolveTargets(computed, { fiber: 0 }).fiber, 0, 'a number wins, even 0');
    const minor = deepFreeze({
      ...computed,
      ok: false,
      kcal: null,
      protein: null,
      carbs: null,
      fat: null,
      fiber: null,
    });
    assert.equal(resolveTargets(minor, { kcal: 1800 }), null);
  },
);
