// Local calendar dates as 'YYYY-MM-DD' strings. Pure: the caller passes `now`.
// Owner: Hamza. Contract: docs/ARCHITECTURE.md §5.2. Step 0 stub: signatures are final.
// Implementation note: do day arithmetic on UTC midnights (Date.UTC) so DST never shifts a day.

const todo = (name) => {
  throw new Error(`not implemented: dates.${name}`);
};

/** @param {unknown} value @returns {boolean} true for a real calendar date 'YYYY-MM-DD' (no 2026-02-30). */
export function isISODate(value) {
  return todo('isISODate');
}

/**
 * The LOCAL "logical" date of `now`: the calendar date, or the previous date when the local time is
 * before `dayStartMinutes`. The store passes settings.dayStartMinutes (default 240 = 04:00, Manager
 * decision 2026-10-13 in team/DECISIONS.md), so a 00:30 toast after dinner still belongs to
 * yesterday. Uses the local Y-M-D and minutes, so a DST change never shifts it.
 * @param {Date} now @param {number} [dayStartMinutes=0] 0..1439 @returns {string} 'YYYY-MM-DD'
 */
export function todayISO(now, dayStartMinutes = 0) {
  return todo('todayISO');
}

/** @param {Date} now @returns {string} local 'YYYY-MM-DDTHH:mm' (for export stamps). */
export function localDateTime(now) {
  return todo('localDateTime');
}

/** @param {Date} now @returns {number} minutes since local midnight, 0..1439. */
export function minutesOfDay(now) {
  return todo('minutesOfDay');
}

/** @param {string} iso @param {number} n integer, may be negative @returns {string} */
export function addDays(iso, n) {
  return todo('addDays');
}

/** @param {string} fromIso @param {string} toIso @returns {number} whole days, to - from. */
export function diffDays(fromIso, toIso) {
  return todo('diffDays');
}

/** @param {string} iso @returns {number} 0 = Sunday ... 6 = Saturday. */
export function dayOfWeek(iso) {
  return todo('dayOfWeek');
}

/** @param {string} iso @param {0|1|6} [weekStartsOn=1] @returns {string} first day of iso's week. */
export function weekStart(iso, weekStartsOn = 1) {
  return todo('weekStart');
}

/** @param {string} iso @param {0|1|6} [weekStartsOn=1] @returns {string[]} 7 dates, in order. */
export function weekDates(iso, weekStartsOn = 1) {
  return todo('weekDates');
}

/**
 * @param {number} year @param {number} month 1..12 @param {0|1|6} [weekStartsOn=1]
 * @returns {(string|null)[][]} rows of exactly 7 cells; null outside the month; 4 to 6 rows.
 */
export function monthGrid(year, month, weekStartsOn = 1) {
  return todo('monthGrid');
}
