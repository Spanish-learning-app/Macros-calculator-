// Food search, ranking and recents. Pure. Must stay under 16 ms per query on 2,000 foods.
// Owner: Hamza. Contract: docs/ARCHITECTURE.md §5.6.

import { isISODate, diffDays } from './dates.js';
import { ENTRY_SLOT_IDS } from './days.js';
import { STYLES } from './foods.js';

/** @typedef {import('./types.js').Food} Food */
/** @typedef {import('./types.js').Recent} Recent */
/** @typedef {import('./types.js').SlotId} SlotId */

/** Score of each match tier. Boost adds at most BOOST_WEIGHT, so it never crosses a tier. */
export const TIERS = Object.freeze({
  exact: 100,
  prefix: 80,
  wordPrefix: 60,
  substring: 40,
  fuzzy: 20,
});
export const BOOST_WEIGHT = 19;

const FUZZY_MIN_LENGTH = 4; // a query word needs 4+ letters to match fuzzily, and a query 4+ for substring
const FUZZY_PREFIX_MIN_LENGTH = 5; // a typo inside a longer word's prefix needs 5+ letters ("kela" ≠ kebab)
const FUZZY_FILL_BELOW = 3; // fuzzy matches only fill in when the other tiers find fewer foods (Review 1)
const TIER_BELOW = {
  exact: 'prefix',
  prefix: 'wordPrefix',
  wordPrefix: 'substring',
  substring: 'fuzzy',
};
const KIND_RANK = { own: 0, single: 1, prep: 2 };
const RECENCY_DAYS = 30;
const COUNT_FOR_FULL_BOOST = 10;
const DEFAULT_RECENT_LIMIT = 12;

const COMBINING_MARKS = /\p{M}/gu; // accents and Arabic harakat (U+064B–U+065F, U+0670) after NFKD
const MIDDLE_DOTS = /[·‧]/g; // Catalan l·l (and U+0140, which NFKD splits into l + U+00B7)
const FORMAT_CHARS = /\p{Cf}/gu; // ZWNJ, ZWJ, direction marks: removed so they never split a word
const ARABIC_UNIFY = { ي: 'ی', ك: 'ک', ة: 'ہ' };
const ARABIC_UNIFY_RE = /[يكة]/g;
const PUNCTUATION = /[^\p{L}\p{N}\s]/gu;

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const COLLATOR = new Intl.Collator('en');
const clamp01 = (x) => (Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : 0);

/**
 * Lowercase; NFKD and strip combining marks (accents folded: ñ->n, ç->c, à/è/é/í/ï/ò/ó/ú/ü ->
 * plain: 'ensaïmada' -> 'ensaimada', 'pa amb tomàquet' -> 'pa amb tomaquet', 'café' -> 'cafe');
 * delete the Catalan middle dot (U+00B7, U+2027: 'col·liflor' -> 'colliflor'); strip Arabic harakat
 * (U+064B–U+065F, U+0670); unify ي->ی, ك->ک, ة->ہ; other punctuation -> space; collapse 'aa'->'a',
 * 'ee'->'i', 'oo'->'u' (Latin only); collapse whitespace; trim.
 * @param {string} text @returns {string}
 */
