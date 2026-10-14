// Bilal's test helpers. Counts "actions" the CUSTOMER.md way: one tap, one field filled, one key press.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
export const URL = 'http://localhost:8771/';
export const OUT = '/home/user/Macros-calculator-/team/feedback/screens/bilal/';

export async function launch({ width = 400, height = 860, time = '2026-10-14T21:30:00+02:00', tz = 'Europe/Madrid', colorScheme = 'light', throwStorage = false, storageState = undefined } = {}) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width, height }, timezoneId: tz, locale: 'en-GB', colorScheme, hasTouch: width < 600, isMobile: width < 600, storageState });
  const page = await ctx.newPage();
  const errors = [];
  const foreign = [];
  const dialogs = [];
  page.on('pageerror', (e) => errors.push('PAGEERR ' + e));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE ' + m.text()); });
  page.on('request', (r) => { const u = new URL_(r.url()); if (!['data:', 'blob:', 'about:'].includes(u.protocol) && u.hostname !== 'localhost') foreign.push(r.url()); });
  page.on('dialog', (d) => { dialogs.push(d.message()); d.dismiss(); });
  if (throwStorage) await page.addInitScript(() => { const boom = () => { throw new Error('blocked'); }; Object.defineProperty(window, 'localStorage', { get: boom }); });
  await page.clock.install({ time: new Date(time) });
  const run = { browser, ctx, page, errors, foreign, dialogs, actions: 0, t0: 0, log: [] };
  return run;
}
const URL_ = globalThis.URL;
export const setTime = (run, iso) => run.page.clock.setSystemTime(new Date(iso));
export const start = (run) => { run.actions = 0; run.t0 = Date.now(); };
export const elapsed = (run) => ((Date.now() - run.t0) / 1000).toFixed(1);
const PAUSE = 350; // person aiming at a button
const KEY = 60; // ms per character typed on a phone, fast thumbs
export async function tap(run, loc, label) { await run.page.waitForTimeout(PAUSE); await loc.click(); run.actions++; if (label) run.log.push(label); }
export async function check(run, loc) { await run.page.waitForTimeout(PAUSE); await loc.check(); run.actions++; }
export async function type(run, loc, text) {
  await run.page.waitForTimeout(PAUSE);
  await loc.click(); // focusing is part of the same field action
  await loc.fill('');
  await loc.pressSequentially(text, { delay: KEY });
  run.actions++;
}
export async function press(run, key) { await run.page.keyboard.press(key); run.actions++; }
export const shot = (run, name, opts = {}) => run.page.screenshot({ path: OUT + name + '.png', ...opts });

export async function onboardP1(run) {
  const p = run.page;
  await p.goto(URL);
  await tap(run, p.getByRole('button', { name: 'Start' }));
  await check(run, p.getByRole('radio', { name: 'Man', exact: true }));
  await type(run, p.getByRole('textbox', { name: 'Age' }), '31');
  await type(run, p.getByRole('textbox', { name: 'Height', exact: true }), '178');
  await type(run, p.getByRole('textbox', { name: 'Weight' }), '82');
  await check(run, p.getByRole('radio', { name: /^Active/ }));
  await check(run, p.getByRole('switch'));
  await check(run, p.getByRole('radio', { name: /Lose weight/ }));
  await tap(run, p.getByRole('button', { name: 'See my targets' }));
  await p.waitForSelector('[data-testid=targets-result]');
  await tap(run, p.getByRole('button', { name: 'Start logging' }));
  await p.waitForSelector('[data-testid=kcal-left]');
}
export async function skipOnboarding(run) {
  await run.page.goto(URL);
  await tap(run, run.page.getByRole('button', { name: 'Skip for now' }));
  await run.page.waitForSelector('[data-testid=kcal-left]');
}
export const sheet = (run) => run.page.locator('[data-testid=add-sheet]');
export const rows = (run) => sheet(run).locator('[data-testid=food-row]');
export async function rowTexts(run, n = 6) {
  const r = rows(run); const c = Math.min(await r.count(), n); const out = [];
  for (let i = 0; i < c; i++) out.push((await r.nth(i).innerText()).replace(/\n+/g, ' | '));
  return out;
}
export async function openSlot(run, slotLabel) { await tap(run, run.page.getByRole('button', { name: 'Add to ' + slotLabel, exact: true })); await run.page.waitForSelector('[data-testid=add-sheet]'); }
export async function search(run, q) {
  const box = sheet(run).getByRole('searchbox').or(sheet(run).locator('input.search-input')).first();
  await type(run, box, q);
  await run.page.waitForTimeout(120);
}
export async function plus(run, nameRegex) {
  const r = rows(run).filter({ hasText: nameRegex }).first();
  await tap(run, r.locator('.btn-plus'));
}
export async function totals(run) {
  const p = run.page;
  return {
    kcalLeft: (await p.locator('[data-testid=kcal-left]').innerText()).replace(/\n/g, ' '),
    protLeft: (await p.locator('[data-testid=protein-left]').innerText()).replace(/\n/g, ' '),
    all: (await p.locator('[data-testid=totals]').innerText()).replace(/\n+/g, ' | '),
  };
}
export async function entries(run) {
  const e = run.page.locator('[data-testid=entry]'); const n = await e.count(); const out = [];
  for (let i = 0; i < n; i++) out.push((await e.nth(i).innerText()).replace(/\n+/g, ' | '));
  return out;
}

// logFood: person-style flow inside the open add sheet. opts: {serving: regex for chip, qty: number}
export async function logFood(run, q, rowRe, opts = {}) {
  const p = run.page; const sh = sheet(run);
  await search(run, q);
  const row = rows(run).filter({ hasText: rowRe }).first();
  if (!(await row.count())) throw new Error('no row for ' + q + ' ' + rowRe);
  if (!opts.serving && (opts.qty == null || opts.qty === 1)) { await tap(run, row.locator('.btn-plus')); return; }
  await tap(run, row.locator('.food-main'));
  const pk = p.locator('[data-testid=portion-picker]');
  await pk.waitFor();
  await p.waitForTimeout(250);
  if (opts.serving) await tap(run, pk.locator('label,button').filter({ hasText: opts.serving }).first());
  if (opts.qty != null && opts.qty !== 1) {
    const quick = { 0.5: '½', 1.5: '1½', 2: '2' }[opts.qty];
    if (quick) await tap(run, pk.getByRole('button', { name: quick, exact: true }));
    else await type(run, pk.locator('[data-testid=qty-input]'), String(opts.qty));
  }
  if (opts.shot) await shot(run, opts.shot);
  await tap(run, pk.getByRole('button', { name: /^Add to/ }));
  await p.waitForTimeout(250);
}
export async function setMeal(run, label) { await sheet(run).locator('select').selectOption({ label }); run.actions++; }
export async function done(run) { await tap(run, sheet(run).getByRole('button', { name: 'Done' })); await run.page.waitForTimeout(250); }
