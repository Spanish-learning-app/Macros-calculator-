// Author tests for app/core/days.js (ARCHITECTURE §5.4). Owner: Hamza.
// Inputs are deep-frozen: every function must return new objects and never mutate.
import test from 'node:test';
import assert from 'node:assert/strict';
import { RULES } from '../../fixtures/index.js';
import { buildFoodIndex, nutrientsForPortion, nutrientsForGrams } from '../../../app/core/foods.js';
import { todayISO, minutesOfDay } from '../../../app/core/dates.js';
import {
  SLOT_IDS,
  DEFAULT_SLOT_LABELS,
  emptyDay,
  createEntry,
  createQuickEntry,
  entryNutrients,
  entryGrams,
  addEntry,
  updateEntry,
  removeEntry,
  switchEntryFood,
  setSlotStatus,
  copySlot,
  copyDay,
  dayTotals,
  progress,
  weekSummary,
  averageTotals,
  slotForTime,
} from '../../../app/core/days.js';
import { deepFreeze, frozenFoods, close, closeNutrients } from './helpers.js';

const FOODS = frozenFoods();
const INDEX = buildFoodIndex(FOODS);
const food = (id) => INDEX.get(id);
const ZERO = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
const ENTRY_KEYS = ['id', 'slot', 'foodId', 'servingId', 'qty', 'status', 'snapshot'];
const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

function idMaker(prefix = 'n') {
  let i = 0;
  return () => `${prefix}${(i += 1)}`;
}

function entry(id, foodId, servingId, qty, slot = 'lunch', status = 'eaten') {
  return createEntry({ id, slot, food: food(foodId), servingId, qty, status });
}

/** A frozen day: roti ×2 and daal katori at lunch, chai at breakfast (planned), a quick add. */
function sampleDay() {
  let day = emptyDay('2026-10-13');
  day = addEntry(day, entry('e1', 'pk-roti-home-fx', 'medium', 2, 'lunch'));
  day = addEntry(day, entry('e2', 'pk-daal-masoor-home-fx', 'katori', 1, 'lunch'));
  day = addEntry(day, entry('e3', 'pk-chai-doodh-patti-home-fx', 'cup', 1, 'breakfast', 'planned'));
  day = addEntry(
    day,
    createQuickEntry({
      id: 'e4',
      slot: 'dinner',
      name: 'Shawarma at the office',
      nutrients: { kcal: 550, protein: 30 },
    }),
  );
  return deepFreeze(day);
}

test('constants are binding and agree with RULES', () => {
  assert.ok(Object.isFrozen(SLOT_IDS) && Object.isFrozen(DEFAULT_SLOT_LABELS));
  assert.deepEqual(
    RULES.mealSlots.default.map((s) => s.id),
    [...SLOT_IDS],
  );
  for (const s of RULES.mealSlots.default) assert.equal(DEFAULT_SLOT_LABELS[s.id], s.label);
});

test('emptyDay', () => {
  assert.deepEqual(emptyDay('2026-10-25'), { date: '2026-10-25', entries: [] });
  assert.notEqual(emptyDay('2026-10-25').entries, emptyDay('2026-10-25').entries);
  assert.throws(() => emptyDay('2026-02-30'), RangeError);
  assert.throws(() => emptyDay(20261025), RangeError);
});

test('createEntry builds the §4.3 entry with an unrounded snapshot', () => {
  const e = entry('a', 'pk-daal-masoor-home-fx', 'katori', 1.5, 'lunch');
  assert.deepEqual(Object.keys(e), ENTRY_KEYS);
  assert.equal(e.foodId, 'pk-daal-masoor-home-fx');
  assert.equal(e.servingId, 'katori');
  assert.equal(e.qty, 1.5);
  assert.equal(e.status, 'eaten'); // default
  assert.deepEqual(e.snapshot, {
    name: 'Masoor daal (home)',
    grams: 300,
    ...nutrientsForPortion(food('pk-daal-masoor-home-fx'), 'katori', 1.5),
  });
  const chai = entry('b', 'pk-chai-doodh-patti-home-fx', 'cup', 1, 'evening', 'planned');
  assert.equal(chai.status, 'planned');
  assert.equal(chai.snapshot.kcal, 148.32); // not rounded
  const grams = entry('c', 'pk-rice-plain-fx', 'g', 150, 'dinner');
  assert.equal(grams.snapshot.grams, 150);
  assert.throws(() => entry('d', 'pk-roti-home-fx', 'katori', 1), RangeError);
  assert.throws(() => entry('d', 'pk-roti-home-fx', 'medium', 0), RangeError);
  assert.throws(() => entry('d', 'pk-roti-home-fx', 'medium', -1), RangeError);
  assert.throws(() => entry('d', 'pk-roti-home-fx', 'medium', 1, 'brunch'), RangeError);
  assert.throws(() => entry('d', 'pk-roti-home-fx', 'medium', 1, 'lunch', 'done'), RangeError);
  assert.throws(
    () =>
      createEntry({ slot: 'lunch', food: food('pk-roti-home-fx'), servingId: 'medium', qty: 1 }),
    TypeError,
  );
  assert.throws(
    () => createEntry({ id: 'x', slot: 'lunch', food: null, servingId: 'medium', qty: 1 }),
    TypeError,
  );
});

