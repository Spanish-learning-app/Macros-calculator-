// Weekly plans and ready-to-eat picks in the Prep tab (STATUS O7). Owner: Lena.
// Data: app/data/plans-mealprep.js (Nutrition Lab), read through store.weeklyPlans() and
// store.readyPicks(slot). "Use this week" runs store.usePlan (Sunday batches + boxes and entries
// into Mon–Fri, one Undo); a slot that already has food is never touched, only counted.
// Ready picks live here, not in the add sheet: the sheet is search-first and already busy with
// recents, saved meals and serve chips, and a pick is planned food you buy, which is Prep's job.
import { h } from '../dom.js';
import { iconEl } from './icons.js';
import { addDays, dayOfWeek, fmtDateShort, fmtDayMonth } from './format.js';
import { noteEl, plural } from './prep-bits.js';

const READY_SLOTS = ['breakfast', 'lunch', 'dinner', 'snacks'];

/** The Monday after `today` (tomorrow when today is Sunday): the week a plan fills. */
export function planMonday(today) {
  for (let i = 1; i <= 7; i += 1) {
    const d = addDays(today, i);
    if (dayOfWeek(d) === 1) return d;
  }
  return addDays(today, 1);
}

/** "19–23 Oct", or "30 Nov – 4 Dec" across months. */
export function weekRange(from, to) {
  const a = fmtDayMonth(from);
  const b = fmtDayMonth(to);
  return a.split(' ')[1] === b.split(' ')[1] ? `${a.split(' ')[0]}–${b}` : `${a} – ${b}`;
}

/** "€75.64" */
export function euro(n) {
  return `€${Number(n).toFixed(2)}`;
}

/** Average kcal and protein a day over the plan's days (the Lab's preview totals). */
export function planAverages(plan) {
  const days = Array.isArray(plan?.days) ? plan.days : [];
  if (!days.length) return null;
  const sum = (k) => days.reduce((s, d) => s + (Number(d[k]) || 0), 0);
  return {
    kcal: Math.round(sum('kcal') / days.length),
    protein: Math.round(sum('protein') / days.length),
  };
}

/**
 * The Lab writes "merienda" for the afternoon meal; with other meal names (Pakistani: "Shaam ki
 * chai") the text says the person's own word (Nasreen R3 should-fix 6).
 * @param {string|null|undefined} text @param {string} label the 'evening' slot's label
 */
export function mealWords(text, label) {
  if (typeof text !== 'string' || !text) return text ?? null;
  if (!label || /^merienda$/i.test(label)) return text;
  return text.replace(/\bmerienda\b/gi, (w) =>
    w[0] === 'M' ? label : label.charAt(0).toLowerCase() + label.slice(1),
  );
}

/**
 * Where a ready pick (or a plan's 'snacks' row) goes: the merienda ('evening') when the day has
 * it, never the 00:00–05:00 Snacks (Mariam R3 #5). Matches store.usePlan / addReadyPick.
 */
export function readyTarget(store, key) {
  if (key !== 'snacks') return key;
  return store.slots(store.today()).some((s) => s.id === 'evening') ? 'evening' : key;
}

/** The result line after "Use this week". */
export function usedText(r, plan, sunday) {
  const parts = [];
  if (r.batches) parts.push(`${plural(r.batches, 'batch')} to cook on ${fmtDateShort(sunday)}`);
  if (r.entries) parts.push(`${plural(r.entries, 'item')} planned Mon–Fri`);
  if (!r.entries && r.skipped)
    return `${plan.name}: nothing added. Every meal in it already has food that week.`;
  let text = parts.length ? `${plan.name}: ${parts.join(', ')}.` : `${plan.name}: nothing added.`;
  if (r.skipped)
    text += ` ${plural(r.skipped, 'meal')} skipped because you already had food there.`;
  return text;
}

/**
 * @param {{ store: object, notes: Map<string,string>, onChange: Function }} opts
 * @returns {HTMLElement[]} the section's children ([] when the Lab file is missing)
 */
export function plansSection({ store, notes, onChange, onShop = null }) {
  const plans = store.weeklyPlans();
  if (!plans.length) return [];
  const monday = planMonday(store.today());
  const friday = addDays(monday, 4);
  return [
    h('h3', { class: 'section-title', id: 'prep-plans' }, 'Weekly plans'),
    h(
      'p',
      { class: 'muted plan-lead' },
      'A whole Mon–Fri from the Nutrition Lab: what to cook on Sunday, and each day’s meals. Meals you already have are kept.',
    ),
    h(
      'ul',
      { class: 'plan-list', role: 'list' },
      plans.map((plan) => planCard(plan, { store, notes, onChange, onShop, monday, friday })),
    ),
  ];
}

