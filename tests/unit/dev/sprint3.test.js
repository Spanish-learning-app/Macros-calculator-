// Author's tests for Sprint 3 wave 1 (Meeting 005): weight log and trend, spare/old boxes, meal
// names, kam-tel style rank, short names in search. Owner: Lena. Contract: ARCHITECTURE.md §14.
// The trend is tested against TREND_FIXTURE until RULES.weightTrend lands (rules 1.7.0); the
// "real RULES" test then checks that the app's rules are read the same way.
import test from 'node:test';
import assert from 'node:assert/strict';
import { RULES, FOODS } from '../../fixtures/index.js';
import { createStore } from '../../../app/ui/store.js';
import {
  setWeight,
  removeWeight,
  weightEntries,
  mergeWeightLogs,
  weightLogProblems,
  weightTrend,
  trendRule,
} from '../../../app/core/weight.js';
import { spareBoxes } from '../../../app/core/mealprep.js';
import {
  defaultData,
  migrate,
  validateUserData,
  serializeExport,
  parseImport,
  mergeImport,
} from '../../../app/core/storage.js';
import { buildSearchIndex, searchFoods } from '../../../app/core/search.js';
import { variantsOf, buildFoodIndex } from '../../../app/core/foods.js';
import { addDays } from '../../../app/core/dates.js';

const TREND_FIXTURE = {
  ...RULES,
  weightTrend: {
    smoothing: { method: 'ema', alphaPerDay: 0.1 },
    rate: { windowDays: 28, minEntries: 4, minSpanDays: 14 },
    suggest: { minSpanDays: 21, toleranceKgPerWeek: 0.2, stepKcal: 50, maxChangeKcal: 200 },
  },
};

/** One reading every `every` days from `start`, changing by `perWeek` kg a week. */
function series(start, days, kg0, perWeek, every = 1) {
  const out = [];
  for (let d = 0; d <= days; d += every) {
    out.push({ date: addDays(start, d), kg: Number((kg0 + (perWeek * d) / 7).toFixed(2)) });
  }
  return out;
}

// ------------------------------------------------------------------ weight log

test('setWeight keeps one entry per day, checks the limits and rounds to the gram', () => {
  let log = setWeight(undefined, '2026-10-14', 82.4, RULES);
  log = setWeight(log, '2026-10-14', 82.1, RULES);
  log = setWeight(log, '2026-10-13', 81.64662, RULES);
  assert.deepEqual(log, { '2026-10-14': { kg: 82.1 }, '2026-10-13': { kg: 81.647 } });
  assert.throws(() => setWeight(log, '2026-02-30', 80, RULES), RangeError);
  assert.throws(() => setWeight(log, '2026-10-15', 12, RULES), RangeError);
  assert.throws(() => setWeight(log, '2026-10-15', 400, RULES), RangeError);
  assert.throws(() => setWeight(log, '2026-10-15', Number.NaN, RULES), RangeError);
  assert.deepEqual(weightEntries(log), [
    { date: '2026-10-13', kg: 81.647 },
    { date: '2026-10-14', kg: 82.1 },
  ]);
  assert.deepEqual(removeWeight(log, '2026-10-13'), { '2026-10-14': { kg: 82.1 } });
  assert.equal(removeWeight(log, '2026-01-01'), log);
});

test('weightLog is optional in UserData; bad entries never make the document corrupt', () => {
  const data = defaultData({ rules: RULES });
  assert.equal(data.weightLog, undefined, 'absent = none');
  assert.deepEqual(validateUserData(data), []);
  assert.deepEqual(validateUserData({ ...data, weightLog: { '2026-10-14': { kg: 80 } } }), []);
  assert.ok(weightLogProblems({ x: { kg: 80 } }).length > 0);
  assert.ok(validateUserData({ ...data, weightLog: [] }).length > 0);
  const raw = { ...data, weightLog: { '2026-10-14': { kg: 80 }, '2026-10-15': { kg: 'a' } } };
  assert.deepEqual(migrate(raw).weightLog, { '2026-10-14': { kg: 80 } });
  assert.equal(migrate({ ...data, weightLog: 'nope' }).weightLog, undefined);
});

