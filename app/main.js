// Katori boot and integration. Owner: Lena. Contract: docs/ARCHITECTURE.md §7.1.
// Loads the food data, opens storage, creates the store and the router, and mounts one view per
// route. Every step degrades instead of failing: no data, no storage or a missing view still
// leaves a working shell.
import { createRouter } from './ui/router.js';
import { createStore } from './ui/store.js';
import { createPersistence } from './core/storage.js';
import { localDateTime } from './core/dates.js';
import { tabIcon, katoriMark } from './ui/components/icons.js';

const NAV = [
  { name: 'day', label: 'Day' },
  { name: 'week', label: 'Week' },
  { name: 'prep', label: 'Prep' },
  { name: 'profile', label: 'Profile' },
  { name: 'data', label: 'Data' },
];

/** Route name -> view module in ./ui/views/ (the add sheet lives inside the day view). */
const VIEW_FOR_ROUTE = {
  day: 'day',
  add: 'day',
  week: 'week',
  prep: 'prep',
  welcome: 'welcome',
  profile: 'profile',
  data: 'data',
  about: 'about',
};

/** Routes that need a finished (or skipped) onboarding. */
const NEEDS_ONBOARDING = new Set(['day', 'add', 'week', 'prep']);

const BANNER_TEXT = {
  unavailable: 'Not saved on this device. Export your data from Data to keep it.',
  corrupt: 'Saved data could not be read, so Katori started fresh. A copy was kept on this device.',
  future: 'This data was saved by a newer version of Katori. Changes here will not be saved.',
  quota: 'Storage on this device is full. Export your data from Data to keep it.',
  foods: 'Food data is not available yet.',
};

// ------------------------------------------------------------------ platform helpers

/** Food data module; never throws. */
async function loadFoodData() {
  try {
    const mod = await import('./data/index.js');
    return {
      status: 'ok',
      rules: mod.RULES ?? null,
      foods: Array.isArray(mod.FOODS) ? mod.FOODS : [],
      library: await loadLibrary(),
      plans: await loadPlans(),
    };
  } catch (error) {
    console.error('Katori: food data could not be loaded.', error);
    return { status: 'missing', rules: null, foods: [] };
  }
}

