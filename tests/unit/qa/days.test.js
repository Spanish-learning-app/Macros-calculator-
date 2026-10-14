// QA tests for app/core/days.js, written from docs/ARCHITECTURE.md §4.3 and §5.4 and the
// acceptance tests A5, A6, A7, A12 and A13 in docs/CUSTOMER.md (not from the code).
// Day tests use their own food index (a plain Map), so they do not depend on foods.js.
// Owner: Kenji.
import assert from 'node:assert/strict';
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
import {
  qa,
  RULES,
  fx,
  frozen,
  deepFreeze,
  indexOf,
  expectedFor,
  assertClose,
  assertNutrients,
  assertThrowsKind,
  assertBadInput,
  idMaker,
  ZERO,
  NUTRIENT_KEYS,
} from './_helpers.js';

const ROTI = fx('pk-roti-home-fx'); // medium 40 g, 270 kcal/100 g
const CHAI = fx('pk-chai-doodh-patti-home-fx'); // cup 206 g, 72 kcal/100 g
const DAAL = fx('pk-daal-masoor-home-fx'); // katori 200 g, 114 kcal/100 g
const KARAHI_HOME = fx('pk-chicken-karahi-home-fx'); // katori 200 g, 159
const KARAHI_REST = fx('pk-chicken-karahi-restaurant-fx'); // katori 200 g, 218
const EGG = fx('intl-egg-boiled-fx'); // egg 50 g
const BANANA = fx('intl-banana-fx'); // medium 118 g
const TORTILLA = fx('es-tortilla-de-patatas-fx'); // portion 150 g, no katori
const INDEX = indexOf();

const ENTRY_FIELDS = ['foodId', 'id', 'qty', 'servingId', 'slot', 'snapshot', 'status'];

/** An entry built by hand from the §4.3 shape (independent of createEntry). */
function entry(id, slot, food, servingId, qty, status = 'eaten', extra = {}) {
  const serving = servingId === 'g' ? { grams: 1 } : food.servings.find((s) => s.id === servingId);
  const grams = serving.grams * qty;
  return {
    id,
    slot,
    foodId: food.id,
    servingId,
    qty,
    status,
    snapshot: { name: food.name, grams, ...expectedFor(food, grams) },
    ...extra,
  };
}

function quick(id, slot, name, nutrients, status = 'eaten') {
  return {
    id,
    slot,
    foodId: null,
    servingId: null,
    qty: 1,
    status,
    snapshot: { name, grams: null, ...ZERO, ...nutrients },
  };
}

/** D1-like day: 6 entries over 4 slots, one planned. */
function sampleDay(date = '2026-10-13') {
  return deepFreeze({
    date,
    entries: [
      entry('e1', 'breakfast', EGG, 'egg', 3),
      entry('e2', 'breakfast', ROTI, 'medium', 1),
      entry('e3', 'breakfast', CHAI, 'cup', 1),
      entry('e4', 'lunch', DAAL, 'katori', 1),
      entry('e5', 'lunch', ROTI, 'medium', 2),
      entry('e6', 'dinner', KARAHI_HOME, 'katori', 1.5, 'planned'),
    ],
  });
}

const sumOf = (list) =>
  Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, list.reduce((s, n) => s + n[k], 0)]));

// ------------------------------------------------------------------ constants
qa('SLOT_IDS and DEFAULT_SLOT_LABELS equal RULES.mealSlots.default', [], () => {
  assert.deepEqual(
    [...SLOT_IDS],
    RULES.mealSlots.default.map((s) => s.id),
  );
  for (const s of RULES.mealSlots.default) assert.equal(DEFAULT_SLOT_LABELS[s.id], s.label);
  assert.deepEqual(RULES.mealSlots.spain.map((s) => s.id).sort(), [...SLOT_IDS].sort());
});

qa('emptyDay(date) is { date, entries: [] }', [emptyDay], () => {
  assert.deepEqual(emptyDay('2026-10-25'), { date: '2026-10-25', entries: [] });
  const a = emptyDay('2026-10-25');
  const b = emptyDay('2026-10-25');
  assert.notEqual(a.entries, b.entries, 'a fresh array each time');
});

