import { open, shot, fullshot, txt, onboard, tab } from './lib2.mjs';
const S = await open('2026-10-15T08:30:00+02:00'); const {page}=S;
let n=0; const A=(m)=>{n++; console.log('action',n,m)};
await onboard(page); await tab(page,'Prep'); A('Prep tab');
await page.getByRole('button',{name:/New recipe/}).click(); A('New recipe'); await page.waitForTimeout(500);
await page.locator('dialog input').first().fill('Chicken salan pot'); A('type name');
await page.getByRole('button',{name:/Add ingredients/}).click(); A('Add ingredients'); await page.waitForTimeout(500);
const dlg = () => page.locator('dialog[open]').last();
async function add(q, rowText, opts={}){
  await page.keyboard.press('Control+A'); await page.keyboard.type(q); A('type '+q); await page.waitForTimeout(500);
  const row = dlg().locator('li, [class*=row]').filter({hasText: rowText}).first();
  console.log('ROW:', (await row.innerText()).replace(/\n/g,' | '));
  await row.getByRole('button').first().click(); A('tap + '+rowText); await page.waitForTimeout(400);
  if(opts.pre) await opts.pre();
  await page.getByRole('button',{name:'Add to recipe'}).click(); A('Add to recipe'); await page.waitForTimeout(400);
}
await add('1 kg chicken','Chicken thigh, raw');
await shot(page,'13-after-first-ingredient');
console.log('--- after first\n'+(await dlg().innerText()).slice(0,800));
await add('3 onions','Onion');
await add('3 tomatoes','Tomato');
await shot(page,'14-after-three-ingredients');
console.log('--- ' + (await dlg().innerText()).slice(0,1200));
await S.browser.close();