test('createQuickEntry: no food record, missing macros are 0', () => {
  const q = createQuickEntry({
    id: 'q1',
    slot: 'dinner',
    name: 'Burger out',
    nutrients: deepFreeze({ kcal: 700, protein: 35.5 }),
  });
  assert.deepEqual(q, {
    id: 'q1',
    slot: 'dinner',
    foodId: null,
    servingId: null,
    qty: 1,
    status: 'eaten',
    snapshot: {
      name: 'Burger out',
      grams: null,
      kcal: 700,
      protein: 35.5,
      carbs: 0,
      fat: 0,
      fiber: 0,
    },
  });
  const planned = createQuickEntry({
    id: 'q2',
    slot: 'lunch',
    name: 'x',
    nutrients: { kcal: 1 },
    status: 'planned',
  });
  assert.equal(planned.status, 'planned');
  const quick = (over) => () =>
    createQuickEntry({ id: 'q', slot: 'lunch', name: 'x', nutrients: { kcal: 100 }, ...over });
  assert.throws(quick({ nutrients: { protein: 5 } }), RangeError); // kcal required
  assert.throws(quick({ nutrients: { kcal: -5 } }), RangeError);
  assert.throws(quick({ nutrients: { kcal: 100, fat: NaN } }), RangeError);
  assert.throws(quick({ name: '  ' }), TypeError);
  assert.throws(quick({ slot: 'sehri' }), RangeError);
  assert.throws(quick({ nutrients: null }), TypeError);
});

test('entryNutrients and entryGrams: live values first, then the snapshot', () => {
  const e = entry('a', 'pk-roti-home-fx', 'medium', 2);
  closeNutrients(entryNutrients(e, INDEX), nutrientsForGrams(food('pk-roti-home-fx'), 80));
  assert.equal(entryGrams(e, INDEX), 80);

  // The Lab corrects the roti: past entries follow the live database.
  const fixed = deepFreeze({
    ...food('pk-roti-home-fx'),
    per100g: { ...food('pk-roti-home-fx').per100g, kcal: 300 },
  });
  const newIndex = buildFoodIndex(
    FOODS.filter((f) => f.id !== fixed.id),
    [fixed],
  );
  assert.equal(entryNutrients(e, newIndex).kcal, 240);
  assert.equal(e.snapshot.kcal, 216);

  // A deleted food falls back to the snapshot (five keys only).
  const empty = new Map();
  assert.deepEqual(entryNutrients(e, empty), {
    kcal: e.snapshot.kcal,
    protein: e.snapshot.protein,
    carbs: e.snapshot.carbs,
    fat: e.snapshot.fat,
    fiber: e.snapshot.fiber,
  });
  assert.equal(entryGrams(e, empty), 80);

  // A serving the Lab removed: live per-100 g values at the snapshot's grams.
  const noMedium = deepFreeze({
    ...food('pk-roti-home-fx'),
    servings: food('pk-roti-home-fx').servings.map((s) =>
      s.id === 'medium' ? { ...s, id: 'regular' } : s,
    ),
  });
  const renamed = buildFoodIndex([noMedium]);
  closeNutrients(entryNutrients(e, renamed), nutrientsForGrams(noMedium, 80));
  assert.equal(entryGrams(e, renamed), 80);

  const q = createQuickEntry({ id: 'q', slot: 'dinner', name: 'Out', nutrients: { kcal: 500 } });
  assert.deepEqual(entryNutrients(q, INDEX), { ...ZERO, kcal: 500 });
  assert.equal(entryGrams(q, INDEX), null);
});

