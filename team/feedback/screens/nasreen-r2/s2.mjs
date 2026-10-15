import { open, shot, fullshot, txt, onboard } from './lib.mjs';
const S = await open('2026-10-15T08:30:00+02:00'); const {page}=S;
await onboard(page);
await page.getByRole('link',{name:'Prep'}).click().catch(async()=>{await page.getByText('Prep',{exact:true}).click()}); await page.waitForTimeout(500);
await shot(page,'08-prep-first-look'); await fullshot(page,'08-prep-first-look-full');
console.log(await txt(page));
await S.browser.close();
