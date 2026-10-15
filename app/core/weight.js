// Weight log and weight trend (Sprint 3, Meeting 005 wave 1). Pure.
// Owner: Lena. Contract: docs/ARCHITECTURE.md §14.
//
// The log is an optional UserData field, `weightLog: { [date]: { kg } }` (absent = none), so one
// entry per day is structural and no schema bump is needed. The trend reads its parameters from
// RULES.weightTrend (Nutrition Lab, rules 1.7.0); without them there is no trend, only the log.
// A suggestion is only ever a suggestion: nothing here changes a target.

import { isISODate, diffDays } from './dates.js';

/** kg are kept to the gram, so 180 lb reads back as 180.0 lb. */
const KG_DECIMALS = 3;

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isNumber = (v) => typeof v === 'number' && Number.isFinite(v);
const roundKg = (kg) => Number(kg.toFixed(KG_DECIMALS));

/** RULES.profileLimits.weightKg, else 30-250 (the same rails as the profile). */
export function weightLimits(rules = null) {
  const l = rules?.profileLimits?.weightKg;
  return { min: isNumber(l?.min) ? l.min : 30, max: isNumber(l?.max) ? l.max : 250 };
}

/** @param {unknown} log @returns {string[]} problems; [] for a valid log or undefined. */
export function weightLogProblems(log) {
  if (log === undefined) return [];
  if (!isObject(log)) return ['weightLog must be an object keyed by date'];
  const p = [];
  for (const [date, entry] of Object.entries(log)) {
    if (!isISODate(date)) p.push(`weightLog: '${date}' is not a real date`);
    if (!isObject(entry) || !isNumber(entry.kg) || entry.kg <= 0) {
      p.push(`weightLog[${date}] must be { kg: number > 0 }`);
    }
  }
  return p;
}

/**
 * The log with `date` set to `kg` (replaces that day's entry: one per day).
 * RangeError for a date that is not real or a weight outside the limits.
 * @param {object|undefined} log @param {string} date @param {number} kg @param {object} [rules]
 * @returns {object} a new log
 */
export function setWeight(log, date, kg, rules = null) {
  if (!isISODate(date)) throw new RangeError(`date must be YYYY-MM-DD, got ${date}`);
  const { min, max } = weightLimits(rules);
  if (!isNumber(kg) || kg < min || kg > max) {
    throw new RangeError(`kg must be a number from ${min} to ${max}, got ${kg}`);
  }
  return { ...(log ?? {}), [date]: { kg: roundKg(kg) } };
}

/** The log without `date` (the same object when there was no entry). */
export function removeWeight(log, date) {
  if (!log || !Object.hasOwn(log, date)) return log ?? {};
  const next = { ...log };
  delete next[date];
  return next;
}

