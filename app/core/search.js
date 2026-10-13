// Food search, ranking and recents. Pure. Must stay under 16 ms per query on 2,000 foods.
// Owner: Hamza. Contract: docs/ARCHITECTURE.md §5.6. Step 0 stub: signatures are final.

/** @typedef {import('./types.js').Food} Food */
/** @typedef {import('./types.js').Recent} Recent */
/** @typedef {import('./types.js').SlotId} SlotId */

const todo = (name) => {
  throw new Error(`not implemented: search.${name}`);
};

/** Score of each match tier. Boost adds at most BOOST_WEIGHT, so it never crosses a tier. */
export const TIERS = Object.freeze({
  exact: 100,
  prefix: 80,
  wordPrefix: 60,
  substring: 40,
  fuzzy: 20,
});
export const BOOST_WEIGHT = 19;

/**
 * Lowercase; NFKD and strip combining marks (ñ -> n); strip Arabic harakat (U+064B–U+065F,
 * U+0670); unify ي->ی, ك->ک, ة->ہ; punctuation -> space; collapse 'aa'->'a', 'ee'->'i',
 * 'oo'->'u' (Latin only); collapse whitespace; trim.
 * @param {string} text @returns {string}
 */
export function normalize(text) {
  return todo('normalize');
}

/** Searches name, nameRoman, nameUr and aliases. @param {Food[]} foods @returns {object} opaque index */
export function buildSearchIndex(foods) {
  return todo('buildSearchIndex');
}

/**
 * Best tier per food over its names: exact > prefix > wordPrefix (every query word is a prefix of
 * some word) > substring > fuzzy (every query word of >= 4 chars within 1 edit of some word; shorter
 * words must word-prefix). score = TIERS[tier] + BOOST_WEIGHT * clamp(boosts[id] ?? 0, 0, 1).
 * Sort: score desc, then shorter `matched`, then name (en). Blank query -> [].
 * @param {object} index @param {string} query
 * @param {{ limit?: number, boosts?: Record<string, number> }} [options] limit default 20
 * @returns {{ food: Food, score: number, tier: keyof TIERS, matched: string }[]}
 */
export function searchFoods(index, query, { limit = 20, boosts = {} } = {}) {
  return todo('searchFoods');
}

/**
 * Remember a use: count + 1, lastUsed = date, servingId/qty = this use, slots[slot] + 1.
 * @param {Record<string, Recent>} recents
 * @param {{ foodId: string, servingId: string, qty: number, slot: SlotId, date: string }} use
 * @returns {Record<string, Recent>} new object
 */
export function recordUse(recents, use) {
  return todo('recordUse');
}

/**
 * boost = 0.5 * min(1, count / 10) + 0.5 * max(0, 1 - daysSince(lastUsed, today) / 30), in [0, 1].
 * @param {Record<string, Recent>} recents @param {string} today @returns {Record<string, number>}
 */
export function recencyBoosts(recents, today) {
  return todo('recencyBoosts');
}

/**
 * Food ids used in `slot`, most used first (slots[slot] desc, then lastUsed desc, then id).
 * @param {Record<string, Recent>} recents @param {SlotId} slot
 * @param {{ limit?: number }} [options] default 12
 * @returns {string[]}
 */
export function recentForSlot(recents, slot, { limit = 12 } = {}) {
  return todo('recentForSlot');
}
