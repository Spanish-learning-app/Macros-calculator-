import { open, shot, txt, onboard, tab, pakistaniTimes, dlg } from './lib3.mjs';
const S = await open('2026-10-15T13:30:00+02:00'); const {page}=S;
await onboard(page); await pakistaniTimes(page);
await tab(page,'Prep');
const lib = page.locator('[data-testid=library-row]');
console.log('rows', await lib.count());
const chk = page.locator('[data-testid=library-row]:has-text("Check")').first();
await chk.scrollIntoViewIfNeeded(); await shot(page,'64-library-check-chip');
// filter chips
await page.locator('[data-testid=library-filter]').first().scrollIntoViewIfNeeded().catch(()=>{});
await shot(page,'65-library-filter');
// tap Cook on a library recipe
await page.locator('[data-testid=library-row]').first().locator('[data-testid=library-cook]').click(); await page.waitForTimeout(500);
await shot(page,'66-library-make-dialog');
console.log(await dlg(page).innerText());
await dlg(page).locator('button[aria-label*=lose], .dialog-close').first().click().catch(()=>page.keyboard.press('Escape'));
await page.locator('[data-testid=library-row]:has-text("Chicken tikka rice bowl") [data-testid=library-cook]').click(); await page.waitForTimeout(500);
await shot(page,'67-library-cook-dialog');
console.log('=====\n'+await dlg(page).innerText());
await S.browser.close();
