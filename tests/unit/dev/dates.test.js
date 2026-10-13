// Author tests for app/core/dates.js (ARCHITECTURE §5.2). Owner: Hamza.
// `npm test` runs this file in Europe/Madrid, Asia/Karachi and America/Los_Angeles. Instants are
// built from UTC so each zone gets its own expected local values (Madrid's clocks go back on
// 25 Oct 2026 and forward on 29 Mar 2026; LA's go back on 1 Nov 2026; Karachi never changes).
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isISODate,
  todayISO,
  localDateTime,
  minutesOfDay,
  addDays,
  diffDays,
  dayOfWeek,
  weekStart,
  weekDates,
  monthGrid,
} from '../../../app/core/dates.js';

const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
const utc = (iso) => new Date(Date.parse(iso));

/** Independent oracle: the local wall clock of `date` from Intl, not from dates.js. */
function wallClock(date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
    stamp: `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`,
  };
}

test('isISODate: real calendar dates only', () => {
  for (const ok of ['2026-10-13', '2028-02-29', '2000-02-29', '2026-04-30', '2026-12-31']) {
    assert.equal(isISODate(ok), true, ok);
  }
  const bad = [
    '2026-02-30',
    '2026-02-29',
    '2100-02-29',
    '2026-04-31',
    '2026-13-01',
    '2026-00-10',
    '2026-01-00',
    '2026-1-01',
    '26-01-01',
    '2026-01-01T00:00',
    ' 2026-01-01',
    '2026/01/01',
    '',
    20260101,
    null,
    undefined,
    new Date(0),
    ['2026-01-01'],
  ];
  for (const v of bad) assert.equal(isISODate(v), false, String(v));
});

test('addDays and diffDays: month, year and leap-year boundaries', () => {
  assert.equal(addDays('2026-01-31', 1), '2026-02-01');
  assert.equal(addDays('2026-02-28', 1), '2026-03-01');
  assert.equal(addDays('2028-02-28', 1), '2028-02-29');
  assert.equal(addDays('2028-02-29', 1), '2028-03-01');
  assert.equal(addDays('2028-03-01', -1), '2028-02-29');
  assert.equal(addDays('2028-02-29', 365), '2029-02-28');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2027-01-01', -1), '2026-12-31');
  assert.equal(addDays('2026-10-13', 0), '2026-10-13');
  assert.equal(addDays('2026-10-13', -400), '2025-09-08');
  assert.equal(diffDays('2028-01-01', '2029-01-01'), 366);
  assert.equal(diffDays('2026-01-01', '2027-01-01'), 365);
  assert.equal(diffDays('2026-10-26', '2026-10-19'), -7);
  assert.equal(diffDays('2026-10-13', '2026-10-13'), 0);
});

test('addDays and diffDays across the DST changes (Madrid 29 Mar and 25 Oct, LA 1 Nov)', () => {
  assert.equal(addDays('2026-10-24', 1), '2026-10-25');
  assert.equal(addDays('2026-10-25', 1), '2026-10-26');
  assert.equal(addDays('2026-10-26', -1), '2026-10-25');
  assert.equal(addDays('2026-03-28', 1), '2026-03-29');
  assert.equal(addDays('2026-03-29', 1), '2026-03-30');
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
  assert.equal(addDays('2026-11-01', 1), '2026-11-02');
  assert.equal(diffDays('2026-10-24', '2026-10-26'), 2);
  assert.equal(diffDays('2026-03-28', '2026-03-30'), 2);
  assert.equal(diffDays('2026-10-31', '2026-11-02'), 2);
  // A20 step 4: from 25 Oct, back two days, then forward three.
  const seen = [];
  let d = '2026-10-25';
  for (const step of [-1, -1, 1, 1, 1]) seen.push((d = addDays(d, step)));
  assert.deepEqual(seen, ['2026-10-24', '2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26']);
  // Every day of 2026 once, in order, with no skip or repeat.
  let day = '2026-01-01';
  for (let i = 0; i < 365; i += 1) {
    assert.equal(diffDays('2026-01-01', day), i);
    const next = addDays(day, 1);
    assert.ok(isISODate(next) && next > day, `${day} -> ${next}`);
    day = next;
  }
  assert.equal(day, '2027-01-01');
});

