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
await page.getByText('Save Lunch as a meal…').click(); A('Save Lunch as a meal'); await page.waitForTimeout(500);
await shot(page,'52-save-meal-dialog');
console.log('====\n'+await dlg(page).innerText());


await dlg(page).locator('input').fill('Salan roti'); A('rename Salan roti');
await dlg(page).getByRole('button',{name:'Save meal'}).click(); A('Save meal'); await page.waitForTimeout(500);
await shot(page,'53-after-save-meal');
console.log('---after save\n'+(await txt(page)).slice(0,300));
// tomorrow
await page.getByRole('button',{name:/next|tomorrow|›|>/i}).first().click().catch(async()=>{ await page.locator('header button, .day-nav button').last().click(); });
A('next day arrow'); await page.waitForTimeout(500);
await shot(page,'54-tomorrow');
console.log('---tomorrow\n'+(await txt(page)).slice(0,400));
await page.locator('[data-testid=slot-lunch] .btn-add').click(); A('Add on Lunch'); await page.waitForTimeout(500);
await shot(page,'55-tomorrow-add-sheet');
console.log('---sheet\n'+(await dlg(page).innerText()).slice(0,700));

await dlg(page).locator('button[aria-label^=Add], .btn-add').first().click(); A('tap + Salan roti'); await page.waitForTimeout(500);
await shot(page,'56-tomorrow-saved-meal-added');
console.log('---\n'+(await dlg(page).innerText()).slice(0,400));
await dlg(page).getByRole('button',{name:'Done'}).click(); A('Done'); await page.waitForTimeout(500);
await shot(page,'57-tomorrow-day');
console.log((await txt(page)).slice(0,1100));
await S.browser.close();
