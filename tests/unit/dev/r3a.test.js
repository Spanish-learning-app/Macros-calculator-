// Author's tests for fix wave R3-A (Mariam Review 3 must-fix 1–6, Nasreen Review 3). Owner: Lena.
// Real Lab data: app/data (foods, library, plans-mealprep.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { RULES, FOODS } from '../../../app/data/index.js';
import LIBRARY from '../../../app/data/recipes-mealprep.js';
import { PLANS, READY_PICKS } from '../../../app/data/plans-mealprep.js';
import { createStore } from '../../../app/ui/store.js';
import { boxUseBy, storagePlan, shoppingList } from '../../../app/core/mealprep.js';
import { buildFoodIndex } from '../../../app/core/foods.js';
import {
  factorText,
  amountsText,
  boxWord,
  pluralWord,
  effortText,
} from '../../../app/ui/components/prep-bits.js';
import { isNotCounted } from '../../../app/ui/components/ingredient-sheet.js';
import { mealWords } from '../../../app/ui/components/prep-plans.js';
import { refersToDone, timeNoteOf, planAheadOf } from '../../../app/ui/components/recipe-method.js';
import { suggestionText } from '../../../app/ui/components/weight-bits.js';
import { buildSearchIndex, searchFoods } from '../../../app/core/search.js';

const MONDAY = '2026-10-19';
const BOLO = 'intl-beef-bolognese-pasta-box';
const TRAY = 'es-pollo-patatas-pimientos-horno-portion';
const BOC = 'es-bocadillo-atun-huevo-box';

function makeStore(clock = { now: new Date(2026, 9, 18, 17, 0) }, { profile = false } = {}) {
  let n = 0;
  const store = createStore({
    persistence: null,
    rules: RULES,
    foods: FOODS,
    library: LIBRARY,
    plans: { plans: PLANS, readyPicks: READY_PICKS },
    now: () => new Date(clock.now),
    makeId: () => `id${(n += 1)}`,
    timeZone: 'Europe/Madrid',
    timers: { set: () => 0, clear: () => {} },
  });
  if (profile) {
    store.completeOnboarding({
      sex: 'female',
      ageYears: 29,
      heightCm: 165,
      weightKg: 60,
      activity: 'very_active',
      goal: 'maintain',
      rateKgPerWeek: 0,
      lifts: true,
      healthFlags: [],
    });
  }
  return store;
}

const batchOf = (s, recipeId) => s.batches().find((b) => b.recipeId === recipeId);

test('Mariam #2: a plan books fridge or freezer from the day each box is eaten', () => {
  const s = makeStore();
  s.usePlan({ planId: 'low-cook-week', monday: MONDAY });
  const tray = batchOf(s, TRAY);
  // Mon–Wed dinners within the 3-day fridge life, the 4th (unplaced) frozen.
  assert.deepEqual(
    tray.boxes.map((b) => b.storage),
    ['fridge', 'fridge', 'fridge', 'freezer'],
  );
  assert.deepEqual(tray.plan, { id: 'low-cook-week', monday: MONDAY });
  // The bolognese: no unplaced box sits in the fridge with "use by tomorrow".
  const bolo = batchOf(s, BOLO);
  const unplaced = bolo.boxes.filter((b) => b.status === 'available');
  assert.ok(unplaced.length >= 1);
  assert.ok(unplaced.every((b) => b.storage === 'freezer'));
  assert.deepEqual(s.spareBoxes(MONDAY), []);
  // Every placed box is good on its day (fridge in date, or frozen and moved the night before).
  for (const b of s.batches()) {
    for (const row of s.boxRows(b.id)) {
      if (row.box.status !== 'placed' || row.box.storage !== 'fridge') continue;
      assert.ok(row.useBy >= row.box.placed.date, `${b.recipeId} box ${row.number}`);
    }
  }
});

