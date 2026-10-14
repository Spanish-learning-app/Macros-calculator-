// Mariam Iqbal, Review 1: hands-on pass of Katori Sprint 1 on the Madrid clock.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';

const APP = 'http://localhost:8773/';
const OUT = new URL('./', import.meta.url).pathname;
const R = { actions: {}, notes: {} };
const log = (k, v) => { R.notes[k] = v; console.log('>>', k, JSON.stringify(v)); };

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 400, height: 860 }, colorScheme: 'dark', timezoneId: 'Europe/Madrid',
  locale: 'es-ES', hasTouch: true, isMobile: true, deviceScaleFactor: 2,
});
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));

let counter = null;
const startCount = (name) => { counter = { name, taps: 0, types: 0, selects: 0, chars: 0 }; R.actions[name] = counter; };
const tap = async (loc) => { if (counter) counter.taps++; await loc.click(); await page.waitForTimeout(120); };
const typeIn = async (loc, text) => { if (counter) { counter.types++; counter.chars += text.length; } await loc.fill(''); await loc.pressSequentially(text, { delay: 15 }); await page.waitForTimeout(250); };
const select = async (loc, v) => { if (counter) counter.selects++; await loc.selectOption(v); await page.waitForTimeout(150); };
const shot = (n) => page.screenshot({ path: OUT + n + '.png' });

const at = async (iso) => { await page.clock.setFixedTime(new Date(iso)); };
const open = async (iso, hash = '') => { await at(iso); await page.goto(APP + hash); await page.waitForTimeout(700); };

const sheet = page.locator('[data-testid=add-sheet]');
const fab = page.locator('[data-testid=add-food]');
const search = () => sheet.locator('.search-input');
const rowsOf = async () => page.evaluate(() => [...document.querySelectorAll('dialog[open] [data-testid=food-row]')].map((r) => ({
  id: r.dataset.foodId, name: r.querySelector('.food-name')?.textContent, portion: r.querySelector('.food-portion')?.textContent,
  halal: r.querySelector('.entry-halal')?.textContent ?? null,
  reason: [...r.children].slice(3).map((c) => c.textContent).join(' | ').slice(0, 200),
})));
const hiddenNote = async () => page.evaluate(() => document.querySelector('dialog[open] [data-testid=hidden-note]')?.innerText ?? null);
const status = async () => page.evaluate(() => document.querySelector('dialog[open] .sheet-status')?.textContent ?? null);
const search1 = async (q) => { await typeIn(search(), q); return { q, rows: await rowsOf(), hidden: await hiddenNote() }; };
const addFirstMatching = async (id) => {
  const row = sheet.locator(`[data-testid=food-row][data-food-id="${id}"]`);
  await tap(row.locator('.btn-plus'));
};
const entries = async () => page.evaluate(() => [...document.querySelectorAll('[data-testid^=slot-]')].map((s) => ({
  slot: s.getAttribute('data-testid'), title: s.querySelector('.slot-title')?.textContent, sub: s.querySelector('.slot-sub')?.textContent,
  items: [...s.querySelectorAll('[data-testid=entry]')].map((e) => ({ name: e.querySelector('.entry-name')?.textContent, line: e.querySelector('.entry-line')?.textContent, tags: e.querySelector('.entry-tags')?.textContent, halal: e.querySelector('.entry-halal')?.textContent, status: e.dataset.status })),
})));
const totalsTxt = async () => page.evaluate(() => document.querySelector('[data-testid=totals]')?.innerText ?? null);
const dayTitle = async () => page.evaluate(() => document.querySelector('[data-testid=day-title]')?.innerText ?? null);
const hscroll = async (label) => {
  const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth,
    clipped: [...document.querySelectorAll('body *')].filter((e) => { const cs = getComputedStyle(e); return e.offsetParent && e.scrollWidth > e.clientWidth + 1 && cs.overflowX !== 'visible' && e.clientWidth > 0 && !['scroll','auto'].includes(cs.overflowX); }).slice(0, 5).map((e) => e.className + ':' + e.textContent.slice(0, 30)) }));
  log('hscroll-' + label, r); return r;
};
const closeSheet = async () => { await tap(sheet.getByRole('button', { name: 'Done' })); await page.waitForTimeout(250); };
const store = () => page.evaluate(() => JSON.parse(localStorage.getItem(Object.keys(localStorage)[0])));

