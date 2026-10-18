// Protein tips (NUTRITION.md §13, §12.4; RULES.proteinNudges). Pure. Owner: Lena.
// Contract: docs/ARCHITECTURE.md §15.
//
// settings.nudges = { off?: boolean, notTodayDate?: date, shownOn?: date, shownKey?: string }
// (DECISIONS 2026-10-15; shownOn/shownKey are additive: they keep the one-a-day rule).
// A tip informs and never judges: at most one a day, only on today, never on a day on track.

import { nutrientsForPortion, findServing, defaultServing } from './foods.js';

const MINUTES = 1440;
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/** @param {unknown} nudges settings.nudges @returns {string[]} problems; [] = valid or absent */
export function nudgeSettingsProblems(nudges) {
  if (nudges === undefined) return [];
  if (!isObject(nudges)) return ['settings.nudges must be an object'];
  const p = [];
  if (nudges.off !== undefined && typeof nudges.off !== 'boolean') {
    p.push('settings.nudges.off must be true or false');
  }
  for (const key of ['notTodayDate', 'shownOn', 'shownKey']) {
    if (nudges[key] !== undefined && nudges[key] !== null && typeof nudges[key] !== 'string') {
      p.push(`settings.nudges.${key} must be a string`);
    }
  }
  return p;
}

/**
 * Tips are on unless the person turned them off; with no choice made, they start off for
 * RULES.proteinNudges.offByDefaultForFlags (eating_disorder).
 * @param {object|undefined} nudges @param {string[]} flags @param {object} rules
 */
export function tipsOn(nudges, flags, rules) {
  if (typeof nudges?.off === 'boolean') return !nudges.off;
  const r = rules?.proteinNudges ?? {};
  if (r.enabledByDefault === false) return false;
  const offFor = new Set(r.offByDefaultForFlags ?? []);
  return !(flags ?? []).some((f) => offFor.has(f));
}

/** Minutes since the logging day started (so windows that pass midnight still compare). */
const sinceStart = (minutes, dayStart) => (minutes - dayStart + MINUTES) % MINUTES;
const endSince = (end, dayStart) => sinceStart(end, dayStart) || MINUTES;

/**
 * The checkpoint due now (§13.1 item 5): past the end of `afterSlot`'s window and before the end of
 * `suggestFor`'s window.
 * @param {object[]} checkpoints RULES.proteinNudges.checkpoints[preset]
 * @param {{ id: string, hours: [number, number] }[]} slots the day's slot windows
 * @param {number} minutes clock, minutes since midnight @param {number} dayStart
 */
export function dueCheckpoint(checkpoints, slots, minutes, dayStart) {
  const now = sinceStart(minutes, dayStart);
  const endOf = (id) => {
    const s = slots.find((x) => x.id === id);
    return s ? endSince(s.hours[1], dayStart) : null;
  };
  for (const cp of checkpoints ?? []) {
    const from = endOf(cp.afterSlot);
    const to = endOf(cp.suggestFor);
    if (from !== null && to !== null && now >= from && now < to) return cp;
  }
  return null;
}

/** Common gates (§13.1 items 1–3) shared by the tip and the sehri line. */
function blocked({ rules, target, flags, nudges, isToday, today }) {
  const r = rules?.proteinNudges ?? {};
  if (!isToday) return true;
  if (!(Number.isFinite(target) && target > 0)) return true;
  if ((flags ?? []).some((f) => (r.neverForFlags ?? []).includes(f))) return true;
  if (!tipsOn(nudges, flags, rules)) return true;
  if (nudges?.notTodayDate === today) return true;
  return false;
}

/** One a day: a tip already shown today blocks any other key today. */
const usedToday = (nudges, today, key) => nudges?.shownOn === today && nudges?.shownKey !== key;