test('core: a part cooked the night before ({ later: true }) does not shorten the fridge life', () => {
  const index = buildFoodIndex(FOODS);
  const lib = LIBRARY.find((r) => r.foodId === BOLO);
  const later = {
    ...lib,
    storage: ['cooked-meat', { id: 'cooked-starch', later: true, job: 'Boil the penne' }],
  };
  const now = { ...lib, storage: ['cooked-meat', 'cooked-starch'] };
  const meat = RULES.mealPrep.storage.find((x) => x.id === 'cooked-meat').fridgeDays;
  assert.equal(storagePlan(later, 4, index, RULES).fridgeDays, meat);
  assert.ok(storagePlan(now, 4, index, RULES).fridgeDays < meat);
  const batch = { cookedOn: '2026-10-18' };
  const box = { storage: 'fridge' };
  assert.equal(boxUseBy(batch, box, later, index, RULES), `2026-10-${18 + meat}`);
});

test('Mariam #5: the plan’s merienda and ready picks go to Merienda, not the 00:00 Snacks', () => {
  const s = makeStore();
  s.usePlan({ planId: 'low-cook-week', monday: MONDAY });
  const mon = s.day(MONDAY).entries;
  assert.equal(mon.filter((e) => e.slot === 'snacks').length, 0);
  const planned = PLANS[0].days[0].items.filter((i) => i.slot === 'snacks').length;
  assert.equal(mon.filter((e) => e.slot === 'evening').length, planned);
  const n = s.addReadyPick({ slot: 'snacks', index: 0, date: '2026-10-18' });
  assert.ok(n > 0);
  assert.ok(s.day('2026-10-18').entries.every((e) => e.slot === 'evening'));
});

test('Mariam #1: a weekday batch fills the plan’s planned row; the meal is never doubled', () => {
  const clock = { now: new Date(2026, 9, 18, 17, 0) };
  const s = makeStore(clock);
  s.usePlan({ planId: 'low-cook-week', monday: MONDAY });
  clock.now = new Date(2026, 9, 21, 21, 0); // Wed 21:00
  const id = s.cookBatch({ recipeId: BOC, boxes: 1 });
  const lunch = s.day('2026-10-22').entries.filter((e) => e.slot === 'lunch');
  assert.equal(lunch.length, 1);
  assert.equal(lunch[0].foodId, BOC);
  assert.deepEqual(lunch[0].boxRef, { batchId: id, boxId: `${id}-1` });
  assert.equal(lunch[0].status, 'planned');
  assert.equal(s.batch(id).boxes[0].status, 'placed');
  clock.now = new Date(2026, 9, 22, 8, 0);
  assert.deepEqual(s.spareBoxes('2026-10-22'), []);
});

test('placeBox into a meal that holds the same dish, planned with no box, links it', () => {
  const clock = { now: new Date(2026, 9, 18, 17, 0) };
  const s = makeStore(clock);
  s.usePlan({ planId: 'low-cook-week', monday: MONDAY });
  // Cooked outside the plan, on another day than the plan's rows: nothing to link yet.
  const id = s.cookBatch({ recipeId: BOC, boxes: 2, cookedOn: '2026-10-18' });
  assert.ok(s.batch(id).boxes.every((b) => b.status === 'available'));
  const thu = '2026-10-22';
  const before = s.day(thu).entries.filter((e) => e.slot === 'lunch');
  assert.equal(before.length, 1);
  assert.equal(before[0].boxRef ?? null, null);
  const r = s.placeBox({ batchId: id, date: thu, slot: 'lunch', status: 'planned' });
  assert.equal(r.linked, true);
  const after = s.day(thu).entries.filter((e) => e.slot === 'lunch');
  assert.equal(after.length, 1);
  assert.equal(after[0].boxRef.batchId, id);
});

