// Katori boot. Owner: Lena. Step 0 shell: brand, navigation and data status only.
// Integration (store, views) lands after Step 0; see docs/ARCHITECTURE.md §7.
import { createRouter } from './ui/router.js';

const NAV = [
  { name: 'day', label: 'Day' },
  { name: 'week', label: 'Week' },
  { name: 'profile', label: 'Profile' },
  { name: 'data', label: 'Data' },
];

/** Loads app/data/index.js ({ RULES, FOODS }). Missing or broken data never stops the shell. */
async function loadFoodData() {
  try {
    const mod = await import('./data/index.js');
    return { ok: true, rules: mod.RULES ?? null, foods: Array.isArray(mod.FOODS) ? mod.FOODS : [] };
  } catch (error) {
    console.warn('Katori: food data not available yet.', error);
    return { ok: false, rules: null, foods: [] };
  }
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  node.append(...children);
  return node;
}

function renderShell(root, router) {
  const status = el('p', { class: 'shell-status', 'data-testid': 'data-status' }, 'Loading foods…');
  const view = el('section', { class: 'shell-view', 'aria-live': 'polite' });
  const nav = el(
    'nav',
    { class: 'shell-nav', 'aria-label': 'Main' },
    ...NAV.map((item) =>
      el(
        'a',
        { href: router.href({ name: item.name, params: {} }), 'data-route': item.name },
        item.label,
      ),
    ),
  );
  root.replaceChildren(
    el(
      'header',
      { class: 'shell-header' },
      el('h1', { class: 'shell-brand' }, 'Katori'),
      el('p', { class: 'shell-tagline' }, 'Your daily meal & macro planner that knows desi food.'),
    ),
    el('main', { class: 'shell-main', id: 'main' }, view, status),
    nav,
  );
  return { status, view, nav };
}

function showRoute(parts, route) {
  const active = route.name === 'add' ? 'day' : route.name;
  for (const link of parts.nav.querySelectorAll('a')) {
    if (link.dataset.route === active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  parts.view.textContent = `${route.name} view: coming in Sprint 1.`;
}

async function boot() {
  const root = document.getElementById('app');
  const router = createRouter(window);
  const parts = renderShell(root, router);
  router.subscribe((route) => showRoute(parts, route));
  router.start();
  showRoute(parts, router.current());

  const data = await loadFoodData();
  parts.status.textContent = data.ok
    ? `${data.foods.length} foods loaded.`
    : 'Food data is not available yet.';
}

boot();
