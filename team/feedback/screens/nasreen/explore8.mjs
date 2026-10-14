import { open, shot, txt, onboard, openAdd, search } from './common.mjs';
const { browser, page } = await open();
await onboard(page);
await openAdd(page);
for (const q of ['chaye','saalan','anday','roti','chicken salan','aadhi roti','daal']) {
  await search(page,q);
  const t = await txt(page);
  console.log('=== '+q+'\n'+t.split('Halal only').pop().split('Can’t find')[0].replace(/\n+/g,' | ').slice(0,700));
  await shot(page,'x-q-'+q.replace(/ /g,'_'));
}
await browser.close();
