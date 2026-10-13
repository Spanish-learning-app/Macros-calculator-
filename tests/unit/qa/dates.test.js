// QA tests for app/core/dates.js, written from docs/ARCHITECTURE.md §5.2, team/DECISIONS.md (the
// logging day starts at 04:00) and meeting 002 (Madrid clock change on 25 Oct 2026).
// `npm test` runs this file in Europe/Madrid, Asia/Karachi and America/Los_Angeles. Expectations for
// fixed instants are tabled per zone; property checks use the local Date getters as the oracle.
// Owner: Kenji.
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
import { qa, assertBadInput, assertThrowsKind, TZ } from './_helpers.js';

// ------------------------------------------------------------------ independent oracles
const pad = (n, w = 2) => String(n).padStart(w, '0');
const isoUTC = (ms) => {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};
const utcOf = (iso) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
const DAY = 86400000;
const oracleLocal = (d) => ({
  date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
  minutes: d.getHours() * 60 + d.getMinutes(),
  stamp: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`,
});
const oracleToday = (d, start) => {
  const { date, minutes } = oracleLocal(d);
  return minutes < start ? isoUTC(utcOf(date) - DAY) : date;
};
const datesBetween = (from, to) => {
  const out = [];
  for (let t = utcOf(from); t <= utcOf(to); t += DAY) out.push(isoUTC(t));
  return out;
};

// ------------------------------------------------------------------ fixed instants per zone
// [localDateTime, minutesOfDay, todayISO(now, 0), todayISO(now, 240)]
const INSTANTS = {
  'M1 first 02:30 on 25 Oct (CEST)': '2026-10-25T00:30:00Z',
  'M2 second 02:30 on 25 Oct (CET)': '2026-10-25T01:30:00Z',
  'M3 03:30 CET on 25 Oct': '2026-10-25T02:30:00Z',
  'M4 04:00 CET on 25 Oct': '2026-10-25T03:00:00Z',
  'M5 23:59 CET on 25 Oct': '2026-10-25T22:59:00Z',
  'S1 03:30 CEST on 29 Mar (spring forward)': '2026-03-29T01:30:00Z',
  'S2 04:30 CEST on 29 Mar': '2026-03-29T02:30:00Z',
  'L1 first 01:30 in LA on 1 Nov (PDT)': '2026-11-01T08:30:00Z',
  'L2 second 01:30 in LA on 1 Nov (PST)': '2026-11-01T09:30:00Z',
  'L3 03:30 PST on 1 Nov': '2026-11-01T11:30:00Z',
  'L4 04:00 PST on 1 Nov': '2026-11-01T12:00:00Z',
};
const EXPECTED = {
  'Europe/Madrid': {
    M1: ['2026-10-25T02:30', 150, '2026-10-25', '2026-10-24'],
    M2: ['2026-10-25T02:30', 150, '2026-10-25', '2026-10-24'],
    M3: ['2026-10-25T03:30', 210, '2026-10-25', '2026-10-24'],
    M4: ['2026-10-25T04:00', 240, '2026-10-25', '2026-10-25'],
    M5: ['2026-10-25T23:59', 1439, '2026-10-25', '2026-10-25'],
    S1: ['2026-03-29T03:30', 210, '2026-03-29', '2026-03-28'],
    S2: ['2026-03-29T04:30', 270, '2026-03-29', '2026-03-29'],
    L1: ['2026-11-01T09:30', 570, '2026-11-01', '2026-11-01'],
    L2: ['2026-11-01T10:30', 630, '2026-11-01', '2026-11-01'],
    L3: ['2026-11-01T12:30', 750, '2026-11-01', '2026-11-01'],
    L4: ['2026-11-01T13:00', 780, '2026-11-01', '2026-11-01'],
  },
  'Asia/Karachi': {
    M1: ['2026-10-25T05:30', 330, '2026-10-25', '2026-10-25'],
    M2: ['2026-10-25T06:30', 390, '2026-10-25', '2026-10-25'],
    M3: ['2026-10-25T07:30', 450, '2026-10-25', '2026-10-25'],
    M4: ['2026-10-25T08:00', 480, '2026-10-25', '2026-10-25'],
    M5: ['2026-10-26T03:59', 239, '2026-10-26', '2026-10-25'],
    S1: ['2026-03-29T06:30', 390, '2026-03-29', '2026-03-29'],
    S2: ['2026-03-29T07:30', 450, '2026-03-29', '2026-03-29'],
    L1: ['2026-11-01T13:30', 810, '2026-11-01', '2026-11-01'],
    L2: ['2026-11-01T14:30', 870, '2026-11-01', '2026-11-01'],
    L3: ['2026-11-01T16:30', 990, '2026-11-01', '2026-11-01'],
    L4: ['2026-11-01T17:00', 1020, '2026-11-01', '2026-11-01'],
  },
  'America/Los_Angeles': {
    M1: ['2026-10-24T17:30', 1050, '2026-10-24', '2026-10-24'],
    M2: ['2026-10-24T18:30', 1110, '2026-10-24', '2026-10-24'],
    M3: ['2026-10-24T19:30', 1170, '2026-10-24', '2026-10-24'],
    M4: ['2026-10-24T20:00', 1200, '2026-10-24', '2026-10-24'],
    M5: ['2026-10-25T15:59', 959, '2026-10-25', '2026-10-25'],
    S1: ['2026-03-28T18:30', 1110, '2026-03-28', '2026-03-28'],
    S2: ['2026-03-28T19:30', 1170, '2026-03-28', '2026-03-28'],
    L1: ['2026-11-01T01:30', 90, '2026-11-01', '2026-10-31'],
    L2: ['2026-11-01T01:30', 90, '2026-11-01', '2026-10-31'],
    L3: ['2026-11-01T03:30', 210, '2026-11-01', '2026-10-31'],
    L4: ['2026-11-01T04:00', 240, '2026-11-01', '2026-11-01'],
  },
};

const table = EXPECTED[TZ];
for (const [label, utc] of Object.entries(INSTANTS)) {
  const key = label.slice(0, 2);
  const now = new Date(utc);
  const expected =
    table?.[key] ??
    (() => {
      const o = oracleLocal(now);
      return [o.stamp, o.minutes, oracleToday(now, 0), oracleToday(now, 240)];
    })();
  qa(
    `[${TZ}] ${label}: localDateTime, minutesOfDay, todayISO(0) and todayISO(240)`,
    [localDateTime, minutesOfDay, todayISO],
    () => {
      const [stamp, minutes, today0, today240] = expected;
      assert.equal(localDateTime(now), stamp, 'localDateTime');
      assert.equal(minutesOfDay(now), minutes, 'minutesOfDay is wall-clock minutes');
      assert.equal(todayISO(now, 0), today0, 'todayISO(now, 0)');
      assert.equal(todayISO(now), today0, 'todayISO(now) defaults to the calendar date');
      assert.equal(todayISO(now, 240), today240, 'todayISO(now, 240)');
    },
  );
}

qa(
  `[${TZ}] the oracle table matches this zone's Date getters (guards the table itself)`,
  [],
  () => {
    if (!table) return;
    for (const [label, utc] of Object.entries(INSTANTS)) {
      const o = oracleLocal(new Date(utc));
      const [stamp, minutes] = table[label.slice(0, 2)];
      assert.equal(o.stamp, stamp, label);
      assert.equal(o.minutes, minutes, label);
    }
  },
);

// ------------------------------------------------------------------ logical day (DECISIONS.md)
qa(
  'todayISO: 00:30 and 03:59 belong to the previous day when the day starts at 04:00',
  [todayISO],
  () => {
    assert.equal(todayISO(new Date(2026, 9, 14, 0, 30), 240), '2026-10-13');
    assert.equal(todayISO(new Date(2026, 9, 14, 3, 59), 240), '2026-10-13');
    assert.equal(todayISO(new Date(2026, 9, 14, 4, 0), 240), '2026-10-14');
    assert.equal(todayISO(new Date(2026, 9, 14, 23, 59), 240), '2026-10-14');
    assert.equal(todayISO(new Date(2026, 9, 14, 0, 0), 240), '2026-10-13');
  },
);

qa('todayISO: with dayStartMinutes 0, food lands on the calendar date', [todayISO], () => {
  assert.equal(todayISO(new Date(2026, 9, 14, 0, 0), 0), '2026-10-14');
  assert.equal(todayISO(new Date(2026, 9, 14, 0, 30), 0), '2026-10-14');
  assert.equal(todayISO(new Date(2026, 9, 14, 3, 59), 0), '2026-10-14');
  assert.equal(todayISO(new Date(2026, 9, 13, 23, 59), 0), '2026-10-13');
});

qa('todayISO: the 05:00 maximum (300) and month/year boundaries', [todayISO], () => {
  assert.equal(todayISO(new Date(2026, 9, 14, 4, 59), 300), '2026-10-13');
  assert.equal(todayISO(new Date(2026, 9, 14, 5, 0), 300), '2026-10-14');
  assert.equal(todayISO(new Date(2027, 0, 1, 0, 30), 240), '2026-12-31', 'New Year night');
  assert.equal(todayISO(new Date(2026, 2, 1, 1, 0), 240), '2026-02-28', 'end of February');
  assert.equal(todayISO(new Date(2024, 2, 1, 1, 0), 240), '2024-02-29', 'leap day');
  assert.equal(todayISO(new Date(2026, 10, 1, 2, 0), 240), '2026-10-31');
});

qa(
  `[${TZ}] todayISO/minutesOfDay/localDateTime every 15 min across the 2026 DST weekends`,
  [todayISO, minutesOfDay, localDateTime],
  () => {
    const windows = [
      ['2026-03-27T00:00:00Z', '2026-03-31T00:00:00Z'],
      ['2026-10-23T00:00:00Z', '2026-10-27T00:00:00Z'],
      ['2026-10-30T00:00:00Z', '2026-11-03T00:00:00Z'],
      ['2026-12-31T00:00:00Z', '2027-01-02T00:00:00Z'],
    ];
    for (const [from, to] of windows) {
      for (let t = Date.parse(from); t < Date.parse(to); t += 15 * 60000) {
        const now = new Date(t);
        const o = oracleLocal(now);
        const at = now.toISOString();
        assert.equal(minutesOfDay(now), o.minutes, `minutesOfDay at ${at}`);
        assert.ok(minutesOfDay(now) >= 0 && minutesOfDay(now) <= 1439, `range at ${at}`);
        assert.equal(localDateTime(now), o.stamp, `localDateTime at ${at}`);
        for (const start of [0, 240, 300]) {
          assert.equal(
            todayISO(now, start),
            oracleToday(now, start),
            `todayISO(${start}) at ${at}`,
          );
        }
      }
    }
  },
);

qa('localDateTime pads to YYYY-MM-DDTHH:mm, midnight is 00:00', [localDateTime], () => {
  assert.equal(localDateTime(new Date(2026, 0, 5, 7, 3)), '2026-01-05T07:03');
  assert.equal(localDateTime(new Date(2026, 9, 13, 0, 0)), '2026-10-13T00:00');
  assert.equal(localDateTime(new Date(2026, 9, 13, 21, 30, 59)), '2026-10-13T21:30');
});

qa('minutesOfDay: 0 at midnight, 1439 at 23:59, 810 at 13:30', [minutesOfDay], () => {
  assert.equal(minutesOfDay(new Date(2026, 9, 13, 0, 0)), 0);
  assert.equal(minutesOfDay(new Date(2026, 9, 13, 23, 59, 59)), 1439);
  assert.equal(minutesOfDay(new Date(2026, 9, 13, 13, 30)), 810);
});

// ------------------------------------------------------------------ isISODate
qa('isISODate accepts only real YYYY-MM-DD dates', [isISODate], () => {
  for (const ok of ['2026-10-13', '2024-02-29', '2026-12-31', '2000-02-29', '2026-10-25']) {
    assert.equal(isISODate(ok), true, ok);
  }
  const bad = [
    '2026-02-30',
    '2026-02-29',
    '1900-02-29',
    '2026-13-01',
    '2026-00-10',
    '2026-04-31',
    '2026-10-00',
    '2026-1-1',
    '26-10-13',
    '2026/10/13',
    '2026-10-13T00:00',
    ' 2026-10-13',
    '2026-10-13 ',
    '',
    20261013,
    null,
    undefined,
    {},
    new Date(2026, 9, 13),
  ];
  for (const v of bad) assert.equal(isISODate(v), false, String(v));
});

// ------------------------------------------------------------------ addDays / diffDays
qa('addDays crosses DST, months, years and leap days by whole days', [addDays], () => {
  assert.equal(addDays('2026-10-24', 1), '2026-10-25');
  assert.equal(addDays('2026-10-25', 1), '2026-10-26', 'the 25-hour Madrid day');
  assert.equal(addDays('2026-10-26', -2), '2026-10-24');
  assert.equal(addDays('2026-03-28', 1), '2026-03-29');
  assert.equal(addDays('2026-03-29', 1), '2026-03-30', 'the 23-hour Madrid day');
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
  assert.equal(addDays('2026-11-01', 1), '2026-11-02', 'the 25-hour LA day');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2027-01-01', -1), '2026-12-31');
  assert.equal(addDays('2024-02-28', 1), '2024-02-29');
  assert.equal(addDays('2026-02-28', 1), '2026-03-01');
  assert.equal(addDays('2026-10-13', 0), '2026-10-13');
  assert.equal(addDays('2026-10-13', 365), '2027-10-13');
  assert.equal(addDays('2026-10-13', -366), '2025-10-12');
});

qa(
  'A20 step 4: from 25 Oct back two days, then forward three, nothing skipped or repeated',
  [addDays],
  () => {
    const seen = [];
    let d = '2026-10-25';
    for (const step of [-1, -1, 1, 1, 1]) {
      d = addDays(d, step);
      seen.push(d);
    }
    assert.deepEqual(seen, ['2026-10-24', '2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26']);
  },
);

qa(`[${TZ}] property: addDays(addDays(d, n), -n) === d for every date 2024–2028`, [addDays], () => {
  const all = datesBetween('2024-01-01', '2028-12-31');
  for (const d of all) {
    for (const n of [1, 7, 30, -1, 365, -400]) {
      const there = addDays(d, n);
      assert.equal(there, isoUTC(utcOf(d) + n * DAY), `addDays(${d}, ${n})`);
      assert.equal(addDays(there, -n), d, `round trip ${d} ${n}`);
    }
  }
});

qa(
  `[${TZ}] property: stepping one day at a time visits every date 2024–2028 once`,
  [addDays],
  () => {
    const all = datesBetween('2024-01-01', '2028-12-31');
    let d = all[0];
    for (let i = 1; i < all.length; i++) {
      d = addDays(d, 1);
      assert.equal(d, all[i]);
    }
  },
);

qa('diffDays is to − from in whole days, across DST and leap years', [diffDays], () => {
  assert.equal(diffDays('2026-10-24', '2026-10-26'), 2);
  assert.equal(diffDays('2026-10-26', '2026-10-24'), -2);
  assert.equal(diffDays('2026-03-28', '2026-03-30'), 2, '47 real hours');
  assert.equal(diffDays('2026-03-29', '2026-03-30'), 1, '23 real hours');
  assert.equal(diffDays('2026-10-25', '2026-10-26'), 1, '25 real hours');
  assert.equal(diffDays('2026-10-31', '2026-11-02'), 2);
  assert.equal(diffDays('2026-01-01', '2027-01-01'), 365);
  assert.equal(diffDays('2024-01-01', '2025-01-01'), 366);
  assert.equal(diffDays('2026-10-13', '2026-10-13'), 0);
  const d = diffDays('2026-03-01', '2026-10-25');
  assert.ok(Number.isInteger(d) && d === 238, `whole days, got ${d}`);
});

qa(`[${TZ}] property: diffDays(d, addDays(d, n)) === n`, [diffDays, addDays], () => {
  for (const d of datesBetween('2025-12-01', '2027-01-31')) {
    for (const n of [-31, -1, 0, 1, 2, 7, 45])
      assert.equal(diffDays(d, addDays(d, n)), n, `${d} ${n}`);
  }
});

qa('addDays and diffDays refuse bad input', [addDays, diffDays], () => {
  assertBadInput(() => addDays('2026-02-30', 1), 'impossible date');
  assertBadInput(() => addDays('13/10/2026', 1), 'wrong format');
  assertBadInput(() => addDays(null, 1), 'null');
  assertThrowsKind(() => addDays('2026-10-13', NaN), RangeError, 'NaN days');
  assertThrowsKind(() => addDays('2026-10-13', Infinity), RangeError, 'Infinity days');
  assertThrowsKind(() => addDays('2026-10-13', 1.5), RangeError, 'whole days only');
  assertBadInput(() => diffDays('nope', '2026-10-13'), 'diffDays from');
  assertBadInput(() => diffDays('2026-10-13', '2026-02-30'), 'diffDays to');
});

// ------------------------------------------------------------------ weeks and months
qa('dayOfWeek: 0 is Sunday', [dayOfWeek], () => {
  const cases = {
    '2026-10-13': 2,
    '2026-10-24': 6,
    '2026-10-25': 0,
    '2026-10-26': 1,
    '2026-03-29': 0,
    '2026-11-01': 0,
    '2000-01-01': 6,
    '2024-02-29': 4,
    '2027-01-01': 5,
  };
  for (const [iso, dow] of Object.entries(cases)) assert.equal(dayOfWeek(iso), dow, iso);
});

qa('weekStart: Monday by default; Sunday (0) and Saturday (6) on request', [weekStart], () => {
  assert.equal(weekStart('2026-10-25'), '2026-10-19', 'Sunday 25 Oct → Monday 19');
  assert.equal(weekStart('2026-10-26'), '2026-10-26');
  assert.equal(weekStart('2026-10-13'), '2026-10-12');
  assert.equal(weekStart('2027-01-01'), '2026-12-28', 'across the year');
  assert.equal(weekStart('2026-10-25', 1), '2026-10-19');
  assert.equal(weekStart('2026-10-25', 0), '2026-10-25');
  assert.equal(weekStart('2026-10-13', 0), '2026-10-11');
  assert.equal(weekStart('2026-10-25', 6), '2026-10-24');
  assert.equal(weekStart('2026-10-13', 6), '2026-10-10');
  assert.equal(weekStart.length, 1);
});

qa(
  'A20 step 5: the week of 25 Oct is Mon 19 – Sun 25 (7 days), the next starts Mon 26',
  [weekDates],
  () => {
    assert.deepEqual(weekDates('2026-10-25'), datesBetween('2026-10-19', '2026-10-25'));
    assert.deepEqual(weekDates('2026-10-26'), datesBetween('2026-10-26', '2026-11-01'));
    assert.deepEqual(
      weekDates('2026-11-01'),
      datesBetween('2026-10-26', '2026-11-01'),
      'LA change week',
    );
    assert.deepEqual(
      weekDates('2026-03-29'),
      datesBetween('2026-03-23', '2026-03-29'),
      'spring week',
    );
    assert.deepEqual(weekDates('2026-10-25', 0), datesBetween('2026-10-25', '2026-10-31'));
    assert.deepEqual(weekDates('2026-10-25', 6), datesBetween('2026-10-24', '2026-10-30'));
  },
);

qa(
  `[${TZ}] property: weekDates gives 7 consecutive dates containing the day`,
  [weekDates, weekStart],
  () => {
    for (const iso of datesBetween('2026-09-01', '2027-01-15')) {
      for (const ws of [0, 1, 6]) {
        const week = weekDates(iso, ws);
        assert.equal(week.length, 7, `${iso} ${ws}`);
        assert.ok(week.includes(iso), `${iso} in its week (${ws})`);
        assert.equal(week[0], weekStart(iso, ws));
        assert.equal(new Date(utcOf(week[0])).getUTCDay(), ws, `${iso}: week starts on ${ws}`);
        for (let i = 1; i < 7; i++) assert.equal(utcOf(week[i]) - utcOf(week[i - 1]), DAY);
      }
    }
  },
);

function checkGrid(grid, year, month, ws, rows) {
  const label = `${year}-${pad(month)} ws=${ws}`;
  assert.equal(grid.length, rows, `${label}: ${rows} rows`);
  for (const row of grid) assert.equal(row.length, 7, `${label}: 7 cells per row`);
  const cells = grid.flat();
  const days = cells.filter((c) => c !== null);
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  assert.deepEqual(
    days,
    datesBetween(`${year}-${pad(month)}-01`, `${year}-${pad(month)}-${pad(last)}`),
    label,
  );
  const first = cells.indexOf(days[0]);
  assert.ok(
    cells.slice(0, first).every((c) => c === null),
    `${label}: leading nulls`,
  );
  assert.ok(
    cells.slice(first + days.length).every((c) => c === null),
    `${label}: trailing nulls`,
  );
  grid.forEach((row) =>
    row.forEach((cell, col) => {
      if (cell !== null)
        assert.equal(new Date(utcOf(cell)).getUTCDay(), (ws + col) % 7, `${cell} column`);
    }),
  );
  assert.ok(
    grid[0].some((c) => c !== null) && grid.at(-1).some((c) => c !== null),
    `${label}: no empty rows`,
  );
}

qa(
  'monthGrid: rows of 7, null outside the month, 4 to 6 rows (month is 1..12)',
  [monthGrid],
  () => {
    checkGrid(monthGrid(2026, 10), 2026, 10, 1, 5);
    checkGrid(monthGrid(2026, 2), 2026, 2, 1, 5);
    checkGrid(monthGrid(2026, 2, 0), 2026, 2, 0, 4);
    checkGrid(monthGrid(2021, 2), 2021, 2, 1, 4);
    checkGrid(monthGrid(2026, 8), 2026, 8, 1, 6);
    checkGrid(monthGrid(2026, 10, 6), 2026, 10, 6, 6);
    assert.deepEqual(monthGrid(2026, 10)[0], [
      null,
      null,
      null,
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
      '2026-10-04',
    ]);
    for (let m = 1; m <= 12; m++) {
      for (const ws of [0, 1, 6]) {
        const grid = monthGrid(2027, m, ws);
        assert.ok(grid.length >= 4 && grid.length <= 6, `2027-${m} ws=${ws}: ${grid.length} rows`);
        checkGrid(grid, 2027, m, ws, grid.length);
      }
    }
  },
);

qa('monthGrid refuses a month outside 1..12', [monthGrid], () => {
  assertThrowsKind(() => monthGrid(2026, 0), RangeError, 'month 0');
  assertThrowsKind(() => monthGrid(2026, 13), RangeError, 'month 13');
});
