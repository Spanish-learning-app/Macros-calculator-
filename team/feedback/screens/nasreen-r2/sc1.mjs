import { open, shot, fullshot, txt, onboard, tab } from './lib2.mjs';
const S = await open('2026-10-15T13:30:00+02:00'); const {page}=S;
let n=0; const A=(m)=>{n++; console.log('action',n,m)};
await onboard(page); await tab(page,'Prep'); A('Prep tab');
await page.getByRole('button',{name:/New recipe/}).click(); A('New recipe'); await page.waitForTimeout(500);
await page.locator('dialog input').first().fill('Chicken salan pot'); A('type name');
await page.getByRole('button',{name:/Add ingredients/}).click(); A('Add ingredients'); await page.waitForTimeout(500);
const dlg = () => page.locator('dialog[open]').last();
async function add(q, rowText){
  const box = dlg().locator('input').first();
  await box.click(); await page.keyboard.press('Control+A'); await page.keyboard.type(q); A('type '+q); await page.waitForTimeout(500);
  const row = dlg().locator('li, [class*=row]').filter({ hasText: rowText }).first();
  await row.getByRole('button').first().click(); A('tap + '+rowText); await page.waitForTimeout(400);
  await page.getByRole('button',{name:'Add to recipe'}).click(); A('Add to recipe'); await page.waitForTimeout(400);
}
await add('1 kg chicken','Chicken thigh, raw');
await add('3 onions','Onion');
await add('3 tomatoes','Tomato');
await add('4 tbsp oil','Cooking oil');
await add('dahi','Dahi (plain');
await page.getByRole('button',{name:'Done'}).click(); A('Done'); await page.waitForTimeout(500);
// how many katori does it make? family 5 -> say 6 katori? I think of katoris: 1.2kg / ~170g = 7
await page.locator('dialog[open]').last().locator('input[inputmode=decimal], input[type=number], input[placeholder=optional]').last().fill('1200'); A('type cooked pot 1200');
await shot(page,'19-recipe-pot-1200');
console.log((await dlg().innerText()).split('Cooked pot')[1]);
await dlg().getByRole('button',{name:/Save recipe/}).click(); A('Save recipe'); await page.waitForTimeout(600);
await shot(page,'20-after-save-recipe');
console.log('ACTIONS so far', n);
console.log((await txt(page)).split('Library')[0]);
await S.browser.close();
