// QA suite for the Sprint 3 weight trend, written from docs/NUTRITION.md section 14 (rules 1.7.x) and the
// signatures in docs/ARCHITECTURE.md section 14, NOT from app/core/weight.js. Every expected number is
// worked by hand in the comment above it. Owner: Kenji.
//   14.1 smoothing   14.2 weekly rate   14.3 when to suggest (minimums, cooldown, snooze, size, rails, fast loss)
//   14.4 never list  store: a target changes only when the person accepts
import test from 'node:test';
import assert from 'node:assert/strict';
import { RULES } from '../../../app/data/index.js';
import {
  setWeight,
  removeWeight,
  weightEntries,
  mergeWeightLogs,
  weightTrend,
  suggestRails,
} from '../../../app/core/weight.js';
import { createStore } from '../../../app/ui/store.js';
import { createPersistence } from '../../../app/core/storage.js';

// ------------------------------------------------------------------ helpers

/** ISO date `n` days after `iso` (pure UTC arithmetic, so no DST or zone can move it). */
const plus = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const D0 = '2026-09-01';
/** Entries from [dayOffset, kg] pairs. */
const at = (pairs, start = D0) => pairs.map(([n, kg]) => ({ date: plus(start, n), kg }));
/** Daily-ish series: kg = base + perDay * day for the given day offsets, to 4 decimals. */
const line = (days, base, perDay) =>
  at(days.map((n) => [n, Number((base + perDay * n).toFixed(4))]));
const range = (from, to, step = 1) => {
  const out = [];
  for (let n = from; n <= to; n += step) out.push(n);
  return out;
};
const near = (actual, expected, eps = 0.006, msg = '') =>
  assert.ok(
    Math.abs(actual - expected) <= eps,
    `${msg} expected ${expected} (+-${eps}), got ${actual}`,
  );
const last = (entries) => entries.at(-1)?.date ?? D0; // no entries: any day will do

/** A person with a normal goal and room on both sides of the rails. */
const CTX = (entries, over = {}) => ({
  goal: 'maintain',
  rateKgPerWeek: 0,
  kcal: 2400,
  floorKcal: 1500,
  ceilingKcal: 2880,
  today: last(entries),
  changedOn: null,
  dismissedOn: null,
  flags: [],
  ramadanMode: false,
  ...over,
});
const run = (entries, over = {}) => weightTrend(entries, RULES, CTX(entries, over));

// 22 days, every other day (12 entries), gaining 0.35 kg a week = 0.05 kg a day. Hand slope: exactly 0.05 a day.
const GAIN_035 = line(range(0, 22, 2), 80, 0.05);

// ------------------------------------------------------------------ the rule itself (14.1-14.3 parameters)

test('RULES.weightTrend carries the section 14 numbers', () => {
  const w = RULES.weightTrend;
  assert.equal(w.smoothing.alphaPerDay, 0.1);
  assert.deepEqual(
    [w.display.minEntries, w.display.minSpanDays],
    [5, 7],
    'trend shows from 5 entries over 7 days',
  );
  assert.deepEqual(
    [w.rate.windowDays, w.rate.minEntries, w.rate.minSpanDays],
    [28, 6, 14],
    'rate: 28-day window, 6 entries over 14 days',
  );
  assert.deepEqual(
    [w.suggest.minEntries, w.suggest.minSpanDays],
    [10, 21],
    'suggest: 10 entries over 21 days',
  );
  assert.equal(w.suggest.toleranceKgPerWeek, 0.25);
  assert.equal(w.suggest.stepKcal, 50);
  assert.equal(w.suggest.maxChangeKcal, 200);
  assert.equal(w.suggest.cooldownDaysAfterChange, 28);
  assert.equal(w.suggest.snoozeDaysAfterDismiss, 14);
  assert.equal(w.suggest.fastLossPctBodyWeightPerWeek, 1);
  assert.deepEqual([...w.suggest.neverForFlags].sort(), [
    'breastfeeding',
    'eating_disorder',
    'pregnant',
  ]);
  assert.equal(w.suggest.neverInRamadanMode, true);
});

