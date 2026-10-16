// Author's tests for "How to make it" (brief s3-method, ARCHITECTURE §13.1 Method). Owner: Lena.
// Built against a fixture method in the contract shape, so it holds before and after the Lab's data.
import test from 'node:test';
import assert from 'node:assert/strict';
import { RULES, FOODS } from '../../fixtures/index.js';
import { createStore } from '../../../app/ui/store.js';
import {
  migrate,
  defaultData,
  serializeExport,
  parseImport,
  mergeImport,
} from '../../../app/core/storage.js';
import { MY_METHOD_MAX } from '../../../app/core/mealprep.js';
import {
  HEATS,
  heatLabel,
  minutesText,
  lineSteps,
  methodOf,
} from '../../../app/ui/components/recipe-method.js';

const FIXTURE = {
  equipment: ['Large frying pan (28 cm) with a lid', '4 lunch boxes'],
  prep: ['Cut the chicken thighs into 4 cm pieces.', 'Peel 12 garlic cloves and slice them thin.'],
  steps: [
    { text: 'Heat 2 tbsp (30 g) olive oil for 1 minute.', heat: 'medium-high', minutes: 1 },
    { text: 'Add the chicken in one layer.', heat: 'medium-high', minutes: 7 },
    { text: 'Spoon into the boxes.', heat: 'none' },
  ],
  doneWhen: 'Cut the biggest piece: white all through, no pink.',
  boxUp: 'Cool for 30–60 min. Boxes 1–2 to the fridge, 3–4 to the freezer.',
  reheat: 'Microwave 2½–3 min, stir halfway, until steaming hot.',
  tips: ['No guindilla? Use a pinch of chilli flakes.'],
};

test('heat labels: every §13.1 value has a chip; unknown values have none', () => {
  assert.equal(HEATS.length, 9);
  for (const heat of HEATS) assert.equal(typeof heatLabel(heat), 'string');
  assert.equal(heatLabel('medium-high'), 'Medium-high heat');
  assert.equal(heatLabel('oven-200'), 'Oven 200 °C');
  assert.equal(heatLabel('none'), 'No heat');
  assert.equal(heatLabel('hot'), null);
  assert.equal(heatLabel(undefined), null);
  assert.equal(heatLabel('toString'), null);
});

test('minutes in words: whole, half and quarter minutes, hours; nothing for bad values', () => {
  assert.equal(minutesText(7), '7 min');
  assert.equal(minutesText(1), '1 min');
  assert.equal(minutesText(2.5), '2½ min');
  assert.equal(minutesText(0.5), '½ min');
  assert.equal(minutesText(1.75), '1¾ min');
  assert.equal(minutesText(4.4), '4½ min'); // nearest quarter
  assert.equal(minutesText(4.1), '4 min');
  assert.equal(minutesText(4.9), '5 min');
  assert.equal(minutesText(60), '1 h');
  assert.equal(minutesText(90), '1 h 30 min');
  for (const bad of [0, -3, Number.NaN, Infinity, '5', null, undefined]) {
    assert.equal(minutesText(bad), null, String(bad));
  }
});

test('methodOf: the contract shape comes through in order, with chips', () => {
  const m = methodOf({ method: FIXTURE });
  assert.equal(m.kind, 'steps');
  assert.deepEqual(m.equipment, FIXTURE.equipment);
  assert.deepEqual(m.prep, FIXTURE.prep);
  assert.deepEqual(
    m.steps.map((s) => [s.heat, s.minutes]),
    [
      ['medium-high', 1],
      ['medium-high', 7],
      ['none', null],
    ],
  );
  assert.equal(m.doneWhen, FIXTURE.doneWhen);
  assert.equal(m.boxUp, FIXTURE.boxUp);
  assert.equal(m.reheat, FIXTURE.reheat);
  assert.deepEqual(m.tips, FIXTURE.tips);
});

test('methodOf: hidden gracefully when there is no method, or no usable step', () => {
  assert.equal(methodOf(null), null);
  assert.equal(methodOf({}), null);
  assert.equal(methodOf({ method: null }), null);
  assert.equal(methodOf({ method: { ...FIXTURE, steps: [] } }), null);
  assert.equal(methodOf({ method: { steps: [{ text: '  ' }, { heat: 'low' }] } }), null);
  assert.equal(methodOf({ method: '   \n  ' }), null);
  assert.equal(methodOf({ method: 42 }), null);
});

