// QA tests for app/core/foods.js, written from docs/ARCHITECTURE.md §4.2 and §5.3 and
// docs/NUTRITION.md §3 (not from the code). Owner: Kenji.
import assert from 'node:assert/strict';
import {
  NUTRIENT_KEYS,
  STYLES,
  GRAMS,
  BOX,
  HALAL_STATUSES,
  validateFood,
  buildFoodIndex,
  defaultServing,
  findServing,
  gramsForPortion,
  nutrientsForGrams,
  nutrientsForPortion,
  sumNutrients,
  scaleNutrients,
  energyCheck,
  variantsOf,
} from '../../../app/core/foods.js';
import {
  qa,
  RULES,
  FOODS,
  fx,
  frozen,
  deepFreeze,
  assertClose,
  assertNutrients,
  assertThrowsKind,
  expectedFor,
  ZERO,
  rng,
  shuffled,
} from './_helpers.js';

const ROTI = fx('pk-roti-home-fx');
const CHAI = fx('pk-chai-doodh-patti-home-fx');
const DAAL = fx('pk-daal-masoor-home-fx');
const KARAHI_HOME = fx('pk-chicken-karahi-home-fx');
const KARAHI_REST = fx('pk-chicken-karahi-restaurant-fx');
const RICE = fx('pk-rice-plain-fx');
const TORTILLA = fx('es-tortilla-de-patatas-fx');
const BOX_FOOD = fx('pk-chicken-tikka-rice-box-fx');

/** A deep-frozen copy of `food` with `patch(copy)` applied first. */
function mutate(food, patch) {
  const copy = structuredClone(food);
  patch(copy);
  return deepFreeze(copy);
}

// ------------------------------------------------------------------ constants
qa('constants: NUTRIENT_KEYS, STYLES, GRAMS, BOX and HALAL_STATUSES (binding)', [], () => {
  assert.deepEqual([...NUTRIENT_KEYS], ['kcal', 'protein', 'carbs', 'fat', 'fiber']);
  // home-light: kam tel, rules 1.7.0 (Meeting 005)
  assert.deepEqual([...STYLES], ['home', 'home-light', 'restaurant', 'dhaba', 'street']);
  assert.equal(GRAMS, 'g');
  assert.equal(BOX, 'box');
  assert.deepEqual([...HALAL_STATUSES], ['halal', 'check', 'not-halal']);
  assert.deepEqual(
    [...HALAL_STATUSES],
    RULES.vocab.halalStatuses.map((s) => s.id),
  );
  for (const c of [NUTRIENT_KEYS, STYLES, HALAL_STATUSES]) assert.ok(Object.isFrozen(c));
});

// ------------------------------------------------------------------ validateFood
qa('validateFood: every fixture is valid, with and without RULES', [validateFood], () => {
  for (const food of FOODS) {
    assert.deepEqual(validateFood(frozen(food)), [], `${food.id} without rules`);
    assert.deepEqual(validateFood(frozen(food), RULES), [], `${food.id} with RULES`);
  }
});

qa('validateFood never throws and returns problems for junk', [validateFood], () => {
  const junk = [undefined, null, 0, 42, '', 'roti', [], [ROTI], true, () => {}, {}, { id: 'pk-x' }];
  for (const value of junk) {
    let problems;
    assert.doesNotThrow(
      () => {
        problems = validateFood(value, RULES);
      },
      `validateFood(${String(value)})`,
    );
    assert.ok(Array.isArray(problems) && problems.length > 0, `problems for ${String(value)}`);
    assert.ok(
      problems.every((p) => typeof p === 'string'),
      'problems are strings',
    );
  }
  assert.doesNotThrow(() => validateFood({ ...ROTI, per100g: null }, RULES));
  assert.doesNotThrow(() => validateFood({ ...ROTI, servings: [null, 5] }, RULES));
  assert.doesNotThrow(() => validateFood({ ...ROTI, halal: 'yes' }, RULES));
  assert.doesNotThrow(() => validateFood({ ...ROTI, source: null }, RULES));
});

