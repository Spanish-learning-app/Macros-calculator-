import { open, shot, fullshot, txt, onboard, openAdd, search } from './common.mjs';
// A1 requests to other origins + profile roundtrip
const S = await open('2026-10-14T20:00:00+02:00');
const { page, ctx } = S;
const reqs = [];
ctx.on('request', r => { if (!r.url().startsWith('http://localhost:8772')) reqs.push(r.url()); });
await page.reload(); await page.waitForTimeout(500);
await onboard(page);
await page.goto('http://localhost:8772/#/profile'); await page.waitForTimeout(500);
console.log('profile values', await page.evaluate(()=>[...document.querySelectorAll('input')].filter(i=>i.type==='text'||i.type==='number').map(i=>i.value)));
await page.goto('http://localhost:8772/#/day'); await page.waitForTimeout(400);
console.log('external requests', reqs);
// Skip path
const S2 = await open('2026-10-14T20:00:00+02:00');
await S2.page.getByRole('button',{name:'Skip for now'}).click(); await S2.page.waitForTimeout(500);
await shot(S2.page,'30-skip-path');
console.log('SKIP:\n'+(await txt(S2.page)).slice(0,400));
await S.browser.close();
