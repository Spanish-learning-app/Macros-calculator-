// Profile's weight log card (Sprint 3, Meeting 005). Owner: Lena.
// One weight per day, typed in kg or lb (settings.units.weight). Add, edit (tap a row) and
// delete with Undo. Shows the trend and, rarely, a suggestion: words only, a target never changes.
import { h, uid, mountChildren, setText } from '../dom.js';
import { kgFromLb, lbFromKg } from '../../core/units.js';
import { weightLimits } from '../../core/weight.js';
import { addDays, fmtDateShort, relativeDay } from './format.js';
import { fmtWeight, renderTrendLines, renderWeightChart } from './weight-bits.js';

const SHOWN = 7;

/**
 * @param {{ store: object, rules: object }} props
 * @returns {{ el: HTMLElement, update(): void, destroy(): void }}
 */
export function createWeightCard({ store, rules }) {
  const unit = () => (store.settings().units?.weight === 'lb' ? 'lb' : 'kg');
  let date = store.today();
  let showAll = false;

  const inputId = uid('weight');
  const errorId = uid('weight-err');
  const input = h('input', {
    id: inputId,
    class: 'input input--num',
    type: 'text',
    inputmode: 'decimal',
    autocomplete: 'off',
    'aria-describedby': errorId,
    'data-testid': 'weight-input',
    onkeydown: (e) => {
      if (e.key === 'Enter') save();
    },
  });
  const suffix = h('span', { class: 'input-unit' });
  const error = h('p', {
    class: 'field-error',
    id: errorId,
    role: 'alert',
    'data-testid': 'weight-error',
    hidden: true,
  });
  const status = h('p', { class: 'form-status', role: 'status', 'aria-live': 'polite' });
  const dayChips = h('div', { class: 'choice-row weight-days' });
  const label = h('label', { class: 'field-label', for: inputId });
  const listBox = h('div', { class: 'weight-list-box' });
  const trendBox = h('div', { class: 'weight-trend-box' });

  const el = h(
    'section',
    { class: 'card weight-card', 'aria-labelledby': 'weight-h', 'data-testid': 'weight-card' },
    h('h3', { class: 'card-title', id: 'weight-h' }, 'Weight log'),
    h(
      'p',
      { class: 'field-help' },
      `${rules?.weightTrend?.text?.tip ?? 'Weigh at the same time each day.'} Your targets only change when you change them.`,
    ),
    dayChips,
    h(
      'div',
      { class: 'field' },
      label,
      h(
        'div',
        { class: 'input-suffix' },
        input,
        suffix,
        h(
          'button',
          { type: 'button', class: 'btn btn-primary', 'data-testid': 'weight-save', onclick: save },
          'Save',
        ),
      ),
      error,
    ),
    status,
    trendBox,
    listBox,
  );

  function toUnit(kg) {
    return unit() === 'lb' ? lbFromKg(kg) : kg;
  }

  function renderForm() {
    const today = store.today();
    const yesterday = addDays(today, -1);
    const days = [today, yesterday];
    if (!days.includes(date)) days.push(date);
    mountChildren(
      dayChips,
      days.map((d) =>
        h(
          'button',
          {
            type: 'button',
            class: ['chip', d === date ? 'is-selected' : null],
            'aria-pressed': String(d === date),
            'data-testid':
              d === today
                ? 'weight-day-today'
                : d === yesterday
                  ? 'weight-day-yesterday'
                  : 'weight-day-other',
            onclick: () => pickDate(d),
          },
          relativeDay(d, today) ?? fmtDateShort(d),
        ),
      ),
    );
    setText(label, `Weight on ${(relativeDay(date, today) ?? fmtDateShort(date)).toLowerCase()}`);
    setText(suffix, unit());
    const kg = store.weightOn(date);
    input.value = kg === null ? '' : toUnit(kg).toFixed(1);
    const last = store.weights().at(-1);
    input.placeholder = last ? toUnit(last.kg).toFixed(1) : unit() === 'lb' ? '170.0' : '75.0';
  }

  function pickDate(d) {
    date = d;
    clearError();
    renderForm();
    input.focus();
  }

  function clearError() {
    error.hidden = true;
    input.removeAttribute('aria-invalid');
  }

  function showError(text) {
    setText(error, text);
    error.hidden = false;
    input.setAttribute('aria-invalid', 'true');
  }

  function save() {
    const raw = input.value.trim().replace(',', '.');
    const value = Number(raw);
    const { min, max } = weightLimits(rules);
    const lo = unit() === 'lb' ? Math.ceil(lbFromKg(min)) : min;
    const hi = unit() === 'lb' ? Math.floor(lbFromKg(max)) : max;
    if (raw === '') return showError('Type your weight.');
    if (!Number.isFinite(value) || value < lo || value > hi) {
      return showError(`Type a weight from ${lo} to ${hi} ${unit()}.`);
    }
    const kg = unit() === 'lb' ? kgFromLb(value) : value;
    try {
      store.setWeight(date, kg);
    } catch {
      return showError(`Type a weight from ${lo} to ${hi} ${unit()}.`);
    }
    clearError();
    const today = store.today();
    setText(
      status,
      `Saved ${fmtWeight(kg, unit())} for ${(relativeDay(date, today) ?? fmtDateShort(date)).toLowerCase()}.`,
    );
    return undefined;
  }

  function renderList() {
    const all = [...store.weights()].reverse();
    const rows = showAll ? all : all.slice(0, SHOWN);
    const today = store.today();
    mountChildren(
      listBox,
      all.length
        ? h(
            'ul',
            { class: 'weight-list', role: 'list', 'data-testid': 'weight-list' },
            rows.map((e) =>
              h(
                'li',
                { class: 'weight-row', 'data-testid': 'weight-row', 'data-date': e.date },
                h(
                  'button',
                  {
                    type: 'button',
                    class: 'weight-row-main',
                    'data-testid': 'weight-edit',
                    'aria-label': `Change the weight for ${fmtDateShort(e.date)}`,
                    onclick: () => pickDate(e.date),
                  },
                  h(
                    'span',
                    { class: 'weight-row-date' },
                    relativeDay(e.date, today) ?? fmtDateShort(e.date),
                  ),
                  h('span', { class: 'weight-row-kg' }, fmtWeight(e.kg, unit())),
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    class: 'btn btn-quiet weight-delete',
                    'data-testid': 'weight-delete',
                    'aria-label': `Delete the weight for ${fmtDateShort(e.date)}`,
                    onclick: () => store.removeWeight(e.date),
                  },
                  'Delete',
                ),
              ),
            ),
          )
        : h('p', { class: 'field-help', 'data-testid': 'weight-empty' }, 'No weights yet.'),
      all.length > SHOWN
        ? h(
            'button',
            {
              type: 'button',
              class: 'link-btn',
              'data-testid': 'weight-show-all',
              onclick: () => {
                showAll = !showAll;
                renderList();
              },
            },
            showAll ? 'Show fewer' : `Show all ${all.length}`,
          )
        : null,
    );
    const trend = store.weightTrend();
    mountChildren(
      trendBox,
      renderWeightChart({
        points: trend.points.slice(-56),
        unit: unit(),
        showTrend: trend.showTrend,
      }),
      renderTrendLines(trend, unit(), rules, {
        onAccept: () => store.acceptWeightSuggestion(),
        onDismiss: () => store.dismissWeightSuggestion(),
      }),
    );
  }

  function update() {
    if (!el.contains(document.activeElement) || document.activeElement !== input) renderForm();
    renderList();
  }

  renderForm();
  renderList();
  const unsubscribe = store.subscribe(() => {
    if (document.activeElement !== input) renderForm();
    renderList();
  });

  return {
    el,
    update,
    destroy() {
      unsubscribe();
    },
  };
}
