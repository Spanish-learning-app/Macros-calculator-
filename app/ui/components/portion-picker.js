// Portion picker (A8, A9). Owner: Priya.
// - Serving chips, tapped not typed, with a drawing for katori sizes, plate, cup, glass, spoon,
//   box and roti; grams in small text under each chip (Nasreen).
// - Big ½, 1, 1½, 2 chips plus a stepper in 0.5 steps that also takes typed decimals
//   ("1.5", "1,5", "½", "1/3").
// - Live grams and nutrients before adding; inline errors for 0, empty and negative (no pop-up).
// - The style switch (home / restaurant / dhaba) keeps the serving and quantity (A9).
// - "Source and details" opens in one tap (A9, A14).
import { h, uid, setText } from '../dom.js';
import { iconEl, measureDrawing } from './icons.js';
import { halalChip, estimateBadge, urduName, kamTelLine } from './food-bits.js';
import { openFoodDetails } from './food-details.js';
import {
  fmtKcal,
  fmtGrams,
  fmtQty,
  parseQty,
  unitName,
  servingOf,
  defaultServingOf,
  portionNutrients,
} from './format.js';

const FRACTIONS = [0.5, 1, 1.5, 2];
/** "Thora sa (a taste)": ¼ of the default serving, on every food (Meeting 003 item 4). */
export const TASTE_QTY = 0.25;

/**
 * BUG-TC1: the "Thora sa" chip follows RULES.portionChips.taste.hideWhen (NUTRITION §5.6): no chip
 * on add-ons already measured in spoons (groups), on foods whose default is a tsp or tbsp, or when
 * a quarter of the default weighs under `quarterGramsBelow` g. Without RULES: always shown.
 * @param {object} food @param {object|null} rules @returns {boolean}
 */
export function tasteChipHidden(food, rules) {
  const hideWhen = rules?.portionChips?.taste?.hideWhen;
  if (!food || !hideWhen) return false;
  const base = defaultServingOf(food);
  if ((hideWhen.groups ?? []).includes(food.group)) return true;
  if ((hideWhen.defaultServingIds ?? []).includes(base?.id)) return true;
  const below = hideWhen.quarterGramsBelow;
  const grams = Number(base?.grams);
  return Number.isFinite(below) && Number.isFinite(grams) && grams * TASTE_QTY < below;
}
const ERRORS = {
  empty: 'Type how much, for example 1 or 1.5.',
  nan: 'Use a number, like 1.5 or ½.',
  zero: 'Must be more than 0.',
  negative: 'Must be more than 0.',
};

/** A qty for the input box: "1.5", "0.33", "300". */
function qtyText(qty) {
  return String(Math.round(qty * 100) / 100);
}

/**
 * @param {{ store: object, rules: object, food: object|null, entry?: object|null,
 *   servingId?: string|null, qty?: number|null, slot: string, date: string,
 *   mode?: 'add'|'edit', onAdd?: (p: { foodId: string, servingId: string, qty: number }) => void,
 *   onSave?: (p: { foodId: string|null, servingId: string|null, qty: number, slot: string }) => void,
 *   onDelete?: () => void, onClose?: () => void, primaryLabel?: string, showSlot?: boolean }} props
 *   primaryLabel and showSlot: the recipe builder reuses the picker ("Add to recipe", no meal);
 *   with showSlot false there is no "Thora sa" chip either (nobody tastes raw chicken, Review 2).
 */