// ------------------------------------------------------------------ createEntry / createQuickEntry
qa('createEntry builds the §4.3 entry with an unrounded snapshot', [createEntry], () => {
  const e = createEntry(
    deepFreeze({ id: 'x1', slot: 'lunch', food: DAAL, servingId: 'katori', qty: 1.5 }),
  );
  assert.deepEqual(Object.keys(e).sort(), ENTRY_FIELDS);
  assert.equal(e.id, 'x1');
  assert.equal(e.slot, 'lunch');
  assert.equal(e.foodId, DAAL.id);
  assert.equal(e.servingId, 'katori');
  assert.equal(e.qty, 1.5);
  assert.equal(e.status, 'eaten', 'default status');
  assert.equal(e.snapshot.name, DAAL.name);
  assert.equal(e.snapshot.grams, 300);
  const { name, grams, ...nutrients } = e.snapshot;
  assert.ok(name && grams);
  assertNutrients(nutrients, expectedFor(DAAL, 300));
  assertClose(e.snapshot.kcal, 342);
});

qa("createEntry: status 'planned', grams servings and fractions", [createEntry], () => {
  const planned = createEntry({
    id: 'p',
    slot: 'dinner',
    food: ROTI,
    servingId: 'medium',
    qty: 2,
    status: 'planned',
  });
  assert.equal(planned.status, 'planned');
  const grams = createEntry({ id: 'g', slot: 'snacks', food: BANANA, servingId: 'g', qty: 150 });
  assert.equal(grams.snapshot.grams, 150);
  assertClose(grams.snapshot.kcal, 133.5);
  const third = createEntry({ id: 't', slot: 'lunch', food: DAAL, servingId: 'katori', qty: 0.33 });
  assertClose(third.snapshot.grams, 66);
});

qa('createEntry refuses bad input', [createEntry], () => {
  const ok = { id: 'x', slot: 'lunch', food: DAAL, servingId: 'katori', qty: 1 };
  for (const qty of [0, -1, NaN, Infinity]) {
    assertThrowsKind(() => createEntry({ ...ok, qty }), RangeError, `qty ${qty}`);
  }
  assertThrowsKind(() => createEntry({ ...ok, servingId: 'plate' }), RangeError, 'serving');
  assertThrowsKind(() => createEntry({ ...ok, slot: 'brunch' }), RangeError, 'slot');
  assertThrowsKind(() => createEntry({ ...ok, slot: 'sehri' }), RangeError, 'Ramadan slot (S3)');
  assertThrowsKind(() => createEntry({ ...ok, status: 'done' }), RangeError, 'status');
  assertBadInput(() => createEntry({ ...ok, food: null }), 'no food');
});

qa('createQuickEntry: no food, qty 1, missing macros become 0', [createQuickEntry], () => {
  const e = createQuickEntry(
    deepFreeze({ id: 'q1', slot: 'dinner', name: 'Wedding dinner', nutrients: { kcal: 900 } }),
  );
  assert.deepEqual(Object.keys(e).sort(), ENTRY_FIELDS);
  assert.equal(e.foodId, null);
  assert.equal(e.servingId, null);
  assert.equal(e.qty, 1);
  assert.equal(e.status, 'eaten');
  assert.deepEqual(e.snapshot, {
    name: 'Wedding dinner',
    grams: null,
    kcal: 900,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  });
  const p = createQuickEntry({
    id: 'q2',
    slot: 'lunch',
    name: 'Menu del dia',
    nutrients: { kcal: 750, protein: 35, fat: 30 },
    status: 'planned',
  });
  assert.equal(p.status, 'planned');
  assert.equal(p.snapshot.protein, 35);
  assert.equal(p.snapshot.carbs, 0);
});

// ------------------------------------------------------------------ live values vs snapshot
qa(
  'entryNutrients and entryGrams use the live food first (Lab corrections reach past days)',
  [entryNutrients, entryGrams],
  () => {
    const e = deepFreeze(entry('e', 'lunch', DAAL, 'katori', 1));
    assertNutrients(entryNutrients(e, INDEX), expectedFor(DAAL, 200));
    assert.equal(entryGrams(e, INDEX), 200);
    const corrected = structuredClone(DAAL);
    corrected.per100g = { kcal: 130, protein: 7, carbs: 15, fat: 4, fiber: 3.5 };
    corrected.servings.find((s) => s.id === 'katori').grams = 210;
    const index = indexOf([corrected, ROTI]);
    assertNutrients(entryNutrients(e, index), expectedFor(corrected, 210), 1e-9, 'corrected');
    assert.equal(entryGrams(e, index), 210);
  },
);