function planCard(plan, { store, notes, onChange, onShop, monday, friday }) {
  const avg = planAverages(plan);
  const sunday = addDays(monday, -1);
  const batches = Array.isArray(plan.batches) ? plan.batches : [];
  const name = (id) => store.food(id)?.name ?? id;
  const words = (t) => mealWords(t, store.slotLabel('evening'));
  return h(
    'li',
    { class: 'card plan-card', 'data-testid': 'plan-card', 'data-plan': plan.id },
    h('h4', { class: 'plan-name' }, plan.name),
    plan.pitch ? h('p', { class: 'plan-pitch' }, words(plan.pitch)) : null,
    h(
      'p',
      { class: 'plan-facts', 'data-testid': 'plan-facts' },
      avg ? h('span', null, `About ${avg.kcal} kcal · ${avg.protein} g protein a day`) : null,
      Number.isFinite(plan.tillEur)
        ? h(
            'span',
            { 'data-testid': 'plan-cost' },
            `${euro(plan.tillEur)} at the till${Number.isFinite(plan.eatenEur) ? ` (${euro(plan.eatenEur)} of it eaten this week)` : ''}${plan.priceDate ? ` · prices from ${fmtDateShort(plan.priceDate)}` : ''}`,
          )
        : null,
      Number.isFinite(plan.sundayMinutes)
        ? h(
            'span',
            null,
            `Sunday ${plan.sundayMinutes} min hands-on${Number.isFinite(plan.weekdayMinutes) ? `, weekday evenings ${plan.weekdayMinutes} min in all` : ''}`,
          )
        : null,
    ),
    batches.length
      ? h(
          'details',
          { class: 'plan-more', 'data-testid': 'plan-batches' },
          h('summary', null, `What you make · ${plural(batches.length, 'batch')}`),
          h(
            'ul',
            { class: 'plan-batches' },
            batches.map((b) =>
              h(
                'li',
                null,
                h('strong', null, `${b.when}: `),
                `${name(b.foodId)}${b.from === 'freezer' ? ' (from the freezer)' : ` × ${b.boxes}`}`,
                b.note ? h('span', { class: 'muted' }, ` · ${words(b.note)}`) : null,
              ),
            ),
          ),
          plan.shop ? h('p', { class: 'muted' }, `Shop: ${plan.shop}.`) : null,
        )
      : null,
    h(
      'button',
      {
        type: 'button',
        class: 'btn btn-secondary btn-block',
        'data-testid': 'plan-use',
        onclick: () => {
          const r = store.usePlan({ planId: plan.id, monday });
          notes.set(plan.id, usedText(r, plan, sunday));
          onChange();
        },
      },
      iconEl('calendar', 18),
      h('span', null, `Use this week · ${weekRange(monday, friday)}`),
    ),
    onShop
      ? h(
          'button',
          {
            type: 'button',
            class: 'btn btn-quiet btn-block',
            'data-testid': 'plan-shopping',
            onclick: () => onShop(plan),
          },
          iconEl('copy', 18),
          h('span', null, 'Shopping list'),
        )
      : null,
    noteEl(notes.get(plan.id) ?? null, 'info', 'plan-note'),
  );
}

/**
 * Ready to eat: buy-and-eat picks per meal, one tap adds the pick to today (Undo in the toast).
 * @returns {HTMLElement[]}
 */
export function readySection({ store }) {
  const rows = READY_SLOTS.map((key) => ({
    key,
    slot: readyTarget(store, key),
    picks: store.readyPicks(key),
  })).filter((r) => r.picks.length);
  if (!rows.length) return [];
  const words = (t) => mealWords(t, store.slotLabel('evening'));
  return [
    h('h3', { class: 'section-title', id: 'prep-ready' }, 'Ready to eat'),
    h(
      'p',
      { class: 'muted plan-lead' },
      'Buy and eat: little or no cooking. One tap adds it to today.',
    ),
    rows.map(({ key, slot, picks }) =>
      h(
        'div',
        // data-slot: the Lab's key (as before); data-target-slot: the meal it goes in (R3-A).
        {
          class: 'ready-slot',
          'data-testid': 'ready-row',
          'data-slot': key,
          'data-target-slot': slot,
        },
        h('p', { class: 'ready-slot-title' }, store.slotLabel(slot)),
        h(
          'div',
          { class: 'ready-picks' },
          picks.map((pick, i) =>
            h(
              'button',
              {
                type: 'button',
                class: 'ready-pick',
                'data-testid': 'ready-pick',
                'data-slot': key,
                'data-target-slot': slot,
                'aria-label': `Add ${pick.name} to today’s ${store.slotLabel(slot).toLowerCase()}`,
                onclick: () => store.addReadyPick({ slot: key, index: i, date: store.today() }),
              },
              h('span', { class: 'ready-pick-name' }, pick.name),
              h(
                'span',
                { class: 'ready-pick-macros' },
                `${Math.round(pick.kcal)} kcal · ${Math.round(pick.protein)} g protein`,
              ),
              pick.note ? h('span', { class: 'ready-pick-note' }, words(pick.note)) : null,
            ),
          ),
        ),
      ),
    ),
  ];
}