// ------------------------------------------------------------------ the log (one entry per day)

test('log: setWeight replaces the day, removeWeight deletes it, entries come back oldest first', () => {
  let log = setWeight(undefined, '2026-09-03', 81.2, RULES);
  log = setWeight(log, '2026-09-01', 82, RULES);
  log = setWeight(log, '2026-09-03', 80.9, RULES); // same day: replaced, not added
  assert.deepEqual(weightEntries(log), [
    { date: '2026-09-01', kg: 82 },
    { date: '2026-09-03', kg: 80.9 },
  ]);
  assert.deepEqual(weightEntries(removeWeight(log, '2026-09-01')), [
    { date: '2026-09-03', kg: 80.9 },
  ]);
  assert.deepEqual(
    weightEntries(removeWeight(log, '2026-12-25')),
    weightEntries(log),
    'no entry: no change',
  );
  assert.deepEqual(weightEntries(undefined), []);
});

test('log: weights outside the profile limits (30-250 kg) and bad dates are refused', () => {
  for (const kg of [29.9, 250.1, 0, -5, NaN, Infinity, '80'])
    assert.throws(() => setWeight({}, '2026-09-01', kg, RULES), RangeError, `kg ${kg}`);
  for (const date of ['2026-02-30', '2026-9-1', 'yesterday', '', null])
    assert.throws(() => setWeight({}, date, 80, RULES), RangeError, `date ${date}`);
  assert.doesNotThrow(() => setWeight({}, '2026-09-01', 30, RULES));
  assert.doesNotThrow(() => setWeight({}, '2026-09-01', 250, RULES));
});

test('log: an import merge is a union by date and the incoming entry wins', () => {
  const merged = mergeWeightLogs(
    { '2026-09-01': { kg: 80 }, '2026-09-02': { kg: 81 } },
    { '2026-09-02': { kg: 79 }, '2026-09-03': { kg: 78 } },
  );
  assert.deepEqual(merged, {
    '2026-09-01': { kg: 80 },
    '2026-09-02': { kg: 79 },
    '2026-09-03': { kg: 78 },
  });
  assert.deepEqual(mergeWeightLogs(undefined, { '2026-09-01': { kg: 80 } }), {
    '2026-09-01': { kg: 80 },
  });
});

// ------------------------------------------------------------------ 14.1 smoothing

test('smoothing: five days of readings, worked by hand (alpha 0.1 a day)', () => {
  // t0 = 80
  // t1 = 80 + 0.1 * (81 - 80)            = 80.1
  // t2 = 80.1 + 0.1 * (79 - 80.1)        = 79.99
  // t3 = 79.99 + 0.1 * (80 - 79.99)      = 79.991
  // t4 = 79.991 + 0.1 * (80.5 - 79.991)  = 80.0419
  const r = run(
    at([
      [0, 80],
      [1, 81],
      [2, 79],
      [3, 80],
      [4, 80.5],
    ]),
  );
  [80, 80.1, 79.99, 79.991, 80.0419].forEach((want, i) =>
    near(r.points[i].trendKg, want, 0.006, `t${i}`),
  );
  near(r.latest.trendKg, 80.04, 0.006);
  assert.equal(r.latest.kg, 80.5, 'the raw reading is kept next to the trend');
});

test('smoothing: a gap of d days weighs the new reading 1 - 0.9^d (1 day 10%, 7 days 52%, 30 days 96%)', () => {
  // 7 days: 80 + (1 - 0.9^7) * (78 - 80) = 80 - 2 * 0.5217031 = 78.95659
  near(
    run(
      at([
        [0, 80],
        [7, 78],
      ]),
    ).latest.trendKg,
    78.9566,
    0.006,
    '7-day gap',
  );
  // 30 days: 80 + 0.9576089 * (70 - 80) = 70.42391
  near(
    run(
      at([
        [0, 80],
        [30, 70],
      ]),
    ).latest.trendKg,
    70.4239,
    0.006,
    '30-day gap',
  );
  // 1 day: 80 + 0.1 * (70 - 80) = 79
  near(
    run(
      at([
        [0, 80],
        [1, 70],
      ]),
    ).latest.trendKg,
    79,
    0.006,
    '1-day gap',
  );
  // mixed: day 0 80, day 1 79 -> 79.9; day 4 (3-day gap, weight 1 - 0.729 = 0.271) reads 82 -> 79.9 + 0.271 * 2.1 = 80.4691
  near(
    run(
      at([
        [0, 80],
        [1, 79],
        [4, 82],
      ]),
    ).latest.trendKg,
    80.4691,
    0.006,
    'mixed gaps',
  );
});

