// Author's tests for weekly plans and ready picks (STATUS O7). Owner: Lena.
// Real Lab data: app/data (foods, library, plans-mealprep.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { RULES, FOODS } from '../../../app/data/index.js';
import LIBRARY from '../../../app/data/recipes-mealprep.js';
import { PLANS, READY_PICKS } from '../../../app/data/plans-mealprep.js';
import { createStore } from '../../../app/ui/store.js';
import { halalSwapOf } from '../../../app/ui/components/prep-bits.js';
import { planMonday, planAverages, usedText } from '../../../app/ui/components/prep-plans.js';

function makeStore(now = new Date(2026, 9, 16, 9, 0)) {
  let n = 0;
  return createStore({
    persistence: null,
    rules: RULES,
    foods: FOODS,
    library: LIBRARY,
    plans: { plans: PLANS, readyPicks: READY_PICKS },
    now: () => now,
    makeId: () => `id${(n += 1)}`,
    timeZone: 'Europe/Madrid',
    timers: { set: () => 0, clear: () => {} },
  });
}

test('planMonday: the Monday after today (tomorrow on a Sunday)', () => {
  assert.equal(planMonday('2026-10-16'), '2026-10-19'); // Friday
  assert.equal(planMonday('2026-10-18'), '2026-10-19'); // Sunday
  assert.equal(planMonday('2026-10-19'), '2026-10-26'); // Monday: next week
});

test('every plan food and ready pick exists in the real data', () => {
  const s = makeStore();
  for (const p of s.weeklyPlans()) {
    for (const b of p.batches) assert.ok(s.food(b.foodId), b.foodId);
    for (const d of p.days) for (const i of d.items) assert.ok(s.food(i.foodId), i.foodId);
  }
  for (const slot of Object.keys(READY_PICKS))
    assert.equal(s.readyPicks(slot).length, READY_PICKS[slot].length, slot);
});

test('usePlan: Sunday batches, boxes into Mon–Fri, one undo', () => {
  const s = makeStore();
  const plan = PLANS.find((p) => p.id === 'low-cook-week');
  const r = s.usePlan({ planId: plan.id, monday: '2026-10-19' });
  const sundays = new Set(
    plan.batches.filter((b) => b.when === 'Sunday' && !b.from).map((b) => b.foodId),
  );
  assert.equal(r.batches, sundays.size);
  assert.equal(r.skipped, 0);
  const items = plan.days.reduce((n, d) => n + d.items.length, 0);
  assert.equal(r.entries, items);
  assert.equal(s.batches().length, sundays.size);
  assert.ok(s.batches().every((b) => b.cookedOn === '2026-10-18'));
  const mon = s.day('2026-10-19').entries;
  const lunch = mon.find((e) => e.slot === 'lunch');
  assert.equal(lunch.foodId, 'intl-chicken-burrito-bowl-box');
  assert.ok(lunch.boxRef, 'a Sunday-batch food takes a box');
  const thu = s.day('2026-10-22').entries.find((e) => e.slot === 'lunch');
  assert.equal(thu.boxRef, undefined, 'a Wednesday-night food is a plain entry');
  assert.equal(s.getState().undo.label, 'Planned Low-cook week');
  s.undo();
  assert.equal(s.batches().length, 0);
  assert.equal(s.day('2026-10-19').entries.length, 0);
});

test('usePlan never touches a slot that already has food, and says how many it skipped', () => {
  const s = makeStore();
  s.addFood({ date: '2026-10-20', slot: 'lunch', foodId: 'intl-apple' });
  s.addFood({ date: '2026-10-21', slot: 'dinner', foodId: 'intl-apple' });
  const r = s.usePlan({ planId: 'budget-week', monday: '2026-10-19' });
  assert.equal(r.skipped, 2);
  const tueLunch = s.day('2026-10-20').entries.filter((e) => e.slot === 'lunch');
  assert.deepEqual(
    tueLunch.map((e) => e.foodId),
    ['intl-apple'],
  );
  const plan = PLANS.find((p) => p.id === 'budget-week');
  assert.match(usedText(r, plan, '2026-10-18'), /2 meals skipped/);
});

test('addReadyPick adds every item of the pick in one undoable step', () => {
  const s = makeStore();
  const pick = s.readyPicks('breakfast')[0];
  const n = s.addReadyPick({ slot: 'breakfast', index: 0, date: '2026-10-16' });
  assert.equal(n, pick.items.length);
  assert.equal(s.day('2026-10-16').entries.filter((e) => e.slot === 'breakfast').length, n);
  s.undo();
  assert.equal(s.day('2026-10-16').entries.length, 0);
});

test('planAverages: kcal and protein a day from the Lab preview', () => {
  const a = planAverages({
    days: [
      { kcal: 1800, protein: 120 },
      { kcal: 2000, protein: 130 },
    ],
  });
  assert.deepEqual(a, { kcal: 1900, protein: 125 });
  assert.equal(planAverages({}), null);
});

test('a plan whose every meal is taken adds nothing and cooks no batch', () => {
  const s = makeStore();
  s.usePlan({ planId: 'low-cook-week', monday: '2026-10-19' });
  const before = s.batches().length;
  const r = s.usePlan({ planId: 'budget-week', monday: '2026-10-19' });
  assert.equal(r.entries, 0);
  assert.equal(s.batches().length, before);
  const plan = PLANS.find((p) => p.id === 'budget-week');
  assert.match(usedText(r, plan, '2026-10-18'), /nothing added/);
});

test('halalSwapOf: the feta box points at the Burgos box; a halal food has no swap', () => {
  const s = makeStore();
  const lookup = (id) => s.food(id);
  const feta = s.food('es-lentejas-atun-feta-salad-box');
  // The Lab's field on the library recipe (Yusuf, 2026-10-16); the app has no map of its own now.
  const recipe = LIBRARY.find((r) => r.foodId === feta.id);
  assert.equal(recipe.halalSwap, 'es-lentejas-atun-burgos-salad-box');
  assert.equal(halalSwapOf(feta, recipe, lookup), 'es-lentejas-atun-burgos-salad-box');
  assert.equal(halalSwapOf(feta, null, lookup), null, 'no field, no swap');
  assert.equal(halalSwapOf(s.food('es-lentejas-atun-burgos-salad-box'), null, lookup), null);
  assert.equal(halalSwapOf(feta, { halalSwap: 'nope' }, lookup), null);
  // Every swap the Lab names points at a halal food in the app.
  for (const r of LIBRARY.filter((x) => x.halalSwap)) {
    assert.equal(lookup(r.halalSwap)?.halal?.status, 'halal', r.foodId);
  }
});

test('O5: shoppingList keeps the where-to-buy note; shopNotes groups it per place', async () => {
  const { shoppingList } = await import('../../../app/core/mealprep.js');
  const { buildFoodIndex } = await import('../../../app/core/foods.js');
  const { shopNotes } = await import('../../../app/ui/views/prep.js');
  const recipe = LIBRARY.find((r) => r.ingredients.some((i) => i.note));
  const list = shoppingList([{ recipe, boxes: recipe.boxes }], buildFoodIndex(FOODS), RULES);
  const items = list.sections.flatMap((s) => s.items);
  const noted = items.filter((i) => i.note);
  assert.ok(noted.length > 0);
  assert.ok(
    items.filter((i) => !i.note).every((i) => !('note' in i)),
    'absent, not null',
  );
  const lines = shopNotes(noted);
  assert.equal(lines.length, new Set(noted.map((i) => i.note)).size);
  assert.ok(lines[0].names.length > 0);
});
