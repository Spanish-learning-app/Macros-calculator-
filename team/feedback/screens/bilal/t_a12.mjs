import * as L from './lib.mjs';
const ST='/tmp/claude-0/d1-state.json';
let run = await L.launch({time:'2026-10-14T22:00:00+02:00', storageState:ST}); let p = run.page;
await p.goto(L.URL); await p.waitForSelector('[data-testid=kcal-left]');
L.start(run);
await L.tap(run, p.getByRole('button',{name:'Next day'}));
console.log('day', (await p.locator('[data-testid=day-title]').innerText()).replace(/\n/g,' '));
await L.openSlot(run,'Nashta');
console.log('sheet title', await L.sheet(run).locator('.dlg-title').innerText(), '|', await L.sheet(run).locator('.sheet-when').innerText());
await L.logFood(run,'roti',/Roti \/ chapati/);
await L.logFood(run,'omelette',/Desi omelette/,{serving:/^egg/, qty:2});
await L.setMeal(run,'Dinner');
await L.logFood(run,'chicken salan',/Chicken salan \(home/);
await L.done(run);
console.log('planned nashta+dinner actions', run.actions);
// copy X's lunch slot
const a0 = run.actions;
await L.tap(run, p.getByRole('button',{name:'More for Lunch'}));
await p.waitForTimeout(300);
await L.shot(run,'a12-01-slot-menu');
console.log('menu:', (await p.locator('[data-testid=slot-menu]').innerText()).replace(/\n+/g,' | '));
await L.tap(run, p.locator('[data-testid=copy-slot-yesterday]'));
await p.waitForTimeout(500);
await L.shot(run,'a12-02-after-copy-lunch');
console.log('copy lunch actions', run.actions-a0);
console.log('A12 planning total actions', run.actions, 'secs', L.elapsed(run));
console.log('totals tomorrow', (await L.totals(run)).all, '|', await p.locator('[data-testid=planned-total]').innerText());
// now 13:00 on X+1
await L.setTime(run,'2026-10-15T13:00:00+02:00');
await p.reload(); await p.waitForSelector('[data-testid=kcal-left]');
console.log('after reload at 13:00 X+1: title', (await p.locator('[data-testid=day-title]').innerText()).replace(/\n/g,' '));
await L.shot(run,'a12-03-day-at-1300');
const ticks = p.getByRole('button',{name:/Mark .* as eaten|as eaten/});
console.log('tick buttons', await ticks.count(), (await ticks.evaluateAll(els=>els.map(e=>e.getAttribute('aria-label')))).join(' || '));
let n=0;
for (const slot of ['breakfast','lunch']) {
  const entries = p.locator(`[data-testid=slot-${slot}] [data-testid=entry]`);
  const c = await entries.count();
  for (let i=0;i<c;i++){
    const btn = p.locator(`[data-testid=slot-${slot}] [data-testid=entry]`).nth(0).locator('button').first();
    // tick whichever planned entry remains first
    const planned = p.locator(`[data-testid=slot-${slot}] [data-testid=entry]`).filter({hasText:'Planned'}).first();
    if (!(await planned.count())) break;
    await L.tap(run, planned.locator('button').first());
    n++;
    await p.waitForTimeout(150);
  }
}
console.log('ticks', n);
await p.evaluate(()=>window.scrollTo(0,0));
await L.shot(run,'a12-04-after-ticks');
console.log('totals after ticks', (await L.totals(run)).all, '|', await p.locator('[data-testid=planned-total]').innerText());
console.log((await p.innerText('[data-testid=totals]')).replace(/\n+/g,' | '));
console.log('errors',run.errors);
await run.browser.close();
