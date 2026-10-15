// Add sheet (route `add`, ARCHITECTURE §7.2). Owner: Priya.
// - The search box has focus on open; results update as you type with no search button, and the
//   input is never re-created while typing (A2).
// - Empty query: this slot's recents first; their "+" adds the last portion in one tap (A6).
// - Every row shows its "+" portion and kcal (A2), an "estimate" badge for confidence C (A14) and
//   the halal chip; "+" adds in one action: last-used portion, else the default (DECISIONS.md).
// - "Halal only" toggle (settings.halalOnly); when the filter hides matches, one line names them
//   with the reason and offers "Show hidden" (meeting 002, A19 step 5).
// - The sheet stays open for the next food. Quick add: name and kcal, macros optional.
import { h, uid, setText, mountChildren } from '../dom.js';
import { iconEl } from './icons.js';
import { halalChip, estimateBadge, styleLabel, urduName } from './food-bits.js';
import { openPortionPicker } from './portion-picker.js';
import { boxWord } from './prep-bits.js';
import { normalize, foodKind } from '../../core/search.js';
import { searchNoteText } from './search-notes.js';
import {
  fmtKcal,
  fmtGrams,
  portionText,
  servingOf,
  portionNutrients,
  fmtDateShort,
  fmtMinutes,
  relativeDay,
} from './format.js';

const SUGGESTIONS = ['chai', 'roti', 'anda', 'daal', 'café con leche', 'croissant'];

/** Words people type for a taste or leftovers (Meeting 003 item 4); they show TASTE_HELP. */
const TASTE_WORDS = [
  'taste',
  'tasting',
  'thora sa',
  'thoda sa',
  'thori si',
  'bacha hua',
  'bachi hui',
  'bacha',
  'leftover',
  'leftovers',
  'chakhna',
].map(normalize);
export const TASTE_HELP =
  'A taste or leftovers? Search the food itself (for example daal), open it and tap “Thora sa” ' +
  'for a taste (¼ of a serving), or ½ for a small leftover bowl.';

/** True when the query asks how to log a taste or leftovers ("taste", "thora sa", "bacha hua"…). */
export function isTasteQuery(query) {
  const q = normalize(String(query ?? ''));
  if (q.length < 4) return false;
  return TASTE_WORDS.some((w) => w.startsWith(q) || q.startsWith(w));
}

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
 * The sheet header line: which day the food counts for (Review 1). After midnight and before the
 * day start, food still counts for the evening before, and the line says so.
 * @returns {string} e.g. "Counts for Today, Wed 14 Oct" or
 *   "Counts for Wed 14 Oct: your day runs until 04:00"
 */
