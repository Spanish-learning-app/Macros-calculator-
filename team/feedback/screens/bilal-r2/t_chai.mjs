import * as L from './lib.mjs';
for (const time of ['2026-10-19T13:00:00+02:00','2026-10-19T17:00:00+02:00']) {
const run = await L.launch({time}); const p = run.page;
await L.onboardP1(run);
console.log('=====',time);
// before: default chai ranking, no history
await L.openSlot(run, time.includes('T13')?'Lunch':'Merienda');
await L.search(run,'chai');
console.log('BEFORE my-chai rows:', (await L.rowTexts(run,3)).map(s=>s.split(' | ').filter(x=>!/[؀-ۿ]/.test(x)).join(' / ')));
await L.done(run);
await L.tap(run, p.getByRole('link',{name:'Prep'})); await p.waitForSelector('[data-testid=prep-view]');
L.start(run);
await L.tap(run, p.getByTestId('chai-open')); await p.waitForSelector('[data-testid=chai-dialog]'); await p.waitForTimeout(300);
const d=p.getByTestId('chai-dialog');
console.log('pre-selected:', await d.evaluate(x=>[...x.querySelectorAll('input:checked')].map(i=>i.closest('label')?.innerText.replace(/\n/g,' ')||i.value)));
await L.check(run, d.getByRole('radio',{name:/Buffalo/}));
await L.check(run, d.getByRole('radio',{name:/^1½/}));
await L.check(run, d.getByRole('radio',{name:/^Cup/}));
await p.waitForTimeout(200);
console.log('preview:', await p.getByTestId('chai-preview').innerText());
await L.shot(run,'chai-02-set-'+time.slice(11,13));
await L.tap(run, p.getByTestId('chai-save')); await p.waitForTimeout(400);
console.log('SET chai actions', run.actions, L.elapsed(run));
console.log('chai card now:', (await p.getByTestId('chai-card').innerText()).replace(/\n+/g,' | '));
await L.shot(run,'chai-03-card-'+time.slice(11,13));
await L.tap(run, p.getByRole('link',{name:'Day'})); await p.waitForSelector('[data-testid=kcal-left]');
L.start(run);
await L.openSlot(run, time.includes('T13')?'Lunch':'Merienda');
console.log('AFTER rows:', (await L.rowTexts(run,3)).map(s=>s.split(' | ').filter(x=>!/[؀-ۿ]/.test(x)).join(' / ')));
await L.shot(run,'chai-04-sheet-'+time.slice(11,13));
// type chai
await L.search(run,'chai');
console.log('search chai rows:', (await L.rowTexts(run,3)).map(s=>s.split(' | ').filter(x=>!/[؀-ۿ]/.test(x)).join(' / ')));
await L.shot(run,'chai-05-search-'+time.slice(11,13));
await p.waitForTimeout(200);
for (let i=0;i<4;i++) await L.tap(run, L.rows(run).first().locator('.btn-plus'));
await L.done(run);
console.log('4 chai: actions incl open', run.actions, (await L.totals(run)).all.slice(0,60));
console.log('errors', run.errors);
await run.browser.close();
}
