// Whole-pot recipe builder (Sprint 2: A10, A16). Owner: Lena. ARCHITECTURE §13.
// Name, ingredients (same search and portion picker as the add sheet), and what it makes: boxes
// (with an optional cooked-pot weight), one dish, or a family pot counted in katori (Review 2,
// Nasreen: "How many katori does your pot make?", no scale needed). Totals and per-box numbers update live; the halal status is the worst among
// the ingredients, with that ingredient's reason. Edit and delete in the same sheet.
import { h, uid, setText, mountChildren } from '../dom.js';
import { iconEl } from './icons.js';
import { openPortionPicker } from './portion-picker.js';
import { openIngredientSheet, amountText } from './ingredient-sheet.js';
import { fmtKcal, fmtGrams, servingOf, parseQty } from './format.js';
import { macroLine } from './prep-bits.js';
import { MY_METHOD_MAX } from '../../core/mealprep.js';

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
  const katoriG = rules?.householdMeasures?.find((m) => m.id === 'katori')?.ml ?? 200;
  const pot = Number.isFinite(recipe?.potKatori) && recipe.potKatori > 0;
  const draft = {
    id: recipe?.id,
    createdAt: recipe?.createdAt,
    name: recipe?.name ?? '',
    ingredients: (recipe?.ingredients ?? []).map((i) => ({ ...i })),
    boxes: recipe?.boxes ?? 4,
    cookedWeightG: recipe?.cookedWeightG ?? null,
    potKatori: pot ? recipe.potKatori : null,
    storage: recipe?.storage ?? null,
    method: typeof recipe?.method === 'string' ? recipe.method : '',
  };
  /** 'boxes' | 'one' (a single dish, "1 whole recipe") | 'katori' (a family pot). */
  let makes = pot ? 'katori' : recipe?.boxes === 1 ? 'one' : 'boxes';
  let boxesChoice = draft.boxes > 1 ? draft.boxes : 4;
  let weighedG = pot ? null : draft.cookedWeightG;
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
  // "My method" (s3-method): optional free text, one step per line; shown on the recipe and in Cook.
  const methodId = uid('recipe-method');
  const methodIn = h('textarea', {
    id: methodId,
    class: 'textarea method-input',
    rows: 5,
    maxlength: MY_METHOD_MAX,
    placeholder: 'Fry the onion on medium heat for 8 min.\nAdd the chicken…',
    value: draft.method,
    'data-testid': 'recipe-my-method',
    'aria-describedby': `${methodId}-help`,
    oninput: () => {
      draft.method = methodIn.value;
    },
  });
  const methodField = h(
    'div',
    { class: 'field' },
    h('label', { class: 'field-label', for: methodId }, 'My method (optional)'),
    methodIn,
    h(
      'p',
      { class: 'field-help', id: `${methodId}-help` },
      'How you make it, one step per line. It shows on the recipe and when you cook it.',
    ),
  );
  const boxesOut = h('output', { class: 'boxes-count', 'data-testid': 'recipe-boxes' });
  const weightIn = h('input', {
    id: weightId,
    class: 'input input--num',
    type: 'text',
    inputmode: 'decimal',
    autocomplete: 'off',
    placeholder: 'optional',
    value: weighedG ? String(weighedG) : '',
    'data-testid': 'recipe-weight',
    oninput: () => {
      const text = weightIn.value.trim();
      const parsed = parseQty(text);
      weighedG = text && parsed.ok && parsed.value > 0 ? parsed.value : null;
      applyMakes();
    },
  });
  const katoriId = uid('recipe-katori');
  const katoriIn = h('input', {
    id: katoriId,
    class: 'input input--num',
    type: 'text',
    inputmode: 'decimal',
    autocomplete: 'off',
    placeholder: 'e.g. 8',
    value: draft.potKatori ? String(draft.potKatori) : '',
    'data-testid': 'recipe-katori',
    oninput: () => {
      const text = katoriIn.value.trim();
      const parsed = parseQty(text);
      draft.potKatori = text && parsed.ok && parsed.value > 0 ? parsed.value : null;
      applyMakes();
    },
  });
  const makesChips = h('div', {
    class: 'chip-pick',
    role: 'group',
    'aria-label': 'It makes',
    'data-testid': 'recipe-makes',
  });
  const boxesField = h(
    'div',
    { class: 'field' },
    h('span', { class: 'field-label' }, 'How many boxes?'),
    h('div', { class: 'stepper' }, stepBtn(-1, 'Fewer boxes'), boxesOut, stepBtn(1, 'More boxes')),
    // Nasreen, Review 2: nothing said what a box is.
    h('p', { class: 'field-help' }, 'One box is one meal for one person.'),
  );
  const weightField = h(
    'div',
    { class: 'field' },
    h('label', { class: 'field-label', for: weightId }, 'Weight after cooking (g)'),
    weightIn,
  );
  const weightHelp = h(
    'p',
    { class: 'field-help' },
    'Only if you have a kitchen scale: weigh the cooked food, not the pan. No scale? Leave it empty and we use the weight of what you put in.',
  );
  const katoriField = h(
    'div',
    { class: 'field' },
    h('label', { class: 'field-label', for: katoriId }, 'How many katori does your pot make?'),
    katoriIn,
    h(
      'p',
      { class: 'field-help' },
      `Count the katori (${katoriG} ml bowls) the pot fills, with its water and gravy. No scale needed.`,
    ),
  );
  const summary = h('div', { class: 'recipe-summary', 'aria-live': 'polite' });
  const error = h('p', { class: 'field-error', hidden: true, role: 'alert' });

  function stepBtn(dir, label) {
    return h(
      'button',
      {
        type: 'button',
        class: 'btn-step',
        'aria-label': label,
        'data-testid': dir > 0 ? 'boxes-more' : 'boxes-less',
        onclick: () => {
          boxesChoice = Math.min(30, Math.max(1, boxesChoice + dir));
          applyMakes();
        },
      },
      iconEl(dir > 0 ? 'plus' : 'minus'),
    );
  }

  /** Sets boxes, cooked weight and potKatori from the "It makes" choice, then redraws. */
  function applyMakes() {
    if (makes === 'katori') {
      draft.boxes = 1;
      draft.cookedWeightG = draft.potKatori ? draft.potKatori * katoriG : null;
    } else {
      draft.boxes = makes === 'one' ? 1 : boxesChoice;
      draft.cookedWeightG = weighedG;
    }
    boxesField.hidden = makes !== 'boxes';
    weightField.hidden = makes === 'katori';
    weightHelp.hidden = makes === 'katori';
    katoriField.hidden = makes !== 'katori';
    const choices = [
      ['boxes', 'Boxes'],
      ['one', '1 dish'],
      ['katori', 'Family pot'],
    ];
    mountChildren(
      makesChips,
      choices.map(([id, label]) =>
        h(
          'button',
          {
            type: 'button',
            class: ['pick-chip', makes === id ? 'is-on' : null],
            'aria-pressed': String(makes === id),
            'data-makes': id,
            onclick: () => {
              if (makes === id) return;
              makes = id;
              applyMakes();
              if (id === 'katori' && !draft.potKatori) katoriIn.focus();
            },
          },
          label,
        ),
      ),
    );
    renderSummary();
  }

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
        h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'It makes'), makesChips),
        h('div', { class: 'recipe-row' }, boxesField, weightField, katoriField),
        weightHelp,
        summary,
        methodField,
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
        const amount = serving ? amountText(serving, ing.qty) : `${ing.qty}`;
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
        h('p', { class: 'muted' }, 'Add ingredients to see the kcal and protein in each box.'),
      );
      return;
    }
    const total = preview.totals.total;
    const katori = makes === 'katori' && draft.potKatori;
    const share = katori ? draft.potKatori : draft.boxes;
    const per = Object.fromEntries(Object.entries(total).map(([k, v]) => [k, v / share]));
    const boxGrams = preview.totals.cookedGrams / share;
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
            katori
              ? `1 katori (1 of ${fmtGrams(draft.potKatori)}, about ${fmtGrams(katoriG)} g)`
              : makes === 'katori'
                ? 'Whole pot (type how many katori it makes)'
                : draft.boxes === 1
                  ? 'Whole recipe'
                  : `Per box (1 of ${draft.boxes}, ${fmtGrams(boxGrams)} g)`,
          ),
        ),
        h('p', { class: 'recipe-macros', 'data-testid': 'per-box' }, macroLine(per)),
        draft.boxes > 1 || katori
          ? h(
              'p',
              { class: 'recipe-total muted', 'data-testid': 'recipe-total' },
              katori
                ? `Whole pot (${fmtGrams(draft.potKatori)} katori): ${macroLine(total)}`
                : `Whole pot (${fmtGrams(preview.totals.cookedGrams)} g): ${macroLine(total)}`,
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
    if (makes === 'katori' && !draft.potKatori) {
      error.hidden = false;
      setText(error, 'Type how many katori the pot makes, for example 8.');
      katoriIn.focus();
      return;
    }
    const id = store.saveRecipe({
      ...draft,
      potKatori: makes === 'katori' ? draft.potKatori : null,
    });
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
  applyMakes();
  document.body.append(dialog);
  dialog.showModal();
  if (!recipe) nameIn.focus();
  return { close };
}
