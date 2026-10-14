// Display helpers for every view: number rounding, portion text and date labels.
// Owner: Priya. Rules: docs/ARCHITECTURE.md §7.5 (display rounding happens only here).
// The maths comes from the pure core. While a core module is still a Step 0 stub ("not
// implemented"), a small local fallback with the same contract is used, so views work in the
// harness today and switch to Hamza's code with no edit once it lands (probed once at load).
import { round, formatQty } from '../../core/units.js';
import * as coreDates from '../../core/dates.js';
import * as coreFoods from '../../core/foods.js';
import * as coreDays from '../../core/days.js';

/** @param {() => boolean} probe @returns {boolean} true when the core function works. */
function works(probe) {
  try {
    return probe() === true;
  } catch {
    return false;
  }
}

// ------------------------------------------------------------------ numbers

/** kcal: whole numbers, no thousands separator (tests and people both read "1234"). */
export function fmtKcal(kcal) {
  const v = round(Number(kcal) || 0);
  return String(Object.is(v, -0) ? 0 : v);
}

/** Grams: whole at 10 g or more; one decimal under 10 g with a trailing ".0" trimmed. */
export function fmtGrams(grams) {
  const g = Number(grams) || 0;
  const v = Math.abs(g) >= 10 ? round(g) : round(g, 1);
  return String(Object.is(v, -0) ? 0 : v);
}

/** Quantities in household words: ½, 1½, ¼, 0.33 (core formatQty). */
export function fmtQty(qty) {
  return formatQty(qty);
}

/** One plain line that explains "Estimate" wherever targets show it (Meeting 003 item 6). */
export const ESTIMATE_LINE = 'Estimate means a good guess from your answers. You can change it.';

/**
 * Targets that are a minimum to reach, not a limit: going above them is good news, never "over"
 * (Meeting 003 item 6: protein never reads as if it were bad).
 */
export const AT_LEAST_KEYS = Object.freeze(['protein', 'fiber']);

/**
 * The note for a capped weight-change pace, without blame (Meeting 003 item 6), or null.
 * @param {string} code 'deficit_capped' | 'surplus_capped' | other
 * @param {{ effectiveRateKgPerWeek?: number|null }|null} result TargetResult
 * @returns {string|null}
 */
export function paceNote(code, result) {
  const rate = Math.abs(Number(result?.effectiveRateKgPerWeek));
  if (!Number.isFinite(rate) || rate === 0) return null;
  const kg = String(Math.max(0.1, round(rate, 1)));
  if (code === 'deficit_capped') {
    return `Your target keeps weight loss to a safe pace of about ${kg} kg a week.`;
  }
  if (code === 'surplus_capped') {
    return `Your target keeps weight gain to a steady pace of about ${kg} kg a week.`;
  }
  return null;
}

/**
 * Remaining against a target as plain words, never as an error.
 * @param {number|null} remaining target − eaten (unrounded); null = no target
 * @returns {{ over: boolean, amount: number|null }}
 */
export function leftOrOver(remaining) {
  if (remaining === null || remaining === undefined || !Number.isFinite(remaining)) {
    return { over: false, amount: null };
  }
  return remaining < 0 ? { over: true, amount: -remaining } : { over: false, amount: remaining };
}

/**
 * Parse a typed quantity. Accepts "1.5", "1,5" (Spanish keyboards), "½", "1½", "1 1/2", "1/3".
 * @param {string} text
 * @returns {{ ok: true, value: number } | { ok: false, error: 'empty'|'nan'|'zero'|'negative' }}
 */
export function parseQty(text) {
  const raw = String(text ?? '').trim();
  if (raw === '') return { ok: false, error: 'empty' };
  const fractions = { '¼': 0.25, '½': 0.5, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 };
  let value = NaN;
  const glyph = raw.match(/^(-?\d*)\s*([¼½¾⅓⅔])$/);
  const slash = raw.match(/^(-?\d+\s+)?(-?\d+)\s*\/\s*(\d+)$/);
  if (glyph) {
    const whole = glyph[1] === '' || glyph[1] === '-' ? 0 : Number(glyph[1]);
    value = (glyph[1].startsWith('-') ? -1 : 1) * (Math.abs(whole) + fractions[glyph[2]]);
  } else if (slash) {
    const whole = slash[1] ? Number(slash[1]) : 0;
    const den = Number(slash[3]);
    value = den === 0 ? NaN : whole + Number(slash[2]) / den;
  } else if (/^-?(\d+([.,]\d*)?|[.,]\d+)$/.test(raw)) {
    value = Number(raw.replace(',', '.'));
  }
  if (!Number.isFinite(value)) return { ok: false, error: 'nan' };
  if (value < 0) return { ok: false, error: 'negative' };
  if (value === 0) return { ok: false, error: 'zero' };
  return { ok: true, value };
}

