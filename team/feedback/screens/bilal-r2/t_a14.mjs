import * as L from './lib.mjs';
const run = await L.launch({time:'2026-10-14T13:30:00+02:00'}); const p = run.page;
await L.onboardP1(run);
await L.openSlot(run,'Lunch');
const pk = p.locator('[data-testid=portion-picker]'); const fd = p.locator('[data-testid=food-details]');
const list = [['#1','roti',/^Roti \/ chapati/],['#5','anda paratha',/Anda paratha/],['#7','daal chawal',/Daal chawal/],['#10','daal mash',/Daal mash/],['#13','karahi',/Chicken karahi \(home/],['#14','karahi',/Chicken karahi \(rest/],['#21','chai',/1 tsp sugar/],['#27','samosay',/Samosa/],['#38','lentejas',/^Lentejas/],['#39','tortilla',/^Tortilla de patatas/],['#42','croissant',/^Croissant/],['#49','tikka bowl',/tikka rice bowl/i]];
for (const [n,q,re] of list) {
  await L.search(run,q);
  const row = L.rows(run).filter({hasText:re}).first();
  await L.tap(run,row.locator('.food-main'));
  await pk.waitFor(); await p.waitForTimeout(250);
  const a=run.actions;
  await L.tap(run, pk.getByRole('button',{name:/Source and details/}));
  await fd.waitFor(); await p.waitForTimeout(250);
  const t=(await fd.innerText()).replace(/\n+/g,' | ');
  const g=(re)=>(t.match(re)||[])[1];
  console.log(n, '| conf:', g(/Confidence \| ([A-C]: [A-Za-z ]+)/), '| method:', (g(/Method \| (.*?) \| Confidence/)||'').slice(0,60), '| halal:', g(/Halal \| (.*?) \| Per 100/), '| energy:', g(/Energy \| (\d+ kcal)/), '| citation:', (g(/Citation \| (.*?) \| Method/)||'').slice(0,90));
  if (n==='#49') { await L.shot(run,'a14r2-tikka-source'); console.log('   full:', t.slice(0,900)); }
  if (n==='#42') { await L.shot(run,'a14r2-croissant-source'); console.log('   full:', t.slice(0,700)); }
  await L.tap(run, fd.getByRole('button',{name:/Close|Back|Done/}).first());
  await p.waitForTimeout(200);
  await pk.getByRole('button',{name:'Close'}).first().click(); 
  await p.waitForTimeout(200);
}
// skyr
for (const q of ['skyr','yogur proteico','greek yogurt','yogur griego','skyr yogurt','yogur skyr']) {
  await L.search(run,q);
  console.log('SKYR query', q, '->', (await L.rowTexts(run,4)).map(s=>s.split(' | ').slice(0,3).join(' / ')).join('  ||  '));
}
await L.search(run,'skyr');
const srow = L.rows(run).first();
await L.shot(run,'a14r2-skyr-results');
const sa=run.actions;
// source from the search row (does the row offer a direct source link?)
console.log('row buttons:', await srow.evaluate(r=>[...r.querySelectorAll('button')].map(b=>b.getAttribute('aria-label')||b.innerText)));
await L.tap(run, srow.locator('.food-main'));
await pk.waitFor(); await p.waitForTimeout(250);
console.log('skyr picker:', (await pk.innerText()).replace(/\n+/g,' | '));
await L.shot(run,'a14r2-skyr-picker');
await L.tap(run, pk.getByRole('button',{name:/Source and details/}));
await fd.waitFor(); await p.waitForTimeout(250);
console.log('skyr source actions from search row:', run.actions-sa);
console.log('skyr source:', (await fd.innerText()).replace(/\n+/g,' | ').slice(0,900));
await L.shot(run,'a14r2-skyr-source');
await L.tap(run, fd.getByRole('button',{name:/Close|Back|Done/}).first()); await p.waitForTimeout(200);
await pk.getByRole('button',{name:'Close'}).first().click(); await p.waitForTimeout(200);
// tikka box x1
await L.search(run,'tikka bowl');
await L.tap(run, L.rows(run).first().locator('.food-main'));
await pk.waitFor(); await p.waitForTimeout(300);
await L.shot(run,'a16r2-tikka-box-picker');
console.log('tikka picker:', (await pk.innerText()).replace(/\n+/g,' | '));
await L.tap(run, pk.getByRole('button',{name:/^Add to/}));
await p.waitForTimeout(300);
await L.done(run);
console.log('tikka entry:', (await L.entries(run)).join(' // '));
console.log((await L.totals(run)).all);
console.log((await p.innerText('body')).split('\n').filter(l=>/Eaten so far|\d+ \/ \d+ g/.test(l)).join(' | '));
await L.shot(run,'a16r2-tikka-day');
console.log('errors', run.errors);
await run.browser.close();
