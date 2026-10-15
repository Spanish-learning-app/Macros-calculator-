// Author's tests for Sprint 3 wave 2 (Meeting 005): Ramadan mode (NUTRITION.md §12) and protein
// tips (§13). Owner: Lena. Contract: ARCHITECTURE.md §15. Reads the real RULES (rules 1.7.0).
// Clock times are built in the test's own time zone (new Date(y, m, d, h, min)), so the checks hold
// under TZ=Europe/Madrid, Asia/Karachi and America/Los_Angeles alike.
import test from 'node:test';
import assert from 'node:assert/strict';
import { RULES, FOODS } from '../../fixtures/index.js';
import { createStore } from '../../../app/ui/store.js';
import {
  parseTime,
  timeText,
  isRamadanDay,
  ramadanRange,
  ramadanTimes,
  ramadanDayStart,
  loggingDate,
  ramadanSlots,
  sehriProteinGoal,
  ramadanFlagNotes,
  defaultStartDate,
  ramadanModeProblems,
} from '../../../app/core/ramadan.js';
import { proteinTip, sehriTip, tipIdeas, tipsOn, dueCheckpoint } from '../../../app/core/nudges.js';
import {
  defaultData,
  migrate,
  validateUserData,
  serializeExport,
  parseImport,
  mergeImport,
} from '../../../app/core/storage.js';
import { createEntry } from '../../../app/core/days.js';

const MODE = Object.freeze({ on: true, startDate: '2027-02-08' });
const SETTINGS = Object.freeze({ dayStartMinutes: 240, ramadanMode: MODE });
const at = (y, m, d, hh, mm = 0) => new Date(y, m - 1, d, hh, mm);
const hours = (slots) => Object.fromEntries(slots.map((s) => [s.id, s.hours]));

// ------------------------------------------------------------------ Ramadan core

test('times: HH:MM parse and print; the Barcelona table; typed times carry over', () => {
  assert.equal(parseTime('06:22'), 382);
  assert.equal(parseTime('24:00'), null);
  assert.equal(parseTime('6:22'), null);
  assert.equal(timeText(1066), '17:46');
  assert.equal(timeText(-30), '23:30');
  assert.equal(defaultStartDate(RULES), '2027-02-08');

  const feb8 = ramadanTimes('2027-02-08', MODE, RULES);
  assert.deepEqual([feb8.fajr, feb8.maghrib], [382, 1096]); // 06:22, 18:16 (§12.3 table)
  assert.deepEqual(feb8.source, { fajr: 'table', maghrib: 'table' });
  assert.equal(feb8.place, 'Barcelona');

  const typed = { ...MODE, fajr: '06:30', maghrib: '18:20' };
  for (const date of ['2027-02-08', '2027-03-01', '2028-01-28']) {
    const t = ramadanTimes(date, typed, RULES);
    assert.deepEqual([t.fajr, t.maghrib, t.source.fajr], [390, 1100, 'user'], date);
  }
  const outside = ramadanTimes('2028-01-28', MODE, RULES);
  assert.deepEqual([outside.fajr, outside.maghrib, outside.place], [null, null, null]);
});

test('Ramadan days: from the chosen start for 30 days, only while the mode is on', () => {
  assert.deepEqual(ramadanRange(MODE), { start: '2027-02-08', end: '2027-03-09' });
  assert.equal(isRamadanDay('2027-02-07', MODE), false);
  assert.equal(isRamadanDay('2027-02-08', MODE), true);
  assert.equal(isRamadanDay('2027-03-09', MODE), true);
  assert.equal(isRamadanDay('2027-03-10', MODE), false);
  assert.equal(isRamadanDay('2027-02-20', { ...MODE, on: false }), false);
  assert.equal(isRamadanDay('2027-02-20', undefined), false);
});

test('day boundary §12.2: max(01:00, min(04:00, fajr − 2 h)); Barcelona 2027 values', () => {
  const start = (date) => ramadanDayStart(ramadanTimes(date, MODE, RULES).fajr, 240, RULES);
  assert.equal(start('2027-02-08'), 240); // 04:00 until 25 Feb
  assert.equal(start('2027-02-25'), 240); // fajr 06:01
  assert.equal(start('2027-02-26'), 239); // fajr 05:59 → 03:59
  assert.equal(start('2027-03-09'), 222); // fajr 05:42 → 03:42
  assert.equal(ramadanDayStart(null, 240, RULES), 240); // no fajr: the plain rule
  assert.equal(ramadanDayStart(150, 240, RULES), 60); // never before 01:00
  assert.equal(ramadanDayStart(382, 120, RULES), 120); // an earlier personal day start is kept
});

