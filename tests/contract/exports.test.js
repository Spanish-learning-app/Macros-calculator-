// Contract test: every core module exports exactly the names in docs/ARCHITECTURE.md §5, with the
// documented arity (Function.length = parameters before the first default/destructured-default).
// Owner: Lena. A change here is a contract change: update ARCHITECTURE.md in the same hand-off.
import test from 'node:test';
import assert from 'node:assert/strict';

const CONTRACT = {
  units: {
    functions: {
      toGrams: 2,
      kgFromLb: 1,
      lbFromKg: 1,
      cmFromFtIn: 1,
      ftInFromCm: 1,
      round: 1,
      formatQty: 1,
    },
    constants: ['MASS_UNITS'],
  },
  dates: {
    functions: {
      isISODate: 1,
      todayISO: 1,
      localDateTime: 1,
      minutesOfDay: 1,
      addDays: 2,
      diffDays: 2,
      dayOfWeek: 1,
      weekStart: 1,
      weekDates: 1,
      monthGrid: 2,
    },
    constants: [],
  },
  foods: {
    functions: {
      validateFood: 1,
      buildFoodIndex: 0,
      defaultServing: 1,
      findServing: 2,
      gramsForPortion: 3,
      nutrientsForGrams: 2,
      nutrientsForPortion: 3,
      sumNutrients: 1,
      scaleNutrients: 2,
      energyCheck: 2,
      variantsOf: 2,
    },
    constants: ['NUTRIENT_KEYS', 'STYLES', 'GRAMS', 'HALAL_STATUSES', 'BOX'],
  },
  days: {
    functions: {
      emptyDay: 1,
      createEntry: 1,
      createQuickEntry: 1,
      entryNutrients: 2,
      entryGrams: 2,
      addEntry: 2,
      updateEntry: 4,
      removeEntry: 2,
      switchEntryFood: 3,
      setSlotStatus: 3,
      copySlot: 5,
      copyDay: 3,
      dayTotals: 2,
      progress: 2,
      weekSummary: 4,
      averageTotals: 1,
      slotForTime: 2,
    },
    constants: ['SLOT_IDS', 'ENTRY_SLOT_IDS', 'DEFAULT_SLOT_LABELS'],
  },
  targets: {
    functions: {
      bmi: 2,
      proteinReferenceWeight: 3,
      bmr: 2,
      validateProfile: 2,
      computeTargets: 2,
      resolveTargets: 2,
    },
    constants: ['ACTIVITY_LEVELS', 'GOALS'],
  },
  search: {
    functions: {
      normalize: 1,
      buildSearchIndex: 1,
      searchFoods: 2,
      recordUse: 2,
      recencyBoosts: 2,
      recentForSlot: 2,
      foodKind: 1, // Review 2 (meeting 004 A1): own / single / prep ranking
      singularWord: 1, // Review 2 (A2): plural queries
    },
    constants: ['TIERS', 'BOOST_WEIGHT'],
  },
  storage: {
    functions: {
      defaultData: 0,
      createPersistence: 1,
      migrate: 1,
      validateUserData: 1,
      serializeExport: 2,
      parseImport: 1,
      mergeImport: 3,
    },
    constants: ['STORAGE_KEY', 'SCHEMA_VERSION', 'EXPORT_KIND'],
  },
  // Sprint 2, ARCHITECTURE §13.2.
  mealprep: {
    functions: {
      worstHalal: 1,
      recipeTotals: 2,
      foodFromRecipe: 3,
      storageIds: 3,
      storagePlan: 4,
      boxUseBy: 5,
      useByStatus: 2,
      boxesLeft: 1,
      placeBox: 3,
      syncBatches: 2,
      shoppingList: 2,
      // Review 2 (meeting 004 A4): the list as you buy it
      shoppingForShop: 2,
      buyAmount: 2,
      pluralLabel: 1,
      spareBoxes: 3, // Sprint 3 (meeting 005): the Day view's spare/old box line
    },
    constants: ['RECIPE_PREFIX', 'BOX_STORAGES', 'BOX_STATUSES', 'CUPBOARD_SECTION'],
  },
  // Sprint 3, ARCHITECTURE §14: the weight log and trend.
  weight: {
    functions: {
      weightLimits: 0,
      weightLogProblems: 1,
      setWeight: 3,
      removeWeight: 2,
      weightEntries: 1,
      mergeWeightLogs: 2,
      trendRule: 1,
      suggestRails: 1,
      weightTrend: 2,
    },
    constants: [],
  },
  // Sprint 3 wave 2, ARCHITECTURE §15: Ramadan mode and protein tips.
  ramadan: {
    functions: {
      parseTime: 1,
      timeText: 1,
      ramadanModeProblems: 1,
      defaultStartDate: 1,
      ramadanRange: 1,
      isRamadanDay: 2,
      ramadanTimes: 3,
      ramadanDayStart: 3,
      loggingDate: 3,
      ramadanSlots: 1,
      sehriProteinGoal: 3,
      ramadanFlagNotes: 2,
    },
    constants: ['RAMADAN_DAYS', 'RAMADAN_SLOT_IDS'],
  },
  nudges: {
    functions: {
      nudgeSettingsProblems: 1,
      tipsOn: 3,
      dueCheckpoint: 4,
      proteinTip: 1,
      sehriTip: 1,
      tipIdeas: 3,
    },
    constants: [],
  },
};

