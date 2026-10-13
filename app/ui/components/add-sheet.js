// Add sheet (route `add`, ARCHITECTURE §7.2). Owner: Priya.
// - The search box has focus on open; results update as you type with no search button, and the
//   input is never re-created while typing (A2).
// - Empty query: this slot's recents first; their "+" adds the last portion in one tap (A6).
// - Every row shows its "+" portion and kcal (A2), an "estimate" badge for confidence C (A14) and
//   the halal chip; "+" adds in one action: last-used portion, else the default (DECISIONS.md).
// - "Halal only" toggle (settings.halalOnly); when the filter hides matches, one line names them
//   with the reason and offers "Show hidden" (meeting 002, A19 step 5).
// - The sheet stays open for the next food. Quick add: name and kcal, macros optional.
import { h, uid, setText } from '../dom.js';
import { iconEl } from './icons.js';
import { halalChip, estimateBadge, styleLabel, urduName } from './food-bits.js';
import { openPortionPicker } from './portion-picker.js';
import {
  fmtKcal,
  fmtGrams,
  portionText,
  servingOf,
  portionNutrients,
  fmtDateShort,
  relativeDay,
} from './format.js';

const SUGGESTIONS = ['chai', 'roti', 'anda', 'daal', 'café con leche', 'croissant'];

/** "1 cup (200 ml) · 148 kcal" for qty 1, else "2 medium roti (80 g) · 216 kcal". */
export function plusPortionText(food, servingId, qty) {
  const serving = servingOf(food, servingId);
  const n = portionNutrients(food, servingId, qty);
  const what =
    serving && serving.id !== 'g' && qty === 1
      ? serving.label
      : `${portionText(serving, qty)}${serving?.id === 'g' ? '' : ` (${fmtGrams(n.grams)} g)`}`;
  return `${what} · ${fmtKcal(n.kcal)} kcal`;
}

/**
 * @param {{ store: object, rules: object, date: string, slot: string,
 *   onRequestClose: () => void, onSlotChange: (slot: string) => void }} props
 * @returns {{ el: HTMLDialogElement, open: () => void, update: (p: { date: string, slot: string }) => void,
 *   destroy: () => void }}
 */
