// Inline SVG icons and the household-measure drawings (katori sizes, plate, cup, glass, spoon,
// box, roti). Owner: Priya. Icons are decorative (aria-hidden); every control also has a name.
import { svg } from '../dom.js';

const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': 2,
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
};

function icon(size, ...children) {
  return svg(
    'svg',
    {
      class: 'icon',
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      'aria-hidden': 'true',
      focusable: 'false',
    },
    ...children,
  );
}

const PATHS = {
  plus: ['M12 5v14', 'M5 12h14'],
  minus: ['M5 12h14'],
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  chevronLeft: ['M15 5l-7 7 7 7'],
  chevronRight: ['M9 5l7 7-7 7'],
  chevronDown: ['M6 9l6 6 6-6'],
  close: ['M6 6l12 12', 'M18 6L6 18'],
  search: ['M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z', 'M20 20l-4.8-4.8'],
  copy: ['M8 8h11v11H8z', 'M5 16V5h11'],
  trash: ['M4 7h16', 'M9 7V4h6v3', 'M6 7l1 13h10l1-13'],
  calendar: ['M4 6h16v14H4z', 'M4 10h16', 'M8 3v5', 'M16 3v5'],
  info: ['M12 11v6', 'M12 7.5v.5', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z'],
  back: ['M19 12H5', 'M11 6l-6 6 6 6'],
};

/**
 * @param {keyof typeof PATHS | 'more' | 'circle' | 'circleCheck' | 'circleDashed'} name
 * @param {number} [size]
 */
export function iconEl(name, size = 20) {
  if (name === 'more') {
    return icon(
      size,
      ...[6, 12, 18].map((cx) => svg('circle', { cx, cy: 12, r: 1.8, fill: 'currentColor' })),
    );
  }
  if (name === 'circleCheck') {
    return icon(
      size,
      svg('circle', { cx: 12, cy: 12, r: 10, fill: 'currentColor' }),
      svg('path', { ...STROKE, d: 'M7 12.5l3.2 3.2L17 9', stroke: 'var(--accent-text)' }),
    );
  }
  if (name === 'circleDashed') {
    return icon(
      size,
      svg('circle', { ...STROKE, cx: 12, cy: 12, r: 9.5, 'stroke-dasharray': '3.2 3' }),
    );
  }
  return icon(size, ...(PATHS[name] ?? []).map((d) => svg('path', { ...STROKE, d })));
}

// ------------------------------------------------------------------ household-measure drawings

function drawing(w, h, title, ...children) {
  return svg(
    'svg',
    {
      class: 'measure',
      width: w,
      height: h,
      viewBox: `0 0 ${w} ${h}`,
      'aria-hidden': 'true',
      focusable: 'false',
    },
    svg('title', null, title),
    ...children,
  );
}

/** A katori (bowl) drawn at its relative size: small 155 ml, medium 200 ml, large 360 ml. */
function katori(scale) {
  const w = Math.round(30 * scale);
  const hgt = Math.round(18 * scale);
  return drawing(
    34,
    24,
    'katori',
    svg('path', {
      d: `M${17 - w / 2} ${22 - hgt} h${w} q0 ${hgt} ${-w / 2} ${hgt} q${-w / 2} 0 ${-w / 2} ${-hgt}z`,
      fill: 'var(--measure-fill)',
      stroke: 'currentColor',
      'stroke-width': 1.6,
      'stroke-linejoin': 'round',
    }),
    svg('path', {
      d: `M${17 - w / 2 - 1} ${22 - hgt} h${w + 2}`,
      stroke: 'currentColor',
      'stroke-width': 2,
      'stroke-linecap': 'round',
    }),
  );
}

const DRAW = {
  'katori-small': () => katori(0.62),
  katori: () => katori(0.8),
  'katori-large': () => katori(1),
  plate: () =>
    drawing(
      34,
      24,
      'plate',
      svg('ellipse', {
        cx: 17,
        cy: 15,
        rx: 15,
        ry: 5.5,
        fill: 'var(--measure-fill)',
        stroke: 'currentColor',
        'stroke-width': 1.6,
      }),
      svg('ellipse', {
        cx: 17,
        cy: 14,
        rx: 8,
        ry: 2.6,
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': 1.2,
      }),
    ),
  cup: () =>
    drawing(
      34,
      24,
      'cup',
      svg('path', {
        d: 'M8 6h15l-1.5 13a2 2 0 0 1-2 1.8h-8a2 2 0 0 1-2-1.8z',
        fill: 'var(--measure-fill)',
        stroke: 'currentColor',
        'stroke-width': 1.6,
        'stroke-linejoin': 'round',
      }),
      svg('path', {
        d: 'M23 9h2.5a3 3 0 0 1 0 6H22',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': 1.6,
      }),
    ),
  glass: () =>
    drawing(
      34,
      24,
      'glass',
      svg('path', {
        d: 'M11 3h12l-1.6 18.5h-8.8z',
        fill: 'var(--measure-fill)',
        stroke: 'currentColor',
        'stroke-width': 1.6,
        'stroke-linejoin': 'round',
      }),
    ),
  spoon: () =>
    drawing(
      34,
      24,
      'spoon',
      svg('ellipse', {
        cx: 9,
        cy: 12,
        rx: 6,
        ry: 4,
        fill: 'var(--measure-fill)',
        stroke: 'currentColor',
        'stroke-width': 1.6,
      }),
      svg('path', {
        d: 'M15 12h16',
        stroke: 'currentColor',
        'stroke-width': 2.2,
        'stroke-linecap': 'round',
      }),
    ),
  box: () =>
    drawing(
      34,
      24,
      'lunch box',
      svg('rect', {
        x: 4,
        y: 8,
        width: 26,
        height: 13,
        rx: 2.5,
        fill: 'var(--measure-fill)',
        stroke: 'currentColor',
        'stroke-width': 1.6,
      }),
      svg('path', {
        d: 'M3 8h28M14 5h6',
        stroke: 'currentColor',
        'stroke-width': 1.8,
        'stroke-linecap': 'round',
      }),
    ),
  roti: (scale) =>
    drawing(
      34,
      24,
      'roti',
      svg('circle', {
        cx: 17,
        cy: 12,
        r: 10.5 * scale,
        fill: 'var(--measure-fill)',
        stroke: 'currentColor',
        'stroke-width': 1.6,
      }),
      svg('circle', { cx: 14, cy: 10, r: 1.2 * scale, fill: 'currentColor', opacity: 0.45 }),
      svg('circle', { cx: 20, cy: 14, r: 1 * scale, fill: 'currentColor', opacity: 0.45 }),
    ),
};

/**
 * The drawing for a serving, when there is a household picture for it; otherwise null.
 * @param {{ id: string }} serving @param {{ group?: string }} [food]
 * @returns {SVGElement|null}
 */
export function measureDrawing(serving, food = {}) {
  const id = serving?.id ?? '';
  if (DRAW[id] && id !== 'roti') return DRAW[id]();
  if (/^(mug|taza|small-cup|cup-)/.test(id)) return DRAW.cup();
  if (id === 'half-plate') return DRAW.plate();
  if (id === 'tbsp' || id === 'tsp') return DRAW.spoon();
  if (id === 'bottle' || id.startsWith('glass')) return DRAW.glass();
  if (id === 'half-box') return DRAW.box();
  const roti = { 'roti-small': 0.7, roti: 0.85, 'roti-large': 1 }[id];
  if (roti) return DRAW.roti(roti);
  if (food.group === 'bread' && /^(small|medium|large)$/.test(id)) {
    return DRAW.roti({ small: 0.7, medium: 0.85, large: 1 }[id]);
  }
  return null;
}