test('weights travel in export and import, merge (by date, incoming wins) and replace', () => {
  const current = { ...defaultData({ rules: RULES }), weightLog: { '2026-10-01': { kg: 80 } } };
  const incoming = {
    ...defaultData({ rules: RULES }),
    weightLog: { '2026-10-01': { kg: 79.5 }, '2026-10-08': { kg: 79 } },
  };
  const parsed = parseImport(serializeExport(incoming, '2026-10-15 20:00'));
  assert.ok(parsed.ok);
  assert.deepEqual(parsed.data.weightLog, incoming.weightLog);
  assert.deepEqual(mergeImport(current, parsed.data, 'merge').weightLog, {
    '2026-10-01': { kg: 79.5 },
    '2026-10-08': { kg: 79 },
  });
  assert.deepEqual(mergeImport(current, parsed.data, 'replace').weightLog, incoming.weightLog);
  const none = defaultData({ rules: RULES });
  assert.deepEqual(mergeImport(current, none, 'merge').weightLog, current.weightLog);
  assert.equal(Object.hasOwn(mergeImport(none, none, 'merge'), 'weightLog'), false);
  assert.equal(mergeImport(current, none, 'replace').weightLog, undefined);
  assert.deepEqual(mergeWeightLogs(undefined, undefined), {});
});

// ------------------------------------------------------------------ trend

test('without RULES.weightTrend there is a log but no trend (the Lab owns the numbers)', () => {
  const t = weightTrend(series('2026-09-01', 30, 85, -0.5), { ...RULES, weightTrend: undefined });
  assert.equal(t.ready, false);
  assert.equal(t.weeklyRateKg, null);
  assert.equal(t.points.length, 31);
  assert.ok(t.points.every((p) => p.trendKg === null));
  assert.equal(t.latest.date, '2026-10-01');
  assert.equal(trendRule({ weightTrend: { smoothing: { alphaPerDay: 2 } } }), null);
});

test('trend: EMA over days (gaps weigh more), weekly rate from the last window', () => {
  const t = weightTrend(series('2026-09-01', 28, 85, -0.5, 2), TREND_FIXTURE);
  assert.equal(t.ready, true);
  assert.equal(t.points[0].trendKg, 85);
  // Second reading after a 2-day gap: weight 1 − 0.9² = 0.19.
  const second = t.points[1];
  assert.equal(second.trendKg, Number((85 + 0.19 * (second.kg - 85)).toFixed(2)));
  assert.ok(Math.abs(t.weeklyRateKg - -0.5) <= 0.02, `rate ${t.weeklyRateKg}`);
  assert.ok(t.latest.trendKg > t.latest.kg, 'the trend lags a steady loss');
  // Too few readings or too short a span: no rate yet.
  assert.equal(weightTrend(series('2026-09-01', 6, 85, -0.5), TREND_FIXTURE).weeklyRateKg, null);
  assert.equal(weightTrend([{ date: '2026-09-01', kg: 80 }], TREND_FIXTURE).weeklyRateKg, null);
  assert.deepEqual(weightTrend([], TREND_FIXTURE).points, []);
});

test('suggestion: only off-pace for 3+ weeks, rounded, capped, inside the floor; never for flags', () => {
  const ctx = { goal: 'lose', rateKgPerWeek: 0.5, kcal: 1900, floorKcal: 1500 };
  // On pace: nothing.
  assert.equal(
    weightTrend(series('2026-09-01', 28, 85, -0.5), TREND_FIXTURE, ctx).suggestion,
    null,
  );
  // Not losing at all: 0.5 kg/week too slow → −550 kcal, capped at 200.
  const flat = weightTrend(series('2026-09-01', 28, 85, 0), TREND_FIXTURE, ctx).suggestion;
  assert.deepEqual(flat, {
    kcalPerDay: -200,
    newKcal: 1700,
    expectedKgPerWeek: -0.5,
    differenceKgPerWeek: 0.5,
  });
  // The floor wins: 1600 − 200 would cross 1500.
  const near = weightTrend(series('2026-09-01', 28, 85, 0), TREND_FIXTURE, { ...ctx, kcal: 1600 });
  assert.equal(near.suggestion.newKcal, 1500);
  assert.equal(
    weightTrend(series('2026-09-01', 28, 85, 0), TREND_FIXTURE, { ...ctx, kcal: 1500 }).suggestion,
    null,
  );
  // Maintain but gaining 0.3 kg/week → about −330, capped at −200; gain too slow → raise.
  const keep = { goal: 'maintain', rateKgPerWeek: 0, kcal: 2200, floorKcal: 1500 };
  assert.equal(
    weightTrend(series('2026-09-01', 28, 80, 0.3), TREND_FIXTURE, keep).suggestion.kcalPerDay,
    -200,
  );
  const gain = { goal: 'gain', rateKgPerWeek: 0.25, kcal: 2600, floorKcal: 1500 };
  const up = weightTrend(series('2026-09-01', 28, 60, -0.1), TREND_FIXTURE, gain).suggestion;
  assert.ok(up.kcalPerDay > 0 && up.kcalPerDay <= 200 && up.kcalPerDay % 50 === 0);
  // Under 3 weeks of data, a health flag, or no personal target: nothing.
  assert.equal(weightTrend(series('2026-09-01', 15, 85, 0), TREND_FIXTURE, ctx).suggestion, null);
  const flagged = { ...ctx, allowSuggest: false };
  assert.equal(
    weightTrend(series('2026-09-01', 28, 85, 0), TREND_FIXTURE, flagged).suggestion,
    null,
  );
  assert.equal(
    weightTrend(series('2026-09-01', 28, 85, 0), TREND_FIXTURE, { ...ctx, kcal: null }).suggestion,
    null,
  );
});

