import { open, shot, txt, onboard, openAdd, search, pick } from './common.mjs';
const S = await open('2026-10-14T13:00:00+02:00');
const { page } = S;
await onboard(page); await openAdd(page);
await pick(page,'chicken salan','Chicken salan (home-made)');
await page.getByText('Source and details').click(); await page.waitForTimeout(500);
await shot(page,'36-source-details');
console.log((await txt(page)).split('Source and details').slice(-2).join('###').slice(0,1500));
await S.browser.close();
