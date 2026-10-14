// Author's tests for app/core/mealprep.js (owner: Lena). Kenji tests §13 independently in qa/.
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFoodIndex } from '../../../app/core/foods.js';
import {
  worstHalal,
  recipeTotals,
  foodFromRecipe,
  storageIds,
  storagePlan,
  boxUseBy,
  useByStatus,
  boxesLeft,
  placeBox,
  syncBatches,
  shoppingList,
} from '../../../app/core/mealprep.js';
import { RULES } from '../../fixtures/index.js';
import { deepFreeze, close } from './helpers.js';

const food = (id, group, per100g, servings, extra = {}) => ({
  id,
  name: extra.name ?? id,
  aliases: [],
  group,
  per100g: { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, ...per100g },
  servings,
  tags: [],
  halal: extra.halal ?? { status: 'halal' },
  source: { citation: 'test' },
  ...extra,
});

const FOODS = deepFreeze([
  food('egg', 'egg', { kcal: 143, protein: 12.6, fat: 9.5, carbs: 0.7 }, [
    { id: 'large', label: '1 large egg', grams: 50, default: true },
  ]),
  food('potato', 'vegetable', { kcal: 77, protein: 2, carbs: 15.4, fiber: 2.2, fat: 0.1 }, [
    { id: 'medium', label: '1 medium potato', grams: 213, default: true },
  ]),
  food('onion', 'vegetable', { kcal: 40, protein: 1.1, carbs: 7.6, fiber: 1.7, fat: 0.1 }, [
    { id: 'medium', label: '1 medium onion', grams: 110, default: true },
  ]),
  food('olive-oil', 'fat-oil', { kcal: 884, fat: 100 }, [
    { id: 'tbsp', label: '1 tablespoon', grams: 13.5, default: true },
  ]),
  food(
    'chicken-thigh',
    'meat-fish',
    { kcal: 121, protein: 19.7, fat: 4.1 },
    [{ id: 'piece', label: '1 thigh', grams: 100, default: true }],
    { name: 'Chicken thigh, raw' },
  ),
  food('dahi', 'dairy', { kcal: 61, protein: 3.5, carbs: 4.7, fat: 3.3 }, [
    { id: 'katori', label: '1 katori', grams: 200, default: true },
  ]),
  food(
    'basmati-dry',
    'dry-staple',
    { kcal: 356, protein: 8.1, carbs: 77.1, fiber: 1.3, fat: 0.6 },
    [{ id: 'cup', label: '1 cup', grams: 185, default: true }],
    { name: 'Basmati rice, dry' },
  ),
  food(
    'lentils-dry',
    'dry-staple',
    { kcal: 352, protein: 24.6, carbs: 52.7, fiber: 10.7, fat: 1.1 },
    [{ id: 'cup', label: '1 cup', grams: 192, default: true }],
    { name: 'Lentejas pardinas, dry' },
  ),
  food(
    'ensaimada',
    'biscuit-bakery',
    { kcal: 400 },
    [{ id: 'piece', label: '1 ensaïmada', grams: 90, default: true }],
    { halal: { status: 'not-halal', reason: 'Made with lard (saïm).' } },
  ),
  food(
    'gelatin-sweet',
    'sweet-dessert',
    { kcal: 300 },
    [{ id: 'piece', label: '1 piece', grams: 20, default: true }],
    { halal: { status: 'check', reason: 'Gelatin source unknown.' } },
  ),
]);
const INDEX = buildFoodIndex(FOODS);

const tortilla = deepFreeze({
  id: 'my-recipe-tortilla',
  name: 'Mi tortilla',
  createdAt: '2026-10-14',
  ingredients: [
    { foodId: 'egg', servingId: 'large', qty: 5 },
    { foodId: 'potato', servingId: 'medium', qty: 3 },
    { foodId: 'onion', servingId: 'medium', qty: 1 },
    { foodId: 'olive-oil', servingId: 'tbsp', qty: 3 },
  ],
  cookedWeightG: null,
  boxes: 1,
});

const bowls = deepFreeze({
  id: 'my-recipe-bowls',
  name: 'Tikka bowls',
  createdAt: '2026-10-14',
  ingredients: [
    { foodId: 'chicken-thigh', servingId: 'g', qty: 800 },
    { foodId: 'dahi', servingId: 'g', qty: 200 },
    { foodId: 'olive-oil', servingId: 'tbsp', qty: 2 },
    { foodId: 'basmati-dry', servingId: 'g', qty: 320 },
  ],
  cookedWeightG: 2000,
  boxes: 4,
});

