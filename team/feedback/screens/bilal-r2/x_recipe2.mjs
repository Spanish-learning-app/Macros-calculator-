import * as L from './lib.mjs';
const run = await L.launch({time:'2026-10-18T18:00:00+02:00'}); const p = run.page;
await L.skipOnboarding(run);
await p.goto(L.URL+'#/prep'); await p.waitForTimeout(400);
await p.getByTestId('new-recipe').click(); await p.waitForTimeout(400);
await p.getByTestId('add-ingredient').click(); await p.waitForTimeout(400);
const sh=p.locator('[data-testid=ingredient-sheet]');
for (const q of ['5 eggs','3 medium potatoes','1 medium onion','3 tbsp olive oil']) {
  await p.getByTestId('ingredient-search').fill(q); await p.waitForTimeout(300);
  console.log('==',q); console.log((await sh.innerText()).split('\n').slice(4,16).join(' | '));
  await L.shot(run,'x-ing-'+q.replace(/\W+/g,'_'));
}
await run.browser.close();
