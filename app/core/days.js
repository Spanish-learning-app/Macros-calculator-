// Days, entries, copying and totals. Pure and immutable: every function returns new objects and
// never mutates its arguments. Owner: Hamza. Contract: docs/ARCHITECTURE.md §5.4.

import { isISODate } from './dates.js';
import {
  NUTRIENT_KEYS,
  GRAMS,
  findServing,
  gramsForPortion,
  nutrientsForGrams,
  scaleNutrients,
  sumNutrients,
} from './foods.js';

/** @typedef {import('./types.js').Day} Day */
/** @typedef {import('./types.js').Entry} Entry */
/** @typedef {import('./types.js').Food} Food */
/** @typedef {import('./types.js').Nutrients} Nutrients */
/** @typedef {import('./types.js').SlotId} SlotId */

export const SLOT_IDS = Object.freeze(['breakfast', 'lunch', 'evening', 'dinner', 'snacks']);
export const DEFAULT_SLOT_LABELS = Object.freeze({
  breakfast: 'Nashta',
  lunch: 'Lunch',
  evening: 'Shaam ki chai',
  dinner: 'Dinner',
  snacks: 'Snacks',
});

const STATUSES = Object.freeze(['planned', 'eaten']);
const INCLUDES = Object.freeze(['all', 'eaten', 'planned']);
const PATCH_KEYS = new Set(['qty', 'servingId', 'status', 'slot']);
const FALLBACK_SLOT = 'snacks';
const MINUTES_PER_DAY = 1440;

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const zero = () => sumNutrients([]);
const show = (v) => (typeof v === 'string' ? `'${v}'` : String(v));

function checkSlot(slot) {
  if (!SLOT_IDS.includes(slot)) throw new RangeError(`unknown slot ${show(slot)}`);
}

function checkStatus(status) {
  if (!STATUSES.includes(status)) {
    throw new RangeError(`status must be 'planned' or 'eaten', got ${show(status)}`);
  }
}

function checkQty(qty) {
  if (!(Number.isFinite(qty) && qty > 0)) {
    throw new RangeError(`qty must be a finite number > 0, got ${show(qty)}`);
  }
}

function checkDay(day) {
  if (!isObject(day) || !Array.isArray(day.entries)) {
    throw new TypeError('day must be { date, entries: [] }');
  }
}

function checkEntry(entry) {
  if (!isObject(entry) || typeof entry.id !== 'string' || entry.id === '') {
    throw new TypeError('entry must be an object with a string id');
  }
}

function checkMakeId(makeId) {
  if (typeof makeId !== 'function') throw new TypeError('makeId must be a function');
}

function pickNutrients(source) {
  const out = {};
  for (const key of NUTRIENT_KEYS) out[key] = source?.[key] ?? 0;
  return out;
}

/** Snapshot of a food portion, taken now from the food record. */
function snapshotFor(food, servingId, qty) {
  const grams = gramsForPortion(food, servingId, qty);
  return { name: food.name, grams, ...nutrientsForGrams(food, grams) };
}

/** The live food of an entry, or null for a quick add or a food missing from the index. */
function liveFood(entry, foodIndex) {
  if (entry.foodId == null || !foodIndex) return null;
  return foodIndex.get(entry.foodId) ?? null;
}

/** Only the §4.3 fields, with a copied snapshot (copySlot and copyDay; never a Sprint 2 boxRef). */
function copyFields(entry, id, slot, status) {
  return {
    id,
    slot,
    foodId: entry.foodId,
    servingId: entry.servingId,
    qty: entry.qty,
    status,
    snapshot: { ...entry.snapshot },
  };
}

function appendCopies(toDay, sources, makeId, slotOf, status) {
  checkDay(toDay);
  checkMakeId(makeId);
  checkStatus(status);
  let day = { ...toDay, entries: [...toDay.entries] };
  for (const entry of sources)
    day = addEntry(day, copyFields(entry, makeId(), slotOf(entry), status));
  return day;
}

/** @param {string} date 'YYYY-MM-DD' @returns {Day} */
export function emptyDay(date) {
  if (!isISODate(date))
    throw new RangeError(`date must be a real 'YYYY-MM-DD' date: ${show(date)}`);
  return { date, entries: [] };
}

/**
 * @param {{ id: string, slot: SlotId, food: Food, servingId: string, qty: number,
 *   status?: 'planned'|'eaten' }} input status defaults to 'eaten' (the store passes 'planned'
 *   for future dates, A12)
 * @returns {Entry} with snapshot = { name, grams, ...nutrients } computed now (unrounded).
 */
