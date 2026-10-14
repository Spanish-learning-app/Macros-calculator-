// Author's tests for the Sprint 2 store API (recipes, batches, chai, saved meals, seafood).
// Owner: Lena. Contract: docs/ARCHITECTURE.md §13. A16–A18 and A10 steps where the store decides.
import test from 'node:test';
import assert from 'node:assert/strict';
import { RULES, FOODS } from '../../fixtures/index.js';
import { createStore } from '../../../app/ui/store.js';
import { entryNutrients } from '../../../app/core/days.js';

const base = (id, group, per100g, servings, extra = {}) => ({
  id,
  name: extra.name ?? id,
  aliases: extra.aliases ?? [],
  group,
  per100g: { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, ...per100g },
  servings,
  tags: extra.tags ?? [],
  halal: extra.halal ?? { status: 'halal' },
  source: { citation: 'test', confidence: 'B' },
  ...(extra.slots ? { slots: extra.slots } : {}),
});

const EXTRA = [
  base('t-egg', 'egg', { kcal: 143, protein: 12.6, fat: 9.5, carbs: 0.7 }, [
    { id: 'large', label: '1 large egg', grams: 50, default: true },
  ]),
  base('t-potato', 'vegetable', { kcal: 77, protein: 2, carbs: 15.4, fiber: 2.2 }, [
    { id: 'medium', label: '1 medium potato', grams: 213, default: true },
  ]),
  base('t-chicken', 'meat-fish', { kcal: 121, protein: 19.7, fat: 4.1 }, [
    { id: 'piece', label: '1 thigh', grams: 100, default: true },
  ]),
  base(
    't-rice',
    'dry-staple',
    { kcal: 356, protein: 8.1, carbs: 77.1, fiber: 1.3 },
    [{ id: 'cup', label: '1 cup', grams: 185, default: true }],
    { name: 'Basmati rice, dry' },
  ),
  base(
    't-tikka-box',
    'lunchbox',
    { kcal: 101, protein: 7.7, carbs: 10.7, fat: 2.8, fiber: 1.3 },
    [{ id: 'box', label: '1 box', grams: 644, default: true }],
    { name: 'Chicken tikka rice bowl', slots: ['lunch'], tags: ['meal-prep'] },
  ),
  base(
    't-chaat-box',
    'lunchbox',
    { kcal: 120, protein: 9, carbs: 10, fat: 4, fiber: 3 },
    [{ id: 'box', label: '1 box', grams: 500, default: true }],
    { name: 'Chicken chana chaat', slots: ['lunch'] },
  ),
  base('intl-milk-whole', 'dairy', { kcal: 61, protein: 3.2, carbs: 4.8, fat: 3.3 }, [
    { id: 'cup', label: '1 cup (200 ml)', grams: 206, default: true },
  ]),
  base('intl-sugar', 'sugar-sweetener', { kcal: 387, carbs: 100 }, [
    { id: 'tsp', label: '1 teaspoon', grams: 4.2, default: true },
  ]),
  base(
    't-prawns',
    'meat-fish',
    { kcal: 99, protein: 24 },
    [{ id: 'plate', label: '1 plate', grams: 150, default: true }],
    { name: 'Gambas a la plancha', tags: ['seafood-prawn'] },
  ),
];

const LIBRARY = [
  {
    foodId: 't-tikka-box',
    boxes: 4,
    storage: ['cooked-meat', 'cooked-starch', { id: 'cold-salad', pot: true }],
    ingredients: [
      { name: 'Boneless chicken thigh', grams: 720, section: 'butcher' },
      { foodId: 't-rice', grams: 240 },
      { name: 'Garlic', grams: 15 },
    ],
  },
  { foodId: 't-chaat-box', boxes: 4, storage: ['cooked-meat', 'cold-salad'], ingredients: [] },
];

function makeStore(clock) {
  let n = 0;
  return createStore({
    persistence: null,
    rules: RULES,
    foods: [...FOODS, ...EXTRA],
    library: LIBRARY,
    now: () => clock.now,
    makeId: () => `id${(n += 1)}`,
    timeZone: 'Europe/Madrid',
    timers: { set: () => 0, clear: () => {} },
  });
}

const at = (y, m, d, hh, mm = 0) => new Date(y, m - 1, d, hh, mm);

