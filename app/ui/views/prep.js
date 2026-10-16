// Meal prep (route `prep`). Owner: Lena. Sprint 2: ARCHITECTURE §13, CUSTOMER A16–A18.
// - Batches: boxes left and halal status always visible; each box's fridge/freezer (one tap to
//   move), use-by in calm words; one tap per day to place a box in any meal, "Fill Mon–Thu";
//   a shopping list copied as text.
// - Your recipes (whole-pot builder), "Set my chai once", and the Lab's library for every meal.
import { h, mountChildren, setText } from '../dom.js';
import { iconEl } from '../components/icons.js';
import { openDialog } from '../components/dialog.js';
import { createUndoToast } from '../components/toast.js';
import { halalChip, serveChip } from '../components/food-bits.js';
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
  servingOf,
} from '../components/format.js';
import {
  macroLine,
  boxWord,
  plural,
  pluralWord,
  dayText,
  useByText,
  frozenDueText,
  noteEl,
  copyText,
  shortPrepName,
  halalBadge,
  effortOf,
  effortText,
  matchesEffort,
  cuisineChips,
  cuisineLabel,
  matchesCuisine,
  halalSwapOf,
} from '../components/prep-bits.js';
import { amountText } from '../components/ingredient-sheet.js';
import { savedMealLine } from '../components/add-sheet.js';
import {
  methodOf,
  renderMethod,
  openMethodDialog,
  openStepMode,
  recipeAbout,
} from '../components/recipe-method.js';
import { plansSection, readySection } from '../components/prep-plans.js';

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
  const mealsBox = h('section', { class: 'prep-section', 'aria-labelledby': 'prep-meals' });
  // Weekly plans and ready picks (STATUS O7): components/prep-plans.js.
  const plansBox = h('section', { class: 'prep-section', 'aria-labelledby': 'prep-plans' });
  const readyBox = h('section', { class: 'prep-section', 'aria-labelledby': 'prep-ready' });
  /** The result line under each plan card after "Use this week". */
  const planNotes = new Map();
  /** Inline notes per batch (A17: "no boxes left" shows in place, not as a pop-up). */
  const batchNotes = new Map();
  /** The meal each batch card places into. */
  const batchSlot = new Map();
  /** Library filter: 'all' | 'cook' | 'no-cook'. */
  let libFilter = 'all';
  /** Library cuisine: 'all' or a recipe `cuisine` id (Sprint 3 variety brief). */
  let libCuisine = 'all';

  const root = h(
    'div',
    { class: 'view view-prep', 'data-testid': 'prep-view' },
    h('h2', { class: 'view-title' }, 'Meal prep'),
    h(
      'p',
      { class: 'muted prep-lead' },
      'A batch is food you cook once and split into boxes (or jars): each box is one meal, for any day. “Cook” needs the hob or oven; “Make” needs no cooking.',
    ),
    notices,
    batchesBox,
    plansBox,
    recipesBox,
    mealsBox,
    readyBox,
    libraryBox,
    toast.el,
  );
  mountChildren(container, root);

  // ------------------------------------------------------------------ how to make it (s3-method)

  /** The person's recipe or the library recipe behind a food id (null when there is none). */
  function recipeOf(recipeId) {
    return (
      store.recipe(recipeId) ?? store.library().find((l) => l.food.id === recipeId)?.recipe ?? null
    );
  }

  /** "What you need" lines for one standard batch. */
  function ingredientLines(recipeId) {
    const own = store.recipe(recipeId);
    if (own) {
      return store.recipeTotals(own).lines.map((line) => {
        const f = store.food(line.foodId);
        const serving = f ? servingOf(f, line.servingId) : null;
        return `${f?.name ?? line.foodId} · ${serving ? amountText(serving, line.qty) : `${fmtGrams(line.grams)}\u00a0g`}`;
      });
    }
    return (recipeOf(recipeId)?.ingredients ?? []).map(
      (ing) =>
        `${ing.name ?? store.food(ing.foodId)?.name ?? ing.foodId} · ${fmtGrams(ing.grams)}\u00a0g`,
    );
  }

  /** "Amounts are for 4 boxes." (the steps' amounts are for the standard batch). */
  function amountsNote(recipeId) {
    const food = store.food(recipeId);
    const r = recipeOf(recipeId);
    if (!food || !r || store.recipe(recipeId)?.potKatori) return null;
    return `Amounts are for ${plural(r.boxes ?? 1, boxWord(food, rules))}.`;
  }

  function showMethod(recipeId, { cook = false } = {}) {
    const food = store.food(recipeId);
    const method = methodOf(recipeOf(recipeId));
    if (!food || !method) return;
    const verb =
      !store.recipe(recipeId) && effortOf(recipeOf(recipeId)) !== 'cook' ? 'Make' : 'Cook';
    openMethodDialog({
      title: displayName(food),
      method,
      ingredients: ingredientLines(recipeId),
      note: amountsNote(recipeId),
      action: cook ? { label: `${verb} a batch`, onSelect: () => openCook(recipeId) } : null,
      about: store.recipe(recipeId) ? null : recipeAbout(recipeOf(recipeId)),
    });
  }

  /** The small "How to make it" button on a row or card; null when the recipe has no method. */
  function methodLink(recipeId, testid, label = 'How to make it') {
    const r = recipeOf(recipeId);
    if (!methodOf(r)) return null;
    return h(
      'button',
      {
        type: 'button',
        class: 'link-btn method-link',
        'data-testid': testid,
        onclick: () => showMethod(recipeId, { cook: testid === 'library-method' }),
      },
      typeof r.method === 'string' ? 'My method' : label,
    );
  }

  // ------------------------------------------------------------------ cook a batch

  function openCook(recipeId) {
    const food = store.food(recipeId);
    if (!food) return;
    const word = boxWord(food, rules);
    const userRecipe = store.recipe(recipeId);
    const lib = store.library().find((l) => l.food.id === recipeId);
    let boxes = userRecipe?.boxes ?? lib?.recipe?.boxes ?? 4;
    const makeVerb = !userRecipe && effortOf(lib?.recipe) !== 'cook' ? 'Make' : 'Cook';
    let plan = store.planFor(recipeId, boxes);
    let storage = [...plan.storage];
    const per = portionNutrients(food, defaultServingOf(food).id, 1);
    const halal = halalBadge(food, rules);
    const countOut = h('output', { class: 'boxes-count', 'data-testid': 'cook-boxes' });
    const boxesList = h('ul', { class: 'cook-boxes', role: 'list' });
    const keepNote = h('p', { class: 'field-help' });
    // "Cooked on" as three chips in the app's own date words (Priya's note 5: the native date
    // input showed US order). A batch is cooked yesterday, today or (planned) tomorrow.
    let cookedOn = store.today();
    const dateChips = h('div', { class: 'chip-pick', role: 'group', 'aria-label': 'Cooked on' });
    function renderDates() {
      const t = store.today();
      mountChildren(
        dateChips,
        [-1, 0, 1].map((n) => {
          const d = addDays(t, n);
          return h(
            'button',
            {
              type: 'button',
              class: ['pick-chip', d === cookedOn ? 'is-on' : null],
              'aria-pressed': String(d === cookedOn),
              'data-testid': 'cook-date',
              'data-date': d,
              onclick: () => {
                cookedOn = d;
                renderDates();
              },
            },
            capital(dayText(d, t)),
          );
        }),
      );
    }
    const cookBtn = h('button', {
      type: 'button',
      class: 'btn btn-primary',
      'data-testid': 'cook-save',
      onclick: () => {
        const batchId = store.cookBatch({
          recipeId,
          boxes,
          cookedOn,
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
      setText(cookBtn, `${makeVerb} ${plural(boxes, word)}`);
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
      title: `${makeVerb} a batch: ${food.name}`,
      testid: 'cook-dialog',
      content: [
        h(
          'p',
          { class: 'cook-per', 'data-testid': 'cook-per-box' },
          h('strong', null, `1 ${word}: `),
          macroLine(per),
        ),
        h('p', { class: 'muted' }, `${fmtGrams(per.grams)} g per ${word}`),
        h('div', { class: 'cook-halal' }, halal.chip, halal.reason),
        h(
          'div',
          { class: 'recipe-row' },
          h(
            'div',
            { class: 'field' },
            h('span', { class: 'field-label' }, `How many ${pluralWord(word)}`),
            h('div', { class: 'stepper' }, step(-1), countOut, step(1)),
          ),
        ),
        h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Cooked'), dateChips),
        h('h3', { class: 'group-title' }, 'Fridge or freezer'),
        keepNote,
        boxesList,
        cookMethod(recipeId),
      ],
      actions: cookBtn,
    });
    renderDates();
    renderBoxes();
  }

  /** "How to make it" folded inside the Cook / Make dialog (open it while cooking). */
  function cookMethod(recipeId) {
    const method = methodOf(recipeOf(recipeId));
    if (!method) return null;
    const food = store.food(recipeId);
    return h(
      'details',
      { class: 'cook-method', 'data-testid': 'cook-method' },
      h(
        'summary',
        { class: 'cook-method-summary' },
        method.kind === 'text' ? 'My method' : 'How to make it',
      ),
      renderMethod(method, {
        heading: false,
        note: amountsNote(recipeId),
        onSteps: () => openStepMode({ title: displayName(food), method }),
      }),
    );
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
    const counts = store.boxCounts(batch.id);
    const total = batch.boxes.filter((b) => b.status !== 'discarded').length;
    const rows = store.boxRows(batch.id);
    const plan = store.planFor(batch.recipeId, Math.max(1, batch.boxes.length));
    const slot =
      batchSlot.get(batch.id) ?? food?.slots?.find((s) => SLOT_ORDER.includes(s)) ?? 'lunch';
    const per = food ? portionNutrients(food, defaultServingOf(food).id, 1) : null;
    const halal = halalBadge(food, rules);
    const note = batchNotes.get(batch.id);

    // Meal chips instead of a drop-down (Priya's note 6): every meal one tap away.
    const slotChips = h(
      'div',
      { class: 'chip-pick', role: 'group', 'aria-label': 'Meal', 'data-testid': 'place-slot' },
      store.slots().map((s) =>
        h(
          'button',
          {
            type: 'button',
            class: ['pick-chip', s.id === slot ? 'is-on' : null],
            'aria-pressed': String(s.id === slot),
            'data-slot': s.id,
            onclick: () => {
              batchSlot.set(batch.id, s.id);
              render();
            },
          },
          s.label,
        ),
      ),
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
        // "3 to eat · 1 eaten" (Review 2): placed boxes are still to eat, not gone.
        h(
          'p',
          {
            class: 'batch-left',
            'data-testid': 'boxes-left',
            'data-to-eat': String(counts.toEat),
            'data-eaten': String(counts.eaten),
            'data-unplaced': String(counts.available),
          },
          h('strong', null, String(counts.toEat)),
          ' to eat',
          counts.eaten ? ` · ${counts.eaten} eaten` : null,
        ),
      ),
      h(
        'div',
        { class: 'batch-meta' },
        halal.chip,
        per
          ? h(
              'span',
              { class: 'muted' },
              `1 ${word}: ${macroLine(per).split(' · ').slice(0, 2).join(' · ')}`,
            )
          : null,
      ),
      halal.reason,
      methodLink(batch.recipeId, 'batch-method'),
      h(
        'ul',
        { class: 'box-list', role: 'list' },
        rows.map(({ box, number, useBy, today: status }) => {
          const placed = box.placed
            ? `${store.slotLabel(store.day(box.placed.date).entries.find((e) => e.id === box.placed.entryId)?.slot ?? slot)}, ${boxDay(box.placed.date, today)}`
            : null;
          const what =
            box.status === 'eaten'
              ? 'Eaten'
              : box.status === 'discarded'
                ? 'Thrown away'
                : (placed ?? 'Not placed yet');
          const frozenDue =
            box.status === 'placed' ? frozenDueText(box, box.placed.date, today) : null;
          const kind =
            status === 'past' ? 'past' : status === 'last-day' || frozenDue ? 'last' : 'info';
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
              h(
                'span',
                { class: 'box-line' },
                h('strong', { class: 'box-name' }, `${capital(word)} ${number}`),
                h('span', { class: 'box-what' }, ` · ${what}`),
              ),
              done
                ? null
                : noteEl(frozenDue ?? useByText(box, useBy, status, today), kind, 'box-useby'),
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
          slotChips,
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
                class: ['day-chip', n ? 'is-on' : null, d === today ? 'is-today' : null],
                'data-testid': 'place-day',
                'data-date': d,
                'aria-label': `Put a ${word} in ${store.slotLabel(slot)} ${d === today ? 'today' : `on ${fmtDateShort(d)}`}${n ? `, ${n} there already` : ''}`,
                onclick: () => place(d),
              },
              h('span', { class: 'day-chip-dow' }, fmtWeekday(d)),
              h('span', { class: 'day-chip-num' }, String(Number(d.slice(8)))),
              n ? h('span', { class: 'day-chip-mark' }, iconEl('check', 12)) : null,
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
                    `Placed ${plural(n, word)} in ${store.slotLabel(slot)}, ${dateRange(fill[0], fill[Math.min(n, fill.length) - 1])}.`,
                  );
                  render();
                },
              },
              iconEl('calendar', 18),
              h('span', null, `Fill Mon–Thu · ${dateRange(fill[0], fill[fill.length - 1])}`),
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
      return list ? listText(`${name}: shopping for ${plural(boxes, word)}`, list) : null;
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
      mountChildren(body, shopSections(list));
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

  /** One list for this week's batches, merged by food (Review 2, Mariam #1, Bilal #4). */
  function openWeekShopping() {
    const { batches, list } = store.weekShopping();
    const status = h('div', { class: 'shop-status', 'aria-live': 'polite' });
    const listed = batches.filter((b) => b.listed);
    const missing = batches.filter((b) => !b.listed);
    const what = (b) =>
      `${shortPrepName(b.name)} (${plural(b.boxes, boxWord(store.food(batchRecipe(b.id)), rules))})`;
    const title = `Shopping for this week: ${plural(listed.length, 'batch')}`;
    openDialog({
      title: 'Shopping for the week',
      testid: 'week-shopping-dialog',
      content: [
        h(
          'p',
          { class: 'muted' },
          listed.length
            ? `For ${listed.map(what).join(', ')}. Each food once, in packs where we know the pack size.`
            : 'None of this week’s batches has an ingredient list yet.',
        ),
        missing.length
          ? h(
              'p',
              { class: 'muted' },
              `No ingredient list yet for ${missing.map((b) => shortPrepName(b.name)).join(', ')}.`,
            )
          : null,
        h(
          'div',
          { class: 'shop-body', 'data-testid': 'week-shopping-list' },
          list ? shopSections(list) : null,
        ),
        status,
      ],
      actions: list
        ? h(
            'button',
            {
              type: 'button',
              class: 'btn btn-primary',
              'data-testid': 'week-shopping-copy',
              onclick: async () => {
                const ok = await copyText(listText(title, list), status);
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
          )
        : null,
    });
  }

  function batchRecipe(batchId) {
    return store.batch(batchId)?.recipeId;
  }

  // ------------------------------------------------------------------ render

  function recipeRow(recipe) {
    const food = store.food(recipe.id);
    const pot = Number.isFinite(recipe.potKatori) && recipe.potKatori > 0;
    const per = food ? portionNutrients(food, pot ? 'katori' : 'box', 1) : null;
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
            ? `${pot ? `1 katori (pot of ${recipe.potKatori})` : recipe.boxes === 1 ? 'Whole recipe' : `1 of ${recipe.boxes} boxes`}: ${macroLine(per).split(' · ').slice(0, 2).join(' · ')}`
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
      food ? methodLink(recipe.id, 'recipe-method') : null,
      halal ? halal.reason : null,
    );
  }

  function libraryRow({ food, recipe }) {
    const per = portionNutrients(food, defaultServingOf(food).id, 1);
    const halal = halalChip(food, rules);
    const time = effortText(recipe);
    const serve = serveChip(food, recipe); // STATUS O3: "Good cold" / "Microwave" / "Hot or cold"
    const verb = effortOf(recipe) === 'cook' ? 'Cook' : 'Make';
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
        h('span', { class: 'prep-name' }, displayName(food)),
        h(
          'span',
          { class: 'prep-line' },
          `1 ${boxWord(food, rules)}: ${macroLine(per).split(' · ').slice(0, 2).join(' · ')}`,
        ),
        time || serve
          ? h(
              'span',
              { class: 'prep-meta' },
              time ? h('span', { class: 'prep-time', 'data-testid': 'prep-time' }, time) : null,
              serve,
            )
          : null,
      ),
      h(
        'button',
        {
          type: 'button',
          class: 'btn btn-secondary btn-small',
          'data-testid': 'library-cook',
          'aria-label': `${verb} ${food.name}`,
          onclick: () => openCook(food.id),
        },
        verb,
      ),
      halal ? h('div', { class: 'entry-halal' }, halal.chip) : null,
      methodLink(food.id, 'library-method'),
      swapLink(food, recipe),
      halal ? halal.reason : null,
    );
  }

  /** "Halal swap" (STATUS O6): opens the halal alternative's Cook / Make dialog. */
  function swapLink(food, recipe) {
    const altId = halalSwapOf(food, recipe, (id) => store.food(id));
    if (!altId) return null;
    const alt = store.food(altId);
    return h(
      'button',
      {
        type: 'button',
        class: 'link-btn method-link halal-swap',
        'data-testid': 'halal-swap',
        'data-swap-to': altId,
        'aria-haspopup': 'dialog',
        onclick: () => openCook(altId),
      },
      `Halal swap: ${alt.shortName ?? displayName(alt)}`,
    );
  }

  function render() {
    const today = store.today();
    renderPlans();
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
                  'Move to fridge',
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
    const week = store.weekShopping();
    mountChildren(
      batchesBox,
      h(
        'div',
        { class: 'section-head' },
        h('h3', { class: 'section-title', id: 'prep-batches' }, 'Your batches'),
        week.batches.length
          ? h(
              'button',
              {
                type: 'button',
                class: 'btn btn-secondary',
                'data-testid': 'week-shopping-open',
                onclick: () => openWeekShopping(),
              },
              iconEl('copy', 18),
              h('span', null, 'Week’s shopping'),
            )
          : null,
      ),
      active.length
        ? active.map(batchCard)
        : h(
            'p',
            { class: 'empty-note' },
            // Nasreen Review 2: nobody said what a batch is.
            'No batches yet. A batch is food you cook once and split into boxes: each box is one meal for one person. Cook one from the library below.',
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
              ? `One cup: ${macroLine(portionNutrients(chaiFood, 'cup', 1))
                  .split(' · ')
                  .slice(0, 2)
                  .join(' · ')}. It comes first when you search “chai”.`
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

    // Saved meals (A5 c): made from a meal's menu on the Day view; added back in one tap there or
    // in the add sheet. Here they can be checked and deleted (with Undo).
    const meals = store.savedMeals();
    mountChildren(
      mealsBox,
      h('h3', { class: 'section-title', id: 'prep-meals' }, 'Saved meals'),
      meals.length
        ? h(
            'ul',
            { class: 'prep-list', role: 'list' },
            meals.map((meal) =>
              h(
                'li',
                { class: 'prep-row', 'data-testid': 'saved-meal' },
                h(
                  'div',
                  { class: 'prep-main prep-main--static' },
                  h('span', { class: 'prep-name' }, meal.name),
                  h(
                    'span',
                    { class: 'prep-line' },
                    meal.items
                      .map((i) => store.food(i.foodId)?.name)
                      .filter(Boolean)
                      .join(' + '),
                  ),
                  h(
                    'span',
                    { class: 'prep-line', 'data-testid': 'saved-meal-totals' },
                    savedMealLine(meal, store),
                  ),
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    class: 'btn btn-quiet btn-small',
                    'aria-label': `Delete ${meal.name}`,
                    onclick: () => store.deleteSavedMeal(meal.id),
                  },
                  'Delete',
                ),
              ),
            ),
          )
        : h(
            'p',
            { class: 'empty-note' },
            'On the Day view, open a meal’s ⋯ menu to save it as a meal. Then add it again in one tap.',
          ),
    );

    const byEffort = store.library().filter((l) => matchesEffort(l.recipe, libFilter));
    // Chips for the cuisines in the whole library, so a chip never vanishes when Cook/No-cook
    // changes; a chosen cuisine that is no longer in the library falls back to All.
    const cuisines = cuisineChips(store.library());
    if (libCuisine !== 'all' && !cuisines.some((c) => c.id === libCuisine)) libCuisine = 'all';
    const library = byEffort.filter((l) => matchesCuisine(l.recipe, libCuisine));
    const filters = [
      ['all', 'All'],
      ['cook', 'Cook'],
      ['no-cook', 'No-cook (≤15 min)'],
    ];
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
        'Tested halal recipes from the Nutrition Lab. Tap one to make a batch.',
      ),
      h(
        'div',
        {
          class: 'chip-pick library-filter',
          role: 'group',
          'aria-label': 'How much cooking',
          'data-testid': 'library-filter',
        },
        filters.map(([id, label]) =>
          h(
            'button',
            {
              type: 'button',
              class: ['pick-chip', libFilter === id ? 'is-on' : null],
              'aria-pressed': String(libFilter === id),
              'data-filter': id,
              onclick: () => {
                libFilter = id;
                render();
              },
            },
            label,
          ),
        ),
      ),
      cuisines.length > 1
        ? h(
            'div',
            {
              class: 'chip-pick library-cuisine',
              role: 'group',
              'aria-label': 'Cuisine',
              'data-testid': 'library-cuisine',
            },
            [{ id: 'all', label: 'All cuisines' }, ...cuisines].map((c) =>
              h(
                'button',
                {
                  type: 'button',
                  class: ['pick-chip', libCuisine === c.id ? 'is-on' : null],
                  'aria-pressed': String(libCuisine === c.id),
                  'data-cuisine': c.id,
                  onclick: () => {
                    libCuisine = c.id;
                    render();
                  },
                },
                c.label,
              ),
            ),
          )
        : null,
      groups.length
        ? null
        : h(
            'p',
            { class: 'empty-note', 'data-testid': 'library-empty' },
            libCuisine !== 'all'
              ? `No ${libFilter === 'no-cook' ? 'no-cook ' : libFilter === 'cook' ? 'cooked ' : ''}${cuisineLabel(libCuisine)} preps yet. Try All.`
              : libFilter === 'no-cook'
                ? 'No no-cook preps yet. The Nutrition Lab is adding salad boxes, bowls, parfaits and wraps.'
                : 'Nothing here yet.',
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

  /** Weekly plans and ready picks (O7); a missing Lab file leaves both sections empty and hidden. */
  function renderPlans() {
    mountChildren(plansBox, plansSection({ store, notes: planNotes, onChange: render }));
    plansBox.hidden = !plansBox.childElementCount;
    mountChildren(readyBox, readySection({ store }));
    readyBox.hidden = !readyBox.childElementCount;
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

/** A library food's name without its "(lunch box …)" tail. */
function displayName(food) {
  return food.name.replace(/\s*\((lunch box|breakfast|dinner)[^)]*\)\s*$/i, '');
}

function capital(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function gramsText(g) {
  return g >= 1000 ? `${Math.round(g / 10) / 100} kg` : `${fmtGrams(Math.round(g))} g`;
}

/**
 * One shopping line (Review 2): packs ("Eggs: 1 × 12 eggs (uses 7 large eggs, 350 g)"), else a
 * count ("Onion: 3 medium onions (330 g)"), else grams. The grams always come last.
 */
export function itemText(item) {
  const g = gramsText(item.grams);
  const buy = item.buy;
  if (buy?.kind === 'pack') {
    const uses = buy.uses ? `${buy.uses.qty} ${buy.uses.label}, ` : '';
    // "12 eggs" and "6 × 125 g pots" read as packs; "400 g jar" reads as itself.
    const packs =
      /^\d/.test(buy.label) && !/^[\d.,]+\s*(g|kg|ml|l)\b/.test(buy.label)
        ? `${buy.packs} ${buy.packs === 1 ? 'pack' : 'packs'} of ${buy.label}`
        : `${buy.packs} × ${buy.label}`;
    return `${item.name}: ${packs} (uses ${uses}${g})`;
  }
  if (buy?.kind === 'count') return `${item.name}: ${buy.qty} ${buy.label} (${g})`;
  return `${item.name}: ${g}`;
}

/** The list as plain text for notes or a chat: a title, then each section and its lines. */
export function listText(title, list) {
  const lines = [title];
  for (const s of list.sections) {
    lines.push('', s.label);
    for (const item of s.items) lines.push(`- ${itemText(item)}${item.note ? ` · ${item.note}` : ''}`);
  }
  return lines.join('\n');
}

/** Where to buy (STATUS O5), from the Lab's ingredient `note`. */
function shopNote(item) {
  return item.note ? h('span', { class: 'shop-note', 'data-testid': 'shop-note' }, item.note) : null;
}

function shopSections(list) {
  return list.sections.map((s) =>
    h(
      'section',
      { class: 'shop-section', 'data-section': s.id },
      h('h3', { class: 'group-title' }, s.label),
      h(
        'ul',
        { class: 'shop-items', role: 'list' },
        s.items.map((i) => h('li', null, itemText(i), shopNote(i))),
      ),
    ),
  );
}

/** "2–5 Nov", or "30 Nov – 3 Dec" across months (short, so the Fill label fits at 360 px). */
function dateRange(from, to) {
  const dm = (iso) => fmtDateShort(iso).replace(/^\D+,?\s*/, '');
  const [a, b] = [dm(from), dm(to)];
  if (from === to) return a;
  return from.slice(0, 7) === to.slice(0, 7) ? `${a.split(' ')[0]}–${b}` : `${a} – ${b}`;
}

/** Box rows stay two lines at 360 px: "today", "tomorrow", else "Tue 3". */
function boxDay(iso, today) {
  const rel = dayText(iso, today);
  return /^[a-z]/.test(rel) ? rel : `${fmtWeekday(iso)} ${Number(iso.slice(8))}`;
}
