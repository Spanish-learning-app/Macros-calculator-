import { start } from './lib.mjs';
const S = await start({ stateFrom: 's2-placed' });
const { page, tap, type, shot, log } = S;
await S.open('2026-10-19T17:30:00+02:00');
await tap(page.getByTestId('add-food'));
const sheet = page.locator('[data-testid=add-sheet]');
await shot('x4-sheet-open-1730');
console.log('TITLE', await sheet.locator('.dlg-title').innerText());
const rowsOf = async () => page.evaluate(() => [...document.querySelectorAll('dialog[open] [data-testid=food-row]')].map((r) => ({
  id: r.dataset.foodId, name: r.querySelector('.food-name')?.textContent, portion: r.querySelector('.food-portion')?.textContent,
  halal: r.querySelector('.entry-halal')?.textContent ?? r.querySelector('[data-testid=halal-chip]')?.textContent ?? null })));
const hidden = async () => page.evaluate(() => document.querySelector('dialog[open] [data-testid=hidden-note]')?.innerText ?? null);
const nullcheck = async () => page.evaluate(() => /(^|\n)null(\n|$)/.test(document.querySelector('dialog[open]').innerText));
// recents at open
console.log('RECENTS', JSON.stringify((await rowsOf()).slice(0,8)));
for (const q of ['skyr','yogur proteinas','yogur','mandarina','kinnow','platano','picos','pera','jamon','chorizo','gambas','calamares','chai','queso de burgos','feta','atun','lentejas','granada','huevo cocido']) {
  await sheet.locator('.search-input').fill(q); await page.waitForTimeout(250);
  const r = await rowsOf();
  console.log(q.padEnd(16), '|', r.slice(0,4).map(x => `${x.name}[${x.portion}]${x.halal?'<'+x.halal+'>':''}`).join(' ; '), '| hidden:', JSON.stringify(await hidden()), '| NULL?', await nullcheck());
}
await S.finish('x4');