test('smoothing: the first entry seeds the trend, entries may come in any order', () => {
  const r = run(at([[0, 71.4]]));
  assert.equal(r.points.length, 1);
  near(r.points[0].trendKg, 71.4, 0.006);
  const shuffled = run(
    at([
      [4, 80.5],
      [0, 80],
      [2, 79],
      [3, 80],
      [1, 81],
    ]),
  );
  near(shuffled.latest.trendKg, 80.0419, 0.006);
  assert.deepEqual(
    shuffled.points.map((p) => p.date),
    range(0, 4).map((n) => plus(D0, n)),
  );
});

// ------------------------------------------------------------------ 14.1.5 and 14.2: minimums before anything shows

test('display: the trend shows from 5 entries spanning at least 7 days, not before', () => {
  assert.equal(run(line([0, 2, 4, 6], 80, 0)).showTrend, false, '4 entries over 6 days');
  assert.equal(
    run(line([0, 1, 2, 3, 4, 5, 6], 80, 0)).showTrend,
    false,
    '7 entries over only 6 days',
  );
  assert.equal(run(line([0, 2, 4, 6, 7], 80, 0)).showTrend, true, '5 entries over 7 days');
  assert.equal(run(line([0, 1, 2, 3, 4, 5, 6, 7], 80, 0)).showTrend, true);
  assert.equal(run(line([0, 7], 80, 0)).showTrend, false, '2 entries over 7 days');
  assert.equal(run([]).showTrend, false);
});

test('rate: shows from 6 entries spanning at least 14 days (in the 28-day window), not before', () => {
  assert.equal(run(line([0, 3, 6, 9, 14], 80, 0)).weeklyRateKg, null, '5 entries over 14 days');
  assert.equal(run(line([0, 3, 6, 9, 12, 13], 80, 0)).weeklyRateKg, null, '6 entries over 13 days');
  assert.notEqual(
    run(line([0, 3, 6, 9, 12, 14], 80, 0)).weeklyRateKg,
    null,
    '6 entries over 14 days',
  );
});

test('rate: least-squares slope of the raw readings times 7, worked by hand', () => {
  // days 0,3,6,9,12,15 ; kg 80, 80.5, 79, 79.5, 78, 78.5
  // mean x 7.5, mean y 79.25 ; dx -7.5 -4.5 -1.5 1.5 4.5 7.5 ; dy .75 1.25 -.25 .25 -1.25 -.75
  // sxy = -5.625 -5.625 +.375 +.375 -5.625 -5.625 = -21.75 ; sxx = 2 * (56.25 + 20.25 + 2.25) = 157.5
  // slope = -0.138095 a day -> x 7 = -0.9667 kg a week
  const r = run(
    at([
      [0, 80],
      [3, 80.5],
      [6, 79],
      [9, 79.5],
      [12, 78],
      [15, 78.5],
    ]),
  );
  near(r.weeklyRateKg, -0.97, 0.011);
  // A clean line: 0.1 kg a day down is exactly -0.7 a week.
  near(run(line([0, 3, 6, 9, 12, 15], 80, -0.1)).weeklyRateKg, -0.7, 0.011);
  near(run(line([0, 3, 6, 9, 12, 15], 80, 0)).weeklyRateKg, 0, 0.011);
});

