// Author's own tests for app/ui/store.js (owner: Lena; Kenji tests the store independently).
// Each test reports TODO while a core function it needs is still a stub ("not implemented"), so
// `npm run check` stays green; the tests go live as Hamza lands each module.
import test from 'node:test';
import assert from 'node:assert/strict';
import { RULES, FOODS } from '../../fixtures/index.js';
import { createStore } from '../../../app/ui/store.js';
import { createPersistence } from '../../../app/core/storage.js';

function live(name, fn) {
  test(name, async (t) => {
    try {
      await fn(t);
    } catch (error) {
      if (/not implemented/.test(String(error?.message))) {
        t.todo(`waiting for core: ${error.message}`);
        return;
      }
      throw error;
    }
  });
}

function memoryBackend({ throwing = false } = {}) {
  const map = new Map();
  const guard = () => {
    if (throwing) throw new Error('SecurityError: storage disabled');
  };
  return {
    map,
    getItem: (k) => (guard(), map.has(k) ? map.get(k) : null),
    setItem: (k, v) => (guard(), map.set(k, String(v))),
    removeItem: (k) => (guard(), map.delete(k)),
  };
}

function fakeTimers() {
  const t = { pending: null };
  t.set = (fn) => ((t.pending = fn), 1);
  t.clear = () => (t.pending = null);
  t.fire = () => {
    const fn = t.pending;
    t.pending = null;
    if (fn) fn();
  };
  return t;
}

// Wednesday 14 Oct 2026, 13:00 local time in whichever TZ the suite runs (Madrid, Karachi, LA).
const NOON = () => new Date(2026, 9, 14, 13, 0);
const P1 = {
  sex: 'male',
  ageYears: 31,
  heightCm: 178,
  weightKg: 82,
  activity: 'moderate',
  goal: 'lose',
  rateKgPerWeek: 0.5,
  lifts: true,
  healthFlags: [],
};

function makeStore({ backend = memoryBackend(), now = NOON, timers = fakeTimers() } = {}) {
  let n = 0;
  const store = createStore({
    persistence: backend ? createPersistence(backend, { stamp: () => 'test' }) : null,
    rules: RULES,
    foods: FOODS,
    now,
    makeId: () => `e${++n}`,
    timeZone: 'Europe/Madrid',
    timers,
  });
  return { store, backend, timers };
}

live(
  'a fresh store: empty storage, Spanish preset on Madrid time, halal only, onboarding pending',
  () => {
    const { store } = makeStore();
    assert.equal(store.getState().storageStatus, 'empty');
    assert.equal(store.settings().slotPreset, 'spain');
    assert.equal(store.settings().halalOnly, true);
    assert.equal(store.needsOnboarding(), true);
    assert.equal(store.today(), '2026-10-14');
    assert.deepEqual(
      store.slots().map((s) => s.id),
      ['breakfast', 'lunch', 'evening', 'dinner', 'snacks'],
    );
  },
);

live(
  'skip gives reference targets (NUTRITION.md §2.1a); a full profile gives personal ones',
  () => {
    const { store } = makeStore();
    store.skipOnboarding();
    assert.equal(store.needsOnboarding(), false);
    assert.equal(store.targetKind(), 'reference');
    assert.deepEqual(store.targets(), RULES.skipDefaults.targets);
    assert.equal(store.targetInfo().chip, RULES.skipDefaults.chip);
    store.setProfile({ sex: 'female', ageYears: 30 }); // still incomplete
    assert.equal(store.targetKind(), 'reference');
    store.completeOnboarding(P1);
    assert.equal(store.targetKind(), 'personal');
    assert.equal(store.targetInfo().chip, 'Estimate');
    assert.equal(typeof store.targets().kcal, 'number');
  },
);

live(
  '"+" adds the default portion, then the last-used one; today is eaten, a future day planned',
  () => {
    const { store } = makeStore();
    store.completeOnboarding(P1);
    const today = store.today();
    const id1 = store.addFood({ date: today, slot: 'lunch', foodId: 'pk-daal-masoor-home-fx' });
    let entry = store.day(today).entries.find((e) => e.id === id1);
    assert.equal(entry.servingId, 'katori');
    assert.equal(entry.qty, 1);
    assert.equal(entry.status, 'eaten');
    store.addFood({
      date: today,
      slot: 'dinner',
      foodId: 'pk-daal-masoor-home-fx',
      servingId: 'katori-large',
      qty: 1.5,
    });
    const id3 = store.addFood({
      date: '2026-10-15',
      slot: 'lunch',
      foodId: 'pk-daal-masoor-home-fx',
    });
    entry = store.day('2026-10-15').entries.find((e) => e.id === id3);
    assert.equal(entry.servingId, 'katori-large');
    assert.equal(entry.qty, 1.5);
    assert.equal(entry.status, 'planned');
  },
);

