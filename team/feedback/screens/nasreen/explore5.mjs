import { open, shot, fullshot, txt, onboard } from './common.mjs';
const { browser, page } = await open();
await onboard(page);
await shot(page, '06-day-empty');
await fullshot(page, '06-day-empty-full');
console.log(await txt(page));
console.log(await page.evaluate(() => [...document.querySelectorAll('button,a,input')].map(e=>e.tagName+':'+(e.innerText||e.placeholder||e.getAttribute('aria-label')||'').slice(0,50).replace(/\n/g,' ')+':'+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height)).join('\n')));
await browser.close();
