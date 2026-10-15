// Ingredient picker for the recipe builder (Sprint 2, A10, A16). Owner: Lena.
// The same search and portion picker as the add sheet: "+" adds one default serving, a tap opens
// the portion picker. Not-halal foods can never be picked (meeting 002, decision 5); the sheet
// says why instead of showing nothing. Your own recipes are not offered as ingredients.
import { h, uid, setText, mountChildren } from '../dom.js';
import { iconEl } from './icons.js';
import { halalChip, estimateBadge } from './food-bits.js';
import { openPortionPicker } from './portion-picker.js';
import { searchNoteText } from './search-notes.js';
import { fmtKcal, fmtGrams, portionText, defaultServingOf, portionNutrients } from './format.js';

const UNITS = {
  g: 'g',
  gm: 'g',
  gr: 'g',
  gram: 'g',
  grams: 'g',
  kg: 'kg',
  pao: 'pao',
  tbsp: 'tbsp',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  tsp: 'tsp',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  cup: 'cup',
  cups: 'cup',
  katori: 'katori',
  katoris: 'katori',
};
/** Size words before the food ("3 medium potatoes"); "big" means large. */
const SIZES = { small: 'small', medium: 'medium', large: 'large', big: 'large' };
const FRACTIONS = { '½': 0.5, '¼': 0.25, '¾': 0.75 };
const AMOUNT_RE = new RegExp(
  '^\\s*(\\d+(?:[.,]\\d+)?|\\d*\\s*[½¼¾])?\\s*' +
    `(${Object.keys(UNITS)
      .sort((a, b) => b.length - a.length)
      .join('|')})?\\.?\\s*` +
    `(?:\\b(${Object.keys(SIZES).join('|')})\\b)?\\s+(.+)$`,
  'i',
);

function numberOf(text) {
  const t = text.replace(/\s+/g, '');
  const frac = FRACTIONS[t.slice(-1)];
  if (frac !== undefined) return (t.length > 1 ? Number(t.slice(0, -1)) : 0) + frac;
  return Number(t.replace(',', '.'));
}

/**
 * Quick amounts in the ingredient search (A16 budget, Review 2): "800 g chicken thigh",
 * "2 tbsp oil", "2 cucumbers", "1.5 kg rice", "3 medium potatoes", "1 pao chicken", "1 cup dahi".
 * Returns { amount: { unit: 'g'|'tbsp'|'tsp'|'cup'|'katori'|null, qty, size? }, query } or
 * { amount: null, query } when the text does not start with a number or a size word. `size` is
 * 'small', 'medium' or 'large' when a size word comes first or follows the number.
 * @param {string} text
 */
export function parseQuickAmount(text) {
  const plain = { amount: null, query: String(text ?? '').trim() };
  const m = String(text ?? '').match(AMOUNT_RE);
  // A number, or a size word alone ("medium onion" is one medium onion); a unit needs a number.
  if (!m || (!m[1] && (!m[3] || m[2]))) return plain;
  const value = m[1] ? numberOf(m[1]) : 1;
  if (!(value > 0)) return plain;
  let unit = m[2] ? UNITS[m[2].toLowerCase()] : null;
  let qty = value;
  if (unit === 'kg' || unit === 'pao') {
    qty = value * (unit === 'kg' ? 1000 : 250); // a pao is a quarter kilo
    unit = 'g';
  }
  const size = m[3] ? SIZES[m[3].toLowerCase()] : null;
  const query = m[4].trim();
  if (!query) return plain;
  return { amount: { unit, qty, ...(size ? { size } : {}) }, query };
}

/** The serving and qty a quick amount means for `food` (a unit the food lacks → its default). */
export function quickPortion(food, amount) {
  const base = defaultServingOf(food);
  if (!amount) return { servingId: base.id, qty: 1 };
  if (amount.unit === 'g') return { servingId: 'g', qty: amount.qty };
  if (amount.unit && food.servings.some((s) => s.id === amount.unit)) {
    return { servingId: amount.unit, qty: amount.qty };
  }
  if (!amount.unit && amount.size) {
    const word = new RegExp(`\\b${amount.size}\\b`, 'i');
    const sized =
      food.servings.find((s) => s.id === amount.size) ??
      food.servings.find((s) => word.test(s.label ?? ''));
    if (sized) return { servingId: sized.id, qty: amount.qty };
  }
  return { servingId: base.id, qty: amount.unit ? 1 : amount.qty };
}

