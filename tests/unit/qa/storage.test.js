// QA tests for app/core/storage.js, written from docs/ARCHITECTURE.md §4.5, §5.7 and §7.3
// (onboarding state) and A13 (storage that throws, export → import). Owner: Kenji.
import assert from 'node:assert/strict';
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
import { qa, RULES, FOODS, deepFreeze, frozen, assertThrowsKind } from './_helpers.js';

// ------------------------------------------------------------------ helpers
/** A localStorage-like backend over a Map, with switches to make it fail. */
function memoryBackend(initial = {}, { failGet, failSet, quota } = {}) {
  const store = new Map(Object.entries(initial));
  const calls = [];
  return {
    store,
    calls,
    getItem(key) {
      calls.push(['getItem', key]);
      if (failGet) throw new Error('getItem blocked');
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      calls.push(['setItem', key]);
      if (quota) throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
      if (failSet) throw new Error('setItem blocked');
      store.set(key, String(value));
    },
    removeItem(key) {
      calls.push(['removeItem', key]);
      if (failSet) throw new Error('removeItem blocked');
      store.delete(key);
    },
  };
}

const throwingBackend = () => memoryBackend({}, { failGet: true, failSet: true });

const entry = (id, slot, foodId, servingId, qty, status = 'eaten') => {
  const food = FOODS.find((f) => f.id === foodId);
  const grams = food.servings.find((s) => s.id === servingId).grams * qty;
  const per = (k) => (food.per100g[k] * grams) / 100;
  return {
    id,
    slot,
    foodId,
    servingId,
    qty,
    status,
    snapshot: {
      name: food.name,
      grams,
      kcal: per('kcal'),
      protein: per('protein'),
      carbs: per('carbs'),
      fat: per('fat'),
      fiber: per('fiber'),
    },
  };
};

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

/** A full, valid UserData document (§4.5) with three entries on two days. */
function sampleDoc(patch = {}) {
  return {
    schemaVersion: 1,
    profile: { ...P1 },
    targetPrefs: {},
    targetOverrides: {},
    settings: {
      slotPreset: 'spain',
      slotLabels: { lunch: 'Lunch box' },
      halalOnly: true,
      seafood: 'all',
      dayStartMinutes: 240,
      onboarding: 'done',
      units: { weight: 'kg', height: 'cm' },
      weekStartsOn: 1,
      theme: 'system',
      hideCalories: false,
    },
    days: {
      '2026-10-12': {
        date: '2026-10-12',
        entries: [
          entry('e1', 'breakfast', 'pk-roti-home-fx', 'medium', 2),
          entry('e2', 'evening', 'pk-chai-doodh-patti-home-fx', 'cup', 1),
        ],
      },
      '2026-10-13': {
        date: '2026-10-13',
        entries: [entry('e3', 'lunch', 'pk-daal-masoor-home-fx', 'katori', 1.5, 'planned')],
      },
    },
    customFoods: [],
    recents: {
      'pk-chai-doodh-patti-home-fx': {
        servingId: 'cup',
        qty: 1,
        count: 5,
        lastUsed: '2026-10-12',
        slots: { evening: 5 },
      },
    },
    recipes: [],
    batches: [],
    ...patch,
  };
}

// ------------------------------------------------------------------ constants and defaults
qa('constants: STORAGE_KEY, SCHEMA_VERSION, EXPORT_KIND', [], () => {
  assert.equal(STORAGE_KEY, 'mmc.v1');
  assert.equal(SCHEMA_VERSION, 1);
  assert.equal(EXPORT_KIND, 'katori-backup');
});