export function normalize(text) {
  if (typeof text !== 'string') throw new TypeError('normalize takes a string');
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .replace(MIDDLE_DOTS, '')
    .replace(FORMAT_CHARS, '')
    .replace(ARABIC_UNIFY_RE, (c) => ARABIC_UNIFY[c])
    .replace(PUNCTUATION, ' ')
    .replace(/a{2,}/g, 'a')
    .replace(/e{2,}/g, 'i')
    .replace(/o{2,}/g, 'u')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Searches name, shortName (Sprint 3: what rows show), nameRoman, nameUr and aliases.
 * @param {Food[]} foods @returns {object} opaque index
 */
export function buildSearchIndex(foods) {
  if (!Array.isArray(foods)) throw new TypeError('buildSearchIndex takes an array of foods');
  const entries = [];
  for (const food of foods) {
    if (!isObject(food)) continue;
    const originals = [food.name, food.shortName, food.nameRoman, food.nameUr];
    if (Array.isArray(food.aliases)) originals.push(...food.aliases);
    const names = [];
    for (const original of originals) {
      if (typeof original !== 'string') continue;
      const norm = normalize(original);
      if (norm !== '') names.push({ original, norm, words: norm.split(' ') });
    }
    entries.push({ food, names, sortName: String(food.name ?? '') });
  }
  return { entries };
}

/**
 * What a food is, for ranking (Review 2): 'own' (the person's recipe or chai, `userRecipe`),
 * 'prep' (a Lab meal-prep box, jar or portion: group `lunchbox`) or 'single' (everything else).
 * @param {Food} food @returns {'own'|'single'|'prep'}
 */
export function foodKind(food) {
  if (food?.userRecipe === true) return 'own';
  return food?.group === 'lunchbox' ? 'prep' : 'single';
}

/**
 * English and Spanish plurals to the singular, one normalized word at a time (Review 2: "potatoes",
 * "onions", "eggs", "patatas"). Words under 4 letters and -ss/-us/-is words stay as they are.
 * @param {string} word normalized @returns {string}
 */
export function singularWord(word) {
  if (typeof word !== 'string' || word.length < 4 || !/^[a-z]+$/.test(word)) return word;
  if (word.length >= 5 && word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (/(oes|ches|shes|xes|sses)$/.test(word)) return word.slice(0, -2);
  if (/(ss|us)$/.test(word)) return word; // "rotis" -> "roti", "kiwis" -> "kiwi" (BUG-S1)
  return word.endsWith('s') ? word.slice(0, -1) : word;
}

/** Shorter `matched`, then style, then the slot's hints, then name and id (Review 1 order). */
function natural(a, b) {
  return (
    a.hit.matched.length - b.hit.matched.length ||
    a.style - b.style ||
    a.hint - b.hint ||
    COLLATOR.compare(a.sortName, b.sortName) ||
    COLLATOR.compare(String(a.hit.food.id), String(b.hit.food.id))
  );
}

/**
 * Everyday foods (no style) and home style rank 0, then STYLES order: home-light (kam tel, Sprint 3:
 * right after home), restaurant, dhaba, street.
 */
function styleRank(food) {
  const i = STYLES.indexOf(food?.style);
  return i <= 0 ? 0 : i;
}

/** a[from + shift..] equals b[from..] to the end of b (no allocation). */
function tailsEqual(a, b, from, shift) {
  for (let k = from; k < b.length; k += 1) {
    if (a.charCodeAt(k + shift) !== b.charCodeAt(k)) return false;
  }
  return true;
}

/** True when a and b are within Damerau-Levenshtein (OSA) distance 1. Linear, no allocation. */
function withinOneEdit(a, b) {
  if (a === b) return true;
  const la = a.length;
  const lb = b.length;
  if (la - lb > 1 || lb - la > 1) return false;
  let i = 0;
  while (i < la && i < lb && a.charCodeAt(i) === b.charCodeAt(i)) i += 1;
  if (la === lb + 1) return tailsEqual(a, b, i, 1); // delete a[i]
  if (lb === la + 1) return tailsEqual(b, a, i, 1); // insert b[i]
  if (tailsEqual(a, b, i + 1, 0)) return true; // substitute at i
  return a[i] === b[i + 1] && a[i + 1] === b[i] && tailsEqual(a, b, i + 2, 0); // swap i, i + 1
}

function wordPrefixes(qWords, words) {
  return qWords.every((q) => words.some((w) => w.startsWith(q)));
}

function fuzzyWord(q, w) {
  if (q.charCodeAt(0) !== w.charCodeAt(0)) return false; // typos rarely hit the first letter
  if (withinOneEdit(q, w)) return true;
  return (
    q.length >= FUZZY_PREFIX_MIN_LENGTH &&
    w.length > q.length &&
    withinOneEdit(q, w.slice(0, q.length))
  );
}

function fuzzyWords(qWords, words) {
  return qWords.every((q) => {
    if (q.length < FUZZY_MIN_LENGTH) return words.some((w) => w.startsWith(q));
    return words.some((w) => fuzzyWord(q, w));
  });
}

/** The best tier of one normalized name for the query, or null. */
function tierOf(name, q, qWords) {
  if (name.norm === q) return 'exact';
  if (name.norm.startsWith(q)) return 'prefix';
  if (wordPrefixes(qWords, name.words)) return 'wordPrefix';
  if (q.length >= FUZZY_MIN_LENGTH && name.norm.includes(q)) return 'substring';
  if (fuzzyWords(qWords, name.words)) return 'fuzzy';
  return null;
}

/**
 * The tier of a name for the singular form of a plural query ("potatoes" -> "potato"). A changed
 * word must equal a whole word of the name ("peas" -> "pea" is not "peanut"); other words prefix.
 */
function singularTierOf(name, alt) {
  if (!alt) return null;
  if (name.norm === alt.q) return 'exact';
  const n = name.norm;
  if (n.startsWith(alt.q) && n.charCodeAt(alt.q.length) === 32) return 'prefix'; // no allocation
  const ok = alt.words.every((w, i) =>
    w === alt.from[i] ? name.words.some((n) => n.startsWith(w)) : name.words.includes(w),
  );
  return ok ? 'wordPrefix' : null;
}

/** Best match of one food: highest tier, then the shortest original name. */
function bestMatch(entry, q, qWords, allowFuzzy, alt = null) {
  let best = null;
  for (const name of entry.names) {
    let tier = tierOf(name, q, qWords);
    const plural = tier === 'exact' ? null : singularTierOf(name, alt);
    if (plural && (!tier || TIERS[plural] > TIERS[tier])) tier = plural;
    if (tier === 'fuzzy' && !allowFuzzy) continue;
    if (!tier) continue;
    const better =
      !best ||
      TIERS[tier] > TIERS[best.tier] ||
      (TIERS[tier] === TIERS[best.tier] && name.original.length < best.matched.length);
    if (better) best = { tier, matched: name.original };
  }
  return best;
}

/**
 * Best tier per food over its names (name, nameRoman, nameUr, aliases), all normalized:
 *   exact      whole name === query
 *   prefix     name starts with query
 *   wordPrefix every query word is a prefix of some word of the name (any order)
 *   substring  name contains query (a query of 4+ chars: "naan" -> "nan" is not banana)
 *   fuzzy      every query word of >= 4 chars has the same first letter as some word of the name
 *              and is within Damerau-Levenshtein (OSA: insert, delete, substitute, adjacent swap)
 *              distance 1 of that word, or (query word of >= 5 chars) of that word's prefix of the
 *              same length; shorter query words must word-prefix
 *              (karhai -> karahi, dhal -> dal, anday -> anda, samosay -> samosa).
 *              Fuzzy only fills in: it is used only when the other tiers match fewer than 3 foods
 *              (Review 1: "kela" no longer brings kebab and corn flakes).
 * A plural query also matches the singular (singularWord: "potatoes" finds "potato", as a whole word).
 * A Lab prep (foodKind 'prep') matches one tier lower (exact counts as prefix, and so on), so
 * "roti" lists rotis before roti boxes (Review 2).
 * score = TIERS[tier] + BOOST_WEIGHT * clamp(boosts[id] ?? 0, 0, 1). Sort: the person's own
 * recipes first (foodKind 'own', any tier but fuzzy: the only case where a lower score comes
 * first); then score desc, then single foods before preps, then shorter `matched`, then style (everyday or home first, then home-light, restaurant, dhaba,
 * street: Review 1, home chai before dhaba chai), then foods whose id is in `hints` (the slot's
 * meal hints) first, then name (en). Style variants of one family with the same score form one
 * block at the place of the family's best match, ordered by style inside (Sprint 3). Blank query -> no hits. `matched` = the original (unnormalized) string.
 * Halal filter (meeting 002): with halalOnly (default true), foods whose halal.status is
 * 'not-halal' are moved from `hits` to `hidden` (same order), so the UI can say
 * "1 hidden: not halal" and show the reason. 'check' foods stay in hits. `limit` applies to hits.
 * @param {object} index @param {string} query
 * @param {{ limit?: number, boosts?: Record<string, number>, halalOnly?: boolean,
 *   hints?: Iterable<string> }} [options]
 * @returns {{ hits: SearchHit[], hidden: SearchHit[] }}
 *   SearchHit = { food: Food, score: number, tier: keyof TIERS, matched: string }
 */
export function searchFoods(
  index,
  query,
  { limit = 20, boosts = {}, halalOnly = true, hints = [] } = {},
) {
  if (!Array.isArray(index?.entries)) throw new TypeError('index must come from buildSearchIndex');
  if (!(limit === Infinity || (Number.isInteger(limit) && limit >= 0))) {
    throw new RangeError(`limit must be an integer >= 0, got ${limit}`);
  }
  const q = normalize(query ?? '');
  if (q === '') return { hits: [], hidden: [] };
  const qWords = q.split(' ');
  const altWords = qWords.map(singularWord);
  const alt = altWords.some((w, i) => w !== qWords[i])
    ? { q: altWords.join(' '), words: altWords, from: qWords }
    : null;

  const hinted = new Set(hints ?? []);
  const collect = (allowFuzzy) => {
    const out = [];
    for (const entry of index.entries) {
      const best = bestMatch(entry, q, qWords, allowFuzzy, alt);
      if (!best) continue;
      const kind = foodKind(entry.food);
      const own = kind === 'own' && best.tier !== 'fuzzy' ? 0 : 1;
      // A Lab prep's match counts one tier lower ("roti" lists rotis before roti boxes).
      if (kind === 'prep') best.tier = TIER_BELOW[best.tier] ?? best.tier;
      const boost = clamp01(boosts?.[entry.food.id] ?? 0);
      out.push({
        hit: { food: entry.food, score: TIERS[best.tier] + BOOST_WEIGHT * boost, ...best },
        own,
        kind: KIND_RANK[kind],
        sortName: entry.sortName,
        style: styleRank(entry.food),
        hint: hinted.has(entry.food.id) ? 0 : 1,
      });
    }
    return out;
  };
  let matches = collect(false);
  if (matches.length < FUZZY_FILL_BELOW) matches = collect(true);
  // Style variants of one dish (same family, same score) stay together, in style order (home,
  // home-light, restaurant, dhaba, street), where the family's best match would be (Sprint 3:
  // kam tel right after home, whatever the names' lengths). A food with no family leads itself.
  const leaders = new Map();
  for (const m of matches) {
    const family = m.hit.food.family;
    if (!family) {
      m.lead = m;
      continue;
    }
    const key = `${family}|${m.own}|${m.hit.score}|${m.kind}`;
    const lead = leaders.get(key);
    if (!lead || natural(m, lead) < 0) leaders.set(key, m);
    m.leadKey = key;
  }
  for (const m of matches) if (m.leadKey) m.lead = leaders.get(m.leadKey);
  matches.sort(
    (a, b) =>
      a.own - b.own ||
      b.hit.score - a.hit.score ||
      a.kind - b.kind ||
      natural(a.lead, b.lead) ||
      a.style - b.style ||
      natural(a, b),
  );

  const hits = [];
  const hidden = [];
  for (const { hit } of matches) {
    const { food, score, tier, matched } = hit;
    const ordered = { food, score, tier, matched };
    if (halalOnly && food.halal?.status === 'not-halal') hidden.push(ordered);
    else if (hits.length < limit) hits.push(ordered);
  }
  return { hits, hidden };
}

/**
 * Remember a use: count + 1, lastUsed = date, servingId/qty = this use, slots[slot] + 1.
 * @param {Record<string, Recent>} recents
 * @param {{ foodId: string, servingId: string, qty: number, slot: SlotId, date: string }} use
 * @returns {Record<string, Recent>} new object
 */
export function recordUse(recents, use) {
  if (!isObject(use)) throw new TypeError('use must be an object');
  const { foodId, servingId, qty, slot, date } = use;
  if (typeof foodId !== 'string' || foodId === '') throw new TypeError('foodId must be a string');
  if (typeof servingId !== 'string' || servingId === '') {
    throw new TypeError('servingId must be a string');
  }
  if (!(Number.isFinite(qty) && qty > 0)) throw new RangeError(`qty must be > 0, got ${qty}`);
  if (!ENTRY_SLOT_IDS.includes(slot)) throw new RangeError(`unknown slot '${slot}'`);
  if (!isISODate(date)) throw new RangeError(`date must be 'YYYY-MM-DD', got '${date}'`);
  const prev = recents?.[foodId];
  const slots = { ...(prev?.slots ?? {}) };
  slots[slot] = (slots[slot] ?? 0) + 1;
  return {
    ...(recents ?? {}),
    [foodId]: { servingId, qty, count: (prev?.count ?? 0) + 1, lastUsed: date, slots },
  };
}

/**
 * boost = 0.5 * min(1, count / 10) + 0.5 * max(0, 1 - daysSince(lastUsed, today) / 30), in [0, 1].
 * @param {Record<string, Recent>} recents @param {string} today @returns {Record<string, number>}
 */
export function recencyBoosts(recents, today) {
  if (!isISODate(today)) throw new RangeError(`today must be 'YYYY-MM-DD', got '${today}'`);
  const out = {};
  for (const [id, r] of Object.entries(recents ?? {})) {
    const count = Number.isFinite(r?.count) ? Math.max(0, r.count) : 0;
    const frequency = Math.min(1, count / COUNT_FOR_FULL_BOOST);
    const daysSince = isISODate(r?.lastUsed) ? Math.max(0, diffDays(r.lastUsed, today)) : Infinity;
    const recency = Math.max(0, 1 - daysSince / RECENCY_DAYS);
    out[id] = clamp01(0.5 * frequency + 0.5 * recency);
  }
  return out;
}

/**
 * Every recent food id, those used in `slot` first: sort by slots[slot] (missing = 0) desc, then
 * count desc, then lastUsed desc, then id. A chai logged only at Nashta still appears for Shaam ki
 * chai (A6).
 * @param {Record<string, Recent>} recents @param {SlotId} slot
 * @param {{ limit?: number }} [options] default 12
 * @returns {string[]}
 */
export function recentForSlot(recents, slot, { limit = DEFAULT_RECENT_LIMIT } = {}) {
  if (!(limit === Infinity || (Number.isInteger(limit) && limit >= 0))) {
    throw new RangeError(`limit must be an integer >= 0, got ${limit}`);
  }
  const rows = Object.entries(recents ?? {}).map(([id, r]) => ({
    id,
    inSlot: r?.slots?.[slot] ?? 0,
    count: r?.count ?? 0,
    lastUsed: typeof r?.lastUsed === 'string' ? r.lastUsed : '',
  }));
  rows.sort(
    (a, b) =>
      b.inSlot - a.inSlot ||
      b.count - a.count ||
      (a.lastUsed < b.lastUsed ? 1 : a.lastUsed > b.lastUsed ? -1 : 0) ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
  return rows.slice(0, limit).map((r) => r.id);
}