export function createAddSheet(props) {
  const { store, rules } = props;
  let date = props.date;
  let slot = props.slot;
  let query = '';
  let revealHidden = false;
  let addedCount = 0;
  let justAdded = false;
  const titleId = uid('sheet');
  const searchId = uid('search');

  const title = h('h2', { class: 'dlg-title', id: titleId });
  const when = h('p', { class: 'sheet-when' });
  const slotSelect = h('select', {
    class: 'select',
    'aria-label': 'Meal',
    onchange: () => props.onSlotChange(slotSelect.value),
  });
  const status = h('p', { class: 'sheet-status', role: 'status', 'aria-live': 'polite' });
  const input = h('input', {
    id: searchId,
    class: 'search-input',
    type: 'search',
    placeholder: 'Search: chai, roti, croissant…',
    autocomplete: 'off',
    autocapitalize: 'off',
    spellcheck: 'false',
    enterkeyhint: 'search',
    autofocus: true,
    oninput: () => {
      query = input.value;
      revealHidden = false;
      clearBtn.hidden = query === '';
      renderResults();
    },
    onfocus: () => {
      if (justAdded && input.value) input.select();
      justAdded = false;
    },
  });
  const clearBtn = h(
    'button',
    {
      type: 'button',
      class: 'btn-icon search-clear',
      'aria-label': 'Clear search',
      hidden: true,
      onclick: () => {
        input.value = '';
        query = '';
        clearBtn.hidden = true;
        renderResults();
        input.focus();
      },
    },
    iconEl('close', 18),
  );
  const halalToggle = h('input', {
    type: 'checkbox',
    role: 'switch',
    class: 'switch-input',
    onchange: () => store.updateSettings({ halalOnly: halalToggle.checked }),
  });
  const results = h('div', { class: 'sheet-results' });
  const quick = createQuickAdd();

  const el = h(
    'dialog',
    {
      class: 'dlg dlg--sheet sheet',
      'data-testid': 'add-sheet',
      'aria-labelledby': titleId,
    },
    h(
      'div',
      { class: 'dlg-panel sheet-panel' },
      h(
        'header',
        { class: 'dlg-head sheet-head' },
        h('div', { class: 'sheet-titles' }, title, when),
        h(
          'button',
          {
            type: 'button',
            class: 'btn btn-primary btn-done',
            onclick: () => props.onRequestClose(),
          },
          'Done',
        ),
      ),
      h(
        'div',
        { class: 'sheet-controls' },
        h(
          'div',
          { class: 'search' },
          h('label', { class: 'sr-only', for: searchId }, 'Search foods'),
          iconEl('search', 20),
          input,
          clearBtn,
        ),
        h(
          'div',
          { class: 'sheet-filters' },
          h(
            'label',
            { class: 'field field--inline sheet-meal' },
            h('span', { class: 'field-label' }, 'Meal'),
            slotSelect,
          ),
          h(
            'label',
            { class: 'switch' },
            halalToggle,
            h('span', { class: 'switch-track', 'aria-hidden': 'true' }),
            h('span', null, 'Halal only'),
          ),
        ),
        status,
      ),
      h('div', { class: 'dlg-body sheet-body' }, results, quick.el),
    ),
  );
  el.addEventListener('cancel', (event) => {
    event.preventDefault();
    props.onRequestClose();
  });

  // ------------------------------------------------------------------ rows

  function addNow(food, portion = null) {
    const id = store.addFood({ date, slot, foodId: food.id, ...(portion ?? {}) });
    addedCount += 1;
    justAdded = true;
    const entry = store.day(date).entries.find((e) => e.id === id);
    const serving = entry ? servingOf(food, entry.servingId) : null;
    const what = entry && serving ? portionText(serving, entry.qty) : '';
    setText(
      status,
      `Added ${food.name}${what ? `, ${what}` : ''}, to ${store.slotLabel(slot)}. ${addedCount} added so far.`,
    );
    return id;
  }

  function foodRow(food, { servingId, qty }) {
    const halal = halalChip(food, rules);
    const style = styleLabel(food, rules);
    const plus = h(
      'button',
      {
        type: 'button',
        class: 'btn-plus',
        'aria-label': `Add ${food.name}`,
        onclick: () => {
          addNow(food);
          plus.classList.add('is-added');
          plus.replaceChildren(iconEl('check', 22));
          setTimeout(() => {
            plus.classList.remove('is-added');
            plus.replaceChildren(iconEl('plus', 22));
          }, 1200);
        },
      },
      iconEl('plus', 22),
    );
    return h(
      'li',
      { class: 'food-row', 'data-testid': 'food-row', 'data-food-id': food.id },
      h(
        'button',
        {
          type: 'button',
          class: 'food-main',
          'aria-haspopup': 'dialog',
          onclick: () => pick(food, { servingId, qty }),
        },
        h('span', { class: 'food-name' }, food.name),
        urduName(food),
        style || estimateBadge(food, rules)
          ? h(
              'span',
              { class: 'entry-tags' },
              style ? h('span', { class: 'tag-style' }, style) : null,
              estimateBadge(food, rules),
            )
          : null,
        h('span', { class: 'food-portion' }, plusPortionText(food, servingId, qty)),
      ),
      plus,
      halal ? h('div', { class: 'entry-halal' }, halal.chip) : null,
      halal ? halal.reason : null,
    );
  }

  function pick(food, portion) {
    openPortionPicker({
      store,
      rules,
      food,
      servingId: portion.servingId,
      qty: portion.qty,
      slot,
      date,
      mode: 'add',
      onAdd: ({ foodId, servingId, qty }) => {
        const chosen = store.food(foodId) ?? food;
        addNow(chosen, { servingId, qty });
      },
    });
  }

  function renderResults() {
    const q = query.trim();
    if (!q) {
      const recents = store.recents(slot);
      results.replaceChildren(
        recents.length
          ? h(
              'section',
              { class: 'result-group', 'data-testid': 'recents', 'aria-label': 'Recent foods' },
              h('h3', { class: 'group-title' }, 'Recent'),
              h(
                'ul',
                { class: 'food-list', role: 'list' },
                recents.map((r) => foodRow(r.food, r)),
              ),
            )
          : h(
              'div',
              { class: 'sheet-hint' },
              h('p', null, 'Type what you ate. Spelling does not need to be perfect.'),
              h(
                'p',
                { class: 'chip-row' },
                SUGGESTIONS.map((word) =>
                  h(
                    'button',
                    {
                      type: 'button',
                      class: 'chip',
                      onclick: () => {
                        input.value = word;
                        query = word;
                        clearBtn.hidden = false;
                        renderResults();
                        input.focus();
                      },
                    },
                    word,
                  ),
                ),
              ),
            ),
      );
      quick.setName('');
      return;
    }

    const found = store.search(q, { slot });
    const hits = found.hits.map((hit) => hit.food);
    const hidden = found.hidden.map((hit) => hit.food);
    const shown = revealHidden ? [...hits, ...hidden] : hits;
    const list = h(
      'section',
      { class: 'result-group', 'data-testid': 'results', 'aria-label': 'Search results' },
      shown.length
        ? h(
            'ul',
            { class: 'food-list', role: 'list' },
            shown.map((food) => foodRow(food, store.portionFor(food.id))),
          )
        : hidden.length
          ? null
          : h(
              'p',
              { class: 'empty-note' },
              `Nothing found for “${q}”. Try another spelling, or use Quick add below.`,
            ),
    );
    results.replaceChildren(list, hidden.length ? hiddenNote(hidden) : null);
    quick.setName(q);
  }

  function hiddenNote(hidden) {
    const n = hidden.length;
    if (revealHidden) {
      return h(
        'div',
        { class: 'hidden-note', 'data-testid': 'hidden-note' },
        h(
          'p',
          null,
          `Showing ${n} not-halal ${n === 1 ? 'food' : 'foods'} for this search only. “Halal only” is still on.`,
        ),
      );
    }
    return h(
      'div',
      { class: 'hidden-note', 'data-testid': 'hidden-note' },
      h('p', { class: 'hidden-title' }, `${n} hidden: not halal`),
      h(
        'ul',
        { class: 'hidden-list', role: 'list' },
        hidden
          .slice(0, 3)
          .map((food) =>
            h(
              'li',
              null,
              h('strong', null, food.name),
              food.halal?.reason ? `: ${food.halal.reason}` : '',
            ),
          ),
      ),
      h(
        'button',
        {
          type: 'button',
          class: 'btn btn-quiet',
          onclick: () => {
            revealHidden = true;
            renderResults();
          },
        },
        n === 1 ? 'Show hidden' : `Show hidden (${n})`,
      ),
    );
  }

  // ------------------------------------------------------------------ quick add

  function createQuickAdd() {
    const nameId = uid('qa-name');
    const kcalId = uid('qa-kcal');
    const err = h('p', { class: 'field-error', hidden: true });
    const nameIn = h('input', { id: nameId, class: 'input', type: 'text', autocomplete: 'off' });
    const kcalIn = h('input', {
      id: kcalId,
      class: 'input',
      type: 'text',
      inputmode: 'decimal',
      autocomplete: 'off',
    });
    const macro = (label) => {
      const id = uid('qa');
      const input = h('input', {
        id,
        class: 'input',
        type: 'text',
        inputmode: 'decimal',
        autocomplete: 'off',
      });
      return {
        input,
        field: h(
          'div',
          { class: 'field' },
          h('label', { class: 'field-label', for: id }, label),
          input,
        ),
      };
    };
    const protein = macro('Protein (g)');
    const carbs = macro('Carbs (g)');
    const fat = macro('Fat (g)');
    const num = (v) => Number(String(v).trim().replace(',', '.'));
    const form = h(
      'form',
      {
        class: 'quick-form',
        'data-testid': 'quick-add',
        hidden: true,
        onsubmit: (event) => {
          event.preventDefault();
          const name = nameIn.value.trim();
          const kcal = num(kcalIn.value);
          const extras = {
            protein: protein.input.value,
            carbs: carbs.input.value,
            fat: fat.input.value,
          };
          let problem = null;
          if (!name) problem = 'Give it a name, for example “Wedding dinner”.';
          else if (kcalIn.value.trim() === '' || !Number.isFinite(kcal) || kcal < 0)
            problem = 'Type the kcal as a number, for example 650.';
          const nutrients = { kcal };
          for (const [k, v] of Object.entries(extras)) {
            if (String(v).trim() === '') continue;
            const n = num(v);
            if (!Number.isFinite(n) || n < 0)
              problem = problem ?? 'Protein, carbs and fat must be numbers (or left empty).';
            else nutrients[k] = n;
          }
          if (problem) {
            err.hidden = false;
            setText(err, problem);
            return;
          }
          err.hidden = true;
          store.quickAdd({ date, slot, name, nutrients });
          addedCount += 1;
          setText(
            status,
            `Added ${name}, to ${store.slotLabel(slot)}. ${addedCount} added so far.`,
          );
          for (const i of [nameIn, kcalIn, protein.input, carbs.input, fat.input]) i.value = '';
          form.hidden = true;
          toggle.setAttribute('aria-expanded', 'false');
        },
      },
      h(
        'div',
        { class: 'field' },
        h('label', { class: 'field-label', for: nameId }, 'Name'),
        nameIn,
      ),
      h(
        'div',
        { class: 'field' },
        h('label', { class: 'field-label', for: kcalId }, 'kcal (calories)'),
        kcalIn,
      ),
      h(
        'details',
        { class: 'quick-more' },
        h('summary', null, 'Protein, carbs, fat (optional)'),
        h('div', { class: 'field-row' }, protein.field, carbs.field, fat.field),
      ),
      err,
      h('button', { type: 'submit', class: 'btn btn-primary btn-block' }, 'Add'),
    );
    const toggle = h(
      'button',
      {
        type: 'button',
        class: 'btn btn-quiet quick-toggle',
        'aria-expanded': 'false',
        onclick: () => {
          form.hidden = !form.hidden;
          toggle.setAttribute('aria-expanded', String(!form.hidden));
          if (!form.hidden) (nameIn.value ? kcalIn : nameIn).focus();
        },
      },
      iconEl('plus', 18),
      h('span', null, 'Quick add'),
    );
    const el = h(
      'section',
      { class: 'quick-add', 'aria-label': 'Quick add' },
      h('p', { class: 'quick-hint' }, 'Can’t find it? Add a name and kcal.'),
      toggle,
      form,
    );
    return {
      el,
      setName(text) {
        if (form.hidden) nameIn.value = text;
      },
    };
  }

  // ------------------------------------------------------------------ lifecycle

  function renderHead() {
    const label = store.slotLabel(slot);
    setText(title, `Add to ${label}`);
    const rel = relativeDay(date, store.today());
    setText(when, rel ? `${rel}, ${fmtDateShort(date)}` : fmtDateShort(date));
    slotSelect.replaceChildren(
      ...store.slots().map((s) => h('option', { value: s.id, selected: s.id === slot }, s.label)),
    );
    halalToggle.checked = Boolean(store.settings().halalOnly);
  }

  let lastHalal = store.settings().halalOnly;
  const unsubscribe = store.subscribe(() => {
    const halal = store.settings().halalOnly;
    renderHead();
    if (halal !== lastHalal) {
      lastHalal = halal;
      renderResults();
    }
  });

  return {
    el,
    open() {
      renderHead();
      renderResults();
      document.body.append(el);
      el.showModal();
      input.focus();
    },
    update(next) {
      const slotChanged = next.slot !== slot;
      date = next.date;
      slot = next.slot;
      renderHead();
      if (slotChanged) renderResults();
    },
    destroy() {
      unsubscribe();
      if (el.open) el.close();
      el.remove();
    },
  };
}