qa('defaultData(): a fresh, valid UserData (§4.5)', [defaultData, validateUserData], () => {
  const d = defaultData();
  assert.equal(d.schemaVersion, 1);
  assert.equal(d.profile, null);
  assert.deepEqual(d.targetOverrides, {});
  assert.ok(d.targetPrefs && typeof d.targetPrefs === 'object');
  assert.deepEqual(d.days, {});
  assert.deepEqual(d.customFoods, []);
  assert.deepEqual(d.recents, {});
  assert.deepEqual(d.recipes, [], 'reserved for Sprint 2');
  assert.deepEqual(d.batches, [], 'reserved for Sprint 2');
  const s = d.settings;
  assert.equal(s.slotPreset, 'default', 'no rules → default preset');
  assert.deepEqual(s.slotLabels, {});
  assert.equal(s.halalOnly, true);
  assert.equal(s.seafood, 'all');
  assert.equal(s.dayStartMinutes, 240, 'the day starts at 04:00 (DECISIONS.md)');
  assert.equal(s.onboarding, 'pending');
  assert.ok(['kg', 'lb'].includes(s.units.weight) && ['cm', 'ftin'].includes(s.units.height));
  assert.ok([0, 1, 6].includes(s.weekStartsOn));
  assert.ok(['system', 'light', 'dark'].includes(s.theme));
  assert.equal(typeof s.hideCalories, 'boolean');
  assert.deepEqual(validateUserData(d), []);
});

qa(
  'defaultData({ timeZone, rules }): Madrid, Ceuta and the Canaries get the Spanish preset',
  [defaultData],
  () => {
    for (const tz of ['Europe/Madrid', 'Africa/Ceuta', 'Atlantic/Canary']) {
      assert.equal(defaultData({ timeZone: tz, rules: RULES }).settings.slotPreset, 'spain', tz);
    }
    for (const tz of ['Asia/Karachi', 'America/Los_Angeles', 'Europe/London', null, undefined]) {
      assert.equal(
        defaultData({ timeZone: tz, rules: RULES }).settings.slotPreset,
        'default',
        String(tz),
      );
    }
    const d = defaultData({ timeZone: 'Europe/Madrid', rules: RULES });
    assert.equal(d.settings.halalOnly, RULES.vocab.halalRules.halalOnlyFilterDefault);
    assert.equal(d.settings.seafood, RULES.vocab.halalRules.seafoodDefault);
  },
);

qa(
  'defaultData reads RULES (halalOnly, seafood, presets) and returns fresh objects',
  [defaultData],
  () => {
    const rules = structuredClone(RULES);
    rules.vocab.halalRules.halalOnlyFilterDefault = false;
    rules.vocab.halalRules.seafoodDefault = 'fish-only';
    rules.mealSlotPresetDefault.byTimeZone['Asia/Karachi'] = 'spain';
    const d = defaultData({ timeZone: 'Asia/Karachi', rules: deepFreeze(rules) });
    assert.equal(d.settings.halalOnly, false);
    assert.equal(d.settings.seafood, 'fish-only');
    assert.equal(d.settings.slotPreset, 'spain');
    const a = defaultData();
    a.days['2026-10-13'] = { date: '2026-10-13', entries: [] };
    a.settings.halalOnly = false;
    assert.deepEqual(defaultData().days, {}, 'no shared state between calls');
    assert.equal(defaultData().settings.halalOnly, true);
  },
);

// ------------------------------------------------------------------ persistence: the five statuses
qa("load(): 'empty' when nothing is saved, then 'ok' after save()", [createPersistence], () => {
  const backend = memoryBackend();
  const p = createPersistence(backend, { stamp: () => 'T1' });
  const first = p.load();
  assert.equal(first.status, 'empty');
  assert.equal(first.data.profile, null);
  assert.deepEqual(first.data.days, {});
  const doc = deepFreeze(sampleDoc());
  assert.deepEqual(p.save(doc), { ok: true });
  assert.ok(backend.store.has('mmc.v1'), "saved under 'mmc.v1'");
  assert.deepEqual(JSON.parse(backend.store.get('mmc.v1')), doc);
  const again = createPersistence(backend).load();
  assert.equal(again.status, 'ok');
  assert.deepEqual(again.data, doc);
});