test('rate: only the last 28 days count (an old heavy reading does not move it)', () => {
  const recent = line([0, 3, 6, 9, 12, 15], 80, -0.1); // -0.7 a week
  const old = at([
    [-40, 95],
    [-38, 94],
  ]); // far outside the window
  near(run([...old, ...recent]).weeklyRateKg, -0.7, 0.011);
  // The window is 28 days back from the latest reading: entries at -20 and -10 relative to the latest are inside.
  const wide = line([0, 5, 10, 15, 20, 25, 28], 90, -0.2); // inside 28 days, slope -0.2 a day = -1.4 a week
  near(run(wide).weeklyRateKg, -1.4, 0.011);
});

// ------------------------------------------------------------------ 14.3 when to suggest

test('suggest: needs 10 entries over 21 days in the window (9 entries, or 20 days, give nothing)', () => {
  // 0.35 kg/week gain, maintain goal: normally a suggestion.
  assert.ok(run(GAIN_035).suggestion, 'baseline: 12 entries over 22 days suggests');
  const nine = line(range(0, 24, 3), 80, 0.05); // 9 entries over 24 days
  assert.equal(nine.length, 9);
  assert.equal(run(nine).suggestion, null, '9 entries');
  const ten = line([0, 2, 4, 6, 8, 10, 12, 14, 16, 21], 80, 0.05);
  assert.equal(ten.length, 10);
  assert.ok(run(ten).suggestion, 'exactly 10 entries over exactly 21 days');
  const tenShort = line([0, 2, 4, 6, 8, 10, 12, 14, 16, 20], 80, 0.05);
  assert.equal(tenShort.length, 10);
  assert.equal(run(tenShort).suggestion, null, '10 entries over only 20 days');
  // The trend and the rate can show long before a suggestion is allowed.
  const early = run(line([0, 2, 4, 6, 8, 10, 14], 80, 0.05));
  assert.equal(early.showTrend, true);
  assert.notEqual(early.weeklyRateKg, null);
  assert.equal(early.suggestion, null);
});

test('suggest: the rate must differ from the goal pace by MORE than 0.25 kg a week', () => {
  // Maintain, gaining 0.20 a week (0.2 / 7 a day): inside the tolerance.
  const small = line(range(0, 22, 2), 80, 0.2 / 7);
  near(run(small).weeklyRateKg, 0.2, 0.011);
  assert.equal(run(small).suggestion, null, 'difference 0.20');
  // Gain goal 0.25 a week, weight flat: the difference is exactly 0.25, which is not more than 0.25.
  const flat = line(range(0, 22, 2), 80, 0);
  assert.equal(
    run(flat, { goal: 'gain', rateKgPerWeek: 0.25 }).suggestion,
    null,
    'difference exactly 0.25',
  );
  // Gaining 0.30 against maintain is a suggestion.
  assert.ok(run(line(range(0, 22, 2), 80, 0.3 / 7)).suggestion, 'difference 0.30');
});

test('suggest: spec example, goal -0.5 and trend -0.1 gives -440 kcal, capped to -200 a day', () => {
  // 100 kg so that this slow loss is nowhere near the fast-loss line. Slope -0.1/7 a day.
  const e = line(range(0, 22, 2), 100, -0.1 / 7);
  const r = run(e, { goal: 'lose', rateKgPerWeek: 0.5, kcal: 2000, floorKcal: 1500 });
  near(r.weeklyRateKg, -0.1, 0.011);
  assert.ok(r.suggestion);
  assert.equal(r.suggestion.kcalPerDay, -200);
  assert.equal(r.suggestion.newKcal, 1800);
  assert.equal(r.suggestion.fastLoss, false);
});

test('suggest: losing faster than the goal (but below 1% of body weight) suggests eating more', () => {
  // 100 kg, slope -0.9/7 a day = -0.9 a week on a -0.5 goal: difference -0.4 -> +440, capped +200. 1% of 100 kg = 1.0, so not fast.
  const e = line(range(0, 22, 2), 100, -0.9 / 7);
  const r = run(e, { goal: 'lose', rateKgPerWeek: 0.5, kcal: 2000 });
  assert.equal(r.suggestion.kcalPerDay, 200);
  assert.equal(r.suggestion.newKcal, 2200);
  assert.equal(r.suggestion.fastLoss, false);
});

