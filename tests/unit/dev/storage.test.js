// Author tests for app/core/storage.js (ARCHITECTURE §4.5 and §5.7). Owner: Hamza.
// Every persistence test uses an injected in-memory backend.
import test from 'node:test';
import assert from 'node:assert/strict';
import { RULES } from '../../fixtures/index.js';
import {
  STORAGE_KEY,
  SCHEMA_VERSION,
  EXPORT_KIND,
  defaultData,
  createPersistence,
  migrate,
  validateUserData,
  serializeExport,
  parseImport,
  mergeImport,
} from '../../../app/core/storage.js';
import { buildFoodIndex } from '../../../app/core/foods.js';
import { emptyDay, addEntry, createEntry, createQuickEntry } from '../../../app/core/days.js';
import { recordUse } from '../../../app/core/search.js';
import { deepFreeze, frozenFoods } from './helpers.js';

const INDEX = buildFoodIndex(frozenFoods());

function memoryBackend(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    store,
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => void store.set(k, String(v)),
    removeItem: (k) => void store.delete(k),
  };
}

const throwingBackend = {
  getItem() {
    throw new Error('SecurityError: storage disabled');
  },
  setItem() {
    throw new Error('SecurityError: storage disabled');
  },
  removeItem() {
    throw new Error('SecurityError: storage disabled');
  },
};

function entry(id, foodId, servingId, qty, slot = 'lunch', status = 'eaten') {
  return createEntry({ id, slot, food: INDEX.get(foodId), servingId, qty, status });
}

/** A realistic document: profile, two days, recents. */
function sampleData() {
  const data = defaultData({ timeZone: 'Europe/Madrid', rules: RULES });
  let d1 = emptyDay('2026-10-12');
  d1 = addEntry(d1, entry('a1', 'pk-roti-home-fx', 'medium', 2));
  d1 = addEntry(d1, entry('a2', 'pk-daal-masoor-home-fx', 'katori', 1.5));
  let d2 = emptyDay('2026-10-13');
  d2 = addEntry(d2, entry('b1', 'pk-chai-doodh-patti-home-fx', 'cup', 1, 'breakfast', 'planned'));
  d2 = addEntry(
    d2,
    createQuickEntry({ id: 'b2', slot: 'dinner', name: 'Shawarma', nutrients: { kcal: 550 } }),
  );
  let recents = recordUse({}, {
    foodId: 'pk-roti-home-fx',
    servingId: 'medium',
    qty: 2,
    slot: 'lunch',
    date: '2026-10-12',
  });
  recents = recordUse(recents, {
    foodId: 'pk-chai-doodh-patti-home-fx',
    servingId: 'cup',
    qty: 1,
    slot: 'breakfast',
    date: '2026-10-13',
  });
  return deepFreeze({
    ...data,
    profile: {
      sex: 'male',
      ageYears: 30,
      heightCm: 175,
      weightKg: 80,
      activity: 'moderate',
      goal: 'lose',
      rateKgPerWeek: 0.5,
      lifts: true,
      healthFlags: [],
    },
    settings: { ...data.settings, onboarding: 'done' },
    targetOverrides: { kcal: 2100 },
    days: { '2026-10-12': d1, '2026-10-13': d2 },
    recents,
  });
}

test('constants', () => {
  assert.equal(STORAGE_KEY, 'mmc.v1');
  assert.equal(SCHEMA_VERSION, 1);
  assert.equal(EXPORT_KIND, 'katori-backup');
});

test('defaultData: a fresh, valid document', () => {
  const d = defaultData();
  assert.deepEqual(validateUserData(d), []);
  assert.equal(d.schemaVersion, 1);
  assert.equal(d.profile, null);
  assert.deepEqual(d.days, {});
  assert.deepEqual(d.customFoods, []);
  assert.deepEqual(d.recents, {});
  assert.deepEqual(d.recipes, []);
  assert.deepEqual(d.batches, []);
  assert.deepEqual(d.targetOverrides, {});
  assert.deepEqual(d.settings.slotLabels, {});
  assert.equal(d.settings.dayStartMinutes, 240);
  assert.equal(d.settings.onboarding, 'pending');
  assert.equal(d.settings.slotPreset, 'default');
  assert.equal(d.settings.halalOnly, true);
  assert.equal(d.settings.seafood, 'all');
  assert.equal(d.settings.weekStartsOn, 1);
  assert.deepEqual(d.settings.units, { weight: 'kg', height: 'cm' });
  assert.equal(d.settings.theme, 'system');
  assert.equal(d.settings.hideCalories, false);
  // Fresh objects every time.
  assert.notEqual(defaultData().settings, defaultData().settings);
});

