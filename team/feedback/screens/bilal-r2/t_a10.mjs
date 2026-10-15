import * as L from './lib.mjs';
const run = await L.launch({time:'2026-10-18T19:30:00+02:00'}); const p = run.page;
await L.onboardP1(run);
await L.tap(run, p.getByRole('link',{name:'Prep'}));
await p.waitForSelector('[data-testid=prep-view]');
const sh=p.locator('[data-testid=ingredient-sheet]');
async function build(name, items, boxes) {
  await L.tap(run, p.getByTestId('new-recipe'));
  await p.waitForSelector('[data-testid=recipe-editor]'); await p.waitForTimeout(300);
  await L.type(run, p.getByTestId('recipe-name'), name);
  await L.tap(run, p.getByTestId('add-ingredient'));
  await sh.waitFor(); await p.waitForTimeout(300);
  for (const [q,re] of items) {
    await L.type(run, p.getByTestId('ingredient-search'), q); await p.waitForTimeout(250);
    const row = sh.locator('[data-testid=ingredient-row]').filter({hasText:re}).first();
    console.log('  ',q,'->',(await row.innerText()).replace(/\n+/g,' | '));
    await L.tap(run, row.locator('.btn-plus')); await p.waitForTimeout(200);
  }
  await L.tap(run, sh.getByRole('button',{name:'Done'})); await p.waitForTimeout(400);
  const cur = Number(await p.getByTestId('recipe-boxes').innerText());
  for (let i=cur;i>boxes;i--) await L.tap(run, p.getByTestId('boxes-less'));
  for (let i=cur;i<boxes;i++) await L.tap(run, p.getByTestId('boxes-more'));
  await p.waitForTimeout(200);
  console.log('  per-box:', await p.getByTestId('per-box').innerText(), '| total:', await p.getByTestId('recipe-total').innerText({timeout:500}).catch(()=>'(no whole-pot line)'));
  await L.shot(run,'a10-'+name.replace(/\W+/g,'_')+'-editor',{fullPage:true});
  await L.tap(run, p.getByTestId('recipe-save')); await p.waitForTimeout(400);
}
// Part 1
L.start(run);
await build('Mi tortilla',[['5 eggs',/Egg, whole, raw/],['3 potato',/Potato, raw/],['1 onion',/^Onion/],['3 tbsp olive oil',/^Olive oil/]],1);
console.log('A10 step 1 (tortilla recipe): actions', run.actions, 'secs', L.elapsed(run));
// Part 2 log 0.5 at dinner
await L.tap(run, p.getByRole('link',{name:'Day'})); await p.waitForSelector('[data-testid=kcal-left]');
const a0=run.actions; L.start(run);
await L.openSlot(run,'Dinner');
await L.search(run,'mi tortilla');
console.log('search rows:', await L.rowTexts(run,4));
await L.tap(run, L.rows(run).filter({hasText:/Mi tortilla/}).first().locator('.food-main'));
const pk = p.locator('[data-testid=portion-picker]'); await pk.waitFor(); await p.waitForTimeout(300);
console.log('picker:', (await pk.innerText()).replace(/\n+/g,' | '));
await L.shot(run,'a10-picker-tortilla');
await L.tap(run, pk.getByRole('button',{name:'½',exact:true}));
console.log('preview 0.5:', (await p.locator('[data-testid=portion-preview]').innerText()).replace(/\n+/g,' | '));
await L.shot(run,'a10-picker-half');
await L.tap(run, pk.getByRole('button',{name:/^Add to/})); await p.waitForTimeout(300);
await L.done(run);
console.log('A10 step 2 (log 0.5): actions', run.actions, 'secs', L.elapsed(run));
console.log('entries', await L.entries(run));
console.log('totals', (await L.totals(run)).all);
await L.shot(run,'a10-day-half-tortilla');
// open entry source
// Part 3 next day from recents
await L.setTime(run,'2026-10-19T19:30:00+02:00'); await p.reload(); await p.waitForSelector('[data-testid=kcal-left]');
L.start(run);
await L.openSlot(run,'Dinner'); await p.waitForTimeout(300);
console.log('recents:', await L.rowTexts(run,3));
await L.shot(run,'a10-recents-nextday');
const rr = L.rows(run).filter({hasText:/Mi tortilla/}).first();
console.log('recent row:', (await rr.innerText()).replace(/\n+/g,' | '));
await L.tap(run, rr.locator('.btn-plus')); await p.waitForTimeout(300);
await L.done(run);
console.log('A10 step 3 (re-log from recents): actions', run.actions, 'secs', L.elapsed(run));
console.log('entries', await L.entries(run));
// Part 4 lentejas
await L.tap(run, p.getByRole('link',{name:'Prep'})); await p.waitForSelector('[data-testid=prep-view]');
L.start(run);
await build('Lentejas',[['250 g lentils',/lentil/i],['1 carrot',/carrot/i],['1 potato',/Potato, raw/],['1 onion',/^Onion/],['2 tbsp olive oil',/^Olive oil/],['150 g sausage',/sausage/i]],3);
console.log('A10 lentejas recipe: actions', run.actions, 'secs', L.elapsed(run));
console.log('errors', run.errors);
await run.browser.close();