test('addEntry appends; duplicate id throws', () => {
  const day = sampleDay();
  const e5 = deepFreeze(entry('e5', 'intl-banana-fx', 'medium', 1, 'snacks'));
  const next = addEntry(day, e5);
  assert.notEqual(next, day);
  assert.equal(next.entries.length, 5);
  assert.equal(next.entries[4], e5);
  assert.equal(day.entries.length, 4);
  assert.throws(
    () => addEntry(day, entry('e2', 'intl-banana-fx', 'medium', 1)),
    /duplicate entry id: e2/,
  );
  assert.throws(() => addEntry(day, null), TypeError);
});

test('updateEntry: qty, servingId, status, slot; snapshot refreshed; unknown fields kept', () => {
  const day = sampleDay();
  const next = updateEntry(day, 'e1', { qty: 3 }, INDEX);
  const e1 = next.entries[0];
  assert.equal(e1.qty, 3);
  assert.equal(e1.snapshot.grams, 120);
  close(e1.snapshot.kcal, 324);
  assert.equal(day.entries[0].qty, 2); // original untouched
  assert.equal(next.entries[1], day.entries[1]); // other entries kept as they are

  const large = updateEntry(day, 'e2', { servingId: 'katori-large' }, INDEX).entries[1];
  assert.equal(large.servingId, 'katori-large');
  assert.equal(large.snapshot.grams, 360);

  const moved = updateEntry(day, 'e3', { status: 'eaten', slot: 'evening' }, INDEX).entries[2];
  assert.equal(moved.status, 'eaten');
  assert.equal(moved.slot, 'evening');

  // Sprint 2 boxRef (and any unknown field) survives.
  const withBox = deepFreeze({
    ...day,
    entries: [
      { ...day.entries[0], boxRef: { batchId: 'b1', boxId: 'x2' } },
      ...day.entries.slice(1),
    ],
  });
  const kept = updateEntry(withBox, 'e1', { qty: 1 }, INDEX).entries[0];
  assert.deepEqual(kept.boxRef, { batchId: 'b1', boxId: 'x2' });

  // Unknown id: an unchanged copy.
  const same = updateEntry(day, 'nope', { qty: 2 }, INDEX);
  assert.notEqual(same, day);
  assert.deepEqual(same, day);

  assert.throws(() => updateEntry(day, 'e1', { qty: 0 }, INDEX), RangeError);
  assert.throws(() => updateEntry(day, 'e1', { qty: -1 }, INDEX), RangeError);
  assert.throws(() => updateEntry(day, 'e1', { servingId: 'plate' }, INDEX), RangeError);
  assert.throws(() => updateEntry(day, 'e1', { status: 'maybe' }, INDEX), RangeError);
  assert.throws(() => updateEntry(day, 'e1', { slot: 'brunch' }, INDEX), RangeError);
  assert.throws(() => updateEntry(day, 'e1', { foodId: 'x' }, INDEX), RangeError);
});

test('updateEntry on a quick add and on a deleted food scales the snapshot', () => {
  const day = sampleDay();
  const q = updateEntry(day, 'e4', { qty: 2 }, INDEX).entries[3];
  assert.equal(q.qty, 2);
  assert.equal(q.snapshot.kcal, 1100);
  assert.equal(q.snapshot.protein, 60);
  assert.equal(q.snapshot.grams, null);
  assert.throws(() => updateEntry(day, 'e4', { servingId: 'cup' }, INDEX), RangeError);

  const orphan = updateEntry(day, 'e1', { qty: 1 }, new Map()).entries[0];
  assert.equal(orphan.snapshot.grams, 40);
  close(orphan.snapshot.kcal, 108);
});

test('removeEntry returns a new day; unknown id gives a copy', () => {
  const day = sampleDay();
  const next = removeEntry(day, 'e2');
  assert.deepEqual(
    next.entries.map((e) => e.id),
    ['e1', 'e3', 'e4'],
  );
  assert.equal(day.entries.length, 4);
  const same = removeEntry(day, 'zzz');
  assert.notEqual(same, day);
  assert.deepEqual(same, day);
});