test('suggest: size is a multiple of 50, never more than 200, and the sign follows the difference', () => {
  for (const perWeek of [0.3, 0.4, 0.6, 1.0, -0.3, -0.6]) {
    const r = run(line(range(0, 22, 2), 100, perWeek / 7), { kcal: 2400 });
    if (!r.suggestion) continue;
    const c = r.suggestion.kcalPerDay;
    assert.equal(Math.abs(c) % 50, 0, `rate ${perWeek}: ${c} is a multiple of 50`);
    assert.ok(Math.abs(c) <= 200, `rate ${perWeek}: ${c} within 200`);
    assert.ok(c !== 0);
    // Maintain goal: gaining means eat less, losing means eat more.
    assert.equal(Math.sign(c), perWeek > 0 ? -1 : 1, `rate ${perWeek}: direction`);
    assert.equal(r.suggestion.newKcal, 2400 + c);
  }
});

// ------------------------------------------------------------------ 14.3.4 rails

test('rails: a suggestion never goes under the floor (rounded down to 50, 2400 -> 2350 with a 2310 floor)', () => {
  // Wants -200 (2200) but the floor is 2310: the largest step that stays inside is -50 (2350).
  const r = run(GAIN_035, { kcal: 2400, floorKcal: 2310 });
  assert.equal(r.suggestion.kcalPerDay, -50);
  assert.equal(r.suggestion.newKcal, 2350);
  // A floor exactly on a step: -100 -> 2300 for floor 2300.
  assert.equal(run(GAIN_035, { kcal: 2400, floorKcal: 2300 }).suggestion.newKcal, 2300);
  // At the floor already: the rails leave no room, so no suggestion.
  assert.equal(run(GAIN_035, { kcal: 2400, floorKcal: 2400 }).suggestion, null);
  assert.equal(
    run(GAIN_035, { kcal: 2400, floorKcal: 2380 }).suggestion,
    null,
    'room under one step',
  );
});

test('rails: a suggestion never goes over the surplus ceiling', () => {
  const flat = line(range(0, 22, 2), 80, 0);
  const gain = { goal: 'gain', rateKgPerWeek: 0.5 }; // flat weight against +0.5: wants +200
  assert.equal(run(flat, { ...gain, kcal: 2800, ceilingKcal: 3100 }).suggestion.newKcal, 3000);
  assert.equal(
    run(flat, { ...gain, kcal: 2800, ceilingKcal: 2900 }).suggestion.newKcal,
    2900,
    'only +100 fits',
  );
  assert.equal(
    run(flat, { ...gain, kcal: 2800, ceilingKcal: 2800 }).suggestion,
    null,
    'already at the cap',
  );
});

test('suggestRails: deficit caps and floor, worked by hand (25% of TDEE, 1000 kcal, 1% of body weight a week)', () => {
  // Male, TDEE 2500, 80 kg: caps are 625, 1000 and 0.01*80*7700/7 = 880 -> smallest 625 -> lowest 1875. Floor 1500 is lower. Ceiling 2500*1.2 = 3000.
  assert.deepEqual(suggestRails(RULES, { tdee: 2500, sex: 'male', bodyKg: 80 }), {
    floorKcal: 1875,
    ceilingKcal: 3000,
  });
  // Female, TDEE 1700, 60 kg: 25% = 425, 1% bw = 660 -> 425 -> 1275 (floor 1200 is lower). Ceiling 2040.
  assert.deepEqual(suggestRails(RULES, { tdee: 1700, sex: 'female', bodyKg: 60 }), {
    floorKcal: 1275,
    ceilingKcal: 2040,
  });
  // Female, TDEE 1500, 60 kg: 25% gives 1125, under the 1200 floor -> floor 1200. Ceiling 1800.
  assert.deepEqual(suggestRails(RULES, { tdee: 1500, sex: 'female', bodyKg: 60 }), {
    floorKcal: 1200,
    ceilingKcal: 1800,
  });
  // Female, TDEE 1150: TDEE itself is under the floor, so the target is TDEE (no deficit). Ceiling 1380.
  assert.deepEqual(suggestRails(RULES, { tdee: 1150, sex: 'female', bodyKg: 55 }), {
    floorKcal: 1150,
    ceilingKcal: 1380,
  });
  // Heavy person: 1% bw bites first. Male TDEE 4000, 50 kg -> 0.01*50*1100 = 550 < 1000 and < 1000 (25%) -> 3450.
  assert.equal(suggestRails(RULES, { tdee: 4000, sex: 'male', bodyKg: 50 }).floorKcal, 3450);
  // 1000 kcal cap bites first: TDEE 5000, 120 kg -> caps 1250, 1000, 1320 -> 1000 -> 4000.
  assert.equal(suggestRails(RULES, { tdee: 5000, sex: 'male', bodyKg: 120 }).floorKcal, 4000);
});