// ---------------------------------------------------------------- onboarding (Wed 14 Oct 2026, 08:30)
await open('2026-10-14T08:30:00+02:00');
await shot('00-welcome');
startCount('onboarding');
await tap(page.getByRole('button', { name: 'Start' }));
await shot('00-form-top');
await tap(page.getByLabel('Woman'));
await typeIn(page.getByLabel('Age'), '29');
await typeIn(page.getByLabel('Height', { exact: true }).first(), '165');
await typeIn(page.getByLabel('Weight', { exact: true }), '60');
await tap(page.getByLabel(/^Active/).first());
await tap(page.getByLabel('Keep my weight'));
await shot('00-form-filled');
await tap(page.getByRole('button', { name: 'See my targets' }));
await page.waitForTimeout(300);
await shot('00-targets');
log('targets', await page.evaluate(() => document.querySelector('[data-testid=targets-result]')?.innerText));
await tap(page.getByRole('button', { name: 'Start logging' }));
await page.waitForTimeout(400);
log('onboarding-actions', { ...counter });
log('slotPreset', (await store()).settings?.slotPreset);
log('settings', (await store()).settings);
await shot('01-day-empty');
await hscroll('day-empty');
log('day-title@08:30', await dayTitle());
log('slots-empty', (await entries()).map((s) => s.title));

// ---------------------------------------------------------------- M1 café breakfast (08:40)
await open('2026-10-14T08:40:00+02:00');
startCount('M1-cafe-con-leche');
await tap(fab);
log('M1-sheet-title', await sheet.locator('.dlg-title').textContent());
log('M1-halal-toggle-default', await sheet.locator('.switch-input').isChecked());
await shot('m1-1-sheet-open');
const m1a = await search1('cafe amb llet');
log('M1-search-cafe-amb-llet', m1a.rows.slice(0, 5).map((r) => r.name + ' | ' + r.portion));
await shot('m1-2-cafe-amb-llet');
await addFirstMatching('es-cafe-con-leche');
const m1aRank = m1a.rows.findIndex((r) => r.id === 'es-cafe-con-leche') + 1;
log('M1-rank-cafe-con-leche-by-catalan', m1aRank);
log('M1-status-1', await status());

// other names for the same coffee
const probes = {};
for (const q of ['cafe con leche', 'coffee with milk', 'cafe amb llet', 'cafe', 'cortat', 'cortado', 'cafe solo', 'milky coffee']) {
  const r = await (async () => { await search().fill(q); await page.waitForTimeout(200); return { rows: await rowsOf() }; })();
  probes[q] = r.rows.slice(0, 4).map((x) => x.id);
}
log('M1-probes-coffee', probes);

const m1b = await search1('cruasan');
log('M1-search-cruasan', m1b.rows.slice(0, 5).map((r) => `${r.name} | ${r.halal} | ${r.reason}`));
await shot('m1-3-cruasan');
const crRank = m1b.rows.findIndex((r) => r.id === 'es-croissant') + 1;
log('M1-rank-croissant-by-cruasan', crRank);
await addFirstMatching('es-croissant');
const probes2 = {};
for (const q of ['croissant', 'croissant de mantequilla', 'croissant mantega', 'cruasan', 'napolitana', 'croasan', 'croisant']) {
  await search().fill(q); await page.waitForTimeout(200);
  probes2[q] = (await rowsOf()).slice(0, 4).map((x) => x.id);
}
log('M1-probes-croissant', probes2);
await closeSheet();
await shot('m1-4-day-breakfast');
log('M1-day-08:40', await entries());
log('M1-totals', await totalsTxt());
log('M1-actions-breakfast', { ...counter });

