// Small pieces shared by every food row: the halal chip (with its reason one tap away), the
// "estimate" badge for confidence C, the style label and the Urdu subtitle. Owner: Priya.
// Meeting 002: a calm chip for `check` and `not-halal`, labels from RULES.vocab.halalStatuses,
// no chip for `halal`, no red and never a big green tick.
import { h, uid } from '../dom.js';
import { iconEl } from './icons.js';

/**
 * Halal chip plus its reason line. Returns null for `halal` foods.
 * Place `chip` inline and `reason` where a full-width line fits (it starts hidden).
 * @param {object} food @param {object} rules
 * @returns {{ chip: HTMLButtonElement, reason: HTMLElement }|null}
 */
export function halalChip(food, rules) {
  const status = food?.halal?.status;
  if (!status || status === 'halal') return null;
  const meta = rules?.vocab?.halalStatuses?.find((s) => s.id === status);
  const label = meta?.label ?? (status === 'check' ? 'Check' : 'Not halal');
  const reasonId = uid('halal');
  const reason = h(
    'p',
    {
      class: ['halal-reason', `halal-reason--${status}`],
      id: reasonId,
      'data-testid': 'halal-reason',
      hidden: true,
    },
    h('strong', null, `${label}: `),
    food.halal.reason ?? '',
  );
  const chip = h(
    'button',
    {
      type: 'button',
      class: ['chip-halal', `chip-halal--${status}`],
      'data-testid': 'halal-chip',
      'data-status': status,
      'aria-expanded': 'false',
      'aria-controls': reasonId,
      'aria-label': `Halal: ${label}. Show why`,
      onclick: (event) => {
        event.stopPropagation();
        const open = reason.hidden;
        reason.hidden = !open;
        chip.setAttribute('aria-expanded', String(open));
      },
    },
    iconEl('info', 14),
    h('span', null, label),
  );
  return { chip, reason };
}

/** "estimate" badge for confidence-C foods (RULES.vocab.confidenceGrades[].badge), else null. */
export function estimateBadge(food, rules) {
  const grade = food?.source?.confidence;
  const badge = rules?.vocab?.confidenceGrades?.find((g) => g.id === grade)?.badge;
  if (!badge) return null;
  return h(
    'span',
    {
      class: 'badge-estimate',
      'data-testid': 'estimate-badge',
      title: 'Numbers vary a lot between cooks',
    },
    badge,
  );
}

/** "Restaurant", "Home-made"… for foods that have style variants, else null. */
export function styleLabel(food, rules) {
  if (!food?.style || !food.family) return null;
  return rules?.vocab?.styles?.find((s) => s.id === food.style)?.label ?? food.style;
}

/** Urdu name as a right-to-left subtitle, or null. */
export function urduName(food) {
  if (!food?.nameUr) return null;
  return h('span', { class: 'name-ur', lang: 'ur', dir: 'rtl' }, food.nameUr);
}