qa(
  'entryNutrients and entryGrams fall back to the snapshot for a deleted food or a quick add',
  [entryNutrients, entryGrams],
  () => {
    const e = deepFreeze(entry('e', 'lunch', DAAL, 'katori', 1.5));
    const without = indexOf([ROTI]);
    assertNutrients(entryNutrients(e, without), expectedFor(DAAL, 300), 1e-9, 'deleted food');
    assert.equal(entryGrams(e, without), 300);
    const q = deepFreeze(quick('q', 'dinner', 'Shaadi', { kcal: 1200, protein: 40 }));
    assertNutrients(entryNutrients(q, INDEX), { ...ZERO, kcal: 1200, protein: 40 });
    assert.equal(entryGrams(q, INDEX), null);
  },
);

qa("entryNutrients: a 'g' entry is qty grams", [entryNutrients, entryGrams], () => {
  const e = deepFreeze(entry('e', 'dinner', KARAHI_HOME, 'g', 250));
  assertNutrients(entryNutrients(e, INDEX), expectedFor(KARAHI_HOME, 250));
  assert.equal(entryGrams(e, INDEX), 250);
});

// ------------------------------------------------------------------ add / update / remove
qa('addEntry appends a copy of the day; duplicate ids throw', [addEntry], () => {
  const day = sampleDay();
  const e = deepFreeze(entry('e7', 'snacks', BANANA, 'medium', 1));
  const next = addEntry(day, e);
  assert.equal(next.entries.length, 7);
  assert.deepEqual(next.entries.at(-1), e);
  assert.deepEqual(next.entries.slice(0, 6), sampleDay().entries, 'existing order kept');
  assert.equal(day.entries.length, 6, 'input unchanged');
  assert.throws(() => addEntry(day, deepFreeze(entry('e3', 'snacks', BANANA, 'medium', 1))));
  assert.deepEqual(addEntry(emptyDayOf('2026-10-14'), e).entries, [e]);
});

function emptyDayOf(date) {
  return deepFreeze({ date, entries: [] });
}

qa('updateEntry: qty refreshes the snapshot; other entries untouched', [updateEntry], () => {
  const day = sampleDay();
  const next = updateEntry(day, 'e4', deepFreeze({ qty: 2 }), INDEX);
  const e4 = next.entries.find((e) => e.id === 'e4');
  assert.equal(e4.qty, 2);
  assert.equal(e4.snapshot.grams, 400);
  assertClose(e4.snapshot.kcal, 456);
  assert.deepEqual(
    next.entries.map((e) => e.id),
    ['e1', 'e2', 'e3', 'e4', 'e5', 'e6'],
  );
  for (const id of ['e1', 'e2', 'e3', 'e5', 'e6']) {
    assert.deepEqual(
      next.entries.find((e) => e.id === id),
      day.entries.find((e) => e.id === id),
    );
  }
  assert.equal(day.entries[3].qty, 1, 'input unchanged');
});

qa('updateEntry: servingId, status and slot', [updateEntry], () => {
  const day = sampleDay();
  const big = updateEntry(day, 'e4', { servingId: 'katori-large' }, INDEX).entries.find(
    (e) => e.id === 'e4',
  );
  assert.equal(big.servingId, 'katori-large');
  assert.equal(big.snapshot.grams, 360);
  assertClose(big.snapshot.kcal, 410.4);
  const both = updateEntry(day, 'e5', { servingId: 'large', qty: 3 }, INDEX).entries.find(
    (e) => e.id === 'e5',
  );
  assert.equal(both.snapshot.grams, 156);
  const ticked = updateEntry(day, 'e6', { status: 'eaten' }, INDEX).entries.find(
    (e) => e.id === 'e6',
  );
  assert.equal(ticked.status, 'eaten');
  const moved = updateEntry(day, 'e3', { slot: 'evening' }, INDEX).entries.find(
    (e) => e.id === 'e3',
  );
  assert.equal(moved.slot, 'evening');
  assert.equal(moved.qty, 1);
});