test('defaultData: slot preset from the time zone, halal and seafood from RULES', () => {
  const rules = deepFreeze(structuredClone(RULES));
  for (const timeZone of ['Europe/Madrid', 'Africa/Ceuta', 'Atlantic/Canary']) {
    assert.equal(defaultData({ timeZone, rules }).settings.slotPreset, 'spain', timeZone);
  }
  for (const timeZone of ['Asia/Karachi', 'America/Los_Angeles', 'Europe/London', null, 'toString']) {
    assert.equal(defaultData({ timeZone, rules }).settings.slotPreset, 'default', String(timeZone));
  }
  assert.equal(defaultData({ timeZone: 'Europe/Madrid' }).settings.slotPreset, 'default'); // no rules
  const d = defaultData({ timeZone: 'Asia/Karachi', rules });
  assert.equal(d.settings.halalOnly, RULES.vocab.halalRules.halalOnlyFilterDefault);
  assert.equal(d.settings.seafood, RULES.vocab.halalRules.seafoodDefault);
  const flipped = structuredClone(RULES);
  flipped.vocab.halalRules.halalOnlyFilterDefault = false;
  flipped.vocab.halalRules.seafoodDefault = 'fish-only';
  flipped.mealSlotPresetDefault.fallback = 'spain';
  const f = defaultData({ timeZone: 'Asia/Karachi', rules: flipped });
  assert.deepEqual([f.settings.halalOnly, f.settings.seafood, f.settings.slotPreset], [
    false,
    'fish-only',
    'spain',
  ]);
});

test('validateUserData: settings ranges, including dayStartMinutes 0..300 and onboarding', () => {
  const base = defaultData();
  const withSettings = (patch) => ({ ...base, settings: { ...base.settings, ...patch } });
  for (const m of [0, 60, 240, 300]) assert.deepEqual(validateUserData(withSettings({ dayStartMinutes: m })), []);
  for (const m of [-1, 301, 30.5, '240', null]) {
    const p = validateUserData(withSettings({ dayStartMinutes: m }));
    assert.equal(p.length, 1, String(m));
    assert.match(p[0], /dayStartMinutes/);
  }
  for (const s of ['pending', 'done', 'skipped']) assert.deepEqual(validateUserData(withSettings({ onboarding: s })), []);
  assert.match(validateUserData(withSettings({ onboarding: 'maybe' }))[0], /onboarding/);
  const bad = [
    [{ slotPreset: 'mexico' }, /slotPreset/],
    [{ slotLabels: { lunch: 7 } }, /slotLabels/],
    [{ slotLabels: { brunch: 'x' } }, /slotLabels/],
    [{ halalOnly: 'yes' }, /halalOnly/],
    [{ seafood: 'none' }, /seafood/],
    [{ units: { weight: 'stone', height: 'cm' } }, /units/],
    [{ weekStartsOn: 3 }, /weekStartsOn/],
    [{ theme: 'blue' }, /theme/],
    [{ hideCalories: 1 }, /hideCalories/],
  ];
  for (const [patch, pattern] of bad) {
    const p = validateUserData(withSettings(patch));
    assert.equal(p.length, 1, JSON.stringify(patch));
    assert.match(p[0], pattern);
  }
});

