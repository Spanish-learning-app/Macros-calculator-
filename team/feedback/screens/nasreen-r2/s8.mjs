import { open, shot, fullshot, txt, onboard, tab } from './lib2.mjs';
const S = await open('2026-10-15T08:30:00+02:00'); const {page}=S;
let n=0; const A=(m)=>{n++; console.log('action',n,m)};
await onboard(page); await tab(page,'Prep'); A('Prep tab');
await page.getByRole('button',{name:/New recipe/}).click(); A('New recipe'); await page.waitForTimeout(500);
await page.locator('dialog input').first().fill('Chicken salan pot'); A('type name');
await page.getByRole('button',{name:/Add ingredients/}).click(); A('Add ingredients'); await page.waitForTimeout(500);
const dlg = () => page.locator('dialog[open]').last();
async function add(q, rowText){
  const box = dlg().locator('input[type=search], input').first();
  await box.click(); await page.keyboard.press('Control+A'); await page.keyboard.type(q); A('type '+q); await page.waitForTimeout(500);
  const row = dlg().locator('li, [class*=row]').filter({hasText: rowText}).first();
  console.log('   ROW:', (await row.innerText()).replace(/\n/g,' | '));
  await row.getByRole('button').first().click(); A('tap + '+rowText); await page.waitForTimeout(400);
  await page.getByRole('button',{name:'Add to recipe'}).click(); A('Add to recipe'); await page.waitForTimeout(400);
}
await add('1 kg chicken','Chicken thigh, raw');
await add('3 onions','Onion');
await add('3 tomatoes','Tomato');
await shot(page,'15-tomato-search');
await add('4 tbsp oil','oil');
await shot(page,'16-oil-search');
{ const box = dlg().locator('input').first(); await box.click(); await page.keyboard.press('Control+A'); await page.keyboard.type('1 cup dahi'); A('type 1 cup dahi'); await page.waitForTimeout(600); await shot(page,'17-cup-dahi-nothing-found'); }
await add('dahi','Dahi (plain');
await page.getByRole('button',{name:'Done'}).click(); A('Done'); await page.waitForTimeout(500);
await shot(page,'18-recipe-after-ingredients'); await fullshot(page,'18-recipe-after-ingredients-full');
console.log(await dlg().innerText());
await page.screenshot({path:'/dev/null'});
const st = await page.context().storageState(); require_fs(st);
function require_fs(st){ }

await shot(page,'17-dahi-search');
await page.getByRole('button',{name:'Done'}).click(); A('Done'); await page.waitForTimeout(500);
await shot(page,'18-recipe-after-ingredients'); await fullshot(page,'18-recipe-after-ingredients-full');
console.log((await dlg().innerText()));
await S.browser.close();