test('loggingDate on Barcelona Feb/Mar 2027 dates: sehri lands on the fasting day', () => {
  // 9 Mar 2027: the boundary is 03:42. Sehri at 03:50 belongs to the new fasting day.
  assert.equal(loggingDate(at(2027, 3, 9, 3, 50), SETTINGS, RULES), '2027-03-09');
  assert.equal(loggingDate(at(2027, 3, 9, 3, 41), SETTINGS, RULES), '2027-03-08');
  // Mode off: the plain 04:00 rule.
  const off = { dayStartMinutes: 240, ramadanMode: { ...MODE, on: false } };
  assert.equal(loggingDate(at(2027, 3, 9, 3, 50), off, RULES), '2027-03-08');
  // 10 Feb 2027: boundary 04:00. After-taraweeh food at 00:30 stays on the day it follows.
  assert.equal(loggingDate(at(2027, 2, 10, 0, 30), SETTINGS, RULES), '2027-02-09');
  assert.equal(loggingDate(at(2027, 2, 10, 3, 59), SETTINGS, RULES), '2027-02-09');
  assert.equal(loggingDate(at(2027, 2, 10, 4, 0), SETTINGS, RULES), '2027-02-10');
  assert.equal(loggingDate(at(2027, 2, 10, 18, 16), SETTINGS, RULES), '2027-02-10');
  // Outside the Ramadan days the normal rule holds.
  assert.equal(loggingDate(at(2027, 3, 11, 3, 50), SETTINGS, RULES), '2027-03-10');
});

test('slots from maghrib §12.1: 8 Feb 2027 (M 18:16) and the fallback hours', () => {
  const feb8 = ramadanSlots(RULES, { maghrib: 1096, dayStart: 240 });
  assert.deepEqual(
    feb8.map((s) => s.id),
    ['sehri', 'iftar', 'after_taraweeh', 'snacks'],
  );
  assert.deepEqual(hours(feb8), {
    sehri: [240, 1066], // 04:00–17:46
    iftar: [1066, 1246], // 17:46–20:46
    after_taraweeh: [1246, 60], // 20:46–01:00
    snacks: [60, 240], // 01:00–04:00
  });
  // 9 Mar: the boundary is 03:42, so sehri and snacks meet there.
  const mar9 = ramadanSlots(RULES, { maghrib: 1131, dayStart: 222 });
  assert.deepEqual([hours(mar9).sehri[0], hours(mar9).snacks[1]], [222, 222]);
  // No maghrib: RULES.mealSlots.ramadan.
  assert.deepEqual(hours(ramadanSlots(RULES)), hours(RULES.mealSlots.ramadan));
});

test('sehri protein goal §12.4 examples, flag notes §12.6', () => {
  assert.equal(sehriProteinGoal(75, 120, RULES), 30);
  assert.equal(sehriProteinGoal(55, 66, RULES), 22);
  assert.equal(sehriProteinGoal(55, null, RULES), null);
  const notes = ramadanFlagNotes(['diabetes_hypo_risk', 'estimate'], RULES);
  assert.deepEqual(
    notes.map((n) => n.id),
    ['diabetes_hypo_risk'],
  );
  assert.match(notes[0].text, /3\.9 mmol\/L/);
  assert.deepEqual(ramadanFlagNotes([], RULES), []);
});

// ------------------------------------------------------------------ protein tips core

const SPAIN = RULES.mealSlots.spain;
const tipInput = (over = {}) => ({
  rules: RULES,
  preset: 'spain',
  slots: SPAIN,
  minutes: 16 * 60 + 45,
  dayStart: 240,
  eaten: 30,
  target: 120,
  entries: 2,
  flags: [],
  nudges: undefined,
  isToday: true,
  today: '2027-02-02',
  ...over,
});

