import { open, shot, fullshot, txt, onboard, tab, pakistaniTimes, dlg } from './lib3.mjs';
const S = await open('2026-10-15T20:30:00+02:00'); const {page}=S;
await onboard(page); await pakistaniTimes(page);
await page.locator('[data-testid=slot-dinner] .btn-add').click(); await page.waitForTimeout(400);
await page.keyboard.type('chawal'); await page.waitForTimeout(450);
await dlg(page).locator('.food-name',{hasText:'Rice, plain boiled'}).first().click(); await page.waitForTimeout(400);
await shot(page,'94-rice-picker');
console.log((await dlg(page).innerText()).slice(0,400));
await S.browser.close();
