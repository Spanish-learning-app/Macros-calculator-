import { open, shot, fullshot, txt } from './lib.mjs';
const { browser, page } = await open();
await page.getByRole('button',{name:'Start'}).click();
await page.waitForTimeout(400);
await shot(page, '02-onboarding-top');
await fullshot(page, '02-onboarding-full');
console.log(await txt(page));
console.log(await page.evaluate(() => [...document.querySelectorAll('button,a,input,select,textarea,label')].map(e=>e.tagName+':'+e.type+':'+(e.innerText||e.placeholder||e.name||e.getAttribute('aria-label')||'').slice(0,50).replace(/\n/g,' ')+':'+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height)).join('\n')));
await browser.close();