qa(
  "load(): 'unavailable' with no backend or a throwing one; save() refuses; never throws",
  [createPersistence],
  () => {
    for (const [label, backend] of [
      ['null', null],
      ['undefined', undefined],
      ['throwing', throwingBackend()],
    ]) {
      let p;
      assert.doesNotThrow(() => {
        p = createPersistence(backend);
      }, label);
      let loaded;
      assert.doesNotThrow(() => {
        loaded = p.load();
      }, label);
      assert.equal(loaded.status, 'unavailable', label);
      assert.equal(loaded.data.profile, null, `${label}: defaults`);
      let saved;
      assert.doesNotThrow(() => {
        saved = p.save(sampleDoc());
      }, label);
      assert.equal(saved.ok, false, label);
      assert.equal(typeof saved.error, 'string', label);
    }
    assert.equal(createPersistence(null).save(sampleDoc()).error, 'unavailable');
  },
);

qa(
  "save(): a quota-exceeded backend gives { ok: false, error: 'quota' }",
  [createPersistence],
  () => {
    const backend = memoryBackend({}, { quota: true });
    const p = createPersistence(backend);
    p.load();
    let result;
    assert.doesNotThrow(() => {
      result = p.save(sampleDoc());
    });
    assert.deepEqual(result, { ok: false, error: 'quota' });
  },
);

qa(
  "load(): 'corrupt' keeps the raw text under mmc.v1.corrupt.<stamp> and returns defaults",
  [createPersistence],
  () => {
    for (const raw of [
      '{not json',
      '[1,2,3]',
      '"just a string"',
      '{"schemaVersion":1,"days":42}',
    ]) {
      const backend = memoryBackend({ 'mmc.v1': raw });
      const p = createPersistence(backend, { stamp: () => '2026-10-13T21:30' });
      const r = p.load();
      assert.equal(r.status, 'corrupt', raw);
      assert.equal(r.data.profile, null, `${raw}: defaults`);
      assert.deepEqual(r.data.days, {}, `${raw}: defaults`);
      assert.equal(backend.store.get('mmc.v1.corrupt.2026-10-13T21:30'), raw, `${raw}: raw kept`);
      assert.deepEqual(p.save(sampleDoc()), { ok: true }, `${raw}: saving still works`);
    }
  },
);

qa(
  "load(): 'future' returns defaults and save() refuses, leaving the newer document intact",
  [createPersistence],
  () => {
    const newer = JSON.stringify({ ...sampleDoc(), schemaVersion: 2, somethingNew: true });
    const backend = memoryBackend({ 'mmc.v1': newer });
    const p = createPersistence(backend);
    const r = p.load();
    assert.equal(r.status, 'future');
    assert.equal(r.data.profile, null, 'defaults');
    assert.deepEqual(p.save(sampleDoc()), { ok: false, error: 'future' });
    assert.equal(backend.store.get('mmc.v1'), newer, 'not overwritten');
  },
);

qa('A13: a reload sees exactly what was saved (17-entry day survives)', [createPersistence], () => {
  const backend = memoryBackend();
  const entries = Array.from({ length: 17 }, (_, i) =>
    entry(
      `d1-${i}`,
      ['breakfast', 'lunch', 'evening', 'dinner', 'snacks'][i % 5],
      'pk-roti-home-fx',
      'medium',
      1 + (i % 3),
    ),
  );
  const doc = deepFreeze(sampleDoc({ days: { '2026-10-13': { date: '2026-10-13', entries } } }));
  createPersistence(backend).save(doc);
  const loaded = createPersistence(backend).load();
  assert.equal(loaded.status, 'ok');
  assert.equal(loaded.data.days['2026-10-13'].entries.length, 17);
  assert.deepEqual(loaded.data, doc);
});