test('validateUserData: document shape', () => {
  assert.deepEqual(validateUserData(sampleData()), []);
  for (const junk of [null, 42, 'x', []]) assert.ok(validateUserData(junk).length > 0);
  const d = sampleData();
  const cases = [
    [{ schemaVersion: 2 }, /schemaVersion/],
    [{ profile: 'me' }, /profile/],
    [{ days: [] }, /days/],
    [{ days: { '2026-02-30': emptyDay('2026-02-28') } }, /2026-02-30/],
    [{ days: { '2026-10-12': { ...d.days['2026-10-12'], date: '2026-10-13' } } }, /date/],
    [{ days: { '2026-10-12': { date: '2026-10-12', entries: [{ ...d.days['2026-10-12'].entries[0], qty: 0 }] } } }, /qty/],
    [{ days: { '2026-10-12': { date: '2026-10-12', entries: [{ ...d.days['2026-10-12'].entries[0], slot: 'brunch' }] } } }, /slot/],
    [{ days: { '2026-10-12': { date: '2026-10-12', entries: [d.days['2026-10-12'].entries[0], d.days['2026-10-12'].entries[0]] } } }, /duplicate/],
    [{ days: { '2026-10-12': { date: '2026-10-12', entries: [{ ...d.days['2026-10-12'].entries[0], snapshot: { name: 'x' } }] } } }, /snapshot/],
    [{ customFoods: {} }, /customFoods/],
    [{ customFoods: [{ id: 'my-x' }] }, /customFoods/],
    [{ recents: { x: { count: 'many' } } }, /recents/],
    [{ recipes: null }, /recipes/],
    [{ batches: {} }, /batches/],
    [{ targetOverrides: { kcal: -5 } }, /targetOverrides/],
    [{ targetPrefs: { fatPct: 'x' } }, /targetPrefs/],
  ];
  for (const [patch, pattern] of cases) {
    const p = validateUserData({ ...d, ...patch });
    assert.ok(p.length >= 1, JSON.stringify(patch));
    assert.ok(p.some((m) => pattern.test(m)), `${JSON.stringify(patch)} -> ${p}`);
  }
});

test('migrate: fills defaults, keeps data, never mutates, throws coded errors', () => {
  const old = deepFreeze({
    schemaVersion: 1,
    profile: sampleData().profile,
    days: sampleData().days,
    settings: { theme: 'dark' },
  });
  const m = migrate(old);
  assert.deepEqual(validateUserData(m), []);
  assert.equal(m.settings.theme, 'dark');
  assert.equal(m.settings.dayStartMinutes, 240);
  assert.equal(m.settings.onboarding, 'done'); // missing + profile -> 'done' (§7.3)
  assert.deepEqual(m.recipes, []);
  assert.deepEqual(m.batches, []);
  assert.deepEqual(m.days, old.days);
  assert.equal(migrate({ schemaVersion: 1 }).settings.onboarding, 'pending'); // no profile
  assert.deepEqual(migrate(sampleData()), sampleData());
  const code = (fn) => {
    try {
      fn();
    } catch (e) {
      return e.code;
    }
    return 'no throw';
  };
  assert.equal(code(() => migrate({ schemaVersion: 2 })), 'FUTURE_VERSION');
  assert.equal(code(() => migrate({ schemaVersion: 0 })), 'INVALID');
  assert.equal(code(() => migrate({})), 'INVALID');
  assert.equal(code(() => migrate(null)), 'INVALID');
  assert.equal(code(() => migrate([])), 'INVALID');
  assert.equal(code(() => migrate({ schemaVersion: 1, days: 'x' })), 'INVALID');
});

test('createPersistence: empty, then save and load round-trip', () => {
  const backend = memoryBackend();
  const p = createPersistence(backend);
  const empty = p.load();
  assert.equal(empty.status, 'empty');
  assert.deepEqual(validateUserData(empty.data), []);
  assert.deepEqual(p.save(sampleData()), { ok: true });
  assert.ok(backend.store.has(STORAGE_KEY));
  const again = createPersistence(backend).load();
  assert.equal(again.status, 'ok');
  assert.deepEqual(again.data, sampleData());
});

test('createPersistence: null backend and a backend that throws are "unavailable"', () => {
  for (const backend of [null, undefined, throwingBackend, {}]) {
    const p = createPersistence(backend);
    const r = p.load();
    assert.equal(r.status, 'unavailable');
    assert.deepEqual(validateUserData(r.data), []);
    const s = p.save(sampleData());
    assert.equal(s.ok, false);
    assert.equal(s.error, 'unavailable');
  }
});

test('createPersistence: corrupt JSON keeps the raw text under mmc.v1.corrupt.<stamp>', () => {
  for (const raw of ['{"schemaVersion": 1, "days": ', 'not json', '[]', '{"schemaVersion":1,"days":"x"}']) {
    const backend = memoryBackend({ [STORAGE_KEY]: raw });
    const p = createPersistence(backend, { stamp: () => '2026-10-13T22:30' });
    const r = p.load();
    assert.equal(r.status, 'corrupt', raw);
    assert.equal(typeof r.error, 'string');
    assert.deepEqual(validateUserData(r.data), []);
    assert.equal(backend.store.get('mmc.v1.corrupt.2026-10-13T22:30'), raw);
    // Saving afterwards is allowed; the copy stays.
    assert.deepEqual(p.save(sampleData()), { ok: true });
    assert.equal(backend.store.get('mmc.v1.corrupt.2026-10-13T22:30'), raw);
  }
  // A stamp that throws, and a backend whose setItem fails, still never throw.
  const broken = { ...memoryBackend({ [STORAGE_KEY]: 'x' }), setItem() {
    throw new Error('nope');
  } };
  const r = createPersistence(broken, {
    stamp() {
      throw new Error('clock');
    },
  }).load();
  assert.equal(r.status, 'corrupt');
  // Default stamp.
  const plain = memoryBackend({ [STORAGE_KEY]: 'x' });
  createPersistence(plain).load();
  assert.ok(plain.store.has('mmc.v1.corrupt.unknown'));
});