// ------------------------------------------------------------------ 14.3.5 fast loss

test('fast loss: losing more than 1% of body weight a week suggests eating more, even within 0.25 of the goal', () => {
  // 80 kg, falling 1.05 a week against a goal of -1.0: difference only -0.05 (inside the tolerance),
  // but 1.05 is more than 1% of 80 kg (0.8), so the app suggests eating more.
  const e = line(range(0, 22, 2), 82, -0.15);
  near(run(e, { goal: 'lose', rateKgPerWeek: 1.0 }).weeklyRateKg, -1.05, 0.011);
  const fast = run(e, { goal: 'lose', rateKgPerWeek: 1.0, kcal: 1900, floorKcal: 1500 });
  assert.ok(fast.suggestion, 'fast loss gives a suggestion');
  assert.equal(fast.suggestion.fastLoss, true);
  assert.ok(fast.suggestion.kcalPerDay > 0 && fast.suggestion.kcalPerDay <= 200);
  assert.equal(fast.suggestion.kcalPerDay % 50, 0);
  // Control: the same difference from the goal without fast loss gives nothing (100 kg: 1% is 1.0, loss 0.55 vs goal 0.5).
  const slow = line(range(0, 22, 2), 100, -0.55 / 7);
  assert.equal(run(slow, { goal: 'lose', rateKgPerWeek: 0.5 }).suggestion, null);
});

test('fast loss: 0.7 kg a week at 80 kg is under the 1% line (0.8) and is not fast', () => {
  const e = line(range(0, 22, 2), 82, -0.1);
  const r = run(e, { goal: 'lose', rateKgPerWeek: 0.7, kcal: 1900 });
  near(r.weeklyRateKg, -0.7, 0.011);
  assert.equal(r.suggestion, null);
});

test('fast loss: never beyond the never-list and never over the ceiling', () => {
  const e = line(range(0, 22, 2), 82, -0.15);
  const ctx = { goal: 'lose', rateKgPerWeek: 1.0, kcal: 1900 };
  assert.equal(run(e, { ...ctx, ramadanMode: true }).suggestion, null);
  assert.equal(run(e, { ...ctx, flags: ['eating_disorder'] }).suggestion, null);
  assert.equal(run(e, { ...ctx, kcal: null }).suggestion, null);
  assert.equal(run(e, { ...ctx, ceilingKcal: 1900 }).suggestion, null, 'no room above');
  assert.equal(
    run(e, { ...ctx, ceilingKcal: 1960 }).suggestion.newKcal,
    1950,
    'only one step fits',
  );
});

// ------------------------------------------------------------------ 14.3.1 cooldown and snooze

test('cooldown: no suggestion within 28 days of a target or goal change (or an accepted suggestion)', () => {
  const today = last(GAIN_035);
  assert.ok(run(GAIN_035).suggestion, 'baseline');
  assert.equal(run(GAIN_035, { changedOn: today }).suggestion, null, 'changed today');
  assert.equal(run(GAIN_035, { changedOn: plus(today, -10) }).suggestion, null, '10 days ago');
  assert.equal(run(GAIN_035, { changedOn: plus(today, -27) }).suggestion, null, '27 days ago');
  assert.ok(run(GAIN_035, { changedOn: plus(today, -29) }).suggestion, '29 days ago is over');
  assert.ok(run(GAIN_035, { changedOn: plus(today, -90) }).suggestion);
});

