import { open, shot, fullshot, txt, onboard, openAdd, search, pick, confirm } from './common.mjs';
const S = await open('2026-10-14T21:00:00+02:00');
const { page } = S;
await onboard(page);
await openAdd(page);
await pick(page,'biryani','Chicken biryani (restaurant)');
console.log((await txt(page)).split('Chicken biryani (restaurant)').pop().slice(0,400));
await page.locator('button:has-text("2")').filter({hasText:/^2$/}).first().click(); await confirm(page);
await pick(page,'biryani','Chicken biryani (restaurant)'); await page.locator('button:has-text("2")').filter({hasText:/^2$/}).first().click(); await confirm(page);
await pick(page,'gulab jamun','Gulab jamun'); await page.locator('button:has-text("2")').filter({hasText:/^2$/}).first().click(); await confirm(page);
await pick(page,'gulab jamun','Gulab jamun'); await page.locator('button:has-text("2")').filter({hasText:/^2$/}).first().click(); await confirm(page);
await pick(page,'naan','Naan (plain, tandoor)'); await page.locator('button:has-text("2")').filter({hasText:/^2$/}).first().click(); await confirm(page);
await pick(page,'karahi','Chicken karahi'); await page.locator('button:has-text("2")').filter({hasText:/^2$/}).first().click(); await confirm(page);
await page.getByRole('button',{name:'Done'}).click(); await page.waitForTimeout(500);
await shot(page,'25-shaadi-day-top');
await fullshot(page,'25-shaadi-day-full');
console.log((await txt(page)).slice(0,500));
// colours of progress bar & big number
console.log(await page.evaluate(()=>{const out=[];document.querySelectorAll('*').forEach(e=>{const c=getComputedStyle(e);const t=e.children.length===0&&e.textContent.trim();if(t&&/left|over|kcal/i.test(t)&&t.length<40)out.push(t+' | '+c.color+' | '+c.fontSize)});return out.slice(0,12)}));
// next day fresh?
await page.getByRole('button',{name:'Next day'}).click(); await page.waitForTimeout(400);
await shot(page,'26-shaadi-next-day');
console.log((await txt(page)).slice(0,300));
await S.browser.close();
