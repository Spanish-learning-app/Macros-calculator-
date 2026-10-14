import { open, shot, txt, onboard, openAdd, search } from './common.mjs';
const { browser, page } = await open();
await onboard(page);
await openAdd(page);
await search(page,'chicken salan');
await shot(page,'10-search-chicken-salan');
await page.getByText('Chicken salan (home-made)').first().click();
await page.waitForTimeout(500);
await shot(page,'11-salan-portion-picker');
console.log((await txt(page)).split('Chicken salan (home-made)').pop());
// katori size choices?
console.log(await page.evaluate(()=>[...document.querySelectorAll('[role=radio],[role=tab],button')].map(e=>e.innerText.replace(/\n/g,' / ')+' '+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height)).filter(s=>s.trim().length>2).join('\n')));
await browser.close();
