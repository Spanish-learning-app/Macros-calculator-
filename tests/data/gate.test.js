// Self-tests of the data gate itself (mutation style): a gate that cannot fail proves nothing.
// A known-good record passes; each broken copy fails exactly the gate it should. Owner: Kenji.
import test from 'node:test';
import assert from 'node:assert/strict';
import { RULES, FOODS } from '../fixtures/index.js';
import { checkRecord, checkMealprepRecipes, storageIdsOf } from './_gate.js';

const rice = () => structuredClone(FOODS.find((f) => f.id === 'pk-rice-plain-fx'));
const gates = (food) => [...new Set(checkRecord(food, RULES).fails.map((x) => x.gate))].sort();

// Fixture rice: katori grams 134 (0.67 g/ml × 200 ml) → ½ katori = 67 g, 1 katori = 134 g.
const katoriGrams = (food) => food.servings.find((s) => s.id === 'katori').grams;
const withServings = (extra) => {
  const food = rice();
  food.servings.push(...extra);
  return food;
};

test('gate: the fixture rice record passes every gate', () => {
  assert.deepEqual(checkRecord(rice(), RULES).fails, []);
});

// ---- G23 (NUTRITION.md v1.6 §5.5) ----------------------------------------------------------------
// Worked by hand: katori = 134 g. 1 plate = 268 g = 2.00 katori, ½ plate = 67 g = 0.5 katori.
test('G23: a labelled plate of 2 katori (268 g) and a half plate (134 g) pass', () => {
  assert.equal(katoriGrams(rice()), 134);
  const food = withServings([
    { id: 'plate', label: '1 plate (home), assumed 2 katori', grams: 268 },
    { id: 'half-plate', label: '½ plate, assumed 1 katori', grams: 134 },
  ]);
  assert.deepEqual(gates(food), []);
});

test('G23: a plate whose label does not say "assumed" fails', () => {
  const food = withServings([{ id: 'plate', label: '1 plate (home)', grams: 268 }]);
  assert.deepEqual(gates(food), ['G23']);
});

test('G23: the word "assumed" is matched without regard to case', () => {
  const food = withServings([
    { id: 'plate', label: '1 plate (home), ASSUMED 2 katori', grams: 268 },
  ]);
  assert.deepEqual(gates(food), []);
});

test('G23: grams must be a multiple of ½ katori: 300 g is 2.24 katori and fails', () => {
  // 300 / 134 = 2.239; nearest multiple 2.0; off by 11.9 %, far over 2 %.
  const food = withServings([{ id: 'plate', label: '1 plate, assumed 2 katori', grams: 300 }]);
  assert.deepEqual(gates(food), ['G23']);
});

test('G23: 2 % tolerance: 2.03 and 1.97 katori pass, 2.05 and 1.95 katori fail', () => {
  // Katori 134 g, nearest multiple 2.0 (268 g). Off by |n − 2| / 2:
  // 270.9 g = 2.0216 katori → 1.1 %; 264.0 g = 1.9701 → 1.5 %; both inside ±2 %.
  // 274.7 g = 2.0500 → 2.5 %; 261.3 g = 1.9500 → 2.5 %; both outside.
  for (const [grams, ok] of [
    [270.9, true],
    [264, true],
    [274.7, false],
    [261.3, false],
  ]) {
    const food = withServings([{ id: 'plate', label: '1 plate, assumed 2 katori', grams }]);
    assert.equal(gates(food).includes('G23'), !ok, `${grams} g`);
  }
});

test('G23: a plate under ¼ katori (nearest multiple 0) fails', () => {
  const food = withServings([{ id: 'half-plate', label: '½ plate, assumed', grams: 20 }]);
  assert.ok(gates(food).includes('G23')); // 20 g also trips G10 (group minimum): fine
});

test('G23: a food without a katori serving only needs the label', () => {
  const food = rice();
  food.group = 'rice-dish';
  food.servings = [{ id: 'plate', label: '1 plate (home), assumed', grams: 400, default: true }];
  assert.ok(!gates(food).includes('G23'));
  food.servings[0].label = '1 plate (home)';
  assert.ok(gates(food).includes('G23'));
});