qa(
  'A13 step 3: roti 2 → 3 → 2 gives back the same entry and totals',
  [updateEntry, dayTotals],
  () => {
    const day = sampleDay();
    const three = updateEntry(day, 'e5', { qty: 3 }, INDEX);
    const back = updateEntry(three, 'e5', { qty: 2 }, INDEX);
    assert.ok(dayTotals(three, INDEX).total.kcal > dayTotals(day, INDEX).total.kcal);
    assertNutrients(dayTotals(back, INDEX).total, dayTotals(day, INDEX).total, 1e-9);
    assert.deepEqual(
      back.entries.find((e) => e.id === 'e5'),
      day.entries.find((e) => e.id === 'e5'),
    );
  },
);

qa('updateEntry keeps unknown entry fields (Sprint 2 boxRef)', [updateEntry], () => {
  const boxRef = { batchId: 'b1', boxId: 'x2' };
  const day = deepFreeze({
    date: '2026-10-26',
    entries: [entry('b', 'lunch', DAAL, 'katori', 1, 'planned', { boxRef })],
  });
  const next = updateEntry(day, 'b', { status: 'eaten', qty: 1.5 }, INDEX);
  assert.deepEqual(next.entries[0].boxRef, boxRef);
});

qa('updateEntry: an unknown id gives an unchanged copy; bad patches throw', [updateEntry], () => {
  const day = sampleDay();
  assert.deepEqual(updateEntry(day, 'nope', { qty: 5 }, INDEX), day);
  assertThrowsKind(() => updateEntry(day, 'e4', { qty: 0 }, INDEX), RangeError, 'qty 0');
  assertThrowsKind(() => updateEntry(day, 'e4', { qty: -1 }, INDEX), RangeError, 'qty -1');
  assertThrowsKind(() => updateEntry(day, 'e4', { status: 'done' }, INDEX), RangeError, 'status');
  assertThrowsKind(() => updateEntry(day, 'e4', { slot: 'brunch' }, INDEX), RangeError, 'slot');
  assertThrowsKind(
    () => updateEntry(day, 'e4', { servingId: 'plate' }, INDEX),
    RangeError,
    'serving',
  );
});

qa('removeEntry returns a new day without the entry; undo keeps the old Day', [removeEntry], () => {
  const day = sampleDay();
  const next = removeEntry(day, 'e3');
  assert.deepEqual(
    next.entries.map((e) => e.id),
    ['e1', 'e2', 'e4', 'e5', 'e6'],
  );
  assert.equal(next.date, day.date);
  assert.equal(day.entries.length, 6, 'the old Day is intact (undo)');
  assert.deepEqual(removeEntry(day, 'nope'), day);
});

// ------------------------------------------------------------------ variant switch (A9)
qa(
  'switchEntryFood: home → restaurant keeps the katori portion and refreshes the snapshot',
  [switchEntryFood],
  () => {
    const home = deepFreeze(
      entry('k', 'dinner', KARAHI_HOME, 'katori', 1.5, 'planned', { note: 1 }),
    );
    const rest = switchEntryFood(home, KARAHI_REST, INDEX);
    assert.equal(rest.id, 'k');
    assert.equal(rest.slot, 'dinner');
    assert.equal(rest.status, 'planned');
    assert.equal(rest.foodId, KARAHI_REST.id);
    assert.equal(rest.servingId, 'katori');
    assert.equal(rest.qty, 1.5);
    assert.equal(rest.snapshot.name, KARAHI_REST.name);
    assert.equal(rest.snapshot.grams, 300);
    assertClose(rest.snapshot.kcal, 654);
    assert.ok(rest.snapshot.kcal > home.snapshot.kcal, 'restaurant kcal is higher (A9)');
    assert.equal(rest.note, 1, 'unknown fields kept');
    assert.equal(home.foodId, KARAHI_HOME.id, 'input unchanged');
  },
);

