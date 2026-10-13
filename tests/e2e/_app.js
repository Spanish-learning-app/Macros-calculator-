// Shared E2E helpers. Owner: Kenji. Selectors follow Priya's selector contract (team/journals/
// priya.md, "Selector contract for Kenji"): roles and accessible names first, data-testid second.
//
// - `test` adds global guards to every spec that uses it: no request to another origin, no
//   window.alert/confirm/prompt (stubbed and counted), no console error, no horizontal scroll.
// - FEATURES says which Sprint 1 features have landed. A spec that needs a missing feature is
//   `test.fixme`. Set KATORI_E2E_ALL=1 to run every spec anyway (to see how far the build is).
// - Seeding: `seed(page, doc)` writes localStorage['mmc.v1'] once per tab (not on reload).
// - Data: `useFixtureFoods(page)` serves tests/fixtures (RULES + 16 foods) as ./data/index.js.
import { test as base, expect } from 'playwright/test';
import { RULES, FOODS } from '../fixtures/index.js';

export { expect, RULES, FOODS };

/** Features of the built app. Flip to true as they land (Priya's views, Lena's store). */
export const FEATURES = {
  store: false, // core/storage + core/days implemented, so the store starts (Lena, Hamza)
  onboarding: false, // views/welcome.js (Priya)
  day: false, // views/day.js: totals, slots, entries, day navigation (Priya)
  addSheet: false, // add sheet: search, recents, "+", hidden note (Priya; core/search by Hamza)
  portionPicker: false, // portion picker, variant switch, food details (Priya)
  week: false, // views/week.js (Priya)
  profile: false, // views/profile.js (Priya)
  data: false, // views/data.js: export / import (Priya)
  realFoods: false, // the Lab's FOODS cover CUSTOMER.md §1 (ids mapped in COVERAGE below)
};

const RUN_ALL = process.env.KATORI_E2E_ALL === '1';

/** Marks the current test fixme unless every named feature has landed. */
export function needs(...names) {
  const missing = names.filter((n) => !FEATURES[n]);
  base.fixme(!RUN_ALL && missing.length > 0, `not built yet: ${missing.join(', ')}`);
}

// ------------------------------------------------------------------ guards

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);
/** Console errors that come from Step 0 stubs (Hamza's core still in progress) are tolerated. */
const TOLERATED_CONSOLE = [/not implemented/i];

export const test = base.extend({
  guards: [
    async ({ page }, use) => {
      const foreign = [];
      const consoleErrors = [];
      page.on('request', (req) => {
        const url = new URL(req.url());
        if (
          !['data:', 'blob:', 'about:'].includes(url.protocol) &&
          !LOCAL_HOSTS.has(url.hostname)
        ) {
          foreign.push(req.url());
        }
      });
      page.on('console', (msg) => {
        if (msg.type() === 'error' && !TOLERATED_CONSOLE.some((re) => re.test(msg.text()))) {
          consoleErrors.push(msg.text());
        }
      });
      page.on('pageerror', (error) => {
        if (!TOLERATED_CONSOLE.some((re) => re.test(String(error))))
          consoleErrors.push(String(error));
      });
      await page.addInitScript(() => {
        window.__qaDialogs = [];
        for (const name of ['alert', 'confirm', 'prompt']) {
          window[name] = (...args) => {
            window.__qaDialogs.push({ name, args: args.map(String) });
            return name === 'confirm' ? false : null;
          };
        }
      });
      await use({ foreign, consoleErrors });
      expect(foreign, 'no request to another origin').toEqual([]);
      expect(consoleErrors, 'no console errors').toEqual([]);
      if (!page.isClosed() && page.url().startsWith('http')) {
        const dialogs = await page.evaluate(() => window.__qaDialogs ?? []).catch(() => []);
        expect(dialogs, 'no alert/confirm/prompt').toEqual([]);
        expect(await horizontalOverflow(page), 'no horizontal scroll').toBeLessThanOrEqual(0);
      }
    },
    { auto: true },
  ],
});

export async function horizontalOverflow(page) {
  return page
    .evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    .catch(() => 0);
}

// ------------------------------------------------------------------ data and storage

/** Serves the fixtures in place of app/data/index.js (until the Lab's foods cover a flow). */
export async function useFixtureFoods(page, foods = FOODS) {
  const body = `export const RULES = ${JSON.stringify(RULES)}; export const FOODS = ${JSON.stringify(foods)};`;
  await page.route('**/data/index.js', (route) =>
    route.fulfill({ contentType: 'text/javascript', body }),
  );
}

/** A full UserData document (ARCHITECTURE §4.5) with onboarding skipped, plus `patch`. */
export function userDoc(patch = {}) {
  const doc = {
    schemaVersion: 1,
    profile: null,
    targetPrefs: {},
    targetOverrides: {},
    settings: {
      slotPreset: 'spain',
      slotLabels: {},
      halalOnly: true,
      seafood: 'all',
      dayStartMinutes: 240,
      onboarding: 'skipped',
      units: { weight: 'kg', height: 'cm' },
      weekStartsOn: 1,
      theme: 'system',
      hideCalories: false,
    },
    days: {},
    customFoods: [],
    recents: {},
    recipes: [],
    batches: [],
  };
  return {
    ...doc,
    ...patch,
    settings: { ...doc.settings, ...(patch.settings ?? {}) },
  };
}

/** P1 (CUSTOMER.md §2): male, 31, 178 cm, 82 kg, moderate, lifts, lose 0.5 kg/week. */
export const P1 = Object.freeze({
  sex: 'male',
  ageYears: 31,
  heightCm: 178,
  weightKg: 82,
  activity: 'moderate',
  goal: 'lose',
  rateKgPerWeek: 0.5,
  lifts: true,
  healthFlags: [],
});

