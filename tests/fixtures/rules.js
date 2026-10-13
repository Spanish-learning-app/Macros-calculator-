// FIXTURE RULES for unit and E2E tests. Shape = the RULES contract in docs/ARCHITECTURE.md §6.
// Values copied from Ayesha's kickoff memo (team/meetings/001-kickoff/memo-ayesha.md).
// The real rules are app/data/rules.js (owned by Ayesha). If they differ, the real file wins and
// this fixture is updated to match. Owner: Kenji (created by Lena in Step 0).

export default {
  version: 'fixture-2026-10-13',

  energyCheck: {
    factors: { protein: 4, carbs: 4, fat: 9, fiber: 2 },
    tolerancePct: 10,
    toleranceKcal: 10,
  },
  massCheck: { maxGramsPer100g: 100 },
  zeroFiberGroups: ['meat', 'fish', 'egg', 'dairy', 'oil'],

  vocab: {
    groups: [
      { id: 'oil', label: 'Oils and ghee', kcalRange: [860, 900] },
      { id: 'roti-naan', label: 'Roti and naan', kcalRange: [220, 360] },
      { id: 'paratha', label: 'Paratha', kcalRange: [280, 400] },
      { id: 'rice', label: 'Plain rice', kcalRange: [110, 160] },
      { id: 'biryani', label: 'Biryani and pulao', kcalRange: [150, 250] },
      { id: 'curry-daal', label: 'Curries and daal', kcalRange: [70, 260] },
      { id: 'chai-milk', label: 'Chai and milk', kcalRange: [30, 110] },
      { id: 'vegetable', label: 'Vegetables', kcalRange: [10, 90] },
      { id: 'fruit', label: 'Fruit', kcalRange: [15, 120] },
      { id: 'egg', label: 'Eggs', kcalRange: null },
      { id: 'dairy', label: 'Dairy', kcalRange: null },
      { id: 'meat', label: 'Meat', kcalRange: null },
      { id: 'fish', label: 'Fish', kcalRange: null },
      { id: 'mixed-dish', label: 'Mixed dishes', kcalRange: null },
      { id: 'sweet', label: 'Sweets', kcalRange: null },
      { id: 'snack', label: 'Snacks', kcalRange: null },
      { id: 'drink', label: 'Drinks', kcalRange: null },
      { id: 'supplement', label: 'Supplements', kcalRange: null },
    ],
    tags: [
      'pakistani',
      'spanish',
      'mediterranean',
      'international',
      'vegetarian',
      'vegan',
      'contains-egg',
      'halal',
      'halal-check',
      'staple',
      'gym',
      'packaged',
    ],
  },

  // Slot hints. hours = [startMinute, endMinute) since local midnight; null = any time.
  slots: [
    { id: 'breakfast', label: 'Nashta', sharePct: 25, hours: [360, 600] },
    { id: 'lunch', label: 'Lunch', sharePct: 30, hours: [720, 900] },
    { id: 'evening', label: 'Shaam ki chai', sharePct: 10, hours: [960, 1080] },
    { id: 'dinner', label: 'Dinner', sharePct: 30, hours: [1140, 1380] },
    { id: 'snacks', label: 'Snacks', sharePct: 5, hours: null },
  ],

  targets: {
    age: { min: 18, max: 80 },
    bodyFatPct: { min: 5, max: 60 },
    underweightBmi: 18.5,
    activityFactors: {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      very_active: 1.725,
      extra_active: 1.9,
    },
    kcalPerKg: 7700,
    rates: {
      lose: [0.25, 0.5, 0.75, 1.0],
      gain: [0.25, 0.5],
      defaults: { lose: 0.5, gain: 0.25 },
    },
    rails: {
      maxDeficitPctOfTdee: 25,
      maxDeficitKcal: 1000,
      maxLossPctBodyWeightPerWeek: 1,
      maxSurplusPctOfTdee: 20,
      minKcal: { female: 1200, male: 1500 },
    },
    protein: {
      bmiThreshold: 25,
      excessWeightFactor: 0.4,
      gPerKg: {
        noLift: { lose: 1.2, maintain: 1.0, gain: 1.2 },
        lift: { lose: 2.0, maintain: 1.6, gain: 1.8 },
      },
      maintainNoLiftAge65: 1.2,
      prefRange: [0.8, 2.5],
      kidneyCapGPerKg: 0.8,
    },
    fat: { defaultPct: 30, prefRange: [20, 40], minPct: 20, minGPerKgPrw: 0.6 },
    carbs: { lowNoteBelowG: 100 },
    fiber: { gPer1000Kcal: 14, minG: 25 },
    rounding: { kcalStep: 10, gramStep: 1 },
  },
};
