// Day totals. Owner: Priya.
// - Sticky bar: one big "kcal left" and "protein left" next to it (eaten food only, A7, A12),
//   a progress bar with planned food as a separate segment and figure (A12).
// - Over target reads "120 kcal over" in the same calm style: no red, no alarm (A7, Nasreen).
// - Macro strip (Meeting 004 B2): carbs, fat and fibre as three thin bars with "g left", inside the
//   sticky bar. Tapping it opens the full panel (eaten / target, and the "Estimate" note), which is
//   folded on phones so Lunch stays above the fold, and open from the start on wide screens.
// - After Skip, the Lab's "Reference" chip and its "Set up my targets" link stay visible
//   (NUTRITION.md §2.1a): they sit outside the folded panel.
import { h, setText, uid } from '../dom.js';
import { iconEl } from './icons.js';
import { fmtKcal, fmtGrams, leftOrOver, ESTIMATE_LINE, AT_LEAST_KEYS } from './format.js';

const MACROS = [
  { key: 'carbs', label: 'Carbs' },
  { key: 'fat', label: 'Fat' },
  { key: 'fiber', label: 'Fibre' },
];

const WIDE = '(min-width: 900px)';

const pct = (value, target) =>
  target ? `${Math.max(0, Math.min(100, (value / target) * 100)).toFixed(1)}%` : '0%';

/** "182 g left", "12 g over", "4 g above" (fibre is a goal to reach), or "43 g eaten". */
export function stripText(key, eaten, remaining) {
  const r = leftOrOver(remaining ?? null);
  if (r.amount === null) return `${fmtGrams(eaten)} g eaten`;
  if (!r.over) return `${fmtGrams(r.amount)} g left`;
  return AT_LEAST_KEYS.includes(key)
    ? `${fmtGrams(r.amount)} g above`
    : `${fmtGrams(r.amount)} g over`;
}

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

  // ------------------------------------------------------------------ macro strip (sticky)
  const bodyId = uid('macro-panel');
  const cells = MACROS.map((m) => {
    const value = h('span', { class: 'strip-value' });
    const fill = h('span', { class: 'meter-fill' });
    const cell = h(
      'span',
      { class: `strip-cell macro--${m.key}`, dataset: { key: m.key } },
      h('span', { class: 'strip-name' }, m.label),
      value,
      h('span', { class: `meter meter--${m.key}`, 'aria-hidden': 'true' }, fill),
    );
    return { ...m, cell, value, fill };
  });
  const stripHint = h('span', { class: 'sr-only' });
  const strip = h(
    'button',
    {
      type: 'button',
      class: 'macro-strip',
      'data-testid': 'macro-strip',
      'aria-expanded': 'false',
      'aria-controls': bodyId,
      onclick: () => setOpen(!open, { reveal: true }),
    },
    cells.map((c) => c.cell),
    h('span', { class: 'strip-chevron' }, iconEl('chevronDown', 18)),
    stripHint,
  );

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
    strip,
  );

  // ------------------------------------------------------------------ full panel (not sticky)
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
  const targetsLine = h('p', { class: 'targets-line' }, chip, note, action);
  const eatenLine = h('p', { class: 'eaten-line' });
  const body = h(
    'section',
    {
      class: 'macro-panel',
      id: bodyId,
      'data-testid': 'macro-panel',
      'aria-label': 'Eaten so far against your targets',
    },
    eatenLine,
    h(
      'ul',
      { class: 'macro-list', role: 'list' },
      rows.map((r) => r.row),
    ),
  );
  // After Skip the reference line stays in view; otherwise it folds with the panel.
  const refSlot = h('div', { class: 'targets-ref' });
  const panel = h('div', { class: 'day-macros' }, refSlot, body);

  let open = false;
  function setOpen(next, { reveal = false } = {}) {
    open = next;
    body.hidden = !open;
    strip.setAttribute('aria-expanded', String(open));
    strip.classList.toggle('is-open', open);
    setText(stripHint, open ? 'Hide details' : 'Show details');
    // Opened from the sticky bar after scrolling: bring the panel into view under it.
    if (open && reveal && body.getBoundingClientRect().top < el.getBoundingClientRect().bottom) {
      body.scrollIntoView({ block: 'nearest' });
    }
  }
  let wide = false;
  try {
    wide = window.matchMedia(WIDE).matches;
  } catch {
    wide = false;
  }
  setOpen(wide);

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
      // Protein is a goal to reach: above it is good news, never "over" (Meeting 003 item 6).
      setText(protNum, `${p.over ? '+' : ''}${fmtGrams(p.amount)} g`);
      setText(protLbl, p.over ? 'above target ✓' : 'protein left');
      protBox.dataset.value = fmtGrams(left.protein.remaining);
    }
    protBox.classList.toggle('is-met', p.over);

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

    // macro strip: grams left (Bilal: "left, in grams, is how I decide dinner")
    for (const c of cells) {
      const v = eaten[c.key];
      const t = targets?.[c.key] ?? null;
      setText(c.value, stripText(c.key, v, t === null ? null : t - v));
      c.fill.style.width = pct(v, t);
      c.cell.classList.toggle('is-over', t !== null && v > t && !AT_LEAST_KEYS.includes(c.key));
    }

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
      r.row.classList.toggle('is-over', t !== null && v > t && !AT_LEAST_KEYS.includes(r.key));
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
      setText(note, ESTIMATE_LINE);
      setText(action, 'Change');
      action.href = router.href({ name: 'profile', params: {} });
      action.hidden = false;
    } else {
      setText(note, rules?.warnings?.no_targets ?? 'No targets are set. You can still log food.');
      action.hidden = true;
    }
    const home = info.kind === 'reference' ? refSlot : body;
    if (targetsLine.parentNode !== home) home.append(targetsLine);
    refSlot.hidden = info.kind !== 'reference';
  }

  return { el, panel, update };
}
