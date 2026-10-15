// Priya, design refinements B: before/after screens at 400x860, light and dark, Europe/Madrid.
// Run: npx http-server app -p 8790 -c-1 -s &  then  node team/feedback/design-study/after/shoot-b.mjs before|after
// A prep day: P1 set up, chicken tikka boxes Mon-Thu (box 2-4 frozen), breakfast logged, Mon 13:30.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const URL = 'http://localhost:8790/';
const OUT = '/home/user/Macros-calculator-/team/feedback/design-study/after/';
const TAG = process.argv[2] ?? 'after';
const P1 = { sex: 'male', ageYears: 31, heightCm: 178, weightKg: 82, activity: 'moderate', goal: 'lose', rateKgPerWeek: 0.5, lifts: true, healthFlags: [] };
const doc = {
  schemaVersion: 1, profile: P1, targetPrefs: {}, targetOverrides: {},
  settings: { slotPreset: 'spain', slotLabels: {}, halalOnly: true, seafood: 'all', dayStartMinutes: 240, onboarding: 'done', units: { weight: 'kg', height: 'cm' }, weekStartsOn: 1, theme: 'system', hideCalories: false },
  days: {}, customFoods: [], recents: {}, recipes: [], batches: [],
};
const at = (d, t) => new Date(`${d}T${t}:00+01:00`);

for (const scheme of ['light', 'dark']) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 400, height: 860 }, timezoneId: 'Europe/Madrid', locale: 'en-GB', colorScheme: scheme, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  let p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && errs.push('console: ' + m.text()));
  const s = (n, o = {}) => p.screenshot({ path: `${OUT}${TAG}-${scheme}-${n}.png`, ...o });
  const step = async (label, fn) => { try { await fn(); } catch (e) { await p.screenshot({ path: `${OUT}fail-${TAG}-${scheme}-${label}.png` }).catch(() => {}); errs.push(`${label}: ${e.message.split('\n').slice(0,12).join(' / ')}`); } };

  // Welcome (fresh)
  await p.clock.install({ time: at('2026-11-01', '19:00') });
  await p.goto(URL + '#/welcome');
  await p.waitForTimeout(500);
  await s('01-welcome');

  await p.close();
  const p2 = await ctx.newPage();
  await p2.addInitScript((t) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('mmc.v1', t); sessionStorage.setItem('seeded', '1'); } }, JSON.stringify(doc));
  p = p2;
  p.on('pageerror', (e) => errs.push(String(e)));
  await p.clock.install({ time: at('2026-11-01', '19:00') });
  await step('cook', async () => {
    await p.goto(URL + '#/prep');
    await p.waitForTimeout(600);
    await p.locator('[data-testid="library-row"][data-food-id="pk-chicken-tikka-rice-box"]').getByTestId('library-cook').click();
    await p.getByTestId('cook-save').click();
    await p.waitForTimeout(300);
    const card = p.getByTestId('batch-card').first();
    for (const d of ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05'])
      await card.locator(`[data-testid="place-day"][data-date="${d}"]`).click();
  });
  // Monday 13:30, breakfast logged
  await p.clock.setSystemTime(at('2026-11-02', '08:30'));
  await p.goto(URL + '#/day');
  await p.reload();
  await p.waitForTimeout(500);
  const add = async (q, shot) => {
    await p.getByTestId('add-food').click();
    await p.getByRole('searchbox', { name: 'Search foods' }).fill(q);
    await p.waitForTimeout(250);
    await p.locator('[data-testid=results] [data-testid=food-row]').first().getByRole('button', { name: /^Add / }).click();
    await p.waitForTimeout(200);
    if (shot) await s(shot);
    await p.keyboard.press('Escape');
    await p.waitForTimeout(300);
  };
  await step('log', async () => {
    await add('anda paratha', '05-add-sheet-after-plus');
    await add('chai');
  });
  await p.clock.setSystemTime(at('2026-11-02', '13:30'));
  await p.reload();
  await p.waitForTimeout(700);
  await s('02-day-prep-1330');
  await s('03-day-prep-full', { fullPage: true });
  await step('panel', async () => {
    const strip = p.getByTestId('macro-strip');
    if (await strip.count()) { await strip.click(); await p.waitForTimeout(300); await s('04-day-panel-open'); }
  });
  await p.goto(URL + '#/day/2026-11-12');
  await p.reload();
  await p.waitForTimeout(600);
  await s('06-day-empty');
  await p.goto(URL + '#/week');
  await p.waitForTimeout(500);
  await s('07-week');
  console.log(scheme, errs.join(' | ') || 'ok');
  await browser.close();
}