/** [label, patch] pairs; each one breaks one HARD rule of ARCHITECTURE §4.2. */
const BROKEN = [
  ['missing id', (f) => delete f.id],
  ['id not kebab-case', (f) => (f.id = 'pk-Roti_Home')],
  ['id without an allowed prefix', (f) => (f.id = 'xx-roti-home')],
  ['empty name', (f) => (f.name = '')],
  ['name not a string', (f) => (f.name = 42)],
  ['aliases missing', (f) => delete f.aliases],
  ['aliases not an array', (f) => (f.aliases = 'roti')],
  ['alias not a string', (f) => (f.aliases = ['roti', 7])],
  ['group missing', (f) => delete f.group],
  ['per100g missing', (f) => delete f.per100g],
  ['per100g without fiber', (f) => delete f.per100g.fiber],
  ['negative protein', (f) => (f.per100g.protein = -1)],
  ['NaN kcal', (f) => (f.per100g.kcal = NaN)],
  ['Infinity fat', (f) => (f.per100g.fat = Infinity)],
  ['carbs as a string', (f) => (f.per100g.carbs = '47')],
  ['servings empty', (f) => (f.servings = [])],
  ['servings missing', (f) => delete f.servings],
  ['no default serving', (f) => delete f.servings[1].default],
  ['two default servings', (f) => (f.servings[0].default = true)],
  ["serving id 'g'", (f) => (f.servings[0].id = 'g')],
  ['duplicate serving ids', (f) => (f.servings[2].id = 'small')],
  ['serving grams 0', (f) => (f.servings[0].grams = 0)],
  ['serving grams negative', (f) => (f.servings[0].grams = -27)],
  ['serving grams not a number', (f) => (f.servings[0].grams = '27')],
  ['serving without label', (f) => delete f.servings[0].label],
  ['tags missing', (f) => delete f.tags],
  ['tags not an array', (f) => (f.tags = 'pakistani')],
  ['halal missing', (f) => delete f.halal],
  ['halal status unknown', (f) => (f.halal = { status: 'maybe' })],
  ['check without reason', (f) => (f.halal = { status: 'check' })],
  ['check with empty reason', (f) => (f.halal = { status: 'check', reason: '' })],
  ['not-halal without reason', (f) => (f.halal = { status: 'not-halal' })],
  ['source missing', (f) => delete f.source],
  ['empty citation', (f) => (f.source.citation = '')],
];

for (const [label, patch] of BROKEN) {
  qa(`validateFood flags a broken HARD field: ${label}`, [validateFood], () => {
    const food = mutate(ROTI, patch);
    const without = validateFood(food);
    const withRules = validateFood(food, RULES);
    assert.ok(without.length > 0, `no problem reported without rules for "${label}"`);
    assert.ok(withRules.length > 0, `no problem reported with RULES for "${label}"`);
  });
}

/** Vocabulary problems: reported only when RULES is passed. */
const VOCAB = [
  ['group not in RULES.vocab.groups', (f) => (f.group = 'pastry')],
  ['tag not in RULES.vocab.tags', (f) => (f.tags = ['pakistani', 'spicy'])],
  ["old 'halal' tag (meeting 002)", (f) => (f.tags = ['pakistani', 'halal'])],
  ['style not in RULES.vocab.styles', (f) => ((f.style = 'fancy'), (f.family = 'roti'))],
  ['slot not a slot id', (f) => (f.slots = ['brunch'])],
  ['source.method not in the vocabulary', (f) => (f.source.method = 'guess')],
  ['source.confidence not A/B/C', (f) => (f.source.confidence = 'D')],
];

for (const [label, patch] of VOCAB) {
  qa(`validateFood with RULES checks the vocabulary: ${label}`, [validateFood], () => {
    const food = mutate(ROTI, patch);
    assert.ok(validateFood(food, RULES).length > 0, `no problem reported for "${label}"`);
  });
}

qa('validateFood accepts valid variations', [validateFood], () => {
  const ok = [
    ['halal without reason', (f) => (f.halal = { status: 'halal' })],
    ['halal with a reason', (f) => (f.halal = { status: 'halal', reason: 'Halal butcher.' })],
    ['check with a reason', (f) => (f.halal = { status: 'check', reason: 'May use lard.' })],
    ['empty aliases', (f) => (f.aliases = [])],
    ['Ramadan slot hint', (f) => (f.slots = ['sehri', 'iftar'])],
    ['no slots', (f) => delete f.slots],
    ['no nameUr/nameRoman (soft)', (f) => (delete f.nameUr, delete f.nameRoman)],
    ['fractional grams', (f) => (f.servings[0].grams = 27.5)],
    ['all four styles', (f) => ((f.style = 'street'), (f.family = 'roti'))],
    [
      'optional nutrients',
      (f) => Object.assign(f.per100g, { sugars: 1, satFat: 0.5, sodium: 300 }),
    ],
  ];
  for (const [label, patch] of ok) {
    assert.deepEqual(validateFood(mutate(ROTI, patch), RULES), [], label);
  }
  for (const id of ['pk-a', 'es-pa-amb-tomaquet', 'med-hummus-2', 'intl-banana']) {
    assert.deepEqual(
      validateFood(
        mutate(ROTI, (f) => (f.id = id)),
        RULES,
      ),
      [],
      id,
    );
  }
});