test('tip §13.1 example: target 120 g, Spain, 16:45 — 35 g no tip, 30 g the merienda tip', () => {
  assert.equal(proteinTip(tipInput({ eaten: 35 })), null); // gap 13 g < 15 g
  const tip = proteinTip(tipInput());
  assert.deepEqual(
    { key: tip.key, suggestFor: tip.suggestFor, pct: tip.pct },
    { key: 'spain:lunch', suggestFor: 'evening', pct: 40 },
  );
  assert.equal(proteinTip(tipInput({ minutes: 16 * 60 + 29 })), null); // lunch not over
  const dinner = proteinTip(tipInput({ minutes: 20 * 60 + 30, eaten: 40 }));
  assert.equal(dinner.key, 'spain:evening'); // 50 % of 120 = 60, gap 20
  assert.equal(proteinTip(tipInput({ minutes: 23 * 60 + 59, eaten: 70 })), null); // on track
  assert.equal(proteinTip(tipInput({ minutes: 0 })), null); // dinner window over
});

test('tip gates: once a day, Not today, off switch, flags, no target, no entries, not today', () => {
  const today = '2027-02-02';
  // The once-a-day rule: the merienda tip showed today, so the dinner checkpoint stays quiet…
  const shown = { shownOn: today, shownKey: 'spain:lunch' };
  assert.equal(proteinTip(tipInput({ minutes: 20 * 60 + 30, nudges: shown })), null);
  // …while the same tip keeps showing in its own window, and a new day starts fresh.
  assert.equal(proteinTip(tipInput({ nudges: shown })).key, 'spain:lunch');
  const tomorrow = { ...tipInput({ minutes: 20 * 60 + 30, eaten: 40 }), today: '2027-02-03' };
  assert.equal(proteinTip({ ...tomorrow, nudges: shown }).key, 'spain:evening');

  assert.equal(proteinTip(tipInput({ nudges: { notTodayDate: today } })), null);
  assert.equal(proteinTip(tipInput({ nudges: { notTodayDate: '2027-02-01' } })).key, 'spain:lunch');
  assert.equal(proteinTip(tipInput({ nudges: { off: true } })), null);
  assert.equal(proteinTip(tipInput({ flags: ['kidney_disease'] })), null);
  assert.equal(proteinTip(tipInput({ flags: ['eating_disorder'] })), null); // off by default
  assert.ok(proteinTip(tipInput({ flags: ['eating_disorder'], nudges: { off: false } })));
  assert.equal(proteinTip(tipInput({ target: null })), null);
  assert.equal(proteinTip(tipInput({ entries: 0, eaten: 0 })), null);
  assert.equal(proteinTip(tipInput({ isToday: false })), null);
  assert.equal(tipsOn(undefined, [], RULES), true);
  assert.equal(tipsOn({ notTodayDate: today }, ['eating_disorder'], RULES), false);
});

test('Ramadan checkpoint: after iftar (M + 150) until 01:00, past midnight included', () => {
  const slots = ramadanSlots(RULES, { maghrib: 1096, dayStart: 240 });
  const cps = RULES.proteinNudges.checkpoints.ramadan;
  assert.equal(dueCheckpoint(cps, slots, 1245, 240), null); // 20:45
  assert.equal(dueCheckpoint(cps, slots, 1246, 240).suggestFor, 'after_taraweeh'); // 20:46
  assert.equal(dueCheckpoint(cps, slots, 30, 240).suggestFor, 'after_taraweeh'); // 00:30
  assert.equal(dueCheckpoint(cps, slots, 60, 240), null); // 01:00
  const tip = proteinTip(
    tipInput({ preset: 'ramadan', slots, minutes: 30, eaten: 40, target: 120 }),
  );
  assert.equal(tip.key, 'ramadan:iftar'); // 55 % of 120 = 66, gap 26
});

test('sehri line §12.4: before fajr, under the goal; it is the day’s one tip', () => {
  const base = {
    rules: RULES,
    currentSlot: 'sehri',
    minutes: 5 * 60 + 30,
    fajr: 382,
    sehriEaten: 8,
    goal: 30,
    target: 120,
    flags: [],
    nudges: undefined,
    isToday: true,
    today: '2027-02-08',
  };
  assert.deepEqual(sehriTip(base), { key: 'ramadan:sehri', suggestFor: 'sehri', eaten: 8, goal: 30 });
  assert.equal(sehriTip({ ...base, sehriEaten: 30 }), null);
  assert.equal(sehriTip({ ...base, minutes: 382 }), null); // fajr has come
  assert.equal(sehriTip({ ...base, currentSlot: 'iftar' }), null);
  assert.equal(sehriTip({ ...base, flags: ['kidney_disease'] }), null);
  const used = { shownOn: '2027-02-08', shownKey: 'ramadan:sehri' };
  assert.ok(sehriTip({ ...base, nudges: used }));
  // After the sehri line, no checkpoint tip the same day.
  const slots = ramadanSlots(RULES, { maghrib: 1096, dayStart: 240 });
  const late = { preset: 'ramadan', slots, minutes: 21 * 60, eaten: 30, nudges: used };
  assert.equal(proteinTip(tipInput({ ...late, today: '2027-02-08' })), null);
});

