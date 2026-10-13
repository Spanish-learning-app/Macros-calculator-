// Days, entries, copying and totals. Pure and immutable: every function returns new objects and
// never mutates its arguments. Owner: Hamza. Contract: docs/ARCHITECTURE.md §5.4.
// Step 0 stub: signatures are final.

/** @typedef {import('./types.js').Day} Day */
/** @typedef {import('./types.js').Entry} Entry */
/** @typedef {import('./types.js').Food} Food */
/** @typedef {import('./types.js').Nutrients} Nutrients */
/** @typedef {import('./types.js').SlotId} SlotId */

const todo = (name) => {
  throw new Error(`not implemented: days.${name}`);
};

export const SLOT_IDS = Object.freeze(['breakfast', 'lunch', 'evening', 'dinner', 'snacks']);
export const DEFAULT_SLOT_LABELS = Object.freeze({
  breakfast: 'Nashta',
  lunch: 'Lunch',
  evening: 'Shaam ki chai',
  dinner: 'Dinner',
  snacks: 'Snacks',
});

/** @param {string} date 'YYYY-MM-DD' @returns {Day} */
export function emptyDay(date) {
  return todo('emptyDay');
}

/**
 * @param {{ id: string, slot: SlotId, food: Food, servingId: string, qty: number,
 *   status?: 'planned'|'eaten' }} input status defaults to 'eaten' (the store passes 'planned'
 *   for future dates, A12)
 * @returns {Entry} with snapshot = { name, grams, ...nutrients } computed now (unrounded).
 */
export function createEntry({ id, slot, food, servingId, qty, status = 'eaten' }) {
  return todo('createEntry');
}

/**
 * Quick add (meal eaten out): no food record.
 * @param {{ id: string, slot: SlotId, name: string, nutrients: Partial<Nutrients> & { kcal: number },
 *   status?: 'planned'|'eaten' }} input missing macros become 0
 * @returns {Entry} foodId null, servingId null, qty 1, snapshot.grams null.
 */
export function createQuickEntry({ id, slot, name, nutrients, status = 'eaten' }) {
  return todo('createQuickEntry');
}

/**
 * Live values when entry.foodId is in foodIndex; otherwise the snapshot (deleted food, quick add).
 * @param {Entry} entry @param {Map<string, Food>} foodIndex @returns {Nutrients} unrounded
 */
export function entryNutrients(entry, foodIndex) {
  return todo('entryNutrients');
}

/** @param {Entry} entry @param {Map<string, Food>} foodIndex @returns {number|null} grams; null for quick add. */
export function entryGrams(entry, foodIndex) {
  return todo('entryGrams');
}

/** Appends. Throws if an entry with the same id exists. @param {Day} day @param {Entry} entry @returns {Day} */
export function addEntry(day, entry) {
  return todo('addEntry');
}

/**
 * @param {Day} day @param {string} entryId
 * @param {{ qty?: number, servingId?: string, status?: 'planned'|'eaten', slot?: SlotId }} patch
 * @param {Map<string, Food>} foodIndex used to refresh the snapshot when qty/servingId change
 * @returns {Day} unchanged copy if entryId is unknown.
 */
export function updateEntry(day, entryId, patch, foodIndex) {
  return todo('updateEntry');
}

/** @param {Day} day @param {string} entryId @returns {Day} (undo = keep the previous Day object). */
export function removeEntry(day, entryId) {
  return todo('removeEntry');
}

/**
 * Home/restaurant/dhaba switch. Keeps servingId and qty when newFood has that serving id;
 * otherwise keeps the grams (servingId 'g', qty = grams). Refreshes the snapshot.
 * @param {Entry} entry @param {Food} newFood @param {Map<string, Food>} foodIndex @returns {Entry}
 */
export function switchEntryFood(entry, newFood, foodIndex) {
  return todo('switchEntryFood');
}

/** Tick a whole meal. @param {Day} day @param {SlotId} slot @param {'planned'|'eaten'} status @returns {Day} */
export function setSlotStatus(day, slot, status) {
  return todo('setSlotStatus');
}

/**
 * Appends copies of fromDay's `fromSlot` entries to toDay's `toSlot`, with fresh ids from makeId().
 * @param {Day} fromDay @param {SlotId} fromSlot @param {Day} toDay @param {SlotId} toSlot
 * @param {() => string} makeId
 * @param {{ status?: 'planned'|'eaten' }} [options] status of the copies, default 'planned'
 * @returns {Day} the new toDay
 */
export function copySlot(fromDay, fromSlot, toDay, toSlot, makeId, { status = 'planned' } = {}) {
  return todo('copySlot');
}

/**
 * Appends copies of every entry of fromDay to toDay (same slots), fresh ids, given status.
 * @param {Day} fromDay @param {Day} toDay @param {() => string} makeId
 * @param {{ status?: 'planned'|'eaten' }} [options] default 'planned'
 * @returns {Day}
 */
export function copyDay(fromDay, toDay, makeId, { status = 'planned' } = {}) {
  return todo('copyDay');
}

/**
 * @param {Day} day @param {Map<string, Food>} foodIndex
 * @param {{ include?: 'all'|'eaten'|'planned' }} [options] default 'all' (planned + eaten).
 *   "Left" in the UI uses 'eaten' (A12); planned food is shown as a separate figure.
 * @returns {{ total: Nutrients, bySlot: Record<SlotId, Nutrients> }} unrounded; every slot id present.
 */
export function dayTotals(day, foodIndex, { include = 'all' } = {}) {
  return todo('dayTotals');
}

/**
 * @param {Nutrients} total @param {Partial<Record<keyof Nutrients, number|null>>} targets
 * @returns {Record<keyof Nutrients, { value: number, target: number|null, pct: number|null,
 *   remaining: number|null }>} pct = value / target * 100 (unrounded); null when target is
 *   missing or 0; remaining = target - value (may be negative).
 */
export function progress(total, targets) {
  return todo('progress');
}

/**
 * @param {Record<string, Day>} daysByDate @param {string[]} dates @param {Map<string, Food>} foodIndex
 * @param {Partial<Nutrients>|null} targets
 * @returns {{ date: string, total: Nutrients, entries: number,
 *   pct: Record<keyof Nutrients, number|null> }[]} one row per date, in order; missing days = zeros.
 */
export function weekSummary(daysByDate, dates, foodIndex, targets) {
  return todo('weekSummary');
}

/**
 * Average of `total` over rows with entries > 0; no such rows -> all zeros.
 * @param {{ total: Nutrients, entries: number }[]} rows @returns {Nutrients}
 */
export function averageTotals(rows) {
  return todo('averageTotals');
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
  return todo('slotForTime');
}

/**
 * When the logical day starts for a preset: the end minute of the window that wraps past midnight
 * (start > end), or 0 when no window wraps. Spain: dinner 20:00–01:00 -> 60, so food logged at
 * 00:30 counts toward the previous day. Default (Pakistani) preset -> 0.
 * @param {object} rules RULES @param {'default'|'spain'} [preset='default'] @returns {number}
 */
export function dayStartMinutes(rules, preset = 'default') {
  return todo('dayStartMinutes');
}