export function createEntry({ id, slot, food, servingId, qty, status = 'eaten' }) {
  if (typeof id !== 'string' || id === '') throw new TypeError('id must be a non-empty string');
  if (!isObject(food) || typeof food.id !== 'string') throw new TypeError('food must be a food');
  checkSlot(slot);
  checkStatus(status);
  checkQty(qty);
  const snapshot = snapshotFor(food, servingId, qty);
  return { id, slot, foodId: food.id, servingId, qty, status, snapshot };
}

/**
 * Quick add (meal eaten out): no food record.
 * @param {{ id: string, slot: SlotId, name: string, nutrients: Partial<Nutrients> & { kcal: number },
 *   status?: 'planned'|'eaten' }} input missing macros become 0
 * @returns {Entry} foodId null, servingId null, qty 1, snapshot.grams null.
 */
export function createQuickEntry({ id, slot, name, nutrients, status = 'eaten' }) {
  if (typeof id !== 'string' || id === '') throw new TypeError('id must be a non-empty string');
  if (typeof name !== 'string' || name.trim() === '') {
    throw new TypeError('name must be a non-empty string');
  }
  if (!isObject(nutrients)) throw new TypeError('nutrients must be an object');
  checkSlot(slot);
  checkStatus(status);
  if (nutrients.kcal === undefined) throw new RangeError('nutrients.kcal is required');
  const values = pickNutrients(nutrients);
  for (const key of NUTRIENT_KEYS) {
    if (!(Number.isFinite(values[key]) && values[key] >= 0)) {
      throw new RangeError(`nutrients.${key} must be a number >= 0, got ${show(values[key])}`);
    }
  }
  return {
    id,
    slot,
    foodId: null,
    servingId: null,
    qty: 1,
    status,
    snapshot: { name, grams: null, ...values },
  };
}

/**
 * Live values when entry.foodId is in foodIndex; otherwise the snapshot (deleted food, quick add).
 * If the live food no longer has the entry's serving, its live values are used at the snapshot's
 * grams.
 * @param {Entry} entry @param {Map<string, Food>} foodIndex @returns {Nutrients} unrounded
 */
export function entryNutrients(entry, foodIndex) {
  checkEntry(entry);
  const food = liveFood(entry, foodIndex);
  if (food) {
    if (findServing(food, entry.servingId)) {
      return nutrientsForGrams(food, gramsForPortion(food, entry.servingId, entry.qty));
    }
    if (Number.isFinite(entry.snapshot?.grams))
      return nutrientsForGrams(food, entry.snapshot.grams);
  }
  return pickNutrients(entry.snapshot);
}

/** @param {Entry} entry @param {Map<string, Food>} foodIndex @returns {number|null} grams; null for quick add. */
export function entryGrams(entry, foodIndex) {
  checkEntry(entry);
  if (entry.foodId == null) return null;
  const food = liveFood(entry, foodIndex);
  if (food && findServing(food, entry.servingId)) {
    return gramsForPortion(food, entry.servingId, entry.qty);
  }
  return Number.isFinite(entry.snapshot?.grams) ? entry.snapshot.grams : null;
}

/** Appends. Throws if an entry with the same id exists. @param {Day} day @param {Entry} entry @returns {Day} */
export function addEntry(day, entry) {
  checkDay(day);
  checkEntry(entry);
  if (day.entries.some((e) => e.id === entry.id)) {
    throw new RangeError(`duplicate entry id: ${entry.id}`);
  }
  return { ...day, entries: [...day.entries, entry] };
}

/** The entry after a validated patch, with its snapshot refreshed when qty or servingId changed. */
function patchedEntry(entry, patch, foodIndex) {
  const next = { ...entry };
  if (patch.slot !== undefined) {
    checkSlot(patch.slot);
    next.slot = patch.slot;
  }
  if (patch.status !== undefined) {
    checkStatus(patch.status);
    next.status = patch.status;
  }
  if (patch.qty !== undefined) {
    checkQty(patch.qty);
    next.qty = patch.qty;
  }
  if (patch.servingId !== undefined) next.servingId = patch.servingId;
  if (patch.qty === undefined && patch.servingId === undefined) return next;

  const food = liveFood(entry, foodIndex);
  if (food) {
    next.snapshot = snapshotFor(food, next.servingId, next.qty);
    return next;
  }
  // Quick add or deleted food: no record to recompute from, so only qty can change (pro rata).
  if (next.servingId !== entry.servingId) {
    throw new RangeError(
      `cannot change the serving of entry ${entry.id}: its food is not available`,
    );
  }
  const factor = next.qty / entry.qty;
  const grams = Number.isFinite(entry.snapshot?.grams) ? entry.snapshot.grams * factor : null;
  next.snapshot = {
    ...entry.snapshot,
    grams,
    ...scaleNutrients(pickNutrients(entry.snapshot), factor),
  };
  return next;
}