test('snooze: "Not now" hides the suggestion for 14 days', () => {
  const today = last(GAIN_035);
  assert.equal(run(GAIN_035, { dismissedOn: today }).suggestion, null, 'dismissed today');
  assert.equal(run(GAIN_035, { dismissedOn: plus(today, -13) }).suggestion, null, '13 days ago');
  assert.ok(run(GAIN_035, { dismissedOn: plus(today, -15) }).suggestion, '15 days ago is over');
});

test('cooldown and snooze are independent: a long-ago change does not lift a fresh snooze, and vice versa', () => {
  const today = last(GAIN_035);
  assert.equal(
    run(GAIN_035, { changedOn: plus(today, -60), dismissedOn: plus(today, -3) }).suggestion,
    null,
  );
  assert.equal(
    run(GAIN_035, { changedOn: plus(today, -3), dismissedOn: plus(today, -60) }).suggestion,
    null,
  );
  assert.ok(
    run(GAIN_035, { changedOn: plus(today, -60), dismissedOn: plus(today, -60) }).suggestion,
  );
});

// ------------------------------------------------------------------ 14.4 never suggest

test('never: Ramadan mode', () => {
  assert.ok(run(GAIN_035).suggestion);
  assert.equal(run(GAIN_035, { ramadanMode: true }).suggestion, null);
});

test('never: pregnant, breastfeeding or eating_disorder (any one is enough)', () => {
  for (const flag of ['pregnant', 'breastfeeding', 'eating_disorder'])
    assert.equal(run(GAIN_035, { flags: [flag] }).suggestion, null, flag);
  assert.equal(run(GAIN_035, { flags: ['pregnant', 'diabetes'] }).suggestion, null);
  // Other flags and warnings do not block it.
  assert.ok(run(GAIN_035, { flags: ['kidney_disease', 'estimate'] }).suggestion);
});

test('never: without a personal target (kcal null, undefined or not a number)', () => {
  for (const kcal of [null, undefined, NaN])
    assert.equal(run(GAIN_035, { kcal }).suggestion, null, `kcal ${kcal}`);
});

test('never: the trend and the rate still show for those people (only the suggestion is withheld)', () => {
  const r = run(GAIN_035, { flags: ['eating_disorder'], ramadanMode: true, kcal: null });
  assert.equal(r.showTrend, true);
  near(r.weeklyRateKg, 0.35, 0.011);
});

// ------------------------------------------------------------------ the store: a target changes only on accept

const P1 = {
  sex: 'male',
  ageYears: 31,
  heightCm: 178,
  weightKg: 82,
  activity: 'moderate',
  goal: 'maintain',
  rateKgPerWeek: 0,
  lifts: true,
  healthFlags: [],
};

function memoryBackend() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => void map.set(k, String(v)),
    removeItem: (k) => void map.delete(k),
  };
}

/** A store on Wednesday 14 Oct 2026 with 31 daily weigh-ins gaining 0.4 kg a week. */
function weightStore(profile = P1) {
  let day = new Date(2026, 9, 14, 13, 0);
  let n = 0;
  const store = createStore({
    persistence: createPersistence(memoryBackend(), { stamp: () => 'qa' }),
    rules: RULES,
    foods: [],
    now: () => day,
    makeId: () => `q${++n}`,
    timeZone: 'Europe/Madrid',
    timers: { set: () => 1, clear: () => {} },
  });
  store.completeOnboarding(profile);
  for (let i = 0; i <= 30; i++) {
    store.setWeight(plus('2026-09-14', i), Number((82 + (0.4 / 7) * i).toFixed(3)));
  }
  return { store, setDay: (d) => (day = d) };
}