test('addDays, diffDays: bad input', () => {
  assert.throws(() => addDays('2026-02-30', 1), RangeError);
  assert.throws(() => addDays('2026-10-13', 1.5), RangeError);
  assert.throws(() => addDays('2026-10-13', NaN), RangeError);
  assert.throws(() => addDays(null, 1), TypeError);
  assert.throws(() => diffDays('2026-10-13', 'tomorrow'), RangeError);
});

test('dayOfWeek: 0 is Sunday', () => {
  assert.equal(dayOfWeek('2026-10-25'), 0);
  assert.equal(dayOfWeek('2026-10-26'), 1);
  assert.equal(dayOfWeek('2026-10-13'), 2);
  assert.equal(dayOfWeek('2026-08-01'), 6);
  assert.equal(dayOfWeek('2028-02-29'), 2);
});

test('weekStart and weekDates for weekStartsOn 1 (default), 0 and 6', () => {
  assert.equal(weekStart('2026-10-25'), '2026-10-19');
  assert.equal(weekStart('2026-10-19'), '2026-10-19');
  assert.equal(weekStart('2026-10-25', 0), '2026-10-25');
  assert.equal(weekStart('2026-10-24', 0), '2026-10-18');
  assert.equal(weekStart('2026-10-25', 6), '2026-10-24');
  assert.equal(weekStart('2026-10-23', 6), '2026-10-17');
  assert.deepEqual(weekDates('2026-10-13'), [
    '2026-10-12',
    '2026-10-13',
    '2026-10-14',
    '2026-10-15',
    '2026-10-16',
    '2026-10-17',
    '2026-10-18',
  ]);
  assert.deepEqual(weekDates('2026-10-13', 0), [
    '2026-10-11',
    '2026-10-12',
    '2026-10-13',
    '2026-10-14',
    '2026-10-15',
    '2026-10-16',
    '2026-10-17',
  ]);
  assert.deepEqual(weekDates('2026-10-13', 6), [
    '2026-10-10',
    '2026-10-11',
    '2026-10-12',
    '2026-10-13',
    '2026-10-14',
    '2026-10-15',
    '2026-10-16',
  ]);
  // Across a year end.
  assert.deepEqual(weekDates('2027-01-01'), [
    '2026-12-28',
    '2026-12-29',
    '2026-12-30',
    '2026-12-31',
    '2027-01-01',
    '2027-01-02',
    '2027-01-03',
  ]);
  assert.throws(() => weekStart('2026-10-13', 2), RangeError);
  assert.throws(() => weekDates('2026-10-13', 7), RangeError);
});

test('weekDates across the clock changes: 7 distinct dates (A20 step 5)', () => {
  const madrid = weekDates('2026-10-25');
  assert.deepEqual(madrid, [
    '2026-10-19',
    '2026-10-20',
    '2026-10-21',
    '2026-10-22',
    '2026-10-23',
    '2026-10-24',
    '2026-10-25',
  ]);
  assert.equal(new Set(madrid).size, 7);
  assert.equal(weekDates('2026-10-26')[0], '2026-10-26');
  for (const iso of ['2026-03-29', '2026-11-01', '2026-03-08']) {
    for (const ws of [0, 1, 6]) {
      const week = weekDates(iso, ws);
      assert.equal(new Set(week).size, 7, `${iso} ws ${ws}`);
      for (let i = 1; i < 7; i += 1) assert.equal(diffDays(week[i - 1], week[i]), 1);
      assert.ok(week.includes(iso));
      assert.equal(dayOfWeek(week[0]), ws);
    }
  }
});