for (const [name, spec] of Object.entries(CONTRACT)) {
  test(`core/${name}.js exports exactly the contract`, async () => {
    const mod = await import(`../../app/core/${name}.js`);
    const expected = [...Object.keys(spec.functions), ...spec.constants].sort();
    assert.deepEqual(Object.keys(mod).sort(), expected);
    for (const [fn, arity] of Object.entries(spec.functions)) {
      assert.equal(typeof mod[fn], 'function', `${name}.${fn} is a function`);
      assert.equal(mod[fn].length, arity, `${name}.${fn} arity`);
    }
    for (const c of spec.constants) {
      assert.ok(Object.isFrozen(mod[c]) || typeof mod[c] !== 'object', `${name}.${c} is frozen`);
    }
  });
}

test('binding constants match the kickoff minutes', async () => {
  const days = await import('../../app/core/days.js');
  const targets = await import('../../app/core/targets.js');
  const storage = await import('../../app/core/storage.js');
  const foods = await import('../../app/core/foods.js');
  assert.deepEqual(days.SLOT_IDS, ['breakfast', 'lunch', 'evening', 'dinner', 'snacks']);
  // DECISIONS 2026-10-15: one global set of entry slot ids (Ramadan ids are additive).
  assert.deepEqual(days.ENTRY_SLOT_IDS, [...days.SLOT_IDS, 'sehri', 'iftar', 'after_taraweeh']);
  assert.deepEqual(days.DEFAULT_SLOT_LABELS, {
    breakfast: 'Nashta',
    lunch: 'Lunch',
    evening: 'Shaam ki chai',
    dinner: 'Dinner',
    snacks: 'Snacks',
  });
  assert.deepEqual(targets.ACTIVITY_LEVELS, [
    'sedentary',
    'light',
    'moderate',
    'very_active',
    'extra_active',
  ]);
  assert.deepEqual(targets.GOALS, ['lose', 'maintain', 'gain']);
  assert.equal(storage.STORAGE_KEY, 'mmc.v1');
  assert.equal(storage.SCHEMA_VERSION, 1);
  assert.deepEqual(foods.NUTRIENT_KEYS, ['kcal', 'protein', 'carbs', 'fat', 'fiber']);
  // Sprint 3 (meeting 005 d): 'home-light' (kam tel) ranks right after 'home'.
  assert.deepEqual(foods.STYLES, ['home', 'home-light', 'restaurant', 'dhaba', 'street']);
  assert.equal(foods.GRAMS, 'g');
  assert.deepEqual(foods.HALAL_STATUSES, ['halal', 'check', 'not-halal']); // meeting 002
  assert.equal(foods.BOX, 'box');
});

test('core modules import nothing outside app/core', async () => {
  const { readFile, readdir } = await import('node:fs/promises');
  const dir = new URL('../../app/core/', import.meta.url);
  for (const file of await readdir(dir)) {
    if (!file.endsWith('.js')) continue;
    const src = await readFile(new URL(file, dir), 'utf8');
    for (const [, spec] of src.matchAll(/^\s*import\s[^'"]*['"]([^'"]+)['"]/gm)) {
      assert.match(spec, /^\.\/[\w-]+\.js$/, `${file} imports ${spec}`);
    }
  }
});
