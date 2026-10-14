import { open, shot, fullshot, txt, onboard, openAdd, search, pick, confirm } from './common.mjs';
const S = await open('2026-10-14T12:30:00+02:00');
const { page } = S;
await onboard(page);
await openAdd(page);
for (const q of ['tasting','taste','chamach','bacha hua','leftover','thora sa','aloo','small','biryani','dairh roti','kal wala']) {
  await search(page,q);
  console.log('=== '+q+' :: '+(await txt(page)).split('Halal only').pop().split('Can’t find')[0].replace(/\n+/g,' | ').slice(0,300));
}
await search(page,'tasting'); await shot(page,'23-search-tasting');
// quick add
await search(page,'');
await page.getByText('Quick add').click(); await page.waitForTimeout(400);
await shot(page,'24-quick-add');
console.log('QUICK ADD:\n'+(await txt(page)).split('Halal only').pop());
// halal only toggle explanation / 'Source and details' of salan
await S.browser.close();
