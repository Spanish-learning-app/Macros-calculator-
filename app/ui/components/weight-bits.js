// Weight display pieces shared by Profile and Week (Sprint 3, Meeting 005). Owner: Lena.
// kg or lb per settings.units.weight; the trend and any suggestion come from store.weightTrend()
// (core weight.js + RULES.weightTrend). A suggestion is only words: nothing changes a target.
import { h, svg } from '../dom.js';
import { lbFromKg } from '../../core/units.js';
import { fmtKcal, fmtDayMonth } from './format.js';

/** "82.4 kg" / "181.7 lb" (one decimal). */
export function fmtWeight(kg, unit = 'kg') {
  const v = unit === 'lb' ? lbFromKg(kg) : kg;
  return `${v.toFixed(1)} ${unit}`;
}

/** "−0.4 kg a week" (a real minus sign), "steady" under 0.05. */
export function fmtRate(kgPerWeek, unit = 'kg') {
  const v = unit === 'lb' ? lbFromKg(Math.abs(kgPerWeek)) : Math.abs(kgPerWeek);
  if (v < 0.05) return 'steady';
  return `${kgPerWeek < 0 ? '−' : '+'}${v.toFixed(1)} ${unit} a week`;
}

/** Fill a RULES text template: "{rate}" → values.rate. Unknown keys stay as they are. */
export function fill(template, values) {
  return String(template ?? '').replace(/\{(\w+)\}/g, (m, k) => (k in values ? values[k] : m));
}

/** "−0.4" / "+0.2" / "0.0" in kg or lb, one decimal, a real minus sign. */
function signed(kgPerWeek, unit) {
  const v = unit === 'lb' ? lbFromKg(Math.abs(kgPerWeek)) : Math.abs(kgPerWeek);
  const text = v.toFixed(1);
  if (text === '0.0') return text;
  return `${kgPerWeek < 0 ? '−' : '+'}${text}`;
}

/** The Lab's sentences say "kg"; a person who weighs in lb reads "lb". */
const inUnit = (text, unit) => (unit === 'lb' ? text.replace(/\bkg\b/g, 'lb') : text);

/**
 * The suggestion in the Lab's words (RULES.weightTrend.text.suggestion), or null. Never applied.
 * @param {object|null} suggestion from store.weightTrend() @param {number|null} weeklyRateKg
 * @param {object} rules @param {'kg'|'lb'} [unit]
 */
export function suggestionText(suggestion, weeklyRateKg, rules, unit = 'kg') {
  const t = rules?.weightTrend?.text;
  if (!suggestion || !t?.suggestion || weeklyRateKg === null) return null;
  const change = suggestion.kcalPerDay;
  // Bilal R3: when the rails cap the change (−100 kcal against a ~440 kcal gap), the sentence says
  // it is a step toward the goal, not a match. The Lab may write `text.suggestionStep`.
  const perKg = rules?.energy?.kcalPerKgBodyWeight ?? 7700;
  const full = Number.isFinite(suggestion.differenceKgPerWeek)
    ? Math.abs((suggestion.differenceKgPerWeek * perKg) / 7)
    : 0;
  const partial = full > 0 && Math.abs(change) < full * 0.75;
  const words = partial
    ? (t.suggestionStep ??
      t.suggestion.replace(/To match your goal,?\s*/i, 'As a step toward your goal, '))
    : t.suggestion;
  return inUnit(
    fill(words, {
      rate: signed(weeklyRateKg, unit),
      goal: signed(suggestion.expectedKgPerWeek, unit),
      newKcal: fmtKcal(suggestion.newKcal),
      change: `${change < 0 ? '−' : '+'}${fmtKcal(Math.abs(change))}`,
    }),
    unit,
  );
}

/**
 * "Trend 82.1 kg" once RULES.weightTrend.display is met, else the latest reading; the rate
 * sentence (text.rate) once there is a rate; text.tooFew before the trend shows.
 * @returns {{ summary: string|null, rate: string|null, tooFew: string|null }}
 */
export function trendTexts(trend, rules, unit = 'kg') {
  const t = rules?.weightTrend?.text ?? {};
  const last = trend.latest;
  if (!last) return { summary: null, rate: null, tooFew: null };
  const showTrend = trend.ready && trend.showTrend && last.trendKg !== null;
  const summary = showTrend
    ? `Trend ${fmtWeight(last.trendKg, unit)} · latest ${fmtWeight(last.kg, unit)}`
    : `Latest ${fmtWeight(last.kg, unit)}`;
  const rate =
    showTrend && trend.weeklyRateKg !== null && t.rate
      ? inUnit(
          fill(t.rate, { rate: signed(trend.weeklyRateKg, unit), weeks: trend.rateWeeks }),
          unit,
        )
      : null;
  const tooFew =
    trend.ready && !showTrend && t.tooFew ? fill(t.tooFew, { n: trend.needEntries }) : null;
  return { summary, rate, tooFew };
}

/**
 * A small line chart: readings as dots, the smoothed trend as a line (when RULES has the rule).
 * One series, so no legend: the caption names it. The list next to it is the table view.
 * @param {{ points: { date: string, kg: number, trendKg: number|null }[], unit?: string,
 *   showTrend?: boolean, width?: number, height?: number }} props
 * @returns {Element|null} null under 2 readings
 */