test('switchEntryFood: keeps the serving and qty when the new food has it (A9)', () => {
  const home = deepFreeze(entry('k', 'pk-chicken-karahi-home-fx', 'katori', 1.5, 'dinner'));
  const rest = switchEntryFood(home, food('pk-chicken-karahi-restaurant-fx'), INDEX);
  assert.equal(rest.foodId, 'pk-chicken-karahi-restaurant-fx');
  assert.equal(rest.servingId, 'katori');
  assert.equal(rest.qty, 1.5);
  assert.equal(rest.id, 'k');
  assert.equal(rest.snapshot.name, 'Chicken karahi (restaurant)');
  assert.equal(rest.snapshot.grams, 300);
  assert.equal(rest.snapshot.kcal, 654);
  assert.ok(rest.snapshot.kcal > home.snapshot.kcal);
  // And back.
  const back = switchEntryFood(rest, food('pk-chicken-karahi-home-fx'), INDEX);
  assert.deepEqual(back, home);
});

test('switchEntryFood: keeps the grams when the new food lacks the serving', () => {
  const roti = deepFreeze(entry('r', 'pk-roti-home-fx', 'medium', 2, 'lunch'));
  const tortilla = switchEntryFood(roti, food('es-tortilla-de-patatas-fx'), INDEX);
  assert.equal(tortilla.servingId, 'g');
  assert.equal(tortilla.qty, 80);
  assert.equal(tortilla.snapshot.grams, 80);
  close(tortilla.snapshot.kcal, 179 * 0.8);
  // A grams entry stays a grams entry.
  const g = deepFreeze(entry('g', 'pk-rice-plain-fx', 'g', 150));
  const daal = switchEntryFood(g, food('pk-daal-masoor-home-fx'), INDEX);
  assert.equal(daal.servingId, 'g');
  assert.equal(daal.qty, 150);
  // Unknown fields (boxRef) are kept; status and slot too.
  const boxed = deepFreeze({
    ...entry('b', 'pk-roti-home-fx', 'medium', 1, 'dinner', 'planned'),
    boxRef: { batchId: 'b', boxId: '1' },
  });
  const sw = switchEntryFood(boxed, food('intl-banana-fx'), INDEX);
  assert.deepEqual(sw.boxRef, { batchId: 'b', boxId: '1' });
  assert.equal(sw.slot, 'dinner');
  assert.equal(sw.status, 'planned');
  assert.equal(sw.servingId, 'medium'); // the banana has a 'medium' serving too
  assert.equal(sw.snapshot.grams, 118);
  const quick = createQuickEntry({ id: 'q', slot: 'lunch', name: 'x', nutrients: { kcal: 1 } });
  assert.throws(() => switchEntryFood(quick, food('intl-banana-fx'), INDEX), RangeError);
});

test('setSlotStatus ticks a whole meal (A12)', () => {
  const day = sampleDay();
  const planned = setSlotStatus(day, 'lunch', 'planned');
  assert.deepEqual(
    planned.entries.map((e) => [e.id, e.status]),
    [
      ['e1', 'planned'],
      ['e2', 'planned'],
      ['e3', 'planned'],
      ['e4', 'eaten'],
    ],
  );
  const eaten = setSlotStatus(planned, 'lunch', 'eaten');
  assert.equal(eaten.entries[0].status, 'eaten');
  assert.equal(eaten.entries[2].status, 'planned'); // breakfast untouched
  assert.equal(day.entries[0].status, 'eaten');
  assert.throws(() => setSlotStatus(day, 'brunch', 'eaten'), RangeError);
  assert.throws(() => setSlotStatus(day, 'lunch', 'done'), RangeError);
});

