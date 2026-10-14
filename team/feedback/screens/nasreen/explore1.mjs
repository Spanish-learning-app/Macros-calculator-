import { open, shot, fullshot, txt } from './lib.mjs';
const { browser, page } = await open();
await shot(page, '01-first-open');
console.log(await txt(page));
console.log(await page.evaluate(() => [...document.querySelectorAll('button,a,input,select')].map(e=>e.tagName+':'+(e.innerText||e.placeholder||e.name||e.getAttribute('aria-label'))+':'+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height)).join('\n')));
await browser.close();
