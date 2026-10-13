// Day view (routes `day` and `add`). Owner: Priya. Contract: docs/ARCHITECTURE.md §7.4.
// Sticky "left today" totals (A7, A12), five slot sections with subtotals and "tick all", entry
// rows (toggle, edit, move to another day, delete with Undo), day navigation, copy yesterday /
// another day (A5 b) and copy a slot (A12). The add sheet opens on the `add` route.
import { h, mountChildren, setText } from '../dom.js';
import { iconEl } from '../components/icons.js';
import { createTotalsBar } from '../components/totals-bar.js';
import { renderSlotSection } from '../components/slot-section.js';
import { createAddSheet } from '../components/add-sheet.js';
import { openPortionPicker } from '../components/portion-picker.js';
import { openDialog, openActionSheet } from '../components/dialog.js';
import { createUndoToast } from '../components/toast.js';
import { addDays, fmtDateShort, fmtDateLong, relativeDay } from '../components/format.js';

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
  const tools = h(
    'section',
    { class: 'day-tools', 'aria-label': 'Copy food into this day' },
    h(
      'button',
      {
        type: 'button',
        class: 'btn btn-secondary',
        'data-testid': 'copy-yesterday',
        onclick: copyYesterday,
      },
      iconEl('copy', 18),
      h('span', null, 'Copy yesterday'),
    ),
    h(
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
    ),
  );
  const fab = h(
    'button',
    {
      type: 'button',
      class: 'fab',
      'data-testid': 'add-food',
      onclick: () => openAdd(store.defaultSlot()),
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
      h('div', { class: 'day-side' }, totals.el, totals.panel, tools),
      slotsBox,
    ),
    fab,
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
    if (entries.some((e) => e.status === 'eaten')) {
      actions.push({
        label: 'Mark all as planned',
        icon: 'back',
        onSelect: () => store.setSlotStatus(date, slot, 'planned'),
      });
    }
    openActionSheet({ title: label, actions, testid: 'slot-menu' });
  }

  function copySlotFrom(slot) {
    const field = dateField(addDays(date, -1), 'From day');
    const from = h(
      'select',
      { class: 'select' },
      store.slots().map((s) => h('option', { value: s.id, selected: s.id === slot }, s.label)),
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

    const focusKey = document.activeElement?.dataset?.focusKey ?? null;
    const day = store.day(date);
    const bySlot = store.totals(date).all.bySlot;
    const hideKcal = Boolean(store.settings().hideCalories);
    mountChildren(
      slotsBox,
      store.slots().map(({ id, label }) =>
        renderSlotSection({
          slot: id,
          label,
          entries: day.entries.filter((e) => e.slot === id),
          subtotal: bySlot[id],
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
        }),
      ),
    );
    if (focusKey && !document.querySelector('dialog[open]')) {
      container.querySelector(`[data-focus-key="${CSS.escape(focusKey)}"]`)?.focus();
    }
  }

  const unsubscribe = store.subscribe(() => render());

  return {
    update(route) {
      date = route.params?.date ?? store.today();
      render();
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