qa(
  "switchEntryFood: no such serving on the new food → keep the grams ('g')",
  [switchEntryFood],
  () => {
    const e = deepFreeze(entry('k', 'dinner', KARAHI_HOME, 'katori', 1.5));
    const t = switchEntryFood(e, TORTILLA, INDEX);
    assert.equal(t.foodId, TORTILLA.id);
    assert.equal(t.servingId, 'g');
    assert.equal(t.qty, 300);
    assert.equal(t.snapshot.grams, 300);
    assertClose(t.snapshot.kcal, 537);
  },
);

// ------------------------------------------------------------------ slots, copies
qa('setSlotStatus ticks a whole meal (A12) and nothing else', [setSlotStatus], () => {
  const day = deepFreeze({
    date: '2026-10-14',
    entries: [
      entry('a', 'breakfast', ROTI, 'medium', 1, 'planned'),
      entry('b', 'breakfast', EGG, 'egg', 2, 'planned'),
      entry('c', 'lunch', DAAL, 'katori', 1, 'planned'),
    ],
  });
  const next = setSlotStatus(day, 'breakfast', 'eaten');
  assert.deepEqual(
    next.entries.map((e) => e.status),
    ['eaten', 'eaten', 'planned'],
  );
  assert.deepEqual(
    next.entries.map((e) => e.id),
    ['a', 'b', 'c'],
  );
  assert.deepEqual(setSlotStatus(next, 'breakfast', 'planned').entries, day.entries);
  assertThrowsKind(() => setSlotStatus(day, 'breakfast', 'done'), RangeError, 'status');
  assertThrowsKind(() => setSlotStatus(day, 'brunch', 'eaten'), RangeError, 'slot');
});

qa('copySlot appends planned copies with fresh ids into another slot and day', [copySlot], () => {
  const from = sampleDay('2026-10-13');
  const to = deepFreeze({
    date: '2026-10-14',
    entries: [entry('t1', 'breakfast', ROTI, 'medium', 1, 'planned')],
  });
  const makeId = idMaker('c');
  const next = copySlot(from, 'lunch', to, 'dinner', makeId);
  assert.equal(next.date, '2026-10-14');
  assert.equal(next.entries.length, 3);
  assert.deepEqual(next.entries[0], to.entries[0], 'existing entries first, unchanged');
  const copies = next.entries.slice(1);
  assert.deepEqual(
    copies.map((e) => e.id),
    ['c-1', 'c-2'],
  );
  assert.equal(makeId.count(), 2, 'one id per copy');
  const lunch = from.entries.filter((e) => e.slot === 'lunch');
  copies.forEach((c, i) => {
    assert.equal(c.slot, 'dinner');
    assert.equal(c.status, 'planned', 'default status of copies');
    assert.equal(c.foodId, lunch[i].foodId);
    assert.equal(c.servingId, lunch[i].servingId);
    assert.equal(c.qty, lunch[i].qty);
    assert.deepEqual(c.snapshot, lunch[i].snapshot);
  });
  assert.equal(from.entries.length, 6, 'source unchanged');
});

qa("copySlot: { status: 'eaten' }, same day, and no boxRef on copies", [copySlot], () => {
  const day = deepFreeze({
    date: '2026-10-13',
    entries: [
      entry('a', 'lunch', DAAL, 'katori', 1, 'eaten', { boxRef: { batchId: 'b', boxId: '1' } }),
    ],
  });
  const next = copySlot(day, 'lunch', day, 'dinner', idMaker('n'), { status: 'eaten' });
  assert.equal(next.entries.length, 2);
  const copy = next.entries[1];
  assert.equal(copy.slot, 'dinner');
  assert.equal(copy.status, 'eaten');
  assert.ok(!('boxRef' in copy), 'a box cannot be in two places');
  assert.deepEqual(Object.keys(copy).sort(), ENTRY_FIELDS, 'only the §4.3 fields');
  assert.deepEqual(next.entries[0], day.entries[0]);
  assert.deepEqual(copySlot(day, 'snacks', day, 'dinner', idMaker()).entries, day.entries);
});

