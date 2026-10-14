// Katori nutrition rules: the single source of truth for every nutrition constant in the app.
// Owner: Dr. Ayesha Siddiqui (Nutrition Lab). Specification and algorithm: docs/NUTRITION.md.
//
// Plain data only (no functions, no imports). Units are in the key names:
//   Kcal = kilocalories, G = grams, Kg = kilograms, Cm = centimetres, Ml = millilitres,
//   Pct = percent (0-100), Hours = local "HH:MM" strings.
// Any change here must be mirrored in docs/NUTRITION.md and re-checked against test vectors A-H.

export default {
  version: '1.6.0',
  updated: '2026-10-14',

  // ---------------------------------------------------------------- energy
  energy: {
    // kcal per gram. `carbs` is AVAILABLE carbohydrate (fibre excluded).
    factors: { protein: 4, carbs: 4, fat: 9, fiber: 2 },
    // A food passes the energy check when
    //   |stated − computed| <= max(stated × pct / 100, kcal)
    // where computed = 4·protein + 4·carbs + 9·fat + 2·fiber.
    tolerance: { pct: 10, kcal: 10 },
    // Energy in 1 kg of body-weight change (used for goal rates).
    kcalPerKgBodyWeight: 7700,
  },

  // ---------------------------------------------------------------- profile
  // Input limits for the Profile type. Values outside are rejected by the UI.
  // Ages 13-17 are accepted but get no targets (derived flag `minor`).
  profileLimits: {
    ageYears: { min: 13, max: 100 },
    heightCm: { min: 120, max: 230 },
    weightKg: { min: 30, max: 250 },
    bodyFatPct: { min: 5, max: 60 },
  },
  sexes: [
    { id: 'female', label: 'Woman' },
    { id: 'male', label: 'Man' },
  ],

  // ---------------------------------------------------------------- onboarding skipped (test A1)
  // Used while sex, ageYears, heightCm or weightKg is missing (e.g. the user tapped Skip).
  // These are NOT personal targets and NOT computed by computeTargets: they are the EU food-label
  // reference intakes the Boss sees on every pack in Spain ("Reference intake of an average adult").
  // Independent reference values, so 4P+4C+9F does not have to equal kcal. Shown with `label`, a
  // "Reference" chip instead of "Estimate", and the `prompt` button. No health-flag logic applies.
  skipDefaults: {
    mode: 'reference',
    targets: { kcal: 2000, protein: 50, carbs: 260, fat: 70, fiber: 25 },
    referenceExtras: { sugars: 90, satFat: 20 }, // shown only as label-style references
    chip: 'Reference',
    label: 'Reference values for an average adult (2,000 kcal), as on EU food labels. Not personal to you.',
    prompt: 'Set up my targets (1 minute)',
    source: 'Regulation (EU) No 1169/2011, Annex XIII Part B (reference intakes: 8,400 kJ / 2,000 kcal, fat 70 g, saturates 20 g, carbohydrate 260 g, sugars 90 g, protein 50 g); fibre 25 g: EFSA adequate intake for adults (2010)',
    // Personal targets replace the reference as soon as ALL of these are known; anything else
    // missing takes `defaultsWhenMissing`, and the result is labelled an estimate as usual.
    requiredForPersonal: ['sex', 'ageYears', 'heightCm', 'weightKg'],
    defaultsWhenMissing: { activity: 'light', goal: 'maintain', rateKgPerWeek: 0, lifts: false, healthFlags: [] },
  },

  // ---------------------------------------------------------------- BMR
  bmr: {
    // Mifflin-St Jeor (1990): perKg·kg + perCm·cm + perYear·age + constant[sex]
    mifflinStJeor: { perKg: 10, perCm: 6.25, perYear: -5, constant: { male: 5, female: -161 } },
    // Katch-McArdle: constant + perKgLeanMass · kg · (1 − bodyFatPct/100).
    // Used instead of Mifflin when bodyFatPct is a number within profileLimits.bodyFatPct.
    katchMcArdle: { constant: 370, perKgLeanMass: 21.6 },
  },

  // ---------------------------------------------------------------- activity (TDEE = BMR × factor)
  activityLevels: [
    {
      id: 'sedentary',
      factor: 1.2,
      label: 'Mostly sitting',
      description: 'Desk job, studying or driving. Little walking and no exercise.',
    },
    {
      id: 'light',
      factor: 1.375,
      label: 'Lightly active',
      description: 'Housework or walking every day, or exercise 1 to 3 days a week.',
    },
    {
      id: 'moderate',
      factor: 1.55,
      label: 'Active',
      description:
        'On your feet most of the day (busy housework, shop or ward work), or exercise 3 to 5 days a week, for example the gym 4 days.',
    },
    {
      id: 'very_active',
      factor: 1.725,
      label: 'Very active',
      description:
        'Hard training 6 to 7 days a week, or a physical job such as labour or farm work.',
    },
    {
      id: 'extra_active',
      factor: 1.9,
      label: 'Extremely active',
      description: 'A physical job plus daily training, or training twice a day.',
    },
  ],
  defaultActivity: 'light', // "if unsure, pick this"; exercise calories are never added back

  // ---------------------------------------------------------------- goals and rails
  goals: [
    {
      id: 'lose',
      label: 'Lose weight',
      direction: -1,
      ratesKgPerWeek: [0.25, 0.5, 0.75, 1],
      defaultRateKgPerWeek: 0.5,
    },
    {
      id: 'maintain',
      label: 'Keep my weight',
      direction: 0,
      ratesKgPerWeek: [0],
      defaultRateKgPerWeek: 0,
    },
    {
      id: 'gain',
      label: 'Gain weight',
      direction: 1,
      ratesKgPerWeek: [0.25, 0.5],
      defaultRateKgPerWeek: 0.25,
    },
  ],
  defaultGoal: 'maintain',
  // Requested daily change = rateKgPerWeek × energy.kcalPerKgBodyWeight / 7.
  rails: {
    maxDeficitPctOfTdee: 25, // deficit <= 25% of TDEE
    maxDeficitKcal: 1000, // deficit <= 1,000 kcal/day
    maxLossPctBodyWeightPerWeek: 1, // deficit <= 1% of body weight per week, in kcal/day
    maxSurplusPctOfTdee: 20, // surplus <= 20% of TDEE
    // When losing, the target never goes below this floor, unless TDEE itself is lower,
    // in which case the target is TDEE (no deficit). Not applied to maintain or gain.
    minKcalWhenLosing: { female: 1200, male: 1500 },
  },

  // ---------------------------------------------------------------- protein
  // Protein reference weight (PRW):
  //   BMI <= bmiAbove:  PRW = weightKg
  //   BMI >  bmiAbove:  PRW = W + excessFraction · (weightKg − W), W = referenceBmi · heightM²
  proteinReferenceWeight: { bmiAbove: 25, referenceBmi: 25, excessFraction: 0.4 },
  protein: {
    // g per kg PRW, chosen by `lifts` (resistance training >= 2 days a week) and the effective goal.
    gPerKgPrw: {
      noLift: { lose: 1.2, maintain: 1.0, gain: 1.2 },
      lift: { lose: 2.0, maintain: 1.6, gain: 1.8 },
    },
    olderAdult: { minAgeYears: 65, minGPerKgPrw: 1.2 }, // raises the table value, never lowers it
    overrideGPerKgPrw: { min: 0.8, max: 2.5 }, // range for a user's own g/kg choice
  },

  // ---------------------------------------------------------------- fat, carbs, fibre
  fat: {
    defaultPctOfKcal: 30,
    pctOfKcalRange: { min: 20, max: 40 }, // range for a user's own % choice
    // Fat never goes below max(floorPctOfKcal% of kcal / 9, floorGPerKgPrw × PRW), rounded UP.
    floorPctOfKcal: 20,
    floorGPerKgPrw: 0.6,
  },
  carbs: {
    // carbs = (kcal − 4·protein − 9·fat) / 4. Never clamped up; below this, show a note.
    noteBelowG: 100,
  },
  fiber: { gPer1000Kcal: 14, minG: 25 },

  // ---------------------------------------------------------------- rounding
  rounding: {
    method: 'half-up', // Math.round for the positive numbers used here
    kcalStep: 10, // final kcal target to the nearest 10
    macroStepG: 1, // protein, fat, carbs, fibre to the nearest 1 g
    fatFloorRounding: 'up', // the fat floor is rounded up (Math.ceil)
    checkToleranceKcal: 5, // |4P + 4C + 9F − kcal| must be <= 5 after rounding
    per100gDecimals: 1, // stored food values: macros to 0.1 g; kcal stored as whole numbers
  },

  // ---------------------------------------------------------------- health flags
  // Effects (all optional):
  //   noTargets: true            → return null for every nutrient target; logging only
  //   lockGoal: '<goalId>'       → the effective goal is always this one
  //   disallowGoals: [goalIds]   → if the chosen goal is listed, the effective goal becomes 'maintain'
  //   maxProteinGPerKgPrw: n     → protein g/kg is capped at n (after every other protein rule)
  //   offerHideCalories: true    → UI offers to hide calorie numbers
  // Every active flag's id is added to the `warnings` array of computeTargets; the UI shows `note`.
  healthFlags: [
    {
      id: 'pregnant',
      label: 'Pregnant',
      appliesToSex: ['female'],
      effect: { lockGoal: 'maintain' },
      note: 'During pregnancy your needs are higher than this estimate and change by trimester. Please ask your doctor or a dietitian to set your targets. Logging food is still fine.',
    },
    {
      id: 'breastfeeding',
      label: 'Breastfeeding',
      appliesToSex: ['female'],
      effect: { lockGoal: 'maintain' },
      note: 'While breastfeeding your needs are higher than this estimate. Please ask your doctor or a dietitian to set your targets. Logging food is still fine.',
    },
    {
      id: 'eating_disorder',
      label: 'I have, or have had, an eating disorder',
      appliesToSex: ['female', 'male'],
      effect: { disallowGoals: ['lose'], offerHideCalories: true },
      note: 'We have turned off weight-loss goals. You can hide calorie numbers in Profile. A doctor or dietitian can help you set targets that feel safe.',
    },
    {
      id: 'kidney_disease',
      label: 'Kidney disease',
      appliesToSex: ['female', 'male'],
      effect: { maxProteinGPerKgPrw: 0.8 },
      note: 'With kidney disease, protein needs a doctor or renal dietitian. We have capped protein at 0.8 g per kg. Please check your targets with them.',
    },
    {
      id: 'diabetes_hypo_risk',
      label:
        'Diabetes treated with insulin or sulfonylurea tablets (such as gliclazide or glimepiride)',
      appliesToSex: ['female', 'male'],
      effect: {},
      note: 'Eating less, or fasting in Ramadan, can cause low blood sugar with these medicines. Talk to your doctor before changing how much you eat.',
    },
  ],
  // Flags the app derives from the profile; the user does not tick these.
  derivedFlags: [
    {
      id: 'minor',
      when: { ageYearsBelow: 18 },
      effect: { noTargets: true },
      note: 'This calculator is for adults. Growing bodies need different amounts, so please see a doctor or dietitian for targets. You can still log food.',
    },
    {
      id: 'underweight',
      when: { bmiBelow: 18.5 },
      effect: { disallowGoals: ['lose'] },
      note: 'Your weight is already below the healthy range, so we have turned off weight-loss goals. A doctor or dietitian can help.',
    },
    {
      id: 'age_over_80',
      when: { ageYearsAbove: 80 },
      effect: {},
      note: 'The formula is less accurate after 80. Treat this number as a rough guide and check it with your doctor.',
    },
  ],

  // Warning codes computeTargets may return (besides active flag ids), with the text to show.
  warnings: {
    estimate: 'This is an estimate (about ±10%). Change it if your weight trend says otherwise.',
    deficit_capped: 'Your target keeps weight loss to a safe, steady pace that you can keep up.',
    surplus_capped: 'We slowed your weight-gain pace to a steadier rate.',
    kcal_floor: 'Your target is set to the lowest level we recommend without professional support.',
    goal_changed:
      'Because of the health information you gave, your goal is set to "Keep my weight".',
    fat_floor: 'Fat is set to the healthy minimum.',
    low_carbs:
      'Carbs are under 100 g a day. That is fine if you chose it, but most people feel better with more.',
    protein_capped: 'Protein is capped because of the health information you gave.',
    protein_reduced_to_fit:
      'Your protein choice did not fit inside your calories with the minimum healthy fat, so we lowered protein to the most that fits.',
    no_targets: 'No targets are set. You can still log food.',
  },

  // ---------------------------------------------------------------- meal slots
  // sharePct guides suggestions and templates only (never enforced). Shares sum to 100.
  // hours = [startMinute, endMinute): minutes since local midnight, half-open, used to pick the
  // default slot from the clock. Within each set the windows cover all 24 hours (0-1440) without
  // overlap; a window may wrap past midnight (start > end). Comments give the same times as HH:MM.
  mealSlots: {
    default: [
      { id: 'breakfast', label: 'Nashta', labelUr: 'ناشتہ', sharePct: 25, hours: [240, 660] }, // 04:00-11:00
      { id: 'lunch', label: 'Lunch', labelUr: 'دوپہر کا کھانا', sharePct: 30, hours: [660, 930] }, // 11:00-15:30
      {
        id: 'evening',
        label: 'Shaam ki chai',
        labelUr: 'شام کی چائے',
        sharePct: 10,
        hours: [930, 1110],
      }, // 15:30-18:30
      { id: 'dinner', label: 'Dinner', labelUr: 'رات کا کھانا', sharePct: 30, hours: [1110, 1440] }, // 18:30-24:00
      { id: 'snacks', label: 'Snacks', labelUr: 'اسنیکس', sharePct: 5, hours: [0, 240] }, // 00:00-04:00
    ],
    // Spanish meal times (Meeting 002, decision 2): same ids, Spanish clock and shares.
    spain: [
      // Labels per Meeting 003 item 3: Spanish meal names on the Spanish clock.
      { id: 'breakfast', label: 'Breakfast / café', labelUr: 'ناشتہ / کافی', sharePct: 20, hours: [300, 750] }, // 05:00-12:30 (incl. mid-morning café)
      { id: 'lunch', label: 'Lunch', labelUr: 'دوپہر کا کھانا', sharePct: 35, hours: [750, 990] }, // 12:30-16:30 (lunch box)
      { id: 'evening', label: 'Merienda', labelUr: 'میرینڈا (شام کا ناشتہ)', sharePct: 10, hours: [990, 1200] }, // 16:30-20:00 (merienda)
      { id: 'dinner', label: 'Dinner', labelUr: 'رات کا کھانا', sharePct: 30, hours: [1200, 1440] }, // 20:00-24:00
      { id: 'snacks', label: 'Snacks', labelUr: 'اسنیکس', sharePct: 5, hours: [0, 300] }, // 00:00-05:00 (Meeting 003: after midnight defaults to Snacks)
    ],
    // Ramadan mode (Sprint 2). Hours are typical for Pakistan and shift with sunrise and sunset.
    ramadan: [
      { id: 'sehri', label: 'Sehri', labelUr: 'سحری', sharePct: 35, hours: [60, 720] }, // 01:00-12:00
      { id: 'iftar', label: 'Iftar', labelUr: 'افطار', sharePct: 25, hours: [720, 1170] }, // 12:00-19:30
      { id: 'dinner', label: 'Dinner', labelUr: 'رات کا کھانا', sharePct: 30, hours: [1170, 1290] }, // 19:30-21:30
      {
        id: 'after_taraweeh',
        label: 'After taraweeh',
        labelUr: 'تراویح کے بعد',
        sharePct: 10,
        hours: [1290, 60],
      }, // 21:30-01:00
    ],
  },
  // Which slot preset a new user starts with: by the device's IANA time zone
  // (Intl.DateTimeFormat().resolvedOptions().timeZone); anything not listed gets `fallback`.
  // The user can switch preset or rename slots in Profile.
  mealSlotPresetDefault: {
    byTimeZone: { 'Europe/Madrid': 'spain', 'Africa/Ceuta': 'spain', 'Atlantic/Canary': 'spain' },
    fallback: 'default',
  },
  ramadan: { minProteinGAtSehri: 30, fluidsReminder: true },

  // ---------------------------------------------------------------- meal prep (Sprint 2 feature)
  // Use-by of a box = cookedDate + min(fridgeDays of its components). A frozen box has no use-by;
  // when moved to the fridge, useBy = movedDate + thawedFridgeDays. On the use-by date show
  // "last day"; after it "past use-by, best not to eat" (calm, no red).
  mealPrep: {
    storage: [
      { id: 'cooked-starch', label: 'Cooked rice, pasta, couscous, bulgur', fridgeDays: 1, freezerMonths: 1, freezable: true, source: 'NHS "Can reheating rice cause food poisoning?" and UK FSA (Bacillus cereus): chill within 1 hour, keep in the fridge no more than 1 day' },
      { id: 'cooked-meat', label: 'Cooked chicken, meat, keema, kebabs', fridgeDays: 3, freezerMonths: 3, freezable: true, source: 'USDA FSIS "Leftovers and Food Safety": 3-4 days in the fridge (lower bound used), 3-4 months frozen' },
      { id: 'egg-dish', label: 'Tortilla and other egg dishes', fridgeDays: 3, freezerMonths: null, freezable: false, source: 'USDA FSIS: egg dishes 3-4 days (lower bound used); quality suffers when frozen' },
      { id: 'cold-salad', label: 'Tuna or chickpea salad, raita, cut salad, yogurt sauces', fridgeDays: 2, freezerMonths: null, freezable: false, source: 'Nutrition Lab conservative rule' },
      { id: 'cooked-curry', label: 'Cooked daal, sabzi and other cooked vegetable or legume dishes', fridgeDays: 3, freezerMonths: 3, freezable: true, source: 'USDA FSIS "Leftovers and Food Safety": cooked leftovers 3-4 days (lower bound used), 3-4 months frozen' },
      { id: 'egg-muffin', label: 'Baked egg muffins and egg bites', fridgeDays: 3, freezerMonths: 2, freezable: true, source: 'USDA FSIS cold storage chart: quiche/egg casseroles 3-5 days refrigerated, 2-3 months frozen (lower bounds used)' },
      { id: 'overnight-oats', label: 'Overnight oats and chia pudding (soaked in milk, yogurt or plant milk; not cooked)', fridgeDays: 3, freezerMonths: null, freezable: false, source: 'Nutrition Lab conservative rule (dairy-based, uncooked; opened milk is used within 3 days)' },
      { id: 'cooked-flatbread', label: 'Cooked parathas and rotis', fridgeDays: 2, freezerMonths: 2, freezable: true, source: 'Nutrition Lab rule (quality and staling); freeze between sheets of baking paper, reheat on the tawa until hot' },
    ],
    thawedFridgeDays: 1,
    chillWithinMinutes: 60,
    fridgeMaxC: 5,
    reheat: { minCoreTempC: 75, maxTimes: 1 },
    unchilledMaxHours: 2,
    unchilledMaxHoursAbove32C: 1,
    boxTargets: { kcal: { min: 550, max: 750 }, proteinG: { min: 35, max: 50 }, minFiberG: 8 }, // = targetsBySlot.lunch
    // Design targets per primary slot for library recipes (the data gate uses looser bands).
    targetsBySlot: {
      breakfast: { kcal: { min: 300, max: 550 }, proteinG: { min: 25, max: 40 }, minFiberG: 5 },
      lunch: { kcal: { min: 550, max: 750 }, proteinG: { min: 35, max: 50 }, minFiberG: 8 },
      dinner: { kcal: { min: 500, max: 800 }, proteinG: { min: 30, max: 50 }, minFiberG: 8 },
      snacks: { kcal: { min: 150, max: 300 }, proteinG: { min: 15, max: 30 }, minFiberG: 3 },
    },
    // Container serving ids for prepared portions (label "1 box", "1 jar", "1 portion").
    prepServingIds: ['box', 'jar', 'portion'],
  },

  // ---------------------------------------------------------------- vocabularies (RULES.vocab)
  // Every record field that takes a fixed value is checked against these lists.
  vocab: {
    // ---------------------------------------------------------------- food groups (record.group, HARD)
    // kcalPer100g: the record's per100g.kcal must lie within [min, max].
    // fiberZero:   per100g.fiber must be exactly 0.
    // servingGrams: every serving's grams must lie within [min, max].
    // katoriServed: records must offer the servings katori-small, katori, katori-large and tbsp
    //              (grams = ml × one density for the dish; see householdMeasures).
    // If a genuine food falls outside a range, tell Ayesha: the range is changed here, never per record.
    // servingGrams does NOT apply to household-measure servings (ids in householdMeasures: katori-*,
    // cup, mug, glass, tbsp, tsp; checked by density instead) or to whole-dish servings (servingRules).
    groups: [
      {
        id: 'bread',
        label: 'Breads',
        examples: 'roti, chapati, tandoori roti, naan, kulcha, sliced bread, pita, pan con tomate',
        kcalPer100g: { min: 180, max: 380 },
        fiberZero: false,
        servingGrams: { min: 15, max: 250 },
      },
      {
        id: 'bread-fried',
        label: 'Parathas, fried breads and oil-dressed toast',
        examples: 'paratha, aloo paratha, lachha paratha, puri, bhatura, tostada con aceite',
        kcalPer100g: { min: 200, max: 480 }, // stuffed parathas (aloo, mooli, gobhi) are ~200-260
        fiberZero: false,
        servingGrams: { min: 20, max: 250 },
      },
      {
        id: 'grain-cooked',
        label: 'Plain cooked rice, pasta and grains',
        examples: 'boiled rice, brown rice, plain pasta, couscous, quinoa, porridge',
        kcalPer100g: { min: 50, max: 180 },
        fiberZero: false,
        katoriServed: true,
        servingGrams: { min: 30, max: 500 },
      },
      {
        id: 'rice-dish',
        label: 'Rice dishes',
        examples: 'biryani, pulao, khichdi, zeera rice, fried rice, paella',
        kcalPer100g: { min: 110, max: 260 },
        fiberZero: false,
        katoriServed: true,
        servingGrams: { min: 30, max: 600 },
      },
      {
        id: 'curry-meat',
        label: 'Meat, chicken and fish curries',
        examples: 'salan, karahi, qorma, aloo gosht, keema, nihari, haleem, paye, albondigas',
        kcalPer100g: { min: 90, max: 360 },
        fiberZero: false,
        katoriServed: true,
        servingGrams: { min: 30, max: 500 },
      },
      {
        id: 'curry-veg',
        label: 'Vegetable dishes',
        examples: 'sabzi, bhindi, aloo matar, saag, karela, baingan, pisto',
        kcalPer100g: { min: 40, max: 250 },
        fiberZero: false,
        katoriServed: true,
        servingGrams: { min: 30, max: 400 },
      },
      {
        id: 'daal-legume',
        label: 'Daal and legume dishes',
        examples: 'daal masoor, mash, chana, moong, cholay, lobia, rajma, lentejas, garbanzos',
        kcalPer100g: { min: 60, max: 250 },
        fiberZero: false,
        katoriServed: true,
        servingGrams: { min: 30, max: 450 },
      },
      {
        id: 'grill-kebab',
        label: 'Kebabs, tikka, BBQ and fried chicken',
        examples: 'seekh kebab, chicken tikka, malai boti, chapli kebab, shami kebab, broast',
        kcalPer100g: { min: 120, max: 380 },
        fiberZero: false,
        servingGrams: { min: 15, max: 400 },
      },
      {
        id: 'meat-fish',
        label: 'Plain meat, poultry and fish',
        examples: 'chicken breast, mince, mutton, rohu, prawns, canned tuna (raw or simply cooked)',
        kcalPer100g: { min: 60, max: 350 },
        fiberZero: true,
        servingGrams: { min: 15, max: 400 },
      },
      {
        id: 'egg',
        label: 'Eggs and egg dishes',
        examples: 'boiled egg, fried egg, omelette, anda curry, tortilla de patatas, shakshuka',
        kcalPer100g: { min: 40, max: 260 },
        fiberZero: false,
        servingGrams: { min: 30, max: 350 },
      },
      {
        id: 'dairy',
        label: 'Milk, yogurt, cheese and cream',
        examples: 'milk, dahi, Greek yogurt, paneer, cheese, cream, khoya',
        kcalPer100g: { min: 30, max: 420 },
        fiberZero: true,
        servingGrams: { min: 5, max: 500 },
      },
      {
        id: 'fat-oil',
        label: 'Oils, ghee and butter',
        examples: 'cooking oil, desi ghee, banaspati, butter, olive oil, margarine',
        kcalPer100g: { min: 500, max: 900 },
        fiberZero: true,
        servingGrams: { min: 2, max: 30 },
      },
      {
        id: 'fruit',
        label: 'Fresh fruit',
        examples: 'banana, apple, mango, kinnow, guava, melon, avocado',
        kcalPer100g: { min: 15, max: 170 },
        fiberZero: false,
        servingGrams: { min: 5, max: 600 },
      },
      {
        id: 'fruit-dried',
        label: 'Dates and dried fruit',
        examples: 'khajoor, chhuhara, raisins, dried apricots, figs',
        kcalPer100g: { min: 230, max: 360 },
        fiberZero: false,
        servingGrams: { min: 3, max: 100 },
      },
      {
        id: 'vegetable',
        label: 'Vegetables and plain salad',
        examples: 'cucumber, tomato, onion, carrot, boiled potato, kachumber without dressing',
        kcalPer100g: { min: 10, max: 110 },
        fiberZero: false,
        servingGrams: { min: 5, max: 400 },
      },
      {
        id: 'nuts-seeds',
        label: 'Nuts, seeds and roasted pulses',
        examples: 'almonds, peanuts, walnuts, peanut butter, tahini, bhuna chana',
        kcalPer100g: { min: 350, max: 720 },
        fiberZero: false,
        servingGrams: { min: 5, max: 100 },
      },
      {
        id: 'side-dip',
        label: 'Raita, dressed salads and dips',
        examples: 'raita, chutney with yogurt, hummus, tzatziki, Greek salad',
        kcalPer100g: { min: 20, max: 350 },
        fiberZero: false,
        katoriServed: true,
        servingGrams: { min: 10, max: 250 },
      },
      {
        id: 'condiment',
        label: 'Sauces, pickles and spreads',
        examples: 'ketchup, mayonnaise, achaar, imli chutney, chilli sauce, mustard',
        kcalPer100g: { min: 10, max: 750 },
        fiberZero: false,
        servingGrams: { min: 2, max: 60 },
      },
      {
        id: 'sugar-sweetener',
        label: 'Sugar, gur, honey, jam and syrups',
        examples: 'cheeni, gur, shakkar, honey, jam, Rooh Afza syrup',
        kcalPer100g: { min: 240, max: 400 },
        fiberZero: false,
        servingGrams: { min: 2, max: 40 },
      },
      {
        id: 'drink-tea-coffee',
        label: 'Chai, tea and coffee',
        examples: 'doodh patti, dhaba chai, Kashmiri chai, green tea, qehwa, black coffee, latte',
        kcalPer100g: { min: 0, max: 160 },
        fiberZero: true,
        servingGrams: { min: 30, max: 500 },
      },
      {
        id: 'drink-milk',
        label: 'Milk and yogurt drinks',
        examples: 'lassi, milkshake, doodh soda, Rooh Afza with milk, falooda',
        kcalPer100g: { min: 25, max: 220 }, // salted lassi and chaas are ~25-35
        fiberZero: false,
        servingGrams: { min: 100, max: 600 },
      },
      {
        id: 'drink-other',
        label: 'Juices, soft drinks and sharbat',
        examples: 'fresh juice, sugarcane juice, cola, nimbu pani, sharbat, sports drinks',
        kcalPer100g: { min: 0, max: 90 },
        fiberZero: false,
        servingGrams: { min: 30, max: 750 },
      },
      {
        id: 'sweet-dessert',
        label: 'Desi sweets and desserts',
        examples: 'kheer, gulab jamun, jalebi, halwa, barfi, ras malai, custard, ice cream',
        kcalPer100g: { min: 90, max: 500 },
        fiberZero: false,
        servingGrams: { min: 10, max: 300 },
      },
      {
        id: 'biscuit-bakery',
        label: 'Biscuits, rusks and bakery',
        examples: 'tea biscuits, rusk, cake rusk, nankhatai, cake, croissant',
        kcalPer100g: { min: 280, max: 560 },
        fiberZero: false,
        servingGrams: { min: 5, max: 150 },
      },
      {
        id: 'snack-fried',
        label: 'Fried snacks',
        examples: 'samosa, pakora, fries, spring roll, croquetas, falafel, patatas bravas',
        kcalPer100g: { min: 150, max: 420 },
        fiberZero: false,
        servingGrams: { min: 10, max: 400 },
      },
      {
        id: 'snack-packaged',
        label: 'Chips, nimko and crackers',
        examples: 'crisps, nimko, dalmoth, salted crackers, popcorn',
        kcalPer100g: { min: 350, max: 600 },
        fiberZero: false,
        servingGrams: { min: 5, max: 150 },
      },
      {
        id: 'fastfood',
        label: 'Burgers, pizza, rolls and sandwiches',
        examples: 'zinger burger, bun kebab, shawarma, paratha roll, pizza, club sandwich',
        kcalPer100g: { min: 150, max: 350 },
        fiberZero: false,
        servingGrams: { min: 50, max: 600 },
      },
      {
        id: 'chaat',
        label: 'Chaat and cold street dishes',
        examples: 'fruit chaat, chana chaat, dahi bhalla, gol gappay, papri chaat',
        kcalPer100g: { min: 60, max: 260 },
        fiberZero: false,
        servingGrams: { min: 50, max: 400 },
      },
      {
        id: 'soup',
        label: 'Soups and broths',
        examples: 'yakhni, chicken corn soup, lentil soup, gazpacho',
        kcalPer100g: { min: 10, max: 150 },
        fiberZero: false,
        katoriServed: true,
        servingGrams: { min: 100, max: 500 },
      },
      {
        id: 'pasta-dish',
        label: 'Pasta and noodle dishes',
        examples: 'spaghetti bolognese, chicken pasta, chow mein, macaroni, lasagne',
        kcalPer100g: { min: 90, max: 260 },
        fiberZero: false,
        servingGrams: { min: 100, max: 500 },
      },
      {
        id: 'dry-staple',
        label: 'Flours, dry grains, dry pulses and cereals (as sold)',
        examples: 'atta, besan, raw rice, dry daal, oats, cornflakes, muesli, granola',
        kcalPer100g: { min: 300, max: 500 },
        fiberZero: false,
        servingGrams: { min: 5, max: 200 },
      },
      {
        id: 'protein-supplement',
        label: 'Protein powders and bars',
        examples: 'whey protein, plant protein, protein bar',
        kcalPer100g: { min: 300, max: 430 },
        fiberZero: false,
        servingGrams: { min: 15, max: 100 },
      },
      {
        // Meal-prep portions for ANY slot (Meeting 002 + the Boss's widening): lunch boxes, breakfast
        // jars and preps, freezer dinners. The id stays `lunchbox` (engineering contract, foods.BOX).
        // One record = one prepared portion; values per 100 g as eaten.
        // prepServing (gate G22): the record's DEFAULT serving must have one of `ids`; its energy must
        // fall in kcalBySlot for the record's PRIMARY slot = slots[0] (slots is required here).
        // Design targets (tighter) are in RULES.mealPrep.targetsBySlot.
        id: 'lunchbox',
        label: 'Meal-prep portions (box, jar or portion; any meal)',
        examples: 'chicken tikka rice bowl, keema matar with rice, overnight oats jar, egg muffins, frozen chicken qorma portion',
        kcalPer100g: { min: 80, max: 350 },
        fiberZero: false,
        servingGrams: { min: 50, max: 800 },
        prepServing: {
          ids: ['box', 'jar', 'portion'],
          kcalBySlot: {
            breakfast: { min: 250, max: 650 },
            lunch: { min: 450, max: 850 },
            evening: { min: 100, max: 400 },
            dinner: { min: 400, max: 900 },
            snacks: { min: 100, max: 400 },
          },
        },
      },
    ],

    // Serving rules that apply to every group (data gate G10-G11).
    servingRules: {
      maxKcalPerServing: 1500, // one unit of an ordinary serving
      // Whole-dish servings: id 'whole' or 'whole-<word>' (a whole tortilla, a whole pizza, a whole
      // handi). Exempt from the group's servingGrams max (the min still applies), never the default
      // serving, and bounded by these limits instead. Users log a share with the ½ / ¼ buttons.
      wholeDish: { idPrefix: 'whole', maxGrams: 3000, maxKcal: 4000, mayBeDefault: false },
      measureDensityGPerMl: { min: 0.3, max: 1.5 }, // household-measure servings (G11)
      // "Plate" servings (Meeting 003, item 5). No published served-plate weight exists (NUTRITION.md §5.5),
      // so a serving with one of these ids is a Lab assumption: its label must contain `labelMustInclude`,
      // and when the food has a `katori` serving its grams must be a whole or half multiple of it (±2%),
      // so the plate is stated in katoris. Checked by gate G23.
      assumedPlate: { ids: ['plate', 'half-plate'], labelMustInclude: 'assumed', katoriMultipleStep: 0.5, tolerancePct: 2 },
    },

    // ---------------------------------------------------------------- vocabularies
    // record.tags: every tag must be listed here. Rules: at least one `cuisine` tag; `vegan`
    // requires `vegetarian`; at most one `seafood` tag (use the most restrictive one in the dish:
    // other > prawn > fish). Halal status is NOT a tag: see record.halal and halalStatuses below.
    tags: [
      { id: 'pakistani', kind: 'cuisine', label: 'Pakistani' },
      { id: 'desi-chinese', kind: 'cuisine', label: 'Desi Chinese' },
      { id: 'spanish', kind: 'cuisine', label: 'Spanish' },
      { id: 'catalan', kind: 'cuisine', label: 'Catalan' },
      { id: 'mediterranean', kind: 'cuisine', label: 'Mediterranean' },
      { id: 'middle-eastern', kind: 'cuisine', label: 'Middle Eastern' },
      { id: 'western', kind: 'cuisine', label: 'Western' },
      { id: 'international', kind: 'cuisine', label: 'International (generic food)' },
      { id: 'vegetarian', kind: 'diet', label: 'Vegetarian' },
      { id: 'vegan', kind: 'diet', label: 'Vegan' },
      { id: 'contains-egg', kind: 'diet', label: 'Contains egg' },
      { id: 'seafood-fish', kind: 'seafood', label: 'Fish' },
      { id: 'seafood-prawn', kind: 'seafood', label: 'Prawns or shrimp' },
      { id: 'seafood-other', kind: 'seafood', label: 'Other seafood (squid, octopus, mussels, clams, crab, lobster)' },
      { id: 'packaged', kind: 'other', label: 'Packaged product' },
      { id: 'gym', kind: 'other', label: 'Gym staple' },
      { id: 'fried', kind: 'other', label: 'Deep-fried' },
      { id: 'iftar', kind: 'other', label: 'Iftar favourite' },
      { id: 'meal-prep', kind: 'other', label: 'Good for meal prep' },
      { id: 'eat-cold', kind: 'other', label: 'Good cold (no microwave needed)' },
    ],
    tagRules: { minCuisineTags: 1, veganRequiresVegetarian: true, maxSeafoodTags: 1 },

    // record.halal = { status, reason? }. Required on every record (Meeting 002, decision 4).
    // reason: one plain, factual line; required unless status is 'halal'.
    // A recipe or box takes the WORST status of its ingredients (order: not-halal > check > halal).
    halalStatuses: [
      { id: 'halal', label: 'Halal', reasonRequired: false, description: 'Plant foods, dairy, eggs, fish, and meat from a halal butcher or with halal certification.' },
      { id: 'check', label: 'Check', reasonRequired: true, description: 'Possible lard (pastries), gelatine, often cooked with wine, restaurant meat in Spain, imported product without a halal seal.' },
      { id: 'not-halal', label: 'Not halal', reasonRequired: true, description: 'Only non-meat foods whose standard recipe contains lard (e.g. ensaïmada). Never suggested; hidden by "Halal only".' },
    ],
    halalRules: {
      worstFirst: ['not-halal', 'check', 'halal'],
      halalOnlyFilterDefault: true, // the search filter "Halal only" starts ON
      notHalal: {
        // A not-halal record must be a non-meat item whose standard recipe contains lard.
        forbiddenGroups: ['meat-fish', 'curry-meat', 'grill-kebab', 'lunchbox'],
        reasonMustMention: ['lard', 'manteca', 'saïm', 'saim'],
        neverSuggested: true, // not in suggestions, templates or recipe pickers
      },
      // Seafood setting (onboarding question in Sprint 2). Records stay status 'halal'; the app
      // shows 'check' with seafoodNote when a food's seafood tag is outside the user's choice.
      seafoodChoices: [
        { id: 'all', label: 'All seafood', allows: ['seafood-fish', 'seafood-prawn', 'seafood-other'] },
        { id: 'fish-prawns', label: 'Fish and prawns', allows: ['seafood-fish', 'seafood-prawn'] },
        { id: 'fish-only', label: 'Fish only', allows: ['seafood-fish'] },
      ],
      seafoodDefault: 'all',
      seafoodNote: 'Depends on your school of thought.',
      crossContactNote: 'Cafés and restaurants may share slicers, grills or fryers with pork. Katori does not track this per food; ask if it matters to you.',
    },

    // Pork meat and alcohol stay out of the database. The data gate rejects `words` (whole words,
    // any case) in name, nameRoman or aliases, unless the same text also has an allowed qualifier.
    // `lardWords` are allowed only on records whose halal.status is 'not-halal' (unless qualified,
    // e.g. "manteca de cacao" = cocoa butter).
    banned: {
      words: [
        'pork', 'bacon', 'ham', 'jamon', 'jamón', 'pernil', 'chorizo', 'salami', 'pepperoni', 'sausage',
        'fuet', 'sobrasada', 'sobrassada', 'butifarra', 'botifarra', 'panceta', 'morcilla', 'cerdo', 'porc',
        'wine', 'vino', 'beer', 'cerveza', 'cervesa', 'cava', 'rum', 'whisky', 'whiskey', 'vodka',
        'sangria', 'brandy', 'coñac', 'liqueur', 'licor', 'sherry', 'alcohol',
      ],
      allowedQualifiers: [
        'chicken', 'pollo', 'pollastre', 'beef', 'ternera', 'vedella', 'vacuno', 'turkey', 'pavo',
        'halal', 'mutton', 'cordero', 'vinegar', 'vinagre', 'non-alcoholic', 'alcohol-free',
      ],
      lardWords: ['lard', 'manteca', 'saïm', 'saim'],
      lardQualifiers: ['cacao', 'cacahuete', 'karité'],
    },

    styles: [
      { id: 'home', label: 'Home-made', labelRoman: 'Ghar ka' },
      { id: 'restaurant', label: 'Restaurant', labelRoman: 'Restaurant' },
      { id: 'dhaba', label: 'Dhaba', labelRoman: 'Dhaba' },
      { id: 'street', label: 'Street stall', labelRoman: 'Thela' },
    ],

    sourceMethods: [
      {
        id: 'direct',
        label:
          'Taken directly from a food composition table entry for the same food in the same state',
      },
      {
        id: 'recipe',
        label: 'Calculated from a standard recipe (ingredients, yield, added fat stated)',
      },
      { id: 'label', label: 'From a dated product label' },
      { id: 'analogue', label: 'Borrowed from a close, named analogue food' },
    ],

    confidenceGrades: [
      {
        id: 'A',
        label: 'Measured',
        badge: null,
        description: 'Direct match to an analysed table entry (method must be direct).',
      },
      {
        id: 'B',
        label: 'Good match',
        badge: null,
        description: 'Close analogue, product label, or recipe with a known cooked yield.',
      },
      {
        id: 'C',
        label: 'Estimate',
        badge: 'estimate',
        description:
          'Recipe with assumed oil and yield, or a dish that varies a lot between cooks.',
      },
    ],
  },

  // ---------------------------------------------------------------- household measures (reference)
  // Researchers use these when a food is served in these units: serving grams = ml × the food's
  // density. Food-specific servings (a roti, a samosa) live on each record with their own source.
  householdMeasures: [
    {
      id: 'katori-small',
      label: 'Small katori',
      labelUr: 'چھوٹی کٹوری',
      ml: 155,
      source:
        'ICMR-NIN Dietary Guidelines for Indians 2024, Annexure I (standard katori C8, 155 ml)',
    },
    {
      id: 'katori',
      label: 'Katori (medium)',
      labelUr: 'کٹوری',
      ml: 200,
      source:
        'ICMR-NIN Dietary Guidelines for Indians 2024, Annexure I (standard katori C7, 200 ml; "1 cup/katori = 200 ml")',
    },
    {
      id: 'katori-large',
      label: 'Large katori',
      labelUr: 'بڑی کٹوری',
      ml: 360,
      source:
        'ICMR-NIN Dietary Guidelines for Indians 2024, Annexure I (standard katori C6, 360 ml)',
    },
    {
      id: 'cup',
      label: 'Cup (chai cup)',
      labelUr: 'کپ',
      ml: 200,
      source: 'ICMR-NIN Dietary Guidelines for Indians 2024, Annexure I ("1 cup/katori = 200 ml")',
    },
    {
      id: 'mug',
      label: 'Mug or large cup',
      labelUr: 'مگ',
      ml: 250,
      source:
        'Pakistan Dietary Guidelines for Better Nutrition (MoPD&R and FAO, 2019): "1 cup = 250 ml"',
    },
    {
      id: 'glass',
      label: 'Glass',
      labelUr: 'گلاس',
      ml: 250,
      source:
        'Pakistan Dietary Guidelines for Better Nutrition (MoPD&R and FAO, 2019): 8 glasses = 2 litres',
    },
    {
      id: 'tbsp',
      label: 'Tablespoon (bara chamach)',
      labelUr: 'بڑا چمچ',
      ml: 15,
      source: 'ICMR-NIN Dietary Guidelines for Indians 2024, Annexure I (tablespoon 15)',
    },
    {
      id: 'tsp',
      label: 'Teaspoon (chhota chamach)',
      labelUr: 'چھوٹا چمچ',
      ml: 5,
      source: 'ICMR-NIN Dietary Guidelines for Indians 2024, Annexure I (teaspoon 5)',
    },
  ],
  // Quick portion chips the UI offers on every food, as a quantity of the food's DEFAULT serving
  // (Meeting 003, item 4; NUTRITION.md §5.6). They are not servings: the entry is stored as
  // { servingId: <default id>, qty }. The taste chip ("thora sa") is hidden when any `hideWhen` rule is
  // true, because a quarter of a spoon of oil, sugar or ketchup, or of one biscuit, is not a useful entry.
  portionChips: {
    taste: {
      qty: 0.25,
      label: 'Thora sa (a taste)',
      labelUr: 'تھوڑا سا',
      hideWhen: {
        groups: ['fat-oil', 'sugar-sweetener', 'condiment'], // add-ons already measured in spoons
        defaultServingIds: ['tsp', 'tbsp'], // the default is already a taste-sized measure
        quarterGramsBelow: 5, // a quarter of the default weighs under 5 g (one biscuit, one date)
      },
      searchWords: ['taste', 'tasting', 'thora sa', 'thora', 'chakhna', 'bacha hua', 'leftover', 'leftovers'],
    },
  },
  // Reference gram weights for common items (USDA FNDDS 2021-2023 / SR Legacy portion tables).
  referenceWeightsG: [
    {
      id: 'roti-small',
      label: 'Roti, small (6 in / 15 cm)',
      grams: 27,
      source: 'USDA FNDDS 2707713 Bread, chappatti or roti',
    },
    {
      id: 'roti-medium',
      label: 'Roti, medium (7 in / 18 cm)',
      grams: 40,
      source: 'USDA FNDDS 2707713 Bread, chappatti or roti',
    },
    {
      id: 'roti-large',
      label: 'Roti, large (8 in / 20 cm)',
      grams: 52,
      source: 'USDA FNDDS 2707713 Bread, chappatti or roti',
    },
    {
      id: 'paratha',
      label: 'Paratha, 1 piece',
      grams: 70,
      source: 'USDA FNDDS 2707715 Bread, paratha',
    },
    {
      id: 'puri',
      label: 'Puri, 1 piece (12 cm)',
      grams: 36,
      source: 'USDA FNDDS 2707714 Bread, puri',
    },
    {
      id: 'naan-whole',
      label: 'Naan, whole (10 in / 25 cm)',
      grams: 177,
      source: 'USDA FNDDS 2707613 Bread, naan',
    },
    {
      id: 'egg-boiled',
      label: 'Egg, boiled, 1 (edible part)',
      grams: 50,
      source: 'USDA FNDDS Egg, whole, boiled or poached',
    },
    {
      id: 'egg-fried',
      label: 'Egg, fried in oil, 1',
      grams: 55,
      source: 'USDA FNDDS Egg, whole, fried with oil',
    },
    {
      id: 'sugar-tsp',
      label: 'Sugar, 1 level teaspoon',
      grams: 4.2,
      source: 'USDA SR Legacy 169655 Sugars, granulated',
    },
    {
      id: 'oil-tsp',
      label: 'Oil, 1 teaspoon',
      grams: 4.5,
      source: 'USDA SR Legacy 171411 Oil, soybean',
    },
    {
      id: 'oil-tbsp',
      label: 'Oil, 1 tablespoon',
      grams: 13.6,
      source: 'USDA SR Legacy 171411 Oil, soybean',
    },
  ],
  // Density (g per ml) for converting household volumes to grams. Use the food's own density
  // when its source gives one; otherwise the closest row here.
  densityGPerMl: [
    {
      id: 'water-like',
      label: 'Chai, milk, juice, lassi, thin daal',
      value: 1.03,
      source: 'USDA SR Legacy 171265 whole milk, 1 cup = 244 g (237 ml)',
    },
    {
      id: 'daal',
      label: 'Daal and thin curries',
      value: 1.0,
      source: 'USDA FNDDS 2707427 Dal, 1 cup = 240 g',
    },
    {
      id: 'yogurt',
      label: 'Dahi and raita',
      value: 1.03,
      source: 'USDA FNDDS 2705418 Yogurt, whole milk, plain, 1 cup = 245 g',
    },
    {
      id: 'rice-cooked',
      label: 'Plain cooked rice',
      value: 0.67,
      source: 'USDA FNDDS 2708408 Rice, white, cooked, 1 cup = 158 g',
    },
    {
      id: 'biryani',
      label: 'Biryani and pulao',
      value: 0.83,
      source: 'USDA FNDDS 2706538 Biryani with chicken, 1 cup = 196 g',
    },
    {
      id: 'oil',
      label: 'Oil and ghee',
      value: 0.91,
      source: 'USDA SR Legacy 171411 Oil, soybean, 1 tbsp = 13.6 g',
    },
    {
      id: 'sugar',
      label: 'Sugar',
      value: 0.84,
      source: 'USDA SR Legacy 169655 Sugars, granulated, 1 cup = 200 g',
    },
  ],
};