// ------------------------------------------------------------------ store

function makeStore(now = '2026-10-15T09:00:00+02:00', timeZone = 'Europe/Madrid') {
  let n = 0;
  return createStore({
    persistence: null,
    rules: TREND_FIXTURE,
    foods: FOODS,
    now: () => new Date(now),
    makeId: () => `id${(n += 1)}`,
    timeZone,
    timers: { set: () => 0, clear: () => {} },
  });
}

test('store: weight add, edit (same day), delete with Undo; nothing changes the targets', () => {
  const store = makeStore();
  store.completeOnboarding({
    sex: 'male',
    ageYears: 35,
    heightCm: 175,
    weightKg: 85,
    activity: 'light',
    goal: 'lose',
    rateKgPerWeek: 0.5,
    lifts: false,
    healthFlags: [],
  });
  const before = store.targets();
  for (const e of series('2026-09-15', 28, 85, 0)) store.setWeight(e.date, e.kg);
  store.setWeight('2026-10-13', 84.6);
  assert.equal(store.weightOn('2026-10-13'), 84.6);
  assert.equal(store.weights().length, 29);
  const trend = store.weightTrend();
  assert.equal(trend.ready, true);
  assert.ok(trend.suggestion && trend.suggestion.kcalPerDay < 0, 'suggests, flat while losing');
  assert.deepEqual(store.targets(), before, 'a suggestion never changes a target');
  assert.equal(store.getState().data.profile.weightKg, 85, 'the profile weight is not touched');
  store.removeWeight('2026-10-13');
  assert.equal(store.weightOn('2026-10-13'), null);
  assert.match(store.getState().undo.label, /Deleted the weight for Tue 13 Oct/);
  store.undo();
  assert.equal(store.weightOn('2026-10-13'), 84.6);
  assert.throws(() => store.setWeight('2026-10-15', 10), RangeError);
  assert.ok(store.exportText().includes('"weightLog"'));
});

test('store: no suggestion when a health flag turns weight-loss goals off', () => {
  const store = makeStore();
  store.completeOnboarding({
    sex: 'female',
    ageYears: 30,
    heightCm: 165,
    weightKg: 70,
    activity: 'light',
    goal: 'lose',
    rateKgPerWeek: 0.5,
    lifts: false,
    healthFlags: ['eating_disorder'],
  });
  for (const e of series('2026-09-15', 28, 70, 0.4)) store.setWeight(e.date, e.kg);
  assert.equal(store.weightTrend().suggestion, null);
});

test('store: meal names are chosen apart from meal times, and survive a times change', () => {
  const store = makeStore();
  assert.equal(store.settings().slotPreset, 'spain', 'Madrid: Spanish times');
  assert.equal(store.mealNameSet(), 'spain', 'and Spanish names by default');
  assert.deepEqual(
    store.mealNameSets().map((s) => s.id),
    ['default', 'spain'],
  );
  store.setMealNames('default');
  assert.equal(store.mealNameSet(), 'default');
  assert.equal(store.slotLabel('breakfast'), 'Nashta');
  assert.equal(store.slotLabel('evening'), 'Shaam ki chai');
  assert.equal(store.defaultSlot(), 'breakfast', 'Spanish clock: 09:00 is still breakfast');
  store.updateSettings({ slotPreset: 'default' });
  assert.equal(store.mealNameSet(), 'default');
  store.setMealNames('default');
  assert.deepEqual(store.settings().slotLabels, {}, 'names = the preset: no renames stored');
  store.setMealNames('spain');
  assert.equal(store.slotLabel('evening'), 'Merienda');
  store.updateSettings({ slotLabels: { ...store.settings().slotLabels, lunch: 'Office box' } });
  assert.equal(store.mealNameSet(), null, 'a rename = neither set');
  assert.throws(() => store.setMealNames('ramadan'), RangeError);
  const karachi = makeStore('2026-10-15T09:00:00+05:00', 'Asia/Karachi');
  assert.equal(karachi.mealNameSet(), 'default');
});

// ------------------------------------------------------------------ spare boxes