/**
 * The day's protein tip (§13.1), or null.
 * @param {{ rules: object, preset: string, slots: object[], minutes: number, dayStart: number,
 *   eaten: number, target: number|null, entries: number, flags?: string[], nudges?: object,
 *   isToday: boolean, today: string }} input eaten = protein logged today (planned excluded)
 * @returns {null | { key: string, afterSlot: string, suggestFor: string, pct: number,
 *   eaten: number, target: number }}
 */
export function proteinTip(input) {
  const { rules, preset, slots, minutes, dayStart, eaten, target, entries, nudges, today } = input;
  if (blocked(input)) return null;
  const r = rules.proteinNudges;
  if (entries < (r.minEntriesToday ?? 1)) return null;
  const cp = dueCheckpoint(r.checkpoints?.[preset], slots, minutes, dayStart);
  if (!cp) return null;
  const key = `${preset}:${cp.afterSlot}`;
  if (usedToday(nudges, today, key)) return null;
  const goal = (cp.minPctOfTarget / 100) * target;
  if (!(eaten < goal && goal - eaten >= (r.minGapG ?? 15))) return null;
  return {
    key,
    afterSlot: cp.afterSlot,
    suggestFor: cp.suggestFor,
    pct: cp.minPctOfTarget,
    eaten,
    target,
  };
}

/**
 * The sehri line (§12.4): while sehri is the current slot (and, when fajr is known, before fajr),
 * sehri protein under the goal. It is the day's tip: same gates, same one-a-day key.
 * @param {{ rules: object, currentSlot: string, minutes: number, fajr: number|null,
 *   sehriEaten: number, goal: number|null, target: number|null, flags?: string[],
 *   nudges?: object, isToday: boolean, today: string }} input
 * @returns {null | { key: 'ramadan:sehri', suggestFor: 'sehri', eaten: number, goal: number }}
 */
export function sehriTip(input) {
  const { currentSlot, minutes, fajr, sehriEaten, goal, nudges, today } = input;
  if (blocked(input) || !(goal > 0)) return null;
  if (currentSlot !== 'sehri') return null;
  if (Number.isFinite(fajr) && minutes >= fajr) return null;
  const key = 'ramadan:sehri';
  if (usedToday(nudges, today, key)) return null;
  if (sehriEaten >= goal) return null;
  return { key, suggestFor: 'sehri', eaten: sehriEaten, goal };
}

/**
 * Ideas for a slot (§13.3): RULES.proteinNudges.suggestions[slot], foods logged in the last
 * `recentDays` first (list order kept), never not-halal, `check` only when `showCheck`.
 * Protein and kcal come from the food record for the listed serving × qty.
 * @param {string} slot @param {object} rules
 * @param {{ foodIndex: Map<string, object>, recentIds?: Set<string>, showCheck?: boolean,
 *   limit?: number, skipIds?: Set<string> }} options skipIds: foods left out (already eaten there today)
 * @returns {{ food: object, servingId: string, qty: number, protein: number, kcal: number }[]}
 */
export function tipIdeas(
  slot,
  rules,
  { foodIndex, recentIds = new Set(), showCheck = false, limit, skipIds = new Set() },
) {
  const r = rules?.proteinNudges ?? {};
  const out = [];
  for (const item of r.suggestions?.[slot] ?? []) {
    const food = foodIndex?.get(item.foodId);
    if (!food || skipIds.has(food.id)) continue;
    const status = food.halal?.status ?? 'halal';
    if (status === 'not-halal' || (status === 'check' && !showCheck)) continue;
    const servingId = findServing(food, item.servingId) ? item.servingId : defaultServing(food).id;
    const qty = Number.isFinite(item.qty) && item.qty > 0 ? item.qty : 1;
    const n = nutrientsForPortion(food, servingId, qty);
    out.push({ food, servingId, qty, protein: n.protein, kcal: n.kcal });
  }
  const recent = out.filter((x) => recentIds.has(x.food.id));
  const rest = out.filter((x) => !recentIds.has(x.food.id));
  return [...recent, ...rest].slice(0, limit ?? r.show ?? 3);
}
