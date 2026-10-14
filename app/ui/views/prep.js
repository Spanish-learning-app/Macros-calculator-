// Meal prep (route `prep`). Owner: Lena. Sprint 2: ARCHITECTURE §13, CUSTOMER A16–A18.
// - Batches: boxes left and halal status always visible; each box's fridge/freezer (one tap to
//   move), use-by in calm words; one tap per day to place a box in any meal, "Fill Mon–Thu";
//   a shopping list copied as text.
// - Your recipes (whole-pot builder), "Set my chai once", and the Lab's library for every meal.
import { h, mountChildren, setText } from '../dom.js';
import { iconEl } from '../components/icons.js';
import { openDialog } from '../components/dialog.js';
import { createUndoToast } from '../components/toast.js';
import { halalChip } from '../components/food-bits.js';
import { openRecipeEditor } from '../components/recipe-editor.js';
import { openChaiDialog } from '../components/chai-dialog.js';
import {
  addDays,
  dayOfWeek,
  fmtDateShort,
  fmtWeekday,
  fmtGrams,
  portionNutrients,
  defaultServingOf,
} from '../components/format.js';
import {
  macroLine,
  boxWord,
  plural,
  pluralWord,
  dayText,
  useByText,
  noteEl,
  copyText,
} from '../components/prep-bits.js';

const SLOT_ORDER = ['breakfast', 'lunch', 'dinner', 'snacks', 'evening'];

/**
 * @param {HTMLElement} container
 * @param {{ store: object, router: object, rules: object }} ctx
 */
