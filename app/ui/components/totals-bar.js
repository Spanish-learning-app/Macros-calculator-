// Day totals. Owner: Priya.
// - Sticky bar: one big "kcal left" and "protein left" next to it (eaten food only, A7, A12),
//   a progress bar with planned food as a separate segment and figure (A12).
// - Over target reads "120 kcal over" in the same calm style: no red, no alarm (A7, Nasreen).
// - Macro panel: carbs, fat and fibre (and kcal/protein eaten) against targets, labelled as
//   estimates (or the Lab's "Reference" chip after Skip, NUTRITION.md §2.1a).
import { h, setText } from '../dom.js';
import { fmtKcal, fmtGrams, leftOrOver } from './format.js';

const MACROS = [
  { key: 'carbs', label: 'Carbs' },
  { key: 'fat', label: 'Fat' },
  { key: 'fiber', label: 'Fibre' },
];

const pct = (value, target) =>
  target ? `${Math.max(0, Math.min(100, (value / target) * 100)).toFixed(1)}%` : '0%';

/**
 * @param {{ store: object, router: object, rules: object }} props
 * @returns {{ el: HTMLElement, panel: HTMLElement, update: (date: string) => void }}
 */
export function createTotalsBar({ store, router, rules }) {
  const kcalNum = h('span', { class: 'big-num' });
  const kcalLbl = h('span', { class: 'big-label' });
  const kcalBox = h('p', { class: 'big big--kcal', 'data-testid': 'kcal-left' }, kcalNum, kcalLbl);
  const protNum = h('span', { class: 'big-num' });
  const protLbl = h('span', { class: 'big-label' });
  const protBox = h(
    'p',
    { class: 'big big--protein', 'data-testid': 'protein-left' },
    protNum,
    protLbl,
  );
  const barEaten = h('span', { class: 'meter-fill' });
  const barPlanned = h('span', { class: 'meter-planned' });
  const bar = h(
    'span',
    { class: 'meter meter--kcal', 'aria-hidden': 'true' },
    barEaten,
    barPlanned,
  );
  const planned = h('p', { class: 'totals-planned', 'data-testid': 'planned-total' });

  const el = h(
    'section',
    { class: 'totals', 'data-testid': 'totals', 'aria-label': 'Left today' },
    h(
      'div',
      { class: 'totals-main', 'aria-live': 'polite', 'aria-atomic': 'true' },
      kcalBox,
      protBox,
    ),
    bar,
    planned,
  );

  // Macro panel (not sticky).
  const rows = MACROS.map((m) => {
    const value = h('span', { class: 'macro-value' });
    const fill = h('span', { class: 'meter-fill' });
    const row = h(
      'li',
      { class: `macro macro--${m.key}`, dataset: { key: m.key } },
      h('span', { class: 'macro-name' }, m.label),
      value,
      h('span', { class: `meter meter--${m.key}`, 'aria-hidden': 'true' }, fill),
    );
    return { ...m, row, value, fill };
  });
  const chip = h('span', { class: 'chip-kind', 'data-testid': 'target-kind' });
  const note = h('span', { class: 'targets-note' });
  const action = h('a', { class: 'link-btn' });
  const eatenLine = h('p', { class: 'eaten-line' });
  const panel = h(
    'section',
    { class: 'macro-panel', 'aria-label': 'Eaten so far against your targets' },
    eatenLine,
    h(
      'ul',
      { class: 'macro-list', role: 'list' },
      rows.map((r) => r.row),
    ),
    h('p', { class: 'targets-line' }, chip, note, action),
  );

  function update(date) {
    const settings = store.settings();
    const hideKcal = Boolean(settings.hideCalories);
    const left = store.left(date);
    const totals = store.totals(date);
    const eaten = totals.eaten.total;
    const plannedTotal = totals.planned.total;
    const targets = store.targets();
    const info = store.targetInfo();

    // kcal
    const k = leftOrOver(left.kcal?.remaining ?? null);
    kcalBox.hidden = hideKcal;
    if (k.amount === null) {
      setText(kcalNum, fmtKcal(eaten.kcal));
      setText(kcalLbl, 'kcal eaten');
      kcalBox.dataset.value = '';
    } else {
      setText(kcalNum, fmtKcal(k.amount));
      setText(kcalLbl, k.over ? 'kcal over' : 'kcal left');
      kcalBox.dataset.value = fmtKcal(left.kcal.remaining);
    }
    kcalBox.classList.toggle('is-over', k.over);

    // protein
    const p = leftOrOver(left.protein?.remaining ?? null);
    if (p.amount === null) {
      setText(protNum, `${fmtGrams(eaten.protein)} g`);
      setText(protLbl, 'protein eaten');
      protBox.dataset.value = '';
    } else {
      setText(protNum, `${fmtGrams(p.amount)} g`);
      setText(protLbl, p.over ? 'protein over' : 'protein left');
      protBox.dataset.value = fmtGrams(left.protein.remaining);
    }
    protBox.classList.toggle('is-over', p.over);

    // bar: eaten, then planned as a lighter segment
    const barKey = hideKcal ? 'protein' : 'kcal';
    const target = targets?.[barKey] ?? null;
    bar.className = `meter meter--${barKey}`;
    bar.hidden = !target;
    barEaten.style.width = pct(eaten[barKey], target);
    const room = target ? Math.max(0, target - eaten[barKey]) : 0;
    barPlanned.style.width = pct(Math.min(room, plannedTotal[barKey]), target);
    bar.classList.toggle('is-over', target !== null && eaten[barKey] > target);

    // planned figure
    const hasPlanned = store.day(date).entries.some((e) => e.status === 'planned');
    planned.hidden = !hasPlanned;
    setText(
      planned,
      hideKcal
        ? `Planned, not eaten yet: ${fmtGrams(plannedTotal.protein)} g protein`
        : `Planned, not eaten yet: ${fmtKcal(plannedTotal.kcal)} kcal · ${fmtGrams(plannedTotal.protein)} g protein`,
    );

    // macro panel
    const of = (key, fmt, unit) =>
      targets?.[key] != null
        ? `${fmt(eaten[key])} of ${fmt(targets[key])}${unit}`
        : `${fmt(eaten[key])}${unit}`;
    setText(
      eatenLine,
      hideKcal
        ? `Eaten so far: ${of('protein', fmtGrams, ' g')} protein`
        : `Eaten so far: ${of('kcal', fmtKcal, ' kcal')} · ${of('protein', fmtGrams, ' g')} protein`,
    );
    for (const r of rows) {
      const v = eaten[r.key];
      const t = targets?.[r.key] ?? null;
      setText(r.value, t === null ? `${fmtGrams(v)} g` : `${fmtGrams(v)} / ${fmtGrams(t)} g`);
      r.fill.style.width = pct(v, t);
      r.row.classList.toggle('is-over', t !== null && v > t);
    }

    // estimate / reference line
    chip.hidden = !info.chip;
    setText(chip, info.chip ?? '');
    chip.dataset.kind = info.kind;
    if (info.kind === 'reference') {
      setText(note, info.label ?? '');
      setText(action, info.prompt ?? 'Set up my targets');
      action.href = router.href({ name: 'welcome', params: {} });
      action.hidden = false;
    } else if (info.kind === 'personal') {
      setText(note, 'Targets are an estimate, you can change them.');
      setText(action, 'Change');
      action.href = router.href({ name: 'profile', params: {} });
      action.hidden = false;
    } else {
      setText(note, rules?.warnings?.no_targets ?? 'No targets are set. You can still log food.');
      action.hidden = true;
    }
  }

  return { el, panel, update };
}
