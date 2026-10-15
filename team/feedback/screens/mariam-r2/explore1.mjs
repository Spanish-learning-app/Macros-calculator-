import { start } from './lib.mjs';
const S = await start();
const { page } = S;
await S.open('2026-10-18T17:30:00+02:00');
await S.shot('x0-welcome');
console.log(await page.evaluate(() => document.body.innerText.slice(0, 600)));
console.log(await page.evaluate(() => [...document.querySelectorAll('button')].map(b => b.innerText.trim()).join(' | ')));
await S.finish('explore1');