test('monthGrid: rows of 7, null outside the month, 4 to 6 rows', () => {
  const cases = [
    // [year, month, weekStartsOn, rows]
    [2021, 2, 1, 4], // 1 Feb 2021 is a Monday, 28 days
    [2026, 2, 0, 4], // 1 Feb 2026 is a Sunday
    [2026, 2, 1, 5],
    [2026, 3, 1, 6], // 1 Mar 2026 is a Sunday, 31 days
    [2026, 8, 1, 6], // 1 Aug 2026 is a Saturday
    [2026, 8, 6, 5],
    [2026, 10, 1, 5],
    [2028, 2, 1, 5], // leap February
  ];
  for (const [year, month, ws, rows] of cases) {
    const grid = monthGrid(year, month, ws);
    assert.equal(grid.length, rows, `${year}-${month} ws ${ws}`);
    for (const row of grid) assert.equal(row.length, 7);
    const dates = grid.flat().filter((c) => c !== null);
    const mm = String(month).padStart(2, '0');
    assert.equal(dates[0], `${year}-${mm}-01`);
    for (let i = 1; i < dates.length; i += 1) assert.equal(diffDays(dates[i - 1], dates[i]), 1);
    assert.equal(addDays(dates.at(-1), 1).slice(5, 7), String((month % 12) + 1).padStart(2, '0'));
    assert.ok(dates.every((d) => d.startsWith(`${year}-${mm}-`)));
    // Nulls only before the 1st and after the last day; column = weekday.
    const flat = grid.flat();
    const first = flat.indexOf(dates[0]);
    assert.ok(flat.slice(0, first).every((c) => c === null));
    assert.ok(flat.slice(first + dates.length).every((c) => c === null));
    assert.equal(first, (dayOfWeek(dates[0]) - ws + 7) % 7);
    assert.ok(flat.slice(first + dates.length).length < 7, 'no empty last row');
  }
  assert.equal(monthGrid(2028, 2).flat().filter(Boolean).length, 29);
  assert.equal(monthGrid(2026, 10).flat().filter(Boolean).length, 31);
  assert.deepEqual(monthGrid(2026, 10)[4], [
    '2026-10-26',
    '2026-10-27',
    '2026-10-28',
    '2026-10-29',
    '2026-10-30',
    '2026-10-31',
    null,
  ]);
  assert.throws(() => monthGrid(2026, 13), RangeError);
  assert.throws(() => monthGrid(2026, 0), RangeError);
  assert.throws(() => monthGrid(2026, 1.5), RangeError);
  assert.throws(() => monthGrid(2026, 10, 3), RangeError);
});

test('todayISO, minutesOfDay, localDateTime agree with Intl over the DST weeks', () => {
  const windows = [
    ['2026-03-28T00:00Z', '2026-03-30T23:59Z'],
    ['2026-10-23T00:00Z', '2026-10-27T00:00Z'],
    ['2026-10-31T00:00Z', '2026-11-02T23:59Z'],
  ];
  for (const [from, to] of windows) {
    for (let t = Date.parse(from); t <= Date.parse(to); t += 15 * 60 * 1000) {
      const now = new Date(t);
      const wall = wallClock(now);
      assert.equal(todayISO(now), wall.date, now.toUTCString());
      assert.equal(minutesOfDay(now), wall.minutes, now.toUTCString());
      assert.equal(localDateTime(now), wall.stamp, now.toUTCString());
      const logical = wall.minutes < 240 ? addDays(wall.date, -1) : wall.date;
      assert.equal(todayISO(now, 240), logical, now.toUTCString());
    }
  }
});

test('todayISO with the 04:00 day start (team/DECISIONS.md)', () => {
  // Local wall-clock instants; the constructor is fine here (tests are not app/core).
  const at = (h, m) => new Date(2026, 9, 14, h, m);
  assert.equal(todayISO(at(0, 30), 240), '2026-10-13');
  assert.equal(todayISO(at(3, 59), 240), '2026-10-13');
  assert.equal(todayISO(at(4, 0), 240), '2026-10-14');
  assert.equal(todayISO(at(21, 45), 240), '2026-10-14');
  assert.equal(todayISO(at(0, 30), 0), '2026-10-14');
  assert.equal(todayISO(at(0, 30)), '2026-10-14');
  assert.equal(todayISO(at(0, 0)), '2026-10-14');
  assert.equal(todayISO(at(23, 59), 240), '2026-10-14');
  // Across a month and a year.
  assert.equal(todayISO(new Date(2026, 10, 1, 1, 0), 240), '2026-10-31');
  assert.equal(todayISO(new Date(2027, 0, 1, 2, 0), 240), '2026-12-31');
  assert.equal(todayISO(new Date(2028, 2, 1, 3, 0), 240), '2028-02-29');
  assert.equal(minutesOfDay(at(0, 0)), 0);
  assert.equal(minutesOfDay(at(23, 59)), 1439);
  assert.equal(minutesOfDay(at(4, 0)), 240);
  assert.equal(localDateTime(at(4, 5)), '2026-10-14T04:05');
});

