// Whole-pot recipe builder (Sprint 2: A10, A16). Owner: Lena. ARCHITECTURE §13.
// Name, ingredients (same search and portion picker as the add sheet), boxes and an optional
// cooked-pot weight. Totals and per-box numbers update live; the halal status is the worst among
// the ingredients, with that ingredient's reason. Edit and delete in the same sheet.
import { h, uid, setText, mountChildren } from '../dom.js';
import { iconEl } from './icons.js';
import { openPortionPicker } from './portion-picker.js';
import { openIngredientSheet } from './ingredient-sheet.js';
import { fmtKcal, fmtGrams, portionText, servingOf, parseQty } from './format.js';
import { macroLine } from './prep-bits.js';

/**
 * @param {{ store: object, rules: object, recipe?: object|null,
 *   onSaved?: (id: string) => void, onDeleted?: () => void }} props
 */
export function openRecipeEditor({
  store,
  rules,
  recipe = null,
  onSaved = null,
  onDeleted = null,
}) {
  const draft = {
    id: recipe?.id,
    createdAt: recipe?.createdAt,
    name: recipe?.name ?? '',
    ingredients: (recipe?.ingredients ?? []).map((i) => ({ ...i })),
    boxes: recipe?.boxes ?? 4,
    cookedWeightG: recipe?.cookedWeightG ?? null,
    storage: recipe?.storage ?? null,
  };
  const titleId = uid('recipe');
  const nameId = uid('recipe-name');
  const weightId = uid('recipe-weight');
  const today = store.today();

  const nameIn = h('input', {
    id: nameId,
    class: 'input',
    type: 'text',
    autocomplete: 'off',
    placeholder: 'Mi tortilla, Tikka bowls…',
    value: draft.name,
    'data-testid': 'recipe-name',
    oninput: () => {
      draft.name = nameIn.value;
      error.hidden = true;
    },
  });
  const list = h('ul', { class: 'ing-list', role: 'list', 'data-testid': 'ingredient-list' });
  const boxesOut = h('output', { class: 'boxes-count', 'data-testid': 'recipe-boxes' });
  const weightIn = h('input', {
    id: weightId,
    class: 'input input--num',
    type: 'text',
    inputmode: 'decimal',
    autocomplete: 'off',
    placeholder: 'optional',
    value: draft.cookedWeightG ? String(draft.cookedWeightG) : '',
    'data-testid': 'recipe-weight',
    oninput: () => {
      const text = weightIn.value.trim();
      const parsed = parseQty(text);
      draft.cookedWeightG = text && parsed.ok && parsed.value > 0 ? parsed.value : null;
      renderSummary();
    },
  });
  const summary = h('div', { class: 'recipe-summary', 'aria-live': 'polite' });
  const error = h('p', { class: 'field-error', hidden: true, role: 'alert' });

  const stepBtn = (dir, label) =>
    h(
      'button',
      {
        type: 'button',
        class: 'btn-step',
        'aria-label': label,
        'data-testid': dir > 0 ? 'boxes-more' : 'boxes-less',
        onclick: () => {
          draft.boxes = Math.min(30, Math.max(1, draft.boxes + dir));
          renderSummary();
        },
      },
      iconEl(dir > 0 ? 'plus' : 'minus'),
    );

  const dialog = h(
    'dialog',
    {
      class: 'dlg dlg--sheet sheet recipe-editor',
      'data-testid': 'recipe-editor',
      'aria-labelledby': titleId,
    },
    h(
      'form',
      {
        class: 'dlg-panel sheet-panel',
        onsubmit: (event) => {
          event.preventDefault();
          save();
        },
      },
      h(
        'header',
        { class: 'dlg-head' },
        h('h2', { class: 'dlg-title', id: titleId }, recipe ? 'Edit recipe' : 'New recipe'),
        h(
          'button',
          { type: 'button', class: 'btn-icon', 'aria-label': 'Close', onclick: () => close() },
          iconEl('close'),
        ),
      ),
      h(
        'div',
        { class: 'dlg-body' },
        h(
          'div',
          { class: 'field' },
          h('label', { class: 'field-label', for: nameId }, 'Name'),
          nameIn,
        ),
        h('h3', { class: 'group-title' }, 'Ingredients'),
        list,
        h(
          'button',
          {
            type: 'button',
            class: 'btn btn-secondary btn-block',
            'data-testid': 'add-ingredient',
            onclick: () =>
              openIngredientSheet({
                store,
                rules,
                date: today,
                onPick: (ing) => {
                  // "+" twice on cucumber is 2 cucumbers on one line, not two lines.
                  const same = draft.ingredients.find(
                    (x) => x.foodId === ing.foodId && x.servingId === ing.servingId,
                  );
                  if (same) same.qty = Math.round((same.qty + ing.qty) * 1000) / 1000;
                  else draft.ingredients.push(ing);
                  error.hidden = true;
                  renderList();
                  renderSummary();
                },
              }),
          },
          iconEl('plus', 18),
          h('span', null, 'Add ingredients'),
        ),
        h(
          'div',
          { class: 'recipe-row' },
          h(
            'div',
            { class: 'field' },
            h('span', { class: 'field-label' }, 'Boxes or portions it makes'),
            h(
              'div',
              { class: 'stepper' },
              stepBtn(-1, 'Fewer boxes'),
              boxesOut,
              stepBtn(1, 'More boxes'),
            ),
          ),
          h(
            'div',
            { class: 'field' },
            h('label', { class: 'field-label', for: weightId }, 'Cooked pot (g)'),
            weightIn,
          ),
        ),
        h(
          'p',
          { class: 'field-help' },
          'Weigh the whole pot after cooking (without the pot) for the best numbers. Empty means the ingredients’ weight.',
        ),
        summary,
        error,
      ),
      h(
        'footer',
        { class: 'dlg-actions' },
        recipe
          ? h(
              'button',
              {
                type: 'button',
                class: 'btn btn-quiet',
                'data-testid': 'recipe-delete',
                onclick: () => {
                  close();
                  store.deleteRecipe(recipe.id);
                  onDeleted?.();
                },
              },
              iconEl('trash', 18),
              h('span', null, 'Delete'),
            )
          : null,
        h(
          'button',
          { type: 'submit', class: 'btn btn-primary', 'data-testid': 'recipe-save' },
          'Save recipe',
        ),
      ),
    ),
  );

  function renderList() {
    if (!draft.ingredients.length) {
      mountChildren(list, h('li', { class: 'empty-note' }, 'No ingredients yet.'));
      return;
    }
    const preview = store.previewRecipe(draft);
    mountChildren(
      list,
      draft.ingredients.map((ing, i) => {
        const food = store.food(ing.foodId);
        const line = preview.totals.lines.find(
          (l) => l.foodId === ing.foodId && l.servingId === ing.servingId && l.qty === ing.qty,
        );
        const serving = food ? servingOf(food, ing.servingId) : null;
        const amount = serving ? portionText(serving, ing.qty) : `${ing.qty}`;
        return h(
          'li',
          { class: 'ing-row', 'data-testid': 'ingredient' },
          h(
            'button',
            {
              type: 'button',
              class: 'ing-main',
              'aria-haspopup': 'dialog',
              onclick: () => editIngredient(i),
            },
            h('span', { class: 'ing-name' }, food?.name ?? 'Missing food'),
            h(
              'span',
              { class: 'ing-line' },
              line
                ? `${ing.servingId === 'g' ? '' : `${amount} · `}${fmtGrams(line.grams)} g · ${fmtKcal(line.nutrients.kcal)} kcal`
                : `${amount} · not in the food list any more`,
            ),
          ),
        );
      }),
    );
  }

  function editIngredient(i) {
    const ing = draft.ingredients[i];
    const food = store.food(ing.foodId);
    if (!food) {
      draft.ingredients.splice(i, 1);
      renderList();
      renderSummary();
      return;
    }
    openPortionPicker({
      store,
      rules,
      food,
      servingId: ing.servingId,
      qty: ing.qty,
      slot: 'lunch',
      date: today,
      mode: 'edit',
      showSlot: false,
      primaryLabel: 'Save ingredient',
      onSave: ({ foodId, servingId, qty }) => {
        draft.ingredients[i] = { foodId: foodId ?? ing.foodId, servingId, qty };
        renderList();
        renderSummary();
      },
      onDelete: () => {
        draft.ingredients.splice(i, 1);
        renderList();
        renderSummary();
      },
    });
  }

  function renderSummary() {
    setText(boxesOut, String(draft.boxes));
    const preview = store.previewRecipe(draft);
    const food = preview.food;
    if (!food) {
      mountChildren(
        summary,
        h('p', { class: 'muted' }, 'Add ingredients to see the numbers for the pot and per box.'),
      );
      return;
    }
    const total = preview.totals.total;
    const per = Object.fromEntries(Object.entries(total).map(([k, v]) => [k, v / draft.boxes]));
    const boxGrams = preview.totals.cookedGrams / draft.boxes;
    const halal = preview.halal;
    const culprit = halal.foodId ? store.food(halal.foodId) : null;
    mountChildren(
      summary,
      h(
        'div',
        { class: 'recipe-numbers card', 'data-testid': 'recipe-numbers' },
        h(
          'p',
          { class: 'recipe-per' },
          h(
            'strong',
            null,
            draft.boxes === 1
              ? 'Whole recipe'
              : `Per box (1 of ${draft.boxes}, ${fmtGrams(boxGrams)} g)`,
          ),
        ),
        h('p', { class: 'recipe-macros', 'data-testid': 'per-box' }, macroLine(per)),
        draft.boxes > 1
          ? h(
              'p',
              { class: 'recipe-total muted', 'data-testid': 'recipe-total' },
              `Whole pot (${fmtGrams(preview.totals.cookedGrams)} g): ${macroLine(total)}`,
            )
          : null,
        h(
          'p',
          {
            class: ['recipe-halal', `recipe-halal--${halal.status}`],
            'data-testid': 'recipe-halal',
          },
          halal.status === 'halal'
            ? 'Halal: every ingredient is halal.'
            : `${halal.status === 'check' ? 'Check' : 'Not halal'}: ${culprit?.name ?? 'an ingredient'}. ${halal.reason ?? ''}`,
        ),
        h(
          'p',
          { class: 'recipe-source muted' },
          'Where the numbers come from: the sum of your ingredients from the Katori food list (each one’s source is in its details), so this is an estimate.',
        ),
      ),
    );
  }

  function save() {
    if (!draft.name.trim()) {
      error.hidden = false;
      setText(error, 'Give the recipe a name.');
      nameIn.focus();
      return;
    }
    if (!draft.ingredients.length || !store.previewRecipe(draft).food) {
      error.hidden = false;
      setText(error, 'Add at least one ingredient.');
      return;
    }
    const id = store.saveRecipe(draft);
    close();
    onSaved?.(id);
  }

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    if (dialog.open) dialog.close();
    dialog.remove();
  }
  dialog.addEventListener('close', () => close());

  renderList();
  renderSummary();
  document.body.append(dialog);
  dialog.showModal();
  if (!recipe) nameIn.focus();
  return { close };
}