test('copySlot: fresh ids, requested status, §4.3 fields only', () => {
  const from = deepFreeze({
    ...sampleDay(),
    entries: sampleDay().entries.map((e) =>
      e.id === 'e1' ? { ...e, boxRef: { batchId: 'b', boxId: '1' } } : e,
    ),
  });
  const to = deepFreeze(
    addEntry(emptyDay('2026-10-14'), entry('t1', 'intl-banana-fx', 'medium', 1, 'snacks')),
  );
  const next = copySlot(from, 'lunch', to, 'dinner', idMaker());
  assert.deepEqual(
    next.entries.map((e) => [e.id, e.slot, e.foodId, e.servingId, e.qty, e.status]),
    [
      ['t1', 'snacks', 'intl-banana-fx', 'medium', 1, 'eaten'],
      ['n1', 'dinner', 'pk-roti-home-fx', 'medium', 2, 'planned'],
      ['n2', 'dinner', 'pk-daal-masoor-home-fx', 'katori', 1, 'planned'],
    ],
  );
  for (const e of next.entries.slice(1)) assert.deepEqual(Object.keys(e), ENTRY_KEYS);
  assert.deepEqual(next.entries[1].snapshot, from.entries[0].snapshot);
  assert.notEqual(next.entries[1].snapshot, from.entries[0].snapshot);
  assert.equal(next.date, '2026-10-14');
  const eaten = copySlot(from, 'lunch', to, 'lunch', idMaker(), { status: 'eaten' });
  assert.ok(eaten.entries.slice(1).every((e) => e.status === 'eaten' && e.slot === 'lunch'));
  // Copy a slot into the same day (A12 "copy X's Lunch") works too.
  const self = copySlot(from, 'lunch', from, 'dinner', idMaker('s'));
  assert.equal(self.entries.length, 6);
  // An empty slot copies nothing.
  assert.deepEqual(copySlot(from, 'snacks', to, 'snacks', idMaker()), to);
  assert.throws(() => copySlot(from, 'lunch', to, 'lunch', () => 't1'), /duplicate entry id/);
  assert.throws(() => copySlot(from, 'lunch', to, 'lunch', 'n1'), TypeError);
  assert.throws(() => copySlot(from, 'lunch', to, 'lunch', idMaker(), { status: 'x' }), RangeError);
});

test('copyDay: every entry in the same slots, fresh ids, planned by default (A5 b)', () => {
  const from = sampleDay();
  const to = deepFreeze(emptyDay('2026-10-14'));
  const next = copyDay(from, to, idMaker());
  assert.equal(next.date, '2026-10-14');
  assert.deepEqual(
    next.entries.map((e) => [e.id, e.slot, e.foodId, e.servingId, e.qty, e.status]),
    from.entries.map((e, i) => [`n${i + 1}`, e.slot, e.foodId, e.servingId, e.qty, 'planned']),
  );
  closeNutrients(dayTotals(next, INDEX).total, dayTotals(from, INDEX).total);
  const eaten = copyDay(from, to, idMaker(), { status: 'eaten' });
  assert.ok(eaten.entries.every((e) => e.status === 'eaten'));
  assert.equal(from.entries.length, 4);
});

test('dayTotals: all, eaten and planned; every slot present; unrounded', () => {
  const day = sampleDay();
  const roti = nutrientsForPortion(food('pk-roti-home-fx'), 'medium', 2);
  const daal = nutrientsForPortion(food('pk-daal-masoor-home-fx'), 'katori', 1);
  const chai = nutrientsForPortion(food('pk-chai-doodh-patti-home-fx'), 'cup', 1);
  const quick = { ...ZERO, kcal: 550, protein: 30 };
  const sum = (...list) =>
    Object.fromEntries(Object.keys(ZERO).map((k) => [k, list.reduce((s, n) => s + n[k], 0)]));

  const all = dayTotals(day, INDEX);
  assert.deepEqual(Object.keys(all.bySlot), [...SLOT_IDS]);
  closeNutrients(all.total, sum(roti, daal, chai, quick));
  closeNutrients(all.bySlot.lunch, sum(roti, daal));
  closeNutrients(all.bySlot.breakfast, chai);
  closeNutrients(all.bySlot.dinner, quick);
  assert.deepEqual(all.bySlot.evening, ZERO);
  assert.deepEqual(all.bySlot.snacks, ZERO);
  close(all.total.kcal, 216 + 228 + 148.32 + 550);

  const eaten = dayTotals(day, INDEX, { include: 'eaten' });
  closeNutrients(eaten.total, sum(roti, daal, quick));
  assert.deepEqual(eaten.bySlot.breakfast, ZERO);
  const planned = dayTotals(day, INDEX, { include: 'planned' });
  closeNutrients(planned.total, chai);
  assert.deepEqual(planned.bySlot.lunch, ZERO);

  const none = dayTotals(emptyDay('2026-10-13'), INDEX);
  assert.deepEqual(none.total, ZERO);
  assert.throws(() => dayTotals(day, INDEX, { include: 'some' }), RangeError);
});

