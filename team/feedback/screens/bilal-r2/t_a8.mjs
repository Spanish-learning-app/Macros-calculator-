import * as L from './lib.mjs';
const run = await L.launch({time:'2026-10-14T13:00:00+02:00'}); const p = run.page;
await L.onboardP1(run);
await L.openSlot(run,'Lunch');
const pk = p.locator('[data-testid=portion-picker]');
const prev = async()=> (await p.locator('[data-testid=portion-preview]').innerText()).replace(/\n+/g,' | ');
// 1
L.start(run);
await L.search(run,'daal mash');
await L.tap(run, L.rows(run).filter({hasText:/Daal mash/}).first().locator('.food-main'));
await pk.waitFor(); await p.waitForTimeout(300);
console.log('servings:', (await pk.locator('.segmented-field, fieldset').first().innerText().catch(()=>'')).replace(/\n+/g,' | '));
await L.tap(run, pk.getByRole('button',{name:'1½',exact:true}));
console.log('1.5 katori preview:', await prev());
const sourceBtn = pk.getByRole('button',{name:/Source and details/});
await L.shot(run,'a8r2-01-daalmash-1.5');
await L.tap(run, pk.getByRole('button',{name:/^Add to/}));
await p.waitForTimeout(300);
console.log('step1 actions', run.actions);
// 2
const s2 = run.actions;
await L.search(run,'rice');
await L.tap(run, L.rows(run).filter({hasText:/^Rice, plain/}).first().locator('.food-main'));
await pk.waitFor(); await p.waitForTimeout(300);
console.log('rice servings:', (await pk.innerText()).replace(/\n+/g,' | ').slice(0,300));
await L.shot(run,'a8r2-02-rice-picker');
const plate = pk.locator('label,button').filter({hasText:/plate/i}).first();
if (await plate.count()) { await L.tap(run, plate); await L.tap(run, pk.getByRole('button',{name:'½',exact:true})); console.log('rice plate 0.5:', await prev()); } else console.log('NO PLATE SERVING for rice');
await L.shot(run,'a8r2-03-rice-half-plate');
// 3 type 0.33
await L.type(run, p.locator('[data-testid=qty-input]'),'0.33');
console.log('0.33:', await prev());
await L.shot(run,'a8r2-04-qty-033');
// 4 invalid
for (const v of ['0','','-1','abc']) {
  await L.type(run, p.locator('[data-testid=qty-input]'), v);
  const err = await p.locator('[data-testid=qty-error]').innerText().catch(()=>'(none)');
  const addBtn = pk.getByRole('button',{name:/^Add to/});
  console.log(`qty "${v}" -> error: "${err.trim()}" | add disabled: ${await addBtn.isDisabled()} | preview: ${(await prev()).slice(0,60)}`);
  if (v==='-1') await L.shot(run,'a8r2-05-qty-negative');
}
// try pressing add with 0
await p.locator('[data-testid=qty-input]').fill('0');
await pk.getByRole('button',{name:/^Add to/}).click({force:true}).catch(()=>{});
await p.waitForTimeout(200);
console.log('dialogs', run.dialogs, 'picker still open', await pk.isVisible());
// stepper
await p.locator('[data-testid=qty-input]').fill('1');
await L.tap(run, pk.getByRole('button',{name:'More'}));
console.log('after More from 1:', await p.locator('[data-testid=qty-input]').inputValue());
await L.tap(run, pk.getByRole('button',{name:'Less'})); await L.tap(run, pk.getByRole('button',{name:'Less'}));
console.log('after Less x2:', await p.locator('[data-testid=qty-input]').inputValue());
await p.locator('[data-testid=qty-input]').fill('0.5');
await L.tap(run, pk.getByRole('button',{name:'Less'}));
console.log('Less at 0.5 ->', await p.locator('[data-testid=qty-input]').inputValue());
// now log rice plate x0.5
await p.locator('[data-testid=qty-input]').fill('0.5');
await pk.getByRole('button',{name:/^Add to/}).click();
await p.waitForTimeout(300);
await L.done(run);
console.log('entries', await L.entries(run));
console.log('errors', run.errors, run.dialogs);
await run.browser.close();
