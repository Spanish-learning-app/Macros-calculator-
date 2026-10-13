// Food details: the source in one tap (A9, A14): citation, method, confidence and state, plus
// per-100 g values, portions and the halal reason. An overlay, not a route. Owner: Priya.
import { h } from '../dom.js';
import { openDialog } from './dialog.js';
import { fmtKcal, fmtGrams, servingNote } from './format.js';
import { estimateBadge, urduName } from './food-bits.js';

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
      row('Citation', h('span', { class: 'details-citation' }, src.citation ?? 'Not given')),
      method ? row('Method', method.label) : null,
      grade
        ? row(
            'Confidence',
            h('span', null, `${grade.id}: ${grade.label}`),
            ' ',
            estimateBadge(food, rules),
            h('span', { class: 'details-sub' }, grade.description),
          )
        : null,
      src.reviewer || src.date
        ? row('Checked', [src.reviewer, src.date].filter(Boolean).join(', '))
        : null,
      src.notes ? row('Notes', src.notes) : null,
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