test('progress: pct and remaining, null when the target is missing or 0', () => {
  const total = deepFreeze({ kcal: 1620, protein: 100, carbs: 250, fat: 80, fiber: 30 });
  const p = progress(total, deepFreeze({ kcal: 2160, protein: 156, carbs: 0, fiber: null }));
  assert.deepEqual(p.kcal, { value: 1620, target: 2160, pct: 75, remaining: 540 });
  close(p.protein.pct, (100 / 156) * 100);
  assert.equal(p.protein.remaining, 56);
  assert.deepEqual(p.carbs, { value: 250, target: 0, pct: null, remaining: null });
  assert.deepEqual(p.fat, { value: 80, target: null, pct: null, remaining: null });
  assert.deepEqual(p.fiber, { value: 30, target: null, pct: null, remaining: null });
  // Over target: remaining goes negative ("N over").
  assert.equal(progress(total, { kcal: 1500 }).kcal.remaining, -120);
  // No targets at all (minor): every key null.
  const none = progress(total, null);
  assert.deepEqual(Object.keys(none), ['kcal', 'protein', 'carbs', 'fat', 'fiber']);
  assert.ok(Object.values(none).every((r) => r.pct === null && r.remaining === null));
});

test('weekSummary and averageTotals', () => {
  const day = sampleDay();
  const dates = ['2026-10-12', '2026-10-13', '2026-10-14'];
  const byDate = deepFreeze({
    '2026-10-13': day,
    '2026-10-14': copySlot(day, 'lunch', emptyDay('2026-10-14'), 'lunch', idMaker(), {
      status: 'eaten',
    }),
  });
  const targets = { kcal: 2000, protein: 100 };
  const rows = weekSummary(byDate, dates, INDEX, targets);
  assert.deepEqual(
    rows.map((r) => [r.date, r.entries]),
    [
      ['2026-10-12', 0],
      ['2026-10-13', 4],
      ['2026-10-14', 2],
    ],
  );
  assert.deepEqual(rows[0].total, ZERO);
  closeNutrients(rows[1].total, dayTotals(day, INDEX).total);
  close(rows[1].pct.kcal, (rows[1].total.kcal / 2000) * 100);
  assert.equal(rows[1].pct.carbs, null);
  assert.equal(rows[0].pct.kcal, 0);
  const avg = averageTotals(rows);
  close(avg.kcal, (rows[1].total.kcal + rows[2].total.kcal) / 2);
  close(avg.protein, (rows[1].total.protein + rows[2].total.protein) / 2);
  assert.deepEqual(averageTotals([]), ZERO);
  assert.deepEqual(averageTotals([rows[0]]), ZERO);
  const noTargets = weekSummary({}, dates, INDEX, null);
  assert.ok(noTargets.every((r) => r.pct.kcal === null && r.entries === 0));
});

test('slotForTime: default preset windows, wrap and edges', () => {
  const at = (h, m, preset) => slotForTime(h * 60 + m, RULES, preset);
  assert.equal(at(0, 0), 'snacks');
  assert.equal(at(3, 59), 'snacks');
  assert.equal(at(4, 0), 'breakfast');
  assert.equal(at(10, 59), 'breakfast');
  assert.equal(at(11, 0), 'lunch');
  assert.equal(at(15, 30), 'evening');
  assert.equal(at(17, 0), 'evening');
  assert.equal(at(18, 30), 'dinner');
  assert.equal(at(21, 30), 'dinner');
  assert.equal(at(23, 59), 'dinner');
  assert.equal(slotForTime(600, RULES), 'breakfast'); // preset defaults to 'default'
});

test('slotForTime: Spanish preset (meeting 002, amended by meeting 003)', () => {
  const at = (h, m) => slotForTime(h * 60 + m, RULES, 'spain');
  assert.equal(at(0, 30), 'snacks');
  assert.equal(at(0, 59), 'snacks');
  assert.equal(at(1, 0), 'snacks');
  assert.equal(at(1, 30), 'snacks');
  assert.equal(at(4, 59), 'snacks');
  assert.equal(at(5, 0), 'breakfast');
  assert.equal(at(9, 0), 'breakfast');
  assert.equal(at(11, 30), 'breakfast'); // A19: the 11:30 cortado
  assert.equal(at(12, 29), 'breakfast');
  assert.equal(at(12, 30), 'lunch');
  assert.equal(at(12, 45), 'lunch');
  assert.equal(at(17, 0), 'evening');
  assert.equal(at(20, 0), 'dinner');
  assert.equal(at(23, 59), 'dinner');
});

