// Food details: the source in one tap (A9, A14): citation, method, confidence and state, plus
// per-100 g values, portions and the halal reason. An overlay, not a route. Owner: Priya.
import { h } from '../dom.js';
import { openDialog } from './dialog.js';
import { fmtKcal, fmtGrams, servingNote, fmtDateLong } from './format.js';
import { estimateBadge, urduName } from './food-bits.js';

// Internal pointers that mean nothing to a customer (Review 1 item 9): file paths, doc sections,
// recipe and record ids, and the Lab's working figures (yield, added fat, cross-check deltas).
const PATH_IN_BRACKETS = /\s*\([^()]*(?:\/|\.md\b|RULES\.)[^()]*\)/g;
const INTERNAL_SENTENCE =
  /\.md\b|§|research\/|\bR-[A-Za-z0-9-]+|\b(?:pk|es|med|intl|my)-[a-z0-9]+-[a-z0-9-]+|\balways [ABC]\b|cooked yield|added fat [\d.]+ ?g\/100 ?g|cross-check/i;
const RECIPE_CITATION = /^Recipe R-[A-Za-z0-9-]+(?::\s*(.+))?$/;

/**
 * The human citation for the Source panel: no file paths, doc sections or recipe ids.
 * "Recipe R-pk-roti (research/…/pk-roti.md)" → "Standard recipe, calculated from food tables";
 * "Recipe R-MP-1: Chicken tikka rice bowl…, batch of 4 boxes (research/…)" → "Recipe: Chicken…".
 * @param {string} citation @returns {string}
 */
export function displayCitation(citation) {
  const text = String(citation ?? '')
    .replace(PATH_IN_BRACKETS, '')
    .trim();
  if (!text) return 'Not given';
  const recipe = text.match(RECIPE_CITATION);
  if (recipe) {
    return recipe[1]
      ? `Recipe: ${recipe[1]}`
      : 'Standard recipe, calculated from food-table values for its ingredients';
  }
  return text;
}

/**
 * The customer-facing part of the Lab's source notes: sentences with internal pointers or working
 * figures are left out. @param {string} notes @returns {string} '' when nothing is left
 */
export function displayNotes(notes) {
  return String(notes ?? '')
    .replace(PATH_IN_BRACKETS, '')
    .split(/(?<=[.!?])\s+(?=[A-Z"“])/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence && !INTERNAL_SENTENCE.test(sentence))
    .join(' ');
}

function row(term, ...value) {
  return [h('dt', null, term), h('dd', null, ...value)];
}

/**
 * @param {{ food: object, rules: object, onClose?: () => void }} props
 */
export function openFoodDetails({ food, rules, onClose = null }) {
  const vocab = rules?.vocab ?? {};
  const src = food.source ?? {};
  const method = vocab.sourceMethods?.find((m) => m.id === src.method);
  const grade = vocab.confidenceGrades?.find((g) => g.id === src.confidence);
  const halalMeta = vocab.halalStatuses?.find((s) => s.id === food.halal?.status);
  const per = food.per100g ?? {};
  const style = vocab.styles?.find((s) => s.id === food.style);
  const notes = displayNotes(src.notes);

  const nutrientRows = [
    ['Energy', `${fmtKcal(per.kcal)} kcal`],
    ['Protein', `${fmtGrams(per.protein)} g`],
    ['Carbs (without fibre)', `${fmtGrams(per.carbs)} g`],
    ['Fat', `${fmtGrams(per.fat)} g`],
    ['Fibre', `${fmtGrams(per.fiber)} g`],
    per.sugars != null ? ['of which sugars', `${fmtGrams(per.sugars)} g`] : null,
    per.satFat != null ? ['Saturated fat', `${fmtGrams(per.satFat)} g`] : null,
    per.sodium != null ? ['Sodium', `${fmtKcal(per.sodium)} mg`] : null,
    food.addedFatPer100g != null
      ? ['Oil or ghee in it', `${fmtGrams(food.addedFatPer100g)} g`]
      : null,
  ].filter(Boolean);

  const content = h(
    'div',
    { class: 'details' },
    urduName(food),
    food.state
      ? h(
          'p',
          { class: 'details-state' },
          h('strong', null, 'What the numbers describe: '),
          food.state,
        )
      : null,
    style ? h('p', { class: 'details-state' }, h('strong', null, 'Style: '), style.label) : null,

    h('h3', { class: 'details-h' }, 'Source'),
    h(
      'dl',
      { class: 'details-dl' },
      row('Citation', h('span', { class: 'details-citation' }, displayCitation(src.citation))),
      method ? row('Method', method.label) : null,
      grade
        ? row(
            'Confidence',
            h('span', null, `${grade.label} (${grade.id})`),
            ' ',
            estimateBadge(food, rules),
            h('span', { class: 'details-sub' }, grade.description),
          )
        : null,
      src.date ? row('Checked', fmtDateLong(src.date)) : null,
      notes ? row('Notes', notes) : null,
    ),

    h('h3', { class: 'details-h' }, 'Halal'),
    h(
      'p',
      { class: ['details-halal', `details-halal--${food.halal?.status ?? 'unknown'}`] },
      h('strong', null, halalMeta?.label ?? food.halal?.status ?? 'Not given'),
      food.halal?.reason ? `: ${food.halal.reason}` : '',
    ),

    h('h3', { class: 'details-h' }, 'Per 100 g, as eaten'),
    h(
      'dl',
      { class: 'details-dl details-dl--numbers' },
      nutrientRows.map(([t, v]) => row(t, v)),
    ),

    h('h3', { class: 'details-h' }, 'Portions'),
    h(
      'ul',
      { class: 'details-portions', role: 'list' },
      (food.servings ?? []).map((s) =>
        h(
          'li',
          null,
          h('span', null, s.label.replace(/\s*\([^)]*\)\s*$/, '')),
          h(
            'span',
            { class: 'details-sub' },
            `${fmtGrams(s.grams)} g${servingNote(s) && !/\bg\b/.test(servingNote(s)) ? ` · ${servingNote(s)}` : ''}`,
          ),
        ),
      ),
    ),
  );

  return openDialog({
    title: food.name,
    content,
    testid: 'food-details',
    className: 'dlg--details',
    onClose,
  });
}