// cortado 11:15
await open('2026-10-14T11:15:00+02:00');
startCount('M1-cortado');
await tap(fab);
log('M1-cortado-sheet-title@11:15', await sheet.locator('.dlg-title').textContent());
const m1c = await search1('cortado');
log('M1-search-cortado', m1c.rows.slice(0, 4).map((r) => r.name + ' | ' + r.portion));
await shot('m1-5-cortado-sheet');
await addFirstMatching('es-cortado');
await closeSheet();
await shot('m1-6-day-after-cortado');
log('M1-day-11:15', await entries());
log('M1-actions-cortado', { ...counter });
// thumb reach: where are the controls in the 860px viewport?
await tap(fab);
log('M1-reach', await page.evaluate(() => {
  const b = (s) => { const r = document.querySelector(s)?.getBoundingClientRect(); return r ? { top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height), w: Math.round(r.width) } : null; };
  return { done: b('dialog[open] .btn-done'), search: b('dialog[open] .search-input'), firstPlus: b('dialog[open] .btn-plus'), halalSwitch: b('dialog[open] .switch') };
}));
await closeSheet();

// ---------------------------------------------------------------- M2 lunch box (13:40)
await open('2026-10-14T13:40:00+02:00');
startCount('M2-day1');
await tap(fab);
log('M2-sheet-title@13:40', await sheet.locator('.dlg-title').textContent());
const recs0 = await rowsOf();
log('M2-recents-before-first-log@lunch', recs0.map((r) => r.name));
const m2 = await search1('tikka');
log('M2-search-tikka', m2.rows.slice(0, 6).map((r) => `${r.name} | ${r.portion} | ${r.halal}`));
await shot('m2-1-tikka-search');
await addFirstMatching('pk-chicken-tikka-rice-box');
log('M2-status', await status());
await closeSheet();
await shot('m2-2-day-lunch');
log('M2-day1-lunch', (await entries()).find((s) => s.slot === 'slot-lunch'));
log('M2-actions-day1', { ...counter });
// open the entry to see what portion/halal details look like
await tap(page.locator('[data-testid=slot-lunch] .entry-main').first());
await page.waitForTimeout(300);
await shot('m2-3-entry-edit');
log('M2-entry-edit-text', await page.evaluate(() => document.querySelector('dialog[open]')?.innerText.slice(0, 900)));
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
if (await page.locator('dialog[open]').count()) { await page.locator('dialog[open] .dlg-close, dialog[open] button:has-text("Close"), dialog[open] button:has-text("Cancel")').first().click().catch(() => {}); }

// ---------------------------------------------------------------- M3 evening (Wed 14 Oct)
await open('2026-10-14T17:30:00+02:00');
startCount('M3-chai-17:30');
await tap(fab);
log('M3-chai-sheet-title', await sheet.locator('.dlg-title').textContent());
const chai = await search1('chai');
log('M3-search-chai', chai.rows.slice(0, 6).map((r) => `${r.name} | ${r.portion}`));
await shot('m3-1-chai-search');
await addFirstMatching(chai.rows[0].id);
await closeSheet();
log('M3-actions-chai', { ...counter });

await open('2026-10-14T21:45:00+02:00');
startCount('M3-dinner-21:45');
await tap(fab);
log('M3-dinner-sheet-title', await sheet.locator('.dlg-title').textContent());
const din = await search1('tortilla');
log('M3-search-tortilla', din.rows.slice(0, 5).map((r) => `${r.name} | ${r.portion}`));
const half = din.rows.find((r) => r.id === 'es-tortilla-de-patatas');
await addFirstMatching('es-tortilla-de-patatas');
await closeSheet();
await shot('m3-2-day-after-dinner');
log('M3-actions-dinner', { ...counter });

