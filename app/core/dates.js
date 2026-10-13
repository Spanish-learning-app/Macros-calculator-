// Local calendar dates as 'YYYY-MM-DD' strings. Pure: the caller passes `now`.
// Owner: Hamza. Contract: docs/ARCHITECTURE.md §5.2.
// Day arithmetic runs on UTC midnights (no local Date objects), so DST never shifts a day.

const MS_PER_DAY = 86_400_000;
const MINUTES_PER_DAY = 1440;
const WEEK_STARTS = new Set([0, 1, 6]);
const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad2 = (n) => String(n).padStart(2, '0');
const pad4 = (n) => String(n).padStart(4, '0');

function isLeapYear(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

function daysInMonth(y, m) {
  if (m === 2) return isLeapYear(y) ? 29 : 28;
  return [4, 6, 9, 11].includes(m) ? 30 : 31;
}

/** Days since 1970-01-01 of a UTC calendar date (works for years 0..99 too). */
function dayNumber(y, m, d) {
  const date = new Date(0);
  date.setUTCFullYear(y, m - 1, d);
  return Math.round(date.getTime() / MS_PER_DAY);
}

function fromDayNumber(n) {
  const date = new Date(n * MS_PER_DAY);
  return `${pad4(date.getUTCFullYear())}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

function parseISO(iso, name = 'date') {
  if (typeof iso !== 'string') throw new TypeError(`${name} must be a 'YYYY-MM-DD' string`);
  if (!isISODate(iso)) throw new RangeError(`${name} is not a real date: '${iso}'`);
  const [, y, m, d] = ISO_RE.exec(iso);
  return dayNumber(Number(y), Number(m), Number(d));
}

function checkNow(now) {
  if (!(now instanceof Date)) throw new TypeError('now must be a Date');
  if (Number.isNaN(now.getTime())) throw new RangeError('now is an invalid Date');
}

function checkWeekStart(weekStartsOn) {
  if (!WEEK_STARTS.has(weekStartsOn)) {
    throw new RangeError(`weekStartsOn must be 0, 1 or 6, got ${weekStartsOn}`);
  }
}

function localISO(now) {
  return `${pad4(now.getFullYear())}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

/** @param {unknown} value @returns {boolean} true for a real calendar date 'YYYY-MM-DD' (no 2026-02-30). */
export function isISODate(value) {
  if (typeof value !== 'string') return false;
  const match = ISO_RE.exec(value);
  if (!match) return false;
  const [y, m, d] = match.slice(1).map(Number);
  return m >= 1 && m <= 12 && d >= 1 && d <= daysInMonth(y, m);
}

/**
 * The LOCAL "logical" date of `now`: the calendar date, or the previous date when the local time is
 * before `dayStartMinutes`. The store passes settings.dayStartMinutes (default 240 = 04:00, Manager
 * decision 2026-10-13 in team/DECISIONS.md), so a 00:30 toast after dinner still belongs to
 * yesterday. Uses the local Y-M-D and minutes, so a DST change never shifts it.
 * @param {Date} now @param {number} [dayStartMinutes=0] 0..1439 @returns {string} 'YYYY-MM-DD'
 */
export function todayISO(now, dayStartMinutes = 0) {
  checkNow(now);
  if (
    !Number.isInteger(dayStartMinutes) ||
    dayStartMinutes < 0 ||
    dayStartMinutes >= MINUTES_PER_DAY
  ) {
    throw new RangeError(`dayStartMinutes must be an integer 0..1439, got ${dayStartMinutes}`);
  }
  const date = localISO(now);
  return minutesOfDay(now) < dayStartMinutes ? addDays(date, -1) : date;
}

/** @param {Date} now @returns {string} local 'YYYY-MM-DDTHH:mm' (for export stamps). */
export function localDateTime(now) {
  checkNow(now);
  return `${localISO(now)}T${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
}

/** @param {Date} now @returns {number} minutes since local midnight, 0..1439. */
export function minutesOfDay(now) {
  checkNow(now);
  return now.getHours() * 60 + now.getMinutes();
}

/** @param {string} iso @param {number} n integer, may be negative @returns {string} */
export function addDays(iso, n) {
  const day = parseISO(iso);
  if (!Number.isInteger(n)) throw new RangeError(`n must be an integer, got ${n}`);
  return fromDayNumber(day + n);
}

/** @param {string} fromIso @param {string} toIso @returns {number} whole days, to - from. */
export function diffDays(fromIso, toIso) {
  return parseISO(toIso, 'toIso') - parseISO(fromIso, 'fromIso');
}

/** @param {string} iso @returns {number} 0 = Sunday ... 6 = Saturday. */
export function dayOfWeek(iso) {
  // Day 0 (1970-01-01) was a Thursday (4).
  return (((parseISO(iso) + 4) % 7) + 7) % 7;
}

/** @param {string} iso @param {0|1|6} [weekStartsOn=1] @returns {string} first day of iso's week. */
export function weekStart(iso, weekStartsOn = 1) {
  checkWeekStart(weekStartsOn);
  return addDays(iso, -((dayOfWeek(iso) - weekStartsOn + 7) % 7));
}

/** @param {string} iso @param {0|1|6} [weekStartsOn=1] @returns {string[]} 7 dates, in order. */
export function weekDates(iso, weekStartsOn = 1) {
  const first = weekStart(iso, weekStartsOn);
  return Array.from({ length: 7 }, (_, i) => addDays(first, i));
}

/**
 * @param {number} year @param {number} month 1..12 @param {0|1|6} [weekStartsOn=1]
 * @returns {(string|null)[][]} rows of exactly 7 cells; null outside the month; 4 to 6 rows.
 */
export function monthGrid(year, month, weekStartsOn = 1) {
  if (!Number.isInteger(year) || year < 0 || year > 9999) {
    throw new RangeError(`year must be an integer 0..9999, got ${year}`);
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError(`month must be an integer 1..12, got ${month}`);
  }
  checkWeekStart(weekStartsOn);
  const first = `${pad4(year)}-${pad2(month)}-01`;
  const lead = (dayOfWeek(first) - weekStartsOn + 7) % 7;
  const cells = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth(year, month) }, (_, i) => addDays(first, i)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}
