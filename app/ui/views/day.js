// Day view (routes `day` and `add`). Owner: Priya. Contract: docs/ARCHITECTURE.md §7.4.
// Sticky "left today" totals (A7, A12), five slot sections with subtotals and "tick all", entry
// rows (toggle, edit, move to another day, delete with Undo), day navigation, copy yesterday /
// another day (A5 b) and copy a slot (A12). The add sheet opens on the `add` route.
import { h, mountChildren, setText } from '../dom.js';
import { iconEl, katoriMark } from '../components/icons.js';
import { createTotalsBar } from '../components/totals-bar.js';
import { renderSlotSection } from '../components/slot-section.js';
import { createAddSheet, savedMealLine } from '../components/add-sheet.js';
import { openPortionPicker } from '../components/portion-picker.js';
import { openDialog, openActionSheet } from '../components/dialog.js';
import { createUndoToast } from '../components/toast.js';
import { addDays, fmtDateShort, fmtDateLong, relativeDay } from '../components/format.js';
import { useByText, boxWord, frozenDueText, pluralWord } from '../components/prep-bits.js';
import { rowName } from '../components/food-bits.js';
import { renderTipCard, renderRamadanBar, renderFluidsLine } from '../components/day-tips.js';
import { setPrepIntent } from '../components/prep-intent.js';

/**
 * @param {HTMLElement} container
 * @param {{ store: object, router: object, rules: object }} ctx
 * @returns {{ update: (route: object) => void, unmount: () => void }}
 */