/**
 * @param {Day} day @param {string} entryId
 * @param {{ qty?: number, servingId?: string, status?: 'planned'|'eaten', slot?: SlotId }} patch
 * @param {Map<string, Food>} foodIndex used to refresh the snapshot when qty/servingId change.
 *   Unknown entry fields (e.g. Sprint 2 `boxRef`) are kept.
 * @returns {Day} unchanged copy if entryId is unknown.
 */
export function updateEntry(day, entryId, patch, foodIndex) {
  checkDay(day);
  if (!isObject(patch)) throw new TypeError('patch must be an object');
  for (const key of Object.keys(patch)) {
    if (!PATCH_KEYS.has(key)) throw new RangeError(`updateEntry cannot set ${show(key)}`);
  }
  return {
    ...day,
    entries: day.entries.map((e) => (e.id === entryId ? patchedEntry(e, patch, foodIndex) : e)),
  };
}

/** @param {Day} day @param {string} entryId @returns {Day} (undo = keep the previous Day object). */
export function removeEntry(day, entryId) {
  checkDay(day);
  return { ...day, entries: day.entries.filter((e) => e.id !== entryId) };
}

/**
 * Home/restaurant/dhaba switch. Keeps servingId and qty when newFood has that serving id;
 * otherwise keeps the grams (servingId 'g', qty = grams). Refreshes the snapshot.
 * @param {Entry} entry @param {Food} newFood @param {Map<string, Food>} foodIndex @returns {Entry}
 */
export function switchEntryFood(entry, newFood, foodIndex) {
  checkEntry(entry);
  if (!isObject(newFood) || typeof newFood.id !== 'string') {
    throw new TypeError('newFood must be a food');
  }
  if (entry.foodId == null) throw new RangeError('a quick add has no food to switch');
  let { servingId, qty } = entry;
  if (!findServing(newFood, servingId)) {
    const grams = entryGrams(entry, foodIndex);
    if (!(Number.isFinite(grams) && grams > 0)) {
      throw new RangeError(`cannot tell the grams of entry ${entry.id}`);
    }
    servingId = GRAMS;
    qty = grams;
  }
  return {
    ...entry,
    foodId: newFood.id,
    servingId,
    qty,
    snapshot: snapshotFor(newFood, servingId, qty),
  };
}

/** Tick a whole meal. @param {Day} day @param {SlotId} slot @param {'planned'|'eaten'} status @returns {Day} */
export function setSlotStatus(day, slot, status) {
  checkDay(day);
  checkSlot(slot);
  checkStatus(status);
  return {
    ...day,
    entries: day.entries.map((e) =>
      e.slot === slot && e.status !== status ? { ...e, status } : e,
    ),
  };
}

/**
 * Appends copies of fromDay's `fromSlot` entries to toDay's `toSlot`, with fresh ids from makeId().
 * Copies carry only the Entry fields of ARCHITECTURE §4.3 (never a Sprint 2 `boxRef`).
 * @param {Day} fromDay @param {SlotId} fromSlot @param {Day} toDay @param {SlotId} toSlot
 * @param {() => string} makeId
 * @param {{ status?: 'planned'|'eaten' }} [options] status of the copies, default 'planned'
 * @returns {Day} the new toDay
 */
export function copySlot(fromDay, fromSlot, toDay, toSlot, makeId, { status = 'planned' } = {}) {
  checkDay(fromDay);
  checkSlot(fromSlot);
  checkSlot(toSlot);
  const sources = fromDay.entries.filter((e) => e.slot === fromSlot);
  return appendCopies(toDay, sources, makeId, () => toSlot, status);
}

/**
 * Appends copies of every entry of fromDay to toDay (same slots), fresh ids, given status.
 * @param {Day} fromDay @param {Day} toDay @param {() => string} makeId
 * @param {{ status?: 'planned'|'eaten' }} [options] default 'planned'
 * @returns {Day}
 */
export function copyDay(fromDay, toDay, makeId, { status = 'planned' } = {}) {
  checkDay(fromDay);
  return appendCopies(toDay, fromDay.entries, makeId, (e) => e.slot, status);
}

/**
 * @param {Day} day @param {Map<string, Food>} foodIndex
 * @param {{ include?: 'all'|'eaten'|'planned' }} [options] default 'all' (planned + eaten).
 *   "Left" in the UI uses 'eaten' (A12); planned food is shown as a separate figure.
 * @returns {{ total: Nutrients, bySlot: Record<SlotId, Nutrients> }} unrounded; every slot id present.
 */