const useBy = (map) => (batch, box) => map[box.id] ?? null;
const box = (id, status, storage, extra = {}) => ({ id, status, storage, ...extra });

test('spareBoxes: past, last day and tomorrow for unplaced fridge boxes, most urgent first', () => {
  const batches = [
    {
      id: 'b1',
      cookedOn: '2026-10-12',
      boxes: [
        box('a', 'available', 'fridge'),
        box('b', 'available', 'fridge'),
        box('c', 'placed', 'fridge', { placed: { date: '2026-10-15', entryId: 'e1' } }),
        box('d', 'eaten', 'fridge'),
      ],
    },
    { id: 'b2', cookedOn: '2026-10-14', boxes: [box('e', 'available', 'fridge')] },
    { id: 'b3', cookedOn: '2026-10-15', boxes: [box('f', 'available', 'fridge')] },
  ];
  const dates = {
    a: '2026-10-14',
    b: '2026-10-15',
    c: '2026-10-14',
    e: '2026-10-16',
    f: '2026-10-18',
  };
  const out = spareBoxes(batches, '2026-10-15', useBy(dates));
  assert.deepEqual(
    out.map((x) => [x.kind, x.boxId, x.number]),
    [
      ['past', 'a', 1],
      ['last-day', 'b', 2],
      ['soon', 'e', 1],
    ],
  );
  assert.deepEqual(spareBoxes([], '2026-10-15', useBy({})), []);
  assert.throws(() => spareBoxes([], 'today', useBy({})), RangeError);
});

test('spareBoxes: a frozen batch with no plan after a week; not when a box is planned ahead', () => {
  const frozen = (id, cookedOn, extra = []) => ({
    id,
    cookedOn,
    boxes: [box(`${id}1`, 'available', 'freezer'), box(`${id}2`, 'available', 'freezer'), ...extra],
  });
  const batches = [
    frozen('old', '2026-10-01'),
    frozen('new', '2026-10-12'),
    frozen('planned', '2026-10-01', [
      box('p3', 'placed', 'freezer', { placed: { date: '2026-10-17', entryId: 'x' } }),
    ]),
    frozen('mixed', '2026-10-01', [box('m3', 'available', 'fridge')]),
  ];
  const out = spareBoxes(batches, '2026-10-15', useBy({ m3: '2026-10-20' }));
  assert.deepEqual(out, [
    { kind: 'frozen', batchId: 'old', boxId: 'old1', number: 1, count: 2, useBy: null },
  ]);
  // A box moved to the fridge counts by its use-by, not as frozen.
  const moved = [
    {
      id: 'mv',
      cookedOn: '2026-10-01',
      boxes: [box('mv1', 'available', 'fridge', { movedToFridgeOn: '2026-10-14' })],
    },
  ];
  assert.equal(spareBoxes(moved, '2026-10-15', useBy({ mv1: '2026-10-15' }))[0].kind, 'last-day');
});

// ------------------------------------------------------------------ kam tel and short names

const dish = (id, style, extra = {}) => ({
  id,
  name: extra.name ?? 'Chicken karahi',
  ...(extra.shortName ? { shortName: extra.shortName } : {}),
  family: 'karahi',
  style,
  group: 'curry-meat',
  per100g: { kcal: 150, protein: 14, carbs: 4, fat: 9, fiber: 1 },
  servings: [{ id: 'katori', label: '1 katori', grams: 150, default: true }],
  tags: [],
  halal: { status: 'halal' },
  source: { citation: 'test', confidence: 'B' },
});

test('home-light (kam tel) ranks right after home in search and in the variant list', () => {
  const foods = [
    dish('k-street', 'street'),
    dish('k-rest', 'restaurant'),
    dish('k-light', 'home-light'),
    dish('k-home', 'home'),
  ];
  const ids = searchFoods(buildSearchIndex(foods), 'chicken karahi').hits.map((h) => h.food.id);
  assert.deepEqual(ids, ['k-home', 'k-light', 'k-rest', 'k-street']);
  const index = buildFoodIndex(foods);
  assert.deepEqual(
    variantsOf(foods[0], index).map((f) => f.id),
    ['k-home', 'k-light', 'k-rest', 'k-street'],
  );
});

test('shortName is searchable; the full name still matches', () => {
  const long = dish('k-long', 'home', {
    name: 'Murgh karahi, home-style with tomato and green chilli',
    shortName: 'Murgh karahi',
  });
  const index = buildSearchIndex([long, dish('k-other', 'restaurant')]);
  assert.equal(searchFoods(index, 'murgh karahi').hits[0].food.id, 'k-long');
  assert.equal(searchFoods(index, 'green chilli').hits[0].food.id, 'k-long');
});
