// Priya's view harness (never published): the same shell and view mounting as app/main.js, with a
// fake store (or the real one once the core lands), a fake clock and seeded starting states.
// Open http://localhost:4173/ui/dev/index.html?state=day&time=2026-10-13T18:00#/day
import { createRouter } from '../router.js';
import { h } from '../dom.js';
import { createFakeStore } from './fake-store.js';

const params = new URLSearchParams(window.location.search);
const P1 = {
  sex: 'male',
  ageYears: 31,
  heightCm: 178,
  weightKg: 82,
  activity: 'moderate',
  goal: 'lose',
  rateKgPerWeek: 0.5,
  lifts: true,
  healthFlags: [],
};

const VIEW_FOR_ROUTE = {
  day: 'day',
  add: 'day',
  week: 'week',
  welcome: 'welcome',
  profile: 'profile',
  data: 'data',
  about: 'about',
};

const NAV = [
  { name: 'day', label: 'Day' },
  { name: 'week', label: 'Week' },
  { name: 'profile', label: 'Profile' },
  { name: 'data', label: 'Data' },
];

async function loadData() {
  const rules = (await import('../../data/rules.js')).default;
  if (params.get('data') === 'real') {
    const mod = await import('../../data/index.js');
    return { rules: mod.RULES, foods: mod.FOODS };
  }
  const foods = (await import('./fixture-foods.js')).default;
  return { rules, foods };
}

function clock() {
  const t = params.get('time');
  if (!t) return () => new Date();
  const base = new Date(t).getTime();
  const t0 = Date.now();
  return () => new Date(base + (Date.now() - t0));
}

const pad = (n) => String(n).padStart(2, '0');
const shift = (s, n) => {
  const [y, m, d] = s.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
};

/** Food ids per role: [fixture id, serving] and [real id, serving]. */
const ROLES = {
  chai: [
    ['pk-chai-doodh-patti-home-fx', 'cup'],
    ['pk-chai-doodh-patti-1tsp', 'cup'],
  ],
  roti: [
    ['pk-roti-home-fx', 'medium'],
    ['pk-roti', 'roti'],
  ],
  daal: [
    ['pk-daal-masoor-home-fx', 'katori'],
    ['pk-masoor-daal-home', 'katori'],
  ],
  rice: [
    ['pk-rice-plain-fx', 'katori'],
    ['pk-rice-plain', 'katori'],
  ],
  karahi: [
    ['pk-chicken-karahi-home-fx', 'katori'],
    ['pk-chicken-karahi-home', 'katori'],
  ],
  karahiOut: [
    ['pk-chicken-karahi-restaurant-fx', 'katori'],
    ['pk-chicken-karahi-restaurant', 'katori'],
  ],
  coffee: [
    ['es-cafe-con-leche-fx', 'cup'],
    ['es-cafe-con-leche', 'taza'],
  ],
  bread: [
    ['es-pa-amb-tomaquet-fx', 'slice'],
    ['es-croissant', 'medium'],
  ],
  egg: [
    ['intl-egg-boiled-fx', 'egg'],
    ['intl-egg-boiled', 'egg'],
  ],
  box: [
    ['pk-chicken-tikka-rice-box-fx', 'box'],
    ['pk-chicken-tikka-rice-box', 'box'],
  ],
  banana: [
    ['intl-banana-fx', 'medium'],
    ['intl-banana', 'medium'],
  ],
  whey: [
    ['intl-whey-protein-fx', 'scoop'],
    ['intl-whey-protein', 'scoop'],
  ],
};

function seed(store, state, real) {
  if (state === 'fresh') return;
  if (state === 'skip') {
    store.skipOnboarding();
    return;
  }
  store.completeOnboarding(P1);
  const today = store.today();
  const yesterday = shift(today, -1);
  const add = (date, slot, role, qty, status) => {
    const [foodId, servingId] = ROLES[role][real ? 1 : 0];
    store.addFood({ date, slot, foodId, servingId, qty, status });
  };
  if (state === 'warm' || state === 'day' || state === 'week') {
    add(yesterday, 'breakfast', 'chai', 1);
    add(yesterday, 'breakfast', 'roti', 1);
    add(yesterday, 'lunch', 'daal', 1);
    add(yesterday, 'lunch', 'rice', 1);
    add(yesterday, 'dinner', 'karahi', 1.5);
    add(yesterday, 'dinner', 'roti', 2);
  }
  if (state === 'day' || state === 'week') {
    add(today, 'breakfast', 'coffee', 1);
    add(today, 'breakfast', 'bread', real ? 1 : 2);
    add(today, 'breakfast', 'egg', 2);
    add(today, 'lunch', 'box', 1);
    add(today, 'lunch', 'banana', 1);
    add(today, 'evening', 'chai', 1);
    add(today, 'evening', 'whey', 1);
    add(today, 'dinner', 'karahiOut', 1.5, 'planned');
    add(today, 'dinner', 'roti', 2, 'planned');
    add(today, 'dinner', 'daal', 0.5, 'planned');
    store.quickAdd({
      date: today,
      slot: 'snacks',
      name: 'Wedding dessert (guess)',
      nutrients: { kcal: 320, protein: 5 },
      status: 'planned',
    });
  }
  if (state === 'week') {
    for (let i = 2; i < 12; i += 1) {
      if (i % 3 === 0) continue;
      const d = shift(today, -i);
      add(d, 'breakfast', 'chai', 1);
      add(d, 'lunch', 'box', 1);
      add(d, 'dinner', 'karahi', 1 + (i % 2));
      add(d, 'dinner', 'roti', 2);
    }
  }
  store.dismissUndo();
}

