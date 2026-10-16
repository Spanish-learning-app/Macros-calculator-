// Ramadan mode (NUTRITION.md §12, DECISIONS 2026-10-15 "Ramadan mode storage"). Pure: no clock,
// no storage. Owner: Lena. Contract: docs/ARCHITECTURE.md §15.
//
// settings.ramadanMode = { on: boolean, startDate: 'YYYY-MM-DD', fajr?: 'HH:MM', maghrib?: 'HH:MM',
//   fajrOffsetMin?: integer, maghribOffsetMin?: integer,
//   days?: { 'YYYY-MM-DD': { fajr?: 'HH:MM', maghrib?: 'HH:MM' } } }
// - on/off and the start date are the person's own choice (Katori makes no moon-sighting claim).
// - fajr/maghrib, when typed, apply to every Ramadan day ("a typed time carries over"); without
//   them the built-in Barcelona 2027 table is used for dates inside it, and the RULES fallback
//   hours anywhere else.
// - STATUS O12, RULES.ramadan.userEdit: the offsets move the table's times to match a mosque
//   timetable (clamped to offsetMinRange), and `days` changes one day's times (perDayOverride).
//   Order: that day's own time, then the every-day time, then the table plus the offset.
// It never changes the kcal or macro targets.

import { isISODate, addDays, todayISO, minutesOfDay } from './dates.js';

/** Ramadan days counted from the start date (29 or 30 fasts; the person switches the mode off). */
export const RAMADAN_DAYS = 30;
export const RAMADAN_SLOT_IDS = Object.freeze(['sehri', 'iftar', 'after_taraweeh', 'snacks']);

const MINUTES = 1440;
const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const mod = (m) => ((m % MINUTES) + MINUTES) % MINUTES;