live('"left" counts eaten food only; planned is a separate figure (A7, A12)', () => {
  const { store } = makeStore();
  store.completeOnboarding(P1);
  const today = store.today();
  const eatenId = store.addFood({ date: today, slot: 'lunch', foodId: 'pk-rice-plain-fx' });
  store.addFood({ date: today, slot: 'dinner', foodId: 'pk-roti-home-fx', status: 'planned' });
  const totals = store.totals(today);
  const eatenKcal = totals.eaten.total.kcal;
  assert.ok(eatenKcal > 0);
  assert.ok(totals.planned.total.kcal > 0);
  assert.ok(Math.abs(totals.all.total.kcal - eatenKcal - totals.planned.total.kcal) < 1e-9);
  const left = store.left(today);
  assert.ok(Math.abs(left.kcal.remaining - (store.targets().kcal - eatenKcal)) < 1e-9);
  store.setEntryStatus(today, eatenId, 'planned');
  assert.equal(store.totals(today).eaten.total.kcal, 0);
});

live('delete, then undo restores the entry; any later change closes the undo window (A13)', () => {
  const { store } = makeStore();
  const today = store.today();
  const id = store.addFood({ date: today, slot: 'lunch', foodId: 'pk-roti-home-fx' });
  const before = store.day(today);
  store.removeEntry(today, id);
  assert.equal(store.day(today).entries.length, 0);
  assert.match(store.getState().undo.label, /Roti/);
  assert.equal(store.undo(), true);
  assert.deepEqual(store.day(today), before);
  store.removeEntry(today, id);
  store.addFood({ date: today, slot: 'lunch', foodId: 'intl-banana-fx' });
  assert.equal(store.getState().undo, null);
  assert.equal(store.undo(), false);
});

live('copy a day: planned into the future, one undo removes the whole copy (A5 b)', () => {
  const { store } = makeStore();
  const today = store.today();
  store.addFood({ date: today, slot: 'breakfast', foodId: 'pk-chai-doodh-patti-home-fx' });
  store.addFood({ date: today, slot: 'lunch', foodId: 'pk-chicken-tikka-rice-box-fx' });
  store.copyDay({ fromDate: today, toDate: '2026-10-15' });
  const copied = store.day('2026-10-15').entries;
  assert.equal(copied.length, 2);
  assert.ok(copied.every((e) => e.status === 'planned'));
  assert.equal(store.day(today).entries.length, 2);
  store.undo();
  assert.equal(store.day('2026-10-15').entries.length, 0);
});

live('move an entry to another day, and undo it', () => {
  const { store } = makeStore();
  const today = store.today();
  const id = store.addFood({ date: today, slot: 'dinner', foodId: 'pk-roti-home-fx' });
  store.moveEntry(today, id, '2026-10-13');
  assert.equal(store.day(today).entries.length, 0);
  assert.equal(store.day('2026-10-13').entries[0].id, id);
  store.undo();
  assert.equal(store.day(today).entries[0].id, id);
  assert.equal(store.loggedDates().includes('2026-10-13'), false);
});

live('home → restaurant karahi keeps the katori portion and raises kcal (A9)', () => {
  const { store } = makeStore();
  const today = store.today();
  const id = store.addFood({
    date: today,
    slot: 'dinner',
    foodId: 'pk-chicken-karahi-home-fx',
    servingId: 'katori',
    qty: 1.5,
  });
  const before = store.totals(today).all.total.kcal;
  assert.deepEqual(
    store.variants('pk-chicken-karahi-home-fx').map((f) => f.style),
    ['home', 'restaurant'],
  );
  store.switchVariant(today, id, 'pk-chicken-karahi-restaurant-fx');
  const entry = store.day(today).entries[0];
  assert.equal(entry.foodId, 'pk-chicken-karahi-restaurant-fx');
  assert.equal(entry.servingId, 'katori');
  assert.equal(entry.qty, 1.5);
  assert.ok(store.totals(today).all.total.kcal > before);
});

