// Profile: Ramadan mode (NUTRITION.md §12, DECISIONS 2026-10-15). Owner: Lena.
// The switch, the start date (default: the built-in table's first day) and editable fajr/maghrib.
// STATUS O12: the day-by-day table (folded) and the edits RULES.ramadan.userEdit allows: a
// "match your mosque" offset of a few minutes, and one day's own times.
// Katori gives no rulings and makes no moon-sighting claim: the person picks the dates.
import { h, uid, mountChildren } from '../dom.js';
import { fmtDateShort } from './format.js';
import { timeText } from '../../core/ramadan.js';
import { iconEl } from './icons.js';

/**
 * @param {{ store: object, rules: object }} props
 * @returns {{ el: HTMLElement, destroy: () => void }}
 */
export function createRamadanCard({ store, rules }) {
  const el = h('section', {
    class: 'card ramadan-card',
    'aria-labelledby': 'ramadan-h',
    'data-testid': 'ramadan-card',
  });
  if (!rules?.mealSlots?.ramadan) return { el: h('div', { hidden: true }), destroy() {} };
  // Kept across re-renders: the day-by-day fold and the day being changed.
  let tableOpen = false;
  let editing = null;

  function render() {
    const active = el.contains(document.activeElement) ? document.activeElement : null;
    const focused = active?.dataset.testid
      ? `[data-testid="${active.dataset.testid}"]${active.dataset.date ? `[data-date="${active.dataset.date}"]` : ''}`
      : null;
    const info = store.ramadan();
    const toggle = h('input', {
      type: 'checkbox',
      role: 'switch',
      class: 'switch-input',
      'data-testid': 'ramadan-toggle',
      checked: info.on,
      onchange: () => store.setRamadanMode({ on: toggle.checked }),
    });
    const parts = [
      h('h3', { class: 'card-title', id: 'ramadan-h' }, 'Ramadan'),
      h(
        'label',
        { class: 'switch switch--row' },
        toggle,
        h('span', { class: 'switch-track', 'aria-hidden': 'true' }),
        h('span', null, 'Ramadan mode'),
      ),
      h(
        'p',
        { class: 'field-help' },
        'On Ramadan days your meals become Sehri, Iftar, After taraweeh and Snacks. Your targets stay the same.',
      ),
    ];
    if (info.on) parts.push(...details(info));
    if (info.notes.length) {
      parts.push(
        h(
          'div',
          { class: 'ramadan-notes', 'data-testid': 'ramadan-card-notes' },
          info.notes.map((n) => h('p', { 'data-flag': n.id }, n.text)),
        ),
      );
    }
    if (info.notRulings) parts.push(h('p', { class: 'field-help' }, info.notRulings));
    mountChildren(el, ...parts);
    if (focused) el.querySelector(focused)?.focus();
  }

  function details(info) {
    const startId = uid('ram-start');
    const start = h('input', {
      id: startId,
      class: 'input',
      type: 'date',
      'data-testid': 'ramadan-start',
      value: info.startDate ?? info.defaultStart ?? '',
      onchange: () => {
        if (start.value) store.setRamadanMode({ startDate: start.value });
      },
    });
    const range = info.range;
    // Times shown for today when it is a Ramadan day, else for the first day.
    const shownDate = info.isDay ? store.today() : (range?.start ?? store.today());
    const times = store.ramadan(shownDate).times;
    const timeField = (key, label) => {
      const id = uid(`ram-${key}`);
      const input = h('input', {
        id,
        class: 'input',
        type: 'time',
        'data-testid': `ramadan-${key}`,
        value: info.typed[key] ?? (times[key] === null ? '' : timeText(times[key])),
        onchange: () => store.setRamadanMode({ [key]: input.value || null }),
      });
      return h(
        'label',
        { class: 'field', for: id },
        h('span', { class: 'field-label' }, label),
        input,
      );
    };
    const typed = info.typed.fajr || info.typed.maghrib;
    const moved = info.offsets.fajr || info.offsets.maghrib;
    const source = typed
      ? 'Your times, used every Ramadan day.'
      : times.place
        ? `From the ${times.place} table for ${fmtDateShort(shownDate)}${moved ? ', moved to match your mosque' : ''}; they change a little each day.`
        : 'No built-in times for these dates: type your mosque’s times.';
    return [
      h(
        'label',
        { class: 'field', for: startId },
        h('span', { class: 'field-label' }, 'First day of fasting'),
        start,
      ),
      range
        ? h(
            'p',
            { class: 'field-help', 'data-testid': 'ramadan-range' },
            `Ramadan days: ${fmtDateShort(range.start)} to ${fmtDateShort(range.end)}. You can switch it off at any time.`,
          )
        : null,
      h(
        'div',
        { class: 'ramadan-times' },
        timeField('fajr', 'Fajr'),
        timeField('maghrib', 'Maghrib'),
      ),
      h('p', { class: 'field-help', 'data-testid': 'ramadan-times-source' }, source),
      typed
        ? h(
            'button',
            {
              type: 'button',
              class: 'btn btn-quiet',
              'data-testid': 'ramadan-times-reset',
              onclick: () => store.setRamadanMode({ fajr: null, maghrib: null }),
            },
            'Use the built-in times',
          )
        : null,
      info.timesNote ? h('p', { class: 'field-help' }, info.timesNote) : null,
      // The offset only moves the table's times, so it is offered while no every-day time is typed.
      !typed && info.edit.offset && times.place ? offsetFields(info) : null,
      info.days.length ? dayTable(info) : null,
    ];
  }

  /** "Match your mosque": both table times moved by whole minutes (RULES userEdit range). */
  function offsetFields(info) {
    const { min, max } = info.edit.offset;
    const words = (n) =>
      n === 0 ? 'Same as the table' : `${Math.abs(n)} min ${n < 0 ? 'earlier' : 'later'}`;
    const field = (key, label) => {
      const id = uid(`ram-off-${key}`);
      const options = [];
      for (let n = min; n <= max; n += 1) {
        options.push(
          h('option', { value: String(n), selected: n === info.offsets[key] }, words(n)),
        );
      }
      const select = h(
        'select',
        {
          id,
          class: 'select',
          'data-testid': `ramadan-offset-${key}`,
          onchange: () => store.setRamadanMode({ [`${key}OffsetMin`]: Number(select.value) }),
        },
        options,
      );
      return h(
        'label',
        { class: 'field', for: id },
        h('span', { class: 'field-label' }, label),
        select,
      );
    };
    return h(
      'fieldset',
      { class: 'ramadan-offsets', 'data-testid': 'ramadan-offsets' },
      h('legend', { class: 'field-label' }, 'Your mosque’s times are a little different?'),
      h(
        'p',
        { class: 'field-help' },
        'Move every day’s time by a few minutes. You can also change one day in the table below.',
      ),
      h('div', { class: 'ramadan-times' }, field('fajr', 'Fajr'), field('maghrib', 'Maghrib')),
    );
  }

  /** STATUS O12: every Ramadan day's fajr and maghrib, folded; one day can be changed. */
  function dayTable(info) {
    const today = store.today();
    const perDay = info.edit.perDay;
    const cell = (d, key) => {
      const t = d[key];
      const mine = d.source[key] === 'day' || d.source[key] === 'user';
      return h(
        'td',
        { class: mine ? 'is-own' : null },
        t === null ? '–' : timeText(t),
        mine ? h('span', { class: 'sr-only' }, ' (your time)') : null,
      );
    };
    const rows = info.days.flatMap((d) => {
      const own = d.source.fajr === 'day' || d.source.maghrib === 'day';
      const row = h(
        'tr',
        {
          'data-testid': 'ramadan-day',
          'data-date': d.date,
          class: [d.date === today ? 'is-today' : null, own ? 'is-changed' : null],
          'aria-current': d.date === today ? 'date' : null,
        },
        h('td', { class: 'ram-n' }, String(d.n)),
        h('th', { scope: 'row', class: 'ram-date' }, fmtDateShort(d.date)),
        cell(d, 'fajr'),
        cell(d, 'maghrib'),
        perDay
          ? h(
              'td',
              { class: 'ram-edit' },
              h(
                'button',
                {
                  type: 'button',
                  class: 'btn-icon',
                  'data-testid': 'ramadan-day-edit',
                  'data-date': d.date,
                  'aria-expanded': String(editing === d.date),
                  'aria-label': `Change the times for ${fmtDateShort(d.date)}`,
                  onclick: () => {
                    editing = editing === d.date ? null : d.date;
                    render();
                    el.querySelector(
                      editing
                        ? `[data-testid="ramadan-day-fajr"]`
                        : `[data-testid="ramadan-day-edit"][data-date="${d.date}"]`,
                    )?.focus();
                  },
                },
                iconEl('edit', 18),
              ),
            )
          : null,
      );
      return editing === d.date && perDay ? [row, editRow(d)] : [row];
    });
    const changed = info.days.filter(
      (d) => d.source.fajr === 'day' || d.source.maghrib === 'day',
    ).length;
    const fold = h(
      'details',
      {
        class: 'ramadan-table-fold cook-method',
        'data-testid': 'ramadan-table',
        open: tableOpen,
        ontoggle: () => {
          tableOpen = fold.open;
        },
      },
      h(
        'summary',
        { class: 'cook-method-summary' },
        `Day-by-day times · ${info.days.length} days${changed ? ` · ${changed} changed` : ''}`,
      ),
      h(
        'div',
        { class: 'ramadan-table-wrap' },
        h(
          'table',
          { class: 'ramadan-table' },
          h(
            'caption',
            { class: 'sr-only' },
            'Fajr (sehri ends) and maghrib (iftar) for each Ramadan day',
          ),
          h(
            'thead',
            null,
            h(
              'tr',
              null,
              h('th', { scope: 'col', class: 'ram-n' }, 'Day'),
              h('th', { scope: 'col' }, 'Date'),
              h('th', { scope: 'col' }, 'Fajr'),
              h('th', { scope: 'col' }, 'Maghrib'),
              perDay
                ? h(
                    'th',
                    { scope: 'col', class: 'ram-edit' },
                    h('span', { class: 'sr-only' }, 'Change'),
                  )
                : null,
            ),
          ),
          h('tbody', null, rows),
        ),
      ),
      h(
        'p',
        { class: 'field-help' },
        perDay
          ? 'Fajr is when sehri ends; maghrib is iftar. Tap the pencil to change one day.'
          : 'Fajr is when sehri ends; maghrib is iftar.',
      ),
    );
    return fold;
  }

  /** The inline editor for one day: two time inputs, Save, and back to the usual time. */
  function editRow(d) {
    const fajrId = uid('ram-day-fajr');
    const maghribId = uid('ram-day-maghrib');
    const value = (key) => (d[key] === null ? '' : timeText(d[key]));
    const fajr = h('input', {
      id: fajrId,
      class: 'input',
      type: 'time',
      'data-testid': 'ramadan-day-fajr',
      value: value('fajr'),
    });
    const maghrib = h('input', {
      id: maghribId,
      class: 'input',
      type: 'time',
      'data-testid': 'ramadan-day-maghrib',
      value: value('maghrib'),
    });
    const own = d.source.fajr === 'day' || d.source.maghrib === 'day';
    const done = () => {
      const date = d.date;
      editing = null;
      render();
      el.querySelector(`[data-testid="ramadan-day-edit"][data-date="${date}"]`)?.focus();
    };
    return h(
      'tr',
      { class: 'ramadan-day-editor', 'data-testid': 'ramadan-day-editor', 'data-no-rerender': '' },
      h(
        'td',
        { colspan: '5' },
        h(
          'div',
          { class: 'ramadan-times' },
          h(
            'label',
            { class: 'field', for: fajrId },
            h('span', { class: 'field-label' }, `Fajr, ${fmtDateShort(d.date)}`),
            fajr,
          ),
          h(
            'label',
            { class: 'field', for: maghribId },
            h('span', { class: 'field-label' }, `Maghrib, ${fmtDateShort(d.date)}`),
            maghrib,
          ),
        ),
        h(
          'div',
          { class: 'ramadan-day-actions' },
          h(
            'button',
            {
              type: 'button',
              class: 'btn btn-secondary',
              'data-testid': 'ramadan-day-save',
              onclick: () => {
                // A day keeps its own time when it already had one or the time was changed;
                // an untouched usual time stays the usual one (it follows later edits).
                const patch = {};
                for (const [key, input] of [
                  ['fajr', fajr],
                  ['maghrib', maghrib],
                ]) {
                  const keep = d.source[key] === 'day' || input.value !== value(key);
                  patch[key] = input.value && keep ? input.value : null;
                }
                store.setRamadanDay(d.date, patch);
                done();
              },
            },
            'Save',
          ),
          own
            ? h(
                'button',
                {
                  type: 'button',
                  class: 'btn btn-quiet',
                  'data-testid': 'ramadan-day-reset',
                  onclick: () => {
                    store.setRamadanDay(d.date, { fajr: null, maghrib: null });
                    done();
                  },
                },
                'Use the usual times',
              )
            : null,
          h(
            'button',
            {
              type: 'button',
              class: 'btn btn-quiet',
              'data-testid': 'ramadan-day-cancel',
              onclick: done,
            },
            'Cancel',
          ),
        ),
      ),
    );
  }

  render();
  let last = JSON.stringify(store.settings().ramadanMode ?? null);
  const unsubscribe = store.subscribe(() => {
    const now = JSON.stringify(store.settings().ramadanMode ?? null);
    if (now === last || el.contains(document.activeElement)) return;
    last = now;
    render();
  });
  // Re-render after a change made from inside the card (focus stays on the control).
  el.addEventListener('change', (event) => {
    // The one-day editor keeps its typed times until Save.
    if (event.target.closest?.('[data-no-rerender]')) return;
    queueMicrotask(() => {
      last = JSON.stringify(store.settings().ramadanMode ?? null);
      render();
    });
  });
  return { el, destroy: unsubscribe };
}
