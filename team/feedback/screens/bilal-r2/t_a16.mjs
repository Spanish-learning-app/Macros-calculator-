import * as L from './lib.mjs';
const run = await L.launch({time:'2026-10-18T18:00:00+02:00'}); const p = run.page;
await L.onboardP1(run);
await L.tap(run, p.getByRole('link',{name:'Prep'}));
await p.waitForSelector('[data-testid=prep-view]');
// step 1
L.start(run);
const row = p.locator('[data-testid=library-row]').filter({hasText:/Chicken tikka rice bowl/});
console.log('library row:', (await row.innerText()).replace(/\n+/g,' | '));
await L.tap(run, row.getByTestId('library-cook')); await p.waitForSelector('[data-testid=cook-dialog]'); await p.waitForTimeout(400);
await L.shot(run,'a16-01-cook-dialog');
console.log('cook dialog:\n'+(await p.getByTestId('cook-dialog').innerText()));
console.log('per-box:', await p.getByTestId('cook-per-box').innerText(), '| boxes', await p.getByTestId('cook-boxes').innerText());
await L.tap(run, p.getByTestId('cook-save')); await p.waitForTimeout(500);
console.log('A16 step 1: actions', run.actions, 'secs', L.elapsed(run));
await L.shot(run,'a16-02-batch-card',{fullPage:true});
console.log('batch card:\n'+(await p.getByTestId('batch-card').innerText()));
// step 2 own recipe
const sh=p.locator('[data-testid=ingredient-sheet]');
L.start(run);
await L.tap(run, p.getByTestId('new-recipe'));
await p.waitForSelector('[data-testid=recipe-editor]'); await p.waitForTimeout(300);
await L.type(run, p.getByTestId('recipe-name'), 'Tikka bowls');
await L.tap(run, p.getByTestId('add-ingredient')); await sh.waitFor(); await p.waitForTimeout(300);
const items=[['800 g chicken thigh',/thigh/i],['200 g dahi',/dahi|yogh?urt|curd/i],['2 tbsp oil',/^Olive oil|oil/i],['320 g dry basmati',/basmati/i],['2 cucumbers',/cucumber/i]];
for (const [q,re] of items) {
  await L.type(run, p.getByTestId('ingredient-search'), q); await p.waitForTimeout(250);
  const rs = await sh.locator('[data-testid=ingredient-row]').evaluateAll(els=>els.slice(0,4).map(e=>e.innerText.replace(/\n+/g,' / ')));
  console.log('  ',q,'=>',rs.join('  ||  '));
  const r = sh.locator('[data-testid=ingredient-row]').filter({hasText:re}).first();
  if (!(await r.count())) { console.log('   NO MATCH'); continue; }
  await L.tap(run, r.locator('.btn-plus')); await p.waitForTimeout(200);
}
await L.tap(run, sh.getByRole('button',{name:'Done'})); await p.waitForTimeout(400);
console.log('boxes default', await p.getByTestId('recipe-boxes').innerText());
console.log('4 boxes per-box:', await p.getByTestId('per-box').innerText(), '|', await p.getByTestId('recipe-total').innerText());
const a1=run.actions;
await L.shot(run,'a16-03-own-4boxes',{fullPage:true});
await L.tap(run, p.getByTestId('boxes-more')); await p.waitForTimeout(200);
console.log('5 boxes per-box:', await p.getByTestId('per-box').innerText(), '|', await p.getByTestId('recipe-total').innerText());
console.log('halal:', await p.getByTestId('recipe-halal').innerText());
await L.shot(run,'a16-04-own-5boxes',{fullPage:true});
await L.tap(run, p.getByTestId('recipe-save')); await p.waitForTimeout(400);
console.log('A16 step 2: actions', run.actions, 'secs', L.elapsed(run), '(change 4->5 cost 1 action)');
// step 3
await L.tap(run, p.getByTestId('new-recipe')); await L.tap(run, p.getByTestId('add-ingredient')); await sh.waitFor();
await L.type(run, p.getByTestId('ingredient-search'), 'ensaimada'); await p.waitForTimeout(300);
console.log('ensaimada:', (await sh.innerText()).split('\n').slice(4,10).join(' | '), '| rows', await sh.locator('[data-testid=ingredient-row]').count());
await L.shot(run,'a16-05-ensaimada-blocked');
for (const q of ['pork','bacon','jamón','chorizo','lard','ensaïmada','cerdo','ham']) {
  await p.getByTestId('ingredient-search').fill(q); await p.waitForTimeout(250);
  const rs = await sh.locator('[data-testid=ingredient-row]').evaluateAll(els=>els.slice(0,3).map(e=>e.innerText.replace(/\n+/g,' / ')));
  const b = await sh.locator('[data-testid=ingredient-blocked]').innerText({timeout:100}).catch(()=>null);
  console.log(q,'rows:',rs.join(' || '),'| blocked:',b);
}
console.log('errors',run.errors);
await run.browser.close();
