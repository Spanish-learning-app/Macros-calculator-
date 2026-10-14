// QA tests for app/ui/router.js (Lena's code), written from docs/ARCHITECTURE.md §7.2.
// parseRoute and formatRoute are pure; createRouter is driven through a fake window.
// Owner: Kenji.
import assert from 'node:assert/strict';
import { parseRoute, formatRoute, createRouter } from '../../../app/ui/router.js';
import { qa } from './_helpers.js';

const day = (date = null) => ({ name: 'day', params: { date } });

/** Every route in §7.2: [hash, route]. */
const ROUTES = [
  ['#/', day()],
  ['#/day', day()],
  ['', day()],
  ['#/day/2026-10-13', day('2026-10-13')],
  ['#/day/2026-10-25', day('2026-10-25')],
  ['#/day/2026-10-13/add/lunch', { name: 'add', params: { date: '2026-10-13', slot: 'lunch' } }],
  ['#/day/2026-10-25/add/snacks', { name: 'add', params: { date: '2026-10-25', slot: 'snacks' } }],
  ['#/week', { name: 'week', params: { date: null } }],
  ['#/week/2026-10-13', { name: 'week', params: { date: '2026-10-13' } }],
  ['#/welcome', { name: 'welcome', params: {} }],
  ['#/profile', { name: 'profile', params: {} }],
  ['#/data', { name: 'data', params: {} }],
  ['#/about', { name: 'about', params: {} }],
];

/** Compares name and the defined params (an absent param equals undefined). */
function sameRoute(actual, expected, label) {
  assert.equal(actual.name, expected.name, `${label}: name`);
  for (const [k, v] of Object.entries(expected.params)) {
    assert.equal(actual.params?.[k] ?? null, v, `${label}: params.${k}`);
  }
}

qa('parseRoute covers every route in §7.2', [parseRoute], () => {
  for (const [hash, route] of ROUTES) sameRoute(parseRoute(hash), route, JSON.stringify(hash));
});

qa('parseRoute: every slot id is a valid add route', [parseRoute], () => {
  for (const slot of ['breakfast', 'lunch', 'evening', 'dinner', 'snacks']) {
    const r = parseRoute(`#/day/2026-10-14/add/${slot}`);
    assert.equal(r.name, 'add', slot);
    assert.equal(r.params.slot, slot);
    assert.equal(r.params.date, '2026-10-14');
  }
});

qa('parseRoute: bad hashes are notfound', [parseRoute], () => {
  const bad = [
    '#/nope',
    '#/days',
    '#/day/13-10-2026',
    '#/day/2026-10-13/add',
    '#/day/2026-10-13/add/brunch',
    '#/day/2026-10-13/add/lunch/extra',
    '#/day/2026-10-13/edit/lunch',
    '#/day/2026-10-13/extra',
    '#/week/abc',
    '#/week/2026-10-13/x',
    '#/profile/x',
    '#/about/team',
    '#/welcome/2',
    '#/DAY',
  ];
  for (const hash of bad) assert.equal(parseRoute(hash).name, 'notfound', hash);
});

qa('BUG-R1 (fixed): an impossible date in the hash is notfound, not a day', [parseRoute], () => {
  // '#/day/2026-13-45' parses as { name: 'day', date: '2026-13-45' }; the day view then calls
  // addDays/weekDates on it, which throw RangeError (core/dates validates dates).
  for (const hash of ['#/day/2026-13-45', '#/day/2026-02-30', '#/week/2026-00-10']) {
    assert.equal(parseRoute(hash).name, 'notfound', hash);
  }
  assert.equal(parseRoute('#/day/2026-02-30/add/lunch').name, 'notfound');
});

