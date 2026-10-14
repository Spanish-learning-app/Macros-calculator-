// One meal slot on the Day view: heading (store.slotLabel), subtotal, "Add", "tick all" when
// something is planned (A12), the slot menu (copy a slot) and the entry rows. Owner: Priya.
import { h } from '../dom.js';
import { iconEl } from './icons.js';
import { fmtKcal, fmtGrams } from './format.js';
import { renderEntryRow } from './entry-row.js';

/**
 * @param {{ slot: string, label: string, entries: object[], subtotal: object,
 *   store: object, rules: object, hideKcal: boolean,
 *   onAdd: () => void, onTickAll: () => void, onMenu: () => void,
 *   onToggle: (entry: object) => void, onEdit: (entry: object) => void,
 *   onEntryMenu: (entry: object) => void }} props
 * @returns {HTMLElement}
 */
export function renderSlotSection(props) {
  const { slot, label, entries, subtotal, store, rules, hideKcal } = props;
  const headingId = `slot-title-${slot}`;
  const planned = entries.filter((e) => e.status === 'planned').length;
  const sub = entries.length
    ? [
        hideKcal ? null : `${fmtKcal(subtotal.kcal)} kcal`,
        `${fmtGrams(subtotal.protein)} g protein`,
      ]
        .filter(Boolean)
        .join(' · ')
    : 'Nothing yet';

  return h(
    'section',
    { class: 'slot', 'data-testid': `slot-${slot}`, 'aria-labelledby': headingId },
    h(
      'header',
      { class: 'slot-head' },
      h(
        'div',
        { class: 'slot-heading' },
        h('h3', { class: 'slot-title', id: headingId }, label),
        h('p', { class: 'slot-sub' }, sub),
      ),
      h(
        'button',
        {
          type: 'button',
          class: 'btn-icon slot-more',
          'aria-label': `More for ${label}`,
          'aria-haspopup': 'dialog',
          'data-focus-key': `slot-more-${slot}`,
          onclick: props.onMenu,
        },
        iconEl('more'),
      ),
      h(
        'button',
        {
          type: 'button',
          class: 'btn btn-add',
          'aria-label': `Add to ${label}`,
          'data-focus-key': `slot-add-${slot}`,
          onclick: props.onAdd,
        },
        iconEl('plus', 18),
        h('span', { 'aria-hidden': 'true' }, 'Add'),
      ),
    ),
    planned
      ? h(
          'button',
          {
            type: 'button',
            class: 'btn btn-tick',
            'aria-label': `Mark all ${label} eaten`,
            'data-focus-key': `slot-tick-${slot}`,
            onclick: props.onTickAll,
          },
          iconEl('check', 18),
          h(
            'span',
            { 'aria-hidden': 'true' },
            planned === 1 ? 'Tick as eaten' : `Tick all ${planned} as eaten`,
          ),
        )
      : null,
    entries.length
      ? h(
          'ul',
          { class: 'entries', role: 'list' },
          entries.map((entry) =>
            renderEntryRow({
              entry,
              food: entry.foodId ? store.food(entry.foodId) : undefined,
              rules,
              hideKcal,
              onToggle: () => props.onToggle(entry),
              onEdit: () => props.onEdit(entry),
              onMore: () => props.onEntryMenu(entry),
            }),
          ),
        )
      : null,
  );
}