/** @param {unknown} text 'HH:MM' (24 h) @returns {number|null} minutes since midnight */
export function parseTime(text) {
  const m = typeof text === 'string' ? HHMM.exec(text.trim()) : null;
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** @param {number} minutes @returns {string} 'HH:MM' */
export function timeText(minutes) {
  const m = mod(Math.round(minutes));
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** @param {unknown} mode settings.ramadanMode @returns {string[]} problems; [] = valid or absent */
export function ramadanModeProblems(mode) {
  if (mode === undefined) return [];
  if (!isObject(mode)) return ['settings.ramadanMode must be an object'];
  const p = [];
  if (typeof mode.on !== 'boolean') p.push('settings.ramadanMode.on must be true or false');
  if (!isISODate(mode.startDate)) p.push('settings.ramadanMode.startDate must be a date');
  for (const key of ['fajr', 'maghrib']) {
    if (mode[key] !== undefined && mode[key] !== null && parseTime(mode[key]) === null) {
      p.push(`settings.ramadanMode.${key} must be 'HH:MM'`);
    }
  }
  p.push(...ramadanEditProblems(mode));
  return p;
}

const OFFSET_KEYS = Object.freeze({ fajr: 'fajrOffsetMin', maghrib: 'maghribOffsetMin' });
/** Stored offsets beyond this are broken data, whatever RULES allows (it clamps further). */
const OFFSET_HARD_MAX = 180;

/** Problems in the optional edit fields only (offsets and per-day times). */
function ramadanEditProblems(mode) {
  const p = [];
  for (const key of Object.values(OFFSET_KEYS)) {
    const v = mode[key];
    if (v === undefined || v === null) continue;
    if (!Number.isInteger(v) || Math.abs(v) > OFFSET_HARD_MAX) {
      p.push(`settings.ramadanMode.${key} must be a whole number of minutes`);
    }
  }
  if (mode.days !== undefined) {
    if (!isObject(mode.days)) p.push('settings.ramadanMode.days must be an object');
    else {
      for (const [date, times] of Object.entries(mode.days)) {
        const ok =
          isISODate(date) &&
          isObject(times) &&
          ['fajr', 'maghrib'].every((k) => times[k] === undefined || parseTime(times[k]) !== null);
        if (!ok) p.push(`settings.ramadanMode.days.${date} must hold 'HH:MM' times`);
      }
    }
  }
  return p;
}

/**
 * A stored Ramadan mode with its broken optional parts removed (a bad typed time, offset or day),
 * or null when the mode itself (on, startDate) is broken. Migrate uses it: never 'corrupt'.
 * @param {unknown} mode @returns {object|null|undefined} undefined when absent
 */
export function cleanRamadanMode(mode) {
  if (mode === undefined) return undefined;
  if (!isObject(mode) || typeof mode.on !== 'boolean' || !isISODate(mode.startDate)) return null;
  const out = { ...mode };
  for (const key of ['fajr', 'maghrib']) {
    if (out[key] == null || parseTime(out[key]) === null) delete out[key];
  }
  for (const key of Object.values(OFFSET_KEYS)) {
    if (out[key] == null || !Number.isInteger(out[key]) || Math.abs(out[key]) > OFFSET_HARD_MAX) {
      delete out[key];
    }
  }
  if (out.days !== undefined) {
    const days = {};
    for (const [date, times] of Object.entries(isObject(out.days) ? out.days : {})) {
      if (!isISODate(date) || !isObject(times)) continue;
      const kept = {};
      for (const k of ['fajr', 'maghrib']) if (parseTime(times[k]) !== null) kept[k] = times[k];
      if (Object.keys(kept).length) days[date] = kept;
    }
    if (Object.keys(days).length) out.days = days;
    else delete out.days;
  }
  return ramadanModeProblems(out).length ? null : out;
}

/**
 * RULES.ramadan.userEdit, read defensively: the offset range (null = no offset edit) and whether
 * one day's times can be changed.
 * @returns {{ offset: { min: number, max: number }|null, perDay: boolean }}
 */
export function ramadanEditRules(rules) {
  const e = rules?.ramadan?.userEdit;
  const r = isObject(e) ? e.offsetMinRange : null;
  const offset =
    isObject(r) && Number.isInteger(r.min) && Number.isInteger(r.max) && r.min <= 0 && r.max >= 0
      ? { min: r.min, max: r.max }
      : null;
  return { offset, perDay: isObject(e) && e.perDayOverride === true };
}

/** The offset (minutes) the person set for `key`, clamped to RULES; 0 when none or not allowed. */
export function ramadanOffset(mode, key, rules) {
  const range = ramadanEditRules(rules).offset;
  const v = mode?.[OFFSET_KEYS[key]];
  if (!range || !Number.isInteger(v)) return 0;
  return Math.min(range.max, Math.max(range.min, v));
}

/** The first table's expected first fast (the start date's default), or null. */
export function defaultStartDate(rules) {
  const tables = Object.values(rules?.ramadan?.timetables ?? {});
  return tables.find((t) => isISODate(t?.expectedFirstFast))?.expectedFirstFast ?? null;
}

/** @returns {{ start: string, end: string }|null} the Ramadan days while the mode is on */
export function ramadanRange(mode) {
  if (!mode?.on || !isISODate(mode.startDate)) return null;
  return { start: mode.startDate, end: addDays(mode.startDate, RAMADAN_DAYS - 1) };
}

/** @param {string} date @param {object} mode settings.ramadanMode @returns {boolean} */
export function isRamadanDay(date, mode) {
  const range = ramadanRange(mode);
  return Boolean(range) && date >= range.start && date <= range.end;
}

function tableRow(date, rules) {
  for (const table of Object.values(rules?.ramadan?.timetables ?? {})) {
    const row = table?.rows?.find((r) => r[0] === date);
    if (row) return { fajr: parseTime(row[1]), maghrib: parseTime(row[2]), place: table.place };
  }
  return null;
}

/**
 * Fajr and maghrib for one date: that day's own time ('day', when RULES allows per-day changes),
 * else the person's every-day time ('user'), else the built-in table moved by the person's offset
 * ('table'), else null. `table` keeps the table's own times; `offset` the minutes applied.
 * @returns {{ fajr: number|null, maghrib: number|null,
 *   source: { fajr: 'day'|'user'|'table'|null, maghrib: 'day'|'user'|'table'|null },
 *   table: { fajr: number|null, maghrib: number|null }, offset: { fajr: number, maghrib: number },
 *   place: string|null }}
 */
export function ramadanTimes(date, mode, rules) {
  const row = tableRow(date, rules);
  const day = ramadanEditRules(rules).perDay && isObject(mode?.days) ? mode.days[date] : null;
  const offset = {
    fajr: ramadanOffset(mode, 'fajr', rules),
    maghrib: ramadanOffset(mode, 'maghrib', rules),
  };
  const pick = (key) => {
    const mine = parseTime(isObject(day) ? day[key] : null);
    if (mine !== null) return [mine, 'day'];
    const own = parseTime(mode?.[key]);
    if (own !== null) return [own, 'user'];
    if (row && row[key] !== null) return [mod(row[key] + offset[key]), 'table'];
    return [null, null];
  };
  const [fajr, fajrFrom] = pick('fajr');
  const [maghrib, maghribFrom] = pick('maghrib');
  return {
    fajr,
    maghrib,
    source: { fajr: fajrFrom, maghrib: maghribFrom },
    table: { fajr: row?.fajr ?? null, maghrib: row?.maghrib ?? null },
    offset,
    place: row?.place ?? null,
  };
}

/**
 * §12.2: max(earliest, min(dayStartMinutes, fajr − lead)); without a fajr time, dayStartMinutes.
 * @param {number|null} fajr minutes @param {number} dayStartMinutes @param {object} rules
 */
export function ramadanDayStart(fajr, dayStartMinutes, rules) {
  if (!Number.isFinite(fajr)) return dayStartMinutes;
  const { sehriLeadMinutes = 120, earliestMinutes = 60 } = rules?.ramadan?.dayStart ?? {};
  return Math.max(earliestMinutes, Math.min(dayStartMinutes, fajr - sehriLeadMinutes));
}

/**
 * The logging day of `now` (§12.2). On a Ramadan calendar day with a known fajr the day starts at
 * the Ramadan boundary; otherwise at settings.dayStartMinutes (the DECISIONS 04:00 rule).
 * @param {Date} now @param {{ dayStartMinutes?: number, ramadanMode?: object }} settings
 * @param {object} rules @returns {string}
 */
export function loggingDate(now, settings, rules) {
  const plain = settings?.dayStartMinutes ?? 240;
  const calendar = todayISO(now, 0);
  const mode = settings?.ramadanMode;
  if (!isRamadanDay(calendar, mode)) return todayISO(now, plain);
  const start = ramadanDayStart(ramadanTimes(calendar, mode, rules).fajr, plain, rules);
  return minutesOfDay(now) < start ? addDays(calendar, -1) : calendar;
}

/**
 * The Ramadan slots for a day (§12.1): RULES.mealSlots.ramadan, with windows from maghrib when it
 * is known, and sehri/snacks meeting at the day's boundary. Same shape as RULES.mealSlots[preset].
 * @param {object} rules @param {{ maghrib?: number|null, dayStart?: number }} [times]
 */
export function ramadanSlots(rules, { maghrib = null, dayStart = 240 } = {}) {
  const base = rules?.mealSlots?.ramadan ?? [];
  const cfg = rules?.ramadan?.slotsFromMaghrib ?? {};
  const known = Number.isFinite(maghrib);
  const iftarStart = known ? mod(maghrib + (cfg.iftarStartOffsetMin ?? -30)) : null;
  const lateStart = known ? mod(maghrib + (cfg.afterTaraweehStartOffsetMin ?? 150)) : null;
  const lateEnd = cfg.afterTaraweehEndMinutes ?? 60;
  const hoursOf = (slot) => {
    const [from, to] = slot.hours;
    switch (slot.id) {
      case 'sehri':
        return [dayStart, known ? iftarStart : to];
      case 'iftar':
        return known ? [iftarStart, lateStart] : [from, to];
      case 'after_taraweeh':
        return [known ? lateStart : from, known ? lateEnd : to];
      case 'snacks':
        return [known ? lateEnd : from, dayStart];
      default:
        return [from, to];
    }
  };
  return base.map((slot) => ({ ...slot, hours: hoursOf(slot) }));
}

/**
 * §12.4: min(cap, max(floor, round(gPerKg × PRW)), round(pct% × protein target)); null without a
 * protein target. Without a PRW the floor is used for that term.
 */
export function sehriProteinGoal(prwKg, proteinTarget, rules) {
  if (!(Number.isFinite(proteinTarget) && proteinTarget > 0)) return null;
  const r = rules?.ramadan?.sehriProtein ?? {};
  const cap = r.capG ?? rules?.ramadan?.minProteinGAtSehri ?? 30;
  const floor = r.floorG ?? 20;
  const perKg = Number.isFinite(prwKg) ? Math.round((r.gPerKgPrw ?? 0.4) * prwKg) : floor;
  const share = Math.round(((r.maxPctOfDailyTarget ?? 40) / 100) * proteinTarget);
  return Math.min(cap, Math.max(floor, perKg), share);
}

/** §12.6: the note of each active flag, in RULES order. @returns {{ id: string, text: string }[]} */
export function ramadanFlagNotes(flags, rules) {
  const notes = rules?.ramadan?.flagNotes ?? {};
  const active = new Set(flags ?? []);
  return Object.entries(notes)
    .filter(([id]) => active.has(id))
    .map(([id, text]) => ({ id, text }));
}