qa('validateFood prefixes each problem with the food id', [validateFood], () => {
  const food = mutate(ROTI, (f) => {
    f.servings[0].default = true;
    f.halal = { status: 'check' };
  });
  const problems = validateFood(food, RULES);
  assert.ok(problems.length >= 2, `two problems expected, got ${problems.length}`);
  for (const p of problems) assert.ok(p.includes('pk-roti-home-fx'), `"${p}" names the food`);
});

qa('validateFood does not mutate its input', [validateFood], () => {
  const food = frozen(ROTI);
  validateFood(food, RULES);
  assert.deepEqual(food, ROTI);
});

// ------------------------------------------------------------------ buildFoodIndex
qa('buildFoodIndex: a Map id → food, insertion order kept, several lists', [buildFoodIndex], () => {
  const foods = deepFreeze(structuredClone(FOODS));
  const index = buildFoodIndex(foods);
  assert.ok(index instanceof Map);
  assert.equal(index.size, FOODS.length);
  assert.deepEqual(
    [...index.keys()],
    FOODS.map((f) => f.id),
  );
  assert.equal(index.get('pk-roti-home-fx'), foods[0], 'the record itself, not a copy');
  const two = buildFoodIndex(foods.slice(0, 5), foods.slice(5), []);
  assert.deepEqual(
    [...two.keys()],
    FOODS.map((f) => f.id),
  );
  assert.equal(buildFoodIndex().size, 0, 'no lists → empty Map');
  assert.equal(buildFoodIndex([]).size, 0);
});

qa('buildFoodIndex throws on a duplicate id, within or across lists', [buildFoodIndex], () => {
  assert.throws(() => buildFoodIndex([ROTI, ROTI]), /duplicate food id: pk-roti-home-fx/);
  assert.throws(() => buildFoodIndex([ROTI, CHAI], [DAAL, CHAI]), /pk-chai-doodh-patti-home-fx/);
});

// ------------------------------------------------------------------ servings and portions
qa('defaultServing: the serving with default: true', [defaultServing], () => {
  assert.deepEqual(defaultServing(ROTI), ROTI.servings[1]);
  assert.equal(defaultServing(ROTI).grams, 40);
  assert.equal(defaultServing(DAAL).id, 'katori');
  assert.equal(defaultServing(BOX_FOOD).id, BOX);
  for (const f of FOODS) assert.equal(defaultServing(frozen(f)).default, true, f.id);
});

qa("findServing: by id; 'g' is the 1-gram pseudo-serving; unknown → null", [findServing], () => {
  assert.deepEqual(findServing(ROTI, 'large'), ROTI.servings[2]);
  assert.deepEqual(findServing(ROTI, GRAMS), { id: 'g', label: 'g', grams: 1 });
  assert.deepEqual(findServing(BOX_FOOD, 'g'), { id: 'g', label: 'g', grams: 1 });
  assert.equal(findServing(ROTI, 'plate'), null);
  assert.equal(findServing(ROTI, ''), null);
  assert.equal(findServing(RICE, 'plate'), null, 'rice has no plate serving (NUTRITION §5.5)');
});

qa('gramsForPortion: serving grams × qty, fractions allowed', [gramsForPortion], () => {
  assert.equal(gramsForPortion(ROTI, 'medium', 2), 80);
  assert.equal(gramsForPortion(ROTI, 'g', 150), 150);
  assert.equal(gramsForPortion(DAAL, 'katori', 1.5), 300, 'A8: 1.5 katori');
  assertClose(gramsForPortion(RICE, 'katori', 0.5), 67);
  assertClose(gramsForPortion(DAAL, 'katori', 0.33), 66);
  assertClose(gramsForPortion(CHAI, 'cup', 4), 824, 1e-9, 'A6: 4 cups');
});

qa('gramsForPortion: RangeError on an unknown serving or a bad qty', [gramsForPortion], () => {
  assertThrowsKind(() => gramsForPortion(ROTI, 'plate', 1), RangeError, 'unknown serving');
  assertThrowsKind(() => gramsForPortion(RICE, 'plate', 0.5), RangeError, 'rice plate');
  for (const qty of [0, -1, -0.5, NaN, Infinity, -Infinity]) {
    assertThrowsKind(() => gramsForPortion(ROTI, 'medium', qty), RangeError, `qty ${qty}`);
  }
});