// 00:30 on the 15th: reopen the app fresh
await open('2026-10-15T00:30:00+02:00');
log('M3-day-title@00:30', await dayTitle());
await shot('m3-3-open-at-0030');
startCount('M3-toast-00:30');
await tap(fab);
log('M3-toast-sheet-title@00:30', await sheet.locator('.dlg-title').textContent());
log('M3-toast-sheet-when@00:30', await sheet.locator('.sheet-when').textContent());
const toast = await search1('tostada');
log('M3-search-tostada', toast.rows.slice(0, 5).map((r) => `${r.name} | ${r.portion}`));
const toast2 = await search1('toast');
log('M3-search-toast', toast2.rows.slice(0, 5).map((r) => `${r.name} | ${r.portion}`));
const toast3 = await search1('milk');
log('M3-search-milk', toast3.rows.slice(0, 5).map((r) => `${r.name} | ${r.portion}`));
await search().fill('tostada'); await page.waitForTimeout(200);
await addFirstMatching('es-tostada-con-aceite');
await shot('m3-4-sheet-0030');
await closeSheet();
await shot('m3-5-day-after-0030');
log('M3-day-@00:30-entries', await entries());
log('M3-actions-toast', { ...counter });
// does the 14th still hold it? Where did it go?
await tap(page.locator('[data-testid=day-prev]').first());
await page.waitForTimeout(300);
log('M3-day-title-prev', await dayTitle());
log('M3-14th-entries', (await entries()).map((s) => ({ slot: s.title, items: s.items.map((i) => i.name) })));
await open('2026-10-15T00:30:00+02:00');
log('M3-15th-entries', (await entries()).map((s) => ({ slot: s.title, items: s.items.map((i) => i.name) })));

// ---------------------------------------------------------------- M2 day 2 (Thu 15 Oct, 13:40)
await open('2026-10-15T13:40:00+02:00');
log('M2-day2-title', await dayTitle());
startCount('M2-day2-from-recents');
await tap(fab);
log('M2-day2-sheet-title', await sheet.locator('.dlg-title').textContent());
const recs = await rowsOf();
log('M2-day2-recents', recs.map((r) => `${r.name} | ${r.portion}`));
await shot('m2-4-day2-recents');
await tap(sheet.locator(`[data-testid=food-row][data-food-id="pk-chicken-tikka-rice-box"] .btn-plus`));
log('M2-day2-status', await status());
await closeSheet();
await shot('m2-5-day2-lunch');
log('M2-day2-lunch', (await entries()).find((s) => s.slot === 'slot-lunch'));
log('M2-actions-day2', { ...counter });

// ---------------------------------------------------------------- M4 halal honesty
await open('2026-10-15T15:00:00+02:00');
startCount('M4');
await tap(fab);
log('M4-halal-toggle-default', await sheet.locator('.switch-input').isChecked());
for (const q of ['ensaimada', 'napolitana', 'bocadillo']) {
  const r = await search1(q);
  log('M4-on-' + q, { rows: r.rows.map((x) => `${x.name} | ${x.halal} | ${x.reason}`), hidden: r.hidden });
  await shot('m4-on-' + q);
}
// reveal hidden
await search().fill('ensaimada'); await page.waitForTimeout(200);
const showBtn = sheet.getByRole('button', { name: /Show hidden/ });
if (await showBtn.count()) { await tap(showBtn); log('M4-ensaimada-revealed', { rows: (await rowsOf()).map((x) => `${x.name} | ${x.halal} | ${x.reason}`), hidden: await hiddenNote() }); await shot('m4-ensaimada-revealed'); }
// filter off
await tap(sheet.locator('.switch').first());
log('M4-toggle-now', await sheet.locator('.switch-input').isChecked());
for (const q of ['ensaimada', 'napolitana', 'bocadillo', 'ensaïmada']) {
  await search().fill(q); await page.waitForTimeout(250);
  const rows = await rowsOf();
  log('M4-off-' + q, { rows: rows.map((x) => `${x.name} | ${x.halal} | ${x.reason}`) });
  await shot('m4-off-' + q.replace('ï', 'i'));
}
// is ensaimada ever suggested?  look at suggestions / recents / pastry-like words
const sugg = {};
for (const q of ['pastry', 'bollo', 'dulce', 'breakfast', 'pasteleria', 'bakery', 'croissant', 'pan']) {
  await search().fill(q); await page.waitForTimeout(200);
  sugg[q] = (await rowsOf()).slice(0, 6).map((x) => x.name + ' [' + x.halal + ']');
}
log('M4-pastry-probes-filter-off', sugg);
// pork + seafood + restaurant probes, filter OFF then ON
const pork = {};
for (const q of ['jamon', 'chorizo', 'lentejas', 'gambas', 'calamares', 'pollo', 'menu del dia', 'paella', 'serrano', 'bacon', 'gelatina']) {
  await search().fill(q); await page.waitForTimeout(200);
  pork[q] = { rows: (await rowsOf()).slice(0, 5).map((x) => `${x.name} [${x.halal}] ${x.reason.slice(0, 90)}`), hidden: await hiddenNote() };
}
log('M4-probes-filter-off', pork);
await tap(sheet.locator('.switch').first());
const pork2 = {};
for (const q of ['jamon', 'chorizo', 'lentejas', 'gambas', 'calamares', 'pollo', 'menu del dia', 'paella', 'bacon']) {
  await search().fill(q); await page.waitForTimeout(200);
  pork2[q] = { rows: (await rowsOf()).slice(0, 5).map((x) => `${x.name} [${x.halal}] ${x.reason.slice(0, 90)}`), hidden: (await hiddenNote())?.slice(0, 200) };
}
log('M4-probes-filter-on', pork2);
await search().fill('lentejas'); await page.waitForTimeout(200); await shot('m4-lentejas-on');
await search().fill('pollo'); await page.waitForTimeout(200); await shot('m4-pollo-on');
await search().fill('napolitana'); await page.waitForTimeout(200);
await shot('m4-napolitana-on-again');
log('M4-actions', { ...counter });
await closeSheet();

