// One logged food. Owner: Priya.
// Reads like "1½ katori · 300 g · 480 kcal". One tap on the circle toggles planned/eaten (icon and
// text, not colour alone, A12); tapping the row edits it; "More" offers move to another day
// (team/DECISIONS.md) and delete with Undo (A13).
import { h } from '../dom.js';
import { iconEl } from './icons.js';
import { halalChip, estimateBadge, styleLabel } from './food-bits.js';
import {
  fmtKcal,
  fmtGrams,
  portionText,
  servingOf,
  entryNutrientsOf,
  entryGramsOf,
} from './format.js';

/**
 * The portion line of an entry.
 * @param {object} entry @param {object|undefined} food @param {{ hideKcal?: boolean }} [opts]
 */
export function entryLine(entry, food, { hideKcal = false } = {}) {
  const n = entryNutrientsOf(entry, food);
  const parts = [];
  if (!entry.foodId) {
    parts.push('Quick add');
  } else {
    const serving = food ? servingOf(food, entry.servingId) : null;
    const grams = entryGramsOf(entry, food);
    if (serving && serving.id !== 'g') parts.push(portionText(serving, entry.qty));
    if (grams !== null) parts.push(`${fmtGrams(grams)} g`);
  }
  if (!hideKcal) parts.push(`${fmtKcal(n.kcal)} kcal`);
  return parts.join(' · ');
}

/**
 * @param {{ entry: object, food: object|undefined, rules: object, hideKcal?: boolean,
 *   note?: { text: string, kind: 'info'|'last'|'past' }|null,
 *   onToggle: () => void, onEdit: () => void, onMore: () => void }} props
 * @returns {HTMLLIElement}
 */
export function renderEntryRow({
  entry,
  food,
  rules,
  hideKcal = false,
  note = null,
  onToggle,
  onEdit,
  onMore,
}) {
  const name = entry.snapshot?.name ?? food?.name ?? 'Food';
  const displayName = food?.name ?? name;
  const eaten = entry.status === 'eaten';
  const halal = food ? halalChip(food, rules) : null;
  const style = food ? styleLabel(food, rules) : null;
  const badge = food ? estimateBadge(food, rules) : null;

  return h(
    'li',
    {
      class: ['entry', eaten ? 'entry--eaten' : 'entry--planned'],
      'data-testid': 'entry',
      'data-entry-id': entry.id,
      'data-status': entry.status,
      'data-food-id': entry.foodId ?? '',
    },
    h(
      'button',
      {
        type: 'button',
        class: 'entry-status',
        'aria-pressed': String(eaten),
        'aria-label': eaten ? `Mark ${displayName} as planned` : `Mark ${displayName} as eaten`,
        'data-focus-key': `status-${entry.id}`,
        onclick: onToggle,
      },
      iconEl(eaten ? 'circleCheck' : 'circleDashed', 26),
    ),
    h(
      'button',
      {
        type: 'button',
        class: 'entry-main',
        'data-focus-key': `edit-${entry.id}`,
        onclick: onEdit,
      },
      h('span', { class: 'entry-name' }, displayName),
      h(
        'span',
        { class: 'entry-tags' },
        eaten ? null : h('span', { class: 'tag-planned' }, 'Planned'),
        style ? h('span', { class: 'tag-style' }, style) : null,
        badge,
      ),
      h('span', { class: 'entry-line' }, entryLine(entry, food, { hideKcal })),
      // Meal-prep box: which box, fridge or freezer, use-by in calm words (Sprint 2, A18).
      note
        ? h(
            'span',
            { class: ['entry-note', `entry-note--${note.kind}`], 'data-testid': 'entry-note' },
            note.text,
          )
        : null,
    ),
    h(
      'button',
      {
        type: 'button',
        class: 'btn-icon entry-more',
        'aria-label': `More for ${displayName}`,
        'aria-haspopup': 'dialog',
        'data-focus-key': `more-${entry.id}`,
        onclick: onMore,
      },
      iconEl('more'),
    ),
    halal ? h('div', { class: 'entry-halal' }, halal.chip) : null,
    halal ? halal.reason : null,
  );
}
