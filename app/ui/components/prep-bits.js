// Small shared pieces for recipes and meal prep (Sprint 2). Owner: Lena.
import { h } from '../dom.js';
import { fmtKcal, fmtGrams, fmtDateShort, relativeDay } from './format.js';

/** "650 kcal · 49.6 g protein · 69 g carbs · 18 g fat · 8.4 g fibre" */
export function macroLine(n, { hideKcal = false } = {}) {
  const g = (v) => fmtGrams(Math.round(v * 10) / 10);
  const parts = [];
  if (!hideKcal) parts.push(`${fmtKcal(n.kcal)} kcal`);
  parts.push(`${g(n.protein)} g protein`, `${g(n.carbs)} g carbs`, `${g(n.fat)} g fat`);
  parts.push(`${g(n.fiber)} g fibre`);
  return parts.join(' · ');
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

/** "Mon 2 Nov" with "Today"/"Tomorrow" in front when it applies. */
export function dayText(iso, today) {
  const rel = relativeDay(iso, today);
  return rel ? `${rel}, ${fmtDateShort(iso)}` : fmtDateShort(iso);
}

/**
 * Calm use-by wording (NUTRITION.md §5.4): never red, never a pop-up.
 * @param {{ storage: string }} box @param {string|null} useBy @param {string|null} status
 */
export function useByText(box, useBy, status, today) {
  if (!useBy) return box.storage === 'freezer' ? 'Frozen: no use-by until you move it' : '';
  if (status === 'past') return 'Past use-by, best not to eat';
  if (status === 'last-day') return `Last day: ${dayText(useBy, today)}`;
  return `Use by ${dayText(useBy, today)}`;
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