// ------------------------------------------------------------------ portions

/**
 * The household unit of a serving, for "1½ katori": the Lab label without its leading "1 " and
 * without the parenthesis ("1 small katori (155 ml)" → "small katori"; "1 box (350 g)" → "box").
 * @param {{ id: string, label: string }|null} serving
 */
export function unitName(serving) {
  if (!serving) return '';
  if (serving.id === 'g') return 'g';
  return String(serving.label)
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/^1\s+/, '')
    .replace(/^per\s+/i, '')
    .trim();
}

/** True when the label names one unit ("1 cup", "per egg"), so a quantity can go in front. */
function countable(serving) {
  return /^(1\s|per\s)/i.test(String(serving.label));
}

/** The parenthesis of a serving label, if any ("1 cup (200 ml)" → "200 ml"). */
export function servingNote(serving) {
  const m = String(serving?.label ?? '').match(/\(([^)]*)\)\s*$/);
  return m ? m[1] : '';
}

/**
 * "1½ katori", "2 medium roti", "300 g", "3 egg" ("per egg"), and "½ plate" or "2 × ½ plate"
 * for labels that do not name a single unit.
 * @param {{ id: string, label: string }|null} serving @param {number} qty
 */
export function portionText(serving, qty) {
  if (!serving) return fmtQty(qty);
  if (serving.id === 'g') return `${fmtGrams(qty)} g`;
  const unit = unitName(serving);
  if (!countable(serving)) return qty === 1 ? unit : `${fmtQty(qty)} × ${unit}`;
  return `${fmtQty(qty)} ${unit}`;
}

const GRAM_SERVING = Object.freeze({ id: 'g', label: 'g', grams: 1 });

/** The default serving (`default: true`), else the first. */
export function defaultServingOf(food) {
  if (coreFoodsReady) return coreFoods.defaultServing(food);
  return food.servings.find((s) => s.default) ?? food.servings[0];
}

/** `findServing` with 'g' support; null for an unknown id. */
export function servingOf(food, servingId) {
  if (!food) return null;
  if (coreFoodsReady) return coreFoods.findServing(food, servingId);
  if (servingId === 'g') return GRAM_SERVING;
  return food.servings.find((s) => s.id === servingId) ?? null;
}

/**
 * Live preview for the portion picker: grams and the five nutrients (unrounded).
 * @returns {{ grams: number, kcal: number, protein: number, carbs: number, fat: number, fiber: number }}
 */
export function portionNutrients(food, servingId, qty) {
  if (coreFoodsReady) {
    const grams = coreFoods.gramsForPortion(food, servingId, qty);
    return { grams, ...coreFoods.nutrientsForGrams(food, grams) };
  }
  const serving = servingOf(food, servingId);
  const grams = (serving?.grams ?? 0) * qty;
  const out = { grams };
  for (const k of ['kcal', 'protein', 'carbs', 'fat', 'fiber']) {
    out[k] = ((food.per100g?.[k] ?? 0) * grams) / 100;
  }
  return out;
}

const coreFoodsReady = works(() => {
  const f = { servings: [{ id: 'a', label: '1 a', grams: 10, default: true }], per100g: {} };
  return coreFoods.defaultServing(f).id === 'a' && coreFoods.findServing(f, 'g').grams === 1;
});

// ------------------------------------------------------------------ dates

const coreDatesReady = works(
  () =>
    coreDates.addDays('2026-10-25', 1) === '2026-10-26' &&
    coreDates.monthGrid(2026, 10, 1).length >= 4,
);