live('halal only hides not-halal matches and reports them; recents never suggest them', () => {
  const { store } = makeStore();
  const result = store.search('ensaimada');
  assert.equal(result.hits.length, 0);
  assert.equal(result.hidden[0].food.id, 'es-ensaimada-fx');
  store.updateSettings({ halalOnly: false });
  assert.equal(store.search('ensaimada').hits[0].food.id, 'es-ensaimada-fx');
  store.addFood({ date: store.today(), slot: 'breakfast', foodId: 'es-ensaimada-fx' });
  store.addFood({ date: store.today(), slot: 'breakfast', foodId: 'es-cafe-con-leche-fx' });
  assert.deepEqual(
    store.recents('breakfast').map((r) => r.food.id),
    ['es-cafe-con-leche-fx'],
  );
});

live('saves are debounced, flush() saves at once, and a reload sees the same data', () => {
  const { store, backend, timers } = makeStore();
  store.addFood({ date: store.today(), slot: 'lunch', foodId: 'pk-roti-home-fx' });
  assert.equal(backend.map.size, 0, 'nothing saved before the debounce fires');
  timers.fire();
  assert.equal(backend.map.size, 1);
  assert.equal(store.getState().storageStatus, 'ok');
  store.addFood({ date: store.today(), slot: 'lunch', foodId: 'intl-banana-fx' });
  store.flush();
  const reloaded = makeStore({ backend }).store;
  assert.equal(reloaded.getState().storageStatus, 'ok');
  assert.deepEqual(reloaded.getState().data, store.getState().data);
});

live('storage that throws: the app keeps working in memory and reports it (A13 step 5)', () => {
  const { store } = makeStore({ backend: memoryBackend({ throwing: true }) });
  assert.equal(store.getState().storageStatus, 'unavailable');
  store.addFood({ date: store.today(), slot: 'lunch', foodId: 'pk-roti-home-fx' });
  store.flush();
  assert.equal(store.day(store.today()).entries.length, 1);
  assert.equal(store.getState().storageStatus, 'unavailable');
});

live(
  'export, then import into a fresh store with Replace, gives the same days (A13 step 6)',
  () => {
    const a = makeStore().store;
    a.completeOnboarding(P1);
    a.addFood({ date: a.today(), slot: 'lunch', foodId: 'pk-rice-plain-fx' });
    a.addFood({ date: a.today(), slot: 'dinner', foodId: 'pk-roti-home-fx', qty: 2 });
    const text = a.exportText();
    const b = makeStore().store;
    assert.equal(b.previewImport(text).ok, true);
    const result = b.importText(text, 'replace');
    assert.equal(result.ok, true);
    assert.deepEqual(b.getState().data.days, a.getState().data.days);
    assert.deepEqual(b.totals(b.today()), a.totals(a.today()));
    assert.equal(b.importText('not json').ok, false);
  },
);

live(
  'the logging day starts at 04:00: 00:30 belongs to the previous date (team/DECISIONS.md)',
  () => {
    const lateNight = () => new Date(2026, 9, 15, 0, 30); // 00:30 local on 15 Oct
    const { store } = makeStore({ now: lateNight });
    assert.equal(store.today(), '2026-10-14');
    store.updateSettings({ dayStartMinutes: 0 });
    assert.equal(store.today(), '2026-10-15');
  },
);

live('slot labels: the preset label unless the user renamed the slot', () => {
  const { store } = makeStore();
  const spainBreakfast = RULES.mealSlots.spain.find((s) => s.id === 'breakfast').label;
  assert.equal(store.slotLabel('breakfast'), spainBreakfast);
  store.updateSettings({ slotLabels: { breakfast: 'Desayuno' } });
  assert.equal(store.slotLabel('breakfast'), 'Desayuno');
});

live('subscribers hear every change; unsubscribe stops them', () => {
  const { store } = makeStore();
  let calls = 0;
  const off = store.subscribe(() => calls++);
  store.updateSettings({ theme: 'dark' });
  off();
  store.updateSettings({ theme: 'light' });
  assert.equal(calls, 1);
});