export function mount(container, ctx) {
  const { store, rules } = ctx;
  const toast = createUndoToast({ store });
  const notices = h('div', { class: 'prep-notices' });
  const batchesBox = h('section', { class: 'prep-section', 'aria-labelledby': 'prep-batches' });
  const recipesBox = h('section', { class: 'prep-section', 'aria-labelledby': 'prep-recipes' });
  const libraryBox = h('section', { class: 'prep-section', 'aria-labelledby': 'prep-library' });
  /** Inline notes per batch (A17: "no boxes left" shows in place, not as a pop-up). */
  const batchNotes = new Map();
  /** The meal each batch card places into. */
  const batchSlot = new Map();

  const root = h(
    'div',
    { class: 'view view-prep', 'data-testid': 'prep-view' },
    h('h2', { class: 'view-title' }, 'Meal prep'),
    h(
      'p',
      { class: 'muted prep-lead' },
      'Cook once, eat all week: boxes, jars or portions for breakfast, lunch or dinner.',
    ),
    notices,
    batchesBox,
    recipesBox,
    libraryBox,
    toast.el,
  );
  mountChildren(container, root);

  // ------------------------------------------------------------------ cook a batch

  function openCook(recipeId) {
    const food = store.food(recipeId);
    if (!food) return;
    const word = boxWord(food, rules);
    const userRecipe = store.recipe(recipeId);
    const lib = store.library().find((l) => l.food.id === recipeId);
    let boxes = userRecipe?.boxes ?? lib?.recipe?.boxes ?? 4;
    let plan = store.planFor(recipeId, boxes);
    let storage = [...plan.storage];
    const per = portionNutrients(food, defaultServingOf(food).id, 1);
    const halal = halalChip(food, rules);
    const countOut = h('output', { class: 'boxes-count', 'data-testid': 'cook-boxes' });
    const boxesList = h('ul', { class: 'cook-boxes', role: 'list' });
    const keepNote = h('p', { class: 'field-help' });
    const dateIn = h('input', {
      type: 'date',
      class: 'input',
      value: store.today(),
      required: true,
    });
    const cookBtn = h('button', {
      type: 'button',
      class: 'btn btn-primary',
      'data-testid': 'cook-save',
      onclick: () => {
        const batchId = store.cookBatch({
          recipeId,
          boxes,
          cookedOn: dateIn.value || store.today(),
          storage,
        });
        handle.close('done');
        batchNotes.set(
          batchId,
          `Cooked ${plural(boxes, word)}. Now place them on the days you’ll eat them.`,
        );
        render();
        container
          .querySelector(`[data-batch-id="${CSS.escape(batchId)}"]`)
          ?.scrollIntoView({ block: 'start' });
      },
    });

    function renderBoxes() {
      setText(countOut, String(boxes));
      setText(cookBtn, `Cook ${plural(boxes, word)}`);
      const days = plan.fridgeDays;
      setText(
        keepNote,
        plan.freezable
          ? `Keeps ${plural(days, 'day')} in the fridge, so ${days === 1 ? `${word} 1 goes` : `the first ${days} go`} in the fridge and the rest in the freezer. Change any ${word}.`
          : `Doesn’t freeze well: keep every ${word} in the fridge and eat within ${plural(days, 'day')}.`,
      );
      mountChildren(
        boxesList,
        storage.map((where, i) =>
          h(
            'li',
            { class: 'cook-box' },
            h('span', { class: 'cook-box-name' }, `${capital(word)} ${i + 1}`),
            storageSwitch(where, plan.freezable, (next) => {
              storage[i] = next;
              renderBoxes();
            }),
          ),
        ),
      );
    }

    const step = (dir) =>
      h(
        'button',
        {
          type: 'button',
          class: 'btn-step',
          'aria-label': dir > 0 ? `One more ${word}` : `One ${word} fewer`,
          onclick: () => {
            boxes = Math.min(30, Math.max(1, boxes + dir));
            plan = store.planFor(recipeId, boxes);
            storage = [...plan.storage];
            renderBoxes();
          },
        },
        iconEl(dir > 0 ? 'plus' : 'minus'),
      );

    const handle = openDialog({
      title: `Cook a batch: ${food.name}`,
      testid: 'cook-dialog',
      content: [
        h(
          'p',
          { class: 'cook-per', 'data-testid': 'cook-per-box' },
          h('strong', null, `1 ${word}: `),
          macroLine(per),
        ),
        h('p', { class: 'muted' }, `${fmtGrams(per.grams)} g per ${word}`),
        halal
          ? h('div', { class: 'cook-halal' }, halal.chip, halal.reason)
          : h('p', { class: 'muted' }, 'Halal'),
        h(
          'div',
          { class: 'recipe-row' },
          h(
            'div',
            { class: 'field' },
            h('span', { class: 'field-label' }, `How many ${pluralWord(word)}`),
            h('div', { class: 'stepper' }, step(-1), countOut, step(1)),
          ),
          h('label', { class: 'field' }, h('span', { class: 'field-label' }, 'Cooked on'), dateIn),
        ),
        h('h3', { class: 'group-title' }, 'Fridge or freezer'),
        keepNote,
        boxesList,
      ],
      actions: cookBtn,
    });
    renderBoxes();
  }

  // ------------------------------------------------------------------ batches

  function storageSwitch(where, freezable, onPick, testid = null) {
    const opt = (value, label) =>
      h(
        'button',
        {
          type: 'button',
          class: ['seg-btn', where === value ? 'is-on' : null],
          'aria-pressed': String(where === value),
          disabled: value === 'freezer' && !freezable && where !== 'freezer',
          title: value === 'freezer' && !freezable ? 'Doesn’t freeze well' : null,
          onclick: () => where !== value && onPick(value),
        },
        label,
      );
    return h(
      'div',
      {
        class: 'seg-pair',
        role: 'group',
        'aria-label': 'Fridge or freezer',
        'data-testid': testid,
      },
      opt('fridge', 'Fridge'),
      opt('freezer', freezable ? 'Freezer' : 'No freezer'),
    );
  }

  /** The next Mon–Thu (from tomorrow), for "Fill Mon–Thu". */
  function monToThu() {
    const from = addDays(store.today(), 1);
    const out = [];
    for (let i = 0; i < 7; i += 1) {
      const d = addDays(from, i);
      const dow = dayOfWeek(d);
      if (dow >= 1 && dow <= 4) out.push(d);
    }
    return out.sort();
  }

  function batchCard(batch) {
    const today = store.today();
    const food = store.food(batch.recipeId);
    const name = store.batchName(batch);
    const word = boxWord(food, rules);
    const left = store.boxesLeft(batch.id);
    const total = batch.boxes.filter((b) => b.status !== 'discarded').length;
    const rows = store.boxRows(batch.id);
    const plan = store.planFor(batch.recipeId, Math.max(1, batch.boxes.length));
    const slot =
      batchSlot.get(batch.id) ?? food?.slots?.find((s) => SLOT_ORDER.includes(s)) ?? 'lunch';
    const per = food ? portionNutrients(food, defaultServingOf(food).id, 1) : null;
    const halal = food ? halalChip(food, rules) : null;
    const note = batchNotes.get(batch.id);

    const slotSelect = h(
      'select',
      {
        class: 'select',
        'aria-label': 'Meal',
        'data-testid': 'place-slot',
        onchange: () => {
          batchSlot.set(batch.id, slotSelect.value);
          render();
        },
      },
      store.slots().map((s) => h('option', { value: s.id, selected: s.id === slot }, s.label)),
    );

    const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
    const placedOn = (d) =>
      store.day(d).entries.filter((e) => e.boxRef?.batchId === batch.id && e.slot === slot).length;
    const fill = monToThu().filter((d) => placedOn(d) === 0);

    function place(date) {
      const result = store.placeBox({ batchId: batch.id, date, slot });
      const where = `${store.slotLabel(slot)}, ${dayText(date, store.today())}`;
      if (result.noneLeft) {
        batchNotes.set(
          batch.id,
          `No ${pluralWord(word)} left in this batch. Added to ${where} anyway; Undo takes it back.`,
        );
      } else if (result.warning === 'past-use-by') {
        batchNotes.set(
          batch.id,
          `Added to ${where}. That fridge ${word} is past its use-by by then: freeze it, or eat it sooner.`,
        );
      } else {
        batchNotes.set(batch.id, `Added a ${word} to ${where}.`);
      }
      render();
    }

    return h(
      'article',
      { class: 'card batch-card', 'data-testid': 'batch-card', 'data-batch-id': batch.id },
      h(
        'header',
        { class: 'batch-head' },
        h(
          'div',
          { class: 'batch-titles' },
          h('h3', { class: 'batch-name' }, name),
          h(
            'p',
            { class: 'batch-sub muted' },
            `Cooked ${dayText(batch.cookedOn, today)} · ${plural(total, word)}`,
          ),
        ),
        h(
          'p',
          { class: 'batch-left', 'data-testid': 'boxes-left' },
          h('strong', null, String(left)),
          ` of ${total} left`,
        ),
      ),
      h(
        'div',
        { class: 'batch-meta' },
        halal
          ? halal.chip
          : h('span', { class: 'batch-halal muted', 'data-testid': 'batch-halal' }, 'Halal'),
        per
          ? h(
              'span',
              { class: 'muted' },
              `1 ${word}: ${macroLine(per).split(' · ').slice(0, 2).join(' · ')}`,
            )
          : null,
      ),
      halal ? halal.reason : null,
      h(
        'ul',
        { class: 'box-list', role: 'list' },
        rows.map(({ box, number, useBy, today: status }) => {
          const placed = box.placed
            ? `${store.slotLabel(store.day(box.placed.date).entries.find((e) => e.id === box.placed.entryId)?.slot ?? slot)}, ${dayText(box.placed.date, today)}`
            : null;
          const what =
            box.status === 'eaten'
              ? 'Eaten'
              : box.status === 'discarded'
                ? 'Thrown away'
                : (placed ?? 'Not placed yet');
          const kind = status === 'past' ? 'past' : status === 'last-day' ? 'last' : 'info';
          const done = box.status === 'eaten' || box.status === 'discarded';
          return h(
            'li',
            {
              class: ['box-row', done ? 'box-row--done' : null],
              'data-testid': 'box-row',
              'data-box': String(number),
            },
            h(
              'div',
              { class: 'box-text' },
              h('span', { class: 'box-name' }, `${capital(word)} ${number}`),
              h('span', { class: 'box-what' }, what),
              done ? null : noteEl(useByText(box, useBy, status, today), kind, 'box-useby'),
            ),
            done
              ? null
              : h(
                  'div',
                  { class: 'box-actions' },
                  storageSwitch(
                    box.storage,
                    plan.freezable,
                    (next) => store.setBoxStorage(batch.id, box.id, next),
                    'box-storage',
                  ),
                  status === 'past'
                    ? h(
                        'button',
                        {
                          type: 'button',
                          class: 'btn btn-quiet btn-small',
                          onclick: () => store.discardBox(batch.id, box.id),
                        },
                        'Throw away',
                      )
                    : null,
                ),
          );
        }),
      ),
      h(
        'div',
        { class: 'place' },
        h(
          'div',
          { class: 'place-head' },
          h('span', { class: 'field-label' }, `Put a ${word} in`),
          slotSelect,
        ),
        h(
          'div',
          { class: 'day-chips', role: 'group', 'aria-label': `Days for a ${word}` },
          days.map((d) => {
            const n = placedOn(d);
            return h(
              'button',
              {
                type: 'button',
                class: ['day-chip', n ? 'is-on' : null],
                'data-testid': 'place-day',
                'data-date': d,
                'aria-label': `Put a ${word} in ${store.slotLabel(slot)} on ${fmtDateShort(d)}${n ? `, ${n} there already` : ''}`,
                onclick: () => place(d),
              },
              h('span', { class: 'day-chip-dow' }, d === today ? 'Today' : fmtWeekday(d)),
              h('span', { class: 'day-chip-num' }, String(Number(d.slice(8)))),
              n ? h('span', { class: 'day-chip-mark' }, iconEl('check', 14)) : null,
            );
          }),
        ),
        fill.length && left
          ? h(
              'button',
              {
                type: 'button',
                class: 'btn btn-secondary btn-block',
                'data-testid': 'fill-mon-thu',
                onclick: () => {
                  const n = store.fillDays({ batchId: batch.id, dates: fill, slot });
                  batchNotes.set(
                    batch.id,
                    `Placed ${plural(n, word)} in ${store.slotLabel(slot)}, ${fmtDateShort(fill[0])} to ${fmtDateShort(fill[Math.min(n, fill.length) - 1])}.`,
                  );
                  render();
                },
              },
              iconEl('calendar', 18),
              h(
                'span',
                null,
                `Fill Mon–Thu (${fmtDateShort(fill[0])} – ${fmtDateShort(fill[fill.length - 1])})`,
              ),
            )
          : null,
        noteEl(note, 'info', 'batch-note'),
      ),
      h(
        'footer',
        { class: 'batch-foot' },
        h(
          'button',
          {
            type: 'button',
            class: 'btn btn-secondary',
            'data-testid': 'shopping-open',
            onclick: () => openShopping(batch.recipeId, total, name),
          },
          'Shopping list',
        ),
        h(
          'button',
          {
            type: 'button',
            class: 'btn btn-quiet',
            onclick: () => store.deleteBatch(batch.id),
          },
          'Remove batch',
        ),
      ),
    );
  }

  // ------------------------------------------------------------------ shopping list

  function openShopping(recipeId, startBoxes, name) {
    let boxes = startBoxes;
    const food = store.food(recipeId);
    const word = boxWord(food, rules);
    const body = h('div', { class: 'shop-body', 'data-testid': 'shopping-list' });
    const countOut = h('output', { class: 'boxes-count' });
    const status = h('div', { class: 'shop-status', 'aria-live': 'polite' });

    const text = () => {
      const list = store.shopping(recipeId, boxes);
      if (!list) return null;
      const lines = [`${name}: shopping for ${plural(boxes, word)}`];
      for (const s of list.sections) {
        lines.push('', s.label);
        for (const item of s.items) lines.push(`- ${itemText(item)}`);
      }
      return lines.join('\n');
    };

    function renderList() {
      setText(countOut, String(boxes));
      const list = store.shopping(recipeId, boxes);
      if (!list) {
        mountChildren(
          body,
          h(
            'p',
            { class: 'muted' },
            'No shopping list for this one yet: the Lab has not listed its ingredients.',
          ),
        );
        return;
      }
      mountChildren(
        body,
        list.sections.map((s) =>
          h(
            'section',
            { class: 'shop-section', 'data-section': s.id },
            h('h3', { class: 'group-title' }, s.label),
            h(
              'ul',
              { class: 'shop-items', role: 'list' },
              s.items.map((i) => h('li', null, itemText(i))),
            ),
          ),
        ),
      );
    }

    const step = (dir) =>
      h(
        'button',
        {
          type: 'button',
          class: 'btn-step',
          'aria-label': dir > 0 ? `One more ${word}` : `One ${word} fewer`,
          'data-testid': dir > 0 ? 'shop-more' : 'shop-less',
          onclick: () => {
            boxes = Math.min(40, Math.max(1, boxes + dir));
            status.replaceChildren();
            renderList();
          },
        },
        iconEl(dir > 0 ? 'plus' : 'minus'),
      );

    openDialog({
      title: `Shopping list: ${name}`,
      testid: 'shopping-dialog',
      content: [
        h(
          'div',
          { class: 'field' },
          h('span', { class: 'field-label' }, `For how many ${pluralWord(word)}`),
          h('div', { class: 'stepper' }, step(-1), countOut, step(1)),
        ),
        body,
        status,
      ],
      actions: h(
        'button',
        {
          type: 'button',
          class: 'btn btn-primary',
          'data-testid': 'shopping-copy',
          onclick: async () => {
            const t = text();
            if (!t) return;
            const ok = await copyText(t, status);
            if (ok)
              status.replaceChildren(
                h(
                  'p',
                  { class: 'prep-note prep-note--info' },
                  'Copied. Paste it into your notes or a chat.',
                ),
              );
          },
        },
        iconEl('copy', 18),
        h('span', null, 'Copy list'),
      ),
    });
    renderList();
  }

  // ------------------------------------------------------------------ render

  function recipeRow(recipe) {
    const food = store.food(recipe.id);
    const per = food ? portionNutrients(food, 'box', 1) : null;
    const halal = food ? halalChip(food, rules) : null;
    return h(
      'li',
      { class: 'prep-row', 'data-testid': 'recipe-row', 'data-recipe-id': recipe.id },
      h(
        'button',
        {
          type: 'button',
          class: 'prep-main',
          'aria-haspopup': 'dialog',
          onclick: () => openRecipeEditor({ store, rules, recipe }),
        },
        h('span', { class: 'prep-name' }, recipe.name),
        h(
          'span',
          { class: 'prep-line' },
          per
            ? `${recipe.boxes === 1 ? 'Whole recipe' : `1 of ${recipe.boxes} boxes`}: ${macroLine(per).split(' · ').slice(0, 2).join(' · ')}`
            : 'No usable ingredients',
        ),
      ),
      food
        ? h(
            'button',
            {
              type: 'button',
              class: 'btn btn-secondary btn-small',
              'data-testid': 'recipe-cook',
              onclick: () => openCook(recipe.id),
            },
            'Cook',
          )
        : null,
      halal ? h('div', { class: 'entry-halal' }, halal.chip) : null,
      halal ? halal.reason : null,
    );
  }

  function libraryRow({ food }) {
    const per = portionNutrients(food, defaultServingOf(food).id, 1);
    const halal = halalChip(food, rules);
    return h(
      'li',
      { class: 'prep-row', 'data-testid': 'library-row', 'data-food-id': food.id },
      h(
        'button',
        {
          type: 'button',
          class: 'prep-main',
          'aria-haspopup': 'dialog',
          onclick: () => openCook(food.id),
        },
        h(
          'span',
          { class: 'prep-name' },
          food.name.replace(/\s*\((lunch box|breakfast|dinner)[^)]*\)\s*$/i, ''),
        ),
        h(
          'span',
          { class: 'prep-line' },
          `1 ${boxWord(food, rules)}: ${macroLine(per).split(' · ').slice(0, 2).join(' · ')}`,
        ),
      ),
      h(
        'button',
        {
          type: 'button',
          class: 'btn btn-secondary btn-small',
          'data-testid': 'library-cook',
          'aria-label': `Cook ${food.name}`,
          onclick: () => openCook(food.id),
        },
        'Cook',
      ),
      halal ? h('div', { class: 'entry-halal' }, halal.chip) : null,
      halal ? halal.reason : null,
    );
  }

  function render() {
    const today = store.today();
    // Tonight's freezer moves (A18): one tap each.
    const move = store.prepNotices(today).moveTonight;
    mountChildren(
      notices,
      move.length
        ? h(
            'div',
            { class: 'card prep-tonight', 'data-testid': 'move-tonight' },
            h('h3', { class: 'card-title' }, 'Tonight'),
            move.map((m) =>
              h(
                'div',
                { class: 'tonight-row' },
                h(
                  'p',
                  null,
                  `Take box ${m.number} of ${m.name} out of the freezer for tomorrow${m.slot ? `’s ${store.slotLabel(m.slot).toLowerCase()}` : ''}.`,
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    class: 'btn btn-secondary',
                    onclick: () => store.setBoxStorage(m.batchId, m.boxId, 'fridge'),
                  },
                  'Moved to fridge',
                ),
              ),
            ),
          )
        : null,
    );

    const active = store
      .batches()
      .filter((b) => b.boxes.some((x) => x.status === 'available' || x.status === 'placed'))
      .sort((a, b) => b.cookedOn.localeCompare(a.cookedOn));
    const done = store.batches().length - active.length;
    mountChildren(
      batchesBox,
      h('h3', { class: 'section-title', id: 'prep-batches' }, 'Your batches'),
      active.length
        ? active.map(batchCard)
        : h(
            'p',
            { class: 'empty-note' },
            'No batches yet. Cook one from your recipes or the library below.',
          ),
      done
        ? h('p', { class: 'muted' }, `${done} finished ${done === 1 ? 'batch' : 'batches'} hidden.`)
        : null,
    );

    const chai = store.chai();
    const chaiFood = chai ? store.food(chai.id) : null;
    mountChildren(
      recipesBox,
      h(
        'div',
        { class: 'section-head' },
        h('h3', { class: 'section-title', id: 'prep-recipes' }, 'Your recipes'),
        h(
          'button',
          {
            type: 'button',
            class: 'btn btn-primary',
            'data-testid': 'new-recipe',
            onclick: () => openRecipeEditor({ store, rules }),
          },
          iconEl('plus', 18),
          h('span', null, 'New recipe'),
        ),
      ),
      store.recipes().length
        ? h('ul', { class: 'prep-list', role: 'list' }, store.recipes().map(recipeRow))
        : h(
            'p',
            { class: 'empty-note' },
            'Build a recipe from its ingredients, say how many boxes it makes, and log a box, a katori or grams.',
          ),
      h(
        'div',
        { class: 'card chai-card', 'data-testid': 'chai-card' },
        h(
          'div',
          { class: 'chai-text' },
          h('strong', null, chaiFood ? chaiFood.name : 'My chai'),
          h(
            'span',
            { class: 'muted' },
            chaiFood
              ? `${macroLine(portionNutrients(chaiFood, 'cup', 1))
                  .split(' · ')
                  .slice(0, 2)
                  .join(' · ')} a cup. First in your chai searches.`
              : 'Set milk, sugar and cup size once. It becomes your top chai.',
          ),
        ),
        h(
          'button',
          {
            type: 'button',
            class: 'btn btn-secondary',
            'data-testid': 'chai-open',
            onclick: () => openChaiDialog({ store, rules }),
          },
          chaiFood ? 'Change' : 'Set my chai',
        ),
      ),
    );

    const library = store.library();
    const groups = SLOT_ORDER.map((slot) => ({
      slot,
      items: library.filter((l) => l.slot === slot),
    })).filter((g) => g.items.length);
    mountChildren(
      libraryBox,
      h('h3', { class: 'section-title', id: 'prep-library' }, 'Library'),
      h(
        'p',
        { class: 'muted' },
        'Tested halal recipes from the Nutrition Lab. Tap one to cook a batch.',
      ),
      groups.map((g) =>
        h(
          'details',
          { class: 'library-group', open: true },
          h('summary', { class: 'group-title' }, `${store.slotLabel(g.slot)} (${g.items.length})`),
          h('ul', { class: 'prep-list', role: 'list' }, g.items.map(libraryRow)),
        ),
      ),
    );
  }

  const unsubscribe = store.subscribe(() => render());

  return {
    update() {
      render();
    },
    unmount() {
      unsubscribe();
      toast.destroy();
      for (const d of document.querySelectorAll('dialog')) {
        if (d.open) d.close();
        d.remove();
      }
      container.replaceChildren();
    },
  };
}

function capital(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function itemText(item) {
  const grams =
    item.grams >= 1000
      ? `${Math.round(item.grams / 10) / 100} kg`
      : `${fmtGrams(Math.round(item.grams))} g`;
  if (item.count) {
    const q = Math.round(item.count.qty * 100) / 100;
    return `${item.name}: ${q} × ${item.count.label} (${grams})`;
  }
  return `${item.name}: ${grams}`;
}
