import * as L from './lib.mjs';
const run = await L.launch({time:'2026-11-01T17:00:00+01:00'}); const p = run.page;
await L.onboardP1(run);
await p.goto(L.URL+'#/prep'); await p.waitForSelector('[data-testid=prep-view]');
L.start(run);
const jobs=[[/Overnight oats/,'oats'],[/Chicken tikka rice bowl/,'tikka'],[/Chicken karahi with 2 wholemeal roti/,'karahi']];
for (const [re,name] of jobs) {
  const row = p.locator('[data-testid=library-row]').filter({hasText:re}).first();
  await L.tap(run, row.getByTestId('library-cook')); await p.waitForSelector('[data-testid=cook-dialog]'); await p.waitForTimeout(300);
  console.log(name,'dialog storage:', (await p.getByTestId('cook-dialog').innerText()).replace(/\n+/g,' | ').match(/FRIDGE OR FREEZER.*?(Box 1.*?Box 2)/)?.[0].slice(0,260));
  console.log('   boxes default', await p.getByTestId('cook-boxes').innerText());
  await L.tap(run, p.getByTestId('cook-save')); await p.waitForTimeout(400);
  const card = p.getByTestId('batch-card').filter({hasText:re}).first();
  console.log('   slot pressed:', await card.getByTestId('place-slot').locator('[aria-pressed=true]').innerText());
  await L.tap(run, card.getByTestId('fill-mon-thu')); await p.waitForTimeout(300);
}
console.log('3 batches planned: actions', run.actions, 'secs', L.elapsed(run), '=> 12 meals');
await L.shot(run,'week-01-prep-top');
await p.goto(L.URL+'#/day'); await L.setTime(run,'2026-11-02T08:00:00+01:00'); await p.reload(); await p.waitForSelector('[data-testid=kcal-left]');
console.log('MON entries:', await L.entries(run));
console.log('MON totals:', (await L.totals(run)).all);
await L.shot(run,'week-02-monday');
await p.evaluate(()=>window.scrollTo(0,600)); await L.shot(run,'week-03-monday-scrolled');
await p.goto(L.URL+'#/week'); await p.waitForTimeout(500);
await L.shot(run,'week-04-week-tab');
console.log('week:', (await p.innerText('body')).replace(/\n+/g,' | ').slice(0,900));
await run.browser.close();