test('A10: a tortilla recipe logs half at dinner and re-logs from recents', () => {
  const clock = { now: at(2026, 10, 14, 20) };
  const store = makeStore(clock);
  const id = store.saveRecipe({
    name: 'Mi tortilla',
    ingredients: [
      { foodId: 't-egg', servingId: 'large', qty: 5 },
      { foodId: 't-potato', servingId: 'medium', qty: 3 },
    ],
    cookedWeightG: null,
    boxes: 1,
  });
  assert.match(id, /^my-recipe-/);
  const total = store.recipeTotals(store.recipe(id)).total;
  const food = store.food(id);
  assert.equal(food.name, 'Mi tortilla');
  assert.equal(store.search('mi tortilla').hits[0]?.food.id, id, 'my recipe is found by name');
  const entryId = store.addFood({
    date: '2026-10-14',
    slot: 'dinner',
    foodId: id,
    servingId: 'box',
    qty: 0.5,
  });
  const entry = store.day('2026-10-14').entries.find((e) => e.id === entryId);
  const n = entryNutrients(entry, new Map([[id, food]]));
  assert.ok(Math.abs(n.kcal - total.kcal / 2) < 1e-9);
  clock.now = at(2026, 10, 15, 20);
  assert.deepEqual(store.portionFor(id), { servingId: 'box', qty: 0.5 });
  assert.ok(store.recents('dinner').some((r) => r.food.id === id));
  // Edit: 4 → 5 boxes keeps the id; per box follows.
  store.saveRecipe({ ...store.recipe(id), boxes: 5 });
  assert.equal(store.recipes().length, 1);
  assert.equal(
    store.food(id).servings.find((s) => s.id === 'box').grams * 5,
    food.servings[0].grams,
  );
  store.deleteRecipe(id);
  assert.equal(store.food(id), undefined);
  store.undo();
  assert.ok(store.food(id));
});

test('A17 + A18: cook, fill Mon–Thu, fifth box, tick, move to fridge, use-by', () => {
  const clock = { now: at(2026, 11, 1, 18) }; // Sunday 1 Nov 2026, after the clock change
  const store = makeStore(clock);
  const plan = store.planFor('t-tikka-box', 4);
  assert.deepEqual(plan.storage, ['fridge', 'freezer', 'freezer', 'freezer']);
  const batchId = store.cookBatch({ recipeId: 't-tikka-box', boxes: 4 });
  assert.equal(store.boxesLeft(batchId), 4);
  const placed = store.fillDays({
    batchId,
    dates: ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05'],
    slot: 'lunch',
  });
  assert.equal(placed, 4);
  assert.equal(store.boxesLeft(batchId), 0);
  for (const d of ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05']) {
    const lunch = store.day(d).entries.filter((e) => e.slot === 'lunch');
    assert.equal(lunch.length, 1);
    assert.equal(lunch[0].servingId, 'box');
    assert.equal(lunch[0].status, 'planned');
  }
  // Monday's box is the fridge box (good until Monday); the others come from the freezer.
  const mon = store.day('2026-11-02').entries[0];
  const info = store.boxInfo(mon, '2026-11-02');
  assert.equal(info.number, 1);
  assert.equal(info.useBy, '2026-11-02');
  assert.equal(info.status, 'last-day');
  assert.equal(store.boxInfo(store.day('2026-11-03').entries[0], '2026-11-03').useBy, null);

  // Fifth box: works, says none left, Undo removes it.
  const fifth = store.placeBox({ batchId, date: '2026-11-06', slot: 'lunch' });
  assert.equal(fifth.noneLeft, true);
  assert.equal(store.day('2026-11-06').entries.length, 1);
  assert.equal(store.getState().undo !== null, true);
  store.undo();
  assert.equal(store.day('2026-11-06').entries.length, 0);

  // Sunday night: nothing to move yet for Monday (box 1 is in the fridge).
  assert.deepEqual(store.prepNotices('2026-11-01').moveTonight, []);
  // Monday 22:00: tomorrow's box 2 is frozen → move it tonight.
  clock.now = at(2026, 11, 2, 22);
  const notes = store.prepNotices('2026-11-02').moveTonight;
  assert.equal(notes.length, 1);
  assert.equal(notes[0].number, 2);
  store.setBoxStorage(batchId, notes[0].boxId, 'fridge');
  const tue = store.day('2026-11-03').entries[0];
  assert.equal(store.boxInfo(tue, '2026-11-03').useBy, '2026-11-03');
  // Tuesday: box 1 (not ticked) is past its use-by; Tuesday's box is on its last day.
  clock.now = at(2026, 11, 3, 9);
  const rows = store.boxRows(batchId);
  assert.equal(rows[0].today, 'past');
  assert.equal(store.boxInfo(tue, '2026-11-03').status, 'last-day');

  // Tick Monday eaten → box 1 eaten; delete Thursday → box 4 free again.
  store.setEntryStatus('2026-11-02', mon.id, 'eaten');
  assert.equal(store.batch(batchId).boxes[0].status, 'eaten');
  const thu = store.day('2026-11-05').entries[0];
  store.removeEntry('2026-11-05', thu.id);
  assert.equal(store.boxesLeft(batchId), 1);
  // Moving an entry keeps its box, now on the new date.
  store.moveEntry('2026-11-04', store.day('2026-11-04').entries[0].id, '2026-11-06');
  assert.equal(store.batch(batchId).boxes[2].placed.date, '2026-11-06');
});

