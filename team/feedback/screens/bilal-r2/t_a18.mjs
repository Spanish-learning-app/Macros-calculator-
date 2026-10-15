import * as L from './lib.mjs';
const run = await L.launch({time:'2026-11-01T18:00:00+01:00'}); const p = run.page;
await L.onboardP1(run);
await L.tap(run, p.getByRole('link',{name:'Prep'}));
await p.waitForSelector('[data-testid=prep-view]');
const row = p.locator('[data-testid=library-row]').filter({hasText:/Chicken tikka rice bowl/});
await row.getByTestId('library-cook').click(); await p.waitForSelector('[data-testid=cook-dialog]');
await p.getByTestId('cook-save').click(); await p.waitForTimeout(500);
const card = () => p.getByTestId('batch-card').first();
// place Mon-Thu with Fill (1 action)
L.start(run);
await L.tap(run, card().getByTestId('fill-mon-thu')); await p.waitForTimeout(300);
console.log('Fill Mon-Thu: actions', run.actions, '|', (await card().innerText()).replace(/\n+/g,' | ').slice(0,420));
await L.shot(run,'a18-01-filled',{fullPage:true});
const go = async (iso, route) => { await L.setTime(run, iso); await p.goto(L.URL+'#/'+route); await p.reload(); await p.waitForTimeout(500); };
// (2) Sunday 21:00
await go('2026-11-01T21:00:00+01:00','prep');
console.log('(2) Sun 21:00 box1:', (await card().locator('[data-testid=box-row][data-box="1"]').innerText()).replace(/\n+/g,' | '));
console.log('    box2:', (await card().locator('[data-testid=box-row][data-box="2"]').innerText()).replace(/\n+/g,' | '));
await L.shot(run,'a18-02-sun-2100');
// (3) Mon 12:00 day view
await go('2026-11-02T12:00:00+01:00','day');
console.log('(3) Mon 12:00 entries:', await L.entries(run));
await L.shot(run,'a18-03-mon-1200-day');
// (4) Mon 22:00 move box 2
await go('2026-11-02T22:00:00+01:00','prep');
await L.shot(run,'a18-04-mon-2200-prep',{fullPage:true});
console.log('prep top Mon 22:00:\n'+(await p.innerText('body')).split('\n').slice(0,40).join(' | '));
console.log('move-tonight:', await p.getByTestId('move-tonight').innerText({timeout:500}).catch(()=>'(no move-tonight card)'));


L.start(run);
await L.tap(run, p.getByTestId('move-tonight').getByRole('button',{name:/Move to fridge/})); await p.waitForTimeout(400);
console.log('(4) Move to fridge: actions', run.actions);
console.log('    box2 now:', (await card().locator('[data-testid=box-row][data-box="2"]').innerText()).replace(/\n+/g,' | '));
console.log('    tonight card now:', await p.getByTestId('move-tonight').innerText({timeout:300}).catch(()=>'(gone)'));
await L.shot(run,'a18-05-after-move',{fullPage:true});
// (5) Tue 09:00
await go('2026-11-03T09:00:00+01:00','day');
console.log('(5) Tue 09:00 day entries:', await L.entries(run));
await L.shot(run,'a18-06-tue-0900-day');
await go('2026-11-03T09:00:00+01:00','prep');
console.log('    batch box1:', (await card().locator('[data-testid=box-row][data-box="1"]').innerText()).replace(/\n+/g,' | '));
console.log('    batch box2:', (await card().locator('[data-testid=box-row][data-box="2"]').innerText()).replace(/\n+/g,' | '));
await L.shot(run,'a18-07-tue-0900-prep',{fullPage:true});
// also check Monday's day view (Mon uneaten box 1 on Mon)
await L.setTime(run,'2026-11-02T22:30:00+01:00'); 
// (6) chaat on Sunday
await go('2026-11-08T11:00:00+01:00','prep');
const chaat = p.locator('[data-testid=library-row]').filter({hasText:/Chicken chana chaat/});
L.start(run);
await L.tap(run, chaat.getByTestId('library-cook')); await p.waitForSelector('[data-testid=cook-dialog]'); await p.waitForTimeout(400);
console.log('(6) chaat dialog:\n'+(await p.getByTestId('cook-dialog').innerText()));
await L.shot(run,'a18-08-chaat-dialog');
await L.tap(run, p.getByTestId('cook-save')); await p.waitForTimeout(500);
const cards = p.getByTestId('batch-card');
console.log('batch cards', await cards.count());
for (let i=0;i<await cards.count();i++){ const t=(await cards.nth(i).innerText()).replace(/\n+/g,' | '); if(/chaat/i.test(t)) console.log('chaat card:', t.slice(0,600)); }
await L.shot(run,'a18-09-chaat-batch',{fullPage:true});
console.log('chaat actions', run.actions);
await run.browser.close();