qa(
  'nutrientsForGrams: per100g × grams / 100, unrounded, exactly five keys',
  [nutrientsForGrams],
  () => {
    assertNutrients(nutrientsForGrams(ROTI, 80), {
      kcal: 216,
      protein: 7.2,
      carbs: 37.6,
      fat: 2.8,
      fiber: 5.6,
    });
    assertNutrients(nutrientsForGrams(CHAI, 206), expectedFor(CHAI, 206), 1e-9, 'sugars dropped');
    assertNutrients(nutrientsForGrams(ROTI, 0), ZERO);
    assertNutrients(nutrientsForGrams(RICE, 33), expectedFor(RICE, 33));
    const n = nutrientsForGrams(CHAI, 206);
    assertClose(n.kcal, 148.32, 1e-9, 'unrounded kcal');
  },
);

qa('nutrientsForPortion = nutrientsForGrams(gramsForPortion)', [nutrientsForPortion], () => {
  assertNutrients(nutrientsForPortion(CHAI, 'cup', 1), {
    kcal: 148.32,
    protein: 4.944,
    carbs: 19.776,
    fat: 5.356,
    fiber: 0,
  });
  assertNutrients(nutrientsForPortion(DAAL, 'katori', 1.5), expectedFor(DAAL, 300));
  assertNutrients(nutrientsForPortion(KARAHI_REST, 'katori', 1.5), expectedFor(KARAHI_REST, 300));
  assertNutrients(nutrientsForPortion(ROTI, 'g', 55), expectedFor(ROTI, 55));
  assertNutrients(nutrientsForPortion(BOX_FOOD, 'box', 1), expectedFor(BOX_FOOD, 350));
  assertThrowsKind(() => nutrientsForPortion(ROTI, 'plate', 1), RangeError);
  assertThrowsKind(() => nutrientsForPortion(ROTI, 'medium', 0), RangeError);
});

qa('sumNutrients: key-wise, [] gives zeros, full precision', [sumNutrients], () => {
  assertNutrients(sumNutrients([]), ZERO);
  const a = { kcal: 100, protein: 1, carbs: 2, fat: 3, fiber: 4 };
  const b = { kcal: 50.5, protein: 0.25, carbs: 0, fat: 1.5, fiber: 0 };
  assertNutrients(sumNutrients(deepFreeze([a, b])), {
    kcal: 150.5,
    protein: 1.25,
    carbs: 2,
    fat: 4.5,
    fiber: 4,
  });
  const cups = deepFreeze([1, 2, 3].map(() => nutrientsForGramsOracle(CHAI, 206)));
  assertClose(sumNutrients(cups).kcal, 444.96, 1e-9, 'three cups of chai stay unrounded');
});

function nutrientsForGramsOracle(food, grams) {
  return expectedFor(food, grams);
}

qa('property: sumNutrients is order-independent', [sumNutrients], () => {
  const random = rng(7);
  for (let round = 0; round < 50; round++) {
    const list = Array.from({ length: 1 + Math.floor(random() * 20) }, () => {
      const food = FOODS[Math.floor(random() * FOODS.length)];
      return expectedFor(food, random() * 400);
    });
    const base = sumNutrients(deepFreeze(structuredClone(list)));
    for (let k = 0; k < 5; k++) {
      const again = sumNutrients(deepFreeze(shuffled(list, random)));
      assertNutrients(again, base, 1e-9, `round ${round}`);
    }
  }
});

qa('scaleNutrients: key-wise × factor, five keys', [scaleNutrients], () => {
  const n = deepFreeze({ kcal: 300, protein: 20, carbs: 30, fat: 10, fiber: 4 });
  assertNutrients(scaleNutrients(n, 0.5), { kcal: 150, protein: 10, carbs: 15, fat: 5, fiber: 2 });
  assertNutrients(scaleNutrients(n, 0), ZERO);
  assertNutrients(scaleNutrients(n, 3), { kcal: 900, protein: 60, carbs: 90, fat: 30, fiber: 12 });
  assertNutrients(scaleNutrients(n, 1 / 3), {
    kcal: 100,
    protein: 20 / 3,
    carbs: 10,
    fat: 10 / 3,
    fiber: 4 / 3,
  });
});

// ------------------------------------------------------------------ energyCheck
qa('energyCheck: computed from RULES factors, delta = stated − computed', [energyCheck], () => {
  const r = energyCheck(ROTI.per100g, RULES);
  assertClose(r.computed, 269.5, 1e-9, 'computed 4P+4C+9F+2fibre');
  assert.equal(r.stated, 270);
  assertClose(r.delta, 0.5);
  assertClose(r.tolerance, 27, 1e-9, 'max(270 × 10%, 10)');
  assert.equal(r.ok, true);
  const chai = energyCheck(CHAI.per100g, RULES);
  assertClose(chai.computed, 71.4);
  assertClose(chai.tolerance, 10, 1e-9, 'the 10 kcal floor wins under 100 kcal');
  assert.equal(chai.ok, true);
});