export function countsForText(date, store) {
  const today = store.today();
  const rel = relativeDay(date, today);
  const day = rel ? `${rel}, ${fmtDateShort(date)}` : fmtDateShort(date);
  if (date === today && store.clockDate?.() && store.clockDate() !== today) {
    const until = fmtMinutes(store.settings().dayStartMinutes ?? 240);
    return `Counts for ${fmtDateShort(date)}: your day runs until ${until}`;
  }
  return `Counts for ${day}`;
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
    const kind = kindTag(food);
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
        style || kind || estimateBadge(food, rules)
          ? h(
              'span',
              { class: 'entry-tags' },
              kind,
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
      mountChildren(
        results,
        prepGroup(),
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
    // Pork, alcohol and shellfish words get one calm line, never a bare "Nothing found" (Review 2).
    const noteText = searchNoteText(q, {
      hits: shown.length,
      halalOnly: store.settings().halalOnly,
      hasShellfish,
    });
    const help = isTasteQuery(q)
      ? h('p', { class: 'help-row', 'data-testid': 'taste-help', role: 'note' }, TASTE_HELP)
      : noteText
        ? h('p', { class: 'help-row', 'data-testid': 'search-note', role: 'note' }, noteText)
        : null;
    const list = h(
      'section',
      { class: 'result-group', 'data-testid': 'results', 'aria-label': 'Search results' },
      help,
      shown.length
        ? h(
            'ul',
            { class: 'food-list', role: 'list' },
            shown.map((food) => foodRow(food, store.portionFor(food.id))),
          )
        : hidden.length || help
          ? null
          : h(
              'p',
              { class: 'empty-note' },
              `Nothing found for “${q}”. Try another spelling, or use Quick add below.`,
            ),
    );
    // mountChildren drops null; replaceChildren(list, null) printed the text "null" (Review 1).
    mountChildren(results, list, hidden.length ? hiddenNote(hidden) : null);
    quick.setName(q);
  }

  /** "Prep" on a Lab meal-prep box, "My recipe" on the person's own (Review 2); chai has neither. */
  function kindTag(food) {
    const kind = foodKind(food);
    if (kind === 'prep') {
      return h('span', { class: 'tag-style tag-prep', 'data-testid': 'prep-tag' }, 'Prep');
    }
    if (kind === 'own' && food.group === 'lunchbox') {
      return h('span', { class: 'tag-style tag-own', 'data-testid': 'own-tag' }, 'My recipe');
    }
    return null;
  }

  /** True when the food list has any prawn or other shellfish record (Javier's seafood). */
  function hasShellfish() {
    return ['prawn', 'squid', 'mussel'].some((w) =>
      store.search(w, { limit: 3 }).hits.some((x) => /seafood-(prawn|other)/.test(x.food.tags)),
    );
  }

  /**
   * Sprint 2: meal-prep boxes with some left (one tap places a box, A17) and saved meals (one tap
   * adds every food, A5 c), above the recents while nothing is typed.
   */
  function prepGroup() {
    const boxes = store
      .batches()
      .map((batch) => ({ batch, left: store.boxesLeft(batch.id) }))
      .filter((b) => b.left > 0);
    const meals = store.savedMeals();
    if (!boxes.length && !meals.length) return null;
    const row = ({ testid, id, name, line, label, onAdd }) => {
      const plus = h(
        'button',
        {
          type: 'button',
          class: 'btn-plus',
          'aria-label': label,
          onclick: () => {
            onAdd();
            renderResults();
          },
        },
        iconEl('plus', 22),
      );
      return h(
        'li',
        { class: 'food-row food-row--prep', 'data-testid': testid, 'data-id': id },
        h(
          'div',
          { class: 'food-main food-main--static' },
          h('span', { class: 'food-name' }, name),
          h('span', { class: 'food-portion' }, line),
        ),
        plus,
      );
    };
    return h(
      'section',
      {
        class: 'result-group',
        'data-testid': 'prep-group',
        'aria-label': 'Meal prep and saved meals',
      },
      h('h3', { class: 'group-title' }, 'Ready to add'),
      h(
        'ul',
        { class: 'food-list', role: 'list' },
        boxes.map(({ batch, left }) => {
          const food = store.food(batch.recipeId);
          const word = boxWord(food, rules);
          const name = store.batchName(batch);
          return row({
            testid: 'prep-box-row',
            id: batch.id,
            name,
            line: `1 ${word} · ${left} left · meal prep`,
            label: `Add a ${word} of ${name}`,
            onAdd: () => {
              store.placeBox({ batchId: batch.id, date, slot });
              addedCount += 1;
              setText(
                status,
                `Added a ${word} of ${name} to ${store.slotLabel(slot)}. ${left - 1} left.`,
              );
            },
          });
        }),
        meals.map((meal) =>
          row({
            testid: 'saved-meal-row',
            id: meal.id,
            name: meal.name,
            line: `Saved meal · ${meal.items.length} ${meal.items.length === 1 ? 'food' : 'foods'}`,
            label: `Add ${meal.name}`,
            onAdd: () => {
              const n = store.addSavedMeal({ mealId: meal.id, date, slot });
              addedCount += 1;
              setText(status, `Added ${meal.name} to ${store.slotLabel(slot)}.`);
              return n;
            },
          }),
        ),
      ),
    );
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
    setText(when, countsForText(date, store));
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
