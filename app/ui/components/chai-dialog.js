// "Set my chai once" (Sprint 2, DECISIONS 2026-10-13, A6). Owner: Lena.
// Three taps of choices (milk, sugar, cup) make a personal chai recipe that becomes the top chai in
// recents and search. The numbers are the milk and sugar in the cup, from the Katori food list.
import { h, uid, setText } from '../dom.js';
import { openDialog } from './dialog.js';
import { fmtKcal } from './format.js';

const MILK = [
  { share: 0.25, label: 'A little milk', sub: '¼ of the cup' },
  { share: 0.5, label: 'Half milk', sub: '½ of the cup' },
  { share: 0.75, label: 'Mostly milk', sub: '¾, doodh patti style' },
  { share: 1, label: 'All milk', sub: 'no water' },
];
const SUGAR = [0, 0.5, 1, 1.5, 2, 3];

/** @param {{ store: object, rules: object, onSaved?: (id: string) => void }} props */
export function openChaiDialog({ store, rules, onSaved = null }) {
  const current = store.chai()?.chai ?? {};
  const cups = cupChoices(rules);
  const state = {
    milkShare: current.milkShare ?? 0.75,
    sugarTsp: current.sugarTsp ?? 1,
    cupMl: current.cupMl ?? cups[0].ml,
    milkFoodId: current.milkFoodId ?? 'intl-milk-whole',
  };
  const milks = ['intl-milk-whole', 'intl-milk-buffalo'].filter((id) => store.food(id));
  const preview = h('p', {
    class: 'chai-preview',
    'aria-live': 'polite',
    'data-testid': 'chai-preview',
  });

  const group = (legend, name, options, isOn, onPick) => {
    const id = uid(name);
    return h(
      'fieldset',
      { class: 'segmented-field' },
      h('legend', { class: 'field-label', id }, legend),
      h(
        'div',
        { class: 'segmented', role: 'radiogroup', 'aria-labelledby': id },
        options.map((o) =>
          h(
            'label',
            { class: 'seg seg--stack' },
            h('input', {
              type: 'radio',
              name: id,
              checked: isOn(o),
              onchange: () => {
                onPick(o);
                renderPreview();
              },
            }),
            h('span', null, o.label),
            o.sub ? h('span', { class: 'seg-sub' }, o.sub) : null,
          ),
        ),
      ),
    );
  };

  function renderPreview() {
    const milk = store.food(state.milkFoodId);
    const sugar = store.food('intl-sugar');
    if (!milk) {
      setText(preview, 'Milk is missing from the food list.');
      return;
    }
    const density = (milk.servings.find((s) => s.id === 'cup')?.grams ?? 206) / 200;
    const milkG = Math.round(state.cupMl * state.milkShare * density);
    const sugarG = (sugar?.servings.find((s) => s.id === 'tsp')?.grams ?? 4.2) * state.sugarTsp;
    const kcal = (milk.per100g.kcal * milkG) / 100 + ((sugar?.per100g.kcal ?? 0) * sugarG) / 100;
    const protein = (milk.per100g.protein * milkG) / 100;
    setText(
      preview,
      `One cup: ${fmtKcal(kcal)} kcal, ${Math.round(protein * 10) / 10} g protein (${milkG} g milk${state.sugarTsp ? ` + ${state.sugarTsp} tsp sugar` : ''}).`,
    );
  }

  const content = [
    group(
      'Milk',
      'milk',
      MILK,
      (o) => o.share === state.milkShare,
      (o) => (state.milkShare = o.share),
    ),
    milks.length > 1
      ? group(
          'Which milk',
          'milkfood',
          milks.map((id) => ({ id, label: id.endsWith('buffalo') ? 'Buffalo' : 'Cow, whole' })),
          (o) => o.id === state.milkFoodId,
          (o) => (state.milkFoodId = o.id),
        )
      : null,
    group(
      'Sugar (teaspoons)',
      'sugar',
      SUGAR.map((n) => ({
        n,
        label: n === 0 ? 'None' : String(n).replace('.5', '½').replace(/^0½/, '½'),
      })),
      (o) => o.n === state.sugarTsp,
      (o) => (state.sugarTsp = o.n),
    ),
    group(
      'Cup',
      'cup',
      cups,
      (o) => o.ml === state.cupMl,
      (o) => (state.cupMl = o.ml),
    ),
    preview,
  ];

  const handle = openDialog({
    title: 'Set my chai once',
    testid: 'chai-dialog',
    content,
    actions: h(
      'button',
      {
        type: 'button',
        class: 'btn btn-primary',
        'data-testid': 'chai-save',
        onclick: () => {
          const id = store.saveChai(state);
          handle.close('done');
          onSaved?.(id);
        },
      },
      'Save my chai',
    ),
  });
  renderPreview();
  return handle;
}

function cupChoices(rules) {
  const ml = (id, fallback) => rules?.householdMeasures?.find((m) => m.id === id)?.ml ?? fallback;
  return [
    { ml: 150, label: 'Small cup', sub: '150 ml' },
    { ml: ml('cup', 200), label: 'Cup', sub: `${ml('cup', 200)} ml` },
    { ml: ml('mug', 250), label: 'Mug', sub: `${ml('mug', 250)} ml` },
  ];
}