test('createPersistence: a future schemaVersion loads defaults and refuses to save', () => {
  const future = JSON.stringify({ ...sampleData(), schemaVersion: 2 });
  const backend = memoryBackend({ [STORAGE_KEY]: future });
  const p = createPersistence(backend);
  const r = p.load();
  assert.equal(r.status, 'future');
  assert.deepEqual(validateUserData(r.data), []);
  assert.deepEqual(p.save(sampleData()), { ok: false, error: 'future' });
  assert.equal(backend.store.get(STORAGE_KEY), future); // untouched
});

test('createPersistence: quota exceeded', () => {
  const backend = memoryBackend();
  backend.setItem = () => {
    throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
  };
  const p = createPersistence(backend);
  assert.equal(p.load().status, 'empty');
  assert.deepEqual(p.save(sampleData()), { ok: false, error: 'quota' });
  // Firefox's legacy name is recognised too.
  backend.setItem = () => {
    throw Object.assign(new Error('full'), { name: 'NS_ERROR_DOM_QUOTA_REACHED' });
  };
  assert.deepEqual(p.save(sampleData()), { ok: false, error: 'quota' });
});

test('serializeExport -> parseImport round-trips to a deep-equal document', () => {
  const data = sampleData();
  const text = serializeExport(data, '2026-10-13T22:30');
  const env = JSON.parse(text);
  assert.deepEqual(Object.keys(env), ['kind', 'schemaVersion', 'exportedAt', 'data']);
  assert.equal(env.kind, EXPORT_KIND);
  assert.equal(env.schemaVersion, SCHEMA_VERSION);
  assert.equal(env.exportedAt, '2026-10-13T22:30');
  const r = parseImport(text);
  assert.equal(r.ok, true);
  assert.deepEqual(r.data, data);
  assert.deepEqual(r.summary, {
    days: 2,
    entries: 4,
    customFoods: 0,
    firstDate: '2026-10-12',
    lastDate: '2026-10-13',
  });
  // A bare UserData document is accepted too.
  const bare = parseImport(JSON.stringify(data));
  assert.equal(bare.ok, true);
  assert.deepEqual(bare.data, data);
  // Empty document.
  const fresh = parseImport(serializeExport(defaultData(), 'x'));
  assert.deepEqual(fresh.summary, { days: 0, entries: 0, customFoods: 0, firstDate: null, lastDate: null });
});

test('parseImport returns every error code', () => {
  const err = (text) => parseImport(text);
  assert.deepEqual(err(''), { ok: false, error: 'EMPTY' });
  assert.deepEqual(err('   \n'), { ok: false, error: 'EMPTY' });
  assert.deepEqual(err(null), { ok: false, error: 'EMPTY' });
  assert.deepEqual(err('{oops'), { ok: false, error: 'NOT_JSON' });
  assert.deepEqual(err('hello'), { ok: false, error: 'NOT_JSON' });
  assert.deepEqual(err('{"a":1}'), { ok: false, error: 'NOT_KATORI' });
  assert.deepEqual(err('[1,2]'), { ok: false, error: 'NOT_KATORI' });
  assert.deepEqual(err('42'), { ok: false, error: 'NOT_KATORI' });
  assert.deepEqual(err('{"kind":"other-app","data":{}}'), { ok: false, error: 'NOT_KATORI' });
  const future = serializeExport({ ...sampleData(), schemaVersion: 2 }, 'x');
  assert.deepEqual(err(future), { ok: false, error: 'FUTURE_VERSION' });
  const futureEnvelope = JSON.stringify({ kind: EXPORT_KIND, schemaVersion: 2, exportedAt: 'x', data: {} });
  assert.deepEqual(err(futureEnvelope), { ok: false, error: 'FUTURE_VERSION' });
  const invalid = serializeExport({ ...sampleData(), days: 'lots' }, 'x');
  assert.deepEqual(err(invalid), { ok: false, error: 'INVALID' });
  assert.deepEqual(err(JSON.stringify({ kind: EXPORT_KIND, schemaVersion: 1, data: null })), {
    ok: false,
    error: 'INVALID',
  });
});

