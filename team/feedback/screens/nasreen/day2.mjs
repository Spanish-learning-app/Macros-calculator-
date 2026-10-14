import { open, shot, fullshot, txt, onboard, openAdd, search, pick, confirm } from './common.mjs';
const S = await open('2026-10-14T12:30:00+02:00');
let { page } = S;
await onboard(page);
await openAdd(page);
await pick(page,'chicken salan','Chicken salan (home-made)'); await confirm(page);
await page.getByRole('button',{name:'Done'}).click();
await page.close();
// next day
const S2 = await open('2026-10-15T13:00:00+02:00', S);
page = S2.page;
await page.waitForTimeout(500);
await shot(page,'19-next-day-day-view');
console.log((await txt(page)).slice(0,900));
await openAdd(page);
await shot(page,'20-next-day-add-sheet-empty');
console.log('---- add sheet open, no typing\n'+(await txt(page)).split('Halal only').pop());
await S.browser.close();
