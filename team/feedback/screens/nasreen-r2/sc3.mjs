import { open, shot, txt, onboard, tab, pakistaniTimes, dlg } from './lib3.mjs';
const S = await open('2026-10-15T13:30:00+02:00'); const {page, ctx}=S;
let n=0; const A=(m)=>{n++; console.log('action',n,m)};
await onboard(page); await pakistaniTimes(page);
const addFood=async(q,name,chip)=>{
  await dlg(page).locator('input').first().click(); await page.keyboard.press('Control+A'); await page.keyboard.type(q); A('type '+q); await page.waitForTimeout(450);
  await dlg(page).locator('.food-name',{hasText:name}).first().click(); A('tap '+name); await page.waitForTimeout(400);
  if(chip){ await page.locator('.qty-chip',{hasText:chip}).first().click(); A('tap '+chip); }
  await page.locator('[data-testid=portion-picker] button[type=submit]').click(); A('Add'); await page.waitForTimeout(400);
};
await page.locator('[data-testid=slot-lunch] .btn-add').click(); A('Add on Lunch'); await page.waitForTimeout(500);
await addFood('salan','Chicken salan (home-made)');
await addFood('roti','Roti / chapati (home, no ghee)');
await dlg(page).getByRole('button',{name:'Done'}).click(); A('Done'); await page.waitForTimeout(400);
await shot(page,'50-lunch-logged');
// save as meal
await page.locator('[data-testid=slot-lunch] button[aria-label*="ore"], [data-testid=slot-lunch] button:has-text("⋯"), [data-testid=slot-lunch] .btn-more').first().click().catch(e=>console.log('more menu fail'));
A('lunch ... menu'); await page.waitForTimeout(400);
await shot(page,'51-lunch-more-menu');
console.log((await txt(page)).slice(0,1500));
console.log('dialogs',await page.locator('dialog[open]').count());
await S.browser.close();