test('recipeTotals: lines and total are the sum of the ingredients (A10)', () => {
  const t = recipeTotals(tortilla, INDEX);
  assert.equal(t.lines.length, 4);
  const grams = 250 + 639 + 110 + 40.5;
  close(t.rawGrams, grams);
  close(t.cookedGrams, grams);
  close(t.total.kcal, 143 * 2.5 + 77 * 6.39 + 40 * 1.1 + 884 * 0.405, 1e-9);
  const sum = t.lines.reduce((s, l) => s + l.nutrients.protein, 0);
  close(t.total.protein, sum);
  assert.deepEqual(t.missing, []);
});

test('foodFromRecipe: half the tortilla is half the total; whole recipe serving', () => {
  const f = foodFromRecipe(tortilla, INDEX, RULES);
  const t = recipeTotals(tortilla, INDEX);
  assert.equal(f.id, tortilla.id);
  assert.equal(f.group, 'lunchbox');
  const box = f.servings.find((s) => s.default);
  assert.equal(box.id, 'box');
  assert.equal(box.label, '1 whole recipe');
  assert.ok(!f.servings.some((s) => s.id === 'pot'), 'no pot serving when 1 box');
  const halfKcal = (f.per100g.kcal * box.grams * 0.5) / 100;
  close(halfKcal, t.total.kcal / 2, 1e-9);
  assert.deepEqual(f.source, {
    citation: 'Your recipe',
    method: 'recipe',
    confidence: 'C',
    notes: f.source.notes,
  });
  assert.match(f.source.notes, /4 ingredients/);
  assert.deepEqual(f.halal, { status: 'halal' });
});

test('foodFromRecipe: per box = total / boxes, cooked weight respected, 4 → 5 boxes', () => {
  const t = recipeTotals(bowls, INDEX);
  for (const boxes of [4, 5]) {
    const f = foodFromRecipe({ ...bowls, boxes }, INDEX, RULES);
    const box = f.servings.find((s) => s.id === 'box');
    close(box.grams, 2000 / boxes);
    for (const k of ['kcal', 'protein', 'carbs', 'fat', 'fiber']) {
      close((f.per100g[k] * box.grams) / 100, t.total[k] / boxes, 1e-9, k);
    }
    assert.equal(f.servings.find((s) => s.id === 'pot').grams, 2000);
  }
  const f = foodFromRecipe(bowls, INDEX, RULES);
  assert.deepEqual(
    f.servings.map((s) => s.id),
    ['box', 'pot', 'katori-small', 'katori', 'katori-large', 'tbsp'],
  );
  assert.equal(f.servings.find((s) => s.id === 'katori').grams, 200);
});

test('foodFromRecipe: chai kind has one cup serving and chai aliases', () => {
  const chai = {
    id: 'my-recipe-chai',
    name: 'My chai',
    kind: 'chai',
    ingredients: [
      { foodId: 'dahi', servingId: 'g', qty: 150 },
      { foodId: 'onion', servingId: 'g', qty: 4.2 },
    ],
    cookedWeightG: 200,
    boxes: 1,
  };
  const f = foodFromRecipe(chai, INDEX, RULES);
  assert.deepEqual(
    f.servings.map((s) => [s.id, s.grams, s.default]),
    [['cup', 200, true]],
  );
  assert.ok(f.aliases.includes('chai'));
  assert.equal(f.group, 'drink-tea-coffee');
});

test('foodFromRecipe: worst halal status with the ingredient reason; bad input throws', () => {
  const withSweet = {
    ...tortilla,
    ingredients: [...tortilla.ingredients, { foodId: 'gelatin-sweet', servingId: 'piece', qty: 1 }],
  };
  const f = foodFromRecipe(withSweet, INDEX, RULES);
  assert.equal(f.halal.status, 'check');
  assert.equal(f.halal.reason, 'Gelatin source unknown.');
  assert.equal(f.halal.ingredient, 'gelatin-sweet');
  assert.throws(() => foodFromRecipe({ ...tortilla, ingredients: [] }, INDEX, RULES), RangeError);
  assert.throws(() => foodFromRecipe({ ...tortilla, boxes: 0 }, INDEX, RULES), RangeError);
  assert.throws(() => foodFromRecipe(null, INDEX, RULES), TypeError);
  const missing = recipeTotals(
    {
      ...tortilla,
      ingredients: [...tortilla.ingredients, { foodId: 'gone', servingId: 'g', qty: 5 }],
    },
    INDEX,
  );
  assert.deepEqual(missing.missing, ['gone']);
});