test('G23: other serving ids are not plates (no label needed, no katori rule)', () => {
  const food = withServings([{ id: 'big-plate', label: '1 big plate', grams: 301 }]);
  assert.ok(!gates(food).includes('G23'));
});

test('G23: the rule values come from RULES (step ½, tolerance 2 %, label word)', () => {
  const rules = structuredClone(RULES);
  rules.vocab.servingRules.assumedPlate = {
    ids: ['plate'],
    labelMustInclude: 'estimated',
    katoriMultipleStep: 1,
    tolerancePct: 1,
  };
  const food = withServings([
    { id: 'half-plate', label: 'half plate', grams: 67 }, // not a plate id under these rules
    { id: 'plate', label: '1 plate, estimated 2 katori', grams: 268 },
  ]);
  assert.deepEqual(checkRecord(food, rules).fails, []);
  food.servings.at(-1).grams = 201; // 1.5 katori is not a whole multiple under step 1
  assert.ok(checkRecord(food, rules).fails.some((x) => x.gate === 'G23'));
  food.servings.at(-1).label = '1 plate, assumed 2 katori'; // wrong label word for these rules
  food.servings.at(-1).grams = 268;
  assert.ok(checkRecord(food, rules).fails.some((x) => x.gate === 'G23'));
});

// ---- recipes-mealprep gate ------------------------------------------------------------------------
const foodsById = new Map([
  ['pk-box', { id: 'pk-box', group: 'lunchbox' }],
  ['pk-box-2', { id: 'pk-box-2', group: 'lunchbox' }],
  ['intl-chicken', { id: 'intl-chicken', group: 'meat-fish' }],
  ['intl-rice', { id: 'intl-rice', group: 'grain-cooked' }],
]);
const good = () => ({
  foodId: 'pk-box',
  ingredients: [
    { foodId: 'intl-chicken', grams: 720 },
    { foodId: 'intl-rice', grams: 240 },
  ],
  boxes: 4,
  storage: ['cooked-meat', 'cooked-starch'],
});
const mp = (...recipes) => checkMealprepRecipes(recipes, { foodsById, rules: RULES });
const failGates = (...recipes) => [...new Set(mp(...recipes).fails.map((x) => x.gate))].sort();

test('meal-prep gate: a good record passes; storage may be an array, array of {id} or an object', () => {
  assert.deepEqual(mp(good()).fails, []);
  const objects = { ...good(), storage: [{ id: 'cooked-meat' }, { id: 'cold-salad' }] };
  assert.deepEqual(mp(objects).fails, []);
  const keyed = { ...good(), storage: { 'cooked-meat': {}, 'cooked-starch': {} } };
  assert.deepEqual(mp(keyed).fails, []);
  assert.deepEqual(storageIdsOf(keyed.storage), ['cooked-meat', 'cooked-starch']);
});

test('meal-prep gate: an empty list passes (nothing to check) and a non-array fails', () => {
  assert.deepEqual(mp().fails, []);
  assert.equal(checkMealprepRecipes({}, { foodsById, rules: RULES }).fails.length, 1);
});

test('meal-prep gate: unknown or missing foodId fails M1; a duplicate foodId fails M1', () => {
  assert.deepEqual(failGates({ ...good(), foodId: 'pk-nope' }), ['M1']);
  const { foodId, ...noId } = good();
  assert.equal(foodId, 'pk-box');
  assert.deepEqual(failGates(noId), ['M1']);
  assert.deepEqual(failGates(good(), good()), ['M1']);
  assert.deepEqual(failGates(good(), { ...good(), foodId: 'pk-box-2' }), []);
});

test('meal-prep gate: a recipe whose food is not a lunchbox only warns', () => {
  const r = mp({ ...good(), foodId: 'intl-rice' });
  assert.deepEqual(r.fails, []);
  assert.equal(r.warns.length, 1);
});

