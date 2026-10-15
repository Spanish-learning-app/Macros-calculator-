// Small shared pieces for recipes and meal prep (Sprint 2). Owner: Lena.
import { h } from '../dom.js';
import { fmtKcal, fmtGrams, fmtDateShort, relativeDay } from './format.js';
import { halalChip } from './food-bits.js';

/** "650 kcal · 49.6 g protein · 69 g carbs · 18 g fat · 8.4 g fibre" */
export function macroLine(n, { hideKcal = false } = {}) {
  const g = (v) => fmtGrams(Math.round(v * 10) / 10);
  const parts = [];
  if (!hideKcal) parts.push(`${fmtKcal(n.kcal)} kcal`);
  parts.push(`${g(n.protein)} g protein`, `${g(n.carbs)} g carbs`, `${g(n.fat)} g fat`);
  parts.push(`${g(n.fiber)} g fibre`);
  return parts.join(' · ');
}

/** A prep's name without its trailing "(lunch box)", "(breakfast jar)" or "(freezer dinner portion)". */
export function shortPrepName(name) {
  return String(name ?? '').replace(
    /\s*\([^()]*\b(box|jar|portion|breakfast|dinner)\b[^()]*\)\s*$/i,
    '',
  );
}

/** The container word of a prepared food: "box", "jar" or "portion" (RULES.mealPrep.prepServingIds). */
export function boxWord(food, rules) {
  const ids = rules?.mealPrep?.prepServingIds ?? ['box', 'jar', 'portion'];
  const id = food?.servings?.find((s) => s.default)?.id;
  return ids.includes(id) ? id : 'box';
}

/** "boxes", "jars", "portions", "days". */
export function pluralWord(word) {
  return word.endsWith('x') || word.endsWith('ch') ? `${word}es` : `${word}s`;
}

/** "1 box", "4 boxes". */
export function plural(n, word) {
  return `${n} ${n === 1 ? word : pluralWord(word)}`;
}

/** Day view style: "today", "tomorrow", "yesterday" (lowercase, they sit inside a sentence),
 * else the short date "Wed, 4 Nov". Priya's design note 3. */
export function dayText(iso, today) {
  const rel = relativeDay(iso, today);
  return rel ? rel.toLowerCase() : fmtDateShort(iso);
}

/**
 * Calm use-by wording (NUTRITION.md §5.4): never red, never a pop-up. Short, so a box row stays
 * two lines (Priya's note 2).
 * @param {{ storage: string }} box @param {string|null} useBy @param {string|null} status
 */
export function useByText(box, useBy, status, today) {
  if (!useBy) return box.storage === 'freezer' ? 'Frozen, no use-by yet' : '';
  if (status === 'past') return 'Past use-by, best not to eat';
  if (status === 'last-day') return `Last day (${dayText(useBy, today)})`;
  return `Use by ${dayText(useBy, today)}`;
}

/**
 * A box still in the freezer on (or after) the day it is planned for (Review 2, Bilal #4): said
 * calmly, with what to do. null when the box is not frozen or its day is still ahead.
 * @param {{ storage: string, movedToFridgeOn?: string|null }} box @param {string} date planned day
 * @param {string} today
 */
export function frozenDueText(box, date, today) {
  if (box?.storage !== 'freezer' || box.movedToFridgeOn || !date || date > today) return null;
  if (date === today) {
    return 'Still frozen, and it’s for today: defrost it in the microwave, then heat it right through.';
  }
  return `Still frozen. It was planned for ${dayText(date, today)}.`;
}

/**
 * The halal status as a chip, always visible (A17; Priya's note 1): the shared tappable chip for
 * `check` and `not-halal`, and a quiet static "Halal" chip otherwise (never green, never a tick).
 * @returns {{ chip: HTMLElement, reason: HTMLElement|null }}
 */
export function halalBadge(food, rules) {
  const shared = food ? halalChip(food, rules) : null;
  if (shared) return shared;
  const label = rules?.vocab?.halalStatuses?.find((s) => s.id === 'halal')?.label ?? 'Halal';
  return {
    chip: h(
      'span',
      {
        class: 'chip-halal chip-halal--halal',
        'data-testid': 'halal-chip',
        'data-status': 'halal',
      },
      label,
    ),
    reason: null,
  };
}

