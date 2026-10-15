// Author's tests for Sprint 3 wave 1 (Meeting 005): weight log and trend, spare/old boxes, meal
// names, kam-tel style rank, short names in search. Owner: Lena. Contract: ARCHITECTURE.md §14.
// The trend reads the real RULES.weightTrend (rules 1.7.0, NUTRITION.md §14).
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
  suggestRails,
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

const TREND_FIXTURE = RULES; // the Lab's rule landed in 1.7.0

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
    fastLoss: false,
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

test('real RULES.weightTrend: trend shows from 5 weigh-ins over 7 days; rate from 6 over 14', () => {
  assert.ok(trendRule(RULES), 'rules 1.7.0 carries weightTrend');
  const four = weightTrend(series('2026-09-01', 9, 80, 0, 3), RULES); // 4 readings, 9 days
  assert.equal(four.showTrend, false);
  assert.equal(four.needEntries, 5);
  const five = weightTrend(series('2026-09-01', 8, 80, 0, 2), RULES); // 5 readings, 8 days
  assert.equal(five.showTrend, true);
  assert.equal(five.weeklyRateKg, null, 'no rate under 6 readings / 14 days');
  const six = weightTrend(series('2026-09-01', 15, 80, -0.5, 3), RULES); // 6 readings, 15 days
  assert.ok(Math.abs(six.weeklyRateKg - -0.5) <= 0.02);
  assert.equal(six.rateWeeks, 2);
});

test('suggestion needs 10 readings in the window, a 28-day cooldown and a 14-day snooze', () => {
  const ctx = { goal: 'lose', rateKgPerWeek: 0.5, kcal: 1900, floorKcal: 1500 };
  const every4 = series('2026-09-01', 28, 85, 0, 4); // 8 readings: a rate, no suggestion
  assert.notEqual(weightTrend(every4, RULES, ctx).weeklyRateKg, null);
  assert.equal(weightTrend(every4, RULES, ctx).suggestion, null);
  const every3 = series('2026-09-02', 27, 85, 0, 3); // 10 readings over 27 days
  assert.equal(weightTrend(every3, RULES, ctx).suggestion.kcalPerDay, -200);
  const flat = series('2026-09-01', 28, 85, 0);
  const at = (extra) => weightTrend(flat, RULES, { ...ctx, today: '2026-09-29', ...extra });
  assert.equal(at({ changedOn: '2026-09-10' }).suggestion, null, '19 days since a change');
  assert.ok(at({ changedOn: '2026-09-01' }).suggestion, '28 days since a change');
  assert.equal(at({ dismissedOn: '2026-09-20' }).suggestion, null, 'Not now, 9 days ago');
  assert.ok(at({ dismissedOn: '2026-09-15' }).suggestion, 'Not now, 14 days ago');
});

test('never: Ramadan mode, pregnant/breastfeeding/eating_disorder, no target (§14.4)', () => {
  const flat = series('2026-09-01', 28, 85, 0);
  const ctx = { goal: 'lose', rateKgPerWeek: 0.5, kcal: 1900, floorKcal: 1500 };
  assert.ok(weightTrend(flat, RULES, ctx).suggestion);
  assert.equal(weightTrend(flat, RULES, { ...ctx, ramadanMode: true }).suggestion, null);
  for (const flag of ['pregnant', 'breastfeeding', 'eating_disorder']) {
    assert.equal(weightTrend(flat, RULES, { ...ctx, flags: [flag] }).suggestion, null, flag);
  }
  assert.ok(weightTrend(flat, RULES, { ...ctx, flags: ['diabetes_hypo_risk'] }).suggestion);
  assert.equal(weightTrend(flat, RULES, { ...ctx, kcal: null }).suggestion, null);
});

