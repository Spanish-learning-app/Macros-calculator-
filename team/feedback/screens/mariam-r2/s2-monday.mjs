// Scenario 2: Monday 19 Oct, log one day fully. Count actions and seconds per scene.
import { start } from './lib.mjs';
const S = await start({ stateFrom: 's2-placed' });
const { page, tap, type, shot, log } = S;
const sheet = page.locator('[data-testid=add-sheet]');
const fab = page.getByTestId('add-food');
const addId = (id) => sheet.locator(`[data-testid=food-row][data-food-id="${id}"] .btn-plus`);
const rows = () => page.evaluate(() => [...document.querySelectorAll('dialog[open] [data-testid=food-row]')].map(r => r.dataset.foodId));
const entries = () => page.evaluate(() => [...document.querySelectorAll('[data-testid^=slot-]')].map((s) => ({
  slot: s.querySelector('.slot-title')?.textContent, sub: s.querySelector('.slot-sub')?.textContent,
  items: [...s.querySelectorAll('[data-testid=entry]')].map((e) => `${e.querySelector('.entry-name')?.textContent?.slice(0, 40)} | ${e.querySelector('.entry-line')?.textContent} | ${e.dataset.status}`) })));
const totals = () => page.evaluate(() => document.querySelector('[data-testid=totals]')?.innerText.replace(/\n+/g, ' / '));
const tickEntry = async (nameFrag) => { await tap(page.locator('[data-testid=entry]', { hasText: nameFrag }).locator('.entry-status')); };
const search = async (q) => { await type(sheet.locator('.search-input'), q); };
const done = async () => { await tap(sheet.getByRole('button', { name: 'Done' })); await page.waitForTimeout(250); };

// ---- 08:10 breakfast: tick the parfait; coffee
await S.open('2026-10-19T08:10:00+02:00');
S.startCount('Mon-0810-parfait-tick');
await tickEntry('parfait');
log('Mon-0810-parfait-tick', { ...S.stopCount() });
S.startCount('Mon-0815-cafe-con-leche');
await tap(fab);
log('sheet-title-0815', await sheet.locator('.dlg-title').innerText());
await search('cafe amb llet');
log('cafe-rank', (await rows()).indexOf('es-cafe-con-leche') + 1);
await tap(addId('es-cafe-con-leche'));
await done();
log('Mon-0815-cafe-con-leche', { ...S.stopCount() });
await shot('s2-mon-1-breakfast');

// ---- 13:30 microwave queue: open app, tick lunch
await S.open('2026-10-19T13:30:00+02:00');
await shot('s2-mon-2-open-1330');
const lunchTick = page.locator('[data-testid=entry]', { hasText: 'Lentil' }).locator('.entry-status');
const box = await lunchTick.boundingBox();
log('lunch-tick-position-on-open-1330', box ? { y: Math.round(box.y), h: Math.round(box.height), inViewport: box.y + box.height < 860 } : null);
S.startCount('Mon-1330-lunch-tick');
await lunchTick.scrollIntoViewIfNeeded();
await tap(lunchTick);
log('Mon-1330-lunch-tick', { ...S.stopCount() });
await shot('s2-mon-3-lunch-ticked');
log('lunch-use-note', await page.locator('[data-testid=entry]', { hasText: 'Lentil' }).innerText());

// ---- 17:30 merienda: ready-to-eat: 2 protein yogurts, a kinnow, a banana
const addName = async (frag) => { await tap(sheet.locator('[data-testid=food-row]', { hasText: frag }).first().locator('.btn-plus')); };
await S.open('2026-10-19T17:30:00+02:00');
S.startCount('Mon-1730-merienda-ready');
await tap(fab);
log('sheet-title-1730', await sheet.locator('.dlg-title').innerText());
await search('yogur proteinas');
await addName('Protein yogurt');
await addName('Protein yogurt');
await search('mandarina');
await addName('Kinnow');
await search('platano');
await addName('Banana');
await shot('s2-mon-4-merienda-sheet');
await done();
log('Mon-1730-merienda-ready', { ...S.stopCount() });
await shot('s2-mon-5-after-merienda');
log('merienda-entries', (await entries()).filter(s => /Merienda/.test(s.slot)));

// ---- 21:00 dinner tick, then late snack picos + pear at 22:30
await S.open('2026-10-19T21:00:00+02:00');
S.startCount('Mon-2100-dinner-tick');
const dTick = page.locator('[data-testid=entry]', { hasText: 'Mandonguilles' }).locator('.entry-status');
await dTick.scrollIntoViewIfNeeded();
await tap(dTick);
log('Mon-2100-dinner-tick', { ...S.stopCount() });
await shot('s2-mon-6-dinner-ticked');
await S.open('2026-10-19T22:30:00+02:00');
S.startCount('Mon-2230-snack-picos-pear');
await tap(fab);
log('sheet-title-2230', await sheet.locator('.dlg-title').innerText());
await search('picos');
await addName('Picos integrales');
await search('pera');
await addName('Pear');
await done();
log('Mon-2230-snack-picos-pear', { ...S.stopCount() });
await page.evaluate(() => window.scrollTo(0, 0));
await shot('s2-mon-7-end-of-day-top');
await shot('s2-mon-8-end-of-day-full', { fullPage: true });
log('end-of-day-totals', await totals());
log('end-of-day-entries', await entries());
log('top-text', (await page.evaluate(() => document.querySelector('#app').innerText)).split('\n').slice(0, 22).join(' / '));
await S.save('s2-mon-done');
await S.finish('s2-monday');