const IDEA_FOODS = new Map(
  [
    ['intl-skyr', 'halal', 'pot', 150, 10.6],
    ['intl-egg-boiled', 'halal', 'egg', 50, 12.6],
    ['pk-shami-kebab', 'halal', 'piece', 60, 20],
    ['es-calamar-plancha', 'check', 'portion', 150, 16.7],
  ].map(([id, status, sid, grams, protein]) => [
    id,
    {
      id,
      name: id,
      halal: { status, ...(status === 'check' ? { reason: 'seafood' } : {}) },
      per100g: { kcal: 100, protein, carbs: 0, fat: 0, fiber: 0 },
      servings: [{ id: sid, label: `1 ${sid}`, grams, default: true }],
    },
  ]),
);

test('ideas §13.3: real servings, recent first, never not-halal, check only when shown', () => {
  const rules = structuredClone(RULES);
  rules.proteinNudges.suggestions.evening = [
    { foodId: 'intl-skyr', servingId: 'pot', qty: 1 },
    { foodId: 'es-calamar-plancha', servingId: 'portion', qty: 1 },
    { foodId: 'intl-egg-boiled', servingId: 'egg', qty: 2 },
    { foodId: 'missing-food', servingId: 'x', qty: 1 },
    { foodId: 'pk-shami-kebab', servingId: 'piece', qty: 1 },
  ];
  const ideas = tipIdeas('evening', rules, { foodIndex: IDEA_FOODS });
  assert.deepEqual(
    ideas.map((i) => i.food.id),
    ['intl-skyr', 'intl-egg-boiled', 'pk-shami-kebab'],
  );
  assert.ok(Math.abs(ideas[1].protein - 12.6) < 1e-9); // 2 eggs × 50 g × 12.6 %
  assert.equal(ideas[1].qty, 2);
  const recent = tipIdeas('evening', rules, {
    foodIndex: IDEA_FOODS,
    recentIds: new Set(['pk-shami-kebab']),
    showCheck: true,
  });
  assert.deepEqual(
    recent.map((i) => i.food.id),
    ['pk-shami-kebab', 'intl-skyr', 'es-calamar-plancha'],
  );
});

test('tip wording has none of RULES.proteinNudges.bannedWords', () => {
  const words = RULES.proteinNudges.bannedWords;
  const texts = [
    ...Object.values(RULES.proteinNudges.text),
    RULES.ramadan.text.sehriProtein,
    RULES.ramadan.text.fluids,
    'Protein tips are off. You can turn them on again in Profile.',
    'Some protein ideas on the Day view when you might want them. Days on track never show one.',
  ];
  for (const text of texts) {
    for (const w of words) {
      assert.ok(!new RegExp(`\\b${w}\\b`, 'i').test(text), `"${w}" in "${text}"`);
    }
  }
});

// ------------------------------------------------------------------ storage (no schema bump)