test('mergeImport: replace takes the incoming document', () => {
  const current = sampleData();
  const incoming = deepFreeze(defaultData());
  assert.deepEqual(mergeImport(current, incoming, 'replace'), incoming);
  assert.throws(() => mergeImport(current, incoming, 'append'), RangeError);
});

test('mergeImport: merge unions days and entries (incoming wins), keeps current settings', () => {
  const current = sampleData();
  const changedB1 = { ...current.days['2026-10-13'].entries[0], qty: 2, status: 'eaten' };
  const incoming = deepFreeze({
    ...defaultData(),
    profile: { ...current.profile, weightKg: 70 },
    settings: { ...defaultData().settings, theme: 'light' },
    days: {
      '2026-10-13': {
        date: '2026-10-13',
        entries: [changedB1, entry('c1', 'intl-banana-fx', 'medium', 1, 'snacks')],
      },
      '2026-10-14': { date: '2026-10-14', entries: [entry('d1', 'intl-egg-boiled-fx', 'egg', 2, 'breakfast')] },
    },
    customFoods: [{ id: 'my-x', name: 'X' }],
    recents: {
      'pk-roti-home-fx': { servingId: 'large', qty: 1, count: 1, lastUsed: '2026-10-14', slots: { dinner: 1 } },
      'intl-banana-fx': { servingId: 'medium', qty: 1, count: 3, lastUsed: '2026-10-10', slots: { snacks: 3 } },
    },
  });
  const m = mergeImport(current, incoming, 'merge');
  assert.deepEqual(Object.keys(m.days).sort(), ['2026-10-12', '2026-10-13', '2026-10-14']);
  assert.deepEqual(m.days['2026-10-12'], current.days['2026-10-12']);
  assert.deepEqual(
    m.days['2026-10-13'].entries.map((e) => [e.id, e.qty, e.status]),
    [
      ['b1', 2, 'eaten'], // incoming wins on the same id, in place
      ['b2', 1, 'eaten'],
      ['c1', 1, 'eaten'],
    ],
  );
  assert.deepEqual(m.profile, current.profile); // current has a profile: kept
  assert.equal(m.settings.theme, current.settings.theme);
  assert.deepEqual(m.targetOverrides, current.targetOverrides);
  assert.deepEqual(m.customFoods, [{ id: 'my-x', name: 'X' }]);
  const roti = m.recents['pk-roti-home-fx'];
  assert.equal(roti.count, 1); // max(1, 1)
  assert.equal(roti.lastUsed, '2026-10-14'); // later
  assert.equal(m.recents['intl-banana-fx'].count, 3);
  assert.equal(m.recents['pk-chai-doodh-patti-home-fx'].count, 1);
  assert.equal(m.schemaVersion, 1);
  // Inputs untouched (they are frozen; a mutation would have thrown).
  assert.equal(current.days['2026-10-13'].entries[0].qty, 1);
});

test('mergeImport: an empty current profile takes the incoming profile and settings', () => {
  const current = deepFreeze(defaultData({ timeZone: 'Europe/Madrid', rules: RULES }));
  const incoming = sampleData();
  const m = mergeImport(current, incoming, 'merge');
  assert.deepEqual(m.profile, incoming.profile);
  assert.deepEqual(m.settings, incoming.settings);
  assert.deepEqual(m.targetOverrides, incoming.targetOverrides);
  assert.deepEqual(m.days, incoming.days);
  // Recents: larger count and later lastUsed.
  const a = deepFreeze({ ...current, recents: { x: { servingId: 'a', qty: 1, count: 9, lastUsed: '2026-10-01', slots: { lunch: 9 } } } });
  const b = deepFreeze({ ...current, recents: { x: { servingId: 'b', qty: 2, count: 2, lastUsed: '2026-10-05', slots: { dinner: 2 } } } });
  const r = mergeImport(a, b, 'merge').recents.x;
  assert.equal(r.count, 9);
  assert.equal(r.lastUsed, '2026-10-05');
  assert.deepEqual(validateUserData(mergeImport(a, b, 'merge')), []);
});