test('meal-prep gate: unknown ingredient foodId, missing or empty ingredients fail M2', () => {
  const bad = good();
  bad.ingredients[1] = { foodId: 'intl-nope', grams: 5 };
  assert.deepEqual(failGates(bad), ['M2']);
  assert.deepEqual(failGates({ ...good(), ingredients: [] }), ['M2']);
  assert.deepEqual(failGates({ ...good(), ingredients: undefined }), ['M2']);
  assert.deepEqual(failGates({ ...good(), ingredients: ['intl-rice'] }), ['M2']);
});

test('meal-prep gate: boxes must be a whole number ≥ 1 (M3)', () => {
  for (const boxes of [0, -1, 1.5, '4', null, undefined, NaN])
    assert.deepEqual(failGates({ ...good(), boxes }), ['M3'], String(boxes));
  for (const boxes of [1, 4, 12]) assert.deepEqual(failGates({ ...good(), boxes }), []);
});

test('meal-prep gate: storage ids must exist in RULES.mealPrep.storage (M4)', () => {
  for (const storage of [['cooked-nothing'], [], undefined, 'cooked-meat', ['cooked-meat', 'x']])
    assert.deepEqual(failGates({ ...good(), storage }), ['M4'], JSON.stringify(storage));
  for (const entry of RULES.mealPrep.storage)
    assert.deepEqual(failGates({ ...good(), storage: [entry.id] }), [], entry.id);
});

test('meal-prep gate: a name-only ingredient (no foodId) is valid and counted, not failed (M2)', () => {
  const r = good();
  r.ingredients.push({ name: 'Garam masala', grams: 6 }, { name: 'Ginger paste', grams: 30 });
  const out = mp(r);
  assert.deepEqual(out.fails, []);
  assert.deepEqual(out.warns, []);
  assert.deepEqual(out.stats, { ingredients: 4, nameOnly: 2 });
  // foodId + name, section and note are all allowed; only a foodId-less line counts as name-only
  const full = {
    ...good(),
    ingredients: [
      { foodId: 'intl-chicken', name: 'Chicken thigh', grams: 720, section: 'butcher', note: 'x' },
      { name: 'Salt', grams: 8, section: 'supermarket' },
    ],
  };
  const o2 = mp(full);
  assert.deepEqual(o2.fails, []);
  assert.equal(o2.stats.nameOnly, 1);
});

test('meal-prep gate: an unknown foodId still fails even when a name is given (M2)', () => {
  const r = good();
  r.ingredients[0] = { foodId: 'intl-nope', name: 'Chicken', grams: 100 };
  assert.deepEqual(failGates(r), ['M2']);
  r.ingredients[0] = { foodId: 7, name: 'Chicken', grams: 100 };
  assert.deepEqual(failGates(r), ['M2']);
});

test('meal-prep gate: a line with neither foodId nor name fails M2', () => {
  for (const line of [
    { grams: 5 },
    { grams: 5, name: '' },
    { grams: 5, name: '   ' },
    { grams: 5, name: 3 },
  ]) {
    const r = good();
    r.ingredients[1] = line;
    assert.deepEqual(failGates(r), ['M2'], JSON.stringify(line));
  }
});

test('meal-prep gate: grams must be a number > 0, for foodId lines and name-only lines (M2)', () => {
  for (const grams of [0, -5, NaN, Infinity, '30', null, undefined]) {
    for (const line of [{ foodId: 'intl-chicken' }, { name: 'Salt' }]) {
      const r = good();
      r.ingredients[0] = { ...line, grams };
      assert.deepEqual(failGates(r), ['M2'], `${JSON.stringify(line)} grams ${grams}`);
    }
  }
  // qty + servingId no longer stands in for grams (§13.1)
  const r = good();
  r.ingredients[0] = { foodId: 'intl-chicken', servingId: 'tbsp', qty: 2 };
  assert.deepEqual(failGates(r), ['M2']);
  const ok = good();
  ok.ingredients[0] = { name: 'Salt', grams: 0.5 };
  assert.deepEqual(failGates(ok), []);
});