test('storage: Ramadan entries, day presets and the new settings are valid v1 data', () => {
  const data = defaultData({ rules: RULES, timeZone: 'Europe/Madrid' });
  data.settings.ramadanMode = { on: true, startDate: '2027-02-08', fajr: '06:20' };
  data.settings.nudges = { off: false, notTodayDate: '2027-02-08' };
  const food = {
    id: 'x',
    name: 'X',
    per100g: { kcal: 100, protein: 10, carbs: 0, fat: 0, fiber: 0 },
    servings: [{ id: 'p', label: '1 p', grams: 100, default: true }],
  };
  const e = createEntry({ id: 'e1', slot: 'sehri', food, servingId: 'p', qty: 1 });
  data.days['2027-02-08'] = { date: '2027-02-08', slotPreset: 'ramadan', entries: [e] };
  data.days['2027-02-01'] = {
    date: '2027-02-01',
    slotPreset: 'spain',
    entries: [{ ...e, id: 'e2', slot: 'lunch' }],
  };
  assert.deepEqual(validateUserData(data), []);
  // Export → import (replace and merge) keeps both presets.
  const back = parseImport(serializeExport(data, '2027-02-08T05:00'));
  assert.equal(back.ok, true);
  assert.equal(back.data.days['2027-02-08'].slotPreset, 'ramadan');
  assert.equal(back.data.days['2027-02-01'].slotPreset, 'spain');
  const merged = mergeImport(defaultData(), back.data, 'merge');
  assert.deepEqual(validateUserData(merged), []);
  assert.equal(merged.days['2027-02-08'].entries[0].slot, 'sehri');
  // A day with a preset that does not exist is invalid; older days without one stay valid.
  assert.ok(validateUserData({ ...data, days: { ...data.days, '2027-02-08': { ...data.days['2027-02-08'], slotPreset: 'x' } } }).length);
  const old = structuredClone(data);
  delete old.days['2027-02-01'].slotPreset;
  delete old.settings.ramadanMode;
  delete old.settings.nudges;
  assert.deepEqual(validateUserData(old), []);
});

test('migrate: a broken Ramadan or tips setting falls back to its default, never corrupt', () => {
  const data = defaultData();
  data.settings.ramadanMode = { on: 'yes', startDate: '8 Feb' };
  data.settings.nudges = 'off';
  const out = migrate(data);
  assert.equal(out.settings.ramadanMode, undefined);
  assert.equal(out.settings.nudges, undefined);
  assert.deepEqual(ramadanModeProblems({ on: true, startDate: '2027-02-08', maghrib: '25:00' }), [
    "settings.ramadanMode.maghrib must be 'HH:MM'",
  ]);
});

// ------------------------------------------------------------------ store, fake clock

function makeStore(clock) {
  let n = 0;
  const store = createStore({
    persistence: null,
    rules: RULES,
    foods: FOODS,
    now: () => new Date(clock.now),
    makeId: () => `id${(n += 1)}`,
    timeZone: 'Europe/Madrid',
    timers: { set: () => 0, clear: () => {} },
  });
  store.completeOnboarding({
    sex: 'male',
    ageYears: 35,
    heightCm: 175,
    weightKg: 75,
    activity: 'light',
    goal: 'maintain',
    rateKgPerWeek: 0,
    lifts: false,
    healthFlags: [],
  });
  return store;
}

const fixtureFood = FOODS.find((f) => f.per100g.protein > 5)?.id;

test('store: Ramadan mode switches the day, the slots and the boundary; past days keep theirs', () => {
  const clock = { now: at(2027, 2, 5, 13, 0) };
  const store = makeStore(clock);
  assert.equal(store.today(), '2027-02-05');
  store.addFood({ date: '2027-02-05', slot: 'lunch', foodId: fixtureFood });
  assert.equal(store.day('2027-02-05').slotPreset, 'spain');

  store.setRamadanMode({ on: true });
  assert.equal(store.settings().ramadanMode.startDate, '2027-02-08'); // the table's first day
  assert.equal(store.ramadan('2027-02-08').isDay, true);
  assert.deepEqual(
    store.slots('2027-02-08').map((s) => s.id),
    ['sehri', 'iftar', 'after_taraweeh', 'snacks'],
  );
  assert.equal(store.slotLabel('after_taraweeh'), 'After taraweeh');

  // 9 Mar 2027, 03:50: the Ramadan boundary (03:42) puts sehri on the fasting day.
  clock.now = at(2027, 3, 9, 3, 50);
  assert.equal(store.today(), '2027-03-09');
  assert.equal(store.defaultSlot(), 'sehri');
  store.addFood({ date: '2027-03-09', slot: 'sehri', foodId: fixtureFood });
  assert.equal(store.day('2027-03-09').slotPreset, 'ramadan');
  // 8 Feb, 19:00 (M 18:16): iftar. 23:30: after taraweeh, still 8 Feb.
  clock.now = at(2027, 2, 8, 19, 0);
  assert.equal(store.defaultSlot(), 'iftar');
  clock.now = at(2027, 2, 9, 0, 30);
  assert.equal(store.today(), '2027-02-08');
  assert.equal(store.defaultSlot(), 'after_taraweeh');

  // The day before Ramadan keeps its Spanish meals, mode on or off.
  assert.deepEqual(
    store.slots('2027-02-05').map((s) => s.id),
    ['breakfast', 'lunch', 'evening', 'dinner', 'snacks'],
  );
  // Switch off: a past Ramadan day keeps its Ramadan meals; today follows the everyday times
  // and still shows any Ramadan meal it holds.
  clock.now = at(2027, 3, 9, 12, 0);
  store.setRamadanMode({ on: false });
  assert.equal(store.today(), '2027-03-09');
  clock.now = at(2027, 3, 12, 12, 0);
  assert.deepEqual(
    store.slots('2027-03-09').map((s) => s.id),
    ['sehri', 'iftar', 'after_taraweeh', 'snacks'],
  );
  clock.now = at(2027, 3, 9, 12, 0);
  assert.deepEqual(
    store.slots('2027-03-09').map((s) => s.id),
    ['breakfast', 'lunch', 'evening', 'dinner', 'snacks', 'sehri'],
  );
});