test('store: reading the trend, logging more weights and tapping "Not now" never change the target', () => {
  const { store } = weightStore();
  const before = store.targets();
  const t = store.weightTrend();
  assert.ok(t.suggestion, 'baseline: a suggestion exists');
  assert.equal(t.suggestion.kcalPerDay, -200, '+0.4 a week against maintain is capped at -200');
  assert.deepEqual(store.targets(), before, 'showing the suggestion changes nothing');
  store.setWeight('2026-10-14', 83.0);
  store.removeWeight('2026-09-20');
  assert.deepEqual(store.targets(), before, 'logging and deleting weights changes nothing');
  assert.deepEqual(store.getState().data.targetOverrides ?? {}, {});
  store.dismissWeightSuggestion();
  assert.deepEqual(store.targets(), before, '"Not now" changes nothing');
  assert.equal(store.weightTrend().suggestion, null, 'and the suggestion goes quiet');
});

test('store: accepting sets the target to the suggested kcal, keeps protein, starts the cooldown, and undo restores it', () => {
  const { store } = weightStore();
  const before = store.targets();
  const s = store.weightTrend().suggestion;
  assert.equal(s.newKcal, before.kcal + s.kcalPerDay);
  assert.equal(store.acceptWeightSuggestion(), true);
  const after = store.targets();
  assert.equal(after.kcal, s.newKcal, 'the target is the suggested number');
  assert.equal(after.protein, before.protein, 'protein stays');
  assert.equal(store.weightTrend().suggestion, null, 'cooldown: no second suggestion');
  assert.equal(store.acceptWeightSuggestion(), false, 'nothing to accept now');
  assert.equal(store.undo(), true);
  assert.deepEqual(store.targets(), before, 'undo restores the old target');
});

test('store: a manual target or goal change starts the 28-day cooldown', () => {
  const { store } = weightStore();
  assert.ok(store.weightTrend().suggestion);
  store.setTargetOverride('kcal', 2500);
  assert.equal(store.weightTrend().suggestion, null);
});

test('store: pregnant and eating_disorder profiles never get a suggestion; skipped onboarding (no personal target) neither', () => {
  const preg = weightStore({ ...P1, sex: 'female', healthFlags: ['pregnant'] });
  assert.equal(preg.store.weightTrend().suggestion, null, 'pregnant');
  assert.equal(preg.store.weightTrend().showTrend, true, 'the trend still shows');
  const bf = weightStore({ ...P1, sex: 'female', healthFlags: ['breastfeeding'] });
  assert.equal(bf.store.weightTrend().suggestion, null, 'breastfeeding');
  const ed = weightStore({ ...P1, healthFlags: ['eating_disorder'] });
  assert.equal(ed.store.weightTrend().suggestion, null, 'eating_disorder');

  let n = 0;
  const skipped = createStore({
    persistence: createPersistence(memoryBackend(), { stamp: () => 'qa' }),
    rules: RULES,
    foods: [],
    now: () => new Date(2026, 9, 14, 13, 0),
    makeId: () => `s${++n}`,
    timeZone: 'Europe/Madrid',
    timers: { set: () => 1, clear: () => {} },
  });
  skipped.skipOnboarding();
  for (let i = 0; i <= 30; i++)
    skipped.setWeight(plus('2026-09-14', i), Number((82 + (0.4 / 7) * i).toFixed(3)));
  assert.equal(skipped.targetKind(), 'reference');
  assert.equal(skipped.weightTrend().suggestion, null, 'no personal target, no suggestion');
});

test('store: Ramadan mode on means no suggestion', (t) => {
  const { store } = weightStore();
  if (typeof store.setRamadanMode !== 'function')
    return t.todo('store.setRamadanMode is not built yet');
  assert.ok(store.weightTrend().suggestion, 'baseline');
  store.setRamadanMode({ on: true, startDate: '2026-10-14' });
  assert.equal(store.weightTrend().suggestion, null);
  store.setRamadanMode({ on: false });
  assert.ok(store.weightTrend().suggestion, 'off again: the suggestion is back');
});