export function dayTotals(day, foodIndex, { include = 'all' } = {}) {
  checkDay(day);
  if (!INCLUDES.includes(include)) {
    throw new RangeError(`include must be 'all', 'eaten' or 'planned', got ${show(include)}`);
  }
  const total = zero();
  const bySlot = Object.fromEntries(SLOT_IDS.map((slot) => [slot, zero()]));
  for (const entry of day.entries) {
    if (include !== 'all' && entry.status !== include) continue;
    const n = entryNutrients(entry, foodIndex);
    bySlot[entry.slot] ??= zero();
    for (const key of NUTRIENT_KEYS) {
      total[key] += n[key];
      bySlot[entry.slot][key] += n[key];
    }
  }
  return { total, bySlot };
}

function targetOf(targets, key) {
  const t = targets?.[key];
  return Number.isFinite(t) ? t : null;
}

/**
 * @param {Nutrients} total @param {Partial<Record<keyof Nutrients, number|null>>} targets
 * @returns {Record<keyof Nutrients, { value: number, target: number|null, pct: number|null,
 *   remaining: number|null }>} pct = value / target * 100 (unrounded); null when target is
 *   missing or 0; remaining = target - value (may be negative).
 */
export function progress(total, targets) {
  if (!isObject(total)) throw new TypeError('total must be a Nutrients object');
  const out = {};
  for (const key of NUTRIENT_KEYS) {
    const value = total[key] ?? 0;
    const target = targetOf(targets, key);
    const usable = target !== null && target !== 0;
    out[key] = {
      value,
      target,
      pct: usable ? (value / target) * 100 : null,
      remaining: usable ? target - value : null,
    };
  }
  return out;
}

/**
 * @param {Record<string, Day>} daysByDate @param {string[]} dates @param {Map<string, Food>} foodIndex
 * @param {Partial<Nutrients>|null} targets
 * @returns {{ date: string, total: Nutrients, entries: number,
 *   pct: Record<keyof Nutrients, number|null> }[]} one row per date, in order; missing days = zeros.
 */
export function weekSummary(daysByDate, dates, foodIndex, targets) {
  if (!Array.isArray(dates)) throw new TypeError('dates must be an array');
  return dates.map((date) => {
    const day = daysByDate?.[date] ?? emptyDay(date);
    const { total } = dayTotals(day, foodIndex);
    const p = progress(total, targets);
    const pct = Object.fromEntries(NUTRIENT_KEYS.map((key) => [key, p[key].pct]));
    return { date, total, entries: day.entries.length, pct };
  });
}

/**
 * Average of `total` over rows with entries > 0; no such rows -> all zeros.
 * @param {{ total: Nutrients, entries: number }[]} rows @returns {Nutrients}
 */
export function averageTotals(rows) {
  if (!Array.isArray(rows)) throw new TypeError('rows must be an array');
  const logged = rows.filter((r) => r.entries > 0);
  if (logged.length === 0) return zero();
  return scaleNutrients(sumNutrients(logged.map((r) => r.total)), 1 / logged.length);
}

/**
 * Default slot for a new entry from the time of day, using RULES.mealSlots[preset][].hours =
 * [startMinute, endMinute): minutes since local midnight, half-open, may wrap past midnight
 * (start > end). No window matches -> 'snacks'. Unknown preset -> RangeError.
 * @param {number} minutes 0..1439 @param {object} rules RULES
 * @param {'default'|'spain'} [preset='default'] settings.slotPreset
 * @returns {SlotId}
 */
export function slotForTime(minutes, rules, preset = 'default') {
  if (!isObject(rules?.mealSlots)) throw new TypeError('rules.mealSlots is required');
  if (typeof preset !== 'string' || !Object.hasOwn(rules.mealSlots, preset)) {
    throw new RangeError(`unknown slot preset ${show(preset)}`);
  }
  const slots = rules.mealSlots[preset];
  if (!Array.isArray(slots)) throw new RangeError(`unknown slot preset ${show(preset)}`);
  if (!(Number.isFinite(minutes) && minutes >= 0 && minutes < MINUTES_PER_DAY)) {
    throw new RangeError(`minutes must be 0..1439, got ${show(minutes)}`);
  }
  for (const slot of slots) {
    if (!Array.isArray(slot?.hours)) continue;
    const [start, end] = slot.hours;
    const inside =
      start < end ? minutes >= start && minutes < end : minutes >= start || minutes < end;
    if (start !== end && inside) return slot.id;
  }
  return FALLBACK_SLOT;
}