test('slotForTime: every minute of both presets matches exactly one window', () => {
  for (const preset of ['default', 'spain']) {
    for (let m = 0; m < 1440; m += 1) {
      const slot = slotForTime(m, RULES, preset);
      assert.ok(SLOT_IDS.includes(slot));
      const [start, end] = RULES.mealSlots[preset].find((s) => s.id === slot).hours;
      const inside = start < end ? m >= start && m < end : m >= start || m < end;
      assert.ok(inside, `${preset} ${m} -> ${slot}`);
    }
  }
});

test('slotForTime: fallback, unknown preset, bad minutes', () => {
  const gappy = deepFreeze({
    mealSlots: { default: [{ id: 'lunch', hours: [660, 930] }] },
  });
  assert.equal(slotForTime(600, gappy), 'snacks');
  assert.equal(slotForTime(700, gappy), 'lunch');
  assert.throws(() => slotForTime(600, RULES, 'mexico'), RangeError);
  assert.throws(() => slotForTime(600, RULES, 'toString'), RangeError);
  assert.throws(() => slotForTime(-1, RULES), RangeError);
  assert.throws(() => slotForTime(1440, RULES), RangeError);
  assert.throws(() => slotForTime(NaN, RULES), RangeError);
  assert.throws(() => slotForTime(600, null), TypeError);
});

// A20 (team/DECISIONS.md): on Madrid time, both 02:30s of 25 Oct 2026 log to 24 Oct, in Snacks
// on the Spanish preset. The 26th copies the 25th, and nothing moves.
test(
  'A20: the two 02:30s on 25 Oct land on 24 Oct in Snacks (Madrid)',
  { skip: TZ === 'Europe/Madrid' ? false : 'Madrid-only scenario' },
  () => {
    const first = new Date(Date.parse('2026-10-25T00:30:00Z'));
    const second = new Date(Date.parse('2026-10-25T01:30:00Z'));
    let byDate = {};
    [
      ['m', first, 'intl-banana-fx'],
      ['b', second, 'intl-banana-fx'],
    ].forEach(([id, now, foodId]) => {
      const date = todayISO(now, 240);
      const slot = slotForTime(minutesOfDay(now), RULES, 'spain');
      const day = byDate[date] ?? emptyDay(date);
      byDate = { ...byDate, [date]: addEntry(day, entry(id, foodId, 'medium', 1, slot)) };
    });
    assert.deepEqual(Object.keys(byDate), ['2026-10-24']);
    assert.deepEqual(
      byDate['2026-10-24'].entries.map((e) => e.slot),
      ['snacks', 'snacks'],
    );
    // 12:00 CET on the 25th opens the 25th; at 09:00 on the 26th, copy "yesterday".
    assert.equal(todayISO(new Date(Date.parse('2026-10-25T11:00:00Z')), 240), '2026-10-25');
    const today = todayISO(new Date(Date.parse('2026-10-26T08:00:00Z')), 240);
    assert.equal(today, '2026-10-26');
    const copied = copyDay(byDate['2026-10-24'], emptyDay(today), idMaker(), { status: 'eaten' });
    assert.equal(copied.entries.length, 2);
    closeNutrients(dayTotals(copied, INDEX).total, dayTotals(byDate['2026-10-24'], INDEX).total);
  },
);

test('slotForTime with minutesOfDay over the DST weeks always returns a slot', () => {
  for (const [from, to] of [
    ['2026-03-28T22:00Z', '2026-03-29T04:00Z'],
    ['2026-10-24T22:00Z', '2026-10-25T04:00Z'],
    ['2026-11-01T06:00Z', '2026-11-01T12:00Z'],
  ]) {
    for (let t = Date.parse(from); t <= Date.parse(to); t += 10 * 60 * 1000) {
      const m = minutesOfDay(new Date(t));
      for (const preset of ['default', 'spain']) {
        assert.ok(SLOT_IDS.includes(slotForTime(m, RULES, preset)));
      }
    }
  }
});