const pad = (n) => String(n).padStart(2, '0');
const parts = (iso) => iso.split('-').map(Number);
const utc = (iso) => {
  const [y, m, d] = parts(iso);
  return new Date(Date.UTC(y, m - 1, d));
};
const isoOfUtc = (date) =>
  `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;

/** @param {string} iso @param {number} n @returns {string} */
export function addDays(iso, n) {
  if (coreDatesReady) return coreDates.addDays(iso, n);
  const d = utc(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return isoOfUtc(d);
}

/** @param {string} fromIso @param {string} toIso @returns {number} whole days, to − from */
export function diffDays(fromIso, toIso) {
  if (coreDatesReady) return coreDates.diffDays(fromIso, toIso);
  return Math.round((utc(toIso) - utc(fromIso)) / 86400000);
}

/** @param {string} iso @returns {number} 0 = Sunday */
export function dayOfWeek(iso) {
  if (coreDatesReady) return coreDates.dayOfWeek(iso);
  return utc(iso).getUTCDay();
}

/** @param {string} iso @param {0|1|6} weekStartsOn @returns {string[]} */
export function weekDates(iso, weekStartsOn = 1) {
  if (coreDatesReady) return coreDates.weekDates(iso, weekStartsOn);
  const back = (dayOfWeek(iso) - weekStartsOn + 7) % 7;
  const start = addDays(iso, -back);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** @returns {(string|null)[][]} rows of 7; null outside the month */
export function monthGrid(year, month, weekStartsOn = 1) {
  if (coreDatesReady) return coreDates.monthGrid(year, month, weekStartsOn);
  const first = `${year}-${pad(month)}-01`;
  const daysIn = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const lead = (dayOfWeek(first) - weekStartsOn + 7) % 7;
  const cells = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= daysIn; d += 1) cells.push(`${year}-${pad(month)}-${pad(d)}`);
  while (cells.length % 7) cells.push(null);
  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

/** Local wall-clock 'YYYY-MM-DD' of a Date (for date inputs' max/min; never toISOString). */
export function localISO(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const fmtCache = new Map();
function dateFormat(options) {
  const key = JSON.stringify(options);
  if (!fmtCache.has(key)) {
    fmtCache.set(key, new Intl.DateTimeFormat('en-GB', { ...options, timeZone: 'UTC' }));
  }
  return fmtCache.get(key);
}

/** "Tue 13 Oct" */
export function fmtDateShort(iso) {
  return dateFormat({ weekday: 'short', day: 'numeric', month: 'short' }).format(utc(iso));
}

/** "Tuesday 13 October" (+ year when it is not `thisYear`) */
export function fmtDateLong(iso, thisYear = null) {
  const opts = { weekday: 'long', day: 'numeric', month: 'long' };
  if (thisYear && parts(iso)[0] !== Number(thisYear)) opts.year = 'numeric';
  return dateFormat(opts).format(utc(iso));
}

/** "13 Oct" */
export function fmtDayMonth(iso) {
  return dateFormat({ day: 'numeric', month: 'short' }).format(utc(iso));
}

/** "Mon" */
export function fmtWeekday(iso) {
  return dateFormat({ weekday: 'short' }).format(utc(iso));
}

/** "October 2026" */
export function fmtMonth(year, month) {
  return dateFormat({ month: 'long', year: 'numeric' }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  );
}

/** "Today", "Yesterday", "Tomorrow" or null, relative to `today`. */
export function relativeDay(iso, today) {
  const d = diffDays(today, iso);
  if (d === 0) return 'Today';
  if (d === -1) return 'Yesterday';
  if (d === 1) return 'Tomorrow';
  return null;
}

/** "04:00" from minutes since midnight. */
export function fmtMinutes(minutes) {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

// ------------------------------------------------------------------ entries

const coreDaysReady = works(() => {
  const food = {
    id: 'x',
    name: 'x',
    servings: [{ id: 'a', label: '1 a', grams: 100, default: true }],
    per100g: { kcal: 100, protein: 1, carbs: 1, fat: 1, fiber: 1 },
  };
  const e = { id: 'e', slot: 'lunch', foodId: 'x', servingId: 'a', qty: 2, status: 'eaten' };
  return coreDays.entryNutrients(e, new Map([['x', food]])).kcal === 200;
});

/**
 * Live nutrients of one entry (the same rule as the day totals: the live food when it exists,
 * otherwise the snapshot). Unrounded.
 * @param {object} entry @param {object|undefined} food store.food(entry.foodId)
 * @returns {{ kcal: number, protein: number, carbs: number, fat: number, fiber: number }}
 */
export function entryNutrientsOf(entry, food) {
  if (coreDaysReady) {
    return coreDays.entryNutrients(entry, food ? new Map([[food.id, food]]) : new Map());
  }
  if (food && servingOf(food, entry.servingId))
    return portionNutrients(food, entry.servingId, entry.qty);
  const s = entry.snapshot ?? {};
  return {
    kcal: s.kcal ?? 0,
    protein: s.protein ?? 0,
    carbs: s.carbs ?? 0,
    fat: s.fat ?? 0,
    fiber: s.fiber ?? 0,
  };
}

/** Grams of one entry (live), or null for a quick add. */
export function entryGramsOf(entry, food) {
  if (!entry.foodId) return null;
  if (food && servingOf(food, entry.servingId))
    return portionNutrients(food, entry.servingId, entry.qty).grams;
  return entry.snapshot?.grams ?? null;
}