export function renderWeightChart({
  points,
  unit = 'kg',
  showTrend = true,
  width = 320,
  height = 120,
}) {
  if (!points || points.length < 2) return null;
  const pad = { l: 40, r: 8, t: 8, b: 20 };
  const day = (iso) => Date.UTC(...iso.split('-').map((n, i) => Number(n) - (i === 1 ? 1 : 0)));
  const x0 = day(points[0].date);
  const x1 = day(points.at(-1).date);
  const conv = (kg) => (unit === 'lb' ? lbFromKg(kg) : kg);
  const values = points.flatMap((p) => [p.kg, p.trendKg ?? p.kg]).map(conv);
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  if (hi - lo < 1) {
    const mid = (hi + lo) / 2;
    lo = mid - 0.5;
    hi = mid + 0.5;
  }
  const X = (iso) => pad.l + ((day(iso) - x0) / Math.max(1, x1 - x0)) * (width - pad.l - pad.r);
  const Yd = (v) => pad.t + ((hi - v) / (hi - lo)) * (height - pad.t - pad.b);
  const Y = (kg) => Yd(conv(kg));
  const yTicks = [hi, lo];
  const trend = showTrend ? points.filter((p) => p.trendKg !== null) : [];
  return svg(
    'svg',
    {
      class: 'weight-chart',
      viewBox: `0 0 ${width} ${height}`,
      role: 'img',
      'aria-label': `Weight from ${fmtDayMonth(points[0].date)} to ${fmtDayMonth(points.at(-1).date)}: ${points.length} readings`,
      'data-testid': 'weight-chart',
    },
    ...yTicks.map((v) =>
      svg(
        'g',
        null,
        svg('line', {
          class: 'wc-grid',
          x1: pad.l,
          x2: width - pad.r,
          y1: Yd(v),
          y2: Yd(v),
        }),
      ),
    ),
    ...yTicks.map((v, i) =>
      svg(
        'text',
        {
          class: 'wc-axis',
          x: pad.l - 6,
          y: i === 0 ? pad.t + 10 : height - pad.b,
          'text-anchor': 'end',
        },
        v.toFixed(1),
      ),
    ),
    svg('text', { class: 'wc-axis', x: pad.l, y: height - 4 }, fmtDayMonth(points[0].date)),
    svg(
      'text',
      { class: 'wc-axis', x: width - pad.r, y: height - 4, 'text-anchor': 'end' },
      fmtDayMonth(points.at(-1).date),
    ),
    ...points.map((p) =>
      svg(
        'circle',
        { class: 'wc-dot', cx: X(p.date), cy: Y(p.kg), r: 3.5 },
        svg('title', null, `${fmtDayMonth(p.date)}: ${fmtWeight(p.kg, unit)}`),
      ),
    ),
    trend.length > 1
      ? svg('polyline', {
          class: 'wc-trend',
          points: trend.map((p) => `${X(p.date).toFixed(1)},${Y(p.trendKg).toFixed(1)}`).join(' '),
        })
      : null,
  );
}

/**
 * The trend lines for Profile and Week. With `onAccept`/`onDismiss` (Profile only), a suggestion
 * shows with "Use {newKcal} kcal" and "Not now"; the target changes only on that tap.
 * @param {object} trend store.weightTrend() @param {'kg'|'lb'} unit @param {object} rules
 * @param {{ onAccept?: () => void, onDismiss?: () => void }} [actions]
 */
export function renderTrendLines(trend, unit, rules, actions = {}) {
  const { summary, rate, tooFew } = trendTexts(trend, rules, unit);
  const t = rules?.weightTrend?.text ?? {};
  const advice = actions.onAccept
    ? suggestionText(trend.suggestion, trend.weeklyRateKg, rules, unit)
    : null;
  return [
    summary ? h('p', { class: 'weight-trend', 'data-testid': 'weight-trend' }, summary) : null,
    rate ? h('p', { class: 'weight-rate', 'data-testid': 'weight-rate' }, rate) : null,
    tooFew ? h('p', { class: 'field-help', 'data-testid': 'weight-too-few' }, tooFew) : null,
    advice
      ? h(
          'div',
          { class: 'weight-suggestion', role: 'group', 'data-testid': 'weight-suggestion' },
          h('p', null, advice),
          h(
            'div',
            { class: 'weight-suggestion-actions' },
            h(
              'button',
              {
                type: 'button',
                class: 'btn btn-primary',
                'data-testid': 'weight-suggestion-accept',
                onclick: actions.onAccept,
              },
              fill(t.accept ?? 'Use {newKcal} kcal', {
                newKcal: fmtKcal(trend.suggestion.newKcal),
              }),
            ),
            h(
              'button',
              {
                type: 'button',
                class: 'btn btn-quiet',
                'data-testid': 'weight-suggestion-dismiss',
                onclick: actions.onDismiss,
              },
              t.dismiss ?? 'Not now',
            ),
          ),
        )
      : null,
  ];
}