test('worstHalal: order from RULES, first worst wins, empty is halal', () => {
  assert.deepEqual(worstHalal([], RULES), { status: 'halal', reason: null, foodId: null });
  const w = worstHalal(
    [INDEX.get('egg'), INDEX.get('gelatin-sweet'), INDEX.get('ensaimada')],
    RULES,
  );
  assert.deepEqual(w, {
    status: 'not-halal',
    reason: 'Made with lard (saïm).',
    foodId: 'ensaimada',
  });
  assert.equal(worstHalal([INDEX.get('gelatin-sweet')]).status, 'check');
});

test('storageIds and storagePlan: rice → box 1 fridge, rest freezer; egg dish never frozen', () => {
  assert.deepEqual(storageIds(bowls, INDEX, RULES), ['cooked-starch', 'cooked-meat']);
  assert.deepEqual(storagePlan(bowls, 4, INDEX, RULES), {
    fridgeDays: 1,
    freezable: true,
    storage: ['fridge', 'freezer', 'freezer', 'freezer'],
  });
  assert.deepEqual(storageIds(tortilla, INDEX, RULES), ['egg-dish']);
  assert.deepEqual(storagePlan(tortilla, 4, INDEX, RULES).storage, [
    'fridge',
    'fridge',
    'fridge',
    'fridge',
  ]);
  const lentejas = { ingredients: [{ foodId: 'lentils-dry', servingId: 'g', qty: 300 }] };
  assert.deepEqual(storageIds(lentejas, INDEX, RULES), ['cooked-curry']);
  const meat = { ingredients: [{ foodId: 'chicken-thigh', servingId: 'g', qty: 300 }] };
  assert.deepEqual(storagePlan(meat, 4, INDEX, RULES).storage, [
    'fridge',
    'fridge',
    'fridge',
    'freezer',
  ]);
  // A library recipe names its components; with no data at all the strictest rule applies.
  assert.deepEqual(
    storageIds({ ingredients: [], storage: ['cold-salad', 'cooked-meat'] }, INDEX, RULES),
    ['cooked-meat', 'cold-salad'],
  );
  assert.deepEqual(storageIds({ ingredients: [] }, INDEX, RULES), ['cooked-starch']);
  assert.throws(() => storagePlan(bowls, 0, INDEX, RULES), RangeError);
});

test('boxUseBy and useByStatus follow A18 across the clock change', () => {
  const batch = {
    id: 'b1',
    recipeId: bowls.id,
    cookedOn: '2026-11-01',
    boxes: [
      { id: 'x1', storage: 'fridge', movedToFridgeOn: null, placed: null, status: 'available' },
      { id: 'x2', storage: 'freezer', movedToFridgeOn: null, placed: null, status: 'available' },
    ],
  };
  assert.equal(boxUseBy(batch, batch.boxes[0], bowls, INDEX, RULES), '2026-11-02');
  assert.equal(boxUseBy(batch, batch.boxes[1], bowls, INDEX, RULES), null);
  const moved = { ...batch.boxes[1], storage: 'fridge', movedToFridgeOn: '2026-11-02' };
  assert.equal(boxUseBy(batch, moved, bowls, INDEX, RULES), '2026-11-03');
  const chaat = { ingredients: [], storage: ['cooked-meat', 'cold-salad'] };
  assert.equal(boxUseBy(batch, batch.boxes[0], chaat, INDEX, RULES), '2026-11-03');
  const oct = { ...batch, cookedOn: '2026-10-24' };
  assert.equal(boxUseBy(oct, batch.boxes[0], bowls, INDEX, RULES), '2026-10-25');
  assert.equal(useByStatus(null, '2026-11-02'), null);
  assert.equal(useByStatus('2026-11-02', '2026-11-01'), 'ok');
  assert.equal(useByStatus('2026-11-02', '2026-11-02'), 'last-day');
  assert.equal(useByStatus('2026-11-02', '2026-11-03'), 'past');
});