/** P1 targets from NUTRITION.md §2.2 (checked by hand with the §2.7 method): 2210 kcal, 161/74/225/31. */
export const P1_TARGETS = Object.freeze({
  kcal: 2210,
  protein: 161,
  fat: 74,
  carbs: 225,
  fiber: 31,
});

/** The "Set up" state: onboarding done with P1. */
export const setUpDoc = (patch = {}) =>
  userDoc({
    profile: { ...P1 },
    ...patch,
    settings: { onboarding: 'done', ...(patch.settings ?? {}) },
  });

/** Writes localStorage['mmc.v1'] once per tab, before the app boots (a reload keeps app writes). */
export async function seed(page, doc) {
  await page.addInitScript((text) => {
    try {
      if (!sessionStorage.getItem('qa-seeded')) {
        localStorage.setItem('mmc.v1', text);
        sessionStorage.setItem('qa-seeded', '1');
      }
    } catch {
      // A13 step 5 contexts make storage throw; nothing to seed there.
    }
  }, JSON.stringify(doc));
}

/** A13 step 5: every localStorage method (and the property itself) throws. */
export async function breakLocalStorage(page) {
  await page.addInitScript(() => {
    const fail = () => {
      throw new DOMException('Storage is disabled (QA)', 'SecurityError');
    };
    const broken = {
      getItem: fail,
      setItem: fail,
      removeItem: fail,
      clear: fail,
      key: fail,
      get length() {
        return fail();
      },
    };
    try {
      for (const name of ['getItem', 'setItem', 'removeItem', 'clear', 'key']) {
        Storage.prototype[name] = fail;
      }
    } catch {
      // ignore
    }
    Object.defineProperty(window, 'localStorage', { configurable: true, get: () => broken });
  });
}

/** Reads the saved document (null when absent or unreadable). */
export async function savedDoc(page) {
  return page.evaluate(() => {
    try {
      return JSON.parse(localStorage.getItem('mmc.v1'));
    } catch {
      return null;
    }
  });
}

// ------------------------------------------------------------------ clock (Europe/Madrid)

/**
 * Sets the browser clock (page.clock) to a Madrid wall-clock time given as an offset ISO string,
 * e.g. '2026-10-13T21:30:00+02:00'. Install before the first navigation.
 */
export async function setClock(page, isoWithOffset) {
  await page.clock.install({ time: new Date(isoWithOffset) });
}

// ------------------------------------------------------------------ actions (CUSTOMER.md §2)

/**
 * Counts actions as CUSTOMER.md §2 defines them: one tap or click, one field filled (any amount of
 * typing) or one key press. Scrolling is not an action.
 */
export function actions(page) {
  let count = 0;
  const log = [];
  const note = (what) => {
    count += 1;
    log.push(what);
  };
  return {
    get count() {
      return count;
    },
    get log() {
      return [...log];
    },
    async tap(locator, what = 'tap') {
      note(what);
      await locator.click();
    },
    async fill(locator, text, what = `fill "${text}"`) {
      note(what);
      await locator.fill(text);
    },
    async press(locator, key, what = `press ${key}`) {
      note(what);
      await locator.press(key);
    },
    reset() {
      count = 0;
      log.length = 0;
    },
    page,
  };
}

// ------------------------------------------------------------------ UI (Priya's selector contract)

export const ui = {
  totals: (page) => page.getByTestId('totals'),
  kcalLeft: (page) => page.getByTestId('kcal-left'),
  proteinLeft: (page) => page.getByTestId('protein-left'),
  plannedTotal: (page) => page.getByTestId('planned-total'),
  targetKind: (page) => page.getByTestId('target-kind'),
  slot: (page, id) => page.getByTestId(`slot-${id}`),
  addTo: (page, label) => page.getByRole('button', { name: `Add to ${label}`, exact: true }),
  addFood: (page) => page.getByTestId('add-food'),
  entries: (scope) => scope.getByTestId('entry'),
  dayTitle: (page) => page.getByTestId('day-title'),
  prevDay: (page) => page.getByRole('button', { name: 'Previous day' }),
  nextDay: (page) => page.getByRole('button', { name: 'Next day' }),
  copyYesterday: (page) => page.getByTestId('copy-yesterday'),
  copyDay: (page) => page.getByTestId('copy-day'),
  sheet: (page) => page.getByTestId('add-sheet'),
  search: (page) => page.getByTestId('add-sheet').getByRole('searchbox', { name: 'Search foods' }),
  results: (page) => page.getByTestId('results'),
  recents: (page) => page.getByTestId('recents'),
  foodRows: (scope) => scope.getByTestId('food-row'),
  row: (scope, foodId) => scope.locator(`[data-testid="food-row"][data-food-id="${foodId}"]`),
  hiddenNote: (page) => page.getByTestId('hidden-note'),
  picker: (page) => page.getByTestId('portion-picker'),
  qtyInput: (page) => page.getByTestId('qty-input'),
  qtyError: (page) => page.getByTestId('qty-error'),
  preview: (page) => page.getByTestId('portion-preview'),
  variantSwitch: (page) => page.getByTestId('variant-switch'),
  details: (page) => page.getByTestId('food-details'),
  undo: (page) => page.getByTestId('undo'),
  banner: (page) => page.locator('[data-testid="storage-banner"], .storage-banner').first(),
  welcome: (page) => page.getByTestId('welcome'),
  weekRows: (page) => page.getByTestId('week-row'),
  monthGrid: (page) => page.getByTestId('month-grid'),
  exportText: (page) => page.getByTestId('export-text'),
  importText: (page) => page.getByTestId('import-text'),
};

/** Leading integer of a text such as "1234 kcal left" (null when none). */
export function numberIn(text) {
  const m = String(text).match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}