/** A small calm note line (kind: 'info' | 'last' | 'past'). */
export function noteEl(text, kind = 'info', testid = null) {
  if (!text) return null;
  return h('p', { class: ['prep-note', `prep-note--${kind}`], 'data-testid': testid }, text);
}

/** Copy text: the clipboard API when allowed, else a selected textarea the person copies. */
export async function copyText(text, fallbackHost) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Some Artifact frames block the clipboard; fall through to manual copy.
  }
  if (fallbackHost) {
    const area = h('textarea', { class: 'textarea', rows: 8, readonly: true }, text);
    fallbackHost.replaceChildren(h('p', { class: 'muted' }, 'Select the text and copy it:'), area);
    area.focus();
    area.select();
  }
  return false;
}

/** Library effort tiers (§13.1, Boss's "less cooking" request): absent means 'cook'. */
export const EFFORTS = Object.freeze(['cook', 'assemble', 'ready']);

/** 'cook' | 'assemble' | 'ready' for a LibraryRecipe (or null). */
export function effortOf(recipe) {
  return EFFORTS.includes(recipe?.effort) ? recipe.effort : 'cook';
}

/** Prep library filter: 'all', 'cook' or 'no-cook' (assemble and ready, 15 minutes or less). */
export function matchesEffort(recipe, filter) {
  if (filter === 'cook') return effortOf(recipe) === 'cook';
  if (filter === 'no-cook') return effortOf(recipe) !== 'cook';
  return true;
}

/**
 * Library cuisines (Sprint 3 variety brief, "Lena: UI hook"): the optional `cuisine` on a
 * LibraryRecipe, in chip order. An id outside this list still works and shows after these.
 */
export const CUISINES = Object.freeze([
  ['desi', 'Desi'],
  ['spanish', 'Spanish'],
  ['mediterranean', 'Mediterranean'],
  ['italian', 'Italian'],
  ['mexican', 'Mexican'],
  ['asian', 'Asian'],
  ['middle-eastern', 'Middle Eastern'],
  ['international', 'International'],
]);

/** The recipe's cuisine ids: `cuisine` as a string or a list; [] when untagged. */
export function cuisinesOf(recipe) {
  const c = recipe?.cuisine;
  const list = Array.isArray(c) ? c : [c];
  return list.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim());
}

/** "Middle Eastern" for 'middle-eastern'; an unknown id reads as its words. */
export function cuisineLabel(id) {
  const known = CUISINES.find(([k]) => k === id);
  if (known) return known[1];
  const words = String(id).replace(/-/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * The cuisine chips for a library list: [{ id, label, count }] for every cuisine with at least one
 * recipe, known ones first in CUISINES order. Untagged recipes count only under "All".
 * @param {{ recipe: object|null }[]} items
 */
export function cuisineChips(items) {
  const counts = new Map();
  for (const { recipe } of items) {
    for (const id of new Set(cuisinesOf(recipe))) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const order = CUISINES.map(([id]) => id);
  const rank = (id) => (order.includes(id) ? order.indexOf(id) : order.length);
  return [...counts.keys()]
    .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
    .map((id) => ({ id, label: cuisineLabel(id), count: counts.get(id) }));
}

/** Prep library cuisine filter: 'all' or a cuisine id. */
export function matchesCuisine(recipe, filter) {
  return filter === 'all' || cuisinesOf(recipe).includes(filter);
}

/** "45 min", "10 min, no cooking", "No cooking", "Ready to eat", or null when unknown. */
export function effortText(recipe) {
  const effort = effortOf(recipe);
  const m =
    Number.isFinite(recipe?.minutes) && recipe.minutes > 0 ? Math.round(recipe.minutes) : null;
  if (effort === 'ready') return 'Ready to eat';
  if (effort === 'assemble') return m ? `${m} min, no cooking` : 'No cooking';
  return m ? `${m} min` : null;
}