test('Mariam #3: tonight’s jobs: the penne the night before, and planned preps with no box', () => {
  const clock = { now: new Date(2026, 9, 18, 17, 0) };
  const s = makeStore(clock);
  s.usePlan({ planId: 'low-cook-week', monday: MONDAY });
  clock.now = new Date(2026, 9, 20, 20, 30); // Tue
  const tue = s.prepNotices('2026-10-20');
  const bolo = batchOf(s, BOLO);
  const wed = bolo.boxes.find((b) => b.placed?.date === '2026-10-21');
  if (wed.storage === 'freezer') assert.equal(tue.moveTonight.length, 1);
  // The plan's own penne job (PLANS[].evenings kind 'later') replaces the app's derived row.
  assert.equal(tue.later.length, 0);
  assert.ok(tue.jobs.some((j) => /penne/.test(j.text)));
  clock.now = new Date(2026, 9, 21, 21, 0); // Wed
  // The plan's own Wednesday job (PLANS[].evenings kind 'make') says it, with a Make button.
  const wedNight = s.prepNotices('2026-10-21');
  assert.ok(wedNight.jobs.some((j) => j.recipeId === BOC && j.make));
  assert.ok(!wedNight.make.some((m) => m.foodId === BOC), 'not twice');
  // Thursday's crema is the plan's Thursday job: no derived row a day early.
  assert.ok(!wedNight.make.some((m) => m.foodId === 'es-crema-verduras-huevo-garbanzos-portion'));
  s.cookBatch({ recipeId: BOC, boxes: 1 });
  const after = s.prepNotices('2026-10-21');
  assert.ok(!after.make.some((m) => m.foodId === BOC));
  assert.ok(!after.jobs.some((j) => j.recipeId === BOC), 'made: the job drops out');
});

test('Mariam #4: the week’s list covers the plan’s weekday jobs and ready food; planShopping too', () => {
  const s = makeStore();
  const before = s.planShopping('low-cook-week');
  const names = (list) => list.sections.flatMap((x) => x.items).map((i) => i.foodId);
  for (const id of ['intl-tuna-canned-water', 'intl-almonds', 'intl-pear', 'es-queso-burgos-0']) {
    assert.ok(names(before.list).includes(id), id);
  }
  assert.ok(!before.batches.some((b) => b.foodId === 'pk-chicken-karahi-roti-portion'));
  s.usePlan({ planId: 'low-cook-week', monday: MONDAY });
  const week = s.weekShopping();
  assert.equal(week.batches.length, 4);
  assert.deepEqual(week.weekdayJobs.map((j) => j.foodId).sort(), [
    'es-bocadillo-atun-huevo-box',
    'es-crema-verduras-huevo-garbanzos-portion',
    'intl-banana-oat-smoothie-jar',
    'intl-chicken-caesar-salad-box',
    'pk-microwave-chana-masala-portion',
  ]);
  assert.equal(week.weekdayJobs.find((j) => j.foodId === 'intl-banana-oat-smoothie-jar').boxes, 2);
  assert.ok(week.ready.length > 0);
  assert.deepEqual(names(week.list).sort(), names(before.list).sort());
});

test('Mariam #6: the protein tip counts eaten food only, so it shows with a plan on', () => {
  const clock = { now: new Date(2026, 9, 18, 17, 0) };
  const s = makeStore(clock, { profile: true });
  s.usePlan({ planId: 'low-cook-week', monday: MONDAY });
  clock.now = new Date(2026, 9, 23, 9, 0);
  s.addFood({ date: '2026-10-23', slot: 'breakfast', foodId: 'es-cafe-con-leche' });
  clock.now = new Date(2026, 9, 23, 16, 45);
  const tip = s.proteinTip('2026-10-23');
  assert.ok(tip, 'a tip with the plan on');
  assert.ok(tip.eaten < 10);
});