qa(
  'copyDay (A5 b): same foods, servings, quantities and slots; same totals; source unchanged',
  [copyDay, dayTotals],
  () => {
    const from = sampleDay('2026-10-13');
    const to = emptyDayOf('2026-10-14');
    const next = copyDay(from, to, idMaker('d'));
    assert.equal(next.date, '2026-10-14');
    assert.equal(next.entries.length, from.entries.length);
    const shape = (e) => [e.slot, e.foodId, e.servingId, e.qty];
    assert.deepEqual(next.entries.map(shape), from.entries.map(shape));
    assert.ok(
      next.entries.every((e) => e.status === 'planned'),
      'default planned',
    );
    const ids = new Set(next.entries.map((e) => e.id));
    assert.equal(ids.size, next.entries.length, 'fresh unique ids');
    for (const e of from.entries) assert.ok(!ids.has(e.id), 'no id reused');
    assertNutrients(
      dayTotals(next, INDEX).total,
      dayTotals(from, INDEX).total,
      1e-9,
      'same totals (all)',
    );
    assert.deepEqual(from, sampleDay('2026-10-13'), 'X is unchanged');
    const eaten = copyDay(from, to, idMaker('e'), { status: 'eaten' });
    assert.ok(eaten.entries.every((e) => e.status === 'eaten'));
  },
);

qa('copyDay appends after existing entries and copies quick adds too', [copyDay], () => {
  const from = deepFreeze({
    date: '2026-10-25',
    entries: [
      quick('q', 'dinner', 'Shaadi', { kcal: 1200 }),
      entry('m', 'snacks', BANANA, 'medium', 1),
    ],
  });
  const to = deepFreeze({ date: '2026-10-26', entries: [entry('x', 'breakfast', CHAI, 'cup', 1)] });
  const next = copyDay(from, to, idMaker('z'));
  assert.deepEqual(
    next.entries.map((e) => e.id),
    ['x', 'z-1', 'z-2'],
  );
  assert.equal(next.entries[1].foodId, null);
  assert.equal(next.entries[1].snapshot.kcal, 1200);
});

// ------------------------------------------------------------------ totals and progress
qa('dayTotals: total and bySlot (every slot present), unrounded, live values', [dayTotals], () => {
  const day = sampleDay();
  const { total, bySlot } = dayTotals(day, INDEX);
  assert.deepEqual(Object.keys(bySlot).sort(), [...SLOT_IDS].sort());
  const per = (e) => expectedFor(INDEX.get(e.foodId), e.snapshot.grams);
  for (const slot of SLOT_IDS) {
    const list = day.entries.filter((e) => e.slot === slot).map(per);
    assertNutrients(bySlot[slot], list.length ? sumOf(list) : ZERO, 1e-9, slot);
  }
  assertNutrients(total, sumOf(day.entries.map(per)), 1e-9, 'total');
  assertNutrients(total, sumOf(Object.values(bySlot)), 1e-9, 'total = Σ bySlot');
  assertNutrients(dayTotals(emptyDayOf('2026-10-13'), INDEX).total, ZERO);
});

qa(
  "dayTotals include: 'eaten' (left, A12), 'planned' (separate figure), 'all' (default)",
  [dayTotals],
  () => {
    const day = sampleDay();
    const all = dayTotals(day, INDEX).total;
    const eaten = dayTotals(day, INDEX, { include: 'eaten' }).total;
    const planned = dayTotals(day, INDEX, { include: 'planned' }).total;
    assertNutrients(planned, expectedFor(KARAHI_HOME, 300), 1e-9, 'planned = the dinner karahi');
    for (const k of NUTRIENT_KEYS) assertClose(eaten[k] + planned[k], all[k], 1e-9, k);
    assertNutrients(dayTotals(day, INDEX, { include: 'all' }).total, all);
    assertNutrients(dayTotals(day, INDEX, { include: 'eaten' }).bySlot.dinner, ZERO);
    assertThrowsKind(() => dayTotals(day, INDEX, { include: 'some' }), RangeError, 'include');
  },
);

qa('dayTotals mixes live foods, deleted foods (snapshot) and quick adds', [dayTotals], () => {
  const day = deepFreeze({
    date: '2026-10-13',
    entries: [
      entry('a', 'lunch', DAAL, 'katori', 1),
      entry('b', 'lunch', TORTILLA, 'portion', 1),
      quick('c', 'dinner', 'Wedding', { kcal: 1000, protein: 30 }),
    ],
  });
  const index = indexOf([DAAL]);
  const { total } = dayTotals(day, index);
  assertNutrients(
    total,
    sumOf([
      expectedFor(DAAL, 200),
      expectedFor(TORTILLA, 150),
      { ...ZERO, kcal: 1000, protein: 30 },
    ]),
  );
});

