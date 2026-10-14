// Hash router. parseRoute/formatRoute are pure (Node-testable); createRouter binds to a window.
// Owner: Lena. Contract: docs/ARCHITECTURE.md §7.2.
import { SLOT_IDS } from '../core/days.js';
import { isISODate } from '../core/dates.js';

/** @typedef {{ name: string, params: { date?: string|null, slot?: string } }} Route */

export const ROUTE_NAMES = Object.freeze([
  'welcome',
  'day',
  'add',
  'week',
  'prep',
  'profile',
  'data',
  'about',
  'notfound',
]);

/**
 * '#/', '' -> day (date null = today). '#/day/D', '#/day/D/add/SLOT', '#/week[/D]', '#/welcome',
 * '#/prep', '#/profile', '#/data', '#/about'. Anything else -> notfound.
 * @param {string} hash @returns {Route}
 */
export function parseRoute(hash) {
  let parts;
  try {
    parts = String(hash || '')
      .replace(/^#\/?/, '')
      .split('/')
      .filter(Boolean)
      .map((p) => decodeURIComponent(p));
  } catch {
    return { name: 'notfound', params: {} }; // a malformed escape such as '%E0'
  }
  const [head, date, sub, slot] = parts;
  const okDate = (d) => d === undefined || isISODate(d); // a real date only (BUG-R1: 2026-02-30)

  if (parts.length === 0) return { name: 'day', params: { date: null } };
  if (head === 'day' && okDate(date)) {
    if (parts.length <= 2) return { name: 'day', params: { date: date ?? null } };
    if (parts.length === 4 && sub === 'add' && date && SLOT_IDS.includes(slot)) {
      return { name: 'add', params: { date, slot } };
    }
  }
  if (head === 'week' && parts.length <= 2 && okDate(date)) {
    return { name: 'week', params: { date: date ?? null } };
  }
  if (parts.length === 1 && ['welcome', 'prep', 'profile', 'data', 'about'].includes(head)) {
    return { name: head, params: {} };
  }
  return { name: 'notfound', params: {} };
}

/** @param {Route} route @returns {string} hash beginning with '#/' */
export function formatRoute(route) {
  const { name, params = {} } = route;
  switch (name) {
    case 'day':
      return params.date ? `#/day/${params.date}` : '#/day';
    case 'add':
      return `#/day/${params.date}/add/${params.slot}`;
    case 'week':
      return params.date ? `#/week/${params.date}` : '#/week';
    case 'welcome':
    case 'prep':
    case 'profile':
    case 'data':
    case 'about':
      return `#/${name}`;
    default:
      return '#/';
  }
}

/**
 * @param {Window} win
 * @returns {{ current(): Route, go(route: Route, options?: { replace?: boolean }): void,
 *   href(route: Route): string, subscribe(fn: (route: Route) => void): () => void,
 *   start(): void, stop(): void }}
 */
export function createRouter(win) {
  const listeners = new Set();
  const current = () => parseRoute(win.location.hash);
  const notify = () => {
    const route = current();
    for (const fn of listeners) fn(route);
  };
  return {
    current,
    href: formatRoute,
    go(route, { replace = false } = {}) {
      const hash = formatRoute(route);
      if (replace) {
        win.history.replaceState(null, '', hash);
        notify();
      } else if (win.location.hash === hash) {
        notify();
      } else {
        win.location.hash = hash;
      }
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    start() {
      win.addEventListener('hashchange', notify);
    },
    stop() {
      win.removeEventListener('hashchange', notify);
    },
  };
}