// ------------------------------------------------------------------ migrate and validate
qa(
  'migrate: a current document is unchanged; missing fields are filled with defaults',
  [migrate, validateUserData],
  () => {
    const doc = deepFreeze(sampleDoc());
    assert.deepEqual(migrate(doc), doc);
    const old = deepFreeze({
      schemaVersion: 1,
      profile: { ...P1 },
      targetPrefs: {},
      targetOverrides: {},
      settings: {
        units: { weight: 'kg', height: 'cm' },
        weekStartsOn: 1,
        theme: 'dark',
        hideCalories: false,
      },
      days: sampleDoc().days,
      customFoods: [],
      recents: {},
    });
    const m = migrate(old);
    assert.deepEqual(validateUserData(m), []);
    assert.deepEqual(m.recipes, []);
    assert.deepEqual(m.batches, []);
    assert.equal(m.settings.dayStartMinutes, 240);
    assert.equal(m.settings.halalOnly, true);
    assert.equal(m.settings.theme, 'dark', 'existing settings kept');
    assert.deepEqual(m.days, old.days, 'days kept');
    assert.ok(
      [undefined, 'done'].includes(m.settings.onboarding),
      "a stored profile means onboarding is 'done' (§7.3)",
    );
  },
);

qa('migrate throws .code FUTURE_VERSION or INVALID', [migrate], () => {
  const code = (raw) => {
    try {
      migrate(raw);
    } catch (error) {
      if (/^not implemented/.test(error.message)) throw error;
      return error.code;
    }
    return 'no error';
  };
  assert.equal(code({ ...sampleDoc(), schemaVersion: 2 }), 'FUTURE_VERSION');
  assert.equal(code({ ...sampleDoc(), schemaVersion: 99 }), 'FUTURE_VERSION');
  for (const raw of [null, undefined, 42, 'text', [], [sampleDoc()]]) {
    assert.equal(code(raw), 'INVALID', String(raw));
  }
});

qa(
  'validateUserData: [] for valid documents, problems otherwise; never throws',
  [validateUserData],
  () => {
    assert.deepEqual(validateUserData(deepFreeze(sampleDoc())), []);
    for (const minutes of [0, 240, 300]) {
      const d = sampleDoc();
      d.settings.dayStartMinutes = minutes;
      assert.deepEqual(validateUserData(d), [], `dayStartMinutes ${minutes}`);
    }
    const broken = [
      ['dayStartMinutes 301', (d) => (d.settings.dayStartMinutes = 301)],
      ['dayStartMinutes -1', (d) => (d.settings.dayStartMinutes = -1)],
      ['dayStartMinutes text', (d) => (d.settings.dayStartMinutes = '240')],
      ['slotPreset', (d) => (d.settings.slotPreset = 'mexico')],
      ['halalOnly', (d) => (d.settings.halalOnly = 'yes')],
      ['onboarding', (d) => (d.settings.onboarding = 'maybe')],
      ['schemaVersion', (d) => (d.schemaVersion = 'one')],
      ['days not an object', (d) => (d.days = [])],
      ['impossible date key', (d) => (d.days['2026-02-30'] = { date: '2026-02-30', entries: [] })],
      ['entries not an array', (d) => (d.days['2026-10-12'].entries = {})],
      ['entry qty 0', (d) => (d.days['2026-10-12'].entries[0].qty = 0)],
      ['entry qty negative', (d) => (d.days['2026-10-12'].entries[0].qty = -1)],
      ['entry slot', (d) => (d.days['2026-10-12'].entries[0].slot = 'brunch')],
      ['entry status', (d) => (d.days['2026-10-12'].entries[0].status = 'done')],
      ['customFoods', (d) => (d.customFoods = {})],
      ['recipes', (d) => (d.recipes = null)],
    ];
    for (const [label, patch] of broken) {
      const d = sampleDoc();
      patch(d);
      assert.ok(validateUserData(d).length > 0, `no problem for ${label}`);
    }
    for (const junk of [null, undefined, 42, 'doc', []]) {
      let problems;
      assert.doesNotThrow(() => {
        problems = validateUserData(junk);
      });
      assert.ok(problems.length > 0, String(junk));
    }
  },
);

