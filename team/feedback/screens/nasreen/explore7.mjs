import { open, shot, fullshot, txt, onboard } from './common.mjs';
const { browser, page } = await open();
await onboard(page);
await page.locator('button:has-text("Add")').filter({hasText:/^\s*\+?\s*Add\s*$/}).first().click();
await page.locator('input[type=search],input[type=text]').first().fill('chai');
await page.waitForTimeout(400);
console.log(await page.evaluate(()=>{const n=[...document.querySelectorAll('*')].filter(e=>e.children.length===0 && e.textContent.trim()==='null'); return n.map(e=>e.outerHTML+' <- '+e.parentElement.outerHTML.slice(0,300));}));
// tap the row text
await page.getByText('Chai, doodh patti (home), 1 tsp sugar').first().click();
await page.waitForTimeout(500);
await shot(page, '09-after-tap-chai-row');
console.log(await txt(page).then(t=>t.split('Add to Nashta').pop()));
await browser.close();