// ---------------------------------------------------------------- M5 gym day (Thu 15 Oct, 19:30 skyr), dark, es-ES, 400px
await open('2026-10-15T19:30:00+02:00');
startCount('M5-skyr');
await tap(fab);
const sk = await search1('skyr');
log('M5-search-skyr', sk.rows.slice(0, 5).map((r) => `${r.name} | ${r.portion} | ${r.halal}`));
await shot('m5-1-skyr-search');
if (sk.rows.length) await tap(sheet.locator('[data-testid=food-row] .btn-plus').first());
const sk2 = await search1('yogur');
log('M5-search-yogur', sk2.rows.slice(0, 5).map((r) => `${r.name} | ${r.portion}`));
const sk3 = await search1('yogurt');
log('M5-search-yogurt', sk3.rows.slice(0, 5).map((r) => `${r.name} | ${r.portion}`));
await closeSheet();
log('M5-actions-skyr', { ...counter });
await page.evaluate(() => window.scrollTo(0, 0));
await shot('m5-2-day-top');
log('M5-totals-visible-no-scroll', await totalsTxt());
log('M5-totals-box', await page.evaluate(() => { const r = document.querySelector('[data-testid=protein-left]').getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), vh: innerHeight }; }));
await hscroll('day-full');
await page.screenshot({ path: OUT + 'm5-3-day-full.png', fullPage: true });
await page.evaluate(() => window.scrollTo(0, 700)); await page.waitForTimeout(200);
await shot('m5-4-day-scrolled');
log('M5-sticky-totals-when-scrolled', await page.evaluate(() => { const r = document.querySelector('[data-testid=totals]').getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom) }; }));
// the 14th full day for the gym log
await page.evaluate(() => window.scrollTo(0, 0));
log('M5-today-entries', (await entries()).map((s) => ({ slot: s.title, sub: s.sub, items: s.items.map((i) => `${i.name} | ${i.line} | ${i.halal ?? ''}`) })));
await tap(page.locator('[data-testid=day-prev]').first());
await page.waitForTimeout(300);
await page.screenshot({ path: OUT + 'm5-5-the-14th-full.png', fullPage: true });
log('M5-14th-totals', await totalsTxt());
log('M5-14th-entries', (await entries()).map((s) => ({ slot: s.title, sub: s.sub, items: s.items.map((i) => `${i.name} | ${i.line} | ${i.status}`) })));

// ---------------------------------------------------------------- other screens at 400 dark
for (const [name, hash] of [['week', '#/week'], ['profile', '#/profile'], ['data', '#/data']]) {
  await page.goto(APP + hash); await page.waitForTimeout(500);
  await page.screenshot({ path: OUT + `x-${name}-400-dark.png`, fullPage: true });
  await hscroll(name);
}
log('profile-text', await (async () => { await page.goto(APP + '#/profile'); await page.waitForTimeout(400); return page.evaluate(() => document.querySelector('main')?.innerText.slice(0, 2500)); })());