export function openPortionPicker(props) {
  const { store, rules, mode = 'add', entry = null } = props;
  let food = props.food;
  let slot = props.slot;
  let servingId = food ? (props.servingId ?? defaultServingOf(food).id) : null;
  let qty = props.qty ?? 1;
  let qtyInput = qtyText(qty);
  const titleId = uid('picker');
  const errorId = uid('qty-err');
  const qtyId = uid('qty');

  const dialog = h('dialog', {
    class: 'dlg dlg--sheet picker',
    'data-testid': 'portion-picker',
    'aria-labelledby': titleId,
  });

  // ---- pieces that update in place
  const title = h('h2', { class: 'dlg-title', id: titleId });
  const subtitle = h('div', { class: 'picker-sub' });
  const halalBox = h('div', { class: 'picker-halal' });
  const variantBox = h('div', { class: 'picker-variants' });
  const servingBox = h('div', { class: 'picker-servings' });
  const fractionBox = h('div', { class: 'qty-chips', role: 'group', 'aria-label': 'How many' });
  const input = h('input', {
    id: qtyId,
    class: 'qty-input',
    type: 'text',
    inputmode: 'decimal',
    autocomplete: 'off',
    'data-testid': 'qty-input',
    'aria-describedby': errorId,
    value: qtyInput,
    oninput: () => {
      qtyInput = input.value;
      // "800 g" or "800g" switches to grams in one go (Sprint 2: recipe amounts, A16 budget).
      const grams = food ? qtyInput.match(/^\s*(\d+(?:[.,]\d+)?)\s*(?:g|gm|gr|grams?)\s*$/i) : null;
      if (grams) {
        servingId = 'g';
        qtyInput = grams[1];
      }
      const parsed = parseQty(qtyInput);
      if (parsed.ok) qty = parsed.value;
      refresh({ keepInput: true });
    },
  });
  const error = h('p', {
    class: 'field-error',
    id: errorId,
    'data-testid': 'qty-error',
    hidden: true,
  });
  const preview = h('div', {
    class: 'picker-preview',
    'data-testid': 'portion-preview',
    'aria-live': 'polite',
  });
  const primary = h('button', { type: 'submit', class: 'btn btn-primary btn-block' });
  const slotSelect =
    (props.showSlot ?? mode === 'edit')
      ? h(
          'select',
          {
            class: 'select',
            onchange: () => {
              slot = slotSelect.value;
            },
          },
          store
            .slots(props.date ?? null)
            .map((s) => h('option', { value: s.id, selected: s.id === slot }, s.label)),
        )
      : null;

  function step(dir) {
    const parsed = parseQty(qtyInput);
    const base = parsed.ok ? qty : 0;
    const inc = servingId === 'g' ? 10 : 0.5;
    let next =
      dir > 0
        ? Math.floor(base / inc + 1e-9) * inc + inc
        : Math.ceil(base / inc - 1e-9) * inc - inc;
    if (next <= 0) next = servingId === 'g' ? 10 : 0.5;
    qty = Math.round(next * 100) / 100;
    qtyInput = qtyText(qty);
    refresh();
  }

  const stepper = h(
    'div',
    { class: 'stepper' },
    h(
      'button',
      { type: 'button', class: 'btn-step', 'aria-label': 'Less', onclick: () => step(-1) },
      iconEl('minus'),
    ),
    h('label', { class: 'sr-only', for: qtyId }, 'Quantity'),
    input,
    h(
      'button',
      { type: 'button', class: 'btn-step', 'aria-label': 'More', onclick: () => step(1) },
      iconEl('plus'),
    ),
  );

  const detailsBtn = h(
    'button',
    {
      type: 'button',
      class: 'btn btn-quiet btn-source',
      onclick: () => openFoodDetails({ food, rules }),
    },
    iconEl('info', 18),
    h('span', null, 'Source and details'),
  );

  const form = h(
    'form',
    {
      class: 'dlg-panel',
      method: 'dialog',
      onsubmit: (event) => {
        event.preventDefault();
        submit();
      },
    },
    h(
      'header',
      { class: 'dlg-head' },
      h('div', { class: 'picker-titles' }, title, subtitle),
      h(
        'button',
        { type: 'button', class: 'btn-icon', 'aria-label': 'Close', onclick: () => close() },
        iconEl('close'),
      ),
    ),
    h(
      'div',
      { class: 'dlg-body picker-body' },
      halalBox,
      variantBox,
      food ? servingBox : null,
      h(
        'div',
        { class: 'picker-qty', hidden: !food },
        h('p', { class: 'field-label', id: `${qtyId}-lbl` }, 'How much'),
        fractionBox,
        stepper,
        error,
      ),
      preview,
      slotSelect
        ? h(
            'label',
            { class: 'field field--inline' },
            h('span', { class: 'field-label' }, 'Meal'),
            slotSelect,
          )
        : null,
      food ? detailsBtn : null,
    ),
    h(
      'footer',
      { class: 'dlg-actions' },
      mode === 'edit'
        ? h(
            'button',
            {
              type: 'button',
              class: 'btn btn-quiet',
              onclick: () => {
                close();
                props.onDelete?.();
              },
            },
            iconEl('trash', 18),
            h('span', null, 'Delete'),
          )
        : null,
      primary,
    ),
  );
  dialog.append(form);

  // ---- render
  function renderStatic() {
    setText(title, food ? food.name : (entry?.snapshot?.name ?? 'Quick add'));
    subtitle.replaceChildren(
      ...[
        food ? urduName(food) : null,
        food ? estimateBadge(food, rules) : null,
        food ? kamTelLine(food, rules) : null, // STATUS O11
        !food
          ? h('span', { class: 'picker-note' }, 'Quick add: one portion as you entered it.')
          : null,
      ].filter(Boolean),
    );
    const halal = food ? halalChip(food, rules) : null;
    halalBox.replaceChildren(...(halal ? [halal.chip, halal.reason] : []));
    halalBox.hidden = !halal;
    renderVariants();
    renderServings();
  }

  function renderVariants() {
    const variants = food?.family ? store.variants(food.id) : [];
    if (variants.length < 2) {
      variantBox.hidden = true;
      variantBox.replaceChildren();
      return;
    }
    variantBox.hidden = false;
    const name = uid('style');
    variantBox.replaceChildren(
      h(
        'fieldset',
        { class: 'segmented-field', 'data-testid': 'variant-switch' },
        h('legend', { class: 'field-label' }, 'Where it was made'),
        h(
          'div',
          { class: 'segmented' },
          variants.map((v) => {
            const label =
              rules?.vocab?.styles?.find((s) => s.id === v.style)?.label ?? v.style ?? v.name;
            return h(
              'label',
              { class: 'seg' },
              h('input', {
                type: 'radio',
                name,
                value: v.id,
                checked: v.id === food.id,
                onchange: () => switchTo(v),
              }),
              h('span', null, label),
            );
          }),
        ),
      ),
    );
  }

  function switchTo(next) {
    if (next.id === food.id) return;
    if (servingId !== 'g' && !servingOf(next, servingId)) {
      const grams = portionNutrients(food, servingId, parseQty(qtyInput).ok ? qty : 1).grams;
      servingId = 'g';
      qty = Math.round(grams);
      qtyInput = qtyText(qty);
    }
    food = next;
    renderStatic();
    refresh();
    variantBox.querySelector(`input[value="${CSS.escape(next.id)}"]`)?.focus();
  }

  function renderServings() {
    if (!food) return;
    const name = uid('serving');
    const options = [...food.servings, { id: 'g', label: 'grams', grams: 1 }];
    servingBox.replaceChildren(
      h(
        'fieldset',
        { class: 'serving-chips' },
        h('legend', { class: 'field-label' }, 'Portion'),
        options.map((s) =>
          h(
            'label',
            { class: ['serving-chip', s.id === 'g' ? 'serving-chip--grams' : null] },
            h('input', {
              type: 'radio',
              name,
              value: s.id,
              checked: s.id === servingId,
              onchange: () => chooseServing(s.id),
            }),
            s.id === 'g' ? null : measureDrawing(s, food),
            h('span', { class: 'serving-name' }, s.id === 'g' ? 'Grams' : unitName(s)),
            h(
              'span',
              { class: 'serving-grams' },
              s.id === 'g' ? 'type the weight' : `${fmtGrams(s.grams)} g`,
            ),
          ),
        ),
      ),
    );
  }

  function chooseServing(id) {
    if (id === servingId) return;
    if (id === 'g') {
      const grams = portionNutrients(food, servingId, parseQty(qtyInput).ok ? qty : 1).grams;
      qty = Math.max(1, Math.round(grams));
    } else if (servingId === 'g') {
      qty = 1;
    }
    servingId = id;
    qtyInput = qtyText(qty);
    refresh();
  }

  function refresh({ keepInput = false } = {}) {
    const parsed = parseQty(qtyInput);
    if (!keepInput && input.value !== qtyInput) input.value = qtyInput;

    // "Thora sa" (¼ of the default serving, on every food), then fraction chips (not for grams)
    const grams = servingId === 'g';
    fractionBox.hidden = !food && grams;
    if (food || !grams) {
      fractionBox.replaceChildren(
        food && props.showSlot !== false && !tasteChipHidden(food, rules)
          ? tasteChip(parsed)
          : null,
        ...(grams ? [] : FRACTIONS).map((f) =>
          h(
            'button',
            {
              type: 'button',
              class: 'qty-chip',
              'aria-pressed': String(parsed.ok && Math.abs(qty - f) < 1e-9),
              onclick: () => {
                qty = f;
                qtyInput = qtyText(f);
                refresh();
              },
            },
            fmtQty(f),
          ),
        ),
      );
    }

    // error
    if (parsed.ok) {
      error.hidden = true;
      input.removeAttribute('aria-invalid');
    } else {
      error.hidden = false;
      setText(error, ERRORS[parsed.error]);
      input.setAttribute('aria-invalid', 'true');
    }
    primary.disabled = !parsed.ok;

    // preview
    if (parsed.ok) {
      const n = food
        ? portionNutrients(food, servingId, qty)
        : { ...scaledSnapshot(entry, qty), grams: null };
      const serving = food ? servingOf(food, servingId) : null;
      const what =
        food && serving && servingId !== 'g' ? `${fmtQty(qty)} ${unitName(serving)} = ` : '';
      preview.replaceChildren(
        h(
          'p',
          { class: 'preview-main' },
          what,
          n.grams !== null ? h('strong', null, `${fmtGrams(n.grams)} g`) : null,
          n.grams !== null ? ' · ' : null,
          h('strong', null, `${fmtKcal(n.kcal)} kcal`),
        ),
        h(
          'p',
          { class: 'preview-macros' },
          `Protein ${fmtGrams(n.protein)} g · Carbs ${fmtGrams(n.carbs)} g · Fat ${fmtGrams(n.fat)} g · Fibre ${fmtGrams(n.fiber)} g`,
        ),
      );
    } else {
      preview.replaceChildren(
        h(
          'p',
          { class: 'preview-main preview-main--muted' },
          'Choose how much to see the numbers.',
        ),
      );
    }

    setText(
      primary,
      props.primaryLabel ?? (mode === 'edit' ? 'Save' : `Add to ${store.slotLabel(slot)}`),
    );
  }

  function tasteChip(parsed) {
    const base = defaultServingOf(food);
    const on = parsed.ok && servingId === base.id && Math.abs(qty - TASTE_QTY) < 1e-9;
    return h(
      'button',
      {
        type: 'button',
        class: 'qty-chip qty-chip--taste',
        'data-testid': 'taste-chip',
        'aria-pressed': String(on),
        'aria-label': `Thora sa, a taste: a quarter ${unitName(base)}`,
        onclick: () => {
          const changed = servingId !== base.id;
          servingId = base.id;
          qty = TASTE_QTY;
          qtyInput = qtyText(qty);
          if (changed) renderServings();
          refresh();
        },
      },
      h('span', { class: 'qty-chip-main' }, 'Thora sa'),
      h('span', { class: 'qty-chip-sub' }, `a taste, ${fmtQty(TASTE_QTY)}`),
    );
  }

  function scaledSnapshot(e, q) {
    const s = e?.snapshot ?? {};
    const f = q / (e?.qty || 1);
    return {
      kcal: (s.kcal ?? 0) * f,
      protein: (s.protein ?? 0) * f,
      carbs: (s.carbs ?? 0) * f,
      fat: (s.fat ?? 0) * f,
      fiber: (s.fiber ?? 0) * f,
    };
  }

  function submit() {
    const parsed = parseQty(qtyInput);
    if (!parsed.ok) {
      refresh();
      input.focus();
      return;
    }
    const payload = { foodId: food ? food.id : null, servingId, qty: parsed.value, slot };
    close();
    if (mode === 'edit') props.onSave?.(payload);
    else props.onAdd?.(payload);
  }

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    if (dialog.open) dialog.close();
    dialog.remove();
    props.onClose?.();
  }
  dialog.addEventListener('close', () => close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });

  renderStatic();
  refresh();
  document.body.append(dialog);
  dialog.showModal();
  // Focus the chosen serving (thumb reach) rather than the text box, so the phone keyboard stays
  // closed unless the person wants to type.
  (servingBox.querySelector('input:checked') ?? primary).focus();
  return { dialog, close };
}