test('fast loss (> 1% of body weight a week) always suggests eating more', () => {
  // 70 kg losing 1 kg a week = 1.4% a week, on a 1 kg/week goal: within tolerance, still "eat more".
  const fast = series('2026-09-01', 28, 70, -1);
  const ctx = { goal: 'lose', rateKgPerWeek: 1, kcal: 1600, floorKcal: 1200 };
  const s = weightTrend(fast, RULES, ctx).suggestion;
  assert.ok(s.fastLoss);
  assert.ok(s.kcalPerDay > 0 && s.kcalPerDay <= 200 && s.kcalPerDay % 50 === 0, `${s.kcalPerDay}`);
  // 90 kg losing 0.5 a week (0.56%) on a 0.5 goal: on pace, nothing.
  const fine = weightTrend(series('2026-09-01', 28, 90, -0.5), RULES, {
    ...ctx,
    rateKgPerWeek: 0.5,
  });
  assert.equal(fine.suggestion, null);
});

test('rails: deficit caps and floor below, the 20% surplus cap above; no room = nothing', () => {
  // TDEE 2400, 80 kg: caps 600 (25%), 1000, 1100 (1% bw) → lowest 1800; ceiling 2880.
  assert.deepEqual(suggestRails(RULES, { tdee: 2400, sex: 'male', bodyKg: 80 }), {
    floorKcal: 1800,
    ceilingKcal: 2880,
  });
  // TDEE under the floor: the lowest is TDEE (no deficit).
  assert.equal(suggestRails(RULES, { tdee: 1150, sex: 'female', bodyKg: 50 }).floorKcal, 1150);
  assert.deepEqual(suggestRails(RULES, { sex: 'female' }), { floorKcal: 1200, ceilingKcal: null });
  const flat = series('2026-09-01', 28, 80, 0);
  const lose = { goal: 'lose', rateKgPerWeek: 0.5, floorKcal: 1800, ceilingKcal: 2880 };
  assert.equal(weightTrend(flat, RULES, { ...lose, kcal: 1900 }).suggestion.newKcal, 1800);
  assert.equal(weightTrend(flat, RULES, { ...lose, kcal: 1800 }).suggestion, null);
  const gain = { goal: 'gain', rateKgPerWeek: 0.5, floorKcal: 1800, ceilingKcal: 2880 };
  assert.equal(weightTrend(flat, RULES, { ...gain, kcal: 2800 }).suggestion.newKcal, 2850);
  assert.equal(weightTrend(flat, RULES, { ...gain, kcal: 2880 }).suggestion, null);
});

// ------------------------------------------------------------------ store

// The store reads the device clock, so "09:00" is built in the test's own time zone (TZ=...).
const NINE_LOCAL = new Date(2026, 9, 15, 9, 0);

function makeStore(now = NINE_LOCAL, timeZone = 'Europe/Madrid') {
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

test('store: "Use N kcal" sets the target on a tap (protein and fat stay), Not now snoozes', () => {
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
  for (const e of series('2026-09-15', 30, 85, 0)) store.setWeight(e.date, e.kg);
  const before = store.targets();
  const s = store.weightTrend().suggestion;
  assert.ok(s && s.kcalPerDay < 0);
  assert.equal(store.acceptWeightSuggestion(), true);
  const after = store.targets();
  assert.equal(after.kcal, s.newKcal);
  assert.equal(after.protein, before.protein);
  assert.equal(after.fat, before.fat);
  assert.equal(after.carbs, Math.round(before.carbs + s.kcalPerDay / 4));
  assert.equal(store.weightTrend().suggestion, null, 'cooldown after a change');
  assert.match(store.getState().undo.label, /Daily target set to/);
  store.undo();
  assert.deepEqual(store.targets(), before);
  store.dismissWeightSuggestion();
  assert.equal(store.weightTrend().suggestion, null, 'Not now: snoozed');
  assert.deepEqual(store.targets(), before);
  // A goal change in Profile starts the cooldown too.
  const other = makeStore();
  other.completeOnboarding({ ...store.getState().data.profile });
  for (const e of series('2026-09-15', 30, 85, 0)) other.setWeight(e.date, e.kg);
  other.setProfile({ ...other.getState().data.profile, rateKgPerWeek: 0.25 });
  assert.equal(other.settings().targetsChangedOn, '2026-10-15');
  assert.equal(other.weightTrend().suggestion, null);
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
  const karachi = makeStore(NINE_LOCAL, 'Asia/Karachi');
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
