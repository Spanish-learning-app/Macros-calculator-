// Author's own tests for app/ui/router.js (owner: Lena; Kenji tests the router independently).
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRoute, formatRoute, createRouter } from '../../../app/ui/router.js';

test('parseRoute covers every route in ARCHITECTURE §7.2', () => {
  assert.deepEqual(parseRoute(''), { name: 'day', params: { date: null } });
  assert.deepEqual(parseRoute('#/'), { name: 'day', params: { date: null } });
  assert.deepEqual(parseRoute('#/day'), { name: 'day', params: { date: null } });
  assert.deepEqual(parseRoute('#/day/2026-10-25'), { name: 'day', params: { date: '2026-10-25' } });
  assert.deepEqual(parseRoute('#/day/2026-10-25/add/lunch'), {
    name: 'add',
    params: { date: '2026-10-25', slot: 'lunch' },
  });
  assert.deepEqual(parseRoute('#/week'), { name: 'week', params: { date: null } });
  assert.deepEqual(parseRoute('#/week/2026-10-19'), {
    name: 'week',
    params: { date: '2026-10-19' },
  });
  for (const name of ['welcome', 'profile', 'data', 'about']) {
    assert.deepEqual(parseRoute(`#/${name}`), { name, params: {} });
  }
});

test('bad hashes are notfound', () => {
  for (const hash of [
    '#/nope',
    '#/day/26-10-2026',
    '#/day/2026-10-25/add/brunch',
    '#/day/2026-10-25/add',
    '#/week/2026-10-25/extra',
    '#/profile/x',
  ]) {
    assert.equal(parseRoute(hash).name, 'notfound', hash);
  }
});

test('formatRoute and parseRoute round-trip', () => {
  const routes = [
    { name: 'day', params: { date: null } },
    { name: 'day', params: { date: '2026-10-14' } },
    { name: 'add', params: { date: '2026-10-14', slot: 'snacks' } },
    { name: 'week', params: { date: null } },
    { name: 'week', params: { date: '2026-10-19' } },
    { name: 'welcome', params: {} },
    { name: 'profile', params: {} },
    { name: 'data', params: {} },
    { name: 'about', params: {} },
  ];
  for (const route of routes) assert.deepEqual(parseRoute(formatRoute(route)), route);
});

function fakeWindow(hash = '') {
  const handlers = new Set();
  const win = {
    location: {
      get hash() {
        return hash;
      },
      set hash(value) {
        hash = value;
        for (const h of handlers) h();
      },
    },
    history: { replaceState: (state, title, url) => (hash = url) },
    addEventListener: (type, h) => type === 'hashchange' && handlers.add(h),
    removeEventListener: (type, h) => handlers.delete(h),
  };
  return win;
}

test('createRouter: go() changes the hash and notifies; replace notifies without history', () => {
  const win = fakeWindow('#/day');
  const router = createRouter(win);
  const seen = [];
  router.subscribe((r) => seen.push(r.name));
  router.start();
  router.go({ name: 'week', params: { date: null } });
  assert.equal(win.location.hash, '#/week');
  router.go({ name: 'welcome', params: {} }, { replace: true });
  assert.equal(win.location.hash, '#/welcome');
  router.go({ name: 'welcome', params: {} }); // same hash: still notifies (re-render)
  assert.deepEqual(seen, ['week', 'welcome', 'welcome']);
  router.stop();
  win.location.hash = '#/data';
  assert.equal(seen.length, 3, 'no events after stop()');
  assert.equal(router.current().name, 'data');
});