test('Nasreen #7: a family pot cooks in katori, and its shopping scales by the pot', () => {
  const s = makeStore();
  const id = s.saveRecipe({
    name: 'Ammi’s salan',
    boxes: 1,
    potKatori: 8,
    cookedWeightG: 1600,
    ingredients: [{ foodId: 'intl-chicken-breast-raw', servingId: 'g', qty: 1000 }],
  });
  const f = s.food(id);
  assert.equal(boxWord(f, RULES), 'katori');
  assert.equal(pluralWord('katori'), 'katori');
  const batch = s.cookBatch({ recipeId: id, boxes: 8 });
  s.placeBox({ batchId: batch, date: '2026-10-18', slot: 'dinner' });
  const e = s.day('2026-10-18').entries[0];
  assert.equal(e.servingId, 'katori');
  const index = buildFoodIndex(FOODS);
  const list = shoppingList([{ recipe: s.recipe(id), boxes: 8 }], index, RULES);
  assert.equal(list.sections[0].items[0].grams, 1000);
});

test('Nasreen #2 and Mariam should-fix: amounts lines, factors, Done when, spices, merienda words', () => {
  assert.equal(factorText(5 / 4), '1¼');
  assert.equal(factorText(1 / 2), '½');
  assert.equal(factorText(5 / 3), '1⅔');
  assert.equal(factorText(2), '2');
  assert.equal(amountsText(4, 4, 'portion'), 'Amounts are for 4 portions.');
  assert.match(amountsText(4, 5, 'portion'), /making 5 portions: use 1¼ times each amount/);
  assert.match(amountsText(2, 1, 'box'), /making 1 box: use ½ of each amount/);
  assert.equal(refersToDone('Check the biggest piece (see "Done when").'), true);
  assert.equal(refersToDone('Stir until done.'), false);
  for (const q of ['salt', 'haldi', 'zeera', 'garam masala', 'glass pani', 'lal mirch']) {
    assert.equal(isNotCounted(q), true, q);
  }
  for (const q of ['chicken thigh', 'onion', 'pepper', 'ginger'])
    assert.equal(isNotCounted(q), false, q);
  assert.equal(
    mealWords('ready food for the merienda', 'Shaam ki chai'),
    'ready food for the shaam ki chai',
  );
  assert.equal(mealWords('Merienda: yogurt', 'Merienda'), 'Merienda: yogurt');
});

test('Mariam should-fix 3: hands-on and start-to-finish time, and no "no cooking" when an egg boils', () => {
  assert.equal(effortText({ effort: 'cook', minutes: 30 }), '30 min');
  assert.equal(
    effortText({ effort: 'cook', minutes: 30, totalMinutes: 80 }),
    '30 min hands-on · 1 h 20 min in all',
  );
  assert.equal(effortText({ effort: 'assemble', minutes: 10 }), '10 min, no cooking');
  assert.equal(
    effortText({ effort: 'assemble', minutes: 10, totalMinutes: 25, lightCooking: 'boil eggs' }),
    '10 min, little cooking · 25 min in all',
  );
});

// ------------------------------------------------------------------ Bilal Review 3 (a)–(f)

test('Bilal (a): Week rows count planned entries, so a plan’s week is not called logged', () => {
  const s = makeStore(undefined, { profile: true });
  s.usePlan({ planId: 'low-cook-week', monday: MONDAY });
  const { rows } = s.week(MONDAY);
  const mon = rows.find((r) => r.date === MONDAY);
  assert.ok(mon.entries > 0);
  assert.equal(mon.planned, mon.entries, 'nothing eaten yet: every entry is planned');
});

test('Bilal (b): a rail-capped suggestion is worded as a step toward the goal', () => {
  const base = { newKcal: 2110, expectedKgPerWeek: -0.5, differenceKgPerWeek: -0.4 };
  const step = suggestionText({ ...base, kcalPerDay: -100 }, -0.1, RULES);
  assert.match(step, /step toward your goal/i);
  assert.doesNotMatch(step, /to match your goal/i);
  const full = suggestionText({ ...base, kcalPerDay: -440 }, -0.1, RULES);
  assert.match(full, /to match your goal/i);
});

