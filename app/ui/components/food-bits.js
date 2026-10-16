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
    // A recipe names the ingredient the reason is about (ARCHITECTURE §13.2).
    food.halal.ingredient ? `${food.halal.ingredient}. ` : '',
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

/**
 * The name a narrow row shows: `shortName` when the Lab gave one (Sprint 3, rules 1.7.0 field
 * rules), else `name`. The full name stays in the details and in fullNameLine().
 */
export function rowName(food) {
  return typeof food?.shortName === 'string' && food.shortName.trim() ? food.shortName : food?.name;
}

/** The full name as a quiet second line, only when the row shows a short name; else null. */
export function fullNameLine(food) {
  if (!food || rowName(food) === food.name) return null;
  return h(
    'span',
    { class: 'food-fullname', 'data-testid': 'food-fullname', title: food.name },
    food.name,
  );
}

/** Words for the optional `serve` note on a lunchbox prep (Meeting 004 C, STATUS O3). */
export const SERVE_TEXT = Object.freeze({
  cold: 'Good cold',
  hot: 'Microwave',
  either: 'Hot or cold',
});

/**
 * A quiet "Good cold" / "Microwave" / "Hot or cold" chip for a meal-prep food or its library
 * recipe (Mariam #7: the 13:30 microwave queue), else null. The food's own `serve` wins.
 * @param {...object|null} sources the food record, then the library recipe
 */
export function serveChip(...sources) {
  const serve = sources.map((s) => s?.serve).find((v) => typeof v === 'string' && SERVE_TEXT[v]);
  if (!serve) return null;
  return h(
    'span',
    { class: 'tag-style tag-serve', 'data-testid': 'serve-chip', 'data-serve': serve },
    SERVE_TEXT[serve],
  );
}

/** "half", "a third"… for RULES.kamTel.addedFatFraction; else "{n} %". */
function fractionWords(f) {
  const words = [
    [0.5, 'half'],
    [1 / 3, 'a third of'],
    [0.25, 'a quarter of'],
    [2 / 3, 'two thirds of'],
    [0.75, 'three quarters of'],
  ];
  const hit = words.find(([v]) => Math.abs(v - f) < 0.02);
  return hit ? hit[1] : `${Math.round(f * 100)} % of`;
}

/** The kam-tel sentence for a 'home-light' food (STATUS O11), else ''. */
export function kamTelText(food, rules) {
  const kt = rules?.kamTel;
  const style = kt?.style ?? 'home-light';
  if (food?.style !== style) return '';
  const f = Number(kt?.addedFatFraction);
  const amount = Number.isFinite(f) && f > 0 && f < 1 ? fractionWords(f) : 'less of';
  return `Kam tel: made with about ${amount} the oil`.replace('half of the', 'half the');
}

/** One plain line under a kam-tel food's name, or null. */
export function kamTelLine(food, rules) {
  const text = kamTelText(food, rules);
  return text ? h('span', { class: 'kamtel-line', 'data-testid': 'kamtel-line' }, text) : null;
}
