// Retest of Review 1 fails and niggles on the Sprint 2 build.
import { start } from './lib.mjs';
const S = await start({ stateFrom: 's5-thu-morning' });
const { page, tap, type, shot, log } = S;
const sheet = page.locator('[data-testid=add-sheet]');
const fab = page.getByTestId('add-food');
const rowsOf = () => page.evaluate(() => [...document.querySelectorAll('dialog[open] [data-testid=food-row]')].map((r) => ({ id: r.dataset.foodId, name: r.querySelector('.food-name')?.textContent, portion: r.querySelector('.food-portion')?.textContent })));
const names = async () => (await rowsOf()).map(r => `${r.name} [${r.portion}]`);
const done = async () => { await tap(sheet.getByRole('button', { name: 'Done' })); await page.waitForTimeout(250); };
const slots = () => page.evaluate(() => [...document.querySelectorAll('[data-testid^=slot-]')].map((s) => ({ slot: s.querySelector('.slot-title')?.textContent, sub: s.querySelector('.slot-sub')?.textContent })));
const top = () => page.evaluate(() => document.querySelector('#app').innerText.split('\n').slice(0, 14).join(' / '));

// M1 cafe + croissant on a rushed Friday morning
await S.open('2026-10-23T08:40:00+02:00');
S.startCount('M1-cafe-croissant');
await tap(fab);
await type(sheet.locator('.search-input'), 'cafe amb llet');
log('M1-cafe-rank1', (await names())[0]);
await tap(sheet.locator('[data-testid=food-row]').first().locator('.btn-plus'));
await type(sheet.locator('.search-input'), 'cruasan');
log('M1-croissant-rank1', (await names())[0]);
log('M1-croissant-row', await sheet.locator('[data-testid=food-row]').first().innerText());
await shot('s7-m1-cruasan');
await tap(sheet.locator('[data-testid=food-row]').first().locator('.btn-plus'));
await done();
log('M1-cafe-croissant', { ...S.stopCount() });

// M5 gym day: skyr, protein wording
await S.open('2026-10-23T17:30:00+02:00');
S.startCount('M5-skyr-merienda');
await tap(fab);
await type(sheet.locator('.search-input'), 'skyr');
log('M5-skyr-results', (await names()).slice(0, 3));
await tap(sheet.locator('[data-testid=food-row]').first().locator('.btn-plus'));
await done();
log('M5-skyr-merienda', { ...S.stopCount() });
log('M5-top', await top());
log('M5-slots', await slots());
await shot('s7-m5-day-top');

// chai: rank and Set my chai once
await tap(fab);
await type(sheet.locator('.search-input'), 'chai');
log('chai-results', (await names()).slice(0, 4));
await sheet.locator('.search-input').fill('');
await page.waitForTimeout(250);
log('recents-merienda-sheet', await names());
await shot('s7-recents-merienda');
await done();

// 00:30 sheet
await S.open('2026-10-24T00:30:00+02:00');
log('M3-0030-top', await top());
await tap(fab);
log('M3-0030-sheet-title', await sheet.locator('.dlg-title').innerText());
log('M3-0030-sheet-sub', await sheet.innerText().then(t => t.split('\n').slice(0, 3).join(' / ')));
await shot('s7-m3-0030-sheet');
await sheet.locator('.search-input').fill('chai'); await page.waitForTimeout(200);
await done();

// M4 halal
await S.open('2026-10-23T17:35:00+02:00');
await tap(fab);
for (const q of ['ensaimada', 'napolitana', 'jamon serrano', 'chorizo', 'calamares', 'gambas', 'bocadillo', 'galletas maria', 'lentejas']) {
  await sheet.locator('.search-input').fill(q); await page.waitForTimeout(250);
  const hidden = await page.evaluate(() => document.querySelector('dialog[open] [data-testid=hidden-note]')?.innerText ?? null);
  const chips = await page.evaluate(() => [...document.querySelectorAll('dialog[open] [data-testid=food-row]')].slice(0, 3).map(r => r.querySelector('.food-name')?.textContent + ' <' + (r.querySelector('.chip-halal')?.textContent ?? 'no chip') + '>'));
  log('M4-' + q, { chips, hidden });
}
await S.finish('s7');
