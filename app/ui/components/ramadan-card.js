// Profile: Ramadan mode (NUTRITION.md §12, DECISIONS 2026-10-15). Owner: Lena.
// The switch, the start date (default: the built-in table's first day) and editable fajr/maghrib.
// Katori gives no rulings and makes no moon-sighting claim: the person picks the dates.
import { h, uid, mountChildren } from '../dom.js';
import { fmtDateShort } from './format.js';
import { timeText } from '../../core/ramadan.js';

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

  function render() {
    const focused = el.contains(document.activeElement)
      ? document.activeElement.dataset.testid
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
    if (focused) el.querySelector(`[data-testid="${focused}"]`)?.focus();
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
    const source = typed
      ? 'Your times, used every Ramadan day.'
      : times.place
        ? `From the ${times.place} table for ${fmtDateShort(shownDate)}; they change a little each day.`
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
    ];
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
  el.addEventListener('change', () =>
    queueMicrotask(() => {
      last = JSON.stringify(store.settings().ramadanMode ?? null);
      render();
    }),
  );
  return { el, destroy: unsubscribe };
}