const RAW_STATE = /\b(raw|dry|dried|uncooked|from scratch|weigh before cooking)\b/i;
const COOKED_STATE =
  /\b(cooked|as served|fried|roasted|boiled|grilled|baked|scrambled|stew|prepared|assembled|as eaten)\b/i;
const SALAD_STATE = /\b(dressed|blended|chopped|with lemon|with olive oil)\b/i; // raw, but a dish
const DISH_GROUPS = new Set([
  'lunchbox',
  'curry-meat',
  'curry-veg',
  'rice-dish',
  'grill-kebab',
  'snack-fried',
  'fastfood',
  'soup',
  'chaat',
  'sweet-dessert',
  'bread-fried',
  'pasta-dish',
]);

/**
 * How an ingredient ranks in the recipe picker (Review 2): 0 raw or dry (what goes in the pot),
 * 1 plain foods (dahi, oil, fruit, bread), 2 cooked dishes ("250 g lentils" is dry lentils before
 * the lentejas stew; "5 eggs" is the raw egg before the boiled one).
 * @param {object} food @returns {0|1|2}
 */
export function ingredientRank(food) {
  const state = String(food?.state ?? '');
  if (DISH_GROUPS.has(food?.group) || COOKED_STATE.test(state)) return 2;
  if (RAW_STATE.test(state) && !SALAD_STATE.test(state)) return 0;
  return 1;
}

/** Foods in picker order: by ingredientRank, the search order within a rank (stable). */
export function rankIngredients(foods) {
  return foods
    .map((food, i) => ({ food, i, r: ingredientRank(food) }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map((x) => x.food);
}

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
    placeholder: 'e.g. 800 g chicken thigh, 2 eggs…',
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

  function row(food, amount = null) {
    const portion = quickPortion(food, amount);
    const serving =
      portion.servingId === 'g'
        ? { id: 'g', label: 'grams' }
        : food.servings.find((s) => s.id === portion.servingId);
    const n = portionNutrients(food, portion.servingId, portion.qty);
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
              servingId: portion.servingId,
              qty: portion.qty,
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
          portion.servingId === 'g'
            ? `${fmtGrams(n.grams)} g · ${fmtKcal(n.kcal)} kcal`
            : `${portion.qty === 1 ? serving.label : portionText(serving, portion.qty)} (${fmtGrams(n.grams)} g) · ${fmtKcal(n.kcal)} kcal`,
        ),
      ),
      h(
        'button',
        {
          type: 'button',
          class: 'btn-plus',
          'aria-label': `Add ${food.name} to the recipe`,
          onclick: () => {
            pickNow(food, portion.servingId, portion.qty);
            // Ready for the next "200 g dahi": one field fill replaces the text.
            input.focus();
            input.select();
          },
        },
        iconEl('plus', 22),
      ),
      halal ? h('div', { class: 'entry-halal' }, halal.chip) : null,
      halal ? halal.reason : null,
    );
  }

  function render() {
    const { amount, query: q } = parseQuickAmount(input.value);
    if (!q) {
      mountChildren(
        results,
        h(
          'p',
          { class: 'sheet-hint' },
          'Type an ingredient, or the amount first: “800 g chicken thigh”, “2 tbsp oil”, “3 medium potatoes”. Use raw amounts (dry rice, raw chicken) and, if you can, weigh the cooked pot at the end.',
        ),
      );
      return;
    }
    const found = store.search(q, { limit: 30 });
    const all = [...found.hits.map((x) => x.food), ...found.hidden.map((x) => x.food)];
    const ok = rankIngredients(
      all.filter((f) => !f.userRecipe && f.halal?.status !== 'not-halal'),
    );
    const blocked = all.filter((f) => f.halal?.status === 'not-halal');
    const note = searchNoteText(q, {
      hits: ok.length,
      hasShellfish: () =>
        ['prawn', 'squid', 'mussel'].some((w) =>
          store.search(w, { limit: 3 }).hits.some((x) => /seafood-(prawn|other)/.test(x.food.tags)),
        ),
    });
    mountChildren(
      results,
      note ? h('p', { class: 'help-row', 'data-testid': 'search-note', role: 'note' }, note) : null,
      ok.length
        ? h(
            'ul',
            { class: 'food-list', role: 'list' },
            ok.slice(0, 20).map((f) => row(f, amount)),
          )
        : blocked.length || note
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
