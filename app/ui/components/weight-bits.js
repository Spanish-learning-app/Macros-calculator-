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

/** One calm sentence for a suggestion (never applied by the app), or null. */
export function suggestionText(suggestion) {
  if (!suggestion) return null;
  const n = Math.abs(suggestion.kcalPerDay);
  const way = suggestion.kcalPerDay < 0 ? 'less' : 'more';
  const why =
    suggestion.differenceKgPerWeek > 0
      ? 'Your weight trend is higher than your goal’s pace.'
      : 'Your weight trend is lower than your goal’s pace.';
  return `${why} If you like, try about ${fmtKcal(n)} kcal ${way} a day (${fmtKcal(suggestion.newKcal)} kcal). You can change your target in Profile.`;
}

/** "Trend 82.1 kg · −0.4 kg a week" or the latest reading while there is no trend. */
export function trendSummary(trend, unit = 'kg') {
  const last = trend.latest;
  if (!last) return null;
  if (trend.ready && last.trendKg !== null) {
    const rate = trend.weeklyRateKg === null ? null : fmtRate(trend.weeklyRateKg, unit);
    return `Trend ${fmtWeight(last.trendKg, unit)}${rate ? ` · ${rate}` : ''}`;
  }
  return `Latest ${fmtWeight(last.kg, unit)}`;
}

/**
 * A small line chart: readings as dots, the smoothed trend as a line (when RULES has the rule).
 * One series, so no legend: the caption names it. The list next to it is the table view.
 * @param {{ points: { date: string, kg: number, trendKg: number|null }[], unit?: string,
 *   width?: number, height?: number }} props
 * @returns {Element|null} null under 2 readings
 */
export function renderWeightChart({ points, unit = 'kg', width = 320, height = 120 }) {
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
  const trend = points.filter((p) => p.trendKg !== null);
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

/** The trend sentence plus the suggestion line (Profile and Week). */
export function renderTrendLines(trend, unit) {
  const summary = trendSummary(trend, unit);
  const advice = suggestionText(trend.suggestion);
  return [
    summary ? h('p', { class: 'weight-trend', 'data-testid': 'weight-trend' }, summary) : null,
    advice
      ? h('p', { class: 'weight-suggestion', 'data-testid': 'weight-suggestion' }, advice)
      : null,
  ];
}