/** Lab library recipes (ARCHITECTURE §13.1); optional, so a missing file is not an error. */
async function loadLibrary() {
  try {
    const mod = await import('./data/recipes-mealprep.js');
    const list = Array.isArray(mod.default) ? mod.default : Object.values(mod).find(Array.isArray);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** Lab weekly plans and ready picks (STATUS O7); optional, so a missing file is not an error. */
async function loadPlans() {
  try {
    const mod = await import('./data/plans-mealprep.js');
    return { plans: mod.PLANS ?? [], readyPicks: mod.READY_PICKS ?? {} };
  } catch {
    return null;
  }
}

/** window.localStorage, or null when even touching it throws (privacy modes, some Artifacts). */
function storageBackend() {
  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

function idMaker() {
  if (typeof crypto?.randomUUID === 'function') return () => crypto.randomUUID();
  let n = 0;
  const seed = Date.now().toString(36);
  return () => `${seed}-${(n += 1).toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function deviceTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  } catch {
    return null;
  }
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  node.append(...children);
  return node;
}

// ------------------------------------------------------------------ shell

function renderShell(root, router) {
  const banner = el('div', { class: 'storage-banner', role: 'status', hidden: '' });
  // Food-data status for tests and debugging (Kenji's smoke spec); not shown to users.
  const dataStatus = el('p', { 'data-testid': 'data-status', hidden: '' }, 'Loading foods…');
  const view = el('section', { class: 'shell-view', id: 'view' });
  const nav = el(
    'nav',
    { class: 'shell-nav', 'aria-label': 'Main' },
    // Icon plus label (Meeting 004 B3, Priya): the icon fills and sits in a pill when active.
    ...NAV.map((item) =>
      el(
        'a',
        { href: router.href({ name: item.name, params: {} }), 'data-route': item.name },
        el('span', { class: 'tab-pill' }, tabIcon(item.name)),
        el('span', { class: 'tab-label' }, item.label),
      ),
    ),
  );
  root.replaceChildren(
    el(
      'header',
      { class: 'shell-header' },
      el('h1', { class: 'shell-brand' }, katoriMark(26), 'Katori'),
      el('p', { class: 'shell-tagline' }, 'Your daily meal & macro planner that knows desi food.'),
    ),
    banner,
    el('main', { class: 'shell-main', id: 'main' }, view),
    nav,
    dataStatus,
  );
  return { root, banner, view, nav, dataStatus };
}

function markActiveTab(shell, routeName) {
  const active = routeName === 'add' ? 'day' : routeName;
  shell.root.dataset.route = routeName;
  for (const link of shell.nav.querySelectorAll('a')) {
    if (link.dataset.route === active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
}

function placeholder(container, text) {
  container.replaceChildren(el('p', { class: 'shell-status', 'data-testid': 'view-status' }, text));
  return { update() {}, unmount() {} };
}

function renderBanner(shell, state) {
  const key =
    state.saveError === 'quota'
      ? 'quota'
      : ['unavailable', 'corrupt', 'future'].includes(state.storageStatus)
        ? state.storageStatus
        : state.foodsStatus === 'missing'
          ? 'foods'
          : null;
  shell.banner.hidden = key === null;
  shell.banner.dataset.kind = key ?? '';
  shell.banner.textContent = key ? BANNER_TEXT[key] : '';
}

function applyTheme(theme) {
  const html = document.documentElement;
  if (theme === 'light' || theme === 'dark') html.dataset.theme = theme;
  else delete html.dataset.theme;
}

// ------------------------------------------------------------------ view mounting

function createViewHost(shell, ctx) {
  let current = { name: null, handle: null };
  let token = 0;

  async function show(route) {
    const name = VIEW_FOR_ROUTE[route.name];
    if (current.name === name && current.handle) {
      current.handle.update(route);
      return;
    }
    const mine = (token += 1);
    let mod = null;
    try {
      mod = await import(`./ui/views/${name}.js`);
    } catch (error) {
      console.warn(`Katori: view "${name}" is not built yet.`, error);
    }
    if (mine !== token) return; // a newer route won the race
    current.handle?.unmount();
    current = { name, handle: null };
    // A new tab opens at its top (the Day view may have scrolled itself to the current meal).
    window.scrollTo({ top: 0, behavior: 'instant' });
    try {
      current.handle = mod?.mount
        ? mod.mount(shell.view, ctx)
        : placeholder(shell.view, `The ${name} screen is coming in Sprint 1.`);
      current.handle.update(route);
    } catch (error) {
      console.error(`Katori: view "${name}" failed to start.`, error);
      current.handle = placeholder(shell.view, 'Something went wrong on this screen.');
    }
  }

  return { show };
}

// ------------------------------------------------------------------ boot

async function boot() {
  const router = createRouter(window);
  const shell = renderShell(document.getElementById('app'), router);
  placeholder(shell.view, 'Loading…');
  // Tabs follow the hash from the first moment, even if the app cannot start below.
  router.subscribe((r) => markActiveTab(shell, r.name));
  router.start();
  markActiveTab(shell, router.current().name);

  const data = await loadFoodData();
  shell.dataStatus.textContent =
    data.status === 'ok' ? `${data.foods.length} foods loaded.` : 'Food data is not available yet.';
  let store;
  try {
    const backend = storageBackend();
    const persistence = createPersistence(backend, { stamp: () => localDateTime(new Date()) });
    store = createStore({
      persistence,
      rules: data.rules,
      foods: data.foods,
      library: data.library ?? [],
      plans: data.plans ?? null,
      foodsStatus: data.status,
      makeId: idMaker(),
      timeZone: deviceTimeZone(),
    });
  } catch (error) {
    console.error('Katori: the app could not start.', error);
    placeholder(shell.view, 'Katori is still being assembled. Please check back soon.');
    return;
  }
  window.addEventListener('pagehide', () => store.flush());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') store.flush();
  });

  const views = createViewHost(shell, { store, router, rules: data.rules });

  function route(r) {
    if (r.name === 'notfound') {
      router.go({ name: 'day', params: { date: null } }, { replace: true });
      return;
    }
    if (NEEDS_ONBOARDING.has(r.name) && store.needsOnboarding()) {
      router.go({ name: 'welcome', params: {} }, { replace: true });
      return;
    }
    views.show(r);
  }

  const syncChrome = (state) => {
    renderBanner(shell, state);
    applyTheme(state.data.settings?.theme);
  };
  store.subscribe(syncChrome);
  syncChrome(store.getState());

  router.subscribe(route);
  route(router.current());
}

boot();