test('Bilal (c) / M-17: timeNote reaches the sheet, the card line and the Cook dialog helpers', () => {
  const tikka = LIBRARY.find((r) => r.foodId === 'pk-chicken-tikka-rice-box');
  assert.match(timeNoteOf(tikka), /night before/);
  const ahead = planAheadOf(tikka);
  assert.equal(ahead.ahead, true);
  assert.match(ahead.text, /^Start the night before/);
  // A "Later, …" sentence gives a second card line (when and what), not its minutes.
  const bolo = planAheadOf({
    timeNote:
      'About 1 h 30 min start to finish (25 min of it hands-on): the sauce simmers. Later, the night before each lunch (boil the penne): 10 min hands-on.',
  });
  assert.equal(bolo.text, 'The sauce simmers.');
  assert.equal(bolo.later, 'Later, the night before each lunch (boil the penne).');
  // No colon part: nothing extra on the card; the sheet still gets the note.
  const plain = { minutes: 30, totalMinutes: 85, timeNote: 'About 1 h 25 min start to finish.' };
  assert.equal(planAheadOf(plain), null);
  assert.equal(timeNoteOf(plain), 'About 1 h 25 min start to finish.');
  // totalMinutes alone still says start to finish; hands-on only says nothing more.
  assert.equal(
    timeNoteOf({ minutes: 45, totalMinutes: 55 }),
    'About 55 min start to finish (45 min of it hands-on).',
  );
  assert.equal(timeNoteOf({ minutes: 10, totalMinutes: 10 }), null);
  // Every Lab timeNote is plain text a card can show.
  for (const r of LIBRARY) if (r.timeNote) assert.equal(typeof timeNoteOf(r), 'string', r.foodId);
});

test('Bilal (e): search leftovers — name before alias, no fuzzy junk after an exact hit', () => {
  const index = buildSearchIndex(FOODS);
  const top = (q) => searchFoods(index, q, { limit: 10 }).hits.map((x) => x.food.id);
  assert.notEqual(top('salad')[0], 'es-ensalada-mixta');
  assert.deepEqual(top('kela'), ['intl-banana']);
  assert.deepEqual(top('pulpo'), ['es-pulpo-cocido']);
  assert.ok(top('karhai').length >= 2, 'a real typo still finds karahi');
});

test('Bilal (f): a tip idea adds in one call with Undo, and an idea eaten there is not offered again', () => {
  const clock = { now: new Date(2026, 9, 19, 9, 0) };
  const s = makeStore(clock, { profile: true });
  s.addFood({ date: MONDAY, slot: 'breakfast', foodId: 'intl-banana' });
  clock.now = new Date(2026, 9, 19, 16, 45);
  const tip = s.proteinTip(MONDAY);
  assert.ok(tip && tip.ideas.length, 'a tip with ideas');
  const idea = tip.ideas[0];
  s.addFood({
    date: MONDAY,
    slot: tip.suggestFor,
    foodId: idea.food.id,
    servingId: idea.servingId,
    qty: idea.qty,
    undo: 'Added it',
  });
  assert.equal(s.getState().undo?.label, 'Added it');
  const again = s.proteinTip(MONDAY);
  if (again) assert.ok(!again.ideas.some((i) => i.food.id === idea.food.id));
});

test('Omar R3-B: a plan’s "move" job is not shown twice next to the app’s own move row', () => {
  const clock = { now: new Date(2026, 9, 18, 17, 0) };
  const s = makeStore(clock);
  s.usePlan({ planId: 'budget-week', monday: MONDAY });
  clock.now = new Date(2026, 9, 21, 21, 0); // Wed night
  const wed = s.prepNotices('2026-10-21');
  assert.ok(!wed.jobs.some((j) => j.kind === 'move'));
  for (const id of ['intl-protein-pancakes-portion', 'intl-chicken-spinach-pasta-bake-portion']) {
    const b = batchOf(s, id);
    const tomorrowFrozen = b?.boxes.some(
      (x) => x.placed?.date === '2026-10-22' && x.storage === 'freezer',
    );
    if (tomorrowFrozen) {
      assert.ok(
        wed.moveTonight.some((m) => m.batchId === b.id),
        `${id}: the app's move row`,
      );
    }
  }
});
