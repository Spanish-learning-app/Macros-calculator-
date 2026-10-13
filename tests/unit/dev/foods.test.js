// Author tests for app/core/foods.js (ARCHITECTURE §5.3). Owner: Hamza.
import test from 'node:test';
import assert from 'node:assert/strict';
import { RULES, FOODS } from '../../fixtures/index.js';
import {
  NUTRIENT_KEYS,
  STYLES,
  GRAMS,
  HALAL_STATUSES,
  BOX,
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
import { deepFreeze, fixture, frozenFoods, close, closeNutrients } from './helpers.js';

const ids = (list) => list.map((f) => f.id);

test('constants are frozen and binding', () => {
  for (const c of [NUTRIENT_KEYS, STYLES, HALAL_STATUSES]) assert.ok(Object.isFrozen(c));
  assert.equal(GRAMS, 'g');
  assert.equal(BOX, 'box');
  assert.deepEqual(
    RULES.vocab.halalStatuses.map((s) => s.id),
    [...HALAL_STATUSES],
  );
});

test('validateFood: every fixture is valid, with and without rules', () => {
  assert.equal(FOODS.length, 16);
  for (const food of frozenFoods()) {
    assert.ok(food.id.endsWith('-fx'));
    assert.deepEqual(validateFood(food), [], food.id);
    assert.deepEqual(validateFood(food, RULES), [], food.id);
  }
});

/** Applies `edit` to a copy of the roti fixture and validates it. */
function problemsAfter(edit, rules = RULES, id = 'pk-roti-home-fx') {
  const food = fixture(id);
  edit(food);
  return validateFood(food, rules);
}

function assertOneProblem(problems, pattern, prefix = 'pk-roti-home-fx: ') {
  assert.equal(problems.length, 1, JSON.stringify(problems));
  assert.ok(problems[0].startsWith(prefix), problems[0]);
  assert.match(problems[0], pattern);
}

test('validateFood: a clear message for each broken HARD field', () => {
  const missingId = problemsAfter((f) => delete f.id);
  assert.equal(missingId.length, 1);
  assert.match(missingId[0], /\bid\b.*missing|missing.*\bid\b/i);

  assertOneProblem(
    problemsAfter((f) => (f.servings[0].default = true)),
    /exactly one default serving.*2/i,
  );
  assertOneProblem(
    problemsAfter((f) => f.servings.forEach((s) => delete s.default)),
    /exactly one default serving.*0/i,
  );
  assertOneProblem(
    problemsAfter((f) => (f.servings[0].id = 'g')),
    /serving id 'g' is reserved/i,
  );
  assertOneProblem(
    problemsAfter((f) => (f.per100g.fat = -1)),
    /per100g\.fat.*>= 0/i,
  );
  assertOneProblem(
    problemsAfter((f) => (f.group = 'bakery')),
    /group 'bakery'.*not in RULES\.vocab\.groups/i,
  );
  assertOneProblem(
    problemsAfter((f) => f.tags.push('desi')),
    /tag 'desi'.*not in RULES\.vocab\.tags/i,
  );
});

test('validateFood: halal field (meeting 002)', () => {
  assertOneProblem(
    problemsAfter((f) => delete f.halal),
    /halal.*missing/i,
  );
  assertOneProblem(
    problemsAfter((f) => (f.halal = { status: 'haram' })),
    /halal\.status 'haram'.*halal, check, not-halal/i,
  );
  assertOneProblem(
    problemsAfter((f) => (f.halal = { status: 'check' })),
    /halal\.reason.*required.*check/i,
  );
  assertOneProblem(
    problemsAfter((f) => (f.halal = { status: 'not-halal', reason: '   ' })),
    /halal\.reason.*required.*not-halal/i,
  );
  assertOneProblem(
    problemsAfter((f) => (f.halal = 'halal')),
    /halal.*object/i,
  );
  // A reason is optional for 'halal' but allowed.
  assert.deepEqual(
    problemsAfter((f) => (f.halal = { status: 'halal', reason: 'Plant food.' })),
    [],
  );
  // Old halal tags: one message each, with or without rules.
  for (const rules of [RULES, null]) {
    for (const tag of ['halal', 'halal-check']) {
      assertOneProblem(
        problemsAfter((f) => f.tags.push(tag), rules),
        new RegExp(`tag '${tag}'.*no longer.*halal\\.status`, 'i'),
      );
    }
  }
});

test('validateFood: other structural problems', () => {
  const cases = [
    [(f) => (f.id = 'Roti Home'), /id 'Roti Home'.*kebab-case/i, "Roti Home: "],
    [(f) => (f.id = 'xx-roti'), /id 'xx-roti'.*prefix/i, 'xx-roti: '],
    [(f) => (f.name = ''), /name/i],
    [(f) => delete f.aliases, /aliases/i],
    [(f) => (f.aliases = ['roti', 7]), /aliases/i],
    [(f) => delete f.state, /state/i],
    [(f) => delete f.per100g, /per100g/i],
    [(f) => delete f.per100g.fiber, /per100g\.fiber/i],
    [(f) => (f.per100g.kcal = NaN), /per100g\.kcal/i],
    [(f) => (f.per100g.sodium = -3), /per100g\.sodium/i],
    [(f) => (f.addedFatPer100g = -1), /addedFatPer100g/i],
    [(f) => (f.servings = []), /servings/i],
    [(f) => (f.servings[1].id = 'small'), /serving id 'small'.*duplicate/i],
    [(f) => (f.servings[0].grams = 0), /grams.*> 0/i],
    [(f) => (f.servings[0].label = ''), /label/i],
    [(f) => (f.tags = 'pakistani'), /tags/i],
    [(f) => (f.style = 'fancy'), /style 'fancy'/i],
    [(f) => (f.slots = ['brunch']), /slot 'brunch'/i],
    [(f) => (f.source = {}), /source\.citation/i],
    [(f) => delete f.source, /source/i],
    [(f) => (f.source.method = 'guess'), /source\.method 'guess'/i],
    [(f) => (f.source.confidence = 'D'), /source\.confidence 'D'/i],
    [(f) => (f.nameUr = 5), /nameUr/i],
  ];
  for (const [edit, pattern, prefix] of cases) {
    assertOneProblem(problemsAfter(edit), pattern, prefix);
  }
  // Several problems at once are all reported.
  const many = problemsAfter((f) => {
    f.group = 'nope';
    f.per100g.protein = -2;
    f.servings[0].id = 'g';
  });
  assert.equal(many.length, 3, JSON.stringify(many));
});

test('validateFood: vocabulary is checked only with rules', () => {
  assert.deepEqual(
    problemsAfter((f) => {
      f.group = 'bakery';
      f.tags.push('desi');
      f.slots = ['sehri', 'iftar'];
      f.source.method = 'guess';
    }, null),
    [],
  );
  // Ramadan slots are valid slot hints with rules too.
  assert.deepEqual(
    problemsAfter((f) => (f.slots = ['sehri', 'after_taraweeh', 'lunch'])),
    [],
  );
});

test('validateFood: never throws, even on junk', () => {
  const junk = [
    null,
    undefined,
    42,
    'roti',
    [],
    {},
    { id: 'pk-x' },
    {
      get id() {
        throw new Error('boom');
      },
    },
    new Proxy(
      {},
      {
        get() {
          throw new Error('trap');
        },
      },
    ),
  ];
  for (const value of junk) {
    const problems = validateFood(value, RULES);
    assert.ok(Array.isArray(problems) && problems.length > 0, String(value));
    assert.ok(problems.every((p) => typeof p === 'string'));
  }
  assert.ok(validateFood({ id: 'pk-x' })[0].startsWith('pk-x: '));
  // A rules object with missing parts does not make it throw.
  assert.ok(Array.isArray(validateFood(fixture('pk-roti-home-fx'), {})));
});

test('validateFood does not mutate its input', () => {
  const food = deepFreeze(fixture('es-ensaimada-fx'));
  assert.deepEqual(validateFood(food, deepFreeze(structuredClone(RULES))), []);
});

test('buildFoodIndex: Map in insertion order, several lists, duplicate throws', () => {
  const foods = frozenFoods();
  const index = buildFoodIndex(foods.slice(0, 5), foods.slice(5), []);
  assert.ok(index instanceof Map);
  assert.deepEqual([...index.keys()], ids(foods));
  assert.equal(index.get('pk-roti-home-fx'), foods[0]);
  assert.equal(buildFoodIndex().size, 0);
  assert.throws(() => buildFoodIndex(foods, [foods[3]]), {
    name: 'Error',
    message: `duplicate food id: ${foods[3].id}`,
  });
  assert.throws(() => buildFoodIndex('nope'), TypeError);
});

test('defaultServing and findServing', () => {
  const roti = deepFreeze(fixture('pk-roti-home-fx'));
  assert.equal(defaultServing(roti).id, 'medium');
  assert.equal(defaultServing(roti), roti.servings[1]);
  assert.equal(defaultServing(fixture('pk-chicken-tikka-rice-box-fx')).id, BOX);
  assert.equal(findServing(roti, 'large').grams, 52);
  assert.deepEqual(findServing(roti, GRAMS), { id: 'g', label: 'g', grams: 1 });
  assert.equal(findServing(roti, 'katori'), null);
  assert.equal(findServing(roti, undefined), null);
  assert.throws(() => defaultServing({ id: 'x', servings: [] }), TypeError);
});

test('gramsForPortion: serving grams × qty, RangeError on bad input', () => {
  const daal = deepFreeze(fixture('pk-daal-masoor-home-fx'));
  const rice = deepFreeze(fixture('pk-rice-plain-fx'));
  assert.equal(gramsForPortion(daal, 'katori', 1.5), 300);
  assert.equal(gramsForPortion(daal, 'katori', 1), 200);
  close(gramsForPortion(rice, 'katori', 0.33), 134 * 0.33);
  assert.equal(gramsForPortion(rice, GRAMS, 150), 150);
  assert.equal(gramsForPortion(fixture('pk-roti-home-fx'), 'medium', 2), 80);
  assert.throws(() => gramsForPortion(daal, 'plate', 1), RangeError);
  for (const qty of [0, -1, NaN, Infinity, '1', null]) {
    assert.throws(() => gramsForPortion(daal, 'katori', qty), RangeError, String(qty));
  }
});

test('nutrientsForGrams and nutrientsForPortion: five keys, unrounded', () => {
  const roti = deepFreeze(fixture('pk-roti-home-fx'));
  const chai = deepFreeze(fixture('pk-chai-doodh-patti-home-fx'));
  closeNutrients(nutrientsForGrams(roti, 40), {
    kcal: 108,
    protein: 3.6,
    carbs: 18.8,
    fat: 1.4,
    fiber: 2.8,
  });
  // Optional per100g keys (sugars) are not returned.
  const n = nutrientsForPortion(chai, 'cup', 1);
  assert.deepEqual(Object.keys(n), [...NUTRIENT_KEYS]);
  closeNutrients(n, {
    kcal: (72 * 206) / 100,
    protein: (2.4 * 206) / 100,
    carbs: (9.6 * 206) / 100,
    fat: (2.6 * 206) / 100,
    fiber: 0,
  });
  // Unrounded: 1 cup of chai is 148.32 kcal, not 148.
  assert.equal(nutrientsForPortion(chai, 'cup', 1).kcal, 148.32);
  closeNutrients(nutrientsForGrams(roti, 0), { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  closeNutrients(nutrientsForPortion(roti, 'medium', 2), nutrientsForGrams(roti, 80));
  assert.throws(() => nutrientsForGrams(roti, -1), RangeError);
  assert.throws(() => nutrientsForGrams(roti, NaN), RangeError);
  assert.throws(() => nutrientsForPortion(roti, 'katori', 1), RangeError);
});

test('sumNutrients and scaleNutrients', () => {
  const zero = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  assert.deepEqual(sumNutrients([]), zero);
  const a = deepFreeze({ kcal: 100, protein: 0.1, carbs: 10, fat: 1, fiber: 0.2 });
  const b = deepFreeze({ kcal: 50.5, protein: 0.2, carbs: 5, fat: 2, fiber: 0.1 });
  const sum = sumNutrients([a, b]);
  assert.deepEqual(Object.keys(sum), [...NUTRIENT_KEYS]);
  closeNutrients(sum, { kcal: 150.5, protein: 0.3, carbs: 15, fat: 3, fiber: 0.3 });
  assert.equal(sum.protein, 0.1 + 0.2); // full precision, no rounding
  closeNutrients(scaleNutrients(a, 2.5), {
    kcal: 250,
    protein: 0.25,
    carbs: 25,
    fat: 2.5,
    fiber: 0.5,
  });
  assert.deepEqual(scaleNutrients(a, 0), zero);
  assert.throws(() => scaleNutrients(a, NaN), RangeError);
  assert.throws(() => sumNutrients('x'), TypeError);
});

test('energyCheck: Atwater from RULES, tolerance max(pct, kcal)', () => {
  for (const food of FOODS) {
    const r = energyCheck(food.per100g, RULES);
    assert.equal(r.ok, true, food.id);
    assert.equal(r.stated, food.per100g.kcal);
    close(r.delta, r.stated - r.computed);
  }
  const roti = energyCheck(fixture('pk-roti-home-fx').per100g, RULES);
  assert.deepEqual(roti, { computed: 269.5, stated: 270, delta: 0.5, tolerance: 27, ok: true });
  // Chai: 4·2.4 + 4·9.6 + 9·2.6 = 71.4 exactly (no float noise in the result).
  const chai = energyCheck(fixture('pk-chai-doodh-patti-home-fx').per100g, RULES);
  assert.equal(chai.computed, 71.4);
  assert.equal(chai.delta, 0.6);
  assert.equal(chai.tolerance, 10);

  const per = (kcal, carbs) => deepFreeze({ kcal, protein: 0, carbs, fat: 0, fiber: 0 });
  // Small food: the 10 kcal floor applies (10% of 50 is only 5).
  assert.equal(energyCheck(per(50, 15), RULES).ok, true); // computed 60, delta −10
  assert.equal(energyCheck(per(50, 15).kcal && per(50, 15.125), RULES).ok, false); // 60.5
  assert.equal(energyCheck(per(50, 15.125), RULES).tolerance, 10);
  // Large food: 10% applies.
  assert.equal(energyCheck(per(200, 55), RULES).ok, true); // computed 220, delta −20
  assert.equal(energyCheck(per(200, 55.25), RULES).ok, false); // 221
  assert.equal(energyCheck(per(200, 55.25), RULES).tolerance, 20);
  assert.equal(energyCheck(per(200, 45), RULES).ok, true); // computed 180, delta +20
  // Uses RULES factors, not hard-coded ones.
  const rules = { energy: { factors: { protein: 4, carbs: 4, fat: 9, fiber: 0 }, tolerance: RULES.energy.tolerance } };
  const fibrous = { kcal: 100, protein: 0, carbs: 20, fat: 0, fiber: 10 };
  assert.equal(energyCheck(fibrous, rules).computed, 80);
  assert.equal(energyCheck(fibrous, RULES).computed, 100);
  assert.throws(() => energyCheck(null, RULES), TypeError);
  assert.throws(() => energyCheck(fibrous, {}), TypeError);
});

test('variantsOf: same family, ordered by STYLES then name', () => {
  const foods = frozenFoods();
  const index = buildFoodIndex(foods);
  const home = index.get('pk-chicken-karahi-home-fx');
  const restaurant = index.get('pk-chicken-karahi-restaurant-fx');
  assert.deepEqual(variantsOf(home, index), [home, restaurant]);
  assert.deepEqual(variantsOf(restaurant, index), [home, restaurant]);
  const roti = index.get('pk-roti-home-fx');
  assert.deepEqual(variantsOf(roti, index), [roti]);
  const chai = index.get('pk-chai-doodh-patti-home-fx');
  assert.deepEqual(variantsOf(chai, index), [chai]);

  const mk = (id, style, name) =>
    deepFreeze({ ...structuredClone(home), id, style, name, family: 'chicken-karahi-fx' });
  const dhaba = mk('pk-chicken-karahi-dhaba-fx', 'dhaba', 'Chicken karahi (dhaba)');
  const streetB = mk('pk-chicken-karahi-street-b-fx', 'street', 'B karahi');
  const streetA = mk('pk-chicken-karahi-street-a-fx', 'street', 'A karahi');
  const big = buildFoodIndex(foods, [streetB, dhaba, streetA]);
  assert.deepEqual(ids(variantsOf(streetB, big)), [
    'pk-chicken-karahi-home-fx',
    'pk-chicken-karahi-restaurant-fx',
    'pk-chicken-karahi-dhaba-fx',
    'pk-chicken-karahi-street-a-fx',
    'pk-chicken-karahi-street-b-fx',
  ]);
  // A food not (yet) in the index is still included.
  const loose = mk('pk-chicken-karahi-dhaba-2-fx', 'dhaba', 'Another dhaba karahi');
  assert.deepEqual(ids(variantsOf(loose, index)), [
    'pk-chicken-karahi-home-fx',
    'pk-chicken-karahi-restaurant-fx',
    'pk-chicken-karahi-dhaba-2-fx',
  ]);
});
