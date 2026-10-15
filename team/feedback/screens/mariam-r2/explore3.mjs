import { start } from './lib.mjs';
const S = await start({ stateFrom: 's2-placed' });
const { page, tap, shot, log } = S;
await S.open('2026-10-19T08:10:00+02:00');
await shot('x3-mon-0810');
await shot('x3-mon-0810-full', { fullPage: true });
console.log(await page.evaluate(() => document.querySelector('#app').innerText));
await S.finish('x3');
