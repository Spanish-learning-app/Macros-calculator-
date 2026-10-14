import * as L from './lib.mjs';
const run = await L.launch({time:'2026-10-14T09:00:00+02:00'}); const p = run.page;
await L.skipOnboarding(run);
console.log('(1) slot labels:', await p.locator('[data-testid^=slot-] h3').allInnerTexts().catch(()=>[]), await p.evaluate(()=>[...document.querySelectorAll('[data-testid^=slot-]')].map(e=>e.querySelector('h2,h3')?.innerText)));
L.start(run);
await L.tap(run, p.locator('[data-testid=add-food]'));
await L.sheet(run).waitFor(); await p.waitForTimeout(300);
console.log('sheet opened on:', await L.sheet(run).locator('.dlg-title').innerText(), '| meal select:', await L.sheet(run).locator('select').inputValue());
await L.logFood(run,'cafe amb llet',/Café con leche/);
await L.search(run,'croissant');
await L.shot(run,'a19-01-croissant-row');
const crow = L.rows(run).first();
console.log('croissant row:', (await crow.innerText()).replace(/\n+/g,' | '));
await L.tap(run, crow.locator('.btn-plus'));
await L.logFood(run,'suc de taronja',/Zumo de naranja/);
await L.done(run);
console.log('after 3 entries actions', run.actions);
await L.setTime(run,'2026-10-14T11:30:00+02:00');
await L.tap(run, p.locator('[data-testid=add-food]'));
await L.sheet(run).waitFor(); await p.waitForTimeout(300);
console.log('11:30 sheet opened on:', await L.sheet(run).locator('.dlg-title').innerText());
await L.logFood(run,'tallat',/Cortado/);
await L.done(run);
console.log('A19 steps 2-3 actions', run.actions, 'secs', L.elapsed(run));
for (const e of await L.entries(run)) console.log('  ',e);
console.log('slot sections:', (await p.innerText('body')).replace(/\n+/g,' | ').slice(0,600));
await L.shot(run,'a19-02-day');
// step 4
await L.tap(run, p.locator('[data-testid=add-food]'));
await L.sheet(run).waitFor();
const words = {
 '#37':['pa amb tomàquet','pa amb tomaquet','pan con tomate','tomato bread'],
 '#40':['cafè amb llet','cafe amb llet','café con leche','cafe con leche','coffee with milk','latte'],
 '#41':['tallat','cortado'],
 '#42':['croissant','cruasán','cruasan'],
 '#43':['napolitana de xocolata','napolitana de chocolate','chocolate croissant','pain au chocolat'],
 '#44':['suc de taronja','zumo de naranja','orange juice'],
 '#45':['entrepà de truita','entrepa de truita','bocadillo de tortilla','tortilla sandwich'],
 '#47':['torrada amb oli','tostada con aceite','toast with olive oil'],
};
for (const [k,ws] of Object.entries(words)) for (const w of ws) {
  await L.search(run,w);
  const t = await L.rowTexts(run,3);
  console.log(k, JSON.stringify(w).padEnd(30), '->', t.map(s=>s.split(' | ')[0]).join(' / '));
}
await run.browser.close();