qa('energyCheck: tolerance is max(stated × 10%, 10 kcal), inclusive', [energyCheck], () => {
  const P = (kcal, protein, carbs, fat, fiber) => deepFreeze({ kcal, protein, carbs, fat, fiber });
  assert.equal(energyCheck(P(50, 0, 15, 0, 0), RULES).ok, true, '|50 − 60| = 10 ≤ 10');
  assert.equal(energyCheck(P(50, 0, 15.125, 0, 0), RULES).ok, false, '|50 − 60.5| > 10');
  assert.equal(energyCheck(P(200, 0, 55, 0, 0), RULES).ok, true, '|200 − 220| = 20 ≤ 20');
  assert.equal(energyCheck(P(200, 0, 55.125, 0, 0), RULES).ok, false, '|200 − 220.5| > 20');
  assert.equal(energyCheck(P(200, 0, 45, 0, 0), RULES).ok, true, 'below: |200 − 180| = 20');
  assert.equal(energyCheck(P(0, 0, 0, 0, 0), RULES).ok, true, 'water or black tea');
  const bad = energyCheck(P(100, 20, 20, 10, 0), RULES);
  assert.equal(bad.ok, false);
  assertClose(bad.computed, 250);
  assertClose(bad.delta, -150);
  for (const food of FOODS) assert.equal(energyCheck(food.per100g, RULES).ok, true, food.id);
});

qa(
  'energyCheck reads factors and tolerance from RULES (no hard-coded numbers)',
  [energyCheck],
  () => {
    const rules = structuredClone(RULES);
    rules.energy.factors = { protein: 4, carbs: 4, fat: 9, fiber: 0 };
    rules.energy.tolerance = { pct: 1, kcal: 0.1 };
    const r = energyCheck(ROTI.per100g, deepFreeze(rules));
    assertClose(r.computed, 255.5, 1e-9, 'fibre factor 0');
    assertClose(r.tolerance, 2.7, 1e-9, '1% of 270');
    assert.equal(r.ok, false);
  },
);

// ------------------------------------------------------------------ variantsOf
qa('variantsOf: the family, STYLES order, from any member', [variantsOf], () => {
  const index = new Map(FOODS.map((f) => [f.id, frozen(f)]));
  const ids = (list) => list.map((f) => f.id);
  const expected = ['pk-chicken-karahi-home-fx', 'pk-chicken-karahi-restaurant-fx'];
  assert.deepEqual(ids(variantsOf(KARAHI_HOME, index)), expected);
  assert.deepEqual(ids(variantsOf(KARAHI_REST, index)), expected);
  assert.deepEqual(ids(variantsOf(ROTI, index)), ['pk-roti-home-fx'], 'no family → [food]');
  assert.deepEqual(ids(variantsOf(CHAI, index)), ['pk-chai-doodh-patti-home-fx'], 'one member');
});

qa('variantsOf: STYLES order then name, whatever the index order', [variantsOf], () => {
  const make = (id, style, name) =>
    mutate(KARAHI_HOME, (f) => {
      f.id = id;
      f.style = style;
      f.name = name;
    });
  const street = make('pk-k-street', 'street', 'Karahi (street)');
  const dhabaB = make('pk-k-dhaba-b', 'dhaba', 'Karahi B (dhaba)');
  const dhabaA = make('pk-k-dhaba-a', 'dhaba', 'Karahi A (dhaba)');
  const index = new Map(
    [street, dhabaB, KARAHI_REST, dhabaA, ROTI, KARAHI_HOME].map((f) => [f.id, f]),
  );
  assert.deepEqual(
    variantsOf(dhabaB, index).map((f) => f.id),
    [
      'pk-chicken-karahi-home-fx',
      'pk-chicken-karahi-restaurant-fx',
      'pk-k-dhaba-a',
      'pk-k-dhaba-b',
      'pk-k-street',
    ],
  );
});

qa('foods functions never mutate their inputs (deep-frozen)', [nutrientsForPortion], () => {
  const food = frozen(KARAHI_HOME);
  const before = structuredClone(food);
  nutrientsForPortion(food, 'katori', 2);
  gramsForPortion(food, 'katori-large', 1);
  findServing(food, 'g');
  defaultServing(food);
  energyCheck(food.per100g, RULES);
  assert.deepEqual(food, before);
  assert.deepEqual(TORTILLA, fx('es-tortilla-de-patatas-fx'));
});
