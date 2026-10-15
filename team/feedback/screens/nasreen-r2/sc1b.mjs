import { open, shot, fullshot, txt, onboard, tab } from './lib2.mjs';
export async function makeSalan(page){
const dlg = () => page.locator('dialog[open]').last();
await tab(page,'Prep');
await page.getByRole('button',{name:/New recipe/}).click(); await page.waitForTimeout(500);
await page.locator('dialog input').first().fill('Chicken salan pot');
await page.getByRole('button',{name:/Add ingredients/}).click(); await page.waitForTimeout(500);
async function add(q, rowText){
  const box = dlg().locator('input').first();
  await box.click(); await page.keyboard.press('Control+A'); await page.keyboard.type(q); await page.waitForTimeout(500);
  const row = dlg().locator('li, [class*=row]').filter({ hasText: rowText }).first();
  await row.getByRole('button').first().click(); await page.waitForTimeout(400);
  await page.getByRole('button',{name:'Add to recipe'}).click(); await page.waitForTimeout(400);
}
await add('1 kg chicken','Chicken thigh, raw'); await add('3 onions','Onion'); await add('3 tomatoes','Tomato'); await add('4 tbsp oil','Cooking oil'); await add('dahi','Dahi (plain');
await page.getByRole('button',{name:'Done'}).click(); await page.waitForTimeout(500);
await dlg().locator('input[placeholder=optional]').fill('1200');
await dlg().getByRole('button',{name:/Save recipe/}).click(); await page.waitForTimeout(600);
}