test('placeBox, boxesLeft and syncBatches follow the entries', () => {
  const batch = deepFreeze({
    id: 'b1',
    recipeId: 'r',
    cookedOn: '2026-11-01',
    boxes: [1, 2, 3].map((n) => ({
      id: `x${n}`,
      storage: 'fridge',
      movedToFridgeOn: null,
      placed: null,
      status: 'available',
    })),
  });
  assert.equal(boxesLeft(batch), 3);
  const placed = placeBox(batch, 'x1', { date: '2026-11-02', entryId: 'e1' });
  assert.equal(boxesLeft(placed), 2);
  assert.deepEqual(placed.boxes[0].placed, { date: '2026-11-02', entryId: 'e1' });
  assert.throws(() => placeBox(placed, 'x1', { date: '2026-11-02', entryId: 'e2' }), RangeError);

  const entry = (id, boxId, status) => ({
    id,
    slot: 'lunch',
    foodId: 'r',
    servingId: 'box',
    qty: 1,
    status,
    snapshot: {},
    boxRef: { batchId: 'b1', boxId },
  });
  const all = [placed];
  // Planned on Mon: stays placed, unchanged array back.
  const days1 = { '2026-11-02': { date: '2026-11-02', entries: [entry('e1', 'x1', 'planned')] } };
  assert.equal(syncBatches(all, days1), all);
  // Ticked eaten.
  const days2 = { '2026-11-02': { date: '2026-11-02', entries: [entry('e1', 'x1', 'eaten')] } };
  assert.equal(syncBatches(all, days2)[0].boxes[0].status, 'eaten');
  // Moved to another day.
  const days3 = { '2026-11-03': { date: '2026-11-03', entries: [entry('e1', 'x1', 'planned')] } };
  assert.equal(syncBatches(all, days3)[0].boxes[0].placed.date, '2026-11-03');
  // Deleted: free again.
  const freed = syncBatches(all, {})[0].boxes[0];
  assert.equal(freed.status, 'available');
  assert.equal(freed.placed, null);
  assert.deepEqual(syncBatches([], {}), []);
});

test('shoppingList: scales by boxes, merges by food, butcher first', () => {
  const list4 = shoppingList([{ recipe: bowls, boxes: 4 }], INDEX, RULES);
  assert.deepEqual(
    list4.sections.map((s) => s.id),
    ['butcher', 'supermarket'],
  );
  assert.equal(list4.sections[0].label, 'Halal butcher');
  assert.deepEqual(
    list4.sections[0].items.map((i) => [i.name, i.grams]),
    [['Chicken thigh, raw', 800]],
  );
  const list8 = shoppingList([{ recipe: bowls, boxes: 8 }], INDEX, RULES);
  assert.equal(list8.sections[0].items[0].grams, 1600);
  const oil = list8.sections[1].items.find((i) => i.foodId === 'olive-oil');
  assert.deepEqual(oil.count, { qty: 4, label: 'tablespoon' });
  // Two plans with the same food merge into one line.
  const both = shoppingList(
    [
      { recipe: bowls, boxes: 4 },
      { recipe: tortilla, boxes: 1 },
    ],
    INDEX,
  );
  const oils = both.sections.flatMap((s) => s.items).filter((i) => i.foodId === 'olive-oil');
  assert.equal(oils.length, 1);
  close(oils[0].grams, 27 + 40.5);
  // Library shape: names, grams and sections given by the Lab.
  const lib = {
    foodId: 'lib-box',
    boxes: 4,
    storage: ['cooked-meat'],
    ingredients: [
      { name: 'Boneless chicken thigh', grams: 720, section: 'butcher' },
      { name: 'Garlic', grams: 15 },
      { foodId: 'dahi', grams: 450 },
    ],
  };
  const l = shoppingList([{ recipe: lib, boxes: 8 }], INDEX, RULES);
  assert.deepEqual(
    l.sections.map((s) => [s.id, s.items.map((i) => [i.name, i.grams])]),
    [
      ['butcher', [['Boneless chicken thigh', 1440]]],
      [
        'supermarket',
        [
          ['Garlic', 30],
          ['dahi', 900],
        ],
      ],
    ],
  );
});

test('storagePlan: a side pot (raita) does not stop freezing; a mixed-in salad does', () => {
  const tikka = {
    ingredients: [],
    storage: ['cooked-meat', 'cooked-starch', { id: 'cold-salad', pot: true }],
  };
  assert.deepEqual(storagePlan(tikka, 4, INDEX, RULES), {
    fridgeDays: 1,
    freezable: true,
    storage: ['fridge', 'freezer', 'freezer', 'freezer'],
  });
  const chaat = { ingredients: [], storage: ['cooked-meat', 'cold-salad'] };
  const plan = storagePlan(chaat, 4, INDEX, RULES);
  assert.equal(plan.freezable, false);
  assert.equal(plan.fridgeDays, 2);
  assert.deepEqual(storageIds(tikka, INDEX, RULES), ['cooked-starch', 'cooked-meat', 'cold-salad']);
});
