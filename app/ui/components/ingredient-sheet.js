// Ingredient picker for the recipe builder (Sprint 2, A10, A16). Owner: Lena.
// The same search and portion picker as the add sheet: "+" adds one default serving, a tap opens
// the portion picker. Not-halal foods can never be picked (meeting 002, decision 5); the sheet
// says why instead of showing nothing. Your own recipes are not offered as ingredients.
import { h, uid, setText, mountChildren } from '../dom.js';
import { iconEl } from './icons.js';
import { halalChip, estimateBadge } from './food-bits.js';
import { openPortionPicker } from './portion-picker.js';
import { fmtKcal, fmtGrams, portionText, defaultServingOf, portionNutrients } from './format.js';

/**
 * @param {{ store: object, rules: object, date: string,
 *   onPick: (p: { foodId: string, servingId: string, qty: number }) => void,
 *   onClose?: () => void }} props
 * @returns {{ close: () => void }}
 */
export function openIngredientSheet({ store, rules, date, onPick, onClose = null }) {
  const titleId = uid('ing');
  const searchId = uid('ing-search');
  let added = 0;
  const status = h('p', { class: 'sheet-status', role: 'status', 'aria-live': 'polite' });
  const results = h('div', { class: 'sheet-results' });
  const input = h('input', {
    id: searchId,
    class: 'search-input',
    type: 'search',
    placeholder: 'Search: chicken, rice, egg…',
    autocomplete: 'off',
    autocapitalize: 'off',
    spellcheck: 'false',
    enterkeyhint: 'search',
    'data-testid': 'ingredient-search',
    oninput: () => render(),
  });

  const dialog = h(
    'dialog',
    {
      class: 'dlg dlg--sheet sheet',
      'data-testid': 'ingredient-sheet',
      'aria-labelledby': titleId,
    },
    h(
      'div',
      { class: 'dlg-panel sheet-panel' },
      h(
        'header',
        { class: 'dlg-head sheet-head' },
        h(
          'div',
          { class: 'sheet-titles' },
          h('h2', { class: 'dlg-title', id: titleId }, 'Add ingredients'),
          h('p', { class: 'sheet-when' }, 'Raw amounts, as you put them in the pot'),
        ),
        h(
          'button',
          { type: 'button', class: 'btn btn-primary btn-done', onclick: () => close() },
          'Done',
        ),
      ),
      h(
        'div',
        { class: 'sheet-controls' },
        h(
          'div',
          { class: 'search' },
          h('label', { class: 'sr-only', for: searchId }, 'Search ingredients'),
          iconEl('search', 20),
          input,
        ),
        status,
      ),
      h('div', { class: 'dlg-body sheet-body' }, results),
    ),
  );

  function pickNow(food, servingId, qty) {
    onPick({ foodId: food.id, servingId, qty });
    added += 1;
    const serving = servingId === 'g' ? { id: 'g' } : food.servings.find((s) => s.id === servingId);
    setText(status, `Added ${portionText(serving, qty)} ${food.name}. ${added} added so far.`);
  }

  function row(food) {
    const serving = defaultServingOf(food);
    const n = portionNutrients(food, serving.id, 1);
    const halal = halalChip(food, rules);
    return h(
      'li',
      { class: 'food-row', 'data-testid': 'ingredient-row', 'data-food-id': food.id },
      h(
        'button',
        {
          type: 'button',
          class: 'food-main',
          'aria-haspopup': 'dialog',
          onclick: () =>
            openPortionPicker({
              store,
              rules,
              food,
              servingId: serving.id,
              qty: 1,
              slot: 'lunch',
              date,
              mode: 'add',
              showSlot: false,
              primaryLabel: 'Add to recipe',
              onAdd: ({ foodId, servingId, qty }) =>
                pickNow(store.food(foodId) ?? food, servingId, qty),
            }),
        },
        h('span', { class: 'food-name' }, food.name),
        estimateBadge(food, rules)
          ? h('span', { class: 'entry-tags' }, estimateBadge(food, rules))
          : null,
        h(
          'span',
          { class: 'food-portion' },
          `${serving.label} (${fmtGrams(n.grams)} g) · ${fmtKcal(n.kcal)} kcal`,
        ),
      ),
      h(
        'button',
        {
          type: 'button',
          class: 'btn-plus',
          'aria-label': `Add ${food.name} to the recipe`,
          onclick: () => pickNow(food, serving.id, 1),
        },
        iconEl('plus', 22),
      ),
      halal ? h('div', { class: 'entry-halal' }, halal.chip) : null,
      halal ? halal.reason : null,
    );
  }

  function render() {
    const q = input.value.trim();
    if (!q) {
      mountChildren(
        results,
        h(
          'p',
          { class: 'sheet-hint' },
          'Type an ingredient. Use raw amounts (dry rice, raw chicken) and, if you can, weigh the cooked pot at the end.',
        ),
      );
      return;
    }
    const found = store.search(q, { limit: 30 });
    const all = [...found.hits.map((x) => x.food), ...found.hidden.map((x) => x.food)];
    const ok = all.filter((f) => !f.userRecipe && f.halal?.status !== 'not-halal');
    const blocked = all.filter((f) => f.halal?.status === 'not-halal');
    mountChildren(
      results,
      ok.length
        ? h('ul', { class: 'food-list', role: 'list' }, ok.slice(0, 20).map(row))
        : blocked.length
          ? null
          : h('p', { class: 'empty-note' }, `Nothing found for “${q}”. Try another spelling.`),
      blocked.length
        ? h(
            'div',
            { class: 'hidden-note', 'data-testid': 'ingredient-blocked' },
            h('p', { class: 'hidden-title' }, 'Not halal, so it cannot go in a recipe'),
            h(
              'ul',
              { class: 'hidden-list', role: 'list' },
              blocked
                .slice(0, 3)
                .map((f) =>
                  h(
                    'li',
                    null,
                    h('strong', null, f.name),
                    f.halal?.reason ? `: ${f.halal.reason}` : '',
                  ),
                ),
            ),
          )
        : null,
    );
  }

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    if (dialog.open) dialog.close();
    dialog.remove();
    onClose?.();
  }
  dialog.addEventListener('close', () => close());

  render();
  document.body.append(dialog);
  dialog.showModal();
  input.focus();
  return { close };
}
