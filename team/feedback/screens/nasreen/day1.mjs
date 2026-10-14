import { open, shot, fullshot, txt, onboard, openAdd, search, pick, confirm } from './common.mjs';
const S = await open('2026-10-14T08:30:00+02:00');
const { page } = S;
const t0 = Date.now();
await onboard(page);
console.log('onboarding ms', Date.now()-t0);
await openAdd(page);
await pick(page,'chai','Chai, doodh patti (home), 1 tsp sugar'); await confirm(page);
console.log('first chai logged at ms', Date.now()-t0);
await pick(page,'roti','Roti / chapati (home, no ghee)');
await page.locator('button:has-text("½")').first().click(); await confirm(page);
await pick(page,'roti','Roti / chapati (home, no ghee)');
await page.locator('button:has-text("1½")').first().click(); await shot(page,'15-roti-1half-picker'); await confirm(page);
// daal
await pick(page,'daal','Masoor daal (home-made)');
await shot(page,'16-daal-picker');
console.log((await txt(page)).split('Masoor daal (home-made)').pop().slice(0,500));
await confirm(page);
// chicken salan
await pick(page,'chicken salan','Chicken salan (home-made)');
await confirm(page);
await shot(page,'17-after-salan');
// Done
await page.getByRole('button',{name:'Done'}).click(); await page.waitForTimeout(500);
await shot(page,'18-day-after-logging');
await fullshot(page,'18-day-after-logging-full');
console.log((await txt(page)).slice(0,1500));
await S.browser.close();