export function mount(container, ctx) {
  const { store, router, rules } = ctx;
  let date = store.today();
  let sheet = null;
  let pushedAdd = false; // true when this view opened the add route (Back can close it)

  // ------------------------------------------------------------------ skeleton
  const titleMain = h('span', { class: 'day-title-main' });
  const titleSub = h('span', { class: 'day-title-sub' });
  const title = h('h2', { class: 'day-title', 'data-testid': 'day-title' }, titleMain, titleSub);
  const todayBtn = h(
    'button',
    { type: 'button', class: 'btn btn-quiet btn-today', onclick: () => goDay(store.today()) },
    'Today',
  );
  const nav = h(
    'nav',
    { class: 'day-nav', 'aria-label': 'Choose a day' },
    h(
      'button',
      {
        type: 'button',
        class: 'btn-icon',
        'aria-label': 'Previous day',
        'data-testid': 'day-prev',
        onclick: () => goDay(addDays(date, -1)),
      },
      iconEl('chevronLeft'),
    ),
    title,
    h(
      'button',
      {
        type: 'button',
        class: 'btn-icon',
        'aria-label': 'Next day',
        'data-testid': 'day-next',
        onclick: () => goDay(addDays(date, 1)),
      },
      iconEl('chevronRight'),
    ),
    todayBtn,
  );
  const totals = createTotalsBar({ store, router, rules });
  const slotsBox = h('div', { class: 'slots' });
  const tipBox = h('div', { class: 'day-tips' }); // the Ramadan line and today's protein tip
  const prepBox = h('div', { class: 'day-prep' });
  const copyYesterdayBtn = h(
    'button',
    {
      type: 'button',
      class: 'btn btn-secondary',
      'data-testid': 'copy-yesterday',
      onclick: copyYesterday,
    },
    iconEl('copy', 18),
    h('span', null, 'Copy yesterday'),
  );
  const copyDayBtn = h(
    'button',
    {
      type: 'button',
      class: 'btn btn-secondary',
      'data-testid': 'copy-day',
      'aria-haspopup': 'dialog',
      onclick: copyAnotherDay,
    },
    iconEl('calendar', 18),
    h('span', null, 'Copy a day…'),
  );
  const tools = h(
    'section',
    { class: 'day-tools', 'aria-label': 'Copy food into this day' },
    copyYesterdayBtn,
    copyDayBtn,
  );
  // One friendly card on an empty day (Meeting 004 B8). The copy buttons move into it, so each
  // test id exists once; the five slots go compact under it.
  const emptyTools = h('div', { class: 'empty-day-tools' });
  const emptyCard = h(
    'section',
    { class: 'card empty-day', 'data-testid': 'empty-day', 'aria-labelledby': 'empty-day-title' },
    katoriMark(48),
    h(
      'div',
      { class: 'empty-day-text' },
      h('h3', { class: 'empty-day-title', id: 'empty-day-title' }, 'Nothing logged yet'),
      h('p', { class: 'muted' }, 'Copy a day you ate the same, or search for a food.'),
    ),
    emptyTools,
    h(
      'button',
      {
        type: 'button',
        class: 'btn btn-quiet empty-day-search',
        'data-testid': 'empty-search',
        onclick: () => openAdd(store.defaultSlot(date)),
      },
      iconEl('search', 18),
      h('span', null, 'Search foods'),
    ),
  );
  const fab = h(
    'button',
    {
      type: 'button',
      class: 'fab',
      'data-testid': 'add-food',
      onclick: () => openAdd(store.defaultSlot(date)),
    },
    iconEl('plus', 24),
    h('span', null, 'Add food'),
  );
  const toast = createUndoToast({ store });

  const root = h(
    'div',
    { class: 'view view-day' },
    nav,
    h(
      'div',
      { class: 'day-layout' },
      // The add button sits in a docked bar (phones) or the side column (wide screens), never
      // floating over slot buttons, menus or entry text (Meeting 003 item 7).
      h(
        'div',
        { class: 'day-side' },
        totals.el,
        totals.panel,
        tools,
        h('div', { class: 'fab-bar' }, fab),
      ),
      h('div', { class: 'day-main' }, tipBox, prepBox, emptyCard, slotsBox),
    ),
    toast.el,
  );
  mountChildren(container, root);

  // ------------------------------------------------------------------ navigation

  function goDay(next) {
    router.go({ name: 'day', params: { date: next === store.today() ? null : next } });
  }

  function openAdd(slot) {
    pushedAdd = true;
    router.go({ name: 'add', params: { date, slot } });
  }

  function closeAdd() {
    if (pushedAdd && window.history.length > 1) {
      pushedAdd = false;
      window.history.back();
    } else {
      router.go(
        { name: 'day', params: { date: date === store.today() ? null : date } },
        { replace: true },
      );
    }
  }

  // ------------------------------------------------------------------ actions

  function copyYesterday() {
    const from = addDays(date, -1);
    if (!store.day(from).entries.length) {
      toast.notify(`Nothing to copy: ${fmtDateShort(from)} is empty.`);
      return;
    }
    store.copyDay({ fromDate: from, toDate: date });
  }

  function dateField(initial, label) {
    const input = h('input', { type: 'date', class: 'input', value: initial, required: true });
    return {
      input,
      field: h('label', { class: 'field' }, h('span', { class: 'field-label' }, label), input),
    };
  }

  function recentDayButtons(onPick, exclude) {
    const logged = store
      .loggedDates()
      .filter((d) => d !== exclude)
      .slice(-6)
      .reverse();
    if (!logged.length) return null;
    return h(
      'div',
      { class: 'chip-row' },
      logged.map((d) =>
        h(
          'button',
          { type: 'button', class: 'chip', onclick: () => onPick(d) },
          `${fmtDateShort(d)} · ${store.day(d).entries.length}`,
        ),
      ),
    );
  }

  function copyAnotherDay() {
    const field = dateField(addDays(date, -7), 'Copy from');
    let handle = null;
    const run = (from) => {
      if (!from || from === date) return;
      handle.close('done');
      if (!store.day(from).entries.length) {
        toast.notify(`Nothing to copy: ${fmtDateShort(from)} is empty.`);
        return;
      }
      store.copyDay({ fromDate: from, toDate: date });
    };
    handle = openDialog({
      title: `Copy a day into ${fmtDateShort(date)}`,
      testid: 'copy-day-dialog',
      content: [
        h('p', { class: 'muted' }, 'Days with food:'),
        recentDayButtons(run, date) ?? h('p', { class: 'muted' }, 'No other days logged yet.'),
        field.field,
      ],
      actions: h(
        'button',
        { type: 'button', class: 'btn btn-primary', onclick: () => run(field.input.value) },
        'Copy',
      ),
    });
  }

  function slotMenu(slot) {
    const label = store.slotLabel(slot);
    const yesterday = addDays(date, -1);
    const entries = store.day(date).entries.filter((e) => e.slot === slot);
    const actions = [
      {
        label: `Copy ${label} from yesterday`,
        hint: fmtDateShort(yesterday),
        icon: 'copy',
        testid: 'copy-slot-yesterday',
        onSelect: () => {
          if (!store.day(yesterday).entries.some((e) => e.slot === slot)) {
            toast.notify(`Nothing to copy: ${label} was empty on ${fmtDateShort(yesterday)}.`);
            return;
          }
          store.copySlot({ fromDate: yesterday, fromSlot: slot, toDate: date, toSlot: slot });
        },
      },
      {
        label: `Copy ${label} from another day…`,
        icon: 'calendar',
        testid: 'copy-slot-other',
        onSelect: () => copySlotFrom(slot),
      },
    ];
    // Sprint 2: prep boxes, saved meals (add back in one action), save this meal.
    for (const batch of store.batches()) {
      const left = store.boxesLeft(batch.id);
      if (!left) continue;
      const f = store.food(batch.recipeId);
      actions.push({
        label: `Add a ${boxWord(f, rules)}: ${store.batchName(batch)}`,
        hint: `${left} left · meal prep`,
        icon: 'plus',
        testid: 'slot-add-box',
        onSelect: () => store.placeBox({ batchId: batch.id, date, slot }),
      });
    }
    for (const meal of store.savedMeals().slice(0, 6)) {
      actions.push({
        label: `Add ${meal.name}`,
        hint: `Saved meal · ${savedMealLine(meal, store)}`,
        icon: 'plus',
        testid: 'slot-add-meal',
        onSelect: () => store.addSavedMeal({ mealId: meal.id, date, slot }),
      });
    }
    if (entries.some((e) => e.foodId)) {
      actions.push({
        label: `Save ${label} as a meal…`,
        hint: 'Add it again in one tap',
        icon: 'copy',
        testid: 'save-meal',
        onSelect: () => saveMealDialog(slot),
      });
    }
    if (entries.some((e) => e.status === 'eaten')) {
      actions.push({
        label: 'Mark all as planned',
        icon: 'back',
        onSelect: () => store.setSlotStatus(date, slot, 'planned'),
      });
    }
    openActionSheet({ title: label, actions, testid: 'slot-menu' });
  }

  /** This day's meals, then the everyday ones (a Ramadan day can copy from a normal day). */
  function copyFromSlots() {
    const list = store.slots(date);
    const ids = new Set(list.map((s) => s.id));
    return [...list, ...store.slots().filter((s) => !ids.has(s.id))];
  }

  function copySlotFrom(slot) {
    const field = dateField(addDays(date, -1), 'From day');
    const from = h(
      'select',
      { class: 'select' },
      copyFromSlots().map((s) => h('option', { value: s.id, selected: s.id === slot }, s.label)),
    );
    const handle = openDialog({
      title: `Copy into ${store.slotLabel(slot)}`,
      testid: 'copy-slot-dialog',
      content: [
        field.field,
        h('label', { class: 'field' }, h('span', { class: 'field-label' }, 'From meal'), from),
      ],
      actions: h(
        'button',
        {
          type: 'button',
          class: 'btn btn-primary',
          onclick: () => {
            const fromDate = field.input.value;
            if (!fromDate) return;
            handle.close('done');
            if (!store.day(fromDate).entries.some((e) => e.slot === from.value)) {
              toast.notify('Nothing to copy from that meal.');
              return;
            }
            store.copySlot({ fromDate, fromSlot: from.value, toDate: date, toSlot: slot });
          },
        },
        'Copy',
      ),
    });
  }

  function saveMealDialog(slot) {
    const items = store.day(date).entries.filter((e) => e.slot === slot && e.foodId);
    const suggested = items
      .slice(0, 3)
      .map((e) => store.food(e.foodId)?.name ?? e.snapshot?.name)
      .filter(Boolean)
      .join(' + ');
    const input = h('input', {
      class: 'input',
      type: 'text',
      value: suggested.length > 40 ? store.slotLabel(slot) : suggested,
      'data-testid': 'meal-name',
    });
    const handle = openDialog({
      title: `Save ${store.slotLabel(slot)} as a meal`,
      testid: 'save-meal-dialog',
      content: [
        h('label', { class: 'field' }, h('span', { class: 'field-label' }, 'Name'), input),
        h(
          'p',
          { class: 'muted' },
          `${items.length} ${items.length === 1 ? 'food' : 'foods'}. Add it back from any meal’s menu or the add sheet.`,
        ),
      ],
      actions: h(
        'button',
        {
          type: 'button',
          class: 'btn btn-primary',
          'data-testid': 'meal-save',
          onclick: () => {
            const id = store.saveMeal({ date, slot, name: input.value });
            handle.close('done');
            if (id) toast.notify(`Saved “${input.value.trim() || store.slotLabel(slot)}”.`);
          },
        },
        'Save meal',
      ),
    });
  }

  /** The calm note under a meal-prep box entry (A18). */
  function boxNote(entry) {
    const info = store.boxInfo(entry, date);
    if (!info) return null;
    const f = store.food(info.batch.recipeId);
    const name = `${capitalize(boxWord(f, rules))} ${info.number}`;
    if (entry.status === 'eaten') return { text: name, kind: 'info' };
    // Still frozen on (or after) its day says so (Review 2, A3); before then, the night-before hint.
    const frozenDue = frozenDueText(info.box, date, store.today());
    if (frozenDue) return { text: `${name} · ${frozenDue}`, kind: 'last' };
    if (info.box.storage === 'freezer' && !info.useBy) {
      return {
        text: `${name} · in the freezer: move it to the fridge the night before`,
        kind: 'info',
      };
    }
    const kind = info.status === 'past' ? 'past' : info.status === 'last-day' ? 'last' : 'info';
    const text =
      info.status === 'last-day'
        ? 'last day'
        : useByText(info.box, info.useBy, info.status, store.today())
            .replace(/^U/, 'u')
            .replace(/^P/, 'p');
    return { text: `${name} · ${text}`, kind };
  }

  function entryMenu(entry) {
    const food = entry.foodId ? store.food(entry.foodId) : undefined;
    const name = food?.name ?? entry.snapshot?.name ?? 'Food';
    const prev = addDays(date, -1);
    const next = addDays(date, 1);
    openActionSheet({
      title: name,
      testid: 'entry-menu',
      actions: [
        {
          label: 'Move to the day before',
          hint: fmtDateShort(prev),
          icon: 'chevronLeft',
          testid: 'move-prev',
          onSelect: () => store.moveEntry(date, entry.id, prev),
        },
        {
          label: 'Move to the next day',
          hint: fmtDateShort(next),
          icon: 'chevronRight',
          testid: 'move-next',
          onSelect: () => store.moveEntry(date, entry.id, next),
        },
        {
          label: 'Move to another day…',
          icon: 'calendar',
          testid: 'move-other',
          onSelect: () => moveTo(entry, name),
        },
        ...(store.boxInfo(entry, date)?.box.storage === 'freezer'
          ? [
              {
                label: 'Move this box to the fridge',
                hint: 'It keeps 1 day once thawing',
                icon: 'back',
                testid: 'box-to-fridge',
                onSelect: () =>
                  store.setBoxStorage(entry.boxRef.batchId, entry.boxRef.boxId, 'fridge'),
              },
            ]
          : []),
        { label: 'Change portion', icon: 'more', onSelect: () => editEntry(entry) },
        {
          label: 'Delete',
          icon: 'trash',
          testid: 'delete-entry',
          onSelect: () => store.removeEntry(date, entry.id),
        },
      ],
    });
  }

  function moveTo(entry, name) {
    const field = dateField(addDays(date, -1), 'Move to');
    const handle = openDialog({
      title: `Move ${name}`,
      testid: 'move-dialog',
      content: field.field,
      actions: h(
        'button',
        {
          type: 'button',
          class: 'btn btn-primary',
          onclick: () => {
            const to = field.input.value;
            if (!to || to === date) return;
            handle.close('done');
            store.moveEntry(date, entry.id, to);
          },
        },
        'Move',
      ),
    });
  }

  function editEntry(entry) {
    const food = entry.foodId ? store.food(entry.foodId) : null;
    openPortionPicker({
      store,
      rules,
      food: food ?? null,
      entry,
      servingId: entry.servingId,
      qty: entry.qty,
      slot: entry.slot,
      date,
      mode: 'edit',
      onSave: ({ foodId, servingId, qty, slot }) => {
        if (food && foodId && foodId !== food.id) store.switchVariant(date, entry.id, foodId);
        const patch = { slot };
        if (food) Object.assign(patch, { servingId, qty });
        store.updateEntry(date, entry.id, patch);
      },
      onDelete: () => store.removeEntry(date, entry.id),
    });
  }

  // ------------------------------------------------------------------ render

  function render() {
    const today = store.today();
    const rel = relativeDay(date, today);
    setText(titleMain, rel ?? fmtDateShort(date));
    setText(titleSub, rel ? fmtDateShort(date) : fmtDateLong(date, today.slice(0, 4)));
    title.dataset.date = date;
    todayBtn.hidden = date === today;

    totals.update(date);
    const tonight = renderPrep(today);

    const focusKey = document.activeElement?.dataset?.focusKey ?? null;
    const day = store.day(date);
    const empty = day.entries.length === 0;
    emptyCard.hidden = !empty;
    tools.hidden = empty;
    if (empty && copyYesterdayBtn.parentNode !== emptyTools) {
      emptyTools.append(copyYesterdayBtn, copyDayBtn);
    } else if (!empty && copyYesterdayBtn.parentNode !== tools) {
      tools.append(copyYesterdayBtn, copyDayBtn);
    }
    slotsBox.classList.toggle('slots--compact', empty);
    const bySlot = store.totals(date).all.bySlot;
    const hideKcal = Boolean(store.settings().hideCalories);
    const tip = date === today ? store.proteinTip(date) : null;
    const ramadan = store.dayPreset(date) === 'ramadan' ? store.ramadan(date) : null;
    renderTop(tip, ramadan);
    mountChildren(
      slotsBox,
      store.slots(date).map(({ id, label }) =>
        renderSlotSection({
          slot: id,
          label,
          entries: day.entries.filter((e) => e.slot === id),
          subtotal: bySlot[id] ?? ZERO,
          aside: slotAside(id, tip, ramadan, today),
          store,
          rules,
          hideKcal,
          onAdd: () => openAdd(id),
          onTickAll: () => store.setSlotStatus(date, id, 'eaten'),
          onMenu: () => slotMenu(id),
          onToggle: (entry) =>
            store.setEntryStatus(date, entry.id, entry.status === 'eaten' ? 'planned' : 'eaten'),
          onEdit: (entry) => editEntry(entry),
          onEntryMenu: (entry) => entryMenu(entry),
          noteFor: (entry) => (entry.boxRef ? boxNote(entry) : null),
        }),
      ),
    );
    // Tonight's card sits right above the meal you are in (R3-A, Mariam #3): opening at the
    // current meal keeps it on screen, at 13:30 and at 20:30 alike.
    if (tonight) {
      const at = slotsBox.querySelector(`[data-testid="slot-${store.defaultSlot(date)}"]`);
      if (at) at.before(tonight);
      else prepBox.append(tonight);
    }
    if (focusKey && !document.querySelector('dialog[open]')) {
      container.querySelector(`[data-focus-key="${CSS.escape(focusKey)}"]`)?.focus();
    }
  }

  // ------------------------------------------------------------------ tips and Ramadan (Sprint 3)

  let shownKey = null;

  /** The Ramadan line and health notes, and today's protein tip (not the sehri one: its slot). */
  function renderTop(tip, ramadan) {
    mountChildren(
      tipBox,
      ramadan?.isDay ? renderRamadanBar({ info: ramadan, router }) : null,
      tip && tip.kind !== 'sehri' ? tipCard(tip) : null,
    );
    if (tip && tip.key !== shownKey) {
      shownKey = tip.key;
      // After this render: recording "shown" re-renders the view once (idempotent).
      queueMicrotask(() => store.markTipShown(tip.key));
    }
    if (!tip) shownKey = null;
  }

  function tipCard(tip) {
    return renderTipCard({
      tip,
      rules,
      hideKcal: Boolean(store.settings().hideCalories),
      onIdea: (idea) => openIdea(idea, tip.suggestFor),
      onNotToday: () => store.tipNotToday(),
      onTurnOff: () => {
        store.setTipsOn(false);
        toast.notify('Protein tips are off. You can turn them on again in Profile.');
      },
    });
  }

  /** One tap on an idea: the portion picker for that food, set to the idea's serving. */
  function openIdea(idea, slot) {
    openPortionPicker({
      store,
      rules,
      food: idea.food,
      servingId: idea.servingId,
      qty: idea.qty,
      slot,
      date,
      mode: 'add',
      onAdd: ({ foodId, servingId, qty }) =>
        store.addFood({ date, slot, foodId: foodId ?? idea.food.id, servingId, qty }),
    });
  }

  /** What a slot shows under its heading: the sehri tip, or the fluids line (§12.4, §12.5). */
  function slotAside(slot, tip, ramadan, today) {
    if (tip?.kind === 'sehri' && slot === 'sehri') return tipCard(tip);
    if (
      ramadan?.isDay &&
      date === today &&
      ramadan.fluids &&
      !ramadan.fluidsHidden &&
      ramadan.fluidsSlots.includes(slot)
    ) {
      return renderFluidsLine({
        text: ramadan.fluids,
        slot,
        onHide: () => store.hideFluidsToday(),
      });
    }
    return null;
  }

  /**
   * "Tonight" (A18 step 4, R3-A): frozen boxes for tomorrow (one tap each), the part of tomorrow's
   * box cooked the night before (the bolognese penne), and planned preps with no box made yet
   * (a weekly plan's weekday jobs), with a Make button. Only on today's page. The spare line goes
   * in the top box; the Tonight card is returned for render() to put above the current meal.
   */
  function renderPrep(today) {
    const notes = date === today ? store.prepNotices(today) : null;
    mountChildren(prepBox, date === today ? spareLine(today) : null);
    const move = notes?.moveTonight ?? [];
    const later = notes?.later ?? [];
    const make = notes?.make ?? [];
    const jobs = notes?.jobs ?? [];
    if (!move.length && !later.length && !make.length && !jobs.length) return null;
    const makeIt = (foodId) =>
      h(
        'button',
        {
          type: 'button',
          class: 'btn btn-secondary',
          'data-testid': 'tonight-make-btn',
          onclick: () => {
            setPrepIntent({ cook: foodId });
            router.go({ name: 'prep', params: {} });
          },
        },
        `${verbFor(foodId)} it`,
      );
    const meal = (slot) => (slot ? store.slotLabel(slot).toLowerCase() : 'meal');
    const dish = (foodId, fallback) => {
      const f = store.food(foodId);
      return (f && rowName(f)) ?? fallback;
    };
    return h(
      'div',
      { class: 'day-prep day-prep--tonight' },
      h(
        'section',
        {
          class: 'card prep-tonight',
          'data-testid': 'move-tonight',
          'aria-label': 'Meal prep tonight',
        },
        // One line (Meeting 004 B2): the short sentence shows; the dish name is read out and
        // shown on hover, as the full sentence.
        move.map((m) => {
          const where = m.slot ? `’s ${meal(m.slot)}` : '';
          const full = `Tonight: take box ${m.number} of ${m.name} out of the freezer for tomorrow${where}.`;
          return h(
            'div',
            { class: 'tonight-row' },
            h(
              'p',
              { class: 'tonight-text', title: full },
              h(
                'span',
                { 'aria-hidden': 'true' },
                h('strong', null, 'Tonight:'),
                ` box ${m.number} out of the freezer, for tomorrow${where}`,
              ),
              h('span', { class: 'sr-only' }, full),
            ),
            h(
              'button',
              {
                type: 'button',
                class: 'btn btn-secondary',
                'data-testid': 'move-to-fridge',
                onclick: () => store.setBoxStorage(m.batchId, m.boxId, 'fridge'),
              },
              'Move to fridge',
            ),
          );
        }),
        later.map((l) =>
          h(
            'div',
            { class: 'tonight-row tonight-row--job', 'data-testid': 'tonight-later' },
            h(
              'p',
              { class: 'tonight-job' },
              h('strong', null, 'Tonight:'),
              ` for tomorrow’s ${meal(l.slot)}, ${dish(store.batch(l.batchId)?.recipeId, l.name)}`,
              h(
                'span',
                { class: 'tonight-job-what' },
                l.job ?? 'it has a part you cook the night before: see How to make it in Prep.',
              ),
            ),
          ),
        ),
        jobs.map((j) =>
          h(
            'div',
            { class: 'tonight-row tonight-row--job', 'data-testid': 'tonight-plan-job' },
            h('p', { class: 'tonight-job' }, h('strong', null, 'Tonight:'), ` ${j.text}`),
            j.make ? makeIt(j.recipeId) : null,
          ),
        ),
        make.map((m) => {
          return h(
            'div',
            {
              class: 'tonight-row tonight-row--job',
              'data-testid': 'tonight-make',
              'data-food-id': m.foodId,
              'data-date': m.date,
            },
            h(
              'p',
              { class: 'tonight-job' },
              h('strong', null, m.when === 'today' ? 'Today:' : 'Tonight:'),
              m.when === 'today'
                ? ` ${dish(m.foodId, m.name)} for your ${meal(m.slot)}.`
                : ` make tomorrow’s ${meal(m.slot)}, ${dish(m.foodId, m.name)}.`,
              h('span', { class: 'tonight-job-what' }, 'No box made yet.'),
            ),
            makeIt(m.foodId),
          );
        }),
      ),
    );
  }

  /** 'Make' for a library prep that needs no hob or oven, else 'Cook'. */
  function verbFor(foodId) {
    const lib = store.library().find((x) => x.food.id === foodId)?.recipe;
    return lib && lib.effort && lib.effort !== 'cook' ? 'Make' : 'Cook';
  }

  /**
   * Spare or old boxes (Sprint 3, Lena): one calm line for the most urgent unplanned box, with one
   * action; more go to Prep. Never red.
   */
  function spareLine(today) {
    const spare = store.spareBoxes(today);
    if (!spare.length) return null;
    const s = spare[0];
    const f = store.food(s.recipeId);
    const dish = (f && rowName(f)) ?? s.name;
    const word = boxWord(f, rules);
    const one = `${capitalize(word)} ${s.number} of ${dish}`;
    const text = {
      past: `${one} is past its use-by. Best not to eat it.`,
      'last-day': `${one}: today is its last day.`,
      soon: `${one} is good until tomorrow.`,
      frozen:
        s.count > 1
          ? `${s.count} ${pluralWord(word)} of ${dish} are in the freezer with no day planned.`
          : `${one} is in the freezer with no day planned.`,
    }[s.kind];
    const button = (label, testid, onclick, primary = false) =>
      h(
        'button',
        {
          type: 'button',
          class: ['btn', primary ? 'btn-secondary' : 'btn-quiet'],
          'data-testid': testid,
          onclick,
        },
        label,
      );
    const actions =
      s.kind === 'past'
        ? [button('Discard', 'spare-discard', () => store.discardBox(s.batchId, s.boxId), true)]
        : s.kind === 'frozen'
          ? [
              button('Plan it', 'spare-plan', () => planSpare(s, word, today), true),
              button('Move to fridge', 'spare-to-fridge', () =>
                store.setBoxStorage(s.batchId, s.boxId, 'fridge'),
              ),
            ]
          : [button('Plan it', 'spare-plan', () => planSpare(s, word, today), true)];
    return h(
      'section',
      {
        class: 'card spare-box',
        'data-testid': 'spare-box',
        'data-kind': s.kind,
        'aria-label': 'Meal prep box to use',
      },
      h('p', { class: 'spare-text' }, text),
      h(
        'div',
        { class: 'spare-actions' },
        actions,
        spare.length > 1
          ? h(
              'a',
              {
                class: 'link-btn',
                'data-testid': 'spare-more',
                href: router.href({ name: 'prep', params: {} }),
              },
              `${spare.length - 1} more in Prep`,
            )
          : null,
      ),
    );
  }

  /**
   * "Plan it": a meal today (or tomorrow when the box keeps, or must thaw first). The entry is
   * planned, today included, and the person ticks it as they eat (as with Fill and weekly plans
   * on later days). "Eat it now" would have meant a second button and a guess at the meal.
   */
  function planSpare(s, word, today) {
    const tomorrow = addDays(today, 1);
    const days = s.kind === 'frozen' ? [tomorrow] : s.kind === 'soon' ? [today, tomorrow] : [today];
    const slots = store.slots(days[0]).filter((x) => x.id !== 'snacks');
    openActionSheet({
      title: `Plan ${word} ${s.number}`,
      testid: 'spare-plan-sheet',
      actions: days.flatMap((d) =>
        slots.map((x) => ({
          label: `${d === today ? 'Today' : 'Tomorrow'} · ${x.label}`,
          testid: `spare-plan-${d === today ? 'today' : 'tomorrow'}-${x.id}`,
          // Planned, even for today: the person ticks it when they eat it (the button says "Plan").
          onSelect: () =>
            store.placeBox({ batchId: s.batchId, date: d, slot: x.id, status: 'planned' }),
        })),
      ),
    });
  }

  // ------------------------------------------------------------------ open at the current meal

  // Mariam #2 (Meeting 004): today's page opens with the meal you are in on screen, unless you
  // have scrolled since it opened. Nothing moves when that meal is already in view.
  let scrollPending = true;
  let userScrolled = false;
  const SCROLL_KEYS = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ']);
  const onWheel = () => {
    userScrolled = true;
  };
  const onKey = (event) => {
    if (SCROLL_KEYS.has(event.key)) userScrolled = true;
  };
  window.addEventListener('wheel', onWheel, { passive: true });
  window.addEventListener('touchmove', onWheel, { passive: true });
  window.addEventListener('keydown', onKey);

  function scrollToCurrentMeal() {
    if (!scrollPending) return;
    scrollPending = false;
    if (date !== store.today()) return;
    requestAnimationFrame(() => {
      if (userScrolled || !root.isConnected || sheet) return;
      const section = slotsBox.querySelector(`[data-testid="slot-${store.defaultSlot(date)}"]`);
      if (!section) return;
      // What covers the page: the sticky totals (phones) or the sticky tab bar (wide), and the
      // docked add bar plus the tab bar at the bottom (phones).
      const phone = getComputedStyle(totals.el).position === 'sticky';
      const top = phone
        ? totals.el.getBoundingClientRect().height
        : (document.querySelector('.shell-nav')?.getBoundingClientRect().height ?? 0);
      const fabBar = root.querySelector('.fab-bar');
      const bottom =
        fabBar && getComputedStyle(fabBar).position === 'fixed'
          ? fabBar.getBoundingClientRect().top
          : window.innerHeight;
      const r = section.getBoundingClientRect();
      const need = Math.min(r.bottom, r.top + 150); // the heading and the first food
      // Tonight's card sits just above this meal (R3-A): it comes into view with it.
      const card = slotsBox.querySelector('.day-prep--tonight');
      const from =
        card && card.nextElementSibling === section ? card.getBoundingClientRect().top : r.top;
      if (from >= top && need <= bottom) return;
      window.scrollTo({ top: Math.max(0, window.scrollY + from - top - 8), behavior: 'instant' });
    });
  }

  // ------------------------------------------------------------------ "Added" in the add sheet

  // Meeting 004 B6 and Nasreen #4: every add from the sheet ticks its row and says "Added", and the
  // sheet's status line lights up (it already names the food for screen readers). The marks are
  // aria-hidden and timed; under prefers-reduced-motion they appear without animation.
  let known = { date: null, ids: new Set() };
  function noticeAdds() {
    const ids = new Set(store.day(date).entries.map((e) => e.id));
    const fresh =
      known.date === date ? store.day(date).entries.filter((e) => !known.ids.has(e.id)) : [];
    known = { date, ids };
    if (!sheet || !fresh.length) return;
    // After the sheet's own re-render of its rows (the prep rows redraw on add).
    setTimeout(() => markAdded(fresh), 0);
  }

  function flash(node, cls, ms) {
    node.classList.remove(cls);
    void node.offsetWidth; // restart the animation on a second add
    node.classList.add(cls);
    const token = String(Date.now() + Math.random());
    node.dataset.flash = token;
    setTimeout(() => {
      if (node.dataset.flash === token) node.classList.remove(cls);
    }, ms);
  }

  function markAdded(entries) {
    const sheetEl = document.querySelector('[data-testid="add-sheet"]');
    if (!sheetEl) return;
    for (const entry of entries) {
      const selector = entry.boxRef?.batchId
        ? `.food-row[data-id="${CSS.escape(entry.boxRef.batchId)}"]`
        : entry.foodId
          ? `[data-testid="food-row"][data-food-id="${CSS.escape(entry.foodId)}"]`
          : null;
      if (!selector) continue;
      for (const row of sheetEl.querySelectorAll(selector)) {
        const main = row.querySelector('.food-main');
        if (main && !main.querySelector('.added-flag')) {
          main.append(
            h('span', { class: 'added-flag', 'aria-hidden': 'true' }, iconEl('check', 16), 'Added'),
          );
        }
        flash(row, 'is-just-added', 1800);
      }
    }
    const status = sheetEl.querySelector('.sheet-status');
    if (status) flash(status, 'is-fresh', 1800);
  }

  const unsubscribe = store.subscribe(() => {
    render();
    noticeAdds();
  });

  return {
    update(route) {
      date = route.params?.date ?? store.today();
      render();
      noticeAdds();
      if (route.name === 'day') scrollToCurrentMeal();
      if (route.name === 'add') {
        const slot = route.params.slot;
        if (sheet) {
          sheet.update({ date, slot });
        } else {
          sheet = createAddSheet({
            store,
            rules,
            date,
            slot,
            onRequestClose: closeAdd,
            onSlotChange: (next) =>
              router.go({ name: 'add', params: { date, slot: next } }, { replace: true }),
          });
          sheet.open();
        }
      } else if (sheet) {
        sheet.destroy();
        sheet = null;
        pushedAdd = false;
      }
    },
    unmount() {
      unsubscribe();
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchmove', onWheel);
      window.removeEventListener('keydown', onKey);
      sheet?.destroy();
      sheet = null;
      toast.destroy();
      for (const d of document.querySelectorAll('dialog')) {
        if (d.open) d.close();
        d.remove();
      }
      container.replaceChildren();
    },
  };
}

const ZERO = Object.freeze({ kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