qa('A6: four one-cup chais add exactly 4 × one cup', [dayTotals], () => {
  const day = deepFreeze({
    date: '2026-10-14',
    entries: [1, 2, 3, 4].map((i) => entry(`c${i}`, 'evening', CHAI, 'cup', 1)),
  });
  assertNutrients(dayTotals(day, INDEX).total, expectedFor(CHAI, 4 * 206));
  assertClose(dayTotals(day, INDEX).total.kcal, 593.28);
});

qa(
  'progress: value, target, pct and remaining per key; null when the target is missing or 0',
  [progress],
  () => {
    const total = deepFreeze({ kcal: 1650, protein: 100, carbs: 180, fat: 60, fiber: 0 });
    const p = progress(
      total,
      deepFreeze({ kcal: 2210, protein: 161, carbs: 225, fat: 74, fiber: 0 }),
    );
    assert.deepEqual(Object.keys(p).sort(), [...NUTRIENT_KEYS].sort());
    assert.equal(p.kcal.value, 1650);
    assert.equal(p.kcal.target, 2210);
    assertClose(p.kcal.pct, (1650 / 2210) * 100);
    assert.equal(p.kcal.remaining, 560);
    assert.equal(p.protein.remaining, 61);
    assert.equal(p.fiber.pct, null, 'target 0 → pct null');
    assert.equal(p.fiber.remaining, null, 'target 0 → remaining null');
    const partial = progress(total, { kcal: 2000 });
    assert.equal(partial.protein.pct, null);
    assert.equal(partial.protein.remaining, null);
    assert.equal(partial.protein.target ?? null, null);
    assert.equal(partial.protein.value, 100);
  },
);

qa('progress: over target reads as a negative remaining (A7 "N over")', [progress], () => {
  const p = progress(
    { kcal: 2500, protein: 170, carbs: 0, fat: 0, fiber: 0 },
    { kcal: 2160, protein: 156 },
  );
  assert.equal(p.kcal.remaining, -340);
  assert.equal(p.protein.remaining, -14);
  assertClose(p.kcal.pct, (2500 / 2160) * 100);
});

// ------------------------------------------------------------------ week
qa('weekSummary: one row per date in order, missing days are zeros', [weekSummary], () => {
  const d13 = deepFreeze({ date: '2026-10-13', entries: [entry('a', 'lunch', DAAL, 'katori', 1)] });
  const d15 = deepFreeze({
    date: '2026-10-15',
    entries: [entry('b', 'lunch', ROTI, 'medium', 2), entry('c', 'evening', CHAI, 'cup', 1)],
  });
  const dates = ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15'];
  const targets = deepFreeze({ kcal: 2000, protein: 100, carbs: 250, fat: 70, fiber: 0 });
  const rows = weekSummary(
    deepFreeze({ '2026-10-13': d13, '2026-10-15': d15 }),
    deepFreeze(dates),
    INDEX,
    targets,
  );
  assert.deepEqual(
    rows.map((r) => r.date),
    dates,
  );
  assert.deepEqual(
    rows.map((r) => r.entries),
    [0, 1, 0, 2],
  );
  assertNutrients(rows[0].total, ZERO);
  assertNutrients(rows[1].total, expectedFor(DAAL, 200));
  assertNutrients(rows[3].total, sumOf([expectedFor(ROTI, 80), expectedFor(CHAI, 206)]));
  assertClose(rows[1].pct.kcal, (228 / 2000) * 100);
  assert.equal(rows[1].pct.fiber, null, 'target 0 → null');
  const none = weekSummary({}, ['2026-10-19'], INDEX, null);
  assert.equal(none.length, 1);
  assert.equal(none[0].pct.kcal, null, 'no targets → null pct');
});

