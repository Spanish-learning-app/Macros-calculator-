import { open, shot, txt, onboard, tab, pakistaniTimes, dlg } from './lib3.mjs';
import { makeSalan } from './sc1b.mjs';
const S = await open('2026-10-15T13:30:00+02:00'); const {page}=S;
await onboard(page); await pakistaniTimes(page); await makeSalan(page);
await page.locator('[data-testid=recipe-cook]').click(); await page.waitForTimeout(500);
await page.locator('[data-testid=cook-save]').click(); await page.waitForTimeout(700);
const sw=async(l)=>console.log(l, await page.evaluate(()=>[document.documentElement.scrollWidth, window.innerWidth]));
await sw('prep'); await tab(page,'Day'); await sw('day'); await tab(page,'Week'); await sw('week'); await shot(page,'95-week-with-pot'); await tab(page,'Profile'); await sw('profile'); await tab(page,'Data'); await sw('data');
// reopen recipe editor
await tab(page,'Prep');
await page.locator('[data-testid=recipe-row] .prep-main').click(); await page.waitForTimeout(500);
await shot(page,'96-recipe-reopened'); console.log((await dlg(page).innerText()).slice(0,300));
await S.browser.close();