test('store: typed times, fluids line hidden for the day, weight suggestion off', () => {
  const clock = { now: at(2027, 2, 10, 12, 0) };
  const store = makeStore(clock);
  store.setRamadanMode({ on: true, startDate: '2027-02-09', maghrib: '18:30' });
  const info = store.ramadan();
  assert.equal(info.times.maghrib, 1110);
  assert.equal(info.times.source.maghrib, 'user');
  assert.equal(info.times.fajr, 380); // table, 06:20
  assert.match(info.fluids, /6 to 8 glasses/);
  store.hideFluidsToday();
  assert.equal(store.ramadan().fluidsHidden, true);
  clock.now = at(2027, 2, 11, 12, 0);
  assert.equal(store.ramadan().fluidsHidden, false);
  store.setRamadanMode({ maghrib: null });
  assert.equal(store.settings().ramadanMode.maghrib, undefined);
  assert.equal(store.weightTrend().suggestion, null);
});

test('store: protein tip shows once a day, then Not today and Turn off', () => {
  const clock = { now: at(2027, 2, 2, 16, 45) };
  const store = makeStore(clock);
  // A small lunch: well under 40 % of the protein target.
  store.quickAdd({
    date: '2027-02-02',
    slot: 'lunch',
    name: 'Salad',
    nutrients: { kcal: 300, protein: 5 },
  });
  const tip = store.proteinTip('2027-02-02');
  assert.equal(tip.key, 'spain:lunch');
  assert.equal(tip.slotLabel, 'Merienda');
  assert.equal(store.proteinTip('2027-02-01'), null); // only on today
  store.markTipShown(tip.key);
  store.markTipShown(tip.key); // idempotent
  assert.equal(store.settings().nudges.shownOn, '2027-02-02');
  // 20:30: the dinner checkpoint is due, but one tip a day.
  clock.now = at(2027, 2, 2, 20, 30);
  assert.equal(store.proteinTip('2027-02-02'), null);
  // Next day, a new tip; "Not today" hides it; the switch turns tips off.
  clock.now = at(2027, 2, 3, 16, 45);
  store.quickAdd({ date: '2027-02-03', slot: 'lunch', name: 'Soup', nutrients: { kcal: 200 } });
  assert.ok(store.proteinTip('2027-02-03'));
  store.tipNotToday();
  assert.equal(store.proteinTip('2027-02-03'), null);
  clock.now = at(2027, 2, 4, 16, 45);
  store.quickAdd({ date: '2027-02-04', slot: 'lunch', name: 'Soup', nutrients: { kcal: 200 } });
  assert.ok(store.proteinTip('2027-02-04'));
  store.setTipsOn(false);
  assert.equal(store.tipsOn(), false);
  assert.equal(store.proteinTip('2027-02-04'), null);
});

test('store: markTipShown keeps the undo window', () => {
  const clock = { now: at(2027, 2, 2, 16, 45) };
  const store = makeStore(clock);
  const id = store.quickAdd({
    date: '2027-02-02',
    slot: 'lunch',
    name: 'Salad',
    nutrients: { kcal: 300, protein: 5 },
  });
  store.removeEntry('2027-02-02', id);
  assert.ok(store.getState().undo);
  store.markTipShown('spain:lunch');
  assert.ok(store.getState().undo);
});
