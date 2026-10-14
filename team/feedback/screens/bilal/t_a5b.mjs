import * as L from './lib.mjs';
const ST='/tmp/claude-0/d1-state.json';
// ---------- A5(b)
let run = await L.launch({time:'2026-10-14T21:30:00+02:00', storageState:ST}); let p = run.page;
await p.goto(L.URL); await p.waitForSelector('[data-testid=kcal-left]');
console.log('X totals before', (await L.totals(run)).all, 'entries', (await L.entries(run)).length);
const before = await L.entries(run);
L.start(run);
await L.tap(run, p.getByRole('button',{name:'Next day'}));
console.log('title', await p.locator('[data-testid=day-title]').innerText());
await L.shot(run,'a5b-01-tomorrow-empty');
await L.tap(run, p.locator('[data-testid=copy-yesterday]'));
await p.waitForTimeout(500);
console.log('A5b actions',run.actions,'secs',L.elapsed(run));
await L.shot(run,'a5b-02-after-copy');
const after = await L.entries(run);
console.log('X+1 entries',after.length,'totals',(await L.totals(run)).all);
console.log('same?', JSON.stringify(before)===JSON.stringify(after));
if (JSON.stringify(before)!==JSON.stringify(after)) { console.log(before.map((b,i)=>b===after[i]?'':'DIFF '+b+' <> '+after[i]).filter(Boolean)); }
console.log('body top', (await p.innerText('body')).slice(0,450).replace(/\n+/g,' | '));
console.log('undo toast', await p.locator('[data-testid=undo]').innerText().catch(()=>'none'), 'visible', await p.locator('[data-testid=undo]').isVisible());
await L.tap(run, p.locator('[data-testid=undo] button'));
await p.waitForTimeout(400);
console.log('after one Undo: entries', (await L.entries(run)).length);
await L.tap(run, p.getByRole('button',{name:'Previous day'}));
console.log('X entries after undo', (await L.entries(run)).length, (await L.totals(run)).all);
console.log('errors', run.errors, run.dialogs);
await run.browser.close();