/** @param {object|undefined} log @returns {{ date: string, kg: number }[]} oldest first */
export function weightEntries(log) {
  if (!isObject(log)) return [];
  return Object.entries(log)
    .filter(([date, e]) => isISODate(date) && isNumber(e?.kg))
    .map(([date, e]) => ({ date, kg: e.kg }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Import merge: union by date, the incoming entry wins a shared date. */
export function mergeWeightLogs(current, incoming) {
  return { ...(current ?? {}), ...(incoming ?? {}) };
}

/** RULES.weightTrend, checked; null when the Lab's rule is missing or incomplete. */
export function trendRule(rules) {
  const r = rules?.weightTrend;
  const alpha = r?.smoothing?.alphaPerDay;
  if (!isObject(r) || !isNumber(alpha) || alpha <= 0 || alpha > 1) return null;
  return r;
}

/** Least-squares slope of kg against day number, in kg per day. */
function slopePerDay(points) {
  const n = points.length;
  const mx = points.reduce((s, p) => s + p.x, 0) / n;
  const my = points.reduce((s, p) => s + p.y, 0) / n;
  let sxy = 0;
  let sxx = 0;
  for (const p of points) {
    sxy += (p.x - mx) * (p.y - my);
    sxx += (p.x - mx) ** 2;
  }
  return sxx === 0 ? 0 : sxy / sxx;
}

const roundTo = (value, step) => Math.round(value / step) * step;

/**
 * Rails for a suggested target (NUTRITION.md §14.3.4, §2.2): the lowest and highest daily kcal a
 * suggestion may land on. Lowest: TDEE minus the smallest deficit cap (25% of TDEE, 1,000 kcal, 1% of
 * body weight a week), never under the floor for the sex unless TDEE itself is lower. Highest: TDEE
 * plus the surplus cap (20%). Missing inputs give null (no rail on that side, the floor still holds).
 * @param {object} rules RULES (reads rails, energy.kcalPerKgBodyWeight)
 * @param {{ tdee?: number|null, sex?: string|null, bodyKg?: number|null }} who
 * @returns {{ floorKcal: number|null, ceilingKcal: number|null }}
 */
export function suggestRails(rules, { tdee = null, sex = null, bodyKg = null } = {}) {
  const r = rules?.rails ?? {};
  const floor = isNumber(r.minKcalWhenLosing?.[sex]) ? r.minKcalWhenLosing[sex] : null;
  if (!isNumber(tdee)) return { floorKcal: floor, ceilingKcal: null };
  const perKg = rules?.energy?.kcalPerKgBodyWeight ?? 7700;
  const caps = [
    isNumber(r.maxDeficitPctOfTdee) ? (r.maxDeficitPctOfTdee / 100) * tdee : null,
    isNumber(r.maxDeficitKcal) ? r.maxDeficitKcal : null,
    isNumber(r.maxLossPctBodyWeightPerWeek) && isNumber(bodyKg)
      ? ((r.maxLossPctBodyWeightPerWeek / 100) * bodyKg * perKg) / 7
      : null,
  ].filter(isNumber);
  let lowest = caps.length ? tdee - Math.min(...caps) : null;
  if (floor !== null) lowest = tdee < floor ? tdee : Math.max(lowest ?? floor, floor);
  const ceiling = isNumber(r.maxSurplusPctOfTdee) ? tdee * (1 + r.maxSurplusPctOfTdee / 100) : null;
  return {
    floorKcal: lowest === null ? null : Math.ceil(lowest),
    ceilingKcal: ceiling === null ? null : Math.floor(ceiling),
  };
}

/** Why no suggestion is allowed (§14.4), or null. */
function neverReason(s, context) {
  if (context.allowSuggest === false) return 'not-allowed';
  if (!isNumber(context.kcal)) return 'no-targets';
  if (s.neverInRamadanMode !== false && context.ramadanMode) return 'ramadan';
  const flags = new Set(context.flags ?? []);
  if ((s.neverForFlags ?? []).some((f) => flags.has(f))) return 'flag';
  return null;
}

/**
 * Smoothed weight, weekly rate and (maybe) a suggested target change (NUTRITION.md §14).
 *
 * Smoothing: an exponential moving average over days, so a gap of d days weighs the new reading
 * by 1 − (1 − alphaPerDay)^d, seeded with the first entry. `showTrend` once there are
 * `display.minEntries` readings spanning `display.minSpanDays`. Rate: the least-squares slope of the
 * readings in the last `rate.windowDays`, once there are `rate.minEntries` of them spanning
 * `rate.minSpanDays`. Suggestion (never applied): the window holds `suggest.minEntries` readings over
 * `suggest.minSpanDays`; the rate differs from the goal's pace by more than
 * `suggest.toleranceKgPerWeek` (or loses faster than `fastLossPctBodyWeightPerWeek`% of the trend
 * weight a week: then always "eat more"); no target change within `cooldownDaysAfterChange` and no
 * dismissal within `snoozeDaysAfterDismiss`. Size −difference × kcalPerKgBodyWeight / 7, rounded to
 * `stepKcal`, at most `maxChangeKcal`, kept inside [floorKcal, ceilingKcal] (see suggestRails); no
 * room in that direction = no suggestion. Never in Ramadan mode, with `neverForFlags`, or without a
 * personal kcal target.
 *
 * @param {{ date: string, kg: number }[]} entries any order
 * @param {object} rules RULES (reads weightTrend, energy.kcalPerKgBodyWeight)
 * @param {{ goal?: 'lose'|'maintain'|'gain', rateKgPerWeek?: number, kcal?: number|null,
 *   floorKcal?: number|null, ceilingKcal?: number|null, allowSuggest?: boolean,
 *   flags?: string[], ramadanMode?: boolean, today?: string,
 *   changedOn?: string|null, dismissedOn?: string|null }} [context]
 * @returns {{ ready: boolean, showTrend: boolean, points: { date: string, kg: number, trendKg: number|null }[],
 *   latest: { date: string, kg: number, trendKg: number|null }|null,
 *   weeklyRateKg: number|null, rateWeeks: number, spanDays: number, needEntries: number,
 *   suggestion: { kcalPerDay: number, newKcal: number, expectedKgPerWeek: number,
 *     differenceKgPerWeek: number, fastLoss: boolean }|null }}
 *   ready = the Lab's rule is present (else trendKg and the rate are null).
 */
export function weightTrend(entries, rules, context = {}) {
  const sorted = [...(entries ?? [])]
    .filter((e) => isISODate(e?.date) && isNumber(e?.kg))
    .sort((a, b) => a.date.localeCompare(b.date));
  const rule = trendRule(rules);
  const spanDays = sorted.length > 1 ? diffDays(sorted[0].date, sorted.at(-1).date) : 0;
  const display = rule?.display ?? {};
  const needEntries = display.minEntries ?? 5;
  const empty = {
    ready: Boolean(rule),
    showTrend: false,
    weeklyRateKg: null,
    rateWeeks: 0,
    spanDays,
    needEntries,
    suggestion: null,
  };
  if (!rule) {
    const points = sorted.map((e) => ({ date: e.date, kg: e.kg, trendKg: null }));
    return { ...empty, points, latest: points.at(-1) ?? null };
  }

  const keep = 1 - rule.smoothing.alphaPerDay;
  let trend = null;
  let prev = null;
  const points = sorted.map((e) => {
    if (trend === null) trend = e.kg;
    else trend += (1 - keep ** diffDays(prev, e.date)) * (e.kg - trend);
    prev = e.date;
    return { date: e.date, kg: e.kg, trendKg: Number(trend.toFixed(2)) };
  });
  const latest = points.at(-1) ?? null;
  if (!latest) return { ...empty, points, latest };
  const showTrend = sorted.length >= needEntries && spanDays >= (display.minSpanDays ?? 7);

  const rate = rule.rate ?? {};
  const windowDays = isNumber(rate.windowDays) ? rate.windowDays : 28;
  const inWindow = sorted.filter((e) => diffDays(e.date, latest.date) <= windowDays);
  const windowSpan = inWindow.length ? diffDays(inWindow[0].date, latest.date) : 0;
  let weeklyRateKg = null;
  if (inWindow.length >= (rate.minEntries ?? 2) && windowSpan >= (rate.minSpanDays ?? 7)) {
    const pts = inWindow.map((e) => ({ x: diffDays(inWindow[0].date, e.date), y: e.kg }));
    weeklyRateKg = Number((slopePerDay(pts) * 7).toFixed(2));
  }

  const window = { count: inWindow.length, span: windowSpan, today: context.today ?? latest.date };
  return {
    ...empty,
    showTrend,
    points,
    latest,
    weeklyRateKg,
    rateWeeks: weeklyRateKg === null ? 0 : Math.max(1, Math.round(windowSpan / 7)),
    suggestion: suggest(weeklyRateKg, window, latest.trendKg, rule.suggest, rules, context),
  };
}

function suggest(weeklyRateKg, window, bodyKg, s, rules, context) {
  if (weeklyRateKg === null || !isObject(s) || neverReason(s, context)) return null;
  if (window.span < (s.minSpanDays ?? 21) || window.count < (s.minEntries ?? 0)) return null;
  const since = (date) => (isISODate(date) ? diffDays(date, window.today) : Infinity);
  if (since(context.changedOn) < (s.cooldownDaysAfterChange ?? 0)) return null;
  if (since(context.dismissedOn) < (s.snoozeDaysAfterDismiss ?? 0)) return null;

  const { goal = 'maintain', rateKgPerWeek = 0, kcal } = context;
  const pace = Math.abs(isNumber(rateKgPerWeek) ? rateKgPerWeek : 0);
  let expected = goal === 'lose' ? -pace : goal === 'gain' ? pace : 0;
  const fastPct = s.fastLossPctBodyWeightPerWeek;
  const fastKg = isNumber(fastPct) && isNumber(bodyKg) ? (fastPct / 100) * bodyKg : null;
  const fastLoss = fastKg !== null && weeklyRateKg < -fastKg;
  if (fastLoss) expected = Math.max(expected, -fastKg);
  const difference = weeklyRateKg - expected;
  if (!fastLoss && Math.abs(difference) <= (s.toleranceKgPerWeek ?? 0.25)) return null;

  const perKg = rules?.energy?.kcalPerKgBodyWeight ?? 7700;
  const step = s.stepKcal ?? 50;
  const cap = s.maxChangeKcal ?? 200;
  let change = roundTo((-difference * perKg) / 7, step);
  if (fastLoss) change = Math.max(step, change);
  change = Math.max(-cap, Math.min(cap, change));
  const { floorKcal = null, ceilingKcal = null } = context;
  if (change < 0 && isNumber(floorKcal) && kcal + change < floorKcal) {
    change = Math.ceil((floorKcal - kcal) / step) * step;
    if (change >= 0) return null; // already at the floor: the rails leave no room
  }
  if (change > 0 && isNumber(ceilingKcal) && kcal + change > ceilingKcal) {
    change = Math.floor((ceilingKcal - kcal) / step) * step;
    if (change <= 0) return null; // already at the surplus cap
  }
  if (change === 0) return null;
  return {
    kcalPerDay: change,
    newKcal: kcal + change,
    expectedKgPerWeek: Number(expected.toFixed(2)),
    differenceKgPerWeek: Number(difference.toFixed(2)),
    fastLoss,
  };
}
