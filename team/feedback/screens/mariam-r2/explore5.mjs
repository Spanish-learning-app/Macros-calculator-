import { start } from './lib.mjs';
const S = await start({ stateFrom: 's2-placed' });
const { page, tap, shot } = S;
await S.open('2026-10-19T17:30:00+02:00');
await tap(page.getByTestId('add-food'));
const sheet = page.locator('[data-testid=add-sheet]');
for (const q of ['gambas','chorizo','jamon', 'calamares', 'ensaimada']) {
  await sheet.locator('.search-input').fill(q); await page.waitForTimeout(300);
  await shot('x5-' + q);
  console.log(q, '=>', (await sheet.innerText()).replace(/\n+/g,' | ').slice(0, 500));
}
await S.finish('x5');