test('A18 (6) and (7): a cold box never goes in the freezer; the shopping list doubles', () => {
  const clock = { now: at(2026, 11, 1, 18) };
  const store = makeStore(clock);
  const plan = store.planFor('t-chaat-box', 4);
  assert.equal(plan.freezable, false);
  assert.deepEqual(plan.storage, ['fridge', 'fridge', 'fridge', 'fridge']);
  const id = store.cookBatch({
    recipeId: 't-chaat-box',
    boxes: 4,
    storage: ['freezer', 'freezer', 'fridge', 'fridge'],
  });
  assert.ok(store.batch(id).boxes.every((b) => b.storage === 'fridge'));
  assert.equal(store.boxRows(id)[0].useBy, '2026-11-03');

  const four = store.shopping('t-tikka-box', 4);
  const eight = store.shopping('t-tikka-box', 8);
  assert.deepEqual(
    four.sections.map((s) => s.label),
    ['Halal butcher', 'Supermarket'],
  );
  const grams = (list) => list.sections.flatMap((s) => s.items.map((i) => i.grams));
  assert.deepEqual(
    grams(eight),
    grams(four).map((g) => g * 2),
  );
  assert.equal(store.shopping('t-chaat-box', 4), null, 'no ingredients yet: no list');
});

test('my chai is the top chai in search and recents', () => {
  const clock = { now: at(2026, 10, 14, 17) };
  const store = makeStore(clock);
  store.addFood({ date: '2026-10-14', slot: 'evening', foodId: 'pk-chai-doodh-patti-home-fx' });
  const id = store.saveChai({ milkShare: 0.75, sugarTsp: 1, cupMl: 200 });
  assert.equal(store.chai().id, id);
  assert.equal(store.recipes().length, 0, 'chai is not listed with the meal-prep recipes');
  assert.equal(store.search('chai').hits[0].food.id, id);
  assert.equal(store.recents('evening')[0].food.id, id);
  const cup = store.food(id).servings[0];
  assert.equal(cup.id, 'cup');
  // 150 ml milk (154.5 g) + 1 tsp sugar: the cup's nutrients are exactly those two.
  const kcal = (store.food(id).per100g.kcal * cup.grams) / 100;
  assert.ok(Math.abs(kcal - (0.61 * 155 + 3.87 * 4.2)) < 1e-6, String(kcal));
  // Saving again updates the same recipe.
  assert.equal(store.saveChai({ milkShare: 0.5, sugarTsp: 0, cupMl: 250 }), id);
  assert.match(store.food(id).name, /no sugar/);
});

test('saved meals: save a slot, add it back in one action, delete with undo', () => {
  const clock = { now: at(2026, 10, 14, 13) };
  const store = makeStore(clock);
  store.addFood({ date: '2026-10-14', slot: 'lunch', foodId: 'pk-roti-home-fx' });
  store.addFood({ date: '2026-10-14', slot: 'lunch', foodId: 'pk-daal-masoor-home-fx' });
  const mealId = store.saveMeal({ date: '2026-10-14', slot: 'lunch', name: 'Daal roti' });
  assert.equal(store.savedMeals()[0].items.length, 2);
  assert.equal(store.addSavedMeal({ mealId, date: '2026-10-15', slot: 'dinner' }), 2);
  const added = store.day('2026-10-15').entries;
  assert.deepEqual(
    added.map((e) => [e.slot, e.status]),
    [
      ['dinner', 'planned'],
      ['dinner', 'planned'],
    ],
  );
  store.undo();
  assert.equal(store.day('2026-10-15').entries.length, 0);
  store.deleteSavedMeal(mealId);
  assert.equal(store.savedMeals().length, 0);
  assert.equal(store.saveMeal({ date: '2026-10-14', slot: 'snacks', name: 'x' }), null);
});

test('seafood setting: foods outside the choice show check, never a ruling', () => {
  const clock = { now: at(2026, 10, 14, 13) };
  const store = makeStore(clock);
  assert.equal(store.food('t-prawns').halal.status, 'halal');
  store.updateSettings({ seafood: 'fish-only' });
  const f = store.food('t-prawns');
  assert.equal(f.halal.status, 'check');
  assert.match(f.halal.reason, /school of thought/);
  assert.ok(
    store.search('gambas').hits.some((h) => h.food.id === 't-prawns'),
    'still found',
  );
  store.updateSettings({ seafood: 'fish-prawns' });
  assert.equal(store.food('t-prawns').halal.status, 'halal');
});