test('methodOf: tolerant while the Lab writes (missing parts, bad heat or minutes dropped)', () => {
  const m = methodOf({
    method: { steps: [{ text: ' Fry ', heat: 'very hot', minutes: -2 }, 'Box it'] },
  });
  assert.deepEqual(m.steps, [
    { text: 'Fry', heat: null, minutes: null },
    { text: 'Box it', heat: null, minutes: null },
  ]);
  assert.deepEqual([m.equipment, m.prep, m.tips], [[], [], []]);
  assert.deepEqual([m.doneWhen, m.boxUp, m.reheat], [null, null, null]);
  // The sheets' old format: a list of strings.
  assert.equal(methodOf({ method: ['Soften the onion.', 'Add the meat.'] }).steps.length, 2);
});

test('My method: free text becomes steps, one per line, numbering removed', () => {
  assert.deepEqual(lineSteps('1. Fry the onion\n\n2) Add chicken\n- Salt\n• Box it\n10. Eat'), [
    'Fry the onion',
    'Add chicken',
    'Salt',
    'Box it',
    'Eat',
  ]);
  const m = methodOf({ method: 'Fry the onion 8 min.\r\nAdd the chicken.' });
  assert.equal(m.kind, 'text');
  assert.deepEqual(
    m.steps.map((s) => s.text),
    ['Fry the onion 8 min.', 'Add the chicken.'],
  );
  assert.equal(m.steps[0].heat, null);
});

// ------------------------------------------------------------------ the person's "My method"

const food = FOODS.find((f) => f.servings?.length);
const ing = { foodId: food.id, servingId: food.servings[0].id, qty: 1 };

function makeStore() {
  let n = 0;
  return createStore({
    persistence: null,
    rules: RULES,
    foods: FOODS,
    library: [],
    now: () => new Date(2026, 9, 16, 12),
    makeId: () => `id${(n += 1)}`,
    timeZone: 'Europe/Madrid',
    timers: { set: () => 0, clear: () => {} },
  });
}

test('saveRecipe keeps My method (trimmed), drops a blank one, caps the length', () => {
  const store = makeStore();
  const id = store.saveRecipe({
    name: 'Mi pollo',
    ingredients: [ing],
    boxes: 2,
    method: '  1. Fry\r\n2. Box  ',
  });
  assert.equal(store.recipe(id).method, '1. Fry\n2. Box');
  store.saveRecipe({ ...store.recipe(id), method: '   ' });
  assert.equal(Object.hasOwn(store.recipe(id), 'method'), false);
  store.saveRecipe({ ...store.recipe(id), method: 'x'.repeat(MY_METHOD_MAX + 50) });
  assert.equal(store.recipe(id).method.length, MY_METHOD_MAX);
});

const docWith = (recipes) => ({
  ...defaultData(),
  recipes,
});

test('migrate is tolerant: a non-text or blank method is dropped, text is trimmed, never corrupt', () => {
  const base = {
    id: 'my-recipe-1',
    name: 'A',
    createdAt: '2026-10-01',
    ingredients: [ing],
    cookedWeightG: null,
    boxes: 2,
  };
  const out = migrate(
    docWith([
      { ...base, method: 42 },
      { ...base, id: 'my-recipe-2', method: '   ' },
      { ...base, id: 'my-recipe-3', method: '  Fry.\nBox.  ' },
      { ...base, id: 'my-recipe-4', method: 'y'.repeat(MY_METHOD_MAX + 1) },
      { ...base, id: 'my-recipe-5', method: 'Fry.' },
      { ...base, id: 'my-recipe-6' },
    ]),
  );
  assert.deepEqual(
    out.recipes.map((r) => r.method?.length ?? null),
    [null, null, 'Fry.\nBox.'.length, MY_METHOD_MAX, 4, null],
  );
  assert.equal(Object.hasOwn(out.recipes[0], 'method'), false);
});

test('export and import keep My method (replace and merge)', () => {
  const recipe = {
    id: 'my-recipe-9',
    name: 'B',
    createdAt: '2026-10-01',
    ingredients: [ing],
    cookedWeightG: null,
    boxes: 3,
    method: 'Fry.\nBox.',
  };
  const text = serializeExport(docWith([recipe]), '2026-10-16T01:00:00Z');
  const parsed = parseImport(text);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.data.recipes[0].method, 'Fry.\nBox.');
  const merged = mergeImport(defaultData(), parsed.data, 'merge');
  assert.equal(merged.recipes.find((r) => r.id === 'my-recipe-9').method, 'Fry.\nBox.');
  const replaced = mergeImport(defaultData(), parsed.data, 'replace');
  assert.equal(replaced.recipes[0].method, 'Fry.\nBox.');
});