// ------------------------------------------------------------------ export and import (A13 step 6)
qa('serializeExport: JSON { kind, schemaVersion, exportedAt, data }', [serializeExport], () => {
  const doc = deepFreeze(sampleDoc());
  const text = serializeExport(doc, '2026-10-13T21:30');
  assert.equal(typeof text, 'string');
  assert.deepEqual(JSON.parse(text), {
    kind: 'katori-backup',
    schemaVersion: 1,
    exportedAt: '2026-10-13T21:30',
    data: doc,
  });
});

qa(
  'A13 step 6: export → import gives back the same document, with a summary',
  [serializeExport, parseImport],
  () => {
    const doc = deepFreeze(sampleDoc());
    const r = parseImport(serializeExport(doc, '2026-10-13T21:30'));
    assert.equal(r.ok, true);
    assert.deepEqual(r.data, doc);
    assert.deepEqual(r.summary, {
      days: 2,
      entries: 3,
      customFoods: 0,
      firstDate: '2026-10-12',
      lastDate: '2026-10-13',
    });
    const padded = parseImport(`\n  ${serializeExport(doc, 'x')}  \n`);
    assert.equal(padded.ok, true, 'surrounding whitespace from a paste is fine');
  },
);

qa('parseImport also accepts a bare UserData document', [parseImport], () => {
  const doc = sampleDoc();
  const r = parseImport(JSON.stringify(doc));
  assert.equal(r.ok, true);
  assert.deepEqual(r.data, doc);
  const empty = parseImport(JSON.stringify({ ...doc, days: {} }));
  assert.deepEqual(empty.summary, {
    days: 0,
    entries: 0,
    customFoods: 0,
    firstDate: null,
    lastDate: null,
  });
});

qa(
  'parseImport error codes: EMPTY, NOT_JSON, NOT_KATORI, FUTURE_VERSION, INVALID',
  [parseImport, serializeExport],
  () => {
    const err = (text) => {
      const r = parseImport(text);
      assert.equal(r.ok, false, `ok for ${JSON.stringify(text).slice(0, 40)}`);
      return r.error;
    };
    for (const t of ['', '   ', '\n\t']) assert.equal(err(t), 'EMPTY', JSON.stringify(t));
    for (const t of ['hello', '{', '{"kind": "katori-backup",}', 'undefined'])
      assert.equal(err(t), 'NOT_JSON', t);
    for (const t of [
      '42',
      '"text"',
      '[1,2]',
      'null',
      '{"kind":"other-app","data":{}}',
      '{"foo":1}',
    ]) {
      assert.equal(err(t), 'NOT_KATORI', t);
    }
    const future = JSON.parse(serializeExport(sampleDoc(), 'x'));
    future.schemaVersion = 2;
    future.data.schemaVersion = 2;
    assert.equal(err(JSON.stringify(future)), 'FUTURE_VERSION', 'export from a newer version');
    assert.equal(
      err(JSON.stringify({ ...sampleDoc(), schemaVersion: 2 })),
      'FUTURE_VERSION',
      'bare doc',
    );
    const broken = JSON.parse(serializeExport(sampleDoc(), 'x'));
    broken.data.days = 42;
    assert.equal(err(JSON.stringify(broken)), 'INVALID');
  },
);

qa("mergeImport 'replace' takes the incoming document", [mergeImport], () => {
  const current = deepFreeze(sampleDoc());
  const incoming = deepFreeze(sampleDoc({ profile: null, days: {} }));
  assert.deepEqual(mergeImport(current, incoming, 'replace'), incoming);
});