// A20: both 02:30s in Madrid on 25 Oct 2026. Expected local values for each test zone.
const A20 = {
  first: utc('2026-10-25T00:30:00Z'), // 02:30 CEST in Madrid
  second: utc('2026-10-25T01:30:00Z'), // 02:30 CET in Madrid
};
const A20_EXPECTED = {
  'Europe/Madrid': {
    first: { min: 150, day0: '2026-10-25', day240: '2026-10-24', stamp: '2026-10-25T02:30' },
    second: { min: 150, day0: '2026-10-25', day240: '2026-10-24', stamp: '2026-10-25T02:30' },
  },
  'Asia/Karachi': {
    first: { min: 330, day0: '2026-10-25', day240: '2026-10-25', stamp: '2026-10-25T05:30' },
    second: { min: 390, day0: '2026-10-25', day240: '2026-10-25', stamp: '2026-10-25T06:30' },
  },
  'America/Los_Angeles': {
    first: { min: 1050, day0: '2026-10-24', day240: '2026-10-24', stamp: '2026-10-24T17:30' },
    second: { min: 1110, day0: '2026-10-24', day240: '2026-10-24', stamp: '2026-10-24T18:30' },
  },
};

test(
  `A20: the two 02:30s of 25 Oct 2026 (${TZ})`,
  { skip: A20_EXPECTED[TZ] ? false : `no expectations for ${TZ}` },
  () => {
    for (const which of ['first', 'second']) {
      const now = A20[which];
      const want = A20_EXPECTED[TZ][which];
      assert.equal(minutesOfDay(now), want.min, which);
      assert.equal(todayISO(now), want.day0, which);
      assert.equal(todayISO(now, 240), want.day240, which);
      assert.equal(localDateTime(now), want.stamp, which);
    }
    if (TZ === 'Europe/Madrid') {
      // Same answers for both 02:30s; both belong to 24 Oct with the 04:00 day start.
      assert.equal(minutesOfDay(A20.first), minutesOfDay(A20.second));
      assert.equal(todayISO(A20.first, 240), todayISO(A20.second, 240));
      assert.equal(todayISO(A20.first, 240), '2026-10-24');
    }
  },
);

test('Madrid spring forward (29 Mar 2026) and LA fall back (1 Nov 2026)', () => {
  const springGap = utc('2026-03-29T01:30:00Z'); // 03:30 CEST in Madrid (02:xx never happens)
  const laFirst = utc('2026-11-01T08:30:00Z'); // 01:30 PDT in LA
  const laSecond = utc('2026-11-01T09:30:00Z'); // 01:30 PST in LA
  if (TZ === 'Europe/Madrid') {
    assert.equal(minutesOfDay(springGap), 210);
    assert.equal(todayISO(springGap, 240), '2026-03-28');
    assert.equal(todayISO(springGap), '2026-03-29');
  }
  if (TZ === 'America/Los_Angeles') {
    for (const now of [laFirst, laSecond]) {
      assert.equal(minutesOfDay(now), 90);
      assert.equal(todayISO(now), '2026-11-01');
      assert.equal(todayISO(now, 240), '2026-10-31');
    }
  }
  if (TZ === 'Asia/Karachi') {
    assert.equal(minutesOfDay(springGap), 390); // 06:30 PKT, no DST
    assert.equal(minutesOfDay(laFirst), 810); // 13:30 PKT
  }
});

test('todayISO, minutesOfDay, localDateTime: bad input', () => {
  const now = new Date(2026, 9, 14, 12, 0);
  assert.throws(() => todayISO('2026-10-14'), TypeError);
  assert.throws(() => todayISO(Date.parse('2026-10-14')), TypeError);
  assert.throws(() => todayISO(new Date(NaN)), RangeError);
  assert.throws(() => todayISO(now, -1), RangeError);
  assert.throws(() => todayISO(now, 1440), RangeError);
  assert.throws(() => todayISO(now, 30.5), RangeError);
  assert.throws(() => minutesOfDay(null), TypeError);
  assert.throws(() => localDateTime(new Date(NaN)), RangeError);
  assert.equal(todayISO(now, 1439), '2026-10-13');
});