qa('formatRoute gives the §7.2 hashes', [formatRoute], () => {
  assert.equal(formatRoute(day('2026-10-13')), '#/day/2026-10-13');
  assert.equal(
    formatRoute({ name: 'add', params: { date: '2026-10-13', slot: 'lunch' } }),
    '#/day/2026-10-13/add/lunch',
  );
  assert.equal(formatRoute({ name: 'week', params: { date: '2026-10-13' } }), '#/week/2026-10-13');
  assert.equal(formatRoute({ name: 'week', params: { date: null } }), '#/week');
  for (const name of ['welcome', 'profile', 'data', 'about']) {
    assert.equal(formatRoute({ name, params: {} }), `#/${name}`);
  }
  assert.match(formatRoute(day()), /^#\/(day)?$/, 'today is #/ or #/day');
  for (const [, route] of ROUTES) assert.ok(formatRoute(route).startsWith('#/'));
});

qa(
  'round trips: parse(format(route)) = route and format(parse(hash)) = hash',
  [parseRoute, formatRoute],
  () => {
    for (const [hash, route] of ROUTES) {
      sameRoute(parseRoute(formatRoute(route)), route, `route of ${JSON.stringify(hash)}`);
      if (!['', '#/', '#/day'].includes(hash)) assert.equal(formatRoute(parseRoute(hash)), hash);
    }
  },
);

// ------------------------------------------------------------------ createRouter (fake window)
function fakeWindow(initialHash = '') {
  const listeners = new Map();
  const historyLog = [];
  let hash = initialHash;
  const fire = (type) => {
    for (const fn of listeners.get(type) ?? []) fn({ type });
  };
  const setHash = (value, how) => {
    const next = value.startsWith('#') || value === '' ? value : `#${value}`;
    if (next === hash) return;
    hash = next;
    historyLog.push([how, hash]);
    fire('hashchange');
  };
  const location = {
    get hash() {
      return hash;
    },
    set hash(value) {
      setHash(value, 'push');
    },
    get href() {
      return `http://localhost:4173/${hash}`;
    },
    replace(url) {
      const i = String(url).indexOf('#');
      setHash(i >= 0 ? String(url).slice(i) : '', 'replace');
    },
    assign(url) {
      const i = String(url).indexOf('#');
      setHash(i >= 0 ? String(url).slice(i) : '', 'push');
    },
  };
  const history = {
    pushState(_s, _t, url) {
      const i = String(url).indexOf('#');
      hash = i >= 0 ? String(url).slice(i) : hash;
      historyLog.push(['push', hash]);
    },
    replaceState(_s, _t, url) {
      const i = String(url).indexOf('#');
      hash = i >= 0 ? String(url).slice(i) : hash;
      historyLog.push(['replace', hash]);
    },
  };
  return {
    location,
    history,
    historyLog,
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
    },
    removeEventListener(type, fn) {
      listeners.get(type)?.delete(fn);
    },
    listenerCount: (type) => listeners.get(type)?.size ?? 0,
    userNavigates(value) {
      setHash(value, 'user');
    },
  };
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

qa('createRouter: current() parses the hash; href() is formatRoute', [createRouter], () => {
  const win = fakeWindow('#/week/2026-10-19');
  const router = createRouter(win);
  for (const key of ['current', 'go', 'href', 'subscribe', 'start', 'stop']) {
    assert.equal(typeof router[key], 'function', key);
  }
  sameRoute(router.current(), { name: 'week', params: { date: '2026-10-19' } }, 'current');
  const add = { name: 'add', params: { date: '2026-10-13', slot: 'lunch' } };
  assert.equal(router.href(add), formatRoute(add));
});

qa(
  'createRouter: go() changes the hash and subscribers hear the new route',
  [createRouter],
  async () => {
    const win = fakeWindow('#/');
    const router = createRouter(win);
    const heard = [];
    const unsubscribe = router.subscribe((route) => heard.push(route));
    router.start();
    router.go({ name: 'profile', params: {} });
    await tick();
    assert.equal(win.location.hash, '#/profile');
    sameRoute(router.current(), { name: 'profile', params: {} }, 'current after go');
    assert.ok(heard.length >= 1, 'subscriber called');
    sameRoute(heard.at(-1), { name: 'profile', params: {} }, 'heard');
    win.userNavigates('#/day/2026-10-24');
    await tick();
    sameRoute(heard.at(-1), day('2026-10-24'), 'a hash change from outside (Back button)');
    unsubscribe();
    const count = heard.length;
    win.userNavigates('#/data');
    await tick();
    assert.equal(heard.length, count, 'unsubscribed');
    router.stop();
  },
);

qa(
  'createRouter: go(route, { replace: true }) replaces the history entry',
  [createRouter],
  async () => {
    const win = fakeWindow('#/week');
    const router = createRouter(win);
    router.start();
    router.go({ name: 'welcome', params: {} }, { replace: true });
    await tick();
    assert.equal(win.location.hash, '#/welcome');
    const last = win.historyLog.at(-1);
    assert.equal(last[0], 'replace', `history: ${JSON.stringify(win.historyLog)}`);
    router.stop();
  },
);

qa('createRouter: stop() removes its listeners', [createRouter], () => {
  const win = fakeWindow('#/');
  const router = createRouter(win);
  router.start();
  const during = win.listenerCount('hashchange') + win.listenerCount('popstate');
  assert.ok(during >= 1, 'listens while started');
  router.stop();
  assert.equal(win.listenerCount('hashchange') + win.listenerCount('popstate'), 0);
});
