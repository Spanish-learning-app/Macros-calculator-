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
    constants: ['NUTRIENT_KEYS', 'STYLES', 'GRAMS'],
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
    constants: ['SLOT_IDS', 'DEFAULT_SLOT_LABELS'],
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
  assert.deepEqual(foods.STYLES, ['home', 'restaurant', 'dhaba', 'street']);
  assert.equal(foods.GRAMS, 'g');
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
