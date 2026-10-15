import * as L from './lib.mjs';
const run = await L.launch({time:'2026-10-18T18:00:00+02:00'}); const p = run.page;
await L.skipOnboarding(run);
await p.goto(L.URL+'#/prep'); await p.waitForTimeout(400);
await p.getByTestId('new-recipe').click(); await p.waitForTimeout(400);
await p.getByTestId('add-ingredient').click(); await p.waitForTimeout(400);
const sh=p.locator('[data-testid=ingredient-sheet]');
for (const q of ['3 potatoes','3 potato','potato','1 onion','onion','3 medium potatoes raw','1 medium','tortilla']) {
  await p.getByTestId('ingredient-search').fill(q); await p.waitForTimeout(300);
  console.log('==',q); console.log((await sh.innerText()).split('\n').slice(4,14).join(' | '));
}
await p.getByTestId('ingredient-search').fill('5 eggs'); await p.waitForTimeout(300);
await sh.locator('[data-food-id=pk-egg-raw], [data-food-id*=raw]').first().locator('.btn-plus').click().catch(e=>console.log('plus fail'));
await p.waitForTimeout(400);
await L.shot(run,'x-after-plus');
console.log((await p.innerText('body')).slice(0,1200));
await run.browser.close();
