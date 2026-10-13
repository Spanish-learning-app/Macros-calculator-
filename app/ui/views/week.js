// Week and month (route `week`). Owner: Priya.
// Seven rows with kcal and protein against target, weekly averages over logged days, previous and
// next week; a month grid with a dot on logged days, one tap opens a day. Over target is plain
// information ("+120 over"), never red.
import { h, mountChildren } from '../dom.js';
import { iconEl } from '../components/icons.js';
import {
  addDays,
  fmtKcal,
  fmtGrams,
  fmtDayMonth,
  fmtWeekday,
  fmtMonth,
  fmtDateShort,
  monthGrid,
  dayOfWeek,
} from '../components/format.js';

const pct = (v, t) => (t ? `${Math.max(0, Math.min(100, (v / t) * 100)).toFixed(1)}%` : '0%');

/**
 * @param {HTMLElement} container @param {{ store: object, router: object, rules: object }} ctx
 */
export function mount(container, ctx) {
  const { store, router } = ctx;
  const root = h('div', { class: 'view view-week' });
  mountChildren(container, root);
  let date = store.today();

  const goWeek = (d) => router.go({ name: 'week', params: { date: d } });

  function measure(label, value, target, fmt, unit, key, hideKcal) {
    if (key === 'kcal' && hideKcal) return null;
    const over = target ? value - target : null;
    return h(
      'span',
      { class: ['week-measure', over !== null && over > 0 ? 'is-over' : null] },
      h(
        'span',
        { class: 'week-measure-text' },
        h('span', { class: 'week-measure-label' }, label),
        ' ',
        target ? `${fmt(value)} / ${fmt(target)}${unit}` : `${fmt(value)}${unit}`,
        over !== null && over > 0
          ? h('span', { class: 'week-over' }, ` +${fmt(over)} over`)
          : null,
      ),
      h(
        'span',
        { class: `meter meter--${key}`, 'aria-hidden': 'true' },
        h('span', { class: 'meter-fill', style: { width: pct(value, target) } }),
      ),
    );
  }

  function weekSection() {
    const { dates, rows, average } = store.week(date);
    const targets = store.targets();
    const today = store.today();
    const hideKcal = Boolean(store.settings().hideCalories);
    const logged = rows.filter((r) => r.entries > 0).length;
    return h(
      'section',
      { class: 'card week-card', 'aria-labelledby': 'week-title' },
      h(
        'div',
        { class: 'week-head' },
        h(
          'button',
          {
            type: 'button',
            class: 'btn-icon',
            'aria-label': 'Previous week',
            onclick: () => goWeek(addDays(date, -7)),
          },
          iconEl('chevronLeft'),
        ),
        h(
          'h2',
          { class: 'week-title', id: 'week-title' },
          `${fmtDayMonth(dates[0])} – ${fmtDayMonth(dates[6])}`,
        ),
        h(
          'button',
          {
            type: 'button',
            class: 'btn-icon',
            'aria-label': 'Next week',
            onclick: () => goWeek(addDays(date, 7)),
          },
          iconEl('chevronRight'),
        ),
      ),
      h(
        'ul',
        { class: 'week-list', role: 'list' },
        rows.map((row) =>
          h(
            'li',
            null,
            h(
              'a',
              {
                class: ['week-row', row.date === today ? 'is-today' : null],
                href: router.href({ name: 'day', params: { date: row.date } }),
                'data-testid': 'week-row',
                'data-date': row.date,
                'aria-label': `${fmtDateShort(row.date)}${row.date === today ? ', today' : ''}: ${
                  row.entries
                    ? `${hideKcal ? '' : `${fmtKcal(row.total.kcal)} kcal, `}${fmtGrams(row.total.protein)} g protein`
                    : 'nothing logged'
                }`,
              },
              h(
                'span',
                { class: 'week-day' },
                h('span', { class: 'week-dow' }, fmtWeekday(row.date)),
                h('span', { class: 'week-date' }, fmtDayMonth(row.date)),
              ),
              row.entries
                ? h(
                    'span',
                    { class: 'week-measures' },
                    measure('kcal', row.total.kcal, targets?.kcal, fmtKcal, '', 'kcal', hideKcal),
                    measure(
                      'Protein',
                      row.total.protein,
                      targets?.protein,
                      fmtGrams,
                      ' g',
                      'protein',
                      hideKcal,
                    ),
                  )
                : h('span', { class: 'week-empty' }, 'Nothing logged'),
            ),
          ),
        ),
      ),
      h(
        'p',
        { class: 'week-average', 'data-testid': 'week-average' },
        logged
          ? [
              h('strong', null, `Average of ${logged} logged ${logged === 1 ? 'day' : 'days'}: `),
              hideKcal ? '' : `${fmtKcal(average.kcal)} kcal · `,
              `${fmtGrams(average.protein)} g protein · ${fmtGrams(average.carbs)} g carbs · ${fmtGrams(average.fat)} g fat · ${fmtGrams(average.fiber)} g fibre`,
            ]
          : 'Nothing logged this week yet.',
      ),
    );
  }

  function monthSection() {
    const [y, m] = date.split('-').map(Number);
    const weekStartsOn = store.settings().weekStartsOn ?? 1;
    const grid = monthGrid(y, m, weekStartsOn);
    const logged = new Set(store.loggedDates());
    const today = store.today();
    const firstOf = (yy, mm) => `${yy}-${String(mm).padStart(2, '0')}-01`;
    const prev = m === 1 ? firstOf(y - 1, 12) : firstOf(y, m - 1);
    const next = m === 12 ? firstOf(y + 1, 1) : firstOf(y, m + 1);
    const headDates = grid.flat().filter(Boolean).slice(0, 7);
    const headers = Array.from({ length: 7 }, (_, i) => {
      const d = headDates.find((x) => (dayOfWeek(x) - weekStartsOn + 7) % 7 === i);
      return d ? fmtWeekday(d).slice(0, 2) : '';
    });
    return h(
      'section',
      { class: 'card month-card', 'aria-labelledby': 'month-title' },
      h(
        'div',
        { class: 'week-head' },
        h(
          'button',
          {
            type: 'button',
            class: 'btn-icon',
            'aria-label': 'Previous month',
            onclick: () => goWeek(prev),
          },
          iconEl('chevronLeft'),
        ),
        h('h2', { class: 'week-title', id: 'month-title' }, fmtMonth(y, m)),
        h(
          'button',
          {
            type: 'button',
            class: 'btn-icon',
            'aria-label': 'Next month',
            onclick: () => goWeek(next),
          },
          iconEl('chevronRight'),
        ),
      ),
      h(
        'table',
        { class: 'month-grid', 'data-testid': 'month-grid' },
        h('thead', null, h('tr', null, headers.map((d) => h('th', { scope: 'col' }, d)))),
        h(
          'tbody',
          null,
          grid.map((week) =>
            h(
              'tr',
              null,
              week.map((d) =>
                h(
                  'td',
                  null,
                  d
                    ? h(
                        'a',
                        {
                          class: [
                            'month-day',
                            logged.has(d) ? 'is-logged' : null,
                            d === today ? 'is-today' : null,
                          ],
                          href: router.href({ name: 'day', params: { date: d } }),
                          'data-logged': logged.has(d) ? 'true' : 'false',
                          'data-date': d,
                          'aria-label': `${fmtDateShort(d)}${logged.has(d) ? ', food logged' : ''}${d === today ? ', today' : ''}`,
                        },
                        h('span', { 'aria-hidden': 'true' }, String(Number(d.slice(8)))),
                        h('span', { class: 'month-dot', 'aria-hidden': 'true' }),
                      )
                    : null,
                ),
              ),
            ),
          ),
        ),
      ),
      h(
        'p',
        { class: 'field-help month-legend' },
        h('span', { class: 'month-dot month-dot--legend', 'aria-hidden': 'true' }),
        ' Food logged that day',
      ),
    );
  }

  function render() {
    mountChildren(
      root,
      h('h2', { class: 'sr-only' }, 'Week and month'),
      h('div', { class: 'week-layout' }, weekSection(), monthSection()),
    );
  }

  const unsubscribe = store.subscribe(() => render());

  return {
    update(route) {
      date = route.params?.date ?? store.today();
      render();
    },
    unmount() {
      unsubscribe();
      container.replaceChildren();
    },
  };
}