// ---------------------------------------------------------------- M3 again: clock change night Sat 24 -> Sun 25 Oct
startCount('M3-clock-change');
await open('2026-10-24T17:30:00+02:00');
await tap(fab); await search1('chai'); await addFirstMatching((await rowsOf())[0].id); await closeSheet();
await open('2026-10-24T21:45:00+02:00');
await tap(fab); await search1('tortilla'); await addFirstMatching('es-tortilla-de-patatas'); await closeSheet();
await open('2026-10-25T00:30:00+02:00');
log('CC-title@00:30', await dayTitle());
await tap(fab); await search1('tostada'); await addFirstMatching('es-tostada-con-aceite'); await closeSheet();
await shot('cc-1-0030');
const cc1 = (await entries()).map((s) => ({ slot: s.title, items: s.items.map((i) => i.name) }));
log('CC-day@00:30', { title: await dayTitle(), cc1 });
// 02:30 CEST (first pass) and 02:30 CET (second pass, after fall back) and 03:30 CET
for (const [label, iso] of [['02:30 CEST', '2026-10-25T02:30:00+02:00'], ['02:30 CET', '2026-10-25T02:30:00+01:00'], ['03:30 CET', '2026-10-25T03:30:00+01:00'], ['04:10 CET', '2026-10-25T04:10:00+01:00']]) {
  await open(iso);
  const t = await dayTitle();
  const e = (await entries()).map((s) => ({ slot: s.title, n: s.items.length }));
  log('CC-' + label, { title: t, e, newDate: await page.evaluate(() => new Date().toString()) });
}
await open('2026-10-25T03:30:00+01:00');
await shot('cc-2-0330-cet');
const st = await store();
const days = st.days ?? st.data?.days;
log('CC-stored-keys', Object.keys(days ?? st).slice(0, 10));
log('CC-sample-entry', JSON.stringify(Object.values(days ?? {})[0]?.entries?.[0] ?? null));
log('CC-actions', { ...counter });

// ---------------------------------------------------------------- light desktop pass at 1280
const desk = await browser.newContext({ viewport: { width: 1280, height: 860 }, colorScheme: 'light', timezoneId: 'Europe/Madrid', locale: 'es-ES' });
const dp = await desk.newPage();
await dp.clock.setFixedTime(new Date('2026-10-14T21:00:00+02:00'));
await dp.goto(APP);
await dp.waitForTimeout(500);
// seed: skip onboarding for desktop, log a few things via UI
await dp.getByRole('button', { name: 'Skip for now' }).click();
await dp.waitForTimeout(400);
await dp.screenshot({ path: OUT + 'd-1-day-empty-light.png' });
const dfab = dp.locator('[data-testid=add-food]');
for (const [q, id] of [['cafe amb llet', 'es-cafe-con-leche'], ['cruasan', 'es-croissant']]) {
  await dfab.click(); await dp.waitForTimeout(200);
  const sh = dp.locator('[data-testid=add-sheet]');
  await sh.locator('.search-input').fill(q); await dp.waitForTimeout(300);
  await sh.locator(`[data-food-id="${id}"] .btn-plus`).click();
  if (q === 'cruasan') { await dp.screenshot({ path: OUT + 'd-2-sheet-cruasan-light.png' }); await sh.locator('.search-input').fill('ensaimada'); await dp.waitForTimeout(300); await dp.screenshot({ path: OUT + 'd-3-sheet-ensaimada-light.png' }); }
  await sh.getByRole('button', { name: 'Done' }).click(); await dp.waitForTimeout(250);
}
await dp.screenshot({ path: OUT + 'd-4-day-light.png' });
await dp.goto(APP + '#/week'); await dp.waitForTimeout(400);
await dp.screenshot({ path: OUT + 'd-5-week-light.png' });
await dp.goto(APP + '#/profile'); await dp.waitForTimeout(400);
await dp.screenshot({ path: OUT + 'd-6-profile-light.png' });
log('desktop-hscroll', await dp.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth })));

log('console-errors', errors);
fs.writeFileSync(OUT + 'review1-results.json', JSON.stringify(R, null, 2));
await browser.close();