qa('averageTotals: mean over rows with entries > 0; none → zeros', [averageTotals], () => {
  const rows = deepFreeze([
    { date: 'a', total: { kcal: 2000, protein: 100, carbs: 200, fat: 70, fiber: 20 }, entries: 5 },
    { date: 'b', total: { ...ZERO }, entries: 0 },
    { date: 'c', total: { kcal: 3000, protein: 150, carbs: 300, fat: 100, fiber: 30 }, entries: 2 },
  ]);
  assertNutrients(averageTotals(rows), {
    kcal: 2500,
    protein: 125,
    carbs: 250,
    fat: 85,
    fiber: 25,
  });
  assertNutrients(averageTotals([]), ZERO);
  assertNutrients(averageTotals([{ date: 'x', total: { ...ZERO }, entries: 0 }]), ZERO);
});

// ------------------------------------------------------------------ default slot from the clock
qa("slotForTime, Pakistani preset ('default'): window edges", [slotForTime], () => {
  const cases = [
    [0, 'snacks'],
    [239, 'snacks'],
    [240, 'breakfast'],
    [480, 'breakfast'],
    [659, 'breakfast'],
    [660, 'lunch'],
    [810, 'lunch'],
    [929, 'lunch'],
    [930, 'evening'],
    [1020, 'evening'],
    [1109, 'evening'],
    [1110, 'dinner'],
    [1260, 'dinner'],
    [1439, 'dinner'],
  ];
  for (const [m, slot] of cases) {
    assert.equal(slotForTime(m, RULES), slot, `${m} default arg`);
    assert.equal(slotForTime(m, RULES, 'default'), slot, `${m}`);
  }
});

qa(
  'slotForTime, Spanish preset: 11:30 cortado is breakfast, dinner wraps past midnight (A19, A20)',
  [slotForTime],
  () => {
    const cases = [
      [300, 'breakfast'],
      [540, 'breakfast'],
      [690, 'breakfast'],
      [749, 'breakfast'],
      [750, 'lunch'],
      [825, 'lunch'],
      [989, 'lunch'],
      [990, 'evening'],
      [1050, 'evening'],
      [1199, 'evening'],
      [1200, 'dinner'],
      [1290, 'dinner'],
      [1439, 'dinner'],
      // Meeting 003: 00:00-05:00 is Snacks on the Spanish preset.
      [0, 'snacks'],
      [30, 'snacks'],
      [59, 'snacks'],
      [60, 'snacks'],
      [150, 'snacks'],
      [299, 'snacks'],
    ];
    for (const [m, slot] of cases) assert.equal(slotForTime(m, RULES, 'spain'), slot, `${m}`);
  },
);

qa(
  'slotForTime reads RULES hours, falls back to snacks, and refuses an unknown preset',
  [slotForTime],
  () => {
    const rules = structuredClone(RULES);
    rules.mealSlots.default = [{ id: 'lunch', label: 'Lunch', sharePct: 100, hours: [600, 700] }];
    const r = deepFreeze(rules);
    assert.equal(slotForTime(650, r), 'lunch');
    assert.equal(slotForTime(700, r), 'snacks', 'no window → snacks');
    assert.equal(slotForTime(100, r), 'snacks');
    assertThrowsKind(() => slotForTime(600, RULES, 'ramadan-ish'), RangeError, 'preset');
  },
);

qa(
  'day functions never mutate deep-frozen inputs (property over random edits)',
  [addEntry, updateEntry, removeEntry, copySlot, copyDay, setSlotStatus],
  () => {
    let day = frozen(sampleDay());
    const snapshotOf = structuredClone(day);
    const ops = [
      (d) => addEntry(d, frozen(entry(`n${Math.random()}`, 'snacks', BANANA, 'medium', 1))),
      (d) => updateEntry(d, d.entries[0]?.id ?? 'none', { qty: 2 }, INDEX),
      (d) => removeEntry(d, d.entries.at(-1)?.id ?? 'none'),
      (d) => copySlot(d, 'breakfast', d, 'snacks', idMaker(`s${d.entries.length}`)),
      (d) => setSlotStatus(d, 'dinner', 'eaten'),
    ];
    for (let i = 0; i < 25; i++) {
      const before = structuredClone(day);
      const next = ops[i % ops.length](day);
      assert.deepEqual(day, before, `op ${i % ops.length} mutated its input`);
      day = deepFreeze(next);
    }
    assert.deepEqual(sampleDay(), snapshotOf);
    const d2 = copyDay(sampleDay(), emptyDayOf('2026-10-14'), idMaker('w'));
    assert.equal(d2.entries.length, 6);
  },
);
