import { open, shot, fullshot, txt, onboard, tab } from './lib2.mjs';
const S = await open('2026-10-15T08:30:00+02:00'); const {page}=S;
await onboard(page); await tab(page,'Prep');
await page.getByRole('button',{name:/New recipe/}).click(); await page.waitForTimeout(500);
await shot(page,'09-new-recipe'); await fullshot(page,'09-new-recipe-full');
console.log(await txt(page));
await S.browser.close();
