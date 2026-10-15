import * as L from './lib.mjs';
const run = await L.launch({time:'2026-11-01T20:00:00+01:00'}); const p = run.page;
await L.onboardP1(run);
await p.goto(L.URL+'#/prep'); await p.waitForSelector('[data-testid=prep-view]');
await p.locator('[data-testid=library-row]').filter({hasText:/Chicken tikka rice bowl/}).getByTestId('library-cook').click();
await p.waitForSelector('[data-testid=cook-dialog]'); await p.getByTestId('cook-save').click(); await p.waitForTimeout(400);
const card=p.getByTestId('batch-card').first();
await card.getByTestId('fill-mon-thu').click();
await card.locator('[data-testid=place-day][data-date="2026-11-06"]').click(); await p.waitForTimeout(200);
await p.getByTestId('undo').click(); await p.waitForTimeout(300);
console.log('note after undo:', await card.getByTestId('batch-note').innerText({timeout:300}).catch(()=>'(none)'));
await p.goto(L.URL+'#/day'); await L.setTime(run,'2026-11-06T09:00:00+01:00'); await p.reload(); await p.waitForSelector('[data-testid=kcal-left]');
console.log('Friday entries after undo:', await L.entries(run));
await L.openSlot(run,'Lunch');
for (const q of ['potatoes','eggs','chapatis','tomatoes','onions']) { await L.search(run,q); console.log(q.padEnd(10),(await L.rowTexts(run,3)).map(s=>s.split(' | ')[0].slice(0,40)).join(' / ')); }
await run.browser.close();
