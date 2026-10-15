import { open, shot, fullshot, txt, onboard, tab } from './lib2.mjs';
import { makeSalan } from './sc1b.mjs';
const S = await open('2026-10-15T13:30:00+02:00'); const {page}=S;
await onboard(page); await makeSalan(page);
await page.locator('[data-testid=recipe-cook]').click(); await page.waitForTimeout(600);
await shot(page,'21-cook-dialog');
console.log(await page.locator('dialog[open]').last().innerText());
await S.browser.close();
