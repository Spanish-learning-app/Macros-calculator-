// Meal names: Pakistani or Spanish (Sprint 3, Meeting 005). Owner: Lena.
// Asked on the welcome screen (pre-chosen by time zone, so it adds no step; one tap changes it)
// and again in Profile. Names only: the meal times stay as they are.
import { h, uid } from '../dom.js';

const SET_TITLES = { default: 'Pakistani names', spain: 'Spanish names' };
/** The four main meals; Snacks is the same in both sets. */
const SHOWN = ['breakfast', 'lunch', 'evening', 'dinner'];

/**
 * @param {{ store: object, legend?: string, help?: string|null, onPick?: (id: string) => void }} props
 * @returns {HTMLFieldSetElement|null} null when RULES has no meal slot sets
 */
export function renderMealNames({
  store,
  legend = 'What do you call your meals?',
  help = null,
  onPick = null,
}) {
  const sets = store.mealNameSets();
  if (sets.length < 2) return null;
  const current = store.mealNameSet();
  const name = uid('meal-names');
  return h(
    'fieldset',
    { class: 'field meal-names', 'data-testid': 'meal-names' },
    h('legend', { class: 'field-label' }, legend),
    h(
      'div',
      { class: 'choice-list' },
      sets.map((set) =>
        h(
          'label',
          { class: 'choice choice--card', 'data-testid': `meal-names-${set.id}` },
          h('input', {
            type: 'radio',
            name,
            value: set.id,
            checked: set.id === current,
            onchange: () => {
              store.setMealNames(set.id);
              onPick?.(set.id);
            },
          }),
          h(
            'span',
            { class: 'choice-text' },
            h('span', { class: 'choice-label' }, SHOWN.map((id) => set.labels[id]).join(' · ')),
            h('span', { class: 'choice-desc' }, SET_TITLES[set.id] ?? set.id),
          ),
        ),
      ),
    ),
    help ? h('p', { class: 'field-help' }, help) : null,
  );
}