qa(
  "mergeImport 'merge': days unioned, entries by id (incoming wins), current profile/settings kept",
  [mergeImport],
  () => {
    const current = deepFreeze(sampleDoc({ customFoods: [{ id: 'my-a', name: 'A (current)' }] }));
    const changed = {
      ...entry('e3', 'lunch', 'pk-daal-masoor-home-fx', 'katori', 2),
      status: 'eaten',
    };
    const incoming = deepFreeze(
      sampleDoc({
        profile: { ...P1, weightKg: 90 },
        settings: { ...sampleDoc().settings, theme: 'dark', halalOnly: false },
        days: {
          '2026-10-13': {
            date: '2026-10-13',
            entries: [changed, entry('e4', 'dinner', 'pk-roti-home-fx', 'medium', 2)],
          },
          '2026-10-14': {
            date: '2026-10-14',
            entries: [entry('e5', 'breakfast', 'intl-egg-boiled-fx', 'egg', 2)],
          },
        },
        customFoods: [
          { id: 'my-a', name: 'A (incoming)' },
          { id: 'my-b', name: 'B' },
        ],
        recents: {
          'pk-chai-doodh-patti-home-fx': {
            servingId: 'mug',
            qty: 1,
            count: 3,
            lastUsed: '2026-10-14',
            slots: { breakfast: 3 },
          },
          'pk-roti-home-fx': {
            servingId: 'medium',
            qty: 2,
            count: 1,
            lastUsed: '2026-10-13',
            slots: { dinner: 1 },
          },
        },
      }),
    );
    const m = mergeImport(current, incoming, 'merge');
    assert.deepEqual(Object.keys(m.days).sort(), ['2026-10-12', '2026-10-13', '2026-10-14']);
    assert.deepEqual(m.days['2026-10-12'], current.days['2026-10-12'], 'current-only day kept');
    const ids13 = m.days['2026-10-13'].entries.map((e) => e.id).sort();
    assert.deepEqual(ids13, ['e3', 'e4']);
    assert.deepEqual(
      m.days['2026-10-13'].entries.find((e) => e.id === 'e3'),
      changed,
      'same id: incoming wins',
    );
    assert.deepEqual(m.days['2026-10-14'], incoming.days['2026-10-14'], 'incoming-only day added');
    assert.deepEqual(m.profile, current.profile, 'current profile kept');
    assert.deepEqual(m.settings, current.settings, 'current settings kept');
    const foods = Object.fromEntries(m.customFoods.map((f) => [f.id, f.name]));
    assert.deepEqual(
      foods,
      { 'my-a': 'A (incoming)', 'my-b': 'B' },
      'custom foods unioned, incoming wins',
    );
    const chai = m.recents['pk-chai-doodh-patti-home-fx'];
    assert.equal(chai.count, 5, 'the larger count');
    assert.equal(chai.lastUsed, '2026-10-14', 'the later lastUsed');
    assert.ok(m.recents['pk-roti-home-fx'], 'incoming-only recent added');
    assert.deepEqual(validateUserData(m), []);
  },
);

qa(
  "mergeImport 'merge' into a fresh document takes the incoming profile and settings",
  [mergeImport, defaultData],
  () => {
    const current = deepFreeze(defaultData());
    const incoming = deepFreeze(sampleDoc());
    const m = mergeImport(current, incoming, 'merge');
    assert.deepEqual(m.profile, incoming.profile);
    assert.deepEqual(m.settings, incoming.settings);
    assert.deepEqual(m.days, incoming.days);
  },
);

qa('mergeImport refuses an unknown mode and never mutates its inputs', [mergeImport], () => {
  const a = frozen(sampleDoc());
  const b = frozen(sampleDoc({ days: {} }));
  assertThrowsKind(() => mergeImport(a, b, 'append'), RangeError, 'mode');
  mergeImport(a, b, 'merge');
  mergeImport(a, b, 'replace');
  assert.deepEqual(a, sampleDoc());
});