function applyTheme(theme) {
  if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
  else delete document.documentElement.dataset.theme;
}

async function boot() {
  const { rules, foods } = await loadData();
  const now = clock();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const storageStatus = params.get('storage') ?? 'ok';
  let store;
  if (params.get('store') === 'real') {
    // Lena's store on Hamza's core. Until core/storage.js lands, persistence is a stand-in that
    // hands over a fresh document (fake defaultData) and accepts saves.
    const { createStore } = await import('../store.js');
    const { fakeDefaultData } = await import('./fake-store.js');
    let n = 0;
    store = createStore({
      persistence: {
        load: () => ({ data: fakeDefaultData({ timeZone, rules }), status: 'ok' }),
        save: () => ({ ok: true }),
      },
      rules,
      foods,
      now,
      makeId: () => `dev-${(n += 1)}`,
      timeZone,
    });
  } else {
    store = createFakeStore({ rules, foods, now, timeZone, storageStatus });
  }
  seed(store, params.get('state') ?? 'day', params.get('data') === 'real');
  if (params.get('theme')) store.updateSettings({ theme: params.get('theme') });

  const router = createRouter(window);
  const banner = h('div', { class: 'storage-banner', role: 'status', hidden: true });
  const view = h('section', { class: 'shell-view', id: 'view' });
  const nav = h(
    'nav',
    { class: 'shell-nav', 'aria-label': 'Main' },
    NAV.map((item) =>
      h(
        'a',
        { href: router.href({ name: item.name, params: {} }), 'data-route': item.name },
        item.label,
      ),
    ),
  );
  const root = document.getElementById('app');
  root.replaceChildren(
    h(
      'header',
      { class: 'shell-header' },
      h('h1', { class: 'shell-brand' }, 'Katori'),
      h('p', { class: 'shell-tagline' }, 'Your daily meal & macro planner that knows desi food.'),
    ),
    banner,
    h('main', { class: 'shell-main', id: 'main' }, view),
    nav,
  );

  const sync = (state) => {
    applyTheme(state.data.settings?.theme);
    const kind = ['unavailable', 'corrupt', 'future'].includes(state.storageStatus)
      ? state.storageStatus
      : null;
    banner.hidden = !kind;
    banner.dataset.kind = kind ?? '';
    banner.textContent = kind
      ? {
          unavailable: 'Not saved on this device. Export your data from Data to keep it.',
          corrupt:
            'Saved data could not be read, so Katori started fresh. A copy was kept on this device.',
          future:
            'This data was saved by a newer version of Katori. Changes here will not be saved.',
        }[kind]
      : '';
  };
  store.subscribe(sync);
  sync(store.getState());

  let current = { name: null, handle: null };
  async function show(route) {
    root.dataset.route = route.name;
    const active = route.name === 'add' ? 'day' : route.name;
    for (const link of nav.querySelectorAll('a')) {
      if (link.dataset.route === active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    if (route.name === 'notfound') {
      router.go({ name: 'day', params: { date: null } }, { replace: true });
      return;
    }
    if (['day', 'add', 'week'].includes(route.name) && store.needsOnboarding()) {
      router.go({ name: 'welcome', params: {} }, { replace: true });
      return;
    }
    const name = VIEW_FOR_ROUTE[route.name];
    if (current.name === name && current.handle) {
      current.handle.update(route);
      return;
    }
    current.handle?.unmount();
    const mod = await import(`../views/${name}.js`);
    current = { name, handle: mod.mount(view, { store, router, rules }) };
    current.handle.update(route);
  }
  router.subscribe(show);
  router.start();
  show(router.current());

  window.katoriDev = { store, router, rules, foods };
  if (params.get('panel') !== '0') {
    const states = ['fresh', 'skip', 'setup', 'warm', 'day', 'week'];
    document.body.append(
      h(
        'details',
        { class: 'dev-panel' },
        h('summary', null, 'dev'),
        h(
          'p',
          null,
          states.map((s) => {
            const p = new URLSearchParams(params);
            p.set('state', s);
            return h('a', { href: `?${p}${window.location.hash}` }, s, ' ');
          }),
        ),
        h(
          'p',
          null,
          ['light', 'dark', 'system'].map((t) =>
            h('button', { type: 'button', onclick: () => store.updateSettings({ theme: t }) }, t),
          ),
        ),
      ),
    );
  }
}

boot();
