import * as L from './lib.mjs';
const run = await L.launch(); const p = run.page;
await L.skipOnboarding(run);
await L.openSlot(run,'Nashta');
for (const q of ['skyr','yogur proteico','yogurt','protein yogurt','greek','pot of skyr']) {
  await L.search(run,q);
  console.log('##',q, (await L.rowTexts(run,6)).map(t=>t.split(' | ')[0]).join(' || '));
}
await L.search(run,'omelette');
await L.tap(run, L.rows(run).first().locator('.food-main'));
console.log((await p.innerText('[data-testid=portion-picker]')).replace(/\n+/g,' | '));
await L.shot(run,'probe-omelette-picker');
await p.locator('[data-testid=portion-picker] button',{hasText:'Close'}).click();
for (const q of ['salad','dahi','whey','seb','chicken salan']) {
 await L.search(run,q);
 await L.tap(run, L.rows(run).first().locator('.food-main'));
 console.log(q,'=>',(await p.innerText('[data-testid=portion-picker]')).replace(/\n+/g,' | ').slice(0,400));
 await p.locator('[data-testid=portion-picker] button',{hasText:'Close'}).click();
}
await run.browser.close();
